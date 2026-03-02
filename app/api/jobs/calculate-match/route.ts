import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { generateAICompletion } from '@/lib/ai-provider';
import { getSupabaseServiceRole } from '@/lib/supabase-server';

export async function POST(request: Request) {
  try {
    console.log('[Match Calculation] Starting...');
    const supabase = getSupabaseServiceRole();
    
    // Check if required environment variables are set
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error('[Match Calculation] ANTHROPIC_API_KEY not set');
      return NextResponse.json(
        { error: 'AI service not configured. Please contact administrator.' },
        { status: 500 }
      );
    }
    
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('[Match Calculation] Supabase credentials not set');
      return NextResponse.json(
        { error: 'Database not configured. Please contact administrator.' },
        { status: 500 }
      );
    }
    
    const { userId } = await auth();
    
    if (!userId) {
      console.error('[Match Calculation] Unauthorized - no userId');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    console.log('[Match Calculation] User authenticated:', userId);
    
    const body = await request.json();
    const { jobId } = body;
    console.log('[Match Calculation] Job ID:', jobId, 'User ID:', userId);

    if (!jobId) {
      console.error('[Match Calculation] No job ID provided');
      return NextResponse.json(
        { error: 'Job ID is required' },
        { status: 400 }
      );
    }

    // Get the job with its tailored content
    console.log('[Match Calculation] Fetching job from database...');
    const { data: job, error: jobError } = await supabase
      .from('tracked_jobs')
      .select('*')
      .eq('id', jobId)
      .eq('clerk_id', userId)
      .single();

    if (jobError) {
      console.error('[Match Calculation] Database error:', jobError);
      return NextResponse.json(
        { error: `Database error: ${jobError.message}` },
        { status: 500 }
      );
    }

    if (!job) {
      console.error('[Match Calculation] Job not found');
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    console.log('[Match Calculation] Job found:', job.title, 'at', job.company);
    console.log('[Match Calculation] Resume ID:', job.tailored_resume_id, 'Cover Letter ID:', job.tailored_cover_letter_id);

    // Check if tailored content exists
    if (!job.tailored_resume_id && !job.tailored_cover_letter_id) {
      console.error('[Match Calculation] No tailored content found');
      return NextResponse.json(
        { error: 'No tailored content found for this job. Please generate resume or cover letter first.' },
        { status: 400 }
      );
    }

    // Fetch resume if exists
    let resumeContent = '';
    if (job.tailored_resume_id) {
      console.log('[Match Calculation] Fetching resume:', job.tailored_resume_id);
      const { data: resume, error: resumeError } = await supabase
        .from('resumes')
        .select('*, sections:resume_sections(*)')
        .eq('id', job.tailored_resume_id)
        .single();

      if (resumeError) {
        console.error('[Match Calculation] Error fetching resume:', resumeError);
      }

      if (resume) {
        console.log('[Match Calculation] Resume found with', resume.sections?.length || 0, 'sections');
        // Extract text from resume sections
        resumeContent = resume.sections
          .sort((a: any, b: any) => a.sort_order - b.sort_order)
          .map((section: any) => {
            const content = section.content;
            let text = `${section.section_type}:\n`;
            
            if (section.section_type === 'summary') {
              text += content.text || '';
            } else if (section.section_type === 'experience') {
              text += `${content.position} at ${content.company}\n`;
              text += (content.bullets || []).join('\n');
            } else if (section.section_type === 'skills') {
              text += (content.items || []).join(', ');
            } else if (section.section_type === 'education') {
              text += `${content.degree} - ${content.institution}`;
            } else if (section.section_type === 'projects') {
              text += `${content.name}\n`;
              text += (content.bullets || []).join('\n');
            }
            
            return text;
          })
          .join('\n\n');
      }
    }

    // Fetch cover letter if exists
    let coverLetterContent = '';
    if (job.tailored_cover_letter_id) {
      console.log('[Match Calculation] Fetching cover letter:', job.tailored_cover_letter_id);
      const { data: coverLetter, error: clError } = await supabase
        .from('cover_letters')
        .select('*')
        .eq('id', job.tailored_cover_letter_id)
        .single();

      if (clError) {
        console.error('[Match Calculation] Error fetching cover letter:', clError);
      }

      if (coverLetter) {
        console.log('[Match Calculation] Cover letter found');
        coverLetterContent = [
          coverLetter.opening_paragraph,
          ...(coverLetter.body_paragraphs || []),
          coverLetter.closing_paragraph,
        ]
          .filter(Boolean)
          .join('\n\n');
      }
    }

    // Use AI to calculate match percentage using ATS-style scoring
    const prompt = `You are an ATS (Applicant Tracking System) simulator. Calculate a match score exactly as an ATS would, focusing on keyword matching, required qualifications, and formatting compatibility.

JOB POSTING:
Title: ${job.title}
Company: ${job.company}
Description: ${job.description}

CANDIDATE'S TAILORED RESUME:
${resumeContent || 'Not provided'}

CANDIDATE'S TAILORED COVER LETTER:
${coverLetterContent || 'Not provided'}

CRITICAL: Evaluate like a real ATS system would:

1. KEYWORD MATCHING (40% weight):
   - Exact keyword matches from job description (tools, technologies, methodologies)
   - Variations and synonyms (e.g., "PM" vs "Product Manager")
   - Acronyms spelled out and abbreviated
   - Industry-specific terminology
   - Action verbs matching job requirements

2. REQUIRED QUALIFICATIONS (30% weight):
   - Years of experience (must meet minimum)
   - Education requirements (degree level, field)
   - Required certifications or licenses
   - Must-have skills explicitly stated as "required"
   - Industry experience requirements

3. PREFERRED QUALIFICATIONS (15% weight):
   - Nice-to-have skills
   - Additional certifications
   - Preferred experience areas
   - Bonus technical skills

4. EXPERIENCE ALIGNMENT (10% weight):
   - Job titles matching progression
   - Relevant company types/sizes
   - Similar role responsibilities
   - Domain/industry match

5. ATS PARSING SUCCESS (5% weight):
   - Keywords appear in standard sections (Summary, Experience, Skills)
   - Quantifiable achievements with metrics
   - Standard section headers used
   - Chronological format compatibility

ATS SCORING RULES:
- 90-100%: Exceeds requirements, all keywords matched, perfect ATS format
- 75-89%: Meets all requirements, most keywords matched, good ATS compatibility
- 60-74%: Meets core requirements, some keyword gaps, acceptable format
- 50-59%: Borderline - missing some requirements or keywords
- Below 50%: Does not meet minimum requirements, poor keyword match

Return ONLY a JSON object with this exact format:
{
  "percentage": 85,
  "reasoning": "Brief ATS-style assessment: keyword match rate, qualification match, formatting score",
  "strengths": ["Keyword strength 1", "Qualification match 2", "ATS optimization 3"],
  "gaps": ["Missing keyword 1", "Qualification gap 2"],
  "ats_keywords_matched": ["keyword1", "keyword2", "keyword3"],
  "ats_keywords_missing": ["missing1", "missing2"]
}

IMPORTANT: 
- Be strict like a real ATS - keyword mismatches reduce score significantly
- Exact phrase matching is critical (e.g., "machine learning" not just "learning")
- Required qualifications are pass/fail - missing any = max 70% score
- Focus on what ATS scans for, not subjective fit
- Return ONLY the JSON, no other text`;

    console.log('[Match Calculation] Calling AI API...');
    console.log('[Match Calculation] Resume content length:', resumeContent.length);
    console.log('[Match Calculation] Cover letter content length:', coverLetterContent.length);
    
    const response = await generateAICompletion(
      userId,
      'job_match_calculation',
      'You are an expert recruiter analyzing job matches.',
      [{ role: 'user', content: prompt }],
      2000
    );

    console.log('[Match Calculation] AI response received');

    // Parse AI response
    const jsonMatch = response.content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('[Match Calculation] Invalid JSON response:', response.content);
      throw new Error('Invalid JSON response from AI');
    }

    const matchData = JSON.parse(jsonMatch[0]);
    console.log('[Match Calculation] Parsed match data:', matchData);

    // Validate percentage is in valid range
    const percentage = Math.max(0, Math.min(100, matchData.percentage));
    console.log('[Match Calculation] Final percentage:', percentage);

    // Update the job with match percentage
    console.log('[Match Calculation] Updating database with percentage:', percentage);
    const { error: updateError } = await supabase
      .from('tracked_jobs')
      .update({ match_percentage: percentage })
      .eq('id', jobId);

    if (updateError) {
      console.error('[Match Calculation] Database update error:', updateError);
      throw updateError;
    }

    console.log('[Match Calculation] Successfully saved match percentage to database');

    return NextResponse.json({
      success: true,
      percentage,
      reasoning: matchData.reasoning,
      strengths: matchData.strengths || [],
      gaps: matchData.gaps || [],
      ats_keywords_matched: matchData.ats_keywords_matched || [],
      ats_keywords_missing: matchData.ats_keywords_missing || [],
    });
  } catch (error) {
    console.error('[Match Calculation] Fatal error:', error);
    console.error('[Match Calculation] Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    
    return NextResponse.json(
      { 
        error: error instanceof Error 
          ? error.message 
          : 'Failed to calculate match percentage',
        details: error instanceof Error ? error.stack : String(error),
      },
      { status: 500 }
    );
  }
}
