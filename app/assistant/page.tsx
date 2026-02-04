'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  SignInButton,
  SignedIn,
  SignedOut,
  UserButton,
  useUser,
} from '@clerk/nextjs';
import { useEmbedMode } from '../ClientAuthWrapper';
import { supabase } from '@/lib/supabase';
import {
  Send,
  Loader2,
  Bot,
  User,
  Briefcase,
  FileText,
  Lightbulb,
  Plus,
  Trash2,
  ArrowLeft,
  Shield,
  Search,
  MessageSquare,
  ExternalLink,
  MapPin,
  Clock,
  DollarSign,
  Upload,
  X,
} from 'lucide-react';

type AssistantTool = 'assistant' | 'jobs';

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

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

type QuickAction = {
  icon: React.ReactNode;
  label: string;
  prompt: string;
};

const quickActions: QuickAction[] = [
  {
    icon: <Briefcase className="h-4 w-4" />,
    label: 'Job Search Help',
    prompt:
      'Help me analyze a job posting and craft a tailored approach. What information do you need from me?',
  },
  {
    icon: <FileText className="h-4 w-4" />,
    label: 'Cover Letter Draft',
    prompt:
      "I need help drafting a cover letter. Ask me about the role and company, then help me write something compelling.",
  },
  {
    icon: <Lightbulb className="h-4 w-4" />,
    label: 'Interview Prep',
    prompt:
      "Help me prepare for an interview. Start by asking me about the company, role, and what stage of the interview process I'm in.",
  },
];

const ADMIN_EMAIL = 'bibstarling@gmail.com';

const TOOLS: { id: AssistantTool; label: string; icon: React.ReactNode }[] = [
  { id: 'assistant', label: 'Assistant', icon: <MessageSquare className="h-4 w-4" /> },
  { id: 'jobs', label: 'Job scraping', icon: <Search className="h-4 w-4" /> },
];

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
    const pdfjsLib = await import('pdfjs-dist');
    if (typeof window !== 'undefined' && pdfjsLib.GlobalWorkerOptions) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@5.4.624/build/pdf.worker.min.mjs';
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
  }
  throw new Error('Unsupported format. Use .txt, .md, or .pdf');
}

