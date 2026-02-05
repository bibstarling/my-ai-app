import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getSupabaseServiceRole } from '@/lib/supabase-server';
import type { CreateSectionRequest, ResumeSection } from '@/lib/types/resume';

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * POST /api/resume/[id]/sections - Create a new section
 */
export async function POST(req: Request, context: RouteContext) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: resumeId } = await context.params;
    const body: CreateSectionRequest = await req.json();
    
    if (!body.section_type || !body.content) {
      return NextResponse.json(
        { error: 'section_type and content are required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServiceRole();

    // Verify ownership of resume
    const { data: resume, error: resumeError } = await supabase
      .from('resumes')
      .select('id')
      .eq('id', resumeId)
      .eq('clerk_id', userId)
      .single();

    if (resumeError || !resume) {
      return NextResponse.json({ error: 'Resume not found' }, { status: 404 });
    }

    // Get max sort_order if not provided
    let sortOrder = body.sort_order ?? 0;
    if (body.sort_order === undefined) {
      const { data: maxSection } = await supabase
        .from('resume_sections')
        .select('sort_order')
        .eq('resume_id', resumeId)
        .order('sort_order', { ascending: false })
        .limit(1)
        .single();
      
      sortOrder = (maxSection?.sort_order ?? -1) + 1;
    }

    const { data: section, error } = await supabase
      .from('resume_sections')
      .insert({
        resume_id: resumeId,
        section_type: body.section_type,
        title: body.title?.trim() || null,
        sort_order: sortOrder,
        content: body.content,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating section:', error);
      return NextResponse.json({ error: 'Failed to create section' }, { status: 500 });
    }

    return NextResponse.json({ section: section as ResumeSection }, { status: 201 });
  } catch (error) {
    console.error('POST /api/resume/[id]/sections error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
