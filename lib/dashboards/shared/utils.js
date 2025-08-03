/**
 * utils.js
 * Shared dashboard utilities for Team Leader System
 * Provides common dashboard operations and data processing functions
 */

const CommonUtils = require('../../utils/CommonUtils');

class DashboardUtils {
    /**
     * Format currency for display
     */
    static formatCurrency(amount, currency = 'USD') {
        return CommonUtils.formatCurrency(amount, currency);
    }
    
    /**
     * Format percentage for display
     */
    static formatPercentage(value, decimals = 1) {
        return CommonUtils.formatPercentage(value, decimals);
    }
    
    /**
     * Format file size for display
     */
    static formatFileSize(bytes) {
        return CommonUtils.formatFileSize(bytes);
    }
    
    /**
     * Format duration for display
     */
    static formatDuration(ms) {
        return CommonUtils.formatDuration(ms);
    }
    
    /**
     * Calculate percentage change
     */
    static calculatePercentageChange(oldValue, newValue) {
        if (oldValue === 0) return newValue > 0 ? 100 : 0;
        return ((newValue - oldValue) / oldValue) * 100;
    }
    
    /**
     * Calculate trend direction
     */
    static getTrendDirection(values) {
        if (values.length < 2) return 'stable';
        
        const recent = values.slice(-3);
        const older = values.slice(-6, -3);
        
        if (recent.length === 0 || older.length === 0) return 'stable';
        
        const recentAvg = CommonUtils.calculateAverage(recent);
        const olderAvg = CommonUtils.calculateAverage(older);
        
        const change = this.calculatePercentageChange(olderAvg, recentAvg);
        
        if (change > 5) return 'increasing';
        if (change < -5) return 'decreasing';
        return 'stable';
    }
    
    /**
     * Generate color based on value and thresholds
     */
    static getColorByValue(value, thresholds = {}) {
        const { warning = 70, critical = 90 } = thresholds;
        
        if (value >= critical) return '#f44336'; // Red
        if (value >= warning) return '#FF9800';  // Orange
        return '#4CAF50'; // Green
    }
    
    /**
     * Generate color based on status
     */
    static getColorByStatus(status) {
        const colors = {
            healthy: '#4CAF50',
            warning: '#FF9800',
            critical: '#f44336',
            offline: '#9e9e9e',
            active: '#4CAF50',
            idle: '#FF9800',
            busy: '#2196F3',
            error: '#f44336'
        };
        
        return colors[status] || '#9e9e9e';
    }
    
    /**
     * Format timestamp for display
     */
    static formatTimestamp(timestamp, format = 'relative') {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        
        switch (format) {
            case 'relative':
                if (diff < 60000) return 'Just now';
                if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
                if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
                return `${Math.floor(diff / 86400000)}d ago`;
            case 'time':
                return date.toLocaleTimeString();
            case 'date':
                return date.toLocaleDateString();
            case 'datetime':
                return date.toLocaleString();
            default:
                return date.toLocaleString();
        }
    }
    
    /**
     * Generate unique ID for dashboard elements
     */
    static generateId(prefix = 'dashboard') {
        return CommonUtils.generateId(prefix);
    }
    
    /**
     * Deep merge objects for dashboard data
     */
    static deepMerge(target, source) {
        return CommonUtils.deepMerge(target, source);
    }
    
    /**
     * Validate dashboard configuration
     */
    static validateDashboardConfig(config) {
        const errors = [];
        
        if (!config.projectName) {
            errors.push('Project name is required');
        }
        
        if (!config.version) {
            errors.push('Version is required');
        }
        
        if (config.updateInterval && (typeof config.updateInterval !== 'number' || config.updateInterval < 1000)) {
            errors.push('Update interval must be a number >= 1000ms');
        }
        
        return {
            valid: errors.length === 0,
            errors
        };
    }
}

module.exports = DashboardUtils; 