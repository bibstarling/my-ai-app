'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useUser, SignInButton } from '@clerk/nextjs';
import { Loader2, MessageSquare, Send, ArrowLeft, Bot, Plus, Trash2, Menu, X } from 'lucide-react';
import { HelpButton } from '@/app/components/HelpButton';
import { PageTour } from '@/app/components/PageTour';
import { getPageTour } from '@/lib/page-tours';
import { useNotification } from '@/app/hooks/useNotification';

type Message = {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
};

type Conversation = {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
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

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [showPageTour, setShowPageTour] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { showError, showSuccess, confirm } = useNotification();
  
  const pageTour = getPageTour('ai-coach');

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load conversations on mount
  useEffect(() => {
    if (user) {
      loadConversations();
    }
  }, [user]);

  // Load messages when active conversation changes
  useEffect(() => {
    if (activeConversationId) {
      loadMessages(activeConversationId);
    } else {
      setMessages([]);
    }
  }, [activeConversationId]);

  const loadConversations = async () => {
    try {
      setLoadingConversations(true);
      const response = await fetch('/api/chat/conversations');
      const data = await response.json();
      
      if (data.error) {
        showError(data.error);
      } else {
        setConversations(data.conversations || []);
        
        // If no active conversation and conversations exist, select the first one
        if (!activeConversationId && data.conversations && data.conversations.length > 0) {
          setActiveConversationId(data.conversations[0].id);
        }
      }
    } catch (error) {
      showError('Failed to load conversations');
    } finally {
      setLoadingConversations(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      const response = await fetch(`/api/chat/conversations/${conversationId}/messages`);
      const data = await response.json();
      
      if (data.error) {
        showError(data.error);
      } else {
        setMessages(data.messages || []);
      }
    } catch (error) {
      showError('Failed to load messages');
    }
  };

  const createNewConversation = async () => {
    try {
      const response = await fetch('/api/chat/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'New Conversation' }),
      });
      
      const data = await response.json();
      
      if (data.error) {
        showError(data.error);
      } else {
        setConversations(prev => [data.conversation, ...prev]);
        setActiveConversationId(data.conversation.id);
        showSuccess('New conversation created');
      }
    } catch (error) {
      showError('Failed to create conversation');
    }
  };

  const deleteConversation = async (conversationId: string) => {
    const confirmed = await confirm(
      'Are you sure you want to delete this conversation? This action cannot be undone.',
      { confirmText: 'Delete', cancelText: 'Cancel' }
    );
    
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/chat/conversations?id=${conversationId}`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (data.error) {
        showError(data.error);
      } else {
        setConversations(prev => prev.filter(c => c.id !== conversationId));
        if (activeConversationId === conversationId) {
          const remaining = conversations.filter(c => c.id !== conversationId);
          setActiveConversationId(remaining.length > 0 ? remaining[0].id : null);
        }
        showSuccess('Conversation deleted');
      }
    } catch (error) {
      showError('Failed to delete conversation');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    
    // Optimistically add user message to UI
    const optimisticUserMsg: Message = { role: 'user', content: userMessage };
    setMessages(prev => [...prev, optimisticUserMsg]);
    setLoading(true);

    try {
      // If no active conversation, create one
      let conversationId = activeConversationId;
      if (!conversationId) {
        const createResponse = await fetch('/api/chat/conversations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: userMessage.substring(0, 50) + (userMessage.length > 50 ? '...' : '') }),
        });
        const createData = await createResponse.json();
        if (createData.conversation) {
          conversationId = createData.conversation.id;
          setActiveConversationId(conversationId);
          setConversations(prev => [createData.conversation, ...prev]);
        }
      }

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ 
          message: userMessage,
          conversationId: conversationId,
          messages: messages.map(m => ({ role: m.role, content: m.content })),
        }),
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
        
        // Refresh conversation list to update timestamps
        loadConversations();
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
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-80' : 'w-0'} transition-all duration-300 border-r border-border bg-card flex flex-col overflow-hidden`}>
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Conversations
          </h2>
          <button
            onClick={createNewConversation}
            className="p-2 rounded-lg bg-accent text-accent-foreground hover:opacity-90 transition-opacity"
            title="New conversation"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2">
          {loadingConversations ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-6 w-6 animate-spin text-accent" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center text-muted-foreground text-sm py-8 px-4">
              No conversations yet. Start a new one!
            </div>
          ) : (
            <div className="space-y-1">
              {conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className={`group flex items-center gap-2 p-3 rounded-lg cursor-pointer transition-colors ${
                    activeConversationId === conversation.id
                      ? 'bg-accent/10 border border-accent/20'
                      : 'hover:bg-muted/50'
                  }`}
                  onClick={() => setActiveConversationId(conversation.id)}
                >
                  <MessageSquare className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {conversation.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(conversation.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteConversation(conversation.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/10 transition-all"
                    title="Delete conversation"
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <div className="flex flex-col h-screen">
          {/* Header */}
          <div className="border-b border-border bg-card px-6 py-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="rounded-lg border border-border bg-card p-2 hover:border-accent hover:bg-card/80 transition-colors lg:hidden"
              >
                {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
              <Link
                href="/assistant"
                className="rounded-lg border border-border bg-card p-2 hover:border-accent hover:bg-card/80 transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-foreground" />
              </Link>
              <div className="flex items-center gap-3 flex-1">
                <Bot className="w-8 h-8 text-accent" />
                <div>
                  <h1 className="text-xl font-bold text-foreground">AI Career Coach</h1>
                  <p className="text-xs text-muted-foreground">
                    Personalized guidance based on your profile
                  </p>
                </div>
              </div>
              <Link
                href="/portfolio/builder"
                className="text-sm text-accent hover:underline hidden sm:flex items-center gap-1"
              >
                Update profile
              </Link>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 bg-background">
            <div className="mx-auto max-w-4xl">
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
                      key={message.id || index}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg px-4 py-3 shadow-md transition-all hover-lift ${
                          message.role === 'user'
                            ? 'bg-accent text-accent-foreground'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{message.content}</p>
                      </div>
                    </div>
                  ))}
                  {loading && (
                    <div className="flex justify-start">
                      <div className="max-w-[80%] rounded-lg px-4 py-3 bg-gray-100">
                        <Loader2 className="h-5 w-5 animate-spin text-accent" />
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>
          </div>

          {/* Input */}
          <div className="border-t border-border bg-card p-6">
            <form onSubmit={handleSubmit} className="mx-auto max-w-4xl flex gap-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message..."
                disabled={loading}
                className="flex-1 rounded-lg border border-border bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50"
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
        </div>
      </div>

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
