'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import {
  Loader2,
  Check,
  X,
  Eye,
  EyeOff,
  Key,
  Zap,
  DollarSign,
  AlertCircle,
  ExternalLink,
  Sparkles,
} from 'lucide-react';

type AIProvider = 'anthropic' | 'openai' | 'groq';

interface APIConfig {
  provider: AIProvider;
  apiKey: string;
  isActive: boolean;
}

export default function APISettingsPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<APIConfig | null>(null);
  
  const [selectedProvider, setSelectedProvider] = useState<AIProvider>('groq');
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [testingAI, setTestingAI] = useState(false);
  const [aiTestResult, setAiTestResult] = useState<{ success: boolean; message: string; details?: any } | null>(null);

  useEffect(() => {
    if (isLoaded && user) {
      loadAPIConfig();
    }
  }, [isLoaded, user]);

  const loadAPIConfig = async () => {
    try {
      const res = await fetch('/api/settings/api-config', {
        credentials: 'include',
      });
      const data = await res.json();

      if (data.success && data.config) {
        setConfig(data.config);
        setSelectedProvider(data.config.provider);
        setApiKey(data.config.apiKey || '');
      } else if (res.status === 401) {
        console.error('Unauthorized - user not authenticated');
      }
    } catch (error) {
      console.error('Failed to load API config:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfig = async () => {
    if (!apiKey.trim()) {
      alert('Please enter an API key');
      return;
    }

    setSaving(true);
    setTestResult(null);

    try {
      console.log('[Settings] Saving config:', { provider: selectedProvider });
      
      const res = await fetch('/api/settings/api-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          provider: selectedProvider,
          apiKey: apiKey.trim(),
        }),
      });

      const data = await res.json();
      console.log('[Settings] Save response:', { success: data.success, status: res.status, data });

      if (data.success) {
        setConfig(data.config);
        setTestResult({ 
          success: true, 
          message: `✅ ${selectedProvider.toUpperCase()} configuration saved successfully!\n\n🎉 All AI features will now use your ${selectedProvider.toUpperCase()} API key.` 
        });
        
        // Reload config to confirm it was saved
        setTimeout(() => {
          loadAPIConfig();
        }, 500);
      } else {
        const errorMsg = data.details ? `${data.error}: ${data.details}` : data.error;
        console.error('[Settings] Save failed:', errorMsg);
        setTestResult({ 
          success: false, 
          message: `Failed to save: ${errorMsg}` 
        });
      }
    } catch (error: any) {
      console.error('[Settings] Save exception:', error);
      setTestResult({ 
        success: false, 
        message: `Error: ${error.message || 'Failed to save API configuration'}` 
      });
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
      const res = await fetch('/api/settings/api-config/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          provider: selectedProvider,
          apiKey: apiKey.trim(),
        }),
      });

      const data = await res.json();
      setTestResult({
        success: data.success,
        message: data.message || (data.success ? 'Connection successful!' : 'Connection failed'),
      });
    } catch (error) {
      setTestResult({ success: false, message: 'Failed to test connection' });
    } finally {
      setTestingConnection(false);
    }
  };

  const handleRemoveConfig = async () => {
    if (!confirm('Are you sure you want to remove your API configuration? You will use the system API with usage limits.')) {
      return;
    }

    setSaving(true);

    try {
      const res = await fetch('/api/settings/api-config', {
        method: 'DELETE',
        credentials: 'include',
      });

      const data = await res.json();

      if (data.success) {
        setConfig(null);
        setApiKey('');
        alert('API configuration removed. You are now using the system API.');
      } else {
        alert(`Failed: ${data.error}`);
      }
    } catch (error) {
      alert('Failed to remove API configuration');
    } finally {
      setSaving(false);
    }
  };

  const runDebugCheck = async () => {
    try {
      const res = await fetch('/api/settings/api-config/debug', {
        credentials: 'include',
      });
      const data = await res.json();
      setDebugInfo(data);
      console.log('[Debug] Result:', data);
    } catch (error) {
      console.error('[Debug] Error:', error);
      setDebugInfo({ error: 'Failed to run debug check' });
    }
  };

  const testAIConfiguration = async () => {
    setTestingAI(true);
    setAiTestResult(null);

    try {
      const res = await fetch('/api/settings/api-config/test-ai', {
        method: 'POST',
        credentials: 'include',
      });

      const data = await res.json();

      if (data.success) {
        setAiTestResult({
          success: true,
          message: `✅ AI is working with your ${data.provider.toUpperCase()} API!\n\nModel: ${data.model}\nResponse: ${data.content}\nTokens used: ${data.usage.totalTokens}`,
          details: data,
        });
      } else {
        setAiTestResult({
          success: false,
          message: `❌ AI test failed: ${data.message}`,
        });
      }
    } catch (error) {
      console.error('[AI Test] Error:', error);
      setAiTestResult({
        success: false,
        message: 'Failed to test AI configuration',
      });
    } finally {
      setTestingAI(false);
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
    router.push('/');
    return null;
  }

  const providers = [
    {
      id: 'groq' as AIProvider,
      name: 'Groq',
      description: 'Super fast inference with FREE tier! (60 requests/min)',
      icon: <Zap className="h-5 w-5" />,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      isFree: true,
      signupUrl: 'https://console.groq.com',
      pricing: 'Free tier: 7,000 requests/day, then $0.59/M tokens',
    },
    {
      id: 'openai' as AIProvider,
      name: 'OpenAI',
      description: 'GPT-4o, GPT-4o-mini, and GPT-3.5-turbo',
      icon: <Sparkles className="h-5 w-5" />,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      isFree: false,
      signupUrl: 'https://platform.openai.com/api-keys',
      pricing: 'GPT-4o-mini: $0.15/M input, $0.60/M output',
    },
    {
      id: 'anthropic' as AIProvider,
      name: 'Anthropic',
      description: 'Claude Sonnet 4, Claude 3.5, and Claude Haiku',
      icon: <Key className="h-5 w-5" />,
      color: 'text-accent',
      bgColor: 'bg-accent/10',
      borderColor: 'border-purple-200',
      isFree: false,
      signupUrl: 'https://console.anthropic.com',
      pricing: 'Claude Sonnet: $3/M input, $15/M output',
    },
  ];

  const selectedProviderInfo = providers.find(p => p.id === selectedProvider);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-white">
        <div className="mx-auto max-w-4xl px-6 py-8">
          <h1 className="text-3xl font-bold text-foreground">API Configuration</h1>
          <p className="mt-2 text-muted-foreground">
            Connect your own LLM API to avoid usage limits and control costs
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-4xl px-6 py-12">
        <div className="space-y-8">
          {/* Current Status */}
          <div className={`rounded-lg border p-6 ${
            config ? 'border-green-200 bg-green-50' : 'border-orange-200 bg-orange-50'
          }`}>
            <div className="flex items-start gap-3">
              {config ? (
                <Check className="h-6 w-6 text-green-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="h-6 w-6 text-orange-600 shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <h3 className={`text-lg font-semibold ${
                  config ? 'text-green-900' : 'text-orange-900'
                }`}>
                  {config ? `Using Your ${config.provider.toUpperCase()} API Key` : 'Using System API (Limited)'}
                </h3>
                <p className={`mt-1 text-sm ${
                  config ? 'text-green-700' : 'text-orange-700'
                }`}>
                  {config 
                    ? `All AI features will use your ${config.provider.toUpperCase()} account. You have unlimited usage and control your own costs. If your API fails, the system will automatically fall back to the default API.`
                    : 'You are using the shared system API (fallback) with a limit of 1M tokens per month. Add your own API key for unlimited usage and priority access.'
                  }
                </p>
                {config && (
                  <>
                    <div className="mt-3 flex items-center gap-2 text-xs text-green-600">
                      <Sparkles className="h-4 w-4" />
                      <span className="font-medium">
                        Active: All AI features (resume builder, cover letters, job matching, chat) will use your {config.provider.toUpperCase()} API
                      </span>
                    </div>
                    <div className="mt-3">
                      <button
                        onClick={testAIConfiguration}
                        disabled={testingAI}
                        className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                      >
                        {testingAI ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Testing AI...
                          </>
                        ) : (
                          <>
                            <Zap className="h-4 w-4" />
                            Test AI Now
                          </>
                        )}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* AI Test Result */}
          {aiTestResult && (
            <div className={`rounded-lg border p-6 ${
              aiTestResult.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
            }`}>
              <div className="flex items-start gap-3">
                {aiTestResult.success ? (
                  <Check className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                ) : (
                  <X className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className={`text-sm font-medium whitespace-pre-line ${
                    aiTestResult.success ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {aiTestResult.message}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Provider Selection */}
          <div className="rounded-lg border border-border bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-foreground">Choose AI Provider</h2>
            
            <div className="grid gap-4 md:grid-cols-3">
              {providers.map((provider) => (
                <button
                  key={provider.id}
                  onClick={() => setSelectedProvider(provider.id)}
                  className={`relative rounded-lg border-2 p-4 text-left transition-all ${
                    selectedProvider === provider.id
                      ? `${provider.borderColor} ${provider.bgColor}`
                      : 'border-border bg-white hover:border-accent/50'
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
                  <h3 className="font-semibold text-foreground">{provider.name}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {provider.description}
                  </p>
                </button>
              ))}
            </div>

            {selectedProviderInfo && (
              <div className="mt-4 rounded-lg bg-muted/50 p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {selectedProviderInfo.pricing}
                    </p>
                    <a
                      href={selectedProviderInfo.signupUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-1 text-sm text-accent hover:underline"
                    >
                      Get API key
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                  {selectedProviderInfo.isFree && (
                    <div className="flex items-center gap-1 text-sm font-medium text-green-600">
                      <Zap className="h-4 w-4" />
                      Recommended
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* API Key Input */}
          <div className="rounded-lg border border-border bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-foreground">API Key</h2>
            
            <div className="space-y-4">
              <div className="relative">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={`Enter your ${selectedProviderInfo?.name} API key`}
                  className="w-full rounded-lg border border-border bg-background px-4 py-3 pr-12 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showApiKey ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>

              {testResult && (
                <div className={`rounded-lg p-3 ${
                  testResult.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                }`}>
                  <div className="flex items-start gap-2">
                    {testResult.success ? (
                      <Check className="h-4 w-4 shrink-0 mt-0.5" />
                    ) : (
                      <X className="h-4 w-4 shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <p className="text-sm font-medium whitespace-pre-line">{testResult.message}</p>
                      
                      {/* Show troubleshooting link for rate limit errors on OpenAI */}
                      {!testResult.success && selectedProvider === 'openai' && testResult.message.includes('limit') && (
                        <a
                          href="https://github.com/yourusername/my-ai-app/blob/main/docs/OPENAI_RATE_LIMIT_TROUBLESHOOTING.md"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 inline-flex items-center gap-1 text-sm font-medium hover:underline"
                        >
                          📖 Read full troubleshooting guide
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={handleTestConnection}
                  disabled={testingConnection || !apiKey.trim()}
                  className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50"
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
                  className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground hover:opacity-90 disabled:opacity-50"
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

              <div className="flex gap-2 items-center">
                {config && (
                  <button
                    onClick={handleRemoveConfig}
                    disabled={saving}
                    className="text-sm text-red-600 hover:underline"
                  >
                    Remove API configuration
                  </button>
                )}
                
                <button
                  onClick={runDebugCheck}
                  className="text-sm text-blue-600 hover:underline ml-auto"
                >
                  🔍 Run Debug Check
                </button>
              </div>
              
              {debugInfo && (
                <div className="mt-4 p-3 bg-gray-100 rounded text-xs font-mono overflow-auto max-h-96">
                  <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
                </div>
              )}
            </div>
          </div>

          {/* Info Box */}
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900">
                <p className="font-semibold mb-2">How it works:</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Your API key is stored securely and encrypted</li>
                  <li>All AI features will use your configured provider</li>
                  <li>You control costs and have unlimited usage</li>
                  <li>View detailed usage statistics in your account settings</li>
                  <li>Recommended: Start with Groq for FREE unlimited usage!</li>
                </ul>
              </div>
            </div>
          </div>

          {/* OpenAI Important Information */}
          {selectedProvider === 'openai' && (
            <div className="space-y-4">
              {/* Main Warning */}
              <div className="rounded-lg border-2 border-yellow-300 bg-yellow-50 p-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-6 w-6 text-yellow-600 shrink-0 mt-0.5" />
                  <div className="text-sm text-yellow-900">
                    <p className="font-bold text-base mb-3">⚠️ IMPORTANT: OpenAI "Rate Limit" Error Explained</p>
                    
                    <div className="mb-3 p-3 bg-white rounded border border-yellow-200">
                      <p className="font-semibold mb-1">Getting "rate limit exceeded" even though you NEVER used your API?</p>
                      <p className="text-yellow-800">
                        <strong>You're right - you didn't exceed anything!</strong> This error is misleading.
                      </p>
                    </div>

                    <div className="space-y-2 mb-3">
                      <p className="font-semibold">What's REALLY happening:</p>
                      <div className="ml-4 space-y-1">
                        <p>❌ Error does NOT mean: "You used too much"</p>
                        <p>✅ It ACTUALLY means: "Your account needs a payment method to work"</p>
                      </div>
                    </div>

                    <div className="p-3 bg-white rounded border border-yellow-200 mb-3">
                      <p className="font-semibold mb-2">The #1 Fix (works for 90% of people):</p>
                      <ol className="list-decimal list-inside space-y-1">
                        <li>Go to <a href="https://platform.openai.com/settings/organization/billing" target="_blank" rel="noopener noreferrer" className="underline font-bold">OpenAI Billing Settings</a></li>
                        <li>Add a payment method (credit card)</li>
                        <li>Add $5-10 in credits</li>
                        <li>Wait 5 minutes</li>
                        <li>Try testing your API key again</li>
                      </ol>
                    </div>

                    <p className="font-semibold mb-1">Don't want to add payment?</p>
                    <p className="mb-3">
                      Switch to <strong>Groq</strong> above - it's truly free with no payment method required!
                    </p>

                    <div className="flex gap-3">
                      <a
                        href="https://platform.openai.com/settings/organization/billing"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-yellow-600 text-white rounded font-medium hover:bg-yellow-700"
                      >
                        Add Payment Method
                        <ExternalLink className="h-3 w-3" />
                      </a>
                      <a
                        href="https://platform.openai.com/account/limits"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1.5 border border-yellow-600 text-yellow-900 rounded font-medium hover:bg-yellow-100"
                      >
                        Check Your Limits
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Info Box */}
          <div className="rounded-lg border border-border bg-white p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
              <div className="text-sm text-foreground">
                <p className="font-semibold mb-1">Tip:</p>
                <p className="text-muted-foreground">
                  You can also access settings from the profile menu in the sidebar for a quicker experience.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
