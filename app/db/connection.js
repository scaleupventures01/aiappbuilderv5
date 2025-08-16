import { Pool } from 'pg';

// Import Railway-specific configuration for production
import { createRailwayPool, testRailwayConnection, railwayQuery, closeRailwayPool } from './railway-config.js';

// Determine if we're running on Railway
const isRailwayDeployment = () => {
  return process.env.RAILWAY_ENVIRONMENT || 
         process.env.DATABASE_URL || 
         (process.env.NODE_ENV === 'production' && process.env.PGHOST);
};

// Create appropriate database pool based on environment
const createDatabasePool = () => {
  if (isRailwayDeployment()) {
    console.log('Initializing Railway database connection...');
    return createRailwayPool();
  }

  console.log('Initializing local database connection...');
  return new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'elite_trading_coach_ai',
    user: process.env.DB_USER || 'trading_coach_user',
    password: process.env.DB_PASSWORD,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    max: 25, // Increased for upload operations
    min: 2, // Minimum idle connections
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000, // Increased timeout for uploads
    acquireTimeoutMillis: 60000, // Wait up to 60s for connection
    createTimeoutMillis: 20000,
    destroyTimeoutMillis: 5000,
    reapIntervalMillis: 1000,
    createRetryIntervalMillis: 100,
    // Upload-specific optimizations
    keepAlive: true,
    keepAliveInitialDelayMillis: 0
  });
};

const pool = createDatabasePool();

// Handle pool errors
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Test database connection
const testConnection = async () => {
  try {
    if (isRailwayDeployment()) {
      console.log('Testing Railway database connection...');
      return await testRailwayConnection(pool);
    }

    console.log('Testing local database connection...');
    const client = await pool.connect();
    console.log('Database connected successfully');
    
    // Test query to verify connection
    const result = await client.query('SELECT NOW()');
    console.log('Database time:', result.rows[0].now);
    
    client.release();
    return true;
  } catch (err) {
    console.error('Database connection error:', err);
    return false;
  }
};

// Query helper function
const query = async (text, params) => {
  if (isRailwayDeployment()) {
    return await railwayQuery(pool, text, params);
  }

  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (err) {
    console.error('Query error:', err);
    throw err;
  }
};

// Get client from pool for transactions
const getClient = async () => {
  return await pool.connect();
};

// Graceful shutdown
const closePool = async () => {
  try {
    if (isRailwayDeployment()) {
      await closeRailwayPool(pool);
    } else {
      await pool.end();
      console.log('Database pool closed');
    }
  } catch (err) {
    console.error('Error closing database pool:', err);
  }
};

export {
  pool,
  query,
  getClient,
  testConnection,
  closePool
};