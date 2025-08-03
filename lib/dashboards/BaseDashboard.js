/**
 * BaseDashboard.js
 * Base dashboard functionality for Team Leader System v4.0
 * Extracted from DashboardGenerator.js to reduce file size and improve maintainability
 */

const fs = require('fs').promises;
const path = require('path');
const CommonUtils = require('../utils/CommonUtils');
const Logger = require('../utils/Logger');

class BaseDashboard {
    constructor(projectName, options = {}) {
        this.projectName = projectName;
        this.projectPath = projectName;
        this.dashboardPath = path.join(this.projectPath, 'project-status.html');
        this.dataPath = path.join(this.projectPath, '.teamleader/dashboard-data.json');
        this.updateInterval = options.updateInterval || 5000;
        this.version = options.version || '4.0';
        
        this.logger = new Logger().child({ component: 'BaseDashboard', project: projectName });
        
        // Data storage
        this.currentData = null;
        this.lastDataHash = '';
        
        // Update tracking
        this.updateTimer = null;
        this.isUpdating = false;
    }
    
    /**
     * Initialize dashboard
     */
    async initialize(projectConfig = {}) {
        try {
            this.logger.info('Initializing base dashboard...');
            
            // Ensure project directory exists
            await CommonUtils.ensureDirectory(this.projectPath);
            await CommonUtils.ensureDirectory(path.dirname(this.dataPath));
            
            // Create initial data
            const initialData = this.createInitialData(projectConfig);
            
            // Save initial data
            await this.saveData(initialData);
            
            // Generate dashboard
            await this.generateDashboard();
            
            this.logger.info('Base dashboard initialized successfully');
            return initialData;
        } catch (error) {
            this.logger.error('Failed to initialize base dashboard', error);
            throw error;
        }
    }
    
    /**
     * Create initial dashboard data
     */
    createInitialData(projectConfig) {
        return {
            projectName: this.projectName,
            version: this.version,
            startTime: new Date().toISOString(),
            lastUpdate: new Date().toISOString(),
            lastDataHash: '',
            config: projectConfig,
            
            // Core metrics
            progress: {
                overall: 0,
                byPhase: {
                    requirements: 0,
                    architecture: 0,
                    design: 0,
                    development: 0,
                    testing: 0
                }
            },
            
            // Team status
            teams: {},
            activeAgents: 0,
            
            // Pending items
            pendingItems: {
                approvals: [],
                handoffs: [],
                escalations: [],
                decisions: []
            },
            
            // Quality metrics
            quality: {
                testCoverage: null,
                securityScore: null,
                performance: null,
                efficiency: {
                    tokenRatio: 0,
                    costPerHour: 0,
                    estimatedSavings: 0
                }
            },
            
            // Notifications
            notifications: [],
            
            // Real-time indicators
            realtime: {
                lastActivity: new Date().toISOString(),
                activeProcesses: [],
                systemHealth: 'healthy'
            }
        };
    }
    
    /**
     * Generate the dashboard HTML
     */
    async generateDashboard() {
        const html = this.generateHTML();
        await this.saveDashboard(html);
        this.logger.debug('Dashboard HTML generated and saved');
    }
    
