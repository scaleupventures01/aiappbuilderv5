/**
 * ProjectStarter.js - Smooth Project Initiation for Team Leader System v4.0
 * 
 * Handles the "Hello" moment and guides users through project setup
 * Focuses on user experience and natural language interaction
 */

const readline = require('readline');
const fs = require('fs').promises;
const path = require('path');
const Logger = require('./utils/Logger');
const ConfigurationManager = require('./config/ConfigurationManager');
const ModelManager = require('./core/ModelManager');

class ProjectStarter {
    constructor() {
        this.logger = new Logger().child({ component: 'ProjectStarter' });
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        
        this.projectInfo = {
            name: '',
            description: '',
            type: '',
            features: [],
            integrations: [],
            complexity: 'medium'
        };
        
        // Project templates for quick start
        this.templates = {
            'web app': {
                type: 'webapp',
                description: 'A modern web application',
                features: ['User authentication', 'Dashboard', 'User profiles', 'Settings'],
                integrations: ['Database', 'Authentication service'],
                complexity: 'medium'
            },
            'mobile app': {
                type: 'mobile',
                description: 'A mobile application',
                features: ['User onboarding', 'Core features', 'Push notifications', 'Settings'],
                integrations: ['Mobile backend', 'Push service'],
                complexity: 'medium'
            },
            'e-commerce': {
                type: 'ecommerce',
                description: 'An online store',
                features: ['Product catalog', 'Shopping cart', 'Checkout', 'Order tracking'],
                integrations: ['Payment processor', 'Inventory system'],
                complexity: 'high'
            },
            'saas platform': {
                type: 'saas',
                description: 'A software-as-a-service platform',
                features: ['User management', 'Subscription billing', 'Admin dashboard', 'API'],
                integrations: ['Payment processor', 'Email service', 'Analytics'],
                complexity: 'high'
            },
            'simple website': {
                type: 'website',
                description: 'A simple website',
                features: ['Home page', 'About page', 'Contact form'],
                integrations: ['Email service'],
                complexity: 'low'
            }
        };
    }
    
    /**
     * Start the project initiation process
     */
    async start() {
        try {
            this.logger.info('Starting project initiation process');
            
            // Welcome the user
            await this.welcomeUser();
            
            // Get project information
            await this.getProjectInfo();
            
            // Assess project complexity
            await this.assessComplexity();
            
            // Confirm and start
            await this.confirmAndStart();
            
        } catch (error) {
            this.logger.error('Project initiation failed', error);
            throw error;
        } finally {
            this.rl.close();
        }
    }
    
    /**
     * Welcome the user and explain the process
     */
    async welcomeUser() {
        console.log(`
👋 Hello! I'm excited to help you build your project!

I'll ask you a few simple questions about what you want to build,
then I'll create a team of AI agents to help you develop it.

Let's get started! 🚀
`);
        
        await this.pause();
    }
    
    /**
     * Get project information from the user
     */
    async getProjectInfo() {
        console.log(`
📋 First, let's understand your project:

`);
        
        // Get project name
        this.projectInfo.name = await this.askQuestion(
            "What would you like to call your project? ",
            "my-awesome-project"
        );
        
        // Get project description
        this.projectInfo.description = await this.askQuestion(
            "Describe your project in a few words: ",
            "A web application that helps users..."
        );
        
        // Show project templates
        await this.showTemplates();
        
        // Get project type
        this.projectInfo.type = await this.askQuestion(
            "What type of project is this? (web app, mobile app, e-commerce, saas platform, simple website, or custom): ",
            "web app"
        );
        
        // If custom, get more details
        if (this.projectInfo.type.toLowerCase() === 'custom') {
            await this.getCustomProjectDetails();
        } else {
            // Use template
            const template = this.templates[this.projectInfo.type.toLowerCase()];
            if (template) {
                this.projectInfo.features = template.features;
                this.projectInfo.integrations = template.integrations;
                this.projectInfo.complexity = template.complexity;
            }
        }
    }
    
    /**
     * Show available project templates
     */
    async showTemplates() {
        console.log(`
📚 Here are some common project types to help you get started:

`);
        
        Object.entries(this.templates).forEach(([name, template], index) => {
            console.log(`${index + 1}. ${name.charAt(0).toUpperCase() + name.slice(1)}`);
            console.log(`   ${template.description}`);
            console.log(`   Features: ${template.features.slice(0, 3).join(', ')}...`);
            console.log(`   Complexity: ${template.complexity}`);
            console.log('');
        });
    }
    
    /**
     * Get custom project details
     */
    async getCustomProjectDetails() {
        console.log(`
🎨 Great! Let's customize your project:

`);
        
        // Get features
        const featuresInput = await this.askQuestion(
            "What are the main features? (comma-separated): ",
            "user login, dashboard, data management"
        );
        this.projectInfo.features = featuresInput.split(',').map(f => f.trim());
        
        // Get integrations
        const integrationsInput = await this.askQuestion(
            "What integrations do you need? (comma-separated, or 'none'): ",
            "database, email service"
        );
        this.projectInfo.integrations = integrationsInput.toLowerCase() === 'none' 
            ? [] 
            : integrationsInput.split(',').map(i => i.trim());
    }
    
