// Script to create tables in Supabase using the REST API
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Read .env.local
const envContent = readFileSync(resolve('.env.local'), 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const idx = line.indexOf('=');
  if (idx > 0) {
    env[line.substring(0, idx).trim()] = line.substring(idx + 1).trim();
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Read the schema SQL
const schemaSql = readFileSync(resolve('supabase/schema.sql'), 'utf-8');

console.log('🔗 Connecting to Supabase...');
console.log(`   URL: ${supabaseUrl.substring(0, 20)}...`);

// Try using the rpc endpoint to execute SQL (requires service_role key usually)
// Instead, let's try creating tables via the REST API by testing if they exist
// and providing instructions

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAndGuide() {
  // Test if tables exist
  const { error } = await supabase.from('exams').select('id').limit(1);
  
  if (error && error.message.includes('Invalid path')) {
    console.log('\n⚠️  Las tablas NO existen en tu proyecto de Supabase.');
    console.log('\n📋 Sigue estos pasos:\n');
    console.log('   1. Ve a https://supabase.com y abre tu proyecto');
    console.log('   2. En el menú lateral, click en "SQL Editor"');
    console.log('   3. Click en "New Query"');
    console.log('   4. Copia y pega TODO el contenido del archivo:');
    console.log('      supabase/schema.sql');
    console.log('   5. Click en "Run" (o Ctrl+Enter)');
    console.log('   6. Deberías ver "Success. No rows returned"');
    console.log('   7. Vuelve aquí y ejecuta: node test-flow.mjs');
    console.log('\n💡 El archivo schema.sql está en tu proyecto en:');
    console.log(`   ${resolve('supabase/schema.sql')}`);
    
    // Also print the SQL for easy copy
    console.log('\n' + '='.repeat(60));
    console.log('📄 CONTENIDO DE schema.sql (copia todo esto):');
    console.log('='.repeat(60));
    console.log(schemaSql);
    console.log('='.repeat(60));
  } else if (!error) {
    console.log('✅ ¡Las tablas ya existen! Ejecuta: node test-flow.mjs');
  } else {
    console.log(`❌ Error desconocido: ${error.message}`);
  }
}

checkAndGuide().catch(err => console.error('Error:', err.message));
