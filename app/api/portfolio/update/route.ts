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
    const { portfolioData, fullName, email, linkedinUrl, portfolioUrl } = body;

    if (!portfolioData) {
      return NextResponse.json(
        { error: 'Portfolio data is required' },
        { status: 400 }
      );
    }

    // Extract markdown from portfolioData if present
    const markdown = portfolioData.markdown || null;

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
      .select('id, portfolio_data, markdown')
      .eq('clerk_id', userId)
      .single();

    if (!portfolio) {
      return NextResponse.json(
        { error: 'Portfolio not found' },
        { status: 404 }
      );
    }

    // If markdown is being updated, automatically parse it to extract structured data
    let finalPortfolioData = portfolioData;
    if (markdown && markdown !== portfolio.markdown) {
      try {
        console.log('[Portfolio Update] Markdown changed, parsing to extract structured data...');
        const parseRes = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/portfolio/parse-markdown`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': request.headers.get('cookie') || '',
          },
          body: JSON.stringify({ markdown }),
        });

        if (parseRes.ok) {
          const parseData = await parseRes.json();
          if (parseData.success && parseData.portfolioData) {
            // Merge parsed data with existing portfolio data, prioritizing parsed data
            finalPortfolioData = {
              ...portfolioData,
              ...parseData.portfolioData,
              markdown, // Keep the markdown
            };
            console.log('[Portfolio Update] Successfully parsed markdown. Extracted fields:', Object.keys(parseData.portfolioData));
          }
        } else {
          console.warn('[Portfolio Update] Failed to parse markdown, using data as-is');
        }
      } catch (parseError) {
        console.error('[Portfolio Update] Error parsing markdown:', parseError);
        // Continue with original data if parsing fails
      }
    }

    // Update portfolio data in database
    const updateData: any = { 
      portfolio_data: finalPortfolioData,
      updated_at: new Date().toISOString(),
    };
    
    // Add markdown if present
    if (markdown !== null) {
      updateData.markdown = markdown;
    }
    
    // Add structured contact fields (hybrid approach - take priority over markdown)
    if (fullName !== undefined) {
      updateData.full_name = fullName;
    }
    if (email !== undefined) {
      updateData.email = email;
    }
    if (linkedinUrl !== undefined) {
      updateData.linkedin_url = linkedinUrl;
    }
    if (portfolioUrl !== undefined) {
      updateData.portfolio_url = portfolioUrl;
    }
    
    const { error: updateError } = await supabase
      .from('user_portfolios')
      .update(updateData)
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
            portfolioData: finalPortfolioData,
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
