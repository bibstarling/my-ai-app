'use client';

import { useState, useEffect, useMemo, useCallback, memo, useRef } from 'react';
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
  GripVertical,
} from 'lucide-react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { useDroppable, useDraggable } from '@dnd-kit/core';

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
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const autoScrollInterval = useRef<NodeJS.Timeout | null>(null);

  const statuses = useMemo<Array<{ id: TrackedJob['status']; label: string; color: string }>>(
    () => [
      { id: 'saved', label: 'Saved', color: 'bg-blue-500/10 text-blue-600 border-blue-200' },
      { id: 'applied', label: 'Applied', color: 'bg-purple-500/10 text-purple-600 border-purple-200' },
      { id: 'interview', label: 'Interview', color: 'bg-yellow-500/10 text-yellow-600 border-yellow-200' },
      { id: 'offer', label: 'Offer', color: 'bg-green-500/10 text-green-600 border-green-200' },
      { id: 'rejected', label: 'Rejected', color: 'bg-red-500/10 text-red-600 border-red-200' },
      { id: 'archived', label: 'Archived', color: 'bg-gray-500/10 text-gray-600 border-gray-200' },
    ],
    []
  );

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 10,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 100,
        tolerance: 5,
      },
    })
  );

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

  const updateJobStatus = useCallback(async (jobId: string, newStatus: TrackedJob['status']) => {
    try {
      const updateData: any = { 
        status: newStatus,
        updated_at: new Date().toISOString(),
      };
      
      const job = jobs.find(j => j.id === jobId);
      if (newStatus === 'applied' && job && !job.applied_date) {
        updateData.applied_date = new Date().toISOString();
      }

      // Optimistic update
      setJobs(prevJobs => prevJobs.map(j => j.id === jobId ? { ...j, status: newStatus, ...updateData } : j));
      if (selectedJob?.id === jobId) {
        setSelectedJob(prev => prev ? { ...prev, status: newStatus, ...updateData } : null);
      }

      // Database update
      const { error: updateError } = await supabase
        .from('tracked_jobs')
        .update(updateData)
        .eq('id', jobId);

      if (updateError) {
        // Revert on error
        console.error('Error updating job status:', updateError);
        loadJobs();
        alert('Failed to update job status');
      }
    } catch (err) {
      console.error('Error updating job status:', err);
      loadJobs();
      alert('Failed to update job status');
    }
  }, [jobs, selectedJob]);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    setIsDragging(true);
  }, []);

  const handleDragMove = useCallback((event: { delta: { x: number; y: number } }) => {
    if (!scrollContainerRef.current) return;

    const container = scrollContainerRef.current;
    const scrollSpeed = 15;
    const edgeSize = 100;

    // Get mouse position relative to viewport
    const rect = container.getBoundingClientRect();
    const mouseX = event.delta.x;

    // Auto-scroll when near edges
    if (autoScrollInterval.current) {
      clearInterval(autoScrollInterval.current);
      autoScrollInterval.current = null;
    }

    // Check if near left edge
    if (mouseX < edgeSize) {
      autoScrollInterval.current = setInterval(() => {
        if (container.scrollLeft > 0) {
          container.scrollLeft -= scrollSpeed;
        }
      }, 16);
    }
    // Check if near right edge
    else if (mouseX > rect.width - edgeSize) {
      autoScrollInterval.current = setInterval(() => {
        if (container.scrollLeft < container.scrollWidth - container.clientWidth) {
          container.scrollLeft += scrollSpeed;
        }
      }, 16);
    }
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setIsDragging(false);

    if (autoScrollInterval.current) {
      clearInterval(autoScrollInterval.current);
      autoScrollInterval.current = null;
    }

    if (!over) return;

    const jobId = active.id as string;
    const newStatus = over.id as TrackedJob['status'];

    // Check if dropped on a status column
    if (statuses.some(s => s.id === newStatus)) {
      const job = jobs.find(j => j.id === jobId);
      if (job && job.status !== newStatus) {
        updateJobStatus(jobId, newStatus);
      }
    }
  }, [jobs, statuses, updateJobStatus]);

  const handleDragCancel = useCallback(() => {
    setActiveId(null);
    setIsDragging(false);
    
    if (autoScrollInterval.current) {
      clearInterval(autoScrollInterval.current);
      autoScrollInterval.current = null;
    }
  }, []);

  const activeJob = useMemo(() => 
    activeId ? jobs.find(j => j.id === activeId) : null,
    [activeId, jobs]
  );

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
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDragCancel={handleDragCancel}
            >
              <div 
                ref={scrollContainerRef}
                className={`flex gap-4 pb-4 kanban-scroll ${isDragging ? 'dragging overflow-x-hidden cursor-grabbing' : 'overflow-x-auto'}`}
              >
                {statuses.map((status) => {
                  const statusJobs = jobs.filter(j => j.status === status.id);
                  return (
                    <DroppableColumn
                      key={status.id}
                      id={status.id}
                      status={status}
                      jobs={statusJobs}
                      onJobClick={setSelectedJob}
                      onStatusChange={updateJobStatus}
                      statuses={statuses}
                    />
                  );
                })}
              </div>
              <DragOverlay dropAnimation={null}>
                {activeJob ? (
                  <div className="flex flex-col rounded-lg border-2 border-accent bg-card p-4 shadow-2xl w-[268px]">
                    <div className="flex items-start gap-2">
                      <GripVertical className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground line-clamp-1">{activeJob.title}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-1">{activeJob.company}</p>
                      </div>
                    </div>
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
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
              {/* Status Dropdown */}
              <div>
                <h3 className="mb-2 text-sm font-semibold text-foreground">Status</h3>
                <select
                  value={selectedJob.status}
                  onChange={(e) => {
                    updateJobStatus(selectedJob.id, e.target.value as TrackedJob['status']);
                  }}
                  className="w-full rounded border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  {statuses.map(s => (
                    <option key={s.id} value={s.id}>{s.label}</option>
                  ))}
                </select>
              </div>
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

