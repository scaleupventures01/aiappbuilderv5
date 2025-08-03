// SetupWizard.js - Interactive Terminal Setup for Team Leader System v4.0

class SetupWizard {
    constructor() {
        this.config = {
            projectName: '',
            projectType: '',
            description: '',
            requirements: {
                userStories: [],
                integrations: [],
                aiFeatures: [],
                pageCount: 0,
                customComponents: 0
            },
            apiKeys: {},
            complexity: null,
            teamComposition: null
        };
        
        this.currentStep = 'welcome';
        this.templates = {
            webapp: {
                name: "Web Application",
                projectType: 'webapp',
                userStories: ['User authentication', 'Dashboard', 'User profile', 'Settings'],
                integrations: ['Stripe'],
                pageCount: 10,
                customComponents: 12,
                description: "A modern web application with user management"
            },
            saas: {
                name: "SaaS Platform",
                projectType: 'saas',
                userStories: ['User authentication', 'Subscription management', 'Team management', 'Admin dashboard', 'API access'],
                integrations: ['Stripe', 'SendGrid', 'Slack'],
                aiFeatures: ['Usage analytics', 'Smart notifications'],
                pageCount: 20,
                customComponents: 25,
                description: "A complete SaaS platform with subscription billing"
            },
            ecommerce: {
                name: "E-commerce Platform",
                projectType: 'ecommerce',
                userStories: ['Product catalog', 'Shopping cart', 'Checkout', 'Order tracking', 'User accounts'],
                integrations: ['Stripe', 'ShipStation', 'Mailchimp'],
                aiFeatures: ['Product recommendations', 'Search'],
                pageCount: 15,
                customComponents: 20,
                description: "An online store with full e-commerce capabilities"
            },
            mobile: {
                name: "Mobile App Backend",
                projectType: 'mobile',
                userStories: ['User onboarding', 'Authentication', 'Push notifications', 'Data sync', 'Settings'],
                integrations: ['Firebase', 'RevenueCat'],
                aiFeatures: ['Personalization'],
                pageCount: 12,
                customComponents: 18,
                description: "Backend and API for a mobile application"
            }
        };
    }
    
    async start() {
        console.clear();
        console.log(`
╔═══════════════════════════════════════════════════════════════╗
║       🚀 Team Leader System v4.0 - Project Setup Wizard       ║
╚═══════════════════════════════════════════════════════════════╝

Welcome! I'll help you set up your new project.

📋 Quick Start Templates:
`);
        
        // Show templates
        Object.entries(this.templates).forEach(([key, template], index) => {
            console.log(`${index + 1}. ${template.name} - ${template.description}`);
        });
        
        console.log(`\n5. Custom Project - Define everything from scratch`);
        console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        console.log(`\n👉 TO CONTINUE, TYPE ONE OF THESE COMMANDS:\n`);
        console.log(`   wizard.select(1)  // for Web Application`);
        console.log(`   wizard.select(2)  // for SaaS Platform`);
        console.log(`   wizard.select(3)  // for E-commerce`);
        console.log(`   wizard.select(4)  // for Mobile Backend`);
        console.log(`   wizard.select(5)  // for Custom Project`);
        console.log(`\n   wizard.help()     // for more information`);
        console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        
        this.currentStep = 'template_selection';
        return this;
    }
    
    select(choice) {
        if (this.currentStep !== 'template_selection') {
            console.log("⚠️  Please run wizard.start() first!");
            return;
        }
        
        const templates = Object.keys(this.templates);
        const index = parseInt(choice) - 1;
        
        if (index >= 0 && index < templates.length) {
            const templateKey = templates[index];
            const template = this.templates[templateKey];
            
            // Apply template
            this.config = {
                ...this.config,
                projectType: template.projectType,
                description: template.description,
                requirements: {
                    userStories: [...template.userStories],
                    integrations: template.integrations || [],
                    aiFeatures: template.aiFeatures || [],
                    pageCount: template.pageCount,
                    customComponents: template.customComponents
                }
            };
            
            console.clear();
            console.log(`\n✅ Selected template: ${template.name}`);
            console.log(`\n📝 Project Configuration:`);
            console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
            console.log(`Type:             ${template.name}`);
            console.log(`User Stories:     ${this.config.requirements.userStories.length} stories`);
            console.log(`Integrations:     ${this.config.requirements.integrations.join(', ') || 'None'}`);
            console.log(`AI Features:      ${this.config.requirements.aiFeatures.join(', ') || 'None'}`);
            console.log(`Estimated Pages:  ${this.config.requirements.pageCount}`);
            console.log(`Components:       ${this.config.requirements.customComponents}`);
            console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
            
            console.log(`\n👉 NEXT STEP: NAME YOUR PROJECT\n`);
            console.log(`Type one of these commands:\n`);
            console.log(`   wizard.name("my-awesome-app")     // Replace with your project name`);
            console.log(`   wizard.name("cool-startup")       // Use lowercase and hyphens`);
            console.log(`   wizard.name("client-portal")      // No spaces or special chars`);
            console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
            
            this.currentStep = 'naming';
            return true;
            
        } else if (choice === 5) {
            console.log(`\n🛠️  Custom Project Setup - Coming soon!`);
            console.log(`For now, please choose a template (1-4) and customize it.`);
            return false;
        } else {
            console.log(`\n❌ Invalid choice. Please type: wizard.select(1) through wizard.select(5)`);
            return false;
        }
    }
    
