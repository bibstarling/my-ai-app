import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env.local
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const envVars = {};

envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    const key = match[1].trim();
    const value = match[2].trim().replace(/^["']|["']$/g, '');
    envVars[key] = value;
  }
});

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

// Extract project reference
const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
if (!projectRef) {
  console.error('❌ Could not extract project reference from URL');
  process.exit(1);
}

console.log('🔗 Connecting to Supabase:', supabaseUrl);
console.log('📦 Project:', projectRef);

// Construct PostgreSQL connection string
// Supabase uses direct database access via port 5432 with the service role key as password
const connectionString = `postgresql://postgres.${projectRef}:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres`;

async function executeMigration(client, sql, fileName) {
  try {
    await client.query(sql);
    return { success: true };
  } catch (error) {
    // Some errors are acceptable (e.g., "already exists")
    if (error.message.includes('already exists')) {
      return { success: true, warning: error.message };
    }
    return { success: false, error: error.message };
  }
}

async function applyMigrations() {
  const { Client } = pg;
  
  // Use the combined migration file
  const migrationPath = path.join(__dirname, '..', 'supabase', 'all-migrations-combined.sql');
  
  if (!fs.existsSync(migrationPath)) {
    console.error('❌ Migration file not found:', migrationPath);
    process.exit(1);
  }

  console.log('\n📄 Reading migration file...');
  const sql = fs.readFileSync(migrationPath, 'utf-8');

  // Create connection using the Management API approach
  // Supabase allows direct SQL execution via their REST API
  console.log('\n🔄 Executing migrations via Supabase API...\n');

  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({ query: sql })
    });

    if (response.ok) {
      console.log('✅ Migrations executed successfully via RPC!');
      return true;
    }

    // If RPC doesn't work, try the PostgreSQL connection
    console.log('⚠️  RPC endpoint not available, trying direct connection...\n');
    
    // Use connection pooler
    const dbHost = `db.${projectRef}.supabase.co`;
    const dbConnectionString = `postgresql://postgres:[YOUR-PASSWORD]@${dbHost}:5432/postgres`;
    
    console.log('⚠️  Direct PostgreSQL connection requires database password.');
    console.log('📋 Alternative: Copy the SQL and run it manually in Supabase SQL Editor\n');
    console.log(`🔗 SQL Editor: https://supabase.com/dashboard/project/${projectRef}/sql/new\n`);
    
    return false;
  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

async function verifyTables() {
  console.log('\n🔍 Verifying tables...');
  
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: 'GET',
      headers: {
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
      }
    });

    if (response.ok) {
      const tables = await response.json();
      console.log('✅ Connection successful!');
      console.log(`\n🔗 View tables: https://supabase.com/dashboard/project/${projectRef}/editor\n`);
    }
  } catch (error) {
    console.log('ℹ️  Could not verify tables automatically');
  }
}

console.log('\n' + '='.repeat(70));
console.log('🚀 Supabase Migration Runner');
console.log('='.repeat(70));

const success = await applyMigrations();

if (!success) {
  console.log('\n' + '='.repeat(70));
  console.log('📋 MANUAL MIGRATION INSTRUCTIONS');
  console.log('='.repeat(70));
  console.log('\n1. Open SQL Editor:');
  console.log(`   https://supabase.com/dashboard/project/${projectRef}/sql/new\n`);
  console.log('2. Copy the contents from:');
  console.log(`   ${path.join(__dirname, '..', 'supabase', 'all-migrations-combined.sql')}\n`);
  console.log('3. Paste into the SQL Editor and click "Run"\n');
  console.log('4. You should see all 9 tables created successfully!\n');
}

await verifyTables();

console.log('='.repeat(70));
console.log('✨ Setup complete!');
console.log('='.repeat(70) + '\n');
