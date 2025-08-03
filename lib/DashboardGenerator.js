/**
 * Enhanced Dashboard Generator with Real-Time Updates
 * Team Leader System v4.0 - REFACTORED
 * Now uses modular dashboard architecture
 */

const ProjectDashboard = require('./dashboards/ProjectDashboard');
const Logger = require('./utils/Logger');

class EnhancedDashboardGenerator {
    constructor(projectName, options = {}) {
        this.projectName = projectName;
        this.logger = new Logger().child({ component: 'DashboardGenerator', project: projectName });
        
        // Use the new modular ProjectDashboard
        this.dashboard = new ProjectDashboard(projectName, {
            showCosts: options.showCosts !== false,
            showPerformance: options.showPerformance !== false,
            showQuality: options.showQuality !== false,
            showTeams: options.showTeams !== false,
            updateInterval: options.updateInterval || 5000,
            version: options.version || '4.0'
        });
    }
    
    /**
     * Initialize dashboard with enhanced features
     */
    async initializeDashboard(projectConfig) {
        try {
            this.logger.info('Initializing enhanced dashboard...');
            
            // Initialize the modular dashboard
            const initialData = await this.dashboard.initialize(projectConfig);
            
            // Start auto-updates
            this.dashboard.startAutoUpdates();
            
            this.logger.info('Enhanced dashboard initialized successfully');
            return initialData;
        } catch (error) {
            this.logger.error('Failed to initialize enhanced dashboard', error);
            throw error;
        }
    }
    
    /**
     * Generate the enhanced HTML dashboard
     */
    async generateEnhancedDashboard() {
        try {
            this.logger.debug('Generating enhanced dashboard HTML');
            await this.dashboard.generateDashboard();
            this.logger.debug('Enhanced dashboard HTML generated successfully');
        } catch (error) {
            this.logger.error('Failed to generate enhanced dashboard', error);
            throw error;
        }
    }
    
    /**
     * Update dashboard data
     */
    async updateData(updates) {
        try {
            const updated = await this.dashboard.updateData(updates);
            if (updated) {
                this.logger.debug('Dashboard data updated', { updates: Object.keys(updates) });
            }
            return updated;
        } catch (error) {
            this.logger.error('Failed to update dashboard data', error);
            throw error;
        }
    }
    
    /**
     * Add pending item
     */
    async addPendingItem(type, item) {
        try {
            const result = await this.dashboard.addPendingItem(type, item);
            this.logger.info(`Added pending ${type} item`, { itemId: result.id });
            return result;
        } catch (error) {
            this.logger.error('Failed to add pending item', error);
            throw error;
        }
    }
    
    /**
     * Remove pending item
     */
    async removePendingItem(type, itemId) {
        try {
            const result = await this.dashboard.removePendingItem(type, itemId);
            this.logger.info(`Removed pending ${type} item`, { itemId });
            return result;
        } catch (error) {
            this.logger.error('Failed to remove pending item', error);
            throw error;
        }
    }
    
    /**
     * Update team status
     */
    async updateTeamStatus(teamId, status, name = null) {
        try {
            await this.dashboard.updateTeamStatus(teamId, status, name);
            this.logger.info(`Updated team status`, { teamId, status });
        } catch (error) {
            this.logger.error('Failed to update team status', error);
            throw error;
        }
    }
    
    /**
     * Update progress
     */
    async updateProgress(phase, value) {
        try {
            await this.dashboard.updateProgress(phase, value);
            this.logger.info(`Updated progress`, { phase, value });
        } catch (error) {
            this.logger.error('Failed to update progress', error);
            throw error;
        }
    }
    
    /**
     * Add activity message
     */
    async addActivity(message, type = 'info') {
        try {
            await this.dashboard.addActivity(message, type);
            this.logger.info(`Added activity`, { message, type });
        } catch (error) {
            this.logger.error('Failed to add activity', error);
            throw error;
        }
    }
    
    /**
     * Update project metrics
     */
    async updateProjectMetrics(metrics) {
        try {
            await this.dashboard.updateProjectMetrics(metrics);
            this.logger.info('Updated project metrics', { metrics: Object.keys(metrics) });
        } catch (error) {
            this.logger.error('Failed to update project metrics', error);
            throw error;
        }
    }
    
    /**
     * Get dashboard URL
     */
    getDashboardUrl() {
        return this.dashboard.getDashboardUrl();
    }
    
    /**
     * Get dashboard data
     */
    async getDashboardData() {
        try {
            return await this.dashboard.loadData();
        } catch (error) {
            this.logger.error('Failed to get dashboard data', error);
            throw error;
        }
    }
    
    /**
     * Start auto-updates
     */
    startAutoUpdates() {
        this.dashboard.startAutoUpdates();
        this.logger.info('Auto-updates started');
    }
    
    /**
     * Stop auto-updates
     */
    stopAutoUpdates() {
        this.dashboard.stopAutoUpdates();
        this.logger.info('Auto-updates stopped');
    }
    
    /**
     * Clean up resources
     */
    async cleanup() {
        try {
            await this.dashboard.cleanup();
            this.logger.info('Dashboard generator cleaned up');
        } catch (error) {
            this.logger.error('Failed to cleanup dashboard generator', error);
            throw error;
        }
    }
    
    /**
     * Legacy method for backward compatibility
     */
    async saveData(data) {
        this.logger.warn('saveData() is deprecated, use updateData() instead');
        return this.updateData(data);
    }
    
    /**
     * Legacy method for backward compatibility
     */
    async loadData() {
        this.logger.warn('loadData() is deprecated, use getDashboardData() instead');
        return this.getDashboardData();
    }
    
    /**
     * Legacy method for backward compatibility
     */
    async saveDashboard(html) {
        this.logger.warn('saveDashboard() is deprecated, use generateEnhancedDashboard() instead');
        return this.generateEnhancedDashboard();
    }
}

module.exports = EnhancedDashboardGenerator;
