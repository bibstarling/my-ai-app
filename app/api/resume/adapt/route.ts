import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getSupabaseServiceRole } from '@/lib/supabase-server';
import { generateAICompletion } from '@/lib/ai-provider';
import type { AdaptResumeRequest, AdaptResumeResponse, ResumeSection, ResumeAdaptation } from '@/lib/types/resume';

/**
 * POST /api/resume/adapt - Adapt a resume to a specific job posting using AI
 */
export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: AdaptResumeRequest = await req.json();
    
    if (!body.resume_id || !body.job_id) {
      return NextResponse.json(
        { error: 'resume_id and job_id are required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServiceRole();

    // Get resume with sections
    const { data: resume, error: resumeError } = await supabase
      .from('resumes')
      .select('*')
      .eq('id', body.resume_id)
      .eq('clerk_id', userId)
      .single();

    if (resumeError || !resume) {
      return NextResponse.json({ error: 'Resume not found' }, { status: 404 });
    }

    const { data: sections, error: sectionsError } = await supabase
      .from('resume_sections')
      .select('*')
      .eq('resume_id', body.resume_id)
      .order('sort_order', { ascending: true });

    if (sectionsError) {
      return NextResponse.json({ error: 'Failed to fetch resume sections' }, { status: 500 });
    }

    // Get job details
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', body.job_id)
      .single();

    if (jobError || !job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Check if adaptation already exists
    const { data: existingAdaptation } = await supabase
      .from('resume_adaptations')
      .select('*')
      .eq('resume_id', body.resume_id)
      .eq('job_id', body.job_id)
      .eq('clerk_id', userId)
      .single();

    if (existingAdaptation) {
      return NextResponse.json({
        adaptation: existingAdaptation as ResumeAdaptation,
        success: true,
        message: 'Adaptation already exists',
      } as AdaptResumeResponse);
    }

    // Get user's portfolio for additional context
    const { data: userPortfolio } = await supabase
      .from('user_portfolios')
      .select('portfolio_data, markdown')
      .eq('clerk_id', userId)
      .maybeSingle();

    // Call AI to adapt the resume
    const aiResult = await adaptResumeWithAI(resume, sections || [], job, userId, userPortfolio);

    // Save adaptation
    const { data: adaptation, error: adaptError } = await supabase
      .from('resume_adaptations')
      .insert({
        resume_id: body.resume_id,
        job_id: body.job_id,
        clerk_id: userId,
        job_title: job.title,
        job_company: job.company_name,
        job_description: job.description_text?.slice(0, 5000) || null,
        adapted_sections: aiResult.adaptedSections,
        match_score: aiResult.matchScore,
        suggested_keywords: aiResult.suggestedKeywords,
        gaps: aiResult.gaps,
        strengths: aiResult.strengths,
        ai_recommendations: aiResult.recommendations,
      })
      .select()
      .single();

    if (adaptError) {
      console.error('Error saving adaptation:', adaptError);
      return NextResponse.json({ error: 'Failed to save adaptation' }, { status: 500 });
    }

    return NextResponse.json({
      adaptation: adaptation as ResumeAdaptation,
      success: true,
      message: 'Resume adapted successfully',
    } as AdaptResumeResponse);
  } catch (error) {
    console.error('POST /api/resume/adapt error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

type AIAdaptationResult = {
  adaptedSections: Omit<ResumeSection, 'id' | 'resume_id' | 'created_at' | 'updated_at'>[];
  matchScore: number;
  suggestedKeywords: string[];
  gaps: string[];
  strengths: string[];
  recommendations: string;
};

async function adaptResumeWithAI(
  resume: Record<string, unknown>,
  sections: ResumeSection[],
  job: Record<string, unknown>,
  userId: string,
  userPortfolio?: { portfolio_data?: any; markdown?: string } | null
): Promise<AIAdaptationResult> {

  // Extract awards and other context from portfolio if available
  let candidateContext = '';
  if (userPortfolio?.portfolio_data?.awards && Array.isArray(userPortfolio.portfolio_data.awards) && userPortfolio.portfolio_data.awards.length > 0) {
    candidateContext = '\nCANDIDATE AWARDS & RECOGNITION:\n';
    candidateContext += userPortfolio.portfolio_data.awards
      .map((award: any) => `🏆 ${award.title} (${award.quarter}): ${award.description}`)
      .join('\n');
    candidateContext += '\n';
  }
  
  if (userPortfolio?.portfolio_data?.tagline) {
    candidateContext += `\nPROFESSIONAL TAGLINE: ${userPortfolio.portfolio_data.tagline}\n`;
  }

  const prompt = `You are an expert resume writer and career coach. Analyze the following job posting and resume, then provide an adapted version optimized for this specific job.

🚨 CRITICAL REQUIREMENT - NO PLACEHOLDERS ALLOWED:
- NEVER use placeholders like [Company Name], [Metric], [Achievement], [Skill], etc.
- ALWAYS use actual data from the candidate's resume and portfolio provided below
- The adapted resume must be 100% ready to use without any edits or replacements needed
- Every detail must be filled in with real information from the provided data
- If specific information is missing, write around it naturally - don't leave brackets or placeholders

📌 MANDATORY - PORTFOLIO URL:
- The candidate's portfolio URL is AUTOMATICALLY included in the resume header
- Contact information (name, email, location, LinkedIn, portfolio) is preserved from the original resume
- Portfolio URL is NON-NEGOTIABLE and will ALWAYS be displayed if available
- Focus on adapting the resume sections (summary, experience, skills, education) for this specific job

JOB POSTING:
Title: ${job.title}
Company: ${job.company_name}
Description: ${String(job.description_text || '').slice(0, 3000)}
Required Skills: ${JSON.stringify(job.skills_json || [])}
${candidateContext}
CURRENT RESUME:
Name: ${resume.full_name || 'N/A'}
${sections.map(s => `\n${s.section_type.toUpperCase()}: ${JSON.stringify(s.content, null, 2)}`).join('\n')}

Please provide your response in the following JSON format:
{
  "matchScore": <0-100 integer representing fit>,
  "suggestedKeywords": [<array of keywords from job description to emphasize>],
  "gaps": [<array of skills/experience missing from resume>],
  "strengths": [<array of matching qualifications>],
  "recommendations": "<detailed recommendations for improving the resume>",
  "adaptedSections": [
    {
      "section_type": "<section type>",
      "title": "<optional custom title>",
      "sort_order": <number>,
      "content": {<adapted section content with job-specific keywords and improvements>}
    }
  ]
}

IMPORTANT INSTRUCTIONS:
1. For each section, rewrite bullets/descriptions to emphasize relevant experience using ACTUAL details from the resume
2. Incorporate keywords from the job description naturally without forcing them
3. Quantify achievements where possible using REAL metrics from the resume (never make up numbers)
4. Reorder sections to highlight most relevant experience first
5. In the summary section, tailor it directly to this job posting using ACTUAL achievements from the resume
6. **CRITICAL**: Include relevant awards from the CANDIDATE AWARDS section above in the summary if they align with the job
   - Use phrases like "Recognized for," "Award-winning," "Cited for" with the ACTUAL award names and descriptions
   - Only include awards if they're actually provided in the candidate context above
7. Use the candidate's actual professional tagline and positioning from their portfolio data
8. Ensure all adapted_sections maintain the same structure as the original but with optimized content
9. NO placeholders - every field must contain real data from the resume provided
10. Return ONLY valid JSON, no additional text

🚨 REMINDER: Output must be 100% ready to use. Use actual data from the resume sections above. No [brackets], no placeholders, no made-up metrics.

  try {
    const aiResponse = await generateAICompletion(
      userId,
      'resume_adapt',
      'You are an expert resume writer and career coach.',
      [{ role: 'user', content: prompt }],
      4096
    );

    const resultText = aiResponse.content;
    
    // Parse JSON from the response (handle markdown code blocks if present)
    let jsonText = resultText.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/^```json\n?/, '').replace(/\n?```$/, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```\n?/, '').replace(/\n?```$/, '');
    }
    
    const result = JSON.parse(jsonText);

    return {
      adaptedSections: result.adaptedSections || [],
      matchScore: result.matchScore || 0,
      suggestedKeywords: result.suggestedKeywords || [],
      gaps: result.gaps || [],
      strengths: result.strengths || [],
      recommendations: result.recommendations || 'No specific recommendations provided.',
    };
  } catch (error) {
    console.error('Error calling AI API:', error);
    
    // Fallback: return original sections with basic analysis
    return {
      adaptedSections: sections.map(s => ({
        section_type: s.section_type,
        title: s.title,
        sort_order: s.sort_order,
        content: s.content,
      })),
      matchScore: 50,
      suggestedKeywords: [],
      gaps: ['Unable to analyze - AI API error'],
      strengths: [],
      recommendations: 'Could not generate recommendations due to AI API error. Please try again.',
    };
  }
}
