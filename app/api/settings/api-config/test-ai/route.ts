import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { generateAICompletion } from '@/lib/ai-provider';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/settings/api-config/test-ai
 * Test the AI completion with user's configured API
 */
export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[Test AI] Starting test for userId:', userId);

    // Make a simple AI completion request
    const response = await generateAICompletion(
      userId,
      'api_config_test',
      'You are a helpful assistant. Respond with EXACTLY: "API configuration is working!"',
      [{ role: 'user', content: 'Test message' }],
      50 // Small token limit for quick test
    );

    console.log('[Test AI] Response:', response);

    return NextResponse.json({
      success: true,
      message: 'AI configuration test successful!',
      provider: response.provider,
      model: response.model,
      content: response.content,
      usage: response.usage,
    });
  } catch (error: any) {
    console.error('[Test AI] Error:', error);
    return NextResponse.json({
      success: false,
      message: error.message || 'AI test failed',
      error: error.toString(),
    }, { status: 500 });
  }
}
