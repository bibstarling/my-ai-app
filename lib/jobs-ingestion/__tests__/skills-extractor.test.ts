/**
 * Tests for deterministic skills extraction baseline.
 */

import { describe, it, expect } from 'vitest';
import { extractSkillsFromDescription, extractSkillsForJob } from '../skills-extractor';

describe('extractSkillsFromDescription', () => {
  it('finds dictionary skills with word boundaries', () => {
    const desc = 'We use React and TypeScript. Experience with Node.js required.';
    const skills = extractSkillsFromDescription(desc);
    expect(skills).toContain('react');
    expect(skills).toContain('typescript');
    expect(skills).toContain('node.js');
  });
  it('is case-insensitive', () => {
    const desc = 'PYTHON and python and Python';
    const skills = extractSkillsFromDescription(desc);
    expect(skills.filter((s) => s === 'python')).toHaveLength(1);
  });
  it('returns empty for empty input', () => {
    expect(extractSkillsFromDescription('')).toEqual([]);
  });
  it('strips HTML before matching', () => {
    const desc = '<p>We need <strong>JavaScript</strong> and AWS.</p>';
    const skills = extractSkillsFromDescription(desc);
    expect(skills).toContain('javascript');
    expect(skills).toContain('aws');
  });
});

describe('extractSkillsForJob', () => {
  it('combines description and requirements', async () => {
    const skills = await extractSkillsForJob('We use React.', 'SQL and PostgreSQL required.');
    expect(skills).toContain('react');
    expect(skills).toContain('sql');
    expect(skills).toContain('postgresql');
  });
  it('returns deterministic sorted list', async () => {
    const a = await extractSkillsForJob('Python, AWS, React');
    const b = await extractSkillsForJob('React, AWS, Python');
    expect(a).toEqual(b);
  });
});
