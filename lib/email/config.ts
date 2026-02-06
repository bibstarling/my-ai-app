import { Resend } from 'resend';

// Lazy initialization of Resend client
let resendInstance: Resend | null = null;

export const getResend = () => {
  if (!resendInstance) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.warn('RESEND_API_KEY not configured. Email functionality will be disabled.');
      return null;
    }
    resendInstance = new Resend(apiKey);
  }
  return resendInstance;
};

// Email configuration
export const emailConfig = {
  from: process.env.EMAIL_FROM || 'My AI App <onboarding@resend.dev>',
  replyTo: process.env.EMAIL_REPLY_TO,
  appName: 'My AI App',
  appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  supportEmail: process.env.SUPPORT_EMAIL || 'support@example.com',
};

export type EmailConfig = typeof emailConfig;
