import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getSupabaseServiceRole } from '@/lib/supabase-server';

/**
 * GET /api/portfolio/current
 * Get current user's portfolio data including chat history
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
      .select('*')
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

    // Get chat messages
    const { data: messages } = await supabase
      .from('portfolio_chat_messages')
      .select('*')
      .eq('portfolio_id', portfolio.id)
      .order('created_at', { ascending: true });

    // Get uploads
    const { data: uploads } = await supabase
      .from('portfolio_uploads')
      .select('*')
      .eq('portfolio_id', portfolio.id)
      .order('created_at', { ascending: false });

    // Get links
    const { data: links } = await supabase
      .from('portfolio_links')
      .select('*')
      .eq('portfolio_id', portfolio.id)
      .order('created_at', { ascending: false });

    // Get username and super admin status
    const { data: user } = await supabase
      .from('users')
      .select('username, is_super_admin')
      .eq('clerk_id', userId)
      .single();

    const isSuperAdmin = user?.is_super_admin || false;

    console.log('📊 Portfolio API - User Info:', {
      clerk_id: userId,
      is_super_admin: isSuperAdmin,
      username: user?.username
    });

    // For super admin, load portfolio data from main page (portfolio-data.ts)
    let portfolioDataToUse = portfolio.portfolio_data;
    
    if (isSuperAdmin) {
      // Import the main portfolio data dynamically
      try {
        const { portfolioData } = await import('@/lib/portfolio-data');
        portfolioDataToUse = portfolioData;
        console.log('✅ Super admin: Loaded main page portfolio data');
        console.log('📝 Portfolio data fields:', Object.keys(portfolioData));
      } catch (error) {
        console.error('❌ Failed to load main portfolio data:', error);
        // Fall back to database data if import fails
      }
    } else {
      console.log('👤 Regular user: Using database portfolio data');
    }

    return NextResponse.json({
      success: true,
      portfolio: {
        ...portfolio,
        portfolio_data: portfolioDataToUse,
        username: user?.username,
        isSuperAdmin,
        messages: messages || [],
        uploads: uploads || [],
        links: links || [],
      },
    });
  } catch (error) {
    console.error('GET /api/portfolio/current error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
