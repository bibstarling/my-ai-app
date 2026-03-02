/**
 * Parse job description and location field for region constraints and remote type.
 * Used by the job pipeline so location/onsite detection is consistent across connectors.
 */

import type { JobRemoteType } from './types';
import { REGION_PATTERNS, REGION_LABEL_TO_CODE } from './constants';

/** Phrases that indicate in-person / onsite (check before remote/hybrid) */
const ONSITE_PHRASES = [
  /\bin[-\s]?person\b/i,
  /\bon[-\s]?site\b/i,
  /\bonsite\b/i,
  /\bin[-\s]?office\b/i,
  /\boffice[-\s]?based\b/i,
  /\bwork (in|at) (our )?office\b/i,
  /\bmust (be )?(in office|on site|onsite)\b/i,
  /\brelocate\s+(to|required)\b/i,
  /\bno (remote|work from home)\b/i,
  /\bnot (remote|eligible for remote)\b/i,
];

/** Phrases that indicate hybrid */
const HYBRID_PHRASES = [/\bhybrid\b/i, /\bsome (days )?in office\b/i, /\bflexible (location|remote)\b/i];

/** Phrases that indicate remote-friendly */
const REMOTE_PHRASES = [
  /\bremote\b/i,
  /\bwork from home\b/i,
  /\bwfh\b/i,
  /\bdistributed\b/i,
  /\bwork from anywhere\b/i,
];

/**
 * Detect remote_type from job text. Order: onsite first, then hybrid, then remote.
 * Use in connectors so "US only" and "in person" jobs get correct type and can be filtered.
 */
export function detectRemoteTypeFromText(
  description: string,
  locationRaw?: string | null
): JobRemoteType {
  const text = [description, locationRaw].filter(Boolean).join(' ');
  if (!text || typeof text !== 'string') return 'unknown';

  const lower = text.toLowerCase();
  for (const re of ONSITE_PHRASES) {
    if (re.test(lower)) return 'onsite';
  }
  for (const re of HYBRID_PHRASES) {
    if (re.test(lower)) return 'hybrid';
  }
  for (const re of REMOTE_PHRASES) {
    if (re.test(lower)) return 'remote';
  }
  return 'unknown';
}

/**
 * Parse text (description and/or location_raw) for region eligibility.
 * Combines results from description and locationRaw, dedupes, returns standard codes.
 */
export function parseRemoteRegionEligibility(
  description: string,
  locationRaw?: string | null
): string | null {
  const text = [description, locationRaw].filter(Boolean).join(' ');
  if (!text || typeof text !== 'string') return null;
  const found: string[] = [];
  for (const { pattern, label } of REGION_PATTERNS) {
    if (label && pattern.test(text) && !found.includes(label)) {
      found.push(label);
    }
  }
  return found.length > 0 ? found.join(', ') : null;
}

/**
 * Convert stored remote_region_eligibility (comma-separated) to allowed_countries array
 * for ranking/discover. Normalizes legacy labels to standard codes. Used when reading
 * jobs from DB so ranking can filter by location.
 */
export function parseRemoteRegionEligibilityToAllowedCountries(
  remoteRegionEligibility: string | null | undefined
): string[] {
  if (!remoteRegionEligibility || typeof remoteRegionEligibility !== 'string') {
    return [];
  }
  const parts = remoteRegionEligibility
    .split(/[,;]/)
    .map((p) => p.trim())
    .filter(Boolean);
  const codes = new Set<string>();
  for (const part of parts) {
    const code = REGION_LABEL_TO_CODE[part] || part;
    if (code) codes.add(code);
  }
  return Array.from(codes);
}
