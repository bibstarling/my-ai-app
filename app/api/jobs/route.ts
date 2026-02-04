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
  language?: string;
  datePosted?: string;
  employmentTypes?: string[];
  jobRequirements?: string[];
  radius?: number;
  excludeJobPublishers?: string[];
};

const COUNTRY_TO_ISO: Record<string, string> = {
  us: 'us', usa: 'us', 'united states': 'us', 'united states of america': 'us',
  uk: 'gb', 'united kingdom': 'gb', britain: 'gb',
  brazil: 'br', brasil: 'br',
  germany: 'de', deutschland: 'de',
  france: 'fr',
  canada: 'ca',
  australia: 'au',
  spain: 'es', españa: 'es',
  netherlands: 'nl',
  india: 'in',
  mexico: 'mx', méxico: 'mx',
  remote: 'us',
};

function toCountryCode(country: string): string {
  if (!country || !country.trim()) return '';
  const key = country.trim().toLowerCase();
  return COUNTRY_TO_ISO[key] || '';
}

/* Real jobs from JSearch use job_apply_link / job_google_link from the API. Mock jobs below have no real apply URL. */
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
    applyUrl: '#',
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
    applyUrl: '#',
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
    applyUrl: '#',
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
    applyUrl: '#',
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
    applyUrl: '#',
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
    applyUrl: '#',
    skills: ['Product Management', 'Stakeholder Management'],
  },
];

const isProd = process.env.NODE_ENV === 'production';

/** GET: in prod returns empty (no mock data); in dev returns mock jobs for testing. */
export async function GET() {
  try {
    const jobs = isProd ? [] : MOCK_JOBS_LIST;
    return NextResponse.json(
      { jobs, ok: true },
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
 * Params: remoteOnly, country, resumeText, language, datePosted, employmentTypes, jobRequirements, radius, excludeJobPublishers.
 * Set JSEARCH_API_KEY (RapidAPI) to use real JSearch API.
 */
export async function POST(req: Request) {
  try {
    let remoteOnly = false;
    let country = '';
    let resumeText = '';
    let language = '';
    let datePosted = '';
    let employmentTypes: string[] = [];
    let jobRequirements: string[] = [];
    let radius: number | undefined;
    let excludeJobPublishers: string[] = [];

    const contentType = req.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      try {
        const body = await req.json();
        remoteOnly = !!body.remoteOnly;
        country = (body.country || '').trim();
        resumeText = (body.resumeText || '').trim().slice(0, 50000);
        language = (body.language || '').trim();
        datePosted = (body.datePosted || '').trim();
        employmentTypes = Array.isArray(body.employmentTypes) ? body.employmentTypes.filter((x: unknown) => typeof x === 'string') : [];
        jobRequirements = Array.isArray(body.jobRequirements) ? body.jobRequirements.filter((x: unknown) => typeof x === 'string') : [];
        const r = body.radius;
        radius = typeof r === 'number' && r >= 0 ? r : (typeof r === 'string' && /^\d+$/.test(r.trim()) ? parseInt(r.trim(), 10) : undefined);
        excludeJobPublishers = Array.isArray(body.excludeJobPublishers) ? body.excludeJobPublishers.filter((x: unknown) => typeof x === 'string') : [];
      } catch {
        return NextResponse.json(
          { error: 'Invalid request body (expected JSON)', jobs: [] },
          { status: 400 }
        );
      }
    }

    const searchText = resumeText || getResumeSearchText();
    const apiKey = process.env.JSEARCH_API_KEY;
    const opts = { remoteOnly, country, datePosted, employmentTypes, jobRequirements, radius, excludeJobPublishers };

    if (apiKey) {
      const queryParts = resumeText
        ? [resumeText.slice(0, 300).replace(/\s+/g, ' ')]
        : [resumeProfile.title, ...resumeProfile.jobTitles.slice(0, 2)];
      const queryText = queryParts.join(' ');
      const locationHint = country ? ` in ${country}` : '';
      const query = `${queryText} jobs${locationHint}`.trim();
      const url = new URL('https://jsearch.p.rapidapi.com/search');
      url.searchParams.set('query', query);
      url.searchParams.set('num_pages', '2');
      if (remoteOnly) url.searchParams.set('work_from_home', 'true');
      const countryCode = toCountryCode(country);
      if (countryCode) url.searchParams.set('country', countryCode);
      if (language) url.searchParams.set('language', language);
      if (datePosted) url.searchParams.set('date_posted', datePosted);
      if (employmentTypes.length) url.searchParams.set('employment_types', employmentTypes.join(','));
      if (jobRequirements.length) url.searchParams.set('job_requirements', jobRequirements.join(','));
      if (radius !== undefined && radius > 0) url.searchParams.set('radius', String(radius));
      if (excludeJobPublishers.length) url.searchParams.set('exclude_job_publishers', excludeJobPublishers.join(','));

      const res = await fetch(url.toString(), {
        headers: {
          'X-RapidAPI-Key': apiKey,
          'X-RapidAPI-Host': 'jsearch.p.rapidapi.com',
        },
      });
      if (!res.ok) {
        const err = await res.text();
        console.error('JSearch API error:', res.status, err);
        return NextResponse.json(
          {
            error: `Job search API failed (${res.status}). Check JSEARCH_API_KEY and quota.`,
            jobs: isProd ? [] : getMockJobs('', opts),
          },
          { status: 200 }
        );
      }
      const data = await res.json();
      if (data?.status === 'ERROR' && data?.error) {
        const msg = typeof data.error === 'object' && data.error?.message ? data.error.message : String(data.error);
        return NextResponse.json(
          { error: `Job search error: ${msg}`, jobs: isProd ? [] : getMockJobs('', { remoteOnly, country }) },
          { status: 200 }
        );
      }
      const raw = data?.data;
      const rawJobs = Array.isArray(raw)
        ? raw
        : Array.isArray(raw?.jobs)
          ? raw.jobs
          : Array.isArray(data?.jobs)
            ? data.jobs
            : [];
      let jobs: JobListing[] = rawJobs.slice(0, 15).map((j: Record<string, unknown>, i: number) => ({
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

    if (isProd) {
      return NextResponse.json({
        jobs: [],
        error: 'Job search is not configured. Add JSEARCH_API_KEY in your host environment to show real job listings.',
      });
    }
    const jobs = getMockJobs(searchText, opts);
    return NextResponse.json({ jobs });
  } catch (error) {
    console.error('Jobs API error:', error);
    return NextResponse.json(
      {
        error: (error as Error).message,
        jobs: isProd ? [] : getMockJobs('', {}),
      },
      { status: 200 }
    );
  }
}

function getMockJobs(
  _searchText: string,
  opts: {
    remoteOnly?: boolean;
    country?: string;
    datePosted?: string;
    employmentTypes?: string[];
    jobRequirements?: string[];
    radius?: number;
    excludeJobPublishers?: string[];
  }
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
  if (opts.employmentTypes?.length) {
    const types = opts.employmentTypes.map((t) => t.toLowerCase());
    list = list.filter((j) => {
      const t = (j.type || '').toLowerCase();
      return types.some((x) => t.includes(x) || (x === 'fulltime' && t.includes('full-time')) || (x === 'parttime' && t.includes('part-time')));
    });
  }
  return list;
}
