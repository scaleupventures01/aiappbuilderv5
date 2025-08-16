import { Pool } from 'pg';

// Railway PostgreSQL configuration
// Railway provides DATABASE_URL or individual connection parameters
const getDatabaseConfig = () => {
  // If DATABASE_URL is provided (Railway standard), use it
  if (process.env.DATABASE_URL) {
    return {
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      max: 20, // Maximum connections in pool
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000, // Increased for Railway latency
      statement_timeout: 30000,
      query_timeout: 30000
    };
  }

  // Fallback to individual parameters (Railway also provides these)
  return {
    host: process.env.DB_HOST || process.env.PGHOST || 'localhost',
    port: process.env.DB_PORT || process.env.PGPORT || 5432,
    database: process.env.DB_NAME || process.env.PGDATABASE || 'elite_trading_coach_ai',
    user: process.env.DB_USER || process.env.PGUSER || 'trading_coach_user',
    password: process.env.DB_PASSWORD || process.env.PGPASSWORD,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
    statement_timeout: 30000,
    query_timeout: 30000
  };
};

// Create production-ready pool
const createRailwayPool = () => {
  const config = getDatabaseConfig();
  
  console.log('Creating Railway database pool with config:', {
    host: config.host || 'CONNECTION_STRING',
    port: config.port || 'CONNECTION_STRING',
    database: config.database || 'CONNECTION_STRING',
    user: config.user || 'CONNECTION_STRING',
    ssl: !!config.ssl,
    max: config.max
  });

  const pool = new Pool(config);

  // Enhanced error handling for Railway
  pool.on('error', (err) => {
    console.error('Railway database pool error:', err);
    // Don't exit in production, let Railway handle restarts
    if (process.env.NODE_ENV !== 'production') {
      process.exit(-1);
    }
  });

  pool.on('connect', (client) => {
    console.log('Railway database client connected');
    // Set timezone to UTC for consistency
    client.query('SET timezone TO UTC');
  });

  pool.on('remove', (client) => {
    console.log('Railway database client removed');
  });

  return pool;
};

// Test Railway connection with retry logic
const testRailwayConnection = async (pool, maxRetries = 3) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Railway connection test attempt ${attempt}/${maxRetries}`);
      const client = await pool.connect();
      
      // Test basic query
      const result = await client.query('SELECT NOW() as server_time, version() as pg_version');
      console.log('Railway database connected successfully:', {
        server_time: result.rows[0].server_time,
        pg_version: result.rows[0].pg_version.split(' ')[0]
      });
      
      // Test database exists and is accessible
      const dbTest = await client.query('SELECT current_database(), current_user');
      console.log('Railway database info:', {
        database: dbTest.rows[0].current_database,
        user: dbTest.rows[0].current_user
      });
      
      client.release();
      return true;
    } catch (err) {
      console.error(`Railway connection test attempt ${attempt} failed:`, err.message);
      
      if (attempt === maxRetries) {
        console.error('Railway database connection failed after all retries');
        throw err;
      }
      
      // Wait before retry (exponential backoff)
      const delay = Math.pow(2, attempt) * 1000;
      console.log(`Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

// Railway-specific query helper with metrics
const railwayQuery = async (pool, text, params) => {
  const start = Date.now();
  const client = await pool.connect();
  
  try {
    const res = await client.query(text, params);
    const duration = Date.now() - start;
    
    // Log query metrics for Railway monitoring
    console.log('Railway query executed:', {
      duration: `${duration}ms`,
      rows: res.rowCount,
      command: res.command,
      query_preview: text.slice(0, 100) + (text.length > 100 ? '...' : '')
    });
    
    return res;
  } catch (err) {
    const duration = Date.now() - start;
    console.error('Railway query error:', {
      duration: `${duration}ms`,
      error: err.message,
      query_preview: text.slice(0, 100) + (text.length > 100 ? '...' : '')
    });
    throw err;
  } finally {
    client.release();
  }
};

// Graceful shutdown for Railway
const closeRailwayPool = async (pool) => {
  try {
    console.log('Closing Railway database pool...');
    await pool.end();
    console.log('Railway database pool closed successfully');
  } catch (err) {
    console.error('Error closing Railway database pool:', err);
    throw err;
  }
};

export {
  getDatabaseConfig,
  createRailwayPool,
  testRailwayConnection,
  railwayQuery,
  closeRailwayPool
};