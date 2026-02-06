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
    const { message, context } = body;

    if (!message) {
      return NextResponse.json(
        { error: 'Message required' },
        { status: 400 }
      );
    }

    // Build the AI prompt with action detection
    const systemPrompt = `You are an AI Career Assistant integrated into Applause, a career platform. You help users with job searching, resume building, cover letter writing, profile management, and career advice.

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

**Current Context:**
- User is on: ${context?.currentPath || 'unknown'}
- Previous context: ${context?.previousMessages?.map((m: any) => `${m.role}: ${m.content}`).join('\n') || 'none'}

**User's Request:**
${message}

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
- For general questions, provide helpful career advice without actions
- Keep responses concise but informative`;

    // Call AI with centralized provider
    const response = await generateAICompletionMultimodal(
      userId,
      'global_assistant',
      systemPrompt,
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
