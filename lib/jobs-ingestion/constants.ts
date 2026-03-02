/**
 * Enums, skills dictionary, and config defaults for job ingestion.
 */

import type { JobRemoteType, JobStatus } from './types';

export const JOB_REMOTE_TYPES: JobRemoteType[] = ['remote', 'hybrid', 'onsite', 'unknown'];
export const JOB_STATUSES: JobStatus[] = ['active', 'expired', 'removed'];

/** Curated skills list for deterministic extraction from descriptions (lowercase for matching). */
export const SKILLS_DICTIONARY: string[] = [
  'javascript',
  'typescript',
  'python',
  'react',
  'node.js',
  'nodejs',
  'sql',
  'aws',
  'api',
  'rest',
  'graphql',
  'docker',
  'kubernetes',
  'terraform',
  'ci/cd',
  'devops',
  'product management',
  'product manager',
  'agile',
  'scrum',
  'user research',
  'roadmapping',
  'discovery',
  'figma',
  'llm',
  'ai',
  'machine learning',
  'data analysis',
  'postgresql',
  'mongodb',
  'redis',
  'next.js',
  'vue',
  'angular',
  'go',
  'golang',
  'rust',
  'java',
  'kotlin',
  'swift',
  'ruby',
  'rails',
  'php',
  'laravel',
  'html',
  'css',
  'tailwind',
  'sass',
  'testing',
  'jest',
  'cypress',
  'gcp',
  'azure',
  'linux',
  'git',
  'github',
  'jira',
  'confluence',
  'sales',
  'marketing',
  'customer success',
  'support',
  'remote',
  'communication',
  'leadership',
  'edtech',
  'fintech',
  'saas',
  'b2b',
  'b2c',
];

/**
 * Region patterns for parsing job posts. Labels are standard codes matching
 * user profile locations_allowed (BR, LATAM, US, Worldwide, GB, Europe, etc.)
 */
export const REGION_PATTERNS: { pattern: RegExp; label: string }[] = [
  // Global / unrestricted
  { pattern: /\b(global|worldwide|anywhere|work from anywhere|work from home anywhere)\b/i, label: 'Worldwide' },
  // US restrictions only (avoid tagging "we're a US company" as US-only)
  { pattern: /\b(us only|usa only|united states only|u\.?s\.? only|us-based only|usa-based only)\b/i, label: 'US' },
  { pattern: /\bmust be (based |located |residing )?in (the )?u\.?s\.?(a\.?)?\b/i, label: 'US' },
  { pattern: /\b(authorized to work (in|within) (the )?)(united states|u\.?s\.?a\.?)\b/i, label: 'US' },
  { pattern: /\bcandidates? (must be )?(in|located in|based in|residing in) (the )?u\.?s\.?\b/i, label: 'US' },
  { pattern: /\b(applicants?|candidates?) (in|from) (the )?(united states|u\.?s\.?a\.?) only\b/i, label: 'US' },
  { pattern: /\b(north america|n\.?a\.?) only\b/i, label: 'US' },
  // UK
  { pattern: /\b(uk only|united kingdom only|uk-based)\b/i, label: 'GB' },
  { pattern: /\bmust be (based |located )?in the u\.?k\.?\b/i, label: 'GB' },
  { pattern: /\b(great britain|britain)\b/i, label: 'GB' },
  // Europe / EMEA
  { pattern: /\b(eu only|europe only|european union|eea|european)\b/i, label: 'Europe' },
  { pattern: /\b(emea)( only)?\b/i, label: 'Europe' },
  { pattern: /\bmust be (based |located )?in (the )?e(u|urope)\b/i, label: 'Europe' },
  // LATAM
  { pattern: /\b(latam|latin america)( only)?\b/i, label: 'LATAM' },
  { pattern: /\bmust be (based |located )?in (latin america|latam)\b/i, label: 'LATAM' },
  // Brazil
  { pattern: /\b(brazil|brasil)( only)?\b/i, label: 'BR' },
  { pattern: /\bmust be (based |located )?in brazil\b/i, label: 'BR' },
  // Other countries (match profile codes)
  { pattern: /\b(canada)( only)?\b/i, label: 'CA' },
  { pattern: /\b(mexico|méxico)\b/i, label: 'MX' },
  { pattern: /\b(argentina)\b/i, label: 'AR' },
  { pattern: /\b(colombia)\b/i, label: 'CO' },
  { pattern: /\b(chile)\b/i, label: 'CL' },
  { pattern: /\b(germany|deutschland)\b/i, label: 'DE' },
  { pattern: /\b(france)\b/i, label: 'FR' },
  { pattern: /\b(spain|españa)\b/i, label: 'ES' },
  { pattern: /\b(australia)\b/i, label: 'APAC' },
  { pattern: /\b(apac|asia)( only)?\b/i, label: 'APAC' },
];

/** Map legacy/display labels to standard codes for allowed_countries */
export const REGION_LABEL_TO_CODE: Record<string, string> = {
  global: 'Worldwide',
  Worldwide: 'Worldwide',
  US: 'US',
  UK: 'GB',
  Brazil: 'BR',
  Canada: 'CA',
  'North America': 'US',
  EMEA: 'Europe',
  Germany: 'DE',
  France: 'FR',
  Spain: 'ES',
  Australia: 'APAC',
};

export function getConfig() {
  return {
    remoteokEnabled: process.env.REMOTEOK_ENABLED !== 'false',
    remotiveEnabled: process.env.REMOTIVE_ENABLED !== 'false',
    adzunaEnabled: process.env.ADZUNA_ENABLED !== 'false',
    adzunaAppId: process.env.ADZUNA_APP_ID ?? '',
    adzunaAppKey: process.env.ADZUNA_APP_KEY ?? '',
    jobExpireDays: parseInt(process.env.JOB_EXPIRE_DAYS ?? '14', 10) || 14,
    defaultRemoteRegion: process.env.DEFAULT_REMOTE_REGION ?? 'global',
    llmSkillsEnabled: process.env.OPTIONAL_LLM_SKILLS_ENABLED === 'true',
    adzunaCountries: (process.env.ADZUNA_COUNTRIES ?? 'us,gb').split(',').map((c) => c.trim()).filter(Boolean),
  };
}
