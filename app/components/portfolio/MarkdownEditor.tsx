'use client';

import { useState } from 'react';
import { Sparkles, HelpCircle } from 'lucide-react';

interface MarkdownEditorProps {
  markdown: string;
  onChange: (markdown: string) => void;
  onSave: () => Promise<void>;
  isSaving?: boolean;
}

export const MARKDOWN_TEMPLATE = `# About Me

Write a few paragraphs about yourself, your background, and what drives you...

---

# Professional Style

Strategic Builder, Creative Problem Solver, etc.

**Performance Level:** Senior Professional, Top Performer, etc.

---

# Key Strengths

- First key strength or superpower
- Second unique quality
- Third differentiator
- Add more as needed...

---

# Experience

## Senior Product Manager @ Tech Company
*Jan 2023 - Present | San Francisco, CA*

Brief description of your role and impact...

**Key Achievements:**
- First major achievement with metrics
- Second accomplishment
- Third highlight

**Skills:** Product Strategy, Roadmapping, Agile

---

## Previous Role @ Another Company
*Jan 2020 - Dec 2022 | Location*

Description...

**Key Achievements:**
- Achievement 1
- Achievement 2

**Skills:** Skill1, Skill2, Skill3

---

# Projects

## Project Name
**Role:** Your Role | **Timeline:** 2024

Description of the project, the challenge, and your approach...

**Impact:**
- Key result with metrics
- Another significant outcome

**Technologies:** React, Node.js, etc.

---

# Skills

**Technical:** JavaScript, Python, SQL, etc.

**Product:** Roadmapping, User Research, A/B Testing

**Leadership:** Team Management, Stakeholder Communication

---

# Education

**Degree Name** - University Name
*Graduation Year*

Additional details if needed...

---

# Certifications & Achievements

**Certification Name** - Issuing Organization (Year)

**Award Name** - Q1 2024
Description of the award and what it recognized...

---

# Articles & Talks

**"Article or Talk Title"** - Publication/Event (Date)
Brief description or key takeaway...
`;

export function MarkdownEditor({ markdown, onChange, onSave, isSaving }: MarkdownEditorProps) {
  const [showHelp, setShowHelp] = useState(false);

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Your Portfolio Content</h3>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Edit directly or use AI chat to update
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowHelp(!showHelp)}
              className="flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              <HelpCircle className="h-4 w-4" />
              {showHelp ? 'Hide' : 'Guide'}
            </button>
            
            <button
              onClick={onSave}
              disabled={isSaving}
              className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-accent/90 disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Saving...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Save Portfolio
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Help/Template Panel */}
      {showHelp && (
        <div className="border-b border-border bg-blue-50 px-6 py-4">
          <div className="flex items-start gap-3">
            <HelpCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600" />
            <div className="flex-1">
              <h4 className="font-semibold text-blue-900">How to use markdown format</h4>
              <p className="mt-1 text-sm text-blue-800">
                Use # for headings, ## for subheadings, - for bullet points, **text** for bold. 
                Organize content with --- separators. AI will understand your structure!
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => {
                    if (confirm('This will replace your current content with a template. Continue?')) {
                      onChange(MARKDOWN_TEMPLATE);
                    }
                  }}
                  className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  Load Template
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Editor */}
      <div className="flex-1 overflow-hidden p-4">
        <textarea
          value={markdown}
          onChange={(e) => onChange(e.target.value)}
          className="h-full w-full resize-none rounded-lg border border-border bg-background px-4 py-3 font-mono text-sm leading-relaxed text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          placeholder="Start writing your portfolio content in markdown...

Use AI chat on the left to help you, or edit directly here!"
          spellCheck={true}
        />
      </div>

      {/* Footer Stats */}
      <div className="border-t border-border bg-muted px-6 py-2.5">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span>{markdown.length.toLocaleString()} characters</span>
            <span>{markdown.split('\n').length.toLocaleString()} lines</span>
          </div>
          <span className="flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5" />
            Markdown format
          </span>
        </div>
      </div>
    </div>
  );
}

