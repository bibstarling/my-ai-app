'use client';

import { useState, useEffect, useRef } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import {
  Loader2,
  Send,
  Upload,
  Link as LinkIcon,
  X,
  File,
  FileText,
  ExternalLink,
  Eye,
  Globe,
  Lock,
  Check,
  MessageSquare,
  Edit3,
  Settings,
} from 'lucide-react';
import { WYSIWYGEditor } from '@/app/components/portfolio/WYSIWYGEditor';
import { convertDataToMarkdown } from '@/app/components/portfolio/markdown-utils';
import { HelpButton } from '@/app/components/HelpButton';
import { PageTour } from '@/app/components/PageTour';
import { getPageTour } from '@/lib/page-tours';

type Message = {
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata?: any;
};

type Attachment = {
  name: string;
  type: string;
  contentType: 'text' | 'image';
  content: string;
  size: number;
};

export default function PortfolioBuilderPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  
  const [portfolio, setPortfolio] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [pendingAttachments, setPendingAttachments] = useState<Attachment[]>([]);
  const [uploadProgress, setUploadProgress] = useState(false);
  const [username, setUsername] = useState('');
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  // Removed edit mode - now using WYSIWYG editor only
  const [markdownContent, setMarkdownContent] = useState('');
  const [isSavingMarkdown, setIsSavingMarkdown] = useState(false);
  const [showPageTour, setShowPageTour] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  
  const pageTour = getPageTour('portfolio-builder');

  // Initialize portfolio
  useEffect(() => {
    if (isLoaded && user) {
      initializePortfolio();
    }
  }, [isLoaded, user]);

  const initializePortfolio = async () => {
    try {
      // Initialize portfolio
      const initRes = await fetch('/api/portfolio/init', {
        method: 'POST',
      });
      const initData = await initRes.json();

      if (!initData.success) {
        throw new Error(initData.error);
      }

      // Get full portfolio data
      const currentRes = await fetch('/api/portfolio/current');
      const currentData = await currentRes.json();

      if (currentData.success) {
        setPortfolio(currentData.portfolio);
        setMessages(currentData.portfolio.messages || []);
        setUsername(currentData.portfolio.username || '');
        setIsSuperAdmin(currentData.portfolio.isSuperAdmin || false);
        
        // Initialize markdown content from portfolio data
        const portfolioData = currentData.portfolio.portfolio_data || {};
        const initialMarkdown = convertDataToMarkdown(portfolioData);
        setMarkdownContent(initialMarkdown);

        // Add welcome message if no messages
        if ((!currentData.portfolio.messages || currentData.portfolio.messages.length === 0) && initData.isNew) {
          setMessages([
            {
              role: 'assistant',
              content: `Hey there! Let's build something amazing together! 🎉\n\nI'm your AI portfolio assistant, and I'm excited to help you show off your incredible work. Here's how we can get started:\n\n✨ Tell me about your achievements and projects\n📄 Upload your resume or certificates\n🔗 Share links (GitHub, LinkedIn, articles, projects)\n📸 Paste screenshots directly (Ctrl+V or Cmd+V)\n\nYou can also edit your portfolio directly in markdown format on the right side!\n\nWhat would you like to showcase first?`,
            },
          ]);
        }
      }
    } catch (error) {
      console.error('Failed to initialize portfolio:', error);
    } finally {
      setInitializing(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle clipboard paste for images
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      if (!portfolio) return;

      const items = e.clipboardData?.items;
      if (!items) return;

      // Find image in clipboard
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        
        if (item.type.startsWith('image/')) {
          e.preventDefault();
          
          const file = item.getAsFile();
          if (!file) continue;

          // Upload the pasted image
          setUploadProgress(true);

          try {
            const formData = new FormData();
            formData.append('file', file, `pasted-image-${Date.now()}.png`);

            const res = await fetch('/api/portfolio/upload', {
              method: 'POST',
              body: formData,
            });

            const data = await res.json();

            if (data.success) {
              setPendingAttachments((prev) => [...prev, data.file]);
              setMessages((prev) => [
                ...prev,
                {
                  role: 'system',
                  content: `📎 Image pasted: ${data.file.name} (${(data.file.size / 1024).toFixed(1)}KB) - Ready to send`,
                },
              ]);
            } else {
              setMessages((prev) => [
                ...prev,
                {
                  role: 'system',
                  content: `Failed to process pasted image: ${data.error}`,
                },
              ]);
            }
          } catch (error) {
            setMessages((prev) => [
              ...prev,
              {
                role: 'assistant',
                content: 'Failed to upload pasted image. Please try again.',
              },
            ]);
          } finally {
            setUploadProgress(false);
          }
          
          break;
        }
      }
    };

    const container = chatContainerRef.current;
    if (container) {
      container.addEventListener('paste', handlePaste);
      return () => container.removeEventListener('paste', handlePaste);
    }
  }, [portfolio]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && pendingAttachments.length === 0) || loading || !portfolio) return;

    const userMessage = input.trim();
    const attachments = [...pendingAttachments];
    
    setInput('');
    setPendingAttachments([]);
    
    // Show user message with attachment count
    let displayMessage = userMessage;
    if (attachments.length > 0) {
      displayMessage += `\n\n📎 ${attachments.length} file(s) attached`;
    }
    setMessages((prev) => [...prev, { role: 'user', content: displayMessage }]);
    setLoading(true);

    try {
      const res = await fetch('/api/portfolio/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          portfolioId: portfolio.id,
          attachments,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: data.response },
        ]);
        
        // Update portfolio data for preview
        if (data.portfolioData) {
          setPortfolio((prev: any) => ({
            ...prev,
            portfolio_data: data.portfolioData,
          }));
          
          // If in markdown mode, update markdown content from new portfolio data
          if (editMode === 'markdown') {
            const updatedMarkdown = convertDataToMarkdown(data.portfolioData);
            setMarkdownContent(updatedMarkdown);
          }
        }
      } else {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: `Error: ${data.error}` },
        ]);
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !portfolio) return;

    setUploadProgress(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/portfolio/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (data.success) {
        setPendingAttachments((prev) => [...prev, data.file]);
        setMessages((prev) => [
          ...prev,
          {
            role: 'system',
            content: `📎 File attached: ${data.file.name} (${data.file.type}) - ${(data.file.size / 1024).toFixed(1)}KB - Ready to send`,
          },
        ]);
      } else {
        alert(`Upload failed: ${data.error}`);
      }
    } catch (error) {
      alert('Failed to upload file');
    } finally {
      setUploadProgress(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleAddLink = async () => {
    if (!linkInput.trim() || !portfolio) return;

    setShowLinkModal(false);
    const url = linkInput.trim();
    setLinkInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/portfolio/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url,
          portfolioId: portfolio.id,
        }),
      });

      const data = await res.json();

      if (data.success && data.link) {
        setLinks((prev) => [data.link, ...prev]);
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: `I've scraped "${data.link.title || url}". ${
              data.link.aiAnalysis?.suggestedUse || 'How would you like to incorporate this into your portfolio?'
            }`,
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: data.error || 'Failed to scrape the link. You can still tell me about it manually!',
          },
        ]);
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Failed to add link. You can still tell me about it!',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleManualSave = async (portfolioData: any) => {
    if (!portfolio) return;

    const res = await fetch('/api/portfolio/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ portfolioData }),
    });

    const data = await res.json();
    if (data.success) {
      setPortfolio((prev: any) => ({
        ...prev,
        portfolio_data: portfolioData,
      }));
    } else {
      throw new Error(data.error || 'Failed to save');
    }
  };

  const handleMarkdownSave = async () => {
    if (!portfolio) return;
    
    setIsSavingMarkdown(true);
    
    try {
      // Parse markdown to structured data using AI
      const parseRes = await fetch('/api/portfolio/parse-markdown', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markdown: markdownContent }),
      });

      if (!parseRes.ok) {
        throw new Error('Failed to parse markdown');
      }

      const { portfolioData } = await parseRes.json();

      // Save the parsed portfolio data
      const saveRes = await fetch('/api/portfolio/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ portfolioData }),
      });

      const saveData = await saveRes.json();
      if (saveData.success) {
        setPortfolio((prev: any) => ({
          ...prev,
          portfolio_data: portfolioData,
        }));
        
        // Show success message
        setMessages((prev) => [
          ...prev,
          {
            role: 'system',
            content: '✅ Portfolio saved successfully!',
          },
        ]);
      } else {
        throw new Error(saveData.error || 'Failed to save');
      }
    } catch (error) {
      console.error('Failed to save markdown:', error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'system',
          content: `❌ Failed to save: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
      ]);
    } finally {
      setIsSavingMarkdown(false);
    }
  };

  const handlePublish = async () => {
    if (!portfolio) return;

    // Regular users need a username, super admin doesn't
    if (!isSuperAdmin && !username) {
      alert('Please set a username in settings before publishing');
      router.push('/settings/portfolio');
      return;
    }

    const shouldPublish = portfolio.status === 'draft';
    
    try {
      const res = await fetch('/api/portfolio/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publish: shouldPublish }),
      });

      const data = await res.json();

      if (data.success) {
        setPortfolio((prev: any) => ({ ...prev, status: data.status }));
        alert(shouldPublish ? 'Portfolio published!' : 'Portfolio unpublished');
      } else {
        alert(`Failed: ${data.error}`);
      }
    } catch (error) {
      alert('Failed to update portfolio status');
    }
  };

  const togglePrivacy = async () => {
    if (!portfolio) return;

    try {
      const res = await fetch('/api/portfolio/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublic: !portfolio.is_public }),
      });

      const data = await res.json();

      if (data.success) {
        setPortfolio((prev: any) => ({ ...prev, is_public: !prev.is_public }));
      } else {
        alert(`Failed: ${data.error}`);
      }
    } catch (error) {
      alert('Failed to update privacy settings');
    }
  };

  if (!isLoaded || initializing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!user) {
    router.push('/');
    return null;
  }

  const portfolioData = portfolio?.portfolio_data || {};
  const isPublished = portfolio?.status === 'published';
  const isPublic = portfolio?.is_public;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground">My Portfolio ✨</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Edit your portfolio with a beautiful editor
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={togglePrivacy}
              className="flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
            >
              {isPublic ? <Globe className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
              {isPublic ? 'Public' : 'Private'}
            </button>
            
            <button
              onClick={handlePublish}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-accent-foreground transition-all button-bounce ${
                isPublished ? 'bg-muted text-foreground' : 'bg-accent hover:opacity-90 hover-scale hover-glow-purple'
              }`}
            >
              {isPublished ? (
                <>
                  <Check className="h-4 w-4" />
                  <span className="emoji-bounce">🎉</span> Live!
                </>
              ) : (
                <>
                  Publish & Celebrate! <span className="emoji-bounce">🚀</span>
                </>
              )}
            </button>

            {isPublished && (isSuperAdmin || username) && (
              <a
                href={isSuperAdmin ? '/' : `/user/${username}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
              >
                <Eye className="h-4 w-4" />
                View Live {isSuperAdmin && '(Root Page)'}
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        <WYSIWYGEditor
          markdown={markdownContent}
          onChange={setMarkdownContent}
          onSave={handleMarkdownSave}
          isSaving={isSavingMarkdown}
        />
      </div>

      {/* Keep link modal for reference but it won't be used */}
      {false && showLinkModal && (
          /* Markdown Mode: Chat on left, Markdown editor on right */
          <>
          {/* Left Panel - Chat */}
          <div
            ref={chatContainerRef}
            className="flex w-full flex-col border-r border-border bg-background lg:w-1/2"
          >
            <div className="flex-1 overflow-y-auto p-6">
              {messages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <div className="mb-4 rounded-full bg-accent/10 p-6">
                    <MessageSquare className="h-12 w-12 text-accent" />
                  </div>
                  <h2 className="mb-2 text-xl font-semibold text-foreground">
                    Let's Build Your Portfolio! ✨
                  </h2>
                  <p className="max-w-md text-muted-foreground">
                    Tell me what to add, and I'll update your markdown on the right →
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-lg px-4 py-3 ${
                          message.role === 'user'
                            ? 'bg-accent text-white'
                            : message.role === 'system'
                            ? 'bg-muted text-muted-foreground text-sm'
                            : 'bg-muted text-foreground'
                        }`}
                      >
                        <div className="whitespace-pre-wrap break-words">
                          {message.content}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Chat Input */}
            <div className="border-t border-border bg-card p-4">
              {pendingAttachments.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-2">
                  {pendingAttachments.map((attachment, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm"
                    >
                      <File className="h-4 w-4 text-muted-foreground" />
                      <span className="text-foreground">{attachment.name}</span>
                      <button
                        onClick={() =>
                          setPendingAttachments((prev) => prev.filter((_, i) => i !== index))
                        }
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmit(e as any);
                      }
                    }}
                    placeholder="Ask AI to update your portfolio..."
                    className="w-full resize-none rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground focus:border-accent focus:outline-none"
                    rows={3}
                    disabled={loading || uploadProgress}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept="image/*,.pdf,.doc,.docx,.txt"
                    onChange={handleFileUpload}
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={loading || uploadProgress}
                    className="rounded-lg border border-border bg-background p-3 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
                    title="Upload file"
                  >
                    <Upload className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => setShowLinkModal(true)}
                    disabled={loading}
                    className="rounded-lg border border-border bg-background p-3 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
                    title="Add link"
                  >
                    <LinkIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={loading || uploadProgress || !input.trim()}
                    className="rounded-lg bg-accent p-3 text-white transition-colors hover:bg-accent/90 disabled:opacity-50"
                  >
                    {loading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Send className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel - Markdown Editor */}
          <div className="hidden lg:flex lg:w-1/2">
            <MarkdownEditor
              markdown={markdownContent}
              onChange={setMarkdownContent}
              onSave={handleMarkdownSave}
              isSaving={isSavingMarkdown}
            />
          </div>
          </>
        ) : (
          /* Chat Mode with Preview */
          <>
          {/* Left Panel - Chat */}
          <div
            ref={chatContainerRef}
            className="flex w-full flex-col border-r border-border bg-background lg:w-1/2"
          >
          {/* Mobile Preview - Only visible on small screens */}
          <div className="border-b border-border bg-muted p-4 lg:hidden">
            <div className="mb-3">
              <h3 className="text-sm font-semibold text-foreground">Live Preview 👀</h3>
              <p className="text-xs text-muted-foreground">
                Your portfolio updates as we chat
              </p>
            </div>
            <div className="max-h-60 overflow-y-auto rounded-lg border border-border bg-background p-4">
              {portfolioData.fullName ? (
                <div className="space-y-3">
                  <div>
                    <h2 className="text-lg font-bold text-foreground">
                      {portfolioData.fullName}
                    </h2>
                    {portfolioData.title && (
                      <p className="text-sm text-muted-foreground">
                        {portfolioData.title}
                      </p>
                    )}
                  </div>
                  {portfolioData.about && (
                    <p className="text-xs text-muted-foreground line-clamp-3">
                      {portfolioData.about}
                    </p>
                  )}
                  {(portfolioData.experiences?.length > 0 || portfolioData.projects?.length > 0) && (
                    <div className="flex gap-4 text-xs text-muted-foreground">
                      {portfolioData.experiences?.length > 0 && (
                        <span>{portfolioData.experiences.length} experiences</span>
                      )}
                      {portfolioData.projects?.length > 0 && (
                        <span>{portfolioData.projects.length} projects</span>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-center text-xs text-muted-foreground">
                  Start chatting to see your portfolio! ✨
                </p>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <div className="mb-4 rounded-full bg-accent/10 p-6">
                  <Loader2 className="h-12 w-12 text-accent" />
                </div>
                <h2 className="mb-2 text-xl font-semibold text-foreground">
                  Let's Create Something Awesome! ✨
                </h2>
                <p className="max-w-md text-muted-foreground">
                  Tell me about your achievements, upload files, or share links to get started!
                </p>
                <p className="mt-4 text-sm text-muted">
                  💡 Pro tip: Paste images directly with Ctrl+V (or Cmd+V)
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-lg px-4 py-3 ${
                        message.role === 'user'
                          ? 'bg-accent text-accent-foreground'
                          : 'bg-card text-foreground'
                      }`}
                    >
                      <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-start">
                    <div className="max-w-[85%] rounded-lg bg-card px-4 py-3">
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="border-t border-border bg-card p-4">
            {/* Upload/Link Buttons */}
            <div className="mb-3 flex gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadProgress || !portfolio}
                className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50 button-bounce hover-scale transition-all"
              >
                {uploadProgress ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                Upload File
              </button>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileUpload}
                accept="image/*,.pdf,.txt,.md"
              />

              <button
                onClick={() => setShowLinkModal(true)}
                disabled={!portfolio}
                className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50"
              >
                <LinkIcon className="h-4 w-4" />
                Add Link
              </button>
            </div>

            {/* Message Input */}
            <form onSubmit={handleSubmit} className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Tell me about your awesome work! ✨"
                disabled={loading || !portfolio}
                className="flex-1 rounded-lg border border-border bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={loading || !input.trim() || !portfolio}
                className="rounded-lg bg-accent px-4 py-3 font-semibold text-accent-foreground hover:opacity-90 transition-all disabled:opacity-50 button-bounce hover-scale hover-glow-purple"
              >
                <Send className="h-5 w-5" />
              </button>
            </form>
          </div>
        </div>

        {/* Right Panel - Preview */}
        <div className="hidden flex-1 overflow-y-auto bg-muted p-6 lg:block">
          <div className="mx-auto max-w-3xl">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-foreground">Live Preview 👀</h2>
              <p className="text-sm text-muted-foreground">
                Watch your portfolio come to life!
              </p>
            </div>

            {/* Portfolio Preview */}
            <div className="rounded-xl border border-border bg-background p-8 shadow-lg">
              {portfolioData.fullName ? (
                <div className="space-y-6">
                  <div>
                    <h1 className="text-3xl font-bold text-foreground">
                      {portfolioData.fullName}
                    </h1>
                    {portfolioData.title && (
                      <p className="mt-2 text-xl text-muted-foreground">
                        {portfolioData.title}
                      </p>
                    )}
                    {portfolioData.tagline && (
                      <p className="mt-2 text-foreground">{portfolioData.tagline}</p>
                    )}
                  </div>

                  {/* Data Summary */}
                  <div className="rounded-lg bg-accent/5 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-accent mb-2">
                      Portfolio Content
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                      <div>✓ {portfolioData.experiences?.length || 0} Experiences</div>
                      <div>✓ {portfolioData.projects?.length || 0} Projects</div>
                      <div>✓ {portfolioData.superpowers?.length || 0} Superpowers</div>
                      <div>✓ {portfolioData.awards?.length || 0} Awards</div>
                      <div>✓ {Object.keys(portfolioData.skills || {}).length} Skill Categories</div>
                      <div>✓ {portfolioData.education?.length || 0} Education</div>
                      <div>✓ {portfolioData.certifications?.length || 0} Certifications</div>
                      <div>✓ {portfolioData.articlesAndTalks?.length || portfolioData.articles?.length || 0} Articles</div>
                    </div>
                  </div>

                  {portfolioData.about && (
                    <div>
                      <h2 className="mb-2 text-lg font-semibold text-foreground">About</h2>
                      <p className="text-muted-foreground">{portfolioData.about}</p>
                    </div>
                  )}

                  {portfolioData.experiences?.length > 0 && (
                    <div>
                      <h2 className="mb-3 text-lg font-semibold text-foreground">Experience</h2>
                      <div className="space-y-4">
                        {portfolioData.experiences.slice(0, 3).map((exp: any, i: number) => (
                          <div key={i}>
                            <p className="font-medium text-foreground">{exp.title}</p>
                            <p className="text-sm text-muted-foreground">
                              {exp.company} • {exp.period}
                            </p>
                          </div>
                        ))}
                        {portfolioData.experiences.length > 3 && (
                          <p className="text-xs text-muted">+{portfolioData.experiences.length - 3} more</p>
                        )}
                      </div>
                    </div>
                  )}

                  {portfolioData.projects?.length > 0 && (
                    <div>
                      <h2 className="mb-3 text-lg font-semibold text-foreground">Projects</h2>
                      <div className="grid gap-4 sm:grid-cols-2">
                        {portfolioData.projects.slice(0, 4).map((project: any) => (
                          <div key={project.id} className="rounded-lg border border-border p-4">
                            <p className="font-medium text-foreground">{project.title}</p>
                            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                              {project.cardTeaser}
                            </p>
                          </div>
                        ))}
                      </div>
                      {portfolioData.projects.length > 4 && (
                        <p className="text-xs text-muted mt-2">+{portfolioData.projects.length - 4} more projects</p>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-12 text-center">
                  <p className="text-muted-foreground">
                    Start chatting and watch the magic happen! ✨
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
        </>
        )}
      </div>

      {/* Link Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">Add Link</h3>
              <button
                onClick={() => setShowLinkModal(false)}
                className="rounded-lg p-1 hover:bg-muted"
              >
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>
            <input
              type="url"
              value={linkInput}
              onChange={(e) => setLinkInput(e.target.value)}
              placeholder="https://..."
              className="mb-4 w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddLink();
                }
              }}
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowLinkModal(false)}
                className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
              >
                Cancel
              </button>
              <button
                onClick={handleAddLink}
                disabled={!linkInput.trim()}
                className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground hover:opacity-90 disabled:opacity-50"
              >
                Add Link
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
