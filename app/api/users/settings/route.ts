import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';

export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createSupabaseServerClient();
    
    // Get or create user settings
    const { data: user, error } = await supabase
      .from('users')
      .select('content_language')
      .eq('clerk_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching user settings:', error);
      return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
    }

    if (!user) {
      // Create user record with defaults
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          clerk_id: userId,
          content_language: 'en',
        })
        .select('content_language')
        .single();

      if (createError) {
        console.error('Error creating user record:', createError);
        return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
      }

      return NextResponse.json({
        settings: {
          content_language: newUser.content_language || 'en',
        },
      });
    }

    return NextResponse.json({
      settings: {
        content_language: user.content_language || 'en',
      },
    });
  } catch (error) {
    console.error('Error in GET /api/users/settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { content_language } = body;

    // Validate language
    if (!content_language || !['en', 'pt'].includes(content_language)) {
      return NextResponse.json({ error: 'Invalid language' }, { status: 400 });
    }

    const supabase = createSupabaseServerClient();
    
    // Upsert user settings
    const { error } = await supabase
      .from('users')
      .upsert({
        clerk_id: userId,
        content_language,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'clerk_id',
      });

    if (error) {
      console.error('Error updating user settings:', error);
      return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      settings: {
        content_language,
      },
    });
  } catch (error) {
    console.error('Error in POST /api/users/settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
