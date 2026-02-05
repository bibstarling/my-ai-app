import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getSupabaseServiceRole } from '@/lib/supabase-server';
import type { UpdateResumeRequest, ResumeWithSections } from '@/lib/types/resume';

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/resume/[id] - Get a single resume with sections
 */
export async function GET(req: Request, context: RouteContext) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    const supabase = getSupabaseServiceRole();

    // Get resume
    const { data: resume, error: resumeError } = await supabase
      .from('resumes')
      .select('*')
      .eq('id', id)
      .eq('clerk_id', userId)
      .single();

    if (resumeError || !resume) {
      return NextResponse.json({ error: 'Resume not found' }, { status: 404 });
    }

    // Get sections
    const { data: sections, error: sectionsError } = await supabase
      .from('resume_sections')
      .select('*')
      .eq('resume_id', id)
      .order('sort_order', { ascending: true });

    if (sectionsError) {
      console.error('Error fetching sections:', sectionsError);
      return NextResponse.json({ error: 'Failed to fetch sections' }, { status: 500 });
    }

    const resumeWithSections: ResumeWithSections = {
      ...resume,
      sections: sections || [],
    };

    return NextResponse.json({ resume: resumeWithSections });
  } catch (error) {
    console.error('GET /api/resume/[id] error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/resume/[id] - Update a resume
 */
export async function PATCH(req: Request, context: RouteContext) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    const body: UpdateResumeRequest = await req.json();
    const supabase = getSupabaseServiceRole();

    // Verify ownership
    const { data: existing, error: checkError } = await supabase
      .from('resumes')
      .select('id')
      .eq('id', id)
      .eq('clerk_id', userId)
      .single();

    if (checkError || !existing) {
      return NextResponse.json({ error: 'Resume not found' }, { status: 404 });
    }

    // If setting as primary, unset others
    if (body.is_primary) {
      await supabase
        .from('resumes')
        .update({ is_primary: false })
        .eq('clerk_id', userId)
        .neq('id', id);
    }

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (body.title !== undefined) updateData.title = body.title.trim();
    if (body.is_primary !== undefined) updateData.is_primary = body.is_primary;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.full_name !== undefined) updateData.full_name = body.full_name?.trim() || null;
    if (body.email !== undefined) updateData.email = body.email?.trim() || null;
    if (body.phone !== undefined) updateData.phone = body.phone?.trim() || null;
    if (body.location !== undefined) updateData.location = body.location?.trim() || null;
    if (body.linkedin_url !== undefined) updateData.linkedin_url = body.linkedin_url?.trim() || null;
    if (body.portfolio_url !== undefined) updateData.portfolio_url = body.portfolio_url?.trim() || null;

    const { data: resume, error } = await supabase
      .from('resumes')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating resume:', error);
      return NextResponse.json({ error: 'Failed to update resume' }, { status: 500 });
    }

    // Get sections
    const { data: sections } = await supabase
      .from('resume_sections')
      .select('*')
      .eq('resume_id', id)
      .order('sort_order', { ascending: true });

    return NextResponse.json({ resume: { ...resume, sections: sections || [] } as ResumeWithSections });
  } catch (error) {
    console.error('PATCH /api/resume/[id] error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/resume/[id] - Delete a resume
 */
export async function DELETE(req: Request, context: RouteContext) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    const supabase = getSupabaseServiceRole();

    // Verify ownership and delete
    const { error } = await supabase
      .from('resumes')
      .delete()
      .eq('id', id)
      .eq('clerk_id', userId);

    if (error) {
      console.error('Error deleting resume:', error);
      return NextResponse.json({ error: 'Failed to delete resume' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/resume/[id] error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
