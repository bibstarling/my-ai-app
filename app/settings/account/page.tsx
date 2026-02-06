'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import {
  Loader2,
  DollarSign,
  TrendingUp,
  Activity,
  Calendar,
  Zap,
  Settings,
} from 'lucide-react';

interface UsageStat {
  provider: string;
  feature: string;
  totalRequests: number;
  totalTokens: number;
  totalCost: number;
}

interface UsageSummary {
  totalRequests: number;
  totalTokens: number;
  totalCost: number;
  byProvider: Record<string, { requests: number; tokens: number; cost: number }>;
  byFeature: Record<string, { requests: number; tokens: number; cost: number }>;
}

export default function AccountPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<7 | 30 | 90>(30);
  const [usage, setUsage] = useState<UsageStat[]>([]);
  const [summary, setSummary] = useState<UsageSummary | null>(null);

  useEffect(() => {
    if (isLoaded && user) {
      loadUsageData();
    }
  }, [isLoaded, user, timeRange]);

  const loadUsageData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/settings/usage?days=${timeRange}`);
      const data = await res.json();

      if (data.success) {
        setUsage(data.usage);
        calculateSummary(data.usage);
      }
    } catch (error) {
      console.error('Failed to load usage data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateSummary = (usageData: UsageStat[]) => {
    const summary: UsageSummary = {
      totalRequests: 0,
      totalTokens: 0,
      totalCost: 0,
      byProvider: {},
      byFeature: {},
    };

    usageData.forEach((stat) => {
      summary.totalRequests += stat.totalRequests;
      summary.totalTokens += stat.totalTokens;
      summary.totalCost += stat.totalCost;

      // By provider
      if (!summary.byProvider[stat.provider]) {
        summary.byProvider[stat.provider] = { requests: 0, tokens: 0, cost: 0 };
      }
      summary.byProvider[stat.provider].requests += stat.totalRequests;
      summary.byProvider[stat.provider].tokens += stat.totalTokens;
      summary.byProvider[stat.provider].cost += stat.totalCost;

      // By feature
      if (!summary.byFeature[stat.feature]) {
        summary.byFeature[stat.feature] = { requests: 0, tokens: 0, cost: 0 };
      }
      summary.byFeature[stat.feature].requests += stat.totalRequests;
      summary.byFeature[stat.feature].tokens += stat.totalTokens;
      summary.byFeature[stat.feature].cost += stat.totalCost;
    });

    setSummary(summary);
  };

  const formatCost = (cost: number) => {
    if (cost === 0) return '$0.00';
    if (cost < 0.01) return '<$0.01';
    return `$${cost.toFixed(2)}`;
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const getFeatureName = (feature: string) => {
    const names: Record<string, string> = {
      portfolio_chat: 'Portfolio Chat',
      resume_generation: 'Resume Generation',
      cover_letter: 'Cover Letter',
      job_matching: 'Job Matching',
      assistant_chat: 'AI Assistant',
    };
    return names[feature] || feature;
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
        <div className="mx-auto max-w-6xl px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Account & Usage</h1>
              <p className="mt-2 text-muted-foreground">
                Track your AI usage and estimated costs
              </p>
            </div>
            <div className="text-sm text-muted-foreground">
              <p>Access more settings from the profile menu in the sidebar</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-6xl px-6 py-12">
        {/* Time Range Selector */}
        <div className="mb-8 flex items-center gap-2">
          <Calendar className="h-5 w-5 text-muted" />
          <span className="text-sm font-medium text-foreground">Time Range:</span>
          <div className="flex gap-2">
            {[7, 30, 90].map((days) => (
              <button
                key={days}
                onClick={() => setTimeRange(days as 7 | 30 | 90)}
                className={`rounded-lg px-3 py-1 text-sm font-medium transition-colors ${
                  timeRange === days
                    ? 'bg-accent text-accent-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/70'
                }`}
              >
                {days} days
              </button>
            ))}
          </div>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="mb-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border border-border bg-white p-6">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-orange-100 p-3">
                  <Activity className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Requests</p>
                  <p className="text-2xl font-bold text-foreground">
                    {formatNumber(summary.totalRequests)}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-border bg-white p-6">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-blue-100 p-3">
                  <Zap className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Tokens</p>
                  <p className="text-2xl font-bold text-foreground">
                    {formatNumber(summary.totalTokens)}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-border bg-white p-6">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-green-100 p-3">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Estimated Cost</p>
                  <p className="text-2xl font-bold text-foreground">
                    {formatCost(summary.totalCost)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Usage by Provider */}
        {summary && Object.keys(summary.byProvider).length > 0 && (
          <div className="mb-8 rounded-lg border border-border bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-foreground">Usage by Provider</h2>
            <div className="space-y-4">
              {Object.entries(summary.byProvider).map(([provider, stats]) => (
                <div key={provider} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-foreground capitalize">
                        {provider === 'system' ? 'System (Shared)' : provider}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {formatNumber(stats.requests)} requests
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-muted-foreground">
                        {formatNumber(stats.tokens)} tokens
                      </span>
                      <span className="font-semibold text-foreground">
                        {formatCost(stats.cost)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Usage by Feature */}
        {summary && Object.keys(summary.byFeature).length > 0 && (
          <div className="rounded-lg border border-border bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-foreground">Usage by Feature</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="py-3 px-4 text-left text-sm font-semibold text-foreground">
                      Feature
                    </th>
                    <th className="py-3 px-4 text-right text-sm font-semibold text-foreground">
                      Requests
                    </th>
                    <th className="py-3 px-4 text-right text-sm font-semibold text-foreground">
                      Tokens
                    </th>
                    <th className="py-3 px-4 text-right text-sm font-semibold text-foreground">
                      Cost
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(summary.byFeature)
                    .sort(([, a], [, b]) => b.cost - a.cost)
                    .map(([feature, stats]) => (
                      <tr key={feature} className="border-b border-border last:border-0">
                        <td className="py-3 px-4 text-sm text-foreground">
                          {getFeatureName(feature)}
                        </td>
                        <td className="py-3 px-4 text-right text-sm text-muted-foreground">
                          {formatNumber(stats.requests)}
                        </td>
                        <td className="py-3 px-4 text-right text-sm text-muted-foreground">
                          {formatNumber(stats.tokens)}
                        </td>
                        <td className="py-3 px-4 text-right text-sm font-semibold text-foreground">
                          {formatCost(stats.cost)}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Empty State */}
        {summary && summary.totalRequests === 0 && (
          <div className="rounded-lg border border-border bg-white p-12 text-center">
            <TrendingUp className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold text-foreground">No usage data yet</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Start using AI features to see your usage statistics here
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
