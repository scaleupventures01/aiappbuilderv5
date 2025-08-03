/**
 * ConversationalAI.js - Natural Language Interface for Team Leader System v4.0
 * Provides conversational AI capabilities alongside the existing project management system
 */

const fs = require('fs').promises;
const path = require('path');

class ConversationalAI {
    constructor(teamLeaderSystem) {
        this.system = teamLeaderSystem;
        this.conversationHistory = [];
        this.contextWindow = 20; // Keep last 20 messages for context
        this.preferredModel = 'claude-37'; // Anthropic Claude 3.7 Sonnet
        this.fallbackModels = ['sonnet-4', 'gpt-4o', 'flash'];
        
        // Conversation state
        this.currentTopic = null;
        this.userPreferences = {};
        this.projectContext = {};
        
        // Integration points
        this.integrationPoints = {
            projectStatus: this.getProjectStatus.bind(this),
            sprintInfo: this.getSprintInfo.bind(this),
            taskStatus: this.getTaskStatus.bind(this),
            teamStatus: this.getTeamStatus.bind(this),
            qualityMetrics: this.getQualityMetrics.bind(this),
            costReport: this.getCostReport.bind(this)
        };
    }

    /**
     * Initialize the Conversational AI interface
     */
    async initialize() {
        console.log("🗣️ Initializing Conversational AI Interface...");
        
        // Create conversation storage
        await this.ensureDirectory(`${this.system.projectPath}/conversations`);
        await this.ensureDirectory(`${this.system.projectPath}/conversations/history`);
        
        // Load conversation history if exists
        await this.loadConversationHistory();
        
        // Set up context from project
        await this.updateProjectContext();
        
        console.log("✅ Conversational AI Interface initialized");
        return true;
    }

    /**
     * Main conversation handler
     */
    async chat(userMessage, options = {}) {
        try {
            console.log(`\n💬 User: ${userMessage}`);
            
            // Add user message to history
            this.addToHistory('user', userMessage);
            
            // Analyze message intent
            const intent = await this.analyzeIntent(userMessage);
            
            // Get relevant context
            const context = await this.getRelevantContext(intent);
            
            // Generate response
            const response = await this.generateResponse(userMessage, intent, context, options);
            
            // Add AI response to history
            this.addToHistory('assistant', response);
            
            // Save conversation
            await this.saveConversation();
            
            // Update context if needed
            if (intent.requiresContextUpdate) {
                await this.updateProjectContext();
            }
            
            return {
                response,
                intent,
                context: context.summary,
                suggestions: this.generateSuggestions(intent)
            };
            
        } catch (error) {
            console.error("❌ Error in conversational AI:", error);
            return {
                response: "I apologize, but I encountered an error processing your request. Please try again or rephrase your question.",
                error: error.message
            };
        }
    }

    /**
     * Analyze user message intent
     */
    async analyzeIntent(message) {
        const messages = [
                            {
                    role: "system",
                    content: `You are an intent analyzer for a project management system. Analyze the user's message and return ONLY a valid JSON object (no markdown formatting, no code blocks) with this exact structure:
                    {
                        "intent": "project_status|sprint_info|task_management|team_communication|quality_check|cost_analysis|general_help",
                        "confidence": 0.0-1.0,
                        "entities": ["project", "sprint", "task", "team", "quality", "cost"],
                        "requiresContextUpdate": true/false,
                        "action": "get_info|create_task|update_status|generate_report|provide_help"
                    }
                    
                    Return ONLY the JSON object, no additional text or formatting.`
                },
            {
                role: "user",
                content: message
            }
        ];

        // Try preferred model first, then fallbacks
        const modelsToTry = [this.preferredModel, ...this.fallbackModels];
        
        for (const model of modelsToTry) {
            try {
                const intentAnalysis = await this.system.modules.apiManager.complete({
                    model: model,
                    messages,
                    maxTokens: 200,
                    temperature: 0.1
                });

                try {
                    // Clean the response content to extract JSON
                    let content = intentAnalysis.content.trim();
                    
                    // Remove markdown code blocks if present
                    if (content.startsWith('```json')) {
                        content = content.replace(/^```json\s*/, '').replace(/\s*```$/, '');
                    } else if (content.startsWith('```')) {
                        content = content.replace(/^```\s*/, '').replace(/\s*```$/, '');
                    }
                    
                    // Try to parse the cleaned JSON
                    return JSON.parse(content);
                } catch (parseError) {
                    console.warn(`Failed to parse intent analysis from ${model}:`, parseError);
                    console.warn(`Raw content: ${intentAnalysis.content}`);
                    continue;
                }
                
            } catch (error) {
                console.warn(`Model ${model} failed for intent analysis: ${error.message}`);
                continue;
            }
        }

        // Fallback if all models fail
        return {
            intent: "general_help",
            confidence: 0.5,
            entities: [],
            requiresContextUpdate: false,
            action: "provide_help"
        };
    }

