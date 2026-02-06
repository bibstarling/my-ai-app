import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { clerkClient } from '@clerk/nextjs/server';
import { getSupabaseServiceRole } from '@/lib/supabase-server';

/**
 * POST /api/users/sync-emails - Sync emails for users missing email data
 * This is a utility endpoint to fix users created before the email bug was fixed
 * Should only be called by admins
 */
export async function POST() {
  try {
    const { userId: clerkId } = await auth();
    
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseServiceRole();

    // Check if current user is admin
    const { data: currentUserData } = await supabase
      .from('users')
      .select('is_admin')
      .eq('clerk_id', clerkId)
      .maybeSingle();

    // Allow bibstarling@gmail.com or is_admin users
    const client = await clerkClient();
    const adminUser = await client.users.getUser(clerkId);
    const isOwner = adminUser?.emailAddresses?.[0]?.emailAddress === 'bibstarling@gmail.com';

    if (!currentUserData?.is_admin && !isOwner) {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    // Get all users without emails
    const { data: usersWithoutEmails, error: fetchError } = await supabase
      .from('users')
      .select('id, clerk_id, email')
      .is('email', null);

    if (fetchError) {
      console.error('Error fetching users:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch users' },
        { status: 500 }
      );
    }

    if (!usersWithoutEmails || usersWithoutEmails.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No users need email sync',
        updated: 0,
      });
    }

    // Update each user with their email from Clerk
    const updates = [];
    const errors = [];

    for (const user of usersWithoutEmails) {
      try {
        const clerkUser = await client.users.getUser(user.clerk_id);
        const userEmail = clerkUser?.emailAddresses?.[0]?.emailAddress;

        if (userEmail) {
          const { error: updateError } = await supabase
            .from('users')
            .update({ email: userEmail })
            .eq('id', user.id);

          if (updateError) {
            errors.push({ clerk_id: user.clerk_id, error: updateError.message });
          } else {
            updates.push({ clerk_id: user.clerk_id, email: userEmail });
          }
        } else {
          errors.push({ clerk_id: user.clerk_id, error: 'No email found in Clerk' });
        }
      } catch (err: any) {
        errors.push({ clerk_id: user.clerk_id, error: err.message });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Updated ${updates.length} users, ${errors.length} errors`,
      updated: updates.length,
      updates,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('POST /api/users/sync-emails error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
