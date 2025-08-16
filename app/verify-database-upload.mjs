#!/usr/bin/env node

/**
 * Verify upload was persisted to database
 */

import { config } from 'dotenv';
import { Pool } from 'pg';

// Load environment variables like server
config();
config({ path: '.env.development' });

// Use same connection config as server
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false, // Railway connection doesn't need SSL in development
  max: 20
});

const UPLOAD_ID = '2a00dc62-a559-419d-9774-8fb26c047511';
const CLOUDINARY_URL = 'https://res.cloudinary.com/dgvkvlad0/image/upload/v1755303754/elite-trading-coach/testing/896a9378-15ff-43ac-825a-0c1e84ba5c6b/1755303753932_test-chart-bullish.png';

console.log('🔍 Database Upload Verification');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

try {
  // Query by upload ID
  console.log('📋 Querying upload by ID...');
  const result1 = await pool.query(
    'SELECT * FROM uploads WHERE id = $1',
    [UPLOAD_ID]
  );
  
  if (result1.rows.length > 0) {
    console.log('✅ Upload found by ID:');
    const upload = result1.rows[0];
    console.log('   • ID:', upload.id);
    console.log('   • User ID:', upload.user_id);
    console.log('   • Original Filename:', upload.original_filename);
    console.log('   • File Type:', upload.file_type);
    console.log('   • File Size:', upload.file_size, 'bytes');
    console.log('   • Secure URL:', upload.secure_url);
    console.log('   • Created At:', upload.created_at);
    console.log('   • Context:', upload.context);
  } else {
    console.log('❌ Upload not found by ID');
  }
  
  // Query by URL to double-check
  console.log('\n📋 Querying upload by URL...');
  const result2 = await pool.query(
    'SELECT * FROM uploads WHERE secure_url = $1',
    [CLOUDINARY_URL]
  );
  
  if (result2.rows.length > 0) {
    console.log('✅ Upload found by URL - database persistence confirmed');
  } else {
    console.log('❌ Upload not found by URL');
  }
  
  // Get total uploads count for this user
  console.log('\n📋 Total uploads for test user...');
  const result3 = await pool.query(
    'SELECT COUNT(*) as total FROM uploads WHERE user_id = $1',
    ['896a9378-15ff-43ac-825a-0c1e84ba5c6b']
  );
  
  console.log('✅ Total uploads for test user:', result3.rows[0].total);
  
  // Get latest upload record
  console.log('\n📋 Latest upload record...');
  const result4 = await pool.query(
    'SELECT * FROM uploads ORDER BY created_at DESC LIMIT 1'
  );
  
  if (result4.rows.length > 0) {
    const latest = result4.rows[0];
    console.log('✅ Latest upload:');
    console.log('   • ID:', latest.id);
    console.log('   • Filename:', latest.original_filename);
    console.log('   • Size:', latest.file_size, 'bytes');
    console.log('   • Created:', latest.created_at);
  }
  
} catch (error) {
  console.error('❌ Database verification failed:', error.message);
} finally {
  await pool.end();
}
