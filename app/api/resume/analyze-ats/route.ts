import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getSupabaseServiceRole } from '@/lib/supabase-server';
import { generateATSOptimization, analyzeATSCompatibility } from '@/lib/ats-optimizer';

/**
 * POST /api/resume/analyze-ats - Analyze resume for ATS compatibility
 * 
 * Analyzes a resume against a job description to provide:
 * - ATS score (0-100)
 * - Keyword coverage analysis
 * - Structure score
 * - Semantic alignment score
 * - Specific recommendations for improvement
 * - Missing keywords
 */
export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { resumeId, jobTitle, jobDescription, company } = body;

    if (!resumeId || !jobTitle || !jobDescription || !company) {
      return NextResponse.json(
        { error: 'Missing required fields: resumeId, jobTitle, jobDescription, company' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServiceRole();

    // Fetch resume
    const { data: resume, error: resumeError } = await supabase
      .from('resumes')
      .select('*, resume_sections(*)')
      .eq('id', resumeId)
      .eq('clerk_id', userId)
      .single();

    if (resumeError || !resume) {
      return NextResponse.json(
        { error: 'Resume not found or access denied' },
        { status: 404 }
      );
    }

    // Convert resume to text content for analysis
    let resumeText = '';
    
    // Add contact info
    resumeText += `${resume.full_name}\n`;
    if (resume.email) resumeText += `${resume.email}\n`;
    if (resume.phone) resumeText += `${resume.phone}\n`;
    if (resume.location) resumeText += `${resume.location}\n`;
    if (resume.linkedin_url) resumeText += `${resume.linkedin_url}\n`;
    if (resume.portfolio_url) resumeText += `${resume.portfolio_url}\n`;
    resumeText += `\n`;

    // Add sections
    const sections = resume.resume_sections || [];
    sections.sort((a: any, b: any) => a.sort_order - b.sort_order);

    for (const section of sections) {
      const sectionType = section.section_type;
      const content = section.content;

      // Add section header
      if (sectionType === 'summary') {
        resumeText += `PROFESSIONAL SUMMARY\n`;
        resumeText += `${content.text || ''}\n\n`;
      } else if (sectionType === 'experience') {
        resumeText += `PROFESSIONAL EXPERIENCE\n`;
        resumeText += `${content.position || ''}\n`;
        resumeText += `${content.company || ''}\n`;
        resumeText += `${content.startDate || ''} - ${content.endDate || ''}\n`;
        if (content.location) resumeText += `${content.location}\n`;
        if (content.bullets && Array.isArray(content.bullets)) {
          content.bullets.forEach((bullet: string) => {
            resumeText += `• ${bullet}\n`;
          });
        }
        resumeText += `\n`;
      } else if (sectionType === 'education') {
        resumeText += `EDUCATION\n`;
        resumeText += `${content.degree || ''}\n`;
        resumeText += `${content.institution || ''}\n`;
        resumeText += `${content.year || ''}\n`;
        if (content.description) resumeText += `${content.description}\n`;
        resumeText += `\n`;
      } else if (sectionType === 'skills') {
        resumeText += `SKILLS\n`;
        if (content.category) resumeText += `${content.category}: `;
        if (content.items && Array.isArray(content.items)) {
          resumeText += `${content.items.join(', ')}\n`;
        }
        resumeText += `\n`;
      } else if (sectionType === 'projects') {
        resumeText += `PROJECTS\n`;
        resumeText += `${content.name || ''}\n`;
        if (content.description) resumeText += `${content.description}\n`;
        if (content.bullets && Array.isArray(content.bullets)) {
          content.bullets.forEach((bullet: string) => {
            resumeText += `• ${bullet}\n`;
          });
        }
        if (content.technologies && Array.isArray(content.technologies)) {
          resumeText += `Technologies: ${content.technologies.join(', ')}\n`;
        }
        resumeText += `\n`;
      } else if (sectionType === 'certifications') {
        resumeText += `CERTIFICATIONS\n`;
        resumeText += `${content.name || ''}\n`;
        if (content.issuer) resumeText += `${content.issuer}\n`;
        if (content.date) resumeText += `${content.date}\n`;
        resumeText += `\n`;
      }
    }

    // Generate ATS optimization for the job
    const atsOptimization = generateATSOptimization(jobTitle, jobDescription, company);

    // Analyze resume against job requirements
    const analysis = analyzeATSCompatibility(resumeText, atsOptimization);

    // Save analysis to database for tracking
    const { error: saveError } = await supabase
      .from('resume_ats_analyses')
      .insert({
        resume_id: resumeId,
        clerk_id: userId,
        job_title: jobTitle,
        job_company: company,
        overall_score: analysis.overallScore,
        keyword_coverage: analysis.keywordCoverage,
        structure_score: analysis.structureScore,
        semantic_alignment: analysis.semanticAlignment,
        recommendations: analysis.recommendations,
        missing_keywords: analysis.missingKeywords,
        strengths: analysis.strengths,
      });

    if (saveError) {
      console.error('Error saving ATS analysis:', saveError);
      // Don't fail the request if saving fails
    }

    return NextResponse.json({
      success: true,
      analysis: {
        overallScore: analysis.overallScore,
        keywordCoverage: analysis.keywordCoverage,
        structureScore: analysis.structureScore,
        semanticAlignment: analysis.semanticAlignment,
        recommendations: analysis.recommendations,
        missingKeywords: analysis.missingKeywords,
        strengths: analysis.strengths,
        scoreBreakdown: {
          excellent: analysis.overallScore >= 80,
          good: analysis.overallScore >= 60 && analysis.overallScore < 80,
          needsImprovement: analysis.overallScore < 60,
        },
        atsOptimization: {
          priorityTerms: atsOptimization.priorityTerms,
          industryContext: atsOptimization.industryContext,
          recommendedStructure: atsOptimization.recommendedStructure,
        },
      },
    });
  } catch (error) {
    console.error('POST /api/resume/analyze-ats error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}
