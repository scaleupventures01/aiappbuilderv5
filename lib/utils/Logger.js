/**
 * Logger.js
 * Structured logging system for Team Leader System v4.0
 * Replaces scattered console.log statements with consistent, configurable logging
 */

const fs = require('fs').promises;
const path = require('path');

class Logger {
    constructor(options = {}) {
        this.level = options.level || 'info'; // debug, info, warn, error
        this.enableConsole = options.enableConsole !== false;
        this.enableFile = options.enableFile || false;
        this.logDir = options.logDir || 'logs';
        this.maxFileSize = options.maxFileSize || 10 * 1024 * 1024; // 10MB
        this.maxFiles = options.maxFiles || 5;
        
        this.levels = {
            debug: 0,
            info: 1,
            warn: 2,
            error: 3
        };
        
        this.colors = {
            debug: '\x1b[36m', // Cyan
            info: '\x1b[32m',  // Green
            warn: '\x1b[33m',  // Yellow
            error: '\x1b[31m', // Red
            reset: '\x1b[0m'   // Reset
        };
        
        this.initializeLogDirectory();
    }
    
    /**
     * Initialize log directory
     */
    async initializeLogDirectory() {
        if (this.enableFile) {
            try {
                await fs.mkdir(this.logDir, { recursive: true });
            } catch (error) {
                console.warn(`Failed to create log directory: ${error.message}`);
                this.enableFile = false;
            }
        }
    }
    
    /**
     * Log debug message
     */
    debug(message, context = {}) {
        this.log('debug', message, context);
    }
    
    /**
     * Log info message
     */
    info(message, context = {}) {
        this.log('info', message, context);
    }
    
    /**
     * Log warning message
     */
    warn(message, context = {}) {
        this.log('warn', message, context);
    }
    
    /**
     * Log error message
     */
    error(message, error = null, context = {}) {
        if (error) {
            context.error = {
                name: error.name,
                message: error.message,
                stack: error.stack
            };
        }
        this.log('error', message, context);
    }
    
    /**
     * Core logging method
     */
    log(level, message, context = {}) {
        // Check if we should log this level
        if (this.levels[level] < this.levels[this.level]) {
            return;
        }
        
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            level: level.toUpperCase(),
            message,
            context,
            pid: process.pid
        };
        
        // Console output
        if (this.enableConsole) {
            this.writeToConsole(level, logEntry);
        }
        
        // File output
        if (this.enableFile) {
            this.writeToFile(logEntry);
        }
    }
    
    /**
     * Write to console with colors
     */
    writeToConsole(level, logEntry) {
        const color = this.colors[level];
        const reset = this.colors.reset;
        const time = logEntry.timestamp.split('T')[1].split('.')[0];
        
        let output = `${color}[${time}] ${level.toUpperCase()}:${reset} ${logEntry.message}`;
        
        // Add context if present
        if (Object.keys(logEntry.context).length > 0) {
            output += ` ${JSON.stringify(logEntry.context)}`;
        }
        
        console.log(output);
    }
    
    /**
     * Write to log file
     */
    async writeToFile(logEntry) {
        try {
            const date = new Date().toISOString().split('T')[0];
            const logFile = path.join(this.logDir, `teamleader-${date}.log`);
            
            const logLine = JSON.stringify(logEntry) + '\n';
            
            await fs.appendFile(logFile, logLine);
            
            // Check file size and rotate if needed
            await this.rotateLogFile(logFile);
        } catch (error) {
            console.error(`Failed to write to log file: ${error.message}`);
        }
    }
    
    /**
     * Rotate log file if it exceeds max size
     */
    async rotateLogFile(logFile) {
        try {
            const stats = await fs.stat(logFile);
            
            if (stats.size > this.maxFileSize) {
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                const rotatedFile = `${logFile}.${timestamp}`;
                
                await fs.rename(logFile, rotatedFile);
                
                // Clean up old log files
                await this.cleanupOldLogs();
            }
        } catch (error) {
            // File doesn't exist or other error, ignore
        }
    }
    
    /**
     * Clean up old log files
     */
    async cleanupOldLogs() {
        try {
            const files = await fs.readdir(this.logDir);
            const logFiles = files
                .filter(file => file.startsWith('teamleader-') && file.endsWith('.log'))
                .map(file => ({
                    name: file,
                    path: path.join(this.logDir, file),
                    time: fs.stat(path.join(this.logDir, file)).then(stats => stats.mtime)
                }));
            
            // Sort by modification time (oldest first)
            const sortedFiles = await Promise.all(
                logFiles.map(async file => ({
                    ...file,
                    time: await file.time
                }))
            );
            
            sortedFiles.sort((a, b) => a.time - b.time);
            
            // Remove oldest files if we have too many
            if (sortedFiles.length > this.maxFiles) {
                const filesToRemove = sortedFiles.slice(0, sortedFiles.length - this.maxFiles);
                
                for (const file of filesToRemove) {
                    try {
                        await fs.unlink(file.path);
                    } catch (error) {
                        // Ignore deletion errors
                    }
                }
            }
        } catch (error) {
            // Ignore cleanup errors
        }
    }
    
    /**
     * Create a child logger with additional context
     */
    child(context = {}) {
        const childLogger = new Logger({
            level: this.level,
            enableConsole: this.enableConsole,
            enableFile: this.enableFile,
            logDir: this.logDir,
            maxFileSize: this.maxFileSize,
            maxFiles: this.maxFiles
        });
        
        // Override log method to include parent context
        const originalLog = childLogger.log.bind(childLogger);
        childLogger.log = (level, message, childContext = {}) => {
            const mergedContext = { ...context, ...childContext };
            originalLog(level, message, mergedContext);
        };
        
        return childLogger;
    }
    
    /**
     * Set log level
     */
    setLevel(level) {
        if (this.levels.hasOwnProperty(level)) {
            this.level = level;
        } else {
            this.warn(`Invalid log level: ${level}`);
        }
    }
    
    /**
     * Enable/disable console logging
     */
    setConsoleLogging(enabled) {
        this.enableConsole = enabled;
    }
    
    /**
     * Enable/disable file logging
     */
    setFileLogging(enabled) {
        this.enableFile = enabled;
        if (enabled) {
            this.initializeLogDirectory();
        }
    }
}

// Create default logger instance
const defaultLogger = new Logger({
    level: process.env.LOG_LEVEL || 'info',
    enableConsole: true,
    enableFile: process.env.LOG_TO_FILE === 'true'
});

// Export both the class and default instance
module.exports = Logger;
module.exports.default = defaultLogger;

// Convenience methods
module.exports.debug = (message, context) => defaultLogger.debug(message, context);
module.exports.info = (message, context) => defaultLogger.info(message, context);
module.exports.warn = (message, context) => defaultLogger.warn(message, context);
module.exports.error = (message, error, context) => defaultLogger.error(message, error, context); 