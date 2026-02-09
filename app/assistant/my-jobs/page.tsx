'use client';

import { useState, useEffect, useMemo, useCallback, memo, useRef } from 'react';
import Link from 'next/link';
import {
  SignInButton,
  useUser,
} from '@clerk/nextjs';
import { supabase } from '@/lib/supabase';
import { HelpButton } from '@/app/components/HelpButton';
import { PageTour } from '@/app/components/PageTour';
import { getPageTour } from '@/lib/page-tours';
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
  Plus,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  AlertCircle,
  MessageSquare,
  Trash2,
  Save,
  Wand2,
} from 'lucide-react';
import { pdf } from '@react-pdf/renderer';
import { ResumePDF } from './ResumePDF';
import { CoverLetterPDF } from './CoverLetterPDF';
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
  match_percentage: number | null;
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

type ApplicationQuestion = {
  id: string;
  tracked_job_id: string;
  clerk_id: string;
  question_text: string;
  answer_text: string | null;
  is_ai_generated: boolean;
  order_index: number;
  created_at: string;
  updated_at: string;
};

export default function MyJobsPage() {
  const { user, isLoaded } = useUser();

  const [jobs, setJobs] = useState<TrackedJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedJob, setSelectedJob] = useState<TrackedJob | null>(null);
  const [previewModal, setPreviewModal] = useState<PreviewModal>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showPageTour, setShowPageTour] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  const pageTour = getPageTour('my-jobs');
  const autoScrollInterval = useRef<NodeJS.Timeout | null>(null);
  const [showAddJobModal, setShowAddJobModal] = useState(false);
  const [addingJob, setAddingJob] = useState(false);
  const [tailoringJob, setTailoringJob] = useState<string | null>(null);
  const [tailorOptions, setTailorOptions] = useState<{
    jobId: string;
    generateResume: boolean;
    generateCoverLetter: boolean;
  } | null>(null);
  const [calculatingMatch, setCalculatingMatch] = useState<string | null>(null);
  const [matchDetails, setMatchDetails] = useState<{
    jobId: string;
    reasoning: string;
    strengths: string[];
    gaps: string[];
    ats_keywords_matched: string[];
    ats_keywords_missing: string[];
  } | null>(null);
  const [showMatchDetails, setShowMatchDetails] = useState(false);
  const [questions, setQuestions] = useState<ApplicationQuestion[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [generatingAnswer, setGeneratingAnswer] = useState<string | null>(null);
  const [showAddQuestion, setShowAddQuestion] = useState(false);
  const [newQuestionText, setNewQuestionText] = useState('');

  const statuses = useMemo<Array<{ id: TrackedJob['status']; label: string; color: string }>>(
    () => [
      { id: 'saved', label: 'Saved', color: 'bg-blue-500/10 text-blue-600 border-blue-200' },
      { id: 'applied', label: 'Applied', color: 'bg-accent/10 text-accent border-accent/20' },
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

  useEffect(() => {
    if (selectedJob) {
      loadQuestions(selectedJob.id);
    } else {
      setQuestions([]);
    }
  }, [selectedJob?.id]);

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

  const handleAddJob = async (jobData: {
    title: string;
    company: string;
    location: string;
    apply_url: string;
    description: string;
    job_type?: string;
    salary?: string;
  }) => {
    try {
      if (!user) {
        alert('Please sign in to add jobs');
        return;
      }

      setAddingJob(true);

      // ALWAYS fetch complete job details from the apply URL if available
      let finalDescription = jobData.description;
      let finalJobType = jobData.job_type;
      let finalSalary = jobData.salary;

      if (jobData.apply_url && jobData.apply_url !== '#') {
        try {
          const fetchResponse = await fetch('/api/jobs/extract', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ url: jobData.apply_url }),
          });

          if (fetchResponse.ok) {
            const fetchData = await fetchResponse.json();
            if (fetchData.success && fetchData.job) {
              // Use fetched description if it's more complete
              if (fetchData.job.description && fetchData.job.description.length > finalDescription.length) {
                finalDescription = fetchData.job.description;
              }
              // Fill in missing data
              if (!finalJobType && fetchData.job.job_type) {
                finalJobType = fetchData.job.job_type;
              }
              if (!finalSalary && fetchData.job.salary) {
                finalSalary = fetchData.job.salary;
              }
            }
          }
        } catch (fetchErr) {
          console.warn('Could not fetch additional job details, using provided description:', fetchErr);
          // Continue with provided description if fetch fails
        }
      }

      const { data, error: insertError } = await supabase
        .from('tracked_jobs')
        .insert({
          clerk_id: user.id,
          title: jobData.title,
          company: jobData.company,
          location: jobData.location,
          job_type: finalJobType || null,
          salary: finalSalary || null,
          description: finalDescription,
          apply_url: jobData.apply_url,
          skills: [],
          status: 'saved',
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Reload jobs to show the new one
      await loadJobs();
      setShowAddJobModal(false);
      alert('Job added successfully!');
    } catch (err) {
      console.error('Error adding job:', err);
      alert('Failed to add job. Please try again.');
    } finally {
      setAddingJob(false);
    }
  };

  const handleCalculateMatch = async (jobId: string) => {
    try {
      setCalculatingMatch(jobId);
      
      const job = jobs.find((j) => j.id === jobId);
      if (!job) {
        throw new Error('Job not found');
      }
      
      if (!job.tailored_resume_id && !job.tailored_cover_letter_id) {
        alert('Please generate tailored content first before calculating match');
        setCalculatingMatch(null);
        return;
      }

      console.log('Calculating match for job:', jobId);
      const matchResponse = await fetch('/api/jobs/calculate-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ jobId }),
      });

      console.log('Manual match calculation response status:', matchResponse.status);

      if (!matchResponse.ok) {
        const contentType = matchResponse.headers.get('content-type');
        console.log('Error response content-type:', contentType);
        
        try {
          const errorData = await matchResponse.json();
          console.error('Match calculation API error:', errorData);
          throw new Error(errorData.error || errorData.details || 'Failed to calculate match');
        } catch (parseErr) {
          const textError = await matchResponse.text();
          console.error('Match calculation failed (non-JSON):', textError);
          throw new Error(`Failed to calculate match: ${matchResponse.statusText}`);
        }
      }

      const matchData = await matchResponse.json();
      console.log(`Match calculated: ${matchData.percentage}%`, matchData);

      // Store match details for the expandable section
      setMatchDetails({
        jobId,
        reasoning: matchData.reasoning || '',
        strengths: matchData.strengths || [],
        gaps: matchData.gaps || [],
        ats_keywords_matched: matchData.ats_keywords_matched || [],
        ats_keywords_missing: matchData.ats_keywords_missing || [],
      });

      // Small delay to ensure database has been updated
      await new Promise(resolve => setTimeout(resolve, 500));

      // Reload jobs to show the match
      await loadJobs();
      
      // Update selected job if it's open
      if (selectedJob?.id === jobId) {
        // Find the updated job from the reloaded list
        const updatedJobs = await supabase
          .from('tracked_jobs')
          .select('*')
          .eq('id', jobId)
          .single();
        
        if (updatedJobs.data) {
          setSelectedJob(updatedJobs.data as TrackedJob);
        }
      }

      alert(`Match calculated: ${matchData.percentage}% - ${getMatchLabel(matchData.percentage)}`);
    } catch (err) {
      console.error('Error calculating match:', err);
      alert(`Failed to calculate match: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setCalculatingMatch(null);
    }
  };

  const loadQuestions = async (jobId: string) => {
    try {
      setLoadingQuestions(true);
      const response = await fetch(`/api/jobs/${jobId}/questions`, { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setQuestions(data.questions || []);
      }
    } catch (error) {
      console.error('Error loading questions:', error);
    } finally {
      setLoadingQuestions(false);
    }
  };

  const handleAutoDetectQuestions = async () => {
    if (!selectedJob) return;
    
    try {
      setLoadingQuestions(true);
      const response = await fetch(`/api/jobs/${selectedJob.id}/questions/extract`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ url: selectedJob.apply_url }),
      });

      if (response.ok) {
        const data = await response.json();
        setQuestions(data.questions || []);
        if (data.questions && data.questions.length > 0) {
          alert(`Found ${data.questions.length} application question(s)`);
        } else {
          alert('No application questions found in the job posting');
        }
      } else {
        const error = await response.json();
        alert(`Failed to detect questions: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error auto-detecting questions:', error);
      alert('Failed to detect questions');
    } finally {
      setLoadingQuestions(false);
    }
  };

  const handleAddQuestion = async () => {
    if (!selectedJob || !newQuestionText.trim()) return;
    
    try {
      const response = await fetch(`/api/jobs/${selectedJob.id}/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ question_text: newQuestionText.trim() }),
      });

      if (response.ok) {
        const data = await response.json();
        setQuestions([...questions, data.question]);
        setNewQuestionText('');
        setShowAddQuestion(false);
      } else {
        const error = await response.json();
        alert(`Failed to add question: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error adding question:', error);
      alert('Failed to add question');
    }
  };

  const handleGenerateAnswer = async (questionId: string) => {
    if (!selectedJob) return;
    
    try {
      setGeneratingAnswer(questionId);
      const response = await fetch(`/api/jobs/${selectedJob.id}/questions/${questionId}/generate-answer`, {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setQuestions(questions.map(q => 
          q.id === questionId ? data.question : q
        ));
      } else {
        const error = await response.json();
        alert(`Failed to generate answer: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error generating answer:', error);
      alert('Failed to generate answer');
    } finally {
      setGeneratingAnswer(null);
    }
  };

  const handleSaveAnswer = async (questionId: string, answerText: string) => {
    if (!selectedJob) return;
    
    try {
      const response = await fetch(`/api/jobs/${selectedJob.id}/questions/${questionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ answer_text: answerText }),
      });

      if (response.ok) {
        const data = await response.json();
        setQuestions(questions.map(q => 
          q.id === questionId ? data.question : q
        ));
      } else {
        const error = await response.json();
        alert(`Failed to save answer: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error saving answer:', error);
      alert('Failed to save answer');
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!selectedJob) return;
    if (!confirm('Are you sure you want to delete this question?')) return;
    
    try {
      const response = await fetch(`/api/jobs/${selectedJob.id}/questions/${questionId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        setQuestions(questions.filter(q => q.id !== questionId));
      } else {
        const error = await response.json();
        alert(`Failed to delete question: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error deleting question:', error);
      alert('Failed to delete question');
    }
  };

  const handleGenerateTailoredContent = async (
    jobId: string,
    generateResume: boolean,
    generateCoverLetter: boolean
  ) => {
    try {
      if (!user) {
        alert('Please sign in to generate content');
        return;
      }

      setTailoringJob(jobId);

      const job = jobs.find((j) => j.id === jobId);
      if (!job) throw new Error('Job not found');

      let resumeId = job.tailored_resume_id;
      let coverLetterId = job.tailored_cover_letter_id;

      if (generateResume && !resumeId) {
        const resumeRes = await fetch('/api/jobs/tailor-resume', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            jobDescription: job.description,
            jobTitle: job.title,
            company: job.company,
          }),
        });

        if (resumeRes.ok) {
          const resumeData = await resumeRes.json();
          resumeId = resumeData.resumeId;
        } else {
          throw new Error('Failed to generate resume');
        }
      }

      if (generateCoverLetter && !coverLetterId) {
        const clRes = await fetch('/api/jobs/tailor-cover-letter', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            jobDescription: job.description,
            jobTitle: job.title,
            company: job.company,
          }),
        });

        if (clRes.ok) {
          const clData = await clRes.json();
          coverLetterId = clData.coverLetterId;
        } else {
          throw new Error('Failed to generate cover letter');
        }
      }

      // Update the job with the new content IDs
      const updateData: any = {};
      if (resumeId) updateData.tailored_resume_id = resumeId;
      if (coverLetterId) updateData.tailored_cover_letter_id = coverLetterId;

      if (Object.keys(updateData).length > 0) {
        const { error: updateError } = await supabase
          .from('tracked_jobs')
          .update(updateData)
          .eq('id', jobId);

        if (updateError) throw updateError;
      }

      // Calculate match percentage after generating content
      let matchCalculated = false;
      try {
        console.log('Starting match calculation for job:', jobId);
        const matchResponse = await fetch('/api/jobs/calculate-match', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ jobId }),
        });

        console.log('Match calculation response status:', matchResponse.status);

        if (matchResponse.ok) {
          const matchData = await matchResponse.json();
          console.log(`Match percentage calculated: ${matchData.percentage}%`, matchData);
          
          // Store match details for display
          setMatchDetails({
            jobId,
            reasoning: matchData.reasoning || '',
            strengths: matchData.strengths || [],
            gaps: matchData.gaps || [],
            ats_keywords_matched: matchData.ats_keywords_matched || [],
            ats_keywords_missing: matchData.ats_keywords_missing || [],
          });
          
          matchCalculated = true;
        } else {
          // Try to parse error response
          const contentType = matchResponse.headers.get('content-type');
          console.log('Error response content-type:', contentType);
          
          try {
            const errorData = await matchResponse.json();
            console.error('Match calculation failed:', {
              status: matchResponse.status,
              statusText: matchResponse.statusText,
              error: errorData,
            });
          } catch (parseErr) {
            const textError = await matchResponse.text();
            console.error('Match calculation failed (non-JSON):', {
              status: matchResponse.status,
              statusText: matchResponse.statusText,
              body: textError,
            });
          }
        }
      } catch (matchErr) {
        console.error('Error calculating match percentage:', {
          error: matchErr,
          message: matchErr instanceof Error ? matchErr.message : String(matchErr),
          stack: matchErr instanceof Error ? matchErr.stack : undefined,
        });
      }

      // Small delay to ensure database has been updated
      await new Promise(resolve => setTimeout(resolve, 500));

      // Reload jobs to show updated content (with match percentage if calculated)
      await loadJobs();
      
      // Update selected job if it's open
      if (selectedJob?.id === jobId) {
        const { data: updatedJob } = await supabase
          .from('tracked_jobs')
          .select('*')
          .eq('id', jobId)
          .single();
        
        if (updatedJob) {
          setSelectedJob(updatedJob as TrackedJob);
        }
      }
      
      setTailorOptions(null);
      
      const message = matchCalculated 
        ? 'Tailored content generated and match calculated successfully!'
        : 'Tailored content generated! (Match calculation pending - try the Calculate Match button)';
      alert(message);
    } catch (err) {
      console.error('Error generating tailored content:', err);
      alert('Failed to generate tailored content. Please try again.');
    } finally {
      setTailoringJob(null);
    }
  };

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

  const getMatchColor = (percentage: number | null) => {
    if (!percentage) return 'bg-gray-100 text-gray-600 border-gray-200';
    if (percentage >= 80) return 'bg-green-100 text-green-700 border-green-300';
    if (percentage >= 65) return 'bg-blue-100 text-blue-700 border-blue-300';
    if (percentage >= 50) return 'bg-yellow-100 text-yellow-700 border-yellow-300';
    return 'bg-orange-100 text-orange-700 border-orange-300';
  };

  const getMatchLabel = (percentage: number | null) => {
    if (!percentage) return 'Not calculated';
    if (percentage >= 80) return 'Strong Match';
    if (percentage >= 65) return 'Good Match';
    if (percentage >= 50) return 'Moderate Match';
    return 'Weak Match';
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
          <div className="mb-8 flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">My Jobs</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Track your job applications and generated content
              </p>
            </div>
            <button
              onClick={() => setShowAddJobModal(true)}
              className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground hover:opacity-90 transition-opacity"
            >
              <Plus className="h-4 w-4" />
              Add Job Manually
            </button>
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
                      getMatchColor={getMatchColor}
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
          <div className="w-full max-w-2xl max-h-[85vh] flex flex-col rounded-xl border border-border bg-card shadow-xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            {/* Sticky Header with Actions */}
            <div className="sticky top-0 z-10 bg-card border-b border-border p-6">
              <div className="flex items-start justify-between mb-4">
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

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2">
                {selectedJob.tailored_resume_id && (
                  <button
                    onClick={() => setPreviewModal({ type: 'resume', id: selectedJob.tailored_resume_id! })}
                    className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-foreground hover:border-accent hover:bg-accent/5 transition-colors"
                  >
                    <FileText className="h-4 w-4" />
                    Resume
                  </button>
                )}
                {selectedJob.tailored_cover_letter_id && (
                  <button
                    onClick={() => setPreviewModal({ type: 'cover-letter', id: selectedJob.tailored_cover_letter_id! })}
                    className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-foreground hover:border-accent hover:bg-accent/5 transition-colors"
                  >
                    <FileText className="h-4 w-4" />
                    Cover Letter
                  </button>
                )}
                {(!selectedJob.tailored_resume_id || !selectedJob.tailored_cover_letter_id) && (
                  <button
                    onClick={() => setTailorOptions({
                      jobId: selectedJob.id,
                      generateResume: !selectedJob.tailored_resume_id,
                      generateCoverLetter: !selectedJob.tailored_cover_letter_id,
                    })}
                    disabled={tailoringJob === selectedJob.id}
                    className="flex items-center gap-2 rounded-lg bg-accent px-3 py-2 text-sm font-medium text-accent-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {tailoringJob === selectedJob.id ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        Generate {!selectedJob.tailored_resume_id && !selectedJob.tailored_cover_letter_id
                          ? 'Content'
                          : !selectedJob.tailored_resume_id
                          ? 'Resume'
                          : 'Cover Letter'}
                      </>
                    )}
                  </button>
                )}
                {(selectedJob.tailored_resume_id || selectedJob.tailored_cover_letter_id) && (
                  <button
                    onClick={() => handleCalculateMatch(selectedJob.id)}
                    disabled={calculatingMatch === selectedJob.id}
                    className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-foreground hover:border-accent hover:bg-accent/5 transition-colors disabled:opacity-50"
                  >
                    {calculatingMatch === selectedJob.id ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Calculating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        {selectedJob.match_percentage !== null ? 'Recalculate' : 'Calculate'} Match
                      </>
                    )}
                  </button>
                )}
                {selectedJob.apply_url && selectedJob.apply_url !== '#' && (
                  <a
                    href={selectedJob.apply_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-lg bg-accent px-3 py-2 text-sm font-medium text-accent-foreground hover:opacity-90 transition-opacity ml-auto"
                  >
                    Apply
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="overflow-y-auto p-6 space-y-6">
              {/* Match Percentage with Expandable Details */}
              {selectedJob.match_percentage !== null && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold text-foreground">Job Match</h3>
                    {matchDetails?.jobId === selectedJob.id && (
                      <button
                        onClick={() => setShowMatchDetails(!showMatchDetails)}
                        className="flex items-center gap-1 text-xs text-muted hover:text-foreground transition-colors"
                      >
                        {showMatchDetails ? (
                          <>
                            <ChevronUp className="h-4 w-4" />
                            Hide Details
                          </>
                        ) : (
                          <>
                            <ChevronDown className="h-4 w-4" />
                            Show Details
                          </>
                        )}
                      </button>
                    )}
                  </div>
                  <div className={`rounded-lg border px-4 py-3 ${getMatchColor(selectedJob.match_percentage)}`}>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl leading-none">✓</span>
                      <div>
                        <div className="text-lg font-bold">{selectedJob.match_percentage}%</div>
                        <div className="text-xs opacity-80">{getMatchLabel(selectedJob.match_percentage)}</div>
                      </div>
                    </div>

                    {/* Expandable Match Details */}
                    {showMatchDetails && matchDetails?.jobId === selectedJob.id && (
                      <div className="mt-4 pt-4 border-t border-current/20 space-y-4">
                        {/* Reasoning */}
                        {matchDetails.reasoning && (
                          <div>
                            <h4 className="text-xs font-semibold mb-1 opacity-90">ATS Analysis</h4>
                            <p className="text-xs opacity-80 leading-relaxed">{matchDetails.reasoning}</p>
                          </div>
                        )}

                        {/* Strengths */}
                        {matchDetails.strengths.length > 0 && (
                          <div>
                            <h4 className="text-xs font-semibold mb-2 opacity-90 flex items-center gap-1">
                              <CheckCircle className="h-3 w-3" />
                              Strengths
                            </h4>
                            <ul className="space-y-1">
                              {matchDetails.strengths.map((strength, idx) => (
                                <li key={idx} className="text-xs opacity-80 flex items-start gap-2">
                                  <span className="mt-0.5">•</span>
                                  <span>{strength}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Gaps */}
                        {matchDetails.gaps.length > 0 && (
                          <div>
                            <h4 className="text-xs font-semibold mb-2 opacity-90 flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              Areas to Improve
                            </h4>
                            <ul className="space-y-1">
                              {matchDetails.gaps.map((gap, idx) => (
                                <li key={idx} className="text-xs opacity-80 flex items-start gap-2">
                                  <span className="mt-0.5">•</span>
                                  <span>{gap}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Keywords Matched */}
                        {matchDetails.ats_keywords_matched.length > 0 && (
                          <div>
                            <h4 className="text-xs font-semibold mb-2 opacity-90">Matched Keywords ({matchDetails.ats_keywords_matched.length})</h4>
                            <div className="flex flex-wrap gap-1">
                              {matchDetails.ats_keywords_matched.slice(0, 10).map((keyword, idx) => (
                                <span key={idx} className="text-xs bg-current/10 px-2 py-0.5 rounded">
                                  {keyword}
                                </span>
                              ))}
                              {matchDetails.ats_keywords_matched.length > 10 && (
                                <span className="text-xs opacity-70 px-2 py-0.5">
                                  +{matchDetails.ats_keywords_matched.length - 10} more
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Missing Keywords */}
                        {matchDetails.ats_keywords_missing.length > 0 && (
                          <div>
                            <h4 className="text-xs font-semibold mb-2 opacity-90">Missing Keywords</h4>
                            <div className="flex flex-wrap gap-1">
                              {matchDetails.ats_keywords_missing.map((keyword, idx) => (
                                <span key={idx} className="text-xs bg-current/10 px-2 py-0.5 rounded">
                                  {keyword}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

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

              {/* Application Questions */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-foreground">Application Questions</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={handleAutoDetectQuestions}
                      disabled={loadingQuestions}
                      className="flex items-center gap-1 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:border-accent hover:bg-accent/5 transition-colors disabled:opacity-50"
                    >
                      {loadingQuestions ? (
                        <>
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Detecting...
                        </>
                      ) : (
                        <>
                          <Wand2 className="h-3 w-3" />
                          Auto-Detect
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => setShowAddQuestion(true)}
                      className="flex items-center gap-1 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:border-accent hover:bg-accent/5 transition-colors"
                    >
                      <Plus className="h-3 w-3" />
                      Add Question
                    </button>
                  </div>
                </div>

                {/* Add Question Form */}
                {showAddQuestion && (
                  <div className="mb-3 rounded-lg border border-border bg-muted/30 p-3">
                    <textarea
                      value={newQuestionText}
                      onChange={(e) => setNewQuestionText(e.target.value)}
                      placeholder="Enter the application question..."
                      className="w-full rounded border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent resize-none"
                      rows={2}
                    />
                    <div className="mt-2 flex gap-2">
                      <button
                        onClick={handleAddQuestion}
                        disabled={!newQuestionText.trim()}
                        className="flex items-center gap-1 rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
                      >
                        <Save className="h-3 w-3" />
                        Add
                      </button>
                      <button
                        onClick={() => {
                          setShowAddQuestion(false);
                          setNewQuestionText('');
                        }}
                        className="flex items-center gap-1 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Questions List */}
                {questions.length === 0 && !loadingQuestions ? (
                  <p className="text-xs text-muted-foreground italic">No questions yet. Use auto-detect or add manually.</p>
                ) : (
                  <div className="space-y-3">
                    {questions.map((question) => (
                      <div key={question.id} className="rounded-lg border border-border bg-background p-3">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <MessageSquare className="h-3 w-3 text-muted-foreground" />
                              <p className="text-xs font-medium text-foreground">{question.question_text}</p>
                            </div>
                            {question.is_ai_generated && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2 py-0.5 text-xs text-purple-700">
                                <Sparkles className="h-2 w-2" />
                                AI Generated
                              </span>
                            )}
                          </div>
                          <button
                            onClick={() => handleDeleteQuestion(question.id)}
                            className="text-muted-foreground hover:text-red-600 transition-colors"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                        
                        <textarea
                          value={question.answer_text || ''}
                          onChange={(e) => {
                            const newAnswer = e.target.value;
                            setQuestions(questions.map(q => 
                              q.id === question.id ? { ...q, answer_text: newAnswer } : q
                            ));
                          }}
                          placeholder="Answer will appear here..."
                          className="w-full rounded border border-border bg-muted/30 px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent resize-none"
                          rows={4}
                        />
                        
                        <div className="mt-2 flex gap-2">
                          <button
                            onClick={() => handleGenerateAnswer(question.id)}
                            disabled={generatingAnswer === question.id}
                            className="flex items-center gap-1 rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
                          >
                            {generatingAnswer === question.id ? (
                              <>
                                <Loader2 className="h-3 w-3 animate-spin" />
                                Generating...
                              </>
                            ) : (
                              <>
                                <Sparkles className="h-3 w-3" />
                                Generate Answer
                              </>
                            )}
                          </button>
                          {question.answer_text && question.answer_text !== (questions.find(q => q.id === question.id)?.answer_text || '') && (
                            <button
                              onClick={() => handleSaveAnswer(question.id, question.answer_text || '')}
                              className="flex items-center gap-1 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors"
                            >
                              <Save className="h-3 w-3" />
                              Save Changes
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
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

      {/* Add Job Manually Modal */}
      {showAddJobModal && (
        <AddJobModal
          onClose={() => setShowAddJobModal(false)}
          onSubmit={handleAddJob}
          isLoading={addingJob}
        />
      )}

      {/* Tailor Options Modal */}
      {tailorOptions && (
        <TailorOptionsModal
          jobId={tailorOptions.jobId}
          initialResume={tailorOptions.generateResume}
          initialCoverLetter={tailorOptions.generateCoverLetter}
          isLoading={tailoringJob === tailorOptions.jobId}
          onClose={() => setTailorOptions(null)}
          onSubmit={(generateResume, generateCoverLetter) => {
            handleGenerateTailoredContent(tailorOptions.jobId, generateResume, generateCoverLetter);
          }}
        />
      )}

      {/* Help Button */}
      <HelpButton onClick={() => setShowPageTour(true)} />

      {/* Page Tour */}
      {pageTour && (
        <PageTour
          isOpen={showPageTour}
          onClose={() => setShowPageTour(false)}
          steps={pageTour.steps}
          title={pageTour.title}
        />
      )}
    </div>
  );
}

// Add Job Modal Component
function AddJobModal({
  onClose,
  onSubmit,
  isLoading,
}: {
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    company: string;
    location: string;
    apply_url: string;
    description: string;
    job_type?: string;
    salary?: string;
  }) => void;
  isLoading: boolean;
}) {
  const [jobUrl, setJobUrl] = useState('');
  const [fetchingDetails, setFetchingDetails] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    company: '',
    location: '',
    apply_url: '',
    description: '',
    job_type: 'Full-time',
    salary: '',
  });

  const handleFetchDetails = async () => {
    if (!jobUrl.trim()) {
      alert('Please enter a job posting URL');
      return;
    }

    setFetchingDetails(true);
    setFetchError(null);

    try {
      const response = await fetch('/api/jobs/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ url: jobUrl.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch job details');
      }

      if (data.success && data.job) {
        setFormData({
          title: data.job.title || '',
          company: data.job.company || '',
          location: data.job.location || '',
          apply_url: data.job.apply_url || jobUrl.trim(),
          description: data.job.description || '',
          job_type: data.job.job_type || 'Full-time',
          salary: data.job.salary || '',
        });
        setFetchError(null);
      }
    } catch (err) {
      console.error('Error fetching job details:', err);
      setFetchError(err instanceof Error ? err.message : 'Failed to fetch job details');
    } finally {
      setFetchingDetails(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.company || !formData.location || !formData.apply_url || !formData.description) {
      alert('Please fill in all required fields');
      return;
    }
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl border border-border bg-card p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Add Job Manually</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Enter job details to track in your pipeline
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-muted hover:bg-muted/50 hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* URL Fetcher */}
          <div className="rounded-lg border-2 border-dashed border-accent/30 bg-accent/5 p-4">
            <label htmlFor="job_url" className="block text-sm font-medium text-foreground mb-2">
              Quick Start: Fetch from URL
            </label>
            <p className="text-xs text-muted-foreground mb-3">
              Paste a job posting URL (LinkedIn, Indeed, company website, etc.) and we'll automatically extract the details
            </p>
            <div className="flex gap-2">
              <input
                id="job_url"
                type="url"
                value={jobUrl}
                onChange={(e) => setJobUrl(e.target.value)}
                placeholder="https://linkedin.com/jobs/view/12345..."
                className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent"
                disabled={fetchingDetails}
              />
              <button
                type="button"
                onClick={handleFetchDetails}
                disabled={fetchingDetails || !jobUrl.trim()}
                className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {fetchingDetails ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Fetching...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Fetch Details
                  </>
                )}
              </button>
            </div>
            {fetchError && (
              <p className="mt-2 text-xs text-red-400">{fetchError}</p>
            )}
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Or fill manually</span>
            </div>
          </div>

          <div>
            <label htmlFor="title" className="block text-sm font-medium text-foreground mb-1">
              Job Title <span className="text-red-500">*</span>
            </label>
            <input
              id="title"
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Senior Product Manager"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent"
              required
            />
          </div>

          <div>
            <label htmlFor="company" className="block text-sm font-medium text-foreground mb-1">
              Company <span className="text-red-500">*</span>
            </label>
            <input
              id="company"
              type="text"
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              placeholder="e.g. Acme Corp"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent"
              required
            />
          </div>

          <div>
            <label htmlFor="location" className="block text-sm font-medium text-foreground mb-1">
              Location <span className="text-red-500">*</span>
            </label>
            <input
              id="location"
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="e.g. Remote, New York, NY"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent"
              required
            />
          </div>

          <div>
            <label htmlFor="apply_url" className="block text-sm font-medium text-foreground mb-1">
              Apply URL <span className="text-red-500">*</span>
            </label>
            <input
              id="apply_url"
              type="url"
              value={formData.apply_url}
              onChange={(e) => setFormData({ ...formData, apply_url: e.target.value })}
              placeholder="https://company.com/jobs/123"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="job_type" className="block text-sm font-medium text-foreground mb-1">
                Job Type
              </label>
              <select
                id="job_type"
                value={formData.job_type}
                onChange={(e) => setFormData({ ...formData, job_type: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
                <option value="Contract">Contract</option>
                <option value="Freelance">Freelance</option>
              </select>
            </div>

            <div>
              <label htmlFor="salary" className="block text-sm font-medium text-foreground mb-1">
                Salary (optional)
              </label>
              <input
                id="salary"
                type="text"
                value={formData.salary}
                onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                placeholder="e.g. $120k - $150k"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-foreground mb-1">
              Job Description <span className="text-red-500">*</span>
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Paste the full job description here..."
              rows={8}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent"
              required
            />
            <p className="mt-1 text-xs text-muted-foreground">
              💡 Tip: The system will automatically fetch the complete job description from the Apply URL to ensure accuracy for tailored content generation
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted/50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Adding Job...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Add Job
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Tailor Options Modal Component
function TailorOptionsModal({
  jobId,
  initialResume,
  initialCoverLetter,
  isLoading,
  onClose,
  onSubmit,
}: {
  jobId: string;
  initialResume: boolean;
  initialCoverLetter: boolean;
  isLoading: boolean;
  onClose: () => void;
  onSubmit: (generateResume: boolean, generateCoverLetter: boolean) => void;
}) {
  const [generateResume, setGenerateResume] = useState(initialResume);
  const [generateCoverLetter, setGenerateCoverLetter] = useState(initialCoverLetter);

  const handleSubmit = () => {
    if (!generateResume && !generateCoverLetter) {
      alert('Please select at least one option');
      return;
    }
    onSubmit(generateResume, generateCoverLetter);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Generate Tailored Content</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Select what you'd like to generate
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-muted hover:bg-muted/50 hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-3 mb-6">
          <label className="flex items-start gap-3 rounded-lg border border-border bg-background p-3 cursor-pointer hover:border-accent/50 transition-colors">
            <input
              type="checkbox"
              checked={generateResume}
              onChange={(e) => setGenerateResume(e.target.checked)}
              disabled={!initialResume}
              className="mt-0.5 h-4 w-4 rounded border-border text-accent focus:ring-accent focus:ring-offset-0 disabled:opacity-50"
            />
            <div className="flex-1">
              <div className="font-medium text-foreground">Tailored Resume</div>
              <div className="text-xs text-muted-foreground">
                {initialResume ? 'Generate a resume optimized for this role' : 'Already generated'}
              </div>
            </div>
          </label>

          <label className="flex items-start gap-3 rounded-lg border border-border bg-background p-3 cursor-pointer hover:border-accent/50 transition-colors">
            <input
              type="checkbox"
              checked={generateCoverLetter}
              onChange={(e) => setGenerateCoverLetter(e.target.checked)}
              disabled={!initialCoverLetter}
              className="mt-0.5 h-4 w-4 rounded border-border text-accent focus:ring-accent focus:ring-offset-0 disabled:opacity-50"
            />
            <div className="flex-1">
              <div className="font-medium text-foreground">Cover Letter</div>
              <div className="text-xs text-muted-foreground">
                {initialCoverLetter ? 'Generate a personalized cover letter' : 'Already generated'}
              </div>
            </div>
          </label>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted/50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading || (!generateResume && !generateCoverLetter)}
            className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Generate
              </>
            )}
          </button>
        </div>
      </div>
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
  getMatchColor,
}: {
  id: string;
  status: { id: TrackedJob['status']; label: string; color: string };
  jobs: TrackedJob[];
  onJobClick: (job: TrackedJob) => void;
  onStatusChange: (jobId: string, status: TrackedJob['status']) => void;
  statuses: Array<{ id: TrackedJob['status']; label: string; color: string }>;
  getMatchColor: (percentage: number | null) => string;
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
            getMatchColor={getMatchColor}
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
  getMatchColor,
}: {
  job: TrackedJob;
  onClick: (job: TrackedJob) => void;
  onStatusChange: (jobId: string, status: TrackedJob['status']) => void;
  statuses: Array<{ id: TrackedJob['status']; label: string; color: string }>;
  getMatchColor: (percentage: number | null) => string;
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

      {/* Match Percentage Badge */}
      {job.match_percentage !== null && (
        <div className="mt-3 ml-6">
          <div className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${getMatchColor(job.match_percentage)}`}>
            <span className="text-lg leading-none">✓</span>
            <span>{job.match_percentage}% Match</span>
          </div>
        </div>
      )}

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
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    fetchContent();
  }, [id, type]);

  async function fetchContent() {
    setLoading(true);
    try {
      const endpoint = type === 'resume' ? `/api/resume/${id}` : `/api/cover-letter/${id}`;
      const response = await fetch(endpoint, { credentials: 'include' });
      const data = await response.json();
      setContent(type === 'resume' ? data.resume : data.cover_letter);
    } catch (error) {
      console.error('Error fetching content:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDownloadPDF() {
    if (!content || downloading) return;
    
    setDownloading(true);
    try {
      console.log('Starting PDF generation for type:', type);
      console.log('Content structure:', {
        hasContent: !!content,
        contentKeys: content ? Object.keys(content) : [],
        sectionsCount: content?.sections?.length
      });
      
      // Generate PDF using @react-pdf/renderer
      const PDFComponent = type === 'resume' 
        ? <ResumePDF resume={content} />
        : <CoverLetterPDF coverLetter={content} />;
      
      // Generate PDF blob
      const blob = await pdf(PDFComponent).toBlob();
      
      // Generate filename
      let filename = '';
      if (type === 'resume') {
        const fullName = content.full_name || 'resume';
        const title = content.title || '';
        const companyMatch = title.match(/at\s+(.+)$/i);
        const companyName = companyMatch ? companyMatch[1].replace(/[^a-z0-9]/gi, '').toLowerCase() : 'company';
        filename = `resume_${fullName.toLowerCase().replace(/\s+/g, '')}_${companyName}.pdf`;
      } else {
        const companyName = content.job_company || 'company';
        filename = `coverletter_biancastarling_${companyName.replace(/[^a-z0-9]/gi, '').toLowerCase()}.pdf`;
      }

      // Download the PDF
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error('Error generating PDF:', error);
      console.error('Error details:', {
        message: error?.message,
        stack: error?.stack,
        content: content ? 'Content exists' : 'No content',
        type: type
      });
      alert(`Failed to generate PDF: ${error?.message || 'Unknown error'}. Please try again or check the console for details.`);
    } finally {
      setDownloading(false);
    }
  }

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
            <button
              onClick={handleDownloadPDF}
              disabled={downloading || loading}
              className="flex items-center gap-2 rounded-lg bg-accent px-3 py-2 text-sm font-medium text-accent-foreground hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {downloading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Download PDF
                </>
              )}
            </button>
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
          ) : (
            <div id="preview-content">
              {type === 'resume' ? (
                <ResumePreview resume={content} />
              ) : (
                <CoverLetterPreview coverLetter={content} />
              )}
            </div>
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
          {resume.portfolio_url && (
            <span>
              • <a href={resume.portfolio_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                {resume.portfolio_url.replace(/^https?:\/\//, '')}
              </a>
            </span>
          )}
          {resume.linkedin_url && (
            <span>
              • <a href={resume.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                LinkedIn
              </a>
            </span>
          )}
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
