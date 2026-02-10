/**
 * Job Profile API
 * GET: Retrieve user's job profile
 * POST: Create or update job profile
 * PATCH: Partial update (e.g., toggle profile context)
 */

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getSupabaseServiceRole } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/job-profile
 * Get current user's job profile and main platform profile for context
 */
export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const supabase = getSupabaseServiceRole();
    
    // Get job profile
    const { data, error } = await supabase
      .from('user_job_profiles')
      .select('*')
      .eq('clerk_id', userId)
      .maybeSingle();
    
    if (error) {
      console.error('[Job Profile API] Error fetching profile:', error);
      throw error;
    }
    
    console.log('[Job Profile API] Profile found:', !!data, {
      userId,
      hasTitles: data?.target_titles?.length,
      hasSkills: data?.skills_json?.length
    });
    
    // Get main platform profile (portfolio) for context
    const { data: portfolioData } = await supabase
      .from('user_portfolios')
      .select('portfolio_data, markdown')
      .eq('clerk_id', userId)
      .maybeSingle();
    
    // Extract profile context from portfolio
    let platformProfileContext = '';
    if (portfolioData) {
      if (portfolioData.markdown) {
        platformProfileContext = portfolioData.markdown;
      } else if (portfolioData.portfolio_data) {
        const portfolio = portfolioData.portfolio_data;
        platformProfileContext = `# ${portfolio.fullName || 'Professional Profile'}

${portfolio.tagline || ''}

## About
${portfolio.about || ''}

## Experience
${(portfolio.experiences || []).map((exp: any) => `
### ${exp.title} at ${exp.company}
${exp.period} | ${exp.location}
${exp.description}
`).join('\n')}

## Skills
${Object.entries(portfolio.skills || {}).map(([category, items]) => 
  `**${category}**: ${Array.isArray(items) ? items.join(', ') : ''}`
).join('\n')}
`;
      }
    }
    
    console.log('[Job Profile API] Returning data:', {
      hasProfile: !!data,
      hasContext: !!platformProfileContext,
      contextLength: platformProfileContext.length
    });
    
    return NextResponse.json({
      profile: data || null,
      platform_profile_context: platformProfileContext.trim(),
      // For backward compatibility, keep both formats
      platformProfileContext: platformProfileContext.trim(),
    });
    
  } catch (err) {
    console.error('[Job Profile API] GET error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/job-profile
 * Create or update user's job profile
 */
export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const body = await req.json();
    
    const {
      skills_json,
      target_titles,
      seniority,
      locations_allowed,
      locations_excluded,
      languages,
      salary_min,
      salary_max,
      salary_currency,
      profile_context_text,
      use_profile_context_for_matching,
      work_authorization_constraints,
    } = body;
    
    const supabase = getSupabaseServiceRole();
    
    // Upsert profile (resume_text is NOT stored - system uses portfolio data)
    const { data, error } = await supabase
      .from('user_job_profiles')
      .upsert({
        clerk_id: userId,
        resume_text: null, // Always null - portfolio is the source of truth
        skills_json: skills_json || [],
        target_titles: target_titles || [],
        seniority: seniority || null,
        locations_allowed: locations_allowed || [],
        locations_excluded: locations_excluded || [],
        languages: languages || [],
        salary_min: salary_min || null,
        salary_max: salary_max || null,
        salary_currency: salary_currency || 'USD',
        profile_context_text: profile_context_text || null,
        use_profile_context_for_matching: use_profile_context_for_matching ?? false,
        work_authorization_constraints: work_authorization_constraints || [],
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'clerk_id',
      })
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    return NextResponse.json({
      success: true,
      profile: data,
    });
    
  } catch (err) {
    console.error('[Job Profile API] POST error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to save profile' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/job-profile
 * Partial update (e.g., toggle profile context)
 */
export async function PATCH(req: Request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const body = await req.json();
    const supabase = getSupabaseServiceRole();
    
    // Only update provided fields
    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    
    if ('use_profile_context_for_matching' in body) {
      updates.use_profile_context_for_matching = body.use_profile_context_for_matching;
    }
    
    if ('profile_context_text' in body) {
      updates.profile_context_text = body.profile_context_text;
    }
    
    if ('target_titles' in body) {
      updates.target_titles = body.target_titles;
    }
    
    if ('seniority' in body) {
      updates.seniority = body.seniority;
    }
    
    if ('locations_allowed' in body) {
      updates.locations_allowed = body.locations_allowed;
    }
    
    if ('languages' in body) {
      updates.languages = body.languages;
    }
    
    const { data, error } = await supabase
      .from('user_job_profiles')
      .update(updates)
      .eq('clerk_id', userId)
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    return NextResponse.json({
      success: true,
      profile: data,
    });
    
  } catch (err) {
    console.error('[Job Profile API] PATCH error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to update profile' },
      { status: 500 }
    );
  }
}
