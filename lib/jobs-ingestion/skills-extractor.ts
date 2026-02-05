/**
 * Deterministic skills extraction from description using curated dictionary.
 * Optional LLM-based extraction when OPTIONAL_LLM_SKILLS_ENABLED=true and API key set.
 */

import { SKILLS_DICTIONARY, getConfig } from './constants';
import { getLlmSkillsConfig, extractSkillsWithLlm } from './llm-skills';

/** Strip HTML and normalize whitespace for matching. */
function cleanText(text: string): string {
  if (!text || typeof text !== 'string') return '';
  return text
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .trim();
}

/**
 * Extract skills from description using dictionary (case-insensitive word-boundary matches).
 */
export function extractSkillsFromDescription(description: string): string[] {
  const cleaned = cleanText(description);
  if (!cleaned) return [];
  const found = new Set<string>();
  for (const skill of SKILLS_DICTIONARY) {
    const re = new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (re.test(cleaned)) found.add(skill);
  }
  return Array.from(found).sort();
}

/**
 * Extract skills from job (description + optional requirements).
 * When LLM is enabled and configured, calls LLM and merges results with dictionary skills.
 */
export async function extractSkillsForJob(
  description: string,
  requirementsText?: string | null
): Promise<string[]> {
  const combined = [description, requirementsText].filter(Boolean).join('\n');
  const dictSkills = extractSkillsFromDescription(combined);
  const config = getConfig();
  const llmConfig = getLlmSkillsConfig();
  if (!config.llmSkillsEnabled || !llmConfig) {
    return dictSkills;
  }
  const llmSkills = await extractSkillsWithLlm(combined);
  const merged = new Set<string>([...dictSkills]);
  for (const s of llmSkills) {
    const normalized = s.trim().toLowerCase();
    if (normalized) merged.add(normalized);
  }
  return Array.from(merged).sort();
}
