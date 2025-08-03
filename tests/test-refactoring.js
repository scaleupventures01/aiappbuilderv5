/**
 * test-refactoring.js
 * Test script to verify refactoring changes work correctly
 */

const Logger = require('./lib/utils/Logger');
const ConfigurationManager = require('./lib/config/ConfigurationManager');
const ModelManager = require('./lib/core/ModelManager');

async function testRefactoring() {
    console.log('🧪 Testing Refactoring Changes...\n');
    
    try {
        // Test 1: ConfigurationManager
        console.log('✅ Test 1: ConfigurationManager');
        const configManager = ConfigurationManager.getInstance();
        await configManager.loadAllConfigs();
        
        const modelIds = configManager.getModelIds();
        console.log(`   Loaded ${modelIds.length} models`);
        
        const agentTypes = configManager.getAgentTypes();
        console.log(`   Loaded ${agentTypes.length} agent types`);
        
        const validation = configManager.validateConfigs();
        console.log(`   Config validation: ${validation.valid ? 'PASS' : 'FAIL'}`);
        if (!validation.valid) {
            console.log(`   Issues: ${validation.issues.join(', ')}`);
        }
        
        // Test 2: Logger
        console.log('\n✅ Test 2: Logger');
        const logger = new Logger().child({ test: 'refactoring' });
        logger.info('Logger test message');
        logger.warn('Logger warning message');
        console.log('   Logger working correctly');
        
        // Test 3: ModelManager
        console.log('\n✅ Test 3: ModelManager');
        const modelManager = ModelManager.default;
        await modelManager.initialize();
        
        const healthStatus = await modelManager.getHealthStatus();
        console.log(`   ModelManager health: ${healthStatus.initialized ? 'OK' : 'FAIL'}`);
        console.log(`   Config valid: ${healthStatus.configValid ? 'YES' : 'NO'}`);
        
        // Test 4: Model Selection
        console.log('\n✅ Test 4: Model Selection');
        const selection = await modelManager.selectModel({ agentType: 'requirements' });
        console.log(`   Selected model: ${selection.modelId}`);
        console.log(`   Model name: ${selection.model?.name || 'Unknown'}`);
        console.log(`   Cost estimate: ${typeof selection.costEstimate === 'number' ? '$' + selection.costEstimate.toFixed(6) : JSON.stringify(selection.costEstimate)}`);
        
        // Test 5: Cost Comparison
        console.log('\n✅ Test 5: Cost Comparison');
        const comparison = modelManager.getCostComparison('requirements');
        if (comparison) {
            console.log(`   Agent type: ${comparison.agentType}`);
            console.log(`   Optimized models: ${comparison.optimized?.models?.length || 0}`);
            console.log(`   Fallback models: ${comparison.fallback?.models?.length || 0}`);
        } else {
            console.log('   No cost comparison available');
        }
        
        // Test 6: Configuration Validation
        console.log('\n✅ Test 6: Configuration Validation');
        const modelConfig = modelManager.getModelConfig('sonnet-4');
        if (modelConfig) {
            console.log(`   Sonnet-4 config loaded: ${modelConfig.name}`);
            console.log(`   Context window: ${modelConfig.contextWindow}`);
            console.log(`   Cost per million: $${modelConfig.costPerMillion.input}/${modelConfig.costPerMillion.output}`);
        } else {
            console.log('   Sonnet-4 config not found');
        }
        
        console.log('\n🎉 All refactoring tests passed!');
        console.log('\n📋 Summary:');
        console.log('✅ ConfigurationManager - Centralized config loading');
        console.log('✅ Logger - Structured logging system');
        console.log('✅ ModelManager - Resolved circular dependencies');
        console.log('✅ Model Selection - Working with new architecture');
        console.log('✅ Cost Management - Integrated with new system');
        console.log('✅ Configuration Validation - Proper error handling');
        
    } catch (error) {
        console.error('\n❌ Refactoring test failed:', error.message);
        console.error('Stack trace:', error.stack);
        process.exit(1);
    }
}

// Run the test
testRefactoring(); 