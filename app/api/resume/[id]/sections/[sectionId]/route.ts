import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getSupabaseServiceRole } from '@/lib/supabase-server';
import type { UpdateSectionRequest, ResumeSection } from '@/lib/types/resume';

type RouteContext = {
  params: Promise<{ id: string; sectionId: string }>;
};

/**
 * PATCH /api/resume/[id]/sections/[sectionId] - Update a section
 */
export async function PATCH(req: Request, context: RouteContext) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: resumeId, sectionId } = await context.params;
    const body: UpdateSectionRequest = await req.json();
    const supabase = getSupabaseServiceRole();

    // Verify ownership via resume
    const { data: section, error: checkError } = await supabase
      .from('resume_sections')
      .select('id, resume_id, resumes!inner(clerk_id)')
      .eq('id', sectionId)
      .eq('resume_id', resumeId)
      .single();

    if (checkError || !section) {
      return NextResponse.json({ error: 'Section not found' }, { status: 404 });
    }

    // TypeScript helper to access nested data
    const sectionWithResume = section as typeof section & { resumes: { clerk_id: string } };
    if (sectionWithResume.resumes.clerk_id !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (body.section_type !== undefined) updateData.section_type = body.section_type;
    if (body.title !== undefined) updateData.title = body.title?.trim() || null;
    if (body.sort_order !== undefined) updateData.sort_order = body.sort_order;
    if (body.content !== undefined) updateData.content = body.content;

    const { data: updatedSection, error } = await supabase
      .from('resume_sections')
      .update(updateData)
      .eq('id', sectionId)
      .select()
      .single();

    if (error) {
      console.error('Error updating section:', error);
      return NextResponse.json({ error: 'Failed to update section' }, { status: 500 });
    }

    return NextResponse.json({ section: updatedSection as ResumeSection });
  } catch (error) {
    console.error('PATCH /api/resume/[id]/sections/[sectionId] error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/resume/[id]/sections/[sectionId] - Delete a section
 */
export async function DELETE(req: Request, context: RouteContext) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: resumeId, sectionId } = await context.params;
    const supabase = getSupabaseServiceRole();

    // Verify ownership via resume
    const { data: section, error: checkError } = await supabase
      .from('resume_sections')
      .select('id, resume_id, resumes!inner(clerk_id)')
      .eq('id', sectionId)
      .eq('resume_id', resumeId)
      .single();

    if (checkError || !section) {
      return NextResponse.json({ error: 'Section not found' }, { status: 404 });
    }

    const sectionWithResume = section as typeof section & { resumes: { clerk_id: string } };
    if (sectionWithResume.resumes.clerk_id !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { error } = await supabase
      .from('resume_sections')
      .delete()
      .eq('id', sectionId);

    if (error) {
      console.error('Error deleting section:', error);
      return NextResponse.json({ error: 'Failed to delete section' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/resume/[id]/sections/[sectionId] error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
