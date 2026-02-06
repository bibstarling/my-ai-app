import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { getSupabaseServiceRole } from '@/lib/supabase-server';

const ADMIN_EMAIL = 'bibstarling@gmail.com';

/**
 * POST /api/admin/grant-self - Grant admin access to yourself if you have the admin email
 * This is a helper endpoint for debugging admin access issues
 */
export async function POST() {
  try {
    const { userId: clerkId } = await auth();
    const user = await currentUser();
    
    console.log('[Grant Admin] Request from:', {
      clerkId,
      email: user?.emailAddresses[0]?.emailAddress,
    });
    
    if (!clerkId || !user) {
      return NextResponse.json({ 
        error: 'Unauthorized - You must be logged in' 
      }, { status: 401 });
    }

    const userEmail = user.emailAddresses[0]?.emailAddress;
    
    if (userEmail !== ADMIN_EMAIL) {
      return NextResponse.json({
        error: `Only ${ADMIN_EMAIL} can use this endpoint`,
        yourEmail: userEmail,
      }, { status: 403 });
    }

    const supabase = getSupabaseServiceRole();

    // Check if user exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('clerk_id', clerkId)
      .maybeSingle();

    if (!existingUser) {
      // User doesn't exist, create them with admin access
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert({
          clerk_id: clerkId,
          email: userEmail,
          approved: true,
          is_admin: true,
        })
        .select()
        .single();

      if (insertError) {
        console.error('[Grant Admin] Error creating user:', insertError);
        return NextResponse.json({
          error: 'Failed to create user',
          details: insertError.message,
        }, { status: 500 });
      }

      console.log('[Grant Admin] Created new admin user:', newUser);

      return NextResponse.json({
        success: true,
        message: 'Admin user created successfully',
        user: newUser,
      });
    }

    // User exists, update to admin
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({
        is_admin: true,
        approved: true,
        email: userEmail, // Ensure email is set
      })
      .eq('clerk_id', clerkId)
      .select()
      .single();

    if (updateError) {
      console.error('[Grant Admin] Error updating user:', updateError);
      return NextResponse.json({
        error: 'Failed to grant admin access',
        details: updateError.message,
      }, { status: 500 });
    }

    console.log('[Grant Admin] Updated user to admin:', updatedUser);

    return NextResponse.json({
      success: true,
      message: 'Admin access granted successfully',
      user: updatedUser,
      wasAlreadyAdmin: existingUser.is_admin,
    });
  } catch (error: any) {
    console.error('[Grant Admin] Error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message,
    }, { status: 500 });
  }
}