// Helper function to convert existing structured data to markdown
function convertDataToMarkdown(data?: any): string {
  if (!data) return TEMPLATE;

  let md = '';

  // About
  if (data.about) {
    md += `# About Me\n\n${data.about}\n\n---\n\n`;
  }

  // Professional Style
  if (data.pmArchetype || data.workStyle || data.performanceLevel) {
    md += `# Professional Style\n\n`;
    if (data.pmArchetype || data.workStyle) {
      md += `${data.pmArchetype || data.workStyle}\n\n`;
    }
    if (data.performanceLevel) {
      md += `**Performance Level:** ${data.performanceLevel}\n\n`;
    }
    md += `---\n\n`;
  }

  // Strengths
  if (data.superpowers && data.superpowers.length > 0) {
    md += `# Key Strengths\n\n`;
    data.superpowers.forEach((strength: string) => {
      md += `- ${strength}\n`;
    });
    md += `\n---\n\n`;
  }

  // Experience
  if (data.experiences && data.experiences.length > 0) {
    md += `# Experience\n\n`;
    data.experiences.forEach((exp: any) => {
      md += `## ${exp.title}${exp.company ? ` @ ${exp.company}` : ''}\n`;
      if (exp.period || exp.location) {
        md += `*${exp.period || ''}${exp.period && exp.location ? ' | ' : ''}${exp.location || ''}*\n\n`;
      }
      if (exp.description) {
        md += `${exp.description}\n\n`;
      }
      if (exp.highlights && exp.highlights.length > 0) {
        md += `**Key Achievements:**\n`;
        exp.highlights.forEach((h: string) => md += `- ${h}\n`);
        md += `\n`;
      }
      if (exp.skills && exp.skills.length > 0) {
        md += `**Skills:** ${exp.skills.join(', ')}\n\n`;
      }
      md += `---\n\n`;
    });
  }

  // Projects
  if (data.projects && data.projects.length > 0) {
    md += `# Projects\n\n`;
    data.projects.forEach((proj: any) => {
      md += `## ${proj.name}\n`;
      if (proj.role || proj.timeline) {
        md += `**Role:** ${proj.role || 'N/A'} | **Timeline:** ${proj.timeline || 'N/A'}\n\n`;
      }
      if (proj.description) {
        md += `${proj.description}\n\n`;
      }
      if (proj.impact && proj.impact.length > 0) {
        md += `**Impact:**\n`;
        proj.impact.forEach((i: string) => md += `- ${i}\n`);
        md += `\n`;
      }
      if (proj.technologies && proj.technologies.length > 0) {
        md += `**Technologies:** ${proj.technologies.join(', ')}\n\n`;
      }
      md += `---\n\n`;
    });
  }

  // Skills
  if (data.skills && data.skills.length > 0) {
    md += `# Skills\n\n`;
    const grouped = data.skills.reduce((acc: any, skill: any) => {
      const cat = skill.category || 'Other';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(skill.name);
      return acc;
    }, {});
    Object.entries(grouped).forEach(([category, skills]: [string, any]) => {
      md += `**${category}:** ${skills.join(', ')}\n\n`;
    });
    md += `---\n\n`;
  }

  // Education
  if (data.education && data.education.length > 0) {
    md += `# Education\n\n`;
    data.education.forEach((edu: any) => {
      md += `**${edu.degree}** - ${edu.institution}\n`;
      if (edu.year) {
        md += `*${edu.year}*\n\n`;
      }
      if (edu.details) {
        md += `${edu.details}\n\n`;
      }
      md += `---\n\n`;
    });
  }

  // Certifications & Awards
  if ((data.certifications && data.certifications.length > 0) || (data.awards && data.awards.length > 0)) {
    md += `# Certifications & Achievements\n\n`;
    
    if (data.certifications && data.certifications.length > 0) {
      data.certifications.forEach((cert: any) => {
        md += `**${cert.name}** - ${cert.issuer}${cert.year ? ` (${cert.year})` : ''}\n\n`;
      });
    }
    
    if (data.awards && data.awards.length > 0) {
      data.awards.forEach((award: any) => {
        md += `**${award.title}** - ${award.quarter || award.date || ''}\n`;
        if (award.description) {
          md += `${award.description}\n\n`;
        }
      });
    }
    
    md += `---\n\n`;
  }

  // Articles & Talks
  if (data.articlesAndTalks && data.articlesAndTalks.length > 0) {
    md += `# Articles & Talks\n\n`;
    data.articlesAndTalks.forEach((item: any) => {
      md += `**"${item.title}"** - ${item.publication || item.event || ''}${item.date ? ` (${item.date})` : ''}\n`;
      if (item.description) {
        md += `${item.description}\n\n`;
      }
    });
  }

  return md || TEMPLATE;
}
