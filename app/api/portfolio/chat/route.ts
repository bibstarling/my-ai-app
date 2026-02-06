import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { generateAICompletionMultimodal } from '@/lib/ai-provider';

/**
 * POST /api/portfolio/chat
 * AI assistant that processes materials and updates markdown
 * Uses user's API key if configured, otherwise falls back to system API with limits
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

    // Build context for AI - support multimodal content
    let userPrompt = message || '';
    
    // Prepare message content (text + images if any)
    const messageContent: any[] = [];
    
    if (attachments && attachments.length > 0) {
      userPrompt += '\n\nI have attached the following files:\n';
      
      attachments.forEach((att: any) => {
        userPrompt += `\n- ${att.name} (${att.type})\n`;
        
        if (att.contentType === 'text') {
          userPrompt += `Content:\n${att.content}\n`;
        } else if (att.contentType === 'image') {
          // Add image to multimodal content
          const base64Match = att.content.match(/^data:([^;]+);base64,(.+)$/);
          if (base64Match) {
            messageContent.push({
              type: 'image',
              source: {
                type: 'base64',
                media_type: base64Match[1],
                data: base64Match[2],
              },
            });
          }
        }
      });
    }

    userPrompt += `\n\nCurrent portfolio markdown:\n\`\`\`markdown\n${currentMarkdown}\n\`\`\``;

    // Build the prompt
    const promptText = `You are a professional portfolio assistant helping someone build their career portfolio in markdown format.

**Your job:**
1. Analyze any materials provided (resume, documents, screenshots, etc.)
2. Extract relevant professional information (experience, projects, skills, achievements, education)
3. Update the portfolio markdown by ADDING or ENHANCING sections
4. Provide a friendly response explaining what you did

**Guidelines:**
- ALWAYS return updated markdown when the user provides materials or asks to add content
- Maintain proper markdown structure with clear heading hierarchy (# for title, ## for sections, ### for subsections)
- Add content to existing sections or create new sections as needed
- Keep existing content unless explicitly asked to remove it
- Use professional, compelling language with concrete metrics when available
- Format lists properly with bullet points (-)
- Extract and organize ALL relevant information from provided materials

**Sections to include/update:**
- ## About Me (professional summary)
- ## Experience (job history with bullets for achievements)
- ## Projects (project descriptions with outcomes)
- ## Skills (categorized technical and soft skills)
- ## Education (degrees, certifications)
- ## Awards & Recognition (achievements, honors)

**Current request:**
${userPrompt}

**IMPORTANT:** If the user provided files or information, you MUST extract content from them and update the markdown. Don't just acknowledge - actually add the content!

Respond in this JSON format:
{
  "message": "Your friendly response to the user explaining what content you extracted and added",
  "updatedMarkdown": "The COMPLETE updated markdown with new content added (return this whenever you add/update content)",
  "changes": ["specific list of what you added/changed, e.g., 'Added 3 work experiences', 'Added 5 key skills', 'Updated About section']"
}`;

    // Prepare content for API call - support multimodal (text + images)
    let finalContent;
    if (messageContent.length > 0) {
      // We have images - use multimodal format
      messageContent.unshift({
        type: 'text',
        text: promptText,
      });
      finalContent = messageContent;
    } else {
      // Text only
      finalContent = promptText;
    }

    // Use centralized AI provider (respects user's API key or uses system with limits)
    const response = await generateAICompletionMultimodal(
      userId,
      'portfolio_chat',
      finalContent,
      4096
    );

    let aiResponse;
    try {
      // Remove markdown code blocks if Claude added them
      let jsonText = response.content.trim();
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?$/g, '').trim();
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/```\n?/g, '').trim();
      }
      
      aiResponse = JSON.parse(jsonText);
    } catch (parseError) {
      console.error('Failed to parse AI response:', response.content);
      // Fallback: return AI's text as message
      aiResponse = {
        message: response.content,
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
