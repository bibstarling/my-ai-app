import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { generateAICompletionMultimodal } from '@/lib/ai-provider';

/**
 * POST /api/assistant/global
 * Global AI assistant that can perform actions across the platform
 */
export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { message, attachments, context } = body;

    if (!message && (!attachments || attachments.length === 0)) {
      return NextResponse.json(
        { error: 'Message or attachments required' },
        { status: 400 }
      );
    }

    // Build the AI prompt with action detection
    const systemPrompt = `You are an AI Career Assistant integrated into Applause, a career platform. You help users with job searching, resume building, cover letter writing, profile management, and career advice.

**IMPORTANT: You have the ability to scrape and fetch data from websites!** When a user provides a URL or asks you to fetch/scrape/extract/analyze content from a website, you MUST use the scrape_url action. Do NOT tell the user you cannot access websites.

**Available Actions:**
You can trigger these actions by responding with JSON that includes an "action" field:

1. **Navigate**: Direct user to a specific page
   - Job Search: { "type": "navigate", "path": "/assistant/job-search", "label": "Job Search" }
   - Dashboard: { "type": "navigate", "path": "/dashboard", "label": "Dashboard" }
   - Resume Builder: { "type": "navigate", "path": "/resume-builder", "label": "Resume Builder" }
   - Cover Letters: { "type": "navigate", "path": "/cover-letters", "label": "Cover Letters" }
   - Profile: { "type": "navigate", "path": "/portfolio/builder", "label": "Profile" }

2. **Search Jobs**: Search for jobs with a query
   - { "type": "search_jobs", "query": "remote React developer" }

3. **Generate Resume**: Start resume generation
   - { "type": "generate_resume" }

4. **Create Job Tracking**: Add a job to pipeline (future)
   - { "type": "create_job", "jobData": {...} }

5. **Scrape URL**: Extract and fetch content from ANY website URL
   - { "type": "scrape_url", "url": "https://example.com" }
   - **USE THIS** when users:
     * Provide a URL and ask you to fetch/scrape/extract/analyze it
     * Ask "What's on this website?" with a URL
     * Ask you to get information from a specific website
     * Want to add content from a website to their profile
   - You CAN access websites - this is a core capability!

**Current Context:**
- User is on: ${context?.currentPath || 'unknown'}
- Previous context: ${context?.previousMessages?.map((m: any) => `${m.role}: ${m.content}`).join('\n') || 'none'}

${attachments && attachments.length > 0 ? `**Attached Files:**
${attachments.map((att: any) => `- ${att.name} (${att.type}): ${att.content || att.text || 'Binary file'}`).join('\n')}
` : ''}

**User's Request:**
${message || 'Analyze the attached files'}

**Response Format:**
Respond with a JSON object:
{
  "message": "Your friendly response to the user",
  "action": { ... } // ONLY if you're taking an action, otherwise omit this field
}

**Guidelines:**
- Be helpful, friendly, and conversational
- If user asks to search/find jobs, use search_jobs action
- If user asks to create/generate resume or cover letter, use navigate to appropriate page
- If user asks to add/track a job, acknowledge and explain the feature
- **CRITICAL**: If user provides a URL or asks to fetch/scrape/extract/analyze a website, ALWAYS use scrape_url action
  - DO NOT say you cannot access websites
  - DO NOT say you need permission to access URLs
  - You HAVE the ability to scrape websites - use it!
- If files are attached, analyze them and extract relevant information (resume, job posting, certificates, etc.)
- For general questions, provide helpful career advice without actions
- Keep responses concise but informative
- When you trigger an action, acknowledge it in your message (e.g., "I'll fetch that website for you...")`;

    // Prepare content for multimodal AI (text + attachments)
    let aiContent: string | any[] = systemPrompt;
    
    // If attachments are present, build multimodal content
    if (attachments && attachments.length > 0) {
      const contentParts: any[] = [
        { type: 'text', text: systemPrompt }
      ];
      
      for (const attachment of attachments) {
        if (attachment.contentType?.startsWith('image/')) {
          // Image attachment
          contentParts.push({
            type: 'image',
            source: {
              type: 'base64',
              media_type: attachment.contentType as any,
              data: attachment.content.split(',')[1] || attachment.content, // Remove data:image prefix if present
            }
          });
        } else if (attachment.text || attachment.content) {
          // Text-based attachment (PDF, resume, etc.)
          contentParts.push({
            type: 'text',
            text: `\n\n--- File: ${attachment.name} (${attachment.type}) ---\n${attachment.text || attachment.content}\n--- End of ${attachment.name} ---`,
          });
        }
      }
      
      aiContent = contentParts;
    }

    // Call AI with centralized provider
    const response = await generateAICompletionMultimodal(
      userId,
      'global_assistant',
      aiContent,
      2048
    );

    // Parse AI response
    let aiResponse;
    try {
      // Remove markdown code blocks if present
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
      };
    }

    return NextResponse.json({
      success: true,
      message: aiResponse.message,
      action: aiResponse.action || null,
    });
  } catch (error) {
    console.error('POST /api/assistant/global error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
