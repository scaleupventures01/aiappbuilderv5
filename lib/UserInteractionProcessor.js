// UserInteractionProcessor.js - Handles all user approval/rejection workflows
// Part of Team Leader System v4.0

/**
 * UserInteractionProcessor - Manages user decisions and feedback routing
 * 
 * This component handles:
 * - Processing approval/rejection/conditional approval decisions
 * - Creating appropriate response files in the file system
 * - Routing decisions to relevant teams
 * - Updating dashboards and metrics
 * - Maintaining audit trails
 */

class UserInteractionProcessor {
    constructor(teamLeaderSystem) {
        this.system = teamLeaderSystem;
        this.projectPath = teamLeaderSystem.projectName;
        this.fs = window.fs;
        
        // Track pending approvals
        this.pendingApprovals = new Map();
        
        // Decision history for audit trail
        this.decisionHistory = [];
        
        // File patterns for parsing
        this.filePatterns = {
            approval: /^APR-(\d{8}-\d{6})_(.+)\.md$/,
            handoff: /^H-(\d{8}-\d{6})_(.+)_to_(.+)\.md$/
        };
        
        console.log("✅ User Interaction Processor initialized");
    }
    
    /**
     * Process an approval decision
     */
    async approve(itemId, conditions = null) {
        console.log(`\n✅ Processing approval for: ${itemId}`);
        
        try {
            // Find the pending approval
            const approval = await this.findPendingApproval(itemId);
            if (!approval) {
                throw new Error(`No pending approval found for: ${itemId}`);
            }
            
            // Create approval response
            const response = {
                id: approval.id,
                item: itemId,
                decision: conditions ? 'conditional' : 'approved',
                conditions: conditions,
                timestamp: new Date().toISOString(),
                approvedBy: 'user',
                team: approval.team,
                originalRequest: approval
            };
            
            // Save approval decision
            await this.saveApprovalDecision(response);
            
            // Notify the relevant team
            await this.notifyTeam(approval.team, response);
            
            // Update dashboard
            await this.updateDashboard(response);
            
            // Move original request to processed
            await this.moveToProcessed(approval.filePath, response.decision);
            
            // Add to history
            this.addToHistory(response);
            
            // Log success
            console.log(`✅ Approval processed successfully`);
            if (conditions) {
                console.log(`📋 Conditions: ${conditions}`);
            }
            
            return {
                success: true,
                decision: response.decision,
                team: approval.team,
                conditions: conditions
            };
            
        } catch (error) {
            console.error("❌ Error processing approval:", error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    /**
     * Process a rejection decision
     */
    async reject(itemId, reason) {
        console.log(`\n❌ Processing rejection for: ${itemId}`);
        
        if (!reason || reason.trim() === '') {
            console.error("❌ Rejection reason is required");
            return {
                success: false,
                error: "Rejection reason is required"
            };
        }
        
        try {
            // Find the pending approval
            const approval = await this.findPendingApproval(itemId);
            if (!approval) {
                throw new Error(`No pending approval found for: ${itemId}`);
            }
            
            // Create rejection response
            const response = {
                id: approval.id,
                item: itemId,
                decision: 'rejected',
                reason: reason,
                timestamp: new Date().toISOString(),
                rejectedBy: 'user',
                team: approval.team,
                originalRequest: approval
            };
            
            // Save rejection decision
            await this.saveRejectionDecision(response);
            
            // Notify the relevant team with feedback
            await this.notifyTeamOfRejection(approval.team, response);
            
            // Update dashboard
            await this.updateDashboard(response);
            
            // Move original request to processed
            await this.moveToProcessed(approval.filePath, 'rejected');
            
            // Add to history
            this.addToHistory(response);
            
            console.log(`❌ Rejection processed successfully`);
            console.log(`📝 Reason: ${reason}`);
            
            return {
                success: true,
                decision: 'rejected',
                team: approval.team,
                reason: reason
            };
            
        } catch (error) {
            console.error("❌ Error processing rejection:", error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    /**
     * Find a pending approval by ID
     */
    async findPendingApproval(itemId) {
        const pendingDir = `${this.projectPath}/communications/approvals/pending`;
        
        try {
            const files = await this.fs.readdir(pendingDir);
            
            for (const file of files) {
                if (file.includes(itemId) || file.toLowerCase().includes(itemId.toLowerCase())) {
                    const filePath = `${pendingDir}/${file}`;
                    const content = await this.fs.readFile(filePath, 'utf8');
                    
                    // Parse the approval request
                    const approval = this.parseApprovalRequest(content, filePath);
                    approval.filePath = filePath;
                    approval.filename = file;
                    
                    return approval;
                }
            }
            
            // Try to find in cached pending approvals
            if (this.pendingApprovals.has(itemId)) {
                return this.pendingApprovals.get(itemId);
            }
            
            return null;
            
        } catch (error) {
            console.error("Error finding pending approval:", error);
            return null;
        }
    }
    
    /**
     * Parse approval request content
     */
    parseApprovalRequest(content, filePath) {
        const approval = {
            id: this.extractIdFromPath(filePath),
            filePath: filePath,
            content: content,
            timestamp: new Date().toISOString()
        };
        
        // Parse key fields from content
        const lines = content.split('\n');
        for (const line of lines) {
            const trimmed = line.trim();
            
            if (trimmed.includes('**Team**:')) {
                approval.team = trimmed.split(':')[1].trim();
            } else if (trimmed.includes('**Priority**:')) {
                approval.priority = trimmed.split(':')[1].trim();
            } else if (trimmed.includes('**Blocking**:')) {
                approval.blocking = trimmed.split(':')[1].trim().toLowerCase() === 'yes';
            } else if (trimmed.includes('## ') && trimmed.includes('Approval Request:')) {
                approval.title = trimmed.substring(trimmed.indexOf(':') + 1).trim();
                approval.item = approval.title; // Use title as item if not specified
            }
        }
        
        return approval;
    }
    
    /**
     * Save approval decision to file system
     */
    async saveApprovalDecision(response) {
        const filename = `APR-${this.getTimestamp()}_${this.sanitizeFilename(response.item)}_approved.md`;
        const filepath = `${this.projectPath}/communications/approvals/approved/${filename}`;
        
        const content = `# Approval Decision: APPROVED

**Item**: ${response.item}
**Team**: ${response.team}
**Decision Date**: ${new Date(response.timestamp).toLocaleString()}
**Approved By**: ${response.approvedBy}

## Decision
✅ **APPROVED** ${response.conditions ? 'with conditions' : ''}

${response.conditions ? `## Conditions
${response.conditions}

The team should proceed with the above conditions in mind.` : `## Notes
The team can proceed with implementation as proposed.`}

## Original Request
- **ID**: ${response.id}
- **Priority**: ${response.originalRequest.priority || 'Normal'}
- **Was Blocking**: ${response.originalRequest.blocking ? 'Yes' : 'No'}

---
*This approval has been processed and the relevant team has been notified.*`;

        await this.fs.writeFile(filepath, content);
        console.log(`📄 Approval saved: ${filepath}`);
        
        return filepath;
    }
    
    /**
     * Save rejection decision to file system
     */
    async saveRejectionDecision(response) {
        const filename = `APR-${this.getTimestamp()}_${this.sanitizeFilename(response.item)}_rejected.md`;
        const filepath = `${this.projectPath}/communications/approvals/rejected/${filename}`;
        
        const content = `# Approval Decision: REJECTED

**Item**: ${response.item}
**Team**: ${response.team}
**Decision Date**: ${new Date(response.timestamp).toLocaleString()}
**Rejected By**: ${response.rejectedBy}

## Decision
❌ **REJECTED**

## Reason for Rejection
${response.reason}

## Required Actions
The team must address the above concerns and resubmit for approval.

## Original Request
- **ID**: ${response.id}
- **Priority**: ${response.originalRequest.priority || 'Normal'}
- **Was Blocking**: ${response.originalRequest.blocking ? 'Yes' : 'No'}

---
*This rejection has been processed and the relevant team has been notified.*`;

        await this.fs.writeFile(filepath, content);
        console.log(`📄 Rejection saved: ${filepath}`);
        
        return filepath;
    }
    
    /**
     * Notify team of approval
     */
    async notifyTeam(teamName, response) {
        if (!teamName) {
            console.warn("⚠️ No team specified for notification");
            return;
        }
        
        const filename = `approval-notification-${this.getTimestamp()}.md`;
        const filepath = `${this.projectPath}/agents/workspaces/${this.getAgentId(teamName)}/inputs/${filename}`;
        
        const content = `# ✅ Approval Notification

**From**: Team Leader System
**To**: ${teamName}
**Date**: ${new Date().toLocaleString()}

## Approved Item
**${response.item}** has been APPROVED${response.conditions ? ' with conditions' : ''}!

${response.conditions ? `## Conditions to Follow
${response.conditions}

Please ensure these conditions are met during implementation.` : ''}

## Next Steps
1. Review this approval notification
2. ${response.conditions ? 'Implement according to the specified conditions' : 'Proceed with implementation as planned'}
3. Create handoff when complete
4. Update your status

## Quick Reference
- Original Request ID: ${response.id}
- Approval Time: ${new Date(response.timestamp).toLocaleTimeString()}
- Decision: ${response.decision}

---
*You may now proceed with the approved work.*`;

        try {
            // Ensure directory exists
            await this.ensureDirectory(`${this.projectPath}/agents/workspaces/${this.getAgentId(teamName)}/inputs`);
            await this.fs.writeFile(filepath, content);
            console.log(`📧 Team notified: ${teamName}`);
        } catch (error) {
            console.error(`Failed to notify team ${teamName}:`, error);
        }
    }
    
    /**
     * Notify team of rejection
     */
    async notifyTeamOfRejection(teamName, response) {
        if (!teamName) {
            console.warn("⚠️ No team specified for notification");
            return;
        }
        
        const filename = `rejection-notification-${this.getTimestamp()}.md`;
        const filepath = `${this.projectPath}/agents/workspaces/${this.getAgentId(teamName)}/inputs/${filename}`;
        
        const content = `# ❌ Rejection Notification

**From**: Team Leader System
**To**: ${teamName}
**Date**: ${new Date().toLocaleString()}

## Rejected Item
**${response.item}** has been REJECTED and requires revision.

## Reason for Rejection
${response.reason}

## Required Actions
1. Review the rejection reason carefully
2. Address all concerns mentioned
3. Revise your work accordingly
4. Resubmit for approval when ready

## Tips for Resubmission
- Ensure all rejection points are addressed
- Document what changes were made
- Consider requesting clarification if needed
- Update your approach based on feedback

## Quick Reference
- Original Request ID: ${response.id}
- Rejection Time: ${new Date(response.timestamp).toLocaleTimeString()}
- Priority: ${response.originalRequest.priority || 'Normal'}

---
*Please revise and resubmit for approval.*`;

        try {
            // Ensure directory exists
            await this.ensureDirectory(`${this.projectPath}/agents/workspaces/${this.getAgentId(teamName)}/inputs`);
            await this.fs.writeFile(filepath, content);
            console.log(`📧 Rejection notification sent to: ${teamName}`);
        } catch (error) {
            console.error(`Failed to notify team ${teamName}:`, error);
        }
    }
    
    /**
     * Update dashboard with decision
     */
    async updateDashboard(response) {
        if (!this.system.dashboard) {
            console.warn("⚠️ Dashboard not available");
            return;
        }
        
        try {
            // Remove from pending items
            await this.system.dashboard.removePendingItem('approval', response.id);
            
            // Add to activity log
            const activityMessage = response.decision === 'rejected' 
                ? `❌ Rejected: ${response.item} - ${response.reason}`
                : `✅ Approved: ${response.item}${response.conditions ? ' (with conditions)' : ''}`;
                
            await this.system.dashboard.addActivity(activityMessage);
            
            // Update metrics
            const metrics = await this.getApprovalMetrics();
            await this.system.dashboard.updateApprovalMetrics(metrics);
            
            console.log("📊 Dashboard updated");
        } catch (error) {
            console.error("Failed to update dashboard:", error);
        }
    }
    
    /**
     * Move processed approval to appropriate folder
     */
    async moveToProcessed(originalPath, decision) {
        try {
            const filename = originalPath.split('/').pop();
            const processedDir = `${this.projectPath}/communications/approvals/processed`;
            const newPath = `${processedDir}/${decision}_${filename}`;
            
            // Ensure processed directory exists
            await this.ensureDirectory(processedDir);
            
            // Read original file
            const content = await this.fs.readFile(originalPath, 'utf8');
            
            // Write to processed location
            await this.fs.writeFile(newPath, content);
            
            // Delete original
            await this.fs.unlink(originalPath);
            
            console.log(`📁 Moved to processed: ${newPath}`);
        } catch (error) {
            console.error("Failed to move processed approval:", error);
        }
    }
    
    /**
     * Add decision to history
     */
    addToHistory(response) {
        this.decisionHistory.push({
            timestamp: response.timestamp,
            item: response.item,
            team: response.team,
            decision: response.decision,
            reason: response.reason,
            conditions: response.conditions
        });
        
        // Keep only last 100 decisions in memory
        if (this.decisionHistory.length > 100) {
            this.decisionHistory.shift();
        }
    }
    
    /**
     * Get approval metrics
     */
    async getApprovalMetrics() {
        const metrics = {
            totalProcessed: this.decisionHistory.length,
            approved: 0,
            rejected: 0,
            conditional: 0,
            pendingCount: 0,
            averageResponseTime: 0
        };
        
        // Count decisions
        for (const decision of this.decisionHistory) {
            if (decision.decision === 'approved') metrics.approved++;
            else if (decision.decision === 'rejected') metrics.rejected++;
            else if (decision.decision === 'conditional') metrics.conditional++;
        }
        
        // Count pending
        try {
            const pendingDir = `${this.projectPath}/communications/approvals/pending`;
            const files = await this.fs.readdir(pendingDir);
            metrics.pendingCount = files.filter(f => f.endsWith('.md')).length;
        } catch (error) {
            console.error("Error counting pending approvals:", error);
        }
        
        return metrics;
    }
    
    /**
     * List all pending approvals
     */
    async listPendingApprovals() {
        const pendingDir = `${this.projectPath}/communications/approvals/pending`;
        const pending = [];
        
        try {
            const files = await this.fs.readdir(pendingDir);
            
            for (const file of files) {
                if (file.endsWith('.md')) {
                    const filePath = `${pendingDir}/${file}`;
                    const content = await this.fs.readFile(filePath, 'utf8');
                    const approval = this.parseApprovalRequest(content, filePath);
                    
                    pending.push({
                        id: approval.id,
                        item: approval.item || approval.title,
                        team: approval.team,
                        priority: approval.priority,
                        blocking: approval.blocking,
                        filename: file
                    });
                }
            }
            
            return pending;
            
        } catch (error) {
            console.error("Error listing pending approvals:", error);
            return [];
        }
    }
    
    /**
     * Provide feedback to a specific agent or team
     */
    async provideFeedback(target, message) {
        console.log(`\n💬 Sending feedback to: ${target}`);
        
        try {
            const filename = `feedback-${this.getTimestamp()}.md`;
            const agentId = this.getAgentId(target);
            const filepath = `${this.projectPath}/agents/workspaces/${agentId}/inputs/${filename}`;
            
            const content = `# 💬 Feedback from User

**To**: ${target}
**Date**: ${new Date().toLocaleString()}

## Feedback
${message}

## Context
This feedback was provided by the user regarding your recent work.

## Suggested Actions
- Review the feedback carefully
- Adjust your approach if needed
- Acknowledge receipt in your status update
- Apply learnings to future work

---
*This feedback has been logged and tracked.*`;

            await this.ensureDirectory(`${this.projectPath}/agents/workspaces/${agentId}/inputs`);
            await this.fs.writeFile(filepath, content);
            
            console.log(`✅ Feedback sent successfully`);
            
            // Add to history
            this.addToHistory({
                timestamp: new Date().toISOString(),
                type: 'feedback',
                target: target,
                message: message
            });
            
            return {
                success: true,
                target: target,
                agentId: agentId
            };
            
        } catch (error) {
            console.error("Error sending feedback:", error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    /**
     * Helper: Get timestamp for filenames
     */
    getTimestamp() {
        return new Date().toISOString().slice(0, 19).replace(/[-:]/g, '').replace('T', '-');
    }
    
    /**
     * Helper: Sanitize filename
     */
    sanitizeFilename(text) {
        return text.toLowerCase()
            .replace(/[^a-z0-9]/g, '-')
            .replace(/-+/g, '-')
            .substring(0, 50);
    }
    
    /**
     * Helper: Extract ID from filepath
     */
    extractIdFromPath(filepath) {
        const filename = filepath.split('/').pop();
        const match = filename.match(/APR-(\d{8}-\d{6})/);
        return match ? match[1] : filename.split('.')[0];
    }
    
    /**
     * Helper: Get agent ID from team name
     */
    getAgentId(teamName) {
        const mapping = {
            'requirements': 'senior-requirements-analyst',
            'requirements team': 'senior-requirements-analyst',
            'architecture': 'senior-architect',
            'architecture team': 'senior-architect',
            'database': 'senior-dba',
            'database team': 'senior-dba',
            'security': 'senior-security-engineer',
            'security team': 'senior-security-engineer',
            'design': 'senior-design-lead',
            'design team': 'senior-design-lead',
            'content': 'senior-content-strategist',
            'content team': 'senior-content-strategist',
            'development': 'senior-developer',
            'development team': 'senior-developer',
            'validation': 'senior-validator',
            'validation team': 'senior-validator'
        };
        
        const normalized = teamName.toLowerCase();
        return mapping[normalized] || `senior-${normalized.replace(/\s+/g, '-')}`;
    }
    
    /**
     * Helper: Ensure directory exists
     */
    async ensureDirectory(path) {
        try {
            await this.fs.mkdir(path, { recursive: true });
        } catch (error) {
            // Directory might already exist
        }
    }
    
    /**
     * Get decision history
     */
    getHistory(limit = 10) {
        return this.decisionHistory.slice(-limit).reverse();
    }
    
    /**
     * Clear decision history
     */
    clearHistory() {
        const count = this.decisionHistory.length;
        this.decisionHistory = [];
        console.log(`🗑️ Cleared ${count} decisions from history`);
        return count;
    }
}

// Export for use in Team Leader System
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UserInteractionProcessor;
}

// Make available globally in browser/Claude Code
if (typeof window !== 'undefined') {
    window.UserInteractionProcessor = UserInteractionProcessor;
}

// Usage example
console.log("✅ User Interaction Processor loaded!");
console.log("\nExample usage:");
console.log("const processor = new UserInteractionProcessor(teamLeaderSystem);");
console.log("await processor.approve('wireframes');");
console.log("await processor.reject('security-assessment', 'Missing OWASP compliance details');");
console.log("await processor.approve('database-schema', 'Add index on user_email column');");
console.log("await processor.provideFeedback('design-team', 'Great work on the wireframes!');");
