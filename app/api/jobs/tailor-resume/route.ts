import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { generateAICompletion } from '@/lib/ai-provider';
import { createClient } from '@supabase/supabase-js';
import { portfolioData } from '@/lib/portfolio-data';
import { generateATSOptimization, getATSResumePromptInstructions, analyzeATSCompatibility } from '@/lib/ats-optimizer';

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

    if (userInfo?.is_super_admin && !userPortfolio) {
      portfolio = portfolioData;
    }

    if (!userPortfolio && !userInfo?.is_super_admin) {
      return NextResponse.json(
        { error: 'Please create your portfolio first before generating resumes' },
        { status: 400 }
      );
    }

    // Generate ATS optimization strategy
    const atsOptimization = generateATSOptimization(jobTitle, jobDescription, company);
    console.log('[Tailor Resume] ATS Optimization Generated:', {
      priorityTerms: atsOptimization.priorityTerms.length,
      industryContext: atsOptimization.industryContext,
      recommendedStructure: atsOptimization.recommendedStructure,
    });

    // Get ATS-optimized prompt instructions
    const atsInstructions = getATSResumePromptInstructions(atsOptimization);

    // Generate tailored resume with AI optimized for ATS systems
    const prompt = `You are an ATS-optimized resume writer with expertise in state-of-the-art 2026 ATS systems. Create a tailored resume that will score highly in Applicant Tracking Systems (targeting 0.76+ semantic alignment) while appealing to human recruiters.

${atsInstructions}

🚨 CRITICAL REQUIREMENT - NO PLACEHOLDERS ALLOWED:
- NEVER use placeholders like [Company Name], [Your Name], [Metric], [Achievement], [Skill], etc.
- ALWAYS use actual data from the candidate's portfolio provided below
- Extract real experiences, projects, skills, and achievements from the candidate's actual data
- The resume must be 100% ready to use without any edits or replacements needed
- Every detail must be filled in with real information from the provided data
- If specific metrics are missing, describe achievements qualitatively - don't leave brackets or placeholders

JOB INFORMATION:
Title: ${jobTitle}
Company: ${company}
Description: ${jobDescription}

CANDIDATE PORTFOLIO:
${portfolioMarkdown || JSON.stringify(portfolio, null, 2)}

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
}

🚨 REMINDER: All content must use ACTUAL data from the candidate's portfolio. Extract real names, companies, achievements, metrics, and skills. No [brackets], no placeholders, no made-up information. The resume must be 100% ready to use.`;

    const response = await generateAICompletion(
      userId,
      'job_tailor_resume',
      'You are an expert resume writer.',
      [{ role: 'user', content: prompt }],
      4000
    );

    // Parse AI response
    const jsonMatch = response.content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid JSON response from AI');
    }

    const resumeData = JSON.parse(jsonMatch[0]);

    // Save resume to database
    const { data: resume, error: insertError } = await supabase
      .from('resumes')
      .insert({
        clerk_id: userId,
        title: `${jobTitle} at ${company}`,
        full_name: portfolio.fullName || portfolio.name || '',
        email: portfolio.email || '',
        phone: portfolio.phone || null,
        location: portfolio.location || '',
        linkedin_url: portfolio.linkedinUrl || portfolio.linkedin || '',
        portfolio_url: portfolio.websiteUrl || portfolio.website || '',
        status: 'draft',
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // Transform and save resume sections
    if (resumeData.sections && Array.isArray(resumeData.sections)) {
      const sectionsToInsert: any[] = [];
      let sortOrder = 0;

      for (const section of resumeData.sections) {
        if (section.type === 'summary' && section.content) {
          // Summary section - single entry
          sectionsToInsert.push({
            resume_id: resume.id,
            section_type: 'summary',
            sort_order: sortOrder++,
            content: { text: section.content },
          });
        } else if (section.type === 'experience' && section.items) {
          // Experience - create separate section for each item
          for (const item of section.items) {
            const [startDate, endDate] = (item.period || '').split(/\s*[-–—:]\s*/);
            sectionsToInsert.push({
              resume_id: resume.id,
              section_type: 'experience',
              sort_order: sortOrder++,
              content: {
                position: item.title || '',
                company: item.company || '',
                location: item.location || '',
                startDate: startDate?.trim() || '',
                endDate: endDate?.trim() || '',
                bullets: item.highlights || [item.description] || [],
              },
            });
          }
        } else if (section.type === 'education' && section.items) {
          // Education - create separate section for each item
          for (const item of section.items) {
            sectionsToInsert.push({
              resume_id: resume.id,
              section_type: 'education',
              sort_order: sortOrder++,
              content: {
                degree: item.degree || '',
                institution: item.institution || item.school || '',
                year: item.year || '',
                description: item.description || '',
              },
            });
          }
        } else if (section.type === 'skills' && section.items) {
          // Skills - group all skills into one section
          sectionsToInsert.push({
            resume_id: resume.id,
            section_type: 'skills',
            sort_order: sortOrder++,
            content: {
              category: 'Core Skills',
              items: Array.isArray(section.items) ? section.items : [],
            },
          });
        } else if (section.type === 'projects' && section.items) {
          // Projects - create separate section for each item
          for (const item of section.items) {
            sectionsToInsert.push({
              resume_id: resume.id,
              section_type: 'projects',
              sort_order: sortOrder++,
              content: {
                name: item.name || item.title || '',
                description: item.description || '',
                bullets: item.highlights || item.bullets || [],
                url: item.url || '',
              },
            });
          }
        }
      }

      if (sectionsToInsert.length > 0) {
        const { error: sectionsError } = await supabase
          .from('resume_sections')
          .insert(sectionsToInsert);

        if (sectionsError) {
          console.error('Error saving resume sections:', sectionsError);
          // Don't throw - resume was created, just log the error
        }
      }
    }

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
