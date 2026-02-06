import { NextResponse } from 'next/server';
import { getSupabaseServiceRole } from '@/lib/supabase-server';

/**
 * GET /api/portfolio/[username]
 * Get published portfolio by username
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;
    const supabase = getSupabaseServiceRole();

    // Get user by username
    const { data: user } = await supabase
      .from('users')
      .select('id, clerk_id')
      .eq('username', username)
      .single();

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get published portfolio
    const { data: portfolio, error: portfolioError } = await supabase
      .from('user_portfolios')
      .select('portfolio_data, status')
      .eq('clerk_id', user.clerk_id)
      .eq('status', 'published')
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
        { error: 'Portfolio not found or not published' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      portfolioData: portfolio.portfolio_data,
    });
  } catch (error) {
    console.error('GET /api/portfolio/[username] error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
