'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import {
  Loader2,
  Eye,
  Globe,
  Lock,
  Check,
  ExternalLink,
} from 'lucide-react';
import { WYSIWYGEditor } from '@/app/components/portfolio/WYSIWYGEditor';
import { AIAssistantPanel } from '@/app/components/portfolio/AIAssistantPanel';
import { PortfolioPreview } from '@/app/components/portfolio/PortfolioPreview';
import { convertDataToMarkdown } from '@/app/components/portfolio/markdown-utils';
import { MessageSquare, FileText, Eye } from 'lucide-react';

export default function PortfolioBuilderPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  
  const [portfolio, setPortfolio] = useState<any>(null);
  const [initializing, setInitializing] = useState(true);
  const [username, setUsername] = useState('');
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [markdownContent, setMarkdownContent] = useState('');
  const [isSavingMarkdown, setIsSavingMarkdown] = useState(false);

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
        setUsername(currentData.portfolio.username || '');
        setIsSuperAdmin(currentData.portfolio.isSuperAdmin || false);
        
        // Initialize markdown content from portfolio data
        const portfolioData = currentData.portfolio.portfolio_data || {};
        const initialMarkdown = convertDataToMarkdown(portfolioData);
        setMarkdownContent(initialMarkdown || '# My Portfolio\n\nStart writing here...');
      }
    } catch (error) {
      console.error('Failed to initialize portfolio:', error);
    } finally {
      setInitializing(false);
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
        
        alert('✅ Portfolio saved successfully!');
      } else {
        throw new Error(saveData.error || 'Failed to save');
      }
    } catch (error) {
      console.error('Failed to save markdown:', error);
      alert(`❌ Failed to save: ${error instanceof Error ? error.message : 'Unknown error'}`);
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

  const isPublished = portfolio?.status === 'published';
  const isPublic = portfolio?.is_public;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">My Portfolio ✨</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Edit your portfolio with a beautiful editor
            </p>
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
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-accent-foreground transition-all ${
                isPublished ? 'bg-muted text-foreground' : 'bg-accent hover:opacity-90'
              }`}
            >
              {isPublished ? (
                <>
                  <Check className="h-4 w-4" />
                  <span>🎉 Live!</span>
                </>
              ) : (
                <>
                  Publish & Celebrate! 🚀
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

      {/* Main Content - WYSIWYG Editor */}
      <div className="flex flex-1 overflow-hidden">
        <WYSIWYGEditor
          markdown={markdownContent}
          onChange={setMarkdownContent}
          onSave={handleMarkdownSave}
          isSaving={isSavingMarkdown}
        />
      </div>
    </div>
  );
}
