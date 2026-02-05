/**
 * Adzuna Jobs API connector: search by "remote" and country; map to canonical schema.
 * API: https://api.adzuna.com/v1/api/jobs/{country}/search/1
 */

import type { CanonicalJob, ConnectorFetchResult } from '../types';
import type { JobSourceEnum } from '../types';
import { buildDedupeKey } from '../dedupe';
import { parseRemoteRegionEligibility } from '../remote-eligibility';
import { extractSkillsForJob } from '../skills-extractor';
import { fetchWithRetry, rateLimit } from '../http';
import { getConfig } from '../constants';

const SOURCE: JobSourceEnum = 'adzuna';
const BASE_URL = 'https://api.adzuna.com/v1/api/jobs';
const RATE_LIMIT_MS = 1500;
const RATE_MAX = 1;

/** Adzuna API nested objects */
interface AdzunaCompany {
  display_name?: string;
}
interface AdzunaLocation {
  display_name?: string;
  area?: string | string[];
}

function stripHtml(html: string): string {
  if (!html || typeof html !== 'string') return '';
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function toRemoteType(item: Record<string, unknown>): CanonicalJob['remote_type'] {
  const desc = String(item.description ?? '').toLowerCase();
  if (/remote|work from home|wfh|distributed/i.test(desc)) return 'remote';
  if (/hybrid/i.test(desc)) return 'hybrid';
  return 'unknown';
}

export async function fetchRecentJobsAdzuna(): Promise<ConnectorFetchResult> {
  const config = getConfig();
  if (!config.adzunaEnabled || !config.adzunaAppId || !config.adzunaAppKey) {
    return { jobs: [], source: SOURCE, rawItems: [] };
  }

  const countries = config.adzunaCountries.length ? config.adzunaCountries : ['us', 'gb'];
  const allJobs: CanonicalJob[] = [];
  const allRaw: Record<string, unknown>[] = [];

  for (const country of countries) {
    await rateLimit(`${SOURCE}:${country}`, RATE_LIMIT_MS, RATE_MAX);
    const url = new URL(`${BASE_URL}/${country.toLowerCase()}/search/1`);
    url.searchParams.set('app_id', config.adzunaAppId);
    url.searchParams.set('app_key', config.adzunaAppKey);
    url.searchParams.set('what', 'remote');
    url.searchParams.set('results_per_page', '50');

    const res = await fetchWithRetry(url.toString());
    if (!res.ok) continue;

    const data = (await res.json()) as Record<string, unknown>;
    const results = (data.results as Record<string, unknown>[]) ?? [];

    const now = new Date().toISOString();

    for (const item of results) {
      if (!item || typeof item !== 'object') continue;
      const itemRec = item as Record<string, unknown>;
      const companyObj = itemRec.company as AdzunaCompany | undefined;
      const locationObj = itemRec.location as AdzunaLocation | undefined;
      const title = String(itemRec.title ?? '');
      const company = String(companyObj?.display_name ?? itemRec.company ?? '');
      const description = stripHtml(String(itemRec.description ?? ''));
      const applyUrl = String(itemRec.redirect_url ?? itemRec.url ?? '').trim() || '';
      if (!applyUrl) continue;

      const postedAt = itemRec.created ? new Date(String(itemRec.created)).toISOString() : null;
      const location = [locationObj?.display_name, locationObj?.area].filter(Boolean).join(', ') || null;
      const salaryMin = itemRec.salary_min != null ? Number(itemRec.salary_min) : null;
      const salaryMax = itemRec.salary_max != null ? Number(itemRec.salary_max) : null;
      const salaryCur = itemRec.salary_currency ? String(itemRec.salary_currency) : null;
      const sourceId = itemRec.id != null ? String(itemRec.id) : '';

      const canonical: CanonicalJob = {
        title,
        company_name: company,
        company_domain: null,
        location_raw: location,
        country: country.toUpperCase(),
        is_remote: true,
        remote_type: toRemoteType(itemRec),
        remote_region_eligibility: parseRemoteRegionEligibility(description),
        employment_type: itemRec.contract_type ? String(itemRec.contract_type) : null,
        seniority: null,
        salary_min: Number.isFinite(salaryMin) ? salaryMin : null,
        salary_max: Number.isFinite(salaryMax) ? salaryMax : null,
        salary_currency: salaryCur,
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
      allJobs.push(canonical);
      allRaw.push({ ...itemRec, _country: country });
    }
  }

  return { jobs: allJobs, source: SOURCE, rawItems: allRaw };
}

export async function fetchJobBySourceIdAdzuna(
  _sourceId: string,
  country?: string
): Promise<ConnectorFetchResult> {
  const config = getConfig();
  if (!config.adzunaEnabled || !config.adzunaAppId || !config.adzunaAppKey) {
    return { jobs: [], source: SOURCE, rawItems: [] };
  }
  const c = (country ?? 'us').toLowerCase();
  await rateLimit(`${SOURCE}:${c}`, RATE_LIMIT_MS, RATE_MAX);
  const url = new URL(`${BASE_URL}/${c}/search/1`);
  url.searchParams.set('app_id', config.adzunaAppId);
  url.searchParams.set('app_key', config.adzunaAppKey);
  url.searchParams.set('what', 'remote');
  url.searchParams.set('results_per_page', '50');
  const res = await fetchWithRetry(url.toString());
  if (!res.ok) return { jobs: [], source: SOURCE, rawItems: [] };
  const data = (await res.json()) as Record<string, unknown>;
  const results = (data.results as Record<string, unknown>[]) ?? [];
  const item = results.find((x) => x && String(x.id) === _sourceId);
  if (!item) return { jobs: [], source: SOURCE, rawItems: [] };
  const full = await fetchRecentJobsAdzuna();
  const job = full.jobs.find(
    (j, i) =>
      (full.rawItems as Record<string, unknown>[])[i] &&
      String((full.rawItems as Record<string, unknown>[])[i].id) === _sourceId
  );
  if (job) return { jobs: [job], source: SOURCE, rawItems: [item] };
  const itemRec = item as Record<string, unknown>;
  const companyObj = itemRec.company as AdzunaCompany | undefined;
  const title = String(itemRec.title ?? '');
  const company = String(companyObj?.display_name ?? itemRec.company ?? '');
  const description = stripHtml(String(itemRec.description ?? ''));
  const applyUrl = String(itemRec.redirect_url ?? itemRec.url ?? '').trim() || '';
  const now = new Date().toISOString();
  const postedAt = itemRec.created ? new Date(String(itemRec.created)).toISOString() : null;
  const canonical: CanonicalJob = {
    title,
    company_name: company,
    company_domain: null,
    location_raw: null,
    country: c.toUpperCase(),
    is_remote: true,
    remote_type: 'unknown',
    remote_region_eligibility: parseRemoteRegionEligibility(description),
    employment_type: null,
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
