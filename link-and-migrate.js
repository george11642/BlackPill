#!/usr/bin/env node

/**
 * Automated Supabase Link and Migration Script
 * Reads backend/.env, extracts project ref, and runs migrations
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Black Pill - Automated Migration Script\n');

// Read backend/.env
const envPath = path.join(__dirname, 'backend', '.env');

if (!fs.existsSync(envPath)) {
  console.error('❌ Error: backend/.env not found');
  console.error('💡 Please copy backend/env.example to backend/.env and configure it\n');
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');

// Extract SUPABASE_URL
const urlMatch = envContent.match(/SUPABASE_URL=(.+)/);
if (!urlMatch) {
  console.error('❌ Error: SUPABASE_URL not found in backend/.env');
  process.exit(1);
}

const supabaseUrl = urlMatch[1].trim();
console.log(`📍 Supabase URL: ${supabaseUrl}`);

// Extract project ref from URL (format: https://xxxxx.supabase.co)
const projectRefMatch = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/);
if (!projectRefMatch) {
  console.error('❌ Error: Could not extract project ref from SUPABASE_URL');
  console.error(`   URL format should be: https://your-project-ref.supabase.co`);
  process.exit(1);
}

const projectRef = projectRefMatch[1];
console.log(`🔑 Project Ref: ${projectRef}\n`);

try {
  // Change to supabase directory
  process.chdir(path.join(__dirname, 'supabase'));
  
  console.log('🔗 Linking to Supabase project...');
  
  // Link to project (this will prompt for password if needed)
  execSync(`npx supabase@latest link --project-ref ${projectRef}`, {
    stdio: 'inherit',
    shell: 'powershell.exe'
  });
  
  console.log('\n✅ Successfully linked to project!\n');
  
  console.log('📤 Pushing migrations to Supabase...');
  
  // Push migrations
  execSync(`npx supabase@latest db push`, {
    stdio: 'inherit',
    shell: 'powershell.exe'
  });
  
  console.log('\n🎉 All migrations completed successfully!\n');
  console.log('✅ Your database now has:');
  console.log('   - 16 tables');
  console.log('   - 30+ RLS policies');
  console.log('   - 18+ performance indexes');
  console.log('   - Storage bucket configured');
  console.log('   - Auto-update triggers');
  console.log('\n🚀 Next step: Deploy backend with `cd backend && npm run dev`\n');
  
} catch (error) {
  console.error('\n❌ Error during migration:', error.message);
  console.error('\n💡 Alternative: Use the Supabase dashboard');
  console.error('   1. Go to https://supabase.com/dashboard');
  console.error('   2. Open SQL Editor');
  console.error('   3. Copy contents of COMBINED_MIGRATION.sql');
  console.error('   4. Paste and Run\n');
  process.exit(1);
}

