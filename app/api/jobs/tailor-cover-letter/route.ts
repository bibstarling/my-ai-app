import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { generateAICompletion } from '@/lib/ai-provider';
import { createClient } from '@supabase/supabase-js';
import { portfolioData, getPMPositioning } from '@/lib/portfolio-data';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    const { jobDescription, jobTitle, company } = body;

    if (!jobDescription || !jobTitle || !company) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get portfolio data
    const portfolio = portfolioData;
    const positioning = getPMPositioning();

    // Generate tailored cover letter optimized for ATS and recruiters
    const prompt = `You are an expert cover letter writer who understands both ATS systems and recruiter psychology. Create a cover letter that passes ATS screening while engaging human readers.

JOB INFORMATION:
Title: ${jobTitle}
Company: ${company}
Description: ${jobDescription}

CANDIDATE INFORMATION:
${positioning}

Portfolio Details:
${JSON.stringify(portfolio, null, 2)}

CRITICAL ATS + RECRUITER OPTIMIZATION:

1. ATS KEYWORD STRATEGY:
   - Include job title (${jobTitle}) within first paragraph
   - Incorporate 8-12 important keywords from job description naturally
   - Use exact phrases from job posting (not paraphrased)
   - Mirror technical terminology from job description
   - Include company name (${company}) multiple times
   - Reference specific skills/tools mentioned in posting

2. STRUCTURE FOR ATS PARSING:
   - Clear introduction stating position applying for
   - Body paragraphs with specific, keyword-rich examples
   - Quantifiable achievements with metrics
   - Explicit connection to requirements
   - Professional closing

3. RECRUITER ENGAGEMENT:
   - Strong opening hook (show you researched company/role)
   - Highlight 2-3 most impressive, relevant achievements
   - Tell a story, not just list qualifications
   - Show enthusiasm and cultural alignment
   - Demonstrate understanding of company challenges
   - Clear value proposition (what you'll bring)

4. KEYWORD INTEGRATION (Natural Flow):
   - Don't just list keywords - weave into compelling narratives
   - Example: "My experience leading semantic search implementations..."
   - Use keywords in context of achievements
   - Vary keyword usage (don't repeat robotically)

5. AUTHENTICITY FOR HUMANS:
   - Sound genuinely human (use "I'm" not "I am", natural contractions)
   - Vary sentence structure and length
   - Show personality while staying professional
   - Avoid AI clichés ("I am writing to express my interest")
   - Use confident, direct language

6. CONTENT STRATEGY:
   - Paragraph 1: Hook + position + top qualification match
   - Paragraph 2: Relevant achievement #1 with keywords + impact
   - Paragraph 3: Relevant achievement #2 with keywords + connection to company
   - Paragraph 4: Why this company/role + call to action

7. LENGTH & TONE:
   - 3-4 concise paragraphs
   - Professional yet conversational
   - Confident without arrogance
   - Specific, not generic

CRITICAL: Write in first person as if you ARE the candidate. Use their authentic PM voice and style while strategically incorporating ATS keywords.

Return the complete cover letter text (no JSON, just the letter).`;

    const response = await generateAICompletion(
      userId,
      'job_tailor_cover_letter',
      'You are an expert cover letter writer.',
      [{ role: 'user', content: prompt }],
      2000
    );

    const coverLetterText = response.content.trim();
    
    // Split cover letter into paragraphs
    const paragraphs = coverLetterText.split('\n\n').filter(p => p.trim());
    const opening = paragraphs[0] || '';
    const bodyParagraphs = paragraphs.slice(1, -1);
    const closing = paragraphs[paragraphs.length - 1] || '';

    // Save cover letter to database
    const { data: coverLetter, error: insertError } = await supabase
      .from('cover_letters')
      .insert({
        clerk_id: userId,
        job_title: jobTitle,
        job_company: company,
        job_description: jobDescription,
        opening_paragraph: opening,
        body_paragraphs: bodyParagraphs.length > 0 ? bodyParagraphs : [coverLetterText],
        closing_paragraph: closing || opening,
        status: 'draft',
      })
      .select()
      .single();

    if (insertError) throw insertError;

    return NextResponse.json({
      success: true,
      coverLetterId: coverLetter.id,
      coverLetter: coverLetter,
    });
  } catch (error) {
    console.error('Error generating tailored cover letter:', error);
    return NextResponse.json(
      { error: 'Failed to generate tailored cover letter' },
      { status: 500 }
    );
  }
}
