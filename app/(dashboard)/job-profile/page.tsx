'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useNotification } from '@/app/hooks/useNotification';

interface JobProfile {
  resume_text?: string;
  skills_json: string[];
  target_titles: string[];
  seniority?: string;
  locations_allowed: string[];
  locations_excluded: string[];
  languages: string[];
  salary_min?: number;
  salary_max?: number;
  salary_currency: string;
  profile_context_text?: string;
  use_profile_context_for_matching: boolean;
  work_authorization_constraints: string[];
}

export default function JobProfilePage() {
  const { user } = useUser();
  const { showSuccess, showError, showInfo } = useNotification();
  const [profile, setProfile] = useState<JobProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [parsing, setParsing] = useState(false);
  
  const [skills, setSkills] = useState<string[]>([]);
  const [targetTitles, setTargetTitles] = useState<string[]>([]);
  const [seniority, setSeniority] = useState('Mid');
  const [locationsAllowed, setLocationsAllowed] = useState<string[]>(['Worldwide']);
  const [languages, setLanguages] = useState<string[]>(['en']);
  const [profileContext, setProfileContext] = useState('');
  const [useProfileContext, setUseProfileContext] = useState(false);
  const [platformProfileContext, setPlatformProfileContext] = useState('');
  
  const [newSkill, setNewSkill] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newLocation, setNewLocation] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      const res = await fetch('/api/job-profile');
      const data = await res.json();
      
      // Set platform profile context from main profile
      if (data.platformProfileContext) {
        setPlatformProfileContext(data.platformProfileContext);
        // Auto-populate profile context if not already set
        if (!data.profile?.profile_context_text) {
          setProfileContext(data.platformProfileContext);
        }
      }
      
      if (data.profile) {
        setProfile(data.profile);
        setSkills(data.profile.skills_json || []);
        setTargetTitles(data.profile.target_titles || []);
        setSeniority(data.profile.seniority || 'Mid');
        setLocationsAllowed(data.profile.locations_allowed || ['Worldwide']);
        setLanguages(data.profile.languages || ['en']);
        setProfileContext(data.profile.profile_context_text || data.platformProfileContext || '');
        setUseProfileContext(data.profile.use_profile_context_for_matching || false);
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
    } finally {
      setLoading(false);
    }
  }

  async function parseFromPlatformProfile() {
    if (!platformProfileContext.trim()) {
      showInfo('No platform profile found. Please set up your portfolio first.');
      return;
    }
    
    setParsing(true);
    
    try {
      const res = await fetch('/api/job-profile/parse-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resume_text: platformProfileContext }),
      });
      
      const data = await res.json();
      
      if (data.success && data.parsed) {
        setSkills(data.parsed.skills || []);
        setTargetTitles(data.parsed.target_titles || []);
        setSeniority(data.parsed.seniority || 'Mid');
        setLanguages(data.parsed.languages || ['en']);
        showSuccess('Profile parsed successfully! Review the extracted information below.');
      } else {
        showError(data.error || 'Failed to parse profile');
      }
    } catch (err) {
      console.error('Parse error:', err);
      showError('Failed to parse profile');
    } finally {
      setParsing(false);
    }
  }

  async function saveProfile() {
    setSaving(true);
    
    try {
      const res = await fetch('/api/job-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          skills_json: skills,
          target_titles: targetTitles,
          seniority,
          locations_allowed: locationsAllowed,
          locations_excluded: [],
          languages,
          salary_currency: 'USD',
          profile_context_text: profileContext,
          use_profile_context_for_matching: useProfileContext,
          work_authorization_constraints: [],
        }),
      });
      
      const data = await res.json();
      
      if (data.success) {
        showSuccess('Profile saved successfully!');
        setProfile(data.profile);
      } else {
        showError(data.error || 'Failed to save profile');
      }
    } catch (err) {
      console.error('Save error:', err);
      showError('Failed to save profile');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-12">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Job Search Profile</h1>
        <p className="text-gray-600">
          Your profile automatically uses your portfolio data. Configure your job search preferences below.
        </p>
      </div>
      
      {/* AI Parse Helper */}
      {platformProfileContext && (
        <section className="mb-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <div className="text-2xl">✨</div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-blue-900 mb-2">Quick Setup</h2>
              <p className="text-sm text-blue-800 mb-4">
                Parse your platform profile with AI to automatically extract skills, target roles, and preferences.
              </p>
              <button
                onClick={parseFromPlatformProfile}
                disabled={parsing}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {parsing ? 'Parsing Profile...' : 'Parse Profile with AI'}
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Target Roles */}
      <section className="mb-8 bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Target Roles</h2>
        <p className="text-sm text-gray-600 mb-4">
          What job titles are you looking for?
        </p>
        
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., Product Manager, Senior Engineer"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && newTitle.trim()) {
                setTargetTitles([...targetTitles, newTitle.trim()]);
                setNewTitle('');
              }
            }}
          />
          <button
            onClick={() => {
              if (newTitle.trim()) {
                setTargetTitles([...targetTitles, newTitle.trim()]);
                setNewTitle('');
              }
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Add
          </button>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {targetTitles.map((title, idx) => (
            <span
              key={idx}
              className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm flex items-center gap-2"
            >
              {title}
              <button
                onClick={() => setTargetTitles(targetTitles.filter((_, i) => i !== idx))}
                className="text-blue-600 hover:text-blue-800"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </section>

      {/* Skills */}
      <section className="mb-8 bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Skills</h2>
        
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="Add a skill..."
            value={newSkill}
            onChange={(e) => setNewSkill(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && newSkill.trim()) {
                setSkills([...skills, newSkill.trim()]);
                setNewSkill('');
              }
            }}
          />
          <button
            onClick={() => {
              if (newSkill.trim()) {
                setSkills([...skills, newSkill.trim()]);
                setNewSkill('');
              }
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Add
          </button>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {skills.map((skill, idx) => (
            <span
              key={idx}
              className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm flex items-center gap-2"
            >
              {skill}
              <button
                onClick={() => setSkills(skills.filter((_, i) => i !== idx))}
                className="text-gray-600 hover:text-gray-800"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </section>

      {/* Seniority & Location */}
      <section className="mb-8 bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Preferences</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Seniority Level
            </label>
            <select
              value={seniority}
              onChange={(e) => setSeniority(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="Junior">Junior</option>
              <option value="Mid">Mid</option>
              <option value="Senior">Senior</option>
              <option value="Executive">Executive</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Allowed Locations
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., US, Brazil, Worldwide"
                value={newLocation}
                onChange={(e) => setNewLocation(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newLocation.trim()) {
                    setLocationsAllowed([...locationsAllowed, newLocation.trim()]);
                    setNewLocation('');
                  }
                }}
              />
              <button
                onClick={() => {
                  if (newLocation.trim()) {
                    setLocationsAllowed([...locationsAllowed, newLocation.trim()]);
                    setNewLocation('');
                  }
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {locationsAllowed.map((loc, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm flex items-center gap-2"
                >
                  {loc}
                  <button
                    onClick={() => setLocationsAllowed(locationsAllowed.filter((_, i) => i !== idx))}
                    className="text-green-600 hover:text-green-800"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Profile Context */}
      <section className="mb-8 bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold">Profile Context</h2>
            {platformProfileContext && (
              <p className="text-xs text-blue-600 mt-1">
                ✨ Auto-populated from your main platform profile
              </p>
            )}
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={useProfileContext}
              onChange={(e) => setUseProfileContext(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">
              Use for matching
            </span>
          </label>
        </div>
        
        <p className="text-sm text-gray-600 mb-4">
          This context is automatically loaded from your main profile (portfolio). 
          You can edit it to add career goals, preferred industries, company stage preferences, etc. 
          Enable "Use for matching" to influence job recommendations.
        </p>
        
        <textarea
          className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="e.g., I want to work in AI/ML, preferably at early-stage startups building developer tools..."
          value={profileContext}
          onChange={(e) => setProfileContext(e.target.value)}
        />
        
        {platformProfileContext && profileContext !== platformProfileContext && (
          <button
            onClick={() => setProfileContext(platformProfileContext)}
            className="mt-2 text-sm text-blue-600 hover:text-blue-800"
          >
            ↻ Reset to platform profile
          </button>
        )}
      </section>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={saveProfile}
          disabled={saving || targetTitles.length === 0}
          className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold"
        >
          {saving ? 'Saving...' : 'Save Profile'}
        </button>
      </div>
    </div>
  );
}
