#!/usr/bin/env node

/**
 * llm-example.js
 * Practical examples of using LLMs with Team Leader System v4.0
 */

require('dotenv').config();

const TeamLeaderSystem = require('./TeamLeaderSystem');

class LLMExamples {
    constructor() {
        this.system = null;
    }

    async initialize() {
        console.log('🚀 Initializing Team Leader System...\n');
        
        this.system = new TeamLeaderSystem('llm-examples');
        await this.system.initialize();
        
        console.log('✅ System ready!\n');
    }

    async example1_basicCompletion() {
        console.log('📝 Example 1: Basic Completion\n');
        
        const apiManager = this.system.getModule('apiManager');
        
        try {
            const response = await apiManager.complete({
                model: 'gpt-4o',
                messages: [
                    { role: 'user', content: 'Write a haiku about programming' }
                ],
                maxTokens: 100,
                temperature: 0.7
            });

            console.log('🤖 Response:');
            console.log(response.content);
            console.log('');
        } catch (error) {
            console.error('❌ Error:', error.message);
        }
    }

    async example2_conversation() {
        console.log('💬 Example 2: Multi-turn Conversation\n');
        
        const apiManager = this.system.getModule('apiManager');
        
        try {
            const messages = [
                { role: 'user', content: 'Hello! I need help with JavaScript.' },
                { role: 'assistant', content: 'Hello! I\'d be happy to help you with JavaScript. What specific question do you have?' },
                { role: 'user', content: 'How do I create a function that adds two numbers?' }
            ];

            const response = await apiManager.complete({
                model: 'claude-37',
                messages: messages,
                maxTokens: 200,
                temperature: 0.5
            });

            console.log('🤖 Response:');
            console.log(response.content);
            console.log('');
        } catch (error) {
            console.error('❌ Error:', error.message);
        }
    }

    async example3_modelComparison() {
        console.log('⚖️ Example 3: Model Comparison\n');
        
        const apiManager = this.system.getModule('apiManager');
        const prompt = 'Explain the concept of recursion in programming';
        
        const models = ['gpt-4o', 'claude-37', 'gemini-pro'];
        
        for (const model of models) {
            try {
                console.log(`Testing ${model}...`);
                
                const startTime = Date.now();
                const response = await apiManager.complete({
                    model: model,
                    messages: [{ role: 'user', content: prompt }],
                    maxTokens: 150,
                    temperature: 0.7
                });
                const endTime = Date.now();
                
                console.log(`✅ ${model}:`);
                console.log(`   Response: ${response.content.substring(0, 100)}...`);
                console.log(`   Time: ${endTime - startTime}ms`);
                console.log('');
            } catch (error) {
                console.log(`❌ ${model}: ${error.message}`);
            }
        }
    }

    async example4_costTracking() {
        console.log('💰 Example 4: Cost Tracking\n');
        
        const budgetManager = this.system.getModule('budgetManager');
        
        if (budgetManager) {
            try {
                // Set a budget
                await budgetManager.setTotalBudget(5);
                console.log('✅ Set budget: $5');
                
                // Simulate some API calls
                const costs = [
                    { model: 'gpt-4o', cost: 0.02 },
                    { model: 'claude-37', cost: 0.015 },
                    { model: 'gemini-pro', cost: 0.01 }
                ];
                
                for (const { model, cost } of costs) {
                    await budgetManager.trackSpending(model, cost, 'example');
                    console.log(`✅ Tracked $${cost} for ${model}`);
                }
                
                // Check budget status
                const status = budgetManager.getBudgetStatus();
                console.log(`\n📊 Budget Status:`);
                console.log(`   Total: $${status.total}`);
                console.log(`   Spent: $${status.spent.toFixed(3)}`);
                console.log(`   Remaining: $${status.remaining.toFixed(3)}`);
                console.log(`   Utilization: ${status.utilization.toFixed(1)}%`);
                console.log('');
            } catch (error) {
                console.error('❌ Error:', error.message);
            }
        } else {
            console.log('⚠️ Budget Manager not available');
        }
    }

    async example5_modelRecommendations() {
        console.log('🎯 Example 5: Model Recommendations\n');
        
        const recommendationEngine = this.system.getModule('modelRecommendationEngine');
        
        if (recommendationEngine) {
            try {
                const tasks = ['code_generation', 'content_creation', 'data_analysis'];
                
                for (const task of tasks) {
                    console.log(`Getting recommendations for ${task}...`);
                    
                    const recommendations = await recommendationEngine.getRecommendations(
                        task,
                        'balanced'
                    );
                    
                    if (recommendations.length > 0) {
                        console.log(`   Top 3 recommendations:`);
                        recommendations.slice(0, 3).forEach((rec, index) => {
                            console.log(`   ${index + 1}. ${rec.model} (score: ${rec.score.toFixed(3)})`);
                        });
                    }
                    console.log('');
                }
            } catch (error) {
                console.error('❌ Error:', error.message);
            }
        } else {
            console.log('⚠️ Model Recommendation Engine not available');
        }
    }

