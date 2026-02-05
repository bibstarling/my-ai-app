/**
 * RemoteOK API connector: fetch and map to canonical schema.
 * API: https://remoteok.com/api (exclude first item if metadata).
 */

import type { CanonicalJob, ConnectorFetchResult } from '../types';
import type { JobSourceEnum } from '../types';
import { buildDedupeKey } from '../dedupe';
import { parseRemoteRegionEligibility } from '../remote-eligibility';
import { extractSkillsForJob } from '../skills-extractor';
import { fetchWithRetry, rateLimit } from '../http';
import { getConfig } from '../constants';

const SOURCE: JobSourceEnum = 'remoteok';
const API_URL = 'https://remoteok.com/api';
const RATE_LIMIT_MS = 2000;
const RATE_MAX = 1;

function toRemoteType(_raw: unknown): CanonicalJob['remote_type'] {
  return 'remote'; // RemoteOK is remote-first
}

function parseSalary(val: unknown): number | null {
  if (val == null) return null;
  const n = Number(val);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function stripHtml(html: string): string {
  if (!html || typeof html !== 'string') return '';
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

export async function fetchRecentJobsRemoteOK(): Promise<ConnectorFetchResult> {
  const config = getConfig();
  if (!config.remoteokEnabled) {
    return { jobs: [], source: SOURCE, rawItems: [] };
  }

  await rateLimit(SOURCE, RATE_LIMIT_MS, RATE_MAX);
  const res = await fetchWithRetry(API_URL);
  if (!res.ok) {
    throw new Error(`RemoteOK API error: ${res.status} ${res.statusText}`);
  }

  const data = (await res.json()) as unknown[];
  const rawItems = Array.isArray(data) ? data : [];
  // Exclude first item if it's metadata (has last_updated / legal)
  const items = rawItems.filter(
    (item): item is Record<string, unknown> =>
      item != null &&
      typeof item === 'object' &&
      !('last_updated' in item) &&
      !('legal' in item) &&
      'id' in item
  );

  const now = new Date().toISOString();
  const jobs: CanonicalJob[] = [];

  for (const item of items) {
    const id = String(item.id ?? '');
    const position = String(item.position ?? '');
    const company = String(item.company ?? '');
    const description = stripHtml(String(item.description ?? ''));
    const applyUrl = String(item.apply_url ?? item.url ?? '').trim() || `https://remoteok.com/remote-jobs/${id}`;
    const dateStr = item.date ? String(item.date) : null;
    const postedAt = dateStr && !Number.isNaN(Date.parse(dateStr)) ? dateStr : null;
    const location = String(item.location ?? '').trim() || null;
    const salaryMin = parseSalary(item.salary_min);
    const salaryMax = parseSalary(item.salary_max);

    const canonical: CanonicalJob = {
      title: position,
      company_name: company,
      company_domain: null,
      location_raw: location,
      country: null,
      is_remote: true,
      remote_type: toRemoteType(item),
      remote_region_eligibility: parseRemoteRegionEligibility(description),
      employment_type: null,
      seniority: null,
      salary_min: salaryMin,
      salary_max: salaryMax,
      salary_currency: salaryMin != null || salaryMax != null ? 'USD' : null,
      description_text: description.slice(0, 100_000),
      requirements_text: null,
      apply_url: applyUrl,
      source_primary: SOURCE,
      posted_at: postedAt,
      first_seen_at: now,
      last_seen_at: now,
      dedupe_key: buildDedupeKey({
        company_name: company,
        title: position,
        apply_url: applyUrl,
        posted_at: postedAt,
        first_seen_at: now,
      }),
      status: 'active',
      skills_json: await extractSkillsForJob(description),
    };
    jobs.push(canonical);
  }

  return { jobs, source: SOURCE, rawItems: items };
}

export async function fetchJobBySourceIdRemoteOK(sourceId: string): Promise<ConnectorFetchResult> {
  const result = await fetchRecentJobsRemoteOK();
  const rawItems = result.rawItems as Record<string, unknown>[];
  const idx = rawItems.findIndex((r) => String(r.id) === sourceId);
  if (idx < 0) return { jobs: [], source: SOURCE, rawItems: [] };
  const job = result.jobs[idx];
  if (!job) return { jobs: [], source: SOURCE, rawItems: [] };
  return {
    jobs: [job],
    source: SOURCE,
    rawItems: [rawItems[idx]],
  };
}
