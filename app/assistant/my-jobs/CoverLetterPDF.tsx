import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

// Define styles
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 11,
    fontFamily: 'Helvetica',
    lineHeight: 1.6,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 8,
    color: '#1a1a1a',
  },
  date: {
    fontSize: 10,
    color: '#6b7280',
    marginBottom: 16,
  },
  body: {
    fontSize: 11,
    color: '#4a5568',
    lineHeight: 1.8,
    textAlign: 'justify',
  },
  paragraph: {
    marginBottom: 12,
  },
  signature: {
    marginTop: 24,
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#1a1a1a',
  },
});

interface CoverLetterData {
  job_title?: string;
  job_company?: string;
  content?: string;
  user_name?: string;
  created_at?: string;
}

interface CoverLetterPDFProps {
  coverLetter: CoverLetterData;
}

export const CoverLetterPDF: React.FC<CoverLetterPDFProps> = ({ coverLetter }) => {
  // Split content into paragraphs
  const paragraphs = coverLetter.content?.split('\n\n').filter(p => p.trim()) || [];
  
  // Format date
  const date = coverLetter.created_at 
    ? new Date(coverLetter.created_at).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
    : new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>
            {coverLetter.job_title} at {coverLetter.job_company}
          </Text>
          <Text style={styles.date}>{date}</Text>
        </View>

        {/* Body */}
        <View style={styles.body}>
          {paragraphs.map((paragraph, index) => (
            <Text key={index} style={styles.paragraph}>
              {paragraph.trim()}
            </Text>
          ))}
        </View>

        {/* Signature */}
        {coverLetter.user_name && (
          <Text style={styles.signature}>
            Sincerely,{'\n'}
            {coverLetter.user_name}
          </Text>
        )}
      </Page>
    </Document>
  );
};
