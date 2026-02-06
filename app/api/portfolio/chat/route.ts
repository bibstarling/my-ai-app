import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * POST /api/portfolio/chat
 * AI assistant that processes materials and updates markdown
 */
export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { message, attachments, currentMarkdown } = body;

    if (!message && (!attachments || attachments.length === 0)) {
      return NextResponse.json(
        { error: 'Message or attachments required' },
        { status: 400 }
      );
    }

    // Build context for AI
    let userPrompt = message || '';
    
    if (attachments && attachments.length > 0) {
      userPrompt += '\n\nI have attached the following files:\n';
      attachments.forEach((att: any) => {
        userPrompt += `\n- ${att.name} (${att.type})\n`;
        if (att.contentType === 'text') {
          userPrompt += `Content:\n${att.content}\n`;
        }
      });
    }

    userPrompt += `\n\nCurrent portfolio markdown:\n\`\`\`markdown\n${currentMarkdown}\n\`\`\``;

    // Call Claude to process and update markdown
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: `You are a portfolio assistant helping someone build their professional portfolio.

Your job:
1. Analyze any materials provided (resume, documents, links, etc.)
2. Extract relevant professional information
3. Update the portfolio markdown with this information
4. Provide a friendly response explaining what you did

Guidelines:
- Keep the markdown format consistent
- Add new content in appropriate sections
- Don't remove existing content unless explicitly asked
- Use professional, compelling language
- Include metrics and achievements when available

Current request:
${userPrompt}

Respond in this JSON format:
{
  "message": "Your friendly response to the user explaining what you did",
  "updatedMarkdown": "The updated markdown with new content added (ONLY include if you made changes)",
  "changes": ["list of changes you made"]
}`,
        },
      ],
    });

    const content = response.content[0];
    if (!content || content.type !== 'text') {
      throw new Error('No text response from AI');
    }

    let aiResponse;
    try {
      // Remove markdown code blocks if Claude added them
      let jsonText = content.text.trim();
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?$/g, '').trim();
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/```\n?/g, '').trim();
      }
      
      aiResponse = JSON.parse(jsonText);
    } catch (parseError) {
      console.error('Failed to parse AI response:', content.text);
      // Fallback: return AI's text as message
      aiResponse = {
        message: content.text,
        updatedMarkdown: null,
      };
    }

    return NextResponse.json({
      success: true,
      message: aiResponse.message,
      updatedMarkdown: aiResponse.updatedMarkdown || null,
      changes: aiResponse.changes || [],
    });
  } catch (error) {
    console.error('POST /api/portfolio/chat error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
