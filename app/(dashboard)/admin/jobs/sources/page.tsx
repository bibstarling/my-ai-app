'use client';

import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { Modal } from '@/app/components/Modal';
import { 
  Plus, 
  Trash2, 
  Play, 
  Pause, 
  RefreshCw, 
  ExternalLink,
  CheckCircle,
  XCircle,
  Clock,
  Info,
  AlertCircle,
  Key,
  Edit,
  Database,
  Globe,
} from 'lucide-react';

interface SourceConfig {
  id: string;
  source_key: string;
  source_type: 'api' | 'scraper';
  name: string;
  description?: string;
  config: Record<string, any>;
  enabled: boolean;
  is_built_in: boolean;
  last_sync_at?: string;
  last_sync_status?: string;
  last_sync_jobs_count?: number;
  last_error?: string;
}

export default function JobSourcesPage() {
  const [sources, setSources] = useState<SourceConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSource, setEditingSource] = useState<SourceConfig | null>(null);
  const [testingSource, setTestingSource] = useState<string | null>(null);
  
  // Modal state
  const [modal, setModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    variant: 'info' | 'success' | 'warning' | 'error';
  }>({
    isOpen: false,
    title: '',
    message: '',
    variant: 'info',
  });

  useEffect(() => {
    loadSources();
  }, []);

  async function loadSources() {
    try {
      const res = await fetch('/api/admin/jobs/sources');
      const data = await res.json();
      setSources(data.sources || []);
    } catch (error) {
      console.error('Failed to load sources:', error);
    } finally {
      setLoading(false);
    }
  }

  async function testSource(source: SourceConfig) {
    console.log('[Test Source] Testing source:', source.name, 'with key:', source.source_key);
    setTestingSource(source.source_key);
    
    try {
      const url = `/api/admin/jobs/sources/${source.source_key}/test`;
      console.log('[Test Source] Request URL:', url);
      
      const res = await fetch(url, {
        method: 'POST',
      });
      
      const data = await res.json();
      console.log('[Test Source] Response:', data);
      
      if (data.success) {
        setModal({
          isOpen: true,
          title: 'Test Successful!',
          message: `Found ${data.jobs_count} jobs from ${source.name}. The source is working correctly.`,
          variant: 'success',
        });
        await loadSources(); // Refresh to show updated status
      } else {
        setModal({
          isOpen: true,
          title: 'Test Failed',
          message: data.error || `Could not fetch jobs from ${source.name}. Check the configuration.`,
          variant: 'error',
        });
      }
    } catch (error) {
      setModal({
        isOpen: true,
        title: 'Test Error',
        message: 'Something went wrong while testing the source.',
        variant: 'error',
      });
    } finally {
      setTestingSource(null);
    }
  }

  async function toggleSource(source: SourceConfig, enabled: boolean) {
    try {
      const res = await fetch(`/api/admin/jobs/sources/${source.source_key}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled }),
      });
      
      if (res.ok) {
        await loadSources();
      }
    } catch (error) {
      console.error('Failed to toggle source:', error);
    }
  }

  async function deleteSource(source: SourceConfig) {
    if (source.is_built_in) {
      setModal({
        isOpen: true,
        title: 'Cannot Delete',
        message: 'Built-in sources cannot be deleted. You can disable them instead.',
        variant: 'warning',
      });
      return;
    }
    
    if (!confirm(`Are you sure you want to delete "${source.name}"?`)) return;
    
    try {
      const res = await fetch(`/api/admin/jobs/sources/${source.source_key}`, {
        method: 'DELETE',
      });
      
      if (res.ok) {
        await loadSources();
        setModal({
          isOpen: true,
          title: 'Source Deleted',
          message: 'The job source has been removed.',
          variant: 'success',
        });
      }
    } catch (error) {
      console.error('Failed to delete source:', error);
    }
  }

  function getStatusIcon(status?: string) {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  }

  function getSourceIcon(source: SourceConfig) {
    if (source.source_type === 'api') {
      return <Database className="w-5 h-5 text-blue-600" />;
    } else {
      return <Globe className="w-5 h-5 text-purple-600" />;
    }
  }

  const builtInSources = sources.filter(s => s.is_built_in);
  const customSources = sources.filter(s => !s.is_built_in);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Job Sources</h1>
            <p className="text-gray-600 mt-1">
              Manage all job board sources and API integrations
            </p>
          </div>
          
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            <Plus className="w-5 h-5" />
            Add Custom Source
          </button>
        </div>

        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900">
            <p className="font-medium mb-1">Source Types:</p>
            <ul className="list-disc list-inside space-y-1 text-blue-800">
              <li><strong>Built-in APIs</strong>: Pre-configured job board APIs (RemoteOK, Adzuna, etc.)</li>
              <li><strong>Custom Scrapers</strong>: Your own job board sources (RSS feeds, HTML pages, JSON APIs)</li>
              <li>Enable/disable sources to control which ones run in the daily pipeline</li>
              <li>Test sources to verify they're working before enabling them</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Built-in Sources */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Database className="w-5 h-5" />
          Built-in API Sources
        </h2>
        
        <div className="space-y-4">
          {builtInSources.map((source) => (
            <SourceCard
              key={source.source_key}
              source={source}
              onTest={testSource}
              onToggle={toggleSource}
              onDelete={deleteSource}
              onEdit={setEditingSource}
              isTesting={testingSource === source.source_key}
              getStatusIcon={getStatusIcon}
              getSourceIcon={getSourceIcon}
            />
          ))}
        </div>
      </div>

      {/* Custom Sources */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Globe className="w-5 h-5" />
          Custom Scraper Sources
        </h2>
        
        {customSources.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ExternalLink className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No custom sources yet
            </h3>
            <p className="text-gray-600 mb-6">
              Add your first custom job board source to start scraping jobs
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              Add First Source
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {customSources.map((source) => (
              <SourceCard
                key={source.source_key}
                source={source}
                onTest={testSource}
                onToggle={toggleSource}
                onDelete={deleteSource}
                onEdit={setEditingSource}
                isTesting={testingSource === source.source_key}
                getStatusIcon={getStatusIcon}
                getSourceIcon={getSourceIcon}
              />
            ))}
          </div>
        )}
      </div>

      {/* Add Source Modal */}
      {showAddModal && (
        <AddSourceModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            loadSources();
          }}
        />
      )}

      {/* Edit Source Modal */}
      {editingSource && (
        <EditSourceModal
          source={editingSource}
          onClose={() => setEditingSource(null)}
          onSuccess={() => {
            setEditingSource(null);
            loadSources();
          }}
        />
      )}

      {/* Info Modal */}
      <Modal
        isOpen={modal.isOpen}
        onClose={() => setModal({ ...modal, isOpen: false })}
        title={modal.title}
        variant={modal.variant}
        icon={
          modal.variant === 'success' ? <CheckCircle className="w-6 h-6" /> :
          modal.variant === 'error' ? <AlertCircle className="w-6 h-6" /> :
          modal.variant === 'warning' ? <AlertCircle className="w-6 h-6" /> :
          <Info className="w-6 h-6" />
        }
        footer={
          <button
            onClick={() => setModal({ ...modal, isOpen: false })}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            Got it
          </button>
        }
      >
        <p>{modal.message}</p>
      </Modal>
    </div>
  );
}

// Source Card Component
function SourceCard({
  source,
  onTest,
  onToggle,
  onDelete,
  onEdit,
  isTesting,
  getStatusIcon,
  getSourceIcon,
}: {
  source: SourceConfig;
  onTest: (source: SourceConfig) => void;
  onToggle: (source: SourceConfig, enabled: boolean) => void;
  onDelete: (source: SourceConfig) => void;
  onEdit: (source: SourceConfig) => void;
  isTesting: boolean;
  getStatusIcon: (status?: string) => React.ReactElement;
  getSourceIcon: (source: SourceConfig) => React.ReactElement;
}) {
  const needsConfig = source.source_type === 'api' && 
    source.source_key === 'adzuna' &&
    (!source.config.api_key || source.config.api_key === '');

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            {getSourceIcon(source)}
            <h3 className="text-lg font-semibold text-gray-900">
              {source.name}
            </h3>
            
            {source.is_built_in && (
              <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full font-medium">
                Built-in
              </span>
            )}
            
            <span className={`px-2 py-1 text-xs rounded-full font-medium ${
              source.source_type === 'api' 
                ? 'bg-blue-100 text-blue-800'
                : 'bg-purple-100 text-purple-800'
            }`}>
              {source.source_type === 'api' ? 'API' : 'Scraper'}
            </span>
            
            {source.enabled ? (
              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                Enabled
              </span>
            ) : (
              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                Disabled
              </span>
            )}
            
            {needsConfig && (
              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full flex items-center gap-1">
                <Key className="w-3 h-3" />
                Config Required
              </span>
            )}
          </div>
          
          {source.description && (
            <p className="text-gray-600 text-sm mb-3">{source.description}</p>
          )}
          
          {source.config.url && (
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
              <ExternalLink className="w-4 h-4" />
              <a
                href={source.config.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline truncate max-w-md"
              >
                {source.config.url}
              </a>
            </div>
          )}
          
          {/* Status */}
          {source.last_sync_at && (
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                {getStatusIcon(source.last_sync_status)}
                <span className="text-gray-700">
                  Last sync: {new Date(source.last_sync_at).toLocaleString()}
                </span>
              </div>
              
              {source.last_sync_jobs_count !== undefined && (
                <span className="text-gray-600">
                  {source.last_sync_jobs_count} jobs found
                </span>
              )}
            </div>
          )}
          
          {source.last_error && (
            <div className="mt-2 flex items-start gap-2 text-sm text-red-700 bg-red-50 p-2 rounded">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{source.last_error}</span>
            </div>
          )}
        </div>
        
        {/* Actions */}
        <div className="flex items-center gap-2">
          {source.source_type === 'scraper' && (
            <button
              onClick={() => onTest(source)}
              disabled={isTesting}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
              title="Test source"
            >
              {isTesting ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <Play className="w-5 h-5" />
              )}
            </button>
          )}
          
          <button
            onClick={() => onEdit(source)}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="Configure"
          >
            {source.source_type === 'api' ? (
              <Key className="w-5 h-5" />
            ) : (
              <Edit className="w-5 h-5" />
            )}
          </button>
          
          <button
            onClick={() => onToggle(source, !source.enabled)}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title={source.enabled ? 'Disable' : 'Enable'}
          >
            {source.enabled ? (
              <Pause className="w-5 h-5" />
            ) : (
              <Play className="w-5 h-5" />
            )}
          </button>
          
          {!source.is_built_in && (
            <button
              onClick={() => onDelete(source)}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Delete source"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Add Source Modal Component
function AddSourceModal({ 
  onClose, 
  onSuccess 
}: { 
  onClose: () => void; 
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    description: '',
    source_type: 'rss' as 'rss' | 'html_list' | 'json_api',
  });
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch('/api/admin/jobs/sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        onSuccess();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to add source');
      }
    } catch (error) {
      alert('Failed to add source');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="relative w-full max-w-2xl mx-4 bg-white rounded-xl shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Add Custom Job Source</h2>
            <p className="text-sm text-gray-600 mt-1">
              Add a job board URL to scrape for jobs
            </p>
          </div>

          {/* Body */}
          <div className="px-6 py-4 space-y-4 max-h-[60vh] overflow-y-auto">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Source Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., WeWorkRemotely Programming"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                URL *
              </label>
              <input
                type="url"
                required
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                placeholder="https://weworkremotely.com/categories/remote-programming-jobs/rss"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Source Type *
              </label>
              <select
                value={formData.source_type}
                onChange={(e) => setFormData({ ...formData, source_type: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="rss">RSS Feed (Recommended)</option>
                <option value="html_list">HTML List (Advanced)</option>
                <option value="json_api">JSON API (Advanced)</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                RSS feeds are the easiest to set up. HTML/JSON require custom selectors.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description (Optional)
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="What kind of jobs does this source provide?"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50"
            >
              {saving ? 'Adding...' : 'Add Source'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Edit Source Modal Component
function EditSourceModal({
  source,
  onClose,
  onSuccess,
}: {
  source: SourceConfig;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    name: source.name,
    description: source.description || '',
    config: source.config,
  });
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch(`/api/admin/jobs/sources/${source.source_key}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        onSuccess();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to update source');
      }
    } catch (error) {
      alert('Failed to update source');
    } finally {
      setSaving(false);
    }
  }

  function updateConfig(key: string, value: string) {
    setFormData({
      ...formData,
      config: {
        ...formData.config,
        [key]: value,
      },
    });
  }

  const isApiSource = source.source_type === 'api';
  const requiresApiKey = source.source_key === 'adzuna' || source.source_key === 'getonboard';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="relative w-full max-w-2xl mx-4 bg-white rounded-xl shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Configure {source.name}</h2>
            <p className="text-sm text-gray-600 mt-1">
              {isApiSource ? 'Update API configuration' : 'Update source settings'}
            </p>
          </div>

          <div className="px-6 py-4 space-y-4 max-h-[60vh] overflow-y-auto">
            {!source.is_built_in && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Source Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {isApiSource && requiresApiKey && (
              <>
                {source.source_key === 'adzuna' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                        <Key className="w-4 h-4" />
                        Adzuna API Key *
                      </label>
                      <input
                        type="password"
                        value={formData.config.api_key || ''}
                        onChange={(e) => updateConfig('api_key', e.target.value)}
                        placeholder="Enter your Adzuna API key"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Get your API key from <a href="https://developer.adzuna.com/" target="_blank" className="text-blue-600 hover:underline">Adzuna Developer Portal</a>
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Adzuna App ID *
                      </label>
                      <input
                        type="text"
                        value={formData.config.app_id || ''}
                        onChange={(e) => updateConfig('app_id', e.target.value)}
                        placeholder="Enter your Adzuna App ID"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </>
                )}
                
                {source.source_key === 'getonboard' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                      <Key className="w-4 h-4" />
                      GetOnBoard API Key (Optional)
                    </label>
                    <input
                      type="password"
                      value={formData.config.api_key || ''}
                      onChange={(e) => updateConfig('api_key', e.target.value)}
                      placeholder="Optional - for higher rate limits"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      GetOnBoard is a public API. API key is optional but provides higher rate limits.
                    </p>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
