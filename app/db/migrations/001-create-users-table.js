/**
 * Migration: Create Users Table
 * PRD Reference: PRD-1.1.1.2-users-table.md
 * Description: Creates the users table with proper authentication fields and indexes
 * Created: 2025-08-14
 */

const fs = require('fs').promises;
const path = require('path');
const { pool, query } = require('../connection');

async function up() {
  console.log('Running migration: 001-create-users-table');
    
  try {
    // Read the SQL schema file
    const schemaPath = path.join(__dirname, '../schemas/001-users-table.sql');
    const schemaSql = await fs.readFile(schemaPath, 'utf8');
        
    // Execute the schema creation
    await query(schemaSql);
        
    console.log('✅ Users table created successfully');
    console.log('✅ Indexes created');
    console.log('✅ Triggers created');
    console.log('✅ Comments added');
        
    // Verify table exists
    const result = await query(`
            SELECT table_name, column_name, data_type, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'users' 
            ORDER BY ordinal_position
        `);
        
    console.log(`\n📊 Table verification - Found ${result.rows.length} columns:`);
    result.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} ${row.is_nullable === 'NO' ? '(NOT NULL)' : ''}`);
    });
        
    // Verify indexes
    const indexResult = await query(`
            SELECT indexname, indexdef 
            FROM pg_indexes 
            WHERE tablename = 'users'
            ORDER BY indexname
        `);
        
    console.log(`\n🔍 Index verification - Found ${indexResult.rows.length} indexes:`);
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
  console.log('Rolling back migration: 001-create-users-table');
    
  try {
    // Drop triggers first
    await query('DROP TRIGGER IF EXISTS update_users_updated_at ON users');
    await query('DROP FUNCTION IF EXISTS update_updated_at_column()');
        
    // Drop table (this will also drop all indexes)
    await query('DROP TABLE IF EXISTS users CASCADE');
        
    console.log('✅ Users table dropped successfully');
    console.log('✅ Triggers and functions removed');
        
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
    console.log('Usage: node 001-create-users-table.js [up|down]');
    process.exit(1);
  }
}