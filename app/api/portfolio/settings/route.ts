import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getSupabaseServiceRole } from '@/lib/supabase-server';
import { updateUsername } from '@/lib/username';

/**
 * PATCH /api/portfolio/settings
 * Update portfolio settings (privacy, username, etc.)
 */
export async function PATCH(request: Request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { isPublic, username, seoDescription } = body;

    const supabase = getSupabaseServiceRole();

    // Get portfolio
    const { data: portfolio } = await supabase
      .from('user_portfolios')
      .select('id')
      .eq('clerk_id', userId)
      .maybeSingle();

    if (!portfolio) {
      return NextResponse.json(
        { error: 'Portfolio not found' },
        { status: 404 }
      );
    }

    // Update username if provided
    if (username !== undefined) {
      const usernameResult = await updateUsername(
        userId,
        username,
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      if (!usernameResult.success) {
        return NextResponse.json(
          { error: usernameResult.error },
          { status: 400 }
        );
      }
    }

    // Update portfolio settings
    const updates: any = {};
    if (isPublic !== undefined) updates.is_public = isPublic;
    if (seoDescription !== undefined) updates.seo_description = seoDescription;

    if (Object.keys(updates).length > 0) {
      const { error: updateError } = await supabase
        .from('user_portfolios')
        .update(updates)
        .eq('id', portfolio.id);

      if (updateError) {
        console.error('Error updating portfolio settings:', updateError);
        return NextResponse.json(
          { error: 'Failed to update settings' },
          { status: 500 }
        );
      }
    }

    // Get updated data
    const { data: updatedPortfolio } = await supabase
      .from('user_portfolios')
      .select('*')
      .eq('id', portfolio.id)
      .single();

    const { data: updatedUser } = await supabase
      .from('users')
      .select('username')
      .eq('clerk_id', userId)
      .single();

    return NextResponse.json({
      success: true,
      portfolio: {
        ...updatedPortfolio,
        username: updatedUser?.username,
      },
    });
  } catch (error) {
    console.error('PATCH /api/portfolio/settings error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
