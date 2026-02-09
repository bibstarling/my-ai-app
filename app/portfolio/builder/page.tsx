'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import {
  Loader2,
  Eye,
  Globe,
  Lock,
  Check,
  ExternalLink,
  MessageSquare,
  FileText,
  Settings,
  Edit3,
  Send,
  Upload,
  Link as LinkIcon,
  X,
  File,
  Briefcase,
  Save,
  Bold,
  Italic,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Image,
  Table,
  Info,
  Sparkles,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function PortfolioBuilderPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  
  const [portfolio, setPortfolio] = useState<any>(null);
  const [initializing, setInitializing] = useState(true);
  const [username, setUsername] = useState('');
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  
  // Markdown editor state
  const [markdown, setMarkdown] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [slashMenuPosition, setSlashMenuPosition] = useState({ top: 0, left: 0 });
  const [slashMenuFilter, setSlashMenuFilter] = useState('');
  const [showFormatMenu, setShowFormatMenu] = useState(false);
  const [formatMenuPosition, setFormatMenuPosition] = useState({ top: 0, left: 0 });
  const [showInfoBanner, setShowInfoBanner] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Chat state
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [pendingAttachments, setPendingAttachments] = useState<any[]>([]);
  const [uploadProgress, setUploadProgress] = useState(false);
  const [scrapingUrl, setScrapingUrl] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

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
        credentials: 'include',
      });
      const initData = await initRes.json();

      if (!initData.success) {
        throw new Error(initData.error);
      }

      // Get full portfolio data
      const currentRes = await fetch('/api/portfolio/current', { credentials: 'include' });
      const currentData = await currentRes.json();

      if (currentData.success) {
        setPortfolio(currentData.portfolio);
        setUsername(currentData.portfolio.username || '');
        setIsSuperAdmin(currentData.portfolio.isSuperAdmin || false);
        setMessages(currentData.portfolio.messages || []);
        
        // Initialize markdown content
        const portfolioData = currentData.portfolio.portfolio_data || {};
        setMarkdown(portfolioData.markdown || '# Professional Profile\n\nStart documenting your experience, skills, and achievements here...\n\n## About Me\n\n## Experience\n\n## Projects\n\n## Skills');
        
        // Add welcome message if no messages
        if ((!currentData.portfolio.messages || currentData.portfolio.messages.length === 0) && initData.isNew) {
          setMessages([
            {
              role: 'assistant',
              content: `👋 Hi! I'm your **Profile Context Assistant**.\n\nI'm here to help you build a comprehensive professional profile that will power all your AI-generated content—resumes, cover letters, and more.\n\n**What I can do:**\n• Extract information from your resume, certificates, or documents (PDF, Word, text)\n• Scrape and analyze URLs (LinkedIn, GitHub, personal website, projects)\n• Analyze screenshots of your work or projects\n• Help you document your experience, skills, and achievements\n• Organize your professional story in a structured way\n\n**The more detailed your profile, the better your tailored content will be!**\n\nYou can upload files, paste images (Ctrl+V), share URLs, or just tell me about your work. What would you like to add first?`,
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

  const handleSaveMarkdown = async () => {
    if (!portfolio) return;
    
    setIsSaving(true);
    try {
      const res = await fetch('/api/portfolio/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          portfolioData: { 
            ...portfolio.portfolio_data,
            markdown 
          } 
        }),
      });

      const data = await res.json();
      if (data.success) {
        setPortfolio((prev: any) => ({
          ...prev,
          portfolio_data: { ...prev.portfolio_data, markdown },
        }));
      } else {
        throw new Error(data.error || 'Failed to save');
      }
    } catch (error) {
      console.error('Save error:', error);
      alert('Failed to save markdown');
    } finally {
      setIsSaving(false);
    }
  };

  // Slash commands
  const slashCommands = [
    { label: 'Heading 1', icon: Heading1, value: '# ', description: 'Large section heading' },
    { label: 'Heading 2', icon: Heading2, value: '## ', description: 'Medium section heading' },
    { label: 'Heading 3', icon: Heading3, value: '### ', description: 'Small section heading' },
    { label: 'Bullet List', icon: List, value: '- ', description: 'Create a bullet list' },
    { label: 'Numbered List', icon: ListOrdered, value: '1. ', description: 'Create a numbered list' },
    { label: 'Quote', icon: Quote, value: '> ', description: 'Create a quote block' },
    { label: 'Code Block', icon: Code, value: '```\n\n```', description: 'Insert a code block' },
    { label: 'Image', icon: Image, value: '![alt text](url)', description: 'Insert an image' },
    { label: 'Link', icon: LinkIcon, value: '[text](url)', description: 'Insert a link' },
    { label: 'Divider', icon: null, value: '\n---\n', description: 'Insert a horizontal line' },
  ];

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const cursorPos = e.target.selectionStart;
    
    setMarkdown(value);
    
    // Check for slash command
    const textBeforeCursor = value.substring(0, cursorPos);
    const lastLine = textBeforeCursor.split('\n').pop() || '';
    const slashMatch = lastLine.match(/\/(\w*)$/);
    
    if (slashMatch) {
      setSlashMenuFilter(slashMatch[1]);
      setShowSlashMenu(true);
      
      // Calculate position
      const textarea = textareaRef.current;
      if (textarea) {
        const lines = textBeforeCursor.split('\n');
        const currentLine = lines.length;
        const lineHeight = 24; // approximate
        const top = currentLine * lineHeight;
        setSlashMenuPosition({ top, left: 20 });
      }
    } else {
      setShowSlashMenu(false);
    }
  };

  const insertSlashCommand = (command: typeof slashCommands[0]) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    const cursorPos = textarea.selectionStart;
    const textBeforeCursor = markdown.substring(0, cursorPos);
    const textAfterCursor = markdown.substring(cursorPos);
    
    // Find and remove the slash command trigger
    const lines = textBeforeCursor.split('\n');
    const lastLine = lines[lines.length - 1];
    const slashIndex = lastLine.lastIndexOf('/');
    
    if (slashIndex !== -1) {
      lines[lines.length - 1] = lastLine.substring(0, slashIndex);
      const newTextBefore = lines.join('\n');
      
      let newText;
      let cursorOffset = 0;
      
      if (command.value === '```\n\n```') {
        newText = newTextBefore + command.value + textAfterCursor;
        cursorOffset = command.value.indexOf('\n\n') + 2;
      } else {
        newText = newTextBefore + command.value + textAfterCursor;
        cursorOffset = command.value.length;
      }
      
      setMarkdown(newText);
      setShowSlashMenu(false);
      
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(
          newTextBefore.length + cursorOffset,
          newTextBefore.length + cursorOffset
        );
      }, 0);
    }
  };

  const handleTextSelection = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    
    if (start !== end) {
      // Text is selected, show format menu
      const rect = textarea.getBoundingClientRect();
      const textBeforeSelection = markdown.substring(0, start);
      const lines = textBeforeSelection.split('\n');
      const lineHeight = 24;
      const top = lines.length * lineHeight - textarea.scrollTop;
      
      setFormatMenuPosition({ 
        top: Math.max(60, top - 50), 
        left: 100 
      });
      setShowFormatMenu(true);
    } else {
      setShowFormatMenu(false);
    }
  };

  const applyFormat = (format: 'bold' | 'italic' | 'code' | 'link') => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = markdown.substring(start, end);
    
    if (!selectedText) return;
    
    let formatted = '';
    let cursorOffset = 0;
    
    switch (format) {
      case 'bold':
        formatted = `**${selectedText}**`;
        cursorOffset = 2;
        break;
      case 'italic':
        formatted = `*${selectedText}*`;
        cursorOffset = 1;
        break;
      case 'code':
        formatted = `\`${selectedText}\``;
        cursorOffset = 1;
        break;
      case 'link':
        formatted = `[${selectedText}](url)`;
        cursorOffset = selectedText.length + 3;
        break;
    }
    
    const newText = markdown.substring(0, start) + formatted + markdown.substring(end);
    setMarkdown(newText);
    setShowFormatMenu(false);
    
    setTimeout(() => {
      textarea.focus();
      if (format === 'link') {
        // Select "url" part
        textarea.setSelectionRange(start + cursorOffset, start + cursorOffset + 3);
      } else {
        textarea.setSelectionRange(start + cursorOffset, start + cursorOffset + selectedText.length);
      }
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Keyboard shortcuts
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'b':
          e.preventDefault();
          applyFormat('bold');
          break;
        case 'i':
          e.preventDefault();
          applyFormat('italic');
          break;
        case 'k':
          e.preventDefault();
          applyFormat('link');
          break;
        case '`':
          e.preventDefault();
          applyFormat('code');
          break;
        case 's':
          e.preventDefault();
          handleSaveMarkdown();
          break;
      }
    }
    
    // Escape to close menus
    if (e.key === 'Escape') {
      setShowSlashMenu(false);
      setShowFormatMenu(false);
    }
    
    // Handle slash menu navigation
    if (showSlashMenu && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      e.preventDefault();
      // TODO: Add arrow key navigation
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleScrapeUrl = async (url: string) => {
    if (!portfolio) return null;

    setScrapingUrl(true);
    try {
      const res = await fetch('/api/portfolio/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          url,
          portfolioId: portfolio.id,
        }),
      });

      const data = await res.json();

      if (data.success) {
        return {
          name: `URL: ${data.link.title || url}`,
          type: 'url',
          contentType: 'text',
          content: `**URL:** ${url}\n**Title:** ${data.link.title}\n**Description:** ${data.link.description}\n\n**AI Analysis:**\n${data.link.aiAnalysis}\n\n**Content Preview:**\n${data.link.content}`,
        };
      } else {
        throw new Error(data.error || 'Failed to scrape URL');
      }
    } catch (error) {
      console.error('Error scraping URL:', error);
      throw error;
    } finally {
      setScrapingUrl(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && pendingAttachments.length === 0) || loading || !portfolio) return;

    const userMessage = input.trim();
    let attachments = [...pendingAttachments];
    
    // Check if input contains URLs
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const urls = userMessage.match(urlRegex);
    
    if (urls && urls.length > 0) {
      setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
      setMessages((prev) => [
        ...prev,
        { role: 'system', content: `🔍 Found ${urls.length} URL(s). Scraping content...` },
      ]);
      setLoading(true);
      
      // Scrape each URL
      for (const url of urls) {
        try {
          const scrapedData = await handleScrapeUrl(url);
          if (scrapedData) {
            attachments.push(scrapedData);
          }
        } catch (error) {
          setMessages((prev) => [
            ...prev,
            { role: 'system', content: `⚠️ Could not scrape ${url}. Continuing with text input.` },
          ]);
        }
      }
      
      setMessages((prev) => [
        ...prev,
        { role: 'system', content: `✅ Scraping complete. Processing ${attachments.length} source(s)...` },
      ]);
    }
    
    setInput('');
    setPendingAttachments([]);
    
    if (!urls || urls.length === 0) {
      let displayMessage = userMessage;
      if (attachments.length > 0) {
        displayMessage += `\n\n📎 ${attachments.length} file(s) attached`;
      }
      setMessages((prev) => [...prev, { role: 'user', content: displayMessage }]);
    }
    
    setLoading(true);

    try {
      const res = await fetch('/api/portfolio/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          message: userMessage,
          attachments,
          currentMarkdown: markdown,
        }),
      });

      const data = await res.json();

      if (data.success) {
        // Add AI response to messages
        let aiMessage = data.message;
        if (data.changes && data.changes.length > 0) {
          aiMessage += '\n\n**Changes made:**\n' + data.changes.map((c: string) => `• ${c}`).join('\n');
        }
        
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: aiMessage },
        ]);
        
        // Update markdown if AI provided updates
        if (data.updatedMarkdown) {
          setMarkdown(data.updatedMarkdown);
          setMessages((prev) => [
            ...prev,
            { role: 'system', content: '✅ Portfolio updated! Remember to save your changes.' },
          ]);
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
        credentials: 'include',
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

  // Handle clipboard paste for images
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      if (!portfolio) return;

      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        
        if (item.type.startsWith('image/')) {
          e.preventDefault();
          
          const file = item.getAsFile();
          if (!file) continue;

          setUploadProgress(true);

          try {
            const formData = new FormData();
            formData.append('file', file, `pasted-image-${Date.now()}.png`);

            const res = await fetch('/api/portfolio/upload', {
              method: 'POST',
              credentials: 'include',
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
                role: 'system',
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
        credentials: 'include',
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
        credentials: 'include',
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

  const isPublished = portfolio?.status === 'published';
  const isPublic = portfolio?.is_public;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Compact Header */}
      <div className="border-b border-border bg-white sticky top-0 z-30">
        <div className="mx-auto max-w-5xl px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Briefcase className="w-5 h-5 text-accent" />
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Professional Profile</h1>
              <p className="text-xs text-gray-500">Your AI content source</p>
            </div>
          </div>
          
          <button
            onClick={handleSaveMarkdown}
            disabled={isSaving}
            className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save
              </>
            )}
          </button>
        </div>
        
        {/* Compact dismissible tip */}
        {showInfoBanner && (
          <div className="mx-auto max-w-5xl px-6 pb-3">
            <div className="bg-blue-50 border border-blue-200 rounded-md px-3 py-2 flex items-center gap-2 text-xs">
              <Info className="h-4 w-4 text-blue-600 flex-shrink-0" />
              <p className="flex-1 text-blue-800">
                <strong className="font-semibold">Tip:</strong> The more detailed your profile, the better your AI-generated resumes and cover letters will be.
              </p>
              <button
                onClick={() => setShowInfoBanner(false)}
                className="text-blue-600 hover:text-blue-800 flex-shrink-0"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Content - Clean Editor */}
      <div className="flex-1 overflow-y-auto bg-gray-50">
        <div className="mx-auto max-w-5xl px-6 py-8">
          {/* Editor Container */}
          <div className="rounded-lg bg-white shadow-sm border border-gray-200 p-12 min-h-[700px] relative">
            <div className="relative">
              {/* Hidden textarea for actual editing */}
              <textarea
                ref={textareaRef}
                value={markdown}
                onChange={handleTextareaChange}
                onSelect={handleTextSelection}
                onKeyDown={handleKeyDown}
                className="absolute inset-0 w-full h-full resize-none text-transparent caret-gray-900 bg-transparent focus:outline-none z-10"
                style={{ caretColor: '#111827' }}
                placeholder=""
              />
              
              {/* Rendered markdown display */}
              <div className="pointer-events-none relative z-0">
                {markdown ? (
                  <ReactMarkdown
                    components={{
                      h1: ({node, ...props}) => <h1 className="text-5xl font-bold mb-6 text-gray-900 leading-tight" {...props} />,
                      h2: ({node, ...props}) => <h2 className="text-4xl font-bold mb-4 mt-12 text-gray-900 leading-tight" {...props} />,
                      h3: ({node, ...props}) => <h3 className="text-3xl font-semibold mb-3 mt-10 text-gray-900 leading-snug" {...props} />,
                      p: ({node, ...props}) => <p className="text-lg leading-8 mb-4 text-gray-700" {...props} />,
                      ul: ({node, ...props}) => <ul className="list-disc ml-6 mb-6 space-y-2 text-gray-700" {...props} />,
                      ol: ({node, ...props}) => <ol className="list-decimal ml-6 mb-6 space-y-2 text-gray-700" {...props} />,
                      li: ({node, ...props}) => <li className="text-lg leading-8 pl-2" {...props} />,
                      blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-gray-300 pl-6 italic text-gray-600 my-6 text-lg" {...props} />,
                      code: ({node, className, children, ...props}) => {
                        const inline = !className;
                        return inline ? (
                          <code className="bg-gray-100 text-red-600 px-2 py-1 rounded text-base font-mono" {...props}>
                            {children}
                          </code>
                        ) : (
                          <code className="block bg-gray-900 text-gray-100 p-6 rounded-lg overflow-x-auto text-base font-mono my-6" {...props}>
                            {children}
                          </code>
                        );
                      },
                      a: ({node, ...props}) => <a className="text-blue-600 hover:underline" {...props} />,
                      strong: ({node, ...props}) => <strong className="font-bold text-gray-900" {...props} />,
                      em: ({node, ...props}) => <em className="italic" {...props} />,
                      hr: ({node, ...props}) => <hr className="border-t border-gray-200 my-8" {...props} />,
                    }}
                  >
                    {markdown}
                  </ReactMarkdown>
                ) : (
                  <p className="text-lg text-gray-400">
                    Type / for commands...
                  </p>
                )}
              </div>
              
              {/* Slash Command Menu */}
              {showSlashMenu && (
                <div
                  className="absolute z-50 bg-white rounded-lg shadow-xl border border-gray-200 py-2 w-80"
                  style={{ top: slashMenuPosition.top, left: slashMenuPosition.left }}
                >
                  <div className="px-3 py-1.5 text-xs font-semibold text-gray-500 uppercase">
                    Blocks
                  </div>
                  {slashCommands
                    .filter(cmd => 
                      !slashMenuFilter || 
                      cmd.label.toLowerCase().includes(slashMenuFilter.toLowerCase())
                    )
                    .map((cmd, idx) => (
                      <button
                        key={idx}
                        onClick={() => insertSlashCommand(cmd)}
                        className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-100 text-left"
                      >
                        {cmd.icon && <cmd.icon className="h-4 w-4 text-gray-500" />}
                        {!cmd.icon && <div className="h-4 w-4" />}
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900">{cmd.label}</div>
                          <div className="text-xs text-gray-500">{cmd.description}</div>
                        </div>
                      </button>
                    ))}
                </div>
              )}
              
              {/* Format Menu (appears on text selection) */}
              {showFormatMenu && (
                <div
                  className="absolute z-50 bg-gray-900 rounded-lg shadow-xl py-1 flex items-center gap-1 px-1"
                  style={{ top: formatMenuPosition.top, left: formatMenuPosition.left }}
                >
                  <button
                    onClick={() => applyFormat('bold')}
                    className="p-2 hover:bg-gray-800 rounded text-white"
                    title="Bold (Ctrl+B)"
                  >
                    <Bold className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => applyFormat('italic')}
                    className="p-2 hover:bg-gray-800 rounded text-white"
                    title="Italic (Ctrl+I)"
                  >
                    <Italic className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => applyFormat('code')}
                    className="p-2 hover:bg-gray-800 rounded text-white"
                    title="Code (Ctrl+`)"
                  >
                    <Code className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => applyFormat('link')}
                    className="p-2 hover:bg-gray-800 rounded text-white"
                    title="Link (Ctrl+K)"
                  >
                    <LinkIcon className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add to Profile AI Button */}
      {!isChatOpen && (
        <button
          onClick={() => setIsChatOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-accent px-4 py-3 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all"
          title="Add content to your profile with AI"
        >
          <Sparkles className="h-4 w-4" />
          <span className="text-sm font-medium">Add to Profile</span>
        </button>
      )}

      {/* Floating Chat Panel */}
      {isChatOpen && (
        <div className="fixed inset-y-0 right-0 z-50 w-[420px] bg-white shadow-2xl border-l border-gray-200 flex flex-col overflow-hidden">
          {/* Compact Chat Header */}
          <div className="border-b border-gray-200 px-4 py-3 flex items-center justify-between bg-white flex-shrink-0">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-accent" />
              <div>
                <h3 className="font-semibold text-gray-900 text-sm">Add to Profile</h3>
                <p className="text-xs text-gray-500">Upload files, URLs, or describe your work</p>
              </div>
            </div>
            <button
              onClick={() => setIsChatOpen(false)}
              className="text-gray-400 hover:text-gray-900 transition-colors"
              title="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* AI Chat Content */}
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden" ref={chatContainerRef}>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 min-h-0">
              <div className="space-y-4">
                {messages.map((message, idx) => (
                  <div
                    key={idx}
                    className={`flex ${
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-[85%] rounded-lg px-4 py-3 ${
                        message.role === 'user'
                          ? 'bg-accent text-white'
                          : message.role === 'system'
                          ? 'bg-blue-50 border border-blue-200 text-blue-900 text-sm'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                    </div>
                  </div>
                ))}
                {uploadProgress && (
                  <div className="flex justify-start">
                    <div className="rounded-lg bg-gray-100 px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin text-accent" />
                        <span className="text-sm text-gray-600">Processing file...</span>
                      </div>
                    </div>
                  </div>
                )}
                {scrapingUrl && (
                  <div className="flex justify-start">
                    <div className="rounded-lg bg-blue-100 px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                        <span className="text-sm text-blue-800">Scraping URL content...</span>
                      </div>
                    </div>
                  </div>
                )}
                {loading && (
                  <div className="flex justify-start">
                    <div className="rounded-lg bg-gray-100 px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin text-accent" />
                        <span className="text-sm text-gray-600">AI is thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Pending Attachments */}
            {pendingAttachments.length > 0 && (
              <div className="border-t border-gray-200 bg-blue-50 px-4 py-2 flex-shrink-0">
                <p className="mb-1.5 text-xs font-medium text-blue-900">
                  {pendingAttachments.length} file{pendingAttachments.length > 1 ? 's' : ''} ready
                </p>
                <div className="flex flex-wrap gap-2">
                  {pendingAttachments.map((att, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 rounded-lg border border-blue-200 bg-white px-3 py-1.5"
                    >
                      <File className="h-3 w-3 text-blue-600" />
                      <span className="text-xs text-gray-900">{att.name}</span>
                      <button
                        onClick={() =>
                          setPendingAttachments((prev) => prev.filter((_, i) => i !== idx))
                        }
                        className="text-gray-500 hover:text-red-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Input Area */}
            <div className="border-t border-gray-200 bg-white p-4 flex-shrink-0">
              <form onSubmit={handleSubmit} className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileUpload}
                    className="hidden"
                    accept="image/*,.pdf,.txt,.md"
                  />
                  
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadProgress}
                    className="rounded-lg border border-gray-200 bg-white p-2 text-gray-600 hover:bg-gray-50 hover:text-gray-900 disabled:opacity-50"
                    title="Upload file"
                  >
                    <Upload className="h-5 w-5" />
                  </button>

                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask AI or upload files..."
                    disabled={loading || uploadProgress}
                    className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-accent focus:outline-none disabled:opacity-50"
                  />
                  
                  <button
                    type="submit"
                    disabled={loading || uploadProgress || scrapingUrl || (!input.trim() && pendingAttachments.length === 0)}
                    className="rounded-lg bg-accent p-2 text-white hover:bg-accent/90 disabled:opacity-50"
                  >
                    <Send className="h-5 w-5" />
                  </button>
                </div>
              </form>
              <p className="text-xs text-gray-400 mt-2">
                Paste URLs (LinkedIn, GitHub, etc.) • Upload files • 
                <kbd className="px-1 py-0.5 bg-gray-100 border border-gray-200 rounded text-xs font-mono ml-1">Ctrl+V</kbd> for images
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
