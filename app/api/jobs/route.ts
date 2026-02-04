import { NextResponse } from 'next/server';
import { getResumeSearchText, resumeProfile } from '@/lib/resume-profile';

export type JobListing = {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  salary?: string;
  posted: string;
  description: string;
  applyUrl: string;
  skills: string[];
};

export type JobsParams = {
  remoteOnly?: boolean;
  country?: string;
  resumeText?: string;
};

const MOCK_JOBS_LIST: JobListing[] = [
  {
    id: '1',
    title: 'Senior Product Manager, AI',
    company: 'EdTech Startup',
    location: 'Remote (US)',
    type: 'Full-time',
    salary: '$150k - $180k',
    posted: '2 days ago',
    description: 'Drive AI strategy and LLM integrations for a learning platform. Work with multi-agent systems and discovery.',
    applyUrl: 'https://example.com/apply/1',
    skills: ['AI Strategy', 'LLM', 'Product Management'],
  },
  {
    id: '2',
    title: 'Lead Product Manager',
    company: 'Skillshare',
    location: 'New York, NY (Remote)',
    type: 'Full-time',
    posted: '1 week ago',
    description: 'Own roadmap for creator tools and marketplace. Continuous discovery, community growth.',
    applyUrl: 'https://example.com/apply/2',
    skills: ['Marketplace', 'Discovery', 'Community'],
  },
  {
    id: '3',
    title: 'Product Manager - Discovery',
    company: 'Consumer Tech',
    location: 'Remote',
    type: 'Full-time',
    salary: '$140k - $165k',
    posted: '3 days ago',
    description: 'Recommendation systems, user research, and opportunity mapping. Design system experience a plus.',
    applyUrl: 'https://example.com/apply/3',
    skills: ['Recommendation', 'User Research', 'Design Systems'],
  },
  {
    id: '4',
    title: 'EdTech Product Manager',
    company: 'Learning Platform',
    location: 'Brasília / Remote',
    type: 'Full-time',
    posted: '5 days ago',
    description: 'Digital transformation, course authoring, and ML-based recommendations. Government or education background valued.',
    applyUrl: 'https://example.com/apply/4',
    skills: ['EdTech', 'ML', 'Digital Transformation'],
  },
  {
    id: '5',
    title: 'Product Manager, Marketplace',
    company: 'Creator Economy',
    location: 'Remote',
    type: 'Full-time',
    salary: '$145k - $170k',
    posted: '1 day ago',
    description: 'Monetization, 1-1 sessions, digital products. Builder.io and headless CMS experience preferred.',
    applyUrl: 'https://example.com/apply/5',
    skills: ['Marketplace', 'CMS', 'Monetization'],
  },
  {
    id: '6',
    title: 'Product Manager (On-site)',
    company: 'Local Tech',
    location: 'São Paulo, Brazil',
    type: 'Full-time',
    posted: '4 days ago',
    description: 'On-site role in São Paulo. Product roadmap and stakeholder alignment.',
    applyUrl: 'https://example.com/apply/6',
    skills: ['Product Management', 'Stakeholder Management'],
  },
];

/** GET returns mock jobs (for debugging / same shape as POST). */
export async function GET() {
  try {
    return NextResponse.json(
      { jobs: MOCK_JOBS_LIST, ok: true },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, max-age=0, s-maxage=0',
        },
      }
    );
  } catch (e) {
    console.error('GET /api/jobs error:', e);
    return NextResponse.json(
      { jobs: [], ok: false, error: (e as Error).message },
      { status: 200 }
    );
  }
}

/**
 * Returns job listings. Uses resumeText if provided, else main-page profile.
 * Params: remoteOnly, country, resumeText (from uploaded resume).
 * Set JSEARCH_API_KEY (RapidAPI) to use real JSearch API.
 */
export async function POST(req: Request) {
  try {
    let remoteOnly = false;
    let country = '';
    let resumeText = '';

    const contentType = req.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      try {
        const body = await req.json();
        remoteOnly = !!body.remoteOnly;
        country = (body.country || '').trim();
        resumeText = (body.resumeText || '').trim().slice(0, 50000);
      } catch {
        return NextResponse.json(
          { error: 'Invalid request body (expected JSON)', jobs: [] },
          { status: 400 }
        );
      }
    }

    const searchText = resumeText || getResumeSearchText();
    const apiKey = process.env.JSEARCH_API_KEY;

    if (apiKey) {
      const queryParts = resumeText
        ? [resumeText.slice(0, 300).replace(/\s+/g, ' ')]
        : [resumeProfile.title, ...resumeProfile.jobTitles.slice(0, 2)];
      if (country) queryParts.push(country);
      if (remoteOnly) queryParts.push('remote');
      const query = encodeURIComponent(queryParts.join(' '));
      const url = new URL('https://jsearch.p.rapidapi.com/search');
      url.searchParams.set('query', query);
      url.searchParams.set('num_pages', '2');
      if (remoteOnly) url.searchParams.set('remote_jobs_only', 'true');

      const res = await fetch(url.toString(), {
        headers: {
          'X-RapidAPI-Key': apiKey,
          'X-RapidAPI-Host': 'jsearch.p.rapidapi.com',
        },
      });
      if (!res.ok) {
        const err = await res.text();
        console.error('JSearch API error:', err);
        return NextResponse.json(
          {
            error: 'Job search API failed',
            jobs: getMockJobs('', { remoteOnly, country }),
          },
          { status: 200 }
        );
      }
      const data = await res.json();
      let jobs: JobListing[] = (data.data || []).slice(0, 15).map((j: Record<string, unknown>, i: number) => ({
        id: (j.job_id as string) || `job-${i}`,
        title: (j.job_title as string) || 'Product Manager',
        company: (j.employer_name as string) || 'Company',
        location: (j.job_city as string) && (j.job_country as string)
          ? `${j.job_city}, ${j.job_country}`
          : (j.job_country as string) || 'Remote',
        type: (j.job_employment_type as string) || 'Full-time',
        salary: j.job_min_salary ? `${j.job_min_salary} - ${j.job_max_salary}` : undefined,
        posted: (j.job_posted_at_timestamp as number)
          ? new Date((j.job_posted_at_timestamp as number) * 1000).toLocaleDateString()
          : 'Recent',
        description: (j.job_description as string)?.slice(0, 200) + '...' || '',
        applyUrl: (j.job_apply_link as string) || (j.job_google_link as string) || '#',
        skills: [],
      }));
      if (remoteOnly) jobs = jobs.filter((j) => /remote/i.test(j.location || j.description));
      if (country) jobs = jobs.filter((j) => new RegExp(country, 'i').test(j.location || j.description || ''));
      return NextResponse.json({ jobs });
    }

    const jobs = getMockJobs(searchText, { remoteOnly, country });
    return NextResponse.json({ jobs });
  } catch (error) {
    console.error('Jobs API error:', error);
    return NextResponse.json(
      { error: (error as Error).message, jobs: getMockJobs('', {}) },
      { status: 200 }
    );
  }
}

function getMockJobs(
  _searchText: string,
  opts: { remoteOnly?: boolean; country?: string }
): JobListing[] {
  let list = [...MOCK_JOBS_LIST];
  if (opts.remoteOnly) {
    list = list.filter(
      (j) =>
        /remote/i.test(j.location) ||
        /remote/i.test(j.description)
    );
  }
  if (opts.country) {
    const re = new RegExp(opts.country, 'i');
    list = list.filter(
      (j) => re.test(j.location) || re.test(j.description)
    );
  }
  return list;
}