    /**
     * Assess project complexity
     */
    async assessComplexity() {
        console.log(`
🔍 Assessing your project complexity...

`);
        
        // Simple complexity assessment based on features and integrations
        const featureCount = this.projectInfo.features.length;
        const integrationCount = this.projectInfo.integrations.length;
        
        let complexity = 'medium';
        if (featureCount <= 3 && integrationCount <= 1) {
            complexity = 'low';
        } else if (featureCount >= 8 || integrationCount >= 4) {
            complexity = 'high';
        }
        
        this.projectInfo.complexity = complexity;
        
        console.log(`✅ Complexity: ${complexity.toUpperCase()}`);
        console.log(`📊 Features: ${featureCount}`);
        console.log(`🔗 Integrations: ${integrationCount}`);
    }
    
    /**
     * Confirm project details and start
     */
    async confirmAndStart() {
        console.log(`
📋 Here's what I understand about your project:

🎯 Project: ${this.projectInfo.name}
📝 Description: ${this.projectInfo.description}
🏷️  Type: ${this.projectInfo.type}
⚡ Complexity: ${this.projectInfo.complexity}
✨ Features: ${this.projectInfo.features.join(', ')}
🔗 Integrations: ${this.projectInfo.integrations.length > 0 ? this.projectInfo.integrations.join(', ') : 'None'}

`);
        
        const confirm = await this.askQuestion(
            "Does this look right? (yes/no): ",
            "yes"
        );
        
        if (confirm.toLowerCase() === 'yes' || confirm.toLowerCase() === 'y') {
            await this.startProject();
        } else {
            console.log(`
🔄 No problem! Let's start over.

`);
            await this.getProjectInfo();
            await this.assessComplexity();
            await this.confirmAndStart();
        }
    }
    
    /**
     * Start the project creation process
     */
    async startProject() {
        console.log(`
🚀 Perfect! Let's create your project...

`);
        
        try {
            // Initialize system components
            await this.initializeSystem();
            
            // Create project structure
            await this.createProjectStructure();
            
            // Initialize Team Leader System
            await this.initializeTeamLeaderSystem();
            
            // Show next steps
            await this.showNextSteps();
            
        } catch (error) {
            this.logger.error('Failed to start project', error);
            console.error(`
❌ Sorry, something went wrong while creating your project: ${error.message}

💡 Try running: node start.js
📚 For help, check the documentation
`);
            throw error;
        }
    }
    
    /**
     * Initialize system components
     */
    async initializeSystem() {
        console.log('🔧 Initializing system components...');
        
        // Initialize configuration manager
        const configManager = ConfigurationManager.getInstance();
        await configManager.loadAllConfigs();
        
        // Initialize model manager
        const modelManager = ModelManager.default;
        await modelManager.initialize();
        
        console.log('✅ System components ready');
    }
    
    /**
     * Create project structure
     */
    async createProjectStructure() {
        console.log('📁 Creating project structure...');
        
        const projectPath = this.projectInfo.name;
        
        // Create project directory
        await fs.mkdir(projectPath, { recursive: true });
        
        // Create .teamleader directory
        await fs.mkdir(path.join(projectPath, '.teamleader'), { recursive: true });
        
        // Create project configuration
        const projectConfig = {
            name: this.projectInfo.name,
            description: this.projectInfo.description,
            type: this.projectInfo.type,
            features: this.projectInfo.features,
            integrations: this.projectInfo.integrations,
            complexity: this.projectInfo.complexity,
            createdAt: new Date().toISOString(),
            version: '4.0'
        };
        
        await fs.writeFile(
            path.join(projectPath, '.teamleader', 'project.json'),
            JSON.stringify(projectConfig, null, 2)
        );
        
        console.log('✅ Project structure created');
    }
    
    /**
     * Initialize Team Leader System
     */
    async initializeTeamLeaderSystem() {
        console.log('🤖 Initializing AI team...');
        
        // Load Team Leader System
        const TeamLeaderSystem = require('../TeamLeaderSystem');
        const system = new TeamLeaderSystem(this.projectInfo.name);
        
        // Initialize with project configuration
        await system.initialize({
            projectType: this.projectInfo.type,
            description: this.projectInfo.description,
            features: this.projectInfo.features,
            integrations: this.projectInfo.integrations,
            complexity: this.projectInfo.complexity
        });
        
        console.log('✅ AI team ready');
        
        // Store system reference
        this.system = system;
    }
    
    /**
     * Show next steps to the user
     */
    async showNextSteps() {
        console.log(`
🎉 Congratulations! Your project "${this.projectInfo.name}" has been created!

📁 Project location: ./${this.projectInfo.name}
🤖 AI team: Ready and waiting for your input

📋 What happens next:

1. 📝 The AI team will analyze your requirements and create a plan
2. 🏗️  They'll start building your project step by step
3. ✅ You'll review and approve their work as they go
4. 🚀 Your project will be ready before you know it!

💡 To check on your project:
   cd ${this.projectInfo.name}
   node ../setup.js

📚 To learn more about what the AI team is doing:
   - Check the dashboard in your project folder
   - Review the logs in .teamleader/
   - Ask questions about the process

🚀 Your AI development team is ready to start building!
`);
        
        this.logger.info('Project initiation completed successfully', {
            projectName: this.projectInfo.name,
            projectType: this.projectInfo.type,
            complexity: this.projectInfo.complexity
        });
    }
    
    /**
     * Ask a question and get user input
     */
    async askQuestion(question, defaultValue = '') {
        return new Promise((resolve) => {
            const fullQuestion = defaultValue ? `${question} (default: ${defaultValue}) ` : question;
            this.rl.question(fullQuestion, (answer) => {
                resolve(answer.trim() || defaultValue);
            });
        });
    }
    
    /**
     * Pause for user to read
     */
    async pause() {
        return new Promise((resolve) => {
            setTimeout(resolve, 1000);
        });
    }
}

module.exports = ProjectStarter; 