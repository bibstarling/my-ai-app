import { SiteHeader } from '@/components/site-header';
import { ArrowUpRight } from 'lucide-react';

const caseStudies = [
  {
    id: 'retention-engine',
    title: 'Retention Engine',
    company: 'Series B SaaS',
    problem: 'High churn rates among power users who were dropping off after the first 90 days, despite strong initial engagement.',
    approach: 'Led a 12-week continuous discovery initiative combining quantitative cohort analysis with 40+ user interviews to identify key churn signals and retention levers.',
    execution: 'Built a proactive engagement system that surfaced personalized recommendations based on usage patterns, integrated with email and in-app messaging.',
    outcomes: [
      '35% reduction in 90-day churn',
      'NPS improvement from 42 to 58',
      '$1.2M annual revenue impact',
    ],
    learnings: 'Early signals of disengagement were visible in the data weeks before churn, but required combining behavioral and survey data to be actionable.',
    tags: ['Discovery', 'Analytics', 'Retention', 'B2B SaaS'],
  },
  {
    id: 'ai-writing-assistant',
    title: 'AI Writing Assistant',
    company: 'Consumer Product',
    problem: 'New users were struggling to get started with the product, leading to low activation rates and poor day-1 retention.',
    approach: 'Conducted rapid prototyping and usability testing with 25 users to understand where the blank page problem was most acute.',
    execution: 'Designed and shipped an AI-powered writing assistant that provided contextual suggestions, templates, and real-time feedback to help users create their first document.',
    outcomes: [
      '40% increase in day-1 activation',
      '2.5x improvement in documents created per user',
      'Feature adopted by 70% of new users within first session',
    ],
    learnings: 'AI features work best when they augment user intent rather than replace it. The assistant succeeded by making users feel more capable, not dependent.',
    tags: ['AI/ML', 'Growth', '0-1', 'Consumer'],
  },
  {
    id: 'enterprise-onboarding',
    title: 'Enterprise Onboarding',
    company: 'B2B Platform',
    problem: 'Enterprise accounts were taking 6+ weeks to reach time-to-first-value, causing implementation fatigue and early contract churn.',
    approach: 'Mapped the end-to-end onboarding journey for 15 enterprise accounts, identifying bottlenecks through stakeholder interviews and session recordings.',
    execution: 'Redesigned the onboarding flow with guided setup, role-based paths, and a success metrics dashboard that aligned customer and internal team goals.',
    outcomes: [
      '60% reduction in time-to-first-value',
      '45% decrease in support tickets during onboarding',
      '25% improvement in enterprise expansion revenue',
    ],
    learnings: 'Enterprise onboarding is a team sport. Success required aligning product, CS, and sales on shared milestones and clear handoff points.',
    tags: ['B2B', 'Onboarding', 'Research', 'Enterprise'],
  },
];

export default function WorkPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      
      <main className="pt-16">
        {/* Header */}
        <section className="mx-auto max-w-6xl px-6 py-24">
          <div className="max-w-3xl">
            <h1 className="mb-6 text-4xl font-bold text-foreground lg:text-5xl">
              Work & Case Studies
            </h1>
            <p className="text-lg text-muted leading-relaxed">
              Deeper case studies that show how I think about problems, navigate constraints, and drive outcomes. 
              Each follows a consistent structure: context, problem framing, approach, execution, and learnings.
            </p>
          </div>
        </section>

        {/* Case Studies */}
        <section className="border-t border-border">
          <div className="mx-auto max-w-6xl px-6">
            {caseStudies.map((study, index) => (
              <article
                key={study.id}
                id={study.id}
                className={`py-16 ${index !== caseStudies.length - 1 ? 'border-b border-border' : ''}`}
              >
                <div className="mb-8">
                  <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {study.company}
                  </p>
                  <h2 className="mb-4 text-3xl font-bold text-foreground">{study.title}</h2>
                  <div className="flex flex-wrap gap-2">
                    {study.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-border bg-card px-3 py-1 text-xs text-muted"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="grid gap-8 lg:grid-cols-2">
                  <div className="space-y-8">
                    <div>
                      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-accent">
                        <span className="h-px w-4 bg-accent" />
                        Problem
                      </h3>
                      <p className="text-muted leading-relaxed">{study.problem}</p>
                    </div>

                    <div>
                      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-accent">
                        <span className="h-px w-4 bg-accent" />
                        Approach
                      </h3>
                      <p className="text-muted leading-relaxed">{study.approach}</p>
                    </div>

                    <div>
                      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-accent">
                        <span className="h-px w-4 bg-accent" />
                        Execution
                      </h3>
                      <p className="text-muted leading-relaxed">{study.execution}</p>
                    </div>
                  </div>

                  <div className="space-y-8">
                    <div className="rounded-lg border border-border bg-card p-6">
                      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-foreground">
                        Outcomes
                      </h3>
                      <ul className="space-y-3">
                        {study.outcomes.map((outcome, i) => (
                          <li key={i} className="flex items-start gap-3">
                            <ArrowUpRight className="mt-0.5 h-4 w-4 flex-shrink-0 text-accent" />
                            <span className="text-foreground">{outcome}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="rounded-lg border border-accent/30 bg-accent/5 p-6">
                      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-accent">
                        {"What I'd do differently"}
                      </h3>
                      <p className="text-sm text-muted leading-relaxed">{study.learnings}</p>
                    </div>
                  </div>
                </div>
              </article>
            ))}
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
