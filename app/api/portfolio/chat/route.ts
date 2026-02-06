import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { processChatMessage } from '@/lib/portfolio-builder';

/**
 * POST /api/portfolio/chat
 * Chat with AI to build portfolio
 */
export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { message, portfolioId } = body;

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    if (!portfolioId) {
      return NextResponse.json(
        { error: 'Portfolio ID is required' },
        { status: 400 }
      );
    }

    // Process message with AI
    const result = await processChatMessage(portfolioId, userId, message);

    return NextResponse.json({
      success: true,
      response: result.message,
      portfolioData: result.updatedPortfolioData,
      suggestions: result.suggestions,
    });
  } catch (error) {
    console.error('POST /api/portfolio/chat error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process message',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
