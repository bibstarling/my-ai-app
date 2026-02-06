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

interface JobApplicationEmailProps {
  userName?: string;
  jobTitle: string;
  companyName: string;
  matchPercentage?: number;
  appUrl: string;
  jobDetailsUrl: string;
  appName: string;
}

export const JobApplicationEmail = ({
  userName,
  jobTitle,
  companyName,
  matchPercentage,
  appUrl,
  jobDetailsUrl,
  appName,
}: JobApplicationEmailProps) => {
  const previewText = `Application submitted for ${jobTitle} at ${companyName}`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Application Submitted! 📝</Heading>
          <Text style={text}>
            Hi {userName || 'there'},
          </Text>
          <Text style={text}>
            Your job application has been successfully prepared and tracked in
            your dashboard.
          </Text>
          <Section style={jobBox}>
            <Text style={jobTitle}>
              <strong>{jobTitle}</strong>
            </Text>
            <Text style={companyText}>{companyName}</Text>
            {matchPercentage && (
              <Section style={matchBadge}>
                <Text style={matchText}>{matchPercentage}% Match</Text>
              </Section>
            )}
          </Section>
          <Text style={text}>
            <strong>What we prepared for you:</strong>
          </Text>
          <Text style={listItem}>
            ✓ Tailored resume matching the job requirements
          </Text>
          <Text style={listItem}>
            ✓ Custom cover letter highlighting your relevant experience
          </Text>
          <Text style={listItem}>
            ✓ Application questions with AI-generated answers
          </Text>
          <Section style={buttonContainer}>
            <Button style={button} href={jobDetailsUrl}>
              View Application Details
            </Button>
          </Section>
          <Text style={text}>
            <strong>Next Steps:</strong>
          </Text>
          <Text style={listItem}>
            • Review your tailored documents in the dashboard
          </Text>
          <Text style={listItem}>
            • Make any final adjustments if needed
          </Text>
          <Text style={listItem}>
            • Submit your application to the company
          </Text>
          <Hr style={hr} />
          <Text style={footer}>
            Track all your applications in your {appName} dashboard.
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default JobApplicationEmail;

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

const jobBox = {
  backgroundColor: '#f8f9fa',
  borderRadius: '8px',
  padding: '24px',
  margin: '20px 48px',
  borderLeft: '4px solid #5469d4',
};

const jobTitle = {
  color: '#1a1a1a',
  fontSize: '20px',
  fontWeight: 'bold',
  margin: '0 0 8px 0',
};

const companyText = {
  color: '#666',
  fontSize: '16px',
  margin: '0 0 12px 0',
};

const matchBadge = {
  backgroundColor: '#28a745',
  borderRadius: '4px',
  padding: '6px 12px',
  display: 'inline-block',
};

const matchText = {
  color: '#fff',
  fontSize: '14px',
  fontWeight: 'bold',
  margin: '0',
};

const listItem = {
  color: '#444',
  fontSize: '16px',
  lineHeight: '26px',
  padding: '4px 48px 4px 60px',
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
