'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, Save, Trash2, GripVertical, Briefcase, GraduationCap, Award, Code, Sparkles } from 'lucide-react';
import type { ResumeWithSections, ResumeSection, SectionType, SectionContent, ExperienceContent, EducationContent, SkillsContent, SummaryContent, ProjectContent } from '@/lib/types/resume';
import { useNotification } from '@/app/hooks/useNotification';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default function ResumeEditorPage({ params }: PageProps) {
  const { id } = use(params);
  const { confirm } = useNotification();
  const [resume, setResume] = useState<ResumeWithSections | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddSection, setShowAddSection] = useState(false);

  useEffect(() => {
    fetchResume();
  }, [id]);

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

  async function updateResumeInfo(field: string, value: string) {
    if (!resume) return;
    
    try {
      await fetch(`/api/resume/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value }),
      });
      
      setResume({ ...resume, [field]: value });
    } catch (error) {
      console.error('Error updating resume:', error);
    }
  }

  async function addSection(sectionType: SectionType) {
    if (!resume) return;
    
    const defaultContent = getDefaultContent(sectionType);
    
    try {
      const response = await fetch(`/api/resume/${id}/sections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          section_type: sectionType,
          content: defaultContent,
        }),
      });
      
      const { section } = await response.json();
      setResume({
        ...resume,
        sections: [...resume.sections, section],
      });
      setShowAddSection(false);
    } catch (error) {
      console.error('Error adding section:', error);
    }
  }

  async function updateSection(sectionId: string, content: SectionContent) {
    if (!resume) return;
    
    try {
      await fetch(`/api/resume/${id}/sections/${sectionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      
      setResume({
        ...resume,
        sections: resume.sections.map(s => 
          s.id === sectionId ? { ...s, content } : s
        ),
      });
    } catch (error) {
      console.error('Error updating section:', error);
    }
  }

  async function deleteSection(sectionId: string) {
    if (!resume) return;
    const confirmed = await confirm('Delete this section?', {
      title: 'Delete Section',
      type: 'danger',
      confirmText: 'Delete',
      cancelText: 'Cancel',
    });
    if (!confirmed) return;
    
    try {
      await fetch(`/api/resume/${id}/sections/${sectionId}`, {
        method: 'DELETE',
      });
      
      setResume({
        ...resume,
        sections: resume.sections.filter(s => s.id !== sectionId),
      });
    } catch (error) {
      console.error('Error deleting section:', error);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading resume...</div>
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/resume-builder"
                className="text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <input
                  type="text"
                  value={resume.title}
                  onChange={(e) => updateResumeInfo('title', e.target.value)}
                  className="text-xl font-bold text-gray-900 bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 -ml-2"
                />
                <p className="text-sm text-gray-600">
                  Last updated {new Date(resume.updated_at).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href={`/resume-builder/${id}/preview`}
                className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Preview
              </Link>
              <Link
                href={`/resume-builder/${id}/adapt`}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                <Sparkles className="w-4 h-4" />
                Adapt to Job
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Contact Info */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h2>
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Full Name"
              value={resume.full_name || ''}
              onChange={(e) => updateResumeInfo('full_name', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="email"
              placeholder="Email"
              value={resume.email || ''}
              onChange={(e) => updateResumeInfo('email', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="tel"
              placeholder="Phone"
              value={resume.phone || ''}
              onChange={(e) => updateResumeInfo('phone', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              placeholder="Location"
              value={resume.location || ''}
              onChange={(e) => updateResumeInfo('location', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="url"
              placeholder="LinkedIn URL"
              value={resume.linkedin_url || ''}
              onChange={(e) => updateResumeInfo('linkedin_url', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="url"
              placeholder="Portfolio URL"
              value={resume.portfolio_url || ''}
              onChange={(e) => updateResumeInfo('portfolio_url', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Sections */}
        <div className="space-y-6">
          {resume.sections.map((section) => (
            <SectionEditor
              key={section.id}
              section={section}
              onUpdate={(content) => updateSection(section.id, content)}
              onDelete={() => deleteSection(section.id)}
            />
          ))}
        </div>

        {/* Add Section Button */}
        <button
          onClick={() => setShowAddSection(true)}
          className="w-full mt-6 py-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Section
        </button>
      </div>

      {/* Add Section Modal */}
      {showAddSection && (
        <AddSectionModal
          onSelect={addSection}
          onClose={() => setShowAddSection(false)}
        />
      )}
    </div>
  );
}

function SectionEditor({
  section,
  onUpdate,
  onDelete,
}: {
  section: ResumeSection;
  onUpdate: (content: SectionContent) => void;
  onDelete: () => void;
}) {
  const getSectionIcon = (type: SectionType) => {
    switch (type) {
      case 'experience': return <Briefcase className="w-5 h-5" />;
      case 'education': return <GraduationCap className="w-5 h-5" />;
      case 'skills': return <Code className="w-5 h-5" />;
      case 'projects': return <Award className="w-5 h-5" />;
      default: return null;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="text-blue-600">{getSectionIcon(section.section_type)}</div>
          <h3 className="text-lg font-semibold text-gray-900 capitalize">
            {section.section_type}
          </h3>
        </div>
        <button
          onClick={onDelete}
          className="text-red-600 hover:text-red-700 p-2"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {section.section_type === 'summary' && (
        <SummaryEditor
          content={section.content as SummaryContent}
          onChange={onUpdate}
        />
      )}
      
      {section.section_type === 'experience' && (
        <ExperienceEditor
          content={section.content as ExperienceContent}
          onChange={onUpdate}
        />
      )}
      
      {section.section_type === 'education' && (
        <EducationEditor
          content={section.content as EducationContent}
          onChange={onUpdate}
        />
      )}
      
      {section.section_type === 'skills' && (
        <SkillsEditor
          content={section.content as SkillsContent}
          onChange={onUpdate}
        />
      )}
      
      {section.section_type === 'projects' && (
        <ProjectEditor
          content={section.content as ProjectContent}
          onChange={onUpdate}
        />
      )}
    </div>
  );
}

// Individual section editors
function SummaryEditor({ content, onChange }: { content: SummaryContent; onChange: (c: SectionContent) => void }) {
  return (
    <textarea
      value={content.text}
      onChange={(e) => onChange({ text: e.target.value })}
      className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      placeholder="Write a compelling summary highlighting your key qualifications..."
    />
  );
}

function ExperienceEditor({ content, onChange }: { content: ExperienceContent; onChange: (c: SectionContent) => void }) {
  const addBullet = () => {
    onChange({ ...content, bullets: [...content.bullets, ''] });
  };

  const updateBullet = (index: number, value: string) => {
    const newBullets = [...content.bullets];
    newBullets[index] = value;
    onChange({ ...content, bullets: newBullets });
  };

  const removeBullet = (index: number) => {
    onChange({ ...content, bullets: content.bullets.filter((_, i) => i !== index) });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <input
          type="text"
          placeholder="Position Title"
          value={content.position}
          onChange={(e) => onChange({ ...content, position: e.target.value })}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="text"
          placeholder="Company Name"
          value={content.company}
          onChange={(e) => onChange({ ...content, company: e.target.value })}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <input
          type="text"
          placeholder="Start Date (e.g., Jan 2020)"
          value={content.startDate}
          onChange={(e) => onChange({ ...content, startDate: e.target.value })}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="text"
          placeholder="End Date (or 'Present')"
          value={content.endDate || ''}
          onChange={(e) => onChange({ ...content, endDate: e.target.value })}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Key Achievements</label>
        {content.bullets.map((bullet, index) => (
          <div key={index} className="flex gap-2">
            <input
              type="text"
              value={bullet}
              onChange={(e) => updateBullet(index, e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="• Describe your achievement or responsibility..."
            />
            <button
              onClick={() => removeBullet(index)}
              className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
            >
              ×
            </button>
          </div>
        ))}
        <button
          onClick={addBullet}
          className="text-sm text-blue-600 hover:text-blue-700"
        >
          + Add bullet point
        </button>
      </div>
    </div>
  );
}

function EducationEditor({ content, onChange }: { content: EducationContent; onChange: (c: SectionContent) => void }) {
  return (
    <div className="space-y-4">
      <input
        type="text"
        placeholder="Degree (e.g., Bachelor of Science)"
        value={content.degree}
        onChange={(e) => onChange({ ...content, degree: e.target.value })}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <input
        type="text"
        placeholder="Institution Name"
        value={content.institution}
        onChange={(e) => onChange({ ...content, institution: e.target.value })}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <div className="grid grid-cols-2 gap-4">
        <input
          type="text"
          placeholder="Year (e.g., 2020)"
          value={content.year}
          onChange={(e) => onChange({ ...content, year: e.target.value })}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="text"
          placeholder="GPA (optional)"
          value={content.gpa || ''}
          onChange={(e) => onChange({ ...content, gpa: e.target.value })}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>
  );
}

function SkillsEditor({ content, onChange }: { content: SkillsContent; onChange: (c: SectionContent) => void }) {
  return (
    <div className="space-y-4">
      <input
        type="text"
        placeholder="Category (e.g., Technical Skills, Languages)"
        value={content.category}
        onChange={(e) => onChange({ ...content, category: e.target.value })}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <textarea
        value={content.items.join(', ')}
        onChange={(e) => onChange({ ...content, items: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
        className="w-full h-24 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="Enter skills separated by commas (e.g., JavaScript, React, Node.js)"
      />
    </div>
  );
}

function ProjectEditor({ content, onChange }: { content: ProjectContent; onChange: (c: SectionContent) => void }) {
  const addBullet = () => {
    onChange({ ...content, bullets: [...content.bullets, ''] });
  };

  const updateBullet = (index: number, value: string) => {
    const newBullets = [...content.bullets];
    newBullets[index] = value;
    onChange({ ...content, bullets: newBullets });
  };

  const removeBullet = (index: number) => {
    onChange({ ...content, bullets: content.bullets.filter((_, i) => i !== index) });
  };

  return (
    <div className="space-y-4">
      <input
        type="text"
        placeholder="Project Name"
        value={content.name}
        onChange={(e) => onChange({ ...content, name: e.target.value })}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <textarea
        placeholder="Project Description"
        value={content.description}
        onChange={(e) => onChange({ ...content, description: e.target.value })}
        className="w-full h-20 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Key Details</label>
        {content.bullets.map((bullet, index) => (
          <div key={index} className="flex gap-2">
            <input
              type="text"
              value={bullet}
              onChange={(e) => updateBullet(index, e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="• Describe a key feature or achievement..."
            />
            <button
              onClick={() => removeBullet(index)}
              className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
            >
              ×
            </button>
          </div>
        ))}
        <button
          onClick={addBullet}
          className="text-sm text-blue-600 hover:text-blue-700"
        >
          + Add detail
        </button>
      </div>
    </div>
  );
}

function AddSectionModal({
  onSelect,
  onClose,
}: {
  onSelect: (type: SectionType) => void;
  onClose: () => void;
}) {
  const sections: { type: SectionType; label: string; icon: React.ReactNode }[] = [
    { type: 'summary', label: 'Professional Summary', icon: <Sparkles className="w-5 h-5" /> },
    { type: 'experience', label: 'Work Experience', icon: <Briefcase className="w-5 h-5" /> },
    { type: 'education', label: 'Education', icon: <GraduationCap className="w-5 h-5" /> },
    { type: 'skills', label: 'Skills', icon: <Code className="w-5 h-5" /> },
    { type: 'projects', label: 'Projects', icon: <Award className="w-5 h-5" /> },
    { type: 'certifications', label: 'Certifications', icon: <Award className="w-5 h-5" /> },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Add Section</h2>
        <div className="grid grid-cols-2 gap-3">
          {sections.map((section) => (
            <button
              key={section.type}
              onClick={() => onSelect(section.type)}
              className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
            >
              <div className="text-blue-600">{section.icon}</div>
              <span className="text-sm font-medium text-gray-900">{section.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function getDefaultContent(type: SectionType): SectionContent {
  switch (type) {
    case 'summary':
      return { text: '' };
    case 'experience':
      return { position: '', company: '', startDate: '', bullets: [''] };
    case 'education':
      return { degree: '', institution: '', year: '' };
    case 'skills':
      return { category: '', items: [] };
    case 'projects':
      return { name: '', description: '', bullets: [''] };
    case 'certifications':
      return { name: '', issuer: '' };
    default:
      return { text: '' };
  }
}
