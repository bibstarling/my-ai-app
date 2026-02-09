import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

interface WelcomeEmailProps {
  userEmail: string;
  userName?: string;
  appUrl: string;
  appName: string;
}

export const WelcomeEmail = ({
  userEmail,
  userName,
  appUrl,
  appName,
}: WelcomeEmailProps) => {
  const previewText = `Welcome to ${appName}!`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Welcome to {appName}! 🎉</Heading>
          <Text style={text}>
            Hi {userName || 'there'},
          </Text>
          <Text style={text}>
            Thank you for signing up! We're excited to have you on board.
          </Text>
          <Text style={text}>
            Your account has been created with the email:{' '}
            <strong>{userEmail}</strong>
          </Text>
          <Text style={text}>
            <strong>🚀 First Step:</strong> Build your professional profile - it powers everything! Chat with AI, upload your resume, or paste your LinkedIn URL. Your profile feeds all your resumes, cover letters, and job matching.
          </Text>
          <Text style={text}>
            <strong>💡 Pro Tip:</strong> Press Cmd+K (or Ctrl+K) from anywhere in the app to ask AI for help with anything!
          </Text>
          <Section style={buttonContainer}>
            <Button style={button} href={appUrl}>
              Get Started
            </Button>
          </Section>
          <Text style={text}>
            If you have any questions or need assistance, feel free to reach
            out to our support team.
          </Text>
          <Hr style={hr} />
          <Text style={footer}>
            You're receiving this email because you signed up for {appName}.
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default WelcomeEmail;

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
