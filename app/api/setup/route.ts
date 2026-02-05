import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// This endpoint applies database migrations
// Access it once at: http://localhost:3000/api/setup

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Missing Supabase credentials' },
        { status: 500 }
      );
    }

    // Read the migration file
    const migrationPath = path.join(process.cwd(), 'supabase', 'all-migrations-combined.sql');
    const sql = fs.readFileSync(migrationPath, 'utf-8');

    // Split into individual statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))
      .filter(s => !s.match(/^={10,}/)); // Remove separator lines

    const results = {
      total: statements.length,
      success: 0,
      skipped: 0,
      errors: [] as string[]
    };

    // Execute each statement
    for (const statement of statements) {
      try {
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/query`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseServiceKey,
            'Authorization': `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({ sql: statement })
        });

        if (response.ok) {
          results.success++;
        } else {
          const error = await response.text();
          if (error.includes('already exists') || error.includes('duplicate')) {
            results.skipped++;
          } else {
            results.errors.push(error.substring(0, 200));
          }
        }
      } catch (error: any) {
        results.errors.push(error.message);
      }
    }

    return NextResponse.json({
      message: 'Migration process complete',
      results,
      note: 'If errors occurred, you may need to run migrations manually in Supabase SQL Editor'
    });

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// Simple GET endpoint that shows instructions
export async function GET(request: NextRequest) {
  const projectRef = process.env.NEXT_PUBLIC_SUPABASE_URL?.match(
    /https:\/\/([^.]+)\.supabase\.co/
  )?.[1];

  return NextResponse.json({
    message: 'Database Setup Endpoint',
    instructions: {
      automatic: 'POST to this endpoint to attempt automatic migration (may not work due to Supabase API limitations)',
      manual: {
        step1: `Open SQL Editor: https://supabase.com/dashboard/project/${projectRef}/sql/new`,
        step2: 'Copy contents from: supabase/all-migrations-combined.sql',
        step3: 'Paste into SQL Editor and click Run',
        step4: 'Verify tables at: ' + `https://supabase.com/dashboard/project/${projectRef}/editor`
      }
    },
    tables_to_create: [
      'jobs',
      'job_sources',
      'job_sync_metrics',
      'user_job_profiles',
      'resumes',
      'resume_sections',
      'resume_adaptations',
      'cover_letters',
      'tracked_jobs'
    ]
  });
}
