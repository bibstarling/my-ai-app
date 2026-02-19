import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { generateAICompletion } from '@/lib/ai-provider';
import { createClient } from '@supabase/supabase-js';
import { portfolioData, getPMPositioning } from '@/lib/portfolio-data';
import { generateATSOptimization, getATSCoverLetterPromptInstructions, analyzeATSCompatibility } from '@/lib/ats-optimizer';

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
    let positioning = '';

    if (userInfo?.is_super_admin && !userPortfolio) {
      portfolio = portfolioData;
      positioning = getPMPositioning();
    } else if (userPortfolio?.markdown) {
      // Extract positioning from user's portfolio
      portfolioMarkdown = userPortfolio.markdown;
      positioning = portfolioMarkdown.slice(0, 3000);
    }

    if (!portfolioMarkdown && !positioning) {
      return NextResponse.json(
        { error: 'Please create your portfolio first before generating cover letters' },
        { status: 400 }
      );
    }

    // Generate ATS optimization strategy
    const atsOptimization = generateATSOptimization(jobTitle, jobDescription, company);
    console.log('[Tailor Cover Letter] ATS Optimization Generated:', {
      priorityTerms: atsOptimization.priorityTerms.length,
      industryContext: atsOptimization.industryContext,
    });

    // Get ATS-optimized prompt instructions
    const atsInstructions = getATSCoverLetterPromptInstructions(atsOptimization);

    // Generate tailored cover letter optimized for ATS and recruiters
    const prompt = `You are an expert cover letter writer with deep knowledge of state-of-the-art 2026 ATS systems and recruiter psychology. Create a cover letter that passes ATS screening (targeting high keyword coverage and semantic alignment) while engaging human readers.

${atsInstructions}

🚨 CRITICAL REQUIREMENT #1 - NEVER FABRICATE OR INVENT CONTENT:
- ONLY use experiences, projects, companies, and achievements that EXIST in the candidate's portfolio below
- NEVER invent or make up experiences, skills, projects, or accomplishments that aren't in the provided portfolio
- NEVER fabricate metrics, outcomes, or details that aren't explicitly stated in the source material
- If the candidate hasn't mentioned experience with something, DO NOT claim they have it
- Better to write a shorter, accurate cover letter than to invent false claims
- Every single claim must be directly traceable to information in the provided portfolio
- When in doubt about whether something is true, DON'T include it - accuracy trumps everything

🚨 CRITICAL REQUIREMENT #2 - NO PLACEHOLDERS ALLOWED:
- NEVER use placeholders like [Company Name], [Your Name], [Position], [Skills], [Achievement], [Date], or anything in brackets
- TODAY'S DATE (use this if you include a date): ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
- Do not write "[Date]" or leave the date blank—either omit the date (it is added on export) or use the exact date above
- ALWAYS use actual data from the candidate's portfolio provided below
- Extract the candidate's name, experiences, projects, and skills from their portfolio
- The cover letter must be 100% ready to send without any edits or replacements needed
- Every detail must be filled in with real information from the provided data
- If specific information is missing, write around it naturally - don't leave brackets or placeholders

JOB INFORMATION:
Title: ${jobTitle}
Company: ${company}
Description: ${jobDescription}

CANDIDATE INFORMATION:
${positioning}

Portfolio Details:
${portfolioMarkdown || JSON.stringify(portfolio, null, 2)}

Return the complete cover letter text (no JSON, just the letter). 
🚨 REMINDER: No [brackets], no placeholders, no TODO items. Use real data from portfolio only.`;

    const response = await generateAICompletion(
      userId,
      'job_tailor_cover_letter',
      'You are an expert cover letter writer.',
      [{ role: 'user', content: prompt }],
      2000
    );

    let coverLetterText = response.content.trim();

    // Replace any date placeholders with actual date
    const todayFormatted = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const replaceDatePlaceholders = (text: string) =>
      (text || '')
        .replace(/\s*\[Date\]\s*/gi, ` ${todayFormatted} `)
        .replace(/\s*\[DATE\]\s*/g, ` ${todayFormatted} `)
        .replace(/\s*\[Today's Date\]\s*/gi, ` ${todayFormatted} `)
        .trim();
    coverLetterText = replaceDatePlaceholders(coverLetterText);

    // Split cover letter into paragraphs
    const paragraphs = coverLetterText.split('\n\n').filter(p => p.trim());
    const opening = replaceDatePlaceholders(paragraphs[0] || '');
    const bodyParagraphs = paragraphs.slice(1, -1).map((p: string) => replaceDatePlaceholders(p));
    const closing = replaceDatePlaceholders(paragraphs[paragraphs.length - 1] || '');

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
