'use client';

import { useState, useEffect, useCallback, use } from 'react';
import Link from 'next/link';
import { ArrowLeft, Download, Save, Eye, Sparkles, Lightbulb } from 'lucide-react';
import type { CoverLetter } from '@/lib/types/cover-letter';
// PDF generation removed - use the download button in the job card modal instead

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ autoDownload?: string }>;
};

export default function CoverLetterEditPage({ params, searchParams }: PageProps) {
  const { id } = use(params);
  const resolvedSearchParams = searchParams ? use(searchParams) : undefined;
  const [coverLetter, setCoverLetter] = useState<CoverLetter | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const downloadPDF = useCallback(async () => {
    if (!coverLetter) return;
    
    setDownloading(true);
    try {
      // Use the browser's print dialog for PDF generation
      window.print();
    } catch (error) {
      console.error('Error opening print dialog:', error);
      alert('Failed to open print dialog. Please use Ctrl+P or Cmd+P to print.');
    } finally {
      setDownloading(false);
    }
  }, [coverLetter]);

  useEffect(() => {
    fetchCoverLetter();
  }, [id]);

  // Auto-download if autoDownload parameter is present
  useEffect(() => {
    if (resolvedSearchParams?.autoDownload === 'true' && coverLetter && !loading && !downloading) {
      downloadPDF();
    }
  }, [coverLetter, loading, resolvedSearchParams, downloading, downloadPDF]);

  async function fetchCoverLetter() {
    try {
      const response = await fetch(`/api/cover-letter/${id}`);
      const data = await response.json();
      if (data.cover_letter) {
        setCoverLetter(data.cover_letter);
      }
    } catch (error) {
      console.error('Error fetching cover letter:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!coverLetter) return;
    
    setSaving(true);
    try {
      await fetch(`/api/cover-letter/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          opening_paragraph: coverLetter.opening_paragraph,
          body_paragraphs: coverLetter.body_paragraphs,
          closing_paragraph: coverLetter.closing_paragraph,
          recipient_name: coverLetter.recipient_name,
          recipient_title: coverLetter.recipient_title,
          company_address: coverLetter.company_address,
        }),
      });
    } catch (error) {
      console.error('Error saving cover letter:', error);
      alert('Failed to save changes');
    } finally {
      setSaving(false);
    }
  }

  async function markAsFinal() {
    if (!coverLetter) return;
    
    try {
      const response = await fetch(`/api/cover-letter/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'final' }),
      });
      
      const data = await response.json();
      if (data.cover_letter) {
        setCoverLetter(data.cover_letter);
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading cover letter...</div>
      </div>
    );
  }

  if (!coverLetter) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Cover letter not found</h2>
          <Link href="/cover-letters" className="text-blue-600 hover:underline">
            Back to cover letters
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/cover-letters"
                className="text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  {coverLetter.job_title}
                </h1>
                <p className="text-sm text-gray-600">
                  {coverLetter.job_company}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={downloadPDF}
                disabled={downloading}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="w-4 h-4" />
                {downloading ? 'Generating...' : 'Download PDF'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8" id="cover-letter-content">
          {/* Main Editor */}
          <div className="lg:col-span-2 space-y-6">
            {/* Recipient Information */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Recipient Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Recipient Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={coverLetter.recipient_name || ''}
                    onChange={(e) => setCoverLetter({ ...coverLetter, recipient_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="e.g., Jane Smith"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Recipient Title (Optional)
                  </label>
                  <input
                    type="text"
                    value={coverLetter.recipient_title || ''}
                    onChange={(e) => setCoverLetter({ ...coverLetter, recipient_title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="e.g., Director of Product Management"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company Address (Optional)
                  </label>
                  <input
                    type="text"
                    value={coverLetter.company_address || ''}
                    onChange={(e) => setCoverLetter({ ...coverLetter, company_address: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="e.g., 123 Market St, San Francisco, CA"
                  />
                </div>
              </div>
            </div>

            {/* Opening Paragraph */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Opening Paragraph</h2>
              <textarea
                value={coverLetter.opening_paragraph}
                onChange={(e) => setCoverLetter({ ...coverLetter, opening_paragraph: e.target.value })}
                className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Hook the reader with your enthusiasm..."
              />
            </div>

            {/* Body Paragraphs */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Body Paragraphs</h2>
              <div className="space-y-4">
                {coverLetter.body_paragraphs.map((paragraph, index) => (
                  <div key={index}>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-gray-700">
                        Paragraph {index + 1}
                      </label>
                      {coverLetter.body_paragraphs.length > 1 && (
                        <button
                          onClick={() => {
                            const newParagraphs = coverLetter.body_paragraphs.filter((_, i) => i !== index);
                            setCoverLetter({ ...coverLetter, body_paragraphs: newParagraphs });
                          }}
                          className="text-xs text-red-600 hover:text-red-700"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <textarea
                      value={paragraph}
                      onChange={(e) => {
                        const newParagraphs = [...coverLetter.body_paragraphs];
                        newParagraphs[index] = e.target.value;
                        setCoverLetter({ ...coverLetter, body_paragraphs: newParagraphs });
                      }}
                      className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Highlight your relevant experience..."
                    />
                  </div>
                ))}
                <button
                  onClick={() => {
                    setCoverLetter({
                      ...coverLetter,
                      body_paragraphs: [...coverLetter.body_paragraphs, ''],
                    });
                  }}
                  className="text-sm text-purple-600 hover:text-purple-700"
                >
                  + Add paragraph
                </button>
              </div>
            </div>

            {/* Closing Paragraph */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Closing Paragraph</h2>
              <textarea
                value={coverLetter.closing_paragraph}
                onChange={(e) => setCoverLetter({ ...coverLetter, closing_paragraph: e.target.value })}
                className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Express enthusiasm and call to action..."
              />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Status</h3>
              <div className="flex items-center justify-between">
                <span className={`text-sm px-3 py-1 rounded-full ${
                  coverLetter.status === 'final' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {coverLetter.status}
                </span>
                {coverLetter.status === 'draft' && (
                  <button
                    onClick={markAsFinal}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    Mark as Final
                  </button>
                )}
              </div>
            </div>

            {/* AI Context */}
            {coverLetter.key_points && coverLetter.key_points.length > 0 && (
              <div className="bg-purple-50 rounded-lg border border-purple-200 p-6">
                <div className="flex items-center gap-2 mb-3">
                  <Lightbulb className="w-5 h-5 text-purple-600" />
                  <h3 className="text-sm font-semibold text-purple-900">Key Selling Points</h3>
                </div>
                <ul className="space-y-2">
                  {coverLetter.key_points.map((point, i) => (
                    <li key={i} className="text-sm text-purple-900 flex items-start gap-2">
                      <span className="text-purple-600 mt-0.5">•</span>
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Referenced Content */}
            {(coverLetter.selected_experiences.length > 0 || coverLetter.selected_projects.length > 0) && (
              <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-5 h-5 text-blue-600" />
                  <h3 className="text-sm font-semibold text-blue-900">Referenced Content</h3>
                </div>
                
                {coverLetter.selected_experiences.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs font-medium text-blue-700 mb-1">Experiences:</p>
                    <ul className="space-y-1">
                      {coverLetter.selected_experiences.map((exp, i) => (
                        <li key={i} className="text-xs text-blue-900">{exp}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {coverLetter.selected_projects.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-blue-700 mb-1">Projects:</p>
                    <ul className="space-y-1">
                      {coverLetter.selected_projects.map((proj, i) => (
                        <li key={i} className="text-xs text-blue-900">{proj}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
