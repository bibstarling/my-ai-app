/**
 * Parse job description for region constraints and populate remote_region_eligibility.
 */

import { REGION_PATTERNS } from './constants';

export function parseRemoteRegionEligibility(description: string): string | null {
  if (!description || typeof description !== 'string') return null;
  const found: string[] = [];
  for (const { pattern, label } of REGION_PATTERNS) {
    if (pattern.test(description) && !found.includes(label)) found.push(label);
  }
  return found.length > 0 ? found.join(', ') : null;
}
