import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { getSupabaseServiceRole } from '@/lib/supabase-server';

/**
 * GET /api/users/list - List all users (admin only)
 */
export async function GET() {
  try {
    // Get auth data
    const authData = await auth();
    const clerkId = authData?.userId;
    
    console.log('[Admin API] Auth check:', { 
      hasClerkId: !!clerkId, 
      clerkId: clerkId?.substring(0, 15) + '...',
    });
    
    if (!clerkId) {
      // Try to get current user as fallback
      const user = await currentUser();
      console.log('[Admin API] Fallback currentUser:', { hasUser: !!user, userId: user?.id });
      
      if (!user) {
        return NextResponse.json({ 
          error: 'Unauthorized - No active Clerk session found' 
        }, { status: 401 });
      }
      
      // Use user.id if available
      const userId = user.id;
      return checkAdminAndFetchUsers(userId);
    }

    return checkAdminAndFetchUsers(clerkId);
  } catch (error: any) {
    console.error('GET /api/users/list error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

async function checkAdminAndFetchUsers(clerkId: string) {
  const supabase = getSupabaseServiceRole();

  // Check if current user is admin
  const { data: currentUserData, error: userError } = await supabase
    .from('users')
    .select('is_admin, email')
    .eq('clerk_id', clerkId)
    .maybeSingle();

  console.log('[Admin API] User lookup:', { 
    found: !!currentUserData,
    isAdmin: currentUserData?.is_admin,
    email: currentUserData?.email,
    error: userError?.message,
  });

  if (!currentUserData) {
    return NextResponse.json(
      { error: 'User not found in database. Please complete registration.' },
      { status: 403 }
    );
  }

  if (!currentUserData.is_admin) {
    return NextResponse.json(
      { error: 'Forbidden: Admin access required' },
      { status: 403 }
    );
  }

  // Get all users
  const { data: users, error: fetchError } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false });

  if (fetchError) {
    console.error('[Admin API] Error fetching users:', fetchError);
    return NextResponse.json(
      { error: 'Failed to fetch users', details: fetchError.message },
      { status: 500 }
    );
  }

  console.log('[Admin API] Success: Fetched', users?.length || 0, 'users');

  return NextResponse.json({
    success: true,
    users: users || [],
  });
}
