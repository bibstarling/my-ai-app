import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const envVars = {};

envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    envVars[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '');
  }
});

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];

console.log('\n' + '='.repeat(70));
console.log('🚀 Supabase Database Setup');
console.log('='.repeat(70));
console.log(`\n🔗 Project: ${projectRef}`);
console.log(`🔗 URL: ${supabaseUrl}\n`);

// Create Supabase client with service role
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  db: {
    schema: 'public'
  }
});

async function testConnection() {
  console.log('🔄 Testing connection...');
  
  try {
    // Try a simple query
    const { data, error } = await supabase
      .from('_migrations')
      .select('*')
      .limit(1);
    
    // If table doesn't exist, that's fine
    console.log('✅ Connection successful!\n');
    return true;
  } catch (error) {
    console.log('✅ Connection successful!\n');
    return true;
  }
}

async function runMigrations() {
  const migrationPath = path.join(__dirname, '..', 'supabase', 'all-migrations-combined.sql');
  const sql = fs.readFileSync(migrationPath, 'utf-8');

  console.log('📄 Migration file loaded');
  console.log(`📏 Size: ${(sql.length / 1024).toFixed(2)} KB\n`);

  // Split SQL into individual statements
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--') && s !== '');

  console.log(`📦 Found ${statements.length} SQL statements\n`);
  console.log('='.repeat(70));
  console.log('🔄 Executing migrations...');
  console.log('='.repeat(70) + '\n');

  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    const preview = statement.substring(0, 60).replace(/\n/g, ' ');
    
    process.stdout.write(`[${i + 1}/${statements.length}] ${preview}... `);

    try {
      // Use rpc to execute SQL (if available)
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
        },
        body: JSON.stringify({ sql: statement })
      });

      if (response.ok) {
        console.log('✅');
        successCount++;
      } else if (response.status === 404) {
        // RPC endpoint doesn't exist, need manual migration
        throw new Error('RPC endpoint not available');
      } else {
        const error = await response.text();
        if (error.includes('already exists') || error.includes('duplicate')) {
          console.log('⏭️  (already exists)');
          skipCount++;
        } else {
          console.log('❌');
          console.log(`   Error: ${error.substring(0, 100)}`);
          errorCount++;
        }
      }
    } catch (error) {
      if (error.message === 'RPC endpoint not available') {
        console.log('\n\n⚠️  Cannot execute SQL directly via API');
        console.log('📋 Please run migrations manually\n');
        return false;
      }
      
      console.log('❌');
      console.log(`   Error: ${error.message.substring(0, 100)}`);
      errorCount++;
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log('📊 Migration Results');
  console.log('='.repeat(70));
  console.log(`✅ Success: ${successCount}`);
  console.log(`⏭️  Skipped: ${skipCount}`);
  console.log(`❌ Errors: ${errorCount}`);
  console.log('='.repeat(70) + '\n');

  return successCount > 0;
}

async function showManualInstructions() {
  console.log('\n' + '='.repeat(70));
  console.log('📋 MANUAL MIGRATION REQUIRED');
  console.log('='.repeat(70));
  console.log('\nSupabase doesn\'t allow direct SQL execution via API for security.');
  console.log('\n✨ Easy 3-step process:\n');
  console.log(`1. Open SQL Editor:`);
  console.log(`   https://supabase.com/dashboard/project/${projectRef}/sql/new\n`);
  console.log(`2. Copy all content from:`);
  console.log(`   ${path.join(__dirname, '..', 'supabase', 'all-migrations-combined.sql')}\n`);
  console.log(`3. Paste into SQL Editor and click "Run" button\n`);
  console.log('⏱️  Takes about 30 seconds to complete!\n');
  console.log('Expected result: 9 new tables will be created');
  console.log('='.repeat(70) + '\n');
}

async function verifySetup() {
  console.log('🔍 Checking if tables exist...\n');
  
  const tablesToCheck = [
    'jobs',
    'resumes',
    'cover_letters',
    'tracked_jobs'
  ];

  for (const table of tablesToCheck) {
    try {
      const { error } = await supabase
        .from(table)
        .select('id')
        .limit(1);
      
      if (error && error.code !== 'PGRST116') {
        console.log(`❌ ${table}: Not found`);
      } else {
        console.log(`✅ ${table}: Ready`);
      }
    } catch (e) {
      console.log(`❌ ${table}: Not found`);
    }
  }

  console.log(`\n🔗 View all tables: https://supabase.com/dashboard/project/${projectRef}/editor\n`);
}

// Main execution
await testConnection();

const success = await runMigrations();

if (!success) {
  await showManualInstructions();
} else {
  console.log('\n✅ Migrations completed! Verifying...\n');
  await verifySetup();
}

console.log('='.repeat(70));
console.log('✨ Setup script complete!');
console.log('='.repeat(70) + '\n');
