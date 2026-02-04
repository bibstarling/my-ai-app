'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowUpRight, Linkedin, Mail, ExternalLink } from 'lucide-react';

const navItems = [
  { id: 'about', label: 'About' },
  { id: 'experience', label: 'Experience' },
  { id: 'work', label: 'Work' },
  { id: 'approach', label: 'Approach' },
  { id: 'contact', label: 'Contact' },
];

const experiences = [
  {
    period: 'Mar 2024 — Present',
    title: 'Senior Product Manager',
    company: 'Skillshare',
    location: 'New York, USA (Remote)',
    description: 'Leading taxonomy overhaul with AI-powered classification improving content discoverability. Driving digital products integration and Creator Hub expansion, enabling new revenue streams. Implementing headless CMS and building personalized community feed to increase learner engagement.',
    skills: ['AI Classification', 'Marketplace', 'CMS', 'Community'],
  },
  {
    period: 'Mar 2022 — Mar 2024',
    title: 'Senior Product Manager',
    company: 'Voxy',
    location: 'New York, USA (Remote)',
    description: 'Transformed AI-Powered Publishing Platform, increasing publishing productivity across multiple languages. Implemented Maze for user testing, initiated design system creation, and integrated Productboard for data-informed decisions. Led platform integration following two acquisitions.',
    skills: ['AI Publishing', 'Design Systems', 'Continuous Discovery', 'Platform Integration'],
  },
  {
    period: 'May 2020 — Mar 2022',
    title: 'Product Manager',
    company: 'SENAI National Department',
    location: 'Brasília, Brazil',
    description: 'Created national digital transformation program with 750K BRL budget. Built AI-powered course recommendation platform analyzing student resumes and job posts. Developed educational resources repository saving 20TB storage. Created AR app for machinery visualization.',
    skills: ['Digital Transformation', 'AI/ML', 'EdTech', 'AR'],
  },
  {
    period: 'Apr 2018 — May 2020',
    title: 'Product Manager',
    company: 'Unyleya Educacional',
    location: 'Brasília, Brazil',
    description: 'Built Custom CMS enabling course publishing in 15 min (previously 1 week), driving 200% revenue increase. Developed Netflix-style student platform and native mobile apps with offline download, favorites, and progress tracking.',
    skills: ['CMS', 'Mobile Apps', 'Revenue Growth', 'UX'],
  },
];

const projects = [
  {
    title: 'AI-Driven Content Classification',
    company: 'Skillshare',
    description: 'Led the release of a restructured taxonomy with QA coordination and AI-powered classification, resulting in improved content discoverability and learner experience.',
    outcome: 'New bar for catalog scalability',
    tags: ['AI/ML', 'Taxonomy', 'Discovery'],
  },
  {
    title: 'Creator Hub & Digital Marketplace',
    company: 'Skillshare',
    description: 'Spearheaded Creator Hub development to support multi-format offerings and improve creator workflows. Drove launch of digital product offerings expanding marketplace beyond classes.',
    outcome: 'New revenue streams for creators',
    tags: ['Marketplace', 'Creator Tools', 'Monetization'],
  },
  {
    title: 'SENAI Skills GAP AI Engine',
    company: 'SENAI',
    description: 'Conceptualized platform to analyze student resumes, SENAI offerings, and job posts to recommend targeted courses, increasing chances of securing specific jobs.',
    outcome: 'Personalized learning pathways',
    tags: ['AI/ML', 'Recommendation', 'EdTech'],
  },
  {
    title: 'Continuous Discovery at Voxy',
    company: 'Voxy',
    description: 'Successfully ran MVP and introduced continuous discovery process, making product development more assertive and aligned with user needs. Integrated Productboard for data-informed decisions.',
    outcome: 'Reduced time-to-market',
    tags: ['Discovery', 'Process', 'Data-Driven'],
  },
  {
    title: 'SCORM Hub',
    company: 'SENAI',
    description: 'Developed open educational resources repository to manage and share educational assets across national network of teachers.',
    outcome: '20TB storage savings',
    tags: ['Repository', 'Cost Savings', 'Scale'],
  },
];

