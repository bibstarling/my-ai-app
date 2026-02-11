'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { Sparkles, Upload, Save, Loader2, User, Briefcase, Target, MapPin, Languages, DollarSign, Settings } from 'lucide-react';
import { useNotification } from '@/app/hooks/useNotification';

interface Experience {
  title: string;
  company: string;
  location: string;
  period: string;
  description: string;
  highlights: string[];
}

interface Project {
  title: string;
  description: string;
  technologies: string[];
  outcome: string;
  url?: string;
}

interface Education {
  degree: string;
  institution: string;
  year: string;
}

interface ProfileData {
  // Basic Info
  fullName: string;
  email: string;
  phone: string;
  location: string;
  linkedinUrl: string;
  githubUrl: string;
  websiteUrl: string;
  title: string;
  tagline: string;
  about: string;
  
  // Professional Data
  experiences: Experience[];
  projects: Project[];
  skills: { [category: string]: string[] };
  education: Education[];
  certifications: { name: string; issuer: string; year?: string }[];
  languages: string[];
  
  // Job Search Preferences
  targetTitles: string[];
  seniority: string;
  locationsAllowed: string[];
  preferredLanguages: string[];
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency: string;
  profileContextText: string;
  useProfileContextForMatching: boolean;
}

export default function ComprehensiveProfilePage() {
  const { user } = useUser();
  const { showSuccess, showError, showInfo } = useNotification();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [activeTab, setActiveTab] = useState<'basic' | 'professional' | 'job-search'>('basic');
  
  // State for all profile data
  const [profileData, setProfileData] = useState<ProfileData>({
    fullName: '',
    email: '',
    phone: '',
    location: '',
    linkedinUrl: '',
    githubUrl: '',
    websiteUrl: '',
    title: '',
    tagline: '',
    about: '',
    experiences: [],
    projects: [],
    skills: {},
    education: [],
    certifications: [],
    languages: [],
    targetTitles: [],
    seniority: 'Mid',
    locationsAllowed: ['Worldwide'],
    preferredLanguages: ['en'],
    salaryMin: undefined,
    salaryMax: undefined,
    salaryCurrency: 'USD',
    profileContextText: '',
    useProfileContextForMatching: false,
  });
  
  const [resumeInput, setResumeInput] = useState('');
  const [newSkill, setNewSkill] = useState({ category: '', skill: '' });
  const [newExperience, setNewExperience] = useState<Experience>({
    title: '',
    company: '',
    location: '',
    period: '',
    description: '',
    highlights: [],
  });

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      // Load portfolio data
      const portfolioRes = await fetch('/api/portfolio/current');
      const portfolioData = await portfolioRes.json();
      
      // Load job profile data
      const jobProfileRes = await fetch('/api/job-profile');
      const jobProfileData = await jobProfileRes.json();
      
      // Merge data
      const portfolio = portfolioData.portfolio?.portfolio_data || {};
      const jobProfile = jobProfileData.profile || {};
      
      setProfileData({
        // Basic info from portfolio
        fullName: portfolio.fullName || user?.fullName || '',
        email: portfolio.email || user?.primaryEmailAddress?.emailAddress || '',
        phone: portfolio.phone || '',
        location: portfolio.location || '',
        linkedinUrl: portfolio.linkedinUrl || '',
        githubUrl: portfolio.githubUrl || '',
        websiteUrl: portfolio.websiteUrl || '',
        title: portfolio.title || '',
        tagline: portfolio.tagline || '',
        about: portfolio.about || '',
        
        // Professional data from portfolio
        experiences: portfolio.experiences || [],
        projects: portfolio.projects || [],
        skills: portfolio.skills || {},
        education: portfolio.education || [],
        certifications: portfolio.certifications || [],
        languages: portfolio.languages || [],
        
        // Job search from job profile
        targetTitles: jobProfile.target_titles || [],
        seniority: jobProfile.seniority || 'Mid',
        locationsAllowed: jobProfile.locations_allowed || ['Worldwide'],
        preferredLanguages: jobProfile.languages || ['en'],
        salaryMin: jobProfile.salary_min,
        salaryMax: jobProfile.salary_max,
        salaryCurrency: jobProfile.salary_currency || 'USD',
        profileContextText: jobProfile.profile_context_text || jobProfileData.platformProfileContext || '',
        useProfileContextForMatching: jobProfile.use_profile_context_for_matching || false,
      });
      
    } catch (err) {
      console.error('Failed to load profile:', err);
    } finally {
      setLoading(false);
    }
  }

  async function parseWithAI() {
    if (!resumeInput.trim()) {
      showError('Please enter your resume or profile information to parse');
      return;
    }
    
    setParsing(true);
    
    try {
      const res = await fetch('/api/profile/parse-comprehensive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: resumeInput }),
      });
      
      const data = await res.json();
      
      if (data.success && data.parsed) {
        // Update all fields with parsed data
        setProfileData(prev => ({
          ...prev,
          ...data.parsed,
          experiences: data.parsed.experiences || prev.experiences,
          projects: data.parsed.projects || prev.projects,
          skills: { ...prev.skills, ...data.parsed.skills },
          education: data.parsed.education || prev.education,
          certifications: data.parsed.certifications || prev.certifications,
        }));
        
        showSuccess('✨ Profile parsed successfully! Review and edit the information below.');
        setResumeInput(''); // Clear input after parsing
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
      // Save to portfolio
      const portfolioRes = await fetch('/api/portfolio/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          portfolioData: {
            fullName: profileData.fullName,
            email: profileData.email,
            phone: profileData.phone,
            location: profileData.location,
            linkedinUrl: profileData.linkedinUrl,
            githubUrl: profileData.githubUrl,
            websiteUrl: profileData.websiteUrl,
            title: profileData.title,
            tagline: profileData.tagline,
            about: profileData.about,
            experiences: profileData.experiences,
            projects: profileData.projects,
            skills: profileData.skills,
            education: profileData.education,
            certifications: profileData.certifications,
            languages: profileData.languages,
          },
        }),
      });
      
      // Save to job profile
      const jobProfileRes = await fetch('/api/job-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          skills_json: Object.values(profileData.skills).flat(),
          target_titles: profileData.targetTitles,
          seniority: profileData.seniority,
          locations_allowed: profileData.locationsAllowed,
          locations_excluded: [],
          languages: profileData.preferredLanguages,
          salary_min: profileData.salaryMin,
          salary_max: profileData.salaryMax,
          salary_currency: profileData.salaryCurrency,
          profile_context_text: profileData.profileContextText,
          use_profile_context_for_matching: profileData.useProfileContextForMatching,
          work_authorization_constraints: [],
        }),
      });
      
      const portfolioData = await portfolioRes.json();
      const jobProfileData = await jobProfileRes.json();
      
      if (portfolioData.success && jobProfileData.success) {
        showSuccess('✅ Profile saved successfully!');
      } else {
        throw new Error('Failed to save profile');
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
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Comprehensive Profile</h1>
        <p className="text-gray-600">
          Your complete professional profile. Powers resumes, cover letters, and job matching.
        </p>
      </div>

      {/* AI Parse Section */}
      <section className="mb-8 bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <Sparkles className="h-6 w-6 text-blue-600 mt-1 flex-shrink-0" />
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-blue-900 mb-2">✨ AI-Powered Profile Builder</h2>
            <p className="text-sm text-blue-800 mb-4">
              Paste your resume, LinkedIn profile, or any professional information. 
              AI will automatically extract and populate all fields below.
            </p>
            
            <textarea
              className="w-full h-32 px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-3"
              placeholder="Paste your resume, LinkedIn profile, or professional bio here..."
              value={resumeInput}
              onChange={(e) => setResumeInput(e.target.value)}
            />
            
            <button
              onClick={parseWithAI}
              disabled={parsing || !resumeInput.trim()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed inline-flex items-center gap-2"
            >
              {parsing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Parsing...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Parse with AI
                </>
              )}
            </button>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <div className="flex gap-6">
          <button
            onClick={() => setActiveTab('basic')}
            className={`pb-3 px-1 border-b-2 font-medium transition-colors ${
              activeTab === 'basic'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <User className="h-4 w-4 inline mr-2" />
            Basic Info
          </button>
          <button
            onClick={() => setActiveTab('professional')}
            className={`pb-3 px-1 border-b-2 font-medium transition-colors ${
              activeTab === 'professional'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <Briefcase className="h-4 w-4 inline mr-2" />
            Professional
          </button>
          <button
            onClick={() => setActiveTab('job-search')}
            className={`pb-3 px-1 border-b-2 font-medium transition-colors ${
              activeTab === 'job-search'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <Target className="h-4 w-4 inline mr-2" />
            Job Search
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'basic' && (
        <div className="space-y-6">
          {/* Basic Info */}
          <section className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={profileData.fullName}
                  onChange={(e) => setProfileData({ ...profileData, fullName: e.target.value })}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Professional Title
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Senior Product Manager"
                  value={profileData.title}
                  onChange={(e) => setProfileData({ ...profileData, title: e.target.value })}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={profileData.email}
                  onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={profileData.phone}
                  onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., San Francisco, CA"
                  value={profileData.location}
                  onChange={(e) => setProfileData({ ...profileData, location: e.target.value })}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  LinkedIn URL
                </label>
                <input
                  type="url"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={profileData.linkedinUrl}
                  onChange={(e) => setProfileData({ ...profileData, linkedinUrl: e.target.value })}
                />
              </div>
            </div>
            
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Professional Summary
              </label>
              <textarea
                className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Brief overview of your professional background..."
                value={profileData.about}
                onChange={(e) => setProfileData({ ...profileData, about: e.target.value })}
              />
            </div>
          </section>
        </div>
      )}

      {activeTab === 'professional' && (
        <div className="space-y-6">
          {/* Experience */}
          <section className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Experience</h2>
            <p className="text-sm text-gray-600 mb-4">
              {profileData.experiences.length} {profileData.experiences.length === 1 ? 'position' : 'positions'} added
            </p>
            {/* Simplified - just show count for now, can expand later */}
          </section>

          {/* Skills */}
          <section className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Skills</h2>
            {Object.entries(profileData.skills).map(([category, skills]) => (
              <div key={category} className="mb-4">
                <h3 className="font-medium text-gray-900 mb-2 capitalize">{category}</h3>
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </section>
        </div>
      )}

      {activeTab === 'job-search' && (
        <div className="space-y-6">
          {/* Target Roles */}
          <section className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Target Job Titles</h2>
            <div className="flex flex-wrap gap-2 mb-3">
              {profileData.targetTitles.map((title, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm flex items-center gap-2"
                >
                  {title}
                  <button
                    onClick={() => setProfileData({
                      ...profileData,
                      targetTitles: profileData.targetTitles.filter((_, i) => i !== idx),
                    })}
                    className="text-purple-600 hover:text-purple-800"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </section>

          {/* Seniority */}
          <section className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Seniority Level</h2>
            <select
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              value={profileData.seniority}
              onChange={(e) => setProfileData({ ...profileData, seniority: e.target.value })}
            >
              <option value="Junior">Junior</option>
              <option value="Mid">Mid</option>
              <option value="Senior">Senior</option>
              <option value="Executive">Executive</option>
            </select>
          </section>

          {/* Profile Context */}
          <section className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Career Goals & Context</h2>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={profileData.useProfileContextForMatching}
                  onChange={(e) => setProfileData({
                    ...profileData,
                    useProfileContextForMatching: e.target.checked,
                  })}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-sm text-gray-700">Use for job matching</span>
              </label>
            </div>
            <textarea
              className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Add context about your career goals, preferred industries, company stage preferences..."
              value={profileData.profileContextText}
              onChange={(e) => setProfileData({ ...profileData, profileContextText: e.target.value })}
            />
          </section>
        </div>
      )}

      {/* Save Button */}
      <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
        <p className="text-sm text-gray-600">
          Changes saved to both your portfolio and job search profile
        </p>
        <button
          onClick={saveProfile}
          disabled={saving}
          className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed inline-flex items-center gap-2 font-medium"
        >
          {saving ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-5 w-5" />
              Save Complete Profile
            </>
          )}
        </button>
      </div>
    </div>
  );
}
