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

interface PasswordResetEmailProps {
  userEmail: string;
  userName?: string;
  resetUrl: string;
  appName: string;
}

export const PasswordResetEmail = ({
  userEmail,
  userName,
  resetUrl,
  appName,
}: PasswordResetEmailProps) => {
  const previewText = `Reset your ${appName} password`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Reset Your Password 🔐</Heading>
          <Text style={text}>
            Hi {userName || 'there'},
          </Text>
          <Text style={text}>
            We received a request to reset the password for your {appName}{' '}
            account ({userEmail}).
          </Text>
          <Section style={buttonContainer}>
            <Button style={button} href={resetUrl}>
              Reset Password
            </Button>
          </Section>
          <Text style={text}>
            This link will expire in 1 hour for security reasons.
          </Text>
          <Section style={warningBox}>
            <Text style={warningText}>
              ⚠️ If you didn't request this password reset, you can safely
              ignore this email. Your password will remain unchanged.
            </Text>
          </Section>
          <Text style={text}>
            For security purposes, never share this link with anyone.
          </Text>
          <Hr style={hr} />
          <Text style={footer}>
            If the button doesn't work, copy and paste this URL into your
            browser:
            <br />
            {resetUrl}
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default PasswordResetEmail;

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

const buttonContainer = {
  padding: '27px 48px',
};

const button = {
  backgroundColor: '#dc3545',
  borderRadius: '4px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  padding: '12px 20px',
};

const warningBox = {
  backgroundColor: '#fff3cd',
  borderLeft: '4px solid #ffc107',
  borderRadius: '4px',
  padding: '16px 20px',
  margin: '20px 48px',
};

const warningText = {
  color: '#856404',
  fontSize: '14px',
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