const approachItems = [
  {
    title: 'Customer-Centric Discovery',
    description: 'I build products users naturally gravitate towards. Using continuous discovery, I steer away from traditional personas and focus on real customer interactions for more inclusive solutions.',
  },
  {
    title: 'Metrics That Matter',
    description: 'Every feature starts with aligning business metrics to product metrics. This ensures efforts contribute meaningfully to growth, avoiding wasted resources on low ROI features.',
  },
  {
    title: 'The Product Trio',
    description: 'My ideal workflow involves PM, designer, and engineer working together to assess desirability, viability, and feasibility. We use opportunity solution trees to link customer needs to business metrics.',
  },
  {
    title: 'Test Assumptions Fast',
    description: 'We map and test critical assumptions for each solution using the compare and contrast methodology—generating multiple solutions to find the most impactful one.',
  },
];

const skills = {
  technical: ['Product Management', 'Continuous Discovery', 'UI/UX Design', 'Data Analysis', 'Agile', 'APIs', 'SQL', 'Technical Writing'],
  tools: ['Productboard', 'Pendo', 'Maze', 'Jira', 'Tableau', 'Google Analytics', 'Figma', 'Airtable'],
  soft: ['Leadership', 'Problem-Solving', 'Critical Thinking', 'Communication', 'Decision-Making', 'Collaboration'],
};