    /**
     * Get relevant context based on intent
     */
    async getRelevantContext(intent) {
        const context = {
            project: {},
            sprint: {},
            tasks: {},
            teams: {},
            quality: {},
            cost: {},
            summary: ""
        };

        // Get project status
        if (intent.entities.includes('project')) {
            context.project = await this.integrationPoints.projectStatus();
        }

        // Get sprint information
        if (intent.entities.includes('sprint')) {
            context.sprint = await this.integrationPoints.sprintInfo();
        }

        // Get task status
        if (intent.entities.includes('task')) {
            context.tasks = await this.integrationPoints.taskStatus();
        }

        // Get team status
        if (intent.entities.includes('team')) {
            context.teams = await this.integrationPoints.teamStatus();
        }

        // Get quality metrics
        if (intent.entities.includes('quality')) {
            context.quality = await this.integrationPoints.qualityMetrics();
        }

        // Get cost report
        if (intent.entities.includes('cost')) {
            context.cost = await this.integrationPoints.costReport();
        }

        // Create summary
        context.summary = await this.createContextSummary(context);

        return context;
    }

    /**
     * Generate AI response
     */
    async generateResponse(userMessage, intent, context, options) {
        const systemPrompt = this.buildSystemPrompt(intent, context);
        
        const messages = [
            {
                role: "system",
                content: systemPrompt
            },
            ...this.getConversationContext(),
            {
                role: "user",
                content: userMessage
            }
        ];

        // Try preferred model first, then fallbacks
        const modelsToTry = [this.preferredModel, ...this.fallbackModels];
        
        for (const model of modelsToTry) {
            try {
                console.log(`🤖 Trying model: ${model}`);
                const response = await this.system.modules.apiManager.complete({
                    model: model,
                    messages,
                    maxTokens: 1000,
                    temperature: 0.7
                });
                
                console.log(`✅ Success with model: ${model}`);
                return response.content;
                
            } catch (error) {
                console.warn(`❌ Model ${model} failed: ${error.message}`);
                continue;
            }
        }
        
        // If all models fail, return a fallback response
        throw new Error("All AI models are currently unavailable. Please check your API keys and try again.");
    }

    /**
     * Build system prompt based on intent and context
     */
    buildSystemPrompt(intent, context) {
        let prompt = `You are an AI assistant for the Team Leader System v4.0, helping manage the "${this.system.projectName}" project. `;
        
        prompt += `You have access to real-time project data and can help with project management, development coordination, and technical guidance. `;
        
        prompt += `Current project context: ${context.summary}\n\n`;
        
        prompt += `Respond in a helpful, conversational tone. Be specific about project details when relevant. `;
        
        prompt += `If the user asks about project status, tasks, sprints, or team activities, provide accurate information from the system. `;
        
        prompt += `If they need help with development decisions, provide thoughtful guidance based on best practices. `;
        
        prompt += `Keep responses concise but informative.`;

        return prompt;
    }

    /**
     * Get conversation context (recent messages)
     */
    getConversationContext() {
        const recentMessages = this.conversationHistory.slice(-this.contextWindow);
        return recentMessages.map(msg => ({
            role: msg.role,
            content: msg.content
        }));
    }

    /**
     * Add message to conversation history
     */
    addToHistory(role, content) {
        this.conversationHistory.push({
            role,
            content,
            timestamp: new Date().toISOString()
        });

        // Keep only recent messages
        if (this.conversationHistory.length > this.contextWindow * 2) {
            this.conversationHistory = this.conversationHistory.slice(-this.contextWindow);
        }
    }

    /**
     * Generate conversation suggestions
     */
    generateSuggestions(intent) {
        const suggestions = {
            project_status: [
                "How is the project progressing?",
                "What are the current sprint goals?",
                "Show me the latest quality metrics"
            ],
            sprint_info: [
                "What's the current sprint status?",
                "How many tasks are remaining?",
                "What's the sprint velocity?"
            ],
            task_management: [
                "What tasks need attention?",
                "Create a new task for...",
                "Update task status for..."
            ],
            team_communication: [
                "What are the teams working on?",
                "Show me recent team handoffs",
                "What approvals are pending?"
            ],
            quality_check: [
                "Run a quality assessment",
                "Show me the latest test results",
                "What quality issues need attention?"
            ],
            cost_analysis: [
                "Show me the cost report",
                "What's the current budget status?",
                "Analyze cost trends"
            ],
            general_help: [
                "What can you help me with?",
                "Show me project overview",
                "How do I manage tasks?"
            ]
        };

        return suggestions[intent.intent] || suggestions.general_help;
    }

