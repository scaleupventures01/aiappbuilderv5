// communication_monitor.js - File-based Communication Monitoring System

/**
 * Communication Monitor for Team Leader System v4.0
 * Monitors file system for handoffs, approvals, escalations, and status updates
 * Processes files and triggers appropriate system actions
 */

class CommunicationMonitor {
    constructor(projectPath, teamLeaderSystem) {
        this.projectPath = projectPath;
        this.system = teamLeaderSystem;
        this.monitorInterval = 30000; // 30 seconds default
        this.monitorTimer = null;
        this.isRunning = false;
        
        // Directory structure
        this.directories = {
            handoffs: {
                pending: `${projectPath}/communications/handoffs/pending`,
                active: `${projectPath}/communications/handoffs/active`,
                completed: `${projectPath}/communications/handoffs/completed`
            },
            approvals: {
                pending: `${projectPath}/communications/approvals/pending`,
                approved: `${projectPath}/communications/approvals/approved`,
                rejected: `${projectPath}/communications/approvals/rejected`,
                conditional: `${projectPath}/communications/approvals/conditional`
            },
            escalations: {
                active: `${projectPath}/communications/escalations/active`,
                resolved: `${projectPath}/communications/escalations/resolved`
            },
            status: `${projectPath}/communications/status`,
            broadcasts: {
                urgent: `${projectPath}/communications/broadcasts/urgent`,
                info: `${projectPath}/communications/broadcasts/info`,
                archived: `${projectPath}/communications/broadcasts/archived`
            },
            decisions: `${projectPath}/communications/decisions`
        };
        
        // Track processed files to avoid reprocessing
        this.processedFiles = new Map(); // filename -> { timestamp, hash, status }
        
        // Event handlers for different file types
        this.handlers = new Map();
        
        // Statistics
        this.stats = {
            filesProcessed: 0,
            handoffsRouted: 0,
            approvalsProcessed: 0,
            escalationsHandled: 0,
            errors: 0,
            lastScan: null
        };
        
        // File type patterns
        this.filePatterns = {
            handoff: /H-\d{8}-\d{6}_(.+)_to_(.+)_handoff\.md$/,
            approval: /APR-\d{8}-\d{6}_(.+)\.md$/,
            escalation: /ESC-\d{8}-\d{6}_(.+)\.md$/,
            status: /(.+)-status\.md$/,
            risk: /RISK-\d{3}-(.+)\.md$/
        };
    }
    
    /**
     * Start monitoring the file system
     */
    async start() {
        if (this.isRunning) {
            console.log("⚠️ Communication Monitor is already running");
            return;
        }
        
        console.log("🔍 Starting Communication Monitor...");
        this.isRunning = true;
        
        // Initial scan
        await this.scanAllDirectories();
        
        // Start periodic monitoring
        this.monitorTimer = setInterval(async () => {
            await this.scanAllDirectories();
        }, this.monitorInterval);
        
        console.log(`✅ Communication Monitor started (checking every ${this.monitorInterval/1000}s)`);
    }
    
    /**
     * Stop monitoring
     */
    stop() {
        if (!this.isRunning) return;
        
        if (this.monitorTimer) {
            clearInterval(this.monitorTimer);
            this.monitorTimer = null;
        }
        
        this.isRunning = false;
        console.log("🛑 Communication Monitor stopped");
    }
    
    /**
     * Scan all monitored directories
     */
    async scanAllDirectories() {
        this.stats.lastScan = new Date().toISOString();
        
        try {
            // Scan handoffs
            await this.scanHandoffs();
            
            // Scan approvals
            await this.scanApprovals();
            
            // Scan escalations
            await this.scanEscalations();
            
            // Scan status updates
            await this.scanStatusUpdates();
            
            // Scan broadcasts
            await this.scanBroadcasts();
            
        } catch (error) {
            console.error("❌ Error during directory scan:", error);
            this.stats.errors++;
        }
    }
    
    /**
     * Scan handoff directories
     */
    async scanHandoffs() {
        const pendingPath = this.directories.handoffs.pending;
        
        try {
            const files = await this.listFiles(pendingPath);
            
            for (const file of files) {
                if (this.filePatterns.handoff.test(file)) {
                    const filePath = `${pendingPath}/${file}`;
                    
                    if (!this.isFileProcessed(filePath)) {
                        await this.processHandoff(filePath);
                    }
                }
            }
        } catch (error) {
            console.error("Error scanning handoffs:", error);
        }
    }
    
