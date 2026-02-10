/**
 * Ranking Service
 * Implements eligibility gates and explainable scoring for job matching
 * Configurable weights and modular scoring factors
 */

import {
  Job,
  UserJobProfile,
  Match,
  MatchReason,
  EligibilityResult,
  RankingInputs,
} from '@/lib/types/job-intelligence';
import { getSupabaseServiceRole } from '@/lib/supabase-server';

export interface RankingConfig {
  weights: {
    title_match: number;
    skill_overlap: number;
    seniority_alignment: number;
    location_fit: number;
    freshness: number;
    source_quality: number;
    query_relevance: number;
    profile_context_similarity: number;
  };
  eligibility: {
    enforce_remote_type: boolean;
    enforce_location: boolean;
    enforce_work_auth: boolean;
    enforce_language: boolean;
  };
}

const DEFAULT_CONFIG: RankingConfig = {
  weights: {
    title_match: 0.50,           // SIGNIFICANTLY increased - most important
    skill_overlap: 0.20,          // Decreased to give more to title
    seniority_alignment: 0.12,    // Slightly decreased
    location_fit: 0.08,           // Slightly decreased
    freshness: 0.05,              // Decreased
    source_quality: 0.03,         // Decreased
    query_relevance: 0.02,        // Decreased
    profile_context_similarity: 0.00, // Disabled - focus on title/skills
  },
  eligibility: {
    enforce_remote_type: true,
    enforce_location: true,
    enforce_work_auth: true,
    enforce_language: false,  // Soft requirement
  },
};

export class RankingService {
  private config: RankingConfig;
  
