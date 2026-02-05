import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getSupabaseServiceRole } from '@/lib/supabase-server';
import { portfolioData } from '@/lib/portfolio-data';
import ReactPDF from '@react-pdf/renderer';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

type RouteContext = {
  params: Promise<{ id: string }>;
};

// Define PDF styles for cover letter
const styles = StyleSheet.create({
  page: {
    padding: 72, // 1in margins
    fontFamily: 'Times-Roman',
    fontSize: 12,
    lineHeight: 1.6,
  },
  header: {
    marginBottom: 18,
  },
  headerName: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 3,
  },
  headerContact: {
    fontSize: 11,
    color: '#333333',
    marginBottom: 2,
  },
  date: {
    marginBottom: 18,
  },
  recipient: {
    marginBottom: 18,
    lineHeight: 1.4,
  },
  greeting: {
    marginBottom: 12,
  },
  paragraph: {
    marginBottom: 12,
    textAlign: 'justify',
  },
  closing: {
    marginTop: 18,
  },
  signature: {
    marginTop: 36,
  },
});

/**
 * GET /api/cover-letter/[id]/export - Export cover letter as PDF
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

    // Create filename with format: coverletter_biancastarling_companyname.pdf
    const fullName = portfolioData.fullName.toLowerCase().replace(/\s+/g, '');
    const companyName = (coverLetter.job_company as string || 'company')
      .replace(/[^a-z0-9]/gi, '')
      .toLowerCase();
    
    const filename = `coverletter_${fullName}_${companyName}.pdf`;

    // Generate PDF using @react-pdf/renderer
    const pdfDocument = generateCoverLetterPDF(coverLetter);
    const pdfBuffer = await ReactPDF.renderToBuffer(pdfDocument);

    // Return PDF (convert Buffer to Uint8Array for NextResponse)
    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
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

function generateCoverLetterPDF(coverLetter: Record<string, unknown>) {
  const today = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const recipientLines: string[] = [];
  if (coverLetter.recipient_name) {
    recipientLines.push(coverLetter.recipient_name as string);
    if (coverLetter.recipient_title) {
      recipientLines.push(coverLetter.recipient_title as string);
    }
  } else {
    recipientLines.push('Hiring Manager');
  }
  recipientLines.push(coverLetter.job_company as string || '');
  if (coverLetter.company_address) {
    recipientLines.push(coverLetter.company_address as string);
  }

  const greeting = coverLetter.recipient_name
    ? `Dear ${coverLetter.recipient_name},`
    : `Dear Hiring Manager,`;

  const bodyParagraphs = Array.isArray(coverLetter.body_paragraphs)
    ? (coverLetter.body_paragraphs as string[])
    : [];

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.headerName}>{portfolioData.fullName}</Text>
          <Text style={styles.headerContact}>{portfolioData.email}</Text>
          <Text style={styles.headerContact}>{portfolioData.location}</Text>
          {portfolioData.linkedinUrl && (
            <Text style={styles.headerContact}>{portfolioData.linkedinUrl}</Text>
          )}
        </View>

        <Text style={styles.date}>{today}</Text>

        <View style={styles.recipient}>
          {recipientLines.filter(Boolean).map((line, index) => (
            <Text key={index}>{line}</Text>
          ))}
        </View>

        <Text style={styles.greeting}>{greeting}</Text>

        <Text style={styles.paragraph}>{coverLetter.opening_paragraph as string || ''}</Text>

        {bodyParagraphs.map((para, index) => (
          <Text key={index} style={styles.paragraph}>{para}</Text>
        ))}

        <Text style={styles.paragraph}>{coverLetter.closing_paragraph as string || ''}</Text>

        <Text style={styles.closing}>Sincerely,</Text>

        <Text style={styles.signature}>{portfolioData.fullName}</Text>
      </Page>
    </Document>
  );
}
