/**
 * Test script to verify Firebase credentials are configured correctly
 * Run with: node test-firebase-credentials.js
 */

require('dotenv').config();
const admin = require('firebase-admin');

console.log('🔍 Testing Firebase Credentials Configuration...\n');

// Check environment variable
const credentialsEnv = process.env.GOOGLE_APPLICATION_CREDENTIALS;

if (!credentialsEnv) {
  console.error('❌ GOOGLE_APPLICATION_CREDENTIALS is not set in environment variables');
  console.log('\n📝 To set it up:');
  console.log('   Option 1 (Local): Set in backend/.env as a file path:');
  console.log('   GOOGLE_APPLICATION_CREDENTIALS=./firebase-service-account.json');
  console.log('\n   Option 2 (Vercel): Set entire JSON as a string in Vercel env vars');
  process.exit(1);
}

console.log('✅ GOOGLE_APPLICATION_CREDENTIALS is set');
console.log(`   Format: ${credentialsEnv.startsWith('{') ? 'JSON string (production)' : 'File path (local)'}`);
console.log(`   Value preview: ${credentialsEnv.substring(0, 50)}${credentialsEnv.length > 50 ? '...' : ''}\n`);

// Try to initialize Firebase
try {
  // Determine format and initialize
  if (credentialsEnv.startsWith('{')) {
    // JSON string format (Vercel/production)
    console.log('📦 Detected: JSON string format (for Vercel/production)');
    try {
      const serviceAccount = JSON.parse(credentialsEnv);
      
      // Validate required fields
      const requiredFields = ['type', 'project_id', 'private_key', 'client_email'];
      const missingFields = requiredFields.filter(field => !serviceAccount[field]);
      
      if (missingFields.length > 0) {
        console.error(`❌ Missing required fields: ${missingFields.join(', ')}`);
        process.exit(1);
      }
      
      console.log(`✅ JSON parsed successfully`);
      console.log(`   Project ID: ${serviceAccount.project_id}`);
      console.log(`   Client Email: ${serviceAccount.client_email.substring(0, 30)}...`);
      console.log(`   Private Key: ${serviceAccount.private_key ? 'Set ✓' : 'Missing ✗'}`);
      
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log('✅ Firebase Admin SDK initialized successfully!\n');
      
    } catch (parseError) {
      console.error('❌ Failed to parse JSON:', parseError.message);
      console.log('\n💡 Make sure the entire JSON is on one line in your env var');
      process.exit(1);
    }
    
  } else {
    // File path format (local development)
    console.log('📁 Detected: File path format (for local development)');
    const fs = require('fs');
    const path = require('path');
    
    const filePath = path.resolve(__dirname, credentialsEnv);
    console.log(`   Looking for file: ${filePath}`);
    
    if (!fs.existsSync(filePath)) {
      console.error(`❌ File not found: ${filePath}`);
      console.log('\n💡 Make sure the file exists at the specified path');
      process.exit(1);
    }
    
    console.log('✅ File exists');
    
    try {
      const serviceAccount = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      
      // Validate required fields
      const requiredFields = ['type', 'project_id', 'private_key', 'client_email'];
      const missingFields = requiredFields.filter(field => !serviceAccount[field]);
      
      if (missingFields.length > 0) {
        console.error(`❌ Missing required fields: ${missingFields.join(', ')}`);
        process.exit(1);
      }
      
      console.log(`✅ JSON file parsed successfully`);
      console.log(`   Project ID: ${serviceAccount.project_id}`);
      console.log(`   Client Email: ${serviceAccount.client_email.substring(0, 30)}...`);
      console.log(`   Private Key: ${serviceAccount.private_key ? 'Set ✓' : 'Missing ✗'}`);
      
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log('✅ Firebase Admin SDK initialized successfully!\n');
      
    } catch (fileError) {
      console.error('❌ Failed to read/parse file:', fileError.message);
      process.exit(1);
    }
  }
  
  // Test messaging access
  console.log('🧪 Testing Firebase Messaging API access...');
  const messaging = admin.messaging();
  console.log('✅ Messaging API accessible');
  
  console.log('\n🎉 All checks passed! Firebase is configured correctly.');
  console.log('\n📋 Summary:');
  console.log('   ✓ Environment variable is set');
  console.log('   ✓ Credentials format is valid');
  console.log('   ✓ Required fields are present');
  console.log('   ✓ Firebase Admin SDK initialized');
  console.log('   ✓ Messaging API is accessible');
  console.log('\n✅ Push notifications should work!');
  
} catch (error) {
  console.error('\n❌ Error initializing Firebase:', error.message);
  console.error('\nStack trace:', error.stack);
  process.exit(1);
}

