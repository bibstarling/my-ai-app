import { Resend } from 'resend';

// Initialize Resend with API key
export const resend = new Resend(process.env.RESEND_API_KEY);

// Email configuration
export const emailConfig = {
  from: process.env.EMAIL_FROM || 'My AI App <onboarding@resend.dev>',
  replyTo: process.env.EMAIL_REPLY_TO,
  appName: 'My AI App',
  appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  supportEmail: process.env.SUPPORT_EMAIL || 'support@example.com',
};

export type EmailConfig = typeof emailConfig;
