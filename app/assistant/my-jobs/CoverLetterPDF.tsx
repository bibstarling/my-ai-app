import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

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

export const CoverLetterPDF = ({ coverLetter }: any) => {
  const date = coverLetter.created_at 
    ? new Date(coverLetter.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>
            {coverLetter.job_title} at {coverLetter.job_company}
          </Text>
          <Text style={styles.date}>{date}</Text>
        </View>

        <View style={styles.body}>
          {coverLetter.opening_paragraph && (
            <Text style={styles.paragraph}>{coverLetter.opening_paragraph}</Text>
          )}
          
          {coverLetter.body_paragraphs && coverLetter.body_paragraphs.map((paragraph: string, index: number) => (
            <Text key={index} style={styles.paragraph}>{paragraph}</Text>
          ))}
          
          {coverLetter.closing_paragraph && (
            <Text style={styles.paragraph}>{coverLetter.closing_paragraph}</Text>
          )}
        </View>

        <Text style={styles.signature}>
          Sincerely,{'\n'}
          Bianca Starling
        </Text>
      </Page>
    </Document>
  );
};
