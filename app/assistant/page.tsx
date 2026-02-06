'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  SignInButton,
  useUser,
} from '@clerk/nextjs';
import { useEmbedMode } from '../ClientAuthWrapper';
import { supabase } from '@/lib/supabase';
import {
  Loader2,
  TrendingUp,
  Briefcase,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

type TrackedJob = {
  id: string;
  clerk_id: string;
  title: string;
  company: string;
  location: string;
  job_type: string | null;
  salary: string | null;
  posted_date: string | null;
  description: string;
  apply_url: string;
  skills: string[];
  status: 'saved' | 'applied' | 'interview' | 'offer' | 'rejected' | 'archived';
  tailored_resume_id: string | null;
  tailored_cover_letter_id: string | null;
  notes: string | null;
  applied_date: string | null;
  interview_date: string | null;
  created_at: string;
  updated_at: string;
};

type JobStats = {
  total: number;
  saved: number;
  applied: number;
  interview: number;
  offer: number;
  rejected: number;
};

function AssistantEmbedFallback() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 py-12 bg-background">
      <p className="text-muted-foreground text-center max-w-md">
        Sign-in and the assistant are not available in the embedded preview. Open this page in a new tab to use your personal space.
      </p>
    </main>
  );
}

function AssistantLoadingShell() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-accent" />
    </div>
  );
}

