/**
 * Custom Job Source Management API
 * PATCH: Update source (enable/disable)
 * DELETE: Remove source
 */

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getSupabaseServiceRole } from '@/lib/supabase-server';
import { SourcesService } from '@/lib/jobs-ingestion/sources-service';

export const dynamic = 'force-dynamic';

// PATCH: Update source (by source_key, which is the 'id' param)
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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
    
    // Await params (Next.js 15 requirement)
    const { id } = await params;
    
    const body = await req.json();
    const { enabled, name, description, config } = body;
    
    const updates: any = {};
    
    if (enabled !== undefined) updates.enabled = enabled;
    if (name) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (config) updates.config = config;
    
    // Use the new sources service
    const sourcesService = new SourcesService();
    await sourcesService.updateSource(id, updates);
    
    // Fetch updated source
    const updatedSource = await sourcesService.getSource(id);
    
    return NextResponse.json({
      success: true,
      source: updatedSource,
    });
    
  } catch (err) {
    console.error('[Source Update API] Error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to update source' },
      { status: 500 }
    );
  }
}

// DELETE: Remove source (only custom sources can be deleted)
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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
    
    // Await params (Next.js 15 requirement)
    const { id } = await params;
    
    // Use the new sources service (it will prevent deleting built-in sources)
    const sourcesService = new SourcesService();
    await sourcesService.deleteSource(id);
    
    return NextResponse.json({
      success: true,
    });
    
  } catch (err) {
    console.error('[Source Delete API] Error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to delete source' },
      { status: 500 }
    );
  }
}
