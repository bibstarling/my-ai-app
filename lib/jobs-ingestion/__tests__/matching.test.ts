/**
 * Tests for ranking logic deterministic output.
 */

import { describe, it, expect } from 'vitest';
import { rankJobs } from '../matching';
import type { UserJobProfile } from '../types';
import type { CanonicalJob } from '../types';

function makeJob(overrides: Partial<CanonicalJob> & { id: string }): CanonicalJob & { id: string } {
  const { id, ...rest } = overrides;
  return {
    title: 'Software Engineer',
    company_name: 'Acme',
    company_domain: null,
    location_raw: null,
    country: null,
    is_remote: true,
    remote_type: 'remote',
    remote_region_eligibility: null,
    employment_type: null,
    seniority: null,
    salary_min: null,
    salary_max: null,
    salary_currency: null,
    description_text: 'We build with React and TypeScript.',
    requirements_text: null,
    apply_url: 'https://acme.com/job/1',
    source_primary: 'remoteok',
    posted_at: new Date().toISOString(),
    first_seen_at: new Date().toISOString(),
    last_seen_at: new Date().toISOString(),
    dedupe_key: 'abc',
    status: 'active',
    skills_json: ['react', 'typescript'],
    ...rest,
    id,
  };
}

const defaultProfile: UserJobProfile = {
  clerk_id: 'user-1',
  skills_json: ['react', 'typescript', 'node.js'],
  role_keywords: ['engineer', 'developer'],
  preferred_regions: [],
  exclude_companies: [],
};

describe('rankJobs', () => {
  it('returns deterministic order by score', () => {
    const fixedNow = new Date('2026-02-04T12:00:00Z').toISOString();
    const jobs = [
      makeJob({ id: '1', skills_json: ['react'], title: 'Engineer', posted_at: fixedNow, last_seen_at: fixedNow }),
      makeJob({ id: '2', skills_json: ['react', 'typescript', 'node.js'], title: 'Senior Developer', posted_at: fixedNow, last_seen_at: fixedNow }),
    ];
    const a = rankJobs(jobs, defaultProfile, { limit: 10 });
    const b = rankJobs(jobs, defaultProfile, { limit: 10 });
    expect(a.map((r) => r.job.id)).toEqual(b.map((r) => r.job.id));
    expect(a[0].score).toBeGreaterThanOrEqual(a[1].score);
  });
  it('scores higher when more skills match', () => {
    const highMatch = makeJob({
      id: '1',
      skills_json: ['react', 'typescript', 'node.js'],
      title: 'Developer',
    });
    const lowMatch = makeJob({ id: '2', skills_json: [], title: 'Developer' });
    const results = rankJobs([lowMatch, highMatch], defaultProfile, { limit: 10 });
    expect(results[0].job.id).toBe('1');
    expect(results[0].score).toBeGreaterThan(results[1].score);
  });
  it('excludes companies in exclude_companies', () => {
    const jobs = [
      makeJob({ id: '1', company_name: 'Acme' }),
      makeJob({ id: '2', company_name: 'Blocked Inc' }),
    ];
    const results = rankJobs(jobs, { ...defaultProfile, exclude_companies: ['blocked inc'] }, { limit: 10 });
    expect(results.map((r) => r.job.company_name)).not.toContain('Blocked Inc');
  });
  it('returns at most limit results', () => {
    const jobs = Array.from({ length: 30 }, (_, i) =>
      makeJob({ id: String(i), skills_json: ['react'] })
    );
    const results = rankJobs(jobs, defaultProfile, { limit: 5 });
    expect(results).toHaveLength(5);
  });
});
