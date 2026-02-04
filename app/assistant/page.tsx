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
} from 'lucide-react';

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
          approved: true,
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
        <main className="flex flex-1 flex-col">
          <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-6 py-8">
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link
                  href="/"
                  className="flex items-center gap-2 text-sm text-muted hover:text-accent transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Link>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">
                    Personal Assistant
                  </h1>
                  <p className="text-sm text-muted">
                    Your private AI workspace
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
                {messages.length > 0 && (
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
          </div>
        </main>
      </SignedIn>
    </div>
  );
}

export default function AssistantPage() {
  const embedMode = useEmbedMode();
  if (embedMode) return <AssistantEmbedFallback />;
  return <AssistantContent />;
}
