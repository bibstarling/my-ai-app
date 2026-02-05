import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getSupabaseServiceRole } from '@/lib/supabase-server';
import type { CreateResumeRequest, Resume, ResumeWithSections } from '@/lib/types/resume';

/**
 * GET /api/resume - Get all resumes for the authenticated user
 */
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseServiceRole();
    
    // Get all resumes with their sections
    const { data: resumes, error: resumesError } = await supabase
      .from('resumes')
      .select('*')
      .eq('clerk_id', userId)
      .order('updated_at', { ascending: false });

    if (resumesError) {
      console.error('Error fetching resumes:', resumesError);
      return NextResponse.json({ error: 'Failed to fetch resumes' }, { status: 500 });
    }

    // Get sections for each resume
    const resumesWithSections: ResumeWithSections[] = [];
    for (const resume of resumes || []) {
      const { data: sections, error: sectionsError } = await supabase
        .from('resume_sections')
        .select('*')
        .eq('resume_id', resume.id)
        .order('sort_order', { ascending: true });

      if (sectionsError) {
        console.error('Error fetching sections:', sectionsError);
        continue;
      }

      resumesWithSections.push({
        ...resume,
        sections: sections || [],
      });
    }

    return NextResponse.json({ resumes: resumesWithSections });
  } catch (error) {
    console.error('GET /api/resume error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/resume - Create a new resume
 */
export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: CreateResumeRequest = await req.json();
    
    if (!body.title || !body.title.trim()) {
      return NextResponse.json({ error: 'Resume title is required' }, { status: 400 });
    }

    const supabase = getSupabaseServiceRole();

    // If this is marked as primary, unset other primary resumes
    if (body.is_primary) {
      await supabase
        .from('resumes')
        .update({ is_primary: false })
        .eq('clerk_id', userId);
    }

    const { data: resume, error } = await supabase
      .from('resumes')
      .insert({
        clerk_id: userId,
        title: body.title.trim(),
        is_primary: body.is_primary ?? false,
        status: 'draft',
        full_name: body.full_name?.trim() || null,
        email: body.email?.trim() || null,
        phone: body.phone?.trim() || null,
        location: body.location?.trim() || null,
        linkedin_url: body.linkedin_url?.trim() || null,
        portfolio_url: body.portfolio_url?.trim() || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating resume:', error);
      return NextResponse.json({ error: 'Failed to create resume' }, { status: 500 });
    }

    return NextResponse.json({ resume: { ...resume, sections: [] } as ResumeWithSections }, { status: 201 });
  } catch (error) {
    console.error('POST /api/resume error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
