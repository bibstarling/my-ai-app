/**
 * GET /api/admin/jobs/metrics
 * Get sync metrics for all job sources (built-in and custom)
 */

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getSupabaseServiceRole } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // TODO: Add admin check
    
    const supabase = getSupabaseServiceRole();
    
    // Get all sources from unified config table
    const { data: sources, error } = await supabase
      .from('job_sources_config')
      .select('*')
      .order('is_built_in', { ascending: false })
      .order('name');
    
    if (error) {
      throw error;
    }
    
    // Map to metrics format for backward compatibility
    const metrics = (sources || []).map(source => ({
      id: source.id,
      source: source.source_key,
      source_name: source.name,
      source_type: source.source_type,
      is_built_in: source.is_built_in,
      enabled: source.enabled,
      last_sync_at: source.last_sync_at,
      last_sync_status: source.last_sync_status || 'pending',
      jobs_fetched: source.last_sync_jobs_count || 0,
      jobs_upserted: source.last_sync_jobs_count || 0,
      duplicates_found: 0,
      errors_count: source.last_error ? 1 : 0,
    }));
    
    return NextResponse.json({
      metrics: metrics,
    });
    
  } catch (err) {
    console.error('[Metrics API] Error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to fetch metrics' },
      { status: 500 }
    );
  }
}
