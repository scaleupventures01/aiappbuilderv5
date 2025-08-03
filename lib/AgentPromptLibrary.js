// AgentPromptLibrary - Complete Team Leader System v4.0
class AgentPromptLibrary {
    constructor() {
        this.prompts = this.initializeAllPrompts();
        console.log("AgentPromptLibrary initialized with", Object.keys(this.prompts).length, "agents across 11 teams");
    }
    
    initializeAllPrompts() {
        return {
            // 1. Orchestrator Team 👑
            "senior-orchestrator": "Senior Orchestrator - Claude Opus 4 - Master coordinator, quality gates, user communication",
            "junior-orchestrator": "Junior Orchestrator Assistant - Claude Sonnet 4 - Dashboard generation, status tracking",
            
            // 2. Requirements Analysis Team 📋
            "senior-requirements-analyst": "Senior Requirements Analyst - Claude Sonnet 4 - Requirements approval, quality scoring",
            "junior-requirements-analyst-1": "Junior Requirements Analyst #1 - Gemini 2.5 Pro - PRD analysis, documentation",
            "junior-requirements-analyst-2": "Junior Requirements Analyst #2 - Gemini 2.5 Pro - Reference library, mood boards",
            "junior-requirements-analyst-3": "Junior Requirements Analyst #3 - Gemini 2.5 Pro - Gap analysis, clarifications",
            
            // 3. Architecture Team 🏗️
            "senior-architect": "Senior Architect - Claude Opus 4 - Architecture approval, tech stack selection",
            "junior-architect-1": "Junior Architect #1 - Claude Sonnet 4 - Sprint planning, component design",
            "junior-architect-2": "Junior Architect #2 - Claude Sonnet 4 - Dependency mapping, integrations",
            "junior-architect-3": "Junior Architect #3 - Claude Sonnet 4 - API design, documentation",
            
            // 4. Database Team 🗄️
            "senior-database-architect": "Senior DBA - Claude Sonnet 4 - Schema approval, RLS policies",
            "junior-database-engineer-1": "Junior DBA #1 - GPT-4o - Schema design, migrations",
            "junior-database-engineer-2": "Junior DBA #2 - GPT-4o - Query optimization, indexing",
            "junior-database-engineer-3": "Junior DBA #3 - GPT-4o - Test data, performance tuning",
            
            // 5. Security Team 🔒
            "senior-security-engineer": "Senior Security Engineer - o3 - Threat models, compliance",
            "junior-security-engineer-1": "Junior Security Engineer #1 - Claude Sonnet 4 - STRIDE analysis",
            "junior-security-engineer-2": "Junior Security Engineer #2 - Claude Sonnet 4 - Security testing",
            "junior-security-engineer-3": "Junior Security Engineer #3 - Claude Sonnet 4 - Compliance docs",
            
            // 6. Design Team 🎨
            "senior-design-lead": "Senior Design Lead - Claude Sonnet 4 - Design system governance",
            "junior-wireframe-designer-1": "Junior Wireframe Designer #1 - Gemini 2.5 Flash - Site maps, HTML wireframes",
            "junior-wireframe-designer-2": "Junior Wireframe Designer #2 - Gemini 2.5 Flash - Page templates",
            "junior-ux-designer-1": "Junior UX Designer #1 - Gemini 2.5 Flash - User flows, interactions",
            "junior-ux-designer-2": "Junior UX Designer #2 - Gemini 2.5 Flash - Micro-interactions, states",
            "junior-ui-designer-1": "Junior UI Designer #1 - Gemini 2.5 Pro - Visual design, styling",
            "junior-ui-designer-2": "Junior UI Designer #2 - Gemini 2.5 Pro - Design tokens, components",
            
            // 7. Content Team ✍️
            "senior-content-strategist": "Senior Content Strategist - GPT-4o - Content strategy, brand voice",
            "junior-marketing-copywriter-1": "Junior Marketing Copywriter #1 - Gemini 2.5 Flash - Landing pages, marketing",
            "junior-marketing-copywriter-2": "Junior Marketing Copywriter #2 - Gemini 2.5 Flash - Value propositions",
            "junior-ux-writer-1": "Junior UX Writer #1 - Gemini 2.5 Flash - UI text, microcopy",
            "junior-ux-writer-2": "Junior UX Writer #2 - Gemini 2.5 Flash - Error messages, tooltips",
            "junior-technical-writer-1": "Junior Technical Writer #1 - Gemini 2.5 Pro - Documentation",
            "junior-technical-writer-2": "Junior Technical Writer #2 - Gemini 2.5 Pro - API docs, tutorials",
            
            // 8. AI/ML Team 🤖
            "senior-ml-engineer": "Senior ML Engineer - o3 - AI architecture, model selection",
            "junior-ml-engineer-1": "Junior ML Engineer #1 - o4-mini - Feature engineering",
            "junior-ml-engineer-2": "Junior ML Engineer #2 - o4-mini - Model implementation",
            "junior-ml-engineer-3": "Junior ML Engineer #3 - o4-mini - Integration, testing",
            
            // 9. MCP Integration Team 🔌
            "senior-integration-architect": "Senior Integration Architect - Claude Sonnet 4 - MCP validation",
            "junior-integration-engineer-1": "Junior Integration Engineer #1 - Gemini 2.5 Pro - MCP setup",
            "junior-integration-engineer-2": "Junior Integration Engineer #2 - Gemini 2.5 Pro - Integration testing",
            
            // 10. Development Team 🔨
            "senior-developer": "Senior Developer - Claude Opus 4 - Code review, architecture",
            "junior-developer-1": "Junior Developer #1 - Claude Sonnet 4 - Complex features",
            "junior-developer-2": "Junior Developer #2 - Claude Sonnet 4 - Complex features",
            "junior-developer-3": "Junior Developer #3 - Gemini 2.5 Pro - Simple features",
            "junior-developer-4": "Junior Developer #4 - Gemini 2.5 Pro - Tests, utilities",
            
            // 11. Validation Team ✅
            "senior-validator": "Senior Validator - Claude Sonnet 4 - Testing approval, security validation",
            "junior-validator-1": "Junior Validator #1 - GPT-4o - Test execution",
            "junior-validator-2": "Junior Validator #2 - GPT-4o - Security scans",
            "junior-validator-3": "Junior Validator #3 - GPT-4o - Performance testing"
        };
    }
    
