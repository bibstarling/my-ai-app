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

interface ApprovalConfirmationEmailProps {
  userEmail: string;
  userName?: string;
  appUrl: string;
  appName: string;
}

export const ApprovalConfirmationEmail = ({
  userEmail,
  userName,
  appUrl,
  appName,
}: ApprovalConfirmationEmailProps) => {
  const previewText = `Your ${appName} account has been approved!`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Account Approved! 🎉</Heading>
          <Text style={text}>
            Hi {userName || 'there'},
          </Text>
          <Text style={text}>
            Great news! Your {appName} account has been approved by our admin
            team.
          </Text>
          <Section style={successBox}>
            <Text style={successText}>
              ✅ Your account is now fully activated
            </Text>
          </Section>
          <Text style={text}>
            You now have full access to all features, including:
          </Text>
          <Text style={listItem}>• AI-powered resume builder</Text>
          <Text style={listItem}>• Cover letter generator</Text>
          <Text style={listItem}>• Job search and matching</Text>
          <Text style={listItem}>• Application tracking</Text>
          <Text style={listItem}>• And much more!</Text>
          <Section style={buttonContainer}>
            <Button style={button} href={`${appUrl}/dashboard`}>
              Go to Dashboard
            </Button>
          </Section>
          <Text style={text}>
            We're excited to help you in your job search journey!
          </Text>
          <Hr style={hr} />
          <Text style={footer}>
            If you have any questions, feel free to reach out to our support
            team.
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default ApprovalConfirmationEmail;

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

const successBox = {
  backgroundColor: '#d4edda',
  borderLeft: '4px solid #28a745',
  borderRadius: '4px',
  padding: '16px 20px',
  margin: '20px 48px',
};

const successText = {
  color: '#155724',
  fontSize: '16px',
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
  backgroundColor: '#28a745',
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
