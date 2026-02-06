import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import Groq from 'groq-sdk';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const user = await currentUser();
    console.log('[API Config TEST] User:', { userId: user?.id, hasUser: !!user });
    
    if (!user) {
      console.error('[API Config TEST] No user found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { provider, apiKey } = await req.json();

    if (!provider || !apiKey) {
      return NextResponse.json({ error: 'Provider and API key are required' }, { status: 400 });
    }

    // Test the connection based on provider
    let testResult = { success: false, message: '' };

    try {
      switch (provider) {
        case 'anthropic':
          const anthropic = new Anthropic({ apiKey });
          const anthropicResponse = await anthropic.messages.create({
            model: 'claude-3-haiku-20240307',
            max_tokens: 10,
            messages: [{ role: 'user', content: 'test' }],
          });
          testResult = {
            success: true,
            message: `Connected to Anthropic successfully! Model: ${anthropicResponse.model}`,
          };
          break;

        case 'openai':
          const openai = new OpenAI({ apiKey });
          const openaiResponse = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            max_tokens: 10,
            messages: [{ role: 'user', content: 'test' }],
          });
          testResult = {
            success: true,
            message: `Connected to OpenAI successfully! Model: ${openaiResponse.model}`,
          };
          break;

        case 'groq':
          const groq = new Groq({ apiKey });
          const groqResponse = await groq.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            max_tokens: 10,
            messages: [{ role: 'user', content: 'test' }],
          });
          testResult = {
            success: true,
            message: `Connected to Groq successfully! Model: ${groqResponse.model}`,
          };
          break;

        default:
          return NextResponse.json({ error: 'Invalid provider' }, { status: 400 });
      }
    } catch (error: any) {
      console.error('API test error:', error);
      
      if (error.status === 401 || error.statusCode === 401) {
        testResult = {
          success: false,
          message: 'Invalid API key. Please check your key and try again.',
        };
      } else if (error.status === 429 || error.statusCode === 429) {
        testResult = {
          success: false,
          message: 'Rate limit exceeded. Your API key is valid but you have reached the rate limit.',
        };
      } else {
        testResult = {
          success: false,
          message: `Connection failed: ${error.message || 'Unknown error'}`,
        };
      }
    }

    return NextResponse.json(testResult);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
    }, { status: 500 });
  }
}