    name(projectName) {
        if (this.currentStep !== 'naming') {
            console.log("⚠️  Please select a template first with wizard.select(1-5)");
            return;
        }
        
        // Sanitize project name
        this.config.projectName = projectName.toLowerCase().replace(/[^a-z0-9-]/g, '-');
        
        console.clear();
        console.log(`\n✅ Project name set: ${this.config.projectName}`);
        
        // Calculate complexity
        this.calculateComplexity();
        
        console.log(`\n👉 READY TO CREATE YOUR PROJECT!\n`);
        console.log(`This will create the following structure:`);
        console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        console.log(`📁 ${this.config.projectName}/`);
        console.log(`   📁 .teamleader/       (system config)`);
        console.log(`   📁 agents/            (AI workspaces)`);
        console.log(`   📁 deliverables/      (generated code)`);
        console.log(`   📄 project-status.html (dashboard)`);
        console.log(`   📄 README.md          (documentation)`);
        console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        console.log(`\nType this command to create your project:\n`);
        console.log(`   wizard.create()    // Creates all files and folders`);
        console.log(`\nOr type:\n`);
        console.log(`   wizard.cancel()    // Start over`);
        console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        
        this.currentStep = 'confirm';
        return this.config.projectName;
    }
    
    calculateComplexity() {
        const factors = {
            stories: this.config.requirements.userStories.length * 0.1,
            integrations: this.config.requirements.integrations.length * 0.3,
            aiFeatures: this.config.requirements.aiFeatures.length * 0.4,
            pages: this.config.requirements.pageCount * 0.05,
            components: this.config.requirements.customComponents * 0.15
        };
        
        const score = Object.values(factors).reduce((sum, val) => sum + val, 0);
        
        let level, juniorsPerTeam;
        if (score < 10) {
            level = "SMALL";
            juniorsPerTeam = 1;
        } else if (score < 25) {
            level = "MEDIUM";
            juniorsPerTeam = 2;
        } else {
            level = "LARGE";
            juniorsPerTeam = 3;
        }
        
        this.config.complexity = {
            score: score.toFixed(2),
            level,
            factors,
            juniorsPerTeam
        };
        
        console.log(`\n📊 Project Complexity Analysis:`);
        console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        console.log(`Complexity Score: ${this.config.complexity.score}`);
        console.log(`Project Size:     ${level}`);
        console.log(`Team Size:        ${this.calculateTeamSize()} AI agents`);
        console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        
        return this.config.complexity;
    }
    
    calculateTeamSize() {
        const baseTeams = 11; // Number of teams
        const seniorsPerTeam = 1;
        const juniorsPerTeam = this.config.complexity.juniorsPerTeam;
        
        const totalSeniors = baseTeams * seniorsPerTeam;
        const totalJuniors = baseTeams * juniorsPerTeam;
        
        return totalSeniors + totalJuniors;
    }
    
