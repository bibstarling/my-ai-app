/**
 * Resume / portfolio profile used for job matching and assistant tools.
 * Sourced from main page content (Bianca Starling).
 */

export const resumeProfile = {
  name: 'Bianca Starling',
  title: 'Lead Product Manager',
  location: 'Brasília, Brazil (Remote)',
  website: 'www.biancastarling.com',
  summary:
    'Building community-driven EdTech products and AI-powered experiences. Lead Product Manager with experience in AI strategy, multi-agent MCP, marketplace growth, continuous discovery, and product leadership.',
  jobTitles: [
    'Lead Product Manager',
    'Senior Product Manager',
    'EdTech Product Manager',
    'Product Manager',
  ],
  skills: [
    'AI Strategy',
    'MCP',
    'Multi-Agent Systems',
    'LLM Integrations',
    'Product Vision',
    'Roadmapping',
    'Marketplace Growth',
    'Continuous Discovery',
    'User Research',
    'Recommendation Systems',
    'API Design',
    'CMS',
    'Design Systems',
    'EdTech',
    'Digital Transformation',
  ],
  companies: ['Skillshare', 'Voxy', 'SENAI', 'Unyleya Educacional'],
};

/** Plain-text summary for search/matching (e.g. job APIs). */
export function getResumeSearchText(): string {
  const { title, jobTitles, skills, companies, summary } = resumeProfile;
  return [
    summary,
    title,
    ...jobTitles,
    ...skills,
    ...companies,
  ].join(' ');
}
