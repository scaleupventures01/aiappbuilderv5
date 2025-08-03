/**
 * WebhookManager.js
 * External system notifications and event-driven architecture
 * Provides webhook authentication, security, and custom endpoints
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const https = require('https');
const http = require('http');

class WebhookManager {
    constructor(projectName = 'default-project') {
        this.projectName = projectName;
        this.projectPath = projectName;
        this.webhookPath = path.join(this.projectPath, 'webhooks');
        
        // Webhook configurations
        this.webhooks = new Map();
        this.endpoints = new Map();
        this.eventQueue = [];
        
        // Security settings
        this.security = {
            enabled: true,
            secretKey: this.generateSecretKey(),
            signatureHeader: 'X-Webhook-Signature',
            timeout: 30000, // 30 seconds
            maxRetries: 3,
            rateLimit: {
                enabled: true,
                maxRequests: 100,
                windowMs: 60000 // 1 minute
            }
        };
        
        // Authentication methods
        this.authMethods = {
            signature: this.verifySignature.bind(this),
            token: this.verifyToken.bind(this),
            basic: this.verifyBasicAuth.bind(this)
        };
        
        // Event types
        this.eventTypes = {
            system: ['startup', 'shutdown', 'error', 'warning'],
            agent: ['created', 'updated', 'deleted', 'task_assigned', 'task_completed'],
            budget: ['threshold_reached', 'allocation_changed', 'spending_alert'],
            performance: ['benchmark_completed', 'metrics_updated', 'alert_triggered'],
            quality: ['gate_passed', 'gate_failed', 'review_required'],
            cost: ['prediction_updated', 'optimization_completed', 'budget_exceeded']
        };
        
        // Rate limiting
        this.rateLimitStore = new Map();
        
        // Retry mechanism
        this.retryQueue = [];
        this.retryInterval = null;
        
        // Bind methods
        this.initialize = this.initialize.bind(this);
        this.registerWebhook = this.registerWebhook.bind(this);
        this.unregisterWebhook = this.unregisterWebhook.bind(this);
        this.triggerWebhook = this.triggerWebhook.bind(this);
        this.createEndpoint = this.createEndpoint.bind(this);
        this.verifyWebhook = this.verifyWebhook.bind(this);
        this.getWebhookStatus = this.getWebhookStatus.bind(this);
        this.getEventHistory = this.getEventHistory.bind(this);
        this.exportWebhookData = this.exportWebhookData.bind(this);
    }
    
    /**
     * Initialize the webhook manager
     */
    async initialize() {
        try {
            console.log('🔗 Initializing Webhook Manager...');
            
            // Create webhook directory structure
            await this.createWebhookStructure();
            
            // Load existing webhook configurations
            await this.loadWebhookConfigs();
            
            // Initialize retry mechanism
            await this.initializeRetryMechanism();
            
            // Start rate limit cleanup
            this.startRateLimitCleanup();
            
            console.log('✅ Webhook Manager initialized');
            return true;
        } catch (error) {
            console.error('❌ Failed to initialize Webhook Manager:', error);
            return false;
        }
    }
    
    /**
     * Create webhook directory structure
     */
    async createWebhookStructure() {
        const directories = [
            this.webhookPath,
            path.join(this.webhookPath, 'configs'),
            path.join(this.webhookPath, 'logs'),
            path.join(this.webhookPath, 'endpoints'),
            path.join(this.webhookPath, 'events'),
            path.join(this.webhookPath, 'security')
        ];
        
        for (const dir of directories) {
            try {
                await fs.mkdir(dir, { recursive: true });
            } catch (error) {
                // Directory might already exist
            }
        }
    }
    
    /**
     * Load existing webhook configurations
     */
    async loadWebhookConfigs() {
        try {
            const configPath = path.join(this.webhookPath, 'configs');
            const files = await fs.readdir(configPath);
            
            for (const file of files) {
                if (file.endsWith('.json')) {
                    const data = await fs.readFile(path.join(configPath, file), 'utf8');
                    const config = JSON.parse(data);
                    
                    this.webhooks.set(config.id, config);
                    
                    if (config.type === 'endpoint') {
                        this.endpoints.set(config.id, config);
                    }
                }
            }
            
            console.log(`🔗 Loaded ${this.webhooks.size} webhook configurations`);
        } catch (error) {
            console.log('🔗 No existing webhook configurations found');
        }
    }
    
    /**
     * Register a new webhook
     */
    async registerWebhook(config) {
        try {
            const webhook = {
                id: config.id || `webhook_${Date.now()}`,
                name: config.name,
                url: config.url,
                type: config.type || 'outgoing',
                events: config.events || [],
                method: config.method || 'POST',
                headers: config.headers || {},
                auth: config.auth || { type: 'none' },
                enabled: config.enabled !== false,
                createdAt: Date.now(),
                lastTriggered: null,
                successCount: 0,
                failureCount: 0
            };
            
            // Validate webhook configuration
            await this.validateWebhookConfig(webhook);
            
            // Store webhook
            this.webhooks.set(webhook.id, webhook);
            
            // Save configuration
            await this.saveWebhookConfig(webhook);
            
            console.log(`🔗 Registered webhook: ${webhook.name} (${webhook.id})`);
            return webhook;
        } catch (error) {
            console.error('Failed to register webhook:', error);
            return null;
        }
    }
    
    /**
     * Unregister a webhook
     */
    async unregisterWebhook(webhookId) {
        try {
            const webhook = this.webhooks.get(webhookId);
            if (!webhook) {
                throw new Error(`Webhook ${webhookId} not found`);
            }
            
            // Remove from storage
            this.webhooks.delete(webhookId);
            
            if (webhook.type === 'endpoint') {
                this.endpoints.delete(webhookId);
            }
            
            // Remove configuration file
            const configPath = path.join(this.webhookPath, 'configs', `${webhookId}.json`);
            try {
                await fs.unlink(configPath);
            } catch (error) {
                // File might not exist
            }
            
            console.log(`🔗 Unregistered webhook: ${webhook.name} (${webhookId})`);
            return true;
        } catch (error) {
            console.error('Failed to unregister webhook:', error);
            return false;
        }
    }
    
    /**
     * Trigger a webhook
     */
    async triggerWebhook(webhookId, eventData, options = {}) {
        try {
            const webhook = this.webhooks.get(webhookId);
            if (!webhook) {
                throw new Error(`Webhook ${webhookId} not found`);
            }
            
            if (!webhook.enabled) {
                console.log(`🔗 Webhook ${webhookId} is disabled`);
                return false;
            }
            
            // Check rate limiting
            if (this.security.rateLimit.enabled && !this.checkRateLimit(webhookId)) {
                console.log(`🔗 Rate limit exceeded for webhook ${webhookId}`);
                return false;
            }
            
            // Prepare payload
            const payload = this.prepareWebhookPayload(webhook, eventData);
            
            // Add authentication
            if (webhook.auth.type !== 'none') {
                this.addAuthentication(webhook, payload);
            }
            
            // Send webhook
            const result = await this.sendWebhook(webhook, payload, options);
            
            // Update webhook statistics
            this.updateWebhookStats(webhook, result.success);
            
            // Log event
            await this.logWebhookEvent(webhook, eventData, result);
            
            return result.success;
        } catch (error) {
            console.error(`Failed to trigger webhook ${webhookId}:`, error);
            
            // Add to retry queue if retries are enabled
            if (options.retry !== false) {
                this.addToRetryQueue(webhookId, eventData, options);
            }
            
            return false;
        }
    }
    
    /**
     * Create a custom webhook endpoint
     */
    async createEndpoint(config) {
        try {
            const endpoint = {
                id: config.id || `endpoint_${Date.now()}`,
                name: config.name,
                path: config.path,
                method: config.method || 'POST',
                type: 'endpoint',
                auth: config.auth || { type: 'none' },
                validation: config.validation || {},
                handler: config.handler,
                enabled: config.enabled !== false,
                createdAt: Date.now(),
                requestCount: 0,
                lastRequest: null
            };
            
            // Validate endpoint configuration
            await this.validateEndpointConfig(endpoint);
            
            // Store endpoint
            this.endpoints.set(endpoint.id, endpoint);
            this.webhooks.set(endpoint.id, endpoint);
            
            // Save configuration
            await this.saveWebhookConfig(endpoint);
            
            console.log(`🔗 Created endpoint: ${endpoint.name} (${endpoint.path})`);
            return endpoint;
        } catch (error) {
            console.error('Failed to create endpoint:', error);
            return null;
        }
    }
    
    /**
     * Verify incoming webhook
     */
    async verifyWebhook(request, webhookId) {
        try {
            const webhook = this.webhooks.get(webhookId);
            if (!webhook) {
                return { valid: false, error: 'Webhook not found' };
            }
            
            // Check authentication
            if (webhook.auth.type !== 'none') {
                const authResult = await this.authMethods[webhook.auth.type](request, webhook);
                if (!authResult.valid) {
                    return authResult;
                }
            }
            
            // Validate payload
            const validationResult = await this.validatePayload(request, webhook);
            if (!validationResult.valid) {
                return validationResult;
            }
            
            return { valid: true, data: request.body };
        } catch (error) {
            console.error('Failed to verify webhook:', error);
            return { valid: false, error: error.message };
        }
    }
    
    /**
     * Get webhook status
     */
    getWebhookStatus(webhookId = null) {
        try {
            if (webhookId) {
                const webhook = this.webhooks.get(webhookId);
                if (!webhook) {
                    return null;
                }
                
                return {
                    id: webhook.id,
                    name: webhook.name,
                    type: webhook.type,
                    enabled: webhook.enabled,
                    lastTriggered: webhook.lastTriggered,
                    successCount: webhook.successCount,
                    failureCount: webhook.failureCount,
                    successRate: webhook.successCount + webhook.failureCount > 0 ? 
                        (webhook.successCount / (webhook.successCount + webhook.failureCount)) * 100 : 0
                };
            }
            
            // Return status for all webhooks
            const status = {
                total: this.webhooks.size,
                enabled: 0,
                disabled: 0,
                endpoints: this.endpoints.size,
                webhooks: []
            };
            
            for (const [id, webhook] of this.webhooks.entries()) {
                if (webhook.enabled) {
                    status.enabled++;
                } else {
                    status.disabled++;
                }
                
                status.webhooks.push({
                    id: webhook.id,
                    name: webhook.name,
                    type: webhook.type,
                    enabled: webhook.enabled,
                    lastTriggered: webhook.lastTriggered
                });
            }
            
            return status;
        } catch (error) {
            console.error('Failed to get webhook status:', error);
            return null;
        }
    }
    
    /**
     * Get event history
     */
    async getEventHistory(timeRange = '24h', webhookId = null) {
        try {
            const events = [];
            const endTime = Date.now();
            const startTime = endTime - this.getTimeRangeMs(timeRange);
            
            const logsPath = path.join(this.webhookPath, 'logs');
            const files = await fs.readdir(logsPath);
            
            for (const file of files) {
                if (file.endsWith('.json')) {
                    const data = await fs.readFile(path.join(logsPath, file), 'utf8');
                    const log = JSON.parse(data);
                    
                    if (log.timestamp >= startTime && log.timestamp <= endTime) {
                        if (!webhookId || log.webhookId === webhookId) {
                            events.push(log);
                        }
                    }
                }
            }
            
            // Sort by timestamp (newest first)
            events.sort((a, b) => b.timestamp - a.timestamp);
            
            return {
                timeRange,
                total: events.length,
                successful: events.filter(e => e.success).length,
                failed: events.filter(e => !e.success).length,
                events: events.slice(0, 100) // Limit to last 100 events
            };
        } catch (error) {
            console.error('Failed to get event history:', error);
            return null;
        }
    }
    
    /**
     * Export webhook data
     */
    async exportWebhookData(format = 'json') {
        try {
            const data = {
                webhooks: Array.from(this.webhooks.values()),
                endpoints: Array.from(this.endpoints.values()),
                security: this.security,
                statistics: this.getWebhookStatus()
            };
            
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            
            switch (format.toLowerCase()) {
                case 'json':
                    const jsonPath = path.join(this.webhookPath, `export_${timestamp}.json`);
                    await fs.writeFile(jsonPath, JSON.stringify(data, null, 2));
                    return jsonPath;
                    
                case 'csv':
                    const csvPath = path.join(this.webhookPath, `export_${timestamp}.csv`);
                    const csvData = this.convertWebhookToCSV(data);
                    await fs.writeFile(csvPath, csvData);
                    return csvPath;
                    
                default:
                    throw new Error(`Unsupported export format: ${format}`);
            }
        } catch (error) {
            console.error('Failed to export webhook data:', error);
            return null;
        }
    }
    
    // Authentication methods
    
    /**
     * Verify webhook signature
     */
    async verifySignature(request, webhook) {
        try {
            const signature = request.headers[this.security.signatureHeader];
            if (!signature) {
                return { valid: false, error: 'Missing signature header' };
            }
            
            const expectedSignature = this.calculateSignature(request.body, webhook.auth.secret);
            if (signature !== expectedSignature) {
                return { valid: false, error: 'Invalid signature' };
            }
            
            return { valid: true };
        } catch (error) {
            return { valid: false, error: error.message };
        }
    }
    
    /**
     * Verify token authentication
     */
    async verifyToken(request, webhook) {
        try {
            const token = request.headers['Authorization']?.replace('Bearer ', '');
            if (!token) {
                return { valid: false, error: 'Missing authorization token' };
            }
            
            if (token !== webhook.auth.token) {
                return { valid: false, error: 'Invalid token' };
            }
            
            return { valid: true };
        } catch (error) {
            return { valid: false, error: error.message };
        }
    }
    
    /**
     * Verify basic authentication
     */
    async verifyBasicAuth(request, webhook) {
        try {
            const authHeader = request.headers['Authorization'];
            if (!authHeader || !authHeader.startsWith('Basic ')) {
                return { valid: false, error: 'Missing basic authentication' };
            }
            
            const credentials = Buffer.from(authHeader.replace('Basic ', ''), 'base64').toString();
            const [username, password] = credentials.split(':');
            
            if (username !== webhook.auth.username || password !== webhook.auth.password) {
                return { valid: false, error: 'Invalid credentials' };
            }
            
            return { valid: true };
        } catch (error) {
            return { valid: false, error: error.message };
        }
    }
    
    // Utility methods
    
    generateSecretKey() {
        return crypto.randomBytes(32).toString('hex');
    }
    
    calculateSignature(payload, secret) {
        return crypto
            .createHmac('sha256', secret)
            .update(JSON.stringify(payload))
            .digest('hex');
    }
    
    async validateWebhookConfig(webhook) {
        // Validate URL
        try {
            new URL(webhook.url);
        } catch (error) {
            throw new Error('Invalid webhook URL');
        }
        
        // Validate events
        if (webhook.events.length > 0) {
            const validEvents = Object.values(this.eventTypes).flat();
            for (const event of webhook.events) {
                if (!validEvents.includes(event)) {
                    throw new Error(`Invalid event type: ${event}`);
                }
            }
        }
        
        // Validate authentication
        if (webhook.auth.type !== 'none') {
            if (!this.authMethods[webhook.auth.type]) {
                throw new Error(`Unsupported authentication type: ${webhook.auth.type}`);
            }
        }
    }
    
    async validateEndpointConfig(endpoint) {
        // Validate path
        if (!endpoint.path || !endpoint.path.startsWith('/')) {
            throw new Error('Endpoint path must start with /');
        }
        
        // Check for duplicate paths
        for (const [id, existing] of this.endpoints.entries()) {
            if (id !== endpoint.id && existing.path === endpoint.path) {
                throw new Error(`Endpoint path ${endpoint.path} already exists`);
            }
        }
    }
    
    prepareWebhookPayload(webhook, eventData) {
        return {
            webhook_id: webhook.id,
            webhook_name: webhook.name,
            timestamp: Date.now(),
            event: eventData.type,
            data: eventData.data,
            metadata: eventData.metadata || {}
        };
    }
    
    addAuthentication(webhook, payload) {
        switch (webhook.auth.type) {
            case 'signature':
                const signature = this.calculateSignature(payload, webhook.auth.secret);
                payload.headers = payload.headers || {};
                payload.headers[this.security.signatureHeader] = signature;
                break;
                
            case 'token':
                payload.headers = payload.headers || {};
                payload.headers['Authorization'] = `Bearer ${webhook.auth.token}`;
                break;
                
            case 'basic':
                const credentials = Buffer.from(`${webhook.auth.username}:${webhook.auth.password}`).toString('base64');
                payload.headers = payload.headers || {};
                payload.headers['Authorization'] = `Basic ${credentials}`;
                break;
        }
    }
    
    async sendWebhook(webhook, payload, options) {
        return new Promise((resolve) => {
            const url = new URL(webhook.url);
            const isHttps = url.protocol === 'https:';
            const client = isHttps ? https : http;
            
            const requestData = JSON.stringify(payload);
            const headers = {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(requestData),
                'User-Agent': 'TeamLeaderSystem-Webhook/1.0',
                ...webhook.headers,
                ...payload.headers
            };
            
            const requestOptions = {
                hostname: url.hostname,
                port: url.port || (isHttps ? 443 : 80),
                path: url.pathname + url.search,
                method: webhook.method,
                headers,
                timeout: this.security.timeout
            };
            
            const req = client.request(requestOptions, (res) => {
                let data = '';
                res.on('data', (chunk) => {
                    data += chunk;
                });
                
                res.on('end', () => {
                    const success = res.statusCode >= 200 && res.statusCode < 300;
                    resolve({
                        success,
                        statusCode: res.statusCode,
                        response: data,
                        headers: res.headers
                    });
                });
            });
            
            req.on('error', (error) => {
                resolve({
                    success: false,
                    error: error.message
                });
            });
            
            req.on('timeout', () => {
                req.destroy();
                resolve({
                    success: false,
                    error: 'Request timeout'
                });
            });
            
            req.write(requestData);
            req.end();
        });
    }
    
    updateWebhookStats(webhook, success) {
        webhook.lastTriggered = Date.now();
        
        if (success) {
            webhook.successCount++;
        } else {
            webhook.failureCount++;
        }
        
        this.webhooks.set(webhook.id, webhook);
    }
    
    async logWebhookEvent(webhook, eventData, result) {
        const log = {
            webhookId: webhook.id,
            webhookName: webhook.name,
            timestamp: Date.now(),
            event: eventData.type,
            success: result.success,
            statusCode: result.statusCode,
            error: result.error,
            response: result.response
        };
        
        const logPath = path.join(this.webhookPath, 'logs', `webhook_${Date.now()}.json`);
        await fs.writeFile(logPath, JSON.stringify(log, null, 2));
    }
    
    checkRateLimit(webhookId) {
        if (!this.security.rateLimit.enabled) {
            return true;
        }
        
        const now = Date.now();
        const windowStart = now - this.security.rateLimit.windowMs;
        
        if (!this.rateLimitStore.has(webhookId)) {
            this.rateLimitStore.set(webhookId, []);
        }
        
        const requests = this.rateLimitStore.get(webhookId);
        
        // Remove old requests outside the window
        const validRequests = requests.filter(timestamp => timestamp > windowStart);
        this.rateLimitStore.set(webhookId, validRequests);
        
        // Check if limit exceeded
        if (validRequests.length >= this.security.rateLimit.maxRequests) {
            return false;
        }
        
        // Add current request
        validRequests.push(now);
        this.rateLimitStore.set(webhookId, validRequests);
        
        return true;
    }
    
    addToRetryQueue(webhookId, eventData, options) {
        const retryItem = {
            webhookId,
            eventData,
            options,
            attempts: 0,
            nextRetry: Date.now() + 60000 // Retry in 1 minute
        };
        
        this.retryQueue.push(retryItem);
    }
    
    async initializeRetryMechanism() {
        this.retryInterval = setInterval(() => {
            this.processRetryQueue();
        }, 30000); // Check every 30 seconds
    }
    
    async processRetryQueue() {
        const now = Date.now();
        const itemsToRetry = this.retryQueue.filter(item => item.nextRetry <= now);
        
        for (const item of itemsToRetry) {
            if (item.attempts < this.security.maxRetries) {
                item.attempts++;
                item.nextRetry = now + (item.attempts * 60000); // Exponential backoff
                
                // Retry the webhook
                await this.triggerWebhook(item.webhookId, item.eventData, { ...item.options, retry: false });
            } else {
                // Remove from queue after max retries
                this.retryQueue = this.retryQueue.filter(i => i !== item);
            }
        }
    }
    
    startRateLimitCleanup() {
        setInterval(() => {
            const now = Date.now();
            const windowStart = now - this.security.rateLimit.windowMs;
            
            for (const [webhookId, requests] of this.rateLimitStore.entries()) {
                const validRequests = requests.filter(timestamp => timestamp > windowStart);
                if (validRequests.length === 0) {
                    this.rateLimitStore.delete(webhookId);
                } else {
                    this.rateLimitStore.set(webhookId, validRequests);
                }
            }
        }, 60000); // Clean up every minute
    }
    
    async validatePayload(request, webhook) {
        // Basic payload validation
        if (!request.body) {
            return { valid: false, error: 'Missing request body' };
        }
        
        // Add custom validation logic here
        return { valid: true };
    }
    
    async saveWebhookConfig(webhook) {
        try {
            const configPath = path.join(this.webhookPath, 'configs', `${webhook.id}.json`);
            await fs.writeFile(configPath, JSON.stringify(webhook, null, 2));
        } catch (error) {
            console.error('Failed to save webhook config:', error);
        }
    }
    
    getTimeRangeMs(timeRange) {
        const ranges = {
            '1h': 60 * 60 * 1000,
            '6h': 6 * 60 * 60 * 1000,
            '24h': 24 * 60 * 60 * 1000,
            '7d': 7 * 24 * 60 * 60 * 1000
        };
        return ranges[timeRange] || ranges['24h'];
    }
    
    convertWebhookToCSV(data) {
        let csv = 'ID,Name,Type,URL,Enabled,Success Count,Failure Count,Success Rate\n';
        
        for (const webhook of data.webhooks) {
            const successRate = webhook.successCount + webhook.failureCount > 0 ? 
                (webhook.successCount / (webhook.successCount + webhook.failureCount)) * 100 : 0;
            
            csv += `${webhook.id},${webhook.name},${webhook.type},${webhook.url},${webhook.enabled},${webhook.successCount},${webhook.failureCount},${successRate.toFixed(2)}%\n`;
        }
        
        return csv;
    }
}

module.exports = WebhookManager; 