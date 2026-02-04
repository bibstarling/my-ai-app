import { SiteHeader } from '@/components/site-header';
import { Download, Mail, Linkedin, FileText } from 'lucide-react';

const experience = [
  {
    role: 'Senior Product Manager',
    company: 'Series B SaaS Company',
    period: '2022 — Present',
    highlights: [
      'Led retention and growth initiatives, reducing churn by 35%',
      'Built AI-powered features driving 40% of new user activation',
      'Managed cross-functional team of 8 engineers and 2 designers',
    ],
  },
  {
    role: 'Product Manager',
    company: 'B2B Platform',
    period: '2019 — 2022',
    highlights: [
      'Owned enterprise onboarding, reducing time-to-value by 60%',
      'Launched self-serve tier generating $500K ARR in first year',
      'Established continuous discovery practice across product org',
    ],
  },
  {
    role: 'Associate Product Manager',
    company: 'Consumer Tech Startup',
    period: '2017 — 2019',
    highlights: [
      'Shipped core product features used by 100K+ monthly users',
      'Led mobile app redesign improving NPS by 20 points',
      'Built analytics infrastructure for product experimentation',
    ],
  },
];

const skills = {
  core: ['Product Strategy', 'Continuous Discovery', 'Data Analysis', 'User Research', 'A/B Testing', 'Roadmap Planning'],
  technical: ['SQL', 'Python (Data Analysis)', 'Figma', 'Amplitude', 'Mixpanel', 'Looker'],
  domains: ['B2B SaaS', 'Consumer Products', 'AI/ML Products', 'Growth', 'Retention', 'Onboarding'],
};

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      
      <main className="pt-16">
        {/* Header */}
        <section className="mx-auto max-w-6xl px-6 py-24">
          <div className="grid gap-12 lg:grid-cols-2">
            <div>
              <h1 className="mb-6 text-4xl font-bold text-foreground lg:text-5xl">
                Resume & Contact
              </h1>
              <p className="mb-8 text-lg text-muted leading-relaxed">
                Looking for my full background? Download my resume or get in touch directly. 
                I'm always open to conversations about product, discovery, and building things that matter.
              </p>
              <div className="flex flex-wrap gap-4">
                <a
                  href="/Bianca_Starling_Resume.pdf"
                  download
                  className="inline-flex items-center gap-2 rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground transition-opacity hover:opacity-90"
                >
                  <Download className="h-4 w-4" />
                  Download Resume
                </a>
                <a
                  href="mailto:hello@biancastarling.com"
                  className="inline-flex items-center gap-2 rounded-lg border border-border px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-card"
                >
                  <Mail className="h-4 w-4" />
                  Email Me
                </a>
              </div>
            </div>

            {/* Contact Card */}
            <div className="rounded-lg border border-border bg-card p-8">
              <h2 className="mb-6 text-lg font-semibold text-foreground">Get in Touch</h2>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <Mail className="mt-0.5 h-5 w-5 text-accent" />
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <a 
                      href="mailto:hello@biancastarling.com" 
                      className="text-foreground hover:text-accent transition-colors"
                    >
                      hello@biancastarling.com
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <Linkedin className="mt-0.5 h-5 w-5 text-accent" />
                  <div>
                    <p className="text-sm text-muted-foreground">LinkedIn</p>
                    <a 
                      href="https://linkedin.com/in/biancastarling" 
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-foreground hover:text-accent transition-colors"
                    >
                      linkedin.com/in/biancastarling
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <FileText className="mt-0.5 h-5 w-5 text-accent" />
                  <div>
                    <p className="text-sm text-muted-foreground">Resume</p>
                    <a 
                      href="/Bianca_Starling_Resume.pdf" 
                      download
                      className="text-foreground hover:text-accent transition-colors"
                    >
                      Download PDF
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Experience */}
        <section className="border-t border-border">
          <div className="mx-auto max-w-6xl px-6 py-24">
            <h2 className="mb-12 text-2xl font-bold text-foreground">Experience</h2>
            <div className="space-y-12">
              {experience.map((job, index) => (
                <div key={index} className="grid gap-4 md:grid-cols-4">
                  <div className="md:col-span-1">
                    <p className="text-sm text-muted-foreground">{job.period}</p>
                  </div>
                  <div className="md:col-span-3">
                    <h3 className="mb-1 text-lg font-semibold text-foreground">{job.role}</h3>
                    <p className="mb-4 text-accent">{job.company}</p>
                    <ul className="space-y-2">
                      {job.highlights.map((highlight, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-muted-foreground" />
                          <span className="text-muted">{highlight}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Skills */}
        <section className="border-t border-border bg-card/30">
          <div className="mx-auto max-w-6xl px-6 py-24">
            <h2 className="mb-12 text-2xl font-bold text-foreground">Skills & Tools</h2>
            <div className="grid gap-12 md:grid-cols-3">
              <div>
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-accent">
                  Core Skills
                </h3>
                <div className="flex flex-wrap gap-2">
                  {skills.core.map((skill) => (
                    <span
                      key={skill}
                      className="rounded-full border border-border bg-card px-3 py-1 text-sm text-foreground"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-accent">
                  Technical
                </h3>
                <div className="flex flex-wrap gap-2">
                  {skills.technical.map((skill) => (
                    <span
                      key={skill}
                      className="rounded-full border border-border bg-card px-3 py-1 text-sm text-foreground"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-accent">
                  Domains
                </h3>
                <div className="flex flex-wrap gap-2">
                  {skills.domains.map((skill) => (
                    <span
                      key={skill}
                      className="rounded-full border border-border bg-card px-3 py-1 text-sm text-foreground"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Cover Letter Summary */}
        <section className="border-t border-border">
          <div className="mx-auto max-w-6xl px-6 py-24">
            <div className="mx-auto max-w-3xl">
              <h2 className="mb-8 text-2xl font-bold text-foreground">Why Work With Me</h2>
              <div className="space-y-6 text-muted leading-relaxed">
                <p>
                  I'm a product manager who believes that great products come from a relentless focus on 
                  understanding users and measuring outcomes. My background spans B2B and consumer products, 
                  with particular depth in retention, AI-powered features, and continuous discovery practices.
                </p>
                <p>
                  What sets me apart is my ability to bridge strategy and execution. I'm equally comfortable 
                  running a roadmap planning session, diving into SQL to diagnose a retention problem, or 
                  facilitating user interviews to uncover unmet needs. I bring strong opinions loosely held, 
                  and I'm not afraid to change course when the evidence points elsewhere.
                </p>
                <p>
                  I'm looking for roles where I can drive meaningful outcomes on hard problems, work with 
                  talented teams who care about craft, and continue building my expertise in AI-powered products.
                  If that sounds like your team, I'd love to talk.
                </p>
              </div>
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