    /**
     * Integration point methods
     */
    async getProjectStatus() {
        return this.system.getStatus();
    }

    async getSprintInfo() {
        const sprintManager = this.system.modules.sprintManager;
        return {
            currentSprint: sprintManager.sprintConfig?.currentSprint || 0,
            totalSprints: sprintManager.sprintConfig?.totalSprints || 0,
            sprintStatus: "active" // This would be dynamic
        };
    }

    async getTaskStatus() {
        return {
            totalTasks: this.system.tasks.size,
            completedTasks: 0, // This would be calculated
            pendingTasks: 0,   // This would be calculated
            tasks: Array.from(this.system.tasks.values())
        };
    }

    async getTeamStatus() {
        return {
            totalAgents: this.system.agents.size,
            activeAgents: Array.from(this.system.agents.values()).filter(agent => agent.isActive).length,
            teams: this.system.modules.promptLibrary?.teams || []
        };
    }

    async getQualityMetrics() {
        const qualityEnforcer = this.system.modules.qualityEnforcer;
        return {
            qualityGates: qualityEnforcer.qualityGates || {},
            lastAssessment: "Not run yet"
        };
    }

    async getCostReport() {
        const costReporter = this.system.modules.costReporter;
        return {
            totalCost: costReporter.totalCost || 0,
            costBreakdown: costReporter.costBreakdown || {},
            budgetStatus: "On track"
        };
    }

    /**
     * Create context summary
     */
    async createContextSummary(context) {
        const messages = [
            {
                role: "system",
                content: "Create a brief, natural summary of the project context for an AI assistant. Focus on key metrics and current status."
            },
            {
                role: "user",
                content: JSON.stringify(context)
            }
        ];

        // Try preferred model first, then fallbacks
        const modelsToTry = [this.preferredModel, ...this.fallbackModels];
        
        for (const model of modelsToTry) {
            try {
                const summary = await this.system.modules.apiManager.complete({
                    model: model,
                    messages,
                    maxTokens: 300,
                    temperature: 0.3
                });

                return summary.content;
                
            } catch (error) {
                console.warn(`Model ${model} failed for context summary: ${error.message}`);
                continue;
            }
        }

        // Fallback if all models fail
        return "Project context unavailable due to AI model issues.";
    }

    /**
     * Update project context
     */
    async updateProjectContext() {
        this.projectContext = {
            projectName: this.system.projectName,
            isActive: this.system.isActive,
            currentSprint: this.system.currentSprint,
            lastUpdated: new Date().toISOString()
        };
    }

    /**
     * Load conversation history
     */
    async loadConversationHistory() {
        try {
            const historyPath = `${this.system.projectPath}/conversations/history/conversation.json`;
            const historyData = await fs.readFile(historyPath, 'utf8');
            this.conversationHistory = JSON.parse(historyData);
        } catch (error) {
            // No history exists yet, start fresh
            this.conversationHistory = [];
        }
    }

    /**
     * Save conversation history
     */
    async saveConversation() {
        try {
            const historyPath = `${this.system.projectPath}/conversations/history/conversation.json`;
            await fs.writeFile(historyPath, JSON.stringify(this.conversationHistory, null, 2));
        } catch (error) {
            console.error("Error saving conversation history:", error);
        }
    }

    /**
     * Ensure directory exists
     */
    async ensureDirectory(dirPath) {
        try {
            await fs.mkdir(dirPath, { recursive: true });
        } catch (error) {
            // Directory might already exist
        }
    }

    /**
     * Get conversation statistics
     */
    getStats() {
        return {
            totalMessages: this.conversationHistory.length,
            userMessages: this.conversationHistory.filter(msg => msg.role === 'user').length,
            assistantMessages: this.conversationHistory.filter(msg => msg.role === 'assistant').length,
            currentTopic: this.currentTopic,
            lastMessage: this.conversationHistory[this.conversationHistory.length - 1]?.timestamp
        };
    }
}

// Export for Node.js
module.exports = ConversationalAI; 