import { NextResponse } from 'next/server';
import { auth, currentUser, createClerkClient } from '@clerk/nextjs/server';
import { getSupabaseServiceRole } from '@/lib/supabase-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    // Try to get auth from multiple sources
    const authData = await auth();
    const user = await currentUser();
    
    // Try to get token from Authorization header
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    console.log('[API Config GET] Auth methods:', { 
      authUserId: authData?.userId, 
      currentUserId: user?.id,
      hasToken: !!token,
      authHeader: authHeader?.substring(0, 20)
    });
    
    let userId = authData?.userId || user?.id;
    
    // If we have a token but no userId, try to verify the token
    if (!userId && token) {
      try {
        const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY! });
        const verified = await clerkClient.verifyToken(token, {
          jwtKey: process.env.CLERK_JWT_KEY,
        });
        userId = verified.sub;
        console.log('[API Config GET] Verified token, userId:', userId);
      } catch (error) {
        console.error('[API Config GET] Token verification failed:', error);
      }
    }
    
    if (!userId) {
      console.error('[API Config GET] No user found from any method');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseServiceRole();
    
    const { data, error } = await supabase
      .from('user_api_configs')
      .select('provider, is_active')
      .eq('clerk_id', userId)
      .eq('is_active', true)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching API config:', error);
      return NextResponse.json({ error: 'Failed to fetch configuration' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      config: data ? {
        provider: data.provider,
        apiKey: '***************', // Never return the actual key
        isActive: data.is_active,
      } : null,
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const authData = await auth();
    const user = await currentUser();
    
    // Try to get token from Authorization header
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    console.log('[API Config POST] Auth methods:', { 
      authUserId: authData?.userId, 
      currentUserId: user?.id,
      hasToken: !!token
    });
    
    let userId = authData?.userId || user?.id;
    
    // If we have a token but no userId, try to verify the token
    if (!userId && token) {
      try {
        const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY! });
        const verified = await clerkClient.verifyToken(token, {
          jwtKey: process.env.CLERK_JWT_KEY,
        });
        userId = verified.sub;
        console.log('[API Config POST] Verified token, userId:', userId);
      } catch (error) {
        console.error('[API Config POST] Token verification failed:', error);
      }
    }
    
    if (!userId) {
      console.error('[API Config POST] No user found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { provider, apiKey } = await req.json();

    if (!provider || !apiKey) {
      return NextResponse.json({ error: 'Provider and API key are required' }, { status: 400 });
    }

    if (!['anthropic', 'openai', 'groq'].includes(provider)) {
      return NextResponse.json({ error: 'Invalid provider' }, { status: 400 });
    }

    const supabase = getSupabaseServiceRole();

    // Deactivate any existing configs
    await supabase
      .from('user_api_configs')
      .update({ is_active: false })
      .eq('clerk_id', userId);

    // Insert or update the new config
    const { data, error } = await supabase
      .from('user_api_configs')
      .upsert({
        clerk_id: userId,
        provider,
        api_key: apiKey, // In production, encrypt this!
        is_active: true,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving API config:', error);
      return NextResponse.json({ error: 'Failed to save configuration' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      config: {
        provider: data.provider,
        apiKey: '***************',
        isActive: data.is_active,
      },
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const authData = await auth();
    const user = await currentUser();
    
    // Try to get token from Authorization header
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    console.log('[API Config DELETE] Auth methods:', { 
      authUserId: authData?.userId, 
      currentUserId: user?.id,
      hasToken: !!token
    });
    
    let userId = authData?.userId || user?.id;
    
    // If we have a token but no userId, try to verify the token
    if (!userId && token) {
      try {
        const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY! });
        const verified = await clerkClient.verifyToken(token, {
          jwtKey: process.env.CLERK_JWT_KEY,
        });
        userId = verified.sub;
        console.log('[API Config DELETE] Verified token, userId:', userId);
      } catch (error) {
        console.error('[API Config DELETE] Token verification failed:', error);
      }
    }
    
    if (!userId) {
      console.error('[API Config DELETE] No user found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseServiceRole();

    // Deactivate all configs for this user
    const { error } = await supabase
      .from('user_api_configs')
      .update({ is_active: false })
      .eq('clerk_id', userId);

    if (error) {
      console.error('Error removing API config:', error);
      return NextResponse.json({ error: 'Failed to remove configuration' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
