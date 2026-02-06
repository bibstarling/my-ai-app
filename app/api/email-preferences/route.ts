import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getSupabaseServiceRole } from '@/lib/supabase-server';
import type { UpdateEmailPreferencesRequest } from '@/lib/types/email-preferences';

/**
 * GET /api/email-preferences - Get current user's email preferences
 */
export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseServiceRole();

    // Get user ID from clerk_id
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .maybeSingle();

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get email preferences (or create default if doesn't exist)
    let { data: preferences } = await supabase
      .from('email_preferences')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    // If no preferences exist, create default
    if (!preferences) {
      const { data: newPreferences, error: insertError } = await supabase
        .from('email_preferences')
        .insert({
          user_id: user.id,
          account_emails: true,
          document_emails: true,
          application_emails: true,
          digest_emails: true,
          marketing_emails: true,
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error creating default preferences:', insertError);
        return NextResponse.json(
          { error: 'Failed to create preferences' },
          { status: 500 }
        );
      }

      preferences = newPreferences;
    }

    return NextResponse.json({
      success: true,
      preferences,
    });
  } catch (error) {
    console.error('GET /api/email-preferences error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/email-preferences - Update current user's email preferences
 */
export async function PATCH(request: Request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: UpdateEmailPreferencesRequest = await request.json();
    const supabase = getSupabaseServiceRole();

    // Get user ID from clerk_id
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .maybeSingle();

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Build update object (only include provided fields)
    const updates: Record<string, boolean> = {};
    if (body.account_emails !== undefined) updates.account_emails = body.account_emails;
    if (body.document_emails !== undefined) updates.document_emails = body.document_emails;
    if (body.application_emails !== undefined) updates.application_emails = body.application_emails;
    if (body.digest_emails !== undefined) updates.digest_emails = body.digest_emails;
    if (body.marketing_emails !== undefined) updates.marketing_emails = body.marketing_emails;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No preferences to update' },
        { status: 400 }
      );
    }

    // Update preferences
    const { data: updatedPreferences, error: updateError } = await supabase
      .from('email_preferences')
      .update(updates)
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating preferences:', updateError);
      return NextResponse.json(
        { error: 'Failed to update preferences' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Email preferences updated successfully',
      preferences: updatedPreferences,
    });
  } catch (error) {
    console.error('PATCH /api/email-preferences error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
