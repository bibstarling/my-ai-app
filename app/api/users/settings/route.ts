import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { getSupabaseServiceRole } from '@/lib/supabase-server';

export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseServiceRole();
    
    // Get or create user settings
    const { data: user, error } = await supabase
      .from('users')
      .select('content_language, onboarding_completed')
      .eq('clerk_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching user settings:', error);
      return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
    }

    if (!user) {
      // Get user info from Clerk to save email
      const clerkUser = await currentUser();
      const userEmail = clerkUser?.emailAddresses?.[0]?.emailAddress;
      
      // Create user record with defaults
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          clerk_id: userId,
          email: userEmail || null,
          content_language: 'en',
          onboarding_completed: false,
        })
        .select('content_language, onboarding_completed')
        .single();

      if (createError) {
        console.error('Error creating user record:', createError);
        return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
      }

      return NextResponse.json({
        settings: {
          content_language: newUser.content_language || 'en',
          onboarding_completed: newUser.onboarding_completed || false,
        },
      });
    }

    return NextResponse.json({
      settings: {
        content_language: user.content_language || 'en',
        onboarding_completed: user.onboarding_completed || false,
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
    if (!content_language || !['en', 'pt-BR'].includes(content_language)) {
      return NextResponse.json({ error: 'Invalid language' }, { status: 400 });
    }

    const supabase = getSupabaseServiceRole();
    
    // Get user info from Clerk to ensure email is saved
    const clerkUser = await currentUser();
    const userEmail = clerkUser?.emailAddresses?.[0]?.emailAddress;
    
    // Upsert user settings
    const { error } = await supabase
      .from('users')
      .upsert({
        clerk_id: userId,
        email: userEmail || null,
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

export async function PATCH(request: Request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Get user info from Clerk to ensure email is saved
    const clerkUser = await currentUser();
    const userEmail = clerkUser?.emailAddresses?.[0]?.emailAddress;
    
    const updates: Record<string, any> = {
      clerk_id: userId,
      email: userEmail || null,
      updated_at: new Date().toISOString(),
    };

    // Handle onboarding completion
    if ('onboarding_completed' in body) {
      updates.onboarding_completed = body.onboarding_completed;
      if (body.onboarding_completed) {
        updates.onboarding_completed_at = new Date().toISOString();
      }
    }

    // Handle language preference
    if ('content_language' in body) {
      if (!['en', 'pt-BR'].includes(body.content_language)) {
        return NextResponse.json({ error: 'Invalid language' }, { status: 400 });
      }
      updates.content_language = body.content_language;
    }

    const supabase = getSupabaseServiceRole();
    
    // Upsert user settings
    const { error } = await supabase
      .from('users')
      .upsert(updates, {
        onConflict: 'clerk_id',
      });

    if (error) {
      console.error('Error updating user settings:', error);
      return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      settings: updates,
    });
  } catch (error) {
    console.error('Error in PATCH /api/users/settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
