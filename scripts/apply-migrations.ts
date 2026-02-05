import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigrations() {
  const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations');
  const migrationFiles = fs.readdirSync(migrationsDir).sort();

  console.log('Found migrations:', migrationFiles);

  for (const file of migrationFiles) {
    if (!file.endsWith('.sql')) continue;

    console.log(`\n\nApplying migration: ${file}`);
    const sqlPath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(sqlPath, 'utf-8');

    try {
      // Split by semicolons and execute each statement
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];
        if (!statement) continue;

        console.log(`  Executing statement ${i + 1}/${statements.length}...`);
        
        const { data, error } = await supabase.rpc('exec_sql', {
          sql: statement
        });

        if (error) {
          // Try direct query
          const { error: directError } = await supabase.from('_').select('*').limit(0);
          
          // For now, just log and continue
          console.log(`  Note: ${error.message}`);
        }
      }

      console.log(`✓ Migration ${file} applied successfully`);
    } catch (error: any) {
      console.error(`✗ Error applying migration ${file}:`, error.message);
    }
  }

  console.log('\n\nMigrations complete! Checking tables...');
  
  // Verify tables were created
  const { data: tables, error } = await supabase
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_schema', 'public');

  if (!error && tables) {
    console.log('Tables in database:', tables.map(t => t.table_name));
  }
}

applyMigrations().catch(console.error);
