#!/usr/bin/env node

// Model Provider Setup and Verification Script
// Run this to verify all providers are configured correctly

const fs = require('fs').promises;
const path = require('path');

class ProviderSetup {
    constructor() {
        this.providers = {
            google: {
                name: 'Google AI (Gemini)',
                envVar: 'GOOGLE_API_KEY',
                testModel: 'gemini-1.5-flash',
                endpoint: 'https://generativelanguage.googleapis.com/v1beta/models',
                required: true,
                models: ['flash-lite', 'flash', 'gemini-pro']
            },
            openai: {
                name: 'OpenAI',
                envVar: 'OPENAI_API_KEY',
                testModel: 'gpt-4-turbo-preview',
                endpoint: 'https://api.openai.com/v1/models',
                required: true,
                models: ['gpt-4-nano', 'gpt-4-mini', 'gpt-4o', 'o3', 'o4-mini']
            },
            deepseek: {
                name: 'DeepSeek',
                envVar: 'DEEPSEEK_API_KEY',
                testModel: 'deepseek-chat',
                endpoint: 'https://api.deepseek.com/v1/models',
                required: true,
                models: ['deepseek-v3']
            },
            anthropic: {
                name: 'Anthropic (Claude)',
                envVar: 'ANTHROPIC_API_KEY',
                testModel: 'claude-3-sonnet-20240229',
                endpoint: 'https://api.anthropic.com/v1/messages',
                required: false,
                models: ['claude-37', 'opus-4', 'sonnet-4']
            }
        };
        
        this.results = {
            configured: [],
            missing: [],
            tested: [],
            failed: []
        };
    }
    
    async run() {
        console.log('🚀 Team Leader System - Model Provider Setup\n');
        
        // Check environment variables
        await this.checkEnvironmentVariables();
        
        // Test API connections
        await this.testAPIConnections();
        
        // Generate configuration
        await this.generateConfiguration();
        
        // Show summary
        this.showSummary();
        
        // Save results
        await this.saveResults();
    }
    
    async checkEnvironmentVariables() {
        console.log('📋 Checking Environment Variables...\n');
        
        for (const [key, provider] of Object.entries(this.providers)) {
            const apiKey = process.env[provider.envVar];
            
            if (apiKey) {
                console.log(`✅ ${provider.name}: API key found`);
                this.results.configured.push(key);
            } else {
                console.log(`❌ ${provider.name}: API key missing (${provider.envVar})`);
                this.results.missing.push(key);
            }
        }
        
        console.log('');
    }
    
    async testAPIConnections() {
        console.log('🔌 Testing API Connections...\n');
        
        for (const key of this.results.configured) {
            const provider = this.providers[key];
            const apiKey = process.env[provider.envVar];
            
            try {
                await this.testProvider(key, provider, apiKey);
                console.log(`✅ ${provider.name}: Connection successful`);
                this.results.tested.push(key);
            } catch (error) {
                console.log(`❌ ${provider.name}: Connection failed - ${error.message}`);
                this.results.failed.push({ key, error: error.message });
            }
        }
        
        console.log('');
    }
    
    async testProvider(key, provider, apiKey) {
        // Provider-specific test implementations
        switch (key) {
            case 'google':
                return this.testGoogle(apiKey);
            case 'openai':
                return this.testOpenAI(apiKey);
            case 'deepseek':
                return this.testDeepSeek(apiKey);
            case 'anthropic':
                return this.testAnthropic(apiKey);
        }
    }
    
    async testGoogle(apiKey) {
        const response = await fetch(
            'https://generativelanguage.googleapis.com/v1beta/models?key=' + apiKey
        );
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        if (!data.models) {
            throw new Error('Invalid response format');
        }
    }
    
