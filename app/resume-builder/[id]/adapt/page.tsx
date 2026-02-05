'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { ArrowLeft, Sparkles, TrendingUp, AlertCircle, CheckCircle2, Lightbulb, Download, FileText } from 'lucide-react';
import type { ResumeWithSections, ResumeAdaptation } from '@/lib/types/resume';
import type { JobListing } from '@/app/api/jobs/route';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default function AdaptResumePage({ params }: PageProps) {
  const { id } = use(params);
  const [resume, setResume] = useState<ResumeWithSections | null>(null);
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>('');
  const [adaptation, setAdaptation] = useState<ResumeAdaptation | null>(null);
  const [loading, setLoading] = useState(true);
  const [adapting, setAdapting] = useState(false);

  useEffect(() => {
    fetchData();
  }, [id]);

  async function fetchData() {
    try {
      const [resumeRes, jobsRes] = await Promise.all([
        fetch(`/api/resume/${id}`),
        fetch('/api/matches', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) }),
      ]);
      
      const resumeData = await resumeRes.json();
      const jobsData = await jobsRes.json();
      
      if (resumeData.resume) setResume(resumeData.resume);
      if (jobsData.matches) setJobs(jobsData.matches);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleAdapt() {
    if (!selectedJobId) return;
    
    setAdapting(true);
    try {
      const response = await fetch('/api/resume/adapt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resume_id: id,
          job_id: selectedJobId,
        }),
      });
      
      const data = await response.json();
      if (data.adaptation) {
        setAdaptation(data.adaptation);
      }
    } catch (error) {
      console.error('Error adapting resume:', error);
      alert('Failed to adapt resume');
    } finally {
      setAdapting(false);
    }
  }

  async function handleGenerateNew() {
    if (!selectedJobId) return;
    
    setAdapting(true);
    try {
      const response = await fetch('/api/resume/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_id: selectedJobId,
        }),
      });
      
      const data = await response.json();
      if (data.resume) {
        // Redirect to the new resume
        window.location.href = `/resume-builder/${data.resume.id}`;
      }
    } catch (error) {
      console.error('Error generating resume:', error);
      alert('Failed to generate resume');
    } finally {
      setAdapting(false);
    }
  }

  async function handleGenerateCoverLetter() {
    if (!selectedJobId) return;
    
    setAdapting(true);
    try {
      const response = await fetch('/api/cover-letter/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_id: selectedJobId,
          resume_id: id,
          tone: 'professional',
        }),
      });
      
      const data = await response.json();
      if (data.cover_letter) {
        window.location.href = `/cover-letters/${data.cover_letter.id}`;
      }
    } catch (error) {
      console.error('Error generating cover letter:', error);
      alert('Failed to generate cover letter');
    } finally {
      setAdapting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!resume) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Resume not found</h2>
          <Link href="/resume-builder" className="text-blue-600 hover:underline">
            Back to resumes
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <Link
              href={`/resume-builder/${id}`}
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Adapt Resume to Job</h1>
              <p className="text-sm text-gray-600 mt-1">
                AI will optimize your resume for a specific job posting
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left: Job Selection */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Select a Job Posting</h2>
            {jobs.length === 0 ? (
              <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                <AlertCircle className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 mb-4">No job postings found</p>
                <Link
                  href="/assistant"
                  className="text-blue-600 hover:underline text-sm"
                >
                  Search for jobs
                </Link>
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {jobs.map((job) => (
                  <button
                    key={job.id}
                    onClick={() => setSelectedJobId(job.id)}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                      selectedJobId === job.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <h3 className="font-semibold text-gray-900 mb-1">{job.title}</h3>
                    <p className="text-sm text-gray-600 mb-2">{job.company}</p>
                    <p className="text-xs text-gray-500">{job.location}</p>
                  </button>
                ))}
              </div>
            )}

            {selectedJobId && (
              <div className="mt-4 space-y-2">
                <button
                  onClick={handleAdapt}
                  disabled={adapting}
                  className="w-full py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-5 h-5" />
                  {adapting ? 'Adapting...' : 'Adapt Current Resume'}
                </button>
                <button
                  onClick={handleGenerateNew}
                  disabled={adapting}
                  className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-5 h-5" />
                  {adapting ? 'Generating...' : 'Generate New from Portfolio'}
                </button>
                <button
                  onClick={handleGenerateCoverLetter}
                  disabled={adapting}
                  className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <FileText className="w-5 h-5" />
                  {adapting ? 'Generating...' : 'Generate Cover Letter'}
                </button>
                <p className="text-xs text-gray-500 text-center">
                  AI auto-selects your most relevant content for resumes and cover letters
                </p>
              </div>
            )}
          </div>

          {/* Right: Adaptation Results */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">AI Analysis & Recommendations</h2>
            {!adaptation ? (
              <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                <Sparkles className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600">
                  Select a job and click "Adapt Resume" to see AI-powered recommendations
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Match Score */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-900">Match Score</h3>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-green-600" />
                      <span className="text-2xl font-bold text-green-600">
                        {adaptation.match_score || 0}%
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full transition-all"
                      style={{ width: `${adaptation.match_score || 0}%` }}
                    />
                  </div>
                </div>

                {/* Strengths */}
                {adaptation.strengths.length > 0 && (
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                      <h3 className="font-semibold text-gray-900">Your Strengths</h3>
                    </div>
                    <ul className="space-y-2">
                      {adaptation.strengths.map((strength, i) => (
                        <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                          <span className="text-green-600 mt-0.5">✓</span>
                          {strength}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Gaps */}
                {adaptation.gaps.length > 0 && (
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <AlertCircle className="w-5 h-5 text-orange-600" />
                      <h3 className="font-semibold text-gray-900">Areas to Address</h3>
                    </div>
                    <ul className="space-y-2">
                      {adaptation.gaps.map((gap, i) => (
                        <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                          <span className="text-orange-600 mt-0.5">!</span>
                          {gap}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Suggested Keywords */}
                {adaptation.suggested_keywords.length > 0 && (
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="font-semibold text-gray-900 mb-3">Keywords to Include</h3>
                    <div className="flex flex-wrap gap-2">
                      {adaptation.suggested_keywords.map((keyword, i) => (
                        <span
                          key={i}
                          className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* AI Recommendations */}
                {adaptation.ai_recommendations && (
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Lightbulb className="w-5 h-5 text-yellow-600" />
                      <h3 className="font-semibold text-gray-900">AI Recommendations</h3>
                    </div>
                    <p className="text-sm text-gray-700 whitespace-pre-line">
                      {adaptation.ai_recommendations}
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3">
                  <Link
                    href={`/resume-builder/${id}/preview?adaptation=${adaptation.id}`}
                    className="flex-1 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-center"
                  >
                    Preview Adapted Resume
                  </Link>
                  <button
                    onClick={() => {/* TODO: Export PDF */}}
                    className="px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Export
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
