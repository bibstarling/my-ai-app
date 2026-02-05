import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';
import { getPortfolioData } from '@/lib/portfolio-data';

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
    const portfolio = getPortfolioData();

    // Generate tailored resume with AI
    const prompt = `You are an expert resume writer. Create a tailored resume for this job application.

JOB INFORMATION:
Title: ${jobTitle}
Company: ${company}
Description: ${jobDescription}

CANDIDATE PORTFOLIO:
${JSON.stringify(portfolio, null, 2)}

Generate a tailored resume that:
1. Emphasizes relevant experience and skills from the portfolio
2. Uses keywords from the job description
3. Structures content to match what this role requires
4. Maintains authenticity while optimizing for ATS

Return ONLY valid JSON in this exact format:
{
  "sections": [
    {
      "type": "summary",
      "content": "Professional summary tailored to this role"
    },
    {
      "type": "experience",
      "items": [
        {
          "title": "Job Title",
          "company": "Company Name",
          "period": "Start - End",
          "description": "Achievements relevant to target role",
          "highlights": ["Achievement 1", "Achievement 2"]
        }
      ]
    },
    {
      "type": "skills",
      "items": ["Skill 1", "Skill 2", "Skill 3"]
    },
    {
      "type": "education",
      "items": [
        {
          "degree": "Degree Name",
          "institution": "School Name",
          "year": "Year"
        }
      ]
    }
  ]
}`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }],
    });

    const textContent = message.content.find((c) => c.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text response from AI');
    }

    // Parse AI response
    const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid JSON response from AI');
    }

    const resumeData = JSON.parse(jsonMatch[0]);

    // Save resume to database
    const { data: resume, error: insertError } = await supabase
      .from('resumes')
      .insert({
        user_id: user.id,
        title: `${jobTitle} at ${company}`,
        sections: resumeData.sections,
      })
      .select()
      .single();

    if (insertError) throw insertError;

    return NextResponse.json({
      success: true,
      resumeId: resume.id,
      resume: resume,
    });
  } catch (error) {
    console.error('Error generating tailored resume:', error);
    return NextResponse.json(
      { error: 'Failed to generate tailored resume' },
      { status: 500 }
    );
  }
}
