// MCP Connection Test Script
// This script demonstrates how to connect to MCP servers and use multiple LLMs

const { ModelSelectorIntegration } = require('./lib/ModelSelectorIntegration');

async function testMCPConnection() {
    console.log('🚀 Testing MCP Integration...\n');
    
    // Initialize the integration with MCP configuration
    const integration = new ModelSelectorIntegration({
        enabled: true,
        fallbackToDirect: true,
        logUsage: true
    });
    
    // Test different MCP server configurations
    const mcpConfigs = [
        {
            name: 'LiteLLM Server',
            config: {
                serverUrl: 'http://localhost:4000',
                serverType: 'litellm',
                timeout: 30000
            }
        },
        {
            name: 'MCP-Use Server',
            config: {
                serverUrl: 'http://localhost:3000',
                serverType: 'mcp-use',
                timeout: 30000
            }
        },
        {
            name: 'Ultimate MCP Server',
            config: {
                serverUrl: 'http://localhost:8080',
                serverType: 'ultimate-mcp',
                timeout: 30000
            }
        }
    ];
    
    for (const mcpTest of mcpConfigs) {
        console.log(`🔌 Testing ${mcpTest.name}...`);
        
        try {
            const connected = await integration.initializeMCP(mcpTest.config);
            
            if (connected) {
                console.log(`✅ ${mcpTest.name} connected successfully!`);
                
                // Test creating an agent with MCP support
                const agent = await integration.createAgentWithOptimalModel({
                    id: 'senior-architect',
                    name: 'Senior Architect',
                    seniority: 'senior',
                    team: 'architecture',
                    projectName: 'test-project'
                });
                
                console.log(`🤖 Agent created with model: ${agent.model}`);
                console.log(`🔌 MCP enabled: ${agent.useMCP}`);
                
                // Test a simple completion
                const response = await agent.complete([
                    { role: 'user', content: 'Hello! Can you confirm you are working through MCP?' }
                ]);
                
                console.log(`📝 Response received via ${response.method || 'unknown'} method`);
                console.log(`💬 Response: ${response.content.substring(0, 100)}...`);
                
                // Get MCP status
                const status = integration.getMCPStatus();
                console.log(`📊 MCP Status:`, status);
                
                break; // Stop after first successful connection
                
            } else {
                console.log(`❌ ${mcpTest.name} connection failed`);
            }
            
        } catch (error) {
            console.log(`❌ ${mcpTest.name} error: ${error.message}`);
        }
        
        console.log('');
    }
    
    // Show final status
    const finalStatus = integration.getMCPStatus();
    console.log('📊 Final MCP Status:');
    console.log(JSON.stringify(finalStatus, null, 2));
}

// Run the test
testMCPConnection().catch(console.error); 