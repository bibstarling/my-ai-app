/**
 * Dedupe key generation and exact-match logic for canonical jobs.
 */

import type { CanonicalJob } from './types';

const TITLE_ABBREVIATIONS: Record<string, string> = {
  'sr.': 'senior',
  'sr': 'senior',
  'jr.': 'junior',
  'jr': 'junior',
  'pm': 'product manager',
  'se': 'software engineer',
  'swe': 'software engineer',
  'dev': 'developer',
  'eng': 'engineer',
  'mgr': 'manager',
  'dir': 'director',
  'vp': 'vice president',
  'ft': 'full time',
  'pt': 'part time',
  'wfh': 'remote',
  'remote ok': 'remote',
};

/** Normalize title: lowercase, strip punctuation, expand common abbreviations. */
export function normalizeTitle(title: string): string {
  if (!title || typeof title !== 'string') return '';
  let t = title
    .toLowerCase()
    .replace(/[^\w\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  Object.entries(TITLE_ABBREVIATIONS).forEach(([abbr, full]) => {
    const re = new RegExp(`\\b${abbr.replace('.', '\\.')}\\b`, 'gi');
    t = t.replace(re, full);
  });
  return t;
}

/** Normalize company: lowercase, trim. */
export function normalizeCompany(company: string): string {
  if (!company || typeof company !== 'string') return '';
  return company.toLowerCase().trim();
}

/** Extract host + path from apply_url for dedupe (no query/hash). */
export function normalizeApplyUrl(url: string): string {
  if (!url || typeof url !== 'string') return '';
  try {
    const u = new URL(url);
    return `${u.hostname}${u.pathname}`.toLowerCase().replace(/\/+$/, '');
  } catch {
    return url.toLowerCase().slice(0, 200);
  }
}

/** Format posted_at or fallback date as YYYY-MM-DD. */
export function postedDay(isoDate: string | null, fallback: Date): string {
  if (isoDate) {
    try {
      const d = new Date(isoDate);
      if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
    } catch {
      // ignore
    }
  }
  return fallback.toISOString().slice(0, 10);
}

/** Build canonical dedupe_key from job fields. */
export function buildDedupeKey(job: {
  company_name: string;
  title: string;
  apply_url: string;
  posted_at?: string | null;
  first_seen_at?: string;
}): string {
  const company = normalizeCompany(job.company_name);
  const title = normalizeTitle(job.title);
  const url = normalizeApplyUrl(job.apply_url);
  const day = postedDay(
    job.posted_at ?? null,
    job.first_seen_at ? new Date(job.first_seen_at) : new Date()
  );
  const payload = `${company}|${title}|${url}|${day}`;
  return simpleHash(payload);
}

function simpleHash(str: string): string {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    const c = str.charCodeAt(i);
    h = (h << 5) - h + c;
    h |= 0;
  }
  return Math.abs(h).toString(36);
}

/** Exact match: same apply_url OR same (normalized company + normalized title + posted_day). */
export function exactMatch(
  a: { company_name: string; title: string; apply_url: string; posted_at?: string | null; first_seen_at?: string },
  b: { company_name: string; title: string; apply_url: string; posted_at?: string | null; first_seen_at?: string }
): boolean {
  const urlA = normalizeApplyUrl(a.apply_url);
  const urlB = normalizeApplyUrl(b.apply_url);
  if (urlA && urlB && urlA === urlB) return true;
  const dayA = postedDay(a.posted_at ?? null, a.first_seen_at ? new Date(a.first_seen_at) : new Date());
  const dayB = postedDay(b.posted_at ?? null, b.first_seen_at ? new Date(b.first_seen_at) : new Date());
  return (
    normalizeCompany(a.company_name) === normalizeCompany(b.company_name) &&
    normalizeTitle(a.title) === normalizeTitle(b.title) &&
    dayA === dayB
  );
}
