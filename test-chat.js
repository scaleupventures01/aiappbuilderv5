/**
 * test-chat.js - Test the Conversational AI Integration
 */

// Load environment variables
require('dotenv').config();

const TeamLeaderSystem = require('./TeamLeaderSystem');

async function testChat() {
    try {
        console.log("🧪 Testing Conversational AI Integration...\n");
        
        // Initialize the system
        const system = new TeamLeaderSystem('Cash Flow Planner');
        await system.initialize();
        
        console.log("✅ System initialized successfully!\n");
        
        // Test basic chat functionality
        console.log("💬 Testing chat functionality...");
        
        const response1 = await system.chat("Hello! How is my project doing?");
        console.log(`🤖 AI: ${response1.response}\n`);
        
        const response2 = await system.chat("What's the current sprint status?");
        console.log(`🤖 AI: ${response2.response}\n`);
        
        const response3 = await system.chat("Can you help me plan the next sprint?");
        console.log(`🤖 AI: ${response3.response}\n`);
        
        // Get chat statistics
        const stats = system.getChatStats();
        console.log("📊 Chat Statistics:");
        console.log(`   Total Messages: ${stats.totalMessages}`);
        console.log(`   User Messages: ${stats.userMessages}`);
        console.log(`   AI Responses: ${stats.assistantMessages}\n`);
        
        console.log("✅ Conversational AI test completed successfully!");
        console.log("🎉 You can now use the chat interface with: node chat-interface.js");
        
    } catch (error) {
        console.error("❌ Error testing chat:", error);
    }
}

// Run the test
testChat(); 