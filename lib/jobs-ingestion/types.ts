/**
 * Canonical job and ingestion types for multi-source remote job pipeline.
 */

export type JobRemoteType = 'remote' | 'hybrid' | 'onsite' | 'unknown';
export type JobStatus = 'active' | 'expired' | 'removed';
export type JobSourceEnum = 'remoteok' | 'remotive' | 'adzuna';

export interface CanonicalJob {
  id?: string;
  title: string;
  company_name: string;
  company_domain: string | null;
  location_raw: string | null;
  country: string | null;
  is_remote: boolean;
  remote_type: JobRemoteType;
  remote_region_eligibility: string | null;
  employment_type: string | null;
  seniority: string | null;
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string | null;
  description_text: string;
  requirements_text: string | null;
  apply_url: string;
  source_primary: JobSourceEnum;
  posted_at: string | null; // ISO
  first_seen_at: string;
  last_seen_at: string;
  dedupe_key: string;
  status: JobStatus;
  skills_json?: string[];
  detected_language?: string | null;
}

export interface JobSourceRecord {
  source: JobSourceEnum;
  source_job_id: string;
  source_url: string | null;
  raw_payload: Record<string, unknown>;
  fetched_at: string;
  job_id: string;
}

export interface ConnectorFetchResult {
  jobs: CanonicalJob[];
  source: JobSourceEnum;
  rawItems: unknown[];
}

export interface SyncMetrics {
  source: JobSourceEnum;
  last_sync_at: string | null;
  last_sync_status: string | null;
  jobs_fetched: number;
  jobs_upserted: number;
  duplicates_found: number;
  errors_count: number;
}

export interface UserJobProfile {
  clerk_id: string;
  skills_json: string[];
  role_keywords: string[];
  preferred_regions: string[];
  exclude_companies: string[];
}

export interface MatchResult {
  job: CanonicalJob;
  score: number;
  breakdown: {
    skillsScore: number;
    titleBoost: number;
    recencyBoost: number;
    regionPenalty: number;
    qualityPenalty: number;
  };
}
