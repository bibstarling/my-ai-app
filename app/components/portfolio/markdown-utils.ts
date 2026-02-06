/**
 * Convert structured portfolio data to markdown format
 */
export function convertDataToMarkdown(data?: any): string {
  if (!data) return '';

  let md = '';

  // Basic Info
  if (data.fullName || data.title || data.tagline || data.email || data.location || data.linkedinUrl || data.websiteUrl || data.githubUrl) {
    md += `# Basic Info\n\n`;
    if (data.fullName) md += `**Full Name:** ${data.fullName}\n\n`;
    if (data.title) md += `**Title:** ${data.title}\n\n`;
    if (data.tagline) md += `**Tagline:** ${data.tagline}\n\n`;
    if (data.email) md += `**Email:** ${data.email}\n\n`;
    if (data.location) md += `**Location:** ${data.location}\n\n`;
    if (data.linkedinUrl) md += `**LinkedIn:** ${data.linkedinUrl}\n\n`;
    if (data.websiteUrl) md += `**Website:** ${data.websiteUrl}\n\n`;
    if (data.githubUrl) md += `**GitHub:** ${data.githubUrl}\n\n`;
    md += `---\n\n`;
  }

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

  return md;
}
