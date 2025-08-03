/**
 * chat-interface.js - Simple Chat Interface for Team Leader System v4.0
 * Provides a command-line chat interface for natural language interaction
 */

const readline = require('readline');
const ConversationalAI = require('./lib/ConversationalAI');

class ChatInterface {
    constructor(teamLeaderSystem) {
        this.system = teamLeaderSystem;
        this.conversationalAI = new ConversationalAI(teamLeaderSystem);
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        this.isActive = false;
    }

    /**
     * Initialize the chat interface
     */
    async initialize() {
        console.log("\n🗣️ Initializing Chat Interface...");
        
        // Initialize the conversational AI
        await this.conversationalAI.initialize();
        
        console.log("✅ Chat Interface ready!");
        console.log("\n💡 You can now chat naturally with your AI assistant.");
        console.log("💡 Type 'help' for suggestions, 'quit' to exit, or just start chatting!\n");
        
        return true;
    }

    /**
     * Start the interactive chat session
     */
    async start() {
        this.isActive = true;
        
        // Show welcome message
        await this.showWelcomeMessage();
        
        // Start chat loop
        await this.chatLoop();
    }

    /**
     * Show welcome message
     */
    async showWelcomeMessage() {
        const welcome = await this.conversationalAI.chat("Hello! I'm ready to help you with your project.");
        console.log(`\n🤖 AI: ${welcome.response}\n`);
    }

    /**
     * Main chat loop
     */
    async chatLoop() {
        while (this.isActive) {
            try {
                const userInput = await this.getUserInput();
                
                if (userInput.toLowerCase() === 'quit' || userInput.toLowerCase() === 'exit') {
                    await this.stop();
                    break;
                }
                
                if (userInput.toLowerCase() === 'help') {
                    await this.showHelp();
                    continue;
                }
                
                if (userInput.toLowerCase() === 'stats') {
                    await this.showStats();
                    continue;
                }
                
                if (userInput.toLowerCase() === 'clear') {
                    console.clear();
                    continue;
                }
                
                if (userInput.trim() === '') {
                    continue;
                }
                
                // Process the message
                const result = await this.conversationalAI.chat(userInput);
                
                // Display response
                console.log(`\n🤖 AI: ${result.response}\n`);
                
                // Show suggestions if available
                if (result.suggestions && result.suggestions.length > 0) {
                    console.log("💡 Suggestions:");
                    result.suggestions.forEach((suggestion, index) => {
                        console.log(`   ${index + 1}. ${suggestion}`);
                    });
                    console.log("");
                }
                
            } catch (error) {
                console.error("❌ Error in chat loop:", error);
                console.log("🤖 AI: I apologize, but I encountered an error. Please try again.\n");
            }
        }
    }

    /**
     * Get user input
     */
    getUserInput() {
        return new Promise((resolve) => {
            this.rl.question('💬 You: ', (input) => {
                resolve(input);
            });
        });
    }

    /**
     * Show help information
     */
    async showHelp() {
        console.log("\n📚 Chat Interface Help:");
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.log("💬 Just type naturally - ask about your project, tasks, sprints, etc.");
        console.log("📊 Ask for project status, quality metrics, cost reports");
        console.log("👥 Inquire about team activities, handoffs, approvals");
        console.log("🔧 Get help with development decisions and best practices");
        console.log("");
        console.log("🔧 Commands:");
        console.log("   help    - Show this help message");
        console.log("   stats   - Show conversation statistics");
        console.log("   clear   - Clear the screen");
        console.log("   quit    - Exit the chat interface");
        console.log("");
        console.log("💡 Example questions:");
        console.log("   • 'How is my project progressing?'");
        console.log("   • 'What's the current sprint status?'");
        console.log("   • 'Show me the latest quality metrics'");
        console.log("   • 'What tasks need attention?'");
        console.log("   • 'Help me plan the next sprint'");
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
    }

    /**
     * Show conversation statistics
     */
    async showStats() {
        const stats = this.conversationalAI.getStats();
        console.log("\n📊 Conversation Statistics:");
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.log(`📝 Total Messages: ${stats.totalMessages}`);
        console.log(`👤 Your Messages: ${stats.userMessages}`);
        console.log(`🤖 AI Responses: ${stats.assistantMessages}`);
        console.log(`🎯 Current Topic: ${stats.currentTopic || 'None'}`);
        console.log(`🕒 Last Message: ${stats.lastMessage ? new Date(stats.lastMessage).toLocaleString() : 'None'}`);
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
    }

    /**
     * Stop the chat interface
     */
    async stop() {
        console.log("\n👋 Thank you for using the Chat Interface!");
        console.log("💾 Saving conversation history...");
        
        this.isActive = false;
        this.rl.close();
        
        // Save final state
        await this.conversationalAI.saveConversation();
        
        console.log("✅ Goodbye!\n");
    }
}

// Export for use in other files
module.exports = ChatInterface;

// If run directly, start the chat interface
if (require.main === module) {
    (async () => {
        try {
            // Load the Team Leader System
            const TeamLeaderSystem = require('./TeamLeaderSystem');
            
            // Initialize with the existing project
            const system = new TeamLeaderSystem('Cash Flow Planner');
            await system.initialize();
            
            // Create and start chat interface
            const chatInterface = new ChatInterface(system);
            await chatInterface.initialize();
            await chatInterface.start();
            
        } catch (error) {
            console.error("❌ Error starting chat interface:", error);
            process.exit(1);
        }
    })();
} 