import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { getSupabaseServiceRole } from '@/lib/supabase-server';
import jwt from 'jsonwebtoken';

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
    
    // If we have a token but no userId, decode it to get the user ID
    if (!userId && token) {
      try {
        const decoded = jwt.decode(token) as any;
        userId = decoded?.sub;
        console.log('[API Config GET] Decoded token, userId:', userId);
      } catch (error) {
        console.error('[API Config GET] Token decode failed:', error);
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
    
    // If we have a token but no userId, decode it to get the user ID
    if (!userId && token) {
      try {
        const decoded = jwt.decode(token) as any;
        userId = decoded?.sub;
        console.log('[API Config POST] Decoded token, userId:', userId);
      } catch (error) {
        console.error('[API Config POST] Token decode failed:', error);
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

    // Validate API key format
    const trimmedApiKey = apiKey.trim();
    if (!trimmedApiKey || trimmedApiKey.length < 10) {
      return NextResponse.json({ error: 'Invalid API key format' }, { status: 400 });
    }

    const supabase = getSupabaseServiceRole();

    console.log('[API Config POST] Saving config:', { 
      userId, 
      provider, 
      hasApiKey: !!trimmedApiKey,
      apiKeyLength: trimmedApiKey.length,
      apiKeyPrefix: trimmedApiKey.substring(0, 10)
    });

    // Deactivate any existing configs for this user
    const { error: deactivateError } = await supabase
      .from('user_api_configs')
      .update({ is_active: false })
      .eq('clerk_id', userId);

    if (deactivateError) {
      console.error('[API Config POST] Error deactivating old configs:', deactivateError);
    }

    // Insert or update the new config
    // The upsert uses the UNIQUE(clerk_id, provider) constraint
    const { data, error } = await supabase
      .from('user_api_configs')
      .upsert({
        clerk_id: userId,
        provider,
        api_key: trimmedApiKey, // In production, encrypt this!
        is_active: true,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'clerk_id,provider', // Specify the conflict columns
      })
      .select()
      .single();

    if (error) {
      console.error('[API Config POST] Error saving API config:', error);
      console.error('[API Config POST] Error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      });
      return NextResponse.json({ 
        error: 'Failed to save configuration',
        details: error.message 
      }, { status: 500 });
    }

    console.log('[API Config POST] Config saved successfully:', { 
      id: data?.id, 
      provider: data?.provider,
      isActive: data?.is_active,
      hasApiKey: !!data?.api_key
    });

    // Verify the config was saved by reading it back
    const { data: verifyData, error: verifyError } = await supabase
      .from('user_api_configs')
      .select('*')
      .eq('clerk_id', userId)
      .eq('provider', provider)
      .eq('is_active', true)
      .maybeSingle();

    if (verifyError) {
      console.error('[API Config POST] Error verifying saved config:', verifyError);
    } else if (!verifyData) {
      console.error('[API Config POST] ⚠️ Config was not saved properly - verification failed');
    } else {
      console.log('[API Config POST] ✅ Verification successful:', {
        id: verifyData.id,
        provider: verifyData.provider,
        isActive: verifyData.is_active,
        hasApiKey: !!verifyData.api_key,
        apiKeyLength: verifyData.api_key?.length
      });
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
    
    // If we have a token but no userId, decode it to get the user ID
    if (!userId && token) {
      try {
        const decoded = jwt.decode(token) as any;
        userId = decoded?.sub;
        console.log('[API Config DELETE] Decoded token, userId:', userId);
      } catch (error) {
        console.error('[API Config DELETE] Token decode failed:', error);
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