    async create() {
        if (this.currentStep !== 'confirm') {
            console.log("⚠️  Please complete the setup first!");
            console.log("Run: wizard.start() to begin");
            return;
        }
        
        console.log(`\n🚀 Creating project: ${this.config.projectName}...`);
        
        const success = await this.createProjectStructure();
        
        if (success) {
            console.log(`\n🎉 SUCCESS! Your project is ready!`);
            console.log(`\n👉 NEXT STEPS:\n`);
            console.log(`1. Look in your file explorer - you'll see a new folder: ${this.config.projectName}/`);
            console.log(`2. Open ${this.config.projectName}/project-status.html in your browser`);
            console.log(`3. Explore the created folders`);
            console.log(`\n📚 To learn more about the system:`);
            console.log(`   wizard.help()`);
            console.log(`\n🔄 To create another project:`);
            console.log(`   wizard.reset()`);
            console.log(`   wizard.start()`);
            
            this.currentStep = 'completed';
        }
        
        return success;
    }
    
    async createProjectStructure() {
        const fs = window.fs;
        if (!fs) {
            console.error("❌ File system not available. Cannot create project structure.");
            console.log("Make sure you're running this in Claude Code (Cursor)");
            return false;
        }
        
        try {
            // Create main directories
            const dirs = [
                this.config.projectName,
                `${this.config.projectName}/.teamleader`,
                `${this.config.projectName}/agents`,
                `${this.config.projectName}/deliverables`,
                `${this.config.projectName}/deliverables/requirements`,
                `${this.config.projectName}/deliverables/architecture`,
                `${this.config.projectName}/deliverables/database`,
                `${this.config.projectName}/deliverables/security`,
                `${this.config.projectName}/deliverables/design`,
                `${this.config.projectName}/deliverables/content`,
                `${this.config.projectName}/deliverables/development`,
                `${this.config.projectName}/deliverables/validation`
            ];
            
            for (const dir of dirs) {
                await fs.mkdir(dir, { recursive: true });
                console.log(`✅ Created: ${dir}`);
            }
            
            // Create project config file
            const configPath = `${this.config.projectName}/.teamleader/config.json`;
            await fs.writeFile(configPath, JSON.stringify(this.config, null, 2));
            console.log(`✅ Created: ${configPath}`);
            
            // Create README
            const readme = `# ${this.config.projectName}

${this.config.description}

## Project Configuration
- Type: ${this.config.projectType}
- Complexity: ${this.config.complexity.level}
- Team Size: ${this.calculateTeamSize()} agents

## User Stories
${this.config.requirements.userStories.map(story => `- ${story}`).join('\n')}

## Integrations
${this.config.requirements.integrations.map(int => `- ${int}`).join('\n') || '- None'}

## AI Features
${this.config.requirements.aiFeatures.map(feat => `- ${feat}`).join('\n') || '- None'}

---
Generated by Team Leader System v4.0
`;
            
            await fs.writeFile(`${this.config.projectName}/README.md`, readme);
            console.log(`✅ Created: README.md`);
            
            // Create initial dashboard
            const dashboardHTML = `<!DOCTYPE html>
<html>
<head>
    <title>${this.config.projectName} - Project Status</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; background: #f0f0f0; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { color: #333; }
        .status { background: #e8f4f8; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .metric { display: inline-block; margin: 10px 20px 10px 0; }
        .metric-label { font-weight: bold; color: #666; }
        .metric-value { font-size: 24px; color: #007acc; }
        .team-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-top: 30px; }
        .team-card { background: #f5f5f5; padding: 20px; border-radius: 8px; }
        .team-card h3 { margin-top: 0; color: #007acc; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 ${this.config.projectName}</h1>
        <div class="status">
            <h2>Project Status</h2>
            <div class="metric">
                <div class="metric-label">Type</div>
                <div class="metric-value">${this.config.projectType}</div>
            </div>
            <div class="metric">
                <div class="metric-label">Complexity</div>
                <div class="metric-value">${this.config.complexity.level}</div>
            </div>
            <div class="metric">
                <div class="metric-label">Team Size</div>
                <div class="metric-value">${this.calculateTeamSize()}</div>
            </div>
            <div class="metric">
                <div class="metric-label">Status</div>
                <div class="metric-value">Initialized</div>
            </div>
        </div>
        
        <h2>AI Teams</h2>
        <div class="team-grid">
            <div class="team-card">
                <h3>🎯 Orchestrator Team</h3>
                <p>Master coordination and quality gates</p>
            </div>
            <div class="team-card">
                <h3>📋 Requirements Team</h3>
                <p>Analyze and validate requirements</p>
            </div>
            <div class="team-card">
                <h3>🏗️ Architecture Team</h3>
                <p>System design and technical planning</p>
            </div>
            <div class="team-card">
                <h3>🗄️ Database Team</h3>
                <p>Schema design and optimization</p>
            </div>
            <div class="team-card">
                <h3>🔒 Security Team</h3>
                <p>Threat modeling and compliance</p>
            </div>
            <div class="team-card">
                <h3>🎨 Design Team</h3>
                <p>UI/UX and visual design</p>
            </div>
            <div class="team-card">
                <h3>✍️ Content Team</h3>
                <p>Copy and documentation</p>
            </div>
            <div class="team-card">
                <h3>🤖 AI/ML Team</h3>
                <p>Machine learning features</p>
            </div>
            <div class="team-card">
                <h3>🔌 Integration Team</h3>
                <p>External service connections</p>
            </div>
            <div class="team-card">
                <h3>🔨 Development Team</h3>
                <p>Code implementation</p>
            </div>
            <div class="team-card">
                <h3>✅ Validation Team</h3>
                <p>Testing and quality assurance</p>
            </div>
        </div>
        
        <p style="margin-top: 30px; color: #666;">Dashboard will auto-update as agents begin work...</p>
    </div>
</body>
</html>`;
            
            await fs.writeFile(`${this.config.projectName}/project-status.html`, dashboardHTML);
            console.log(`✅ Created: project-status.html`);
            
            return true;
            
        } catch (error) {
            console.error(`❌ Error creating project structure: ${error.message}`);
            return false;
        }
    }
    
