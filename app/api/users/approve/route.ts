import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { getSupabaseServiceRole } from '@/lib/supabase-server';
import { sendApprovalConfirmationEmail } from '@/lib/email';

/**
 * POST /api/users/approve - Approve a user (admin only)
 */
export async function POST(request: Request) {
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

    if (!currentUserData?.is_admin) {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    // Get the user ID to approve from request body
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Approve the user
    const { data: approvedUser, error: updateError } = await supabase
      .from('users')
      .update({ approved: true })
      .eq('id', userId)
      .select()
      .single();

    if (updateError || !approvedUser) {
      console.error('Error approving user:', updateError);
      return NextResponse.json(
        { error: 'Failed to approve user' },
        { status: 500 }
      );
    }

    // Send approval confirmation email
    if (approvedUser.email) {
      sendApprovalConfirmationEmail({
        to: approvedUser.email,
        userName: undefined, // We don't have the name in the users table
      }).catch((emailError) => {
        console.error('Failed to send approval email:', emailError);
      });
    }

    return NextResponse.json({
      success: true,
      message: 'User approved successfully',
      user: approvedUser,
    });
  } catch (error) {
    console.error('POST /api/users/approve error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
