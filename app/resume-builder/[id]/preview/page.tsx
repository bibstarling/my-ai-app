'use client';

import { useState, useEffect, useCallback, use } from 'react';
import Link from 'next/link';
import { ArrowLeft, Download, Mail, Phone, MapPin, Linkedin, Globe } from 'lucide-react';
import type { ResumeWithSections, ResumeSection, ExperienceContent, EducationContent, SkillsContent, SummaryContent, ProjectContent } from '@/lib/types/resume';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ adaptation?: string; autoDownload?: string }>;
};

export default function ResumePreviewPage({ params, searchParams }: PageProps) {
  const { id } = use(params);
  const resolvedSearchParams = searchParams ? use(searchParams) : undefined;
  const [resume, setResume] = useState<ResumeWithSections | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

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

  const downloadPDF = useCallback(async () => {
    if (!resume) return;
    
    setDownloading(true);
    try {
      const resumeElement = document.getElementById('resume-content');
      if (!resumeElement) {
        throw new Error('Resume content not found');
      }

      // Generate canvas from HTML
      const canvas = await html2canvas(resumeElement, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      // Calculate PDF dimensions
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      const pdf = new jsPDF('p', 'mm', 'a4');
      let position = 0;

      // Add image to PDF
      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Add additional pages if needed
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Generate filename
      const fullName = resume.full_name || 'resume';
      const title = resume.title || '';
      const companyMatch = title.match(/at\s+(.+)$/i);
      const companyName = companyMatch ? companyMatch[1].replace(/[^a-z0-9]/gi, '').toLowerCase() : 'company';
      const filename = `resume_${fullName.toLowerCase().replace(/\s+/g, '')}_${companyName}.pdf`;

      // Download PDF
      pdf.save(filename);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try using the print dialog instead.');
    } finally {
      setDownloading(false);
    }
  }, [resume]);

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
      <div className="fixed inset-0 bg-black/30" onClick={() => window.history.back()} />
      
      {/* Sidebar modal */}
      <div className="fixed inset-0 flex items-center justify-end pointer-events-none">
        <div className="h-full w-full max-w-3xl bg-white shadow-xl overflow-y-auto pointer-events-auto animate-slide-in-right">
          {/* Toolbar */}
          <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
            <div className="px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Resume Preview</h2>
              <div className="flex items-center gap-2">
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
              </div>
            </div>
          </div>

          {/* Resume Preview */}
          <div className="p-6">
            <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden print:shadow-none print:rounded-none print:border-0" id="resume-content">
              <div className="p-8">
                {/* Header */}
                <div className="mb-6 pb-4 border-b-2 border-gray-900">
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
                </div>

                {/* Sections */}
                <div className="space-y-5">
                  {resume.sections
                    .sort((a, b) => a.sort_order - b.sort_order)
                    .map((section) => (
                      <ResumeSection key={section.id} section={section} />
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
      <h2 className="text-lg font-bold text-gray-900 mb-2 uppercase tracking-wide border-b border-gray-300 pb-1">
        {getSectionTitle(section.section_type)}
      </h2>
      
      <div className="mt-2">
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

function EducationSection({ content }: { content: EducationContent }) {
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
