import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import Groq from 'groq-sdk';
import jwt from 'jsonwebtoken';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const authData = await auth();
    const user = await currentUser();
    
    // Try to get token from Authorization header
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    console.log('[API Config TEST] Auth methods:', { 
      authUserId: authData?.userId, 
      currentUserId: user?.id, 
      hasToken: !!token,
      authHeader: authHeader?.substring(0, 20)
    });
    
    let userId = authData?.userId || user?.id;
    
    // If we have a token but no userId, decode it to get the user ID
    if (!userId && token) {
      try {
        const decoded = jwt.decode(token) as any;
        userId = decoded?.sub;
        console.log('[API Config TEST] Decoded token, userId:', userId);
      } catch (error) {
        console.error('[API Config TEST] Token decode failed:', error);
      }
    }
    
    if (!userId) {
      console.error('[API Config TEST] No user found via any method');
      return NextResponse.json({ 
        error: 'Unauthorized',
        success: false,
        message: 'Not authenticated. Please sign in and try again.' 
      }, { status: 401 });
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
      console.error('Error details:', {
        status: error.status,
        statusCode: error.statusCode,
        message: error.message,
        type: error.type,
        code: error.code,
        error: error.error,
      });
      
      if (error.status === 401 || error.statusCode === 401) {
        testResult = {
          success: false,
          message: 'Invalid API key. Please check your key and try again.',
        };
      } else if (error.status === 429 || error.statusCode === 429) {
        // More detailed rate limit error for OpenAI
        const errorMessage = error.message || JSON.stringify(error.error || '');
        
        if (provider === 'openai') {
          if (errorMessage.includes('insufficient_quota') || errorMessage.includes('quota')) {
            testResult = {
              success: false,
              message: '❌ OpenAI Account Setup Required\n\nThis error happens on NEW accounts that haven\'t added a payment method yet.\n\n✅ Solution: Add a payment method at:\nhttps://platform.openai.com/settings/organization/billing\n\nNote: You need to add a payment method even if you haven\'t used the API yet. This is how OpenAI works.',
            };
          } else if (errorMessage.includes('rate_limit')) {
            testResult = {
              success: false,
              message: '❌ OpenAI Account Restrictions\n\nThis "rate limit" error does NOT mean you used too much - it means your account has restrictions (common for new accounts).\n\n✅ Solutions:\n1. Add payment method: https://platform.openai.com/settings/organization/billing\n2. Check your limits: https://platform.openai.com/account/limits\n3. Wait 1 minute and try again\n4. Or use Groq instead (truly free, no payment needed)',
            };
          } else {
            testResult = {
              success: false,
              message: `❌ OpenAI Error: ${errorMessage}\n\nThis is likely an account setup issue, not actual overuse.\n\n✅ Check: https://platform.openai.com/settings/organization/billing`,
            };
          }
        } else {
          testResult = {
            success: false,
            message: 'Rate limit exceeded. Your API key is valid but you have reached the rate limit.',
          };
        }
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
