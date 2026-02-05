'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, FileText, Calendar, Edit2, Trash2, Eye, Sparkles, Briefcase, Download } from 'lucide-react';
import type { CoverLetter } from '@/lib/types/cover-letter';
import type { JobListing } from '@/app/api/jobs/route';

export default function CoverLettersPage() {
  const [coverLetters, setCoverLetters] = useState<CoverLetter[]>([]);
  const [loading, setLoading] = useState(true);
  const [showGenerateModal, setShowGenerateModal] = useState(false);

  useEffect(() => {
    fetchCoverLetters();
  }, []);

  async function fetchCoverLetters() {
    try {
      const response = await fetch('/api/cover-letter');
      const data = await response.json();
      if (data.cover_letters) {
        setCoverLetters(data.cover_letters);
      }
    } catch (error) {
      console.error('Error fetching cover letters:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this cover letter?')) return;
    
    try {
      await fetch(`/api/cover-letter/${id}`, { method: 'DELETE' });
      setCoverLetters(coverLetters.filter(cl => cl.id !== id));
    } catch (error) {
      console.error('Error deleting cover letter:', error);
      alert('Failed to delete cover letter');
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading cover letters...</div>
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
              <h1 className="text-3xl font-bold text-gray-900">Cover Letters</h1>
              <p className="mt-2 text-sm text-gray-600">
                AI-generated cover letters tailored to specific jobs
              </p>
            </div>
            <button
              onClick={() => setShowGenerateModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Sparkles className="w-5 h-5" />
              Generate Cover Letter
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {coverLetters.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <FileText className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No cover letters yet</h3>
            <p className="text-gray-600 mb-6">
              Generate your first AI-powered cover letter for a job application
            </p>
            <button
              onClick={() => setShowGenerateModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Sparkles className="w-5 h-5" />
              Generate Cover Letter
            </button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {coverLetters.map((coverLetter) => (
              <div
                key={coverLetter.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                {/* Card header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-purple-600" />
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    coverLetter.status === 'final' 
                      ? 'bg-green-100 text-green-800' 
                      : coverLetter.status === 'draft'
                        ? 'bg-gray-100 text-gray-800'
                        : 'bg-gray-100 text-gray-600'
                  }`}>
                    {coverLetter.status}
                  </span>
                </div>

                {/* Title and company */}
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {coverLetter.job_title}
                </h3>
                <p className="text-sm text-gray-600 mb-4">{coverLetter.job_company}</p>

                {/* Key points */}
                {coverLetter.key_points && coverLetter.key_points.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs font-medium text-gray-500 mb-2">Key Points:</p>
                    <div className="flex flex-wrap gap-1">
                      {coverLetter.key_points.slice(0, 3).map((point, i) => (
                        <span
                          key={i}
                          className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded"
                        >
                          {point}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Updated date */}
                <div className="flex items-center gap-1 text-xs text-gray-500 mb-4">
                  <Calendar className="w-3 h-3" />
                  Updated {new Date(coverLetter.updated_at).toLocaleDateString()}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <Link
                    href={`/cover-letters/${coverLetter.id}`}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit
                  </Link>
                  <a
                    href={`/api/cover-letter/${coverLetter.id}/export`}
                    target="_blank"
                    className="inline-flex items-center justify-center px-3 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                  <button
                    onClick={() => handleDelete(coverLetter.id)}
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

      {/* Generate Modal */}
      {showGenerateModal && (
        <GenerateCoverLetterModal
          onClose={() => setShowGenerateModal(false)}
          onSuccess={(coverLetterId) => {
            setShowGenerateModal(false);
            window.location.href = `/cover-letters/${coverLetterId}`;
          }}
        />
      )}
    </div>
  );
}

function GenerateCoverLetterModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: (coverLetterId: string) => void;
}) {
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>('');
  const [generating, setGenerating] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJobs();
  }, []);

  async function fetchJobs() {
    try {
      const response = await fetch('/api/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

  async function handleGenerate() {
    if (!selectedJobId) return;
    
    setGenerating(true);
    try {
      const response = await fetch('/api/cover-letter/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_id: selectedJobId,
          tone: 'professional',
        }),
      });

      const data = await response.json();
      if (data.cover_letter) {
        onSuccess(data.cover_letter.id);
      } else {
        alert('Failed to generate cover letter');
      }
    } catch (error) {
      console.error('Error generating cover letter:', error);
      alert('Failed to generate cover letter');
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[85vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-purple-600" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Generate Cover Letter</h2>
              <p className="text-sm text-gray-600 mt-1">
                AI will write a compelling cover letter from your portfolio
              </p>
            </div>
          </div>
        </div>
        
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
            <div className="space-y-3">
              <p className="text-sm text-gray-700 mb-4">
                Select a job to generate a tailored cover letter:
              </p>
              {jobs.map((job) => (
                <button
                  key={job.id}
                  onClick={() => setSelectedJobId(job.id)}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                    selectedJobId === job.id
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <h3 className="font-semibold text-gray-900 mb-1">{job.title}</h3>
                  <p className="text-sm text-gray-600 mb-2">{job.company}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>{job.location}</span>
                    <span>•</span>
                    <span>{job.type}</span>
                  </div>
                </button>
              ))}
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
              disabled={!selectedJobId || generating}
              className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generating ? 'Generating...' : 'Generate Cover Letter'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