    /**
     * Process a handoff file
     */
    async processHandoff(filePath) {
        console.log(`\n📤 Processing handoff: ${filePath}`);
        
        try {
            // Read and parse the handoff file
            const content = await this.readFile(filePath);
            const handoff = this.parseHandoff(content, filePath);
            
            if (!handoff) {
                console.error("❌ Failed to parse handoff file");
                return;
            }
            
            // Mark as processed
            this.markFileProcessed(filePath);
            
            // Move to active directory
            const activePath = await this.moveToActive(filePath, 'handoffs');
            
            // Notify the system
            this.notifySystem('handoff', {
                ...handoff,
                filePath: activePath,
                processedAt: new Date().toISOString()
            });
            
            // Route to destination agent
            if (handoff.toAgent && this.system) {
                await this.routeHandoffToAgent(handoff);
            }
            
            // Update dashboard
            if (this.system?.dashboard) {
                await this.system.dashboard.addActivity(
                    `Handoff from ${handoff.fromAgent} to ${handoff.toAgent}`
                );
            }
            
            this.stats.handoffsRouted++;
            console.log(`✅ Handoff routed successfully`);
            
        } catch (error) {
            console.error("Error processing handoff:", error);
            this.stats.errors++;
        }
    }
    
    /**
     * Parse handoff file content
     */
    parseHandoff(content, filePath) {
        try {
            const lines = content.split('\n');
            const handoff = {
                type: 'handoff',
                timestamp: new Date().toISOString()
            };
            
            // Extract from filename
            const filename = filePath.split('/').pop();
            const match = filename.match(this.filePatterns.handoff);
            if (match) {
                handoff.fromAgent = match[1];
                handoff.toAgent = match[2];
            }
            
            // Parse content
            let currentSection = null;
            const deliverables = [];
            const decisions = [];
            const actions = [];
            
            for (const line of lines) {
                const trimmed = line.trim();
                
                // Parse ID
                if (trimmed.startsWith('**ID**:')) {
                    handoff.id = trimmed.split(':')[1].trim();
                }
                // Parse Priority
                else if (trimmed.startsWith('**Priority**:')) {
                    handoff.priority = trimmed.split(':')[1].trim();
                }
                // Section headers
                else if (trimmed.startsWith('## Deliverables')) {
                    currentSection = 'deliverables';
                }
                else if (trimmed.startsWith('## Key Decisions')) {
                    currentSection = 'decisions';
                }
                else if (trimmed.startsWith('## Required Actions')) {
                    currentSection = 'actions';
                }
                // Parse list items
                else if (trimmed.startsWith('- ') && currentSection === 'deliverables') {
                    const match = trimmed.match(/- \[.\] `(.+)` - (.+)/);
                    if (match) {
                        deliverables.push({
                            path: match[1],
                            description: match[2]
                        });
                    }
                }
                else if (trimmed.match(/^\d+\./) && currentSection === 'decisions') {
                    decisions.push(trimmed.substring(trimmed.indexOf('.') + 1).trim());
                }
                else if (trimmed.match(/^\d+\./) && currentSection === 'actions') {
                    actions.push(trimmed.substring(trimmed.indexOf('.') + 1).trim());
                }
            }
            
            handoff.deliverables = deliverables;
            handoff.keyDecisions = decisions;
            handoff.requiredActions = actions;
            
            return handoff;
            
        } catch (error) {
            console.error("Error parsing handoff:", error);
            return null;
        }
    }
    
    /**
     * Route handoff to destination agent
     */
    async routeHandoffToAgent(handoff) {
        try {
            // Create task from handoff
            const task = {
                id: `TASK-${Date.now()}`,
                title: `Handoff from ${handoff.fromAgent}`,
                description: handoff.requiredActions.join('\n'),
                priority: handoff.priority,
                handoffId: handoff.id,
                deliverables: handoff.deliverables,
                status: 'pending'
            };
            
            // Activate the destination agent with the task
            if (this.system.activateAgent) {
                await this.system.activateAgent(handoff.toAgent, task);
                console.log(`🤖 Activated ${handoff.toAgent} with handoff task`);
            }
            
        } catch (error) {
            console.error("Error routing handoff to agent:", error);
        }
    }
    
