/**
 * Remotive API connector: fetch and map to canonical schema.
 * API: https://remotive.com/api/remote-jobs
 */

import type { CanonicalJob, ConnectorFetchResult } from '../types';
import type { JobSourceEnum } from '../types';
import { buildDedupeKey } from '../dedupe';
import { parseRemoteRegionEligibility } from '../remote-eligibility';
import { extractSkillsForJob } from '../skills-extractor';
import { fetchWithRetry, rateLimit } from '../http';
import { getConfig } from '../constants';

const SOURCE: JobSourceEnum = 'remotive';
const API_URL = 'https://remotive.com/api/remote-jobs';
const RATE_LIMIT_MS = 2000;
const RATE_MAX = 1;

function toRemoteType(_raw: unknown): CanonicalJob['remote_type'] {
  return 'remote';
}

function stripHtml(html: string): string {
  if (!html || typeof html !== 'string') return '';
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

export async function fetchRecentJobsRemotive(): Promise<ConnectorFetchResult> {
  const config = getConfig();
  if (!config.remotiveEnabled) {
    return { jobs: [], source: SOURCE, rawItems: [] };
  }

  await rateLimit(SOURCE, RATE_LIMIT_MS, RATE_MAX);
  const res = await fetchWithRetry(API_URL);
  if (!res.ok) {
    throw new Error(`Remotive API error: ${res.status} ${res.statusText}`);
  }

  const data = (await res.json()) as Record<string, unknown>;
  const rawItems = (Array.isArray(data.jobs) ? data.jobs : []) as Record<string, unknown>[];

  const now = new Date().toISOString();
  const jobs: CanonicalJob[] = [];

  for (const item of rawItems) {
    const id = String(item.id ?? '');
    const title = String(item.title ?? '');
    const company = String(item.company_name ?? '');
    const description = stripHtml(String(item.description ?? ''));
    const url = String(item.url ?? '').trim();
    const applyUrl = url || `https://remotive.com/remote-jobs/listing/${id}`;
    const publicationDate = item.publication_date ? String(item.publication_date) : null;
    const postedAt =
      publicationDate && !Number.isNaN(Date.parse(publicationDate)) ? publicationDate : null;
    const location = String(item.candidate_required_location ?? '').trim() || null;

    const canonical: CanonicalJob = {
      title,
      company_name: company,
      company_domain: null,
      location_raw: location,
      country: null,
      is_remote: true,
      remote_type: toRemoteType(item),
      remote_region_eligibility: parseRemoteRegionEligibility(description) || (location ? location : null),
      employment_type: item.job_type ? String(item.job_type) : null,
      seniority: null,
      salary_min: null,
      salary_max: null,
      salary_currency: null,
      description_text: description.slice(0, 100_000),
      requirements_text: null,
      apply_url: applyUrl,
      source_primary: SOURCE,
      posted_at: postedAt,
      first_seen_at: now,
      last_seen_at: now,
      dedupe_key: buildDedupeKey({
        company_name: company,
        title,
        apply_url: applyUrl,
        posted_at: postedAt,
        first_seen_at: now,
      }),
      status: 'active',
      skills_json: await extractSkillsForJob(description),
    };
    jobs.push(canonical);
  }

  return { jobs, source: SOURCE, rawItems };
}

export async function fetchJobBySourceIdRemotive(sourceId: string): Promise<ConnectorFetchResult> {
  const config = getConfig();
  if (!config.remotiveEnabled) {
    return { jobs: [], source: SOURCE, rawItems: [] };
  }
  await rateLimit(SOURCE, RATE_LIMIT_MS, RATE_MAX);
  const res = await fetchWithRetry(API_URL);
  if (!res.ok) return { jobs: [], source: SOURCE, rawItems: [] };
  const data = (await res.json()) as Record<string, unknown>;
  const rawItems = (Array.isArray(data.jobs) ? data.jobs : []) as Record<string, unknown>[];
  const item = rawItems.find(
    (x) => x != null && typeof x === 'object' && String((x as { id?: unknown }).id) === sourceId
  );
  if (!item) return { jobs: [], source: SOURCE, rawItems: [] };
  const result = await fetchRecentJobsRemotive();
  const job = result.jobs.find((_, i) => String((result.rawItems as Record<string, unknown>[])[i]?.id) === sourceId);
  if (job) return { jobs: [job], source: SOURCE, rawItems: [item] };
  const title = String(item.title ?? '');
  const company = String(item.company_name ?? '');
  const description = stripHtml(String(item.description ?? ''));
  const url = String(item.url ?? '').trim();
  const applyUrl = url || `https://remotive.com/remote-jobs/listing/${sourceId}`;
  const publicationDate = item.publication_date ? String(item.publication_date) : null;
  const postedAt = publicationDate && !Number.isNaN(Date.parse(publicationDate)) ? publicationDate : null;
  const now = new Date().toISOString();
  const canonical: CanonicalJob = {
    title,
    company_name: company,
    company_domain: null,
    location_raw: String(item.candidate_required_location ?? '').trim() || null,
    country: null,
    is_remote: true,
    remote_type: 'remote',
    remote_region_eligibility: parseRemoteRegionEligibility(description),
    employment_type: item.job_type ? String(item.job_type) : null,
    seniority: null,
    salary_min: null,
    salary_max: null,
    salary_currency: null,
    description_text: description.slice(0, 100_000),
    requirements_text: null,
    apply_url: applyUrl,
    source_primary: SOURCE,
    posted_at: postedAt,
    first_seen_at: now,
    last_seen_at: now,
    dedupe_key: buildDedupeKey({
      company_name: company,
      title,
      apply_url: applyUrl,
      posted_at: postedAt,
      first_seen_at: now,
    }),
    status: 'active',
    skills_json: await extractSkillsForJob(description),
  };
  return { jobs: [canonical], source: SOURCE, rawItems: [item] };
}
