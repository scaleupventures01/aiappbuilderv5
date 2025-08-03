#!/usr/bin/env node

/**
 * test-api-keys-simple.js
 * Simple API key testing without full TeamLeaderSystem
 */

require('dotenv').config();

class SimpleAPIKeyTester {
    constructor() {
        this.keys = {
            openai: process.env.OPENAI_API_KEY,
            google: process.env.GOOGLE_API_KEY,
            anthropic: process.env.ANTHROPIC_API_KEY,
            deepseek: process.env.DEEPSEEK_API_KEY
        };
    }

    async testOpenAI() {
        if (!this.keys.openai) {
            console.log('❌ OpenAI: No API key found');
            return false;
        }

        try {
            console.log('🔍 Testing OpenAI API key...');
            
            const response = await fetch('https://api.openai.com/v1/models', {
                headers: {
                    'Authorization': `Bearer ${this.keys.openai}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                console.log(`✅ OpenAI: Connected successfully!`);
                console.log(`   Available models: ${data.data.length}`);
                console.log(`   Sample models: ${data.data.slice(0, 3).map(m => m.id).join(', ')}`);
                return true;
            } else {
                const error = await response.text();
                console.log(`❌ OpenAI: ${response.status} - ${error}`);
                return false;
            }
        } catch (error) {
            console.log(`❌ OpenAI: ${error.message}`);
            return false;
        }
    }

    async testGoogle() {
        if (!this.keys.google) {
            console.log('❌ Google: No API key found');
            return false;
        }

        try {
            console.log('🔍 Testing Google API key...');
            
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${this.keys.google}`);
            
            if (response.ok) {
                const data = await response.json();
                console.log(`✅ Google: Connected successfully!`);
                console.log(`   Available models: ${data.models?.length || 0}`);
                if (data.models && data.models.length > 0) {
                    console.log(`   Sample models: ${data.models.slice(0, 3).map(m => m.name).join(', ')}`);
                }
                return true;
            } else {
                const error = await response.text();
                console.log(`❌ Google: ${response.status} - ${error}`);
                return false;
            }
        } catch (error) {
            console.log(`❌ Google: ${error.message}`);
            return false;
        }
    }

    async testAnthropic() {
        if (!this.keys.anthropic) {
            console.log('❌ Anthropic: No API key found');
            return false;
        }

        try {
            console.log('🔍 Testing Anthropic API key...');
            
            const response = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.keys.anthropic}`,
                    'Content-Type': 'application/json',
                    'anthropic-version': '2023-06-01'
                },
                body: JSON.stringify({
                    model: 'claude-3-haiku-20240307',
                    max_tokens: 10,
                    messages: [{ role: 'user', content: 'Hello' }]
                })
            });

            if (response.ok) {
                console.log(`✅ Anthropic: Connected successfully!`);
                return true;
            } else {
                const error = await response.text();
                console.log(`❌ Anthropic: ${response.status} - ${error}`);
                return false;
            }
        } catch (error) {
            console.log(`❌ Anthropic: ${error.message}`);
            return false;
        }
    }

    async testDeepSeek() {
        if (!this.keys.deepseek) {
            console.log('❌ DeepSeek: No API key found');
            return false;
        }

        try {
            console.log('🔍 Testing DeepSeek API key...');
            
            const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.keys.deepseek}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'deepseek-chat',
                    messages: [{ role: 'user', content: 'Hello' }],
                    max_tokens: 10
                })
            });

            if (response.ok) {
                console.log(`✅ DeepSeek: Connected successfully!`);
                return true;
            } else {
                const error = await response.text();
                console.log(`❌ DeepSeek: ${response.status} - ${error}`);
                return false;
            }
        } catch (error) {
            console.log(`❌ DeepSeek: ${error.message}`);
            return false;
        }
    }

    async runAllTests() {
        console.log('🔑 API Key Test Results\n');
        console.log('=' .repeat(50) + '\n');

        const results = {
            openai: await this.testOpenAI(),
            google: await this.testGoogle(),
            anthropic: await this.testAnthropic(),
            deepseek: await this.testDeepSeek()
        };

        console.log('\n📊 Summary:');
        const working = Object.values(results).filter(Boolean).length;
        const total = Object.keys(results).length;
        
        console.log(`✅ Working: ${working}/${total} providers`);
        
        if (working > 0) {
            console.log('\n🎉 Great! Your API keys are working!');
            console.log('You can now use the LLM features in your Team Leader System.');
        } else {
            console.log('\n⚠️ No API keys are working. Please check:');
            console.log('1. API key format and validity');
            console.log('2. Account status and billing');
            console.log('3. Network connectivity');
        }

        return results;
    }
}

// Run the tests
async function main() {
    const tester = new SimpleAPIKeyTester();
    await tester.runAllTests();
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = SimpleAPIKeyTester; 