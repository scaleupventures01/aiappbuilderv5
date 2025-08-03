// Test script for the new CostReporter
const CostReporter = require('./lib/CostReporter');

async function testCostReporter() {
    console.log('🧪 Testing Enhanced CostReporter with new model pricing...\n');
    
    try {
        // Create cost reporter instance
        const reporter = new CostReporter();
        console.log('✅ CostReporter created successfully');
        
        // Test tracking usage for different agents and models
        console.log('\n📊 Testing usage tracking:');
        console.log('=' .repeat(50));
        
        // Simulate usage for different agents
        const testUsage = [
            {
                agentId: 'senior-requirements-analyst',
                model: 'claude-3-opus-20240229',
                tokenUsage: { input_tokens: 5000, output_tokens: 2000 },
                usedFallback: false
            },
            {
                agentId: 'junior-database-engineer',
                model: 'gemini-1.5-flash-8b',
                tokenUsage: { input_tokens: 3000, output_tokens: 1500 },
                usedFallback: false
            },
            {
                agentId: 'senior-architect',
                model: 'gpt-4o',
                tokenUsage: { input_tokens: 8000, output_tokens: 4000 },
                usedFallback: false
            },
            {
                agentId: 'junior-content-creator',
                model: 'deepseek-chat',
                tokenUsage: { input_tokens: 2000, output_tokens: 1000 },
                usedFallback: false
            },
            {
                agentId: 'senior-security-engineer',
                model: 'claude-3-sonnet-20240229',
                tokenUsage: { input_tokens: 6000, output_tokens: 3000 },
                usedFallback: true // Simulate fallback usage
            }
        ];
        
        // Track usage for each test case
        for (const usage of testUsage) {
            reporter.trackUsage(
                usage.agentId,
                usage.model,
                usage.tokenUsage,
                usage.usedFallback
            );
            console.log(`✅ Tracked usage for ${usage.agentId} (${usage.model})`);
        }
        
        // Test summary generation
        console.log('\n📈 Testing summary generation:');
        console.log('=' .repeat(50));
        const summary = reporter.generateSummary();
        console.log(`Total Cost: $${summary.totalCost}`);
        console.log(`Total Tokens: ${summary.totalTokens}`);
        console.log(`Total Calls: ${summary.totalCalls}`);
        console.log(`Average Cost per Call: $${summary.averageCostPerCall}`);
        console.log(`Current Savings: $${summary.currentSavings} (${summary.savingsPercentage}%)`);
        
        // Test agent report
        console.log('\n🤖 Testing agent report:');
        console.log('=' .repeat(50));
        const agentReport = reporter.generateAgentReport();
        for (const agent of agentReport) {
            console.log(`${agent.agentType}:`);
            console.log(`  Cost: $${agent.totalCost}, Calls: ${agent.calls}`);
            console.log(`  Fallback Rate: ${agent.fallbackRate}`);
            console.log(`  Avg Cost/Call: $${agent.averageCostPerCall}`);
        }
        
        // Test model report
        console.log('\n🎯 Testing model report:');
        console.log('=' .repeat(50));
        const modelReport = reporter.generateModelReport();
        for (const model of modelReport) {
            console.log(`${model.model} (${model.provider}):`);
            console.log(`  Cost: $${model.totalCost}, Calls: ${model.calls}`);
            console.log(`  Pricing: $${model.inputCostPerMillion}/$${model.outputCostPerMillion} per 1M`);
        }
        
        // Test optimization metrics
        console.log('\n📊 Testing optimization metrics:');
        console.log('=' .repeat(50));
        const metrics = reporter.generateOptimizationMetrics();
        console.log(`Optimized Usage: ${metrics.optimizedUsage.percentage}`);
        console.log(`Fallback Usage: ${metrics.fallbackUsage.percentage}`);
        console.log(`Potential Savings: $${metrics.potentialSavings.ifAllOptimized}`);
        
        // Test projections
        console.log('\n📅 Testing cost projections:');
        console.log('=' .repeat(50));
        const projections = reporter.generateProjections();
        console.log(`Next Sprint: $${projections.nextSprint}`);
        console.log(`Next Month: $${projections.nextMonth}`);
        console.log(`With Optimization - Next Sprint: $${projections.withOptimization.nextSprint}`);
        
        // Test recommendations
        console.log('\n🎯 Testing recommendations:');
        console.log('=' .repeat(50));
        const recommendations = reporter.generateRecommendations();
        for (const rec of recommendations) {
            console.log(`${rec.priority} Priority: ${rec.issue}`);
            console.log(`  Action: ${rec.action}`);
            console.log(`  Impact: ${rec.impact}`);
        }
        
        // Test full report generation
        console.log('\n📋 Testing full report generation:');
        console.log('=' .repeat(50));
        const fullReport = reporter.generateReport();
        console.log('✅ Full report generated successfully');
        console.log(`Report length: ${fullReport.length} characters`);
        
        // Test specific methods
        console.log('\n🔧 Testing utility methods:');
        console.log('=' .repeat(50));
        
        // Test agent type extraction
        const testAgentIds = [
            'senior-requirements-analyst',
            'junior-database-engineer',
            'senior-architect',
            'unknown-agent'
        ];
        
        for (const agentId of testAgentIds) {
            const agentType = reporter.extractAgentType(agentId);
            console.log(`${agentId} → ${agentType}`);
        }
        
        // Test current rate calculation
        const currentRate = reporter.calculateCurrentRate();
        console.log(`Current cost rate: $${currentRate.toFixed(4)}`);
        
        console.log('\n✅ All tests completed successfully!');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error(error.stack);
    }
}

// Run the test
testCostReporter(); 