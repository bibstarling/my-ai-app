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

    // Extract contact information from markdown if not in portfolio_data
    function extractFromMarkdown(markdown: string, pattern: RegExp): string | null {
      const match = markdown.match(pattern);
      return match ? match[1].trim() : null;
    }

    let extractedName = null;
    let extractedEmail = null;
    let extractedPortfolioUrl = null;

    if (portfolioMarkdown) {
      extractedName = extractFromMarkdown(portfolioMarkdown, /^#\s+(.+?)$/m);
      extractedEmail = extractFromMarkdown(portfolioMarkdown, /(?:email|e-mail|contact)[\s:]*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i);
      
      const urlPatterns = [
        /(?:portfolio|website|site|url)[\s:]*(?:https?:\/\/)?([a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.(?:com|net|org|dev|io|co|me|info)[^\s,;)]*)/i,
        /(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.(?:com|net|org|dev|io|co|me|info))/i,
      ];
      
      for (const pattern of urlPatterns) {
        const url = extractFromMarkdown(portfolioMarkdown, pattern);
        if (url) {
          extractedPortfolioUrl = url.startsWith('http') ? url : `https://${url}`;
          break;
        }
      }
    }

    const fullName = portfolio?.fullName || portfolio?.name || extractedName || '';
    const email = portfolio?.email || extractedEmail || '';
    const portfolioUrl = userInfo?.is_super_admin 
      ? 'www.biancastarling.com'
      : (portfolio?.websiteUrl || portfolio?.website || extractedPortfolioUrl || '');

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
- The resume must be 100% ready to use without any edits or replaceholders needed
- Every detail must be filled in with real information from the provided data
- If specific metrics are missing, describe achievements qualitatively - don't leave brackets or placeholders

📌 MANDATORY - PORTFOLIO URL:
- The candidate's portfolio URL will be AUTOMATICALLY included in the resume header
- Contact information (name, email, phone, location, LinkedIn, portfolio) is handled separately
- Portfolio URL is NON-NEGOTIABLE and will ALWAYS be displayed if available
- Focus your content generation on the resume sections (summary, experience, skills, education)

JOB INFORMATION:
Title: ${jobTitle}
Company: ${company}
Description: ${jobDescription}

CANDIDATE PORTFOLIO:
${portfolioMarkdown || JSON.stringify(portfolio, null, 2)}

📌 CONTACT INFORMATION - ALREADY HANDLED:
- DO NOT include contact information in your response
- Contact information is AUTOMATICALLY populated in the resume header
- Candidate's full name: ${fullName}
- Candidate's email: ${email}
- Portfolio URL: ${portfolioUrl || 'Will be included if available'}
- Focus ONLY on generating content sections (summary, experience, projects, skills, education)

Return ONLY valid JSON in this exact format:
{
  "sections": [
    {
      "type": "summary",
      "content": "3-4 sentence ATS-optimized professional summary with 4-6 priority keywords, specific metrics, and conversational tone"
    },
    {
      "type": "experience",
      "items": [
        {
          "title": "Job Title",
          "company": "Company Name",
          "period": "Start - End",
          "location": "City, State",
          "description": "Brief role overview",
          "highlights": [
            "Achievement-focused bullet with specific metric (e.g., 'Led product strategy resulting in 35% increase in user engagement')",
            "Technical accomplishment with impact (e.g., 'Built semantic search infrastructure serving 500K+ users')",
            "Leadership or collaboration highlight (e.g., 'Managed cross-functional team of 8 engineers and designers')",
            "Strategic initiative with outcome (e.g., 'Launched 3 major features generating $2M ARR')",
            "4-6 total bullets per experience - be comprehensive and specific"
          ]
        }
      ]
    },
    {
      "type": "projects",
      "items": [
        {
          "name": "Project Name",
          "description": "Project overview",
          "highlights": [
            "Key impact or outcome with metrics",
            "Technical implementation details",
            "Technologies used or challenges solved"
          ]
        }
      ]
    },
    {
      "type": "skills",
      "items": ["15-20 relevant skills matching job requirements - be comprehensive"]
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

🚨 CRITICAL REQUIREMENTS:
- Each experience MUST have 4-6 detailed, achievement-focused bullets with specific metrics
- Each project MUST have 2-3 detailed bullets explaining impact and technologies
- Summary MUST be 3-4 sentences with real metrics and achievements
- Include 3-5 experiences if available and relevant
- NO placeholders, NO brackets, NO generic statements
- Use ACTUAL data from portfolio with REAL metrics and outcomes
- Be COMPREHENSIVE - detailed resumes perform better in ATS and with recruiters`;

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
        full_name: fullName,
        email: email,
        phone: portfolio.phone || null,
        location: portfolio.location || '',
        linkedin_url: portfolio.linkedinUrl || portfolio.linkedin || '',
        portfolio_url: portfolioUrl,
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
            
            // Create comprehensive bullets from highlights and description
            const bullets = [];
            if (item.highlights && Array.isArray(item.highlights)) {
              bullets.push(...item.highlights);
            } else if (item.description) {
              // Split description into bullets if highlights not provided
              const descBullets = item.description
                .split(/[.!]\s+/)
                .filter(Boolean)
                .map((b: string) => b.trim())
                .filter((b: string) => b.length > 20);
              bullets.push(...descBullets);
            }
            
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
                bullets: bullets.length > 0 ? bullets : [item.description || ''],
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
            // Create detailed project bullets
            const projectBullets = [];
            if (item.highlights && Array.isArray(item.highlights)) {
              projectBullets.push(...item.highlights);
            } else if (item.bullets && Array.isArray(item.bullets)) {
              projectBullets.push(...item.bullets);
            } else if (item.description) {
              // Split description into bullets
              const descBullets = item.description
                .split(/[.!]\s+/)
                .filter(Boolean)
                .map((b: string) => b.trim())
                .filter((b: string) => b.length > 20);
              projectBullets.push(...descBullets);
            }
            
            sectionsToInsert.push({
              resume_id: resume.id,
              section_type: 'projects',
              sort_order: sortOrder++,
              content: {
                name: item.name || item.title || '',
                description: item.description || '',
                bullets: projectBullets.length > 0 ? projectBullets : [item.description || ''],
                url: item.url || '',
                technologies: item.technologies || [],
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
