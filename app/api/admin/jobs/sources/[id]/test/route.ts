/**
 * Test Custom Job Source API
 * POST: Test scraping a custom source
 */

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getSupabaseServiceRole } from '@/lib/supabase-server';
import { SourcesService } from '@/lib/jobs-ingestion/sources-service';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 1 minute for testing

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Check if user is admin
    const supabase = getSupabaseServiceRole();
    const { data: user } = await supabase
      .from('users')
      .select('is_admin, is_super_admin')
      .eq('clerk_id', userId)
      .single();
    
    if (!user?.is_admin && !user?.is_super_admin) {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }
    
    // Await params (Next.js 15 requirement)
    const { id } = await params;
    
    // Get source details using the new service
    console.log('[Test API] Looking for source with key:', id);
    
    const sourcesService = new SourcesService();
    const source = await sourcesService.getSource(id);
    
    console.log('[Test API] Source found:', !!source, source?.name);
    
    if (!source) {
      console.error('[Test API] Source not found. Checked source_key:', id);
      return NextResponse.json(
        { error: `Source not found with key: ${id}` },
        { status: 404 }
      );
    }
    
    // Only test custom scraper sources (not built-in APIs)
    if (source.source_type !== 'scraper') {
      return NextResponse.json(
        { error: 'Only custom scraper sources can be tested through this endpoint' },
        { status: 400 }
      );
    }
    
    console.log('[Test API] Testing source:', source.name);
    
    // Create worker and test
    const worker = sourcesService.createWorker(source);
    
    if (!worker) {
      return NextResponse.json(
        { error: 'Failed to create worker for this source' },
        { status: 500 }
      );
    }
    
    const result = await worker.ingest();
    
    // Update source status
    await sourcesService.updateSyncStatus(
      source.source_key,
      result.success ? 'success' : 'failed',
      result.jobs_fetched,
      result.errors.length > 0 ? result.errors.join('; ') : undefined
    );
    
    return NextResponse.json({
      success: result.success,
      jobs_count: result.jobs_fetched,
      errors: result.errors,
      sample_jobs: result.raw_jobs?.slice(0, 3).map(job => ({
        title: (job.raw_data as any)?.title || 'N/A',
        company: (job.raw_data as any)?.company || 'N/A',
        url: job.source_url || (job.raw_data as any)?.url || 'N/A',
      })),
    });
    
  } catch (err) {
    console.error('[Test Scraper API] Error:', err);
    return NextResponse.json(
      { 
        success: false,
        error: err instanceof Error ? err.message : 'Test failed' 
      },
      { status: 500 }
    );
  }
}
