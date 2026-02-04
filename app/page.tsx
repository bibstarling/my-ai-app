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
    title: 'Lead Product Manager',
    subtitle: 'Senior Product Manager → Lead Product Manager (Nov 2025)',
    company: 'Skillshare',
    location: 'New York, USA (Remote)',
    description: 'Promoted to Lead PM in Nov 2025. Driving company-wide AI strategy and designing multi-agent MCP to connect platform data with external AI tools. Delivered 25% increase in daily engagement through Creative Feed and Follow Suggestions. Led marketplace expansion with 1-1 sessions and digital products. Introduced headless CMS and Builder.io framework.',
    skills: ['AI Strategy', 'MCP', 'Community Growth', 'Marketplace', 'CMS', 'Team Leadership'],
    highlights: ['Curiosity Award Q2 2024', 'Agility Award Q1 2025'],
  },
  {
    period: 'Mar 2022 — Mar 2024',
    title: 'Senior Product Manager',
    company: 'Voxy',
    location: 'New York, USA (Remote)',
    description: 'Led full rebuild of publishing platform, enabling multilingual course authoring. Introduced structured user-testing practices and continuous discovery cycles. Directed unified design system creation, cutting design-to-development time. Oversaw platform integration following acquisition.',
    skills: ['Publishing Platform', 'Design Systems', 'Continuous Discovery', 'Integration'],
    highlights: ['Impressive Performance Award Jan 2023'],
  },
  {
    period: 'May 2020 — Mar 2022',
    title: 'EdTech Product Manager',
    company: 'SENAI National Department',
    location: 'Brasília, Brazil',
    description: 'Led nationwide digital transformation initiative across 500+ schools, securing multimillion-dollar funding. Built ML-based course recommendation platform with Google and Atos. Created centralized learning resources repository and AR-based industrial machinery app.',
    skills: ['Digital Transformation', 'ML/AI', 'AR', 'Government'],
    highlights: ['Google Summit Speaker 2021'],
  },
  {
    period: 'Apr 2018 — May 2020',
    title: 'Product Manager',
    company: 'Unyleya Educacional',
    location: 'Brasília, Brazil',
    description: 'Designed custom CMS reducing course publishing from 1 week to 31 minutes, driving 200% revenue increase. Led development of streaming-inspired student platform and native mobile apps.',
    skills: ['CMS', 'Mobile Apps', 'Revenue Growth', 'UX'],
    highlights: [],
  },
];

const projects = [
  {
    title: 'AI Strategy & Multi-Agent MCP',
    company: 'Skillshare',
    description: 'Shaping company-wide AI strategy and overseeing design of multi-agent Model Context Protocol to connect platform data with external AI tools like ChatGPT and Gemini—laying groundwork for intelligent discovery and user support.',
    outcome: 'Foundation for AI-powered experiences',
    tags: ['AI Strategy', 'MCP', 'LLM Integration'],
  },
  {
    title: 'Community Feed & Engagement',
    company: 'Skillshare',
    description: 'Delivered Creative Feed and Follow Suggestions, expanding member posting to all users and deepening peer-to-peer interactions across the platform.',
    outcome: '25% increase in daily engagement',
    tags: ['Community', 'Engagement', 'Social'],
  },
  {
    title: 'Creator Hub & Digital Marketplace',
    company: 'Skillshare',
    description: 'Led integration of 1-1 sessions and digital product offerings, enabling creators to monetize beyond classes and diversifying revenue streams.',
    outcome: 'New creator monetization paths',
    tags: ['Marketplace', 'Creator Tools', 'Monetization'],
  },
  {
    title: 'Continuous Discovery Framework',
    company: 'Skillshare / Voxy',
    description: 'Implemented Continuous Discovery Habits framework across product squads. Established consistent cadence of user interviews and opportunity mapping. Leveraged AI to accelerate qualitative analysis.',
    outcome: '50% faster discovery-to-decision cycle',
    tags: ['Discovery', 'Research', 'AI-Assisted'],
  },
  {
    title: 'SENAI Skills GAP AI Engine',
    company: 'SENAI',
    description: 'Built machine learning-based recommendation platform in partnership with Google and Atos to match student profiles with courses and job opportunities.',
    outcome: 'Enhanced job-aligned learning outcomes',
    tags: ['ML', 'Recommendation', 'EdTech'],
  },
];

