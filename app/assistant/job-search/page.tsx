'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { useUser, SignInButton } from '@clerk/nextjs';
import { supabase } from '@/lib/supabase';
import {
  Loader2,
  Briefcase,
  Search,
  Upload,
  FileText,
  X,
  ExternalLink,
  MapPin,
  Clock,
  DollarSign,
  Sparkles,
  Check,
} from 'lucide-react';
import { HelpButton } from '@/app/components/HelpButton';
import { PageTour } from '@/app/components/PageTour';
import { getPageTour } from '@/lib/page-tours';

type JobListing = {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  salary?: string;
  posted: string;
  description: string;
  applyUrl: string;
  skills: string[];
};

async function extractTextFromFile(file: File): Promise<string> {
  const ext = (file.name.split('.').pop() || '').toLowerCase();
  if (ext === 'txt' || ext === 'md') {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string) || '');
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }
  if (ext === 'pdf') {
    try {
      const pdfjsLib = await import('pdfjs-dist');
      if (typeof window !== 'undefined' && pdfjsLib.GlobalWorkerOptions) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@5.4.624/build/pdf.worker.min.mjs';
      }
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const numPages = pdf.numPages;
      const parts: string[] = [];
      for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const text = content.items
          .map((item) => ('str' in item ? item.str : ''))
          .join(' ');
        parts.push(text);
      }
      return parts.join('\n');
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (/worker|script|load/i.test(msg)) {
        throw new Error('PDF viewer could not load. Save your resume as .txt or .md and upload that instead.');
      }
      throw new Error('Could not read PDF. Try saving as .txt or .md.');
    }
  }
  throw new Error('Unsupported format. Use .txt, .md, or .pdf');
}

