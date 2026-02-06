import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { sendWelcomeEmail } from '@/lib/email';

/**
 * POST /api/email/test
 * 
 * Test email sending functionality (development only)
 * Send a test welcome email to yourself
 */
export async function POST(request: Request) {
  try {
    // Only allow in development
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'Test endpoint not available in production' },
        { status: 403 }
      );
    }

    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { email, name } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email address is required' },
        { status: 400 }
      );
    }

    // Send test email
    const result = await sendWelcomeEmail({
      to: email,
      userName: name || 'Test User',
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `Test email sent to ${email}`,
        emailId: result.data?.id,
      });
    } else {
      return NextResponse.json(
        { 
          success: false,
          error: 'Failed to send email',
          details: result.error,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('POST /api/email/test error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
