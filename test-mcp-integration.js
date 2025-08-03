// Test MCP Integration Structure
// This test verifies the MCP integration is properly set up

const { ModelSelectorIntegration, MCPClient } = require('./lib/ModelSelectorIntegration');

async function testMCPIntegration() {
    console.log('🧪 Testing MCP Integration Structure...\n');
    
    // Test 1: Check if classes are available
    console.log('✅ Test 1: Checking class availability...');
    console.log('   ModelSelectorIntegration:', typeof ModelSelectorIntegration);
    console.log('   MCPClient:', typeof MCPClient);
    
    // Test 2: Create integration instance
    console.log('\n✅ Test 2: Creating integration instance...');
    const integration = new ModelSelectorIntegration({
        enabled: true,
        fallbackToDirect: true,
        logUsage: true
    });
    console.log('   Integration created successfully');
    
    // Test 3: Check MCP status
    console.log('\n✅ Test 3: Checking MCP status...');
    const status = integration.getMCPStatus();
    console.log('   MCP Status:', JSON.stringify(status, null, 2));
    
    // Test 4: Test model selector
    console.log('\n✅ Test 4: Testing model selector...');
    const modelSelection = integration.selector.selectModel({
        agentType: 'architect',
        seniority: 'senior',
        taskComplexity: 'complex_architecture',
        prioritizeSpeed: false,
        budgetMode: false
    });
    console.log('   Model Selection:', modelSelection);
    
    // Test 5: Test agent creation (without MCP connection)
    console.log('\n✅ Test 5: Testing agent creation...');
    try {
        const agent = await integration.createAgentWithOptimalModel({
            id: 'senior-architect',
            name: 'Senior Architect',
            seniority: 'senior',
            team: 'architecture',
            projectName: 'test-project'
        });
        console.log('   Agent created successfully');
        console.log('   Agent model:', agent.model);
        console.log('   MCP enabled:', agent.useMCP);
        console.log('   MCP fallback:', agent.mcpFallback);
    } catch (error) {
        console.log('   Agent creation failed (expected without MCP):', error.message);
    }
    
    // Test 6: Test MCP client creation
    console.log('\n✅ Test 6: Testing MCP client creation...');
    const mcpClient = new MCPClient({
        serverUrl: 'http://localhost:4000',
        serverType: 'litellm',
        timeout: 5000
    });
    console.log('   MCP Client created successfully');
    console.log('   Server URL:', mcpClient.config.serverUrl);
    console.log('   Server Type:', mcpClient.config.serverType);
    
    // Test 7: Test connection (will fail without server, but should handle gracefully)
    console.log('\n✅ Test 7: Testing MCP connection (expected to fail)...');
    try {
        const connected = await mcpClient.connect();
        console.log('   Connection result:', connected);
    } catch (error) {
        console.log('   Connection failed (expected):', error.message);
    }
    
    console.log('\n🎉 MCP Integration Structure Test Complete!');
    console.log('\n📋 Next Steps:');
    console.log('1. Set up your API keys (OPENAI_API_KEY, ANTHROPIC_API_KEY, GOOGLE_API_KEY)');
    console.log('2. Run: ./start-mcp-server.sh');
    console.log('3. Run: node mcp-test.js');
    console.log('4. Your Team Leader System will automatically use MCP when available!');
}

// Run the test
testMCPIntegration().catch(console.error); 