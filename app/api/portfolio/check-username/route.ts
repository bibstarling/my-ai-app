import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { validateUsernameFormat, isUsernameAvailable } from '@/lib/username';

/**
 * GET /api/portfolio/check-username?username=xyz
 * Check if a username is available
 */
export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');

    if (!username) {
      return NextResponse.json(
        { error: 'Username parameter is required' },
        { status: 400 }
      );
    }

    // Validate format
    const validation = validateUsernameFormat(username);
    if (!validation.valid) {
      return NextResponse.json({
        available: false,
        error: validation.error,
      });
    }

    // Check availability
    const available = await isUsernameAvailable(
      username,
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      userId
    );

    return NextResponse.json({
      available,
      error: available ? null : 'Username is already taken',
    });
  } catch (error) {
    console.error('GET /api/portfolio/check-username error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
