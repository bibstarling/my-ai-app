import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { generateAICompletion } from '@/lib/ai-provider';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type RouteContext = {
  params: Promise<{ jobId: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const { jobId } = await context.params;
    const body = await request.json();
    const { url } = body;

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    // Verify user owns this job
    const { data: job, error: jobError } = await supabase
      .from('tracked_jobs')
      .select('*')
      .eq('id', jobId)
      .eq('clerk_id', userId)
      .single();

    if (jobError || !job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    // Fetch the webpage content
    let htmlContent: string;
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch page: ${response.status}`);
      }
      
      htmlContent = await response.text();
    } catch (error) {
      console.error('Error fetching URL:', error);
      return NextResponse.json(
        { error: 'Failed to fetch job posting. The page may be protected or unavailable.' },
        { status: 500 }
      );
    }

    // Use Claude to extract application questions from HTML
    const prompt = `You are analyzing a job posting to identify application-specific questions that require written responses.

HTML CONTENT:
${htmlContent.slice(0, 50000)}

Identify any questions or prompts that appear in the application flow, such as:
- Screening questions (e.g., "Why are you interested in this role?")
- Experience questions (e.g., "Describe your experience with X")
- Scenario questions (e.g., "How would you handle Y situation?")
- Motivation questions (e.g., "What attracts you to our company?")
- Culture fit questions
- Any text fields asking for written responses beyond basic info

Return ONLY a JSON array of questions:
[
  "Question text 1",
  "Question text 2",
  "Question text 3"
]

Rules:
- Only include questions requiring thoughtful written answers (not yes/no or dropdowns)
- Extract exact question text as it appears
- If no questions are found, return an empty array: []
- Return ONLY the JSON array, no other text
- Exclude basic information fields (name, email, phone, resume upload, etc.)`;

    const response = await generateAICompletion(
      userId,
      'job_extract_questions',
      'You are a job application form analyzer.',
      [{ role: 'user', content: prompt }],
      2000
    );

    // Parse AI response
    const jsonMatch = response.content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return NextResponse.json({
        success: true,
        questions: [],
        message: 'No application questions found in the job posting',
      });
    }

    const questionTexts = JSON.parse(jsonMatch[0]) as string[];

    if (questionTexts.length === 0) {
      return NextResponse.json({
        success: true,
        questions: [],
        message: 'No application questions found in the job posting',
      });
    }

    // Get the next order_index
    const { data: existingQuestions } = await supabase
      .from('application_questions')
      .select('order_index')
      .eq('tracked_job_id', jobId)
      .order('order_index', { ascending: false })
      .limit(1);

    const startOrderIndex = existingQuestions && existingQuestions.length > 0
      ? existingQuestions[0].order_index + 1
      : 0;

    // Create question records in database
    const questionsToInsert = questionTexts.map((questionText, index) => ({
      tracked_job_id: jobId,
      clerk_id: userId,
      question_text: questionText,
      order_index: startOrderIndex + index,
    }));

    const { data: createdQuestions, error: insertError } = await supabase
      .from('application_questions')
      .insert(questionsToInsert)
      .select();

    if (insertError) {
      throw insertError;
    }

    return NextResponse.json({
      success: true,
      questions: createdQuestions,
      message: `Found and added ${createdQuestions.length} application question(s)`,
    });
  } catch (error) {
    console.error('Error extracting questions:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error 
          ? error.message 
          : 'Failed to extract questions' 
      },
      { status: 500 }
    );
  }
}
