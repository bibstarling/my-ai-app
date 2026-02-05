/**
 * GET /api/matches — Ranked job matches for the current user (from user_job_profiles).
 * Query: limit. Body or query optional: role_keywords, seniority, regions, exclude_companies.
 */

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getSupabaseServiceRole } from '@/lib/supabase-server';
import { rankJobs } from '@/lib/jobs-ingestion/matching';
import type { UserJobProfile } from '@/lib/jobs-ingestion/types';
import type { CanonicalJob } from '@/lib/jobs-ingestion/types';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized', matches: [] }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '20', 10) || 20, 50);

    const supabase = getSupabaseServiceRole();

    const { data: profileRow } = await supabase
      .from('user_job_profiles')
      .select('skills_json, role_keywords, preferred_regions, exclude_companies')
      .eq('clerk_id', userId)
      .maybeSingle();

    const profile: UserJobProfile = {
      clerk_id: userId,
      skills_json: (profileRow?.skills_json as string[]) ?? [],
      role_keywords: (profileRow?.role_keywords as string[]) ?? [],
      preferred_regions: (profileRow?.preferred_regions as string[]) ?? [],
      exclude_companies: (profileRow?.exclude_companies as string[]) ?? [],
    };

    const { data: jobs } = await supabase
      .from('jobs')
      .select('*')
      .eq('status', 'active')
      .order('last_seen_at', { ascending: false })
      .limit(500);

    const rows = (jobs ?? []) as (CanonicalJob & { id: string })[];
    const results = rankJobs(rows, profile, { limit });

    return NextResponse.json({
      matches: results.map((r) => ({
        job: r.job,
        score: r.score,
        breakdown: r.breakdown,
      })),
    });
  } catch (err) {
    console.error('[matches]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Matches failed', matches: [] },
      { status: 500 }
    );
  }
}
