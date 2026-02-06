import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getSupabaseServiceRole } from '@/lib/supabase-server';

/**
 * GET /api/portfolio/preview
 * Get draft preview of current user's portfolio
 */
export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseServiceRole();

    // Get portfolio
    const { data: portfolio, error: portfolioError } = await supabase
      .from('user_portfolios')
      .select('portfolio_data, status')
      .eq('clerk_id', userId)
      .maybeSingle();

    if (portfolioError) {
      console.error('Error fetching portfolio:', portfolioError);
      return NextResponse.json(
        { error: 'Failed to fetch portfolio' },
        { status: 500 }
      );
    }

    if (!portfolio) {
      return NextResponse.json(
        { error: 'Portfolio not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      portfolioData: portfolio.portfolio_data,
      status: portfolio.status,
    });
  } catch (error) {
    console.error('GET /api/portfolio/preview error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
