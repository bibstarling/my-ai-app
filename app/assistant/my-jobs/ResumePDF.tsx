import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 11,
    fontFamily: 'Helvetica',
    lineHeight: 1.5,
  },
  header: {
    marginBottom: 20,
    paddingBottom: 15,
    borderBottom: '2pt solid #1a1a1a',
  },
  name: {
    fontSize: 24,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 12,
    color: '#1a1a1a',
  },
  contactInfo: {
    fontSize: 10,
    color: '#4a5568',
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  contactItem: {
    marginRight: 8,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
    paddingBottom: 4,
    borderBottom: '1pt solid #d1d5db',
    color: '#1a1a1a',
  },
  experienceItem: {
    marginBottom: 12,
  },
  experienceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  experienceTitle: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 11,
    color: '#1a1a1a',
  },
  experienceCompany: {
    fontSize: 10,
    color: '#4a5568',
    marginBottom: 4,
  },
  experienceDate: {
    fontSize: 9,
    color: '#6b7280',
  },
  bulletList: {
    marginLeft: 15,
    marginTop: 4,
  },
  bulletItem: {
    fontSize: 10,
    color: '#4a5568',
    marginBottom: 3,
    flexDirection: 'row',
  },
  bulletPoint: {
    width: 15,
  },
  bulletText: {
    flex: 1,
  },
  summaryText: {
    fontSize: 10,
    color: '#4a5568',
    lineHeight: 1.6,
  },
  skillsText: {
    fontSize: 10,
    color: '#4a5568',
    lineHeight: 1.6,
  },
});

export const ResumePDF = ({ resume }: any) => {
  const groupedSections: any = {};
  const sectionOrder = ['summary', 'experience', 'skills', 'projects', 'education', 'certifications'];
  
  resume.sections?.forEach((section: any) => {
    const type = section.section_type;
    if (!groupedSections[type]) {
      groupedSections[type] = [];
    }
    groupedSections[type].push(section);
  });

  Object.keys(groupedSections).forEach((type) => {
    groupedSections[type].sort((a: any, b: any) => a.sort_order - b.sort_order);
  });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.name}>{resume.full_name || 'Your Name'}</Text>
          <View style={styles.contactInfo}>
            {resume.email && <Text style={styles.contactItem}>{resume.email}</Text>}
            {resume.phone && <Text style={styles.contactItem}>| {resume.phone}</Text>}
            {resume.location && <Text style={styles.contactItem}>| {resume.location}</Text>}
            {resume.portfolio_url && <Text style={styles.contactItem}>| {resume.portfolio_url.replace(/^https?:\/\//, '')}</Text>}
            {resume.linkedin_url && <Text style={styles.contactItem}>| LinkedIn</Text>}
          </View>
        </View>

        {sectionOrder.map((sectionType) => {
          const sections = groupedSections[sectionType];
          if (!sections || sections.length === 0) return null;

          return (
            <View key={sectionType} style={styles.section}>
              <Text style={styles.sectionTitle}>{sections[0].title || sectionType}</Text>

              {sections.map((section: any) => (
                <View key={section.id}>
                  {section.section_type === 'summary' && <Text style={styles.summaryText}>{section.content?.text || ''}</Text>}

                  {section.section_type === 'experience' && (
                    <View style={styles.experienceItem}>
                      <View style={styles.experienceHeader}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.experienceTitle}>{section.content?.position || ''}</Text>
                          <Text style={styles.experienceCompany}>{section.content?.company || ''}</Text>
                        </View>
                        <Text style={styles.experienceDate}>
                          {section.content?.startDate || ''} - {section.content?.endDate || 'Present'}
                        </Text>
                      </View>
                      {section.content?.bullets && section.content.bullets.length > 0 && (
                        <View style={styles.bulletList}>
                          {section.content.bullets.map((bullet: string, i: number) => (
                            <View key={i} style={styles.bulletItem}>
                              <Text style={styles.bulletPoint}>•</Text>
                              <Text style={styles.bulletText}>{bullet}</Text>
                            </View>
                          ))}
                        </View>
                      )}
                    </View>
                  )}

                  {section.section_type === 'education' && (
                    <View style={styles.experienceItem}>
                      <View style={styles.experienceHeader}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.experienceTitle}>{section.content?.degree || ''}</Text>
                          <Text style={styles.experienceCompany}>{section.content?.institution || ''}</Text>
                        </View>
                        <Text style={styles.experienceDate}>{section.content?.year || ''}</Text>
                      </View>
                    </View>
                  )}

                  {section.section_type === 'skills' && <Text style={styles.skillsText}>{section.content?.items?.join(' • ') || ''}</Text>}

                  {section.section_type === 'projects' && (
                    <View style={styles.experienceItem}>
                      <Text style={styles.experienceTitle}>{section.content?.name || ''}</Text>
                      {section.content?.description && <Text style={styles.experienceCompany}>{section.content.description}</Text>}
                      {section.content?.bullets && section.content.bullets.length > 0 && (
                        <View style={styles.bulletList}>
                          {section.content.bullets.map((bullet: string, i: number) => (
                            <View key={i} style={styles.bulletItem}>
                              <Text style={styles.bulletPoint}>•</Text>
                              <Text style={styles.bulletText}>{bullet}</Text>
                            </View>
                          ))}
                        </View>
                      )}
                    </View>
                  )}

                  {section.section_type === 'certifications' && (
                    <View style={styles.experienceItem}>
                      <Text style={styles.experienceTitle}>{section.content?.name || ''}</Text>
                      {section.content?.issuer && <Text style={styles.experienceCompany}>{section.content.issuer}</Text>}
                      {section.content?.date && <Text style={styles.experienceDate}>{section.content.date}</Text>}
                    </View>
                  )}
                </View>
              ))}
            </View>
          );
        })}
      </Page>
    </Document>
  );
};
