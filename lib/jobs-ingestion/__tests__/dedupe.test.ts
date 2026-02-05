/**
 * Tests for normalization and dedupe_key generation, exact matching.
 */

import { describe, it, expect } from 'vitest';
import {
  normalizeTitle,
  normalizeCompany,
  normalizeApplyUrl,
  postedDay,
  buildDedupeKey,
  exactMatch,
} from '../dedupe';

describe('normalizeTitle', () => {
  it('lowercases and strips punctuation', () => {
    expect(normalizeTitle('Senior Product Manager')).toBe('senior product manager');
    expect(normalizeTitle('Sr. Engineer')).toBe('senior engineer');
  });
  it('expands common abbreviations', () => {
    expect(normalizeTitle('Jr. PM')).toContain('junior');
    expect(normalizeTitle('Sr. Dev')).toContain('senior');
  });
  it('returns empty for empty or non-string', () => {
    expect(normalizeTitle('')).toBe('');
    expect(normalizeTitle(null as unknown as string)).toBe('');
  });
});

describe('normalizeCompany', () => {
  it('lowercases and trims', () => {
    expect(normalizeCompany('  Acme Corp  ')).toBe('acme corp');
  });
  it('returns empty for empty', () => {
    expect(normalizeCompany('')).toBe('');
  });
});

describe('normalizeApplyUrl', () => {
  it('extracts host and path', () => {
    const u = normalizeApplyUrl('https://example.com/jobs/123?ref=foo');
    expect(u).toBe('example.com/jobs/123');
  });
  it('strips trailing slash', () => {
    expect(normalizeApplyUrl('https://example.com/')).toBe('example.com');
  });
});

describe('postedDay', () => {
  it('formats ISO date as YYYY-MM-DD', () => {
    expect(postedDay('2026-02-04T12:00:00Z', new Date())).toBe('2026-02-04');
  });
  it('uses fallback for invalid date', () => {
    const fallback = new Date('2026-02-04');
    expect(postedDay('invalid', fallback)).toBe('2026-02-04');
  });
});

describe('buildDedupeKey', () => {
  it('produces deterministic hash for same inputs', () => {
    const job = {
      company_name: 'Acme',
      title: 'Engineer',
      apply_url: 'https://acme.com/job/1',
      posted_at: '2026-02-04',
      first_seen_at: '2026-02-04T00:00:00Z',
    };
    expect(buildDedupeKey(job)).toBe(buildDedupeKey(job));
  });
  it('differs for different company/title/url/day', () => {
    const a = buildDedupeKey({
      company_name: 'A',
      title: 'T',
      apply_url: 'https://a.com/j',
      first_seen_at: '2026-02-04T00:00:00Z',
    });
    const b = buildDedupeKey({
      company_name: 'B',
      title: 'T',
      apply_url: 'https://a.com/j',
      first_seen_at: '2026-02-04T00:00:00Z',
    });
    expect(a).not.toBe(b);
  });
});

describe('exactMatch', () => {
  it('returns true when apply_url host+path match', () => {
    expect(
      exactMatch(
        { company_name: 'A', title: 'T', apply_url: 'https://x.com/job/1?q=2' },
        { company_name: 'B', title: 'T2', apply_url: 'https://x.com/job/1' }
      )
    ).toBe(true);
  });
  it('returns true when company, title, posted_day match', () => {
    const day = '2026-02-04';
    expect(
      exactMatch(
        { company_name: 'Acme', title: 'Engineer', apply_url: 'https://a.com/1', posted_at: day },
        { company_name: 'Acme', title: 'Engineer', apply_url: 'https://b.com/2', posted_at: day }
      )
    ).toBe(true);
  });
  it('returns false when company differs', () => {
    const day = '2026-02-04';
    expect(
      exactMatch(
        { company_name: 'Acme', title: 'Engineer', apply_url: 'https://a.com/1', posted_at: day },
        { company_name: 'Other', title: 'Engineer', apply_url: 'https://b.com/2', posted_at: day }
      )
    ).toBe(false);
  });
});