export default function JobSearchPage() {
  const { user, isLoaded } = useUser();
  
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [country, setCountry] = useState('');
  const [resumeText, setResumeText] = useState('');
  const [tailorModal, setTailorModal] = useState<{ job: JobListing; show: boolean } | null>(null);
  const [showPageTour, setShowPageTour] = useState(false);
  
  const pageTour = getPageTour('job-search');
  const [generateResume, setGenerateResume] = useState(true);
  const [generateCoverLetter, setGenerateCoverLetter] = useState(true);
  const [tailoring, setTailoring] = useState(false);
  const [resumeFileName, setResumeFileName] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [extractingResume, setExtractingResume] = useState(false);
  const [language, setLanguage] = useState('');
  const [datePosted, setDatePosted] = useState('');
  const [employmentTypes, setEmploymentTypes] = useState<string[]>([]);
  const [jobRequirements, setJobRequirements] = useState<string[]>([]);
  const [radius, setRadius] = useState('');
  const [excludeJobPublishers, setExcludeJobPublishers] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const [searchDone, setSearchDone] = useState(false);

  const toggleEmploymentType = (value: string) => {
    setEmploymentTypes((prev) =>
      prev.includes(value) ? prev.filter((x) => x !== value) : [...prev, value]
    );
  };
  
  const toggleJobRequirement = (value: string) => {
    setJobRequirements((prev) =>
      prev.includes(value) ? prev.filter((x) => x !== value) : [...prev, value]
    );
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileError(null);
    setResumeFileName(null);
    setResumeText('');
    const ext = (file.name.split('.').pop() || '').toLowerCase();
    if (!['txt', 'md', 'pdf'].includes(ext)) {
      setFileError('Use .txt, .md, or .pdf');
      return;
    }
    setExtractingResume(true);
    try {
      const text = await extractTextFromFile(file);
      setResumeText(text);
      setResumeFileName(file.name);
    } catch (e) {
      setFileError(e instanceof Error ? e.message : 'Could not read file. Try .txt or .md.');
    } finally {
      setExtractingResume(false);
      e.target.value = '';
    }
  };

  const clearResume = () => {
    setResumeText('');
    setResumeFileName(null);
    setFileError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const fetchJobs = async () => {
    setLoading(true);
    setError(null);
    setSearchDone(false);
    const textToSend = resumeText.trim();
    const truncated = textToSend.length > 30000 ? textToSend.slice(0, 30000) : textToSend;
    
    try {
      const body = JSON.stringify({
        query: query.trim() || undefined,
        remoteOnly,
        country: country.trim() || undefined,
        resumeText: truncated || undefined,
        language: language.trim() || undefined,
        datePosted: datePosted || undefined,
        employmentTypes: employmentTypes.length ? employmentTypes : undefined,
        jobRequirements: jobRequirements.length ? jobRequirements : undefined,
        radius: radius.trim() ? parseInt(radius.trim(), 10) : undefined,
        excludeJobPublishers: excludeJobPublishers.trim()
          ? excludeJobPublishers.split(/[\s,]+/).map((s) => s.trim()).filter(Boolean)
          : undefined,
      });
      
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      });
      
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        const text = await res.text();
        setError(res.ok ? 'Invalid response from server' : `Request failed (${res.status}): ${text.slice(0, 200)}`);
        setJobs([]);
        setSearchDone(true);
        return;
      }
      
      const data = await res.json();
      setSearchDone(true);
      let jobsList = Array.isArray(data.jobs) ? data.jobs : Array.isArray(data) ? data : [];
      
      setJobs(jobsList);
      if (jobsList.length > 0) setError(null);
      else if (data.error) setError(data.error);
      else if (res.ok) setError('No jobs returned. In production, add JSEARCH_API_KEY to your host environment for real job listings.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load jobs');
      setJobs([]);
      setSearchDone(true);
    } finally {
      setLoading(false);
      resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };

  const handleCreateTailoredContent = async () => {
    if (!tailorModal || !user) return;
    
    const job = tailorModal.job;
    setTailoring(true);
    
    try {
      // ALWAYS fetch complete job details from the apply URL
      let finalDescription = job.description;
      let finalJobType = job.type;
      let finalSalary = job.salary;

      if (job.applyUrl && job.applyUrl !== '#') {
        try {
          const fetchResponse = await fetch('/api/jobs/extract', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: job.applyUrl }),
          });

          if (fetchResponse.ok) {
            const fetchData = await fetchResponse.json();
            if (fetchData.success && fetchData.job) {
              // Use fetched description - it's always more complete than search results
              if (fetchData.job.description) {
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
          console.warn('Could not fetch complete job details, using search result description:', fetchErr);
          // Continue with search result description if fetch fails
        }
      }

      // Create tracked job using Clerk user ID
      const { data: trackedJob, error: trackError } = await supabase
        .from('tracked_jobs')
        .insert({
          clerk_id: user.id,
          title: job.title,
          company: job.company,
          location: job.location,
          job_type: finalJobType,
          salary: finalSalary || null,
          posted_date: job.posted || null,
          description: finalDescription,
          apply_url: job.applyUrl,
          skills: job.skills || [],
          status: 'saved',
        })
        .select()
        .single();
      
      if (trackError) throw trackError;
      
      let resumeId = null;
      let coverLetterId = null;
      
      if (generateResume) {
        const resumeRes = await fetch('/api/jobs/tailor-resume', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jobDescription: job.description,
            jobTitle: job.title,
            company: job.company,
          }),
        });
        
        if (resumeRes.ok) {
          const resumeData = await resumeRes.json();
          resumeId = resumeData.resumeId;
        }
      }
      
      if (generateCoverLetter) {
        const clRes = await fetch('/api/jobs/tailor-cover-letter', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jobDescription: job.description,
            jobTitle: job.title,
            company: job.company,
          }),
        });
        
        if (clRes.ok) {
          const clData = await clRes.json();
          coverLetterId = clData.coverLetterId;
        }
      }
      
      if (resumeId || coverLetterId) {
        await supabase
          .from('tracked_jobs')
          .update({
            tailored_resume_id: resumeId,
            tailored_cover_letter_id: coverLetterId,
          })
          .eq('id', trackedJob.id);
      }

      // Calculate match percentage after generating content
      let matchCalculated = false;
      if (resumeId || coverLetterId) {
        try {
          console.log('Starting match calculation for job:', trackedJob.id);
          const matchResponse = await fetch('/api/jobs/calculate-match', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ jobId: trackedJob.id }),
          });

          console.log('Match calculation response status:', matchResponse.status);

          if (matchResponse.ok) {
            const matchData = await matchResponse.json();
            console.log(`Match percentage calculated: ${matchData.percentage}%`, matchData);
            matchCalculated = true;
          } else {
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
      }
      
      // Small delay to ensure database has been updated
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const message = matchCalculated
        ? '🎉 Awesome! Job saved with your tailored resume and match score!'
        : '✨ Great! Job saved with tailored content! Check My Jobs for your match score.';
      alert(message);
      setTailorModal(null);
      setGenerateResume(true);
      setGenerateCoverLetter(true);
    } catch (err) {
      console.error('Error creating tailored content:', err);
      alert('Failed to create tailored content. Please try again.');
    } finally {
      setTailoring(false);
    }
  };

  if (!isLoaded) {
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
                <Briefcase className="h-8 w-8 text-accent" />
              </div>
            </div>
            <h1 className="mb-2 text-2xl font-bold text-foreground">
              Find Your Dream Role! 🚀
            </h1>
            <p className="mb-8 text-muted-foreground">
              Sign in to discover jobs you'll love and track your applications
            </p>
            <SignInButton mode="modal">
              <button className="w-full rounded-lg gradient-primary px-6 py-3 font-bold text-white hover:opacity-90 transition-opacity shadow-lg">
                Sign In & Start Searching ✨
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
            <h1 className="text-3xl font-bold text-foreground">Find Jobs 🎯</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Discover roles you'll love and get matched instantly!
            </p>
          </div>

          {/* Search Filters */}
          <div className="mb-6 rounded-xl border border-border bg-card p-6">
            <div className="mb-4">
              <label htmlFor="job-query" className="text-xs font-medium text-muted">
                What kind of role excites you?
              </label>
              <input
                id="job-query"
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g. Product Manager, AI Engineer, Marketing Lead"
                className="mt-1 w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>

            <div className="flex flex-wrap gap-6">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={remoteOnly}
                  onChange={(e) => setRemoteOnly(e.target.checked)}
                  className="h-4 w-4 rounded border-border text-accent focus:ring-accent"
                />
                <span className="text-sm font-medium text-foreground">Remote only</span>
              </label>
              
              <div className="flex flex-col gap-1">
                <label htmlFor="job-country" className="text-xs font-medium text-muted">
                  Working from (country)
                </label>
                <input
                  id="job-country"
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="e.g. Brazil, United States"
                  className="w-48 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-muted">Resume for matching</span>
                <div className="flex items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".txt,.md,.pdf"
                    onChange={handleFileChange}
                    className="hidden"
                    id="resume-upload"
                  />
                  <label
                    htmlFor="resume-upload"
                    className="flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground hover:border-accent hover:bg-card transition-colors"
                  >
                    {extractingResume ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                    {extractingResume ? 'Reading...' : 'Upload (.txt, .md, .pdf)'}
                  </label>
                  {resumeFileName && (
                    <span className="flex items-center gap-2 text-sm text-muted">
                      <FileText className="h-4 w-4" />
                      {resumeFileName}
                      <button
                        type="button"
                        onClick={clearResume}
                        className="rounded p-0.5 text-muted hover:bg-muted hover:text-foreground"
                        aria-label="Remove resume"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </span>
                  )}
                </div>
                {fileError && <p className="text-xs text-red-400">{fileError}</p>}
              </div>
            </div>

            <button
              type="button"
              onClick={fetchJobs}
              disabled={loading}
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-accent px-6 py-3 font-semibold text-accent-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Search className="h-5 w-5" />
              )}
              {loading ? 'Searching...' : 'Find Jobs'}
            </button>
          </div>

          {/* Results */}
          <div ref={resultsRef}>
            {error && (
              <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}

            {searchDone && !loading && jobs.length === 0 && (
              <div className="rounded-xl border border-border bg-card p-12 text-center">
                <Briefcase className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  No jobs found. Try different search criteria.
                </p>
              </div>
            )}

            <div className="grid gap-6 md:grid-cols-2">
              {jobs.map((job) => (
                <div
                  key={job.id}
                  className="rounded-xl border border-border bg-card p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground text-lg">{job.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{job.company}</p>
                    </div>
                    {job.applyUrl && job.applyUrl !== '#' && (
                      <a
                        href={job.applyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex shrink-0 items-center gap-1 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:border-accent hover:bg-accent/5 transition-colors"
                      >
                        Apply
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground mb-4">
                    {job.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {job.location}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Briefcase className="h-3 w-3" />
                      {job.type}
                    </span>
                    {job.posted && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {job.posted}
                      </span>
                    )}
                    {job.salary && (
                      <span className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        {job.salary}
                      </span>
                    )}
                  </div>

                  {job.skills && job.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {job.skills.map((skill) => (
                        <span
                          key={skill}
                          className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}

                  <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                    {job.description}
                  </p>

                  <button
                    onClick={() => setTailorModal({ job, show: true })}
                    className="w-full flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground hover:opacity-90 transition-opacity"
                  >
                    <Sparkles className="h-4 w-4" />
                    Create Tailored Content
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Tailor Content Modal */}
      {tailorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setTailorModal(null)}>
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  Create Tailored Content
                </h3>
                <p className="mt-1 text-sm text-muted">
                  {tailorModal.job.title} at {tailorModal.job.company}
                </p>
              </div>
              <button
                onClick={() => setTailorModal(null)}
                className="rounded-lg p-1 text-muted hover:bg-muted/50 hover:text-foreground transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-3 mb-6">
              <p className="text-sm text-muted-foreground">
                We'll fetch the complete job description from the posting URL to ensure your tailored content is accurate. Then select what to generate:
              </p>
              
              <label className="flex items-start gap-3 rounded-lg border border-border bg-background p-3 cursor-pointer hover:border-accent/50 transition-colors">
                <input
                  type="checkbox"
                  checked={generateResume}
                  onChange={(e) => setGenerateResume(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-border text-accent focus:ring-accent focus:ring-offset-0"
                />
                <div className="flex-1">
                  <div className="font-medium text-foreground">Tailored Resume</div>
                  <div className="text-xs text-muted-foreground">Generate a resume optimized for this role</div>
                </div>
              </label>
              
              <label className="flex items-start gap-3 rounded-lg border border-border bg-background p-3 cursor-pointer hover:border-accent/50 transition-colors">
                <input
                  type="checkbox"
                  checked={generateCoverLetter}
                  onChange={(e) => setGenerateCoverLetter(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-border text-accent focus:ring-accent focus:ring-offset-0"
                />
                <div className="flex-1">
                  <div className="font-medium text-foreground">Cover Letter</div>
                  <div className="text-xs text-muted-foreground">Generate a personalized cover letter</div>
                </div>
              </label>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setTailorModal(null)}
                className="flex-1 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted/50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTailoredContent}
                disabled={tailoring || (!generateResume && !generateCoverLetter)}
                className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {tailoring ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    Create & Save Job
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
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
