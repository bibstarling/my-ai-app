import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getSupabaseServiceRole } from '@/lib/supabase-server';

type RouteContext = {
  params: Promise<{ jobId: string }>;
};

/**
 * GET /api/jobs/[jobId]/questions - List all questions for a job
 */
export async function GET(request: Request, context: RouteContext) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    const supabase = getSupabaseServiceRole();
    const { jobId } = await context.params;

    // Verify user owns this job
    const { data: job, error: jobError } = await supabase
      .from('tracked_jobs')
      .select('id')
      .eq('id', jobId)
      .eq('clerk_id', userId)
      .single();

    if (jobError || !job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    // Fetch all questions for this job, sorted by order_index
    const { data: questions, error } = await supabase
      .from('application_questions')
      .select('*')
      .eq('tracked_job_id', jobId)
      .eq('clerk_id', userId)
      .order('order_index', { ascending: true });

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      questions: questions || [],
    });
  } catch (error) {
    console.error('Error fetching questions:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error 
          ? error.message 
          : 'Failed to fetch questions' 
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/jobs/[jobId]/questions - Create a new question manually
 */
export async function POST(request: Request, context: RouteContext) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    const supabase = getSupabaseServiceRole();
    const { jobId } = await context.params;
    const body = await request.json();
    const { question_text } = body;

    if (!question_text || typeof question_text !== 'string' || question_text.trim().length === 0) {
      return NextResponse.json(
        { error: 'Question text is required' },
        { status: 400 }
      );
    }

    // Verify user owns this job
    const { data: job, error: jobError } = await supabase
      .from('tracked_jobs')
      .select('id')
      .eq('id', jobId)
      .eq('clerk_id', userId)
      .single();

    if (jobError || !job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    // Get the next order_index
    const { data: existingQuestions } = await supabase
      .from('application_questions')
      .select('order_index')
      .eq('tracked_job_id', jobId)
      .order('order_index', { ascending: false })
      .limit(1);

    const nextOrderIndex = existingQuestions && existingQuestions.length > 0
      ? existingQuestions[0].order_index + 1
      : 0;

    // Insert the new question
    const { data: newQuestion, error: insertError } = await supabase
      .from('application_questions')
      .insert({
        tracked_job_id: jobId,
        clerk_id: userId,
        question_text: question_text.trim(),
        order_index: nextOrderIndex,
      })
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    return NextResponse.json({
      success: true,
      question: newQuestion,
    });
  } catch (error) {
    console.error('Error creating question:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error 
          ? error.message 
          : 'Failed to create question' 
      },
      { status: 500 }
    );
  }
}
