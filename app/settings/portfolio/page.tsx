'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useNotification } from '@/app/hooks/useNotification';
import {
  Loader2,
  Check,
  X,
  Globe,
  Lock,
  ExternalLink,
  Pencil,
  Trash2,
} from 'lucide-react';

export default function PortfolioSettingsPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const { showSuccess, showError, showInfo } = useNotification();
  
  const [portfolio, setPortfolio] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  
  const [includePortfolioLink, setIncludePortfolioLink] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (isLoaded && user) {
      loadPortfolio();
    }
  }, [isLoaded, user]);

  const loadPortfolio = async () => {
    try {
      const res = await fetch('/api/portfolio/current', { credentials: 'include' });
      const data = await res.json();

      if (data.success) {
        setPortfolio(data.portfolio);
        setIsSuperAdmin(data.portfolio.isSuperAdmin || false);
        setIncludePortfolioLink(data.portfolio.include_portfolio_link ?? true);
      }
    } catch (error) {
      console.error('Failed to load portfolio:', error);
    } finally {
      setLoading(false);
    }
  };


  const handleTogglePortfolioLink = async () => {
    if (!portfolio) return;

    setSaving(true);

    try {
      const res = await fetch('/api/portfolio/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ includePortfolioLink: !includePortfolioLink }),
      });

      const data = await res.json();

      if (data.success) {
        setPortfolio(data.portfolio);
        setIncludePortfolioLink(data.portfolio.include_portfolio_link);
        showSuccess('Setting updated successfully!');
      } else {
        showError(`Failed: ${data.error}`);
      }
    } catch (error) {
      showError('Failed to update setting');
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePortfolio = async () => {
    // TODO: Implement portfolio deletion
    showInfo('Portfolio deletion not yet implemented');
    setShowDeleteConfirm(false);
  };

  if (!isLoaded || loading) {
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-white">
        <div className="mx-auto max-w-4xl px-6 py-8">
          <h1 className="text-3xl font-bold text-foreground">Profile Settings</h1>
          <p className="mt-2 text-muted-foreground">
            Configure how your professional profile is used in AI-generated documents
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-4xl px-6 py-12">
        <div className="space-y-8">

          {/* Include Portfolio Link in Documents */}
          <div className="rounded-lg border border-border bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-foreground">
              Portfolio Link in Documents
            </h2>
            
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="font-medium text-foreground">
                  Include Portfolio Link in Resumes & Cover Letters
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {includePortfolioLink
                    ? isSuperAdmin 
                      ? 'Your portfolio link (www.biancastarling.com) will be added to generated documents'
                      : 'Portfolio link feature will be added to generated documents when available'
                    : 'Generated documents will not include a portfolio link'}
                </p>
                {isSuperAdmin && includePortfolioLink && (
                  <p className="mt-2 text-xs font-mono text-accent">
                    Link: www.biancastarling.com
                  </p>
                )}
              </div>

              <button
                onClick={handleTogglePortfolioLink}
                disabled={saving}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors flex-shrink-0 ${
                  includePortfolioLink
                    ? 'bg-accent text-accent-foreground hover:opacity-90'
                    : 'border border-border text-foreground hover:bg-muted'
                }`}
              >
                {includePortfolioLink ? 'Enabled' : 'Disabled'}
              </button>
            </div>

            <div className="mt-4 rounded-lg bg-blue-50 border border-blue-200 p-4">
              <p className="text-sm text-blue-900">
                <strong>Note:</strong> Your profile data (experiences, skills, projects) is used as the source for all AI-generated documents, providing consistent and up-to-date information.
              </p>
            </div>
          </div>

          {/* Quick Links */}
          <div className="rounded-lg border border-border bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-foreground">Quick Links</h2>
            
            <div className="space-y-3">
              <a
                href="/portfolio/builder"
                className="flex items-center justify-between rounded-lg border border-border p-4 transition-colors hover:border-accent hover:bg-accent/5"
              >
                <span className="font-medium text-foreground">Edit Professional Profile</span>
                <ExternalLink className="h-4 w-4 text-muted" />
              </a>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="rounded-lg border border-red-200 bg-red-50 p-6">
            <h2 className="mb-4 text-lg font-semibold text-red-900">Danger Zone</h2>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-red-900">Delete Portfolio</p>
                <p className="mt-1 text-sm text-red-700">
                  This will permanently delete your portfolio and all associated data
                </p>
              </div>

              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-2 rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-semibold text-foreground">
              Delete Portfolio?
            </h3>
            <p className="mb-6 text-sm text-muted-foreground">
              This action cannot be undone. Your portfolio, chat history, and all
              uploaded files will be permanently deleted.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
              >
                Cancel
              </button>
              <button
                onClick={handleDeletePortfolio}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
              >
                Delete Portfolio
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