export default function HomePage() {
  const [activeSection, setActiveSection] = useState('about');

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
    <div className="min-h-screen bg-background lg:flex">
      {/* Left Sidebar - Sticky on Desktop */}
      <header className="lg:fixed lg:top-0 lg:left-0 lg:flex lg:h-screen lg:w-1/2 lg:flex-col lg:justify-between lg:py-24 lg:px-24 px-6 py-16">
        <div>
          <h1 className="text-4xl font-bold text-foreground lg:text-5xl tracking-tight">
            Bianca Starling
          </h1>
          <h2 className="mt-3 text-xl font-medium text-foreground/90 lg:text-2xl">
            Senior Product Manager
          </h2>
          <p className="mt-4 max-w-xs text-muted leading-relaxed">
            Building AI-powered products in digital education and creative platforms. Based in Brasília, working globally.
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
            href="https://linkedin.com/in/biancastarling"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="LinkedIn"
            className="text-muted hover:text-accent transition-colors"
          >
            <Linkedin className="h-5 w-5" />
          </a>
          <a
            href="mailto:bibstarling@gmail.com"
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

      {/* Right Content - Scrollable */}
      <main className="lg:ml-[50%] lg:w-1/2 lg:py-24 lg:px-24 px-6 pb-24">
        {/* About Section */}
        <section id="about" className="mb-24 scroll-mt-24 lg:mb-36">
          <h3 className="mb-8 text-sm font-semibold uppercase tracking-widest text-accent lg:hidden">
            About
          </h3>
          <div className="space-y-4 text-muted leading-relaxed">
            <p>
              I'm an experienced{' '}
              <span className="text-foreground">Senior Product Manager</span> specializing in{' '}
              <span className="text-foreground">digital transformation</span>,{' '}
              <span className="text-foreground">educational platforms</span>, and{' '}
              <span className="text-foreground">AI-powered products</span>. My journey from mechatronics engineering to industrial design to product management gives me a unique blend of technical depth and creative problem-solving.
            </p>
            <p>
              Currently at <span className="text-foreground">Skillshare</span>, I'm leading AI-driven content classification and building the Creator Hub—expanding the marketplace and unlocking new monetization paths for creators.
            </p>
            <p>
              I've led successful projects across{' '}
              <span className="text-foreground">Brazil, Mozambique, Portugal, and the United States</span>. At SENAI, I created a national digital transformation program and built an AI-powered course recommendation engine. At Voxy, I transformed their publishing platform and introduced continuous discovery practices.
            </p>
            <p>
              My approach centers on{' '}
              <span className="text-foreground">continuous discovery</span>—real customer interactions over personas, opportunity solution trees over feature backlogs, and testing critical assumptions before building.
            </p>
          </div>

          {/* Featured Achievements */}
          <div className="mt-12 grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-border bg-card/30 p-4">
              <p className="text-2xl font-bold text-accent">200%</p>
              <p className="text-sm text-muted">Revenue increase at Unyleya</p>
            </div>
            <div className="rounded-lg border border-border bg-card/30 p-4">
              <p className="text-2xl font-bold text-accent">20TB</p>
              <p className="text-sm text-muted">Storage saved at SENAI</p>
            </div>
            <div className="rounded-lg border border-border bg-card/30 p-4">
              <p className="text-2xl font-bold text-accent">15min</p>
              <p className="text-sm text-muted">Course publish time (from 1 week)</p>
            </div>
            <div className="rounded-lg border border-border bg-card/30 p-4">
              <p className="text-2xl font-bold text-accent">4</p>
              <p className="text-sm text-muted">Countries worked across</p>
            </div>
          </div>
        </section>

        {/* Experience Section */}
        <section id="experience" className="mb-24 scroll-mt-24 lg:mb-36">
          <h3 className="mb-8 text-sm font-semibold uppercase tracking-widest text-accent lg:hidden">
            Experience
          </h3>
          <div className="space-y-12">
            {experiences.map((exp, index) => (
              <div
                key={index}
                className="group relative grid gap-4 pb-1 transition-all sm:grid-cols-8 sm:gap-8"
              >
                <div className="absolute -inset-x-4 -inset-y-4 z-0 hidden rounded-md transition-all group-hover:bg-card/50 group-hover:shadow-[inset_0_1px_0_0_rgba(148,163,184,0.1)] lg:block" />
                <div className="z-10 sm:col-span-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted">
                    {exp.period}
                  </span>
                </div>
                <div className="z-10 sm:col-span-6">
                  <h4 className="font-medium text-foreground group-hover:text-accent transition-colors">
                    {exp.title}
                  </h4>
                  <p className="text-sm text-foreground/80">{exp.company}</p>
                  <p className="text-xs text-muted">{exp.location}</p>
                  <p className="mt-3 text-sm text-muted leading-relaxed">{exp.description}</p>
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

          {/* Skills */}
          <div className="mt-16">
            <h4 className="mb-4 text-sm font-semibold text-foreground">Technical Skills</h4>
            <ul className="flex flex-wrap gap-2">
              {skills.technical.map((skill) => (
                <li
                  key={skill}
                  className="rounded-full border border-border px-3 py-1 text-xs text-muted"
                >
                  {skill}
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-6">
            <h4 className="mb-4 text-sm font-semibold text-foreground">Tools</h4>
            <ul className="flex flex-wrap gap-2">
              {skills.tools.map((skill) => (
                <li
                  key={skill}
                  className="rounded-full border border-border px-3 py-1 text-xs text-muted"
                >
                  {skill}
                </li>
              ))}
            </ul>
          </div>

          <a
            href="/resume.pdf"
            className="mt-12 inline-flex items-center gap-2 text-sm font-semibold text-foreground hover:text-accent transition-colors group"
          >
            View Full Resume
            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </a>
        </section>

        {/* Work Section */}
        <section id="work" className="mb-24 scroll-mt-24 lg:mb-36">
          <h3 className="mb-8 text-sm font-semibold uppercase tracking-widest text-accent lg:hidden">
            Work
          </h3>
          <div className="space-y-12">
            {projects.map((project, index) => (
              <div
                key={index}
                className="group relative grid gap-4 pb-1 transition-all"
              >
                <div className="absolute -inset-x-4 -inset-y-4 z-0 hidden rounded-md transition-all group-hover:bg-card/50 group-hover:shadow-[inset_0_1px_0_0_rgba(148,163,184,0.1)] lg:block" />
                <div className="z-10">
                  <p className="text-xs font-medium text-muted uppercase tracking-wider">{project.company}</p>
                  <h4 className="mt-1 font-medium text-foreground group-hover:text-accent transition-colors">
                    {project.title}
                  </h4>
                  <p className="mt-2 text-sm text-muted leading-relaxed">{project.description}</p>
                  <p className="mt-3 text-sm font-medium text-accent">{project.outcome}</p>
                  <ul className="mt-4 flex flex-wrap gap-2">
                    {project.tags.map((tag) => (
                      <li
                        key={tag}
                        className="rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent"
                      >
                        {tag}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>

          {/* Speaking & Articles */}
          <div className="mt-16">
            <h4 className="mb-6 text-sm font-semibold text-foreground">Speaking & Articles</h4>
            <div className="space-y-4">
              <a
                href="#"
                className="group flex items-center gap-3 text-muted hover:text-foreground transition-colors"
              >
                <ExternalLink className="h-4 w-4 text-accent" />
                <span className="text-sm">Interview about Continuous Discovery — Product Talk</span>
              </a>
              <a
                href="#"
                className="group flex items-center gap-3 text-muted hover:text-foreground transition-colors"
              >
                <ExternalLink className="h-4 w-4 text-accent" />
                <span className="text-sm">Speaker — Google Government and Education Summit 2021</span>
              </a>
              <a
                href="#"
                className="group flex items-center gap-3 text-muted hover:text-foreground transition-colors"
              >
                <ExternalLink className="h-4 w-4 text-accent" />
                <span className="text-sm">Workshop: Lean Startup for Digital Businesses — Menos 30 Fest</span>
              </a>
            </div>
          </div>
        </section>

        {/* Approach Section */}
        <section id="approach" className="mb-24 scroll-mt-24 lg:mb-36">
          <h3 className="mb-8 text-sm font-semibold uppercase tracking-widest text-accent lg:hidden">
            Approach
          </h3>
          <div className="space-y-8">
            <p className="text-muted leading-relaxed">
              My love for product management stems from the joy of solving complex problems and employing creativity to enhance user experiences. The ever-evolving nature of this field keeps me on my toes—staying abreast of industry trends, learning new skills, and adapting to new technologies.
            </p>
            {approachItems.map((item, index) => (
              <div key={index} className="group border-l-2 border-border pl-4 hover:border-accent transition-colors">
                <h4 className="font-medium text-foreground group-hover:text-accent transition-colors">
                  {item.title}
                </h4>
                <p className="mt-2 text-sm text-muted leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>

          {/* Certifications */}
          <div className="mt-16">
            <h4 className="mb-6 text-sm font-semibold text-foreground">Certifications & Training</h4>
            <ul className="space-y-3 text-sm text-muted">
              <li className="flex items-start gap-3">
                <span className="text-accent">—</span>
                <span>Product-led Certification — Pendo + Mind the Product</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-accent">—</span>
                <span>Identifying Hidden Assumptions — Product Talk Academy</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-accent">—</span>
                <span>Strategic Digital Transformation — TDS Company</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-accent">—</span>
                <span>Educational Product Manager — Future Education</span>
              </li>
            </ul>
          </div>
        </section>

        {/* Contact Section */}
        <section id="contact" className="scroll-mt-24">
          <h3 className="mb-8 text-sm font-semibold uppercase tracking-widest text-accent lg:hidden">
            Contact
          </h3>
          <div className="space-y-4 text-muted leading-relaxed">
            <p>
              I'm currently exploring opportunities where I can lead product strategy in{' '}
              <span className="text-foreground">AI-powered products</span>,{' '}
              <span className="text-foreground">digital education</span>, or{' '}
              <span className="text-foreground">creative platforms</span>. If you're building something that requires deep discovery thinking and data-driven execution, I'd love to connect.
            </p>
            <p>
              Based in <span className="text-foreground">Brasília, Brazil</span> but experienced working with global teams across multiple time zones.
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:gap-8">
              <a
                href="mailto:bibstarling@gmail.com"
                className="inline-flex items-center gap-2 text-foreground hover:text-accent transition-colors group"
              >
                <Mail className="h-4 w-4" />
                <span>bibstarling@gmail.com</span>
              </a>
              <a
                href="https://linkedin.com/in/biancastarling"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-foreground hover:text-accent transition-colors group"
              >
                <Linkedin className="h-4 w-4" />
                <span>LinkedIn</span>
                <ArrowUpRight className="h-3 w-3 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </a>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-24 pt-8 border-t border-border">
          <p className="text-xs text-muted">
            Built with Next.js. Design inspired by{' '}
            <a
              href="https://brittanychiang.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground hover:text-accent transition-colors"
            >
              Brittany Chiang
            </a>
            .
          </p>
        </footer>
      </main>
    </div>
  );
}
