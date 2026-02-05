/**
 * GET /api/jobs/ingestion/:id — Get a single canonical job by id.
 */

import { NextResponse } from 'next/server';
import { getSupabaseServiceRole } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Missing job id' }, { status: 400 });
    }

    const supabase = getSupabaseServiceRole();
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Job not found' }, { status: 404 });
      }
      throw new Error(error.message);
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error('[jobs/ingestion/:id]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Fetch failed' },
      { status: 500 }
    );
  }
}