// Droppable Column Component
const DroppableColumn = memo(function DroppableColumn({
  id,
  status,
  jobs,
  onJobClick,
  onStatusChange,
  statuses,
}: {
  id: string;
  status: { id: TrackedJob['status']; label: string; color: string };
  jobs: TrackedJob[];
  onJobClick: (job: TrackedJob) => void;
  onStatusChange: (jobId: string, status: TrackedJob['status']) => void;
  statuses: Array<{ id: TrackedJob['status']; label: string; color: string }>;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div 
      ref={setNodeRef} 
      className={`flex min-w-[300px] flex-1 flex-col max-w-sm transition-colors ${isOver ? 'ring-2 ring-accent ring-offset-2' : ''}`}
    >
      <div className={`mb-3 flex items-center justify-between rounded-lg border px-4 py-3 ${status.color}`}>
        <span className="font-medium">{status.label}</span>
        <span className="text-sm font-bold">{jobs.length}</span>
      </div>

      <div className="flex flex-1 flex-col gap-3 rounded-lg bg-muted/30 p-3 min-h-[200px]">
        {jobs.map((job) => (
          <DraggableJobCard
            key={job.id}
            job={job}
            onClick={onJobClick}
            onStatusChange={onStatusChange}
            statuses={statuses}
          />
        ))}
      </div>
    </div>
  );
});

// Draggable Job Card Component
const DraggableJobCard = memo(function DraggableJobCard({
  job,
  onClick,
  onStatusChange,
  statuses,
}: {
  job: TrackedJob;
  onClick: (job: TrackedJob) => void;
  onStatusChange: (jobId: string, status: TrackedJob['status']) => void;
  statuses: Array<{ id: TrackedJob['status']; label: string; color: string }>;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: job.id,
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    opacity: isDragging ? 0 : 1,
  } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="dnd-item flex cursor-pointer flex-col rounded-lg border border-border bg-card p-4 shadow-sm hover:border-accent/50 hover:shadow-md"
      onClick={() => onClick(job)}
    >
      <div className="flex items-start gap-2">
        <button
          {...listeners}
          {...attributes}
          onClick={(e) => e.stopPropagation()}
          className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground mt-0.5 touch-none"
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground line-clamp-1">{job.title}</h3>
          <p className="text-sm text-muted-foreground line-clamp-1">{job.company}</p>
        </div>
      </div>

      {(job.tailored_resume_id || job.tailored_cover_letter_id) && (
        <div className="mt-3 flex gap-1.5 flex-wrap ml-6">
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

      <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground ml-6">
        <Clock className="h-3 w-3" />
        {new Date(job.created_at).toLocaleDateString()}
      </div>

      <select
        value={job.status}
        onChange={(e) => {
          e.stopPropagation();
          onStatusChange(job.id, e.target.value as TrackedJob['status']);
        }}
        onClick={(e) => e.stopPropagation()}
        className="mt-3 ml-6 rounded border border-border bg-background px-2 py-1.5 text-xs text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
      >
        {statuses.map(s => (
          <option key={s.id} value={s.id}>{s.label}</option>
        ))}
      </select>
    </div>
  );
});

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
