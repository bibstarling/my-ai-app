/**
 * Type definitions for Job Intelligence Platform
 * Based on PRD data model and schema
 */

export type JobRemoteType = 'remote' | 'hybrid' | 'onsite' | 'unknown';
export type JobStatus = 'active' | 'expired' | 'removed';
// Changed from enum to string to support dynamic custom sources
export type JobSourceEnum = string;

// Canonical Job (source of truth)
export interface Job {
  id: string;
  // Core fields
  normalized_title: string;
  title: string;
  company_name: string;
  company_domain?: string;
  description_text: string;
  responsibilities?: string;
  requirements?: string;
  requirements_text?: string;
  
  // Structured data
  skills_json: string[];
  function?: string;
  seniority?: string;
  employment_type?: string;
  
  // Remote and location
  remote_type: JobRemoteType;
  remote_region_eligibility?: string;
  allowed_countries: string[];
  locations: string[];
  timezone_constraints?: string;
  location_raw?: string;
  country?: string;
  is_remote: boolean;
  
  // Compensation
  compensation_min?: number;
  compensation_max?: number;
  compensation_currency?: string;
  compensation_period?: string;
  salary_min?: number;
  salary_max?: number;
  salary_currency?: string;
  
  // Language and URLs
  language?: string;
  apply_url: string;
  job_url?: string;
  
  // Metadata
  posted_at?: string;
  first_seen_at: string;
  last_seen_at: string;
  status: JobStatus;
  source_primary: JobSourceEnum;
  source_name?: string; // Human-readable source name for display
  dedupe_key: string;
  created_at: string;
  updated_at: string;
}

// Raw source payload
export interface JobSource {
  id: string;
  source: JobSourceEnum;
  source_job_id: string;
  source_url?: string;
  raw_payload: Record<string, unknown>;
  fetched_at: string;
  job_id: string;
  created_at: string;
}

// User profile for matching
export interface UserJobProfile {
  id: string;
  clerk_id: string;
  
  // Resume and skills
  resume_text?: string;
  skills_json: string[];
  
  // Target roles
  target_titles: string[];
  seniority?: string;
  
  // Location preferences
  locations_allowed: string[];
  locations_excluded: string[];
  
  // Other preferences
  languages: string[];
  salary_min?: number;
  salary_max?: number;
  salary_currency: string;
  work_authorization_constraints: string[];
  
  // Profile context (optional, user-controlled)
  profile_context_text?: string;
  use_profile_context_for_matching: boolean;
  
  // Legacy fields (deprecated)
  role_keywords?: string[];
  preferred_regions?: string[];
  exclude_companies?: string[];
  
  // Metadata
  created_at: string;
  updated_at: string;
}

// User saved queries
export interface UserQuery {
  id: string;
  user_id: string;  // clerk_id
  query_text: string;
  use_profile_context: boolean;
  use_profile_basics: boolean;
  created_at: string;
  last_run_at?: string;
}

// Match explanation reason
export interface MatchReason {
  factor: string;  // e.g., "title_match", "skill_overlap", "seniority_fit"
  score: number;  // Contribution to total score
  description: string;  // Human-readable explanation
}

// Match between user and job
export interface Match {
  id: string;
  user_id: string;  // clerk_id
  job_id: string;
  score: number;  // 0-100
  reasons: MatchReason[];
  eligibility_passed: boolean;
  inputs_used: {
    profile_basics?: boolean;
    profile_context?: boolean;
    query?: string;
  };
  created_at: string;
  updated_at: string;
}

// Job sync metrics for observability
export interface JobSyncMetrics {
  id: string;
  source: JobSourceEnum;
  last_sync_at?: string;
  last_sync_status?: string;
  jobs_fetched: number;
  jobs_upserted: number;
  duplicates_found: number;
  errors_count: number;
  created_at: string;
  updated_at: string;
}

// Deduplication audit log
export interface JobMergeLog {
  id: string;
  canonical_job_id: string;
  merged_from_source: JobSourceEnum;
  merged_from_source_id: string;
  similarity_score?: number;
  merge_reason?: string;
  merged_at: string;
  created_by: string;
}

// Ingestion worker types
export interface RawJobPosting {
  source: JobSourceEnum;
  source_job_id: string;
  source_url?: string;
  raw_data: Record<string, unknown>;
  fetched_at: string;
}

export interface NormalizedJob {
  normalized_title: string;
  title: string;
  company_name: string;
  company_domain?: string;
  description_text: string;
  responsibilities?: string;
  requirements?: string;
  skills: string[];
  function?: string;
  seniority?: string;
  employment_type?: string;
  remote_type: JobRemoteType;
  remote_region_eligibility?: string;
  allowed_countries: string[];
  locations: string[];
  timezone_constraints?: string;
  compensation_min?: number;
  compensation_max?: number;
  compensation_currency?: string;
  compensation_period?: string;
  language?: string;
  apply_url: string;
  job_url?: string;
  posted_at?: string;
  source: JobSourceEnum;
  source_name?: string; // Human-readable source name
  source_job_id: string;
  source_url?: string;
}

// Discovery modes
export type DiscoveryMode = 'personalized' | 'manual_query';

// Job interaction types
export type JobInteractionType = 'save' | 'hide' | 'apply' | 'view';

// Search filters
export interface JobSearchFilters {
  query?: string;
  remote_type?: JobRemoteType[];
  seniority?: string[];
  function?: string[];
  allowed_countries?: string[];
  languages?: string[];
  posted_since?: string;
  salary_min?: number;
  salary_max?: number;
  source?: JobSourceEnum[];
}

// Search result with match data
export interface JobSearchResult extends Job {
  match?: Match;
  match_percentage?: number;
  match_reasons?: MatchReason[];
}

// Ranking inputs
export interface RankingInputs {
  profile?: UserJobProfile;
  query?: string;
  use_profile_context?: boolean;
  filters?: JobSearchFilters;
}

// Eligibility check result
export interface EligibilityResult {
  passed: boolean;
  failed_checks: string[];  // e.g., ["remote_type_mismatch", "location_not_allowed"]
}
