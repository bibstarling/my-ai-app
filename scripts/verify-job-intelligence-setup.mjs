#!/usr/bin/env node

/**
 * Verification script for Job Intelligence Platform setup
 * Run with: node scripts/verify-job-intelligence-setup.mjs
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env.local
try {
  const envPath = join(__dirname, '..', '.env.local');
  const envFile = readFileSync(envPath, 'utf-8');
  envFile.split('\n').forEach(line => {
    const match = line.match(/^([^=:#]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^["']|["']$/g, '');
      process.env[key] = value;
    }
  });
} catch (err) {
  console.log('⚠️  Could not load .env.local file');
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('\n🔍 Job Intelligence Platform Setup Verification\n');
console.log('=' .repeat(60));

// Check environment variables
console.log('\n📦 Environment Variables:');
console.log('  ✓ NEXT_PUBLIC_SUPABASE_URL:', SUPABASE_URL ? '✅ Set' : '❌ Missing');
console.log('  ✓ SUPABASE_SERVICE_ROLE_KEY:', SUPABASE_SERVICE_KEY ? '✅ Set' : '❌ Missing');
console.log('  ✓ ANTHROPIC_API_KEY:', process.env.ANTHROPIC_API_KEY ? '✅ Set' : '⚠️  Missing (required for AI)');
console.log('  ○ ADZUNA_API_KEY:', process.env.ADZUNA_API_KEY ? '✅ Set' : '○ Optional');
console.log('  ○ ADZUNA_APP_ID:', process.env.ADZUNA_APP_ID ? '✅ Set' : '○ Optional');
console.log('  ○ GETONBOARD_API_KEY:', process.env.GETONBOARD_API_KEY ? '✅ Set' : '○ Optional');

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.log('\n❌ Missing required environment variables. Setup cannot continue.\n');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Check database tables
console.log('\n🗄️  Database Tables:');

const tables = [
  'jobs',
  'job_sources',
  'job_sync_metrics',
  'user_job_profiles',
  'user_queries',
  'matches',
  'job_merge_log',
  'tracked_jobs',
];

let allTablesExist = true;

for (const table of tables) {
  try {
    const { error, count } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.log(`  ❌ ${table}: Not found or error`);
      allTablesExist = false;
    } else {
      console.log(`  ✅ ${table}: Exists (${count || 0} rows)`);
    }
  } catch (err) {
    console.log(`  ❌ ${table}: Error checking`);
    allTablesExist = false;
  }
}

// Check for required columns in user_job_profiles
console.log('\n🔧 Schema Verification:');

try {
  const { data, error } = await supabase
    .from('user_job_profiles')
    .select('*')
    .limit(1);
  
  if (!error && data !== null) {
    const requiredColumns = [
      'resume_text',
      'target_titles',
      'seniority',
      'locations_allowed',
      'profile_context_text',
      'use_profile_context_for_matching',
    ];
    
    const sampleRow = data[0] || {};
    const existingColumns = Object.keys(sampleRow);
    
    let allColumnsExist = true;
    for (const col of requiredColumns) {
      const exists = existingColumns.includes(col);
      console.log(`  ${exists ? '✅' : '❌'} ${col}`);
      if (!exists) allColumnsExist = false;
    }
    
    if (!allColumnsExist) {
      console.log('\n⚠️  Some columns are missing. Migration may not have been applied.');
    }
  } else {
    console.log('  ⚠️  Could not verify schema (table may be empty)');
  }
} catch (err) {
  console.log('  ❌ Error verifying schema');
}

// Check jobs count
console.log('\n📊 Job Statistics:');

try {
  const { count: totalJobs } = await supabase
    .from('jobs')
    .select('*', { count: 'exact', head: true });
  
  const { count: activeJobs } = await supabase
    .from('jobs')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active');
  
  console.log(`  Total Jobs: ${totalJobs || 0}`);
  console.log(`  Active Jobs: ${activeJobs || 0}`);
  
  if ((totalJobs || 0) === 0) {
    console.log('  💡 No jobs yet. Run the ingestion pipeline to fetch jobs.');
  }
} catch (err) {
  console.log('  ❌ Error fetching job stats');
}

// Check sync metrics
console.log('\n📈 Ingestion Status:');

try {
  const { data: metrics } = await supabase
    .from('job_sync_metrics')
    .select('*');
  
  if (metrics && metrics.length > 0) {
    for (const metric of metrics) {
      const status = metric.last_sync_status === 'success' ? '✅' : '❌';
      const lastSync = metric.last_sync_at
        ? new Date(metric.last_sync_at).toLocaleString()
        : 'Never';
      console.log(`  ${status} ${metric.source}: ${lastSync} (${metric.jobs_fetched || 0} jobs)`);
    }
  } else {
    console.log('  💡 No sync metrics yet. Run the pipeline to start ingestion.');
  }
} catch (err) {
  console.log('  ⚠️  Sync metrics table exists but no data yet');
}

// Summary
console.log('\n' + '='.repeat(60));
console.log('\n📋 Setup Summary:\n');

if (allTablesExist) {
  console.log('✅ All database tables exist');
} else {
  console.log('❌ Some tables are missing - apply the migration');
}

console.log('\n📝 Next Steps:');
console.log('  1. If migration not applied: Run SQL in Supabase Editor');
console.log('  2. Start dev server: npm run dev');
console.log('  3. Run pipeline: http://localhost:3000/admin/jobs');
console.log('  4. Set up profile: http://localhost:3000/job-profile');
console.log('  5. Discover jobs: http://localhost:3000/jobs/discover');

console.log('\n🚀 Ready to launch!\n');
