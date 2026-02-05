import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ArrowUpRight } from 'lucide-react';
import { portfolioData } from '@/lib/portfolio-data';

export async function generateStaticParams() {
  return portfolioData.projects.map((project) => ({
    id: project.id,
  }));
}

export default function ProjectDetailPage({ params }: { params: { id: string } }) {
  const project = portfolioData.projects.find((p) => p.id === params.id);

  if (!project) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <Link
            href="/#work"
            className="inline-flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to portfolio
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        {/* Project Header */}
        <div className="mb-12">
          <p className="text-sm font-medium text-muted uppercase tracking-wider mb-3">
            {project.company}
          </p>
          <h1 className="text-4xl font-bold text-foreground mb-6">
            {project.title}
          </h1>
          <div className="flex flex-wrap gap-2 mb-8">
            {project.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-accent/10 px-3 py-1 text-sm font-medium text-accent"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Project Overview */}
        <section className="mb-12 pb-12 border-b border-border">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-accent mb-4">
            Overview
          </h2>
          <p className="text-lg text-muted leading-relaxed mb-6">
            {project.cardTeaser}
          </p>
          <div className="bg-accent/5 border-l-4 border-accent p-6 rounded-r">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-accent mb-2">
              Outcome
            </h3>
            <p className="text-foreground font-medium">{project.outcome}</p>
          </div>
        </section>

        {/* Project Details */}
        {project.details && project.details.length > 0 && (
          <section className="space-y-12">
            {project.details.map((section, idx) => (
              <div key={idx}>
                {section.heading && (
                  <h2 className="text-2xl font-bold text-foreground mb-4">
                    {section.heading}
                  </h2>
                )}
                {section.paragraphs && section.paragraphs.length > 0 && (
                  <div className="space-y-4">
                    {section.paragraphs.map((para, pIdx) => (
                      <p key={pIdx} className="text-muted leading-relaxed">
                        {para}
                      </p>
                    ))}
                  </div>
                )}
                {section.list && section.list.length > 0 && (
                  <ul className="space-y-3 mt-4">
                    {section.list.map((item, lIdx) => (
                      <li key={lIdx} className="flex items-start gap-3">
                        <ArrowUpRight className="h-4 w-4 mt-1 flex-shrink-0 text-accent" />
                        <span className="text-muted">{item}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </section>
        )}

        {/* Back to Portfolio */}
        <div className="mt-16 pt-8 border-t border-border">
          <Link
            href="/#work"
            className="inline-flex items-center gap-2 text-foreground hover:text-accent transition-colors font-medium"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to all projects
          </Link>
        </div>
      </main>
    </div>
  );
}
