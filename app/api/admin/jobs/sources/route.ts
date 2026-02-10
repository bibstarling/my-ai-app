/**
 * Custom Job Sources API
 * GET: List all custom sources
 * POST: Add new custom source
 */

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getSupabaseServiceRole } from '@/lib/supabase-server';
import { SourcesService } from '@/lib/jobs-ingestion/sources-service';

export const dynamic = 'force-dynamic';

// GET: List all sources (built-in and custom)
export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Check if user is admin
    const supabase = getSupabaseServiceRole();
    const { data: user } = await supabase
      .from('users')
      .select('is_admin, is_super_admin')
      .eq('clerk_id', userId)
      .single();
    
    if (!user?.is_admin && !user?.is_super_admin) {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }
    
    // Get all sources using the new unified service
    const sourcesService = new SourcesService();
    const sources = await sourcesService.getAllSources();
    
    return NextResponse.json({
      sources: sources || [],
      total: sources?.length || 0,
    });
    
  } catch (err) {
    console.error('[Sources API] Error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to fetch sources' },
      { status: 500 }
    );
  }
}

// POST: Add new custom source
export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Check if user is admin
    const supabase = getSupabaseServiceRole();
    const { data: user } = await supabase
      .from('users')
      .select('is_admin, is_super_admin')
      .eq('clerk_id', userId)
      .single();
    
    if (!user?.is_admin && !user?.is_super_admin) {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }
    
    const body = await req.json();
    const { name, url, description, source_type = 'rss', config = {} } = body;
    
    if (!name || !url) {
      return NextResponse.json(
        { error: 'Name and URL are required' },
        { status: 400 }
      );
    }
    
    // Add custom source using the new service
    const sourcesService = new SourcesService();
    const sourceId = await sourcesService.addCustomSource(
      name,
      url,
      source_type,
      description,
      config
    );
    
    return NextResponse.json({
      success: true,
      source_id: sourceId,
    });
    
  } catch (err) {
    console.error('[Custom Sources API] Error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to add source' },
      { status: 500 }
    );
  }
}
