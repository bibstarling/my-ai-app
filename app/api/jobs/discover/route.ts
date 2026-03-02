/**
 * POST /api/jobs/discover
 * Discover jobs with personalized ranking or manual query
 */

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getSupabaseServiceRole } from '@/lib/supabase-server';
import { RankingService } from '@/lib/jobs-ingestion/ranking-service';
import { parseRemoteRegionEligibilityToAllowedCountries } from '@/lib/jobs-ingestion/remote-eligibility';
import { Job, JobSearchFilters } from '@/lib/types/job-intelligence';

export const dynamic = 'force-dynamic';

interface DiscoverRequest {
  mode: 'personalized' | 'manual_query';
  query?: string;
  use_profile_context?: boolean;
  filters?: JobSearchFilters;
  limit?: number;
  offset?: number;
  exclude_saved?: boolean; // New: filter out already saved jobs
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const body: DiscoverRequest = await req.json();
    const {
      mode,
      query,
      use_profile_context = false,
      filters = {},
      limit = 200, // Show many more results (increased from 50)
      offset = 0,
      exclude_saved = false,
    } = body;
    
    const supabase = getSupabaseServiceRole();
    
    // Load user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_job_profiles')
      .select('*')
      .eq('clerk_id', userId)
      .single();
    
    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Profile not found. Please set up your job profile first.' },
        { status: 400 }
      );
    }

    // Normalize profile so location preferences are always arrays (DB can return null)
    const normalizedProfile = {
      ...profile,
      locations_allowed: Array.isArray(profile.locations_allowed) ? profile.locations_allowed : [],
      remote_only: !!profile.remote_only,
    };

    // Apply profile preference: remote only (from Profile → Location & remote)
    const effectiveFilters = { ...filters };
    if (normalizedProfile.remote_only) {
      effectiveFilters.remote_type = ['remote'];
    }
    
    // Build base query
    let jobsQuery = supabase
      .from('jobs')
      .select('*')
      .eq('status', 'active')
      .order('posted_at', { ascending: false, nullsFirst: false }); // Order by posted_at for better diversity
    
    // Apply filters
    if (effectiveFilters.remote_type && effectiveFilters.remote_type.length > 0) {
      jobsQuery = jobsQuery.in('remote_type', effectiveFilters.remote_type);
    }
    
    if (effectiveFilters.seniority && effectiveFilters.seniority.length > 0) {
      jobsQuery = jobsQuery.in('seniority', effectiveFilters.seniority);
    }
    
    if (effectiveFilters.languages && effectiveFilters.languages.length > 0) {
      jobsQuery = jobsQuery.in('language', effectiveFilters.languages);
    }
    
    if (effectiveFilters.posted_since) {
      jobsQuery = jobsQuery.gte('posted_at', effectiveFilters.posted_since);
    }
    
    // Manual query mode: filter by title primarily (NOT broad text search)
    // This ensures manual search also returns relevant role matches
    if (mode === 'manual_query' && query) {
      jobsQuery = jobsQuery.or(
        `normalized_title.ilike.%${query}%,title.ilike.%${query}%`
      );
    }
    
    // Fetch more jobs to ensure we have enough from all sources after filtering
    // Increased to 500 to show more diverse results
    const fetchLimit = Math.min(limit * 20, 500);
    jobsQuery = jobsQuery.limit(fetchLimit);
    
    const { data: jobs, error: jobsError } = await jobsQuery;
    
    if (jobsError) {
      throw jobsError;
    }
    
    if (!jobs || jobs.length === 0) {
      return NextResponse.json({
        jobs: [],
        mode,
        total: 0,
      });
    }
    
    // PRE-FILTER: Strictly filter by target titles (both personalized and manual mode)
    let filteredJobs = jobs;
    
    // Determine filtering keywords based on mode
    let filterKeywords: string[] = [];
    if (mode === 'personalized' && normalizedProfile.target_titles?.length > 0) {
      filterKeywords = normalizedProfile.target_titles.map((t: string) => t.toLowerCase());
    } else if (mode === 'manual_query' && query) {
      filterKeywords = [query.toLowerCase()];
    }
    
    if (filterKeywords.length > 0) {
      filteredJobs = jobs.filter(job => {
        const jobTitle = (job.normalized_title || job.title).toLowerCase();
        
        // Use filter keywords (from profile or manual query)
        const targetRoles = filterKeywords;
        const hasProductManager = targetRoles.some(t => 
          t.includes('product') && (t.includes('manager') || t.includes('lead') || t.includes('director') || t.includes('vp'))
        );
        
        // Lenient filtering for Product Manager profiles - exclude only obviously wrong roles
        if (hasProductManager) {
          // Only EXCLUDE pure non-PM roles (let ranking handle the rest)
          const hardExcludes = [
            // Pure technical roles
            'software engineer',
            'backend engineer',
            'frontend engineer',
            'full stack engineer',
            'devops engineer',
            'data engineer',
            'web developer',
            'mobile developer',
            // Pure design roles
            'product designer',
            'ux designer',
            'ui designer',
            'graphic designer',
            // Sales/Support roles
            'sales representative',
            'sales executive',
            'customer support',
            'customer service',
            // Junior/Intern roles
            'junior developer',
            'junior engineer',
            'intern ',
          ];
          
          const isObviouslyWrong = hardExcludes.some(pattern => {
            const regex = new RegExp(`\\b${pattern}\\b`, 'i');
            return regex.test(jobTitle);
          });
          
          // Include everything except obviously wrong roles
          return !isObviouslyWrong;
        }
        
        // For other roles, be very lenient - only exclude obviously unrelated jobs
        // Let the ranking system handle relevance scoring
        return true; // Include all other jobs (ranking will score them)
      });
      
      console.log(`[Discovery] Pre-filtered: ${jobs.length} -> ${filteredJobs.length} jobs`);
      
      if (filteredJobs.length === 0) {
        return NextResponse.json({
          jobs: [],
          mode,
          total: 0,
        });
      }
    }
    
    // Derive allowed_countries from remote_region_eligibility so ranking can match user locations_allowed
    const jobsForRanking = (filteredJobs as Job[]).map((job) => ({
      ...job,
      allowed_countries:
        job.allowed_countries?.length > 0
          ? job.allowed_countries
          : parseRemoteRegionEligibilityToAllowedCountries(job.remote_region_eligibility),
    }));

    // Rank jobs (use filtered jobs in personalized mode)
    const rankingService = new RankingService();
    const rankedMatches = await rankingService.rankJobs(
      jobsForRanking,
      {
        profile: normalizedProfile,
        query: mode === 'manual_query' ? query : undefined,
        use_profile_context: mode === 'personalized' ? use_profile_context : false,
        filters,
      }
    );
    
    // Store matches for future reference
    try {
      await rankingService.storeMatches(rankedMatches);
    } catch (err) {
      console.error('Failed to store matches:', err);
      // Non-fatal, continue
    }
    
    // Filter out only very low-quality matches in personalized mode
    let filteredMatches = rankedMatches;
    if (mode === 'personalized') {
      // Show all matches >= 5% (extremely low threshold - let user decide)
      filteredMatches = rankedMatches.filter(match => match.score >= 5);
      
      // If still too few results, show ALL results
      if (filteredMatches.length < 20) {
        filteredMatches = rankedMatches; // Show all ranked results
      }
    }
    
    // Get user's saved/tracked jobs
    const { data: trackedJobs } = await supabase
      .from('tracked_jobs')
      .select('job_id')
      .eq('clerk_id', userId);
    
    const savedJobIds = new Set(trackedJobs?.map(t => t.job_id) || []);
    
    // Filter out saved jobs if requested
    let finalMatches = filteredMatches;
    if (exclude_saved) {
      finalMatches = filteredMatches.filter(match => !savedJobIds.has(match.job_id));
    }
    
    // Merge job data with match scores and saved status
    console.log(`[Discovery API] Returning ${Math.min(finalMatches.length - offset, limit)} of ${finalMatches.length} matches (limit: ${limit}, offset: ${offset})`);
    const rankedJobs = finalMatches.slice(offset, offset + limit).map(match => {
      const job = jobs.find(j => j.id === match.job_id);
      return {
        ...job,
        match_percentage: match.score,
        match_reasons: match.reasons,
        match: match,
        is_saved: savedJobIds.has(match.job_id), // Add saved status
      };
    });
    
    return NextResponse.json({
      jobs: rankedJobs,
      mode,
      total: finalMatches.length,
      profile_context_used: mode === 'personalized' ? use_profile_context : false,
    });
    
  } catch (err) {
    console.error('[Discover API] Error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Discovery failed' },
      { status: 500 }
    );
  }
}
