'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { Modal } from '@/app/components/Modal';
import { AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';

type DiscoveryMode = 'personalized' | 'manual_query';

interface MatchReason {
  factor: string;
  score: number;
  description: string;
}

interface JobResult {
  id: string;
  normalized_title: string;
  title: string;
  company_name: string;
  description_text: string;
  seniority?: string;
  remote_type: string;
  locations: string[];
  skills_json: string[];
  apply_url: string;
  posted_at?: string;
  source_name?: string; // Job board source name
  match_percentage?: number;
  match_reasons?: MatchReason[];
  is_tracked?: boolean;
  is_saved?: boolean; // Whether job is saved to user's list
}

interface Filters {
  remote_type: string[];
  seniority: string[];
  languages: string[];
  posted_since?: string;
  exclude_saved?: boolean; // New: filter out saved jobs
}

type SortOption = 'match' | 'date' | 'company' | 'title';

export default function JobDiscoveryPage() {
  const { user } = useUser();
  const [mode, setMode] = useState<DiscoveryMode>('personalized');
  const [query, setQuery] = useState('');
  const [useProfileContext, setUseProfileContext] = useState(false);
  const [jobs, setJobs] = useState<JobResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasProfile, setHasProfile] = useState(false);
  const [checkingProfile, setCheckingProfile] = useState(true);
  const [expandedJob, setExpandedJob] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    remote_type: [],
    seniority: [],
    languages: [],
    posted_since: undefined,
    exclude_saved: false,
  });
  const [trackingJob, setTrackingJob] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('match');
  
  // Modal state
  const [modal, setModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    variant: 'info' | 'success' | 'warning' | 'error';
    icon: React.ReactNode;
  }>({
    isOpen: false,
    title: '',
    message: '',
    variant: 'info',
    icon: null,
  });
  

  useEffect(() => {
    // Check if we already know the profile status from this session
    const cachedStatus = sessionStorage.getItem('hasJobProfile');
    if (cachedStatus === 'true') {
      setHasProfile(true);
      setCheckingProfile(false);
    } else {
      checkProfile();
    }
  }, []);

  async function checkProfile() {
    // Don't check again if we already have profile (unless forced)
    if (hasProfile) {
      setCheckingProfile(false);
      return;
    }
    
    setCheckingProfile(true);
    try {
      const res = await fetch('/api/job-profile', {
        credentials: 'include',
        cache: 'no-cache', // Changed from no-store to no-cache for better performance
      });
      
      if (!res.ok) {
        console.error('[Profile Check] API error:', res.status, res.statusText);
        setHasProfile(false);
        setCheckingProfile(false);
        return;
      }
      
      const data = await res.json();
      console.log('[Profile Check] Full API response:', data);
      
      // Check both direct profile data and nested profile object
      const profileData = data.profile || data;
      
      const hasTargetTitles = Array.isArray(profileData?.target_titles) && profileData.target_titles.length > 0;
      const hasSkills = Array.isArray(profileData?.skills_json) && profileData.skills_json.length > 0;
      const hasPlatformContext = data.platform_profile_context && data.platform_profile_context.length > 50;
      
      // Consider profile valid if user has EITHER job profile data OR platform portfolio
      const hasValidProfile = hasTargetTitles || hasSkills || hasPlatformContext;
      
      console.log('[Profile Check] Validation:', {
        hasTargetTitles,
        hasSkills,
        hasPlatformContext,
        hasValidProfile,
        titlesCount: profileData?.target_titles?.length,
        skillsCount: profileData?.skills_json?.length,
        contextLength: data.platform_profile_context?.length
      });
      
      setHasProfile(hasValidProfile);
      
      // Cache the result for this session to avoid repeated checks
      if (hasValidProfile) {
        sessionStorage.setItem('hasJobProfile', 'true');
      } else {
        sessionStorage.removeItem('hasJobProfile');
      }
      
      setCheckingProfile(false);
      
      if (hasValidProfile) {
        // Auto-load personalized jobs
        discoverJobs();
      }
    } catch (err) {
      console.error('[Profile Check] Failed:', err);
      setHasProfile(false);
      sessionStorage.removeItem('hasJobProfile');
      setCheckingProfile(false);
    }
  }

  const showModal = (title: string, message: string, variant: 'info' | 'success' | 'warning' | 'error') => {
    const icons = {
      info: <Info className="w-6 h-6" />,
      success: <CheckCircle className="w-6 h-6" />,
      warning: <AlertTriangle className="w-6 h-6" />,
      error: <AlertCircle className="w-6 h-6" />,
    };
    
    setModal({
      isOpen: true,
      title,
      message,
      variant,
      icon: icons[variant],
    });
  };

  async function discoverJobs() {
    // Re-check profile in case it was just created
    if (!hasProfile) {
      await checkProfile();
      if (!hasProfile) {
        showModal(
          'Profile Setup Required',
          'Please set up your job profile to discover personalized opportunities tailored to your skills and experience.',
          'warning'
        );
        return;
      }
    }
    
    if (mode === 'manual_query' && !query.trim()) {
      showModal(
        'Search Query Missing',
        'Please enter a search query to find specific jobs. Try something like "senior developer" or "product manager".',
        'info'
      );
      return;
    }
    
    // Clear previous results when starting new search
    setJobs([]);
    setExpandedJob(null);
    setLoading(true);
    
    try {
      const res = await fetch('/api/jobs/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exclude_saved: filters.exclude_saved,
          mode,
          query: mode === 'manual_query' ? query : undefined,
          use_profile_context: mode === 'personalized' ? useProfileContext : false,
          limit: 200, // Request up to 200 results
          offset: 0,
          filters: {
            remote_type: filters.remote_type.length > 0 ? filters.remote_type : undefined,
            seniority: filters.seniority.length > 0 ? filters.seniority : undefined,
            languages: filters.languages.length > 0 ? filters.languages : undefined,
            posted_since: filters.posted_since,
          },
        }),
      });
      
      const data = await res.json();
      
      if (data.error) {
        showModal(
          'Discovery Failed',
          data.error || 'We encountered an issue while searching for jobs. Please try again or adjust your search criteria.',
          'error'
        );
      } else {
        console.log('[Discovery] Received jobs:', data.jobs?.length || 0, 'Total available:', data.total);
        if (!data.jobs || data.jobs.length === 0) {
          showModal(
            'No Jobs Found',
            mode === 'personalized' 
              ? 'We couldn\'t find jobs matching your profile right now. The job database might be empty - try running the pipeline from Admin > Jobs.'
              : 'No jobs match your search criteria. Try adjusting your query or filters.',
            'info'
          );
        }
        setJobs(data.jobs || []);
      }
    } catch (err) {
      console.error('Discovery error:', err);
      showModal(
        'Search Error',
        'Something went wrong while searching for jobs. Please check your connection and try again.',
        'error'
      );
    } finally {
      setLoading(false);
    }
  }

  async function trackJob(job: JobResult) {
    const jobId = job.id;
    setTrackingJob(jobId);

    try {
      const res = await fetch(`/api/jobs/${jobId}/track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(job),
      });
      
      const data = await res.json();
      
      if (data.success) {
        // Update local state
        setJobs(jobs.map(j => 
          j.id === jobId ? { ...j, is_tracked: true, is_saved: true } : j
        ));
        showModal(
          'Job Saved!',
          'This job has been added to your applications. You can now generate a tailored resume and cover letter from My Applications.',
          'success'
        );
      } else {
        showModal(
          'Save Failed',
          data.error || 'We couldn\'t save this job to your applications. Please try again.',
          'error'
        );
      }
    } catch (err) {
      console.error('Track error:', err);
      showModal(
        'Save Error',
        'Something went wrong while saving this job. Please check your connection and try again.',
        'error'
      );
    } finally {
      setTrackingJob(null);
    }
  }


  function getActiveFilterCount(): number {
    let count = 0;
    if (filters.remote_type.length > 0) count++;
    if (filters.seniority.length > 0) count++;
    if (filters.languages.length > 0) count++;
    if (filters.posted_since) count++;
    if (filters.exclude_saved) count++;
    return count;
  }

  function getPostedLabel(isoDate: string): string {
    const date = new Date(isoDate);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 1) return 'Last 24 hours';
    if (diffDays <= 7) return 'Last 7 days';
    if (diffDays <= 30) return 'Last 30 days';
    return 'Custom';
  }

  function getTimeAgo(isoDate: string): string {
    const date = new Date(isoDate);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 30) return `${diffDays}d ago`;
    
    const diffMonths = Math.floor(diffDays / 30);
    if (diffMonths < 12) return `${diffMonths}mo ago`;
    
    const diffYears = Math.floor(diffDays / 365);
    return `${diffYears}y ago`;
  }

  function getSortedJobs(): JobResult[] {
    const sorted = [...jobs];
    
    switch (sortBy) {
      case 'match':
        return sorted.sort((a, b) => {
          const matchA = a.match_percentage ?? 0;
          const matchB = b.match_percentage ?? 0;
          return matchB - matchA; // Descending
        });
      
      case 'date':
        return sorted.sort((a, b) => {
          const dateA = a.posted_at ? new Date(a.posted_at).getTime() : 0;
          const dateB = b.posted_at ? new Date(b.posted_at).getTime() : 0;
          return dateB - dateA; // Most recent first
        });
      
      case 'company':
        return sorted.sort((a, b) => 
          a.company_name.localeCompare(b.company_name)
        );
      
      case 'title':
        return sorted.sort((a, b) => {
          const titleA = a.normalized_title || a.title;
          const titleB = b.normalized_title || b.title;
          return titleA.localeCompare(titleB);
        });
      
      default:
        return sorted;
    }
  }

  // Show loading while checking profile
  if (checkingProfile) {
    return (
      <div className="max-w-6xl mx-auto p-4 md:p-6 overflow-hidden">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your profile...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show profile setup required only after checking (and profile not found)
  if (!checkingProfile && !hasProfile) {
    return (
      <div className="max-w-6xl mx-auto p-4 md:p-6 overflow-hidden">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <h2 className="text-xl font-semibold text-yellow-900 mb-2">
            Profile Setup Required
          </h2>
          <p className="text-yellow-800 mb-4">
            Please set up your job profile to start discovering personalized opportunities.
          </p>
          <Link
            href="/job-profile"
            className="inline-block px-6 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
          >
            Set Up Profile
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-3 sm:p-4 md:p-6 overflow-x-hidden">
      <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-4 sm:mb-6 break-words">Discover Jobs</h1>
      
      {/* Mode Selector */}
      <div className="mb-4 sm:mb-6 bg-white rounded-lg shadow p-3 sm:p-4 md:p-6 overflow-hidden">
        <div className="flex flex-col xs:flex-row items-start xs:items-center gap-3 xs:gap-6 mb-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              checked={mode === 'personalized'}
              onChange={() => setMode('personalized')}
              className="w-4 h-4 text-blue-600"
            />
            <span className="font-medium text-sm sm:text-base">Personalized Discovery</span>
          </label>
          
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              checked={mode === 'manual_query'}
              onChange={() => setMode('manual_query')}
              className="w-4 h-4 text-blue-600"
            />
            <span className="font-medium text-sm sm:text-base">Manual Search</span>
          </label>
        </div>

        {mode === 'personalized' && (
          <div className="mb-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={useProfileContext}
                onChange={(e) => setUseProfileContext(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="text-sm text-gray-700">
                Use profile context for ranking (career goals, preferences)
              </span>
            </label>
          </div>
        )}

        {mode === 'manual_query' && (
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              className="flex-1 px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
              placeholder="Search for jobs (e.g., 'senior product manager AI')"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && discoverJobs()}
            />
          </div>
        )}

        <div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-3 xs:gap-4">
          <button
            onClick={discoverJobs}
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm sm:text-base font-medium"
          >
            {loading ? 'Discovering...' : mode === 'personalized' ? 'Discover Jobs' : 'Search'}
          </button>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 relative text-sm sm:text-base"
          >
            <span className="hidden xs:inline">{showFilters ? 'Hide' : 'Show'} Filters</span>
            <span className="xs:hidden">Filters</span>
            {getActiveFilterCount() > 0 && (
              <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold">
                {getActiveFilterCount()}
              </span>
            )}
          </button>
        </div>

        {/* Active Filters Tags */}
        {getActiveFilterCount() > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {filters.remote_type.map((type) => (
              <span
                key={type}
                className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
              >
                Remote: {type}
                <button
                  onClick={() => setFilters({
                    ...filters,
                    remote_type: filters.remote_type.filter(t => t !== type),
                  })}
                  className="hover:text-blue-900"
                >
                  ×
                </button>
              </span>
            ))}
            {filters.seniority.map((level) => (
              <span
                key={level}
                className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm"
              >
                {level}
                <button
                  onClick={() => setFilters({
                    ...filters,
                    seniority: filters.seniority.filter(s => s !== level),
                  })}
                  className="hover:text-purple-900"
                >
                  ×
                </button>
              </span>
            ))}
            {filters.languages.map((lang) => (
              <span
                key={lang}
                className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
              >
                {lang === 'en' ? 'English' : lang === 'pt-BR' ? 'Portuguese' : 'Spanish'}
                <button
                  onClick={() => setFilters({
                    ...filters,
                    languages: filters.languages.filter(l => l !== lang),
                  })}
                  className="hover:text-green-900"
                >
                  ×
                </button>
              </span>
            ))}
            {filters.posted_since && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm">
                Posted: {getPostedLabel(filters.posted_since)}
                <button
                  onClick={() => setFilters({
                    ...filters,
                    posted_since: undefined,
                  })}
                  className="hover:text-gray-900"
                >
                  ×
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="mb-4 sm:mb-6 bg-white rounded-lg shadow p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base sm:text-lg font-semibold">Filters</h3>
            {getActiveFilterCount() > 0 && (
              <span className="text-xs sm:text-sm text-blue-600 font-medium">
                {getActiveFilterCount()} active
              </span>
            )}
          </div>
          
          <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {/* Remote Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Remote Type
              </label>
              <div className="space-y-2">
                {['remote', 'hybrid', 'onsite'].map((type) => (
                  <label key={type} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={filters.remote_type.includes(type)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFilters({
                            ...filters,
                            remote_type: [...filters.remote_type, type],
                          });
                        } else {
                          setFilters({
                            ...filters,
                            remote_type: filters.remote_type.filter((t) => t !== type),
                          });
                        }
                      }}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span className="text-sm capitalize">{type}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Seniority */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Seniority
              </label>
              <div className="space-y-2">
                {['Junior', 'Mid', 'Senior', 'Executive'].map((level) => (
                  <label key={level} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={filters.seniority.includes(level)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFilters({
                            ...filters,
                            seniority: [...filters.seniority, level],
                          });
                        } else {
                          setFilters({
                            ...filters,
                            seniority: filters.seniority.filter((s) => s !== level),
                          });
                        }
                      }}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span className="text-sm">{level}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Language */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Language
              </label>
              <div className="space-y-2">
                {[
                  { code: 'en', label: 'English' },
                  { code: 'pt-BR', label: 'Portuguese' },
                  { code: 'es', label: 'Spanish' },
                ].map(({ code, label }) => (
                  <label key={code} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={filters.languages.includes(code)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFilters({
                            ...filters,
                            languages: [...filters.languages, code],
                          });
                        } else {
                          setFilters({
                            ...filters,
                            languages: filters.languages.filter((l) => l !== code),
                          });
                        }
                      }}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span className="text-sm">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Posted Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Posted
              </label>
              <select
                value={filters.posted_since || ''}
                onChange={(e) => setFilters({
                  ...filters,
                  posted_since: e.target.value || undefined,
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="">Any time</option>
                <option value={new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()}>
                  Last 24 hours
                </option>
                <option value={new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()}>
                  Last 7 days
                </option>
                <option value={new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()}>
                  Last 30 days
                </option>
              </select>
            </div>
          </div>

          {getActiveFilterCount() > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200 flex gap-4">
              <button
                onClick={() => {
                  setFilters({
                    remote_type: [],
                    seniority: [],
                    languages: [],
                    posted_since: undefined,
                    exclude_saved: false,
                  });
                }}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Clear All Filters
              </button>
              <button
                onClick={discoverJobs}
                className="text-sm text-green-600 hover:text-green-800 font-medium"
              >
                Apply Filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* Results Header with Sort */}
      {jobs.length > 0 && !loading && (
        <div className="mb-4 flex flex-col xs:flex-row items-start xs:items-center justify-between gap-3 bg-white rounded-lg shadow p-3 sm:p-4">
          <div className="text-sm text-gray-600">
            <span className="font-semibold text-gray-900">{jobs.length}</span> jobs found
          </div>
          
          <div className="flex items-center gap-2 xs:gap-3 w-full xs:w-auto">
            <label className="text-xs xs:text-sm text-gray-700 font-medium whitespace-nowrap">Sort by:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="flex-1 xs:flex-none px-2 xs:px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-xs xs:text-sm"
            >
              <option value="match">Best Match</option>
              <option value="date">Most Recent</option>
              <option value="company">Company (A-Z)</option>
              <option value="title">Job Title (A-Z)</option>
            </select>
          </div>
        </div>
      )}

      {/* Results */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
          <p className="mt-4 text-gray-600">Finding the best jobs for you...</p>
        </div>
      ) : jobs.length > 0 ? (
        <div className="space-y-4 max-w-full overflow-hidden">
          {getSortedJobs().map((job) => (
            <div
              key={job.id}
              className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6"
            >
              <div className="flex flex-col xs:flex-row items-start justify-between gap-3 mb-3 overflow-hidden">
                <div className="flex-1 min-w-0 max-w-full">
                  <h3 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 mb-1 break-words overflow-wrap-anywhere">
                    {job.normalized_title || job.title}
                  </h3>
                  <p className="text-sm sm:text-base text-gray-600 truncate overflow-hidden text-ellipsis">{job.company_name}</p>
                </div>
                
                {job.match_percentage !== undefined && (
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="text-center xs:text-right">
                      <div className="text-lg sm:text-xl md:text-2xl font-bold text-blue-600">
                        {job.match_percentage}%
                      </div>
                      <div className="text-[10px] xs:text-xs text-gray-500">match</div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 mb-3 flex-wrap">
                {job.seniority && (
                  <span className="px-2 py-1 bg-gray-100 rounded whitespace-nowrap">
                    {job.seniority}
                  </span>
                )}
                <span className="px-2 py-1 bg-green-100 text-green-800 rounded whitespace-nowrap">
                  {job.remote_type}
                </span>
                {job.source_name && (
                  <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-[10px] xs:text-xs font-medium whitespace-nowrap">
                    via {job.source_name}
                  </span>
                )}
                {(job.is_saved || job.is_tracked) && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-[10px] xs:text-xs font-semibold whitespace-nowrap">
                    ✓ Saved
                  </span>
                )}
                {job.locations && job.locations.length > 0 && (
                  <span className="whitespace-nowrap">📍 {job.locations.slice(0, 2).join(', ')}</span>
                )}
                {job.posted_at && (
                  <span className="text-[10px] xs:text-xs text-gray-500 whitespace-nowrap">
                    🕐 Posted {getTimeAgo(job.posted_at)}
                  </span>
                )}
              </div>

              <p className="text-gray-700 mb-4 line-clamp-3 break-words text-sm md:text-base">
                {job.description_text}
              </p>

              {job.skills_json && job.skills_json.length > 0 && (
                <div className="flex flex-wrap gap-1.5 md:gap-2 mb-4 max-w-full overflow-hidden">
                  {job.skills_json.slice(0, 8).map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded whitespace-nowrap shrink-0"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              )}

              {/* Match Reasons */}
              {job.match_reasons && job.match_reasons.length > 0 && (
                <div className="mb-4">
                  <button
                    onClick={() => setExpandedJob(expandedJob === job.id ? null : job.id)}
                    className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    {expandedJob === job.id ? '▼' : '▶'} Why this job?
                  </button>
                  
                  {expandedJob === job.id && (
                    <div className="mt-3 pl-4 border-l-2 border-blue-200 space-y-2">
                      {job.match_reasons.slice(0, 3).map((reason, idx) => (
                        <div key={idx} className="text-sm">
                          <span className="font-medium text-gray-700">
                            {reason.factor.replace(/_/g, ' ')}:
                          </span>{' '}
                          <span className="text-gray-600">{reason.description}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-2 xs:gap-4">
                <a
                  href={job.apply_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-xs xs:text-sm text-center font-medium"
                >
                  Apply Now
                </a>
                
                <button
                  onClick={() => trackJob(job)}
                  disabled={job.is_tracked || trackingJob === job.id}
                  className={`px-4 py-2 rounded-lg text-xs xs:text-sm font-medium ${
                    job.is_tracked
                      ? 'bg-green-100 text-green-800 cursor-default'
                      : 'border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {job.is_tracked ? '✓ Saved' : trackingJob === job.id ? 'Saving...' : 'Save'}
                </button>
                
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-600">
            {mode === 'personalized'
              ? 'Click "Discover Jobs" to see personalized recommendations'
              : 'Enter a search query to find jobs'}
          </p>
        </div>
      )}
      
      {/* Custom Modal */}
      <Modal
        isOpen={modal.isOpen}
        onClose={() => setModal({ ...modal, isOpen: false })}
        title={modal.title}
        variant={modal.variant}
        icon={modal.icon}
        footer={
          <button
            onClick={() => setModal({ ...modal, isOpen: false })}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            Got it
          </button>
        }
      >
        <p>{modal.message}</p>
      </Modal>
      
    </div>
  );
}
