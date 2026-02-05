'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowUpRight, Linkedin, Mail, X } from 'lucide-react';
import { portfolioData, type PortfolioProject } from '@/lib/portfolio-data';
import { useEmbedMode } from '@/app/ClientAuthWrapper';

const navItems = [
  { id: 'about', label: 'About' },
  { id: 'experience', label: 'Experience' },
  { id: 'work', label: 'Work' },
  { id: 'skills', label: 'Skills' },
  { id: 'contact', label: 'Contact' },
];

// Extract unique categories from project tags
const CATEGORIES = [
  { id: 'all', label: 'All Projects' },
  { id: 'ai', label: 'AI & Discovery' },
  { id: 'community', label: 'Community & Engagement' },
  { id: 'platform', label: 'Platform & Integration' },
  { id: 'edtech', label: 'EdTech' },
  { id: 'discovery', label: 'Research & Discovery' },
];

function getCategoryForProject(project: PortfolioProject): string[] {
  const categories: string[] = ['all'];
  const tagString = project.tags.join(' ').toLowerCase();
  
  if (tagString.includes('ai') || tagString.includes('semantic') || tagString.includes('vector') || tagString.includes('chatgpt')) {
    categories.push('ai');
  }
  if (tagString.includes('community') || tagString.includes('engagement') || tagString.includes('feed')) {
    categories.push('community');
  }
  if (tagString.includes('platform') || tagString.includes('integration') || tagString.includes('cms') || tagString.includes('marketplace')) {
    categories.push('platform');
  }
  if (tagString.includes('edtech') || tagString.includes('education') || tagString.includes('learning')) {
    categories.push('edtech');
  }
  if (tagString.includes('discovery') || tagString.includes('research') || tagString.includes('qualitative')) {
    categories.push('discovery');
  }
  
  return categories;
}

