'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Mail, 
  FileText, 
  Briefcase, 
  BarChart3, 
  Megaphone,
  Loader2,
  Check,
  AlertCircle
} from 'lucide-react';
import { EMAIL_CATEGORY_INFO } from '@/lib/types/email-preferences';
import type { EmailPreferences } from '@/lib/types/email-preferences';

export default function EmailPreferencesPage() {
  const { user, isLoaded } = useUser();
  const [preferences, setPreferences] = useState<EmailPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isLoaded && user) {
      fetchPreferences();
    }
  }, [isLoaded, user]);

  const fetchPreferences = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/email-preferences');
      const data = await response.json();

      if (data.success && data.preferences) {
        setPreferences(data.preferences);
      } else {
        setError(data.error || 'Failed to load preferences');
      }
    } catch (err) {
      setError('Failed to load email preferences');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updatePreference = async (category: keyof EmailPreferences, value: boolean) => {
    if (!preferences) return;

    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    // Optimistic update
    const oldPreferences = { ...preferences };
    setPreferences({ ...preferences, [category]: value });

    try {
      const response = await fetch('/api/email-preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [category]: value }),
      });

      const data = await response.json();

      if (data.success) {
        setPreferences(data.preferences);
        setSuccessMessage('Preferences updated successfully');
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        // Revert on error
        setPreferences(oldPreferences);
        setError(data.error || 'Failed to update preferences');
      }
    } catch (err) {
      // Revert on error
      setPreferences(oldPreferences);
      setError('Failed to update preferences');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'account':
        return <Mail className="h-5 w-5" />;
      case 'document':
        return <FileText className="h-5 w-5" />;
      case 'application':
        return <Briefcase className="h-5 w-5" />;
      case 'digest':
        return <BarChart3 className="h-5 w-5" />;
      case 'marketing':
        return <Megaphone className="h-5 w-5" />;
      default:
        return <Mail className="h-5 w-5" />;
    }
  };

  if (!isLoaded || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="mb-4 text-2xl font-bold text-foreground">
            Sign in required
          </h1>
          <p className="text-muted-foreground">
            Please sign in to manage your email preferences.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/assistant"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-accent transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to assistant
          </Link>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Email Preferences
          </h1>
          <p className="text-muted-foreground">
            Choose which emails you want to receive from us.
          </p>
        </div>

        {/* Success/Error Messages */}
        {successMessage && (
          <div className="mb-6 flex items-center gap-2 rounded-lg border border-green-500/50 bg-green-500/10 px-4 py-3 text-sm text-green-400">
            <Check className="h-4 w-4" />
            {successMessage}
          </div>
        )}

        {error && (
          <div className="mb-6 flex items-center gap-2 rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}

        {/* Email Categories */}
        <div className="space-y-4">
          {preferences && Object.entries(EMAIL_CATEGORY_INFO).map(([key, info]) => {
            const prefKey = `${key}_emails` as keyof EmailPreferences;
            const isEnabled = preferences[prefKey] as boolean;

            return (
              <div
                key={key}
                className="rounded-lg border border-border bg-card p-6 transition-colors hover:border-accent/50"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex gap-4 flex-1">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent flex-shrink-0">
                      {getCategoryIcon(key)}
                    </div>
                    <div className="flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        <h3 className="font-semibold text-foreground">
                          {info.label}
                        </h3>
                        {info.critical && (
                          <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-xs text-amber-400">
                            Important
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        {info.description}
                      </p>
                      <div className="text-xs text-muted-foreground">
                        <span className="font-medium">Examples: </span>
                        {info.examples.join(', ')}
                      </div>
                    </div>
                  </div>
                  
                  {/* Toggle Switch */}
                  <div className="flex flex-col items-end gap-2">
                    <button
                      onClick={() => updatePreference(prefKey, !isEnabled)}
                      disabled={saving}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background ${
                        isEnabled ? 'bg-accent' : 'bg-muted'
                      } ${saving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                      role="switch"
                      aria-checked={isEnabled}
                      aria-label={`Toggle ${info.label}`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          isEnabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                    <span className="text-xs text-muted-foreground">
                      {isEnabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Info Box */}
        <div className="mt-8 rounded-lg border border-border bg-card p-6">
          <h3 className="mb-2 font-semibold text-foreground">
            About Email Preferences
          </h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-accent mt-0.5">•</span>
              <span>
                <strong>Account & Security</strong> emails include critical notifications
                that help protect your account
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-accent mt-0.5">•</span>
              <span>
                Changes take effect immediately for all future emails
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-accent mt-0.5">•</span>
              <span>
                You can update these preferences at any time
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-accent mt-0.5">•</span>
              <span>
                Even with notifications disabled, you can always access your
                dashboard to see updates
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
