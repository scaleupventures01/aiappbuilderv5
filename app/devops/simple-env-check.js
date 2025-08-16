/**
 * Simple Environment Validation for DevOps
 */

console.log('🔍 DevOps Environment Validation Starting...\n');

// Required environment variables for PRD 1.2.2
const required = [
  'NODE_ENV',
  'PORT',
  'DATABASE_URL',
  'JWT_SECRET',
  'OPENAI_API_KEY',
  'MAX_FILE_SIZE_MB',
  'ALLOWED_FILE_TYPES'
];

let issues = 0;
let warnings = 0;

console.log('📋 Checking Required Environment Variables:');
for (const varName of required) {
  const value = process.env[varName];
  if (!value) {
    console.log(`❌ MISSING: ${varName}`);
    issues++;
  } else {
    const displayValue = ['JWT_SECRET', 'OPENAI_API_KEY', 'DATABASE_URL'].includes(varName) 
      ? '***REDACTED***' 
      : value;
    console.log(`✅ ${varName}: ${displayValue}`);
  }
}

console.log('\n🔧 File Upload Configuration:');
const maxSize = process.env.MAX_FILE_SIZE_MB;
const allowedTypes = process.env.ALLOWED_FILE_TYPES;

if (maxSize) {
  console.log(`📁 Max file size: ${maxSize}MB`);
  if (parseInt(maxSize) > 50) {
    console.log(`⚠️  WARNING: File size limit is quite high (${maxSize}MB)`);
    warnings++;
  }
} else {
  console.log(`❌ MAX_FILE_SIZE_MB not configured`);
  issues++;
}

if (allowedTypes) {
  console.log(`📎 Allowed types: ${allowedTypes}`);
  const types = allowedTypes.toLowerCase();
  if (types.includes('exe') || types.includes('bat') || types.includes('sh')) {
    console.log(`🚨 SECURITY RISK: Executable file types detected`);
    issues++;
  }
} else {
  console.log(`❌ ALLOWED_FILE_TYPES not configured`);
  issues++;
}

console.log('\n🤖 OpenAI Configuration:');
if (process.env.OPENAI_MOCK_ENABLED === 'true') {
  console.log(`⚠️  OpenAI Mock Mode: ENABLED`);
  console.log(`📝 Note: Mock mode is active - good for testing`);
  warnings++;
} else {
  console.log(`🟢 OpenAI Mock Mode: DISABLED (Live API)`);
}

console.log('\n📊 Summary:');
console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`Issues: ${issues}`);
console.log(`Warnings: ${warnings}`);

if (issues === 0) {
  console.log('✅ Environment validation PASSED');
} else {
  console.log('❌ Environment validation FAILED');
  console.log(`Please fix ${issues} configuration issues before deployment`);
}

console.log('\n' + '='.repeat(50));
process.exit(issues > 0 ? 1 : 0);