function ProjectGrid({
  projects,
  onProjectClick,
}: {
  projects: PortfolioProject[];
  onProjectClick: (project: PortfolioProject) => void;
}) {
  const [selectedCategory, setSelectedCategory] = useState('all');

  const filteredProjects = projects.filter((project) => {
    if (selectedCategory === 'all') return true;
    return getCategoryForProject(project).includes(selectedCategory);
  });

  return (
    <div>
      {/* Category Tabs */}
      <div className="mb-8 flex flex-wrap gap-2">
        {CATEGORIES.map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`rounded-full px-4 py-2 text-xs font-medium uppercase tracking-wider transition-all ${
              selectedCategory === category.id
                ? 'bg-accent text-white shadow-sm'
                : 'bg-muted/20 text-muted hover:bg-muted/30 hover:text-foreground'
            }`}
          >
            {category.label}
          </button>
        ))}
      </div>

      {/* Masonry Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {filteredProjects.map((project) => (
          <div
            key={project.id}
            role="button"
            tabIndex={0}
            onClick={() => onProjectClick(project)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onProjectClick(project);
              }
            }}
            className="group relative rounded-lg border border-border bg-white p-6 transition-all hover:border-accent hover:shadow-lg cursor-pointer"
          >
            <p className="text-xs font-medium text-muted uppercase tracking-wider">
              {project.company}
            </p>
            <h4 className="mt-2 font-medium text-foreground group-hover:text-accent transition-colors leading-snug">
              {project.title}
            </h4>
            <p className="mt-3 text-sm text-muted leading-relaxed line-clamp-3">
              {project.cardTeaser}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {project.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent"
                >
                  {tag}
                </span>
              ))}
              {project.tags.length > 3 && (
                <span className="rounded-full bg-muted/20 px-3 py-1 text-xs font-medium text-muted">
                  +{project.tags.length - 3}
                </span>
              )}
            </div>
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-xs font-medium text-accent line-clamp-2">
                {project.outcome}
              </p>
            </div>
          </div>
        ))}
      </div>

      {filteredProjects.length === 0 && (
        <div className="py-12 text-center text-muted">
          <p>No projects found in this category.</p>
        </div>
      )}
    </div>
  );
}

function ProjectModal({
  project,
  onClose,
}: {
  project: PortfolioProject;
  onClose: () => void;
}) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 pt-12 pb-24"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="project-modal-title"
    >
      <div
        className="relative w-full max-w-2xl rounded-lg border border-border bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-border bg-white p-6 pb-4">
          <div>
            <p className="text-xs font-medium text-muted uppercase tracking-wider">{project.company}</p>
            <h2 id="project-modal-title" className="mt-1 text-xl font-semibold text-foreground">
              {project.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded p-1 text-muted hover:bg-muted hover:text-foreground transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="max-h-[calc(100vh-12rem)] overflow-y-auto p-6 pt-4">
          <div className="space-y-6">
            {project.details.map((section, i) => (
              <div key={i}>
                {section.heading && (
                  <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-accent">
                    {section.heading}
                  </h3>
                )}
                {section.paragraphs?.map((p, j) => (
                  <p key={j} className="text-sm text-muted leading-relaxed mb-3 last:mb-0">
                    {p}
                  </p>
                ))}
                {section.list && (
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted">
                    {section.list.map((item, j) => (
                      <li key={j}>{item}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const [activeSection, setActiveSection] = useState('about');
  const [modalProject, setModalProject] = useState<PortfolioProject | null>(null);
  const isEmbed = useEmbedMode();

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: '-50% 0px -50% 0px' }
    );

    navItems.forEach(({ id }) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-white lg:flex">
      {/* Embed Mode Indicator - Only visible in v0 preview */}
      {isEmbed && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-blue-500 text-white text-xs py-1 px-4 text-center">
          Preview Mode - Auth disabled for iframe embedding
        </div>
      )}
      
      {/* Left Sidebar - Sticky on Desktop */}
      <header className="lg:fixed lg:top-0 lg:left-0 lg:flex lg:h-screen lg:w-1/2 lg:flex-col lg:justify-between lg:py-24 lg:px-24 px-6 py-16">
        <div>
          <h1 className="text-4xl font-bold text-foreground lg:text-5xl tracking-tight">
            {portfolioData.fullName}
          </h1>
          <h2 className="mt-3 text-xl font-medium text-foreground/90 lg:text-2xl">
            {portfolioData.title}
          </h2>
          <p className="mt-4 max-w-xs text-muted leading-relaxed">
            {portfolioData.tagline}
          </p>

          {/* Navigation - Desktop Only */}
          <nav className="mt-16 hidden lg:block">
            <ul className="flex flex-col gap-4">
              {navItems.map(({ id, label }) => (
                <li key={id}>
                  <a
                    href={`#${id}`}
                    className={`group flex items-center gap-4 py-1 transition-all duration-300 ${
                      activeSection === id ? 'text-foreground' : 'text-muted hover:text-foreground'
                    }`}
                  >
                    <span
                      className={`h-px transition-all duration-300 ${
                        activeSection === id
                          ? 'w-16 bg-accent'
                          : 'w-8 bg-muted group-hover:w-16 group-hover:bg-foreground'
                      }`}
                    />
                    <span className="text-xs font-semibold uppercase tracking-widest">
                      {label}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* Social Links */}
        <div className="mt-8 flex items-center gap-6 lg:mt-0">
          <a
            href={portfolioData.linkedinUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="LinkedIn"
            className="text-muted hover:text-accent transition-colors"
          >
            <Linkedin className="h-5 w-5" />
          </a>
          <a
            href={`mailto:${portfolioData.email}`}
            aria-label="Email"
            className="text-muted hover:text-accent transition-colors"
          >
            <Mail className="h-5 w-5" />
          </a>
          <Link
            href="/assistant"
            className="text-xs font-medium text-muted hover:text-accent transition-colors uppercase tracking-wider"
          >
            Assistant
          </Link>
        </div>
      </header>

      {/* Right Column - Scrollable Content */}
      <main className="lg:ml-[50%] lg:w-1/2 px-6 py-16 lg:py-24 lg:px-24">
        {/* About Section */}
        <section id="about" className="mb-24 scroll-mt-24 lg:mb-36">
          <h3 className="mb-8 text-sm font-semibold uppercase tracking-widest text-accent lg:hidden">
            About
          </h3>
          <div className="space-y-4">
            <p className="text-muted leading-relaxed">
              Product leader focused on building AI-powered products that drive measurable outcomes. 
              Currently shaping AI strategy at Skillshare, with a track record of shipped products across 
              EdTech and community platforms.
            </p>
            <p className="text-muted leading-relaxed">
              I thrive in ambiguity—taking on multiple complex initiatives, moving fast with limited 
              resources, and finding creative solutions when priorities shift. Recognized for resilience, 
              agility, and cross-functional impact.
            </p>
          </div>

          {/* Awards */}
          {portfolioData.awards && portfolioData.awards.length > 0 && (
            <div className="mt-12 space-y-6">
              {portfolioData.awards.map((award, idx) => (
                <div key={idx} className="border-l-2 border-accent pl-4">
                  <div className="flex items-baseline justify-between mb-1">
                    <h4 className="font-medium text-foreground">{award.title}</h4>
                    <span className="text-xs text-muted ml-4">{award.quarter}</span>
                  </div>
                  <p className="text-sm text-muted leading-relaxed mb-2">{award.description}</p>
                  <ul className="flex flex-wrap gap-2">
                    {award.keyTraits.map((trait, traitIdx) => (
                      <li
                        key={traitIdx}
                        className="rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent"
                      >
                        {trait}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Experience Section */}
        <section id="experience" className="mb-24 scroll-mt-24 lg:mb-36">
          <h3 className="mb-8 text-sm font-semibold uppercase tracking-widest text-accent lg:hidden">
            Experience
          </h3>
          <div className="space-y-12">
            {portfolioData.experiences.map((exp, idx) => (
              <div
                key={idx}
                className="group relative grid gap-4 pb-1 transition-all"
              >
                <div className="absolute -inset-x-4 -inset-y-4 z-0 hidden rounded-md transition-all group-hover:bg-card/50 group-hover:shadow-[inset_0_1px_0_0_rgba(148,163,184,0.1)] lg:block" />
                <div className="z-10">
                  <p className="text-xs font-medium text-muted uppercase tracking-wider">{exp.period}</p>
                  <h4 className="mt-1 font-medium text-foreground group-hover:text-accent transition-colors">
                    {exp.title}
                  </h4>
                  {exp.subtitle && (
                    <p className="text-sm text-muted italic">{exp.subtitle}</p>
                  )}
                  <p className="text-sm text-muted">{exp.company} • {exp.location}</p>
                  <p className="mt-2 text-sm text-muted leading-relaxed">{exp.description}</p>
                  {exp.highlights && exp.highlights.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {exp.highlights.map((highlight, hIdx) => (
                        <p key={hIdx} className="text-sm text-accent font-medium">{highlight}</p>
                      ))}
                    </div>
                  )}
                  <ul className="mt-4 flex flex-wrap gap-2">
                    {exp.skills.map((skill) => (
                      <li
                        key={skill}
                        className="rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent"
                      >
                        {skill}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Work Section */}
        <section id="work" className="mb-24 scroll-mt-24 lg:mb-36">
          <h3 className="mb-8 text-sm font-semibold uppercase tracking-widest text-accent lg:hidden">
            Work
          </h3>
          <ProjectGrid projects={portfolioData.projects} onProjectClick={setModalProject} />
          {modalProject && (
            <ProjectModal project={modalProject} onClose={() => setModalProject(null)} />
          )}
        </section>

        {/* Skills Section */}
        <section id="skills" className="mb-24 scroll-mt-24 lg:mb-36">
          <h3 className="mb-8 text-sm font-semibold uppercase tracking-widest text-accent lg:hidden">
            Skills
          </h3>
          <div className="space-y-8">
            {Object.entries(portfolioData.skills).map(([category, skillList]) => (
              <div key={category}>
                <h4 className="mb-4 text-sm font-semibold text-foreground capitalize">{category}</h4>
                <ul className="flex flex-wrap gap-2">
                  {skillList.map((skill) => (
                    <li
                      key={skill}
                      className="rounded-full border border-border px-3 py-1 text-xs text-muted"
                    >
                      {skill}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Certifications */}
          <div className="mt-16">
            <h4 className="mb-6 text-sm font-semibold text-foreground">Certifications</h4>
            <ul className="space-y-3 text-sm text-muted">
              {portfolioData.certifications.map((cert, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <span className="text-accent">—</span>
                  <span>{cert.name} — {cert.issuer}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Education */}
          <div className="mt-12">
            <h4 className="mb-6 text-sm font-semibold text-foreground">Education</h4>
            <ul className="space-y-3 text-sm text-muted">
              {portfolioData.education.map((edu, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <span className="text-accent">—</span>
                  <span>{edu.degree} — {edu.institution}, {edu.year}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Contact Section */}
        <section id="contact" className="scroll-mt-24">
          <h3 className="mb-8 text-sm font-semibold uppercase tracking-widest text-accent lg:hidden">
            Contact
          </h3>
          <div className="space-y-6">
            <p className="text-muted leading-relaxed">
              I'm always interested in hearing about new opportunities, especially roles focused on{' '}
              <span className="text-foreground">AI-powered products</span>,{' '}
              <span className="text-foreground">community-driven platforms</span>, or{' '}
              <span className="text-foreground">EdTech innovation</span>.
            </p>
            <div className="flex flex-col gap-4">
              <a
                href={`mailto:${portfolioData.email}`}
                className="group inline-flex items-center gap-3 text-foreground hover:text-accent transition-colors"
              >
                <Mail className="h-5 w-5" />
                <span>{portfolioData.email}</span>
                <ArrowUpRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </a>
              <a
                href={portfolioData.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-3 text-foreground hover:text-accent transition-colors"
              >
                <Linkedin className="h-5 w-5" />
                <span>linkedin.com/in/biancastarling</span>
                <ArrowUpRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </a>
            </div>
            <p className="text-sm text-muted pt-4">
              Based in {portfolioData.location} — Available for remote work globally.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
