/**
 * POST /api/profile/parse-comprehensive
 * Comprehensive AI parsing of resume/profile to extract ALL fields
 */

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { generateAICompletion } from '@/lib/ai-provider';

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const { input } = await req.json();
    
    if (!input || !input.trim()) {
      return NextResponse.json(
        { error: 'Input text is required' },
        { status: 400 }
      );
    }
    
    const prompt = `You are an expert at extracting structured professional profile information from resumes, LinkedIn profiles, and professional bios.

Analyze the following text and extract ALL possible information. Be thorough and comprehensive.

INPUT TEXT:
${input}

Extract and return a JSON object with the following structure. Fill in ALL fields that you can find information for:

{
  "fullName": "Full name of the person",
  "email": "Email address",
  "phone": "Phone number",
  "location": "Current location/city",
  "linkedinUrl": "LinkedIn profile URL",
  "githubUrl": "GitHub profile URL",
  "websiteUrl": "Personal website URL",
  "title": "Current professional title (e.g., 'Senior Product Manager')",
  "tagline": "Professional tagline or headline",
  "about": "Professional summary or bio (2-3 sentences)",
  
  "experiences": [
    {
      "title": "Job title",
      "company": "Company name",
      "location": "Job location",
      "period": "Time period (e.g., '2020 - 2023')",
      "description": "Job description",
      "highlights": ["Achievement 1", "Achievement 2"]
    }
  ],
  
  "projects": [
    {
      "title": "Project name",
      "description": "Project description",
      "technologies": ["Tech1", "Tech2"],
      "outcome": "Result or impact",
      "url": "Project URL if available"
    }
  ],
  
  "skills": {
    "technical": ["Skill1", "Skill2"],
    "tools": ["Tool1", "Tool2"],
    "languages": ["Language1", "Language2"],
    "frameworks": ["Framework1", "Framework2"]
  },
  
  "education": [
    {
      "degree": "Degree name",
      "institution": "University/School name",
      "year": "Graduation year"
    }
  ],
  
  "certifications": [
    {
      "name": "Certification name",
      "issuer": "Issuing organization",
      "year": "Year obtained"
    }
  ],
  
  "languages": ["English", "Spanish"],
  
  "targetTitles": ["Desired Role 1", "Desired Role 2"],
  "seniority": "Junior/Mid/Senior/Executive",
  "locationsAllowed": ["Location preferences"],
  "preferredLanguages": ["en", "es"],
  "profileContextText": "Career goals, industry preferences, company stage preferences"
}

IMPORTANT RULES:
- Extract ALL information you can find
- For missing fields, use null or empty arrays
- Be comprehensive with experiences and projects
- Categorize skills appropriately (technical, tools, languages, frameworks)
- Infer targetTitles from their current/recent roles
- Determine seniority from their experience level and titles
- Extract career goals and preferences for profileContextText
- Return ONLY valid JSON, no explanations

Return the JSON:`;

    const response = await generateAICompletion(
      userId,
      'profile_parsing',
      'You are an expert at extracting structured information from resumes and professional profiles.',
      [{ role: 'user', content: prompt }],
      2048
    );

    let resultText = response.content.trim();
    
    // Clean up markdown code blocks if present
    if (resultText.startsWith('```json')) {
      resultText = resultText.replace(/^```json\n?/, '').replace(/\n?```$/, '');
    } else if (resultText.startsWith('```')) {
      resultText = resultText.replace(/^```\n?/, '').replace(/\n?```$/, '');
    }
    
    const parsed = JSON.parse(resultText);
    
    return NextResponse.json({
      success: true,
      parsed,
    });
    
  } catch (err) {
    console.error('[Parse Comprehensive] Error:', err);
    return NextResponse.json(
      { 
        success: false,
        error: err instanceof Error ? err.message : 'Failed to parse profile' 
      },
      { status: 500 }
    );
  }
}
