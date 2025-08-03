#!/usr/bin/env node

/**
 * test-llm-connections.js
 * Test script for connecting and using LLMs with Team Leader System v4.0
 */

require('dotenv').config();

const TeamLeaderSystem = require('./TeamLeaderSystem');
const APIKeyManager = require('./lib/APIKeyManager');
const MultiModelAPIManager = require('./lib/MultiModelAPIManager');

class LLMConnectionTester {
    constructor() {
        this.system = null;
        this.keyManager = null;
        this.apiManager = null;
    }

    async initialize() {
        console.log('🚀 Initializing Team Leader System...\n');
        
        try {
            // Initialize the main system
            this.system = new TeamLeaderSystem('llm-test-project');
            await this.system.initialize();
            
            // Get key modules
            this.keyManager = this.system.getModule('keyManager');
            this.apiManager = this.system.getModule('apiManager');
            
            console.log('✅ System initialized successfully!\n');
            return true;
        } catch (error) {
            console.error('❌ Failed to initialize system:', error.message);
            return false;
        }
    }

    async checkAPIKeys() {
        console.log('🔑 Checking API Keys...\n');
        
        const providers = {
            openai: process.env.OPENAI_API_KEY,
            google: process.env.GOOGLE_API_KEY,
            anthropic: process.env.ANTHROPIC_API_KEY,
            deepseek: process.env.DEEPSEEK_API_KEY
        };

        let configuredCount = 0;
        
        for (const [provider, key] of Object.entries(providers)) {
            if (key) {
                console.log(`✅ ${provider.toUpperCase()}: Configured`);
                configuredCount++;
                
                // Test the key format
                try {
                    await this.keyManager.setKey(provider, key, true);
                    console.log(`   └─ Key format: Valid`);
                } catch (error) {
                    console.log(`   └─ Key format: Invalid (${error.message})`);
                }
            } else {
                console.log(`❌ ${provider.toUpperCase()}: Not configured`);
            }
        }

        console.log(`\n📊 Summary: ${configuredCount}/4 providers configured\n`);
        return configuredCount > 0;
    }

    async testProviderHealth() {
        console.log('🏥 Testing Provider Health...\n');
        
        try {
            await this.apiManager.checkProviderHealth();
            console.log('✅ Provider health check completed\n');
            return true;
        } catch (error) {
            console.error('❌ Provider health check failed:', error.message);
            return false;
        }
    }

    async testSimpleCompletion() {
        console.log('🧪 Testing Simple Completion...\n');
        
        const testPrompts = [
            { model: 'gpt-4o', prompt: 'Say hello in 5 words or less' },
            { model: 'gemini-pro', prompt: 'What is 2+2?' },
            { model: 'claude-37', prompt: 'Name a programming language' }
        ];

        for (const test of testPrompts) {
            try {
                console.log(`Testing ${test.model}...`);
                
                const response = await this.apiManager.complete({
                    model: test.model,
                    messages: [{ role: 'user', content: test.prompt }],
                    maxTokens: 50,
                    temperature: 0.7
                });

                console.log(`✅ ${test.model}: "${response.content.trim()}"`);
            } catch (error) {
                console.log(`❌ ${test.model}: ${error.message}`);
            }
        }
        
        console.log('');
    }

    async testModelRecommendations() {
        console.log('🎯 Testing Model Recommendations...\n');
        
        try {
            const recommendationEngine = this.system.getModule('modelRecommendationEngine');
            
            if (recommendationEngine) {
                const tasks = ['code_generation', 'content_creation', 'data_analysis'];
                
                for (const task of tasks) {
                    console.log(`Getting recommendations for ${task}...`);
                    
                    const recommendations = await recommendationEngine.getRecommendations(
                        task,
                        'balanced'
                    );
                    
                    if (recommendations.length > 0) {
                        console.log(`✅ Top recommendation: ${recommendations[0].model} (score: ${recommendations[0].score.toFixed(3)})`);
                    } else {
                        console.log(`❌ No recommendations available`);
                    }
                }
            } else {
                console.log('⚠️ Model Recommendation Engine not available');
            }
        } catch (error) {
            console.log(`❌ Model recommendations test failed: ${error.message}`);
        }
        
        console.log('');
    }

