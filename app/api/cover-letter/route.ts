import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getSupabaseServiceRole } from '@/lib/supabase-server';
import type { CoverLetter } from '@/lib/types/cover-letter';

/**
 * GET /api/cover-letter - Get all cover letters for the authenticated user
 */
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseServiceRole();
    
    const { data: coverLetters, error } = await supabase
      .from('cover_letters')
      .select('*')
      .eq('clerk_id', userId)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching cover letters:', error);
      return NextResponse.json({ error: 'Failed to fetch cover letters' }, { status: 500 });
    }

    return NextResponse.json({ cover_letters: coverLetters as CoverLetter[] });
  } catch (error) {
    console.error('GET /api/cover-letter error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