const approachItems = [
  {
    title: 'Customer-Centric Discovery',
    description: 'I build products users naturally gravitate towards. Using continuous discovery, I focus on real customer interactions—not personas—for more inclusive solutions that drive genuine engagement.',
  },
  {
    title: 'AI-Accelerated Insights',
    description: 'I leverage AI to synthesize qualitative and quantitative data, cutting the discovery-to-decision cycle in half. This means faster validation and more confident product bets.',
  },
  {
    title: 'The Product Trio',
    description: 'PM, designer, and engineer working together to assess desirability, viability, and feasibility. We use opportunity solution trees to link customer needs directly to business metrics.',
  },
  {
    title: 'Test Assumptions Fast',
    description: 'Map and test critical assumptions using compare-and-contrast methodology—generating multiple solutions to find the most impactful one before committing resources.',
  },
];

const skills = {
  strategy: ['AI Strategy & Integrations', 'Product Vision & Roadmapping', 'Marketplace Growth', 'Go-to-Market', 'Experimentation Culture'],
  discovery: ['Continuous Discovery Habits', 'User Research & Testing', 'Opportunity Mapping', 'Problem Framing', 'Journey Mapping'],
  technical: ['Multi-Agent Systems (MCP)', 'LLM Integrations', 'Recommendation Systems', 'API Design', 'SQL', 'A/B Testing'],
  tools: ['Productboard', 'Pendo', 'Mixpanel', 'Maze', 'Builder.io', 'Figma', 'Jira', 'Tableau'],
};

