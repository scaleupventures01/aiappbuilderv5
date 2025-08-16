/**
 * Deployment Readiness Verification
 * DevOps checklist and validation for PRD 1.2.2
 * Production deployment preparation
 */

import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Deployment readiness checklist
 */
const deploymentChecklist = {
  environment: [
    { name: 'NODE_ENV configured', check: () => process.env.NODE_ENV === 'production' },
    { name: 'PORT configured', check: () => !!process.env.PORT },
    { name: 'DATABASE_URL configured', check: () => !!process.env.DATABASE_URL },
    { name: 'JWT_SECRET configured', check: () => !!process.env.JWT_SECRET && process.env.JWT_SECRET.length >= 32 },
    { name: 'OPENAI_API_KEY configured', check: () => !!process.env.OPENAI_API_KEY },
    { name: 'File upload limits set', check: () => !!process.env.MAX_FILE_SIZE_MB && !!process.env.ALLOWED_FILE_TYPES }
  ],
  
  security: [
    { name: 'Production JWT secret', check: () => process.env.JWT_SECRET !== 'dev-jwt-secret-key-not-for-production-use' },
    { name: 'Security level set', check: () => process.env.SECURITY_LEVEL === 'strict' || process.env.SECURITY_LEVEL === 'production' },
    { name: 'Rate limiting enabled', check: () => !!process.env.RATE_LIMIT_MAX && parseInt(process.env.RATE_LIMIT_MAX) <= 1000 },
    { name: 'OpenAI mock disabled', check: () => process.env.OPENAI_MOCK_ENABLED !== 'true' },
    { name: 'Safe file types only', check: () => {
      const types = process.env.ALLOWED_FILE_TYPES?.toLowerCase() || '';
      const dangerousTypes = ['exe', 'bat', 'sh', 'js', 'php', 'jsp'];
      return !dangerousTypes.some(type => types.includes(type));
    }}
  ],
  
  infrastructure: [
    { name: 'Railway config exists', check: () => existsSync(join(__dirname, '../railway.json')) },
    { name: 'Package.json valid', check: () => existsSync(join(__dirname, '../package.json')) },
    { name: 'Server.js exists', check: () => existsSync(join(__dirname, '../server.js')) },
    { name: 'Database config exists', check: () => existsSync(join(__dirname, '../db/connection.js')) },
    { name: 'Health check endpoint', check: () => existsSync(join(__dirname, '../db/health-check.js')) }
  ],
  
  api: [
    { name: 'Upload middleware exists', check: () => existsSync(join(__dirname, '../middleware/uploadValidation.js')) },
    { name: 'OpenAI service exists', check: () => existsSync(join(__dirname, '../config/openai.js')) },
    { name: 'Error handler exists', check: () => existsSync(join(__dirname, '../server/middleware/error-handler.js')) },
    { name: 'CORS configured', check: () => existsSync(join(__dirname, '../server/middleware/cors-config.js')) },
    { name: 'Rate limiting configured', check: () => existsSync(join(__dirname, '../server/middleware/rate-limit.js')) }
  ],
  
  monitoring: [
    { name: 'Health checks enabled', check: () => process.env.ENABLE_HEALTH_CHECKS === 'true' },
    { name: 'Metrics enabled', check: () => process.env.ENABLE_METRICS === 'true' },
    { name: 'Logging configured', check: () => !!process.env.LOG_LEVEL },
    { name: 'Error monitoring ready', check: () => !!process.env.SENTRY_DSN || process.env.NODE_ENV !== 'production' }
  ]
};

/**
 * Run deployment readiness check
 */
function runDeploymentReadinessCheck() {
  console.log('🚀 Deployment Readiness Verification');
  console.log('PRD 1.2.2 Production Deployment Check');
  console.log('='.repeat(50));
  
  const results = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    overall: 'ready',
    categories: {},
    summary: {
      totalChecks: 0,
      passedChecks: 0,
      failedChecks: 0,
      readyForProduction: false
    }
  };
  
  let allPassed = true;
  
  for (const [category, checks] of Object.entries(deploymentChecklist)) {
    console.log(`\n📋 ${category.toUpperCase()} CHECKS:`);
    
    const categoryResults = {
      passed: 0,
      failed: 0,
      checks: []
    };
    
    for (const checkItem of checks) {
      let passed = false;
      let error = null;
      
      try {
        passed = checkItem.check();
      } catch (err) {
        error = err.message;
        passed = false;
      }
      
      const icon = passed ? '✅' : '❌';
      console.log(`${icon} ${checkItem.name}`);
      
      if (error) {
        console.log(`   Error: ${error}`);
      }
      
      if (passed) {
        categoryResults.passed++;
      } else {
        categoryResults.failed++;
        allPassed = false;
      }
      
      categoryResults.checks.push({
        name: checkItem.name,
        passed,
        error
      });
      
      results.summary.totalChecks++;
      if (passed) {
        results.summary.passedChecks++;
      } else {
        results.summary.failedChecks++;
      }
    }
    
    results.categories[category] = categoryResults;
    
    const categoryStatus = categoryResults.failed === 0 ? 'PASS' : 'FAIL';
    console.log(`   Category Status: ${categoryStatus} (${categoryResults.passed}/${categoryResults.passed + categoryResults.failed})`);
  }
  
  // Overall assessment
  results.overall = allPassed ? 'ready' : 'not-ready';
  results.summary.readyForProduction = allPassed;
  
  console.log('\n' + '='.repeat(50));
  console.log('📊 DEPLOYMENT READINESS SUMMARY');
  console.log('='.repeat(50));
  console.log(`Environment: ${results.environment}`);
  console.log(`Total Checks: ${results.summary.totalChecks}`);
  console.log(`Passed: ${results.summary.passedChecks}`);
  console.log(`Failed: ${results.summary.failedChecks}`);
  console.log(`Success Rate: ${Math.round((results.summary.passedChecks / results.summary.totalChecks) * 100)}%`);
  
  if (results.summary.readyForProduction) {
    console.log('\n✅ READY FOR PRODUCTION DEPLOYMENT');
    console.log('All deployment readiness checks passed.');
  } else {
    console.log('\n❌ NOT READY FOR PRODUCTION');
    console.log(`Fix ${results.summary.failedChecks} issues before deployment.`);
    
    // Show specific failures
    console.log('\n🔧 Issues to fix:');
    for (const [category, categoryData] of Object.entries(results.categories)) {
      const failedChecks = categoryData.checks.filter(c => !c.passed);
      if (failedChecks.length > 0) {
        console.log(`   ${category}:`);
        failedChecks.forEach(check => {
          console.log(`      - ${check.name}`);
          if (check.error) {
            console.log(`        Error: ${check.error}`);
          }
        });
      }
    }
  }
  
  return results;
}

