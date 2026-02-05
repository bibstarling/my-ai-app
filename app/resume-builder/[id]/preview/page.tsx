'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { ArrowLeft, Download, Mail, Phone, MapPin, Linkedin, Globe } from 'lucide-react';
import type { ResumeWithSections, ResumeSection, ExperienceContent, EducationContent, SkillsContent, SummaryContent, ProjectContent } from '@/lib/types/resume';

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ adaptation?: string }>;
};

export default function ResumePreviewPage({ params, searchParams }: PageProps) {
  const { id } = use(params);
  const [resume, setResume] = useState<ResumeWithSections | null>(null);
  const [loading, setLoading] = useState(true);

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
    <div className="min-h-screen bg-gray-100">
      {/* Toolbar */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            href={`/resume-builder/${id}`}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Editor
          </Link>
          <div className="flex gap-2">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Download className="w-4 h-4" />
              Print / Save PDF
            </button>
            <a
              href={`/api/resume/${id}/export`}
              target="_blank"
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              Export HTML
            </a>
          </div>
        </div>
      </div>

      {/* Resume Preview */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white shadow-lg rounded-lg overflow-hidden print:shadow-none print:rounded-none" id="resume-content">
          <div className="p-12">
            {/* Header */}
            <div className="mb-8 pb-6 border-b-2 border-gray-900">
              <h1 className="text-4xl font-bold text-gray-900 mb-3">
                {resume.full_name || 'Your Name'}
              </h1>
              
              <div className="flex flex-wrap gap-4 text-sm text-gray-600">
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
            </div>

            {/* Sections */}
            <div className="space-y-6">
              {resume.sections
                .sort((a, b) => a.sort_order - b.sort_order)
                .map((section) => (
                  <ResumeSection key={section.id} section={section} />
                ))}
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
          .print\\:shadow-none {
            box-shadow: none !important;
          }
          .print\\:rounded-none {
            border-radius: 0 !important;
          }
          @page {
            margin: 0.5in;
            size: letter;
          }
        }
      `}</style>
    </div>
  );
}

function ResumeSection({ section }: { section: ResumeSection }) {
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

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-3 uppercase tracking-wide border-b border-gray-300 pb-2">
        {getSectionTitle(section.section_type)}
      </h2>
      
      <div className="mt-3">
        {section.section_type === 'summary' && (
          <SummarySection content={section.content as SummaryContent} />
        )}
        {section.section_type === 'experience' && (
          <ExperienceSection content={section.content as ExperienceContent} />
        )}
        {section.section_type === 'education' && (
          <EducationSection content={section.content as EducationContent} />
        )}
        {section.section_type === 'skills' && (
          <SkillsSection content={section.content as SkillsContent} />
        )}
        {section.section_type === 'projects' && (
          <ProjectSection content={section.content as ProjectContent} />
        )}
      </div>
    </div>
  );
}

function SummarySection({ content }: { content: SummaryContent }) {
  return (
    <p className="text-gray-700 leading-relaxed">
      {content.text}
    </p>
  );
}

function ExperienceSection({ content }: { content: ExperienceContent }) {
  return (
    <div className="mb-4">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{content.position}</h3>
          <p className="text-gray-700">{content.company}</p>
        </div>
        <div className="text-right text-sm text-gray-600">
          <p>{content.startDate} — {content.endDate || 'Present'}</p>
          {content.location && <p>{content.location}</p>}
        </div>
      </div>
      
      {content.bullets && content.bullets.length > 0 && (
        <ul className="list-disc list-outside ml-5 space-y-1.5">
          {content.bullets.filter(Boolean).map((bullet, i) => (
            <li key={i} className="text-gray-700 leading-relaxed">
              {bullet}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function EducationSection({ content }: { content: EducationContent }) {
  return (
    <div className="mb-4">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{content.degree}</h3>
          <p className="text-gray-700">{content.institution}</p>
          {content.description && (
            <p className="text-gray-600 mt-1">{content.description}</p>
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

function SkillsSection({ content }: { content: SkillsContent }) {
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

function ProjectSection({ content }: { content: ProjectContent }) {
  return (
    <div className="mb-4">
      <div className="mb-2">
        <h3 className="text-lg font-semibold text-gray-900">{content.name}</h3>
        {content.description && (
          <p className="text-gray-700 mt-1">{content.description}</p>
        )}
      </div>
      
      {content.bullets && content.bullets.length > 0 && (
        <ul className="list-disc list-outside ml-5 space-y-1.5">
          {content.bullets.filter(Boolean).map((bullet, i) => (
            <li key={i} className="text-gray-700 leading-relaxed">
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
