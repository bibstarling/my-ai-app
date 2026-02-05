/**
 * POST /api/admin/jobs/sync — Trigger background ingestion for all sources.
 * Secure with CRON_SECRET or JOB_SYNC_CRON key in header (e.g. from Vercel Cron).
 */

import { NextResponse } from 'next/server';
import { runSync } from '@/lib/jobs-ingestion/sync';
import { setCorrelationId, clearCorrelationId } from '@/lib/jobs-ingestion/logger';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

export async function POST(req: Request) {
  const correlationId = `sync-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  setCorrelationId(correlationId);

  try {
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET ?? process.env.JOB_SYNC_CRON;
    const key = authHeader?.startsWith('Bearer ')
      ? authHeader.slice(7)
      : req.headers.get('x-cron-secret') ?? '';

    if (cronSecret && key !== cronSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const results = await runSync(correlationId);
    return NextResponse.json({
      ok: true,
      correlationId,
      results,
    });
  } catch (err) {
    console.error('[jobs/sync]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Sync failed' },
      { status: 500 }
    );
  } finally {
    clearCorrelationId();
  }
}
