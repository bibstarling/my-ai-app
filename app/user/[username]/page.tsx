import { notFound } from 'next/navigation';
import { Mail, Linkedin, Github, ExternalLink } from 'lucide-react';
import { WerkRoomButton } from '@/app/components/WerkRoomButton';

async function getPortfolio(username: string) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/portfolio/${username}`, {
      cache: 'no-store',
    });

    if (!res.ok) {
      return null;
    }

    const data = await res.json();
    return data.success ? data.portfolioData : null;
  } catch (error) {
    console.error('Error fetching portfolio:', error);
    return null;
  }
}

export default async function UserPortfolioPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const portfolioData = await getPortfolio(username);

  if (!portfolioData) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Werk Room Button - Top Right - Only shown when logged in */}
      <WerkRoomButton />
      
      {/* Header */}
      <header className="border-b border-border bg-white">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <h1 className="text-4xl font-bold text-foreground md:text-5xl">
            {portfolioData.fullName || 'Portfolio'}
          </h1>
          {portfolioData.title && (
            <p className="mt-4 text-xl text-muted-foreground">{portfolioData.title}</p>
          )}
          {portfolioData.tagline && (
            <p className="mt-2 text-lg text-foreground">{portfolioData.tagline}</p>
          )}

          {/* Contact Links */}
          <div className="mt-6 flex flex-wrap gap-4">
            {portfolioData.email && (
              <a
                href={`mailto:${portfolioData.email}`}
                className="flex items-center gap-2 text-sm text-muted hover:text-accent transition-colors"
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
                className="flex items-center gap-2 text-sm text-muted hover:text-accent transition-colors"
              >
                <Linkedin className="h-4 w-4" />
                LinkedIn
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
            {portfolioData.githubUrl && (
              <a
                href={portfolioData.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-muted hover:text-accent transition-colors"
              >
                <Github className="h-4 w-4" />
                GitHub
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
            {portfolioData.websiteUrl && (
              <a
                href={portfolioData.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-muted hover:text-accent transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
                Website
              </a>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-6xl px-6 py-16">
        {/* About Section */}
        {portfolioData.about && (
          <section className="mb-16">
            <h2 className="mb-6 text-2xl font-bold text-foreground">About</h2>
            <p className="text-lg leading-relaxed text-muted-foreground">
              {portfolioData.about}
            </p>
          </section>
        )}

        {/* Experience Section */}
        {portfolioData.experiences && portfolioData.experiences.length > 0 && (
          <section className="mb-16">
            <h2 className="mb-8 text-2xl font-bold text-foreground">Experience</h2>
            <div className="space-y-8">
              {portfolioData.experiences.map((exp: any, index: number) => (
                <div key={index} className="border-l-2 border-accent pl-6">
                  <p className="text-sm font-medium text-muted uppercase tracking-wider">
                    {exp.period}
                  </p>
                  <h3 className="mt-2 text-xl font-semibold text-foreground">
                    {exp.title}
                  </h3>
                  <p className="mt-1 text-muted-foreground">
                    {exp.company}
                    {exp.location && ` • ${exp.location}`}
                  </p>
                  {exp.description && (
                    <p className="mt-3 text-foreground leading-relaxed">
                      {exp.description}
                    </p>
                  )}
                  {exp.highlights && exp.highlights.length > 0 && (
                    <ul className="mt-3 space-y-2">
                      {exp.highlights.map((highlight: string, i: number) => (
                        <li key={i} className="flex gap-2 text-sm text-muted-foreground">
                          <span className="text-accent">•</span>
                          <span>{highlight}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {exp.skills && exp.skills.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {exp.skills.map((skill: string, i: number) => (
                        <span
                          key={i}
                          className="rounded-full bg-muted/20 px-3 py-1 text-xs font-medium text-foreground"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Projects Section */}
        {portfolioData.projects && portfolioData.projects.length > 0 && (
          <section className="mb-16">
            <h2 className="mb-8 text-2xl font-bold text-foreground">Projects</h2>
            <div className="grid gap-6 md:grid-cols-2">
              {portfolioData.projects.map((project: any) => (
                <div
                  key={project.id}
                  className="rounded-lg border border-border bg-white p-6 transition-all hover:border-accent hover:shadow-lg"
                >
                  <p className="text-xs font-medium text-muted uppercase tracking-wider">
                    {project.company}
                  </p>
                  <h3 className="mt-2 text-lg font-semibold text-foreground">
                    {project.title}
                  </h3>
                  <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                    {project.cardTeaser || project.outcome}
                  </p>
                  {project.outcome && (
                    <div className="mt-4 rounded-lg bg-accent/5 px-3 py-2">
                      <p className="text-xs font-medium text-accent">{project.outcome}</p>
                    </div>
                  )}
                  {project.tags && project.tags.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {project.tags.slice(0, 3).map((tag: string, i: number) => (
                        <span
                          key={i}
                          className="rounded-full bg-muted/20 px-2 py-1 text-xs font-medium text-muted"
                        >
                          {tag}
                        </span>
                      ))}
                      {project.tags.length > 3 && (
                        <span className="rounded-full bg-muted/20 px-2 py-1 text-xs font-medium text-muted">
                          +{project.tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Skills Section */}
        {portfolioData.skills && Object.keys(portfolioData.skills).length > 0 && (
          <section className="mb-16">
            <h2 className="mb-8 text-2xl font-bold text-foreground">Skills</h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {Object.entries(portfolioData.skills).map(([category, skills]: [string, any]) => (
                <div key={category}>
                  <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted">
                    {category}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {skills.map((skill: string, i: number) => (
                      <span
                        key={i}
                        className="rounded-full bg-muted/20 px-3 py-1 text-xs font-medium text-foreground"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Education Section */}
        {portfolioData.education && portfolioData.education.length > 0 && (
          <section className="mb-16">
            <h2 className="mb-8 text-2xl font-bold text-foreground">Education</h2>
            <div className="space-y-6">
              {portfolioData.education.map((edu: any, index: number) => (
                <div key={index}>
                  <h3 className="text-lg font-semibold text-foreground">{edu.degree}</h3>
                  <p className="mt-1 text-muted-foreground">{edu.institution}</p>
                  <p className="mt-1 text-sm text-muted">{edu.period}</p>
                  {edu.description && (
                    <p className="mt-2 text-sm text-muted-foreground">{edu.description}</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Certifications Section */}
        {portfolioData.certifications && portfolioData.certifications.length > 0 && (
          <section className="mb-16">
            <h2 className="mb-8 text-2xl font-bold text-foreground">Certifications</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {portfolioData.certifications.map((cert: any, index: number) => (
                <div key={index} className="rounded-lg border border-border p-4">
                  <h3 className="font-semibold text-foreground">{cert.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{cert.issuer}</p>
                  <p className="mt-1 text-xs text-muted">{cert.date}</p>
                  {cert.credentialUrl && (
                    <a
                      href={cert.credentialUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-1 text-xs text-accent hover:underline"
                    >
                      View Credential
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Achievements Section */}
        {portfolioData.achievements && portfolioData.achievements.length > 0 && (
          <section className="mb-16">
            <h2 className="mb-8 text-2xl font-bold text-foreground">Achievements</h2>
            <ul className="space-y-3">
              {portfolioData.achievements.map((achievement: string, index: number) => (
                <li key={index} className="flex gap-3">
                  <span className="mt-1 text-accent">•</span>
                  <span className="text-foreground">{achievement}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Articles Section */}
        {portfolioData.articles && portfolioData.articles.length > 0 && (
          <section className="mb-16">
            <h2 className="mb-8 text-2xl font-bold text-foreground">Articles & Talks</h2>
            <div className="space-y-4">
              {portfolioData.articles.map((article: any, index: number) => (
                <a
                  key={index}
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded-lg border border-border p-4 transition-all hover:border-accent hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-medium text-muted uppercase">
                        {article.type} • {article.organization}
                      </p>
                      <h3 className="mt-1 font-semibold text-foreground hover:text-accent">
                        {article.title}
                      </h3>
                      <p className="mt-1 text-xs text-muted">{article.date}</p>
                    </div>
                    <ExternalLink className="h-4 w-4 flex-shrink-0 text-muted" />
                  </div>
                </a>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-white">
        <div className="mx-auto max-w-6xl px-6 py-8 text-center">
          <p className="text-sm text-muted-foreground">
            Portfolio built with AI • Powered by My AI App
          </p>
        </div>
      </footer>
    </div>
  );
}
