/**
 * Simple Health Check for DevOps
 * PRD 1.2.2 Service Monitoring
 */

console.log('🏥 DevOps Health Check Starting...\n');

// Test Database Connection
async function testDatabase() {
  try {
    console.log('🗄️  Testing database connection...');
    
    // Simple database test without importing complex modules
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      throw new Error('DATABASE_URL not configured');
    }
    
    console.log('✅ Database configuration found');
    return { status: 'configured', url: '***REDACTED***' };
  } catch (error) {
    console.log(`❌ Database error: ${error.message}`);
    return { status: 'error', error: error.message };
  }
}

// Test OpenAI Configuration
async function testOpenAI() {
  try {
    console.log('🤖 Testing OpenAI configuration...');
    
    const apiKey = process.env.OPENAI_API_KEY;
    const mockEnabled = process.env.OPENAI_MOCK_ENABLED === 'true';
    
    if (!apiKey && !mockEnabled) {
      throw new Error('OPENAI_API_KEY not configured and mock disabled');
    }
    
    if (mockEnabled) {
      console.log('⚠️  OpenAI mock mode enabled');
      return { status: 'mock', mode: 'development' };
    } else {
      console.log('✅ OpenAI API key configured');
      return { status: 'configured', mode: 'live' };
    }
  } catch (error) {
    console.log(`❌ OpenAI error: ${error.message}`);
    return { status: 'error', error: error.message };
  }
}

// Test File Upload Configuration
async function testFileUpload() {
  try {
    console.log('📁 Testing file upload configuration...');
    
    const maxSize = process.env.MAX_FILE_SIZE_MB;
    const allowedTypes = process.env.ALLOWED_FILE_TYPES;
    
    if (!maxSize) {
      throw new Error('MAX_FILE_SIZE_MB not configured');
    }
    
    if (!allowedTypes) {
      throw new Error('ALLOWED_FILE_TYPES not configured');
    }
    
    const sizeNum = parseInt(maxSize, 10);
    if (sizeNum > 50) {
      console.log(`⚠️  Large file size limit: ${maxSize}MB`);
    }
    
    console.log(`✅ File upload config: ${maxSize}MB, ${allowedTypes.split(',').length} types`);
    return { 
      status: 'configured', 
      maxSize: `${maxSize}MB`, 
      typeCount: allowedTypes.split(',').length 
    };
  } catch (error) {
    console.log(`❌ File upload error: ${error.message}`);
    return { status: 'error', error: error.message };
  }
}

// Test Server Health
async function testServer() {
  try {
    console.log('🖥️  Testing server health...');
    
    const memory = process.memoryUsage();
    const uptime = process.uptime();
    const memoryMB = Math.round(memory.rss / 1024 / 1024);
    
    let status = 'healthy';
    if (memoryMB > 500) {
      status = 'high-memory';
      console.log(`⚠️  High memory usage: ${memoryMB}MB`);
    }
    
    console.log(`✅ Server: ${memoryMB}MB memory, ${Math.floor(uptime)}s uptime`);
    return { 
      status, 
      memory: `${memoryMB}MB`, 
      uptime: `${Math.floor(uptime)}s`,
      nodeVersion: process.version
    };
  } catch (error) {
    console.log(`❌ Server error: ${error.message}`);
    return { status: 'error', error: error.message };
  }
}

// Main health check
async function runHealthCheck() {
  const results = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    checks: {}
  };

  // Run all checks
  results.checks.database = await testDatabase();
  results.checks.openai = await testOpenAI();
  results.checks.fileUpload = await testFileUpload();
  results.checks.server = await testServer();

  // Determine overall status
  const hasErrors = Object.values(results.checks).some(check => check.status === 'error');
  const hasWarnings = Object.values(results.checks).some(check => 
    check.status === 'mock' || check.status === 'high-memory'
  );

  if (hasErrors) {
    results.overall = 'unhealthy';
  } else if (hasWarnings) {
    results.overall = 'degraded';
  } else {
    results.overall = 'healthy';
  }

  console.log('\n📊 Health Check Summary:');
  console.log(`Overall Status: ${results.overall.toUpperCase()}`);
  console.log(`Environment: ${results.environment}`);
  console.log(`Timestamp: ${results.timestamp}`);

  return results;
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runHealthCheck()
    .then(results => {
      console.log('\n' + '='.repeat(50));
      process.exit(results.overall === 'unhealthy' ? 1 : 0);
    })
    .catch(error => {
      console.error('❌ Health check failed:', error);
      process.exit(1);
    });
}

export { runHealthCheck };