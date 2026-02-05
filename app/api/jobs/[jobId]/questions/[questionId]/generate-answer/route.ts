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

type RouteContext = {
  params: Promise<{ jobId: string; questionId: string }>;
};

/**
 * POST /api/jobs/[jobId]/questions/[questionId]/generate-answer - Generate AI answer
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
    
    const { jobId, questionId } = await context.params;

    // Fetch the job details
    const { data: job, error: jobError } = await supabase
      .from('tracked_jobs')
      .select('*')
      .eq('id', jobId)
      .eq('clerk_id', userId)
      .single();

    if (jobError || !job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    // Fetch the question
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

    // Generate answer using Claude
    const prompt = `You are answering an application question for a job application. Generate a compelling, authentic answer that showcases the candidate's relevant experience.

JOB INFORMATION:
Title: ${job.title}
Company: ${job.company}
Description: ${job.description}

APPLICATION QUESTION:
${question.question_text}

CANDIDATE PROFILE:
${JSON.stringify(portfolioData, null, 2)}

Generate a concise, compelling answer (2-3 paragraphs, approximately 150-250 words) that:
1. Directly addresses the specific question being asked
2. Uses concrete examples from the candidate's experience with specific metrics and outcomes
3. Demonstrates relevant skills and achievements that align with the job requirements
4. Shows enthusiasm and understanding of the role
5. Uses a professional but authentic, conversational tone
6. Quantifies achievements when possible (e.g., "improved X by Y%", "managed team of Z")
7. Connects past experiences to how you would add value in this specific role

Guidelines:
- Be specific and concrete, not generic
- Start with a direct answer to the question
- Follow with 1-2 relevant examples from experience
- End by connecting it to the role at ${job.company}
- Avoid clichés and buzzwords
- Write in first person
- Keep it concise but substantive

Return ONLY the answer text, no additional commentary or formatting.`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }],
    });

    const textContent = message.content.find((c) => c.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text response from AI');
    }

    const generatedAnswer = textContent.text.trim();

    // Update the question with the generated answer
    const { data: updatedQuestion, error: updateError } = await supabase
      .from('application_questions')
      .update({
        answer_text: generatedAnswer,
        is_ai_generated: true,
      })
      .eq('id', questionId)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({
      success: true,
      question: updatedQuestion,
      answer: generatedAnswer,
    });
  } catch (error) {
    console.error('Error generating answer:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error 
          ? error.message 
          : 'Failed to generate answer' 
      },
      { status: 500 }
    );
  }
}
