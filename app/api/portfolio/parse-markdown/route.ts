import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { generateAICompletion } from '@/lib/ai-provider';

/**
 * POST /api/portfolio/parse-markdown
 * Parse markdown content into structured portfolio data using LLM
 * Uses user's API key if configured, otherwise system API with limits
 */
export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { markdown } = body;

    if (!markdown) {
      return NextResponse.json(
        { error: 'Markdown content is required' },
        { status: 400 }
      );
    }

    // Use AI to parse the markdown into structured data
    const response = await generateAICompletion(
      userId,
      'portfolio_parse',
      'You are a portfolio data parser. Parse markdown content into structured JSON format.',
      [
        {
          role: 'user',
          content: `Parse the provided markdown content into a structured JSON format for a professional portfolio.

IMPORTANT: Return ONLY valid JSON, no markdown code blocks, no explanations, no extra text. Just the raw JSON object.

The JSON structure should be:
{
  "fullName": "string (full name)",
  "title": "string (professional title)",
  "tagline": "string (one-liner tagline)",
  "email": "string (email address)",
  "location": "string (city, country)",
  "linkedinUrl": "string (LinkedIn profile URL)",
  "websiteUrl": "string (personal website URL)",
  "githubUrl": "string (GitHub profile URL, optional)",
  "about": "string (professional summary/bio)",
  "pmArchetype": "string (professional style/archetype, optional)",
  "workStyle": "string (same as pmArchetype, optional)",
  "performanceLevel": "string (performance/experience level, optional)",
  "superpowers": ["array of key strengths/differentiators"],
  "experiences": [
    {
      "title": "Job title",
      "company": "Company name",
      "location": "Location",
      "period": "Time period",
      "description": "Role description",
      "highlights": ["array of achievements"],
      "skills": ["array of skills used"]
    }
  ],
  "projects": [
    {
      "name": "Project name",
      "role": "Your role",
      "timeline": "Timeline",
      "description": "Project description",
      "impact": ["array of key results/impacts"],
      "technologies": ["array of technologies"],
      "link": "URL if provided"
    }
  ],
  "skills": [
    {
      "name": "Skill name",
      "category": "Category (Technical, Product, Leadership, etc.)",
      "level": "Proficiency level (optional)"
    }
  ],
  "education": [
    {
      "degree": "Degree name",
      "institution": "School name",
      "year": "Graduation year",
      "details": "Additional details"
    }
  ],
  "certifications": [
    {
      "name": "Certification name",
      "issuer": "Issuing organization",
      "year": "Year obtained"
    }
  ],
  "awards": [
    {
      "title": "Award title",
      "quarter": "Quarter/date",
      "date": "Date",
      "description": "Award description",
      "keyTraits": ["array of traits recognized"]
    }
  ],
  "achievements": [
    {
      "title": "Achievement title",
      "description": "Details",
      "date": "Date"
    }
  ],
  "articlesAndTalks": [
    {
      "title": "Title",
      "publication": "Publication name",
      "event": "Event name",
      "date": "Date",
      "url": "URL if provided",
      "description": "Brief description"
    }
  ]
}

Parse intelligently:
- Extract all relevant information from the markdown
- Structure it according to the schema above
- If a field is not present in the markdown, omit it or use an empty array
- Be flexible with markdown formatting variations
- Preserve the user's exact wording and content
- Extract metrics and numbers when present
- Identify and categorize skills appropriately

Here is the markdown to parse:

${markdown}`,
        },
      ],
      4096
    );

    let portfolioData;
    try {
      // Remove any markdown code blocks if AI added them
      let jsonText = response.content.trim();
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?$/g, '').trim();
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/```\n?/g, '').trim();
      }
      
      portfolioData = JSON.parse(jsonText);
    } catch (parseError) {
      console.error('Failed to parse AI response:', response.content);
      throw new Error('Invalid JSON response from AI');
    }

    return NextResponse.json({
      success: true,
      portfolioData,
    });
  } catch (error) {
    console.error('POST /api/portfolio/parse-markdown error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Internal server error',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
