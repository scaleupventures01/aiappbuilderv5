import { config } from 'dotenv';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Setup for ES modules
const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
config({ path: join(__dirname, '../../.env.local') });

const { testConnection, query, closePool } = require('./connection');

async function runConnectionTest() {
  console.log('🚀 Starting PostgreSQL Database Connection Test...');
  console.log('=====================================');
  
  try {
    // Test basic connection
    console.log('1. Testing database connection...');
    const isConnected = await testConnection();
    
    if (!isConnected) {
      throw new Error('Failed to establish database connection');
    }
    
    // Test basic query
    console.log('\n2. Testing basic query...');
    const versionResult = await query('SELECT version()');
    console.log('PostgreSQL Version:', versionResult.rows[0].version);
    
    // Test database information
    console.log('\n3. Testing database information...');
    const dbInfoResult = await query('SELECT current_database(), current_user, now()');
    const dbInfo = dbInfoResult.rows[0];
    console.log('Current Database:', dbInfo.current_database);
    console.log('Current User:', dbInfo.current_user);
    console.log('Server Time:', dbInfo.now);
    
    // Test connection pool
    console.log('\n4. Testing connection pool...');
    const poolStats = {
      totalCount: require('./connection').pool.totalCount,
      idleCount: require('./connection').pool.idleCount,
      waitingCount: require('./connection').pool.waitingCount
    };
    console.log('Pool Stats:', poolStats);
    
    console.log('\n✅ All database connection tests passed successfully!');
    console.log('=====================================');
    
  } catch (error) {
    console.error('\n❌ Database connection test failed:');
    console.error('Error:', error.message);
    console.error('=====================================');
    process.exit(1);
  } finally {
    // Clean up
    await closePool();
    console.log('🔚 Database connection closed');
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  runConnectionTest();
}

module.exports = { runConnectionTest };