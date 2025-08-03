/**
 * CommonUtils.js
 * Shared utility functions for Team Leader System v4.0
 * Provides common functionality used across multiple modules
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class CommonUtils {
    /**
     * Generate a unique ID
     */
    static generateId(prefix = '') {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substr(2, 9);
        return `${prefix}${timestamp}-${random}`;
    }
    
    /**
     * Format currency amount
     */
    static formatCurrency(amount, currency = 'USD') {
        if (typeof amount !== 'number') {
            amount = parseFloat(amount) || 0;
        }
        
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency
        }).format(amount);
    }
    
    /**
     * Format percentage
     */
    static formatPercentage(value, decimals = 1) {
        if (typeof value !== 'number') {
            value = parseFloat(value) || 0;
        }
        
        return `${(value * 100).toFixed(decimals)}%`;
    }
    
    /**
     * Format file size
     */
    static formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    /**
     * Deep merge objects
     */
    static deepMerge(target, source) {
        const result = { ...target };
        
        for (const key in source) {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                result[key] = this.deepMerge(result[key] || {}, source[key]);
            } else {
                result[key] = source[key];
            }
        }
        
        return result;
    }
    
    /**
     * Deep clone object
     */
    static deepClone(obj) {
        if (obj === null || typeof obj !== 'object') {
            return obj;
        }
        
        if (obj instanceof Date) {
            return new Date(obj.getTime());
        }
        
        if (obj instanceof Array) {
            return obj.map(item => this.deepClone(item));
        }
        
        if (typeof obj === 'object') {
            const cloned = {};
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    cloned[key] = this.deepClone(obj[key]);
                }
            }
            return cloned;
        }
    }
    
    /**
     * Calculate percentage
     */
    static calculatePercentage(part, total) {
        if (total === 0) return 0;
        return (part / total) * 100;
    }
    
    /**
     * Calculate average
     */
    static calculateAverage(values) {
        if (!Array.isArray(values) || values.length === 0) return 0;
        return values.reduce((sum, val) => sum + val, 0) / values.length;
    }
    
    /**
     * Calculate median
     */
    static calculateMedian(values) {
        if (!Array.isArray(values) || values.length === 0) return 0;
        
        const sorted = [...values].sort((a, b) => a - b);
        const middle = Math.floor(sorted.length / 2);
        
        if (sorted.length % 2 === 0) {
            return (sorted[middle - 1] + sorted[middle]) / 2;
        }
        
        return sorted[middle];
    }
    
    /**
     * Generate hash for content
     */
    static generateHash(content, algorithm = 'md5') {
        return crypto.createHash(algorithm).update(JSON.stringify(content)).digest('hex');
    }
    
    /**
     * Sleep for specified milliseconds
     */
    static sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    /**
     * Retry function with exponential backoff
     */
    static async retry(fn, maxRetries = 3, initialDelay = 1000) {
        let lastError;
        
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                return await fn();
            } catch (error) {
                lastError = error;
                
                if (attempt === maxRetries) {
                    throw error;
                }
                
                const delay = initialDelay * Math.pow(2, attempt);
                await this.sleep(delay);
            }
        }
        
        throw lastError;
    }
    
    /**
     * Debounce function
     */
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    /**
     * Throttle function
     */
    static throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
    
    /**
     * Validate email format
     */
    static isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    
    /**
     * Validate URL format
     */
    static isValidUrl(url) {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }
    
    /**
     * Sanitize filename
     */
    static sanitizeFilename(filename) {
        return filename
            .replace(/[^a-z0-9]/gi, '_')
            .replace(/_+/g, '_')
            .replace(/^_|_$/g, '')
            .toLowerCase();
    }
    
    /**
     * Ensure directory exists
     */
    static async ensureDirectory(dirPath) {
        try {
            await fs.access(dirPath);
        } catch {
            await fs.mkdir(dirPath, { recursive: true });
        }
    }
    
    /**
     * Read JSON file safely
     */
    static async readJSON(filePath, defaultValue = {}) {
        try {
            const data = await fs.readFile(filePath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            return defaultValue;
        }
    }
    
    /**
     * Write JSON file safely
     */
    static async writeJSON(filePath, data) {
        try {
            await this.ensureDirectory(path.dirname(filePath));
            await fs.writeFile(filePath, JSON.stringify(data, null, 2));
            return true;
        } catch (error) {
            throw new Error(`Failed to write JSON file: ${error.message}`);
        }
    }
    
    /**
     * Get file extension
     */
    static getFileExtension(filename) {
        return path.extname(filename).toLowerCase();
    }
    
    /**
     * Get file name without extension
     */
    static getFileNameWithoutExtension(filename) {
        return path.basename(filename, path.extname(filename));
    }
    
    /**
     * Check if file exists
     */
    static async fileExists(filePath) {
        try {
            await fs.access(filePath);
            return true;
        } catch {
            return false;
        }
    }
    
    /**
     * Get file size
     */
    static async getFileSize(filePath) {
        try {
            const stats = await fs.stat(filePath);
            return stats.size;
        } catch {
            return 0;
        }
    }
    
    /**
     * Format duration in milliseconds to human readable
     */
    static formatDuration(ms) {
        if (ms < 1000) return `${ms}ms`;
        if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
        if (ms < 3600000) return `${(ms / 60000).toFixed(1)}m`;
        return `${(ms / 3600000).toFixed(1)}h`;
    }
    
    /**
     * Parse duration string to milliseconds
     */
    static parseDuration(duration) {
        const units = {
            ms: 1,
            s: 1000,
            m: 60000,
            h: 3600000,
            d: 86400000
        };
        
        const match = duration.match(/^(\d+(?:\.\d+)?)\s*([mshd])$/);
        if (!match) return 0;
        
        const [, value, unit] = match;
        return parseFloat(value) * units[unit];
    }
    
    /**
     * Generate random string
     */
    static randomString(length = 8, charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789') {
        let result = '';
        for (let i = 0; i < length; i++) {
            result += charset.charAt(Math.floor(Math.random() * charset.length));
        }
        return result;
    }
    
    /**
     * Capitalize first letter
     */
    static capitalize(str) {
        if (!str) return str;
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
    
    /**
     * Convert to camelCase
     */
    static toCamelCase(str) {
        return str
            .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => {
                return index === 0 ? word.toLowerCase() : word.toUpperCase();
            })
            .replace(/\s+/g, '');
    }
    
    /**
     * Convert to kebab-case
     */
    static toKebabCase(str) {
        return str
            .replace(/([a-z])([A-Z])/g, '$1-$2')
            .replace(/[\s_]+/g, '-')
            .toLowerCase();
    }
    
    /**
     * Truncate string
     */
    static truncate(str, length = 50, suffix = '...') {
        if (str.length <= length) return str;
        return str.substring(0, length - suffix.length) + suffix;
    }
}

module.exports = CommonUtils; 