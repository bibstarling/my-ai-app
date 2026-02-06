import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getSupabaseServiceRole } from '@/lib/supabase-server';

/**
 * POST /api/portfolio/update
 * Update portfolio data
 */
export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { portfolioData } = body;

    if (!portfolioData) {
      return NextResponse.json(
        { error: 'Portfolio data is required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServiceRole();

    // Get portfolio
    const { data: portfolio } = await supabase
      .from('user_portfolios')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    if (!portfolio) {
      return NextResponse.json(
        { error: 'Portfolio not found' },
        { status: 404 }
      );
    }

    // Update portfolio data
    const { error: updateError } = await supabase
      .from('user_portfolios')
      .update({ 
        portfolio_data: portfolioData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', portfolio.id);

    if (updateError) {
      console.error('Error updating portfolio:', updateError);
      return NextResponse.json(
        { error: 'Failed to update portfolio' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Portfolio updated successfully',
    });
  } catch (error) {
    console.error('POST /api/portfolio/update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
