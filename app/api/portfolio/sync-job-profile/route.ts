/**
 * POST /api/portfolio/sync-job-profile
 * Automatically extract and sync job search preferences from portfolio
 */

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getSupabaseServiceRole } from '@/lib/supabase-server';
import { generateAICompletion } from '@/lib/ai-provider';

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { markdown } = await req.json();
    
    if (!markdown || !markdown.trim()) {
      return NextResponse.json({ error: 'No portfolio content provided' }, { status: 400 });
    }
    
    const supabase = getSupabaseServiceRole();
    
    // Get current job profile to preserve manual settings
    const { data: existingProfile } = await supabase
      .from('user_job_profiles')
      .select('*')
      .eq('clerk_id', userId)
      .maybeSingle();
    
    // Use AI to extract job search preferences from portfolio
    const prompt = `Analyze this professional profile and extract job search preferences.

PROFILE CONTENT:
${markdown.slice(0, 8000)}

Extract and return ONLY valid JSON (no markdown, no explanations):
{
  "targetTitles": ["Array of 2-5 job titles this person would be suitable for, based on their experience"],
  "seniority": "Junior/Mid/Senior/Executive (calculate from years of experience and role titles)",
  "skills": ["Array of key technical and professional skills mentioned"],
  "languages": ["Array of language codes: en, es, pt-BR, etc."],
  "profileContextText": "1-2 sentence summary of their career focus, industry interests, and goals (extract from bio/summary or infer from experience)"
}

RULES:
- targetTitles: Infer from their most recent/senior roles and expertise
- seniority: Junior (0-2yrs), Mid (2-5yrs), Senior (5-10yrs), Executive (10+yrs)
- skills: Extract the most important/mentioned skills (max 20)
- languages: Detect from content or default to ["en"]
- profileContextText: Career focus, industry preferences, company stage/size preferences if mentioned

Return ONLY the JSON object:`;

    const response = await generateAICompletion(
      userId,
      'job_profile_sync',
      'You extract job search preferences from professional profiles.',
      [{ role: 'user', content: prompt }],
      1024
    );

    let resultText = response.content.trim();
    
    // Clean up markdown code blocks
    if (resultText.startsWith('```json')) {
      resultText = resultText.replace(/^```json\n?/, '').replace(/\n?```$/, '');
    } else if (resultText.startsWith('```')) {
      resultText = resultText.replace(/^```\n?/, '').replace(/\n?```$/, '');
    }
    
    const extracted = JSON.parse(resultText);
    
    // Merge with existing profile (preserve manual overrides)
    const profileData = {
      clerk_id: userId,
      target_titles: extracted.targetTitles || existingProfile?.target_titles || [],
      seniority: extracted.seniority || existingProfile?.seniority || 'Mid',
      skills_json: extracted.skills || existingProfile?.skills_json || [],
      languages: extracted.languages || existingProfile?.languages || ['en'],
      profile_context_text: extracted.profileContextText || existingProfile?.profile_context_text || '',
      locations_allowed: existingProfile?.locations_allowed || ['Worldwide'],
      locations_excluded: existingProfile?.locations_excluded || [],
      salary_min: existingProfile?.salary_min || null,
      salary_max: existingProfile?.salary_max || null,
      salary_currency: existingProfile?.salary_currency || 'USD',
      use_profile_context_for_matching: existingProfile?.use_profile_context_for_matching ?? true,
      work_authorization_constraints: existingProfile?.work_authorization_constraints || [],
      updated_at: new Date().toISOString(),
    };
    
    // Upsert to job profile
    const { data: profile, error } = await supabase
      .from('user_job_profiles')
      .upsert(profileData, { onConflict: 'clerk_id' })
      .select()
      .single();
    
    if (error) {
      console.error('[Sync Job Profile] Error:', error);
      throw error;
    }
    
    return NextResponse.json({
      success: true,
      profile,
      extracted: {
        targetTitles: extracted.targetTitles,
        seniority: extracted.seniority,
        skillsCount: extracted.skills?.length || 0,
      },
    });
    
  } catch (err) {
    console.error('[Sync Job Profile] Error:', err);
    return NextResponse.json(
      { 
        success: false,
        error: err instanceof Error ? err.message : 'Failed to sync job profile' 
      },
      { status: 500 }
    );
  }
}
