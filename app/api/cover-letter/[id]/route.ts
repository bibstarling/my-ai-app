import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getSupabaseServiceRole } from '@/lib/supabase-server';
import type { UpdateCoverLetterRequest, CoverLetter } from '@/lib/types/cover-letter';

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/cover-letter/[id] - Get a single cover letter
 */
export async function GET(req: Request, context: RouteContext) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    const supabase = getSupabaseServiceRole();

    const { data: coverLetter, error } = await supabase
      .from('cover_letters')
      .select('*')
      .eq('id', id)
      .eq('clerk_id', userId)
      .single();

    if (error || !coverLetter) {
      return NextResponse.json({ error: 'Cover letter not found' }, { status: 404 });
    }

    return NextResponse.json({ cover_letter: coverLetter as CoverLetter });
  } catch (error) {
    console.error('GET /api/cover-letter/[id] error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/cover-letter/[id] - Update a cover letter
 */
export async function PATCH(req: Request, context: RouteContext) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    const body: UpdateCoverLetterRequest = await req.json();
    const supabase = getSupabaseServiceRole();

    // Verify ownership
    const { data: existing, error: checkError } = await supabase
      .from('cover_letters')
      .select('id')
      .eq('id', id)
      .eq('clerk_id', userId)
      .single();

    if (checkError || !existing) {
      return NextResponse.json({ error: 'Cover letter not found' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (body.opening_paragraph !== undefined) updateData.opening_paragraph = body.opening_paragraph;
    if (body.body_paragraphs !== undefined) updateData.body_paragraphs = body.body_paragraphs;
    if (body.closing_paragraph !== undefined) updateData.closing_paragraph = body.closing_paragraph;
    if (body.recipient_name !== undefined) updateData.recipient_name = body.recipient_name || null;
    if (body.recipient_title !== undefined) updateData.recipient_title = body.recipient_title || null;
    if (body.company_address !== undefined) updateData.company_address = body.company_address || null;
    if (body.status !== undefined) updateData.status = body.status;

    const { data: coverLetter, error } = await supabase
      .from('cover_letters')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating cover letter:', error);
      return NextResponse.json({ error: 'Failed to update cover letter' }, { status: 500 });
    }

    return NextResponse.json({ cover_letter: coverLetter as CoverLetter });
  } catch (error) {
    console.error('PATCH /api/cover-letter/[id] error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/cover-letter/[id] - Delete a cover letter
 */
export async function DELETE(req: Request, context: RouteContext) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    const supabase = getSupabaseServiceRole();

    const { error } = await supabase
      .from('cover_letters')
      .delete()
      .eq('id', id)
      .eq('clerk_id', userId);

    if (error) {
      console.error('Error deleting cover letter:', error);
      return NextResponse.json({ error: 'Failed to delete cover letter' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/cover-letter/[id] error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
