import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { generateAICompletion } from '@/lib/ai-provider';
import { createClient } from '@supabase/supabase-js';
import { portfolioData } from '@/lib/portfolio-data';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type RouteContext = {
  params: Promise<{ jobId: string; questionId: string }>;
};

/**
 * POST /api/jobs/[jobId]/questions/[questionId]/generate-answer - Generate AI answer
 */
export async function POST(request: Request, context: RouteContext) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const { jobId, questionId } = await context.params;

    // Fetch the job details
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

    // Fetch the question
    const { data: question, error: questionError } = await supabase
      .from('application_questions')
      .select('*')
      .eq('id', questionId)
      .eq('tracked_job_id', jobId)
      .eq('clerk_id', userId)
      .single();

    if (questionError || !question) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      );
    }

    // Get user's portfolio data
    const { data: userPortfolio } = await supabase
      .from('user_portfolios')
      .select('portfolio_data, markdown')
      .eq('clerk_id', userId)
      .maybeSingle();

    const { data: userInfo } = await supabase
      .from('users')
      .select('is_super_admin')
      .eq('clerk_id', userId)
      .maybeSingle();

    // Use user's portfolio or fallback to main portfolio for super admin
    let portfolio = userPortfolio?.portfolio_data || portfolioData;
    let portfolioMarkdown = userPortfolio?.markdown || '';

    if (userInfo?.is_super_admin && !userPortfolio) {
      portfolio = portfolioData;
    }

    if (!userPortfolio && !userInfo?.is_super_admin) {
      return NextResponse.json(
        { error: 'Please create your portfolio first before generating answers' },
        { status: 400 }
      );
    }

    // Generate answer using Claude
    const prompt = `You are answering an application question for a job application. Generate a compelling, authentic answer that showcases the candidate's relevant experience.

🚨 CRITICAL REQUIREMENT - NO PLACEHOLDERS ALLOWED:
- NEVER use placeholders like [Company Name], [Specific Example], [Metric], [Achievement], etc.
- ALWAYS use actual data from the candidate's portfolio provided below
- Extract real experiences, projects, and achievements from the candidate's actual data
- The answer must be 100% ready to submit without any edits or replacements needed
- Every detail must be filled in with real information from the provided data
- If specific information is missing for the question, write around it naturally - don't leave brackets or placeholders

JOB INFORMATION:
Title: ${job.title}
Company: ${job.company}
Description: ${job.description}

APPLICATION QUESTION:
${question.question_text}

CANDIDATE PROFILE:
${portfolioMarkdown || JSON.stringify(portfolio, null, 2)}

Generate a concise, compelling answer (2-3 paragraphs, approximately 150-250 words) that:
1. Directly addresses the specific question being asked
2. Uses ACTUAL concrete examples from the candidate's portfolio with real metrics and outcomes
3. Demonstrates relevant skills and achievements that align with the job requirements using REAL data
4. Shows enthusiasm and understanding of the role
5. Uses a professional but authentic, conversational tone
6. Quantifies achievements when possible using ACTUAL metrics from portfolio (not made up)
7. Connects past experiences to how you would add value in this specific role at ${job.company}

Guidelines:
- Be specific and concrete using REAL examples from the portfolio, not generic statements
- Start with a direct answer to the question
- Follow with 1-2 relevant ACTUAL examples from the candidate's experience in their portfolio
- End by connecting it to the role at ${job.company}
- Avoid clichés and buzzwords
- Write in first person
- Keep it concise but substantive
- NO placeholders - use real data only

Return ONLY the answer text, no additional commentary or formatting.

🚨 REMINDER: The answer must be 100% ready to submit. Extract real experiences and achievements from the portfolio. No [brackets], no placeholders, no generic examples. Use actual data only.`;

    const response = await generateAICompletion(
      userId,
      'job_answer_question',
      'You are helping craft job application answers.',
      [{ role: 'user', content: prompt }],
      1000
    );

    const generatedAnswer = response.content.trim();

    // Update the question with the generated answer
    const { data: updatedQuestion, error: updateError } = await supabase
      .from('application_questions')
      .update({
        answer_text: generatedAnswer,
        is_ai_generated: true,
      })
      .eq('id', questionId)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({
      success: true,
      question: updatedQuestion,
      answer: generatedAnswer,
    });
  } catch (error) {
    console.error('Error generating answer:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error 
          ? error.message 
          : 'Failed to generate answer' 
      },
      { status: 500 }
    );
  }
}
