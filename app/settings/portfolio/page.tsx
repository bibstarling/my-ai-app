'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
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
  
  const [portfolio, setPortfolio] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [checkingUsername, setCheckingUsername] = useState(false);
  
  const [username, setUsername] = useState('');
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [usernameError, setUsernameError] = useState('');
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  
  const [seoDescription, setSeoDescription] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (isLoaded && user) {
      loadPortfolio();
    }
  }, [isLoaded, user]);

  const loadPortfolio = async () => {
    try {
      const res = await fetch('/api/portfolio/current');
      const data = await res.json();

      if (data.success) {
        setPortfolio(data.portfolio);
        setUsername(data.portfolio.username || '');
        setSeoDescription(data.portfolio.seo_description || '');
      }
    } catch (error) {
      console.error('Failed to load portfolio:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkUsernameAvailability = async (newUsername: string) => {
    if (!newUsername || newUsername === portfolio?.username) {
      setUsernameAvailable(null);
      setUsernameError('');
      return;
    }

    setCheckingUsername(true);
    setUsernameError('');

    try {
      const res = await fetch(
        `/api/portfolio/check-username?username=${encodeURIComponent(newUsername)}`
      );
      const data = await res.json();

      setUsernameAvailable(data.available);
      if (!data.available) {
        setUsernameError(data.error || 'Username is not available');
      }
    } catch (error) {
      setUsernameError('Failed to check username availability');
      setUsernameAvailable(null);
    } finally {
      setCheckingUsername(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (username && username !== portfolio?.username) {
        checkUsernameAvailability(username);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [username]);

  const handleSaveUsername = async () => {
    if (!username || username === portfolio?.username) {
      setIsEditingUsername(false);
      return;
    }

    if (!usernameAvailable) {
      return;
    }

    setSaving(true);

    try {
      const res = await fetch('/api/portfolio/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      });

      const data = await res.json();

      if (data.success) {
        setPortfolio(data.portfolio);
        setUsername(data.portfolio.username);
        setIsEditingUsername(false);
        alert('Username updated successfully!');
      } else {
        setUsernameError(data.error || 'Failed to update username');
      }
    } catch (error) {
      setUsernameError('Failed to update username');
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePrivacy = async () => {
    if (!portfolio) return;

    setSaving(true);

    try {
      const res = await fetch('/api/portfolio/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublic: !portfolio.is_public }),
      });

      const data = await res.json();

      if (data.success) {
        setPortfolio(data.portfolio);
      } else {
        alert(`Failed: ${data.error}`);
      }
    } catch (error) {
      alert('Failed to update privacy settings');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveDescription = async () => {
    if (!portfolio || seoDescription === portfolio.seo_description) {
      return;
    }

    setSaving(true);

    try {
      const res = await fetch('/api/portfolio/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seoDescription }),
      });

      const data = await res.json();

      if (data.success) {
        setPortfolio(data.portfolio);
        alert('Description updated successfully!');
      } else {
        alert(`Failed: ${data.error}`);
      }
    } catch (error) {
      alert('Failed to update description');
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePortfolio = async () => {
    // TODO: Implement portfolio deletion
    alert('Portfolio deletion not yet implemented');
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

  const portfolioUrl = username
    ? `${window.location.origin}/user/${username}`
    : 'Set a username to get your portfolio URL';

  const isPublished = portfolio?.status === 'published';
  const isPublic = portfolio?.is_public;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-white">
        <div className="mx-auto max-w-4xl px-6 py-8">
          <h1 className="text-3xl font-bold text-foreground">Portfolio Settings</h1>
          <p className="mt-2 text-muted-foreground">
            Manage your portfolio visibility and URL
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-4xl px-6 py-12">
        <div className="space-y-8">
          {/* Username Section */}
          <div className="rounded-lg border border-border bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-foreground">Portfolio Username</h2>
            
            {!isEditingUsername ? (
              <div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Your portfolio URL:</p>
                    <p className="mt-1 font-mono text-sm text-foreground">
                      {portfolioUrl}
                    </p>
                  </div>
                  <button
                    onClick={() => setIsEditingUsername(true)}
                    className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
                  >
                    <Pencil className="h-4 w-4" />
                    Edit
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="relative">
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase())}
                    placeholder="your-username"
                    className="w-full rounded-lg border border-border bg-background px-4 py-3 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                  {checkingUsername && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    </div>
                  )}
                  {!checkingUsername && username && username !== portfolio?.username && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {usernameAvailable ? (
                        <Check className="h-5 w-5 text-green-600" />
                      ) : (
                        <X className="h-5 w-5 text-red-600" />
                      )}
                    </div>
                  )}
                </div>

                {usernameError && (
                  <p className="mt-2 text-sm text-red-600">{usernameError}</p>
                )}

                <p className="mt-2 text-xs text-muted-foreground">
                  3-30 characters, lowercase letters, numbers, and hyphens only
                </p>

                <div className="mt-4 flex gap-2">
                  <button
                    onClick={handleSaveUsername}
                    disabled={saving || !usernameAvailable || checkingUsername}
                    className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground hover:opacity-90 disabled:opacity-50"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="inline h-4 w-4 animate-spin mr-2" />
                        Saving...
                      </>
                    ) : (
                      'Save Username'
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setIsEditingUsername(false);
                      setUsername(portfolio?.username || '');
                      setUsernameError('');
                      setUsernameAvailable(null);
                    }}
                    className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Privacy Section */}
          <div className="rounded-lg border border-border bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-foreground">Privacy</h2>
            
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  {isPublic ? (
                    <Globe className="h-5 w-5 text-accent" />
                  ) : (
                    <Lock className="h-5 w-5 text-muted" />
                  )}
                  <p className="font-medium text-foreground">
                    {isPublic ? 'Public Portfolio' : 'Private Portfolio'}
                  </p>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {isPublic
                    ? 'Anyone can view your portfolio'
                    : 'Only you can view your portfolio'}
                </p>
              </div>

              <button
                onClick={handleTogglePrivacy}
                disabled={saving}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  isPublic
                    ? 'border border-border text-foreground hover:bg-muted'
                    : 'bg-accent text-accent-foreground hover:opacity-90'
                }`}
              >
                {isPublic ? 'Make Private' : 'Make Public'}
              </button>
            </div>
          </div>

          {/* SEO Description */}
          <div className="rounded-lg border border-border bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-foreground">
              SEO Description
            </h2>
            
            <textarea
              value={seoDescription}
              onChange={(e) => setSeoDescription(e.target.value)}
              placeholder="A brief description of your portfolio for search engines..."
              rows={3}
              className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
            />

            <p className="mt-2 text-xs text-muted-foreground">
              {seoDescription.length} / 160 characters (recommended)
            </p>

            {seoDescription !== portfolio?.seo_description && (
              <button
                onClick={handleSaveDescription}
                disabled={saving}
                className="mt-4 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground hover:opacity-90 disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="inline h-4 w-4 animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  'Save Description'
                )}
              </button>
            )}
          </div>

          {/* Quick Links */}
          <div className="rounded-lg border border-border bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-foreground">Quick Links</h2>
            
            <div className="space-y-3">
              <a
                href="/portfolio/builder"
                className="flex items-center justify-between rounded-lg border border-border p-4 transition-colors hover:border-accent hover:bg-accent/5"
              >
                <span className="font-medium text-foreground">Edit Portfolio</span>
                <ExternalLink className="h-4 w-4 text-muted" />
              </a>

              {username && isPublished && (
                <a
                  href={`/user/${username}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between rounded-lg border border-border p-4 transition-colors hover:border-accent hover:bg-accent/5"
                >
                  <span className="font-medium text-foreground">View Live Portfolio</span>
                  <ExternalLink className="h-4 w-4 text-muted" />
                </a>
              )}
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
