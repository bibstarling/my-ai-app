'use client';

import { ArrowUpRight, Linkedin, Mail, Github, ExternalLink } from 'lucide-react';
import { useEffect, useState } from 'react';

interface PortfolioPreviewProps {
  markdown: string;
}

export function PortfolioPreview({ markdown }: PortfolioPreviewProps) {
  const [portfolioData, setPortfolioData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Parse markdown to portfolio data when markdown changes
  useEffect(() => {
    const debounce = setTimeout(async () => {
      if (!markdown || markdown.length < 20) return;
      
      setLoading(true);
      try {
        const res = await fetch('/api/portfolio/parse-markdown', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ markdown }),
        });

        if (res.ok) {
          const data = await res.json();
          setPortfolioData(data.portfolioData);
        }
      } catch (error) {
        console.error('Failed to parse markdown:', error);
      } finally {
        setLoading(false);
      }
    }, 1000); // Debounce 1 second

    return () => clearTimeout(debounce);
  }, [markdown]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="mb-2 h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent mx-auto" />
          <p className="text-sm text-muted-foreground">Generating preview...</p>
        </div>
      </div>
    );
  }

  if (!portfolioData) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="text-center">
          <p className="text-muted-foreground">Preview will appear here</p>
          <p className="mt-2 text-sm text-muted-foreground">Save your portfolio to see the live preview</p>
        </div>
      </div>
    );
  }

  // Render portfolio using the same style as root page
  return (
    <div className="h-full overflow-auto bg-gradient-to-br from-background via-background to-accent/5">
      <div className="mx-auto max-w-5xl p-8">
        {/* Hero Section */}
        <header className="mb-12">
          <div className="mb-6">
            <h1 className="mb-2 text-4xl font-bold text-foreground md:text-5xl">
              {portfolioData.fullName || 'Your Name'}
            </h1>
            {portfolioData.title && (
              <p className="text-xl text-muted-foreground">{portfolioData.title}</p>
            )}
            {portfolioData.tagline && (
              <p className="mt-2 text-lg text-accent">{portfolioData.tagline}</p>
            )}
          </div>

          {/* Contact Links */}
          <div className="flex flex-wrap gap-4">
            {portfolioData.email && (
              <a
                href={`mailto:${portfolioData.email}`}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-accent"
              >
                <Mail className="h-4 w-4" />
                {portfolioData.email}
              </a>
            )}
            {portfolioData.linkedinUrl && (
              <a
                href={portfolioData.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-accent"
              >
                <Linkedin className="h-4 w-4" />
                LinkedIn
              </a>
            )}
            {portfolioData.githubUrl && (
              <a
                href={portfolioData.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-accent"
              >
                <Github className="h-4 w-4" />
                GitHub
              </a>
            )}
            {portfolioData.websiteUrl && (
              <a
                href={portfolioData.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-accent"
              >
                <ExternalLink className="h-4 w-4" />
                Website
              </a>
            )}
          </div>
        </header>

        {/* About */}
        {portfolioData.about && (
          <section className="mb-12">
            <h2 className="mb-4 text-2xl font-bold text-foreground">About</h2>
            <p className="text-muted-foreground leading-relaxed">{portfolioData.about}</p>
          </section>
        )}

        {/* Experience */}
        {portfolioData.experiences && portfolioData.experiences.length > 0 && (
          <section className="mb-12">
            <h2 className="mb-6 text-2xl font-bold text-foreground">Experience</h2>
            <div className="space-y-6">
              {portfolioData.experiences.map((exp: any, index: number) => (
                <div key={index} className="rounded-lg border border-border bg-card p-6">
                  <h3 className="text-lg font-semibold text-foreground">{exp.title}</h3>
                  {exp.company && (
                    <p className="text-accent">{exp.company}</p>
                  )}
                  {exp.period && (
                    <p className="text-sm text-muted-foreground">{exp.period}</p>
                  )}
                  {exp.description && (
                    <p className="mt-3 text-muted-foreground">{exp.description}</p>
                  )}
                  {exp.highlights && exp.highlights.length > 0 && (
                    <ul className="mt-3 space-y-1">
                      {exp.highlights.map((highlight: string, i: number) => (
                        <li key={i} className="text-sm text-muted-foreground">
                          • {highlight}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Projects */}
        {portfolioData.projects && portfolioData.projects.length > 0 && (
          <section className="mb-12">
            <h2 className="mb-6 text-2xl font-bold text-foreground">Projects</h2>
            <div className="grid gap-6 md:grid-cols-2">
              {portfolioData.projects.map((project: any, index: number) => (
                <div key={index} className="rounded-lg border border-border bg-card p-6">
                  <h3 className="text-lg font-semibold text-foreground">{project.name}</h3>
                  {project.description && (
                    <p className="mt-2 text-sm text-muted-foreground">{project.description}</p>
                  )}
                  {project.technologies && project.technologies.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {project.technologies.map((tech: string, i: number) => (
                        <span
                          key={i}
                          className="rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Skills */}
        {portfolioData.skills && portfolioData.skills.length > 0 && (
          <section className="mb-12">
            <h2 className="mb-6 text-2xl font-bold text-foreground">Skills</h2>
            <div className="flex flex-wrap gap-2">
              {portfolioData.skills.map((skill: any, index: number) => (
                <span
                  key={index}
                  className="rounded-full border border-border bg-background px-4 py-2 text-sm text-foreground"
                >
                  {skill.name || skill}
                </span>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
