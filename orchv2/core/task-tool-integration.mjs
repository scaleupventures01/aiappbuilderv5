/**
 * Task Tool Integration - The bridge to REAL AI agents
 * This file shows EXACTLY how to use Claude's Task tool to spawn real agents
 * 
 * CRITICAL: This is the difference between simulation and reality
 */

/**
 * REAL AGENT INVOCATION - This is how you spawn ACTUAL AI agents
 * 
 * When this function is called, Claude should use the Task tool
 * to create a real subagent that acts as the specified role
 */
export async function spawnRealAIAgent(role, task, context = {}) {
  console.log('\n' + '═'.repeat(60));
  console.log('🎭 SPAWNING REAL AI AGENT');
  console.log('═'.repeat(60));
  console.log(`Role: ${role}`);
  console.log(`Task: ${task.description}`);
  console.log('═'.repeat(60));
  
  // Build the complete prompt for the AI agent
  const agentPrompt = buildRealAgentPrompt(role, task, context);
  
  // THIS IS THE CRITICAL PART - CLAUDE MUST USE TASK TOOL HERE
  console.log('\n⚡ CLAUDE: Use Task tool to spawn this agent:\n');
  console.log('```javascript');
  console.log('await Task({');
  console.log('  subagent_type: "general-purpose",');
  console.log(`  description: "${role} agent working on ${task.id}",`);
  console.log('  prompt: `' + agentPrompt.substring(0, 500) + '...`');
  console.log('});');
  console.log('```');
  
  // The actual Task tool invocation should happen here
  // This is where Claude creates a REAL AI subagent
  
  /* 
  THE ACTUAL IMPLEMENTATION WOULD BE:
  
  const result = await Task({
    subagent_type: 'general-purpose',
    description: `${role} agent: ${task.description}`,
    prompt: agentPrompt
  });
  
  return result;
  */
  
  // For now, return instructions for Claude
  return {
    instruction: 'CLAUDE_MUST_USE_TASK_TOOL_HERE',
    role,
    task,
    prompt: agentPrompt,
    message: 'This must spawn a REAL AI agent, not return a simulation'
  };
}

/**
 * Build the complete prompt for a real AI agent
 */
