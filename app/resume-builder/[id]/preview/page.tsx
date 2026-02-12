'use client';

import { useState, useEffect, useCallback, use } from 'react';
import Link from 'next/link';
import { ArrowLeft, Download, Mail, Phone, MapPin, Linkedin, Globe, Edit2, Save, X, Loader2 } from 'lucide-react';
import type { ResumeWithSections, ResumeSection, ExperienceContent, EducationContent, SkillsContent, SummaryContent, ProjectContent } from '@/lib/types/resume';
import { useNotification } from '@/app/hooks/useNotification';
// PDF generation removed - use the download button in the job card modal instead

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ adaptation?: string; autoDownload?: string }>;
};

export default function ResumePreviewPage({ params, searchParams }: PageProps) {
  const { id } = use(params);
  const { showError, showSuccess } = useNotification();
  const resolvedSearchParams = searchParams ? use(searchParams) : undefined;
  const [resume, setResume] = useState<ResumeWithSections | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editedSections, setEditedSections] = useState<Map<string, any>>(new Map());
  const [editedHeader, setEditedHeader] = useState<any>(null);

  const downloadPDF = useCallback(async () => {
    if (!resume) return;
    
    setDownloading(true);
    try {
      // Use the browser's print dialog for PDF generation
      window.print();
    } catch (error) {
      console.error('Error opening print dialog:', error);
      showError('Failed to open print dialog. Please use Ctrl+P or Cmd+P to print.');
    } finally {
      setDownloading(false);
    }
  }, [resume]);

  useEffect(() => {
    fetchResume();
  }, [id]);

  // Auto-download if autoDownload parameter is present
  useEffect(() => {
    if (resolvedSearchParams?.autoDownload === 'true' && resume && !loading && !downloading) {
      downloadPDF();
    }
  }, [resume, loading, resolvedSearchParams, downloading, downloadPDF]);

  async function fetchResume() {
    try {
      const response = await fetch(`/api/resume/${id}`);
      const data = await response.json();
      if (data.resume) {
        setResume(data.resume);
      }
    } catch (error) {
      console.error('Error fetching resume:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleSectionEdit = (sectionId: string, newContent: any) => {
    console.log('Editing section:', sectionId, newContent);
    setEditedSections(prev => {
      const newMap = new Map(prev);
      newMap.set(sectionId, newContent);
      console.log('Updated editedSections:', newMap);
      return newMap;
    });
  };

  const handleSave = async () => {
    console.log('handleSave called');
    console.log('editedSections size:', editedSections.size);
    console.log('editedHeader:', editedHeader);

    if (editedSections.size === 0 && !editedHeader) {
      console.log('No changes to save, exiting edit mode');
      setEditMode(false);
      return;
    }

    setSaving(true);
    try {
      // Save header information if edited
      if (editedHeader) {
        console.log('Saving header:', editedHeader);
        const headerResponse = await fetch(`/api/resume/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            full_name: editedHeader.full_name,
            email: editedHeader.email,
            phone: editedHeader.phone,
            location: editedHeader.location,
            linkedin_url: editedHeader.linkedin_url,
            portfolio_url: editedHeader.portfolio_url,
          }),
        });

        if (!headerResponse.ok) {
          const errorData = await headerResponse.json();
          console.error('Header update failed:', errorData);
          throw new Error(errorData.error || 'Failed to update header');
        }
        console.log('Header saved successfully');
      }

      // Save each edited section
      for (const [sectionId, content] of editedSections.entries()) {
        console.log('Saving section:', sectionId, content);
        const sectionResponse = await fetch(`/api/resume/${id}/sections/${sectionId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ content }),
        });

        if (!sectionResponse.ok) {
          const errorData = await sectionResponse.json();
          console.error('Section update failed:', errorData);
          throw new Error(errorData.error || 'Failed to update section');
        }
        console.log('Section saved successfully:', sectionId);
      }

      showSuccess('Resume updated successfully');
      setEditedSections(new Map());
      setEditedHeader(null);
      setEditMode(false);
      await fetchResume(); // Refresh the resume data
    } catch (error) {
      console.error('Error saving resume:', error);
      showError(error instanceof Error ? error.message : 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditMode(false);
    setEditedSections(new Map());
    setEditedHeader(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading preview...</div>
      </div>
    );
  }

  if (!resume) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Resume not found</h2>
          <Link href="/resume-builder" className="text-blue-600 hover:underline">
            Back to resumes
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Background overlay */}
      <div 
        className="fixed inset-0 bg-black/30" 
        onClick={(e) => {
          if (!editMode) {
            window.history.back();
          }
        }}
      />
      
      {/* Sidebar modal */}
      <div className="fixed inset-0 flex items-center justify-end pointer-events-none">
        <div 
          className="h-full w-full max-w-3xl bg-white shadow-xl overflow-y-auto pointer-events-auto animate-slide-in-right"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Toolbar */}
          <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
            <div className="px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                {editMode ? 'Edit Resume' : 'Resume Preview'}
              </h2>
              <div className="flex items-center gap-2">
                {editMode ? (
                  <>
                    <button
                      onClick={handleCancelEdit}
                      disabled={saving}
                      className="flex items-center gap-2 px-3 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 disabled:opacity-50"
                    >
                      <X className="w-4 h-4" />
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          Save Changes
                        </>
                      )}
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setEditMode(true)}
                      className="flex items-center gap-2 px-3 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50"
                    >
                      <Edit2 className="w-4 h-4" />
                      Edit
                    </button>
                    <button
                      onClick={downloadPDF}
                      disabled={downloading}
                      className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Download className="w-4 h-4" />
                      {downloading ? 'Generating...' : 'Download PDF'}
                    </button>
                    <Link
                      href={`/resume-builder/${id}`}
                      className="flex items-center gap-2 px-3 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Back to Editor
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Resume Preview */}
          <div className="p-6">
            <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden print:shadow-none print:rounded-none print:border-0" id="resume-content">
              <div className="p-8">
                {/* Header */}
                <div className={`mb-6 pb-4 border-b-2 border-gray-900 ${editMode ? 'border-2 border-blue-200 rounded-lg p-3 bg-blue-50/30' : ''}`}>
                  {editMode ? (
                    <div className="space-y-3">
                      <input
                        value={editedHeader?.full_name ?? resume.full_name ?? ''}
                        onChange={(e) => setEditedHeader({ ...(editedHeader || resume), full_name: e.target.value })}
                        placeholder="Full Name"
                        className="w-full text-3xl font-bold text-gray-900 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          value={editedHeader?.email ?? resume.email ?? ''}
                          onChange={(e) => setEditedHeader({ ...(editedHeader || resume), email: e.target.value })}
                          placeholder="Email"
                          className="px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                        <input
                          value={editedHeader?.phone ?? resume.phone ?? ''}
                          onChange={(e) => setEditedHeader({ ...(editedHeader || resume), phone: e.target.value })}
                          placeholder="Phone"
                          className="px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                      </div>
                      <input
                        value={editedHeader?.location ?? resume.location ?? ''}
                        onChange={(e) => setEditedHeader({ ...(editedHeader || resume), location: e.target.value })}
                        placeholder="Location"
                        className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          value={editedHeader?.linkedin_url ?? resume.linkedin_url ?? ''}
                          onChange={(e) => setEditedHeader({ ...(editedHeader || resume), linkedin_url: e.target.value })}
                          placeholder="LinkedIn URL"
                          className="px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                        <input
                          value={editedHeader?.portfolio_url ?? resume.portfolio_url ?? ''}
                          onChange={(e) => setEditedHeader({ ...(editedHeader || resume), portfolio_url: e.target.value })}
                          placeholder="Portfolio URL"
                          className="px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                      </div>
                    </div>
                  ) : (
                    <>
                      <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        {resume.full_name || 'Your Name'}
                      </h1>
                      
                      <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                        {resume.email && (
                          <div className="flex items-center gap-1.5">
                            <Mail className="w-4 h-4" />
                            {resume.email}
                          </div>
                        )}
                        {resume.phone && (
                          <div className="flex items-center gap-1.5">
                            <Phone className="w-4 h-4" />
                            {resume.phone}
                          </div>
                        )}
                        {resume.location && (
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-4 h-4" />
                            {resume.location}
                          </div>
                        )}
                        {resume.linkedin_url && (
                          <div className="flex items-center gap-1.5">
                            <Linkedin className="w-4 h-4" />
                            <a href={resume.linkedin_url} className="text-blue-600 hover:underline">
                              LinkedIn
                            </a>
                          </div>
                        )}
                        {resume.portfolio_url && (
                          <div className="flex items-center gap-1.5">
                            <Globe className="w-4 h-4" />
                            <a href={resume.portfolio_url} className="text-blue-600 hover:underline">
                              Portfolio
                            </a>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>

                {/* Sections */}
                <div className="space-y-5">
                  {resume.sections
                    .sort((a, b) => a.sort_order - b.sort_order)
                    .map((section) => (
                      <ResumeSection 
                        key={section.id} 
                        section={section}
                        editMode={editMode}
                        onEdit={(newContent) => handleSectionEdit(section.id, newContent)}
                        editedContent={editedSections.get(section.id)}
                      />
                    ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body {
            background: white;
          }
          .fixed {
            position: static !important;
          }
          .animate-slide-in-right {
            animation: none !important;
          }
          .print\\:shadow-none {
            box-shadow: none !important;
          }
          .print\\:rounded-none {
            border-radius: 0 !important;
          }
          .print\\:border-0 {
            border: 0 !important;
          }
          @page {
            margin: 0.5in;
            size: letter;
          }
        }
      `}</style>
    </>
  );
}

function ResumeSection({ 
  section, 
  editMode, 
  onEdit, 
  editedContent 
}: { 
  section: ResumeSection;
  editMode: boolean;
  onEdit: (content: any) => void;
  editedContent?: any;
}) {
  const getSectionTitle = (type: string) => {
    const titles: Record<string, string> = {
      summary: 'Professional Summary',
      experience: 'Experience',
      education: 'Education',
      skills: 'Skills',
      projects: 'Projects',
      certifications: 'Certifications',
    };
    return section.title || titles[type] || type;
  };

  const content = editedContent || section.content;

  return (
    <div className={editMode ? 'border-2 border-blue-200 rounded-lg p-3 bg-blue-50/30' : ''}>
      <h2 className="text-lg font-bold text-gray-900 mb-2 uppercase tracking-wide border-b border-gray-300 pb-1">
        {getSectionTitle(section.section_type)}
      </h2>
      
      <div className="mt-2">
        {section.section_type === 'summary' && (
          <SummarySection 
            content={content as SummaryContent} 
            editMode={editMode}
            onEdit={onEdit}
          />
        )}
        {section.section_type === 'experience' && (
          <ExperienceSection 
            content={content as ExperienceContent}
            editMode={editMode}
            onEdit={onEdit}
          />
        )}
        {section.section_type === 'education' && (
          <EducationSection 
            content={content as EducationContent}
            editMode={editMode}
            onEdit={onEdit}
          />
        )}
        {section.section_type === 'skills' && (
          <SkillsSection 
            content={content as SkillsContent}
            editMode={editMode}
            onEdit={onEdit}
          />
        )}
        {section.section_type === 'projects' && (
          <ProjectSection 
            content={content as ProjectContent}
            editMode={editMode}
            onEdit={onEdit}
          />
        )}
      </div>
    </div>
  );
}

function SummarySection({ 
  content, 
  editMode, 
  onEdit 
}: { 
  content: SummaryContent;
  editMode: boolean;
  onEdit: (content: any) => void;
}) {
  if (editMode) {
    return (
      <textarea
        value={content.text}
        onChange={(e) => onEdit({ ...content, text: e.target.value })}
        className="w-full text-gray-700 leading-relaxed p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
      />
    );
  }

  return (
    <p className="text-gray-700 leading-relaxed">
      {content.text}
    </p>
  );
}

function ExperienceSection({ 
  content, 
  editMode, 
  onEdit 
}: { 
  content: ExperienceContent;
  editMode: boolean;
  onEdit: (content: any) => void;
}) {
  const handleBulletChange = (index: number, value: string) => {
    const newBullets = [...(content.bullets || [])];
    newBullets[index] = value;
    onEdit({ ...content, bullets: newBullets });
  };

  const handleAddBullet = () => {
    const newBullets = [...(content.bullets || []), ''];
    onEdit({ ...content, bullets: newBullets });
  };

  const handleRemoveBullet = (index: number) => {
    const newBullets = content.bullets?.filter((_, i) => i !== index) || [];
    onEdit({ ...content, bullets: newBullets });
  };

  if (editMode) {
    return (
      <div className="mb-3 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <input
            value={content.position}
            onChange={(e) => onEdit({ ...content, position: e.target.value })}
            placeholder="Position"
            className="px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
          />
          <input
            value={content.company}
            onChange={(e) => onEdit({ ...content, company: e.target.value })}
            placeholder="Company"
            className="px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <input
            value={content.startDate}
            onChange={(e) => onEdit({ ...content, startDate: e.target.value })}
            placeholder="Start Date"
            className="px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
          <input
            value={content.endDate || ''}
            onChange={(e) => onEdit({ ...content, endDate: e.target.value })}
            placeholder="End Date"
            className="px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
          <input
            value={content.location || ''}
            onChange={(e) => onEdit({ ...content, location: e.target.value })}
            placeholder="Location"
            className="px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>
        
        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-600">Achievements/Bullets</label>
          {content.bullets?.map((bullet, i) => (
            <div key={i} className="flex gap-2">
              <textarea
                value={bullet}
                onChange={(e) => handleBulletChange(i, e.target.value)}
                className="flex-1 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm min-h-[60px]"
                placeholder="Achievement or responsibility"
              />
              <button
                onClick={() => handleRemoveBullet(i)}
                className="px-2 text-red-600 hover:bg-red-50 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
          <button
            onClick={handleAddBullet}
            className="text-sm text-blue-600 hover:underline"
          >
            + Add bullet point
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-3">
      <div className="flex justify-between items-start mb-1">
        <div>
          <h3 className="font-semibold text-gray-900">{content.position}</h3>
          <p className="text-gray-700">{content.company}</p>
        </div>
        <div className="text-right text-sm text-gray-600">
          <p>{content.startDate} — {content.endDate || 'Present'}</p>
          {content.location && <p>{content.location}</p>}
        </div>
      </div>
      
      {content.bullets && content.bullets.length > 0 && (
        <ul className="list-disc list-outside ml-5 space-y-1">
          {content.bullets.filter(Boolean).map((bullet, i) => (
            <li key={i} className="text-gray-700 text-sm leading-relaxed">
              {bullet}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function EducationSection({ 
  content, 
  editMode, 
  onEdit 
}: { 
  content: EducationContent;
  editMode: boolean;
  onEdit: (content: any) => void;
}) {
  if (editMode) {
    return (
      <div className="mb-3 space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <input
            value={content.degree}
            onChange={(e) => onEdit({ ...content, degree: e.target.value })}
            placeholder="Degree"
            className="px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
          />
          <input
            value={content.institution}
            onChange={(e) => onEdit({ ...content, institution: e.target.value })}
            placeholder="Institution"
            className="px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <input
            value={content.year}
            onChange={(e) => onEdit({ ...content, year: e.target.value })}
            placeholder="Year"
            className="px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
          <input
            value={content.gpa || ''}
            onChange={(e) => onEdit({ ...content, gpa: e.target.value })}
            placeholder="GPA (optional)"
            className="px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>
        <textarea
          value={content.description || ''}
          onChange={(e) => onEdit({ ...content, description: e.target.value })}
          placeholder="Description (optional)"
          className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm min-h-[60px]"
        />
      </div>
    );
  }

  return (
    <div className="mb-3">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-semibold text-gray-900">{content.degree}</h3>
          <p className="text-gray-700">{content.institution}</p>
          {content.description && (
            <p className="text-gray-600 text-sm mt-1">{content.description}</p>
          )}
        </div>
        <div className="text-right text-sm text-gray-600">
          <p>{content.year}</p>
          {content.gpa && <p>GPA: {content.gpa}</p>}
        </div>
      </div>
    </div>
  );
}

function SkillsSection({ 
  content, 
  editMode, 
  onEdit 
}: { 
  content: SkillsContent;
  editMode: boolean;
  onEdit: (content: any) => void;
}) {
  if (editMode) {
    return (
      <div className="mb-3 space-y-2">
        <input
          value={content.category || ''}
          onChange={(e) => onEdit({ ...content, category: e.target.value })}
          placeholder="Category (optional)"
          className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-sm"
        />
        <textarea
          value={content.items.join(', ')}
          onChange={(e) => onEdit({ ...content, items: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
          placeholder="Skills separated by commas"
          className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm min-h-[60px]"
        />
        <p className="text-xs text-gray-500">Separate skills with commas</p>
      </div>
    );
  }

  return (
    <div className="mb-3">
      {content.category && (
        <h3 className="font-semibold text-gray-900 mb-2">{content.category}</h3>
      )}
      <p className="text-gray-700 leading-relaxed">
        {content.items.join(' • ')}
      </p>
    </div>
  );
}

function ProjectSection({ 
  content, 
  editMode, 
  onEdit 
}: { 
  content: ProjectContent;
  editMode: boolean;
  onEdit: (content: any) => void;
}) {
  const handleBulletChange = (index: number, value: string) => {
    const newBullets = [...(content.bullets || [])];
    newBullets[index] = value;
    onEdit({ ...content, bullets: newBullets });
  };

  const handleAddBullet = () => {
    const newBullets = [...(content.bullets || []), ''];
    onEdit({ ...content, bullets: newBullets });
  };

  const handleRemoveBullet = (index: number) => {
    const newBullets = content.bullets?.filter((_, i) => i !== index) || [];
    onEdit({ ...content, bullets: newBullets });
  };

  if (editMode) {
    return (
      <div className="mb-3 space-y-3">
        <input
          value={content.name}
          onChange={(e) => onEdit({ ...content, name: e.target.value })}
          placeholder="Project Name"
          className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
        />
        <textarea
          value={content.description || ''}
          onChange={(e) => onEdit({ ...content, description: e.target.value })}
          placeholder="Project Description"
          className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm min-h-[60px]"
        />
        
        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-600">Project Highlights</label>
          {content.bullets?.map((bullet, i) => (
            <div key={i} className="flex gap-2">
              <textarea
                value={bullet}
                onChange={(e) => handleBulletChange(i, e.target.value)}
                className="flex-1 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm min-h-[60px]"
                placeholder="Project highlight or achievement"
              />
              <button
                onClick={() => handleRemoveBullet(i)}
                className="px-2 text-red-600 hover:bg-red-50 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
          <button
            onClick={handleAddBullet}
            className="text-sm text-blue-600 hover:underline"
          >
            + Add highlight
          </button>
        </div>

        <input
          value={content.url || ''}
          onChange={(e) => onEdit({ ...content, url: e.target.value })}
          placeholder="Project URL (optional)"
          className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        />
      </div>
    );
  }

  return (
    <div className="mb-3">
      <div className="mb-1">
        <h3 className="font-semibold text-gray-900">{content.name}</h3>
        {content.description && (
          <p className="text-gray-700 text-sm mt-1">{content.description}</p>
        )}
      </div>
      
      {content.bullets && content.bullets.length > 0 && (
        <ul className="list-disc list-outside ml-5 space-y-1">
          {content.bullets.filter(Boolean).map((bullet, i) => (
            <li key={i} className="text-gray-700 text-sm leading-relaxed">
              {bullet}
            </li>
          ))}
        </ul>
      )}
      
      {content.url && (
        <p className="text-sm text-blue-600 mt-2">
          <a href={content.url} className="hover:underline">{content.url}</a>
        </p>
      )}
    </div>
  );
}
