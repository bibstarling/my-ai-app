'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowUpRight, Github, Linkedin, Mail, FileText } from 'lucide-react';

const navItems = [
  { id: 'about', label: 'About' },
  { id: 'experience', label: 'Experience' },
  { id: 'work', label: 'Work' },
  { id: 'approach', label: 'Approach' },
  { id: 'contact', label: 'Contact' },
];

const experiences = [
  {
    period: '2022 — Present',
    title: 'Senior Product Manager',
    company: 'Series B SaaS',
    description: 'Leading product strategy for the core platform, driving discovery practices that reduced churn by 35%. Shipped AI-powered features that increased user activation by 40%.',
    skills: ['Product Strategy', 'AI/ML', 'Discovery', 'Analytics'],
  },
  {
    period: '2020 — 2022',
    title: 'Product Manager',
    company: 'Growth Stage Startup',
    description: 'Owned the retention and engagement portfolio. Built measurement frameworks connecting product decisions to $2M+ revenue impact.',
    skills: ['Retention', 'Growth', 'Data Analysis', 'User Research'],
  },
  {
    period: '2018 — 2020',
    title: 'Associate Product Manager',
    company: 'Enterprise Platform',
    description: 'Led enterprise onboarding redesign resulting in 60% improvement in time-to-first-value. Collaborated with 3 engineering teams.',
    skills: ['B2B', 'Onboarding', 'Cross-functional'],
  },
];

const projects = [
  {
    title: 'Retention Engine',
    description: 'Led discovery and execution of a retention system that identified at-risk users through behavioral signals and automated personalized interventions.',
    outcome: 'Reduced churn by 35% in 6 months',
    tags: ['Discovery', 'Analytics', 'Retention'],
  },
  {
    title: 'AI Writing Assistant',
    description: 'Shipped an AI-powered feature from 0-1 that helps users draft content 3x faster. Designed the UX to build trust in AI suggestions.',
    outcome: 'Drove 40% of new user activation',
    tags: ['AI/ML', 'Growth', '0-1'],
  },
  {
    title: 'Enterprise Onboarding',
    description: 'Redesigned the onboarding experience for enterprise accounts through extensive user research and iterative prototyping.',
    outcome: '60% faster time-to-first-value',
    tags: ['B2B', 'Research', 'Design'],
  },
];

