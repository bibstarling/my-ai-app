import Anthropic from '@anthropic-ai/sdk';
import { getSupabaseServiceRole } from './supabase-server';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface PortfolioContext {
  portfolioData: any;
  recentUploads: any[];
  recentLinks: any[];
  chatHistory: any[];
}

/**
 * Build the system prompt for portfolio chat
 */
export function buildPortfolioSystemPrompt(context: PortfolioContext): string {
  return `You are a professional portfolio builder assistant. Help the user create a compelling portfolio website.

CURRENT PORTFOLIO DATA:
${JSON.stringify(context.portfolioData, null, 2)}

RECENT UPLOADS:
${context.recentUploads.map(u => `- ${u.file_name} (${u.file_type}): ${u.extracted_text?.substring(0, 200) || 'No text extracted'}`).join('\n') || 'None'}

RECENT LINKS:
${context.recentLinks.map(l => `- ${l.title || l.url}: ${l.scraped_content?.substring(0, 200) || 'Pending'}`).join('\n') || 'None'}

YOUR TASKS:
1. Understand what content the user is adding or editing
2. Extract relevant information (experiences, projects, skills, education, achievements, etc.)
3. Update the portfolio_data structure with new information
4. Provide helpful suggestions and ask clarifying questions
5. Maintain consistency with existing portfolio content

PORTFOLIO DATA STRUCTURE:
{
  "fullName": "string",
  "title": "string (job title)",
  "tagline": "string (short bio)",
  "email": "string",
  "location": "string",
  "linkedinUrl": "string",
  "githubUrl": "string",
  "websiteUrl": "string",
  "about": "string (longer bio/introduction)",
  "experiences": [
    {
      "period": "string (e.g., '2020 - 2023')",
      "title": "string",
      "company": "string",
      "location": "string",
      "description": "string",
      "skills": ["skill1", "skill2"],
      "highlights": ["highlight1", "highlight2"]
    }
  ],
  "projects": [
    {
      "id": "string",
      "title": "string",
      "company": "string",
      "cardTeaser": "string (short description for cards)",
      "outcome": "string (measurable result)",
      "tags": ["tag1", "tag2"],
      "details": [
        {
          "heading": "string (optional)",
          "paragraphs": ["paragraph1", "paragraph2"],
          "list": ["item1", "item2"]
        }
      ]
    }
  ],
  "skills": {
    "category1": ["skill1", "skill2"],
    "category2": ["skill3", "skill4"]
  },
  "education": [
    {
      "degree": "string",
      "institution": "string",
      "period": "string",
      "description": "string"
    }
  ],
  "certifications": [
    {
      "title": "string",
      "issuer": "string",
      "date": "string",
      "credentialUrl": "string"
    }
  ],
  "achievements": ["achievement1", "achievement2"],
  "articles": [
    {
      "title": "string",
      "type": "article|talk",
      "organization": "string",
      "url": "string",
      "date": "string"
    }
  ]
}

RESPONSE FORMAT:
Always respond in this JSON format:
{
  "message": "Your friendly message to the user",
  "updatedPortfolioData": { ... the updated portfolio data object ... },
  "suggestions": ["suggestion1", "suggestion2"],
  "needsMoreInfo": false or true,
  "questions": ["question1", "question2"] (if needsMoreInfo is true)
}

GUIDELINES:
- Be conversational and encouraging
- Ask clarifying questions when information is vague
- Suggest improvements to make content more impactful
- Highlight measurable outcomes and achievements
- Keep content professional but personable
- Don't make up information - ask the user if you need more details
- When user uploads files or links, incorporate that information into the portfolio data
- Preserve existing data unless explicitly asked to change it`;
}

/**
 * Get portfolio context for chat
 */
export async function getPortfolioContext(
  portfolioId: string,
  userId: string
): Promise<PortfolioContext> {
  const supabase = getSupabaseServiceRole();

  // Get portfolio data
  const { data: portfolio } = await supabase
    .from('user_portfolios')
    .select('portfolio_data')
    .eq('id', portfolioId)
    .eq('clerk_id', userId)
    .single();

  // Get recent uploads (last 10)
  const { data: uploads } = await supabase
    .from('portfolio_uploads')
    .select('*')
    .eq('portfolio_id', portfolioId)
    .order('created_at', { ascending: false })
    .limit(10);

  // Get recent links (last 10)
  const { data: links } = await supabase
    .from('portfolio_links')
    .select('*')
    .eq('portfolio_id', portfolioId)
    .order('created_at', { ascending: false })
    .limit(10);

  // Get recent chat history (last 20 messages)
  const { data: messages } = await supabase
    .from('portfolio_chat_messages')
    .select('role, content')
    .eq('portfolio_id', portfolioId)
    .order('created_at', { ascending: false })
    .limit(20);

  return {
    portfolioData: portfolio?.portfolio_data || {},
    recentUploads: uploads || [],
    recentLinks: links || [],
    chatHistory: (messages || []).reverse(), // Reverse to get chronological order
  };
}

/**
 * Process chat message with AI
 */
export async function processChatMessage(
  portfolioId: string,
  userId: string,
  userMessage: string
): Promise<{ message: string; updatedPortfolioData: any; suggestions: string[] }> {
  // Get context
  const context = await getPortfolioContext(portfolioId, userId);
  
  // Build system prompt
  const systemPrompt = buildPortfolioSystemPrompt(context);
  
  // Prepare messages for Claude
  const messages: Anthropic.MessageParam[] = [
    // Include recent chat history for context
    ...context.chatHistory.map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
    // Add current user message
    {
      role: 'user' as const,
      content: userMessage,
    },
  ];

  // Call Claude API
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    system: systemPrompt,
    messages: messages,
  });

  const responseText = response.content[0].type === 'text' 
    ? response.content[0].text 
    : '';

  // Try to parse JSON response
  let parsedResponse;
  try {
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      parsedResponse = JSON.parse(jsonMatch[0]);
    } else {
      // Fallback if not JSON formatted
      parsedResponse = {
        message: responseText,
        updatedPortfolioData: context.portfolioData,
        suggestions: [],
      };
    }
  } catch (error) {
    console.error('Error parsing AI response:', error);
    parsedResponse = {
      message: responseText,
      updatedPortfolioData: context.portfolioData,
      suggestions: [],
    };
  }

  // Save messages to database
  const supabase = getSupabaseServiceRole();
  
  await supabase.from('portfolio_chat_messages').insert([
    {
      portfolio_id: portfolioId,
      role: 'user',
      content: userMessage,
    },
    {
      portfolio_id: portfolioId,
      role: 'assistant',
      content: parsedResponse.message,
      metadata: {
        suggestions: parsedResponse.suggestions,
        hasUpdate: parsedResponse.updatedPortfolioData !== context.portfolioData,
      },
    },
  ]);

  // Update portfolio data if changed
  if (parsedResponse.updatedPortfolioData) {
    await supabase
      .from('user_portfolios')
      .update({
        portfolio_data: parsedResponse.updatedPortfolioData,
      })
      .eq('id', portfolioId);
  }

  return {
    message: parsedResponse.message,
    updatedPortfolioData: parsedResponse.updatedPortfolioData,
    suggestions: parsedResponse.suggestions || [],
  };
}
