import Link from 'next/link';
import { SiteHeader } from '@/components/site-header';
import { ArrowRight } from 'lucide-react';

const impactHighlights = [
  { metric: '3x', description: 'Retention improvement through data-driven discovery' },
  { metric: '40%', description: 'Reduction in time-to-value for new users' },
  { metric: '$2M+', description: 'Revenue impact from strategic product initiatives' },
];

const coreStrengths = [
  { 
    title: 'Discovery', 
    description: 'Continuous discovery practices that surface real user needs and validate solutions before building.' 
  },
  { 
    title: 'Strategy', 
    description: 'Clear product vision backed by market analysis, competitive positioning, and business model thinking.' 
  },
  { 
    title: 'Execution', 
    description: 'Shipping outcomes, not outputs. Cross-functional leadership that moves fast without breaking things.' 
  },
  { 
    title: 'Analytics', 
    description: 'Metrics that matter. Building measurement frameworks that connect product decisions to business impact.' 
  },
  { 
    title: 'AI Products', 
    description: 'Experience building AI-powered features that solve real problems, not technology looking for use cases.' 
  },
];

const selectedWork = [
  {
    title: 'Retention Engine',
    company: 'Series B SaaS',
    description: 'Led discovery and execution of a retention system that reduced churn by 35% in 6 months.',
    tags: ['Discovery', 'Analytics', 'Retention'],
  },
  {
    title: 'AI Writing Assistant',
    company: 'Consumer Product',
    description: 'Shipped an AI-powered feature from 0-1 that drove 40% of new user activation within 3 months.',
    tags: ['AI/ML', 'Growth', '0-1'],
  },
  {
    title: 'Enterprise Onboarding',
    company: 'B2B Platform',
    description: 'Redesigned onboarding flow resulting in 60% improvement in time-to-first-value for enterprise accounts.',
    tags: ['B2B', 'Onboarding', 'Research'],
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      
      <main className="pt-16">
        {/* Hero Section */}
        <section className="mx-auto max-w-6xl px-6 py-24 lg:py-32">
          <div className="max-w-3xl">
            <p className="mb-4 text-sm font-medium uppercase tracking-wider text-accent">
              Senior Product Manager
            </p>
            <h1 className="mb-6 text-4xl font-bold leading-tight text-foreground lg:text-5xl text-balance">
              Building products that drive discovery, retention, and measurable outcomes.
            </h1>
            <p className="mb-8 text-lg text-muted leading-relaxed">
              I help teams move from assumptions to evidence, shipping products that users love and businesses can measure. 
              Focused on continuous discovery, AI-powered experiences, and growth that compounds.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/work"
                className="inline-flex items-center gap-2 rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground transition-opacity hover:opacity-90"
              >
                View Work
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-lg border border-border px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-card"
              >
                Resume
              </Link>
            </div>
          </div>
        </section>

        {/* Impact Highlights */}
        <section className="border-y border-border bg-card/50">
          <div className="mx-auto max-w-6xl px-6 py-16">
            <div className="grid gap-8 md:grid-cols-3">
              {impactHighlights.map((item, index) => (
                <div key={index} className="text-center md:text-left">
                  <p className="mb-2 text-4xl font-bold text-accent">{item.metric}</p>
                  <p className="text-sm text-muted">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Core Strengths */}
        <section className="mx-auto max-w-6xl px-6 py-24">
          <h2 className="mb-12 text-2xl font-bold text-foreground">Core Strengths</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {coreStrengths.map((strength, index) => (
              <div
                key={index}
                className="rounded-lg border border-border bg-card p-6 transition-colors hover:border-accent/50"
              >
                <h3 className="mb-2 text-lg font-semibold text-foreground">{strength.title}</h3>
                <p className="text-sm text-muted leading-relaxed">{strength.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Selected Work */}
        <section className="border-t border-border bg-card/30">
          <div className="mx-auto max-w-6xl px-6 py-24">
            <div className="mb-12 flex items-end justify-between">
              <h2 className="text-2xl font-bold text-foreground">Selected Work</h2>
              <Link
                href="/work"
                className="text-sm text-accent hover:underline"
              >
                View all case studies
              </Link>
            </div>
            <div className="grid gap-8 lg:grid-cols-3">
              {selectedWork.map((work, index) => (
                <Link
                  key={index}
                  href="/work"
                  className="group rounded-lg border border-border bg-card p-6 transition-all hover:border-accent/50 hover:bg-card/80"
                >
                  <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {work.company}
                  </p>
                  <h3 className="mb-3 text-lg font-semibold text-foreground group-hover:text-accent transition-colors">
                    {work.title}
                  </h3>
                  <p className="mb-4 text-sm text-muted leading-relaxed">{work.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {work.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-background px-3 py-1 text-xs text-muted"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-border">
          <div className="mx-auto max-w-6xl px-6 py-12">
            <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
              <p className="text-sm text-muted">
                {new Date().getFullYear()} Bianca Starling. Built with intention.
              </p>
              <div className="flex gap-6">
                <a
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted hover:text-foreground transition-colors"
                >
                  LinkedIn
                </a>
                <a
                  href="mailto:hello@biancastarling.com"
                  className="text-sm text-muted hover:text-foreground transition-colors"
                >
                  Email
                </a>
              </div>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
