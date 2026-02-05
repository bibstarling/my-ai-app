/**
 * Optional LLM-based skills extraction for job descriptions.
 * Supports OpenAI-compatible (OpenAI, OpenRouter, Azure) and Anthropic APIs.
 */

import { logger } from './logger';

const SKILLS_PROMPT = `From the following job description, extract a list of technical and professional skills (technologies, tools, methodologies, job titles). Return ONLY a JSON array of strings, one skill per item, lowercase. No explanation.

Job description:

`;

export type LlmProvider = 'openai' | 'anthropic';

export interface LlmSkillsConfig {
  provider: LlmProvider;
  apiKey: string;
  model: string;
  baseUrl?: string;
}

const DEFAULT_OPENAI_MODEL = 'gpt-4o-mini';
const DEFAULT_ANTHROPIC_MODEL = 'claude-3-5-haiku-20241022';

export function getLlmSkillsConfig(): LlmSkillsConfig | null {
  const provider = (process.env.OPTIONAL_LLM_PROVIDER ?? 'openai').toLowerCase() as LlmProvider;
  const apiKey = process.env.OPTIONAL_LLM_API_KEY ?? '';
  if (!apiKey) return null;
  if (provider !== 'openai' && provider !== 'anthropic') return null;

  const model =
    process.env.OPTIONAL_LLM_MODEL ??
    (provider === 'anthropic' ? DEFAULT_ANTHROPIC_MODEL : DEFAULT_OPENAI_MODEL);
  const baseUrl = process.env.OPTIONAL_LLM_BASE_URL?.trim() || undefined;

  return { provider, apiKey, model, baseUrl };
}

/** Extract raw JSON array from LLM response (handles ```json ... ```). */
function parseSkillsJson(raw: string): string[] {
  let s = raw.trim();
  const codeBlock = /^```(?:json)?\s*([\s\S]*?)```$/i.exec(s);
  if (codeBlock) s = codeBlock[1].trim();
  const parsed = JSON.parse(s) as unknown;
  if (!Array.isArray(parsed)) return [];
  return parsed
    .filter((x): x is string => typeof x === 'string')
    .map((x) => x.trim().toLowerCase())
    .filter(Boolean);
}

/** Call LLM to extract skills from job text; returns [] on error. */
export async function extractSkillsWithLlm(text: string): Promise<string[]> {
  const config = getLlmSkillsConfig();
  if (!config) return [];

  const truncated = text.length > 12000 ? text.slice(0, 12000) + '…' : text;
  const prompt = SKILLS_PROMPT + truncated;

  try {
    if (config.provider === 'anthropic') {
      const url = config.baseUrl ?? 'https://api.anthropic.com/v1/messages';
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': config.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: config.model,
          max_tokens: 512,
          messages: [{ role: 'user', content: prompt }],
        }),
      });
      if (!res.ok) {
        const errBody = await res.text();
        logger.warn('LLM skills: Anthropic request failed', { status: res.status, body: errBody });
        return [];
      }
      const data = (await res.json()) as { content?: Array<{ type: string; text?: string }> };
      const content = data.content?.[0]?.text ?? '';
      return parseSkillsJson(content);
    }

    // OpenAI-compatible (OpenAI, OpenRouter, Azure)
    const base = config.baseUrl ?? 'https://api.openai.com/v1';
    const res = await fetch(`${base}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        max_tokens: 512,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    if (!res.ok) {
      const errBody = await res.text();
      logger.warn('LLM skills: OpenAI-compatible request failed', { status: res.status, body: errBody });
      return [];
    }
    const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const content = data.choices?.[0]?.message?.content ?? '';
    return parseSkillsJson(content);
  } catch (err) {
    logger.error('LLM skills: request error', err);
    return [];
  }
}
