'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { 
  X, 
  Send, 
  Sparkles, 
  Loader2,
  Command,
  Briefcase,
  FileText,
  MessageSquare,
  Search,
  Plus,
} from 'lucide-react';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface GlobalAIAssistantProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GlobalAIAssistant({ isOpen, onClose }: GlobalAIAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const pathname = usePathname();

  // Auto-focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Close on Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Welcome message
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{
        role: 'assistant',
        content: `👋 Hi! I'm your **AI Career Assistant**.\n\nI can help you with:\n• 🔍 **Finding jobs** - "Find remote React jobs"\n• 📄 **Creating resumes** - "Generate a resume for this job"\n• ✉️ **Writing cover letters** - "Write a cover letter for [company]"\n• 💼 **Managing applications** - "Add this job to my pipeline"\n• 📝 **Updating your profile** - "Add my latest project"\n• 🤖 **Career advice** - "How should I prepare for interviews?"\n\nWhat can I help you with?`,
      }]);
    }
  }, [isOpen, messages.length]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      // Send to AI chat endpoint with context
      const res = await fetch('/api/assistant/global', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          message: userMessage,
          context: {
            currentPath: pathname,
            previousMessages: messages.slice(-4), // Last 2 exchanges
          },
        }),
      });

      const data = await res.json();

      if (data.success) {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: data.message 
        }]);

        // Handle actions
        if (data.action) {
          await handleAction(data.action);
        }
      } else {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: `Sorry, I encountered an error: ${data.error}` 
        }]);
      }
    } catch (error) {
      console.error('Assistant error:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error. Please try again.' 
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action: any) => {
    switch (action.type) {
      case 'navigate':
        setMessages(prev => [...prev, { 
          role: 'system', 
          content: `📍 Navigating to ${action.label}...` 
        }]);
        setTimeout(() => {
          router.push(action.path);
          onClose();
        }, 1000);
        break;

      case 'create_job':
        setMessages(prev => [...prev, { 
          role: 'system', 
          content: `✅ Job added to your pipeline!` 
        }]);
        break;

      case 'generate_resume':
        setMessages(prev => [...prev, { 
          role: 'system', 
          content: `📄 Generating resume...` 
        }]);
        router.push('/resume-builder');
        setTimeout(() => onClose(), 500);
        break;

      case 'search_jobs':
        setMessages(prev => [...prev, { 
          role: 'system', 
          content: `🔍 Searching for "${action.query}"...` 
        }]);
        router.push(`/assistant/job-search?q=${encodeURIComponent(action.query)}`);
        setTimeout(() => onClose(), 500);
        break;

      default:
        break;
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
        onClick={onClose}
      />

      {/* Assistant Panel */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl h-[80vh] flex flex-col pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-primary rounded-lg">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">AI Career Assistant</h2>
                <p className="text-xs text-gray-500">Ask me anything about your career</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          {/* Quick Actions */}
          <div className="p-4 border-b border-gray-100 bg-gray-50">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setInput('Find remote React jobs')}
                className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 hover:border-accent hover:text-accent transition-colors"
              >
                <Search className="h-4 w-4" />
                Find jobs
              </button>
              <button
                onClick={() => setInput('Generate a resume')}
                className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 hover:border-accent hover:text-accent transition-colors"
              >
                <FileText className="h-4 w-4" />
                Create resume
              </button>
              <button
                onClick={() => setInput('Write a cover letter')}
                className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 hover:border-accent hover:text-accent transition-colors"
              >
                <MessageSquare className="h-4 w-4" />
                Cover letter
              </button>
              <button
                onClick={() => setInput('Add a new job posting')}
                className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 hover:border-accent hover:text-accent transition-colors"
              >
                <Plus className="h-4 w-4" />
                Track job
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 min-h-0">
            <div className="space-y-4 pb-4">
              {messages.map((message, idx) => (
                <div
                  key={idx}
                  className={`flex ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[85%] rounded-xl px-4 py-3 ${
                      message.role === 'user'
                        ? 'bg-accent text-white'
                        : message.role === 'system'
                        ? 'bg-blue-50 border border-blue-200 text-blue-900 text-sm'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 rounded-xl px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-accent" />
                      <span className="text-sm text-gray-600">Thinking...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gray-200">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask anything... (e.g., 'Find remote React jobs')"
                disabled={loading}
                className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="rounded-lg bg-accent px-6 py-3 text-white hover:bg-accent/90 disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                <Send className="h-4 w-4" />
                <span className="hidden sm:inline">Send</span>
              </button>
            </form>
            <p className="text-xs text-gray-400 mt-2 flex items-center gap-2">
              <Command className="h-3 w-3" />
              <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-200 rounded text-xs font-mono">Cmd+K</kbd> to open from anywhere
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
