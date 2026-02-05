/**
 * GET /api/health — App health and job ingestion stats (last_sync_time, job_count).
 */

import { NextResponse } from 'next/server';
import { getHealthStats } from '@/lib/jobs-ingestion/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const stats = await getHealthStats();
    return NextResponse.json({
      ok: true,
      last_sync_time: stats.lastSyncAt,
      job_count: stats.jobCount,
      by_source: stats.bySource,
    });
  } catch (err) {
    console.error('[health]', err);
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : 'Health check failed',
        last_sync_time: null,
        job_count: 0,
      },
      { status: 500 }
    );
  }
}
