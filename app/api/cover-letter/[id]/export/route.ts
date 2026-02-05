import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getSupabaseServiceRole } from '@/lib/supabase-server';
import { portfolioData } from '@/lib/portfolio-data';

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/cover-letter/[id]/export - Export cover letter as formatted HTML
 */
export async function GET(req: Request, context: RouteContext) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    const supabase = getSupabaseServiceRole();

    const { data: coverLetter, error } = await supabase
      .from('cover_letters')
      .select('*')
      .eq('id', id)
      .eq('clerk_id', userId)
      .single();

    if (error || !coverLetter) {
      return NextResponse.json({ error: 'Cover letter not found' }, { status: 404 });
    }

    const html = generateCoverLetterHTML(coverLetter);

    // Create filename with format: coverletter_biancastarling_companyname.html
    const fullName = portfolioData.fullName.toLowerCase().replace(/\s+/g, '');
    const companyName = (coverLetter.job_company as string || 'company')
      .replace(/[^a-z0-9]/gi, '')
      .toLowerCase();
    
    const filename = `coverletter_${fullName}_${companyName}.html`;

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('GET /api/cover-letter/[id]/export error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function generateCoverLetterHTML(coverLetter: Record<string, unknown>): string {
  const today = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const recipientBlock = coverLetter.recipient_name
    ? `${coverLetter.recipient_name}${coverLetter.recipient_title ? `\n${coverLetter.recipient_title}` : ''}
${coverLetter.job_company}
${coverLetter.company_address || ''}`
    : `Hiring Manager
${coverLetter.job_company}`;

  const greeting = coverLetter.recipient_name
    ? `Dear ${coverLetter.recipient_name},`
    : `Dear Hiring Manager,`;

  const bodyParagraphs = Array.isArray(coverLetter.body_paragraphs)
    ? coverLetter.body_paragraphs
    : [];

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cover Letter - ${coverLetter.job_company}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Times New Roman', Times, serif;
      font-size: 12pt;
      line-height: 1.6;
      color: #000;
      max-width: 8.5in;
      margin: 0 auto;
      padding: 1in;
      background: white;
    }
    
    .header {
      margin-bottom: 24px;
    }
    
    .header-name {
      font-size: 14pt;
      font-weight: bold;
      margin-bottom: 4px;
    }
    
    .header-contact {
      font-size: 11pt;
      color: #333;
      margin-bottom: 2px;
    }
    
    .date {
      margin-bottom: 24px;
    }
    
    .recipient {
      margin-bottom: 24px;
      white-space: pre-line;
    }
    
    .greeting {
      margin-bottom: 16px;
    }
    
    .paragraph {
      margin-bottom: 16px;
      text-align: justify;
    }
    
    .closing {
      margin-top: 24px;
    }
    
    .signature {
      margin-top: 48px;
    }
    
    @media print {
      body {
        padding: 0;
        margin: 0;
      }
      
      @page {
        margin: 1in;
        size: letter;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="header-name">${portfolioData.fullName}</div>
    <div class="header-contact">${portfolioData.email}</div>
    <div class="header-contact">${portfolioData.location}</div>
    ${portfolioData.linkedinUrl ? `<div class="header-contact">${portfolioData.linkedinUrl}</div>` : ''}
  </div>
  
  <div class="date">${today}</div>
  
  <div class="recipient">${recipientBlock}</div>
  
  <div class="greeting">${greeting}</div>
  
  <div class="paragraph">${coverLetter.opening_paragraph}</div>
  
  ${bodyParagraphs.map((para: string) => `<div class="paragraph">${para}</div>`).join('\n  ')}
  
  <div class="paragraph">${coverLetter.closing_paragraph}</div>
  
  <div class="closing">Sincerely,</div>
  
  <div class="signature">${portfolioData.fullName}</div>
</body>
</html>`;
}