    getAvailableAgents() {
        return Object.keys(this.prompts);
    }
    
    getAgentsByTeam() {
        const teams = {
            "Orchestrator": [],
            "Requirements": [],
            "Architecture": [],
            "Database": [],
            "Security": [],
            "Design": [],
            "Content": [],
            "AI/ML": [],
            "MCP Integration": [],
            "Development": [],
            "Validation": []
        };
        
        Object.keys(this.prompts).forEach(agentId => {
            if (agentId.includes("orchestrator")) teams["Orchestrator"].push(agentId);
            else if (agentId.includes("requirements")) teams["Requirements"].push(agentId);
            else if (agentId.includes("architect") && !agentId.includes("integration")) teams["Architecture"].push(agentId);
            else if (agentId.includes("database")) teams["Database"].push(agentId);
            else if (agentId.includes("security")) teams["Security"].push(agentId);
            else if (agentId.includes("design") || agentId.includes("wireframe") || agentId.includes("ux") || agentId.includes("ui")) teams["Design"].push(agentId);
            else if (agentId.includes("content") || agentId.includes("writer") || agentId.includes("copywriter")) teams["Content"].push(agentId);
            else if (agentId.includes("ml")) teams["AI/ML"].push(agentId);
            else if (agentId.includes("integration")) teams["MCP Integration"].push(agentId);
            else if (agentId.includes("developer")) teams["Development"].push(agentId);
            else if (agentId.includes("validator")) teams["Validation"].push(agentId);
        });
        
        return teams;
    }
    
    getPrompt(agentId) {
        return this.prompts[agentId] || "Default agent prompt";
    }
    
    getTeamSummary() {
        const teams = this.getAgentsByTeam();
        let summary = "Team Leader System v4.0 - Agent Summary:\n";
        summary += "=" .repeat(50) + "\n";
        
        Object.entries(teams).forEach(([teamName, agents]) => {
            summary += `\n${teamName} Team (${agents.length} agents):\n`;
            agents.forEach(agent => {
                const role = agent.includes("senior") ? "Senior" : "Junior";
                summary += `  - ${role}: ${agent}\n`;
            });
        });
        
        summary += "\n" + "=".repeat(50);
        summary += `\nTotal Agents: ${Object.keys(this.prompts).length}`;
        summary += `\nTotal Teams: ${Object.keys(teams).length}`;
        
        return summary;
    }
}

// Make it available globally
if (typeof window !== 'undefined') {
    window.AgentPromptLibrary = AgentPromptLibrary;
}

// Export for Node.js
module.exports = AgentPromptLibrary;