const approachItems = [
  {
    title: 'Start with Problems',
    description: 'Every solution begins with deeply understanding the problem. I use continuous discovery to validate assumptions before building.',
  },
  {
    title: 'Measure What Matters',
    description: 'Metrics should drive decisions, not vanity. I build measurement frameworks that connect product decisions to business outcomes.',
  },
  {
    title: 'Ship to Learn',
    description: 'Perfect is the enemy of good. I believe in shipping early, learning fast, and iterating based on real user feedback.',
  },
  {
    title: 'Cross-functional by Default',
    description: 'Great products come from great teams. I build strong relationships with engineering, design, and business stakeholders.',
  },
];

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
          <h1 className="text-4xl font-bold text-foreground lg:text-5xl">
            Bianca Starling
          </h1>
          <h2 className="mt-3 text-xl font-medium text-foreground lg:text-2xl">
            Senior Product Manager
          </h2>
          <p className="mt-4 max-w-xs text-muted leading-relaxed">
            I build products that users love and businesses can measure.
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
                          ? 'w-16 bg-foreground'
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
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub"
            className="text-muted hover:text-accent transition-colors"
          >
            <Github className="h-5 w-5" />
          </a>
          <a
            href="https://linkedin.com"
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
            className="text-muted hover:text-accent transition-colors"
            aria-label="Assistant"
          >
            <FileText className="h-5 w-5" />
          </Link>
        </div>
      </header>

      {/* Right Content - Scrollable */}
      <main className="lg:ml-[50%] lg:w-1/2 lg:py-24 lg:px-24 px-6 pb-24">
        {/* About Section */}
        <section id="about" className="mb-24 scroll-mt-24 lg:mb-36">
          <h3 className="mb-8 text-sm font-semibold uppercase tracking-widest text-foreground lg:hidden">
            About
          </h3>
          <div className="space-y-4 text-muted leading-relaxed">
            <p>
              I'm a product manager focused on building software that drives{' '}
              <span className="text-foreground">discovery</span>,{' '}
              <span className="text-foreground">retention</span>, and{' '}
              <span className="text-foreground">measurable outcomes</span>. My approach combines
              rigorous user research with data-driven decision making.
            </p>
            <p>
              Currently, I lead product strategy at a{' '}
              <span className="text-foreground">Series B SaaS company</span>, where I've shipped
              AI-powered features that drove 40% of new user activation and built retention systems
              that reduced churn by 35%.
            </p>
            <p>
              I believe the best products come from teams that{' '}
              <span className="text-foreground">start with problems, not solutions</span>. I use
              continuous discovery practices to validate assumptions before building, and I'm
              obsessed with connecting product decisions to business impact.
            </p>
            <p>
              When I'm not obsessing over user interviews or A/B test results, you'll find me
              exploring new AI tools, reading about behavioral psychology, or debugging why that
              one metric moved.
            </p>
          </div>
        </section>

        {/* Experience Section */}
        <section id="experience" className="mb-24 scroll-mt-24 lg:mb-36">
          <h3 className="mb-8 text-sm font-semibold uppercase tracking-widest text-foreground lg:hidden">
            Experience
          </h3>
          <div className="space-y-12">
            {experiences.map((exp, index) => (
              <div
                key={index}
                className="group relative grid gap-4 pb-1 transition-all sm:grid-cols-8 sm:gap-8"
              >
                <div className="absolute -inset-x-4 -inset-y-4 z-0 hidden rounded-md transition-all group-hover:bg-card/50 group-hover:shadow-[inset_0_1px_0_0_rgba(148,163,184,0.1)] lg:block" />
                <span className="z-10 text-xs font-semibold uppercase tracking-wide text-muted sm:col-span-2">
                  {exp.period}
                </span>
                <div className="z-10 sm:col-span-6">
                  <h4 className="font-medium text-foreground group-hover:text-accent transition-colors">
                    {exp.title} · {exp.company}
                  </h4>
                  <p className="mt-2 text-sm text-muted leading-relaxed">{exp.description}</p>
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
          <h3 className="mb-8 text-sm font-semibold uppercase tracking-widest text-foreground lg:hidden">
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
                  <h4 className="font-medium text-foreground group-hover:text-accent transition-colors">
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
        </section>

        {/* Approach Section */}
        <section id="approach" className="mb-24 scroll-mt-24 lg:mb-36">
          <h3 className="mb-8 text-sm font-semibold uppercase tracking-widest text-foreground lg:hidden">
            Approach
          </h3>
          <div className="space-y-8">
            {approachItems.map((item, index) => (
              <div key={index} className="group">
                <h4 className="font-medium text-foreground group-hover:text-accent transition-colors">
                  {item.title}
                </h4>
                <p className="mt-2 text-sm text-muted leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Contact Section */}
        <section id="contact" className="scroll-mt-24">
          <h3 className="mb-8 text-sm font-semibold uppercase tracking-widest text-foreground lg:hidden">
            Contact
          </h3>
          <div className="space-y-4 text-muted leading-relaxed">
            <p>
              I'm currently exploring new opportunities where I can lead product strategy and drive
              meaningful outcomes. If you're building something interesting and need a PM who's
              obsessed with discovery and data, I'd love to chat.
            </p>
            <p>
              The best way to reach me is via{' '}
              <a
                href="mailto:bibstarling@gmail.com"
                className="text-foreground hover:text-accent transition-colors"
              >
                email
              </a>{' '}
              or{' '}
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground hover:text-accent transition-colors"
              >
                LinkedIn
              </a>
              .
            </p>
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-24 pt-8 border-t border-border">
          <p className="text-xs text-muted">
            Designed and built with care. Loosely inspired by{' '}
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
