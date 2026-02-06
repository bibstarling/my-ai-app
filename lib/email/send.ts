import { render } from '@react-email/render';
import { getResend, emailConfig } from './config';
import { shouldSendEmailByAddress } from './preferences';
import WelcomeEmail from './templates/WelcomeEmail';
import WaitingApprovalEmail from './templates/WaitingApprovalEmail';
import ApprovalConfirmationEmail from './templates/ApprovalConfirmationEmail';
import PasswordResetEmail from './templates/PasswordResetEmail';
import JobApplicationEmail from './templates/JobApplicationEmail';
import DocumentReadyEmail from './templates/DocumentReadyEmail';

interface BaseEmailParams {
  to: string;
  userName?: string;
  skipPreferenceCheck?: boolean; // For critical emails that must be sent
}

// Send welcome email
export async function sendWelcomeEmail({ to, userName, skipPreferenceCheck = false }: BaseEmailParams) {
  try {
    // Check user preferences (account emails)
    if (!skipPreferenceCheck) {
      const shouldSend = await shouldSendEmailByAddress(to, 'account');
      if (!shouldSend) {
        console.log('Welcome email skipped due to user preferences:', to);
        return { success: true, skipped: true };
      }
    }

    const resend = getResend();
    if (!resend) {
      console.log('Resend not configured, skipping welcome email');
      return { success: true, skipped: true };
    }

    const html = await render(
      WelcomeEmail({
        userEmail: to,
        userName,
        appUrl: emailConfig.appUrl,
        appName: emailConfig.appName,
      })
    );

    const { data, error } = await resend.emails.send({
      from: emailConfig.from,
      to: [to],
      subject: `Welcome to ${emailConfig.appName}!`,
      html,
    });

    if (error) {
      console.error('Failed to send welcome email:', error);
      return { success: false, error };
    }

    console.log('Welcome email sent successfully:', data?.id);
    return { success: true, data };
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return { success: false, error };
  }
}

// Send waiting for approval email
export async function sendWaitingApprovalEmail({
  to,
  userName,
  skipPreferenceCheck = false,
}: BaseEmailParams) {
  try {
    // Check user preferences (account emails)
    if (!skipPreferenceCheck) {
      const shouldSend = await shouldSendEmailByAddress(to, 'account');
      if (!shouldSend) {
        console.log('Waiting approval email skipped due to user preferences:', to);
        return { success: true, skipped: true };
      }
    }

    const resend = getResend();
    if (!resend) {
      console.log('Resend not configured, skipping waiting approval email');
      return { success: true, skipped: true };
    }

    const html = await render(
      WaitingApprovalEmail({
        userEmail: to,
        userName,
        appName: emailConfig.appName,
      })
    );

    const { data, error } = await resend.emails.send({
      from: emailConfig.from,
      to: [to],
      subject: `Account Pending Approval - ${emailConfig.appName}`,
      html,
    });

    if (error) {
      console.error('Failed to send waiting approval email:', error);
      return { success: false, error };
    }

    console.log('Waiting approval email sent successfully:', data?.id);
    return { success: true, data };
  } catch (error) {
    console.error('Error sending waiting approval email:', error);
    return { success: false, error };
  }
}

// Send approval confirmation email
export async function sendApprovalConfirmationEmail({
  to,
  userName,
  skipPreferenceCheck = false,
}: BaseEmailParams) {
  try {
    // Check user preferences (account emails)
    if (!skipPreferenceCheck) {
      const shouldSend = await shouldSendEmailByAddress(to, 'account');
      if (!shouldSend) {
        console.log('Approval confirmation email skipped due to user preferences:', to);
        return { success: true, skipped: true };
      }
    }

    const resend = getResend();
    if (!resend) {
      console.log('Resend not configured, skipping approval confirmation email');
      return { success: true, skipped: true };
    }

    const html = await render(
      ApprovalConfirmationEmail({
        userEmail: to,
        userName,
        appUrl: emailConfig.appUrl,
        appName: emailConfig.appName,
      })
    );

    const { data, error } = await resend.emails.send({
      from: emailConfig.from,
      to: [to],
      subject: `Account Approved! - ${emailConfig.appName}`,
      html,
    });

    if (error) {
      console.error('Failed to send approval confirmation email:', error);
      return { success: false, error };
    }

    console.log('Approval confirmation email sent successfully:', data?.id);
    return { success: true, data };
  } catch (error) {
    console.error('Error sending approval confirmation email:', error);
    return { success: false, error };
  }
}

// Send password reset email
interface PasswordResetParams extends BaseEmailParams {
  resetUrl: string;
}