    help() {
        console.clear();
        console.log(`
📚 Team Leader System v4.0 - Help Guide
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎯 QUICK START:
1. wizard.start()      - Begin setup
2. wizard.select(1)    - Choose a template
3. wizard.name("app")  - Name your project  
4. wizard.create()     - Create the project

🤖 HOW IT WORKS:
- Creates virtual AI development teams
- 11 specialized teams with 15-40 agents
- Senior agents review junior work
- 70% cost reduction vs traditional
- Produces complete, tested applications

💰 TEMPLATES:
1. Web App     - User auth, dashboard, profiles
2. SaaS        - Subscriptions, teams, billing
3. E-commerce  - Products, cart, checkout
4. Mobile      - Backend API for mobile apps

🎯 QUALITY STANDARDS:
- 95% test coverage required
- 0 security vulnerabilities
- <2s page load performance
- WCAG AA accessibility

📁 PROJECT STRUCTURE:
your-app/
├── .teamleader/      (configuration)
├── agents/           (AI workspaces)
├── deliverables/     (generated code)
├── project-status.html (dashboard)
└── README.md         (documentation)

🔧 COMMANDS:
wizard.start()        - Start over
wizard.select(N)      - Choose template
wizard.name("name")   - Set project name
wizard.create()       - Create project
wizard.cancel()       - Cancel setup
wizard.reset()        - Reset wizard
wizard.status()       - Current status

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);
        return true;
    }
    
    cancel() {
        console.log("\n❌ Setup cancelled. Run wizard.start() to begin again.");
        this.reset();
    }
    
    reset() {
        this.config = {
            projectName: '',
            projectType: '',
            description: '',
            requirements: {
                userStories: [],
                integrations: [],
                aiFeatures: [],
                pageCount: 0,
                customComponents: 0
            },
            apiKeys: {},
            complexity: null,
            teamComposition: null
        };
        this.currentStep = 'welcome';
        console.log("✅ Wizard reset. Ready to start fresh!");
    }
    
    status() {
        console.log("\n📊 Current Wizard Status:");
        console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        console.log(`Step: ${this.currentStep}`);
        console.log(`Project: ${this.config.projectName || 'Not set'}`);
        console.log(`Type: ${this.config.projectType || 'Not selected'}`);
        console.log(`Ready: ${this.currentStep === 'confirm' ? 'Yes' : 'No'}`);
        console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        
        if (this.currentStep === 'template_selection') {
            console.log("\n👉 Next: wizard.select(1-5)");
        } else if (this.currentStep === 'naming') {
            console.log("\n👉 Next: wizard.name('your-project-name')");
        } else if (this.currentStep === 'confirm') {
            console.log("\n👉 Next: wizard.create()");
        } else if (this.currentStep === 'completed') {
            console.log("\n✅ Project created! Run wizard.start() for a new project.");
        }
    }
}

// Export for use
if (typeof window !== 'undefined') {
    window.SetupWizard = SetupWizard;
}

// Show ready message
console.log("✅ SetupWizard ready! Type: wizard.start()");