    /**
     * Scan approval directories
     */
    async scanApprovals() {
        // Check pending approvals
        const pendingPath = this.directories.approvals.pending;
        
        try {
            const files = await this.listFiles(pendingPath);
            
            for (const file of files) {
                if (this.filePatterns.approval.test(file)) {
                    const filePath = `${pendingPath}/${file}`;
                    
                    if (!this.isFileProcessed(filePath)) {
                        await this.processPendingApproval(filePath);
                    }
                }
            }
        } catch (error) {
            console.error("Error scanning approvals:", error);
        }
        
        // Check for user responses in approved/rejected folders
        await this.checkApprovalResponses();
    }
    
    /**
     * Process a pending approval request
     */
    async processPendingApproval(filePath) {
        console.log(`\n🔔 Processing approval request: ${filePath}`);
        
        try {
            const content = await this.readFile(filePath);
            const approval = this.parseApproval(content, filePath);
            
            if (!approval) {
                console.error("❌ Failed to parse approval file");
                return;
            }
            
            // Mark as processed
            this.markFileProcessed(filePath);
            
            // Notify the system
            this.notifySystem('approval-request', approval);
            
            // Update dashboard
            if (this.system?.dashboard) {
                await this.system.dashboard.addPendingItem('approval', {
                    title: approval.title,
                    from: approval.team,
                    priority: approval.priority,
                    blocking: approval.blocking
                });
            }
            
            // Alert in terminal
            this.showTerminalAlert('approval', approval);
            
            this.stats.approvalsProcessed++;
            
        } catch (error) {
            console.error("Error processing approval:", error);
            this.stats.errors++;
        }
    }
    
    /**
     * Check for approval responses
     */
    async checkApprovalResponses() {
        const responseTypes = ['approved', 'rejected', 'conditional'];
        
        for (const type of responseTypes) {
            const dirPath = this.directories.approvals[type];
            
            try {
                const files = await this.listFiles(dirPath);
                
                for (const file of files) {
                    const filePath = `${dirPath}/${file}`;
                    
                    if (!this.isFileProcessed(filePath)) {
                        await this.processApprovalResponse(filePath, type);
                    }
                }
            } catch (error) {
                console.error(`Error checking ${type} approvals:`, error);
            }
        }
    }
    
    /**
     * Process an approval response
     */
    async processApprovalResponse(filePath, responseType) {
        console.log(`\n✅ Processing ${responseType} approval: ${filePath}`);
        
        try {
            const content = await this.readFile(filePath);
            const response = this.parseApprovalResponse(content, filePath, responseType);
            
            // Mark as processed
            this.markFileProcessed(filePath);
            
            // Notify the system
            this.notifySystem('approval-response', {
                ...response,
                responseType
            });
            
            // Update dashboard
            if (this.system?.dashboard) {
                await this.system.dashboard.removePendingItem('approval', response.id);
                await this.system.dashboard.addActivity(
                    `Approval ${responseType}: ${response.item}`
                );
            }
            
            // Route to relevant team
            if (response.team) {
                await this.notifyTeamOfApproval(response.team, response, responseType);
            }
            
        } catch (error) {
            console.error("Error processing approval response:", error);
            this.stats.errors++;
        }
    }
    
    /**
     * Scan escalation directories
     */
    async scanEscalations() {
        const activePath = this.directories.escalations.active;
        
        try {
            const files = await this.listFiles(activePath);
            
            for (const file of files) {
                if (this.filePatterns.escalation.test(file)) {
                    const filePath = `${activePath}/${file}`;
                    
                    if (!this.isFileProcessed(filePath)) {
                        await this.processEscalation(filePath);
                    }
                }
            }
        } catch (error) {
            console.error("Error scanning escalations:", error);
        }
    }
    