function JobScrapingPanel() {
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [country, setCountry] = useState('');
  const [resumeText, setResumeText] = useState('');
  const [resumeFileName, setResumeFileName] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [extractingResume, setExtractingResume] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

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
    } catch {
      setFileError('Could not read file. Try .txt or .md.');
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

  const [searchDone, setSearchDone] = useState(false);

  const fetchJobs = async () => {
    setLoading(true);
    setError(null);
    setSearchDone(false);
    try {
      const body = JSON.stringify({
        remoteOnly,
        country: country.trim() || undefined,
        resumeText: resumeText.trim() || undefined,
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
      if (Array.isArray(data.jobs)) {
        setJobs(data.jobs);
        if (data.error) setError(data.error);
      } else {
        setJobs([]);
        setError(data.error || 'No jobs in response');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load jobs');
      setJobs([]);
      setSearchDone(true);
    } finally {
      setLoading(false);
      resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };

  return (
    <div className="flex flex-1 flex-col">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-foreground">Job scraping</h2>
        <p className="text-sm text-muted mt-1">
          Find roles that match your resume or your portfolio (main page).
        </p>

        <div className="mt-4 flex flex-wrap gap-6 rounded-xl border border-border bg-card/50 p-4">
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
                className="flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground hover:border-accent hover:bg-card transition-colors disabled:opacity-50"
              >
                {extractingResume ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                {extractingResume ? 'Reading...' : 'Upload resume (.txt, .md, .pdf)'}
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
            {!resumeFileName && (
              <p className="text-xs text-muted">Optional. If not set, we use your main page profile.</p>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={fetchJobs}
          disabled={loading}
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
          {loading ? 'Searching...' : 'Find jobs matching my resume'}
        </button>
        {searchDone && !loading && (
          <p className="mt-3 text-sm text-muted">
            {error ? 'Search completed with an issue.' : jobs.length > 0 ? `${jobs.length} job${jobs.length === 1 ? '' : 's'} found.` : 'No jobs found. Try changing filters or leave country blank.'}
          </p>
        )}
      </div>
      {error && (
        <p className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</p>
      )}
      <div ref={resultsRef} className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
        {jobs.map((job) => (
          <article
            key={job.id}
            className="flex flex-col rounded-xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold text-foreground">{job.title}</h3>
                <p className="text-sm text-muted mt-0.5">{job.company}</p>
              </div>
              <a
                href={job.applyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex shrink-0 items-center gap-1 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:border-accent hover:bg-accent/5 transition-colors"
              >
                Apply
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
              {job.location && (
                <li className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {job.location}
                </li>
              )}
              <li className="flex items-center gap-1">
                <Briefcase className="h-3 w-3" />
                {job.type}
              </li>
              {job.posted && (
                <li className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {job.posted}
                </li>
              )}
              {job.salary && (
                <li className="flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  {job.salary}
                </li>
              )}
            </ul>
            {job.skills?.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {job.skills.map((s) => (
                  <span
                    key={s}
                    className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                  >
                    {s}
                  </span>
                ))}
              </div>
            )}
            <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">
              {job.description}
            </p>
          </article>
        ))}
      </div>
      {!loading && jobs.length === 0 && !error && (
        <p className="text-sm text-muted">Click the button above to find jobs matching your resume.</p>
      )}
    </div>
  );
}

function AssistantEmbedFallback() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 py-12 bg-background">
      <p className="text-muted-foreground text-center max-w-md">
        Sign-in and the assistant are not available in the embedded preview. Open this page in a new tab to use your personal space.
      </p>
      <Link href="/" className="mt-6 text-sm text-accent hover:underline">
        Back to portfolio
      </Link>
    </main>
  );
}

function AssistantContent() {
  const { user, isLoaded } = useUser();
  const [activeTool, setActiveTool] = useState<AssistantTool>('assistant');
  const [synced, setSynced] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isAdmin = user?.primaryEmailAddress?.emailAddress === ADMIN_EMAIL;

  useEffect(() => {
    if (!user || synced) return;
    const sync = async () => {
      const { data } = await supabase
        .from('users')
        .select('id')
        .eq('clerk_id', user.id)
        .limit(1)
        .maybeSingle();
      if (!data) {
        await supabase.from('users').insert({
          email: user.primaryEmailAddress?.emailAddress ?? undefined,
          clerk_id: user.id,
          approved: false,
        });
      }
      setSynced(true);
    };
    sync();
  }, [user, synced]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  const handleSubmit = async (e: React.FormEvent, customPrompt?: string) => {
    e.preventDefault();
    const messageText = customPrompt || input;
    if (!messageText.trim() || loading) return;

    const userMessage: Message = { role: 'user', content: messageText };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageText }),
      });

      const data = await res.json();

      if (data.error) {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: `Error: ${data.error}` },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: data.response },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, something went wrong. Please try again.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => setMessages([]);
  const handleQuickAction = (prompt: string) => {
    handleSubmit({ preventDefault: () => {} } as React.FormEvent, prompt);
  };

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SignedOut>
        <main className="flex flex-1 flex-col items-center justify-center px-6 py-12">
          <div className="w-full max-w-md text-center">
            <div className="mb-6 flex justify-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent/10">
                <Bot className="h-8 w-8 text-accent" />
              </div>
            </div>
            <h1 className="mb-2 text-2xl font-bold text-foreground">
              Personal space
            </h1>
            <p className="mb-8 text-muted-foreground">
              Sign in to use your private assistant: chat, job search help, cover
              letters, and interview prep.
            </p>
            <SignInButton mode="modal">
              <button className="w-full rounded-lg bg-accent px-6 py-3 font-semibold text-accent-foreground hover:opacity-90 transition-opacity">
                Sign in to continue
              </button>
            </SignInButton>
            <p className="mt-6">
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-accent transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to portfolio
              </Link>
            </p>
          </div>
        </main>
      </SignedOut>

      <SignedIn>
        <div className="flex min-h-screen w-full">
          {/* Left sidebar - Tools menu */}
          <aside className="flex w-56 shrink-0 flex-col border-r border-border bg-card/50 py-6 pl-6 pr-4">
            <nav className="flex flex-col gap-1">
              {TOOLS.map((tool) => (
                <button
                  key={tool.id}
                  type="button"
                  onClick={() => setActiveTool(tool.id)}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                    activeTool === tool.id
                      ? 'bg-accent/10 text-accent'
                      : 'text-muted hover:bg-muted/50 hover:text-foreground'
                  }`}
                >
                  {tool.icon}
                  {tool.label}
                </button>
              ))}
            </nav>
            <div className="mt-auto pt-6">
              <Link
                href="/"
                className="flex items-center gap-2 text-sm text-muted hover:text-accent transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to portfolio
              </Link>
            </div>
          </aside>

          <main className="flex min-w-0 flex-1 flex-col">
            <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-6 py-8">
              {/* Header */}
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div>
                    <h1 className="text-2xl font-bold text-foreground">
                      {activeTool === 'assistant' ? 'Personal Assistant' : 'Job scraping'}
                    </h1>
                    <p className="text-sm text-muted">
                      {activeTool === 'assistant' ? 'Your private AI workspace' : 'Roles matched to your resume'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {isAdmin && (
                    <Link
                      href="/admin"
                      className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground hover:border-accent/50 hover:bg-card/80 transition-colors"
                    >
                      <Shield className="h-4 w-4 text-accent" />
                      Admin
                    </Link>
                  )}
                  <UserButton
                    afterSignOutUrl="/assistant"
                    appearance={{
                      elements: {
                        avatarBox: 'h-9 w-9',
                      },
                    }}
                  />
                  {activeTool === 'assistant' && messages.length > 0 && (
                    <button
                      onClick={clearChat}
                      className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-muted hover:text-foreground hover:bg-card transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {activeTool === 'jobs' && <JobScrapingPanel />}

              {activeTool === 'assistant' && (
            <>
            {/* Chat Area */}
            <div className="flex flex-1 flex-col rounded-lg border border-border bg-card">
              <div className="flex-1 overflow-y-auto p-6">
                {messages.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center">
                    <Bot className="mb-4 h-12 w-12 text-muted-foreground" />
                    <h2 className="mb-2 text-lg font-semibold text-foreground">
                      How can I help today?
                    </h2>
                    <p className="mb-8 text-center text-sm text-muted">
                      I can help with job applications, cover letters, interview
                      prep, and more.
                    </p>
                    <div className="flex flex-wrap justify-center gap-3">
                      {quickActions.map((action, index) => (
                        <button
                          key={index}
                          onClick={() => handleQuickAction(action.prompt)}
                          className="flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm text-foreground hover:border-accent/50 hover:bg-card transition-colors"
                        >
                          {action.icon}
                          {action.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {messages.map((message, index) => (
                      <div
                        key={index}
                        className={`flex gap-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        {message.role === 'assistant' && (
                          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-accent/10">
                            <Bot className="h-4 w-4 text-accent" />
                          </div>
                        )}
                        <div
                          className={`max-w-[80%] rounded-lg px-4 py-3 ${
                            message.role === 'user'
                              ? 'bg-accent text-accent-foreground'
                              : 'bg-background text-foreground'
                          }`}
                        >
                          <p className="whitespace-pre-wrap text-sm leading-relaxed">
                            {message.content}
                          </p>
                        </div>
                        {message.role === 'user' && (
                          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-muted-foreground/20">
                            <User className="h-4 w-4 text-foreground" />
                          </div>
                        )}
                      </div>
                    ))}
                    {loading && (
                      <div className="flex gap-4">
                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-accent/10">
                          <Bot className="h-4 w-4 text-accent" />
                        </div>
                        <div className="rounded-lg bg-background px-4 py-3">
                          <Loader2 className="h-4 w-4 animate-spin text-muted" />
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              <div className="border-t border-border p-4">
                <form
                  onSubmit={(e) => handleSubmit(e)}
                  className="flex gap-3"
                >
                  <div className="relative flex-1">
                    <textarea
                      ref={textareaRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSubmit(e);
                        }
                      }}
                      placeholder="Ask me anything..."
                      className="w-full resize-none rounded-lg border border-border bg-background px-4 py-3 pr-12 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                      rows={1}
                      disabled={loading}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading || !input.trim()}
                    className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </button>
                </form>
                <p className="mt-2 text-center text-xs text-muted-foreground">
                  Press Enter to send, Shift+Enter for new line
                </p>
              </div>
            </div>

            {messages.length > 0 && (
              <div className="mt-4 flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Quick:</span>
                {quickActions.map((action, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuickAction(action.prompt)}
                    disabled={loading}
                    className="flex items-center gap-1 rounded-full border border-border px-3 py-1 text-xs text-muted hover:text-foreground hover:border-accent/50 transition-colors disabled:opacity-50"
                  >
                    <Plus className="h-3 w-3" />
                    {action.label}
                  </button>
                ))}
              </div>
            )}
            </>
              )}
          </div>
        </main>
        </div>
      </SignedIn>
    </div>
  );
}

export default function AssistantPage() {
  const [mounted, setMounted] = useState(false);
  const embedMode = useEmbedMode();
  useEffect(() => setMounted(true), []);
  if (!mounted) return <AssistantContent />;
  if (embedMode) return <AssistantEmbedFallback />;
  return <AssistantContent />;
}
