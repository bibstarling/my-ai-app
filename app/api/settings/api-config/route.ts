import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getSupabaseServiceRole } from '@/lib/supabase-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const authResult = await auth();
    console.log('[API Config GET] Auth result:', { userId: authResult?.userId, hasAuth: !!authResult });
    
    const { userId } = authResult;
    
    if (!userId) {
      console.error('[API Config GET] No userId found in auth');
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
    const authResult = await auth();
    console.log('[API Config POST] Auth result:', { userId: authResult?.userId, hasAuth: !!authResult });
    
    const { userId } = authResult;
    
    if (!userId) {
      console.error('[API Config POST] No userId found in auth');
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

export async function DELETE() {
  try {
    const authResult = await auth();
    console.log('[API Config DELETE] Auth result:', { userId: authResult?.userId, hasAuth: !!authResult });
    
    const { userId } = authResult;
    
    if (!userId) {
      console.error('[API Config DELETE] No userId found in auth');
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
