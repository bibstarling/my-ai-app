import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

interface DocumentReadyEmailProps {
  userName?: string;
  documentType: 'resume' | 'cover-letter';
  documentTitle?: string;
  documentUrl: string;
  appName: string;
}

export const DocumentReadyEmail = ({
  userName,
  documentType,
  documentTitle,
  documentUrl,
  appName,
}: DocumentReadyEmailProps) => {
  const docTypeName =
    documentType === 'resume' ? 'Resume' : 'Cover Letter';
  const previewText = `Your ${docTypeName} is ready!`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Your {docTypeName} is Ready! ✨</Heading>
          <Text style={text}>
            Hi {userName || 'there'},
          </Text>
          <Text style={text}>
            Great news! Your AI-generated {docTypeName.toLowerCase()} has been
            successfully created and is ready for review.
          </Text>
          {documentTitle && (
            <Section style={docBox}>
              <Text style={docTitle}>📄 {documentTitle}</Text>
            </Section>
          )}
          <Section style={buttonContainer}>
            <Button style={button} href={documentUrl}>
              View {docTypeName}
            </Button>
          </Section>
          <Text style={text}>
            <strong>What you can do now:</strong>
          </Text>
          <Text style={listItem}>
            • Review and edit your {docTypeName.toLowerCase()}
          </Text>
          <Text style={listItem}>
            • Download as PDF for job applications
          </Text>
          <Text style={listItem}>
            • Adapt it for specific job opportunities
          </Text>
          {documentType === 'resume' && (
            <Text style={listItem}>
              • Generate a matching cover letter
            </Text>
          )}
          <Section style={tipBox}>
            <Text style={tipTitle}>💡 Pro Tip</Text>
            <Text style={tipText}>
              {documentType === 'resume'
                ? 'Tailor your resume for each job application to increase your match percentage and improve your chances of getting interviews.'
                : 'A personalized cover letter can significantly improve your application success rate. Make sure to customize it for each position.'}
            </Text>
          </Section>
          <Hr style={hr} />
          <Text style={footer}>
            All your documents are saved in your {appName} dashboard for easy
            access.
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default DocumentReadyEmail;

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  borderRadius: '8px',
  maxWidth: '600px',
};

const h1 = {
  color: '#1a1a1a',
  fontSize: '32px',
  fontWeight: 'bold',
  margin: '40px 0',
  padding: '0 48px',
};

const text = {
  color: '#444',
  fontSize: '16px',
  lineHeight: '26px',
  padding: '0 48px',
  marginBottom: '16px',
};

const docBox = {
  backgroundColor: '#f8f9fa',
  borderRadius: '8px',
  padding: '20px',
  margin: '20px 48px',
  textAlign: 'center' as const,
};

const docTitle = {
  color: '#1a1a1a',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '0',
};

const buttonContainer = {
  padding: '27px 48px',
};

const button = {
  backgroundColor: '#5469d4',
  borderRadius: '4px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  padding: '12px 20px',
};

const listItem = {
  color: '#444',
  fontSize: '16px',
  lineHeight: '26px',
  padding: '4px 48px 4px 60px',
  margin: '0',
};

const tipBox = {
  backgroundColor: '#e7f3ff',
  borderLeft: '4px solid #0066cc',
  borderRadius: '4px',
  padding: '16px 20px',
  margin: '20px 48px',
};

const tipTitle = {
  color: '#0066cc',
  fontSize: '16px',
  fontWeight: 'bold',
  margin: '0 0 8px 0',
};

const tipText = {
  color: '#444',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '0',
};

const hr = {
  borderColor: '#e6ebf1',
  margin: '20px 48px',
};

const footer = {
  color: '#8898aa',
  fontSize: '12px',
  lineHeight: '16px',
  padding: '0 48px',
};
