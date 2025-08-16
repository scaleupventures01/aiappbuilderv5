#!/usr/bin/env node
/**
 * Claude API Bridge - Connects local orch command to Claude's API
 * This allows real AI agent invocation from the command line
 */

import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';
import path from 'path';

/**
 * Bridge to Claude API for real agent invocation
 */
export class ClaudeAPIBridge {
  constructor(apiKey) {
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY environment variable required');
    }
    
    this.client = new Anthropic({
      apiKey: apiKey
    });
  }

  /**
   * Invoke a real AI agent through Claude API
   */
  async invokeAgent(agentName, task, prompt) {
    console.log(`    🌐 Calling Claude API for ${agentName}...`);
    
    try {
      const message = await this.client.messages.create({
        model: 'claude-3-opus-20240229',
        max_tokens: 4096,
        messages: [{
          role: 'user',
          content: `You are the ${agentName} agent. ${prompt}

IMPORTANT: Respond with valid JSON only, no markdown formatting or code blocks.`
        }]
      });
      
      const response = message.content[0].text;
      
      // Parse JSON response
      try {
        return JSON.parse(response);
      } catch (e) {
        // If not JSON, wrap in object
        return { output: response };
      }
      
    } catch (error) {
      console.error(`    ❌ Claude API error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Execute full orchestration through Claude
   */
  async orchestrateFeature(prdPath, featureId) {
    console.log('🌐 Orchestrating through Claude API...');
    
    const prdContent = fs.readFileSync(prdPath, 'utf8');
    
    // Have Claude orchestrate the entire feature
    const message = await this.client.messages.create({
      model: 'claude-3-opus-20240229',
      max_tokens: 8192,
      messages: [{
        role: 'user',
        content: `Orchestrate the implementation of this feature using the ORCH system.
        
Feature ID: ${featureId}

PRD Content:
${prdContent}

Perform these steps:
1. Analyze the PRD and assign appropriate agents
2. Have each agent add their tasks
3. Execute the tasks
4. Get sign-offs

Return a JSON object with the complete orchestration results.`
      }]
    });
    
    return JSON.parse(message.content[0].text);
  }
}

/**
 * Initialize the API bridge
 */
export function initializeAPIBridge() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  
  if (!apiKey) {
    console.log('⚠️  ANTHROPIC_API_KEY not set - Claude API unavailable');
    console.log('   Set your API key: export ANTHROPIC_API_KEY=your-key-here');
    return null;
  }
  
  try {
    const bridge = new ClaudeAPIBridge(apiKey);
    console.log('✅ Claude API bridge initialized');
    return bridge;
  } catch (error) {
    console.error('❌ Failed to initialize Claude API:', error.message);
    return null;
  }
}

// Usage in orch command:
// 1. Set your API key: export ANTHROPIC_API_KEY=sk-ant-api...
// 2. The orchestrator will automatically use the API bridge
// 3. Real AI agents will be invoked through Claude's API

export default { ClaudeAPIBridge, initializeAPIBridge };