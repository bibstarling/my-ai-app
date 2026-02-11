'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, FileText, Calendar, Star, Edit2, Trash2, Copy, Eye, Sparkles, Briefcase, Globe, Loader2 } from 'lucide-react';
import type { ResumeWithSections } from '@/lib/types/resume';
import type { JobListing } from '@/app/api/jobs/route';
import { HelpButton } from '@/app/components/HelpButton';
import { PageTour } from '@/app/components/PageTour';
import { getPageTour } from '@/lib/page-tours';
import type { Locale } from '@/lib/language-detection';
import { useNotification } from '@/app/hooks/useNotification';

const locales: Locale[] = ['en', 'pt-BR'];
const localeNames: Record<Locale, string> = {
  'en': 'English',
  'pt-BR': 'Português (Brasil)'
};

export default function ResumeBuilderPage() {
  const { showSuccess, showError, confirm } = useNotification();
  
  const [resumes, setResumes] = useState<ResumeWithSections[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showPageTour, setShowPageTour] = useState(false);
  
  const pageTour = getPageTour('resume-builder');

  useEffect(() => {
    fetchResumes();
  }, []);

  async function fetchResumes() {
    try {
      const response = await fetch('/api/resume', {
        credentials: 'include',
      });
      const data = await response.json();
      if (data.resumes) {
        setResumes(data.resumes);
      }
    } catch (error) {
      console.error('Error fetching resumes:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    const confirmed = await confirm('Are you sure you want to delete this resume? This cannot be undone.', {
      title: 'Delete Resume',
      type: 'danger',
      confirmText: 'Delete',
      cancelText: 'Cancel'
    });
    
    if (!confirmed) return;
    
    try {
      await fetch(`/api/resume/${id}`, { method: 'DELETE', credentials: 'include' });
      setResumes(resumes.filter(r => r.id !== id));
      showSuccess('Resume deleted');
    } catch (error) {
      console.error('Error deleting resume:', error);
      showError('Failed to delete resume');
    }
  }

  async function handleDuplicate(resume: ResumeWithSections) {
    try {
      // Create new resume
      const createResponse = await fetch('/api/resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title: `${resume.title} (Copy)`,
          full_name: resume.full_name,
          email: resume.email,
          phone: resume.phone,
          location: resume.location,
          linkedin_url: resume.linkedin_url,
          portfolio_url: resume.portfolio_url,
        }),
      });
      
      const { resume: newResume } = await createResponse.json();
      
      // Copy all sections
      for (const section of resume.sections) {
        await fetch(`/api/resume/${newResume.id}/sections`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            section_type: section.section_type,
            title: section.title,
            content: section.content,
            sort_order: section.sort_order,
          }),
        });
      }
      
      fetchResumes();
      showSuccess('Resume duplicated');
    } catch (error) {
      console.error('Error duplicating resume:', error);
      showError('Failed to duplicate resume');
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600 flex items-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin" />
          Loading your resumes...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <FileText className="w-8 h-8 text-accent" />
                My Resumes
              </h1>
              <p className="mt-2 text-sm text-gray-600">
                Create professional resumes tailored to each opportunity
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowGenerateModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-applause-orange text-white rounded-lg hover:opacity-90 transition-all shadow-lg"
              >
                <Sparkles className="w-5 h-5" />
                <Sparkles className="w-5 h-5" />
                AI Generate
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-ocean-blue text-white rounded-lg hover:opacity-90 transition-all shadow-lg"
              >
                <Plus className="w-5 h-5" />
                Start from Scratch
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {resumes.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <FileText className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-accent" />
              Create your first resume
            </h3>
            <p className="text-gray-600 mb-6">
              Use AI to generate a tailored resume for a specific job, or start from scratch
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setShowGenerateModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-applause-orange text-white rounded-lg hover:opacity-90 transition-all shadow-lg"
              >
                <Plus className="w-5 h-5" />
                Generate from Job
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Create Blank
              </button>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {resumes.map((resume, index) => (
              <div
                key={resume.id}
                className="bg-white rounded-xl shadow-md border-2 border-gray-200 p-6 hover:shadow-xl transition-all hover-lift animate-fade-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Resume card header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-applause-orange" />
                    {resume.is_primary && (
                      <Star className="w-4 h-4 text-sunshine-yellow fill-current animate-pulse-subtle" />
                    )}
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    resume.status === 'active' 
                      ? 'bg-green-100 text-green-800' 
                      : resume.status === 'draft'
                        ? 'bg-gray-100 text-gray-800'
                        : 'bg-gray-100 text-gray-600'
                  }`}>
                    {resume.status}
                  </span>
                </div>

                {/* Title and info */}
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {resume.title}
                </h3>
                <p className="text-sm text-gray-600 mb-1">{resume.full_name || 'No name set'}</p>
                <p className="text-xs text-gray-500 mb-4">
                  {resume.sections.length} section{resume.sections.length !== 1 ? 's' : ''}
                </p>

                {/* Updated date */}
                <div className="flex items-center gap-1 text-xs text-gray-500 mb-4">
                  <Calendar className="w-3 h-3" />
                  Updated {new Date(resume.updated_at).toLocaleDateString()}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <Link
                    href={`/resume-builder/${resume.id}`}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit
                  </Link>
                  <Link
                    href={`/resume-builder/${resume.id}/preview`}
                    className="inline-flex items-center justify-center px-3 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={() => handleDuplicate(resume)}
                    className="inline-flex items-center justify-center px-3 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(resume.id)}
                    className="inline-flex items-center justify-center px-3 py-2 bg-red-50 text-red-700 text-sm rounded-lg hover:bg-red-100 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <CreateResumeModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchResumes();
          }}
        />
      )}

      {/* Generate from Job Modal */}
      {showGenerateModal && (
        <GenerateFromJobModal
          onClose={() => setShowGenerateModal(false)}
          onSuccess={(resumeId) => {
            setShowGenerateModal(false);
            window.location.href = `/resume-builder/${resumeId}`;
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

function GenerateFromJobModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: (resumeId: string) => void;
}) {
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>('');
  const [selectedJob, setSelectedJob] = useState<JobListing | null>(null);
  const [generating, setGenerating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [contentLanguage, setContentLanguage] = useState<Locale>('en');
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [profileStatus, setProfileStatus] = useState<{ hasProfile: boolean; markdownLength: number } | null>(null);
  const [checkingProfile, setCheckingProfile] = useState(true);

  useEffect(() => {
    fetchJobs();
    fetchUserSettings();
    checkProfileStatus();
  }, []);

  async function fetchJobs() {
    try {
      const response = await fetch('/api/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({}),
      });
      const data = await response.json();
      if (data.matches) {
        setJobs(data.matches);
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchUserSettings() {
    try {
      const response = await fetch('/api/users/settings', { credentials: 'include' });
      const data = await response.json();
      if (data.settings) {
        setContentLanguage(data.settings.content_language || 'en');
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoadingSettings(false);
    }
  }

  async function checkProfileStatus() {
    try {
      const response = await fetch('/api/portfolio/current', { credentials: 'include' });
      const data = await response.json();
      if (data.success && data.portfolio) {
        const markdownLength = data.portfolio.markdown?.length || 0;
        setProfileStatus({
          hasProfile: markdownLength > 100, // Require at least 100 chars
          markdownLength
        });
      } else {
        setProfileStatus({ hasProfile: false, markdownLength: 0 });
      }
    } catch (error) {
      console.error('Error checking profile:', error);
      setProfileStatus({ hasProfile: false, markdownLength: 0 });
    } finally {
      setCheckingProfile(false);
    }
  }

  // Update language when job is selected
  function handleJobSelect(job: JobListing) {
    setSelectedJobId(job.id);
    setSelectedJob(job);
    
    // Auto-select language based on job if detected
    if (job.detected_language && (job.detected_language === 'en' || job.detected_language === 'pt-BR')) {
      setContentLanguage(job.detected_language as Locale);
    }
  }

  async function handleGenerate() {
    if (!selectedJobId) return;
    
    setGenerating(true);
    try {
      const response = await fetch('/api/resume/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          job_id: selectedJobId,
          content_language: contentLanguage,
        }),
      });

      const data = await response.json();
      if (data.resume) {
        onSuccess(data.resume.id);
      } else {
        showError('Failed to generate resume');
      }
    } catch (error) {
      console.error('Error generating resume:', error);
      showError('Failed to generate resume');
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[85vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-accent" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Generate Resume from Job</h2>
              <p className="text-sm text-gray-600 mt-1">
                AI will auto-select your most relevant experience and projects
              </p>
            </div>
          </div>
        </div>

        {/* Profile Warning Banner */}
        {!checkingProfile && profileStatus && !profileStatus.hasProfile && (
          <div className="mx-6 mt-6 p-4 bg-amber-50 border-l-4 border-amber-500 rounded-r-lg">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-amber-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-amber-800">Professional Profile Required</h3>
                <p className="mt-1 text-sm text-amber-700">
                  To generate tailored resumes, the AI needs your professional profile as context. Please build your profile first with your experience, skills, and projects.
                </p>
                <Link 
                  href="/portfolio/builder"
                  className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-amber-800 hover:text-amber-900 underline"
                >
                  <Briefcase className="w-4 h-4" />
                  Build Your Profile Now
                </Link>
              </div>
            </div>
          </div>
        )}
        
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {loading ? (
            <div className="text-center py-8 text-gray-600">Loading jobs...</div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-8">
              <Briefcase className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 mb-4">No job postings found</p>
              <Link
                href="/assistant"
                className="text-blue-600 hover:underline text-sm"
              >
                Search for jobs
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Job Selection */}
              <div>
                <p className="text-sm text-gray-700 mb-4">
                  Select a job posting to generate a tailored resume:
                </p>
                <div className="space-y-3">
                  {jobs.map((job) => (
                    <button
                      key={job.id}
                      onClick={() => handleJobSelect(job)}
                      className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                        selectedJobId === job.id
                          ? 'border-applause-orange bg-orange-50'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-1">
                        <h3 className="font-semibold text-gray-900 flex-1">{job.title}</h3>
                        {job.detected_language && job.detected_language !== 'unknown' && (
                          <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                            {job.detected_language === 'pt-BR' ? '🇧🇷 PT' : '🇬🇧 EN'}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{job.company}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>{job.location}</span>
                        <span>•</span>
                        <span>{job.type}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Language Selection */}
              {!loadingSettings && (
                <div className="pt-4 border-t border-gray-200">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
                    <Globe className="w-4 h-4" />
                    Content Language
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {locales.map((locale) => (
                      <button
                        key={locale}
                        onClick={() => setContentLanguage(locale)}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          contentLanguage === locale
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                      >
                        <span className="font-medium text-gray-900 text-sm">
                          {localeNames[locale]}
                        </span>
                      </button>
                    ))}
                  </div>
                  {selectedJob?.detected_language && selectedJob.detected_language !== 'unknown' ? (
                    <p className="text-xs text-blue-600 mt-2 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      Auto-detected from job posting (you can change it)
                    </p>
                  ) : (
                    <p className="text-xs text-gray-500 mt-2">
                      Resume content will be generated in this language
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleGenerate}
              disabled={!selectedJobId || generating || !profileStatus?.hasProfile}
              className="flex-1 px-4 py-2 bg-applause-orange text-white rounded-lg hover:opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title={!profileStatus?.hasProfile ? 'Build your profile first to generate tailored resumes' : ''}
            >
              {generating ? 'Generating...' : 'Generate Resume'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CreateResumeModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    title: '',
    full_name: '',
    email: '',
    phone: '',
    location: '',
    linkedin_url: '',
    portfolio_url: '',
  });
  const [creating, setCreating] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);

    try {
      const response = await fetch('/api/resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        onSuccess();
      } else {
        showError('Failed to create resume');
      }
    } catch (error) {
      console.error('Error creating resume:', error);
      showError('Failed to create resume');
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Create New Resume</h2>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Resume Title *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Product Manager Resume"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name
            </label>
            <input
              type="text"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., New York, NY"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              LinkedIn URL
            </label>
            <input
              type="url"
              value={formData.linkedin_url}
              onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://linkedin.com/in/yourprofile"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Portfolio URL
            </label>
            <input
              type="url"
              value={formData.portfolio_url}
              onChange={(e) => setFormData({ ...formData, portfolio_url: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://yourportfolio.com"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {creating ? 'Creating...' : 'Create Resume'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
