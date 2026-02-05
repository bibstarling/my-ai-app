import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';
import { portfolioData } from '@/lib/portfolio-data';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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
    const { jobDescription, jobTitle, company } = body;

    if (!jobDescription || !jobTitle || !company) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get portfolio data
    const portfolio = portfolioData;

    // Generate tailored resume with AI
    const prompt = `You are an expert resume writer. Create a tailored resume for this job application.

JOB INFORMATION:
Title: ${jobTitle}
Company: ${company}
Description: ${jobDescription}

CANDIDATE PORTFOLIO:
${JSON.stringify(portfolio, null, 2)}

Generate a tailored resume that:
1. Emphasizes relevant experience and skills from the portfolio
2. Uses keywords from the job description
3. Structures content to match what this role requires
4. Maintains authenticity while optimizing for ATS

Return ONLY valid JSON in this exact format:
{
  "sections": [
    {
      "type": "summary",
      "content": "Professional summary tailored to this role"
    },
    {
      "type": "experience",
      "items": [
        {
          "title": "Job Title",
          "company": "Company Name",
          "period": "Start - End",
          "description": "Achievements relevant to target role",
          "highlights": ["Achievement 1", "Achievement 2"]
        }
      ]
    },
    {
      "type": "skills",
      "items": ["Skill 1", "Skill 2", "Skill 3"]
    },
    {
      "type": "education",
      "items": [
        {
          "degree": "Degree Name",
          "institution": "School Name",
          "year": "Year"
        }
      ]
    }
  ]
}`;

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

    const resumeData = JSON.parse(jsonMatch[0]);

    // Save resume to database
    const { data: resume, error: insertError } = await supabase
      .from('resumes')
      .insert({
        clerk_id: userId,
        title: `${jobTitle} at ${company}`,
        full_name: portfolioData.fullName,
        email: portfolioData.email,
        phone: null,
        location: portfolioData.location,
        linkedin_url: portfolioData.linkedinUrl,
        portfolio_url: portfolioData.websiteUrl,
        status: 'draft',
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // Transform and save resume sections
    if (resumeData.sections && Array.isArray(resumeData.sections)) {
      const sectionsToInsert: any[] = [];
      let sortOrder = 0;

      for (const section of resumeData.sections) {
        if (section.type === 'summary' && section.content) {
          // Summary section - single entry
          sectionsToInsert.push({
            resume_id: resume.id,
            section_type: 'summary',
            sort_order: sortOrder++,
            content: { text: section.content },
          });
        } else if (section.type === 'experience' && section.items) {
          // Experience - create separate section for each item
          for (const item of section.items) {
            const [startDate, endDate] = (item.period || '').split(/\s*[-–—:]\s*/);
            sectionsToInsert.push({
              resume_id: resume.id,
              section_type: 'experience',
              sort_order: sortOrder++,
              content: {
                position: item.title || '',
                company: item.company || '',
                location: item.location || '',
                startDate: startDate?.trim() || '',
                endDate: endDate?.trim() || '',
                bullets: item.highlights || [item.description] || [],
              },
            });
          }
        } else if (section.type === 'education' && section.items) {
          // Education - create separate section for each item
          for (const item of section.items) {
            sectionsToInsert.push({
              resume_id: resume.id,
              section_type: 'education',
              sort_order: sortOrder++,
              content: {
                degree: item.degree || '',
                institution: item.institution || item.school || '',
                year: item.year || '',
                description: item.description || '',
              },
            });
          }
        } else if (section.type === 'skills' && section.items) {
          // Skills - group all skills into one section
          sectionsToInsert.push({
            resume_id: resume.id,
            section_type: 'skills',
            sort_order: sortOrder++,
            content: {
              category: 'Core Skills',
              items: Array.isArray(section.items) ? section.items : [],
            },
          });
        } else if (section.type === 'projects' && section.items) {
          // Projects - create separate section for each item
          for (const item of section.items) {
            sectionsToInsert.push({
              resume_id: resume.id,
              section_type: 'projects',
              sort_order: sortOrder++,
              content: {
                name: item.name || item.title || '',
                description: item.description || '',
                bullets: item.highlights || item.bullets || [],
                url: item.url || '',
              },
            });
          }
        }
      }

      if (sectionsToInsert.length > 0) {
        const { error: sectionsError } = await supabase
          .from('resume_sections')
          .insert(sectionsToInsert);

        if (sectionsError) {
          console.error('Error saving resume sections:', sectionsError);
          // Don't throw - resume was created, just log the error
        }
      }
    }

    return NextResponse.json({
      success: true,
      resumeId: resume.id,
      resume: resume,
    });
  } catch (error) {
    console.error('Error generating tailored resume:', error);
    return NextResponse.json(
      { error: 'Failed to generate tailored resume' },
      { status: 500 }
    );
  }
}
