import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * POST /api/portfolio/parse-markdown
 * Parse markdown content into structured portfolio data using LLM
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

    // Use OpenAI to parse the markdown into structured data
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are a portfolio data parser. Parse the provided markdown content into a structured JSON format for a professional portfolio.

IMPORTANT: Return ONLY valid JSON, no markdown code blocks, no explanations, no extra text.

The JSON structure should be:
{
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
- Identify and categorize skills appropriately`,
        },
        {
          role: 'user',
          content: markdown,
        },
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from AI');
    }

    let portfolioData;
    try {
      portfolioData = JSON.parse(content);
    } catch (parseError) {
      console.error('Failed to parse AI response:', content);
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
