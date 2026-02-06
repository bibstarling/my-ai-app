import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { getSupabaseServiceRole } from '@/lib/supabase-server';
import { generateAICompletion } from '@/lib/ai-provider';
import type { GenerateCoverLetterRequest, GenerateCoverLetterResponse } from '@/lib/types/cover-letter';
import { sendDocumentReadyEmail } from '@/lib/email';

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

    // Generate cover letter using AI with portfolio markdown
    const result = await generateCoverLetter({
      jobTitle,
      jobCompany,
      jobDescription,
      tone: body.tone || 'professional',
      recipientName: body.recipient_name,
      recipientTitle: body.recipient_title,
      portfolioMarkdown,
      userId,
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
}): Promise<CoverLetterGeneration> {

  const recipientAddress = params.recipientName 
    ? `Dear ${params.recipientName},`
    : `Dear Hiring Manager,`;

  const prompt = `You are an expert career coach writing a compelling cover letter. Analyze the job posting and candidate's portfolio markdown to create a persuasive, specific cover letter.

JOB POSTING:
Title: ${params.jobTitle}
Company: ${params.jobCompany}
Description: ${params.jobDescription.slice(0, 3000)}

CANDIDATE PORTFOLIO (Markdown):
${params.portfolioMarkdown}

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
  "openingParagraph": "<Hook that sounds like BIANCA wrote it. Use contractions. Be specific about the company. Show genuine enthusiasm. NO generic openings. Vary sentence length. Sound conversational.>",
  "bodyParagraphs": [
    "<Tell a mini-story about relevant experience. Be specific. Use contractions. Sound like a real person talking about their work. Include concrete details and outcomes.>",
    "<Describe a key project with specifics only someone who did it would know. Use metrics. Connect to their needs. Keep it conversational and energetic.>",
    "<Optional: Show cultural fit or address unique needs. Sound genuine, not researched. Make the connection feel natural.>"
  ],
  "closingParagraph": "<Close with real enthusiasm and confidence. NO formulaic 'I look forward to hearing from you.' Sound like you actually want this role. Clear but human call to action.>",
  "selectedExperiences": ["<experience title 1>", "<experience title 2>"],
  "selectedProjects": ["<project title 1>", "<project title 2>"],
  "keyPoints": ["<key selling point 1>", "<key selling point 2>", "<key selling point 3>"],
  "reasoning": "<brief explanation of content selection and strategy>"
}`;

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
    
    // Fallback
    return {
      openingParagraph: `I am writing to express my strong interest in the ${params.jobTitle} position at ${params.jobCompany}. With my background in product management and proven track record of delivering impactful results, I am excited about the opportunity to contribute to your team.`,
      bodyParagraphs: [
        `In my current role as Lead Product Manager at Skillshare, I have driven company-wide AI strategy and delivered a 25% increase in daily engagement. My experience in building AI-powered products and community-driven platforms aligns closely with the requirements of this role.`,
        `I am particularly proud of leading the ChatGPT App and AI-Native Discovery Platform project, which established the foundation for semantic search and personalized discovery. This work demonstrates my ability to translate technical capabilities into user-facing products that drive measurable business outcomes.`,
      ],
      closingParagraph: `I would welcome the opportunity to discuss how my experience in product management, AI strategy, and community growth can contribute to ${params.jobCompany}'s success. Thank you for considering my application, and I look forward to speaking with you soon.`,
      selectedExperiences: ['Lead Product Manager at Skillshare'],
      selectedProjects: ['ChatGPT App and AI-Native Discovery Platform'],
      keyPoints: ['AI Strategy', 'Product Leadership', 'Measurable Impact'],
      reasoning: 'Using default content due to AI error',
    };
  }
}
