/**
 * GET /api/jobs/ingestion — List canonical jobs with filters.
 * Query: query, remote_type, region_eligibility, seniority, posted_since, source, limit, offset.
 */

import { NextResponse } from 'next/server';
import { getSupabaseServiceRole } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('query')?.trim();
    const remoteType = searchParams.get('remote_type')?.trim();
    const regionEligibility = searchParams.get('region_eligibility')?.trim();
    const seniority = searchParams.get('seniority')?.trim();
    const postedSince = searchParams.get('posted_since')?.trim();
    const source = searchParams.get('source')?.trim();
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '20', 10) || 20, 100);
    const offset = Math.max(0, parseInt(searchParams.get('offset') ?? '0', 10) || 0);

    const supabase = getSupabaseServiceRole();
    let q = supabase
      .from('jobs')
      .select('*')
      .eq('status', 'active')
      .order('last_seen_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (query) {
      q = q.or(`title.ilike.%${query}%,company_name.ilike.%${query}%,description_text.ilike.%${query}%`);
    }
    if (remoteType) q = q.eq('remote_type', remoteType);
    if (regionEligibility) {
      q = q.ilike('remote_region_eligibility', `%${regionEligibility}%`);
    }
    if (seniority) q = q.eq('seniority', seniority);
    if (postedSince) {
      const since = new Date(postedSince);
      if (!Number.isNaN(since.getTime())) q = q.gte('posted_at', since.toISOString());
    }
    if (source) q = q.eq('source_primary', source);

    const { data, error } = await q;
    if (error) throw new Error(error.message);

    return NextResponse.json({
      jobs: data ?? [],
      limit,
      offset,
    });
  } catch (err) {
    console.error('[jobs/ingestion]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'List failed' },
      { status: 500 }
    );
  }
}
