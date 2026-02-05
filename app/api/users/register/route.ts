import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getSupabaseServiceRole } from '@/lib/supabase-server';

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
    const { user } = await auth();
    
    // Create new user record
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert({
        clerk_id: userId,
        email: user?.emailAddresses?.[0]?.emailAddress || null,
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
