import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';
import { portfolioData, getPMPositioning } from '@/lib/portfolio-data';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    
    const body = await request.json();
    const { jobDescription, jobTitle, company } = body;

    if (!jobDescription || !jobTitle || !company) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get user from database
    const { data: user } = await supabase
      .from('users')
      .select('id, email')
      .eq('clerk_id', userId || '')
      .single();

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get portfolio data
    const portfolio = portfolioData;
    const positioning = getPMPositioning();

    // Generate tailored cover letter with AI
    const prompt = `You are an expert cover letter writer. Create a personalized cover letter for this job application.

JOB INFORMATION:
Title: ${jobTitle}
Company: ${company}
Description: ${jobDescription}

CANDIDATE INFORMATION:
${positioning}

Portfolio Details:
${JSON.stringify(portfolio, null, 2)}

Write a compelling cover letter that:
1. Opens with a strong hook that connects to the company's mission
2. Highlights 2-3 most relevant experiences that match the job requirements
3. Demonstrates understanding of the role and company
4. Shows authentic enthusiasm and cultural fit
5. Closes with a clear call to action
6. Sounds genuinely human (use "I'm" not "I am", vary sentence structure, avoid AI patterns)
7. Is concise (3-4 paragraphs max)

CRITICAL: Write in first person as if you ARE the candidate. Use their authentic voice and PM style.

Return the complete cover letter text.`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    });

    const textContent = message.content.find((c) => c.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text response from AI');
    }

    const coverLetterText = textContent.text.trim();

    // Save cover letter to database
    const { data: coverLetter, error: insertError } = await supabase
      .from('cover_letters')
      .insert({
        user_id: user.id,
        job_title: jobTitle,
        company: company,
        content: coverLetterText,
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
