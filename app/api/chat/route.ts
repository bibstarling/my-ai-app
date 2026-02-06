import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { generateAICompletion } from '@/lib/ai-provider';

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { message } = await req.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    console.log('Sending message to AI:', message);

    // Use the AI provider system (user's API or system fallback)
    const response = await generateAICompletion(
      userId,
      'assistant_chat',
      'You are a helpful AI assistant specializing in career guidance and job search. Be concise and actionable.',
      [{ role: 'user', content: message }],
      1024
    );

    console.log('Response from AI:', response);
    
    return NextResponse.json({ 
      response: response.content 
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Failed to get response: ' + (error as Error).message },
      { status: 500 }
    );
  }
}