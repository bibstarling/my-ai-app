import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { generateAICompletion } from '@/lib/ai-provider';
import { scrapeUrl, isValidUrl, fetchPageContentLight } from '@/lib/url-scraper';

const MIN_CONTENT_FOR_LIGHT_FETCH = 800;

export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { url } = body;

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    if (!isValidUrl(url)) {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    let pageContent: string;
    let pageTitle: string;

    // Try fast path first (HTTP + cheerio) for static/semi-static job pages
    try {
      const light = await fetchPageContentLight(url);
      if (light.content.length >= MIN_CONTENT_FOR_LIGHT_FETCH) {
        pageContent = light.content;
        pageTitle = light.title;
        console.log('[Job Extract] Used light fetch, content length:', pageContent.length);
      } else {
        throw new Error('Content too short for light path');
      }
    } catch (lightErr) {
      console.log('[Job Extract] Light fetch failed or insufficient, using full scrape:', lightErr instanceof Error ? lightErr.message : '');
      try {
        const scrapedData = await scrapeUrl(url, { mode: 'job' });
        pageContent = scrapedData.content;
        pageTitle = scrapedData.title;
        console.log('[Job Extract] Full scrape (job mode) successful, content length:', pageContent.length);
      } catch (error) {
        console.error('[Job Extract] Error scraping URL:', error);
        return NextResponse.json(
          { error: 'Failed to fetch job posting. The page may be protected or unavailable.' },
          { status: 500 }
        );
      }
    }

    const contentForPrompt = pageContent.slice(0, 48000);

    const prompt = `Extract job posting details from the following content. The JOB TITLE and COMPANY NAME are usually at or near the top (page title or first heading). The main JOB DESCRIPTION is typically the longest block of text (responsibilities, requirements, qualifications).

PAGE TITLE: ${pageTitle}

CONTENT:
${contentForPrompt}

Return ONLY a single valid JSON object with exactly these keys (no markdown, no code fence, no extra text):
{
  "title": "exact job title",
  "company": "company or employer name",
  "location": "city/region or Remote",
  "job_type": "Full-time | Part-time | Contract | Freelance",
  "salary": "salary/compensation range if stated, else null",
  "description": "complete job description including all responsibilities, requirements, and qualifications. Preserve structure and key bullets."
}

Rules:
- title and company are required; extract from the beginning of the content or page title if present.
- location: use "Remote" for remote roles; otherwise city, state/country.
- job_type: one of Full-time, Part-time, Contract, Freelance.
- salary: exact phrase if present (e.g. "$120k - $150k"), otherwise null.
- description: full text, not a summary. Include all sections. If content was truncated, include up to the limit.
- Output only the JSON object.`;

    const response = await generateAICompletion(
      userId,
      'job_extract',
      'You extract job posting fields and return only valid JSON.',
      [{ role: 'user', content: prompt }],
      4096
    );

    // Parse AI response
    const jsonMatch = response.content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid JSON response from AI');
    }

    const jobData = JSON.parse(jsonMatch[0]);

    // Validate that we got at least title and company
    if (!jobData.title || !jobData.company) {
      return NextResponse.json(
        { error: 'Could not extract job details. Please fill in the form manually.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      job: {
        title: jobData.title || '',
        company: jobData.company || '',
        location: jobData.location || 'Remote',
        job_type: jobData.job_type || 'Full-time',
        salary: jobData.salary || '',
        description: jobData.description || '',
        apply_url: url,
      },
    });
  } catch (error) {
    console.error('Error extracting job details:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error 
          ? error.message 
          : 'Failed to extract job details. Please fill in the form manually.' 
      },
      { status: 500 }
    );
  }
}
