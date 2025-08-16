#!/usr/bin/env node
/**
 * Test Script for Sequential Workflow Runner
 * Tests the simplified approach that uses direct function calls
 */

import { SequentialWorkflowRunner } from './lib/orch/sequential-workflow-runner.mjs';

async function testSequentialWorkflow() {
  console.log('🧪 Testing Sequential Workflow Runner');
  console.log('═'.repeat(60));
  
  const runner = new SequentialWorkflowRunner();
  
  try {
    // Test with the user's working pattern: "run 1.1.3.3 and then 1.1.3.4"
    const testDescription = 'run 1.1.3.3 and then 1.1.3.4';
    console.log(`Testing: "${testDescription}"`);
    console.log('This mimics your working command structure but uses direct function calls');
    console.log('instead of subprocess spawning.\n');
    
    const result = await runner.executeSequentialWorkflow(testDescription);
    
    console.log('\n📊 Test Results:');
    console.log('─'.repeat(40));
    console.log(`Success: ${result.success}`);
    console.log(`Completed PRDs: ${result.completedPRDs?.length || 0}`);
    console.log(`Failed PRDs: ${result.failedPRDs?.length || 0}`);
    
    if (result.success) {
      console.log('✅ Sequential workflow test passed!');
      
      const summary = runner.getSummary();
      console.log('\n📈 Performance Summary:');
      console.log(`  Total PRDs: ${summary.total}`);
      console.log(`  Success Rate: ${summary.successRate.toFixed(1)}%`);
      console.log(`  Total Time: ${summary.totalTimeMinutes.toFixed(1)} minutes`);
      console.log(`  Average Time per PRD: ${summary.averageTimePerPRD.toFixed(1)} minutes`);
      
    } else {
      console.log('❌ Sequential workflow test failed');
      console.log(`Error: ${result.error}`);
    }
    
  } catch (error) {
    console.error('❌ Test failed with exception:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run test if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testSequentialWorkflow().catch(console.error);
}

export { testSequentialWorkflow };