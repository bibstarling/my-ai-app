import { NextResponse } from 'next/server';
import { render } from '@react-email/render';
import WelcomeEmail from '@/lib/email/templates/WelcomeEmail';
import WaitingApprovalEmail from '@/lib/email/templates/WaitingApprovalEmail';
import ApprovalConfirmationEmail from '@/lib/email/templates/ApprovalConfirmationEmail';
import PasswordResetEmail from '@/lib/email/templates/PasswordResetEmail';
import JobApplicationEmail from '@/lib/email/templates/JobApplicationEmail';
import DocumentReadyEmail from '@/lib/email/templates/DocumentReadyEmail';
import { emailConfig } from '@/lib/email/config';

/**
 * GET /api/email/preview?template=welcome
 * 
 * Preview email templates in the browser for testing
 * Available templates: welcome, waiting-approval, approval, password-reset, job-application, document-ready
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const template = searchParams.get('template') || 'welcome';

  let html: string;

  try {
    switch (template) {
      case 'welcome':
        html = await render(
          WelcomeEmail({
            userEmail: 'user@example.com',
            userName: 'John Doe',
            appUrl: emailConfig.appUrl,
            appName: emailConfig.appName,
          })
        );
        break;

      case 'waiting-approval':
        html = await render(
          WaitingApprovalEmail({
            userEmail: 'user@example.com',
            userName: 'John Doe',
            appName: emailConfig.appName,
          })
        );
        break;

      case 'approval':
        html = await render(
          ApprovalConfirmationEmail({
            userEmail: 'user@example.com',
            userName: 'John Doe',
            appUrl: emailConfig.appUrl,
            appName: emailConfig.appName,
          })
        );
        break;

      case 'password-reset':
        html = await render(
          PasswordResetEmail({
            userEmail: 'user@example.com',
            userName: 'John Doe',
            resetUrl: `${emailConfig.appUrl}/reset-password?token=abc123`,
            appName: emailConfig.appName,
          })
        );
        break;

      case 'job-application':
        html = await render(
          JobApplicationEmail({
            userName: 'John Doe',
            jobTitle: 'Senior Product Manager',
            companyName: 'TechCorp Inc.',
            matchPercentage: 85,
            appUrl: emailConfig.appUrl,
            jobDetailsUrl: `${emailConfig.appUrl}/work/123`,
            appName: emailConfig.appName,
          })
        );
        break;

      case 'document-ready':
        const docType = searchParams.get('docType') as 'resume' | 'cover-letter' || 'resume';
        html = await render(
          DocumentReadyEmail({
            userName: 'John Doe',
            documentType: docType,
            documentTitle: docType === 'resume' 
              ? 'Product Manager Resume' 
              : 'Cover Letter for TechCorp',
            documentUrl: `${emailConfig.appUrl}/${docType === 'resume' ? 'resume-builder' : 'cover-letters'}/123`,
            appName: emailConfig.appName,
          })
        );
        break;

      default:
        return NextResponse.json(
          { 
            error: 'Invalid template',
            available: [
              'welcome',
              'waiting-approval',
              'approval',
              'password-reset',
              'job-application',
              'document-ready (add ?docType=resume or ?docType=cover-letter)',
            ],
          },
          { status: 400 }
        );
    }

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
      },
    });
  } catch (error) {
    console.error('Error rendering email template:', error);
    return NextResponse.json(
      { error: 'Failed to render template' },
      { status: 500 }
    );
  }
}
