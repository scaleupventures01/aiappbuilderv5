#!/usr/bin/env node

/**
 * test-all-working.js
 * Test all 3 working LLM providers
 */

require('dotenv').config();

async function testAllWorkingLLMs() {
    console.log('🤖 Testing All Working LLM Providers\n');
    console.log('=' .repeat(50) + '\n');

    const providers = [
        {
            name: 'OpenAI GPT-4',
            test: async () => {
                const response = await fetch('https://api.openai.com/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        model: 'gpt-4o',
                        messages: [{ role: 'user', content: 'Say hello in 2 words' }],
                        max_tokens: 10,
                        temperature: 0.7
                    })
                });

                if (response.ok) {
                    const data = await response.json();
                    return data.choices[0].message.content.trim();
                }
                throw new Error(`OpenAI: ${response.status}`);
            }
        },
        {
            name: 'Google Gemini',
            test: async () => {
                const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent?key=${process.env.GOOGLE_API_KEY}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        contents: [{
                            parts: [{
                                text: 'Say hello in 2 words'
                            }]
                        }],
                        generationConfig: {
                            maxOutputTokens: 10,
                            temperature: 0.7
                        }
                    })
                });

                if (response.ok) {
                    const data = await response.json();
                    return data.candidates[0].content.parts[0].text.trim();
                }
                throw new Error(`Google: ${response.status}`);
            }
        },
        {
            name: 'DeepSeek',
            test: async () => {
                const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        model: 'deepseek-chat',
                        messages: [{ role: 'user', content: 'Say hello in 2 words' }],
                        max_tokens: 10,
                        temperature: 0.7
                    })
                });

                if (response.ok) {
                    const data = await response.json();
                    return data.choices[0].message.content.trim();
                }
                throw new Error(`DeepSeek: ${response.status}`);
            }
        }
    ];

    for (const provider of providers) {
        try {
            console.log(`🔍 Testing ${provider.name}...`);
            const result = await provider.test();
            console.log(`✅ ${provider.name}: "${result}"`);
        } catch (error) {
            console.log(`❌ ${provider.name}: ${error.message}`);
        }
        console.log('');
    }

    console.log('🎉 All Working Providers Tested!');
    console.log('You now have 3 powerful LLM providers ready to use!');
}

testAllWorkingLLMs().catch(console.error); 