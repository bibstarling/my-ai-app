'use client';

import { useState } from 'react';

export default function SetupPage() {
  const [copied, setCopied] = useState(false);
  const projectRef = 'qtplretigutndftokplk';
  const sqlEditorUrl = `https://supabase.com/dashboard/project/${projectRef}/sql/new`;
  const tableEditorUrl = `https://supabase.com/dashboard/project/${projectRef}/editor`;

  const migrationSQL = `-- SQL content would be loaded here from the file`;

  const handleCopySQL = async () => {
    try {
      // Fetch the SQL file content
      const response = await fetch('/supabase/all-migrations-combined.sql');
      const sql = await response.text();
      
      await navigator.clipboard.writeText(sql);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (error) {
      console.error('Failed to copy:', error);
      alert('Failed to copy SQL. Please copy manually from: supabase/all-migrations-combined.sql');
    }
  };

  const handleOpenSQLEditor = () => {
    window.open(sqlEditorUrl, '_blank');
  };

  const handleViewTables = () => {
    window.open(tableEditorUrl, '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              🚀 Database Setup
            </h1>
            <p className="text-gray-600">
              Set up your Supabase database tables in 3 easy steps
            </p>
          </div>

          {/* Progress Steps */}
          <div className="space-y-6 mb-8">
            {/* Step 1 */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border-2 border-blue-200">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                  1
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    Copy Migration SQL
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Click the button below to copy the database schema SQL to your clipboard
                  </p>
                  <button
                    onClick={handleCopySQL}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md transition-all duration-200 transform hover:scale-105"
                  >
                    {copied ? '✅ Copied!' : '📋 Copy SQL to Clipboard'}
                  </button>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-accent/5 rounded-xl p-6 border-2 border-accent/20">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-accent text-white rounded-full flex items-center justify-center font-bold text-lg">
                  2
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    Open Supabase SQL Editor
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Open the SQL Editor in your Supabase dashboard
                  </p>
                  <button
                    onClick={handleOpenSQLEditor}
                    className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg shadow-md transition-all duration-200 transform hover:scale-105"
                  >
                    🔗 Open SQL Editor
                  </button>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border-2 border-green-200">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-green-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                  3
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    Paste & Run
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Paste the SQL into the editor and click the "Run" button
                  </p>
                  <div className="bg-green-100 border border-green-300 rounded-lg p-4">
                    <p className="text-sm text-green-800 font-medium">
                      💡 Tip: Use Ctrl+V (or Cmd+V on Mac) to paste, then click the green "Run" button in the top right
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* What Gets Created */}
          <div className="bg-gray-50 rounded-xl p-6 mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              📦 Tables That Will Be Created:
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { name: 'jobs', desc: 'Job listings' },
                { name: 'job_sources', desc: 'API data sources' },
                { name: 'job_sync_metrics', desc: 'Sync tracking' },
                { name: 'user_job_profiles', desc: 'User preferences' },
                { name: 'resumes', desc: 'Resume records' },
                { name: 'resume_sections', desc: 'Resume content' },
                { name: 'resume_adaptations', desc: 'Tailored resumes' },
                { name: 'cover_letters', desc: 'Cover letters' },
                { name: 'tracked_jobs', desc: 'Saved/applied jobs' },
              ].map((table) => (
                <div
                  key={table.name}
                  className="bg-white rounded-lg p-3 border border-gray-200"
                >
                  <p className="font-mono text-sm font-bold text-blue-600">
                    {table.name}
                  </p>
                  <p className="text-xs text-gray-600">{table.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Verify Button */}
          <div className="text-center">
            <p className="text-gray-600 mb-4">
              After running the SQL, verify the tables were created:
            </p>
            <button
              onClick={handleViewTables}
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-lg shadow-lg transition-all duration-200 transform hover:scale-105"
            >
              ✨ View Tables in Supabase
            </button>
          </div>

          {/* Manual Path */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <details className="cursor-pointer">
              <summary className="text-sm font-semibold text-gray-700 hover:text-gray-900">
                🛠️ Alternative: Manual Copy-Paste Instructions
              </summary>
              <div className="mt-4 p-4 bg-gray-50 rounded-lg text-sm text-gray-700 space-y-2">
                <p>1. Open: <code className="bg-white px-2 py-1 rounded">supabase/all-migrations-combined.sql</code></p>
                <p>2. Select all content and copy</p>
                <p>3. Go to SQL Editor in Supabase</p>
                <p>4. Paste and click Run</p>
              </div>
            </details>
          </div>
        </div>
      </div>
    </div>
  );
}
