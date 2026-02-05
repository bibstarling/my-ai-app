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

console.log('🔗 Connecting to Supabase:', supabaseUrl);

async function executeSQL(sql) {
  try {
    // Use Supabase's query endpoint
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({ query: sql })
    });

    if (!response.ok) {
      const text = await response.text();
      return { success: false, error: text, status: response.status };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function applyMigrations() {
  const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations');
  
  // Check if we should use the combined file
  const combinedPath = path.join(__dirname, '..', 'supabase', 'all-migrations-combined.sql');
  
  let files;
  if (fs.existsSync(combinedPath)) {
    console.log('📦 Using combined migration file\n');
    files = [{ name: 'all-migrations-combined.sql', path: combinedPath }];
  } else {
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();
    files = migrationFiles.map(f => ({ name: f, path: path.join(migrationsDir, f) }));
  }

  console.log(`📁 Found ${files.length} migration file(s)\n`);

  for (const file of files) {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`📄 Processing: ${file.name}`);
    console.log('='.repeat(70));

    const sql = fs.readFileSync(file.path, 'utf-8');

    // Try to execute via RPC first
    let result = await executeSQL(sql);

    if (!result.success && result.status === 404) {
      // RPC endpoint doesn't exist, we need to create it or use the Supabase client directly
      console.log('⚠️  RPC endpoint not available. Trying alternative method...\n');
      
      // For now, we'll output instructions
      console.log('📋 Please run this migration manually:');
      console.log(`   1. Go to: ${supabaseUrl.replace('https://', 'https://supabase.com/dashboard/project/').replace('.supabase.co', '')}/sql/new`);
      console.log(`   2. Copy contents from: ${file.path}`);
      console.log('   3. Click "Run"\n');
      
      result = { success: false, manual: true };
    }

    if (result.success) {
      console.log(`✅ Migration ${file.name} applied successfully`);
    } else if (!result.manual) {
      console.error(`❌ Error applying ${file.name}:`);
      console.error(result.error);
      console.log('\n⚠️  Continuing to next migration...\n');
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log('✨ Migration process complete!');
  console.log('='.repeat(70));
  
  // Extract project ref for dashboard link
  const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
  if (projectRef) {
    console.log(`\n🔗 View your tables: https://supabase.com/dashboard/project/${projectRef}/editor`);
    console.log(`🔗 SQL Editor: https://supabase.com/dashboard/project/${projectRef}/sql/new\n`);
  }
}

applyMigrations().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
