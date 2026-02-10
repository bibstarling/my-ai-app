/**
 * POST /api/job-profile/parse-resume
 * Parse resume text to extract skills, experience, and profile data
 */

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import Anthropic from '@anthropic-ai/sdk';

export const dynamic = 'force-dynamic';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * Parse resume using Claude
 */
export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const { resume_text } = await req.json();
    
    if (!resume_text || typeof resume_text !== 'string') {
      return NextResponse.json(
        { error: 'resume_text is required' },
        { status: 400 }
      );
    }
    
    const prompt = `You are a resume parser. Extract structured information from the following resume.

Resume:
${resume_text.slice(0, 8000)}

Extract the following information in JSON format:
{
  "skills": ["skill1", "skill2", ...],  // Technical skills, tools, technologies
  "target_titles": ["title1", "title2"],  // Job titles the person is qualified for
  "seniority": "Junior|Mid|Senior|Executive",  // Based on experience
  "years_of_experience": number,
  "languages": ["en", "pt-BR", "es"],  // Languages mentioned
  "summary": "Brief summary of background and expertise"
}

Return ONLY the JSON, no other text.`;
    
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });
    
    const content = message.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }
    
    // Parse JSON response
    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse resume - invalid JSON response');
    }
    
    const parsed = JSON.parse(jsonMatch[0]);
    
    // Validate and clean up
    const result = {
      skills: Array.isArray(parsed.skills) ? parsed.skills.slice(0, 30) : [],
      target_titles: Array.isArray(parsed.target_titles) ? parsed.target_titles.slice(0, 5) : [],
      seniority: ['Junior', 'Mid', 'Senior', 'Executive'].includes(parsed.seniority) ? parsed.seniority : 'Mid',
      years_of_experience: typeof parsed.years_of_experience === 'number' ? parsed.years_of_experience : 0,
      languages: Array.isArray(parsed.languages) ? parsed.languages : ['en'],
      summary: typeof parsed.summary === 'string' ? parsed.summary : '',
    };
    
    return NextResponse.json({
      success: true,
      parsed: result,
    });
    
  } catch (err) {
    console.error('[Parse Resume API] Error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to parse resume' },
      { status: 500 }
    );
  }
}
