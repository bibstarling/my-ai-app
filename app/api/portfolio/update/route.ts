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

    // Check if user is super admin
    const { data: user } = await supabase
      .from('users')
      .select('is_super_admin')
      .eq('clerk_id', userId)
      .single();

    const isSuperAdmin = user?.is_super_admin || false;

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

    // Update portfolio data in database
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

    // For super admin, also sync to portfolio-data.ts (main page)
    if (isSuperAdmin) {
      try {
        const syncRes = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/portfolio/sync-main-page`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            portfolioData,
            userId, // Pass userId for auth
          }),
        });

        if (!syncRes.ok) {
          console.warn('Failed to sync to main page');
        }
      } catch (syncError) {
        console.error('Error syncing to main page:', syncError);
        // Don't fail the update if sync fails
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Portfolio updated successfully',
      syncedToMainPage: isSuperAdmin,
    });
  } catch (error) {
    console.error('POST /api/portfolio/update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