    /**
     * Generate HTML content (to be overridden by subclasses)
     */
    generateHTML() {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${this.projectName} - Dashboard v${this.version}</title>
    <style>
        ${this.generateStyles()}
    </style>
</head>
<body>
    <div id="dashboard-container">
        <h1>Dashboard Placeholder</h1>
        <p>Override generateHTML() in your dashboard class</p>
    </div>
    <script>
        ${this.generateClientScript()}
    </script>
</body>
</html>`;
    }
    
    /**
     * Generate CSS styles (to be overridden by subclasses)
     */
    generateStyles() {
        return `
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                margin: 0;
                padding: 20px;
                background-color: #f5f5f5;
            }
            #dashboard-container {
                max-width: 1200px;
                margin: 0 auto;
            }
        `;
    }
    
    /**
     * Generate client-side JavaScript (to be overridden by subclasses)
     */
    generateClientScript() {
        return `
            console.log('Dashboard loaded');
            
            // Auto-refresh every 30 seconds
            setInterval(() => {
                location.reload();
            }, 30000);
        `;
    }
    
    /**
     * Save dashboard HTML to file
     */
    async saveDashboard(html) {
        try {
            await fs.writeFile(this.dashboardPath, html, 'utf8');
        } catch (error) {
            this.logger.error('Failed to save dashboard HTML', error);
            throw error;
        }
    }
    
    /**
     * Save data to JSON file
     */
    async saveData(data) {
        try {
            await CommonUtils.writeJSON(this.dataPath, data);
            this.currentData = data;
        } catch (error) {
            this.logger.error('Failed to save dashboard data', error);
            throw error;
        }
    }
    
    /**
     * Update dashboard data
     */
    async updateData(updates) {
        try {
            const currentData = await this.loadData();
            const updatedData = CommonUtils.deepMerge(currentData, updates);
            
            // Add update timestamp
            updatedData.lastUpdate = new Date().toISOString();
            
            // Check if data has actually changed
            const newHash = CommonUtils.generateHash(updatedData);
            if (newHash === this.lastDataHash) {
                return false; // No changes
            }
            
            updatedData.lastDataHash = newHash;
            this.lastDataHash = newHash;
            
            await this.saveData(updatedData);
            
            // Trigger dashboard update if needed
            await this.triggerUpdate();
            
            return true; // Changes made
        } catch (error) {
            this.logger.error('Failed to update dashboard data', error);
            throw error;
        }
    }
    
    /**
     * Load data from JSON file
     */
    async loadData() {
        try {
            if (this.currentData) {
                return this.currentData;
            }
            
            const data = await CommonUtils.readJSON(this.dataPath, this.createInitialData());
            this.currentData = data;
            return data;
        } catch (error) {
            this.logger.error('Failed to load dashboard data', error);
            return this.createInitialData();
        }
    }
    
    /**
     * Trigger dashboard update
     */
    async triggerUpdate() {
        if (this.isUpdating) return;
        
        this.isUpdating = true;
        try {
            await this.generateDashboard();
        } finally {
            this.isUpdating = false;
        }
    }
    
    /**
     * Add pending item
     */
    async addPendingItem(type, item) {
        const data = await this.loadData();
        
        if (!data.pendingItems[type]) {
            data.pendingItems[type] = [];
        }
        
        const itemWithId = {
            id: CommonUtils.generateId(`${type}-`),
            timestamp: new Date().toISOString(),
            ...item
        };
        
        data.pendingItems[type].push(itemWithId);
        
        await this.updateData({ pendingItems: data.pendingItems });
        
        this.logger.info(`Added pending ${type} item`, { itemId: itemWithId.id });
        return itemWithId;
    }
    
    /**
     * Remove pending item
     */
    async removePendingItem(type, itemId) {
        const data = await this.loadData();
        
        if (data.pendingItems[type]) {
            data.pendingItems[type] = data.pendingItems[type].filter(
                item => item.id !== itemId
            );
            
            await this.updateData({ pendingItems: data.pendingItems });
            
            this.logger.info(`Removed pending ${type} item`, { itemId });
            return true;
        }
        
        return false;
    }
    
    /**
     * Update team status
     */
    async updateTeamStatus(teamId, status, name = null) {
        const data = await this.loadData();
        
        if (!data.teams[teamId]) {
            data.teams[teamId] = {};
        }
        
        data.teams[teamId] = {
            ...data.teams[teamId],
            status,
            name: name || data.teams[teamId].name || teamId,
            lastUpdate: new Date().toISOString()
        };
        
        await this.updateData({ teams: data.teams });
        
        this.logger.info(`Updated team status`, { teamId, status });
    }
    
    /**
     * Update progress
     */
    async updateProgress(phase, value) {
        const data = await this.loadData();
        
        if (phase === 'overall') {
            data.progress.overall = value;
        } else if (data.progress.byPhase[phase] !== undefined) {
            data.progress.byPhase[phase] = value;
        }
        
        await this.updateData({ progress: data.progress });
        
        this.logger.info(`Updated progress`, { phase, value });
    }
    
    /**
     * Add activity message
     */
    async addActivity(message, type = 'info') {
        const data = await this.loadData();
        
        const activity = {
            id: CommonUtils.generateId('activity-'),
            message,
            type,
            timestamp: new Date().toISOString()
        };
        
        // Add to notifications (keep last 50)
        data.notifications.unshift(activity);
        data.notifications = data.notifications.slice(0, 50);
        
        // Update real-time data
        data.realtime.lastActivity = activity.timestamp;
        
        await this.updateData({
            notifications: data.notifications,
            realtime: data.realtime
        });
        
        this.logger.info(`Added activity`, { message, type });
    }
    
    /**
     * Start auto-updates
     */
    startAutoUpdates() {
        if (this.updateTimer) {
            clearInterval(this.updateTimer);
        }
        
        this.updateTimer = setInterval(async () => {
            try {
                await this.triggerUpdate();
            } catch (error) {
                this.logger.error('Auto-update failed', error);
            }
        }, this.updateInterval);
        
        this.logger.info('Auto-updates started', { interval: this.updateInterval });
    }
    
    /**
     * Stop auto-updates
     */
    stopAutoUpdates() {
        if (this.updateTimer) {
            clearInterval(this.updateTimer);
            this.updateTimer = null;
            this.logger.info('Auto-updates stopped');
        }
    }
    
    /**
     * Get dashboard URL
     */
    getDashboardUrl() {
        return `file://${path.resolve(this.dashboardPath)}`;
    }
    
    /**
     * Clean up resources
     */
    async cleanup() {
        this.stopAutoUpdates();
        this.logger.info('Base dashboard cleaned up');
    }
}

module.exports = BaseDashboard; 