  constructor(config?: Partial<RankingConfig>) {
    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
      weights: {
        ...DEFAULT_CONFIG.weights,
        ...config?.weights,
      },
      eligibility: {
        ...DEFAULT_CONFIG.eligibility,
        ...config?.eligibility,
      },
    };
  }
  
  /**
   * Check if a user is eligible for a job
   */
  checkEligibility(job: Job, profile?: UserJobProfile): EligibilityResult {
    const failed: string[] = [];
    
    if (!profile) {
      return { passed: true, failed_checks: [] };
    }
    
    // Remote type check
    if (this.config.eligibility.enforce_remote_type) {
      // Most users want remote jobs, but we can be flexible
      if (job.remote_type === 'onsite') {
        failed.push('job_is_onsite');
      }
    }
    
    // Location check
    if (this.config.eligibility.enforce_location && profile.locations_allowed.length > 0) {
      const jobCountries = job.allowed_countries || [];
      const userCountries = profile.locations_allowed;
      
      const hasMatch = jobCountries.some(jc => 
        jc === 'Worldwide' || 
        userCountries.includes(jc) ||
        userCountries.includes('Worldwide')
      );
      
      if (!hasMatch && jobCountries.length > 0) {
        failed.push('location_not_allowed');
      }
    }
    
    // Work authorization check
    if (this.config.eligibility.enforce_work_auth && profile.work_authorization_constraints.length > 0) {
      // This would need job-side work auth requirements
      // For now, skip
    }
    
    // Language check (soft requirement)
    if (this.config.eligibility.enforce_language && profile.languages.length > 0) {
      if (job.language && !profile.languages.includes(job.language)) {
        // Don't fail, but note it
        failed.push('language_mismatch');
      }
    }
    
    return {
      passed: failed.filter(f => !['language_mismatch'].includes(f)).length === 0,
      failed_checks: failed,
    };
  }
  
  /**
   * Rank a job for a user
   */
  async rankJob(job: Job, inputs: RankingInputs): Promise<Match | null> {
    const { profile, query, use_profile_context } = inputs;
    
    if (!profile) {
      // Can't rank without profile
      return null;
    }
    
    // Check eligibility first
    const eligibility = this.checkEligibility(job, profile);
    
    if (!eligibility.passed) {
      // Store a failed match for tracking
      return {
        id: '',
        user_id: profile.clerk_id,
        job_id: job.id,
        score: 0,
        reasons: [
          {
            factor: 'eligibility_failed',
            score: 0,
            description: `Job does not meet eligibility: ${eligibility.failed_checks.join(', ')}`,
          },
        ],
        eligibility_passed: false,
        inputs_used: {
          profile_basics: true,
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }
    
    // Calculate score components
    const reasons: MatchReason[] = [];
    let totalScore = 0;
    
    // Title match
    const titleScore = this.scoreTitleMatch(job, profile);
    if (titleScore > 0) {
      const weighted = titleScore * this.config.weights.title_match * 100;
      reasons.push({
        factor: 'title_match',
        score: weighted,
        description: this.getTitleMatchDescription(job, profile, titleScore),
      });
      totalScore += weighted;
    }
    
    // Skill overlap
    const skillScore = this.scoreSkillOverlap(job, profile);
    if (skillScore > 0) {
      const weighted = skillScore * this.config.weights.skill_overlap * 100;
      reasons.push({
        factor: 'skill_overlap',
        score: weighted,
        description: this.getSkillMatchDescription(job, profile, skillScore),
      });
      totalScore += weighted;
    }
    
    // Seniority alignment
    const seniorityScore = this.scoreSeniorityAlignment(job, profile);
    if (seniorityScore > 0) {
      const weighted = seniorityScore * this.config.weights.seniority_alignment * 100;
      reasons.push({
        factor: 'seniority_alignment',
        score: weighted,
        description: this.getSeniorityDescription(job, profile, seniorityScore),
      });
      totalScore += weighted;
    }
    
    // Location fit
    const locationScore = this.scoreLocationFit(job, profile);
    if (locationScore > 0) {
      const weighted = locationScore * this.config.weights.location_fit * 100;
      reasons.push({
        factor: 'location_fit',
        score: weighted,
        description: 'Job location matches your preferences',
      });
      totalScore += weighted;
    }
    
    // Freshness
    const freshnessScore = this.scoreFreshness(job);
    if (freshnessScore > 0) {
      const weighted = freshnessScore * this.config.weights.freshness * 100;
      reasons.push({
        factor: 'freshness',
        score: weighted,
        description: this.getFreshnessDescription(job, freshnessScore),
      });
      totalScore += weighted;
    }
    
    // Source quality
    const sourceScore = this.scoreSourceQuality(job);
    if (sourceScore > 0) {
      const weighted = sourceScore * this.config.weights.source_quality * 100;
      reasons.push({
        factor: 'source_quality',
        score: weighted,
        description: 'Job from high-quality source',
      });
      totalScore += weighted;
    }
    
    // Query relevance (if query provided)
    if (query) {
      const queryScore = this.scoreQueryRelevance(job, query);
      if (queryScore > 0) {
        const weighted = queryScore * this.config.weights.query_relevance * 100;
        reasons.push({
          factor: 'query_relevance',
          score: weighted,
          description: `Matches your search for "${query.slice(0, 50)}"`,
        });
        totalScore += weighted;
      }
    }
    
    // Profile context similarity (if enabled)
    if (use_profile_context && profile.profile_context_text) {
      const contextScore = await this.scoreProfileContext(job, profile);
      if (contextScore > 0) {
        const weighted = contextScore * this.config.weights.profile_context_similarity * 100;
        reasons.push({
          factor: 'profile_context',
          score: weighted,
          description: 'Aligns with your career goals and preferences',
        });
        totalScore += weighted;
      }
    }
    
    // Sort reasons by score
    reasons.sort((a, b) => b.score - a.score);
    
    return {
      id: '',
      user_id: profile.clerk_id,
      job_id: job.id,
      score: Math.min(100, Math.round(totalScore)),
      reasons: reasons.slice(0, 5),  // Top 5 reasons
      eligibility_passed: true,
      inputs_used: {
        profile_basics: true,
        profile_context: use_profile_context && !!profile.profile_context_text,
        query: query || undefined,
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }
  
  /**
   * Rank multiple jobs for a user
   */
  async rankJobs(jobs: Job[], inputs: RankingInputs): Promise<Match[]> {
    const matches: Match[] = [];
    
    for (const job of jobs) {
      const match = await this.rankJob(job, inputs);
      if (match && match.eligibility_passed) {
        matches.push(match);
      }
    }
    
    // Sort by score descending
    matches.sort((a, b) => b.score - a.score);
    
    return matches;
  }
  
  /**
   * Store matches in database
   */
  async storeMatches(matches: Match[]): Promise<void> {
    if (matches.length === 0) return;
    
    const supabase = getSupabaseServiceRole();
    
    const records = matches.map(m => ({
      user_id: m.user_id,
      job_id: m.job_id,
      score: m.score,
      reasons: m.reasons,
      eligibility_passed: m.eligibility_passed,
      inputs_used: m.inputs_used,
      created_at: m.created_at,
      updated_at: m.updated_at,
    }));
    
    const { error } = await supabase
      .from('matches')
      .upsert(records, {
        onConflict: 'user_id,job_id',
      });
    
    if (error) {
      console.error('[Ranking] Error storing matches:', error);
      throw error;
    }
  }
  
  // ===== Scoring Methods =====
  
  private scoreTitleMatch(job: Job, profile: UserJobProfile): number {
    const jobTitle = (job.normalized_title || job.title).toLowerCase();
    const targetTitles = profile.target_titles.map(t => t.toLowerCase());
    
    let maxScore = 0;
    
    for (const targetTitle of targetTitles) {
      let score = 0;
      
      // Extract key words from target (skip seniority levels)
      const seniorityWords = ['senior', 'junior', 'lead', 'staff', 'principal', 'head', 'chief', 'vp', 'director'];
      const targetWords = targetTitle.split(/\s+/).filter(w => 
        w.length > 3 && !seniorityWords.includes(w)
      );
      
      // Count matched key words
      const matchedWords = targetWords.filter(word => jobTitle.includes(word));
      
      // ALL key words must match for high score
      if (matchedWords.length === targetWords.length && targetWords.length > 0) {
        // Perfect match of all key words = 1.0
        score = 1.0;
      } else if (matchedWords.length >= targetWords.length - 1 && targetWords.length > 1) {
        // Almost all words match = 0.8
        score = 0.8;
      } else if (matchedWords.length >= 2) {
        // At least 2 words match = 0.6
        score = 0.6;
      } else if (matchedWords.length === 1) {
        // Only 1 word matches = 0.3 (low score)
        score = 0.3;
      } else {
        // No matches = 0
        score = 0;
      }
      
      // Bonus: Check string similarity for exact/close matches
      const similarity = this.stringSimilarity(jobTitle, targetTitle);
      if (similarity > 0.8) {
        score = Math.max(score, similarity);
      }
      
      maxScore = Math.max(maxScore, score);
    }
    
    return maxScore;
  }
  
  private scoreSkillOverlap(job: Job, profile: UserJobProfile): number {
    const jobSkills = new Set((job.skills_json || []).map(s => s.toLowerCase()));
    const userSkills = new Set(profile.skills_json.map(s => s.toLowerCase()));
    
    if (jobSkills.size === 0 || userSkills.size === 0) return 0;
    
    const intersection = new Set([...jobSkills].filter(x => userSkills.has(x)));
    
    return intersection.size / Math.min(jobSkills.size, userSkills.size);
  }
  
  private scoreSeniorityAlignment(job: Job, profile: UserJobProfile): number {
    if (!job.seniority || !profile.seniority) return 0.5;  // Neutral
    
    const seniorityMap: Record<string, number> = {
      'Intern': 0,
      'Junior': 1,
      'Mid': 2,
      'Senior': 3,
      'Executive': 4,
    };
    
    const jobLevel = seniorityMap[job.seniority] ?? 2;
    const userLevel = seniorityMap[profile.seniority] ?? 2;
    
    const diff = Math.abs(jobLevel - userLevel);
    
    if (diff === 0) return 1.0;  // Exact match
    if (diff === 1) return 0.8;  // One level off
    if (diff === 2) return 0.5;  // Two levels off
    return 0.2;  // Too far
  }
  
  private scoreLocationFit(job: Job, profile: UserJobProfile): number {
    if (profile.locations_allowed.length === 0) return 1.0;  // No preference
    
    const jobCountries = job.allowed_countries || [];
    const userCountries = profile.locations_allowed;
    
    if (jobCountries.includes('Worldwide') || userCountries.includes('Worldwide')) {
      return 1.0;
    }
    
    const overlap = jobCountries.filter(jc => userCountries.includes(jc));
    
    return overlap.length > 0 ? 1.0 : 0;
  }
  
  private scoreFreshness(job: Job): number {
    const posted = job.posted_at || job.first_seen_at;
    if (!posted) return 0.5;
    
    const daysAgo = (Date.now() - new Date(posted).getTime()) / (1000 * 60 * 60 * 24);
    
    if (daysAgo <= 7) return 1.0;
    if (daysAgo <= 14) return 0.8;
    if (daysAgo <= 30) return 0.6;
    if (daysAgo <= 60) return 0.4;
    return 0.2;
  }
  
  private scoreSourceQuality(job: Job): number {
    const sourceScores: Record<string, number> = {
      'remotive': 1.0,      // Curated, high quality
      'remoteok': 0.9,      // Popular, good quality
      'getonboard': 0.85,   // LATAM-focused, vetted
      'adzuna': 0.7,        // High volume, mixed quality
    };
    
    return sourceScores[job.source_primary] ?? 0.5;
  }
  
  private scoreQueryRelevance(job: Job, query: string): number {
    const q = query.toLowerCase();
    const text = [
      job.normalized_title || job.title,
      job.company_name,
      job.description_text,
      ...(job.skills_json || []),
    ].join(' ').toLowerCase();
    
    const queryWords = q.split(/\s+/).filter(w => w.length > 2);
    let matchedWords = 0;
    
    for (const word of queryWords) {
      if (text.includes(word)) {
        matchedWords++;
      }
    }
    
    return queryWords.length > 0 ? matchedWords / queryWords.length : 0;
  }
  
  private async scoreProfileContext(job: Job, profile: UserJobProfile): Promise<number> {
    // Improved keyword-based scoring focusing on meaningful terms
    // Filters out generic words that cause false matches
    
    const contextText = profile.profile_context_text?.toLowerCase() || '';
    const jobText = [
      job.normalized_title || job.title,
      job.description_text,
    ].join(' ').toLowerCase();
    
    // Stopwords to filter out generic terms
    const stopwords = new Set([
      'specializing', 'seeking', 'building', 'driving', 'involve', 'involves',
      'focus', 'focused', 'outcomes', 'environments', 'solutions', 'innovative',
      'ambiguous', 'measurable', 'experience', 'working', 'looking', 'strong',
      'excellent', 'great', 'passionate', 'dedicated', 'motivated', 'team',
      'company', 'position', 'role', 'opportunity', 'career', 'professional',
      'skills', 'ability', 'responsibilities', 'requirements', 'qualifications',
    ]);
    
    // Extract meaningful keywords (titles, technologies, domains)
    const contextWords = contextText
      .split(/\s+/)
      .filter(w => 
        w.length > 4 && 
        !stopwords.has(w) &&
        !/^(the|this|that|with|from|have|been|will|would|should|could)$/.test(w)
      );
    
    // Prioritize important terms from context
    const importantTerms: string[] = [];
    
    // Extract job titles and seniority levels
    const titleWords = ['product', 'manager', 'director', 'senior', 'lead', 'principal', 'chief', 'head'];
    titleWords.forEach(word => {
      if (contextText.includes(word) && !importantTerms.includes(word)) {
        importantTerms.push(word);
      }
    });
    
    // Extract specific domains/technologies mentioned
    const domainWords = contextText.match(/\b(?:ai|edtech|saas|b2b|platform|marketplace|mobile|web|cloud|data|analytics|ml|machine learning)\b/gi) || [];
    domainWords.forEach(word => {
      const lower = word.toLowerCase();
      if (!importantTerms.includes(lower)) {
        importantTerms.push(lower);
      }
    });
    
    // Score based on important terms + filtered keywords
    const allTerms = [...new Set([...importantTerms, ...contextWords.slice(0, 20)])];
    let matchedTerms = 0;
    let importantMatches = 0;
    
    for (const term of allTerms) {
      if (jobText.includes(term)) {
        matchedTerms++;
        if (importantTerms.includes(term)) {
          importantMatches += 2; // Weight important terms more
        }
      }
    }
    
    if (allTerms.length === 0) return 0;
    
    // Weighted score favoring important term matches
    const totalWeight = matchedTerms + importantMatches;
    const maxWeight = allTerms.length + (importantTerms.length * 2);
    
    return totalWeight / maxWeight;
  }
  
  // ===== Description Helpers =====
  
  private getTitleMatchDescription(job: Job, profile: UserJobProfile, score: number): string {
    const jobTitle = job.normalized_title || job.title;
    
    if (score >= 0.9) {
      return `Job title "${jobTitle}" closely matches your target roles`;
    } else if (score >= 0.7) {
      return `Job title "${jobTitle}" aligns with your career goals`;
    } else if (score >= 0.5) {
      return `Job title "${jobTitle}" is related to your target roles`;
    }
    
    return 'Job title is somewhat relevant to your profile';
  }
  
  private getSkillMatchDescription(job: Job, profile: UserJobProfile, score: number): string {
    const jobSkills = new Set((job.skills_json || []).map(s => s.toLowerCase()));
    const userSkills = new Set(profile.skills_json.map(s => s.toLowerCase()));
    const matching = [...jobSkills].filter(s => userSkills.has(s));
    
    if (matching.length === 0) {
      return 'Some transferable skills may apply';
    }
    
    const topMatching = matching.slice(0, 3).join(', ');
    
    if (score >= 0.8) {
      return `Strong skill match: ${topMatching} and more`;
    } else if (score >= 0.5) {
      return `Good skill overlap: ${topMatching}`;
    }
    
    return `Matches some of your skills: ${topMatching}`;
  }
  
  private getSeniorityDescription(job: Job, profile: UserJobProfile, score: number): string {
    if (score >= 0.9) {
      return `Seniority level (${job.seniority}) matches your experience`;
    } else if (score >= 0.7) {
      return `Seniority level (${job.seniority}) is close to your level`;
    }
    
    return 'Seniority level may be a stretch or step down';
  }
  
  private getFreshnessDescription(job: Job, score: number): string {
    const posted = job.posted_at || job.first_seen_at;
    const daysAgo = Math.round((Date.now() - new Date(posted).getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysAgo <= 3) {
      return 'Posted within the last 3 days';
    } else if (daysAgo <= 7) {
      return 'Posted this week';
    } else if (daysAgo <= 14) {
      return 'Posted within the last 2 weeks';
    }
    
    return `Posted ${daysAgo} days ago`;
  }
  
  private stringSimilarity(str1: string, str2: string): number {
    const words1 = new Set(str1.split(/\s+/));
    const words2 = new Set(str2.split(/\s+/));
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    return union.size > 0 ? intersection.size / union.size : 0;
  }
}
