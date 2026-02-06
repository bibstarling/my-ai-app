import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { generateAICompletion } from '@/lib/ai-provider';
import { getSupabaseServiceRole } from '@/lib/supabase-server';

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { message } = await req.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    console.log('Sending message to AI:', message);

    // Get user's professional profile markdown for context
    const supabase = getSupabaseServiceRole();
    const { data: userPortfolio } = await supabase
      .from('user_portfolios')
      .select('markdown, portfolio_data')
      .eq('clerk_id', userId)
      .maybeSingle();

    const { data: userInfo } = await supabase
      .from('users')
      .select('is_super_admin')
      .eq('clerk_id', userId)
      .single();

    let profileContext = '';
    
    // Get markdown content
    if (userPortfolio?.markdown) {
      profileContext = userPortfolio.markdown;
    } else if (userInfo?.is_super_admin) {
      // Super admin uses main portfolio data
      try {
        const { portfolioData } = await import('@/lib/portfolio-data');
        // Convert structured data to markdown-like format for context
        profileContext = `# ${portfolioData.fullName}\n${portfolioData.title}\n\n${portfolioData.tagline}\n\n## Experience\n${portfolioData.experiences.map((exp: any) => `### ${exp.title} at ${exp.company}\n${exp.description}`).join('\n\n')}`;
      } catch (error) {
        console.error('Failed to load super admin portfolio:', error);
      }
    }

    // Build enhanced system prompt with user's profile context
    const systemPrompt = `You are a helpful AI career coach specializing in career guidance, job search, and professional development. You provide concise, actionable advice.

${profileContext ? `USER'S PROFESSIONAL PROFILE:
${profileContext}

Use this profile information to provide personalized career guidance. Reference their specific experience, skills, and achievements when relevant to give tailored advice.` : 'Note: User has not yet created their professional profile. Provide general career guidance.'}

Be conversational, supportive, and actionable. Help with:
- Career strategy and next moves
- Job search tips and application advice
- Interview preparation and practice
- Resume and cover letter guidance
- Skill development recommendations
- Networking strategies`;

    // Use the AI provider system (user's API or system fallback)
    const response = await generateAICompletion(
      userId,
      'career_coach_chat',
      systemPrompt,
      [{ role: 'user', content: message }],
      2048
    );

    console.log('Response from AI:', response);
    
    return NextResponse.json({ 
      response: response.content 
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Failed to get response: ' + (error as Error).message },
      { status: 500 }
    );
  }
}