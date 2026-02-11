'use client';

import { useState } from 'react';
import { Plus, Trash2, Save, X } from 'lucide-react';
import { useNotification } from '@/app/hooks/useNotification';

interface ManualEditorProps {
  portfolioData: any;
  onSave: (data: any) => Promise<void>;
}

export function ManualEditor({ portfolioData, onSave }: ManualEditorProps) {
  const { showSuccess, showError } = useNotification();
  const [data, setData] = useState(portfolioData);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(data);
      showSuccess('Portfolio saved successfully!');
    } catch (error) {
      showError('Failed to save portfolio');
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: string, value: any) => {
    setData((prev: any) => ({ ...prev, [field]: value }));
  };

  const updateNestedField = (section: string, index: number, field: string, value: any) => {
    setData((prev: any) => {
      const updated = { ...prev };
      updated[section][index][field] = value;
      return updated;
    });
  };

  const addItem = (section: string, template: any) => {
    setData((prev: any) => ({
      ...prev,
      [section]: [...(prev[section] || []), template],
    }));
  };

  const removeItem = (section: string, index: number) => {
    setData((prev: any) => ({
      ...prev,
      [section]: prev[section].filter((_: any, i: number) => i !== index),
    }));
  };

  const tabs = [
    { id: 'basic', label: 'Basic Info' },
    { id: 'about', label: 'About' },
    { id: 'strengths', label: 'Strengths & Awards' },
    { id: 'experience', label: 'Experience' },
    { id: 'projects', label: 'Projects' },
    { id: 'skills', label: 'Skills' },
    { id: 'education', label: 'Education' },
    { id: 'more', label: 'More' },
  ];

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Tabs */}
      <div className="border-b border-border bg-white">
        <div className="flex gap-2 overflow-x-auto px-6 py-3">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-accent text-white'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Form Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-3xl">
          {/* Basic Info Tab */}
          {activeTab === 'basic' && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-foreground">Basic Information</h2>
              
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={data.fullName || ''}
                  onChange={(e) => updateField('fullName', e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground focus:border-accent focus:outline-none"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">
                  Professional Title *
                </label>
                <input
                  type="text"
                  value={data.title || ''}
                  onChange={(e) => updateField('title', e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground focus:border-accent focus:outline-none"
                  placeholder="Senior Product Designer"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">
                  Tagline
                </label>
                <input
                  type="text"
                  value={data.tagline || ''}
                  onChange={(e) => updateField('tagline', e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground focus:border-accent focus:outline-none"
                  placeholder="Crafting delightful experiences that users love"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">
                    Email
                  </label>
                  <input
                    type="email"
                    value={data.email || ''}
                    onChange={(e) => updateField('email', e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground focus:border-accent focus:outline-none"
                    placeholder="john@example.com"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">
                    Location
                  </label>
                  <input
                    type="text"
                    value={data.location || ''}
                    onChange={(e) => updateField('location', e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground focus:border-accent focus:outline-none"
                    placeholder="San Francisco, CA"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">
                  LinkedIn URL
                </label>
                <input
                  type="url"
                  value={data.linkedinUrl || ''}
                  onChange={(e) => updateField('linkedinUrl', e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground focus:border-accent focus:outline-none"
                  placeholder="https://linkedin.com/in/username"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">
                  GitHub URL
                </label>
                <input
                  type="url"
                  value={data.githubUrl || ''}
                  onChange={(e) => updateField('githubUrl', e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground focus:border-accent focus:outline-none"
                  placeholder="https://github.com/username"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">
                  Website URL
                </label>
                <input
                  type="url"
                  value={data.websiteUrl || ''}
                  onChange={(e) => updateField('websiteUrl', e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground focus:border-accent focus:outline-none"
                  placeholder="https://yourwebsite.com"
                />
              </div>
            </div>
          )}

          {/* About Tab */}
          {activeTab === 'about' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-foreground">About You</h2>
              
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">
                  Professional Summary
                </label>
                <textarea
                  value={data.about || ''}
                  onChange={(e) => updateField('about', e.target.value)}
                  rows={6}
                  className="w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground focus:border-accent focus:outline-none"
                  placeholder="A brief introduction about yourself, your background, and what you do..."
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Optional - tell visitors about yourself
                </p>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">
                  Professional Style (Optional)
                </label>
                <input
                  type="text"
                  value={data.pmArchetype || data.workStyle || ''}
                  onChange={(e) => {
                    updateField('pmArchetype', e.target.value);
                    updateField('workStyle', e.target.value);
                  }}
                  className="w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground focus:border-accent focus:outline-none"
                  placeholder="Strategic Builder, Creative Problem Solver, Technical Leader, etc."
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  A short phrase describing your working style or archetype
                </p>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">
                  Current Level/Stage (Optional)
                </label>
                <input
                  type="text"
                  value={data.performanceLevel || ''}
                  onChange={(e) => updateField('performanceLevel', e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground focus:border-accent focus:outline-none"
                  placeholder="Senior Level, Top Performer, Exceeding Expectations, etc."
                />
              </div>
            </div>
          )}

          {/* Strengths & Awards Tab */}
          {activeTab === 'strengths' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-foreground">Your Strengths & Recognition</h2>
              <p className="text-sm text-muted-foreground">
                Showcase what makes you exceptional and the recognition you've received.
              </p>
              
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">
                  Your Professional Style (Optional)
                </label>
                <input
                  type="text"
                  value={data.pmArchetype || data.workStyle || ''}
                  onChange={(e) => {
                    updateField('pmArchetype', e.target.value);
                    updateField('workStyle', e.target.value);
                  }}
                  className="w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground focus:border-accent focus:outline-none"
                  placeholder="Strategic Builder, Creative Problem Solver, Data-Driven Leader, etc."
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  A short phrase that captures how you work
                </p>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">
                  Performance/Experience Level (Optional)
                </label>
                <input
                  type="text"
                  value={data.performanceLevel || ''}
                  onChange={(e) => updateField('performanceLevel', e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground focus:border-accent focus:outline-none"
                  placeholder="Senior Professional, Top Performer, Industry Expert, etc."
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">
                  Key Strengths & What Makes You Unique
                </label>
                <p className="mb-2 text-xs text-muted-foreground">
                  List your superpowers - what sets you apart from others? One strength per line.
                </p>
                <textarea
                  value={data.superpowers?.join('\n') || ''}
                  onChange={(e) =>
                    updateField(
                      'superpowers',
                      e.target.value.split('\n').filter((s: string) => s.trim())
                    )
                  }
                  rows={8}
                  className="w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground focus:border-accent focus:outline-none"
                  placeholder="Strong technical background with business acumen&#10;Excellent at cross-functional collaboration&#10;Quick learner who thrives in ambiguous situations&#10;Track record of delivering high-impact results&#10;..."
                />
              </div>

              {/* Awards & Recognition */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-foreground">Awards & Recognition</h3>
                  <button
                    onClick={() =>
                      addItem('awards', {
                        title: '',
                        quarter: '',
                        description: '',
                        keyTraits: [],
                      })
                    }
                    className="flex items-center gap-2 rounded-lg bg-accent px-3 py-1.5 text-sm font-semibold text-white hover:bg-accent/90"
                  >
                    <Plus className="h-3 w-3" />
                    Add
                  </button>
                </div>

                {data.awards?.map((award: any, index: number) => (
                  <div key={index} className="rounded-lg border border-border bg-white p-4">
                    <div className="mb-3 flex items-start justify-between">
                      <h4 className="text-sm font-semibold text-foreground">
                        Award {index + 1}
                      </h4>
                      <button
                        onClick={() => removeItem('awards', index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>

                    <div className="space-y-3">
                      <input
                        type="text"
                        value={award.title || ''}
                        onChange={(e) =>
                          updateNestedField('awards', index, 'title', e.target.value)
                        }
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none"
                        placeholder="Award Title"
                      />
                      <input
                        type="text"
                        value={award.quarter || award.date || ''}
                        onChange={(e) => {
                          updateNestedField('awards', index, 'quarter', e.target.value);
                          updateNestedField('awards', index, 'date', e.target.value);
                        }}
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none"
                        placeholder="When (Q1 2025, Jan 2024, etc.)"
                      />
                      <textarea
                        value={award.description || ''}
                        onChange={(e) =>
                          updateNestedField('awards', index, 'description', e.target.value)
                        }
                        rows={2}
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none"
                        placeholder="What was this recognition for?"
                      />
                      <div>
                        <label className="mb-1 block text-xs font-medium text-foreground">
                          Key Qualities/Traits (Optional)
                        </label>
                        <input
                          type="text"
                          value={award.keyTraits?.join(', ') || ''}
                          onChange={(e) =>
                            updateNestedField(
                              'awards',
                              index,
                              'keyTraits',
                              e.target.value.split(',').map((t: string) => t.trim()).filter((t: string) => t)
                            )
                          }
                          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none"
                          placeholder="Leadership, Innovation, Excellence, etc."
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Experience Tab */}
          {activeTab === 'experience' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-foreground">Experience</h2>
                <button
                  onClick={() =>
                    addItem('experiences', {
                      title: '',
                      company: '',
                      location: '',
                      period: '',
                      description: '',
                      highlights: [],
                      skills: [],
                    })
                  }
                  className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent/90"
                >
                  <Plus className="h-4 w-4" />
                  Add Experience
                </button>
              </div>

              {data.experiences?.map((exp: any, index: number) => (
                <div key={index} className="rounded-lg border border-border bg-white p-6">
                  <div className="mb-4 flex items-start justify-between">
                    <h3 className="font-semibold text-foreground">
                      Experience {index + 1}
                    </h3>
                    <button
                      onClick={() => removeItem('experiences', index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <input
                      type="text"
                      value={exp.title || ''}
                      onChange={(e) =>
                        updateNestedField('experiences', index, 'title', e.target.value)
                      }
                      className="w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground focus:border-accent focus:outline-none"
                      placeholder="Job Title"
                    />

                    <div className="grid gap-4 md:grid-cols-2">
                      <input
                        type="text"
                        value={exp.company || ''}
                        onChange={(e) =>
                          updateNestedField('experiences', index, 'company', e.target.value)
                        }
                        className="w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground focus:border-accent focus:outline-none"
                        placeholder="Company Name"
                      />

                      <input
                        type="text"
                        value={exp.period || ''}
                        onChange={(e) =>
                          updateNestedField('experiences', index, 'period', e.target.value)
                        }
                        className="w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground focus:border-accent focus:outline-none"
                        placeholder="Jan 2020 - Present"
                      />
                    </div>

                    <input
                      type="text"
                      value={exp.location || ''}
                      onChange={(e) =>
                        updateNestedField('experiences', index, 'location', e.target.value)
                      }
                      className="w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground focus:border-accent focus:outline-none"
                      placeholder="Location"
                    />

                    <textarea
                      value={exp.description || ''}
                      onChange={(e) =>
                        updateNestedField('experiences', index, 'description', e.target.value)
                      }
                      rows={3}
                      className="w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground focus:border-accent focus:outline-none"
                      placeholder="Brief description of your role..."
                    />

                    <div>
                      <label className="mb-1 block text-sm font-medium text-foreground">
                        Key Highlights (one per line)
                      </label>
                      <textarea
                        value={exp.highlights?.join('\n') || ''}
                        onChange={(e) =>
                          updateNestedField(
                            'experiences',
                            index,
                            'highlights',
                            e.target.value.split('\n').filter((h: string) => h.trim())
                          )
                        }
                        rows={3}
                        className="w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground focus:border-accent focus:outline-none"
                        placeholder="Led a team of 5 designers&#10;Increased user engagement by 40%"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium text-foreground">
                        Skills (comma-separated)
                      </label>
                      <input
                        type="text"
                        value={exp.skills?.join(', ') || ''}
                        onChange={(e) =>
                          updateNestedField(
                            'experiences',
                            index,
                            'skills',
                            e.target.value.split(',').map((s: string) => s.trim()).filter((s: string) => s)
                          )
                        }
                        className="w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground focus:border-accent focus:outline-none"
                        placeholder="React, TypeScript, Figma"
                      />
                    </div>
                  </div>
                </div>
              ))}

              {(!data.experiences || data.experiences.length === 0) && (
                <div className="rounded-lg border border-dashed border-border p-12 text-center">
                  <p className="text-muted-foreground">
                    No experiences yet. Click "Add Experience" to get started.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Projects Tab */}
          {activeTab === 'projects' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-foreground">Projects</h2>
                <button
                  onClick={() =>
                    addItem('projects', {
                      id: Date.now().toString(),
                      title: '',
                      company: '',
                      cardTeaser: '',
                      outcome: '',
                      tags: [],
                      details: [],
                    })
                  }
                  className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent/90"
                >
                  <Plus className="h-4 w-4" />
                  Add Project
                </button>
              </div>

              {data.projects?.map((project: any, index: number) => (
                <div key={project.id || index} className="rounded-lg border border-border bg-white p-6">
                  <div className="mb-4 flex items-start justify-between">
                    <h3 className="font-semibold text-foreground">
                      Project {index + 1}
                    </h3>
                    <button
                      onClick={() => removeItem('projects', index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <input
                      type="text"
                      value={project.title || ''}
                      onChange={(e) =>
                        updateNestedField('projects', index, 'title', e.target.value)
                      }
                      className="w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground focus:border-accent focus:outline-none"
                      placeholder="Project Title"
                    />

                    <input
                      type="text"
                      value={project.company || ''}
                      onChange={(e) =>
                        updateNestedField('projects', index, 'company', e.target.value)
                      }
                      className="w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground focus:border-accent focus:outline-none"
                      placeholder="Company/Client"
                    />

                    <textarea
                      value={project.cardTeaser || ''}
                      onChange={(e) =>
                        updateNestedField('projects', index, 'cardTeaser', e.target.value)
                      }
                      rows={2}
                      className="w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground focus:border-accent focus:outline-none"
                      placeholder="Brief project description..."
                    />

                    <input
                      type="text"
                      value={project.outcome || ''}
                      onChange={(e) =>
                        updateNestedField('projects', index, 'outcome', e.target.value)
                      }
                      className="w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground focus:border-accent focus:outline-none"
                      placeholder="Key outcome or result"
                    />

                    <div>
                      <label className="mb-1 block text-sm font-medium text-foreground">
                        Tags (comma-separated)
                      </label>
                      <input
                        type="text"
                        value={project.tags?.join(', ') || ''}
                        onChange={(e) =>
                          updateNestedField(
                            'projects',
                            index,
                            'tags',
                            e.target.value.split(',').map((t: string) => t.trim()).filter((t: string) => t)
                          )
                        }
                        className="w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground focus:border-accent focus:outline-none"
                        placeholder="Design, UX, Mobile App"
                      />
                    </div>

                    {/* Project Details Section */}
                    <div className="mt-6 space-y-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-blue-900">
                          Detailed Project Information
                        </h4>
                        <button
                          onClick={() => {
                            const newDetails = [...(project.details || []), {
                              heading: '',
                              paragraphs: [''],
                              list: [],
                            }];
                            updateNestedField('projects', index, 'details', newDetails);
                          }}
                          className="flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1 text-xs font-semibold text-white hover:bg-blue-700"
                        >
                          <Plus className="h-3 w-3" />
                          Add Section
                        </button>
                      </div>

                      {project.details?.map((detail: any, detailIdx: number) => (
                        <div key={detailIdx} className="rounded-lg border border-blue-300 bg-white p-3">
                          <div className="mb-3 flex items-center justify-between">
                            <input
                              type="text"
                              value={detail.heading || ''}
                              onChange={(e) => {
                                const newDetails = [...project.details];
                                newDetails[detailIdx].heading = e.target.value;
                                updateNestedField('projects', index, 'details', newDetails);
                              }}
                              className="flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-semibold text-foreground focus:border-accent focus:outline-none"
                              placeholder="Section Heading (e.g., 'The Challenge', 'My Role')"
                            />
                            <button
                              onClick={() => {
                                const newDetails = project.details.filter((_: any, i: number) => i !== detailIdx);
                                updateNestedField('projects', index, 'details', newDetails);
                              }}
                              className="ml-2 text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>

                          <div className="space-y-3">
                            <div>
                              <label className="mb-1 block text-xs font-medium text-foreground">
                                Paragraphs (one per box, click + to add more)
                              </label>
                              {detail.paragraphs?.map((para: string, paraIdx: number) => (
                                <div key={paraIdx} className="mb-2 flex gap-2">
                                  <textarea
                                    value={para || ''}
                                    onChange={(e) => {
                                      const newDetails = [...project.details];
                                      newDetails[detailIdx].paragraphs[paraIdx] = e.target.value;
                                      updateNestedField('projects', index, 'details', newDetails);
                                    }}
                                    rows={2}
                                    className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none"
                                    placeholder="Paragraph content..."
                                  />
                                  <button
                                    onClick={() => {
                                      const newDetails = [...project.details];
                                      newDetails[detailIdx].paragraphs = newDetails[detailIdx].paragraphs.filter((_: any, i: number) => i !== paraIdx);
                                      updateNestedField('projects', index, 'details', newDetails);
                                    }}
                                    className="text-red-500 hover:text-red-700"
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                </div>
                              ))}
                              <button
                                onClick={() => {
                                  const newDetails = [...project.details];
                                  newDetails[detailIdx].paragraphs = [...(newDetails[detailIdx].paragraphs || []), ''];
                                  updateNestedField('projects', index, 'details', newDetails);
                                }}
                                className="text-xs text-blue-600 hover:text-blue-800"
                              >
                                + Add Paragraph
                              </button>
                            </div>

                            <div>
                              <label className="mb-1 block text-xs font-medium text-foreground">
                                Bullet List (one per line, optional)
                              </label>
                              <textarea
                                value={detail.list?.join('\n') || ''}
                                onChange={(e) => {
                                  const newDetails = [...project.details];
                                  newDetails[detailIdx].list = e.target.value.split('\n').filter((l: string) => l.trim());
                                  updateNestedField('projects', index, 'details', newDetails);
                                }}
                                rows={3}
                                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none"
                                placeholder="Bullet point 1&#10;Bullet point 2&#10;Bullet point 3"
                              />
                            </div>
                          </div>
                        </div>
                      ))}

                      {(!project.details || project.details.length === 0) && (
                        <p className="text-xs text-blue-700">
                          No detailed sections yet. Add sections to provide in-depth information about this project (challenges, solutions, outcomes, etc.)
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {(!data.projects || data.projects.length === 0) && (
                <div className="rounded-lg border border-dashed border-border p-12 text-center">
                  <p className="text-muted-foreground">
                    No projects yet. Click "Add Project" to get started.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Skills Tab */}
          {activeTab === 'skills' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-foreground">Skills</h2>
              <p className="text-sm text-muted-foreground">
                Organize your skills by category. Add one skill per line.
              </p>

              {Object.entries(data.skills || {}).map(([category, skills]: [string, any]) => (
                <div key={category} className="rounded-lg border border-border bg-white p-6">
                  <div className="mb-4 flex items-start justify-between">
                    <input
                      type="text"
                      value={category}
                      onChange={(e) => {
                        const newSkills = { ...data.skills };
                        delete newSkills[category];
                        newSkills[e.target.value] = skills;
                        updateField('skills', newSkills);
                      }}
                      className="font-semibold text-foreground bg-transparent border-b border-transparent hover:border-border focus:border-accent focus:outline-none"
                      placeholder="Category Name"
                    />
                    <button
                      onClick={() => {
                        const newSkills = { ...data.skills };
                        delete newSkills[category];
                        updateField('skills', newSkills);
                      }}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <textarea
                    value={Array.isArray(skills) ? skills.join('\n') : ''}
                    onChange={(e) => {
                      const newSkills = { ...data.skills };
                      newSkills[category] = e.target.value
                        .split('\n')
                        .map((s: string) => s.trim())
                        .filter((s: string) => s);
                      updateField('skills', newSkills);
                    }}
                    rows={4}
                    className="w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground focus:border-accent focus:outline-none"
                    placeholder="React&#10;TypeScript&#10;Node.js"
                  />
                </div>
              ))}

              <button
                onClick={() => {
                  const newSkills = { ...data.skills, 'New Category': [] };
                  updateField('skills', newSkills);
                }}
                className="flex items-center gap-2 rounded-lg border border-dashed border-border bg-white px-4 py-3 text-sm font-medium text-muted-foreground hover:border-accent hover:text-accent"
              >
                <Plus className="h-4 w-4" />
                Add Skill Category
              </button>
            </div>
          )}

          {/* Education Tab */}
          {activeTab === 'education' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-foreground">Education</h2>
                <button
                  onClick={() =>
                    addItem('education', {
                      degree: '',
                      institution: '',
                      period: '',
                      description: '',
                    })
                  }
                  className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent/90"
                >
                  <Plus className="h-4 w-4" />
                  Add Education
                </button>
              </div>

              {data.education?.map((edu: any, index: number) => (
                <div key={index} className="rounded-lg border border-border bg-white p-6">
                  <div className="mb-4 flex items-start justify-between">
                    <h3 className="font-semibold text-foreground">
                      Education {index + 1}
                    </h3>
                    <button
                      onClick={() => removeItem('education', index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <input
                      type="text"
                      value={edu.degree || ''}
                      onChange={(e) =>
                        updateNestedField('education', index, 'degree', e.target.value)
                      }
                      className="w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground focus:border-accent focus:outline-none"
                      placeholder="Degree"
                    />

                    <input
                      type="text"
                      value={edu.institution || ''}
                      onChange={(e) =>
                        updateNestedField('education', index, 'institution', e.target.value)
                      }
                      className="w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground focus:border-accent focus:outline-none"
                      placeholder="Institution"
                    />

                    <input
                      type="text"
                      value={edu.period || ''}
                      onChange={(e) =>
                        updateNestedField('education', index, 'period', e.target.value)
                      }
                      className="w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground focus:border-accent focus:outline-none"
                      placeholder="2015 - 2019"
                    />

                    <textarea
                      value={edu.description || ''}
                      onChange={(e) =>
                        updateNestedField('education', index, 'description', e.target.value)
                      }
                      rows={2}
                      className="w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground focus:border-accent focus:outline-none"
                      placeholder="Additional details..."
                    />
                  </div>
                </div>
              ))}

              {(!data.education || data.education.length === 0) && (
                <div className="rounded-lg border border-dashed border-border p-12 text-center">
                  <p className="text-muted-foreground">
                    No education entries yet. Click "Add Education" to get started.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* More Tab (Certifications, Achievements, Articles) */}
          {activeTab === 'more' && (
            <div className="space-y-8">
              {/* Certifications */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-foreground">Certifications</h2>
                  <button
                    onClick={() =>
                      addItem('certifications', {
                        title: '',
                        issuer: '',
                        date: '',
                        credentialUrl: '',
                      })
                    }
                    className="flex items-center gap-2 rounded-lg bg-accent px-3 py-1.5 text-sm font-semibold text-white hover:bg-accent/90"
                  >
                    <Plus className="h-3 w-3" />
                    Add
                  </button>
                </div>

                {data.certifications?.map((cert: any, index: number) => (
                  <div key={index} className="rounded-lg border border-border bg-white p-4">
                    <div className="mb-3 flex items-start justify-between">
                      <h4 className="text-sm font-semibold text-foreground">
                        Certification {index + 1}
                      </h4>
                      <button
                        onClick={() => removeItem('certifications', index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>

                    <div className="space-y-3">
                      <input
                        type="text"
                        value={cert.title || ''}
                        onChange={(e) =>
                          updateNestedField('certifications', index, 'title', e.target.value)
                        }
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none"
                        placeholder="Certification Name"
                      />
                      <div className="grid gap-3 md:grid-cols-2">
                        <input
                          type="text"
                          value={cert.issuer || ''}
                          onChange={(e) =>
                            updateNestedField('certifications', index, 'issuer', e.target.value)
                          }
                          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none"
                          placeholder="Issuing Organization"
                        />
                        <input
                          type="text"
                          value={cert.date || ''}
                          onChange={(e) =>
                            updateNestedField('certifications', index, 'date', e.target.value)
                          }
                          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none"
                          placeholder="Date"
                        />
                      </div>
                      <input
                        type="url"
                        value={cert.credentialUrl || ''}
                        onChange={(e) =>
                          updateNestedField('certifications', index, 'credentialUrl', e.target.value)
                        }
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none"
                        placeholder="Credential URL (optional)"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Achievements */}
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-foreground">Achievements</h2>
                <textarea
                  value={data.achievements?.join('\n') || ''}
                  onChange={(e) =>
                    updateField(
                      'achievements',
                      e.target.value.split('\n').filter((a: string) => a.trim())
                    )
                  }
                  rows={6}
                  className="w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground focus:border-accent focus:outline-none"
                  placeholder="List your achievements (one per line)&#10;&#10;Won Best Design Award 2023&#10;Featured in Forbes 30 Under 30&#10;Published 10+ articles on Medium"
                />
              </div>

              {/* Articles & Talks */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-foreground">Articles & Talks</h2>
                  <button
                    onClick={() =>
                      addItem('articlesAndTalks', {
                        title: '',
                        type: 'Article',
                        organization: '',
                        date: '',
                        url: '',
                      })
                    }
                    className="flex items-center gap-2 rounded-lg bg-accent px-3 py-1.5 text-sm font-semibold text-white hover:bg-accent/90"
                  >
                    <Plus className="h-3 w-3" />
                    Add
                  </button>
                </div>

                {(data.articlesAndTalks || data.articles)?.map((article: any, index: number) => (
                  <div key={index} className="rounded-lg border border-border bg-white p-4">
                    <div className="mb-3 flex items-start justify-between">
                      <h4 className="text-sm font-semibold text-foreground">
                        Article {index + 1}
                      </h4>
                      <button
                        onClick={() => removeItem(data.articlesAndTalks ? 'articlesAndTalks' : 'articles', index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>

                    <div className="space-y-3">
                      <input
                        type="text"
                        value={article.title || ''}
                        onChange={(e) =>
                          updateNestedField(data.articlesAndTalks ? 'articlesAndTalks' : 'articles', index, 'title', e.target.value)
                        }
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none"
                        placeholder="Title"
                      />
                      <div className="grid gap-3 md:grid-cols-3">
                        <select
                          value={article.type || 'Article'}
                          onChange={(e) =>
                            updateNestedField(data.articlesAndTalks ? 'articlesAndTalks' : 'articles', index, 'type', e.target.value)
                          }
                          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none"
                        >
                          <option>Article</option>
                          <option>Talk</option>
                          <option>Podcast</option>
                          <option>Interview</option>
                        </select>
                        <input
                          type="text"
                          value={article.organization || ''}
                          onChange={(e) =>
                            updateNestedField(data.articlesAndTalks ? 'articlesAndTalks' : 'articles', index, 'organization', e.target.value)
                          }
                          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none"
                          placeholder="Publication/Event"
                        />
                        <input
                          type="text"
                          value={article.date || ''}
                          onChange={(e) =>
                            updateNestedField(data.articlesAndTalks ? 'articlesAndTalks' : 'articles', index, 'date', e.target.value)
                          }
                          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none"
                          placeholder="Date"
                        />
                      </div>
                      <input
                        type="url"
                        value={article.url || ''}
                        onChange={(e) =>
                          updateNestedField(data.articlesAndTalks ? 'articlesAndTalks' : 'articles', index, 'url', e.target.value)
                        }
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none"
                        placeholder="URL"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Save Button (Fixed at bottom) */}
      <div className="border-t border-border bg-white p-4">
        <div className="mx-auto flex max-w-3xl justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-accent px-6 py-3 font-semibold text-white hover:bg-accent/90 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
