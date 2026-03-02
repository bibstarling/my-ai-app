/**
 * POST /api/jobs/[jobId]/track
 * Save a job to tracked_jobs for application workflow.
 * Accepts optional job payload in body; when provided, skips refetching from DB (faster when client already has job data).
 */

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getSupabaseServiceRole } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

/** Optional payload from client when it already has the job (e.g. from discover) */
interface TrackJobPayload {
  title?: string;
  normalized_title?: string;
  company_name?: string;
  location_raw?: string;
  locations?: string[];
  employment_type?: string;
  salary_min?: number | null;
  salary_max?: number | null;
  salary_currency?: string | null;
  compensation_min?: number | null;
  compensation_max?: number | null;
  compensation_currency?: string | null;
  posted_at?: string | null;
  description_text?: string;
  apply_url?: string;
  skills_json?: unknown[] | null;
}

function buildTrackedRow(job: TrackJobPayload, userId: string) {
  const title = job.normalized_title || job.title || '';
  const company = job.company_name || '';
  const location = job.locations?.length
    ? job.locations.join(', ')
    : job.location_raw || 'Remote';
  const salaryMin = job.compensation_min ?? job.salary_min;
  const salaryMax = job.compensation_max ?? job.salary_max;
  const currency = job.compensation_currency ?? job.salary_currency;
  const salary =
    salaryMin != null && salaryMax != null && currency
      ? `${currency} ${salaryMin}-${salaryMax}`
      : null;
  return {
    clerk_id: userId,
    title,
    company,
    location,
    job_type: job.employment_type || 'Full-time',
    salary,
    posted_date: job.posted_at
      ? new Date(job.posted_at).toLocaleDateString()
      : null,
    description: job.description_text ?? '',
    apply_url: job.apply_url ?? '',
    skills: Array.isArray(job.skills_json) ? job.skills_json : [],
    status: 'saved',
  };
}

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

    let job: TrackJobPayload;
    const body = await req.json().catch(() => null);
    const hasPayload =
      body &&
      typeof body === 'object' &&
      (body.apply_url || body.description_text || body.company_name);

    if (hasPayload) {
      // Client sent job data (e.g. from discover) – only verify job exists
      const { data: exists, error: existErr } = await supabase
        .from('jobs')
        .select('id')
        .eq('id', jobId)
        .single();
      if (existErr || !exists) {
        return NextResponse.json(
          { error: 'Job not found' },
          { status: 404 }
        );
      }
      job = body as TrackJobPayload;
    } else {
      // No payload: fetch full job from DB (existing behavior)
      const { data: fetched, error: jobError } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', jobId)
        .single();
      if (jobError || !fetched) {
        return NextResponse.json(
          { error: 'Job not found' },
          { status: 404 }
        );
      }
      job = fetched as TrackJobPayload;
    }

    const applyUrl = job.apply_url ?? '';

    // Check if already tracked
    const { data: existing } = await supabase
      .from('tracked_jobs')
      .select('id')
      .eq('clerk_id', userId)
      .eq('apply_url', applyUrl)
      .single();

    if (existing) {
      return NextResponse.json({
        success: true,
        message: 'Job already tracked',
        tracked_job_id: existing.id,
      });
    }

    const row = buildTrackedRow(job, userId);

    const { data: tracked, error: trackError } = await supabase
      .from('tracked_jobs')
      .insert(row)
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
