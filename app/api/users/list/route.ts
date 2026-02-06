import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getSupabaseServiceRole } from '@/lib/supabase-server';

/**
 * GET /api/users/list - List all users (admin only)
 */
export async function GET() {
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

    // Get all users
    const { data: users, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('Error fetching users:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch users' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      users: users || [],
    });
  } catch (error) {
    console.error('GET /api/users/list error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
