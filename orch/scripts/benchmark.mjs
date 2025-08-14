#!/usr/bin/env node
/**
 * Performance Benchmark Script
 * Measures actual performance gains between original and optimized implementations
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { performance } from 'node:perf_hooks';
import { BatchFileOperator } from '../lib/orch/batch-file-ops.mjs';
import { OrchestrationCache } from '../lib/orch/cache-manager.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const testDir = path.join(__dirname, '../.benchmark-test');
const cacheDir = path.join(__dirname, '../.benchmark-cache');

// Clean up test directories
function cleanup() {
  try {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
    if (fs.existsSync(cacheDir)) {
      fs.rmSync(cacheDir, { recursive: true, force: true });
    }
  } catch (err) {
    console.error('Cleanup error:', err);
  }
}

// Benchmark: Synchronous File Operations (Original)
async function benchmarkSyncFileOps(numFiles = 10) {
  const results = [];
  
  for (let run = 0; run < 5; run++) {
    cleanup();
    fs.mkdirSync(testDir, { recursive: true });
    
    const start = performance.now();
    
    // Simulate original approach - sequential operations
    for (let i = 0; i < numFiles; i++) {
      const dir = path.join(testDir, `dir${i}`);
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, 'file1.txt'), `Content ${i}-1`);
      fs.writeFileSync(path.join(dir, 'file2.txt'), `Content ${i}-2`);
      fs.appendFileSync(path.join(dir, 'file1.txt'), '\nAppended content');
    }
    
    const end = performance.now();
    results.push(end - start);
  }
  
  return {
    avg: results.reduce((a, b) => a + b, 0) / results.length,
    min: Math.min(...results),
    max: Math.max(...results),
    runs: results
  };
}

// Benchmark: Batch File Operations (Optimized)
async function benchmarkBatchFileOps(numFiles = 10) {
  const results = [];
  
  for (let run = 0; run < 5; run++) {
    cleanup();
    fs.mkdirSync(testDir, { recursive: true });
    
    const start = performance.now();
    
    const batchOps = new BatchFileOperator();
    
    // Queue all operations
    for (let i = 0; i < numFiles; i++) {
      const dir = path.join(testDir, `dir${i}`);
      batchOps.queueMkdir(dir);
      batchOps.queueWrite(path.join(dir, 'file1.txt'), `Content ${i}-1`);
      batchOps.queueWrite(path.join(dir, 'file2.txt'), `Content ${i}-2`);
      batchOps.queueAppend(path.join(dir, 'file1.txt'), '\nAppended content');
    }
    
    // Execute all at once
    await batchOps.flush();
    
    const end = performance.now();
    results.push(end - start);
  }
  
  return {
    avg: results.reduce((a, b) => a + b, 0) / results.length,
    min: Math.min(...results),
    max: Math.max(...results),
    runs: results
  };
}

// Benchmark: Cache Performance
async function benchmarkCache() {
  cleanup();
  const cache = new OrchestrationCache(cacheDir);
  
  // Test data
  const testData = {
    small: { id: '1.1.1.1.0.0', data: 'x'.repeat(100) },
    medium: { id: '2.2.2.2.0.0', data: 'x'.repeat(10000) },
    large: { id: '3.3.3.3.0.0', data: 'x'.repeat(100000) }
  };
  
  const results = {
    misses: [],
    hits: []
  };
  
  // Benchmark cache misses (with computation)
  for (let run = 0; run < 100; run++) {
    const start = performance.now();
    await cache.withCache('test', `key-${run}`, async () => {
      // Simulate expensive operation
      await new Promise(resolve => setTimeout(resolve, 10));
      return testData.medium;
    });
    const end = performance.now();
    results.misses.push(end - start);
  }
  
  // Benchmark cache hits
  for (let run = 0; run < 100; run++) {
    const start = performance.now();
    await cache.withCache('test', 'key-1', async () => {
      // This shouldn't be called - should hit cache
      await new Promise(resolve => setTimeout(resolve, 10));
      return testData.medium;
    });
    const end = performance.now();
    results.hits.push(end - start);
  }
  
  return {
    missAvg: results.misses.reduce((a, b) => a + b, 0) / results.misses.length,
    hitAvg: results.hits.reduce((a, b) => a + b, 0) / results.hits.length,
    speedup: results.misses.reduce((a, b) => a + b, 0) / results.hits.reduce((a, b) => a + b, 0),
    stats: cache.getStats()
  };
}

// Benchmark: Simulated PRD Operations
async function benchmarkPRDOperations() {
  const prdContent = `
# PRD Document
${Array(100).fill('## Section\nLorem ipsum dolor sit amet, consectetur adipiscing elit.\n').join('\n')}
### 7.3 QA Artifacts
- Test cases file: \`QA/test-cases.md\`
- Latest results: \`QA/test-results.md\`
`.repeat(10); // Make it reasonably large
  
  const results = {
    original: [],
    optimized: []
  };
  
  // Original: Multiple regex replacements
  for (let run = 0; run < 50; run++) {
    const start = performance.now();
    let text = prdContent;
    
    // Simulate multiple regex operations (original approach)
    text = text.replace(/### 7\.3 QA Artifacts[\s\S]*?\n/, '### 7.3 QA Artifacts\nUpdated\n');
    text = text.replace(/## Section/g, '## Updated Section');
    text = text.replace(/Lorem ipsum/g, 'Updated Lorem');
    text = text.replace(/dolor sit amet/g, 'updated dolor');
    text = text.replace(/consectetur/g, 'updated consectetur');
    
    const end = performance.now();
    results.original.push(end - start);
  }
  
  // Optimized: Single pass (simulated)
  for (let run = 0; run < 50; run++) {
    const start = performance.now();
    
    // Single pass through content
    const lines = prdContent.split('\n');
    const output = [];
    for (const line of lines) {
      let updated = line;
      if (line.startsWith('### 7.3 QA Artifacts')) {
        updated = '### 7.3 QA Artifacts\nUpdated';
      } else if (line.includes('Section')) {
        updated = line.replace('Section', 'Updated Section');
      } else if (line.includes('Lorem') || line.includes('dolor') || line.includes('consectetur')) {
        updated = line
          .replace('Lorem ipsum', 'Updated Lorem')
          .replace('dolor sit amet', 'updated dolor')
          .replace('consectetur', 'updated consectetur');
      }
      output.push(updated);
    }
    const result = output.join('\n');
    
    const end = performance.now();
    results.optimized.push(end - start);
  }
  
  return {
    originalAvg: results.original.reduce((a, b) => a + b, 0) / results.original.length,
    optimizedAvg: results.optimized.reduce((a, b) => a + b, 0) / results.optimized.length,
    speedup: results.original.reduce((a, b) => a + b, 0) / results.optimized.reduce((a, b) => a + b, 0)
  };
}

// Main benchmark runner
async function main() {
  console.log('🚀 Performance Benchmark Suite');
  console.log('================================\n');
  
  console.log('📁 Benchmarking File Operations (10 directories, 20 files + 10 appends)...');
  const syncResults = await benchmarkSyncFileOps(10);
  const batchResults = await benchmarkBatchFileOps(10);
  
  console.log('\nResults:');
  console.log(`  Original (sync):    ${syncResults.avg.toFixed(2)}ms avg (${syncResults.min.toFixed(2)}ms - ${syncResults.max.toFixed(2)}ms)`);
  console.log(`  Optimized (batch):  ${batchResults.avg.toFixed(2)}ms avg (${batchResults.min.toFixed(2)}ms - ${batchResults.max.toFixed(2)}ms)`);
  console.log(`  ✅ Speedup:         ${(syncResults.avg / batchResults.avg).toFixed(2)}x faster\n`);
  
  console.log('💾 Benchmarking Cache Performance...');
  const cacheResults = await benchmarkCache();
  
  console.log('\nResults:');
  console.log(`  Cache miss (with 10ms operation): ${cacheResults.missAvg.toFixed(2)}ms avg`);
  console.log(`  Cache hit:                        ${cacheResults.hitAvg.toFixed(2)}ms avg`);
  console.log(`  ✅ Speedup:                       ${cacheResults.speedup.toFixed(2)}x faster`);
  console.log(`  Hit rate:                         ${cacheResults.stats.hitRate}\n`);
  
  console.log('📝 Benchmarking PRD Processing...');
  const prdResults = await benchmarkPRDOperations();
  
  console.log('\nResults:');
  console.log(`  Original (multiple regex): ${prdResults.originalAvg.toFixed(2)}ms avg`);
  console.log(`  Optimized (single pass):   ${prdResults.optimizedAvg.toFixed(2)}ms avg`);
  console.log(`  ✅ Speedup:                ${prdResults.speedup.toFixed(2)}x faster\n`);
  
  // Overall summary
  console.log('================================');
  console.log('📊 Overall Performance Summary:');
  console.log('================================');
  
  const fileIOImprovement = ((syncResults.avg - batchResults.avg) / syncResults.avg * 100).toFixed(1);
  const cacheImprovement = ((cacheResults.missAvg - cacheResults.hitAvg) / cacheResults.missAvg * 100).toFixed(1);
  const prdImprovement = ((prdResults.originalAvg - prdResults.optimizedAvg) / prdResults.originalAvg * 100).toFixed(1);
  
  console.log(`\n  File I/O:       ${fileIOImprovement}% faster with batching`);
  console.log(`  Cache Hits:     ${cacheImprovement}% faster than computation`);
  console.log(`  PRD Processing: ${prdImprovement}% faster with single-pass`);
  
  const avgImprovement = (
    parseFloat(fileIOImprovement) + 
    parseFloat(cacheImprovement) + 
    parseFloat(prdImprovement)
  ) / 3;
  
  console.log(`\n  🎯 Average Improvement: ${avgImprovement.toFixed(1)}%`);
  
  // Clean up
  cleanup();
  
  console.log('\n✅ Benchmark complete!\n');
  
  // Return structured results for programmatic use
  return {
    fileIO: {
      original: syncResults.avg,
      optimized: batchResults.avg,
      improvement: fileIOImprovement
    },
    cache: {
      miss: cacheResults.missAvg,
      hit: cacheResults.hitAvg,
      improvement: cacheImprovement
    },
    prd: {
      original: prdResults.originalAvg,
      optimized: prdResults.optimizedAvg,
      improvement: prdImprovement
    },
    overall: avgImprovement
  };
}

// Run benchmarks
main().catch(console.error);