function DashboardContent() {
  let user = null;
  let isLoaded = false;
  
  try {
    const clerkData = useUser();
    user = clerkData.user;
    isLoaded = clerkData.isLoaded;
  } catch (e) {
    isLoaded = true;
  }

  const [jobs, setJobs] = useState<TrackedJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<JobStats>({
    total: 0,
    saved: 0,
    applied: 0,
    interview: 0,
    offer: 0,
    rejected: 0,
  });

  useEffect(() => {
    if (isLoaded) {
      loadJobs();
    }
  }, [isLoaded]);

  const loadJobs = async () => {
    try {
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('tracked_jobs')
        .select('*')
        .eq('clerk_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      const jobsList = data || [];
      setJobs(jobsList);

      // Calculate stats
      const newStats: JobStats = {
        total: jobsList.length,
        saved: jobsList.filter(j => j.status === 'saved').length,
        applied: jobsList.filter(j => j.status === 'applied').length,
        interview: jobsList.filter(j => j.status === 'interview').length,
        offer: jobsList.filter(j => j.status === 'offer').length,
        rejected: jobsList.filter(j => j.status === 'rejected').length,
      };
      setStats(newStats);
    } catch (err) {
      console.error('Error loading jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isLoaded) {
    return <AssistantLoadingShell />;
  }

  const showSignIn = isLoaded && !user;

  if (showSignIn) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <main className="flex flex-1 flex-col items-center justify-center px-6 py-12">
          <div className="w-full max-w-md text-center">
            <div className="mb-6 flex justify-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent/10">
                <Sparkles className="h-8 w-8 text-accent" />
              </div>
            </div>
            <h1 className="mb-2 text-2xl font-bold text-foreground">
              Your Career Hub 🚀
            </h1>
            <p className="mb-8 text-muted-foreground">
              Sign in to track applications, find dream jobs, and celebrate every win!
            </p>
            <SignInButton mode="modal">
              <button className="w-full rounded-lg gradient-primary px-6 py-3 font-bold text-white hover:opacity-90 transition-all shadow-lg button-bounce">
                Let's Get Started! ✨
              </button>
            </SignInButton>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-6 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">Your Dashboard 📊</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Track your progress and celebrate your wins!
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-accent" />
            </div>
          ) : (
            <>
              {/* Stats Grid */}
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
                <div className="rounded-xl border-2 border-border bg-card p-6 hover-lift animate-fade-up transition-all">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Jobs 🎯</p>
                      <p className="text-3xl font-bold text-foreground mt-2">{stats.total}</p>
                    </div>
                    <div className="rounded-full bg-ocean-blue/10 p-3">
                      <Briefcase className="h-6 w-6 text-ocean-blue" />
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border-2 border-border bg-card p-6 hover-lift animate-fade-up animate-delay-100 transition-all">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Applied ✨</p>
                      <p className="text-3xl font-bold text-foreground mt-2">{stats.applied}</p>
                    </div>
                    <div className="rounded-full bg-applause-orange/10 p-3">
                      <CheckCircle className="h-6 w-6 text-applause-orange" />
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border-2 border-border bg-card p-6 hover-lift animate-fade-up animate-delay-200 transition-all">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Interviews 🎤</p>
                      <p className="text-3xl font-bold text-foreground mt-2">{stats.interview}</p>
                    </div>
                    <div className="rounded-full bg-sunshine-yellow/10 p-3">
                      <Clock className="h-6 w-6 text-yellow-600" />
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-card p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Offers</p>
                      <p className="text-3xl font-bold text-foreground mt-2">{stats.offer}</p>
                    </div>
                    <div className="rounded-full bg-green-500/10 p-3">
                      <TrendingUp className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
                <Link
                  href="/assistant/job-search"
                  className="group rounded-xl border border-border bg-card p-6 hover:border-accent/50 hover:shadow-md transition-all"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="rounded-full bg-accent/10 p-3">
                      <Briefcase className="h-6 w-6 text-accent" />
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-accent transition-colors" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">Find Jobs</h3>
                  <p className="text-sm text-muted-foreground">
                    Search for jobs matching your skills and preferences
                  </p>
                </Link>

                <Link
                  href="/assistant/my-jobs"
                  className="group rounded-xl border border-border bg-card p-6 hover:border-accent/50 hover:shadow-md transition-all"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="rounded-full bg-amber/10 p-3">
                      <FileText className="h-6 w-6 text-accent" />
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-accent transition-colors" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">My Jobs</h3>
                  <p className="text-sm text-muted-foreground">
                    Track your applications and manage your job pipeline
                  </p>
                </Link>

                <Link
                  href="/assistant/chat"
                  className="group rounded-xl border border-border bg-card p-6 hover:border-accent/50 hover:shadow-md transition-all"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="rounded-full bg-blue-500/10 p-3">
                      <Sparkles className="h-6 w-6 text-blue-600" />
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-accent transition-colors" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">AI Assistant</h3>
                  <p className="text-sm text-muted-foreground">
                    Get help with cover letters, interview prep, and more
                  </p>
                </Link>
              </div>

              {/* Recent Jobs */}
              <div className="rounded-xl border border-border bg-card p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-foreground">Recent Applications</h2>
                  <Link
                    href="/assistant/my-jobs"
                    className="text-sm text-accent hover:underline"
                  >
                    View all
                  </Link>
                </div>

                {jobs.length === 0 ? (
                  <div className="text-center py-12">
                    <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-4">No jobs tracked yet</p>
                    <Link
                      href="/assistant/job-search"
                      className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:opacity-90 transition-opacity"
                    >
                      Start searching
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {jobs.slice(0, 5).map((job) => (
                      <div
                        key={job.id}
                        className="flex items-center justify-between p-4 rounded-lg border border-border bg-background hover:border-accent/50 transition-colors"
                      >
                        <div className="flex-1">
                          <h3 className="font-medium text-foreground">{job.title}</h3>
                          <p className="text-sm text-muted-foreground">{job.company}</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                            job.status === 'offer' ? 'bg-green-100 text-green-800' :
                            job.status === 'interview' ? 'bg-yellow-100 text-yellow-800' :
                            job.status === 'applied' ? 'bg-orange-100 text-orange-800' :
                            job.status === 'saved' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {job.status}
                          </span>
                          <Link
                            href={`/assistant/my-jobs`}
                            className="text-accent hover:text-accent/80"
                          >
                            <ArrowRight className="h-4 w-4" />
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default function AssistantPage() {
  const [mounted, setMounted] = useState(false);
  const embedMode = useEmbedMode();
  useEffect(() => setMounted(true), []);
  if (!mounted) return <AssistantLoadingShell />;
  if (embedMode) return <AssistantEmbedFallback />;
  return <DashboardContent />;
}
