import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getSupabaseServiceRole } from '@/lib/supabase-server';

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/resume/[id]/export - Export resume as PDF
 * Simple HTML-to-PDF using browser print capabilities
 */
export async function GET(req: Request, context: RouteContext) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    const supabase = getSupabaseServiceRole();

    // Get resume with sections
    const { data: resume, error: resumeError } = await supabase
      .from('resumes')
      .select('*')
      .eq('id', id)
      .eq('clerk_id', userId)
      .single();

    if (resumeError || !resume) {
      return NextResponse.json({ error: 'Resume not found' }, { status: 404 });
    }

    const { data: sections } = await supabase
      .from('resume_sections')
      .select('*')
      .eq('resume_id', id)
      .order('sort_order', { ascending: true });

    // Generate HTML
    const html = generateResumeHTML(resume, sections || []);

    // Create filename with format: resume_biancastarling_companyname.html
    const fullName = (resume.full_name as string || 'candidate').toLowerCase().replace(/\s+/g, '');
    
    // Extract company name from resume title (format: "Job Title at Company Name")
    const title = resume.title as string || '';
    const companyMatch = title.match(/at\s+(.+)$/i);
    const companyName = companyMatch 
      ? companyMatch[1].replace(/[^a-z0-9]/gi, '').toLowerCase()
      : 'company';
    
    const filename = `resume_${fullName}_${companyName}.html`;

    // Return HTML with print-friendly CSS
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `inline; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('GET /api/resume/[id]/export error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function generateResumeHTML(resume: Record<string, unknown>, sections: Record<string, unknown>[]): string {
  const fullName = resume.full_name || 'Your Name';
  const email = resume.email || '';
  const phone = resume.phone || '';
  const location = resume.location || '';
  const linkedinUrl = resume.linkedin_url || '';
  const portfolioUrl = resume.portfolio_url || '';

  const contactItems = [
    email ? `<span>${email}</span>` : '',
    phone ? `<span>${phone}</span>` : '',
    location ? `<span>${location}</span>` : '',
    linkedinUrl ? `<span><a href="${linkedinUrl}">LinkedIn</a></span>` : '',
    portfolioUrl ? `<span><a href="${portfolioUrl}">Portfolio</a></span>` : '',
  ].filter(Boolean).join(' | ');

  const sectionsHTML = sections
    .map((section) => {
      const sectionType = section.section_type as string;
      const content = section.content as Record<string, unknown>;
      
      return `
        <div class="section">
          <h2>${getSectionTitle(sectionType)}</h2>
          ${renderSectionContent(sectionType, content)}
        </div>
      `;
    })
    .join('');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${fullName} - Resume</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Helvetica Neue', Arial, sans-serif;
      font-size: 11pt;
      line-height: 1.5;
      color: #333;
      max-width: 8.5in;
      margin: 0 auto;
      padding: 0.5in;
      background: white;
    }
    
    h1 {
      font-size: 28pt;
      font-weight: bold;
      color: #000;
      margin-bottom: 8px;
    }
    
    .contact-info {
      font-size: 10pt;
      color: #666;
      margin-bottom: 20px;
      padding-bottom: 12px;
      border-bottom: 2px solid #000;
    }
    
    .section {
      margin-bottom: 20px;
      page-break-inside: avoid;
    }
    
    h2 {
      font-size: 14pt;
      font-weight: bold;
      text-transform: uppercase;
      color: #000;
      border-bottom: 1px solid #ccc;
      padding-bottom: 4px;
      margin-bottom: 12px;
      letter-spacing: 0.5px;
    }
    
    .experience-item, .education-item, .project-item {
      margin-bottom: 16px;
      page-break-inside: avoid;
    }
    
    .item-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 4px;
    }
    
    .item-title {
      font-size: 12pt;
      font-weight: bold;
      color: #000;
    }
    
    .item-subtitle {
      font-size: 11pt;
      color: #444;
    }
    
    .item-date {
      font-size: 10pt;
      color: #666;
      text-align: right;
    }
    
    ul {
      list-style-type: disc;
      margin-left: 20px;
      margin-top: 6px;
    }
    
    li {
      margin-bottom: 4px;
      line-height: 1.4;
    }
    
    .skills-category {
      margin-bottom: 10px;
    }
    
    .skills-category-title {
      font-weight: bold;
      margin-bottom: 4px;
    }
    
    a {
      color: #0066cc;
      text-decoration: none;
    }
    
    @media print {
      body {
        padding: 0;
        margin: 0;
      }
      
      @page {
        margin: 0.5in;
        size: letter;
      }
      
      .section {
        page-break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  <h1>${fullName}</h1>
  <div class="contact-info">${contactItems}</div>
  ${sectionsHTML}
  
  <script>
    // Auto-print when loaded (can be disabled)
    // window.onload = () => window.print();
  </script>
</body>
</html>
  `;
}

function getSectionTitle(type: string): string {
  const titles: Record<string, string> = {
    summary: 'Professional Summary',
    experience: 'Experience',
    education: 'Education',
    skills: 'Skills',
    projects: 'Projects',
    certifications: 'Certifications',
  };
  return titles[type] || type;
}

function renderSectionContent(type: string, content: Record<string, unknown>): string {
  switch (type) {
    case 'summary':
      return `<p>${content.text || ''}</p>`;
      
    case 'experience':
      return `
        <div class="experience-item">
          <div class="item-header">
            <div>
              <div class="item-title">${content.position || ''}</div>
              <div class="item-subtitle">${content.company || ''}</div>
            </div>
            <div class="item-date">
              ${content.startDate || ''} — ${content.endDate || 'Present'}
            </div>
          </div>
          ${renderBullets(content.bullets as string[] | undefined)}
        </div>
      `;
      
    case 'education':
      return `
        <div class="education-item">
          <div class="item-header">
            <div>
              <div class="item-title">${content.degree || ''}</div>
              <div class="item-subtitle">${content.institution || ''}</div>
            </div>
            <div class="item-date">${content.year || ''}</div>
          </div>
          ${content.description ? `<p>${content.description}</p>` : ''}
        </div>
      `;
      
    case 'skills':
      return `
        <div class="skills-category">
          ${content.category ? `<div class="skills-category-title">${content.category}</div>` : ''}
          <p>${Array.isArray(content.items) ? content.items.join(' • ') : ''}</p>
        </div>
      `;
      
    case 'projects':
      return `
        <div class="project-item">
          <div class="item-title">${content.name || ''}</div>
          ${content.description ? `<p>${content.description}</p>` : ''}
          ${renderBullets(content.bullets as string[] | undefined)}
        </div>
      `;
      
    default:
      return `<p>${JSON.stringify(content)}</p>`;
  }
}

function renderBullets(bullets?: string[]): string {
  if (!bullets || bullets.length === 0) return '';
  const filtered = bullets.filter(Boolean);
  if (filtered.length === 0) return '';
  
  return `
    <ul>
      ${filtered.map(bullet => `<li>${bullet}</li>`).join('')}
    </ul>
  `;
}
