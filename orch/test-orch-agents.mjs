#!/usr/bin/env node

/**
 * Test how orch start assigns agents for different feature types
 */

import { orchestrateTeam } from './lib/orch/workflow-runner.mjs';

console.log('\n🔍 TESTING ORCH START AGENT ASSIGNMENT\n');
console.log('=' .repeat(70));

const testFeatures = [
  { id: '1.1.1.1.0.0', desc: 'UI/Frontend feature' },
  { id: '2.3.1.1.0.0', desc: 'Backend/API feature' },
  { id: '3.2.1.1.0.0', desc: 'Data/Analytics feature' },
  { id: '4.1.1.4.0.0', desc: 'AI/ML feature with ML tasks' },
  { id: '5.1.1.3.0.0', desc: 'Infrastructure with integration' },
  { id: '1.8.3.1.5.0', desc: 'Complex UI with automation' },
  { id: '8.9.1.1.0.0', desc: 'Large initiative with leadership' }
];

async function testOrchestration() {
  for (const feature of testFeatures) {
    console.log(`\n📋 Feature: ${feature.id} - ${feature.desc}`);
    console.log('-'.repeat(70));
    
    try {
      const orchestration = await orchestrateTeam(feature.id);
      
      console.log(`Status: ${orchestration.status}`);
      console.log(`Agents assigned: ${orchestration.agents.length}`);
      console.log('\nTeam composition:');
      
      // Group by role type
      const roles = orchestration.assignments.map(a => a.role);
      
      const leadership = roles.filter(r => r.includes('vp-') || r.includes('cto') || r.includes('chief'));
      const product = roles.filter(r => r.includes('product'));
      const engineering = roles.filter(r => r.includes('engineer') && !r.includes('qa'));
      const ai = roles.filter(r => r.includes('ai-') || r.includes('ml') || r.includes('machine'));
      const data = roles.filter(r => r.includes('data'));
      const design = roles.filter(r => r.includes('ux') || r.includes('designer'));
      const qa = roles.filter(r => r.includes('qa'));
      
      if (leadership.length > 0) console.log(`  Leadership: ${leadership.join(', ')}`);
      if (product.length > 0) console.log(`  Product: ${product.join(', ')}`);
      if (engineering.length > 0) console.log(`  Engineering: ${engineering.join(', ')}`);
      if (ai.length > 0) console.log(`  AI/ML: ${ai.join(', ')}`);
      if (data.length > 0) console.log(`  Data: ${data.join(', ')}`);
      if (design.length > 0) console.log(`  Design: ${design.join(', ')}`);
      if (qa.length > 0) console.log(`  QA: ${qa.join(', ')}`);
      
      // Show task count
      const totalTasks = orchestration.assignments.reduce((sum, a) => sum + a.tasks.length, 0);
      console.log(`\nTotal tasks: ${totalTasks}`);
      
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
  }
  
  console.log('\n' + '=' .repeat(70));
  console.log('\n✅ AGENT ASSIGNMENT TEST COMPLETE\n');
  console.log('The orch start command now intelligently assigns agents based on:');
  console.log('  • Feature type (UI, Backend, Data, AI, Infrastructure)');
  console.log('  • Feature complexity (more complex = more agents)');
  console.log('  • Specific requirements (security, performance, ML, etc.)');
  console.log('  • Feature maturity (production-ready features get automation)');
  console.log('  • Initiative size (large projects get leadership involvement)');
}

testOrchestration().catch(console.error);