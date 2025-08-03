// Test script for the new MultiModelAPIManager
const MultiModelAPIManager = require('./lib/MultiModelAPIManager');

async function testAPIManager() {
    console.log('🧪 Testing Enhanced MultiModelAPIManager with new models...\n');
    
    try {
        // Create API manager instance
        const apiManager = new MultiModelAPIManager();
        console.log('✅ MultiModelAPIManager created successfully');
        
        // Test provider health check
        console.log('\n🔍 Checking provider health:');
        console.log('=' .repeat(50));
        const health = await apiManager.checkProviderHealth();
        
        for (const [provider, status] of Object.entries(health)) {
            console.log(`${provider}:`);
            console.log(`  Initialized: ${status.initialized ? '✅' : '❌'}`);
            console.log(`  Available: ${status.available ? '✅' : '❌'}`);
            console.log(`  Models: ${status.models.join(', ')}`);
        }
        
        // Test model provider mapping
        console.log('\n🔧 Testing model provider mapping:');
        console.log('=' .repeat(50));
        
        const testModels = [
            'flash-lite', 'flash', 'gemini-pro',
            'gpt-4-nano', 'gpt-4-mini', 'gpt-4o', 'o3', 'o4-mini',
            'claude-37', 'opus-4', 'sonnet-4',
            'deepseek-v3'
        ];
        
        for (const model of testModels) {
            const provider = apiManager.getProviderForModel(model);
            if (provider) {
                console.log(`${model}: ${provider.name} ✅`);
            } else {
                console.log(`${model}: No provider found ❌`);
            }
        }
        
        // Test completion with different providers (if API keys are available)
        console.log('\n🚀 Testing completion requests:');
        console.log('=' .repeat(50));
        
        const testMessages = [
            { role: 'user', content: 'Hello! Please respond with just "Hi there!"' }
        ];
        
        // Test with a simple model if available
        const simpleModels = ['sonnet-4', 'flash-lite', 'gpt-4-mini'];
        
        for (const model of simpleModels) {
            try {
                console.log(`\nTesting ${model}...`);
                const result = await apiManager.complete({
                    model: model,
                    messages: testMessages,
                    maxTokens: 20,
                    temperature: 0.1
                });
                
                console.log(`✅ ${model} response: "${result.content.trim()}"`);
                console.log(`   Usage: ${result.usage.inputTokens} input, ${result.usage.outputTokens} output tokens`);
                
                // Only test one successful model to avoid rate limits
                break;
                
            } catch (error) {
                console.log(`❌ ${model} failed: ${error.message}`);
            }
        }
        
        // Test error handling and retry logic
        console.log('\n🛡️ Testing error handling:');
        console.log('=' .repeat(50));
        
        try {
            await apiManager.complete({
                model: 'non-existent-model',
                messages: testMessages,
                maxTokens: 10
            });
        } catch (error) {
            console.log(`✅ Error handling works: ${error.message}`);
        }
        
        // Test retry configuration
        console.log('\n⚙️ Retry configuration:');
        console.log('=' .repeat(50));
        console.log(`Max retries: ${apiManager.retryConfig.maxRetries}`);
        console.log(`Initial delay: ${apiManager.retryConfig.initialDelay}ms`);
        console.log(`Max delay: ${apiManager.retryConfig.maxDelay}ms`);
        console.log(`Backoff factor: ${apiManager.retryConfig.backoffFactor}`);
        
        console.log('\n✅ All tests completed successfully!');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error(error.stack);
    }
}

// Run the test
testAPIManager(); 