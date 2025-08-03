// Test script for the new ModelSelector
const ModelSelector = require('./lib/ModelSelectorIntegration');

async function testModelSelector() {
    console.log('🧪 Testing new ModelSelector with external configurations...\n');
    
    try {
        // Create model selector instance
        const selector = new ModelSelector();
        console.log('✅ ModelSelector created successfully');
        
        // Test model selection for different agent types
        const agentTypes = ['requirements', 'architect', 'database', 'development', 'content'];
        
        console.log('\n📊 Testing model selection for different agent types:');
        console.log('=' .repeat(60));
        
        for (const agentType of agentTypes) {
            console.log(`\n🔍 Testing ${agentType} agent:`);
            
            // Test optimized selection
            const optimized = selector.selectModel({
                agentType,
                taskComplexity: 'medium',
                useFallback: false
            });
            
            console.log(`  Optimized: ${optimized.model.name} (${optimized.modelId})`);
            console.log(`  Reasoning: ${optimized.reasoning}`);
            console.log(`  Cost: $${optimized.costEstimate.totalCost.toFixed(4)}`);
            
            // Test fallback selection
            const fallback = selector.selectModel({
                agentType,
                taskComplexity: 'medium',
                useFallback: true
            });
            
            console.log(`  Fallback: ${fallback.model.name} (${fallback.modelId})`);
            console.log(`  Cost: $${fallback.costEstimate.totalCost.toFixed(4)}`);
            
            // Get cost comparison
            const comparison = selector.getCostComparison(agentType);
            if (comparison) {
                console.log(`  Savings: $${comparison.savings.toFixed(2)} (${comparison.savingsPercent}%)`);
            }
        }
        
        // Test cost summary
        console.log('\n💰 Overall Cost Summary:');
        console.log('=' .repeat(60));
        const summary = selector.getCostSummary();
        console.log(`Optimized Total: ${summary.optimizedTotal}`);
        console.log(`Fallback Total: ${summary.fallbackTotal}`);
        console.log(`Total Savings: ${summary.totalSavings} (${summary.savingsPercentage})`);
        console.log(`Tokens Processed: ${summary.tokensProcessed}`);
        
        // Test model availability
        console.log('\n🔧 Testing model availability:');
        console.log('=' .repeat(60));
        
        // Mark a model as unavailable
        selector.updateAvailability('claude-3-opus-20240229', false);
        console.log('Marked Claude Opus 4 as unavailable');
        
        // Test selection with unavailable model
        const selectionWithUnavailable = selector.selectModel({
            agentType: 'requirements',
            useFallback: false
        });
        
        console.log(`Selected model: ${selectionWithUnavailable.model.name}`);
        console.log(`Model ID: ${selectionWithUnavailable.modelId}`);
        
        // Test default model
        console.log('\n🎯 Testing default model for unknown agent type:');
        console.log('=' .repeat(60));
        const defaultModel = selector.getDefaultModel();
        console.log(`Default: ${defaultModel.model.name} (${defaultModel.modelId})`);
        console.log(`Reasoning: ${defaultModel.reasoning}`);
        
        console.log('\n✅ All tests completed successfully!');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error(error.stack);
    }
}

// Run the test
testModelSelector(); 