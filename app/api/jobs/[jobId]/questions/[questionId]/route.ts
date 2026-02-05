import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type RouteContext = {
  params: Promise<{ jobId: string; questionId: string }>;
};

/**
 * PATCH /api/jobs/[jobId]/questions/[questionId] - Update question or answer
 */
export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const { jobId, questionId } = await context.params;
    const body = await request.json();
    const { question_text, answer_text } = body;

    // Verify user owns this question
    const { data: question, error: questionError } = await supabase
      .from('application_questions')
      .select('*')
      .eq('id', questionId)
      .eq('tracked_job_id', jobId)
      .eq('clerk_id', userId)
      .single();

    if (questionError || !question) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      );
    }

    // Build update object
    const updates: any = {};
    
    if (question_text !== undefined) {
      if (typeof question_text !== 'string' || question_text.trim().length === 0) {
        return NextResponse.json(
          { error: 'Question text must be a non-empty string' },
          { status: 400 }
        );
      }
      updates.question_text = question_text.trim();
    }
    
    if (answer_text !== undefined) {
      updates.answer_text = answer_text;
      // If answer is being manually edited, mark as not AI-generated
      if (answer_text !== question.answer_text) {
        updates.is_ai_generated = false;
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    // Update the question
    const { data: updatedQuestion, error: updateError } = await supabase
      .from('application_questions')
      .update(updates)
      .eq('id', questionId)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({
      success: true,
      question: updatedQuestion,
    });
  } catch (error) {
    console.error('Error updating question:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error 
          ? error.message 
          : 'Failed to update question' 
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/jobs/[jobId]/questions/[questionId] - Delete a question
 */
export async function DELETE(request: Request, context: RouteContext) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const { jobId, questionId } = await context.params;

    // Verify user owns this question
    const { data: question, error: questionError } = await supabase
      .from('application_questions')
      .select('id')
      .eq('id', questionId)
      .eq('tracked_job_id', jobId)
      .eq('clerk_id', userId)
      .single();

    if (questionError || !question) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      );
    }

    // Delete the question
    const { error: deleteError } = await supabase
      .from('application_questions')
      .delete()
      .eq('id', questionId);

    if (deleteError) {
      throw deleteError;
    }

    return NextResponse.json({
      success: true,
      message: 'Question deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting question:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error 
          ? error.message 
          : 'Failed to delete question' 
      },
      { status: 500 }
    );
  }
}
