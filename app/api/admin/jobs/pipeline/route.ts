/**
 * POST /api/admin/jobs/pipeline
 * Run the complete job ingestion pipeline
 * Admin only
 */

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { PipelineService } from '@/lib/jobs-ingestion/pipeline-service';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;  // 5 minutes for pipeline

export async function POST() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // TODO: Add admin check
    // For now, allow any authenticated user
    
    console.log('[Pipeline API] Starting pipeline...');
    
    const pipeline = new PipelineService();
    const result = await pipeline.runPipeline();
    
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
    });
    
  } catch (err) {
    console.error('[Pipeline API] Error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Pipeline failed' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get pipeline status/health
    const pipeline = new PipelineService();
    // This would return the last sync status from database
    
    return NextResponse.json({
      status: 'ready',
      message: 'Pipeline is ready to run',
    });
    
  } catch (err) {
    console.error('[Pipeline API] Error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to get status' },
      { status: 500 }
    );
  }
}
