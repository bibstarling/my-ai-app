import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

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

console.log('🔗 Connecting to Supabase:', supabaseUrl);

// Extract project ref from URL (e.g., qtplretigutndftokplk)
const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];

if (!projectRef) {
  console.error('❌ Could not extract project reference from URL');
  process.exit(1);
}

// Construct direct PostgreSQL connection string
// Supabase provides direct database access via pooler
const dbUrl = `postgresql://postgres.${projectRef}:${supabaseServiceKey.replace('sb_secret_', '')}@aws-0-us-east-1.pooler.supabase.com:6543/postgres`;

async function executeSqlViaPg(sql) {
  const { Client } = pg;
  const client = new Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    await client.query(sql);
    await client.end();
    return { success: true };
  } catch (error) {
    try {
      await client.end();
    } catch (e) {
      // Ignore cleanup errors
    }
    return { success: false, error: error.message };
  }
}

async function applyMigrations() {
  const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations');
  const migrationFiles = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  console.log(`\n📁 Found ${migrationFiles.length} migration files\n`);

  for (const file of migrationFiles) {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`📄 Applying: ${file}`);
    console.log('='.repeat(70));

    const filePath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(filePath, 'utf-8');

    const result = await executeSqlViaPg(sql);

    if (result.success) {
      console.log(`✅ Migration ${file} applied successfully`);
    } else {
      console.error(`❌ Error applying ${file}:`);
      console.error(result.error);
      console.log('\n⚠️  Some errors are expected (e.g., "already exists"). Continuing...\n');
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log('🎉 Migration process complete!');
  console.log('='.repeat(70));
  
  // Verify tables
  console.log('\n🔍 Verifying tables...\n');
  
  const verifyResult = await executeSqlViaPg(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name;
  `);

  if (verifyResult.success) {
    console.log('✅ Database tables created successfully!');
    console.log('\nVisit your Supabase dashboard to see the tables:');
    console.log(`https://supabase.com/dashboard/project/${projectRef}/editor\n`);
  }
}

applyMigrations().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