    /**
     * Process an escalation
     */
    async processEscalation(filePath) {
        console.log(`\n🚨 Processing escalation: ${filePath}`);
        
        try {
            const content = await this.readFile(filePath);
            const escalation = this.parseEscalation(content, filePath);
            
            if (!escalation) {
                console.error("❌ Failed to parse escalation file");
                return;
            }
            
            // Mark as processed
            this.markFileProcessed(filePath);
            
            // Notify the system
            this.notifySystem('escalation', escalation);
            
            // Update dashboard
            if (this.system?.dashboard) {
                await this.system.dashboard.addPendingItem('escalation', {
                    title: escalation.issue,
                    from: escalation.agent,
                    priority: 'high',
                    isNew: true
                });
            }
            
            // Alert in terminal with high priority
            this.showTerminalAlert('escalation', escalation, true);
            
            this.stats.escalationsHandled++;
            
        } catch (error) {
            console.error("Error processing escalation:", error);
            this.stats.errors++;
        }
    }
    
    /**
     * Scan status update files
     */
    async scanStatusUpdates() {
        const statusPath = this.directories.status;
        
        try {
            const files = await this.listFiles(statusPath);
            
            for (const file of files) {
                if (this.filePatterns.status.test(file)) {
                    const filePath = `${statusPath}/${file}`;
                    
                    // Check if file has been modified
                    const currentHash = await this.getFileHash(filePath);
                    const processed = this.processedFiles.get(filePath);
                    
                    if (!processed || processed.hash !== currentHash) {
                        await this.processStatusUpdate(filePath);
                    }
                }
            }
        } catch (error) {
            console.error("Error scanning status updates:", error);
        }
    }
    
    /**
     * Process a status update
     */
    async processStatusUpdate(filePath) {
        try {
            const content = await this.readFile(filePath);
            const status = this.parseStatusUpdate(content, filePath);
            
            if (!status) return;
            
            // Mark as processed with hash
            const hash = await this.getFileHash(filePath);
            this.markFileProcessed(filePath, hash);
            
            // Update dashboard
            if (this.system?.dashboard) {
                await this.system.dashboard.updateTeamStatus(
                    status.agentId,
                    status.status,
                    status.agentName
                );
                
                // Update progress if provided
                if (status.progress !== null) {
                    const phase = this.getPhaseFromAgent(status.agentId);
                    if (phase) {
                        await this.system.dashboard.updateProgress(phase, status.progress);
                    }
                }
            }
            
            // Check for blockers
            if (status.blocking) {
                this.notifySystem('blocker', {
                    agent: status.agentId,
                    reason: status.currentTask,
                    eta: status.eta
                });
            }
            
        } catch (error) {
            console.error("Error processing status update:", error);
        }
    }
    
    /**
     * Scan broadcast directories
     */
    async scanBroadcasts() {
        const urgentPath = this.directories.broadcasts.urgent;
        
        try {
            const files = await this.listFiles(urgentPath);
            
            for (const file of files) {
                const filePath = `${urgentPath}/${file}`;
                
                if (!this.isFileProcessed(filePath)) {
                    await this.processBroadcast(filePath, 'urgent');
                }
            }
        } catch (error) {
            console.error("Error scanning broadcasts:", error);
        }
    }
    
    /**
     * Process a broadcast message
     */
    async processBroadcast(filePath, priority) {
        console.log(`\n📢 Processing ${priority} broadcast: ${filePath}`);
        
        try {
            const content = await this.readFile(filePath);
            const broadcast = this.parseBroadcast(content, filePath, priority);
            
            if (!broadcast) return;
            
            // Mark as processed
            this.markFileProcessed(filePath);
            
            // Show urgent broadcasts immediately
            if (priority === 'urgent') {
                this.showTerminalAlert('broadcast', broadcast, true);
            }
            
            // Notify all relevant agents
            this.notifySystem('broadcast', broadcast);
            
            // Move to archived after processing
            const archivedPath = `${this.directories.broadcasts.archived}/${filePath.split('/').pop()}`;
            await this.moveFile(filePath, archivedPath);
            
        } catch (error) {
            console.error("Error processing broadcast:", error);
        }
    }
    
