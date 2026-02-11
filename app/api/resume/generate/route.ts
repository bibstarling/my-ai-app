import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { getSupabaseServiceRole } from '@/lib/supabase-server';
import { portfolioData, getPortfolioSummary } from '@/lib/portfolio-data';
import type { SectionType } from '@/lib/types/resume';
import { sendDocumentReadyEmail } from '@/lib/email';
import { generateAICompletion } from '@/lib/ai-provider';
import { generateATSOptimization, getATSResumePromptInstructions } from '@/lib/ats-optimizer';

type GenerateRequest = {
  job_id?: string;
  job_title?: string;
  job_description?: string;
  resume_title?: string;
};

/**
 * POST /api/resume/generate - Auto-generate resume from portfolio data tailored to a job
 */
export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: GenerateRequest = await req.json();
    const supabase = getSupabaseServiceRole();

    let jobTitle = body.job_title || '';
    let jobDescription = body.job_description || '';
    let jobCompany = '';

    // If job_id is provided, fetch job details
    if (body.job_id) {
      const { data: job, error: jobError } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', body.job_id)
        .single();

      if (job && !jobError) {
        jobTitle = job.title;
        jobCompany = job.company_name;
        jobDescription = job.description_text || '';
      }
    }

    if (!jobTitle && !jobDescription) {
      return NextResponse.json(
        { error: 'Either job_id or job details (title, description) required' },
        { status: 400 }
      );
    }

    // Get user's job profile (from job intelligence platform)
    const { data: jobProfile } = await supabase
      .from('user_job_profiles')
      .select('*')
      .eq('clerk_id', userId)
      .maybeSingle();

    // Get user's portfolio data and markdown including structured contact fields
    const { data: userPortfolio } = await supabase
      .from('user_portfolios')
      .select('portfolio_data, markdown, include_portfolio_link, full_name, email, linkedin_url, portfolio_url')
      .eq('clerk_id', userId)
      .maybeSingle();

    const { data: userInfo } = await supabase
      .from('users')
      .select('username, is_super_admin')
      .eq('clerk_id', userId)
      .maybeSingle();

    const isSuperAdmin = userInfo?.is_super_admin || false;

    // Determine which data to use
    let portfolioInfo = userPortfolio?.portfolio_data || portfolioData;
    let portfolioMarkdown = userPortfolio?.markdown || '';

    // Super admin should use the main page data
    if (isSuperAdmin) {
      portfolioInfo = portfolioData;
      portfolioMarkdown = convertPortfolioDataToMarkdown(portfolioData);
    }

    // Use platform profile (portfolio) as primary source for resume generation
    // Job profile only contains preferences (skills, titles, etc.), not resume text
    let profileResumeText = '';
    if (portfolioMarkdown) {
      profileResumeText = portfolioMarkdown;
      console.log('[Resume Generate] Using platform profile (portfolio) as resume source');
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
    
    // Parse contact info from markdown (used as fallback if structured fields not set)
    let extractedName = null;
    let extractedEmail = null;
    let extractedLinkedIn = null;
    let extractedPortfolioUrl = null;

    if (portfolioMarkdown) {
      // Extract name from first heading
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
          console.log('[Resume Generate] Ignoring generic placeholder name:', extractedName);
          extractedName = null;
        }
      }
      
      // Extract email
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
        console.log('[Resume Generate] Extracted portfolio URL (labeled):', extractedPortfolioUrl);
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
            console.log('[Resume Generate] Extracted portfolio URL (standalone):', extractedPortfolioUrl);
          } else {
            console.log('[Resume Generate] Skipping excluded domain:', urlDomain);
          }
        }
      }
    }

    // ALWAYS include portfolio URL if available (non-negotiable)
    // HYBRID approach - structured field takes priority
    let portfolioUrl = null;
    if (userInfo?.is_super_admin) {
      portfolioUrl = 'www.biancastarling.com';
    } else {
      portfolioUrl = 
        structuredPortfolioUrl ||  // ✅ Structured field (highest priority)
        extractedPortfolioUrl ||    // ✅ Markdown extraction (second priority)
        portfolioInfo?.websiteUrl || 
        portfolioInfo?.website || 
        portfolioInfo?.portfolio_url ||
        portfolioInfo?.portfolioUrl ||
        userPortfolio?.portfolio_data?.websiteUrl || 
        userPortfolio?.portfolio_data?.website ||
        userPortfolio?.portfolio_data?.portfolio_url ||
        userPortfolio?.portfolio_data?.portfolioUrl ||
        null;
    }
    
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
          console.error('[Resume Generate] REJECTED portfolio URL - email domain detected:', portfolioUrl);
          portfolioUrl = null;
          break;
        }
      }
    }

    // HYBRID APPROACH - structured fields take priority, then markdown extraction, then portfolio_data
    const fullName = structuredFullName || extractedName || portfolioInfo?.fullName || portfolioData.fullName;
    const email = structuredEmail || extractedEmail || portfolioInfo?.email || portfolioData.email;
    const linkedInUrl = structuredLinkedIn || extractedLinkedIn || portfolioInfo?.linkedinUrl || portfolioInfo?.linkedInUrl || portfolioData.linkedinUrl || null;
    
    console.log('[Resume Generate] Contact info extracted (HYBRID approach):', {
      fullName,
      email,
      linkedInUrl,
      portfolioUrl,
      fromStructuredFields: !!(structuredFullName || structuredEmail || structuredLinkedIn || structuredPortfolioUrl),
      fromMarkdown: !!(extractedName || extractedEmail || extractedLinkedIn || extractedPortfolioUrl),
      fromPortfolioData: !!(portfolioInfo?.fullName),
    });

    // Generate ATS optimization strategy
    const atsOptimization = generateATSOptimization(jobTitle, jobDescription, jobCompany);
    console.log('[Resume Generate] ATS Optimization Generated:', {
      priorityTerms: atsOptimization.priorityTerms.length,
      industryContext: atsOptimization.industryContext,
    });

    // Use AI to select most relevant content from user's portfolio and job profile
    const selection = await selectRelevantContent(
      jobTitle, 
      jobDescription, 
      jobCompany, 
      userId, 
      portfolioInfo, 
      portfolioMarkdown,
      profileResumeText,
      jobProfile,
      atsOptimization,
      fullName,
      email,
      linkedInUrl,
      portfolioUrl
    );

    // Create resume
    const resumeTitle = body.resume_title || `${jobTitle} Resume`;
    const { data: resume, error: resumeError } = await supabase
      .from('resumes')
      .insert({
        clerk_id: userId,
        title: resumeTitle,
        is_primary: false,
        status: 'draft',
        full_name: fullName,
        email: email,
        location: portfolioInfo.location || portfolioData.location,
        linkedin_url: linkedInUrl,
        portfolio_url: portfolioUrl,
      })
      .select()
      .single();

    if (resumeError || !resume) {
      console.error('Error creating resume:', resumeError);
      return NextResponse.json({ error: 'Failed to create resume' }, { status: 500 });
    }
    
    console.log('[Resume Generate] Resume created successfully:', {
      resumeId: resume.id,
      portfolioUrlSaved: resume.portfolio_url,
      portfolioUrlInput: portfolioUrl,
    });

    // Add sections based on AI selection
    const sections = [];
    let sortOrder = 0;

    // 1. Professional Summary (tailored)
    if (selection.summary) {
      sections.push({
        resume_id: resume.id,
        section_type: 'summary' as SectionType,
        sort_order: sortOrder++,
        content: { text: selection.summary },
      });
    }

    // 2. Selected Experiences
    for (const expIndex of selection.experienceIndices) {
      const exp = portfolioInfo.experiences?.[expIndex];
      if (exp) {
        // Create comprehensive bullet points from description and highlights
        const bullets = [];
        
        // Add highlights first (these are typically achievement-oriented)
        if (exp.highlights && Array.isArray(exp.highlights) && exp.highlights.length > 0) {
          bullets.push(...exp.highlights);
        }
        
        // If we don't have enough bullets, extract from description
        if (bullets.length < 3 && exp.description) {
          const descriptionBullets = exp.description
            .split(/[.!]\s+/)
            .filter(Boolean)
            .map((b: string) => b.trim())
            .filter((b: string) => b.length > 20); // Only meaningful sentences
          
          bullets.push(...descriptionBullets);
        }
        
        // Ensure we have at least 3 bullets for a strong resume
        const finalBullets = bullets.slice(0, 6); // Cap at 6 bullets per experience
        
        sections.push({
          resume_id: resume.id,
          section_type: 'experience' as SectionType,
          sort_order: sortOrder++,
          content: {
            position: exp.title,
            company: exp.company,
            location: exp.location,
            startDate: exp.period.split('—')[0]?.trim() || '',
            endDate: exp.period.split('—')[1]?.trim() || 'Present',
            bullets: finalBullets,
          },
        });
      }
    }

    // 3. Selected Projects
    for (const projectIndex of selection.projectIndices) {
      const project = portfolioInfo.projects?.[projectIndex];
      if (project) {
        // Create detailed project bullets
        const projectBullets = [];
        
        // Add outcome as first bullet
        if (project.outcome) {
          projectBullets.push(project.outcome);
        }
        
        // Add description if available and different from outcome
        if (project.cardTeaser && project.cardTeaser !== project.outcome) {
          projectBullets.push(project.cardTeaser);
        }
        
        // Add full description split into bullets if available
        if (project.fullDescription) {
          const descBullets = project.fullDescription
            .split(/[.!]\s+/)
            .filter(Boolean)
            .map((b: string) => b.trim())
            .filter((b: string) => b.length > 20)
            .slice(0, 2); // Add up to 2 more bullets
          projectBullets.push(...descBullets);
        }
        
        sections.push({
          resume_id: resume.id,
          section_type: 'projects' as SectionType,
          sort_order: sortOrder++,
          content: {
            name: project.title,
            description: project.cardTeaser,
            bullets: projectBullets.length > 0 ? projectBullets : [project.cardTeaser || project.title],
            technologies: project.tags,
          },
        });
      }
    }

    // 4. Relevant Skills
    if (selection.skills && selection.skills.length > 0) {
      const skillCategories = Object.entries(portfolioData.skills);
      for (const [category, items] of skillCategories) {
        // Filter to only relevant skills
        const relevantSkills = items.filter(skill => 
          selection.skills.some(s => skill.toLowerCase().includes(s.toLowerCase()) || s.toLowerCase().includes(skill.toLowerCase()))
        );
        
        if (relevantSkills.length > 0) {
          sections.push({
            resume_id: resume.id,
            section_type: 'skills' as SectionType,
            sort_order: sortOrder++,
            content: {
              category: category.charAt(0).toUpperCase() + category.slice(1),
              items: relevantSkills,
            },
          });
        }
      }
    }

    // 5. Education
    for (const edu of portfolioData.education) {
      sections.push({
        resume_id: resume.id,
        section_type: 'education' as SectionType,
        sort_order: sortOrder++,
        content: {
          degree: edu.degree,
          institution: edu.institution,
          year: edu.year,
        },
      });
    }

    // 6. Certifications (if relevant)
    if (selection.includeCertifications) {
      for (const cert of portfolioData.certifications) {
        sections.push({
          resume_id: resume.id,
          section_type: 'certifications' as SectionType,
          sort_order: sortOrder++,
          content: {
            name: cert.name,
            issuer: cert.issuer,
          },
        });
      }
    }

    // Insert all sections
    const { error: sectionsError } = await supabase
      .from('resume_sections')
      .insert(sections);

    if (sectionsError) {
      console.error('Error creating sections:', sectionsError);
      return NextResponse.json({ error: 'Failed to create resume sections' }, { status: 500 });
    }

    // Return resume with sections
    const { data: fullResume } = await supabase
      .from('resumes')
      .select('*')
      .eq('id', resume.id)
      .single();

    const { data: resumeSections } = await supabase
      .from('resume_sections')
      .select('*')
      .eq('resume_id', resume.id)
      .order('sort_order', { ascending: true });

    // Send email notification (async, don't wait)
    const user = await currentUser();
    const userEmail = user?.emailAddresses?.[0]?.emailAddress;
    const userName = user?.firstName || user?.username;
    
    if (userEmail) {
      sendDocumentReadyEmail({
        to: userEmail,
        userName: userName || undefined,
        documentType: 'resume',
        documentTitle: resume.title || `Resume for ${jobTitle || 'Job Application'}`,
        documentUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/resume-builder/${resume.id}`,
      }).catch((error) => {
        console.error('Failed to send resume ready email:', error);
      });
    }

    return NextResponse.json({
      resume: {
        ...fullResume,
        sections: resumeSections || [],
      },
      selection_reasoning: selection.reasoning,
    });
  } catch (error) {
    console.error('POST /api/resume/generate error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

type ContentSelection = {
  summary: string;
  experienceIndices: number[];
  projectIndices: number[];
  skills: string[];
  includeCertifications: boolean;
  reasoning: string;
};

// Helper function to convert structured portfolio data to markdown format
function convertPortfolioDataToMarkdown(portfolioData: any): string {
  let markdown = `# ${portfolioData.fullName}\n\n`;
  markdown += `## ${portfolioData.title}\n\n`;
  markdown += `${portfolioData.tagline}\n\n`;
  
  if (portfolioData.about) {
    markdown += `## About Me\n\n${portfolioData.about}\n\n`;
  }

  if (portfolioData.experiences && portfolioData.experiences.length > 0) {
    markdown += `## Experience\n\n`;
    portfolioData.experiences.forEach((exp: any) => {
      markdown += `### ${exp.title} at ${exp.company}\n`;
      markdown += `*${exp.period}* | ${exp.location}\n\n`;
      markdown += `${exp.description}\n\n`;
      if (exp.highlights && exp.highlights.length > 0) {
        exp.highlights.forEach((highlight: string) => {
          markdown += `- ${highlight}\n`;
        });
        markdown += `\n`;
      }
    });
  }

  if (portfolioData.projects && portfolioData.projects.length > 0) {
    markdown += `## Projects\n\n`;
    portfolioData.projects.forEach((project: any) => {
      markdown += `### ${project.title}\n\n`;
      markdown += `${project.cardTeaser}\n\n`;
      markdown += `**Outcome:** ${project.outcome}\n\n`;
    });
  }

  if (portfolioData.skills) {
    markdown += `## Skills\n\n`;
    Object.entries(portfolioData.skills).forEach(([category, items]: [string, any]) => {
      markdown += `**${category.charAt(0).toUpperCase() + category.slice(1)}:** ${items.join(', ')}\n\n`;
    });
  }

  if (portfolioData.awards && portfolioData.awards.length > 0) {
    markdown += `## Awards & Recognition\n\n`;
    portfolioData.awards.forEach((award: any) => {
      markdown += `- **${award.title}** (${award.quarter}): ${award.description}\n`;
    });
    markdown += `\n`;
  }

  return markdown;
}

async function selectRelevantContent(
  jobTitle: string,
  jobDescription: string,
  jobCompany: string,
  userId: string,
  portfolioInfo: any,
  portfolioMarkdown: string,
  profileResumeText: string = '',
  jobProfile: any = null,
  atsOptimization: any = null,
  fullName: string = '',
  email: string = '',
  linkedInUrl: string | null = null,
  portfolioUrl: string | null = null
): Promise<ContentSelection> {

    const awardsText = portfolioInfo.awards?.map((a: any, i: number) => 
      `${i+1}. ${a.title} ${a.quarter}: ${a.description}`
    ).join('\n') || '';

    // Build comprehensive candidate info
    let candidateProfileSection = '';
    
    if (profileResumeText) {
      candidateProfileSection = `CANDIDATE RESUME (Primary Source - Use This First):
${profileResumeText.slice(0, 5000)}

${jobProfile?.skills?.length > 0 ? `\n🔧 KEY SKILLS FROM PROFILE:\n${jobProfile.skills.join(', ')}\n` : ''}
${jobProfile?.target_titles?.length > 0 ? `\n🎯 TARGET ROLES:\n${jobProfile.target_titles.join(', ')}\n` : ''}
${jobProfile?.seniority ? `\n📊 SENIORITY LEVEL: ${jobProfile.seniority}\n` : ''}

`;
    }

    candidateProfileSection += `CANDIDATE PROFESSIONAL PROFILE (Markdown):
${portfolioMarkdown}

${awardsText ? `🏆 AWARDS & RECOGNITION:\n${awardsText}\n` : ''}`;

    // Get ATS-optimized prompt instructions
    const atsInstructions = atsOptimization 
      ? getATSResumePromptInstructions(atsOptimization)
      : '';

    const prompt = `You are an expert resume writer with deep knowledge of modern ATS (Applicant Tracking Systems). Analyze the job posting and select the most relevant content from this candidate's profile and portfolio.

${atsInstructions}

🚨 CRITICAL REQUIREMENT #1 - NEVER FABRICATE OR INVENT CONTENT:
- ONLY use information that EXISTS in the candidate's portfolio/profile/resume provided below
- NEVER invent experiences, companies, projects, skills, or achievements that aren't in the provided data
- NEVER make up metrics, outcomes, or details that aren't explicitly stated in the source material
- If information about something doesn't exist in the provided data, DO NOT write about it
- Better to write LESS content than to fabricate ANYTHING
- Every single claim must be directly traceable to the provided portfolio/profile data
- When in doubt, DON'T include it - accuracy is more important than volume

🚨 CRITICAL REQUIREMENT #2 - NO PLACEHOLDERS ALLOWED:
- NEVER use placeholders like [Company Name], [Your Name], [Skills], [Metric], etc.
- NEVER generate generic text like "Your Name", "Your Email", or placeholder contact information
- ALWAYS use actual data from the candidate's portfolio and profile provided below
- Extract real experiences, projects, skills, and achievements from the candidate's actual data
- The resume summary must be 100% ready to use without any edits or replacements needed
- Every detail must be filled in with real information from the provided data
- If specific metrics are missing, describe achievements qualitatively - don't leave brackets or placeholders

📌 CONTACT INFORMATION - ALREADY HANDLED:
- DO NOT include contact information (name, email, phone, location, LinkedIn, portfolio) in your response
- Contact information is AUTOMATICALLY extracted and populated in the resume header
- Candidate's full name: ${fullName}
- Candidate's email: ${email}
- LinkedIn: ${linkedInUrl || 'Will be included if available'}
- Portfolio URL: ${portfolioUrl || 'Will be included if available'}
- Your job is ONLY to generate the content sections (summary, experience, projects, skills, education)
- Focus on creating compelling content - contact details are handled separately

JOB POSTING:
Title: ${jobTitle}
Company: ${jobCompany}
Description: ${jobDescription.slice(0, 2000)}

${candidateProfileSection}

CANDIDATE PORTFOLIO (Structured Data for Selection):

EXPERIENCES (select by index 0-${(portfolioInfo.experiences?.length || 0) - 1}):
${(portfolioInfo.experiences || []).map((exp: any, i: number) => `
${i}. ${exp.title} at ${exp.company} (${exp.period})
   ${exp.description}
   Skills: ${exp.skills?.join(', ') || ''}
`).join('\n')}

PROJECTS (select by index 0-${(portfolioInfo.projects?.length || 0) - 1}):
${(portfolioInfo.projects || []).map((proj: any, i: number) => `
${i}. ${proj.title}
   ${proj.cardTeaser}
   Tags: ${proj.tags?.join(', ') || ''}
`).join('\n')}

AVAILABLE SKILLS:
${Object.entries(portfolioInfo.skills || {}).map(([cat, items]) => `${cat}: ${Array.isArray(items) ? items.join(', ') : ''}`).join('\n')}

YOUR TASK:
${profileResumeText ? 'IMPORTANT: The candidate has provided their resume text above. Use this as your PRIMARY SOURCE for understanding their background, experience, and achievements. Extract relevant experiences and skills from their actual resume first, then supplement with portfolio data if needed.' : 'Select the most relevant experiences, projects, and skills for this specific job from the portfolio data.'} 

Prioritize recent and highly relevant items. Create a COMPREHENSIVE, DETAILED resume:
- Select 3-5 most relevant experiences (prefer more if highly relevant)
- Include 2-4 key projects that demonstrate capabilities
- Each experience should showcase 4-6 achievement bullets with specific metrics and outcomes
- Projects should have 2-3 detailed bullets explaining impact and technologies used
- Skills section should be comprehensive but focused on job requirements

CRITICAL REQUIREMENTS FOR SUMMARY (ATS-Optimized + Human-Written):

**ATS OPTIMIZATION FOR SUMMARY (HIGHEST PRIORITY):**
- MUST include 4-6 priority keywords from the ATS optimization above naturally
- Use EXACT terminology from job description (not paraphrased)
- Include both spelled-out terms AND acronyms when relevant
- First 2 sentences are CRITICAL for ATS scanning - pack with relevant keywords
- Balance keyword density with natural flow - aim for 0.76+ semantic alignment score

**AVOID AI DETECTION - This MUST sound like the candidate wrote it:**
- NO generic resume phrases ("results-driven professional," "proven track record," "dynamic leader")
- NO overly polished or corporate-speak language
- Use contractions naturally (I've, I'm, that's) - real people use them
- Vary sentence structure - mix short punchy sentences with longer ones
- Be specific and concrete - use real project names, real numbers
- Sound conversational but professional - like talking to a colleague
- NO buzzword overload - pick 2-3 key strengths, not 10
- Write in active voice with energy and personality

**Match tone to job type (but keep it human):**

- For STARTUP/EARLY-STAGE: "I take on massive, ambiguous projects and ship. When priorities shifted, I pivoted fast to manage Creator Hub and CMS simultaneously—both behemoth initiatives—without dropping momentum. That's what I do."

- For AI/INNOVATION: "I build AI products that actually work. Shipped the ChatGPT App, semantic search infrastructure, AI classification tools—products with real outcomes, like 25% engagement increases. Not just strategy decks."

- For STRATEGIC/LEADERSHIP: "I ship products (ChatGPT App, Community Feed) and I'm ready to lead strategy. I want to champion product vision and influence where we're going next, not just execute someone else's roadmap."

- For SCALE-UP/GROWTH: "I'm managing Creator Hub and CMS simultaneously right now while supporting cross-functional teams with data and quick experiments. Multiple big initiatives without creating bottlenecks—that's my baseline."

**Human writing rules:**
- Lead with specific impact (25% engagement, 200% revenue, 500+ schools)
- Mention awards naturally if relevant (recognized for resilience/resourcefulness, AI innovation)
- Sound confident but not arrogant - matter-of-fact about capabilities
- Use "I" statements - this is a person, not a company
- Be direct and specific - no fluff or filler
- Vary word choice - don't repeat the same phrases

Return ONLY valid JSON in this exact format:
{
  "summary": "<3-4 sentence summary that is ATS-OPTIMIZED with 4-6 priority keywords AND sounds like THE CANDIDATE wrote it, not AI. Use contractions. Be SPECIFIC using ACTUAL experiences and achievements with REAL METRICS from the portfolio. Sound like a real person. Vary sentence length. NO generic phrases or buzzwords. Match tone to ${jobTitle} at ${jobCompany} but keep it conversational and genuine. NO placeholders - use real data only. MUST include priority keywords naturally. Example: 'I've shipped 3 major AI products including ChatGPT App (500K+ users) and semantic search that increased engagement by 25%. Currently managing Creator Hub and CMS simultaneously—handling multiple behemoth initiatives is my baseline.'>",
  "experienceIndices": [<array of 3-5 most relevant experience indices from the list above - prefer MORE experiences if they're relevant>],
  "projectIndices": [<array of 2-4 most relevant project indices from the list above - include projects that demonstrate technical depth or impact>],
  "skills": [<array of 12-20 actual skill keywords from the available skills list above - PRIORITIZE skills that match ATS priority keywords - use exact terms from candidate's portfolio - be comprehensive>],
  "includeCertifications": <true if certifications add value, false otherwise>,
  "reasoning": "<detailed explanation of why you selected this content, how it aligns with job requirements, and your ATS keyword strategy for maximum impact>",
  "atsKeywordsUsed": [<array of priority keywords from ATS optimization that were successfully integrated into the summary>]
}

🚨 REMINDER: The summary must be 100% ready to use. Extract real experiences, projects, and skills from the candidate's portfolio. No [brackets], no placeholders, no generic statements. Use actual achievements with real specifics from the portfolio data provided above.`;

  try {
    const response = await generateAICompletion(
      userId,
      'resume_generation',
      'You are an expert resume writer. Analyze job postings and select relevant content from candidate portfolios.',
      [{ role: 'user', content: prompt }],
      2048
    );

    let resultText = response.content.trim();
    
    // Clean up markdown code blocks if present
    if (resultText.startsWith('```json')) {
      resultText = resultText.replace(/^```json\n?/, '').replace(/\n?```$/, '');
    } else if (resultText.startsWith('```')) {
      resultText = resultText.replace(/^```\n?/, '').replace(/\n?```$/, '');
    }
    
    const selection = JSON.parse(resultText);

    return {
      summary: selection.summary || getPortfolioSummary(),
      experienceIndices: selection.experienceIndices || [0, 1, 2],
      projectIndices: selection.projectIndices || [0, 1, 2],
      skills: selection.skills || [],
      includeCertifications: selection.includeCertifications ?? true,
      reasoning: selection.reasoning || 'AI-selected relevant content',
    };
  } catch (error) {
    console.error('Error calling AI for content selection:', error);
    
    // Fallback
    return {
      summary: getPortfolioSummary(),
      experienceIndices: [0, 1, 2],
      projectIndices: [0, 1, 2],
      skills: Object.values(portfolioData.skills).flat().slice(0, 15),
      includeCertifications: true,
      reasoning: 'Using default selection due to AI error',
    };
  }
}
