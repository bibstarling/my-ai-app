import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getSupabaseServiceRole } from '@/lib/supabase-server';
import { portfolioData, getPortfolioSummary } from '@/lib/portfolio-data';
import type { SectionType } from '@/lib/types/resume';

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

    // Use AI to select most relevant content
    const selection = await selectRelevantContent(jobTitle, jobDescription, jobCompany);

    // Create resume
    const resumeTitle = body.resume_title || `${jobTitle} Resume`;
    const { data: resume, error: resumeError } = await supabase
      .from('resumes')
      .insert({
        clerk_id: userId,
        title: resumeTitle,
        is_primary: false,
        status: 'draft',
        full_name: portfolioData.fullName,
        email: portfolioData.email,
        location: portfolioData.location,
        linkedin_url: portfolioData.linkedinUrl,
      })
      .select()
      .single();

    if (resumeError || !resume) {
      console.error('Error creating resume:', resumeError);
      return NextResponse.json({ error: 'Failed to create resume' }, { status: 500 });
    }

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
      const exp = portfolioData.experiences[expIndex];
      if (exp) {
        // Extract bullet points from description
        const bullets = exp.description.split('. ').filter(Boolean).map(b => b.trim());
        
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
            bullets: bullets,
            highlights: exp.highlights,
          },
        });
      }
    }

    // 3. Selected Projects
    for (const projectIndex of selection.projectIndices) {
      const project = portfolioData.projects[projectIndex];
      if (project) {
        sections.push({
          resume_id: resume.id,
          section_type: 'projects' as SectionType,
          sort_order: sortOrder++,
          content: {
            name: project.title,
            description: project.cardTeaser,
            bullets: [project.outcome],
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

async function selectRelevantContent(
  jobTitle: string,
  jobDescription: string,
  jobCompany: string
): Promise<ContentSelection> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  
  if (!apiKey) {
    // Fallback: include everything
    return {
      summary: getPortfolioSummary(),
      experienceIndices: [0, 1, 2], // Top 3 experiences
      projectIndices: [0, 1, 2], // Top 3 projects
      skills: Object.values(portfolioData.skills).flat(),
      includeCertifications: true,
      reasoning: 'Using default selection (AI not configured)',
    };
  }

    const prompt = `You are an expert resume writer. Analyze the job posting and select the most relevant content from this candidate's portfolio.

JOB POSTING:
Title: ${jobTitle}
Company: ${jobCompany}
Description: ${jobDescription.slice(0, 2000)}

CANDIDATE PROFILE:
${portfolioData.tagline}
Performance Level: Exceeding High Expectations

🏆 AWARDS & RECOGNITION:
1. Agility Award Q1 2025: Recognized for resilience and resourcefulness—managing behemoth projects (Creator Hub + CMS) through organizational change, delivering creative solutions with limited resources
2. Curiosity Award Q2 2024: Recognized for AI pioneering—bringing practical innovation to drive efficiency

PM TRAITS (naturally reflect these in summary):
- Resilient through change: Adapted quickly after organizational shifts, maintained momentum on behemoth projects
- Takes on behemoths: Manages massive initiatives with ambiguity (Creator Hub + CMS simultaneously)
- Proactively anticipates: Plans ahead, moves fast when priorities shift
- Strategic thinker: Ready to champion product vision and influence roadmap
- AI pioneer: Ships practical AI products (ChatGPT App, semantic search), not just strategy
- Cross-functional force: Supports teams beyond core role with data and quick experiments
- Creative solver: Finds right-sized solutions with limited resources

CANDIDATE PORTFOLIO:

EXPERIENCES (select by index 0-${portfolioData.experiences.length - 1}):
${portfolioData.experiences.map((exp, i) => `
${i}. ${exp.title} at ${exp.company} (${exp.period})
   ${exp.description}
   Skills: ${exp.skills.join(', ')}
`).join('\n')}

PROJECTS (select by index 0-${portfolioData.projects.length - 1}):
${portfolioData.projects.map((proj, i) => `
${i}. ${proj.title}
   ${proj.cardTeaser}
   Tags: ${proj.tags.join(', ')}
`).join('\n')}

AVAILABLE SKILLS:
${Object.entries(portfolioData.skills).map(([cat, items]) => `${cat}: ${items.join(', ')}`).join('\n')}

YOUR TASK:
Select the most relevant experiences, projects, and skills for this specific job. Prioritize recent and highly relevant items. A strong resume should have 2-4 experiences, 2-3 projects, and focused skills.

CRITICAL REQUIREMENTS FOR SUMMARY (must sound genuinely human-written):

**AVOID AI DETECTION - This MUST sound like Bianca wrote it herself:**
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
  "summary": "<2-3 sentence summary that sounds like BIANCA wrote it, not AI. Use contractions. Be specific. Sound like a real person. Vary sentence length. NO generic phrases or buzzwords. Match tone to job type but keep it conversational and genuine.>",
  "experienceIndices": [<array of 2-4 most relevant experience indices>],
  "projectIndices": [<array of 2-3 most relevant project indices>],
  "skills": [<array of 10-15 most relevant skill keywords from available skills>],
  "includeCertifications": <true if certifications add value, false otherwise>,
  "reasoning": "<brief explanation of why you selected this content>"
}`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2048,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    });

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message || 'AI API error');
    }

    if (!data.content || !data.content[0]) {
      throw new Error('Unexpected AI response format');
    }

    let resultText = data.content[0].text.trim();
    
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
