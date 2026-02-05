'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  SignInButton,
  useUser,
} from '@clerk/nextjs';
import { supabase } from '@/lib/supabase';
import {
  Loader2,
  FileText,
  Clock,
  ExternalLink,
  X,
  Sparkles,
  Kanban,
  Download,
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

type PreviewModal = {
  type: 'resume' | 'cover-letter';
  id: string;
} | null;

export default function MyJobsPage() {
  const { user, isLoaded } = useUser();

  const [jobs, setJobs] = useState<TrackedJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedJob, setSelectedJob] = useState<TrackedJob | null>(null);
  const [previewModal, setPreviewModal] = useState<PreviewModal>(null);

  const statuses: Array<{ id: TrackedJob['status']; label: string; color: string }> = [
    { id: 'saved', label: 'Saved', color: 'bg-blue-500/10 text-blue-600 border-blue-200' },
    { id: 'applied', label: 'Applied', color: 'bg-purple-500/10 text-purple-600 border-purple-200' },
    { id: 'interview', label: 'Interview', color: 'bg-yellow-500/10 text-yellow-600 border-yellow-200' },
    { id: 'offer', label: 'Offer', color: 'bg-green-500/10 text-green-600 border-green-200' },
    { id: 'rejected', label: 'Rejected', color: 'bg-red-500/10 text-red-600 border-red-200' },
    { id: 'archived', label: 'Archived', color: 'bg-gray-500/10 text-gray-600 border-gray-200' },
  ];

  useEffect(() => {
    if (isLoaded && user) {
      loadJobs();
    }
  }, [isLoaded, user]);

  const loadJobs = async () => {
    try {
      if (!user) {
        setError('Please sign in to view your jobs');
        setLoading(false);
        return;
      }

      // Query tracked_jobs directly using Clerk ID
      const { data, error: fetchError } = await supabase
        .from('tracked_jobs')
        .select('*')
        .eq('clerk_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setJobs(data || []);
    } catch (err) {
      console.error('Error loading jobs:', err);
      setError('Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  const updateJobStatus = async (jobId: string, newStatus: TrackedJob['status']) => {
    try {
      const updateData: any = { 
        status: newStatus,
        updated_at: new Date().toISOString(),
      };
      
      if (newStatus === 'applied' && !jobs.find(j => j.id === jobId)?.applied_date) {
        updateData.applied_date = new Date().toISOString();
      }

      const { error: updateError } = await supabase
        .from('tracked_jobs')
        .update(updateData)
        .eq('id', jobId);

      if (updateError) throw updateError;

      setJobs(jobs.map(j => j.id === jobId ? { ...j, status: newStatus, ...updateData } : j));
      if (selectedJob && selectedJob.id === jobId) {
        setSelectedJob({ ...selectedJob, status: newStatus, ...updateData });
      }
    } catch (err) {
      console.error('Error updating job status:', err);
      alert('Failed to update job status');
    }
  };

  if (!isLoaded || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  const showSignIn = isLoaded && !user;

  if (showSignIn) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <main className="flex flex-1 flex-col items-center justify-center px-6 py-12">
          <div className="w-full max-w-md text-center">
            <div className="mb-6 flex justify-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent/10">
                <Kanban className="h-8 w-8 text-accent" />
              </div>
            </div>
            <h1 className="mb-2 text-2xl font-bold text-foreground">
              My Jobs
            </h1>
            <p className="mb-8 text-muted-foreground">
              Sign in to track your job applications and manage your pipeline.
            </p>
            <SignInButton mode="modal">
              <button className="w-full rounded-lg bg-accent px-6 py-3 font-semibold text-accent-foreground hover:opacity-90 transition-opacity">
                Sign in to continue
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
            <h1 className="text-3xl font-bold text-foreground">My Jobs</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Track your job applications and generated content
            </p>
          </div>

          {error ? (
            <div className="flex flex-1 items-center justify-center">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          ) : jobs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="rounded-full bg-muted/50 p-6 mb-4">
                <Kanban className="h-12 w-12 text-muted-foreground" />
              </div>
              <h2 className="text-xl font-semibold text-foreground mb-2">No jobs tracked yet</h2>
              <p className="text-muted-foreground mb-6 text-center max-w-md">
                Start searching for jobs and save them here to track your applications
              </p>
              <Link
                href="/assistant/job-search"
                className="inline-flex items-center gap-2 rounded-lg bg-accent px-6 py-3 font-medium text-accent-foreground hover:opacity-90 transition-opacity"
              >
                <Sparkles className="h-5 w-5" />
                Find Jobs
              </Link>
            </div>
          ) : (
            <div className="flex gap-4 overflow-x-auto pb-4">
              {statuses.map((status) => {
                const statusJobs = jobs.filter(j => j.status === status.id);
                return (
                  <div key={status.id} className="flex min-w-[300px] flex-1 flex-col max-w-sm">
                    <div className={`mb-3 flex items-center justify-between rounded-lg border px-4 py-3 ${status.color}`}>
                      <span className="font-medium">{status.label}</span>
                      <span className="text-sm font-bold">
                        {statusJobs.length}
                      </span>
                    </div>

                    <div className="flex flex-1 flex-col gap-3 rounded-lg bg-muted/30 p-3 min-h-[200px]">
                      {statusJobs.map((job) => (
                        <div
                          key={job.id}
                          className="flex cursor-pointer flex-col rounded-lg border border-border bg-card p-4 shadow-sm transition-all hover:border-accent/50 hover:shadow-md"
                          onClick={() => setSelectedJob(job)}
                        >
                          <h3 className="font-semibold text-foreground line-clamp-1">{job.title}</h3>
                          <p className="text-sm text-muted-foreground line-clamp-1">{job.company}</p>
                          
                          {(job.tailored_resume_id || job.tailored_cover_letter_id) && (
                            <div className="mt-3 flex gap-1.5 flex-wrap">
                              {job.tailored_resume_id && (
                                <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-medium text-accent">
                                  Resume
                                </span>
                              )}
                              {job.tailored_cover_letter_id && (
                                <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-medium text-accent">
                                  Cover Letter
                                </span>
                              )}
                            </div>
                          )}

                          <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {new Date(job.created_at).toLocaleDateString()}
                          </div>

                          <select
                            value={job.status}
                            onChange={(e) => {
                              e.stopPropagation();
                              updateJobStatus(job.id, e.target.value as TrackedJob['status']);
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="mt-3 rounded border border-border bg-background px-2 py-1.5 text-xs text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                          >
                            {statuses.map(s => (
                              <option key={s.id} value={s.id}>{s.label}</option>
                            ))}
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Job Detail Modal */}
      {selectedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setSelectedJob(null)}>
          <div className="w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-xl border border-border bg-card p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-6 flex items-start justify-between">
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-foreground">{selectedJob.title}</h2>
                <p className="text-lg text-muted-foreground mt-1">{selectedJob.company}</p>
                <p className="text-sm text-muted-foreground mt-1">{selectedJob.location}</p>
              </div>
              <button
                onClick={() => setSelectedJob(null)}
                className="rounded-lg p-2 text-muted hover:bg-muted/50 hover:text-foreground transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-6">
              {selectedJob.salary && (
                <div>
                  <h3 className="mb-2 text-sm font-semibold text-foreground">Salary</h3>
                  <p className="text-sm text-muted-foreground">{selectedJob.salary}</p>
                </div>
              )}

              {selectedJob.job_type && (
                <div>
                  <h3 className="mb-2 text-sm font-semibold text-foreground">Type</h3>
                  <p className="text-sm text-muted-foreground">{selectedJob.job_type}</p>
                </div>
              )}

              {selectedJob.skills && selectedJob.skills.length > 0 && (
                <div>
                  <h3 className="mb-2 text-sm font-semibold text-foreground">Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedJob.skills.map((skill) => (
                      <span key={skill} className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h3 className="mb-2 text-sm font-semibold text-foreground">Description</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">{selectedJob.description}</p>
              </div>

              {(selectedJob.tailored_resume_id || selectedJob.tailored_cover_letter_id) && (
                <div>
                  <h3 className="mb-3 text-sm font-semibold text-foreground">Generated Content</h3>
                  <div className="flex gap-3">
                    {selectedJob.tailored_resume_id && (
                      <button
                        onClick={() => setPreviewModal({ type: 'resume', id: selectedJob.tailored_resume_id! })}
                        className="flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground hover:border-accent hover:bg-accent/5 transition-colors"
                      >
                        <FileText className="h-4 w-4" />
                        Preview Resume
                      </button>
                    )}
                    {selectedJob.tailored_cover_letter_id && (
                      <button
                        onClick={() => setPreviewModal({ type: 'cover-letter', id: selectedJob.tailored_cover_letter_id! })}
                        className="flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground hover:border-accent hover:bg-accent/5 transition-colors"
                      >
                        <FileText className="h-4 w-4" />
                        Preview Cover Letter
                      </button>
                    )}
                  </div>
                </div>
              )}

              {selectedJob.apply_url && selectedJob.apply_url !== '#' && (
                <div className="pt-4 border-t border-border">
                  <a
                    href={selectedJob.apply_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-6 py-3 font-medium text-accent-foreground hover:opacity-90 transition-opacity"
                  >
                    Apply to Job
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewModal && (
        <PreviewModal
          type={previewModal.type}
          id={previewModal.id}
          onClose={() => setPreviewModal(null)}
        />
      )}
    </div>
  );
}

function PreviewModal({ type, id, onClose }: { type: 'resume' | 'cover-letter'; id: string; onClose: () => void }) {
  const [content, setContent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContent();
  }, [id, type]);

  async function fetchContent() {
    setLoading(true);
    try {
      const endpoint = type === 'resume' ? `/api/resume/${id}` : `/api/cover-letter/${id}`;
      const response = await fetch(endpoint);
      const data = await response.json();
      setContent(type === 'resume' ? data.resume : data.cover_letter);
    } catch (error) {
      console.error('Error fetching content:', error);
    } finally {
      setLoading(false);
    }
  }

  const fullPageUrl = type === 'resume' ? `/resume-builder/${id}/preview` : `/cover-letters/${id}`;
  const downloadUrl = type === 'resume' ? `/api/resume/${id}/export` : `/api/cover-letter/${id}/export`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/50" onClick={onClose}>
      <div
        className="h-full w-full max-w-3xl bg-background shadow-xl overflow-y-auto animate-slide-in-right"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card px-6 py-4">
          <h2 className="text-lg font-semibold text-foreground">
            {type === 'resume' ? 'Resume Preview' : 'Cover Letter Preview'}
          </h2>
          <div className="flex items-center gap-2">
            <a
              href={downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-foreground hover:border-accent hover:bg-accent/5 transition-colors"
            >
              <Download className="h-4 w-4" />
              Download
            </a>
            <a
              href={fullPageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-foreground hover:border-accent hover:bg-accent/5 transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
              Open Full View
            </a>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-accent" />
            </div>
          ) : !content ? (
            <div className="text-center py-12 text-muted-foreground">
              Failed to load content
            </div>
          ) : type === 'resume' ? (
            <ResumePreview resume={content} />
          ) : (
            <CoverLetterPreview coverLetter={content} />
          )}
        </div>
      </div>
    </div>
  );
}

function ResumePreview({ resume }: { resume: any }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-border p-8">
      {/* Header */}
      <div className="mb-6 pb-4 border-b-2 border-gray-900">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {resume.full_name || 'Your Name'}
        </h1>
        <div className="flex flex-wrap gap-3 text-sm text-gray-600">
          {resume.email && <span>{resume.email}</span>}
          {resume.phone && <span>• {resume.phone}</span>}
          {resume.location && <span>• {resume.location}</span>}
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-5">
        {resume.sections?.sort((a: any, b: any) => a.sort_order - b.sort_order).map((section: any) => (
          <div key={section.id}>
            <h2 className="text-lg font-bold text-gray-900 mb-2 uppercase tracking-wide border-b border-gray-300 pb-1">
              {section.title || section.section_type}
            </h2>
            <div className="mt-2">
              {section.section_type === 'summary' && (
                <p className="text-gray-700">{section.content.text}</p>
              )}
              {section.section_type === 'experience' && (
                <div className="mb-3">
                  <div className="flex justify-between items-start mb-1">
                    <div>
                      <h3 className="font-semibold text-gray-900">{section.content.position}</h3>
                      <p className="text-gray-700">{section.content.company}</p>
                    </div>
                    <div className="text-right text-sm text-gray-600">
                      {section.content.startDate} — {section.content.endDate || 'Present'}
                    </div>
                  </div>
                  {section.content.bullets && section.content.bullets.length > 0 && (
                    <ul className="list-disc list-outside ml-5 space-y-1">
                      {section.content.bullets.map((bullet: string, i: number) => (
                        <li key={i} className="text-gray-700 text-sm">{bullet}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
              {section.section_type === 'education' && (
                <div className="mb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-gray-900">{section.content.degree}</h3>
                      <p className="text-gray-700">{section.content.institution}</p>
                    </div>
                    <div className="text-sm text-gray-600">{section.content.year}</div>
                  </div>
                </div>
              )}
              {section.section_type === 'skills' && (
                <p className="text-gray-700">{section.content.items?.join(' • ')}</p>
              )}
              {section.section_type === 'projects' && (
                <div className="mb-3">
                  <h3 className="font-semibold text-gray-900">{section.content.name}</h3>
                  {section.content.description && (
                    <p className="text-gray-700 text-sm mt-1">{section.content.description}</p>
                  )}
                  {section.content.bullets && section.content.bullets.length > 0 && (
                    <ul className="list-disc list-outside ml-5 space-y-1 mt-1">
                      {section.content.bullets.map((bullet: string, i: number) => (
                        <li key={i} className="text-gray-700 text-sm">{bullet}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CoverLetterPreview({ coverLetter }: { coverLetter: any }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-border p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {coverLetter.job_title} at {coverLetter.job_company}
        </h2>
      </div>

      <div className="space-y-4 text-gray-700 leading-relaxed">
        {coverLetter.opening_paragraph && (
          <p>{coverLetter.opening_paragraph}</p>
        )}
        
        {coverLetter.body_paragraphs && coverLetter.body_paragraphs.map((paragraph: string, i: number) => (
          <p key={i}>{paragraph}</p>
        ))}
        
        {coverLetter.closing_paragraph && (
          <p>{coverLetter.closing_paragraph}</p>
        )}
      </div>
    </div>
  );
}
