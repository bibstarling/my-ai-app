/**
 * Job matching and ranking: Jaccard skills, title boost, recency decay, region penalty, quality penalty.
 */

import type { CanonicalJob, MatchResult, UserJobProfile } from './types';

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 1;
  if (a.size === 0 || b.size === 0) return 0;
  const inter = [...a].filter((x) => b.has(x)).length;
  const union = a.size + b.size - inter;
  return union === 0 ? 0 : inter / union;
}

const RECENCY_HALFLIFE_DAYS = 7;
const MIN_DESC_LENGTH = 100;

export function rankJobs(
  jobs: (CanonicalJob & { id: string })[],
  profile: UserJobProfile,
  options: {
    roleKeywords?: string[];
    seniority?: string;
    salaryMin?: number;
    regions?: string[];
    excludeCompanies?: string[];
    limit?: number;
  }
): MatchResult[] {
  const roleKeywords = new Set(
    (options.roleKeywords ?? profile.role_keywords ?? []).map((k) => k.toLowerCase().trim())
  );
  const userSkills = new Set(
    (profile.skills_json ?? []).map((s) => s.toLowerCase().trim()).filter(Boolean)
  );
  const preferredRegions = new Set(
    (options.regions ?? profile.preferred_regions ?? []).map((r) => r.toLowerCase().trim())
  );
  const excludeCompanies = new Set(
    (options.excludeCompanies ?? profile.exclude_companies ?? []).map((c) => c.toLowerCase().trim())
  );
  const now = Date.now();
  const results: MatchResult[] = [];

  for (const job of jobs) {
    const companyLower = job.company_name.toLowerCase().trim();
    if (excludeCompanies.has(companyLower)) continue;

    const jobSkills = new Set(
      (job.skills_json ?? []).map((s) => s.toLowerCase().trim()).filter(Boolean)
    );
    const skillsScore = jaccard(userSkills, jobSkills);

    let titleBoost = 0;
    const titleLower = job.title.toLowerCase();
    for (const kw of roleKeywords) {
      if (kw && titleLower.includes(kw)) titleBoost += 0.15;
    }
    titleBoost = Math.min(titleBoost, 0.5);

    let recencyBoost = 0;
    const postedAt = job.posted_at ? new Date(job.posted_at).getTime() : new Date(job.last_seen_at).getTime();
    const daysAgo = (now - postedAt) / (24 * 60 * 60 * 1000);
    recencyBoost = Math.max(0, 1 - daysAgo / (RECENCY_HALFLIFE_DAYS * 2));
    recencyBoost *= 0.3;

    let regionPenalty = 0;
    const eligibility = (job.remote_region_eligibility ?? '').toLowerCase();
    if (eligibility && preferredRegions.size > 0) {
      const jobRegions = eligibility.split(/[\s,]+/).map((r) => r.trim()).filter(Boolean);
      const match = [...preferredRegions].some((pr) =>
        jobRegions.some((jr) => jr.includes(pr) || pr.includes(jr))
      );
      if (!match && jobRegions.length > 0) regionPenalty = 0.2;
    }

    let qualityPenalty = 0;
    const descLen = (job.description_text ?? '').length;
    if (descLen < MIN_DESC_LENGTH) qualityPenalty = 0.15;

    const score =
      skillsScore * 0.5 +
      titleBoost +
      recencyBoost -
      regionPenalty -
      qualityPenalty;
    const finalScore = Math.max(0, Math.min(1, score));

    results.push({
      job: { ...job },
      score: finalScore,
      breakdown: {
        skillsScore,
        titleBoost,
        recencyBoost,
        regionPenalty,
        qualityPenalty,
      },
    });
  }

  results.sort((a, b) => b.score - a.score);
  const limit = options.limit ?? 20;
  return results.slice(0, limit);
}
