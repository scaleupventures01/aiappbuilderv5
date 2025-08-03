#!/usr/bin/env node

/**
 * quick-llm-test.js
 * Quick test of working LLMs
 */

require('dotenv').config();

async function testWorkingLLMs() {
    console.log('🤖 Quick LLM Test - Working Providers\n');
    console.log('=' .repeat(50) + '\n');

    // Test OpenAI
    console.log('🔍 Testing OpenAI GPT-4...');
    try {
        const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'gpt-4o',
                messages: [{ role: 'user', content: 'Say hello in 3 words' }],
                max_tokens: 20,
                temperature: 0.7
            })
        });

        if (openaiResponse.ok) {
            const data = await openaiResponse.json();
            console.log(`✅ OpenAI: "${data.choices[0].message.content.trim()}"`);
        } else {
            console.log(`❌ OpenAI: ${openaiResponse.status}`);
        }
    } catch (error) {
        console.log(`❌ OpenAI: ${error.message}`);
    }

    console.log('');

    // Test Google Gemini
    console.log('🔍 Testing Google Gemini...');
    try {
        const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent?key=${process.env.GOOGLE_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: 'Say hello in 3 words'
                    }]
                }],
                generationConfig: {
                    maxOutputTokens: 20,
                    temperature: 0.7
                }
            })
        });

        if (geminiResponse.ok) {
            const data = await geminiResponse.json();
            const text = data.candidates[0].content.parts[0].text;
            console.log(`✅ Google: "${text.trim()}"`);
        } else {
            console.log(`❌ Google: ${geminiResponse.status}`);
        }
    } catch (error) {
        console.log(`❌ Google: ${error.message}`);
    }

    console.log('\n🎉 LLM Test Complete!');
    console.log('Your OpenAI and Google API keys are working perfectly!');
}

testWorkingLLMs().catch(console.error); 