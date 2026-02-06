import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { getSupabaseServiceRole } from '@/lib/supabase-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Debug endpoint to test API config saving
 * GET /api/settings/api-config/debug
 */
export async function GET(req: Request) {
  try {
    // Check authentication
    const authData = await auth();
    const user = await currentUser();
    
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    const userId = authData?.userId || user?.id;
    
    console.log('[Debug] Auth check:', {
      authUserId: authData?.userId,
      currentUserId: user?.id,
      hasToken: !!token,
      finalUserId: userId,
    });
    
    if (!userId) {
      return NextResponse.json({
        error: 'Not authenticated',
        details: {
          hasAuthData: !!authData,
          hasUser: !!user,
          hasToken: !!token,
        }
      }, { status: 401 });
    }
    
    // Check Supabase connection
    const supabase = getSupabaseServiceRole();
    
    // Try to query the table
    const { data: configs, error: queryError } = await supabase
      .from('user_api_configs')
      .select('id, provider, is_active, created_at')
      .eq('clerk_id', userId);
    
    if (queryError) {
      return NextResponse.json({
        error: 'Database query failed',
        details: queryError,
      }, { status: 500 });
    }
    
    // Try a test insert
    const testConfig = {
      clerk_id: userId,
      provider: 'groq',
      api_key: 'test_key_debug_' + Date.now(),
      is_active: false, // Not active so it doesn't interfere
      updated_at: new Date().toISOString(),
    };
    
    const { data: testData, error: insertError } = await supabase
      .from('user_api_configs')
      .upsert(testConfig, {
        onConflict: 'clerk_id,provider',
      })
      .select()
      .single();
    
    // Clean up test data
    if (testData) {
      await supabase
        .from('user_api_configs')
        .delete()
        .eq('id', testData.id);
    }
    
    return NextResponse.json({
      success: true,
      message: 'Debug check completed',
      auth: {
        userId,
        hasAuthData: !!authData,
        hasUser: !!user,
      },
      database: {
        tableAccessible: !queryError,
        existingConfigs: configs?.length || 0,
        testInsert: {
          success: !insertError,
          error: insertError?.message,
        },
      },
      configs: configs?.map(c => ({
        id: c.id,
        provider: c.provider,
        isActive: c.is_active,
        createdAt: c.created_at,
      })),
    });
  } catch (error: any) {
    console.error('[Debug] Exception:', error);
    return NextResponse.json({
      error: 'Debug check failed',
      message: error.message,
      stack: error.stack,
    }, { status: 500 });
  }
}
