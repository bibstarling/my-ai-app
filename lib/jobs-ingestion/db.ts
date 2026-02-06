/**
 * Database layer for jobs ingestion: upsert jobs and job_sources, update sync metrics.
 * Uses Supabase service role client.
 */

import { getSupabaseServiceRole } from '@/lib/supabase-server';
import type { CanonicalJob, JobSourceEnum, SyncMetrics } from './types';

const JOBS_TABLE = 'jobs';
const JOB_SOURCES_TABLE = 'job_sources';
const SYNC_METRICS_TABLE = 'job_sync_metrics';

type DbJob = {
  id: string;
  dedupe_key: string;
  title: string;
  company_name: string;
  company_domain: string | null;
  location_raw: string | null;
  country: string | null;
  is_remote: boolean;
  remote_type: string;
  remote_region_eligibility: string | null;
  employment_type: string | null;
  seniority: string | null;
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string | null;
  description_text: string;
  requirements_text: string | null;
  apply_url: string;
  source_primary: string;
  posted_at: string | null;
  first_seen_at: string;
  last_seen_at: string;
  status: string;
  skills_json: string[] | null;
};

function toDbRow(job: CanonicalJob): Record<string, unknown> {
  return {
    title: job.title,
    company_name: job.company_name,
    company_domain: job.company_domain,
    location_raw: job.location_raw,
    country: job.country,
    is_remote: job.is_remote,
    remote_type: job.remote_type,
    remote_region_eligibility: job.remote_region_eligibility,
    employment_type: job.employment_type,
    seniority: job.seniority,
    salary_min: job.salary_min,
    salary_max: job.salary_max,
    salary_currency: job.salary_currency,
    description_text: job.description_text,
    requirements_text: job.requirements_text,
    apply_url: job.apply_url,
    source_primary: job.source_primary,
    posted_at: job.posted_at,
    first_seen_at: job.first_seen_at,
    last_seen_at: job.last_seen_at,
    dedupe_key: job.dedupe_key,
    status: job.status,
    skills_json: job.skills_json ?? [],
    detected_language: job.detected_language ?? 'unknown',
    updated_at: new Date().toISOString(),
  };
}

/** Prefer source with richer data for source_primary. */
function preferPrimary(existing: DbJob | null, incoming: CanonicalJob): CanonicalJob['source_primary'] {
  if (!existing) return incoming.source_primary;
  const incDesc = (incoming.description_text ?? '').length;
  const curDesc = (existing.description_text ?? '').length;
  const incHasSalary = incoming.salary_min != null || incoming.salary_max != null;
  const curHasSalary = existing.salary_min != null || existing.salary_max != null;
  const incHasPosted = !!incoming.posted_at;
  const curHasPosted = !!existing.posted_at;
  const incScore = (incDesc > 0 ? 1 : 0) + (incHasSalary ? 1 : 0) + (incHasPosted ? 1 : 0);
  const curScore = (curDesc > 0 ? 1 : 0) + (curHasSalary ? 1 : 0) + (curHasPosted ? 1 : 0);
  if (incScore > curScore || (incScore === curScore && incDesc > curDesc)) {
    return incoming.source_primary;
  }
  return existing.source_primary as JobSourceEnum;
}

export interface UpsertResult {
  jobId: string;
  inserted: boolean;
  duplicate: boolean;
}

/**
 * Upsert a canonical job: insert if new (by dedupe_key), else update last_seen_at and optionally merge better source.
 */
export async function upsertJob(
  job: CanonicalJob,
  existingByDedupeKey: DbJob | null
): Promise<UpsertResult> {
  const supabase = getSupabaseServiceRole();
  const sourcePrimary = preferPrimary(existingByDedupeKey, job);

  if (existingByDedupeKey) {
    const { error } = await supabase
      .from(JOBS_TABLE)
      .update({
        last_seen_at: job.last_seen_at,
        source_primary: sourcePrimary,
        updated_at: new Date().toISOString(),
        ...(sourcePrimary === job.source_primary
          ? {
              description_text: job.description_text,
              requirements_text: job.requirements_text,
              salary_min: job.salary_min,
              salary_max: job.salary_max,
              salary_currency: job.salary_currency,
              posted_at: job.posted_at,
              remote_region_eligibility: job.remote_region_eligibility,
              skills_json: job.skills_json ?? existingByDedupeKey.skills_json,
            }
          : {}),
      })
      .eq('id', existingByDedupeKey.id);
    if (error) throw new Error(`Failed to update job: ${error.message}`);
    return {
      jobId: existingByDedupeKey.id,
      inserted: false,
      duplicate: true,
    };
  }

  const row = toDbRow({ ...job, source_primary: sourcePrimary });
  const { data: inserted, error } = await supabase
    .from(JOBS_TABLE)
    .insert(row)
    .select('id')
    .single();
  if (error) {
    if (error.code === '23505') {
      const { data: existing } = await supabase
        .from(JOBS_TABLE)
        .select('*')
        .eq('dedupe_key', job.dedupe_key)
        .single();
      if (existing) {
        await supabase
          .from(JOBS_TABLE)
          .update({
            last_seen_at: job.last_seen_at,
            updated_at: new Date().toISOString(),
          })
          .eq('id', (existing as DbJob).id);
        return {
          jobId: (existing as DbJob).id,
          inserted: false,
          duplicate: true,
        };
      }
    }
    throw new Error(`Failed to insert job: ${error.message}`);
  }
  return {
    jobId: (inserted as { id: string }).id,
    inserted: true,
    duplicate: false,
  };
}

