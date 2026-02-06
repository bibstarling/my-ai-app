import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';

/**
 * GET /api/debug-auth - Debug Clerk authentication
 */
export async function GET() {
  try {
    const authData = await auth();
    const user = await currentUser();
    
    return NextResponse.json({
      authData: {
        userId: authData.userId,
        sessionId: authData.sessionId,
        orgId: authData.orgId,
      },
      currentUser: user ? {
        id: user.id,
        email: user.emailAddresses[0]?.emailAddress,
        firstName: user.firstName,
        lastName: user.lastName,
      } : null,
      env: {
        hasPublishableKey: !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
        hasSecretKey: !!process.env.CLERK_SECRET_KEY,
      }
    });
  } catch (error: any) {
    console.error('Debug auth error:', error);
    return NextResponse.json(
      { error: error.message, stack: error.stack },
      { status: 500 }
    );
  }
}
