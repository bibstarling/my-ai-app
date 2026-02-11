'use client';

import { useState, useEffect, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useUser, useAuth } from '@clerk/nextjs';
import { useNotification } from '@/app/hooks/useNotification';
import {
  X,
  User,
  Key,
  DollarSign,
  Activity,
  Calendar,
  Zap,
  Eye,
  EyeOff,
  Check,
  AlertCircle,
  ExternalLink,
  Sparkles,
  Loader2,
  TrendingUp,
} from 'lucide-react';

type AIProvider = 'anthropic' | 'openai' | 'groq';

interface APIConfig {
  provider: AIProvider;
  apiKey: string;
  isActive: boolean;
}

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

type SettingsTab = 'account' | 'api' | 'usage';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState<SettingsTab>('account');

  const tabs = [
    { id: 'account' as SettingsTab, label: 'Account', icon: <User className="h-4 w-4" /> },
    { id: 'api' as SettingsTab, label: 'API Config', icon: <Key className="h-4 w-4" /> },
    { id: 'usage' as SettingsTab, label: 'Usage & Costs', icon: <Activity className="h-4 w-4" /> },
  ];

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all">
                {/* Header */}
                <div className="relative border-b border-border bg-gradient-to-br from-terra-cotta/5 via-transparent to-transparent px-6 py-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Dialog.Title className="text-2xl font-bold text-foreground">
                        Settings
                      </Dialog.Title>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Manage your account and preferences
                      </p>
                    </div>
                    <button
                      onClick={onClose}
                      className="rounded-full p-2 text-muted hover:bg-terra-cotta/10 hover:text-terra-cotta transition-all"
                      aria-label="Close settings"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  {/* Tabs */}
                  <div className="mt-6 flex gap-2">
                    {tabs.map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                          activeTab === tab.id
                            ? 'bg-terra-cotta text-white shadow-md'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                        }`}
                      >
                        {tab.icon}
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Content */}
                <div className="max-h-[calc(100vh-300px)] overflow-y-auto bg-background">
                  {activeTab === 'account' && <AccountTab user={user} />}
                  {activeTab === 'api' && <APITab />}
                  {activeTab === 'usage' && <UsageTab />}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

// Account Tab Component
function AccountTab({ user }: { user: any }) {
  return (
    <div className="p-6 space-y-6">
      {/* User Info Card */}
      <div className="rounded-lg border border-border bg-white p-6">
        <h3 className="mb-4 text-lg font-semibold text-foreground">Profile Information</h3>
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-gradient-to-br from-terra-cotta to-burnt-sienna flex items-center justify-center text-white text-2xl font-bold shadow-lg">
            {user?.firstName?.[0] || user?.emailAddresses?.[0]?.emailAddress[0] || 'U'}
          </div>
          <div>
            <h4 className="text-lg font-semibold text-foreground">
              {user?.firstName || user?.username || 'User'}
            </h4>
            <p className="text-sm text-muted-foreground">
              {user?.emailAddresses?.[0]?.emailAddress}
            </p>
          </div>
        </div>
      </div>

      {/* Account Details */}
      <div className="rounded-lg border border-border bg-white p-6">
        <h3 className="mb-4 text-lg font-semibold text-foreground">Account Details</h3>
        <div className="space-y-3">
          <div className="flex justify-between py-2 border-b border-border">
            <span className="text-sm text-muted-foreground">Email</span>
            <span className="text-sm font-medium text-foreground">
              {user?.emailAddresses?.[0]?.emailAddress}
            </span>
          </div>
          <div className="flex justify-between py-2 border-b border-border">
            <span className="text-sm text-muted-foreground">Account Status</span>
            <span className="inline-flex items-center gap-1 text-sm font-medium text-green-600">
              <Check className="h-3 w-3" />
              Active
            </span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-sm text-muted-foreground">Member Since</span>
            <span className="text-sm font-medium text-foreground">
              {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
            </span>
          </div>
        </div>
      </div>

      {/* Support */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-900 mb-1">Need Help?</h3>
            <p className="text-sm text-blue-800">
              For account management and support, manage your profile through Clerk or contact support.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// API Configuration Tab
function APITab() {
  const { getToken } = useAuth();
  const { showSuccess, showError, showInfo, confirm } = useNotification();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<APIConfig | null>(null);
  
  const [selectedProvider, setSelectedProvider] = useState<AIProvider>('groq');
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    loadAPIConfig();
  }, []);

  const loadAPIConfig = async () => {
    try {
      const token = await getToken();
      console.log('[APITab] Loading config with token:', !!token);
      
      const res = await fetch('/api/settings/api-config', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
      });
      const data = await res.json();

      if (data.success && data.config) {
        setConfig(data.config);
        setSelectedProvider(data.config.provider);
        setApiKey(data.config.apiKey || '');
      }
    } catch (error) {
      console.error('Failed to load API config:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfig = async () => {
    if (!apiKey.trim()) {
      showInfo('Please enter an API key');
      return;
    }

    setSaving(true);
    setTestResult(null);

    try {
      const token = await getToken();
      console.log('[APITab] Saving config with token:', !!token);
      
      const res = await fetch('/api/settings/api-config', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify({
          provider: selectedProvider,
          apiKey: apiKey.trim(),
        }),
      });

      const data = await res.json();
      
      console.log('[APITab] Save response:', { status: res.status, data });

      if (res.status === 401) {
        showError('Authentication failed. Please refresh the page and try again.');
      } else if (data.success) {
        setConfig(data.config);
        showSuccess('API configuration saved successfully!');
      } else {
        showError(`Failed: ${data.error}`);
      }
    } catch (error) {
      console.error('[APITab] Save error:', error);
      showError('Failed to save API configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    if (!apiKey.trim()) {
      setTestResult({ success: false, message: 'Please enter an API key' });
      return;
    }

    setTestingConnection(true);
    setTestResult(null);

    try {
      const token = await getToken();
      console.log('[APITab] Testing connection with token:', !!token);
      
      const res = await fetch('/api/settings/api-config/test', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify({
          provider: selectedProvider,
          apiKey: apiKey.trim(),
        }),
      });

      const data = await res.json();
      
      console.log('[APITab] Test response:', { status: res.status, data });
      
      if (res.status === 401) {
        setTestResult({
          success: false,
          message: data.message || 'Authentication failed. Please refresh the page and try again.',
        });
      } else {
        setTestResult({
          success: data.success,
          message: data.message || (data.success ? 'Connection successful!' : 'Connection failed'),
        });
      }
    } catch (error) {
      console.error('[APITab] Test error:', error);
      setTestResult({ success: false, message: 'Failed to test connection' });
    } finally {
      setTestingConnection(false);
    }
  };

  const handleRemoveConfig = async () => {
    const confirmed = await confirm('Are you sure you want to remove your API configuration? You will use the system API with usage limits.', {
      title: 'Remove API Configuration',
      type: 'warning',
      confirmText: 'Remove',
      cancelText: 'Cancel',
    });
    if (!confirmed) return;

    setSaving(true);

    try {
      const token = await getToken();
      
      const res = await fetch('/api/settings/api-config', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
      });

      const data = await res.json();

      if (data.success) {
        setConfig(null);
        setApiKey('');
        showSuccess('API configuration removed. You are now using the system API.');
      } else {
        showError(`Failed: ${data.error}`);
      }
    } catch (error) {
      showError('Failed to remove API configuration');
    } finally {
      setSaving(false);
    }
  };

  const providers = [
    {
      id: 'groq' as AIProvider,
      name: 'Groq',
      description: 'Super fast inference with FREE tier!',
      icon: <Zap className="h-5 w-5" />,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      isFree: true,
      signupUrl: 'https://console.groq.com',
      pricing: 'Free tier: 7,000 requests/day',
    },
    {
      id: 'openai' as AIProvider,
      name: 'OpenAI',
      description: 'GPT-4o, GPT-4o-mini, GPT-3.5-turbo',
      icon: <Sparkles className="h-5 w-5" />,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      isFree: false,
      signupUrl: 'https://platform.openai.com/api-keys',
      pricing: 'GPT-4o-mini: $0.15/M input',
    },
    {
      id: 'anthropic' as AIProvider,
      name: 'Anthropic',
      description: 'Claude Sonnet 4, Claude 3.5',
      icon: <Key className="h-5 w-5" />,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      isFree: false,
      signupUrl: 'https://console.anthropic.com',
      pricing: 'Claude Sonnet: $3/M input',
    },
  ];

  const selectedProviderInfo = providers.find(p => p.id === selectedProvider);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Current Status */}
      <div className={`rounded-lg border p-4 ${
        config ? 'border-green-200 bg-green-50' : 'border-orange-200 bg-orange-50'
      }`}>
        <div className="flex items-start gap-3">
          {config ? (
            <Check className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="h-5 w-5 text-orange-600 shrink-0 mt-0.5" />
          )}
          <div className="flex-1">
            <h3 className={`font-semibold ${
              config ? 'text-green-900' : 'text-orange-900'
            }`}>
              {config ? 'Using Your API Key' : 'Using System API (Limited)'}
            </h3>
            <p className={`mt-1 text-sm ${
              config ? 'text-green-700' : 'text-orange-700'
            }`}>
              {config 
                ? `Connected to ${config.provider.toUpperCase()}. You have unlimited usage.`
                : 'Using shared system API with a limit of 1M tokens per month.'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Provider Selection */}
      <div className="rounded-lg border border-border bg-white p-6">
        <h3 className="mb-4 text-lg font-semibold text-foreground">Choose AI Provider</h3>
        
        <div className="grid gap-3 md:grid-cols-3">
          {providers.map((provider) => (
            <button
              key={provider.id}
              onClick={() => setSelectedProvider(provider.id)}
              className={`relative rounded-lg border-2 p-4 text-left transition-all ${
                selectedProvider === provider.id
                  ? `${provider.borderColor} ${provider.bgColor}`
                  : 'border-border bg-white hover:border-terra-cotta/50'
              }`}
            >
              {provider.isFree && (
                <div className="absolute -top-2 -right-2 rounded-full bg-green-500 px-2 py-0.5 text-xs font-bold text-white">
                  FREE
                </div>
              )}
              <div className={`${provider.color} mb-2`}>
                {provider.icon}
              </div>
              <h4 className="font-semibold text-foreground text-sm">{provider.name}</h4>
              <p className="mt-1 text-xs text-muted-foreground">
                {provider.description}
              </p>
            </button>
          ))}
        </div>

        {selectedProviderInfo && (
          <div className="mt-4 rounded-lg bg-muted/50 p-3">
            <p className="text-sm font-medium text-foreground">
              {selectedProviderInfo.pricing}
            </p>
            <a
              href={selectedProviderInfo.signupUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-flex items-center gap-1 text-sm text-terra-cotta hover:underline"
            >
              Get API key
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        )}
      </div>

      {/* API Key Input */}
      <div className="rounded-lg border border-border bg-white p-6">
        <h3 className="mb-4 text-lg font-semibold text-foreground">API Key</h3>
        
        <div className="space-y-4">
          <div className="relative">
            <input
              type={showApiKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={`Enter your ${selectedProviderInfo?.name} API key`}
              className="w-full rounded-lg border border-border bg-background px-4 py-2.5 pr-12 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-terra-cotta"
            />
            <button
              type="button"
              onClick={() => setShowApiKey(!showApiKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          {testResult && (
            <div className={`rounded-lg p-3 ${
              testResult.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
            }`}>
              <div className="flex items-center gap-2">
                {testResult.success ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <X className="h-4 w-4" />
                )}
                <p className="text-sm font-medium">{testResult.message}</p>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleTestConnection}
              disabled={testingConnection || !apiKey.trim()}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50 transition-colors"
            >
              {testingConnection ? (
                <>
                  <Loader2 className="inline h-4 w-4 animate-spin mr-2" />
                  Testing...
                </>
              ) : (
                'Test Connection'
              )}
            </button>

            <button
              onClick={handleSaveConfig}
              disabled={saving || !apiKey.trim()}
              className="rounded-lg bg-terra-cotta px-4 py-2 text-sm font-semibold text-white hover:bg-burnt-sienna disabled:opacity-50 transition-colors shadow-md"
            >
              {saving ? (
                <>
                  <Loader2 className="inline h-4 w-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                'Save Configuration'
              )}
            </button>
          </div>

          {config && (
            <button
              onClick={handleRemoveConfig}
              disabled={saving}
              className="text-sm text-red-600 hover:underline"
            >
              Remove API configuration
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Usage & Costs Tab
function UsageTab() {
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<7 | 30 | 90>(30);
  const [usage, setUsage] = useState<UsageStat[]>([]);
  const [summary, setSummary] = useState<UsageSummary | null>(null);

  useEffect(() => {
    loadUsageData();
  }, [timeRange]);

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

      if (!summary.byProvider[stat.provider]) {
        summary.byProvider[stat.provider] = { requests: 0, tokens: 0, cost: 0 };
      }
      summary.byProvider[stat.provider].requests += stat.totalRequests;
      summary.byProvider[stat.provider].tokens += stat.totalTokens;
      summary.byProvider[stat.provider].cost += stat.totalCost;

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

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Time Range Selector */}
      <div className="flex items-center gap-3">
        <Calendar className="h-5 w-5 text-muted" />
        <span className="text-sm font-medium text-foreground">Time Range:</span>
        <div className="flex gap-2">
          {[7, 30, 90].map((days) => (
            <button
              key={days}
              onClick={() => setTimeRange(days as 7 | 30 | 90)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                timeRange === days
                  ? 'bg-terra-cotta text-white shadow-md'
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
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-border bg-white p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-terra-cotta/10 p-2.5">
                <Activity className="h-5 w-5 text-terra-cotta" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Requests</p>
                <p className="text-xl font-bold text-foreground">
                  {formatNumber(summary.totalRequests)}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-white p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-100 p-2.5">
                <Zap className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Tokens</p>
                <p className="text-xl font-bold text-foreground">
                  {formatNumber(summary.totalTokens)}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-white p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-green-100 p-2.5">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Estimated Cost</p>
                <p className="text-xl font-bold text-foreground">
                  {formatCost(summary.totalCost)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Usage by Provider */}
      {summary && Object.keys(summary.byProvider).length > 0 && (
        <div className="rounded-lg border border-border bg-white p-6">
          <h3 className="mb-4 text-lg font-semibold text-foreground">Usage by Provider</h3>
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
          <h3 className="mb-4 text-lg font-semibold text-foreground">Usage by Feature</h3>
          <div className="space-y-3">
            {Object.entries(summary.byFeature)
              .sort(([, a], [, b]) => b.cost - a.cost)
              .map(([feature, stats]) => (
                <div key={feature} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <span className="text-sm font-medium text-foreground">
                    {getFeatureName(feature)}
                  </span>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-muted-foreground">
                      {formatNumber(stats.requests)} req
                    </span>
                    <span className="text-muted-foreground">
                      {formatNumber(stats.tokens)} tok
                    </span>
                    <span className="font-semibold text-foreground min-w-[60px] text-right">
                      {formatCost(stats.cost)}
                    </span>
                  </div>
                </div>
              ))}
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
  );
}
