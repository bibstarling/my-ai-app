import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    console.log('Sending message to Claude:', message);

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY || '',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: message,
          },
        ],
      }),
    });

    const data = await response.json();
    console.log('Response from Claude:', data);

    // Check if there's an error in the response
    if (data.error) {
      console.error('API Error:', data.error);
      return NextResponse.json(
        { error: data.error.message || 'API request failed' },
        { status: 500 }
      );
    }

    // Check if content exists
    if (!data.content || !data.content[0]) {
      console.error('Unexpected response structure:', data);
      return NextResponse.json(
        { error: 'Unexpected response from API' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ 
      response: data.content[0].text 
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Failed to get response: ' + (error as Error).message },
      { status: 500 }
    );
  }
}