export async function sendPasswordResetEmail({
  to,
  userName,
  resetUrl,
  skipPreferenceCheck = true, // Password reset is critical, always send
}: PasswordResetParams) {
  try {
    // Password reset emails are critical security emails
    // Check preferences only if explicitly requested
    if (!skipPreferenceCheck) {
      const shouldSend = await shouldSendEmailByAddress(to, 'account');
      if (!shouldSend) {
        console.log('Password reset email skipped due to user preferences:', to);
        return { success: true, skipped: true };
      }
    }

    const resend = getResend();
    if (!resend) {
      console.log('Resend not configured, skipping password reset email');
      return { success: true, skipped: true };
    }

    const html = await render(
      PasswordResetEmail({
        userEmail: to,
        userName,
        resetUrl,
        appName: emailConfig.appName,
      })
    );

    const { data, error } = await resend.emails.send({
      from: emailConfig.from,
      to: [to],
      subject: `Reset Your Password - ${emailConfig.appName}`,
      html,
    });

    if (error) {
      console.error('Failed to send password reset email:', error);
      return { success: false, error };
    }

    console.log('Password reset email sent successfully:', data?.id);
    return { success: true, data };
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return { success: false, error };
  }
}

// Send job application email
interface JobApplicationParams extends BaseEmailParams {
  jobTitle: string;
  companyName: string;
  matchPercentage?: number;
  jobDetailsUrl: string;
}

export async function sendJobApplicationEmail({
  to,
  userName,
  jobTitle,
  companyName,
  matchPercentage,
  jobDetailsUrl,
  skipPreferenceCheck = false,
}: JobApplicationParams) {
  try {
    // Check user preferences (application emails)
    if (!skipPreferenceCheck) {
      const shouldSend = await shouldSendEmailByAddress(to, 'application');
      if (!shouldSend) {
        console.log('Job application email skipped due to user preferences:', to);
        return { success: true, skipped: true };
      }
    }

    const resend = getResend();
    if (!resend) {
      console.log('Resend not configured, skipping job application email');
      return { success: true, skipped: true };
    }

    const html = await render(
      JobApplicationEmail({
        userName,
        jobTitle,
        companyName,
        matchPercentage,
        appUrl: emailConfig.appUrl,
        jobDetailsUrl,
        appName: emailConfig.appName,
      })
    );

    const { data, error } = await resend.emails.send({
      from: emailConfig.from,
      to: [to],
      subject: `Application Prepared: ${jobTitle} at ${companyName}`,
      html,
    });

    if (error) {
      console.error('Failed to send job application email:', error);
      return { success: false, error };
    }

    console.log('Job application email sent successfully:', data?.id);
    return { success: true, data };
  } catch (error) {
    console.error('Error sending job application email:', error);
    return { success: false, error };
  }
}

// Send document ready email
interface DocumentReadyParams extends BaseEmailParams {
  documentType: 'resume' | 'cover-letter';
  documentTitle?: string;
  documentUrl: string;
}

export async function sendDocumentReadyEmail({
  to,
  userName,
  documentType,
  documentTitle,
  documentUrl,
  skipPreferenceCheck = false,
}: DocumentReadyParams) {
  try {
    // Check user preferences (document emails)
    if (!skipPreferenceCheck) {
      const shouldSend = await shouldSendEmailByAddress(to, 'document');
      if (!shouldSend) {
        console.log('Document ready email skipped due to user preferences:', to);
        return { success: true, skipped: true };
      }
    }

    const resend = getResend();
    if (!resend) {
      console.log('Resend not configured, skipping document ready email');
      return { success: true, skipped: true };
    }

    const html = await render(
      DocumentReadyEmail({
        userName,
        documentType,
        documentTitle,
        documentUrl,
        appName: emailConfig.appName,
      })
    );

    const docTypeName =
      documentType === 'resume' ? 'Resume' : 'Cover Letter';

    const { data, error } = await resend.emails.send({
      from: emailConfig.from,
      to: [to],
      subject: `Your ${docTypeName} is Ready!`,
      html,
    });

    if (error) {
      console.error('Failed to send document ready email:', error);
      return { success: false, error };
    }

    console.log('Document ready email sent successfully:', data?.id);
    return { success: true, data };
  } catch (error) {
    console.error('Error sending document ready email:', error);
    return { success: false, error };
  }
}

// Generic email sender for custom use cases
interface CustomEmailParams {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
}

export async function sendCustomEmail({
  to,
  subject,
  html,
  replyTo,
}: CustomEmailParams) {
  try {
    const resend = getResend();
    if (!resend) {
      console.log('Resend not configured, skipping custom email');
      return { success: true, skipped: true };
    }

    const { data, error } = await resend.emails.send({
      from: emailConfig.from,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      replyTo: replyTo || emailConfig.replyTo,
    });

    if (error) {
      console.error('Failed to send custom email:', error);
      return { success: false, error };
    }

    console.log('Custom email sent successfully:', data?.id);
    return { success: true, data };
  } catch (error) {
    console.error('Error sending custom email:', error);
    return { success: false, error };
  }
}
