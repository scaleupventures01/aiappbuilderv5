#!/usr/bin/env node
/**
 * Demo script for Multi-PRD Workflow Orchestration
 * Shows various usage patterns and capabilities
 */

import { MultiPRDOrchestrator } from '../lib/orch/multi-prd-orchestrator.mjs';

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m'
};

async function runDemo() {
  console.log(`${colors.bright}🎭 Multi-PRD Workflow Orchestration Demo${colors.reset}`);
  console.log('═'.repeat(60));
  console.log('');

  const demos = [
    {
      name: 'Simple Sequential',
      description: 'Run 1.1.2.1 then 1.1.2.2 then 1.1.2.3',
      explanation: 'Executes PRDs one after another, each waiting for the previous to complete'
    },
    {
      name: 'Parallel Execution',
      description: 'Run 1.1.2.1, 1.1.2.2, and 1.1.2.3 in parallel',
      explanation: 'Executes all three PRDs simultaneously for faster completion'
    },
    {
      name: 'Mixed Parallel and Sequential',
      description: 'Run 1.1.2.1 and 1.1.2.2 together, then 1.1.2.3, then 1.1.2.4',
      explanation: 'Combines parallel and sequential execution for optimal workflow'
    },
    {
      name: 'Complex Backend API Suite',
      description: 'Run PRDs 1.1.2.1, 1.1.2.2, and 1.1.2.3 concurrently, then 1.1.2.4 after they complete, finally 1.1.2.5',
      explanation: 'Real-world scenario: Set up core backend services in parallel, then add endpoints sequentially'
    }
  ];

  console.log(`${colors.cyan}📋 Available Workflow Patterns:${colors.reset}\n`);

  demos.forEach((demo, index) => {
    console.log(`${colors.bright}${index + 1}. ${demo.name}${colors.reset}`);
    console.log(`   Description: "${demo.description}"`);
    console.log(`   ${colors.yellow}${demo.explanation}${colors.reset}`);
    console.log('');
  });

  console.log('─'.repeat(60));
  console.log(`\n${colors.cyan}🔍 Dry Run Demonstration:${colors.reset}\n`);

  // Run a dry-run demo
  const orchestrator = new MultiPRDOrchestrator();
  const demoWorkflow = demos[3].description; // Use the complex example

  console.log(`Running: "${demoWorkflow}"\n`);
  
  const result = await orchestrator.executeWorkflow(demoWorkflow, {
    autoConfirm: 'dry-run'
  });

  if (result.dryRun && result.plan) {
    console.log(`\n${colors.green}✅ Dry run completed successfully!${colors.reset}`);
    console.log('\nExecution Plan Generated:');
    console.log(`- Total stages: ${result.plan.stages.length}`);
    console.log(`- Estimated duration: ${result.plan.totalDuration} minutes`);
    
    result.plan.stages.forEach((stage, index) => {
      console.log(`\n  Stage ${index + 1}:`);
      console.log(`    Start: T+${stage.startTime} min`);
      console.log(`    Tasks: ${stage.tasks.length} PRD(s)`);
      console.log(`    End: T+${stage.endTime} min`);
    });
  }

  console.log('\n' + '═'.repeat(60));
  console.log(`\n${colors.cyan}💡 Usage Examples:${colors.reset}\n`);

  console.log('From command line:');
  console.log(`  ${colors.bright}orch workflow "Run 1.1.2.1 and 1.1.2.2 together, then 1.1.2.3"${colors.reset}`);
  console.log('');
  
  console.log('Natural language variations that work:');
  console.log('  - "Execute PRDs 1.1.2.1, 1.1.2.2 concurrently, followed by 1.1.2.3"');
  console.log('  - "Do 1.1.2.1 and 1.1.2.2 simultaneously, after that run 1.1.2.3"');
  console.log('  - "Start with 1.1.2.1 and 1.1.2.2 in parallel, then do 1.1.2.3 sequentially"');
  console.log('');

  console.log(`${colors.cyan}🚀 Key Features:${colors.reset}`);
  console.log('  ✓ Natural language parsing');
  console.log('  ✓ Automatic dependency resolution');
  console.log('  ✓ Parallel execution for speed');
  console.log('  ✓ Progress tracking per PRD');
  console.log('  ✓ Failure handling with blocking');
  console.log('  ✓ Cross-PRD dependency alerts');
  console.log('  ✓ Comprehensive reporting');
  console.log('  ✓ Dry-run mode for planning');

  console.log('\n' + '═'.repeat(60));
}

// Run the demo
runDemo().catch(console.error);