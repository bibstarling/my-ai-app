import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getSupabaseServiceRole } from '@/lib/supabase-server';
import { generateATSOptimization, analyzeATSCompatibility } from '@/lib/ats-optimizer';

/**
 * POST /api/cover-letter/analyze-ats - Analyze cover letter for ATS compatibility
 * 
 * Analyzes a cover letter against a job description to provide:
 * - ATS score (0-100)
 * - Keyword coverage analysis
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
    const { coverLetterId, jobTitle, jobDescription, company } = body;

    if (!coverLetterId || !jobTitle || !jobDescription || !company) {
      return NextResponse.json(
        { error: 'Missing required fields: coverLetterId, jobTitle, jobDescription, company' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServiceRole();

    // Fetch cover letter
    const { data: coverLetter, error: coverLetterError } = await supabase
      .from('cover_letters')
      .select('*')
      .eq('id', coverLetterId)
      .eq('clerk_id', userId)
      .single();

    if (coverLetterError || !coverLetter) {
      return NextResponse.json(
        { error: 'Cover letter not found or access denied' },
        { status: 404 }
      );
    }

    // Convert cover letter to text content for analysis
    let coverLetterText = '';
    
    // Add opening paragraph
    if (coverLetter.opening_paragraph) {
      coverLetterText += `${coverLetter.opening_paragraph}\n\n`;
    }

    // Add body paragraphs
    if (coverLetter.body_paragraphs && Array.isArray(coverLetter.body_paragraphs)) {
      coverLetter.body_paragraphs.forEach((paragraph: string) => {
        coverLetterText += `${paragraph}\n\n`;
      });
    }

    // Add closing paragraph
    if (coverLetter.closing_paragraph) {
      coverLetterText += `${coverLetter.closing_paragraph}\n`;
    }

    // Generate ATS optimization for the job
    const atsOptimization = generateATSOptimization(jobTitle, jobDescription, company);

    // Analyze cover letter against job requirements
    const analysis = analyzeATSCompatibility(coverLetterText, atsOptimization);

    // Cover letters typically need higher keyword density than resumes
    // Adjust recommendations for cover letter context
    const coverLetterRecommendations = [...analysis.recommendations];
    
    if (analysis.keywordCoverage < 70) {
      coverLetterRecommendations.push(
        'Cover letters should include 10-12 priority keywords. Consider mentioning the job title and company name explicitly.'
      );
    }

    if (!coverLetterText.toLowerCase().includes(jobTitle.toLowerCase())) {
      coverLetterRecommendations.push(
        `Include the job title "${jobTitle}" explicitly in your opening paragraph for ATS optimization.`
      );
    }

    if (!coverLetterText.toLowerCase().includes(company.toLowerCase())) {
      coverLetterRecommendations.push(
        `Mention "${company}" 2-3 times throughout the letter for better ATS performance.`
      );
    }

    // Save analysis to database for tracking
    const { error: saveError } = await supabase
      .from('cover_letter_ats_analyses')
      .insert({
        cover_letter_id: coverLetterId,
        clerk_id: userId,
        job_title: jobTitle,
        job_company: company,
        overall_score: analysis.overallScore,
        keyword_coverage: analysis.keywordCoverage,
        semantic_alignment: analysis.semanticAlignment,
        recommendations: coverLetterRecommendations,
        missing_keywords: analysis.missingKeywords,
        strengths: analysis.strengths,
      });

    if (saveError) {
      console.error('Error saving cover letter ATS analysis:', saveError);
      // Don't fail the request if saving fails
    }

    return NextResponse.json({
      success: true,
      analysis: {
        overallScore: analysis.overallScore,
        keywordCoverage: analysis.keywordCoverage,
        semanticAlignment: analysis.semanticAlignment,
        recommendations: coverLetterRecommendations,
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
        },
      },
    });
  } catch (error) {
    console.error('POST /api/cover-letter/analyze-ats error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}