/**
 * Upsert job_source row: insert or update by (source, source_job_id).
 */
export async function upsertJobSource(params: {
  source: JobSourceEnum;
  sourceJobId: string;
  sourceUrl: string | null;
  rawPayload: Record<string, unknown>;
  jobId: string;
}): Promise<void> {
  const supabase = getSupabaseServiceRole();
  const fetchedAt = new Date().toISOString();

  const { data: existing } = await supabase
    .from(JOB_SOURCES_TABLE)
    .select('id')
    .eq('source', params.source)
    .eq('source_job_id', params.sourceJobId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from(JOB_SOURCES_TABLE)
      .update({
        source_url: params.sourceUrl,
        raw_payload: params.rawPayload,
        fetched_at: fetchedAt,
        job_id: params.jobId,
      })
      .eq('id', (existing as { id: string }).id);
    if (error) throw new Error(`Failed to update job_source: ${error.message}`);
    return;
  }

  const { error } = await supabase.from(JOB_SOURCES_TABLE).insert({
    source: params.source,
    source_job_id: params.sourceJobId,
    source_url: params.sourceUrl,
    raw_payload: params.rawPayload,
    fetched_at: fetchedAt,
    job_id: params.jobId,
  });
  if (error) throw new Error(`Failed to insert job_source: ${error.message}`);
}

/**
 * Find job by dedupe_key.
 */
export async function findJobByDedupeKey(dedupeKey: string): Promise<DbJob | null> {
  const supabase = getSupabaseServiceRole();
  const { data, error } = await supabase
    .from(JOBS_TABLE)
    .select('*')
    .eq('dedupe_key', dedupeKey)
    .maybeSingle();
  if (error) throw new Error(`Failed to find job: ${error.message}`);
  return data as DbJob | null;
}

/**
 * Update sync metrics for a source after a run.
 */
export async function updateSyncMetrics(metrics: SyncMetrics): Promise<void> {
  const supabase = getSupabaseServiceRole();
  const { error } = await supabase.from(SYNC_METRICS_TABLE).upsert(
    {
      source: metrics.source,
      last_sync_at: metrics.last_sync_at,
      last_sync_status: metrics.last_sync_status,
      jobs_fetched: metrics.jobs_fetched,
      jobs_upserted: metrics.jobs_upserted,
      duplicates_found: metrics.duplicates_found,
      errors_count: metrics.errors_count,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'source' }
  );
  if (error) throw new Error(`Failed to update sync metrics: ${error.message}`);
}

/**
 * Mark jobs not seen since threshold as expired.
 */
export async function markExpiredJobs(notSeenSince: Date): Promise<number> {
  const supabase = getSupabaseServiceRole();
  const iso = notSeenSince.toISOString();
  const { data, error } = await supabase
    .from(JOBS_TABLE)
    .update({ status: 'expired', updated_at: new Date().toISOString() })
    .lt('last_seen_at', iso)
    .eq('status', 'active')
    .select('id');
  if (error) throw new Error(`Failed to mark expired jobs: ${error.message}`);
  return Array.isArray(data) ? data.length : 0;
}

/**
 * Get last sync time and job count for health.
 */
export async function getHealthStats(): Promise<{
  lastSyncAt: string | null;
  jobCount: number;
  bySource: { source: string; last_sync_at: string | null; jobs_fetched: number }[];
}> {
  const supabase = getSupabaseServiceRole();
  const [metricsRes, countRes] = await Promise.all([
    supabase.from(SYNC_METRICS_TABLE).select('source, last_sync_at, jobs_fetched'),
    supabase.from(JOBS_TABLE).select('id', { count: 'exact', head: true }).eq('status', 'active'),
  ]);
  const bySource = (metricsRes.data ?? []) as { source: string; last_sync_at: string | null; jobs_fetched: number }[];
  const lastSyncAt = bySource.reduce<string | null>((acc, m) => {
    if (!m.last_sync_at) return acc;
    if (!acc) return m.last_sync_at;
    return m.last_sync_at > acc ? m.last_sync_at : acc;
  }, null);
  return {
    lastSyncAt,
    jobCount: countRes.count ?? 0,
    bySource,
  };
}