/**
 * Check Docker configuration (if applicable)
 */
function checkDockerConfiguration() {
  console.log('\n🐳 Docker Configuration Check:');
  
  const dockerFiles = [
    'Dockerfile',
    'docker-compose.yml',
    '.dockerignore'
  ];
  
  let dockerConfigured = false;
  
  for (const file of dockerFiles) {
    const filePath = join(__dirname, `../${file}`);
    if (existsSync(filePath)) {
      console.log(`✅ ${file} exists`);
      dockerConfigured = true;
    } else {
      console.log(`❌ ${file} missing`);
    }
  }
  
  if (!dockerConfigured) {
    console.log('ℹ️  Docker not configured - using Railway native deployment');
  }
  
  return dockerConfigured;
}

/**
 * Validate package.json for production
 */
function validatePackageJson() {
  console.log('\n📦 Package.json Validation:');
  
  try {
    const packagePath = join(__dirname, '../package.json');
    const packageData = JSON.parse(readFileSync(packagePath, 'utf8'));
    
    const requiredScripts = ['start', 'build'];
    const hasAllScripts = requiredScripts.every(script => packageData.scripts && packageData.scripts[script]);
    
    if (hasAllScripts) {
      console.log('✅ Required scripts present');
    } else {
      console.log('❌ Missing required scripts (start, build)');
    }
    
    const hasEngines = packageData.engines && packageData.engines.node;
    if (hasEngines) {
      console.log(`✅ Node version specified: ${packageData.engines.node}`);
    } else {
      console.log('⚠️  Node version not specified in engines');
    }
    
    const productionDeps = packageData.dependencies ? Object.keys(packageData.dependencies).length : 0;
    console.log(`📊 Production dependencies: ${productionDeps}`);
    
    return {
      hasRequiredScripts: hasAllScripts,
      hasEngines,
      dependencyCount: productionDeps
    };
  } catch (error) {
    console.log(`❌ Package.json validation failed: ${error.message}`);
    return { error: error.message };
  }
}

/**
 * Generate deployment checklist report
 */
function generateDeploymentReport() {
  console.log('\n📋 Generating Deployment Report...');
  
  const readinessResults = runDeploymentReadinessCheck();
  const dockerConfig = checkDockerConfiguration();
  const packageValidation = validatePackageJson();
  
  const report = {
    ...readinessResults,
    docker: { configured: dockerConfig },
    package: packageValidation,
    recommendations: []
  };
  
  // Add recommendations
  if (!readinessResults.summary.readyForProduction) {
    report.recommendations.push('Complete all failed deployment readiness checks');
  }
  
  if (process.env.NODE_ENV !== 'production') {
    report.recommendations.push('Set NODE_ENV=production for production deployment');
  }
  
  if (!process.env.SENTRY_DSN && process.env.NODE_ENV === 'production') {
    report.recommendations.push('Configure error monitoring (Sentry) for production');
  }
  
  if (report.recommendations.length > 0) {
    console.log('\n💡 Deployment Recommendations:');
    report.recommendations.forEach((rec, i) => {
      console.log(`   ${i + 1}. ${rec}`);
    });
  }
  
  return report;
}

// Export functions
export {
  runDeploymentReadinessCheck,
  generateDeploymentReport,
  checkDockerConfiguration,
  validatePackageJson,
  deploymentChecklist
};

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  (async () => {
    try {
      const report = generateDeploymentReport();
      
      // Save report
      const fs = await import('fs/promises');
      const reportPath = join(__dirname, `../devops/deployment-readiness-${Date.now()}.json`);
      await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
      console.log(`\n📄 Deployment report saved to: ${reportPath}`);
      
      console.log('\n' + '='.repeat(50));
      process.exit(report.summary.readyForProduction ? 0 : 1);
    } catch (error) {
      console.error('❌ Deployment readiness check failed:', error);
      process.exit(1);
    }
  })();
}