    async testOpenAI(apiKey) {
        const response = await fetch('https://api.openai.com/v1/models', {
            headers: {
                'Authorization': `Bearer ${apiKey}`
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        if (!data.data) {
            throw new Error('Invalid response format');
        }
    }
    
    async testDeepSeek(apiKey) {
        const response = await fetch('https://api.deepseek.com/v1/models', {
            headers: {
                'Authorization': `Bearer ${apiKey}`
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
    }
    
    async testAnthropic(apiKey) {
        // Anthropic doesn't have a models endpoint, so we'll do a minimal test
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01',
                'content-type': 'application/json'
            },
            body: JSON.stringify({
                model: 'claude-3-sonnet-20240229',
                messages: [{ role: 'user', content: 'Hi' }],
                max_tokens: 10
            })
        });
        
        if (response.status === 401) {
            throw new Error('Invalid API key');
        }
    }
    
    async generateConfiguration() {
        console.log('⚙️  Generating Configuration...\n');
        
        const config = {
            providers: {},
            modelAvailability: {},
            recommendations: []
        };
        
        // Build provider config
        for (const key of this.results.tested) {
            const provider = this.providers[key];
            config.providers[key] = {
                enabled: true,
                models: provider.models,
                status: 'active'
            };
            
            // Mark models as available
            for (const model of provider.models) {
                config.modelAvailability[model] = true;
            }
        }
        
        // Add recommendations
        if (this.results.missing.includes('google')) {
            config.recommendations.push({
                priority: 'HIGH',
                message: 'Google AI (Gemini) provides 60% of optimized models. Get API key at https://makersuite.google.com/app/apikey'
            });
        }
        
        if (this.results.missing.includes('deepseek')) {
            config.recommendations.push({
                priority: 'HIGH',
                message: 'DeepSeek is critical for Builder and Database agents. Get API key at https://platform.deepseek.com/'
            });
        }
        
        if (this.results.missing.includes('openai')) {
            config.recommendations.push({
                priority: 'MEDIUM',
                message: 'OpenAI provides o3 and GPT-4 models. Get API key at https://platform.openai.com/'
            });
        }
        
        // Save configuration
        await fs.writeFile(
            '.teamleader/provider-config.json',
            JSON.stringify(config, null, 2)
        );
        
        console.log('Configuration saved to .teamleader/provider-config.json\n');
    }
    
    showSummary() {
        console.log('📊 Setup Summary\n');
        console.log('='.repeat(50));
        
        const totalProviders = Object.keys(this.providers).length;
        const configuredCount = this.results.configured.length;
        const testedCount = this.results.tested.length;
        
        console.log(`Providers Configured: ${configuredCount}/${totalProviders}`);
        console.log(`Providers Tested: ${testedCount}/${configuredCount}`);
        console.log(`Connection Failures: ${this.results.failed.length}`);
        
        // Calculate readiness
        const readiness = (testedCount / totalProviders) * 100;
        
        console.log(`\nSystem Readiness: ${readiness.toFixed(0)}%`);
        
        if (readiness === 100) {
            console.log('✅ All providers configured! Ready for full optimization.');
        } else if (readiness >= 50) {
            console.log('🟡 Partial optimization available. Add more providers for full savings.');
        } else {
            console.log('🔴 Limited optimization available. Configure more providers.');
        }
        
        // Cost impact
        console.log('\n💰 Cost Impact Analysis:');
        
        if (this.results.tested.includes('google') && this.results.tested.includes('deepseek')) {
            console.log('✅ Core providers ready: 70% cost savings achievable');
        } else if (this.results.tested.includes('google')) {
            console.log('🟡 Google ready: 40% cost savings achievable');
        } else {
            console.log('❌ Core providers missing: Limited cost savings');
        }
        
        console.log('\n' + '='.repeat(50));
    }
    
    async saveResults() {
        const timestamp = new Date().toISOString();
        const report = {
            timestamp,
            results: this.results,
            readiness: {
                google: this.results.tested.includes('google'),
                openai: this.results.tested.includes('openai'),
                deepseek: this.results.tested.includes('deepseek'),
                anthropic: this.results.tested.includes('anthropic')
            },
            nextSteps: this.generateNextSteps()
        };
        
        await fs.writeFile(
            `.teamleader/setup-report-${timestamp.split('T')[0]}.json`,
            JSON.stringify(report, null, 2)
        );
    }
    
    generateNextSteps() {
        const steps = [];
        
        if (this.results.missing.length > 0) {
            steps.push('1. Add missing API keys to environment variables');
            
            for (const key of this.results.missing) {
                const provider = this.providers[key];
                steps.push(`   export ${provider.envVar}="your-api-key"`);
            }
        }
        
        if (this.results.failed.length > 0) {
            steps.push('2. Fix failed connections:');
            
            for (const failure of this.results.failed) {
                steps.push(`   - ${this.providers[failure.key].name}: ${failure.error}`);
            }
        }
        
        if (this.results.tested.length === Object.keys(this.providers).length) {
            steps.push('✅ All set! Run the migration to start saving costs.');
        }
        
        return steps;
    }
}

// Run the setup
const setup = new ProviderSetup();
setup.run().catch(console.error); 