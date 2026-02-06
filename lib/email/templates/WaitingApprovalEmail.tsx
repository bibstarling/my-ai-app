import {
  Body,
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

interface WaitingApprovalEmailProps {
  userEmail: string;
  userName?: string;
  appName: string;
}

export const WaitingApprovalEmail = ({
  userEmail,
  userName,
  appName,
}: WaitingApprovalEmailProps) => {
  const previewText = `Your ${appName} account is pending approval`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Account Pending Approval ⏳</Heading>
          <Text style={text}>
            Hi {userName || 'there'},
          </Text>
          <Text style={text}>
            Thank you for registering with {appName}! Your account has been
            successfully created.
          </Text>
          <Section style={infoBox}>
            <Text style={infoText}>
              <strong>Email:</strong> {userEmail}
            </Text>
            <Text style={infoText}>
              <strong>Status:</strong> Pending Admin Approval
            </Text>
          </Section>
          <Text style={text}>
            Your account is currently waiting for admin approval. This is a
            security measure to ensure the quality and safety of our community.
          </Text>
          <Text style={text}>
            You'll receive another email once your account has been approved.
            This usually takes 24-48 hours.
          </Text>
          <Text style={text}>
            <strong>What happens next?</strong>
          </Text>
          <Text style={listItem}>• Our team will review your account</Text>
          <Text style={listItem}>
            • You'll receive an approval confirmation email
          </Text>
          <Text style={listItem}>
            • You'll gain full access to all features
          </Text>
          <Hr style={hr} />
          <Text style={footer}>
            If you have any questions, please don't hesitate to contact our
            support team.
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default WaitingApprovalEmail;

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

const infoBox = {
  backgroundColor: '#f8f9fa',
  borderRadius: '4px',
  padding: '20px',
  margin: '20px 48px',
};

const infoText = {
  color: '#444',
  fontSize: '14px',
  lineHeight: '24px',
  margin: '4px 0',
};

const listItem = {
  color: '#444',
  fontSize: '16px',
  lineHeight: '26px',
  padding: '4px 48px 4px 60px',
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
