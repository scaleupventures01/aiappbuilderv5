/**
 * Migration: Add Speed Preferences and Analytics
 * PRD Reference: PRD-1.2.6-gpt5-speed-selection.md
 * Description: Adds speed_preference column to users table and creates speed_analytics table
 * Created: 2025-08-15
 */

const fs = require('fs').promises;
const path = require('path');
const { pool, query } = require('../connection');

async function up() {
  console.log('Running migration: 005-add-speed-preferences');
    
  try {
    // Read the SQL schema file
    const schemaPath = path.join(__dirname, '../schemas/005-speed-preferences.sql');
    const schemaSql = await fs.readFile(schemaPath, 'utf8');
        
    // Execute the schema creation
    await query(schemaSql);
        
    console.log('✅ Speed preference column added to users table');
    console.log('✅ Speed analytics table created');
    console.log('✅ Indexes created');
    console.log('✅ Comments added');
        
    // Verify users table has new column
    const usersResult = await query(`
      SELECT column_name, data_type, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'speed_preference'
    `);
        
    console.log(`\n📊 Users table verification:`);
    if (usersResult.rows.length > 0) {
      const row = usersResult.rows[0];
      console.log(`  ✅ speed_preference: ${row.data_type} (default: ${row.column_default})`);
    } else {
      throw new Error('speed_preference column not found in users table');
    }
        
    // Verify speed_analytics table exists
    const analyticsResult = await query(`
      SELECT table_name, column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'speed_analytics' 
      ORDER BY ordinal_position
    `);
        
    console.log(`\n📊 Speed analytics table verification - Found ${analyticsResult.rows.length} columns:`);
    analyticsResult.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type}`);
    });
        
    // Verify indexes
    const indexResult = await query(`
      SELECT indexname, indexdef 
      FROM pg_indexes 
      WHERE tablename IN ('users', 'speed_analytics') AND indexname LIKE '%speed%'
      ORDER BY indexname
    `);
        
    console.log(`\n🔍 Speed-related index verification - Found ${indexResult.rows.length} indexes:`);
    indexResult.rows.forEach(row => {
      console.log(`  - ${row.indexname}`);
    });
        
    return true;
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  }
}

async function down() {
  console.log('Rolling back migration: 005-add-speed-preferences');
    
  try {
    // Drop speed_analytics table first
    await query('DROP TABLE IF EXISTS speed_analytics CASCADE');
    
    // Remove speed_preference column from users table
    await query('ALTER TABLE users DROP COLUMN IF EXISTS speed_preference');
        
    console.log('✅ Speed analytics table dropped');
    console.log('✅ Speed preference column removed from users table');
        
    return true;
  } catch (error) {
    console.error('❌ Rollback failed:', error.message);
    throw error;
  }
}

module.exports = { up, down };

// Allow direct execution for testing
if (require.main === module) {
  const command = process.argv[2];
    
  if (command === 'up') {
    up()
      .then(() => {
        console.log('\n🎉 Migration completed successfully!');
        process.exit(0);
      })
      .catch((error) => {
        console.error('\n💥 Migration failed:', error);
        process.exit(1);
      });
  } else if (command === 'down') {
    down()
      .then(() => {
        console.log('\n🎉 Rollback completed successfully!');
        process.exit(0);
      })
      .catch((error) => {
        console.error('\n💥 Rollback failed:', error);
        process.exit(1);
      });
  } else {
    console.log('Usage: node 005-add-speed-preferences.js [up|down]');
    process.exit(1);
  }
}