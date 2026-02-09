import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { generateAICompletion } from '@/lib/ai-provider';
import { scrapeUrl, isValidUrl } from '@/lib/url-scraper';

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

    // Validate URL format
    if (!isValidUrl(url)) {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    // Scrape the webpage content using Puppeteer (works with JS-heavy sites)
    let pageContent: string;
    let pageTitle: string;
    try {
      console.log('[Job Extract] Scraping URL:', url);
      const scrapedData = await scrapeUrl(url);
      pageContent = scrapedData.content;
      pageTitle = scrapedData.title;
      console.log('[Job Extract] Scraping successful, content length:', pageContent.length);
    } catch (error) {
      console.error('[Job Extract] Error scraping URL:', error);
      return NextResponse.json(
        { error: 'Failed to fetch job posting. The page may be protected or unavailable.' },
        { status: 500 }
      );
    }

    // Use AI to extract job details from scraped content
    const prompt = `You are a job posting information extractor. Extract the key details from this job posting content.

JOB POSTING TITLE: ${pageTitle}

JOB POSTING CONTENT:
${pageContent.slice(0, 50000)}

Extract and return ONLY valid JSON with these fields:
{
  "title": "Job title",
  "company": "Company name",
  "location": "Job location (city, state/country or Remote)",
  "job_type": "Full-time, Part-time, Contract, or Freelance",
  "salary": "Salary range if mentioned (or null)",
  "description": "Full job description including responsibilities, requirements, and qualifications. Keep all important details."
}

Rules:
- Extract the actual job description text, not HTML tags
- For location: use "Remote" if it's a remote position, otherwise extract city/state/country
- For job_type: pick the closest match from the options above
- For salary: extract any mentioned salary/compensation range, or use null if not mentioned
- For description: include the full description with all responsibilities, requirements, and qualifications
- Return ONLY the JSON object, no other text
- If you cannot find a field, use null for that field`;

    const response = await generateAICompletion(
      userId,
      'job_extract',
      'You are a job posting information extractor.',
      [{ role: 'user', content: prompt }],
      4000
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