    /**
     * Parse approval file content
     */
    parseApproval(content, filePath) {
        try {
            const approval = {
                type: 'approval',
                timestamp: new Date().toISOString(),
                filePath
            };
            
            // Extract from filename
            const filename = filePath.split('/').pop();
            const match = filename.match(this.filePatterns.approval);
            if (match) {
                approval.item = match[1];
            }
            
            // Parse content - look for key fields
            const lines = content.split('\n');
            for (const line of lines) {
                const trimmed = line.trim();
                
                if (trimmed.includes('**Team**:')) {
                    approval.team = trimmed.split(':')[1].trim();
                }
                else if (trimmed.includes('**Priority**:')) {
                    approval.priority = trimmed.split(':')[1].trim();
                }
                else if (trimmed.includes('**Blocking**:')) {
                    approval.blocking = trimmed.split(':')[1].trim().toLowerCase() === 'yes';
                }
                else if (trimmed.startsWith('### Summary')) {
                    approval.summary = '';
                }
                else if (trimmed.startsWith('## ') && trimmed.includes('Approval Request:')) {
                    approval.title = trimmed.substring(trimmed.indexOf(':') + 1).trim();
                }
            }
            
            return approval;
            
        } catch (error) {
            console.error("Error parsing approval:", error);
            return null;
        }
    }
    
    /**
     * Parse status update content
     */
    parseStatusUpdate(content, filePath) {
        try {
            const status = {
                type: 'status',
                timestamp: new Date().toISOString()
            };
            
            // Extract agent ID from filename
            const filename = filePath.split('/').pop();
            const match = filename.match(this.filePatterns.status);
            if (match) {
                status.agentId = match[1];
            }
            
            // Parse content
            const lines = content.split('\n');
            for (const line of lines) {
                const trimmed = line.trim();
                
                if (trimmed.includes('STATUS:')) {
                    status.agentName = trimmed.split(':')[1].trim();
                }
                else if (trimmed.includes('**Progress**:')) {
                    const progressMatch = trimmed.match(/(\d+)%/);
                    if (progressMatch) {
                        status.progress = parseInt(progressMatch[1]);
                    }
                }
                else if (trimmed.includes('**Current**:')) {
                    status.currentTask = trimmed.split(':')[1].trim();
                }
                else if (trimmed.includes('**Blocking**:')) {
                    status.blocking = trimmed.split(':')[1].trim().toLowerCase() !== 'no';
                }
                else if (trimmed.includes('**ETA**:')) {
                    status.eta = trimmed.split(':')[1].trim();
                }
                else if (trimmed.includes('**Efficiency**:')) {
                    status.efficiency = trimmed.split(':')[1].trim();
                }
            }
            
            // Determine status based on content
            if (status.blocking) {
                status.status = 'blocked';
            } else if (status.progress > 0) {
                status.status = 'active';
            } else {
                status.status = 'idle';
            }
            
            return status;
            
        } catch (error) {
            console.error("Error parsing status update:", error);
            return null;
        }
    }
    
    /**
     * Parse escalation content
     */
    parseEscalation(content, filePath) {
        try {
            const escalation = {
                type: 'escalation',
                timestamp: new Date().toISOString(),
                priority: 'high'
            };
            
            // Simple parsing for key information
            const lines = content.split('\n');
            for (const line of lines) {
                const trimmed = line.trim();
                
                if (trimmed.includes('Agent:')) {
                    escalation.agent = trimmed.split(':')[1].trim();
                }
                else if (trimmed.includes('Issue:')) {
                    escalation.issue = trimmed.split(':')[1].trim();
                }
                else if (trimmed.includes('Impact:')) {
                    escalation.impact = trimmed.split(':')[1].trim();
                }
            }
            
            return escalation;
            
        } catch (error) {
            console.error("Error parsing escalation:", error);
            return null;
        }
    }
    
