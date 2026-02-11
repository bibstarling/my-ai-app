import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { getSupabaseServiceRole } from '@/lib/supabase-server';
import { generateAICompletion } from '@/lib/ai-provider';
import type { GenerateCoverLetterRequest, GenerateCoverLetterResponse } from '@/lib/types/cover-letter';
import { sendDocumentReadyEmail } from '@/lib/email';
import { generateATSOptimization, getATSCoverLetterPromptInstructions } from '@/lib/ats-optimizer';

/**
 * POST /api/cover-letter/generate - Auto-generate cover letter from portfolio markdown
 */
export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: GenerateCoverLetterRequest = await req.json();
    const supabase = getSupabaseServiceRole();

    // Get user's portfolio markdown (source of truth)
    const { data: userPortfolio, error: portfolioError } = await supabase
      .from('user_portfolios')
      .select('portfolio_data, markdown')
      .eq('clerk_id', userId)
      .single();

    if (portfolioError || !userPortfolio) {
      return NextResponse.json(
        { error: 'Portfolio not found. Please create your portfolio first.' },
        { status: 404 }
      );
    }

    // For regular users, use their markdown. For super admin, get from main page
    const { data: userInfo } = await supabase
      .from('users')
      .select('is_super_admin')
      .eq('clerk_id', userId)
      .single();

    let portfolioMarkdown = userPortfolio.markdown || '';

    // Super admin should use the main page data
    if (userInfo?.is_super_admin) {
      // Import main portfolio data and convert to markdown-like format
      try {
        const { portfolioData } = await import('@/lib/portfolio-data');
        portfolioMarkdown = convertPortfolioDataToMarkdown(portfolioData);
      } catch (error) {
        console.error('Failed to load main portfolio data for super admin:', error);
      }
    }
    if (!portfolioMarkdown || portfolioMarkdown.length < 50) {
      return NextResponse.json(
        { error: 'Portfolio markdown is empty. Please add content to your portfolio first.' },
        { status: 400 }
      );
    }

    let jobTitle = body.job_title || '';
    let jobCompany = body.job_company || '';
    let jobDescription = body.job_description || '';

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

    if (!jobTitle || !jobCompany) {
      return NextResponse.json(
        { error: 'Job title and company are required' },
        { status: 400 }
      );
    }

    // Generate ATS optimization strategy
    const atsOptimization = generateATSOptimization(jobTitle, jobDescription, jobCompany);
    console.log('[Cover Letter Generate] ATS Optimization Generated:', {
      priorityTerms: atsOptimization.priorityTerms.length,
      industryContext: atsOptimization.industryContext,
    });

    // Generate cover letter using AI with portfolio markdown and ATS optimization
    const result = await generateCoverLetter({
      jobTitle,
      jobCompany,
      jobDescription,
      tone: body.tone || 'professional',
      recipientName: body.recipient_name,
      recipientTitle: body.recipient_title,
      portfolioMarkdown,
      userId,
      atsOptimization,
    });

    // Save cover letter
    const { data: coverLetter, error: insertError } = await supabase
      .from('cover_letters')
      .insert({
        clerk_id: userId,
        job_id: body.job_id || null,
        resume_id: body.resume_id || null,
        job_title: jobTitle,
        job_company: jobCompany,
        job_description: jobDescription.slice(0, 5000) || null,
        recipient_name: body.recipient_name || null,
        recipient_title: body.recipient_title || null,
        opening_paragraph: result.openingParagraph,
        body_paragraphs: result.bodyParagraphs,
        closing_paragraph: result.closingParagraph,
        status: 'draft',
        tone: body.tone || 'professional',
        selected_experiences: result.selectedExperiences,
        selected_projects: result.selectedProjects,
        key_points: result.keyPoints,
      })
      .select()
      .single();

    if (insertError || !coverLetter) {
      console.error('Error saving cover letter:', insertError);
      return NextResponse.json({ error: 'Failed to save cover letter' }, { status: 500 });
    }

    // Send email notification (async, don't wait)
    const user = await currentUser();
    const userEmail = user?.emailAddresses?.[0]?.emailAddress;
    const userName = user?.firstName || user?.username;
    
    if (userEmail) {
      sendDocumentReadyEmail({
        to: userEmail,
        userName: userName || undefined,
        documentType: 'cover-letter',
        documentTitle: `Cover Letter for ${jobTitle} at ${jobCompany}`,
        documentUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/cover-letters/${coverLetter.id}`,
      }).catch((error) => {
        console.error('Failed to send cover letter ready email:', error);
      });
    }

    return NextResponse.json({
      cover_letter: coverLetter,
      reasoning: result.reasoning,
      success: true,
    } as GenerateCoverLetterResponse);
  } catch (error) {
    console.error('POST /api/cover-letter/generate error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

type CoverLetterGeneration = {
  openingParagraph: string;
  bodyParagraphs: string[];
  closingParagraph: string;
  selectedExperiences: string[];
  selectedProjects: string[];
  keyPoints: string[];
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

async function generateCoverLetter(params: {
  jobTitle: string;
  jobCompany: string;
  jobDescription: string;
  tone: string;
  recipientName?: string;
  recipientTitle?: string;
  portfolioMarkdown: string;
  userId: string;
  atsOptimization?: any;
}): Promise<CoverLetterGeneration> {

  const recipientAddress = params.recipientName 
    ? `Dear ${params.recipientName},`
    : `Dear Hiring Manager,`;

  // Get ATS-optimized prompt instructions
  const atsInstructions = params.atsOptimization
    ? getATSCoverLetterPromptInstructions(params.atsOptimization)
    : '';

  const prompt = `You are an expert career coach with deep knowledge of modern ATS (Applicant Tracking Systems) writing a compelling cover letter. Analyze the job posting and candidate's portfolio markdown to create a persuasive, specific cover letter that passes ATS screening and engages human recruiters.

${atsInstructions}

JOB POSTING:
Title: ${params.jobTitle}
Company: ${params.jobCompany}
Description: ${params.jobDescription.slice(0, 3000)}

CANDIDATE PORTFOLIO (Markdown):
${params.portfolioMarkdown}

🚨 CRITICAL REQUIREMENT #1 - NEVER FABRICATE OR INVENT CONTENT:
- ONLY use experiences, projects, companies, and achievements that EXIST in the candidate's portfolio above
- NEVER invent or make up experiences, skills, projects, or accomplishments that aren't in the provided portfolio
- NEVER fabricate metrics, outcomes, or details that aren't explicitly stated in the source material
- If the candidate hasn't mentioned experience with something, DO NOT claim they have it
- Better to write a shorter, accurate cover letter than to invent false claims
- Every single claim must be directly traceable to information in the provided portfolio
- When in doubt about whether something is true, DON'T include it - accuracy trumps everything

🚨 CRITICAL REQUIREMENT #2 - NO PLACEHOLDERS ALLOWED:
- NEVER use placeholders like [Company Name], [Your Name], [Position], [Skills], etc.
- ALWAYS use actual data from the candidate's portfolio and the job posting provided above
- Extract the candidate's name, experiences, projects, and skills from the portfolio markdown
- The cover letter must be 100% ready to send without any edits or replacements needed
- Every detail must be filled in with real information from the provided data
- If specific information is missing, write around it naturally - don't leave brackets or placeholders

INSTRUCTIONS:
Write a compelling cover letter with this structure:

1. **Opening Paragraph**: Hook with enthusiasm and IMMEDIATELY establish credibility by naturally weaving in relevant traits/achievements. Reference something specific about the company/role that connects to the candidate's strengths.

2. **Body Paragraph 1**: Highlight most relevant experience. Pick 1-2 experiences from portfolio and explain how they directly prepare you for this role. Be specific about achievements and outcomes.

3. **Body Paragraph 2**: Showcase a key project or accomplishment that demonstrates capability. Use metrics and concrete results. Explain the "so what" - why this matters for the role you're applying to.

4. **Body Paragraph 3** (optional): Address unique requirements or show cultural fit. Demonstrate understanding of company's mission/values if mentioned in job description.

5. **Closing Paragraph**: Express enthusiasm, summarize value proposition in one sentence, and include clear call to action.

TONE: ${params.tone}

CRITICAL REQUIREMENTS - MUST SOUND HUMAN-WRITTEN (people will read this and cannot detect AI):

**AVOID AI DETECTION AT ALL COSTS:**
- NEVER use generic cover letter openings ("I am writing to express my interest in...")
- NO overly formal or stiff language - this isn't 1995
- Use contractions naturally (I'm, I've, that's, here's) - real people use them
- Vary sentence lengths - mix short punchy ones with longer, detailed ones
- Be conversational but professional - like you're talking to someone you respect
- NO buzzword soup or corporate jargon overload
- Sound enthusiastic but genuine - not fake-excited
- Use specific details that only someone who actually did the work would know
- Include personality - slight informality is MORE human

**Match tone to job type (keep it conversational):**

- **STARTUP/EARLY-STAGE**: "I take on big, messy projects and ship. When priorities shifted at Skillshare, I pivoted fast—took on Creator Hub and CMS simultaneously, kept both moving forward. That kind of chaos is where I thrive, which is why [Company]'s [specific challenge] caught my attention."

- **AI/INNOVATION**: "I build AI products that actually work. Shipped ChatGPT App, semantic search, AI classification tools—real products with measurable outcomes (25% engagement). [Company]'s approach to [specific AI area] is exactly the kind of work I want to be doing."

- **STRATEGIC/LEADERSHIP**: "I've shipped products (ChatGPT App, Community Feed), and I'm ready to lead strategy. I want to champion product vision and influence direction—not just execute someone else's plan. That's why [Company]'s focus on [specific goal] resonates with where I want to go next."

- **SCALE-UP/GROWTH**: "I'm managing Creator Hub and CMS right now—both massive initiatives—while supporting cross-functional teams with quick experiments. It's the kind of execution velocity [Company] needs as you [specific challenge]. No bottlenecks, just momentum."

**Human writing requirements:**
- Use "I'm" and "I've" not "I am" and "I have" - sounds more natural
- Mention awards naturally if relevant ("recognized for..." or just weave it in)
- Be confident but not corporate-robotic - matter-of-fact about accomplishments
- Tell mini-stories with specifics - "when X happened, I did Y, result was Z"
- Vary opening words - don't start every sentence with "I"
- Use dashes for emphasis—like this—it's conversational
- Keep paragraphs 3-4 sentences but vary the rhythm
- End with genuine enthusiasm, not formulaic "I look forward to hearing from you"
- Connection to company should feel real, not forced research

Return ONLY valid JSON in this exact format:
{
  "openingParagraph": "<Hook that sounds like THE CANDIDATE wrote it. Use contractions. Be specific about ${params.jobCompany}. Show genuine enthusiasm. NO generic openings. NO placeholders. Vary sentence length. Sound conversational. Use actual details from portfolio.>",
  "bodyParagraphs": [
    "<Tell a mini-story about relevant experience from the portfolio. Be specific. Use contractions. Sound like a real person talking about their work. Include concrete details and outcomes from their actual experience. NO placeholders.>",
    "<Describe a key project from the portfolio with specifics only someone who did it would know. Use metrics from their portfolio. Connect to ${params.jobCompany}'s needs. Keep it conversational and energetic. NO placeholders.>",
    "<Optional: Show cultural fit or address unique needs. Sound genuine, not researched. Make the connection feel natural. Use actual skills/experience from portfolio. NO placeholders.>"
  ],
  "closingParagraph": "<Close with real enthusiasm and confidence. NO formulaic 'I look forward to hearing from you.' Sound like you actually want the ${params.jobTitle} role at ${params.jobCompany}. Clear but human call to action. NO placeholders.>",
  "selectedExperiences": ["<exact experience title from portfolio>", "<exact experience title from portfolio>"],
  "selectedProjects": ["<exact project title from portfolio>", "<exact project title from portfolio>"],
  "keyPoints": ["<actual key selling point from portfolio>", "<actual key selling point from portfolio>", "<actual key selling point from portfolio>"],
  "reasoning": "<brief explanation of content selection and strategy>"
}

🚨 REMINDER: The output must be 100% ready to send. Extract the candidate's name and all details from the portfolio markdown. No [brackets], no placeholders, no TODO items. Use real data only.`;

  try {
    const aiResponse = await generateAICompletion(
      params.userId,
      'cover_letter_generate',
      'You are an expert career coach writing compelling cover letters.',
      [{ role: 'user', content: prompt }],
      3072
    );

    let resultText = aiResponse.content.trim();
    
    // Clean up markdown code blocks if present
    if (resultText.startsWith('```json')) {
      resultText = resultText.replace(/^```json\n?/, '').replace(/\n?```$/, '');
    } else if (resultText.startsWith('```')) {
      resultText = resultText.replace(/^```\n?/, '').replace(/\n?```$/, '');
    }
    
    const result = JSON.parse(resultText);

    return {
      openingParagraph: result.openingParagraph || '',
      bodyParagraphs: result.bodyParagraphs || [],
      closingParagraph: result.closingParagraph || '',
      selectedExperiences: result.selectedExperiences || [],
      selectedProjects: result.selectedProjects || [],
      keyPoints: result.keyPoints || [],
      reasoning: result.reasoning || 'AI-generated cover letter',
    };
  } catch (error) {
    console.error('Error generating cover letter:', error);
    
    // Create a basic fallback from portfolio markdown
    const portfolioLines = params.portfolioMarkdown.split('\n').filter(line => line.trim());
    const name = portfolioLines[0]?.replace(/^#\s*/, '') || 'Candidate';
    const title = portfolioLines[1]?.replace(/^##\s*/, '') || 'Professional';
    
    // Extract first experience from markdown
    const expMatch = params.portfolioMarkdown.match(/###\s*(.+?)\s+at\s+(.+?)(?:\n|$)/);
    const firstExperience = expMatch ? `${expMatch[1]} at ${expMatch[2]}` : 'my professional experience';
    
    // Extract first project from markdown
    const projectMatch = params.portfolioMarkdown.match(/##\s*Projects[\s\S]*?###\s*(.+?)(?:\n|$)/);
    const firstProject = projectMatch ? projectMatch[1] : 'key projects';
    
    // Extract skills
    const skillsMatch = params.portfolioMarkdown.match(/##\s*Skills[\s\S]*?\*\*(.+?):\*\*\s*(.+?)(?:\n|$)/);
    const skills = skillsMatch ? `${skillsMatch[1]} including ${skillsMatch[2].split(',').slice(0, 3).join(',')}` : 'relevant technical skills';
    
    // Fallback with actual user data
    return {
      openingParagraph: `I'm excited about the ${params.jobTitle} position at ${params.jobCompany}. With my background in ${title.toLowerCase()} and hands-on experience in ${skills}, I believe I can contribute meaningfully to your team.`,
      bodyParagraphs: [
        `My experience in ${firstExperience} has equipped me with the skills needed for this role. I've successfully delivered projects that align with ${params.jobCompany}'s focus, demonstrating my ability to execute effectively and drive results.`,
        `I'm particularly proud of my work on ${firstProject}, which showcases my capability to tackle complex challenges and deliver tangible outcomes. This experience has prepared me well for the responsibilities outlined in your job description.`,
      ],
      closingParagraph: `I'd welcome the opportunity to discuss how my experience and skills can contribute to ${params.jobCompany}'s continued success. I'm enthusiastic about this role and look forward to the possibility of joining your team.`,
      selectedExperiences: [firstExperience],
      selectedProjects: [firstProject],
      keyPoints: [skills, 'Problem-solving', 'Results-driven execution'],
      reasoning: 'Fallback content generated from portfolio markdown due to AI error',
    };
  }
}
