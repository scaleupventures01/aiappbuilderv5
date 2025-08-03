# 🤖 LLM Connection Guide - Team Leader System v4.0

## 🚀 Quick Start

### 1. Set Up API Keys

Create a `.env` file in your project root:

```bash
# OpenAI (GPT-4, GPT-3.5, o3, o4-mini)
OPENAI_API_KEY=sk-your-openai-key-here

# Google (Gemini models)
GOOGLE_API_KEY=your-google-api-key-here

# Anthropic (Claude models)
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key-here

# DeepSeek
DEEPSEEK_API_KEY=your-deepseek-key-here
```

### 2. Test Your Connections

```bash
node test-llm-connections.js
```

## 🔧 Detailed Setup

### Step 1: Get API Keys

#### OpenAI
1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Create a new API key
3. Add to your `.env` file: `OPENAI_API_KEY=sk-...`

#### Google (Gemini)
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Add to your `.env` file: `GOOGLE_API_KEY=...`

#### Anthropic (Claude)
1. Go to [Anthropic Console](https://console.anthropic.com/)
2. Create a new API key
3. Add to your `.env` file: `ANTHROPIC_API_KEY=sk-ant-...`

#### DeepSeek
1. Go to [DeepSeek Platform](https://platform.deepseek.com/)
2. Create a new API key
3. Add to your `.env` file: `DEEPSEEK_API_KEY=...`

### Step 2: Initialize the System

```javascript
const TeamLeaderSystem = require('./TeamLeaderSystem');
const APIKeyManager = require('./lib/APIKeyManager');

// Initialize the system
const system = new TeamLeaderSystem('my-project');
await system.initialize();

// Check available providers
const keyManager = system.getModule('keyManager');
console.log('Available providers:', keyManager.getConfiguredProviders());
```

## 🎯 Using Different Models

### Basic Usage

```javascript
const apiManager = system.getModule('apiManager');

// Simple completion
const response = await apiManager.complete({
    model: 'gpt-4o',
    messages: [
        { role: 'user', content: 'Hello! How are you?' }
    ],
    maxTokens: 100,
    temperature: 0.7
});

console.log(response.content);
```

### Model-Specific Examples

#### OpenAI Models
```javascript
// GPT-4o (latest)
const gpt4Response = await apiManager.complete({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: 'Explain quantum computing' }]
});

// o4-mini (fast and efficient)
const o4miniResponse = await apiManager.complete({
    model: 'o4-mini',
    messages: [{ role: 'user', content: 'Write a simple function' }]
});

// o3 (balanced)
const o3Response = await apiManager.complete({
    model: 'o3',
    messages: [{ role: 'user', content: 'Analyze this data' }]
});
```

#### Google Gemini Models
```javascript
// Gemini Pro (powerful)
const geminiResponse = await apiManager.complete({
    model: 'gemini-pro',
    messages: [{ role: 'user', content: 'Create a business plan' }]
});

// Gemini Flash (fast)
const flashResponse = await apiManager.complete({
    model: 'flash',
    messages: [{ role: 'user', content: 'Summarize this text' }]
});
```

#### Anthropic Claude Models
```javascript
// Claude 3 Opus (most capable)
const opusResponse = await apiManager.complete({
    model: 'claude-37',
    messages: [{ role: 'user', content: 'Solve this complex problem' }]
});

// Claude 3 Sonnet (balanced)
const sonnetResponse = await apiManager.complete({
    model: 'sonnet-4',
    messages: [{ role: 'user', content: 'Review this code' }]
});
```

## 🎯 Advanced Features

### 1. Model Recommendations

```javascript
const recommendationEngine = system.getModule('modelRecommendationEngine');

// Get recommendations for a specific task
const recommendations = await recommendationEngine.getRecommendations(
    'code_generation',
    'performance'
);

console.log('Recommended models:', recommendations);
```

### 2. Cost Optimization

```javascript
const budgetManager = system.getModule('budgetManager');

// Set budget and track spending
await budgetManager.setTotalBudget(100); // $100 budget

// Track spending for each request
await budgetManager.trackSpending('gpt-4o', 0.05, 'completion');
```

### 3. Performance Monitoring

```javascript
const performanceDashboard = system.getModule('performanceDashboard');

// Record performance metrics
await performanceDashboard.recordMetric('responseTime', 'gpt-4o', 1200);
await performanceDashboard.recordMetric('accuracy', 'gpt-4o', 0.95);

// Get performance report
const report = await performanceDashboard.getPerformanceReport('24h');
console.log('Performance report:', report);
```

### 4. Rate Limiting

```javascript
const rateLimitManager = system.getModule('rateLimitManager');

// Check rate limit before making request
const rateLimitResult = await rateLimitManager.checkRateLimit(
    'openai',
    'request-123',
    'high'
);

if (rateLimitResult.allowed) {
    // Make the API call
    const response = await apiManager.complete(options);
} else {
    console.log('Rate limited:', rateLimitResult.delay);
}
```

## 🔄 Integration Examples

### 1. Agent System Integration

```javascript
// Create an agent that uses LLMs
const agent = await system.createAgent({
    name: 'CodeReviewAgent',
    model: 'gpt-4o',
    task: 'code_review',
    prompt: 'You are a senior code reviewer. Review the following code:'
});

// Assign a task to the agent
await system.assignTask({
    agentId: agent.id,
    task: 'Review this JavaScript function',
    content: 'function add(a, b) { return a + b; }'
});
```

### 2. Quality Gates Integration

```javascript
const qualityEnforcer = system.getModule('qualityEnforcer');

// Use LLM for quality checks
await qualityEnforcer.runQualityChecks({
    model: 'claude-37',
    checks: ['code_quality', 'security', 'performance']
});
```

### 3. Dashboard Integration

```javascript
const dashboard = system.getModule('dashboardGenerator');

// Add LLM usage to dashboard
await dashboard.addMetric('llm_requests', {
    model: 'gpt-4o',
    count: 150,
    cost: 2.50
});
```

## 📊 Monitoring and Analytics

### 1. Cost Tracking

```javascript
// Track costs across all models
const costReport = await budgetManager.getSpendingReport('7d');
console.log('Weekly spending:', costReport);
```

### 2. Performance Analytics

```javascript
// Compare model performance
const comparison = await performanceDashboard.compareModels([
    'gpt-4o',
    'claude-37',
    'gemini-pro'
]);

console.log('Model comparison:', comparison);
```

### 3. Usage Patterns

```javascript
// Analyze usage patterns
const patterns = await recommendationEngine.analyzeUsagePatterns(
    'gpt-4o',
    '30d'
);

console.log('Usage patterns:', patterns);
```

## 🛠️ Troubleshooting

### Common Issues

1. **API Key Not Found**
   ```bash
   # Check if keys are loaded
   node -e "require('dotenv').config(); console.log(process.env.OPENAI_API_KEY ? 'OK' : 'Missing')"
   ```

2. **Rate Limiting**
   ```javascript
   // Check rate limit status
   const status = rateLimitManager.getRateLimitStatus('openai');
   console.log('Rate limit status:', status);
   ```

3. **Model Not Available**
   ```javascript
   // Check available models
   const models = keyManager.getAvailableModels();
   console.log('Available models:', models);
   ```

### Testing Connections

```javascript
// Test all providers
const apiManager = system.getModule('apiManager');
await apiManager.checkProviderHealth();

// Test specific provider
await apiManager.testProvider('openai');
```

## 🎯 Best Practices

1. **Use Model Recommendations**: Let the system suggest the best model for your task
2. **Monitor Costs**: Set budgets and track spending
3. **Optimize Performance**: Use the performance dashboard to find the best models
4. **Handle Rate Limits**: Use the rate limit manager to avoid API errors
5. **Test Different Models**: Use A/B testing to find the best model for your use case

## 🚀 Next Steps

1. Set up your API keys
2. Test the connections
3. Start with simple completions
4. Explore advanced features
5. Integrate with your existing workflow

Your Team Leader System v4.0 is now ready to work with multiple LLM providers! 🎉 