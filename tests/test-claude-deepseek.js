#!/usr/bin/env node

/**
 * test-claude-deepseek.js
 * Specific test for Claude and DeepSeek
 */

require('dotenv').config();

async function testClaudeAndDeepSeek() {
    console.log('🔍 Testing Claude and DeepSeek\n');
    console.log('=' .repeat(50) + '\n');

    // Test Claude with more detailed error handling
    console.log('🔍 Testing Claude (Anthropic)...');
    console.log(`API Key: ${process.env.ANTHROPIC_API_KEY?.substring(0, 20)}...`);
    
    try {
        const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'x-api-key': process.env.ANTHROPIC_API_KEY,
                'Content-Type': 'application/json',
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: 'claude-3-haiku-20240307',
                max_tokens: 10,
                messages: [{ role: 'user', content: 'Hello' }]
            })
        });

        console.log(`Status: ${claudeResponse.status}`);
        
        if (claudeResponse.ok) {
            const data = await claudeResponse.json();
            console.log(`✅ Claude: Connected successfully!`);
            console.log(`   Response: ${data.content[0].text}`);
        } else {
            const error = await claudeResponse.text();
            console.log(`❌ Claude Error: ${error}`);
            
            // Try to parse error details
            try {
                const errorData = JSON.parse(error);
                console.log(`   Error Type: ${errorData.error?.type}`);
                console.log(`   Error Message: ${errorData.error?.message}`);
            } catch (e) {
                console.log(`   Raw Error: ${error}`);
            }
        }
    } catch (error) {
        console.log(`❌ Claude Network Error: ${error.message}`);
    }

    console.log('\n' + '=' .repeat(50) + '\n');

    // Test DeepSeek with more detailed error handling
    console.log('🔍 Testing DeepSeek...');
    console.log(`API Key: ${process.env.DEEPSEEK_API_KEY?.substring(0, 20)}...`);
    
    try {
        const deepseekResponse = await fetch('https://api.deepseek.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: [{ role: 'user', content: 'Hello' }],
                max_tokens: 10
            })
        });

        console.log(`Status: ${deepseekResponse.status}`);
        
        if (deepseekResponse.ok) {
            const data = await deepseekResponse.json();
            console.log(`✅ DeepSeek: Connected successfully!`);
            console.log(`   Response: ${data.choices[0].message.content}`);
        } else {
            const error = await deepseekResponse.text();
            console.log(`❌ DeepSeek Error: ${error}`);
            
            // Try to parse error details
            try {
                const errorData = JSON.parse(error);
                console.log(`   Error Type: ${errorData.error?.type}`);
                console.log(`   Error Message: ${errorData.error?.message}`);
            } catch (e) {
                console.log(`   Raw Error: ${error}`);
            }
        }
    } catch (error) {
        console.log(`❌ DeepSeek Network Error: ${error.message}`);
    }

    console.log('\n' + '=' .repeat(50) + '\n');
    
    // Test Claude with different model
    console.log('🔍 Testing Claude with claude-3-sonnet-20240229...');
    try {
        const claudeResponse2 = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'x-api-key': process.env.ANTHROPIC_API_KEY,
                'Content-Type': 'application/json',
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: 'claude-3-5-sonnet-20241022',
                max_tokens: 10,
                messages: [{ role: 'user', content: 'Hello' }]
            })
        });

        console.log(`Status: ${claudeResponse2.status}`);
        
        if (claudeResponse2.ok) {
            const data = await claudeResponse2.json();
            console.log(`✅ Claude Sonnet: Connected successfully!`);
            console.log(`   Response: ${data.content[0].text}`);
        } else {
            const error = await claudeResponse2.text();
            console.log(`❌ Claude Sonnet Error: ${error}`);
        }
    } catch (error) {
        console.log(`❌ Claude Sonnet Network Error: ${error.message}`);
    }

    console.log('\n🎉 Test Complete!');
}

testClaudeAndDeepSeek().catch(console.error); 