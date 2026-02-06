'use client';

import Link from 'next/link';
import { useUser } from '@clerk/nextjs';
import {
  Mail,
  User,
  Shield,
  Bell,
  ArrowLeft,
  ChevronRight,
  Loader2,
  Briefcase,
} from 'lucide-react';

export default function SettingsPage() {
  const { user, isLoaded } = useUser();

  if (!isLoaded) {
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
            Please sign in to access settings.
          </p>
        </div>
      </div>
    );
  }

  const settingsSections = [
    {
      title: 'Portfolio',
      description: 'Manage your portfolio website and visibility',
      icon: <Briefcase className="h-6 w-6" />,
      items: [
        {
          label: 'Portfolio Settings',
          description: 'Configure username, privacy, and SEO',
          icon: <Briefcase className="h-5 w-5" />,
          href: '/settings/portfolio',
        },
      ],
    },
    {
      title: 'Notifications',
      description: 'Manage your email and notification preferences',
      icon: <Bell className="h-6 w-6" />,
      items: [
        {
          label: 'Email Preferences',
          description: 'Choose which emails you want to receive',
          icon: <Mail className="h-5 w-5" />,
          href: '/settings/email-preferences',
        },
      ],
    },
    {
      title: 'Account',
      description: 'Manage your account settings and profile',
      icon: <User className="h-6 w-6" />,
      items: [
        {
          label: 'Profile Settings',
          description: 'Update your personal information',
          icon: <User className="h-5 w-5" />,
          href: '#',
          comingSoon: true,
        },
        {
          label: 'Security',
          description: 'Password and security settings',
          icon: <Shield className="h-5 w-5" />,
          href: '#',
          comingSoon: true,
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/assistant"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-accent transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to assistant
          </Link>
          <h1 className="text-3xl font-bold text-foreground mb-2">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account preferences and settings.
          </p>
        </div>

        {/* User Info */}
        <div className="mb-8 rounded-lg border border-border bg-card p-6">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-accent/10 flex items-center justify-center">
              <User className="h-8 w-8 text-accent" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">
                {user.firstName || user.username || 'User'}
              </h2>
              <p className="text-sm text-muted-foreground">
                {user.emailAddresses?.[0]?.emailAddress}
              </p>
            </div>
          </div>
        </div>

        {/* Settings Sections */}
        <div className="space-y-8">
          {settingsSections.map((section) => (
            <div key={section.title}>
              <div className="mb-4 flex items-center gap-3">
                <div className="text-accent">{section.icon}</div>
                <div>
                  <h2 className="text-xl font-semibold text-foreground">
                    {section.title}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {section.description}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                {section.items.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={`group flex items-center justify-between rounded-lg border border-border bg-card p-4 transition-colors hover:border-accent/50 ${
                      (item as any).comingSoon ? 'opacity-60 cursor-not-allowed' : ''
                    }`}
                    onClick={(e) => (item as any).comingSoon && e.preventDefault()}
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
                        {item.icon}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-foreground">
                            {item.label}
                          </h3>
                          {(item as any).comingSoon && (
                            <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-xs text-amber-400">
                              Coming Soon
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {item.description}
                        </p>
                      </div>
                    </div>
                    {!(item as any).comingSoon && (
                      <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-accent transition-colors" />
                    )}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Support Info */}
        <div className="mt-12 rounded-lg border border-border bg-card p-6">
          <h3 className="mb-2 font-semibold text-foreground">Need Help?</h3>
          <p className="text-sm text-muted-foreground">
            If you have any questions or need assistance, please contact our
            support team at{' '}
            <a
              href={`mailto:${process.env.SUPPORT_EMAIL || 'support@example.com'}`}
              className="text-accent hover:underline"
            >
              {process.env.SUPPORT_EMAIL || 'support@example.com'}
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
