/**
 * POST /api/jobs/[jobId]/track
 * Save a job to tracked_jobs for application workflow
 */

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getSupabaseServiceRole } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const { jobId } = await params;
    
    const supabase = getSupabaseServiceRole();
    
    // Get the canonical job
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', jobId)
      .single();
    
    if (jobError || !job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }
    
    // Check if already tracked
    const { data: existing } = await supabase
      .from('tracked_jobs')
      .select('id')
      .eq('clerk_id', userId)
      .eq('apply_url', job.apply_url)
      .single();
    
    if (existing) {
      return NextResponse.json({
        success: true,
        message: 'Job already tracked',
        tracked_job_id: existing.id,
      });
    }
    
    // Create tracked job
    const { data: tracked, error: trackError } = await supabase
      .from('tracked_jobs')
      .insert({
        clerk_id: userId,
        title: job.normalized_title || job.title,
        company: job.company_name,
        location: job.locations?.join(', ') || job.location_raw || 'Remote',
        job_type: job.employment_type || 'Full-time',
        salary: job.compensation_min && job.compensation_max
          ? `${job.compensation_currency} ${job.compensation_min}-${job.compensation_max}`
          : null,
        posted_date: job.posted_at
          ? new Date(job.posted_at).toLocaleDateString()
          : null,
        description: job.description_text,
        apply_url: job.apply_url,
        skills: job.skills_json || [],
        status: 'saved',
      })
      .select('id')
      .single();
    
    if (trackError) {
      throw trackError;
    }
    
    return NextResponse.json({
      success: true,
      tracked_job_id: tracked.id,
    });
    
  } catch (err) {
    console.error('[Track Job API] Error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to track job' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const { jobId } = await params;
    
    const supabase = getSupabaseServiceRole();
    
    // Find and delete tracked job
    const { error } = await supabase
      .from('tracked_jobs')
      .delete()
      .eq('clerk_id', userId)
      .eq('id', jobId);
    
    if (error) {
      throw error;
    }
    
    return NextResponse.json({
      success: true,
    });
    
  } catch (err) {
    console.error('[Untrack Job API] Error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to untrack job' },
      { status: 500 }
    );
  }
}
