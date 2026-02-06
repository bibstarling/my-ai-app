'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useUser, SignInButton } from '@clerk/nextjs';
import { Loader2, MessageSquare, Send, ArrowLeft, Bot } from 'lucide-react';
import { HelpButton } from '@/app/components/HelpButton';
import { PageTour } from '@/app/components/PageTour';
import { getPageTour } from '@/lib/page-tours';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

export default function ChatPage() {
  let user = null;
  let isLoaded = false;
  
  try {
    const clerkData = useUser();
    user = clerkData.user;
    isLoaded = clerkData.isLoaded;
  } catch (e) {
    isLoaded = true;
  }

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPageTour, setShowPageTour] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const pageTour = getPageTour('ai-coach');

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ message: userMessage }),
      });

      const data = await response.json();

      if (data.error) {
        setMessages(prev => [
          ...prev,
          { role: 'assistant', content: `Error: ${data.error}` },
        ]);
      } else {
        setMessages(prev => [
          ...prev,
          { role: 'assistant', content: data.response },
        ]);
      }
    } catch (error) {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' },
      ]);
    } finally {
      setLoading(false);
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
                <MessageSquare className="h-8 w-8 text-accent" />
              </div>
            </div>
            <h1 className="mb-2 text-2xl font-bold text-foreground flex items-center gap-2 justify-center">
              <Bot className="w-7 h-7 text-accent" />
              Your AI Career Coach
            </h1>
            <p className="mb-8 text-muted-foreground">
              Sign in to get personalized career guidance and interview preparation
            </p>
            <SignInButton mode="modal">
              <button className="w-full rounded-lg gradient-primary px-6 py-3 font-bold text-white hover:opacity-90 transition-all shadow-lg button-bounce flex items-center justify-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Start Conversation
              </button>
            </SignInButton>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <main className="flex-1 flex flex-col">
        <div className="mx-auto w-full max-w-4xl px-6 py-8 flex flex-col h-screen">
          {/* Header */}
          <div className="mb-6 flex items-center gap-4">
            <Link
              href="/assistant"
              className="rounded-lg border border-border bg-card p-2 hover:border-accent hover:bg-card/80 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-foreground" />
            </Link>
            <div className="flex items-center gap-3 flex-1">
              <Bot className="w-8 h-8 text-accent" />
              <div>
                <h1 className="text-2xl font-bold text-foreground">AI Career Coach</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Personalized guidance based on your professional profile
                </p>
              </div>
            </div>
            <Link
              href="/portfolio/builder"
              className="text-sm text-accent hover:underline flex items-center gap-1"
            >
              Update profile
            </Link>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto mb-6 rounded-xl border border-border bg-card p-6">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="rounded-full bg-accent/10 p-6 mb-4 animate-bounce-in">
                  <MessageSquare className="h-12 w-12 text-accent" />
                </div>
                <h2 className="text-xl font-semibold text-foreground mb-2">
                  How can I help you today?
                </h2>
                <p className="text-muted-foreground max-w-md mb-4">
                  Ask me about job search strategies, interview preparation, cover letters, or career advice
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800 max-w-md">
                  💡 I have access to your professional profile and can provide personalized guidance based on your experience, skills, and career goals.
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg px-4 py-3 shadow-md transition-all hover-lift ${
                        message.role === 'user'
                          ? 'bg-accent text-accent-foreground'
                          : 'bg-muted text-foreground'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-start">
                    <div className="max-w-[80%] rounded-lg px-4 py-3 bg-muted">
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              disabled={loading}
              className="flex-1 rounded-lg border border-border bg-card px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="rounded-lg bg-accent px-6 py-3 font-semibold text-accent-foreground hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="h-5 w-5" />
            </button>
          </form>
        </div>
      </main>

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
