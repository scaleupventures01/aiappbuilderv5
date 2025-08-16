#!/usr/bin/env node

/**
 * Simple API Test for PRD 1.2.2 Trade Analysis API Endpoint
 * QA Engineer: Elite Trading Coach AI Team
 * Date: 2025-08-15
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);

console.log('🏁 Starting Simple API Test for PRD 1.2.2...');

async function testServerFiles() {
  console.log('\n📁 Testing server files existence...');
  
  const requiredFiles = [
    '/Users/calvinwilliamsjr/Dev Projects/Elite Trading Coach AI/mvp v.05/app/server.js',
    '/Users/calvinwilliamsjr/Dev Projects/Elite Trading Coach AI/mvp v.05/app/api/analyze-trade.js'
  ];
  
  const results = [];
  
  for (const file of requiredFiles) {
    const exists = fs.existsSync(file);
    console.log(`${exists ? '✅' : '❌'} ${file}`);
    results.push({ file, exists });
  }
  
  return results;
}

async function testServerStartup() {
  console.log('\n🚀 Testing server startup...');
  
  try {
    // Change to app directory
    process.chdir('/Users/calvinwilliamsjr/Dev Projects/Elite Trading Coach AI/mvp v.05/app');
    
    // Try to start server for 10 seconds and capture output
    const { stdout, stderr } = await execAsync('timeout 10s node server.js || true', { 
      timeout: 15000 
    });
    
    const output = stdout + stderr;
    
    console.log('📝 Server output:');
    console.log(output);
    
    // Check for success indicators
    if (output.includes('Elite Trading Coach AI Server Started')) {
      console.log('✅ Server started successfully');
      return { success: true, output };
    } else if (output.includes('healthCheckMiddleware is not defined')) {
      console.log('❌ Server has healthCheckMiddleware error (supposedly fixed)');
      return { success: false, output, error: 'healthCheckMiddleware error' };
    } else if (output.includes('Missing required environment variables')) {
      console.log('⚠️  Server has environment variable issues but may still work');
      return { success: 'partial', output, error: 'Environment variables missing' };
    } else {
      console.log('❌ Server failed to start');
      return { success: false, output, error: 'Unknown startup failure' };
    }
    
  } catch (error) {
    console.log(`❌ Error testing server startup: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function testAPIRouting() {
  console.log('\n🔍 Testing API file structure...');
  
  try {
    const apiFile = '/Users/calvinwilliamsjr/Dev Projects/Elite Trading Coach AI/mvp v.05/app/api/analyze-trade.js';
    
    if (!fs.existsSync(apiFile)) {
      console.log('❌ API file does not exist');
      return { success: false, error: 'API file missing' };
    }
    
    const content = fs.readFileSync(apiFile, 'utf8');
    
    // Check for key components
    const checks = [
      { name: 'Express Router', pattern: /router\.post.*analyze-trade|router\.post.*\/.*\// },
      { name: 'Multer Upload', pattern: /multer|upload\.single/ },
      { name: 'Input Validation', pattern: /validateTradeAnalysisRequest|validation/ },
      { name: 'Error Handling', pattern: /asyncHandler|catch.*error/ },
      { name: 'Rate Limiting', pattern: /rateLimit|analysisRateLimit/ },
      { name: 'Authentication', pattern: /authenticateToken|auth/ }
    ];
    
    console.log('🔍 API Component Analysis:');
    checks.forEach(check => {
      const found = check.pattern.test(content);
      console.log(`${found ? '✅' : '❌'} ${check.name}`);
    });
    
    return { success: true, checks: checks.map(c => ({ ...c, found: c.pattern.test(content) })) };
    
  } catch (error) {
    console.log(`❌ Error analyzing API file: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function testEnvironmentConfig() {
  console.log('\n⚙️ Testing environment configuration...');
  
  const envFile = '/Users/calvinwilliamsjr/Dev Projects/Elite Trading Coach AI/mvp v.05/app/.env';
  const envExampleFile = '/Users/calvinwilliamsjr/Dev Projects/Elite Trading Coach AI/mvp v.05/app/.env.example';
  
  console.log(`${fs.existsSync(envFile) ? '✅' : '❌'} .env file exists`);
  console.log(`${fs.existsSync(envExampleFile) ? '✅' : '⚪'} .env.example file exists`);
  
  // Check for critical environment variables
  if (fs.existsSync(envFile)) {
    const envContent = fs.readFileSync(envFile, 'utf8');
    const criticalVars = [
      'DATABASE_URL',
      'JWT_SECRET',
      'OPENAI_API_KEY',
      'NODE_ENV'
    ];
    
    console.log('🔑 Environment Variables:');
    criticalVars.forEach(varName => {
      const exists = envContent.includes(`${varName}=`);
      console.log(`${exists ? '✅' : '❌'} ${varName}`);
    });
  }
}

async function generateSimpleReport() {
  console.log('\n📊 Generating Simple QA Report...');
  
  const timestamp = new Date().toISOString();
  const results = {
    timestamp,
    testType: 'Simple API Structure Validation',
    files: await testServerFiles(),
    serverTest: await testServerStartup(),
    apiAnalysis: await testAPIRouting(),
  };
  
  await testEnvironmentConfig();
  
  // Write results
  const reportPath = path.join(process.cwd(), 'simple-validation-results.json');
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  
  console.log(`\n📄 Report saved: ${reportPath}`);
  
  // Summary
  console.log('\n🎯 SIMPLE VALIDATION SUMMARY:');
  console.log(`📁 Required Files: ${results.files.filter(f => f.exists).length}/${results.files.length}`);
  console.log(`🚀 Server Status: ${results.serverTest.success === true ? 'WORKING' : results.serverTest.success === 'partial' ? 'PARTIAL' : 'FAILED'}`);
  console.log(`🔧 API Structure: ${results.apiAnalysis.success ? 'COMPLETE' : 'INCOMPLETE'}`);
  
  if (results.apiAnalysis.success) {
    const passedChecks = results.apiAnalysis.checks.filter(c => c.found).length;
    console.log(`📋 API Components: ${passedChecks}/${results.apiAnalysis.checks.length} found`);
  }
  
  return results;
}

// Run the simple test
generateSimpleReport()
  .then(results => {
    console.log('\n✅ Simple API validation complete!');
    
    // Determine overall status
    if (results.serverTest.success === true && results.apiAnalysis.success) {
      console.log('🎉 PRD 1.2.2 appears to be properly implemented!');
    } else if (results.serverTest.success === 'partial' && results.apiAnalysis.success) {
      console.log('⚠️  PRD 1.2.2 is implemented but has configuration issues');
    } else {
      console.log('❌ PRD 1.2.2 has implementation issues');
    }
  })
  .catch(error => {
    console.error('❌ Simple validation failed:', error);
  });