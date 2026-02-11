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
  Info,
  Sparkles,
  Target,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import dynamic from 'next/dynamic';

// Import markdown editor with no SSR (it uses browser-only APIs)
const MDEditor = dynamic(
  () => import('@uiw/react-md-editor').then((mod) => mod.default),
  { ssr: false }
);

// Import markdown editor styles
import '@uiw/react-md-editor/markdown-editor.css';
import '@uiw/react-markdown-preview/markdown.css';

// Import custom editor styles
import './editor.css';

export default function PortfolioBuilderPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  
  const [portfolio, setPortfolio] = useState<any>(null);
  const [initializing, setInitializing] = useState(true);
  const [username, setUsername] = useState('');
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [showJobSettings, setShowJobSettings] = useState(false);
  const [jobProfile, setJobProfile] = useState<any>(null);
  
  // Markdown editor state
  const [markdown, setMarkdown] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showInfoBanner, setShowInfoBanner] = useState(true);
  
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
      loadJobProfile();
    }
  }, [isLoaded, user]);


  const loadJobProfile = async () => {
    try {
      const res = await fetch('/api/job-profile', { credentials: 'include' });
      const data = await res.json();
      console.log('[Portfolio Builder] Job profile loaded:', data);
      if (data.profile) {
        console.log('[Portfolio Builder] Setting job profile:', {
          titles: data.profile.target_titles?.length,
          skills: data.profile.skills_json?.length,
          seniority: data.profile.seniority,
          hasContext: !!data.profile.profile_context_text
        });
        setJobProfile(data.profile);
      } else {
        console.warn('[Portfolio Builder] No profile data received');
      }
    } catch (err) {
      console.error('Failed to load job profile:', err);
    }
  };

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
        setMarkdown(portfolioData.markdown || '# Your Full Name\n\nStart documenting your experience, skills, and achievements here...\n\n## About Me\n\n## Experience\n\n## Projects\n\n## Skills');
        
        // Add welcome message if no messages
        if ((!currentData.portfolio.messages || currentData.portfolio.messages.length === 0) && initData.isNew) {
          setMessages([
            {
              role: 'assistant',
              content: `👋 Hi! I'm your **Profile Context Assistant**.\n\nI'm here to help you build a comprehensive professional profile that will power all your AI-generated content—resumes, cover letters, and more.\n\n**Important:** Start by replacing "Your Full Name" in the editor with your actual name. This will be used as the title in all your generated resumes.\n\n**What I can do:**\n• Extract information from your resume, certificates, or documents (PDF, Word, text)\n• Scrape and analyze URLs (LinkedIn, GitHub, personal website, projects)\n• Intelligently integrate new content into your existing profile\n• Enhance and expand sections with more detail\n• Maintain a well-organized, comprehensive profile\n\n**How it works:**\n• Paste any URL → I'll scrape it and intelligently integrate the content\n• Upload files (PDF, Word, images) → I'll extract and merge the information\n• Say "paste it directly" if you want raw content added without AI integration\n• Use Ctrl+V to paste images\n\n**The more detailed your profile, the better your tailored content will be!**\n\nWhat would you like to add first?`,
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
      // Save portfolio markdown
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
        
        // Auto-sync job search profile from portfolio content
        try {
          const syncRes = await fetch('/api/portfolio/sync-job-profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ markdown }),
          });
          
          const syncData = await syncRes.json();
          if (syncData.success) {
            console.log('✅ Job profile auto-synced:', syncData.extracted);
            // Reload job profile to show updated data
            await loadJobProfile();
          }
        } catch (syncError) {
          console.error('Job profile sync failed (non-critical):', syncError);
          // Don't fail the save if job profile sync fails
        }
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

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSaveMarkdown();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [markdown]); // eslint-disable-line react-hooks/exhaustive-deps

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleScrapeUrl = async (url: string) => {
    if (!portfolio) {
      console.error('[handleScrapeUrl] No portfolio available');
      return null;
    }

    console.log('[handleScrapeUrl] Starting scrape for URL:', url);
    console.log('[handleScrapeUrl] Portfolio ID:', portfolio.id);
    
    setScrapingUrl(true);
    try {
      console.log('[handleScrapeUrl] Making API call to /api/portfolio/scrape...');
      const startTime = Date.now();
      
      const res = await fetch('/api/portfolio/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          url,
          portfolioId: portfolio.id,
        }),
      });

      const elapsedTime = Date.now() - startTime;
      console.log('[handleScrapeUrl] API response received in', elapsedTime, 'ms');
      console.log('[handleScrapeUrl] Response status:', res.status);

      const data = await res.json();
      console.log('[handleScrapeUrl] Response data:', {
        success: data.success,
        hasLink: !!data.link,
        error: data.error,
      });

      if (data.success) {
        // Format AI analysis properly
        let analysisText = '';
        if (data.link.aiAnalysis) {
          if (typeof data.link.aiAnalysis === 'string') {
            analysisText = data.link.aiAnalysis;
          } else if (typeof data.link.aiAnalysis === 'object') {
            analysisText = JSON.stringify(data.link.aiAnalysis, null, 2);
          }
        }
        
        const fullContent = data.link.content || '';
        const scrapedTitle = data.link.title || 'Untitled';
        const scrapedDescription = data.link.description || '';
        
        console.log('[handleScrapeUrl] Scraped successfully:', {
          url,
          titleLength: scrapedTitle.length,
          contentLength: fullContent.length,
          descLength: scrapedDescription.length,
        });
        
        if (fullContent.length < 100) {
          throw new Error('Scraped content is too short - website may not have loaded properly');
        }
        
        console.log('[handleScrapeUrl] ✅ Scrape successful, building attachment...');
        
        return {
          name: `Website: ${scrapedTitle}`,
          type: 'url',
          contentType: 'text',
          title: scrapedTitle,
          description: scrapedDescription,
          rawContent: fullContent,
          aiAnalysis: analysisText,
          url: url,
          content: `**SCRAPED WEBSITE CONTENT (Already fetched for you!)**\n\n**URL:** ${url}\n**Title:** ${scrapedTitle}\n**Description:** ${scrapedDescription}\n\n**AI Analysis:**\n${analysisText}\n\n**Full Content:**\n${fullContent}\n\n---\nYOU HAVE ACCESS TO THIS DATA - Extract professional information from it!`,
        };
      } else {
        console.error('[handleScrapeUrl] ❌ Scrape failed:', data.error);
        throw new Error(data.error || 'Failed to scrape URL');
      }
    } catch (error) {
      console.error('[handleScrapeUrl] ❌ Exception caught:', error);
      console.error('[handleScrapeUrl] Error details:', {
        message: error instanceof Error ? error.message : 'Unknown',
        stack: error instanceof Error ? error.stack : 'No stack',
      });
      throw error;
    } finally {
      setScrapingUrl(false);
    }
  };

  const handleDirectPasteToProfile = (scrapedData: any) => {
    // Format scraped content as markdown and add directly to the editor
    const title = scrapedData.title || 'Website Content';
    const url = scrapedData.url || '';
    const description = scrapedData.description || '';
    const content = scrapedData.rawContent || scrapedData.content || '';
    
    // Try to intelligently parse the content
    let newContent = `\n\n---\n\n## ${title}\n\n`;
    
    if (url) {
      newContent += `*Source: [${url}](${url})*\n\n`;
    }
    
    if (description) {
      newContent += `${description}\n\n`;
    }
    
    // Parse the content for common patterns
    const contentLines = content.split('\n').filter((line: string) => line.trim().length > 0);
    
    // Look for sections in the content
    const hasExperienceKeywords = content.toLowerCase().includes('experience') || 
                                   content.toLowerCase().includes('work history') ||
                                   content.toLowerCase().includes('employment');
    const hasProjectKeywords = content.toLowerCase().includes('project') ||
                                content.toLowerCase().includes('portfolio');
    const hasSkillKeywords = content.toLowerCase().includes('skill') ||
                             content.toLowerCase().includes('expertise') ||
                             content.toLowerCase().includes('technologies');
    
    // Add relevant sections based on content
    if (hasExperienceKeywords) {
      newContent += `### Work Experience\n\n`;
      // Add first few lines that might contain experience
      const experienceLines = contentLines.slice(0, 20).join('\n');
      newContent += `${experienceLines}\n\n`;
    } else if (hasProjectKeywords) {
      newContent += `### Projects\n\n`;
      const projectLines = contentLines.slice(0, 20).join('\n');
      newContent += `${projectLines}\n\n`;
    } else if (hasSkillKeywords) {
      newContent += `### Skills\n\n`;
      const skillLines = contentLines.slice(0, 15).join('\n');
      newContent += `${skillLines}\n\n`;
    } else {
      // Generic content
      newContent += `### Details\n\n`;
      const preview = contentLines.slice(0, 30).join('\n');
      newContent += `${preview}${contentLines.length > 30 ? '\n\n*... (content truncated, edit to expand)*' : ''}\n\n`;
    }
    
    // AI analysis if available
    if (scrapedData.aiAnalysis) {
      let analysisText = typeof scrapedData.aiAnalysis === 'string' 
        ? scrapedData.aiAnalysis 
        : JSON.stringify(scrapedData.aiAnalysis, null, 2);
      
      if (analysisText && analysisText.length > 0 && analysisText !== '{}') {
        newContent += `### AI Insights\n\n${analysisText}\n\n`;
      }
    }
    
    newContent += `*📝 Note: This content was scraped directly. Please review, format, and refine as needed.*\n\n`;
    
    // Append to current markdown
    setMarkdown(prev => prev + newContent);
    
    setMessages(prev => [
      ...prev,
      { 
        role: 'system', 
        content: `✅ Content from "${title}" has been **pasted directly** to your profile!\n\n🎯 **Next steps:**\n1. Scroll up in the editor to see the new content\n2. Edit and refine the text as needed\n3. Click the **Save** button when done\n\nThe content has been added at the bottom of your profile.` 
      },
    ]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && pendingAttachments.length === 0) || loading || !portfolio) return;

    const userMessage = input.trim();
    let attachments = [...pendingAttachments];
    
    // Check if input contains URLs (with or without protocol)
    const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+|[a-zA-Z0-9-]+\.(com|org|net|edu|gov|io|co|ai)[^\s]*)/gi;
    const urlMatches = userMessage.match(urlRegex);
    
    // Normalize URLs (add https:// if missing)
    const urls = urlMatches?.map(url => {
      if (!url.match(/^https?:\/\//i)) {
        return `https://${url}`;
      }
      return url;
    });
    
    if (urls && urls.length > 0) {
      console.log('[handleSubmit] URLs detected:', urls);
      setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
      setMessages((prev) => [
        ...prev,
        { role: 'system', content: `🔍 Found ${urls.length} URL(s). Scraping content...\n\n${urls.map(u => `• ${u}`).join('\n')}` },
      ]);
      setLoading(true);
      
      // Scrape each URL
      const scrapedDataList: any[] = [];
      for (const url of urls) {
        console.log('[handleSubmit] Processing URL:', url);
        try {
          const scrapedData = await handleScrapeUrl(url);
          if (scrapedData) {
            console.log('[handleSubmit] ✅ URL scraped successfully');
            scrapedDataList.push(scrapedData);
            attachments.push(scrapedData);
          } else {
            console.log('[handleSubmit] ⚠️ URL scraping returned null');
          }
        } catch (error) {
          console.error('[handleSubmit] ❌ Failed to scrape URL:', url, error);
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          setMessages((prev) => [
            ...prev,
            { 
              role: 'system', 
              content: `⚠️ **Failed to scrape:** ${url}\n\n**Error:** ${errorMessage}\n\n**Try:**\n• Check if the URL is accessible\n• Try a different URL\n• Copy and paste the content manually instead` 
            },
          ]);
        }
      }
      
      console.log('[handleSubmit] Total URLs scraped:', scrapedDataList.length, 'out of', urls.length);
      
      // Check if user wants direct paste (explicit keywords)
      const wantsDirectPaste = userMessage.toLowerCase().includes('paste directly') || 
                                userMessage.toLowerCase().includes('direct paste') ||
                                userMessage.toLowerCase().includes('no ai') ||
                                userMessage.toLowerCase().includes('skip ai');
      
      if (wantsDirectPaste) {
        // Direct paste mode - only if explicitly requested
        setInput('');
        setPendingAttachments([]);
        
        setMessages((prev) => [
          ...prev,
          { role: 'system', content: `✅ Scraping complete! Pasting content directly to your profile...` },
        ]);
        
        for (const scraped of scrapedDataList) {
          handleDirectPasteToProfile(scraped);
        }
        
        setLoading(false);
        return;
      }
      
      // DEFAULT: AI processing - intelligently integrate content
      setMessages((prev) => [
        ...prev,
        { role: 'system', content: `✅ Scraping complete. AI is reviewing and integrating the content...` },
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
    <div className="flex min-h-screen flex-col bg-background" data-color-mode="light">
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
                <strong className="font-semibold">Notion-like editor:</strong> Edit on the left, see live preview on the right. Use the toolbar for formatting or markdown syntax. Ctrl+S to save.
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

      {/* Main Content - Notion-like Editor */}
      <div className="flex-1 overflow-y-auto bg-gray-50">
        <div className="mx-auto max-w-5xl px-6 py-8">
          
          {/* Job Search Settings Section */}
          <div className="mb-6 rounded-lg bg-white shadow-sm border border-gray-200 overflow-hidden">
            <button
              onClick={() => setShowJobSettings(!showJobSettings)}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Target className="w-5 h-5 text-blue-600" />
                <div className="text-left">
                  <h2 className="text-base font-semibold text-gray-900">Job Search Settings</h2>
                  <p className="text-xs text-gray-500">
                    {jobProfile ? 
                      `${jobProfile.target_titles?.length || 0} target roles • ${jobProfile.skills_json?.length || 0} skills • ${jobProfile.seniority || 'No'} seniority` 
                      : 'Auto-extracted from your profile'
                    }
                  </p>
                </div>
              </div>
              {showJobSettings ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
            </button>
            
            {showJobSettings && (
              <div className="px-6 pb-6 border-t border-gray-200 space-y-4">
                {jobProfile ? (
                  <>
                    {/* Target Titles */}
                    {jobProfile.target_titles && jobProfile.target_titles.length > 0 && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Target Job Titles</label>
                        <div className="flex flex-wrap gap-2">
                          {jobProfile.target_titles.map((title: string, idx: number) => (
                            <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                              {title}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Seniority */}
                    {jobProfile.seniority && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Seniority Level</label>
                        <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                          {jobProfile.seniority}
                        </span>
                      </div>
                    )}
                    
                    {/* Skills */}
                    {jobProfile.skills_json && jobProfile.skills_json.length > 0 && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Key Skills ({jobProfile.skills_json.length})
                        </label>
                        <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                          {jobProfile.skills_json.slice(0, 20).map((skill: string, idx: number) => (
                            <span key={idx} className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Context */}
                    {jobProfile.profile_context_text && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Career Context</label>
                        <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg line-clamp-3">
                          {jobProfile.profile_context_text}
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-sm text-gray-500 mb-3">No job search settings found</p>
                    <p className="text-xs text-gray-400">
                      Save your profile content above and your job search settings will be automatically extracted
                    </p>
                  </div>
                )}
                
                {/* Edit Link */}
                {jobProfile && (
                  <div className="pt-3 border-t border-gray-200">
                    <p className="text-xs text-gray-600 mb-2">
                      ✨ These settings are automatically extracted from your profile. Save your profile to update them.
                    </p>
                    <a
                      href="/job-profile"
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      → Manual settings editor
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Editor Container */}
          <div className="rounded-lg bg-white shadow-sm border border-gray-200 overflow-hidden">
            <MDEditor
              value={markdown}
              onChange={(val) => setMarkdown(val || '')}
              height={700}
              preview="live"
              hideToolbar={false}
              enableScroll={true}
              visibleDragbar={false}
              highlightEnable={true}
              style={{
                border: 'none',
                background: 'white',
              }}
              textareaProps={{
                placeholder: 'Start writing your professional profile...\n\nIMPORTANT: Begin with # Your Full Name (this will be used in your resumes)\n\nTips:\n- Use # for headings (your name should be the first heading)\n- Use ** for bold\n- Use - for bullet lists\n- Paste images directly',
              }}
              previewOptions={{
                rehypePlugins: [],
                components: {
                  h1: ({ children, ...props }) => (
                    <h1 className="text-4xl font-bold mb-4 mt-8 text-gray-900" {...props}>
                      {children}
                    </h1>
                  ),
                  h2: ({ children, ...props }) => (
                    <h2 className="text-3xl font-bold mb-3 mt-6 text-gray-900" {...props}>
                      {children}
                    </h2>
                  ),
                  h3: ({ children, ...props }) => (
                    <h3 className="text-2xl font-semibold mb-2 mt-5 text-gray-900" {...props}>
                      {children}
                    </h3>
                  ),
                  p: ({ children, ...props }) => (
                    <p className="text-base leading-7 mb-4 text-gray-700" {...props}>
                      {children}
                    </p>
                  ),
                  ul: ({ children, ...props }) => (
                    <ul className="list-disc ml-6 mb-4 space-y-1 text-gray-700" {...props}>
                      {children}
                    </ul>
                  ),
                  ol: ({ children, ...props }) => (
                    <ol className="list-decimal ml-6 mb-4 space-y-1 text-gray-700" {...props}>
                      {children}
                    </ol>
                  ),
                  li: ({ children, ...props }) => (
                    <li className="text-base leading-7" {...props}>
                      {children}
                    </li>
                  ),
                  blockquote: ({ children, ...props }) => (
                    <blockquote className="border-l-4 border-accent pl-4 italic text-gray-600 my-4" {...props}>
                      {children}
                    </blockquote>
                  ),
                  code: ({ inline, children, ...props }: any) => (
                    inline ? (
                      <code className="bg-gray-100 text-red-600 px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
                        {children}
                      </code>
                    ) : (
                      <code className="block bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm font-mono my-4" {...props}>
                        {children}
                      </code>
                    )
                  ),
                  a: ({ children, ...props }) => (
                    <a className="text-accent hover:underline" {...props}>
                      {children}
                    </a>
                  ),
                  strong: ({ children, ...props }) => (
                    <strong className="font-bold text-gray-900" {...props}>
                      {children}
                    </strong>
                  ),
                  hr: ({ ...props }) => (
                    <hr className="border-t border-gray-200 my-6" {...props} />
                  ),
                },
              }}
            />
          </div>
          
          {/* Helpful Tips */}
          <div className="mt-4 space-y-2">
            <div className="flex items-start gap-3 text-sm text-gray-600">
              <div className="flex-shrink-0 w-5 h-5 rounded-full bg-accent/10 flex items-center justify-center">
                <span className="text-xs text-accent font-semibold">💡</span>
              </div>
              <div>
                <strong className="text-gray-700">Pro tip:</strong> This is a split-view editor. Type markdown on the left, see it rendered on the right in real-time—just like Notion!
              </div>
            </div>
            <div className="flex items-start gap-3 text-sm text-gray-600">
              <div className="flex-shrink-0 w-5 h-5 rounded-full bg-accent/10 flex items-center justify-center">
                <span className="text-xs text-accent font-semibold">⌨️</span>
              </div>
              <div>
                <strong className="text-gray-700">Shortcuts:</strong> Ctrl+S to save • Ctrl+B for bold • Ctrl+I for italic • Use toolbar for more formatting options
              </div>
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
        <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[420px] max-w-full bg-white shadow-2xl border-l border-gray-200 flex flex-col overflow-hidden">
          {/* Compact Chat Header */}
          <div className="border-b border-gray-200 px-3 sm:px-4 py-3 flex items-center justify-between bg-white flex-shrink-0">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <Sparkles className="h-4 w-4 text-accent flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-gray-900 text-sm">Add to Profile</h3>
                <p className="text-xs text-gray-500 truncate">Upload files, URLs, or describe your work</p>
              </div>
            </div>
            <button
              onClick={() => setIsChatOpen(false)}
              className="text-gray-400 hover:text-gray-900 transition-colors flex-shrink-0 ml-2"
              title="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* AI Chat Content */}
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden" ref={chatContainerRef}>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 min-h-0">
              <div className="space-y-3 sm:space-y-4">
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
              <div className="border-t border-gray-200 bg-blue-50 px-3 sm:px-4 py-2 flex-shrink-0">
                <p className="mb-1.5 text-[10px] xs:text-xs font-medium text-blue-900">
                  {pendingAttachments.length} file{pendingAttachments.length > 1 ? 's' : ''} ready
                </p>
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
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
            <div className="border-t border-gray-200 bg-white p-3 sm:p-4 flex-shrink-0">
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
                    className="rounded-lg border border-gray-200 bg-white p-2 text-gray-600 hover:bg-gray-50 hover:text-gray-900 disabled:opacity-50 flex-shrink-0"
                    title="Upload file"
                  >
                    <Upload className="h-4 w-4 sm:h-5 sm:w-5" />
                  </button>

                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask AI or upload files..."
                    disabled={loading || uploadProgress}
                    className="flex-1 min-w-0 rounded-lg border border-gray-200 bg-white px-2 sm:px-3 py-2 text-xs sm:text-sm text-gray-900 placeholder:text-gray-400 focus:border-accent focus:outline-none disabled:opacity-50"
                  />
                  
                  <button
                    type="submit"
                    disabled={loading || uploadProgress || scrapingUrl || (!input.trim() && pendingAttachments.length === 0)}
                    className="rounded-lg bg-accent p-2 text-white hover:bg-accent/90 disabled:opacity-50 flex-shrink-0"
                  >
                    <Send className="h-4 w-4 sm:h-5 sm:w-5" />
                  </button>
                </div>
              </form>
              <p className="text-[10px] xs:text-xs text-gray-400 mt-2">
                Paste URLs (LinkedIn, GitHub, etc.) • Upload files • 
                <kbd className="px-1 py-0.5 bg-gray-100 border border-gray-200 rounded text-[10px] xs:text-xs font-mono ml-1 hidden xs:inline">Ctrl+V</kbd><span className="xs:hidden ml-1">Ctrl+V</span> for images
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
