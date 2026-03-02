import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { generateAICompletion } from '@/lib/ai-provider';
import { getSupabaseServiceRole } from '@/lib/supabase-server';
import { portfolioData } from '@/lib/portfolio-data';
import { generateATSOptimization, getATSResumePromptInstructions, analyzeATSCompatibility } from '@/lib/ats-optimizer';

export async function POST(request: Request) {
  try {
    const supabase = getSupabaseServiceRole();
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
      .select('portfolio_data, markdown, full_name, email, linkedin_url, portfolio_url')
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

    // Structured contact fields (optional, take priority over markdown extraction)
    const structuredFullName = userPortfolio?.full_name || null;
    const structuredEmail = userPortfolio?.email || null;
    const structuredLinkedIn = userPortfolio?.linkedin_url || null;
    const structuredPortfolioUrl = userPortfolio?.portfolio_url || null;
    
    let extractedName = null;
    let extractedEmail = null;
    let extractedLinkedIn = null;
    let extractedPortfolioUrl = null;

    if (portfolioMarkdown) {
      extractedName = extractFromMarkdown(portfolioMarkdown, /^#\s+(.+?)$/m);
      
      // Filter out generic placeholders that shouldn't be used as names
      if (extractedName) {
        const genericPlaceholders = [
          'Professional Profile',
          'Your Name',
          'Your Full Name',
          'Portfolio',
          'Resume',
          'CV',
          'Profile'
        ];
        if (genericPlaceholders.some(placeholder => 
          extractedName!.toLowerCase() === placeholder.toLowerCase()
        )) {
          console.log('[Tailor Resume] Ignoring generic placeholder name:', extractedName);
          extractedName = null;
        }
      }
      
      extractedEmail = extractFromMarkdown(portfolioMarkdown, /(?:email|e-mail|contact)[\s:]*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i);
      
      // Extract LinkedIn URL
      const linkedInPatterns = [
        /(?:linkedin|linked-in)[\s:]*(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/([a-zA-Z0-9-]+)/i,
        /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/([a-zA-Z0-9-]+)/i,
      ];
      
      for (const pattern of linkedInPatterns) {
        const match = portfolioMarkdown.match(pattern);
        if (match) {
          extractedLinkedIn = match[0].startsWith('http') ? match[0] : `https://linkedin.com/in/${match[1]}`;
          break;
        }
      }
      
      // Extract portfolio URL - look for common patterns
      // Pattern 1: Explicit labels (Portfolio:, Website:, etc.)
      const labeledUrlPattern = /(?:portfolio|website|site|url)[\s:]+(?:https?:\/\/)?([a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.(?:com|net|org|dev|io|co|me|info)[^\s,;)]*)/i;
      const labeledMatch = portfolioMarkdown.match(labeledUrlPattern);
      
      if (labeledMatch && labeledMatch[1]) {
        const url = labeledMatch[1];
        extractedPortfolioUrl = url.startsWith('http') ? url : `https://${url}`;
        console.log('[Tailor Resume] Extracted portfolio URL (labeled):', extractedPortfolioUrl);
      } else {
        // Pattern 2: Standalone URLs with protocol (must start with http/https)
        const standaloneUrlPattern = /(https?:\/\/(?:www\.)?[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.(?:com|net|org|dev|io|co|me|info)[^\s,;)]*)/i;
        const standaloneMatch = portfolioMarkdown.match(standaloneUrlPattern);
        
        if (standaloneMatch && standaloneMatch[1]) {
          const url = standaloneMatch[1];
          // Exclude URLs that are part of email addresses or common services
          const excludedDomains = ['gmail.com', 'outlook.com', 'hotmail.com', 'yahoo.com', 'linkedin.com', 'github.com'];
          const urlDomain = url.toLowerCase().match(/(?:https?:\/\/)?(?:www\.)?([^\/]+)/)?.[1] || '';
          
          if (!excludedDomains.some(domain => urlDomain.includes(domain))) {
            extractedPortfolioUrl = url;
            console.log('[Tailor Resume] Extracted portfolio URL (standalone):', extractedPortfolioUrl);
          } else {
            console.log('[Tailor Resume] Skipping excluded domain:', urlDomain);
          }
        }
      }
    }

    // HYBRID APPROACH - structured fields take priority, then markdown extraction, then portfolio_data
    const fullName = structuredFullName || extractedName || portfolio?.fullName || portfolio?.name || '';
    const email = structuredEmail || extractedEmail || portfolio?.email || '';
    const linkedInUrl = structuredLinkedIn || extractedLinkedIn || portfolio?.linkedinUrl || portfolio?.linkedInUrl || '';
    let portfolioUrl = userInfo?.is_super_admin 
      ? 'www.biancastarling.com'
      : (structuredPortfolioUrl || extractedPortfolioUrl || portfolio?.websiteUrl || portfolio?.website || '');
    
    // CRITICAL VALIDATION: Prevent email domains from being used as portfolio URLs
    if (portfolioUrl) {
      const emailDomains = ['gmail.com', 'outlook.com', 'hotmail.com', 'yahoo.com', 'icloud.com', 'protonmail.com', 'aol.com'];
      const urlLower = portfolioUrl.toLowerCase();
      
      // Check if the portfolio URL is just an email domain
      for (const emailDomain of emailDomains) {
        if (urlLower === emailDomain || 
            urlLower === `https://${emailDomain}` || 
            urlLower === `http://${emailDomain}` ||
            urlLower === `www.${emailDomain}` ||
            urlLower === `https://www.${emailDomain}`) {
          console.error('[Tailor Resume] REJECTED portfolio URL - email domain detected:', portfolioUrl);
          portfolioUrl = '';
          break;
        }
      }
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

🚨🚨🚨 CRITICAL REQUIREMENT #1 - NEVER FABRICATE OR INVENT CONTENT 🚨🚨🚨

THIS IS THE MOST IMPORTANT RULE. VIOLATIONS WILL BE REJECTED.

STRICT VERIFICATION PROTOCOL:
- Before writing ANYTHING, verify it EXISTS in the candidate's data below
- If you cannot find the experience/company/project/skill in the provided data, DO NOT MENTION IT
- NEVER infer, assume, or extrapolate experiences from related fields
- NEVER add industries, domains, or experiences that are not explicitly stated

FORBIDDEN BEHAVIORS (These will cause rejection):
❌ NEVER write "healthcare experience" if candidate has no healthcare jobs
❌ NEVER write "finance background" if candidate has no finance jobs  
❌ NEVER write "education sector expertise" if candidate has no education jobs
❌ NEVER invent companies, job titles, or projects
❌ NEVER make up metrics (revenue, users, percentages) that aren't stated
❌ NEVER assume experience in an industry just because it seems related
❌ NEVER use phrases like "extensive experience in [X]" unless EXPLICITLY documented
❌ NEVER copy job requirements or desired qualifications from the job description into the resume as if the candidate has them (e.g. if the job asks for "Python" but the candidate never mentioned Python, do NOT add Python)
❌ NEVER infer skills, tools, or domains from the job posting—only use what is explicitly in the candidate's portfolio
❌ NEVER list the job posting company ("${company}") as the candidate's employer. That company is who they are APPLYING TO, not where they have worked. Every company and role in the experience section must come ONLY from the CANDIDATE PORTFOLIO below.
❌ NEVER write that the candidate is or was a "${jobTitle}" at "${company}" (or any role at the application company) unless that exact job at that company appears in their portfolio as their own past/current experience.

ONLY ALLOWED:
✅ Use experiences, companies, and projects that are EXPLICITLY listed below
✅ Use metrics and outcomes that are DIRECTLY stated in the data
✅ Describe what candidate ACTUALLY did, not what you think they might have done
✅ Write LESS content if you're unsure - accuracy over volume

VERIFICATION CHECKLIST (Apply to every sentence):
1. Is this company/role/project explicitly listed in the candidate data below? → If NO, DELETE IT
2. Is this metric/outcome directly stated in the source material? → If NO, DELETE IT  
3. Is this industry/domain explicitly mentioned in their experience? → If NO, DELETE IT
4. Can I quote the exact source of this claim from the data below? → If NO, DELETE IT

🚨🚨🚨 REMEMBER: It is BETTER to write a shorter resume with 100% accurate information than a longer resume with ANY fabricated content. 🚨🚨🚨
- If the candidate hasn't mentioned experience with a topic, DO NOT claim they have it

🚨 CRITICAL REQUIREMENT #2 - NO PLACEHOLDERS ALLOWED:
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

JOB INFORMATION (use ONLY to select relevance and ATS keywords—do NOT copy job requirements into the resume as if the candidate has them; only describe what is in the portfolio):
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
- LinkedIn: ${linkedInUrl || 'Will be included if available'}
- Portfolio URL: ${portfolioUrl || 'Will be included if available'}
- Focus ONLY on generating content sections (summary, experience, projects, skills, education)

🚨🚨🚨 FINAL VERIFICATION BEFORE RESPONDING 🚨🚨🚨

Before you return your JSON response, perform this final check:

1. Read the summary you wrote
2. For EVERY claim (company, experience, industry, achievement):
   - Can you find it EXPLICITLY in the candidate data above?
   - If not, DELETE that claim immediately
3. Check each section of content
   - Does every experience, project, achievement exist in the data above?
   - Did you invent ANY companies, metrics, or industries not explicitly stated?
4. Verify every skill you mentioned
   - Is it explicitly in the candidate's portfolio above?
   - Don't invent skills or paraphrase - use what's actually there

EXAMPLES OF FABRICATION TO AVOID:
- Candidate worked in "EdTech" → DO NOT write "extensive education sector experience"
- Candidate built "financial dashboard" → DO NOT write "finance industry background"
- Candidate worked at "health tech startup" → DO NOT write "healthcare experience"
- Job posting is for "Product Manager at Acme Corp" → DO NOT add "Product Manager at Acme Corp" or "Acme Corp" to experience unless Acme Corp is already in the candidate's portfolio as a past/current employer
- Only mention industries/domains if they are EXPLICITLY stated in job titles or descriptions

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
      "items": ["15-20 skills—ONLY from the candidate's portfolio; do NOT add skills from the job description that the candidate did not list"]
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
      8192
    );

    // Parse AI response (strip markdown code blocks, then extract JSON)
    let raw = (response.content || '').trim();
    if (raw.startsWith('```json')) {
      raw = raw.replace(/^```json\n?/, '').replace(/\n?```\s*$/, '');
    } else if (raw.startsWith('```')) {
      raw = raw.replace(/^```\n?/, '').replace(/\n?```\s*$/, '');
    }
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('[Tailor Resume] No JSON in response. First 500 chars:', raw.slice(0, 500));
      throw new Error('Invalid JSON response from AI');
    }
    let resumeData: { sections?: any[] };
    try {
      resumeData = JSON.parse(jsonMatch[0]);
    } catch (parseErr) {
      // Try to fix trailing commas (common AI mistake) and retry
      const fixed = jsonMatch[0].replace(/,(\s*[}\]])/g, '$1');
      try {
        resumeData = JSON.parse(fixed);
      } catch {
        console.error('[Tailor Resume] JSON parse error:', parseErr);
        throw new Error('AI returned invalid JSON. Please try again.');
      }
    }
    if (!resumeData || typeof resumeData !== 'object') {
      throw new Error('Invalid JSON response from AI');
    }

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
        linkedin_url: linkedInUrl,
        portfolio_url: portfolioUrl,
        status: 'draft',
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // Transform and save resume sections (sections may be missing if AI response was truncated)
    if (resumeData.sections && Array.isArray(resumeData.sections) && resumeData.sections.length > 0) {
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
    const message = error instanceof Error ? error.message : 'Failed to generate tailored resume';
    console.error('[Tailor Resume] Error:', message, error);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
