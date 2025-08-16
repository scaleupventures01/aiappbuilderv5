#!/usr/bin/env node

/**
 * PRD-1.1.5.2 Image Upload Endpoint - Simple Validation
 * Quick validation of implementation against PRD requirements
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 PRD-1.1.5.2 Image Upload Endpoint - Validation Starting...');
console.log('=' .repeat(60));

// Test results
const results = {
  timestamp: new Date().toISOString(),
  tests: [],
  summary: { passed: 0, failed: 0, total: 0 }
};

function runTest(name, testFn) {
  console.log(`\n🧪 Testing: ${name}`);
  results.summary.total++;
  
  try {
    const result = testFn();
    if (result.success) {
      results.summary.passed++;
      console.log(`✅ PASS: ${result.message}`);
    } else {
      results.summary.failed++;
      console.log(`❌ FAIL: ${result.message}`);
    }
    results.tests.push({ name, ...result });
  } catch (error) {
    results.summary.failed++;
    console.log(`💥 ERROR: ${error.message}`);
    results.tests.push({ name, success: false, message: error.message });
  }
}

// Test 1: Check if upload route exists
runTest('Upload Route File Exists', () => {
  const uploadPath = path.resolve(__dirname, '../../api/routes/upload.js');
  const exists = fs.existsSync(uploadPath);
  return {
    success: exists,
    message: exists ? 'Upload route file found' : 'Upload route file missing'
  };
});

// Test 2: Check upload service
runTest('Upload Service File Exists', () => {
  const servicePath = path.resolve(__dirname, '../../services/uploadService.js');
  const exists = fs.existsSync(servicePath);
  return {
    success: exists,
    message: exists ? 'Upload service file found' : 'Upload service file missing'
  };
});

// Test 3: Check database schema
runTest('Database Schema File Exists', () => {
  const schemaPath = path.resolve(__dirname, '../../db/schemas/uploads.sql');
  const exists = fs.existsSync(schemaPath);
  return {
    success: exists,
    message: exists ? 'Database schema file found' : 'Database schema file missing'
  };
});

// Test 4: Validate upload route content
runTest('Upload Route Implementation', () => {
  const uploadPath = path.resolve(__dirname, '../../api/routes/upload.js');
  
  if (!fs.existsSync(uploadPath)) {
    return { success: false, message: 'Upload route file not found' };
  }
  
  const content = fs.readFileSync(uploadPath, 'utf8');
  const checks = [
    { pattern: /multer/, name: 'Multer integration' },
    { pattern: /image\/jpeg|image\/png|image\/gif|image\/webp/, name: 'Image format support' },
    { pattern: /15\s*\*\s*1024\s*\*\s*1024/, name: '15MB file size limit' },
    { pattern: /files:\s*5/, name: 'File count limit (5 files)' },
    { pattern: /cloudinary/, name: 'Cloudinary integration' },
    { pattern: /INSERT INTO uploads/, name: 'Database insertion' },
    { pattern: /authenticateToken/, name: 'Authentication middleware' }
  ];
  
  const passed = checks.filter(check => check.pattern.test(content));
  const failed = checks.filter(check => !check.pattern.test(content));
  
  return {
    success: passed.length >= 5,
    message: `Implementation checks: ${passed.length}/${checks.length} passed. Missing: ${failed.map(f => f.name).join(', ')}`
  };
});

// Test 5: Validate upload service content
runTest('Upload Service Implementation', () => {
  const servicePath = path.resolve(__dirname, '../../services/uploadService.js');
  
  if (!fs.existsSync(servicePath)) {
    return { success: false, message: 'Upload service file not found' };
  }
  
  const content = fs.readFileSync(servicePath, 'utf8');
  const checks = [
    { pattern: /sharp/, name: 'Sharp image processing' },
    { pattern: /cloudinary/, name: 'Cloudinary integration' },
    { pattern: /uploadBuffer/, name: 'Buffer upload method' },
    { pattern: /processImage/, name: 'Image processing' },
    { pattern: /generateThumbnail/, name: 'Thumbnail generation' }
  ];
  
  const passed = checks.filter(check => check.pattern.test(content));
  
  return {
    success: passed.length >= 4,
    message: `Service checks: ${passed.length}/${checks.length} passed`
  };
});

// Test 6: Validate database schema
runTest('Database Schema Implementation', () => {
  const schemaPath = path.resolve(__dirname, '../../db/schemas/uploads.sql');
  
  if (!fs.existsSync(schemaPath)) {
    return { success: false, message: 'Database schema file not found' };
  }
  
  const content = fs.readFileSync(schemaPath, 'utf8');
  const requiredFields = [
    'id', 'user_id', 'cloudinary_public_id', 'original_filename',
    'file_type', 'file_size', 'secure_url', 'thumbnail_url'
  ];
  
  const foundFields = requiredFields.filter(field => content.includes(field));
  
  return {
    success: foundFields.length >= 7,
    message: `Database fields: ${foundFields.length}/${requiredFields.length} found`
  };
});

// Test 7: Server integration check
runTest('Server Integration', () => {
  const serverPath = path.resolve(__dirname, '../../server.js');
  
  if (!fs.existsSync(serverPath)) {
    return { success: false, message: 'Server file not found' };
  }
  
  const content = fs.readFileSync(serverPath, 'utf8');
  const hasUploadRoutes = content.includes('upload') && (content.includes('/api/upload') || content.includes('uploadRoutes'));
  
  return {
    success: hasUploadRoutes,
    message: hasUploadRoutes ? 'Upload routes integrated in server' : 'Upload routes not found in server'
  };
});

// Generate summary
console.log('\n' + '=' .repeat(60));
console.log('📊 VALIDATION SUMMARY');
console.log('=' .repeat(60));
console.log(`Total Tests: ${results.summary.total}`);
console.log(`Passed: ${results.summary.passed}`);
console.log(`Failed: ${results.summary.failed}`);
console.log(`Success Rate: ${((results.summary.passed / results.summary.total) * 100).toFixed(1)}%`);

// Save results
const timestamp = Date.now();
const resultsPath = path.join(__dirname, 'evidence', `simple-validation-${timestamp}.json`);

// Ensure evidence directory exists
if (!fs.existsSync(path.dirname(resultsPath))) {
  fs.mkdirSync(path.dirname(resultsPath), { recursive: true });
}

fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
console.log(`\n💾 Results saved to: ${resultsPath}`);

// Overall status
const overallStatus = results.summary.failed <= 1 ? 'PASS' : 'FAIL';
console.log(`\n🏁 OVERALL STATUS: ${overallStatus}`);

// Exit with appropriate code
process.exit(results.summary.failed > 1 ? 1 : 0);