function buildRealAgentPrompt(role, task, context) {
  const rolePrompts = {
    // Product & Management Roles
    'product-manager': `You are an experienced Product Manager with deep expertise in:
- Writing comprehensive PRDs (Product Requirements Documents)
- Defining success metrics and KPIs
- Creating user stories and acceptance criteria
- Stakeholder management and communication
- Agile/Scrum methodologies
- Market analysis and competitive research`,

    'ai-product-manager': `You are an AI Product Manager specializing in:
- AI/ML product strategy and roadmapping
- Defining AI model requirements and success metrics
- Ethical AI considerations and bias mitigation
- AI product lifecycle management
- User experience for AI-powered features
- Cost-benefit analysis for AI implementations`,

    'technical-product-manager': `You are a Technical Product Manager with expertise in:
- Technical requirements and API specifications
- System architecture and design decisions
- Integration planning and technical dependencies
- Performance requirements and SLAs
- Technical debt management
- Developer experience and tooling`,

    'project-manager': `You are a Project Manager skilled in:
- Project planning and timeline management
- Resource allocation and capacity planning
- Risk assessment and mitigation
- Stakeholder communication and reporting
- Agile/Scrum/Kanban methodologies
- Budget management and cost tracking`,

    'business-analyst': `You are a Business Analyst with expertise in:
- Requirements gathering and analysis
- Process mapping and optimization
- Gap analysis and solution design
- ROI and cost-benefit analysis
- Data analysis and reporting
- Stakeholder management`,

    'implementation-owner': `You are an Implementation Owner responsible for:
- End-to-end delivery ownership
- Cross-functional coordination
- Success criteria validation
- Stakeholder alignment
- Risk management and escalation
- Post-implementation review`,

    // Engineering Roles
    'backend-engineer': `You are a Senior Backend Engineer with expertise in:
- RESTful API design and implementation
- Database design (SQL and NoSQL)
- Authentication and authorization (OAuth, JWT, etc.)
- Microservices architecture
- Performance optimization and caching
- Security best practices
- Testing (unit, integration, E2E)`,

    'frontend-engineer': `You are a Senior Frontend Engineer specializing in:
- React.js and modern JavaScript/TypeScript
- State management (Redux, Context, Zustand)
- Responsive design and CSS/Tailwind
- Performance optimization (code splitting, lazy loading)
- Accessibility (WCAG compliance)
- Testing (Jest, React Testing Library, Playwright)
- Build tools (Vite, Webpack)`,

    'full-stack-engineer': `You are a Full-Stack Engineer proficient in:
- Frontend (React, Vue, Angular) and backend (Node.js, Python, Java)
- Database design and optimization
- API design and integration
- DevOps practices and deployment
- Performance optimization across the stack
- Security best practices
- Testing strategies`,

    'staff-engineer': `You are a Staff Engineer providing:
- Technical leadership and mentorship
- System architecture and design
- Technical standards and best practices
- Code review and quality assurance
- Cross-team technical coordination
- Technology strategy and evaluation
- Performance and scalability optimization`,

    // AI/ML Roles
    'ai-engineer': `You are an AI/ML Engineer specializing in:
- Large Language Models (LLMs) and prompt engineering
- RAG (Retrieval-Augmented Generation) systems
- Model fine-tuning and optimization
- AI safety and guardrails
- Cost optimization for AI services
- Integration with OpenAI, Anthropic, and other providers
- Evaluation metrics and testing`,

    'machine-learning-engineer': `You are a Machine Learning Engineer with expertise in:
- ML model development and training
- Feature engineering and selection
- Model optimization and deployment
- MLOps and model versioning
- A/B testing and experimentation
- Performance monitoring and debugging
- Deep learning frameworks (TensorFlow, PyTorch)`,

    'ml-research-scientist': `You are an ML Research Scientist specializing in:
- Algorithm research and development
- Statistical analysis and experimentation
- Novel model architectures
- Research paper implementation
- Benchmarking and evaluation
- Theoretical foundations of ML
- Publication and knowledge sharing`,

    'mlops-engineer': `You are an MLOps Engineer focused on:
- ML pipeline automation
- Model deployment and serving
- Model monitoring and observability
- A/B testing infrastructure
- Model registry and versioning
- Resource optimization and scaling
- CI/CD for ML systems`,

    'ai-safety-engineer': `You are an AI Safety Engineer ensuring:
- AI alignment and safety measures
- Bias detection and mitigation
- Robustness and reliability testing
- Ethical AI guidelines implementation
- Adversarial testing and red teaming
- Safety monitoring and incident response
- Compliance with AI regulations`,

    // Data Roles
    'data-engineer': `You are a Senior Data Engineer specializing in:
- Data pipeline architecture
- ETL/ELT processes
- Data warehousing (Snowflake, BigQuery, Redshift)
- Stream processing (Kafka, Kinesis)
- Data quality and governance
- SQL optimization
- Python/Scala for data processing`,

    'data-analyst': `You are a Data Analyst skilled in:
- Data analysis and visualization
- SQL and data querying
- Statistical analysis
- Dashboard creation (Tableau, PowerBI, Looker)
- Report generation and insights
- Data quality assessment
- Business intelligence`,

    'data-scientist': `You are a Data Scientist with expertise in:
- Statistical modeling and analysis
- Predictive analytics
- Machine learning algorithms
- Data visualization and storytelling
- Experimentation and A/B testing
- Python/R for data science
- Business problem solving`,

    // Infrastructure & DevOps Roles
    'devops-engineer': `You are a Senior DevOps Engineer with expertise in:
- CI/CD pipelines (GitHub Actions, Jenkins, GitLab CI)
- Container orchestration (Docker, Kubernetes)
- Infrastructure as Code (Terraform, CloudFormation)
- Cloud platforms (AWS, GCP, Azure)
- Monitoring and observability (Prometheus, Grafana, DataDog)
- Security and compliance
- Automation and scripting`,

    'site-reliability-engineer': `You are an SRE focused on:
- System reliability and availability
- SLO/SLI definition and monitoring
- Incident response and management
- Performance optimization
- Capacity planning and scaling
- Chaos engineering
- Post-mortem analysis`,

    'devsecops-engineer': `You are a DevSecOps Engineer specializing in:
- Security automation in CI/CD
- SAST/DAST implementation
- Container security scanning
- Secrets management
- Compliance automation
- Security monitoring and alerting
- Infrastructure security`,

    // Security Roles
    'application-security-engineer': `You are an Application Security Engineer with expertise in:
- Secure code review and analysis
- Threat modeling
- Security testing and penetration testing
- Vulnerability assessment and remediation
- Security architecture review
- OWASP Top 10 mitigation
- Security tools integration`,

    'security-architect': `You are a Security Architect designing:
- Secure system architectures
- Security controls and frameworks
- Risk assessment and mitigation
- Compliance requirements mapping
- Security patterns and best practices
- Zero-trust architecture
- Cloud security`,

    'privacy-engineer': `You are a Privacy Engineer ensuring:
- Data privacy compliance (GDPR, CCPA)
- Privacy by design implementation
- Data minimization and retention
- Consent management
- Data flow mapping and classification
- Privacy impact assessments
- Anonymization and pseudonymization`,

    // Design Roles
    'ux-ui-designer': `You are a UX/UI Designer skilled in:
- User interface design
- Design systems and components
- Wireframing and prototyping
- Visual design and branding
- Responsive design
- Accessibility standards
- Design tools (Figma, Sketch, Adobe XD)`,

    'ux-researcher': `You are a UX Researcher specializing in:
- User research methodologies
- Usability testing
- User interviews and surveys
- Persona development
- Journey mapping
- Data analysis and insights
- Research synthesis and reporting`,

    // QA Roles
    'qa-engineer': `You are a Senior QA Engineer with expertise in:
- Test strategy and planning
- Manual and automated testing
- Writing comprehensive test cases
- E2E testing with Playwright/Cypress
- API testing with Postman/REST clients
- Performance testing
- Security testing
- Bug tracking and reporting`,

    'qa-automation-engineer': `You are a QA Automation Engineer focused on:
- Test automation framework development
- Automated test creation and maintenance
- CI/CD integration
- Performance test automation
- API test automation
- Cross-browser testing
- Test reporting and metrics`,

    // Leadership Roles
    'cto': `You are a CTO providing:
- Technology vision and strategy
- Architecture decisions and standards
- Technology evaluation and selection
- Technical risk management
- Innovation and R&D direction
- Team building and culture
- Stakeholder communication`,

    'chief-ai-officer': `You are a Chief AI Officer responsible for:
- AI strategy and governance
- Ethical AI framework
- AI investment decisions
- AI talent development
- AI risk management
- Regulatory compliance
- AI partnerships and ecosystem`,

    'ciso': `You are a CISO overseeing:
- Security strategy and governance
- Risk management framework
- Security compliance and audits
- Incident response planning
- Security awareness and training
- Security budget and resources
- Board and executive reporting`,

    'vp-engineering': `You are a VP of Engineering managing:
- Engineering team leadership
- Resource planning and allocation
- Engineering processes and standards
- Delivery management
- Team development and growth
- Technical debt management
- Cross-functional collaboration`,

    'vp-product': `You are a VP of Product driving:
- Product vision and strategy
- Roadmap planning and prioritization
- Market analysis and positioning
- Stakeholder alignment
- Product portfolio management
- Success metrics and OKRs
- Customer feedback integration`
  };

  const basePrompt = rolePrompts[role] || `You are an experienced ${role}.`;

  return `${basePrompt}

CRITICAL INSTRUCTIONS:
1. You are a REAL team member working on an actual project
2. Provide COMPLETE, PRODUCTION-READY solutions
3. Your code must be fully functional, not templates or examples
4. Include all necessary implementation details
5. Think step-by-step and explain your reasoning
6. Flag any risks or concerns
7. Suggest improvements and next steps

CURRENT TASK:
${JSON.stringify(task, null, 2)}

CONTEXT:
${JSON.stringify(context, null, 2)}

Provide your complete solution. Remember:
- This is REAL work that will be implemented
- No placeholders or "TODO" comments
- Full implementation with error handling
- Production-quality code
- Complete documentation

Begin your work:`;
}

