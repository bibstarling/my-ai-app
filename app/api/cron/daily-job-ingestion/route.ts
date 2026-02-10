/**
 * GET /api/cron/daily-job-ingestion
 * Cron endpoint for daily job ingestion
 * Runs at midnight daily via Vercel Cron
 */

import { NextResponse } from 'next/server';
import { PipelineService } from '@/lib/jobs-ingestion/pipeline-service';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;  // 5 minutes

export async function GET(req: Request) {
  try {
    // Verify cron secret (optional but recommended)
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret) {
      if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
        console.error('[Cron] Unauthorized request');
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
    }
    
    console.log('[Cron] Starting daily job ingestion...');
    
    const pipeline = new PipelineService();
    const result = await pipeline.runPipeline();
    
    console.log('[Cron] Daily ingestion complete:', {
      success: result.success,
      jobs_fetched: result.jobs_fetched,
      jobs_created: result.jobs_created,
      jobs_deduplicated: result.jobs_deduplicated,
      duration_ms: result.duration_ms,
    });
    
    return NextResponse.json({
      success: result.success,
      stats: {
        jobs_fetched: result.jobs_fetched,
        jobs_normalized: result.jobs_normalized,
        jobs_created: result.jobs_created,
        jobs_deduplicated: result.jobs_deduplicated,
        duration_ms: result.duration_ms,
      },
      errors: result.errors,
      timestamp: new Date().toISOString(),
    });
    
  } catch (err) {
    console.error('[Cron] Fatal error:', err);
    return NextResponse.json(
      { 
        success: false,
        error: err instanceof Error ? err.message : 'Pipeline failed',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
