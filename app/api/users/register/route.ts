import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { getSupabaseServiceRole } from '@/lib/supabase-server';
import { sendWelcomeEmail, sendWaitingApprovalEmail } from '@/lib/email';
import { generateUniqueUsername } from '@/lib/username';

/**
 * POST /api/users/register - Register current user in database
 * Called automatically when a user first signs in
 */
export async function POST() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseServiceRole();

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .maybeSingle();

    if (existingUser) {
      return NextResponse.json({ 
        success: true,
        message: 'User already registered',
        user: existingUser
      });
    }

    // Get user info from Clerk
    const user = await currentUser();
    const userEmail = user?.emailAddresses?.[0]?.emailAddress;
    const userName = user?.firstName || user?.username;
    
    // Generate unique username from email
    let username = null;
    if (userEmail) {
      try {
        username = await generateUniqueUsername(
          userEmail,
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );
      } catch (error) {
        console.error('Failed to generate username:', error);
        // Continue without username, user can set it later
      }
    }
    
    // Create new user record
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert({
        clerk_id: userId,
        email: userEmail || null,
        username: username,
        approved: false, // Will be approved by admin
        is_admin: false,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating user:', insertError);
      return NextResponse.json(
        { error: 'Failed to register user' },
        { status: 500 }
      );
    }

    // Send welcome and waiting approval emails
    if (userEmail) {
      // Send emails in parallel (don't wait for them to complete)
      Promise.all([
        sendWelcomeEmail({
          to: userEmail,
          userName: userName || undefined,
        }),
        sendWaitingApprovalEmail({
          to: userEmail,
          userName: userName || undefined,
        }),
      ]).catch((emailError) => {
        // Log but don't fail the registration if emails fail
        console.error('Failed to send registration emails:', emailError);
      });
    }

    return NextResponse.json({
      success: true,
      message: 'User registered successfully. Waiting for admin approval.',
      user: newUser,
    });
  } catch (error) {
    console.error('POST /api/users/register error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
