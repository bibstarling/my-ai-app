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

    console.log('[Portfolio Chat] Received request:', {
      messageLength: message?.length || 0,
      attachmentsCount: attachments?.length || 0,
      attachmentTypes: attachments?.map((a: any) => a.type) || [],
      firstAttachmentSample: attachments?.[0] ? {
        type: attachments[0].type,
        name: attachments[0].name,
        contentPreview: attachments[0].content?.substring(0, 200) || 'No content',
      } : null,
    });

    if (!message && (!attachments || attachments.length === 0)) {
      return NextResponse.json(
        { error: 'Message or attachments required' },
        { status: 400 }
      );
    }

    // If we have URL attachments but no content, return error
    if (attachments && attachments.length > 0) {
      const urlAttachment = attachments.find((a: any) => a.type === 'url');
      if (urlAttachment && (!urlAttachment.content || urlAttachment.content.length < 100)) {
        console.error('[Portfolio Chat] URL attachment has no content!', urlAttachment);
        return NextResponse.json(
          { 
            success: false,
            error: 'Website scraping may have failed. The scraped content is empty or too short.',
            message: 'Failed to extract content from the website. Please try copying and pasting the content manually.'
          },
          { status: 200 }
        );
      }
    }

    // Build context for AI - support multimodal content
    let userPrompt = message || '';
    
    // Prepare message content (text + images if any)
    const messageContent: any[] = [];
    
    if (attachments && attachments.length > 0) {
      userPrompt += '\n\n**ATTACHED MATERIALS (analyze and extract content from these):**\n';
      
      attachments.forEach((att: any, idx: number) => {
        console.log(`[Portfolio Chat] Processing attachment ${idx + 1}:`, {
          type: att.type,
          name: att.name,
          contentLength: att.content?.length || 0,
          hasText: !!att.text,
        });
        
        if (att.type === 'url') {
          userPrompt += `\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
          userPrompt += `🌐 **WEBSITE DATA (ALREADY SCRAPED)**\n`;
          userPrompt += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
          userPrompt += `${att.content}\n\n`;
          userPrompt += `⚠️ IMPORTANT: The above is REAL website content that was scraped for you.\n`;
          userPrompt += `Extract ALL professional information from it and add to the portfolio!\n`;
          userPrompt += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
        } else if (att.contentType === 'text' || att.text) {
          userPrompt += `\n📎 **${att.name}** (${att.type})\n`;
          userPrompt += `Content:\n${att.content || att.text}\n\n`;
        } else if (att.contentType === 'image') {
          userPrompt += `\n📎 **${att.name}** (Image)\n`;
          // Add image to multimodal content
          const base64Match = att.content?.match(/^data:([^;]+);base64,(.+)$/);
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
        } else {
          userPrompt += `\n📎 **${att.name}** (${att.type})\n`;
        }
      });
    }

    userPrompt += `\n\nCurrent portfolio markdown:\n\`\`\`markdown\n${currentMarkdown}\n\`\`\``;

    // Build the prompt - PUT CONTENT FIRST so AI can't miss it!
    const promptText = `${userPrompt}

════════════════════════════════════════════════════════════════

🚨 INSTRUCTIONS - READ CAREFULLY 🚨

You are a professional portfolio assistant. The content above (if any) has ALREADY been scraped/fetched for you.

**YOUR TASK:**
1. Look at the content provided above (website data, files, etc.)
2. Extract ALL professional information from it
3. Update the portfolio markdown by adding the extracted information
4. Return the COMPLETE updated markdown

**CRITICAL RULES:**
✅ The website content above is REAL DATA - not a request to scrape
✅ You HAVE the content - extract information from it NOW
✅ NEVER say "I can't access websites" - the data is RIGHT THERE above
✅ If you see "SCRAPED WEBSITE CONTENT" or "Website Content" above, process it immediately
✅ Return updated markdown with all the new information added

**Markdown Structure:**
- # Professional Profile (main title)
- ## About Me
- ## Experience  
- ## Projects
- ## Skills
- ## Education
- ## Awards & Recognition

**Response Format (JSON):**
{
  "message": "Explain what you extracted and added",
  "updatedMarkdown": "COMPLETE updated markdown with ALL new content",
  "changes": ["List specific additions like 'Added 3 experiences', 'Added 5 skills'"]
}

**If you see website/file content above: EXTRACT IT AND ADD TO MARKDOWN NOW!**`;

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

    // Log the actual prompt being sent (first 1000 chars)
    const promptPreview = typeof finalContent === 'string' 
      ? finalContent.substring(0, 1000)
      : JSON.stringify(finalContent[0]).substring(0, 1000);
    console.log('[Portfolio Chat] Sending prompt preview:', promptPreview);
    console.log('[Portfolio Chat] Total prompt length:', 
      typeof finalContent === 'string' ? finalContent.length : JSON.stringify(finalContent).length
    );

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
