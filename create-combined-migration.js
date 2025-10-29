#!/usr/bin/env node

/**
 * Create a single combined migration file
 * For easy copy-paste into Supabase dashboard
 */

const fs = require('fs');
const path = require('path');

const migrations = [
  '001_initial_schema.sql',
  '002_row_level_security.sql',
  '003_storage_buckets.sql',
  '004_review_queue_and_preferences.sql',
  '005_comments_and_votes.sql',
];

console.log('📦 Creating combined migration file...\n');

let combined = `-- Black Pill - Combined Database Migration
-- Generated: ${new Date().toISOString()}
-- Run this entire file in Supabase SQL Editor

`;

migrations.forEach((migration, index) => {
  const migrationPath = path.join(__dirname, 'supabase', 'migrations', migration);
  
  if (fs.existsSync(migrationPath)) {
    const content = fs.readFileSync(migrationPath, 'utf8');
    
    combined += `
-- ============================================================
-- Migration ${index + 1}/5: ${migration}
-- ============================================================

${content}

`;
    console.log(`✅ Added: ${migration}`);
  } else {
    console.log(`❌ Not found: ${migration}`);
  }
});

// Write combined file
const outputPath = path.join(__dirname, 'COMBINED_MIGRATION.sql');
fs.writeFileSync(outputPath, combined, 'utf8');

console.log(`\n✅ Combined migration created: COMBINED_MIGRATION.sql`);
console.log(`\n📋 To run migrations:\n`);
console.log(`Option 1 - Supabase Dashboard (Recommended):`);
console.log(`  1. Go to https://supabase.com/dashboard`);
console.log(`  2. Select your project`);
console.log(`  3. Click "SQL Editor"`);
console.log(`  4. Click "New Query"`);
console.log(`  5. Copy entire contents of COMBINED_MIGRATION.sql`);
console.log(`  6. Paste and click "Run"`);
console.log(`  7. Wait for success message`);
console.log(`\nOption 2 - Supabase CLI:`);
console.log(`  npx supabase link --project-ref YOUR_PROJECT_REF`);
console.log(`  npx supabase db push\n`);

console.log('🎉 Done!\n');

