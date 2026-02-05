import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

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
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    // Fetch the webpage content
    let htmlContent: string;
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch page: ${response.status}`);
      }
      
      htmlContent = await response.text();
    } catch (error) {
      console.error('Error fetching URL:', error);
      return NextResponse.json(
        { error: 'Failed to fetch job posting. The page may be protected or unavailable.' },
        { status: 500 }
      );
    }

    // Use Claude to extract job details from HTML
    const prompt = `You are a job posting information extractor. Extract the key details from this job posting HTML.

HTML CONTENT:
${htmlContent.slice(0, 50000)}

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

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }],
    });

    const textContent = message.content.find((c) => c.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text response from AI');
    }

    // Parse AI response
    const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
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