    async testBudgetTracking() {
        console.log('💰 Testing Budget Tracking...\n');
        
        try {
            const budgetManager = this.system.getModule('budgetManager');
            
            if (budgetManager) {
                // Set a test budget
                await budgetManager.setTotalBudget(10);
                console.log('✅ Set test budget: $10');
                
                // Track some spending
                await budgetManager.trackSpending('gpt-4o', 0.05, 'test');
                await budgetManager.trackSpending('claude-37', 0.03, 'test');
                
                // Get budget status
                const status = budgetManager.getBudgetStatus();
                console.log(`✅ Budget status: $${status.spent.toFixed(2)} spent of $${status.total}`);
            } else {
                console.log('⚠️ Budget Manager not available');
            }
        } catch (error) {
            console.log(`❌ Budget tracking test failed: ${error.message}`);
        }
        
        console.log('');
    }

    async testPerformanceMonitoring() {
        console.log('📊 Testing Performance Monitoring...\n');
        
        try {
            const performanceDashboard = this.system.getModule('performanceDashboard');
            
            if (performanceDashboard) {
                // Record some test metrics
                await performanceDashboard.recordMetric('responseTime', 'gpt-4o', 1200);
                await performanceDashboard.recordMetric('accuracy', 'gpt-4o', 0.95);
                await performanceDashboard.recordMetric('responseTime', 'claude-37', 800);
                await performanceDashboard.recordMetric('accuracy', 'claude-37', 0.92);
                
                console.log('✅ Recorded test performance metrics');
                
                // Get a quick report
                const report = await performanceDashboard.getPerformanceReport('1h');
                console.log(`✅ Performance report generated with ${Object.keys(report.summary).length} metric types`);
            } else {
                console.log('⚠️ Performance Dashboard not available');
            }
        } catch (error) {
            console.log(`❌ Performance monitoring test failed: ${error.message}`);
        }
        
        console.log('');
    }

    async testRateLimiting() {
        console.log('🚦 Testing Rate Limiting...\n');
        
        try {
            const rateLimitManager = this.system.getModule('rateLimitManager');
            
            if (rateLimitManager) {
                // Test rate limit check
                const result = await rateLimitManager.checkRateLimit('openai', 'test-request', 'medium');
                console.log(`✅ Rate limit check: ${result.allowed ? 'Allowed' : 'Blocked'}`);
                
                // Get rate limit status
                const status = rateLimitManager.getRateLimitStatus('openai');
                console.log(`✅ Rate limit status: ${status.enabled ? 'Enabled' : 'Disabled'}`);
            } else {
                console.log('⚠️ Rate Limit Manager not available');
            }
        } catch (error) {
            console.log(`❌ Rate limiting test failed: ${error.message}`);
        }
        
        console.log('');
    }

    async runAllTests() {
        console.log('🤖 LLM Connection Test Suite\n');
        console.log('=' .repeat(50) + '\n');

        // Initialize system
        if (!await this.initialize()) {
            return;
        }

        // Run tests
        await this.checkAPIKeys();
        await this.testProviderHealth();
        await this.testSimpleCompletion();
        await this.testModelRecommendations();
        await this.testBudgetTracking();
        await this.testPerformanceMonitoring();
        await this.testRateLimiting();

        console.log('🎉 Test Suite Completed!\n');
        console.log('📋 Next Steps:');
        console.log('1. Check the results above');
        console.log('2. Fix any issues with API keys');
        console.log('3. Start using the system with your preferred models');
        console.log('4. Explore the advanced features in LLM_SETUP_GUIDE.md');
    }

    async interactiveTest() {
        console.log('🎮 Interactive LLM Test\n');
        console.log('This will let you test specific models interactively.\n');

        const readline = require('readline');
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        const question = (prompt) => new Promise((resolve) => rl.question(prompt, resolve));

        try {
            const model = await question('Enter model to test (e.g., gpt-4o, claude-37, gemini-pro): ');
            const prompt = await question('Enter your prompt: ');

            console.log('\n🤖 Testing...\n');

            const response = await this.apiManager.complete({
                model: model,
                messages: [{ role: 'user', content: prompt }],
                maxTokens: 500,
                temperature: 0.7
            });

            console.log('✅ Response:');
            console.log(response.content);
            console.log('\n📊 Usage:');
            console.log(`- Model: ${model}`);
            console.log(`- Tokens: ${response.usage?.total_tokens || 'Unknown'}`);

        } catch (error) {
            console.error('❌ Error:', error.message);
        } finally {
            rl.close();
        }
    }
}

// Main execution
async function main() {
    const tester = new LLMConnectionTester();
    
    const args = process.argv.slice(2);
    
    if (args.includes('--interactive') || args.includes('-i')) {
        await tester.initialize();
        await tester.interactiveTest();
    } else {
        await tester.runAllTests();
    }
}

// Run if called directly
if (require.main === module) {
    main().catch(console.error);
}

module.exports = LLMConnectionTester; 