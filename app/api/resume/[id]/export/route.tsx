import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getSupabaseServiceRole } from '@/lib/supabase-server';
import ReactPDF from '@react-pdf/renderer';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';

type RouteContext = {
  params: Promise<{ id: string }>;
};

// Define PDF styles
const styles = StyleSheet.create({
  page: {
    padding: 36, // 0.5in margins
    fontFamily: 'Helvetica',
    fontSize: 11,
    lineHeight: 1.5,
  },
  header: {
    marginBottom: 12,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  contactInfo: {
    fontSize: 9,
    color: '#666666',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottom: '2pt solid #000000',
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    borderBottom: '1pt solid #cccccc',
    paddingBottom: 3,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  itemContainer: {
    marginBottom: 12,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  itemTitle: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  itemSubtitle: {
    fontSize: 10,
    color: '#444444',
    marginBottom: 2,
  },
  itemDate: {
    fontSize: 9,
    color: '#666666',
  },
  bulletList: {
    marginLeft: 15,
    marginTop: 4,
  },
  bullet: {
    fontSize: 10,
    marginBottom: 3,
    lineHeight: 1.4,
  },
  skillsCategory: {
    marginBottom: 8,
  },
  skillsCategoryTitle: {
    fontWeight: 'bold',
    marginBottom: 3,
  },
  text: {
    fontSize: 10,
  },
});

/**
 * GET /api/resume/[id]/export - Export resume as PDF
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

    // Create filename with format: resume_biancastarling_companyname.pdf
    const fullName = (resume.full_name as string || 'candidate').toLowerCase().replace(/\s+/g, '');
    
    // Extract company name from resume title (format: "Job Title at Company Name")
    const title = resume.title as string || '';
    const companyMatch = title.match(/at\s+(.+)$/i);
    const companyName = companyMatch 
      ? companyMatch[1].replace(/[^a-z0-9]/gi, '').toLowerCase()
      : 'company';
    
    const filename = `resume_${fullName}_${companyName}.pdf`;

    // Generate PDF using @react-pdf/renderer
    const pdfDocument = generateResumePDF(resume, sections || []);
    const pdfBuffer = await ReactPDF.renderToBuffer(pdfDocument);

    // Return PDF
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
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

function generateResumePDF(resume: Record<string, unknown>, sections: Record<string, unknown>[]) {
  const fullName = resume.full_name as string || 'Your Name';
  const email = resume.email as string || '';
  const phone = resume.phone as string || '';
  const location = resume.location as string || '';
  const linkedinUrl = resume.linkedin_url as string || '';
  const portfolioUrl = resume.portfolio_url as string || '';

  const contactItems = [email, phone, location, linkedinUrl, portfolioUrl].filter(Boolean).join(' | ');

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.name}>{fullName}</Text>
          <Text style={styles.contactInfo}>{contactItems}</Text>
        </View>

        {sections.map((section, index) => (
          <View key={index} style={styles.section}>
            <Text style={styles.sectionTitle}>{getSectionTitle(section.section_type as string)}</Text>
            {renderSectionContent(section.section_type as string, section.content as Record<string, unknown>)}
          </View>
        ))}
      </Page>
    </Document>
  );
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

function renderSectionContent(type: string, content: Record<string, unknown>) {
  switch (type) {
    case 'summary':
      return <Text style={styles.text}>{content.text as string || ''}</Text>;
      
    case 'experience':
      return (
        <View style={styles.itemContainer}>
          <View style={styles.itemHeader}>
            <View>
              <Text style={styles.itemTitle}>{content.position as string || ''}</Text>
              <Text style={styles.itemSubtitle}>{content.company as string || ''}</Text>
            </View>
            <Text style={styles.itemDate}>
              {content.startDate as string || ''} — {content.endDate as string || 'Present'}
            </Text>
          </View>
          {renderBullets(content.bullets as string[] | undefined)}
        </View>
      );
      
    case 'education':
      return (
        <View style={styles.itemContainer}>
          <View style={styles.itemHeader}>
            <View>
              <Text style={styles.itemTitle}>{content.degree as string || ''}</Text>
              <Text style={styles.itemSubtitle}>{content.institution as string || ''}</Text>
            </View>
            <Text style={styles.itemDate}>{content.year as string || ''}</Text>
          </View>
          {content.description && <Text style={styles.text}>{content.description as string}</Text>}
        </View>
      );
      
    case 'skills':
      return (
        <View style={styles.skillsCategory}>
          {content.category && <Text style={styles.skillsCategoryTitle}>{content.category as string}</Text>}
          <Text style={styles.text}>
            {Array.isArray(content.items) ? (content.items as string[]).join(' • ') : ''}
          </Text>
        </View>
      );
      
    case 'projects':
      return (
        <View style={styles.itemContainer}>
          <Text style={styles.itemTitle}>{content.name as string || ''}</Text>
          {content.description && <Text style={styles.text}>{content.description as string}</Text>}
          {renderBullets(content.bullets as string[] | undefined)}
        </View>
      );
      
    default:
      return <Text style={styles.text}>{JSON.stringify(content)}</Text>;
  }
}

function renderBullets(bullets?: string[]) {
  if (!bullets || bullets.length === 0) return null;
  const filtered = bullets.filter(Boolean);
  if (filtered.length === 0) return null;
  
  return (
    <View style={styles.bulletList}>
      {filtered.map((bullet, index) => (
        <Text key={index} style={styles.bullet}>• {bullet}</Text>
      ))}
    </View>
  );
}