    /**
     * Parse broadcast content
     */
    parseBroadcast(content, filePath, priority) {
        try {
            const broadcast = {
                type: 'broadcast',
                priority,
                timestamp: new Date().toISOString(),
                content: content.trim()
            };
            
            // Extract title from first line if it's a header
            const lines = content.split('\n');
            if (lines[0].startsWith('#')) {
                broadcast.title = lines[0].replace(/^#+\s*/, '');
            }
            
            return broadcast;
            
        } catch (error) {
            console.error("Error parsing broadcast:", error);
            return null;
        }
    }
    
    /**
     * Parse approval response content
     */
    parseApprovalResponse(content, filePath, responseType) {
        try {
            const response = {
                type: 'approval-response',
                responseType,
                timestamp: new Date().toISOString()
            };
            
            // Extract from filename
            const filename = filePath.split('/').pop();
            const match = filename.match(this.filePatterns.approval);
            if (match) {
                response.item = match[1];
                response.id = filename; // Use filename as ID
            }
            
            // Parse any conditions or feedback
            if (responseType === 'conditional' || responseType === 'rejected') {
                const lines = content.split('\n');
                for (const line of lines) {
                    if (line.includes('Conditions:') || line.includes('Reason:')) {
                        response.feedback = line.split(':').slice(1).join(':').trim();
                        break;
                    }
                }
            }
            
            return response;
            
        } catch (error) {
            console.error("Error parsing approval response:", error);
            return null;
        }
    }
    
    /**
     * Show terminal alert for important items
     */
    showTerminalAlert(type, data, urgent = false) {
        const icon = urgent ? '🚨' : '🔔';
        const color = urgent ? '\x1b[31m' : '\x1b[33m'; // Red for urgent, yellow for normal
        const reset = '\x1b[0m';
        
        console.log(`\n${color}${icon} ${type.toUpperCase()} ALERT${reset}`);
        console.log('━'.repeat(50));
        
        switch (type) {
            case 'approval':
                console.log(`Team: ${data.team || 'Unknown'}`);
                console.log(`Item: ${data.title || data.item}`);
                console.log(`Priority: ${data.priority || 'Normal'}`);
                if (data.blocking) console.log(`⚠️  BLOCKING other teams`);
                console.log(`\nAction needed:`);
                console.log(`await system.approve("${data.item}")`);
                console.log(`await system.reject("${data.item}", "reason")`);
                break;
                
            case 'escalation':
                console.log(`Agent: ${data.agent}`);
                console.log(`Issue: ${data.issue}`);
                console.log(`Impact: ${data.impact || 'Unknown'}`);
                console.log(`\nAction needed:`);
                console.log(`await system.resolve("${data.agent}")`);
                break;
                
            case 'broadcast':
                console.log(`Priority: ${data.priority}`);
                console.log(`Message: ${data.title || data.content.substring(0, 100)}`);
                break;
        }
        
        console.log('━'.repeat(50));
    }
    
    /**
     * Notify team of approval decision
     */
    async notifyTeamOfApproval(teamName, approval, responseType) {
        try {
            const notification = {
                type: 'approval-notification',
                team: teamName,
                item: approval.item,
                decision: responseType,
                feedback: approval.feedback || null,
                timestamp: new Date().toISOString()
            };
            
            // Create notification file in team's input folder
            const teamInputPath = `${this.projectPath}/agents/workspaces/${teamName}/inputs`;
            const notificationFile = `${teamInputPath}/approval-${approval.id}-${responseType}.md`;
            
            const content = this.formatApprovalNotification(notification);
            await this.writeFile(notificationFile, content);
            
            console.log(`📧 Notified ${teamName} of ${responseType} approval`);
            
        } catch (error) {
            console.error("Error notifying team of approval:", error);
        }
    }
    
    /**
     * Format approval notification for team
     */
    formatApprovalNotification(notification) {
        return `# Approval Decision: ${notification.decision.toUpperCase()}

**Item**: ${notification.item}
**Decision Date**: ${new Date(notification.timestamp).toLocaleString()}
**Decision**: ${notification.decision}

${notification.feedback ? `## Feedback\n${notification.feedback}` : ''}

## Next Steps
${notification.decision === 'approved' ? 
    '✅ Please proceed with implementation' : 
    notification.decision === 'conditional' ?
    '⚠️ Please address the conditions above before proceeding' :
    '❌ Please revise based on feedback and resubmit'}
`;
    }
    
    /**
     * Move file to active directory
     */
    async moveToActive(filePath, type) {
        const filename = filePath.split('/').pop();
        const activePath = `${this.directories[type].active}/${filename}`;
        
        try {
            await this.moveFile(filePath, activePath);
            return activePath;
        } catch (error) {
            console.error("Error moving file to active:", error);
            return filePath;
        }
    }
    
    /**
     * Move file to completed directory
     */
    async moveToCompleted(filePath, type) {
        const filename = filePath.split('/').pop();
        const completedPath = `${this.directories[type].completed}/${filename}`;
        
        try {
            await this.moveFile(filePath, completedPath);
            return completedPath;
        } catch (error) {
            console.error("Error moving file to completed:", error);
            return filePath;
        }
    }
    
    /**
     * Get phase from agent ID
     */
    getPhaseFromAgent(agentId) {
        const phaseMap = {
            'requirements': 'requirements',
            'architect': 'architecture',
            'design': 'design',
            'develop': 'development',
            'test': 'testing',
            'validat': 'testing'
        };
        
        for (const [key, phase] of Object.entries(phaseMap)) {
            if (agentId.includes(key)) {
                return phase;
            }
        }
        
        return null;
    }
    
    /**
     * Notify system of events
     */
    notifySystem(eventType, data) {
        // Emit event if handlers are registered
        const handlers = this.handlers.get(eventType) || [];
        for (const handler of handlers) {
            try {
                handler(data);
            } catch (error) {
                console.error(`Error in ${eventType} handler:`, error);
            }
        }
        
        // Log event
        console.log(`📡 Event: ${eventType}`, data);
    }
    
    /**
     * Register event handler
     */
    on(eventType, handler) {
        if (!this.handlers.has(eventType)) {
            this.handlers.set(eventType, []);
        }
        this.handlers.get(eventType).push(handler);
    }
    
    /**
     * Check if file has been processed
     */
    isFileProcessed(filePath) {
        return this.processedFiles.has(filePath);
    }
    
    /**
     * Mark file as processed
     */
    markFileProcessed(filePath, hash = null) {
        this.processedFiles.set(filePath, {
            timestamp: new Date().toISOString(),
            hash: hash || null
        });
        this.stats.filesProcessed++;
    }
    
    /**
     * Get file hash (simple implementation)
     */
    async getFileHash(filePath) {
        try {
            const content = await this.readFile(filePath);
            // Simple hash using content length and first/last characters
            return `${content.length}-${content.charCodeAt(0)}-${content.charCodeAt(content.length - 1)}`;
        } catch (error) {
            return null;
        }
    }
    
    /**
     * List files in directory
     */
    async listFiles(dirPath) {
        try {
            if (window.fs && window.fs.readdir) {
                return await window.fs.readdir(dirPath);
            }
            return [];
        } catch (error) {
            // Directory might not exist yet
            return [];
        }
    }
    
    /**
     * Read file content
     */
    async readFile(filePath) {
        if (window.fs && window.fs.readFile) {
            return await window.fs.readFile(filePath, { encoding: 'utf8' });
        }
        throw new Error("File system not available");
    }
    
    /**
     * Write file content
     */
    async writeFile(filePath, content) {
        if (window.fs && window.fs.writeFile) {
            return await window.fs.writeFile(filePath, content);
        }
        throw new Error("File system not available");
    }
    
    /**
     * Move file
     */
    async moveFile(fromPath, toPath) {
        try {
            // Read content
            const content = await this.readFile(fromPath);
            
            // Write to new location
            await this.writeFile(toPath, content);
            
            // Delete original
            if (window.fs && window.fs.unlink) {
                await window.fs.unlink(fromPath);
            }
            
            return toPath;
        } catch (error) {
            console.error("Error moving file:", error);
            throw error;
        }
    }
    
    /**
     * Get monitoring statistics
     */
    getStats() {
        return {
            ...this.stats,
            processedFiles: this.processedFiles.size,
            isRunning: this.isRunning
        };
    }
    
    /**
     * Set monitoring interval
     */
    setInterval(seconds) {
        this.monitorInterval = seconds * 1000;
        
        // Restart if running
        if (this.isRunning) {
            this.stop();
            this.start();
        }
    }
}

// Export for use in Team Leader System
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CommunicationMonitor;
}

// Make available globally in browser/Claude Code
if (typeof window !== 'undefined') {
    window.CommunicationMonitor = CommunicationMonitor;
}

// Usage example
console.log("Communication Monitor loaded!");
console.log("\nFeatures:");
console.log("- Monitors handoffs, approvals, escalations, and status updates");
console.log("- Routes tasks to appropriate agents");
console.log("- Updates dashboard in real-time");
console.log("- Shows terminal alerts for urgent items");
console.log("\nUsage:");
console.log("const monitor = new CommunicationMonitor(projectPath, teamLeaderSystem);");
console.log("await monitor.start();");
console.log("\nTo handle events:");
console.log("monitor.on('handoff', (data) => console.log('New handoff:', data));");
console.log("monitor.on('approval-request', (data) => console.log('Approval needed:', data));");
