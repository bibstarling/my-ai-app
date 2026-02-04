'use client';

import { useState, useRef, useEffect } from 'react';
import { SignedIn, SignedOut, SignInButton, useUser } from '@clerk/nextjs';
import { SiteHeader } from '@/components/site-header';
import { Send, Loader2, Bot, User, Briefcase, FileText, Lightbulb, Plus, Trash2 } from 'lucide-react';

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
    prompt: 'Help me analyze a job posting and craft a tailored approach. What information do you need from me?',
  },
  {
    icon: <FileText className="h-4 w-4" />,
    label: 'Cover Letter Draft',
    prompt: 'I need help drafting a cover letter. Ask me about the role and company, then help me write something compelling.',
  },
  {
    icon: <Lightbulb className="h-4 w-4" />,
    label: 'Interview Prep',
    prompt: 'Help me prepare for an interview. Start by asking me about the company, role, and what stage of the interview process I\'m in.',
  },
];

export default function AssistantPage() {
  const { user, isLoaded } = useUser();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isAdmin = user?.primaryEmailAddress?.emailAddress === 'bibstarling@gmail.com';

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
        { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  const handleQuickAction = (prompt: string) => {
    const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
    handleSubmit(fakeEvent, prompt);
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
      <SiteHeader />
      
      <main className="flex flex-1 flex-col pt-16">
        <SignedOut>
          <div className="flex flex-1 items-center justify-center">
            <div className="text-center">
              <h1 className="mb-4 text-3xl font-bold text-foreground">Personal Assistant</h1>
              <p className="mb-8 text-muted">This area is private. Please sign in to continue.</p>
              <SignInButton mode="modal">
                <button className="rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground hover:opacity-90 transition-opacity">
                  Sign In
                </button>
              </SignInButton>
            </div>
          </div>
        </SignedOut>

        <SignedIn>
          {!isAdmin ? (
            <div className="flex flex-1 items-center justify-center">
              <div className="text-center">
                <h1 className="mb-4 text-3xl font-bold text-foreground">Access Restricted</h1>
                <p className="text-muted">This area is private and not available for public access.</p>
              </div>
            </div>
          ) : (
            <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-6 py-8">
              {/* Header */}
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-foreground">Personal Assistant</h1>
                  <p className="text-sm text-muted">Your private AI workspace for job search and productivity</p>
                </div>
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

              {/* Chat Area */}
              <div className="flex flex-1 flex-col rounded-lg border border-border bg-card">
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-6">
                  {messages.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center">
                      <Bot className="mb-4 h-12 w-12 text-muted-foreground" />
                      <h2 className="mb-2 text-lg font-semibold text-foreground">How can I help today?</h2>
                      <p className="mb-8 text-center text-sm text-muted">
                        I can help with job applications, cover letters, interview prep, and more.
                      </p>
                      
                      {/* Quick Actions */}
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
                            <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
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

                {/* Input */}
                <div className="border-t border-border p-4">
                  <form onSubmit={handleSubmit} className="flex gap-3">
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

              {/* Quick Actions Bar (when in conversation) */}
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
          )}
        </SignedIn>
      </main>
    </div>
  );
}