const achievements = [
  {
    title: 'Keynote Speaker, Product Insights Summit',
    date: 'Oct 2025',
    description: '"Closing the Gap Between Qualitative and Quantitative Insights with AI"',
    link: '#',
  },
  {
    title: 'Interview Feature, Product Talk',
    date: 'Jun 2023',
    description: '"One Product Manager\'s Quest to Adopt Continuous Discovery"',
    link: 'https://www.producttalk.org/2023/06/bianca-starling/',
  },
  {
    title: 'Speaker, Google Government & Education Summit',
    date: 'Nov 2021',
    description: '"Revolutionizing Education with Cloud Technology"',
    link: '#',
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
    <div className="min-h-screen bg-white lg:flex">
      {/* Left Sidebar - Sticky on Desktop */}
      <header className="lg:fixed lg:top-0 lg:left-0 lg:flex lg:h-screen lg:w-1/2 lg:flex-col lg:justify-between lg:py-24 lg:px-24 px-6 py-16">
        <div>
          <h1 className="text-4xl font-bold text-foreground lg:text-5xl tracking-tight">
            Bianca Starling
          </h1>
          <h2 className="mt-3 text-xl font-medium text-foreground/90 lg:text-2xl">
            Lead Product Manager
          </h2>
          <p className="mt-4 max-w-xs text-muted leading-relaxed">
            Building community-driven EdTech products and AI-powered experiences. Based in Brasília, working globally.
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
              <span className="text-foreground">community-driven EdTech products</span>,{' '}
              <span className="text-foreground">AI strategy</span>, and{' '}
              <span className="text-foreground">marketplace expansion</span>. I use data, user insights, and continuous discovery to drive engagement, retention, and revenue growth.
            </p>
            <p>
              At <span className="text-foreground">Skillshare</span>, I'm shaping the company-wide AI strategy and overseeing the design of a multi-agent Model Context Protocol (MCP) to connect platform data with external AI tools. I've delivered a 25% increase in daily engagement through community features and expanded creator monetization through digital products.
            </p>
            <p>
              Previously, I led transformative projects at <span className="text-foreground">Voxy</span> (publishing platform modernization), <span className="text-foreground">SENAI</span> (national digital transformation across 500+ schools), and <span className="text-foreground">Unyleya</span> (200% revenue growth through CMS innovation).
            </p>
            <p>
              My approach centers on{' '}
              <span className="text-foreground">continuous discovery</span>—real customer interactions over personas, opportunity solution trees over feature backlogs, and leveraging AI to accelerate qualitative analysis.
            </p>
          </div>

          {/* Featured Achievements */}
          <div className="mt-12 grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-border bg-card/30 p-4">
              <p className="text-2xl font-bold text-accent">25%</p>
              <p className="text-sm text-muted">Daily engagement increase</p>
            </div>
            <div className="rounded-lg border border-border bg-card/30 p-4">
              <p className="text-2xl font-bold text-accent">50%</p>
              <p className="text-sm text-muted">Faster discovery-to-decision</p>
            </div>
            <div className="rounded-lg border border-border bg-card/30 p-4">
              <p className="text-2xl font-bold text-accent">200%</p>
              <p className="text-sm text-muted">Revenue increase at Unyleya</p>
            </div>
            <div className="rounded-lg border border-border bg-card/30 p-4">
              <p className="text-2xl font-bold text-accent">500+</p>
              <p className="text-sm text-muted">Schools transformed at SENAI</p>
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
                  {exp.subtitle && (
                    <p className="text-xs text-accent mt-0.5">{exp.subtitle}</p>
                  )}
                  <p className="text-sm text-foreground/80">{exp.company}</p>
                  <p className="text-xs text-muted">{exp.location}</p>
                  <p className="mt-3 text-sm text-muted leading-relaxed">{exp.description}</p>
                  {exp.highlights && exp.highlights.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {exp.highlights.map((highlight) => (
                        <span
                          key={highlight}
                          className="text-xs font-medium text-accent"
                        >
                          {highlight}
                        </span>
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

          {/* Skills */}
          <div className="mt-16 space-y-6">
            <div>
              <h4 className="mb-4 text-sm font-semibold text-foreground">Strategy & Leadership</h4>
              <ul className="flex flex-wrap gap-2">
                {skills.strategy.map((skill) => (
                  <li
                    key={skill}
                    className="rounded-full border border-border px-3 py-1 text-xs text-muted"
                  >
                    {skill}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="mb-4 text-sm font-semibold text-foreground">Discovery & Research</h4>
              <ul className="flex flex-wrap gap-2">
                {skills.discovery.map((skill) => (
                  <li
                    key={skill}
                    className="rounded-full border border-border px-3 py-1 text-xs text-muted"
                  >
                    {skill}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="mb-4 text-sm font-semibold text-foreground">AI & Technical</h4>
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
            <div>
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

          {/* Speaking & Recognition */}
          <div className="mt-16">
            <h4 className="mb-6 text-sm font-semibold text-foreground">Speaking & Recognition</h4>
            <div className="space-y-4">
              {achievements.map((achievement, index) => (
                <a
                  key={index}
                  href={achievement.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-start gap-3 text-muted hover:text-foreground transition-colors"
                >
                  <ExternalLink className="h-4 w-4 mt-0.5 text-accent shrink-0" />
                  <div>
                    <span className="text-sm font-medium text-foreground group-hover:text-accent transition-colors">
                      {achievement.title}
                    </span>
                    <span className="text-xs text-muted ml-2">{achievement.date}</span>
                    <p className="text-xs text-muted mt-0.5">{achievement.description}</p>
                  </div>
                </a>
              ))}
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
              My love for product management stems from the joy of solving complex problems and employing creativity to enhance user experiences. I build a culture of data-informed decision-making and experimentation, improving delivery velocity and user satisfaction.
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
            <h4 className="mb-6 text-sm font-semibold text-foreground">Certifications</h4>
            <ul className="space-y-3 text-sm text-muted">
              <li className="flex items-start gap-3">
                <span className="text-accent">—</span>
                <span>Product-led Certification — Pendo & Mind the Product</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-accent">—</span>
                <span>Identifying Hidden Assumptions — Product Talk Academy</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-accent">—</span>
                <span>Educational Product Manager — Future Education</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-accent">—</span>
                <span>Strategic Digital Transformation — TDS Company</span>
              </li>
            </ul>
          </div>

          {/* Education */}
          <div className="mt-12">
            <h4 className="mb-6 text-sm font-semibold text-foreground">Education</h4>
            <ul className="space-y-3 text-sm text-muted">
              <li className="flex items-start gap-3">
                <span className="text-accent">—</span>
                <span>Specialization in Visual Arts — SENAC, 2012</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-accent">—</span>
                <span>Bachelor in Product Design & Graphic Design — University of Brasília, 2011</span>
              </li>
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
                href="mailto:bibstarling@gmail.com"
                className="group inline-flex items-center gap-3 text-foreground hover:text-accent transition-colors"
              >
                <Mail className="h-5 w-5" />
                <span>bibstarling@gmail.com</span>
                <ArrowUpRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </a>
              <a
                href="https://linkedin.com/in/biancastarling"
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
              Based in Brasília, Brazil — Available for remote work globally.
            </p>
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-24 pt-8 border-t border-border">
          <p className="text-xs text-muted">
            Built with Next.js and Tailwind CSS. Design inspired by{' '}
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
