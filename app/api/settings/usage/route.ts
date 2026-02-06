import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getSupabaseServiceRole } from '@/lib/supabase-server';

export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(req.url);
    const days = parseInt(url.searchParams.get('days') || '30');

    const supabase = getSupabaseServiceRole();

    // Call the database function to get usage summary
    const { data, error } = await supabase.rpc('get_user_usage_summary', {
      user_clerk_id: userId,
      days: days,
    });

    if (error) {
      console.error('Error fetching usage data:', error);
      return NextResponse.json({ error: 'Failed to fetch usage data' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      usage: data || [],
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
