import { NextResponse } from 'next/server';
import { getSupabaseServiceRole } from '@/lib/supabase-server';
import { portfolioData } from '@/lib/portfolio-data';

/**
 * GET /api/portfolio/[username]
 * Get portfolio by username (public endpoint)
 */
export async function GET(
  request: Request,
  context: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await context.params;

    if (!username) {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServiceRole();

    // Get user by username
    const { data: user } = await supabase
      .from('users')
      .select('clerk_id, is_admin, email')
      .eq('username', username)
      .maybeSingle();

    if (!user) {
      return NextResponse.json(
        { error: 'Portfolio not found' },
        { status: 404 }
      );
    }

    // Check if this is the admin user
    const isAdmin = user.is_admin || user.email === 'bibstarling@gmail.com';

    // For admin, return current portfolio-data.ts content
    if (isAdmin) {
      return NextResponse.json({
        success: true,
        portfolioData: portfolioData,
        isAdmin: true,
      });
    }

    // For regular users, fetch from database
    const { data: portfolio } = await supabase
      .from('user_portfolios')
      .select('portfolio_data, status, is_public')
      .eq('clerk_id', user.clerk_id)
      .maybeSingle();

    if (!portfolio) {
      return NextResponse.json(
        { error: 'Portfolio not found' },
        { status: 404 }
      );
    }

    // Check if portfolio is published and public
    if (portfolio.status !== 'published' || !portfolio.is_public) {
      return NextResponse.json(
        { error: 'Portfolio not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      portfolioData: portfolio.portfolio_data,
      isAdmin: false,
    });
  } catch (error) {
    console.error('GET /api/portfolio/[username] error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
