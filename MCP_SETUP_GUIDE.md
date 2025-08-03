# MCP (Multi-Context Protocol) Setup Guide
## Team Leader System v4.0 - Multiple LLM Integration

Your Team Leader System already has **comprehensive MCP integration** built-in! This guide will help you set up and connect to MCP servers to enable multiple LLM providers.

## 🎯 What's Already Implemented

### ✅ Built-in MCP Features:
- **MCPClient Class**: Handles connections to various MCP servers
- **ModelSelectorIntegration**: Manages model selection with MCP support
- **Automatic Fallback**: Falls back to direct API calls if MCP fails
- **Multiple Server Types**: Supports LiteLLM, MCP-Use, Ultimate MCP
- **Cost Optimization**: Routes requests to optimal models based on task complexity
- **Usage Tracking**: Monitors token usage across different models

### 🔌 Supported MCP Servers:
1. **LiteLLM** (`http://localhost:4000`)
2. **MCP-Use** (`http://localhost:3000`) 
3. **Ultimate MCP** (`http://localhost:8080`)

## 🚀 Quick Start

### 1. Test Your Current MCP Integration
```bash
node mcp-test.js
```

This will test connections to common MCP server ports and show you the status.

### 2. Set Up an MCP Server

#### Option A: LiteLLM (Recommended)
```bash
# Install LiteLLM
pip install litellm

# Start LiteLLM server
litellm --model gpt-4 --port 4000

# Or with multiple models
litellm --model gpt-4,claude-3-sonnet,gemini-pro --port 4000
```

#### Option B: MCP-Use
```bash
# Install MCP-Use
npm install -g @modelcontextprotocol/server-use

# Start MCP-Use server
mcp-use --port 3000
```

#### Option C: Ultimate MCP
```bash
# Clone and setup Ultimate MCP
git clone https://github.com/ultimate-mcp/server
cd server
npm install
npm start -- --port 8080
```

### 3. Configure Your Team Leader System

Update your `setup.js` or create a configuration file:

```javascript
// MCP Configuration
const mcpConfig = {
    enabled: true,
    serverUrl: 'http://localhost:4000',  // Your MCP server URL
    serverType: 'litellm',               // Server type
    fallbackToDirect: true,              // Fallback to direct APIs
    logUsage: true,                      // Track usage
    timeout: 30000                       // Connection timeout
};

// Initialize in your Team Leader System
const integration = new ModelSelectorIntegration(mcpConfig);
await integration.initializeMCP();
```

## 🔧 Advanced Configuration

### Multiple MCP Servers
You can configure multiple MCP servers for redundancy:

```javascript
const multiMCPConfig = {
    enabled: true,
    servers: [
        {
            name: 'primary',
            serverUrl: 'http://localhost:4000',
            serverType: 'litellm',
            priority: 1
        },
        {
            name: 'backup',
            serverUrl: 'http://localhost:3000',
            serverType: 'mcp-use',
            priority: 2
        }
    ],
    fallbackToDirect: true
};
```

### Model-Specific Routing
Configure which models to use for different tasks:

```javascript
const modelRouting = {
    'senior-architect': {
        preferredModels: ['gpt-4', 'claude-3-sonnet'],
        fallbackModels: ['gpt-3.5-turbo', 'claude-3-haiku']
    },
    'junior-developer': {
        preferredModels: ['gpt-3.5-turbo', 'claude-3-haiku'],
        fallbackModels: ['gpt-4', 'claude-3-sonnet']
    }
};
```

## 📊 Monitoring and Usage

### Check MCP Status
```javascript
const status = integration.getMCPStatus();
console.log('MCP Status:', status);
```

### Usage Statistics
```javascript
const stats = integration.selector.getUsageStats();
console.log('Model Usage:', stats);
```

### Cost Tracking
```javascript
const cost = integration.selector.estimateCost('gpt-4', 1000);
console.log('Estimated Cost:', cost);
```

## 🛠️ Troubleshooting

### Common Issues:

1. **Connection Failed**
   ```bash
   # Check if MCP server is running
   curl http://localhost:4000/health
   
   # Check firewall settings
   sudo ufw status
   ```

2. **Model Not Available**
   ```bash
   # Check available models on your MCP server
   curl http://localhost:4000/models
   ```

3. **Authentication Issues**
   ```bash
   # Set API keys in environment
   export OPENAI_API_KEY="your-key"
   export ANTHROPIC_API_KEY="your-key"
   export GOOGLE_API_KEY="your-key"
   ```

### Debug Mode
Enable debug logging:

```javascript
const debugConfig = {
    enabled: true,
    serverUrl: 'http://localhost:4000',
    serverType: 'litellm',
    debug: true,  // Enable debug logging
    logRequests: true,
    logResponses: true
};
```

## 🎯 Benefits of MCP Integration

### ✅ **Cost Optimization**
- Route simple tasks to cheaper models
- Use premium models only for complex tasks
- Automatic fallback to cost-effective alternatives

### ✅ **Performance**
- Load balancing across multiple models
- Automatic retry with different models
- Parallel processing capabilities

### ✅ **Reliability**
- Multiple server redundancy
- Automatic fallback mechanisms
- Health monitoring and alerts

### ✅ **Flexibility**
- Easy model switching
- Custom routing rules
- A/B testing capabilities

## 🔗 Integration with Team Leader System

Your MCP integration is already connected to:

1. **QualityEnforcer**: Uses optimal models for quality checks
2. **SprintManager**: Routes tasks to appropriate models
3. **CostReporter**: Tracks usage across all models
4. **DashboardGenerator**: Shows MCP status in real-time
5. **CommunicationMonitor**: Handles MCP-related communications

## 📈 Next Steps

1. **Test the integration**: Run `node mcp-test.js`
2. **Set up an MCP server**: Choose one of the options above
3. **Configure your system**: Update the configuration
4. **Monitor usage**: Check the dashboard for MCP status
5. **Optimize routing**: Fine-tune model selection rules

## 🆘 Need Help?

- Check the MCP status in your dashboard
- Review the logs for connection errors
- Test individual components with the test script
- Consult the MCP server documentation

Your Team Leader System is ready for multi-LLM operations! 🚀 