    async example6_performanceMonitoring() {
        console.log('📊 Example 6: Performance Monitoring\n');
        
        const performanceDashboard = this.system.getModule('performanceDashboard');
        
        if (performanceDashboard) {
            try {
                // Record some performance metrics
                const metrics = [
                    { model: 'gpt-4o', responseTime: 1200, accuracy: 0.95 },
                    { model: 'claude-37', responseTime: 800, accuracy: 0.92 },
                    { model: 'gemini-pro', responseTime: 600, accuracy: 0.88 }
                ];
                
                for (const metric of metrics) {
                    await performanceDashboard.recordMetric('responseTime', metric.model, metric.responseTime);
                    await performanceDashboard.recordMetric('accuracy', metric.model, metric.accuracy);
                    console.log(`✅ Recorded metrics for ${metric.model}`);
                }
                
                // Get performance report
                const report = await performanceDashboard.getPerformanceReport('1h');
                console.log(`\n📈 Performance Report:`);
                console.log(`   Models tracked: ${Object.keys(report.summary).length}`);
                console.log(`   Recommendations: ${report.recommendations.length}`);
                console.log('');
            } catch (error) {
                console.error('❌ Error:', error.message);
            }
        } else {
            console.log('⚠️ Performance Dashboard not available');
        }
    }

    async example7_agentSystem() {
        console.log('🤖 Example 7: Agent System Integration\n');
        
        try {
            // Create a coding agent
            const agent = await this.system.createAgent({
                name: 'CodeHelperAgent',
                model: 'gpt-4o',
                task: 'code_generation',
                prompt: 'You are a helpful coding assistant. Provide clear, well-documented code examples.'
            });
            
            console.log(`✅ Created agent: ${agent.name} (ID: ${agent.id})`);
            
            // Assign a task to the agent
            const task = await this.system.assignTask({
                agentId: agent.id,
                task: 'Create a JavaScript function to calculate fibonacci numbers',
                content: 'Please provide a recursive and iterative version'
            });
            
            console.log(`✅ Assigned task: ${task.id}`);
            console.log('');
        } catch (error) {
            console.error('❌ Error:', error.message);
        }
    }

    async runAllExamples() {
        console.log('🤖 LLM Examples - Team Leader System v4.0\n');
        console.log('=' .repeat(60) + '\n');

        await this.initialize();

        await this.example1_basicCompletion();
        await this.example2_conversation();
        await this.example3_modelComparison();
        await this.example4_costTracking();
        await this.example5_modelRecommendations();
        await this.example6_performanceMonitoring();
        await this.example7_agentSystem();

        console.log('🎉 All examples completed!\n');
        console.log('💡 Tips:');
        console.log('- Check LLM_SETUP_GUIDE.md for more advanced features');
        console.log('- Use test-llm-connections.js to test your API keys');
        console.log('- Explore the dashboard for real-time monitoring');
        console.log('- Try different models for different tasks');
    }

    async runSpecificExample(exampleNumber) {
        await this.initialize();
        
        const examples = {
            1: this.example1_basicCompletion,
            2: this.example2_conversation,
            3: this.example3_modelComparison,
            4: this.example4_costTracking,
            5: this.example5_modelRecommendations,
            6: this.example6_performanceMonitoring,
            7: this.example7_agentSystem
        };
        
        const example = examples[exampleNumber];
        if (example) {
            await example.call(this);
        } else {
            console.log('❌ Example not found. Available examples: 1-7');
        }
    }
}

// Main execution
async function main() {
    const examples = new LLMExamples();
    
    const args = process.argv.slice(2);
    
    if (args.length > 0) {
        const exampleNumber = parseInt(args[0]);
        if (exampleNumber >= 1 && exampleNumber <= 7) {
            await examples.runSpecificExample(exampleNumber);
        } else {
            console.log('Usage: node llm-example.js [1-7]');
            console.log('Examples:');
            console.log('  1: Basic Completion');
            console.log('  2: Multi-turn Conversation');
            console.log('  3: Model Comparison');
            console.log('  4: Cost Tracking');
            console.log('  5: Model Recommendations');
            console.log('  6: Performance Monitoring');
            console.log('  7: Agent System Integration');
        }
    } else {
        await examples.runAllExamples();
    }
}

// Run if called directly
if (require.main === module) {
    main().catch(console.error);
}

module.exports = LLMExamples; 