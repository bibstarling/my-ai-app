import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getSupabaseServiceRole } from '@/lib/supabase-server';

/**
 * POST /api/portfolio/init
 * Initialize user's portfolio (create if doesn't exist)
 */
export async function POST() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseServiceRole();

    // Check if portfolio already exists
    const { data: existingPortfolio } = await supabase
      .from('user_portfolios')
      .select('*')
      .eq('clerk_id', userId)
      .maybeSingle();

    if (existingPortfolio) {
      return NextResponse.json({
        success: true,
        portfolio: existingPortfolio,
        isNew: false,
      });
    }

    // Get user info for initial portfolio data
    const { data: user } = await supabase
      .from('users')
      .select('email, username')
      .eq('clerk_id', userId)
      .single();

    // Create new portfolio
    const { data: newPortfolio, error: createError } = await supabase
      .from('user_portfolios')
      .insert({
        clerk_id: userId,
        user_id: user ? (await supabase.from('users').select('id').eq('clerk_id', userId).single()).data?.id : null,
        status: 'draft',
        is_public: false,
        portfolio_data: {
          fullName: '',
          title: '',
          tagline: '',
          email: user?.email || '',
          location: '',
          linkedinUrl: '',
          githubUrl: '',
          websiteUrl: '',
          about: '',
          experiences: [],
          projects: [],
          skills: {},
          education: [],
          certifications: [],
          achievements: [],
          articles: [],
        },
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating portfolio:', createError);
      return NextResponse.json(
        { error: 'Failed to create portfolio' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      portfolio: newPortfolio,
      isNew: true,
    });
  } catch (error) {
    console.error('POST /api/portfolio/init error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