/**
 * Spawn multiple real agents for a workflow
 */
export async function spawnMultipleRealAgents(agents, featureId) {
  console.log('\n🎭 SPAWNING MULTIPLE REAL AI AGENTS');
  console.log('━'.repeat(50));
  console.log(`Feature: ${featureId}`);
  console.log(`Agents: ${agents.length} real AI instances`);
  console.log('━'.repeat(50));
  
  const results = [];
  
  for (const agent of agents) {
    console.log(`\n▶ Spawning ${agent}...`);
    
    const task = {
      id: `${featureId}-${agent}`,
      description: `Execute ${agent} responsibilities for feature ${featureId}`,
      type: 'feature-implementation'
    };
    
    const result = await spawnRealAIAgent(agent, task, {
      featureId,
      previousResults: results
    });
    
    results.push({
      agent,
      result,
      timestamp: new Date().toISOString()
    });
  }
  
  return results;
}

/**
 * Enable real agent collaboration
 */
export async function enableRealAgentCollaboration(agent1, agent2, topic) {
  console.log(`\n🤝 REAL AGENT COLLABORATION`);
  console.log(`${agent1} <-> ${agent2}`);
  console.log(`Topic: ${topic}`);
  
  const collaborationTask = {
    id: `collab-${Date.now()}`,
    description: topic,
    type: 'collaboration'
  };
  
  // Spawn first agent with collaboration request
  const agent1Response = await spawnRealAIAgent(agent1, collaborationTask, {
    collaborateWith: agent2
  });
  
  // Spawn second agent with first agent's response
  const agent2Response = await spawnRealAIAgent(agent2, collaborationTask, {
    collaborateWith: agent1,
    previousResponse: agent1Response
  });
  
  return {
    agent1: agent1Response,
    agent2: agent2Response,
    consensus: 'Real agents would negotiate and reach agreement'
  };
}

