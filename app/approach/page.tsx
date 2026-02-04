import { SiteHeader } from '@/components/site-header';

const philosophyPoints = [
  {
    title: 'Outcomes over outputs',
    description: 'Shipping features is easy. Shipping outcomes is hard. I measure success by the problems we solve and the metrics we move, not the roadmap items we check off.',
  },
  {
    title: 'Evidence over intuition',
    description: 'Good product sense is built on a foundation of evidence. Every major decision should be traceable to user research, data analysis, or validated experiments.',
  },
  {
    title: 'Speed with intention',
    description: 'Fast iteration matters, but not at the cost of learning. I optimize for speed of learning, not just speed of shipping.',
  },
  {
    title: 'Clarity beats complexity',
    description: 'The best product strategy fits on one page. If it requires a 50-slide deck to explain, it probably needs more work.',
  },
];

const discoveryApproach = [
  {
    step: '01',
    title: 'Framing',
    description: 'Define the problem space clearly. What do we know? What do we assume? What would change our minds?',
  },
  {
    step: '02',
    title: 'Research',
    description: 'Mix of qualitative and quantitative. User interviews, session recordings, funnel analysis, cohort comparisons.',
  },
  {
    step: '03',
    title: 'Synthesis',
    description: 'Pattern recognition across data sources. Building mental models of user behavior and system dynamics.',
  },
  {
    step: '04',
    title: 'Validation',
    description: 'Testing hypotheses before building. Prototypes, fake doors, wizard of oz, and rapid experiments.',
  },
];

const collaborationPrinciples = [
  {
    title: 'With Engineering',
    points: [
      'Early involvement in discovery, not just delivery',
      'Technical context shapes product decisions',
      'Joint ownership of outcomes, not just specifications',
      'Trade-off discussions are collaborative, not adversarial',
    ],
  },
  {
    title: 'With Design',
    points: [
      'Research as a shared practice, not a handoff',
      'Design thinking applied to strategy, not just UI',
      'Rapid iteration over perfect mockups',
      'User advocacy is everyone\'s job',
    ],
  },
  {
    title: 'With Stakeholders',
    points: [
      'Transparent about trade-offs and constraints',
      'Data-driven storytelling over opinion debates',
      'Regular updates with clear next steps',
      'Alignment on outcomes before solutions',
    ],
  },
];

const metricsFramework = [
  {
    category: 'North Star',
    description: 'The single metric that best captures customer value delivered. Everything else ladders up.',
    examples: 'Weekly active users completing core action, Revenue per active customer',
  },
  {
    category: 'Input Metrics',
    description: 'Leading indicators we can directly influence. Changes here should move the north star.',
    examples: 'Activation rate, Feature adoption, Time-to-value',
  },
  {
    category: 'Health Metrics',
    description: 'Guardrails that ensure we\'re not trading short-term wins for long-term problems.',
    examples: 'Customer satisfaction, Technical debt, Support volume',
  },
];

export default function ApproachPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      
      <main className="pt-16">
        {/* Header */}
        <section className="mx-auto max-w-6xl px-6 py-24">
          <div className="max-w-3xl">
            <h1 className="mb-6 text-4xl font-bold text-foreground lg:text-5xl">
              Skills & Approach
            </h1>
            <p className="text-lg text-muted leading-relaxed">
              How I think about product management: the frameworks, principles, and practices 
              that guide my work. This is less about what I do, and more about how and why.
            </p>
          </div>
        </section>

        {/* Product Philosophy */}
        <section className="border-t border-border">
          <div className="mx-auto max-w-6xl px-6 py-24">
            <h2 className="mb-12 text-2xl font-bold text-foreground">Product Philosophy</h2>
            <div className="grid gap-8 md:grid-cols-2">
              {philosophyPoints.map((point, index) => (
                <div key={index} className="border-l-2 border-accent pl-6">
                  <h3 className="mb-2 text-lg font-semibold text-foreground">{point.title}</h3>
                  <p className="text-muted leading-relaxed">{point.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Discovery Process */}
        <section className="border-t border-border bg-card/30">
          <div className="mx-auto max-w-6xl px-6 py-24">
            <h2 className="mb-4 text-2xl font-bold text-foreground">Discovery & Decision-Making</h2>
            <p className="mb-12 max-w-2xl text-muted leading-relaxed">
              Continuous discovery isn't a phase—it's a practice. Here's how I approach moving from 
              uncertainty to confidence, without falling into analysis paralysis.
            </p>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {discoveryApproach.map((item) => (
                <div key={item.step} className="rounded-lg border border-border bg-card p-6">
                  <span className="mb-4 block text-3xl font-bold text-accent">{item.step}</span>
                  <h3 className="mb-2 text-lg font-semibold text-foreground">{item.title}</h3>
                  <p className="text-sm text-muted leading-relaxed">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Metrics Framework */}
        <section className="border-t border-border">
          <div className="mx-auto max-w-6xl px-6 py-24">
            <h2 className="mb-4 text-2xl font-bold text-foreground">Metrics & Analytics</h2>
            <p className="mb-12 max-w-2xl text-muted leading-relaxed">
              Not everything that counts can be counted, but a lot of it can. Here's how I think 
              about building measurement systems that actually drive decisions.
            </p>
            <div className="space-y-6">
              {metricsFramework.map((item, index) => (
                <div
                  key={index}
                  className="grid gap-4 rounded-lg border border-border bg-card p-6 md:grid-cols-3"
                >
                  <div>
                    <h3 className="mb-2 text-lg font-semibold text-accent">{item.category}</h3>
                  </div>
                  <div>
                    <p className="text-muted leading-relaxed">{item.description}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground italic">{item.examples}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Collaboration Model */}
        <section className="border-t border-border bg-card/30">
          <div className="mx-auto max-w-6xl px-6 py-24">
            <h2 className="mb-4 text-2xl font-bold text-foreground">Collaboration Model</h2>
            <p className="mb-12 max-w-2xl text-muted leading-relaxed">
              Product management is fundamentally a team sport. Here's how I think about 
              working with the people who actually build and sell the product.
            </p>
            <div className="grid gap-8 lg:grid-cols-3">
              {collaborationPrinciples.map((group) => (
                <div key={group.title} className="rounded-lg border border-border bg-card p-6">
                  <h3 className="mb-4 text-lg font-semibold text-foreground">{group.title}</h3>
                  <ul className="space-y-3">
                    {group.points.map((point, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-accent" />
                        <span className="text-sm text-muted">{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Speed vs Quality */}
        <section className="border-t border-border">
          <div className="mx-auto max-w-6xl px-6 py-24">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="mb-6 text-2xl font-bold text-foreground">On Speed vs Quality</h2>
              <blockquote className="mb-8 text-xl text-muted leading-relaxed italic">
                {"\"The goal isn't to ship fast or ship well. It's to learn fast and ship well enough. "}
                {"Speed matters when it accelerates learning. Quality matters when it affects outcomes. "}
                {"The art is knowing which one you're optimizing for at any given moment.\""}
              </blockquote>
              <p className="text-sm text-muted-foreground">
                — A principle I try to live by, even when it's hard
              </p>
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
