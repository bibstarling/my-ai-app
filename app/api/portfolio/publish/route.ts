import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getSupabaseServiceRole } from '@/lib/supabase-server';

/**
 * POST /api/portfolio/publish
 * Publish or unpublish portfolio
 */
export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { publish } = body; // true to publish, false to unpublish

    const supabase = getSupabaseServiceRole();

    // Get portfolio
    const { data: portfolio } = await supabase
      .from('user_portfolios')
      .select('*')
      .eq('clerk_id', userId)
      .maybeSingle();

    if (!portfolio) {
      return NextResponse.json(
        { error: 'Portfolio not found' },
        { status: 404 }
      );
    }

    // Validate required content before publishing
    if (publish) {
      const portfolioData = portfolio.portfolio_data || {};
      
      if (!portfolioData.fullName) {
        return NextResponse.json(
          { error: 'Portfolio must have a name before publishing' },
          { status: 400 }
        );
      }

      // Check if user has a username (not required for super admin)
      const { data: user } = await supabase
        .from('users')
        .select('username, is_super_admin')
        .eq('clerk_id', userId)
        .single();

      const isSuperAdmin = user?.is_super_admin || false;

      if (!isSuperAdmin && !user?.username) {
        return NextResponse.json(
          { error: 'You must set a username before publishing your portfolio' },
          { status: 400 }
        );
      }
    }

    // Update status
    const newStatus = publish ? 'published' : 'draft';
    const { data: updatedPortfolio, error: updateError } = await supabase
      .from('user_portfolios')
      .update({ status: newStatus })
      .eq('id', portfolio.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating portfolio status:', updateError);
      return NextResponse.json(
        { error: 'Failed to update portfolio status' },
        { status: 500 }
      );
    }

    // Check if user is super admin and trigger sync to portfolio-data.ts if needed
    const { data: user } = await supabase
      .from('users')
      .select('is_super_admin, email')
      .eq('clerk_id', userId)
      .single();

    const isSuperAdmin = user?.is_super_admin || false;

    // Auto-sync for super admin when publishing - this updates the root (/) page
    if (isSuperAdmin && publish) {
      try {
        const syncRes = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/portfolio/sync-main-page`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': `__session=${userId}`, // Pass auth context
          },
        });

        if (!syncRes.ok) {
          console.warn('Failed to auto-sync admin portfolio to main page');
        }
      } catch (syncError) {
        console.error('Error syncing admin portfolio:', syncError);
        // Don't fail the publish if sync fails
      }
    }

    return NextResponse.json({
      success: true,
      portfolio: updatedPortfolio,
      status: newStatus,
      isSuperAdmin,
      syncedToMainPage: isSuperAdmin && publish,
    });
  } catch (error) {
    console.error('POST /api/portfolio/publish error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