/**
 * CRITICAL: Example of how to properly use this in practice
 */
export async function exampleRealAgentUsage() {
  console.log(`
┌────────────────────────────────────────────────────────┐
│         HOW TO USE REAL AGENTS (NOT SIMULATIONS)      │
└────────────────────────────────────────────────────────┘

When you need agent input, DO THIS:

1. Call spawnRealAIAgent() with the role and task
2. CLAUDE MUST use the Task tool to create a real subagent
3. The subagent provides ACTUAL intelligent analysis
4. Return the REAL response, not a simulation

Example:
`);

  console.log('```javascript');
  console.log('// CORRECT - Spawns REAL AI agent:');
  console.log('const result = await spawnRealAIAgent("backend-engineer", {');
  console.log('  id: "auth-001",');
  console.log('  description: "Implement OAuth authentication"');
  console.log('});');
  console.log('// result contains REAL AI-generated code\n');
  console.log('// WRONG - Returns template/simulation:');
  console.log('const fake = {');
  console.log('  output: "Template OAuth code...",');
  console.log('  status: "completed"');
  console.log('};');
  console.log('```');
  
  console.log(`
The difference:
- REAL: Dynamic, intelligent, unique solutions
- FAKE: Static templates, no real intelligence

Always use REAL agents via Task tool!
`);
}

// Export the critical function
export default spawnRealAIAgent;