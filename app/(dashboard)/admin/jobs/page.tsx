'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { ArrowLeft, Play, RefreshCw, Database, AlertCircle } from 'lucide-react';
import { useNotification } from '@/app/hooks/useNotification';

interface SyncMetrics {
  source: string;
  source_name?: string;
  source_type?: 'api' | 'scraper';
  is_built_in?: boolean;
  enabled?: boolean;
  last_sync_at?: string;
  last_sync_status?: string;
  jobs_fetched: number;
  jobs_upserted: number;
  duplicates_found: number;
  errors_count: number;
}

interface PipelineStats {
  jobs_fetched: number;
  jobs_normalized: number;
  jobs_created: number;
  jobs_deduplicated: number;
  duration_ms: number;
}

export default function AdminJobsPage() {
  const { user } = useUser();
  const { showSuccess, showError, confirm } = useNotification();
  const [metrics, setMetrics] = useState<SyncMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [lastRun, setLastRun] = useState<PipelineStats | null>(null);
  const [totalJobs, setTotalJobs] = useState(0);

  useEffect(() => {
    loadMetrics();
    loadJobStats();
  }, []);

  async function loadMetrics() {
    try {
      const res = await fetch('/api/admin/jobs/metrics');
      const data = await res.json();
      setMetrics(data.metrics || []);
    } catch (err) {
      console.error('Failed to load metrics:', err);
    } finally {
      setLoading(false);
    }
  }

  async function loadJobStats() {
    try {
      const res = await fetch('/api/jobs/ingestion?limit=1');
      const data = await res.json();
      // This should ideally come from a stats endpoint
      // For now, we'll show metrics from the sync
    } catch (err) {
      console.error('Failed to load job stats:', err);
    }
  }

  async function runPipeline() {
    const confirmed = await confirm('Run the full job ingestion pipeline? This may take several minutes.', {
      title: 'Run Pipeline',
      type: 'warning',
      confirmText: 'Run',
      cancelText: 'Cancel',
    });
    if (!confirmed) return;

    setRunning(true);

    try {
      const res = await fetch('/api/admin/jobs/pipeline', {
        method: 'POST',
      });
      
      const data = await res.json();
      
      if (data.success) {
        setLastRun(data.stats);
        showSuccess('Pipeline completed successfully!');
        await loadMetrics();
      } else {
        showError(`Pipeline failed: ${data.errors?.join(', ') || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Pipeline error:', err);
      showError('Failed to run pipeline');
    } finally {
      setRunning(false);
    }
  }

  function formatDate(dateStr?: string) {
    if (!dateStr) return 'Never';
    const date = new Date(dateStr);
    return date.toLocaleString();
  }

  function formatDuration(ms: number) {
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  }

  // Calculate total jobs from metrics
  const calculatedTotal = metrics.reduce((sum, m) => sum + (m.jobs_upserted || 0), 0);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="text-center py-12">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header with Navigation */}
      <div className="mb-6">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Admin Dashboard
        </Link>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Job Intelligence Pipeline</h1>
            <p className="text-sm text-gray-600 mt-1">
              Monitor ingestion health and manage job sources
            </p>
          </div>
          
          <button
            onClick={runPipeline}
            disabled={running}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2 font-medium shadow-sm"
          >
            {running ? (
              <>
                <RefreshCw className="h-5 w-5 animate-spin" />
                Running...
              </>
            ) : (
              <>
                <Play className="h-5 w-5" />
                Run Pipeline
              </>
            )}
          </button>
        </div>
      </div>

      {/* Cron Job Status */}
      <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Database className="h-5 w-5 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-blue-900 mb-1">Automated Daily Ingestion</h3>
            <p className="text-sm text-blue-800">
              Cron job runs automatically every day at <strong>midnight UTC</strong>. 
              Jobs are refreshed from all sources, normalized, and deduplicated.
            </p>
            <p className="text-xs text-blue-700 mt-2">
              📅 Next run: {new Date(new Date().setHours(24, 0, 0, 0)).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-1">Total Jobs</div>
          <div className="text-3xl font-bold text-gray-900">{calculatedTotal.toLocaleString()}</div>
          <div className="text-xs text-gray-500 mt-1">Active in database</div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-1">Active Sources</div>
          <div className="text-3xl font-bold text-green-600">
            {metrics.filter(m => m.last_sync_status === 'success').length}
          </div>
          <div className="text-xs text-gray-500 mt-1">Healthy & syncing</div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-1">Failed Sources</div>
          <div className="text-3xl font-bold text-red-600">
            {metrics.filter(m => m.last_sync_status === 'failed').length}
          </div>
          <div className="text-xs text-gray-500 mt-1">Needs attention</div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-1">Duplicates Merged</div>
          <div className="text-3xl font-bold text-blue-600">
            {metrics.reduce((sum, m) => sum + (m.duplicates_found || 0), 0)}
          </div>
          <div className="text-xs text-gray-500 mt-1">Deduplication rate</div>
        </div>
      </div>

      {/* Last Pipeline Run */}
      {lastRun && (
        <div className="mb-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-blue-900 mb-4 flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Last Pipeline Run
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
            <div>
              <div className="text-blue-700 font-medium">Fetched</div>
              <div className="text-blue-900 text-xl font-bold">{lastRun.jobs_fetched}</div>
            </div>
            <div>
              <div className="text-blue-700 font-medium">Created</div>
              <div className="text-blue-900 text-xl font-bold">{lastRun.jobs_created}</div>
            </div>
            <div>
              <div className="text-blue-700 font-medium">Deduplicated</div>
              <div className="text-blue-900 text-xl font-bold">{lastRun.jobs_deduplicated}</div>
            </div>
            <div>
              <div className="text-blue-700 font-medium">Duration</div>
              <div className="text-blue-900 text-xl font-bold">{formatDuration(lastRun.duration_ms)}</div>
            </div>
            <div>
              <div className="text-blue-700 font-medium">Success Rate</div>
              <div className="text-blue-900 text-xl font-bold">
                {lastRun.jobs_fetched > 0
                  ? Math.round((lastRun.jobs_created / lastRun.jobs_fetched) * 100)
                  : 0}%
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Source Health */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-900">Source Health</h2>
          <p className="text-sm text-gray-600 mt-1">Real-time status of job ingestion sources</p>
        </div>
        
        {metrics.length === 0 ? (
          <div className="p-12 text-center">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Data Yet</h3>
            <p className="text-gray-600 mb-6">Run the pipeline to start ingesting jobs</p>
            <button
              onClick={runPipeline}
              disabled={running}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 inline-flex items-center gap-2"
            >
              <Play className="h-4 w-4" />
              Run First Ingestion
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Source
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Sync
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Jobs Fetched
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Jobs Stored
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Duplicates
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Errors
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {metrics.map((metric) => (
                  <tr key={metric.source} className={`hover:bg-gray-50 transition-colors ${!metric.enabled ? 'opacity-60' : ''}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">
                          {metric.source_name || metric.source}
                        </span>
                        {metric.is_built_in && (
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded-full font-medium">
                            Built-in
                          </span>
                        )}
                        {metric.source_type && (
                          <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                            metric.source_type === 'api' 
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-purple-100 text-purple-800'
                          }`}>
                            {metric.source_type === 'api' ? 'API' : 'Scraper'}
                          </span>
                        )}
                        {!metric.enabled && (
                          <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs rounded-full font-medium">
                            Disabled
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs rounded-full font-medium ${
                          metric.last_sync_status === 'success'
                            ? 'bg-green-100 text-green-800'
                            : metric.last_sync_status === 'failed'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {metric.last_sync_status || 'pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {formatDate(metric.last_sync_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900 font-medium">
                      {metric.jobs_fetched}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900 font-medium">
                      {metric.jobs_upserted}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-blue-600 font-medium">
                      {metric.duplicates_found || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <span className={metric.errors_count > 0 ? 'text-red-600 font-medium' : 'text-gray-900'}>
                        {metric.errors_count}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="mt-8 bg-gray-50 rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Database className="h-5 w-5 text-gray-700" />
          How It Works
        </h3>
        <div className="space-y-3 text-sm text-gray-700">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs font-bold text-blue-700">1</span>
            </div>
            <div>
              <strong>Automated Daily Sync:</strong> Cron job runs every day at midnight UTC to fetch fresh jobs.
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs font-bold text-blue-700">2</span>
            </div>
            <div>
              <strong>Manual Trigger:</strong> Click "Run Pipeline" above to fetch jobs on-demand (useful for testing or urgent updates).
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs font-bold text-blue-700">3</span>
            </div>
            <div>
              <strong>Sources:</strong> RemoteOK and Remotive work out-of-the-box. Add Adzuna and GetOnBoard API keys for more coverage.
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs font-bold text-blue-700">4</span>
            </div>
            <div>
              <strong>Monitoring:</strong> Green status = healthy. Red = errors (check logs). Duplicates = jobs merged from multiple sources.
            </div>
          </div>
        </div>
        
        <div className="mt-6 pt-4 border-t border-gray-200">
          <h4 className="font-semibold text-gray-900 mb-2">Quick Links</h4>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/job-profile"
              className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
            >
              → Set up Job Profile
            </Link>
            <Link
              href="/jobs/discover"
              className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
            >
              → Discover Jobs
            </Link>
            <a
              href="/docs/CRON_SETUP.md"
              target="_blank"
              className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
            >
              → Cron Setup Guide
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
