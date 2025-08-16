/**
 * Simple Deployment Readiness Check
 * DevOps verification for PRD 1.2.2
 */

console.log('🚀 Deployment Readiness Check for PRD 1.2.2');
console.log('='.repeat(50));

let issues = 0;
let warnings = 0;

// Check critical files exist
console.log('\n📁 Critical Files Check:');
const criticalFiles = [
  '../server.js',
  '../package.json',
  '../railway.json',
  '../db/connection.js',
  '../middleware/uploadValidation.js'
];

const fs = await import('fs');
for (const file of criticalFiles) {
  try {
    fs.accessSync(file);
    console.log(`✅ ${file.replace('../', '')}`);
  } catch (error) {
    console.log(`❌ ${file.replace('../', '')} - MISSING`);
    issues++;
  }
}

// Check environment configuration
console.log('\n🔧 Environment Configuration:');
const requiredEnvVars = [
  'NODE_ENV', 'PORT', 'DATABASE_URL', 'JWT_SECRET', 
  'OPENAI_API_KEY', 'MAX_FILE_SIZE_MB', 'ALLOWED_FILE_TYPES'
];

for (const envVar of requiredEnvVars) {
  if (process.env[envVar]) {
    const displayValue = ['JWT_SECRET', 'OPENAI_API_KEY', 'DATABASE_URL'].includes(envVar) 
      ? '***CONFIGURED***' 
      : process.env[envVar];
    console.log(`✅ ${envVar}: ${displayValue}`);
  } else {
    console.log(`❌ ${envVar}: NOT SET`);
    issues++;
  }
}

// Check security configuration
console.log('\n🔒 Security Configuration:');

if (process.env.JWT_SECRET === 'dev-jwt-secret-key-not-for-production-use') {
  console.log('❌ JWT_SECRET: Using development secret in production');
  issues++;
} else {
  console.log('✅ JWT_SECRET: Production secret configured');
}

if (process.env.OPENAI_MOCK_ENABLED === 'true') {
  console.log('⚠️  OPENAI_MOCK_ENABLED: Mock mode active');
  warnings++;
} else {
  console.log('✅ OPENAI_MOCK_ENABLED: Live API mode');
}

const allowedTypes = process.env.ALLOWED_FILE_TYPES?.toLowerCase() || '';
const dangerousTypes = ['exe', 'bat', 'sh', 'js', 'php'];
const hasDangerousTypes = dangerousTypes.some(type => allowedTypes.includes(type));

if (hasDangerousTypes) {
  console.log('🚨 ALLOWED_FILE_TYPES: Dangerous executable types detected');
  issues++;
} else {
  console.log('✅ ALLOWED_FILE_TYPES: Safe file types only');
}

// Check deployment configuration
console.log('\n🚂 Railway Deployment:');
try {
  const railwayConfig = fs.readFileSync('../railway.json', 'utf8');
  const config = JSON.parse(railwayConfig);
  
  if (config.deploy?.healthcheckPath) {
    console.log(`✅ Health check configured: ${config.deploy.healthcheckPath}`);
  } else {
    console.log('⚠️  Health check path not configured');
    warnings++;
  }
  
  if (config.deploy?.startCommand) {
    console.log(`✅ Start command: ${config.deploy.startCommand}`);
  } else {
    console.log('❌ Start command not configured');
    issues++;
  }
} catch (error) {
  console.log('❌ Railway config invalid or missing');
  issues++;
}

// Overall assessment
console.log('\n' + '='.repeat(50));
console.log('📊 DEPLOYMENT READINESS SUMMARY');
console.log('='.repeat(50));

console.log(`Issues: ${issues}`);
console.log(`Warnings: ${warnings}`);

if (issues === 0) {
  console.log('\n✅ READY FOR DEPLOYMENT');
  console.log('All critical deployment checks passed');
  
  if (warnings > 0) {
    console.log(`⚠️  ${warnings} warnings detected - review recommended`);
  }
} else {
  console.log('\n❌ NOT READY FOR DEPLOYMENT');
  console.log(`Fix ${issues} critical issues before deploying`);
}

// Exit with appropriate code
process.exit(issues > 0 ? 1 : 0);