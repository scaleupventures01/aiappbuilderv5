/**
 * AdvancedRateLimitManager.js
 * Dynamic rate limiting and intelligent request queuing system
 * Provides provider-specific limits, adaptive throttling, and optimization
 */

const fs = require('fs').promises;
const path = require('path');

class AdvancedRateLimitManager {
    constructor(projectName = 'default-project') {
        this.projectName = projectName;
        this.projectPath = projectName;
        this.rateLimitPath = path.join(this.projectPath, 'rate-limits');
        
        // Rate limit configurations
        this.limits = new Map();
        this.providers = new Map();
        this.queues = new Map();
        
        // Rate limiting strategies
        this.strategies = {
            fixed: this.fixedWindow.bind(this),
            sliding: this.slidingWindow.bind(this),
            token: this.tokenBucket.bind(this),
            leaky: this.leakyBucket.bind(this),
            adaptive: this.adaptiveLimit.bind(this)
        };
        
        // Provider configurations
        this.providerConfigs = {
            openai: {
                requestsPerMinute: 60,
                requestsPerHour: 3500,
                tokensPerMinute: 90000,
                strategy: 'token'
            },
            anthropic: {
                requestsPerMinute: 50,
                requestsPerHour: 3000,
                tokensPerMinute: 80000,
                strategy: 'sliding'
            },
            google: {
                requestsPerMinute: 100,
                requestsPerHour: 5000,
                tokensPerMinute: 100000,
                strategy: 'fixed'
            },
            azure: {
                requestsPerMinute: 80,
                requestsPerHour: 4000,
                tokensPerMinute: 90000,
                strategy: 'adaptive'
            }
        };
        
        // Queue management
        this.queueConfig = {
            maxQueueSize: 1000,
            maxWaitTime: 300000, // 5 minutes
            priorityLevels: ['high', 'medium', 'low'],
            retryAttempts: 3,
            backoffMultiplier: 2
        };
        
        // Adaptive rate limiting
        this.adaptiveConfig = {
            enabled: true,
            learningRate: 0.1,
            adjustmentThreshold: 0.2,
            minLimit: 10,
            maxLimit: 1000,
            historyWindow: 3600000 // 1 hour
        };
        
        // Monitoring and analytics
        this.metrics = {
            requests: new Map(),
            rejections: new Map(),
            delays: new Map(),
            optimizations: []
        };
        
        // Real-time monitoring
        this.monitoringInterval = null;
        this.updateInterval = 10000; // 10 seconds
        
        // Bind methods
        this.initialize = this.initialize.bind(this);
        this.setProviderLimit = this.setProviderLimit.bind(this);
        this.checkRateLimit = this.checkRateLimit.bind(this);
        this.queueRequest = this.queueRequest.bind(this);
        this.processQueue = this.processQueue.bind(this);
        this.optimizeLimits = this.optimizeLimits.bind(this);
        this.getRateLimitStatus = this.getRateLimitStatus.bind(this);
        this.getQueueStatus = this.getQueueStatus.bind(this);
        this.exportRateLimitData = this.exportRateLimitData.bind(this);
    }
    
    /**
     * Initialize the advanced rate limit manager
     */
    async initialize() {
        try {
            console.log('🚦 Initializing Advanced Rate Limit Manager...');
            
            // Create rate limit directory structure
            await this.createRateLimitStructure();
            
            // Load existing configurations
            await this.loadRateLimitConfigs();
            
            // Initialize provider limits
            await this.initializeProviderLimits();
            
            // Start queue processing
            await this.startQueueProcessing();
            
            // Start monitoring
            await this.startMonitoring();
            
            console.log('✅ Advanced Rate Limit Manager initialized');
            return true;
        } catch (error) {
            console.error('❌ Failed to initialize Advanced Rate Limit Manager:', error);
            return false;
        }
    }
    
    /**
     * Create rate limit directory structure
     */
    async createRateLimitStructure() {
        const directories = [
            this.rateLimitPath,
            path.join(this.rateLimitPath, 'configs'),
            path.join(this.rateLimitPath, 'logs'),
            path.join(this.rateLimitPath, 'queues'),
            path.join(this.rateLimitPath, 'metrics'),
            path.join(this.rateLimitPath, 'optimizations')
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
     * Load existing rate limit configurations
     */
    async loadRateLimitConfigs() {
        try {
            const configPath = path.join(this.rateLimitPath, 'configs');
            const files = await fs.readdir(configPath);
            
            for (const file of files) {
                if (file.endsWith('.json')) {
                    const data = await fs.readFile(path.join(configPath, file), 'utf8');
                    const config = JSON.parse(data);
                    
                    if (config.type === 'provider') {
                        this.providers.set(config.provider, config);
                    } else if (config.type === 'limit') {
                        this.limits.set(config.id, config);
                    }
                }
            }
            
            console.log(`🚦 Loaded ${this.providers.size} provider configs and ${this.limits.size} limit configs`);
        } catch (error) {
            console.log('🚦 No existing rate limit configurations found');
        }
    }
    
    /**
     * Initialize provider-specific rate limits
     */
    async initializeProviderLimits() {
        try {
            for (const [provider, config] of Object.entries(this.providerConfigs)) {
                if (!this.providers.has(provider)) {
                    const providerConfig = {
                        provider,
                        type: 'provider',
                        limits: config,
                        strategy: config.strategy,
                        enabled: true,
                        createdAt: Date.now(),
                        lastUpdated: Date.now()
                    };
                    
                    this.providers.set(provider, providerConfig);
                    await this.saveProviderConfig(providerConfig);
                }
            }
            
            console.log(`🚦 Initialized ${this.providers.size} provider rate limits`);
        } catch (error) {
            console.error('Failed to initialize provider limits:', error);
        }
    }
    
    /**
     * Set provider-specific rate limit
     */
    async setProviderLimit(provider, limits, strategy = null) {
        try {
            const providerConfig = this.providers.get(provider) || {
                provider,
                type: 'provider',
                enabled: true,
                createdAt: Date.now()
            };
            
            providerConfig.limits = { ...providerConfig.limits, ...limits };
            if (strategy) {
                providerConfig.strategy = strategy;
            }
            providerConfig.lastUpdated = Date.now();
            
            this.providers.set(provider, providerConfig);
            await this.saveProviderConfig(providerConfig);
            
            console.log(`🚦 Updated rate limits for provider: ${provider}`);
            return providerConfig;
        } catch (error) {
            console.error('Failed to set provider limit:', error);
            return null;
        }
    }
    
    /**
     * Check rate limit for a request
     */
    async checkRateLimit(provider, requestId, priority = 'medium') {
        try {
            const providerConfig = this.providers.get(provider);
            if (!providerConfig || !providerConfig.enabled) {
                return { allowed: true, delay: 0, reason: 'no_limit' };
            }
            
            const strategy = this.strategies[providerConfig.strategy];
            if (!strategy) {
                throw new Error(`Unknown rate limiting strategy: ${providerConfig.strategy}`);
            }
            
            // Check rate limit using the appropriate strategy
            const result = await strategy(provider, requestId, providerConfig.limits);
            
            // Update metrics
            this.updateMetrics(provider, result);
            
            // If not allowed, queue the request
            if (!result.allowed && this.queueConfig.maxQueueSize > 0) {
                const queueResult = await this.queueRequest(provider, requestId, priority, result);
                return queueResult;
            }
            
            return result;
        } catch (error) {
            console.error('Failed to check rate limit:', error);
            return { allowed: false, delay: 0, reason: 'error', error: error.message };
        }
    }
    
    /**
     * Fixed window rate limiting
     */
    async fixedWindow(provider, requestId, limits) {
        const now = Date.now();
        const windowStart = Math.floor(now / 60000) * 60000; // 1-minute windows
        
        const key = `${provider}_fixed_${windowStart}`;
        
        if (!this.metrics.requests.has(key)) {
            this.metrics.requests.set(key, {
                count: 0,
                tokens: 0,
                windowStart
            });
        }
        
        const window = this.metrics.requests.get(key);
        const requestsPerMinute = limits.requestsPerMinute || 60;
        
        if (window.count >= requestsPerMinute) {
            return {
                allowed: false,
                delay: 60000 - (now - windowStart),
                reason: 'rate_limit_exceeded',
                retryAfter: new Date(windowStart + 60000)
            };
        }
        
        window.count++;
        this.metrics.requests.set(key, window);
        
        return { allowed: true, delay: 0 };
    }
    
    /**
     * Sliding window rate limiting
     */
    async slidingWindow(provider, requestId, limits) {
        const now = Date.now();
        const windowSize = 60000; // 1 minute
        const windowStart = now - windowSize;
        
        // Get all requests in the sliding window
        const requests = [];
        for (const [key, data] of this.metrics.requests.entries()) {
            if (key.startsWith(`${provider}_`) && data.timestamp >= windowStart) {
                requests.push(data);
            }
        }
        
        const requestsPerMinute = limits.requestsPerMinute || 60;
        const currentCount = requests.length;
        
        if (currentCount >= requestsPerMinute) {
            const oldestRequest = Math.min(...requests.map(r => r.timestamp));
            const delay = windowSize - (now - oldestRequest);
            
            return {
                allowed: false,
                delay: Math.max(0, delay),
                reason: 'rate_limit_exceeded',
                retryAfter: new Date(now + delay)
            };
        }
        
        // Record this request
        const key = `${provider}_sliding_${now}`;
        this.metrics.requests.set(key, {
            timestamp: now,
            requestId
        });
        
        return { allowed: true, delay: 0 };
    }
    
    /**
     * Token bucket rate limiting
     */
    async tokenBucket(provider, requestId, limits) {
        const now = Date.now();
        const bucketKey = `${provider}_token_bucket`;
        
        if (!this.metrics.requests.has(bucketKey)) {
            this.metrics.requests.set(bucketKey, {
                tokens: limits.requestsPerMinute || 60,
                lastRefill: now,
                maxTokens: limits.requestsPerMinute || 60,
                refillRate: (limits.requestsPerMinute || 60) / 60 // tokens per second
            });
        }
        
        const bucket = this.metrics.requests.get(bucketKey);
        
        // Refill tokens
        const timePassed = (now - bucket.lastRefill) / 1000; // seconds
        const tokensToAdd = timePassed * bucket.refillRate;
        bucket.tokens = Math.min(bucket.maxTokens, bucket.tokens + tokensToAdd);
        bucket.lastRefill = now;
        
        if (bucket.tokens < 1) {
            const timeToNextToken = (1 - bucket.tokens) / bucket.refillRate * 1000;
            
            return {
                allowed: false,
                delay: timeToNextToken,
                reason: 'no_tokens_available',
                retryAfter: new Date(now + timeToNextToken)
            };
        }
        
        bucket.tokens--;
        this.metrics.requests.set(bucketKey, bucket);
        
        return { allowed: true, delay: 0 };
    }
    
    /**
     * Leaky bucket rate limiting
     */
    async leakyBucket(provider, requestId, limits) {
        const now = Date.now();
        const bucketKey = `${provider}_leaky_bucket`;
        
        if (!this.metrics.requests.has(bucketKey)) {
            this.metrics.requests.set(bucketKey, {
                queue: [],
                lastLeak: now,
                leakRate: (limits.requestsPerMinute || 60) / 60, // requests per second
                maxQueueSize: limits.requestsPerMinute || 60
            });
        }
        
        const bucket = this.metrics.requests.get(bucketKey);
        
        // Process leaks
        const timePassed = (now - bucket.lastLeak) / 1000; // seconds
        const leaksToProcess = Math.floor(timePassed * bucket.leakRate);
        
        for (let i = 0; i < leaksToProcess && bucket.queue.length > 0; i++) {
            bucket.queue.shift();
        }
        
        bucket.lastLeak = now;
        
        if (bucket.queue.length >= bucket.maxQueueSize) {
            return {
                allowed: false,
                delay: 0,
                reason: 'bucket_full',
                retryAfter: new Date(now + (bucket.queue.length / bucket.leakRate * 1000))
            };
        }
        
        // Add request to queue
        bucket.queue.push({
            requestId,
            timestamp: now
        });
        
        this.metrics.requests.set(bucketKey, bucket);
        
        return { allowed: true, delay: 0 };
    }
    
    /**
     * Adaptive rate limiting
     */
    async adaptiveLimit(provider, requestId, limits) {
        const now = Date.now();
        const adaptiveKey = `${provider}_adaptive`;
        
        if (!this.metrics.requests.has(adaptiveKey)) {
            this.metrics.requests.set(adaptiveKey, {
                baseLimit: limits.requestsPerMinute || 60,
                currentLimit: limits.requestsPerMinute || 60,
                successRate: 1.0,
                errorRate: 0.0,
                lastAdjustment: now,
                history: []
            });
        }
        
        const adaptive = this.metrics.requests.get(adaptiveKey);
        
        // Check if adjustment is needed
        if (now - adaptive.lastAdjustment > this.adaptiveConfig.historyWindow) {
            await this.adjustAdaptiveLimit(adaptive, provider);
            adaptive.lastAdjustment = now;
        }
        
        // Use current adaptive limit
        const currentLimit = Math.max(
            this.adaptiveConfig.minLimit,
            Math.min(this.adaptiveConfig.maxLimit, adaptive.currentLimit)
        );
        
        // Check against current limit using sliding window
        const windowSize = 60000;
        const windowStart = now - windowSize;
        
        const recentRequests = adaptive.history.filter(r => r.timestamp >= windowStart);
        
        if (recentRequests.length >= currentLimit) {
            const oldestRequest = Math.min(...recentRequests.map(r => r.timestamp));
            const delay = windowSize - (now - oldestRequest);
            
            return {
                allowed: false,
                delay: Math.max(0, delay),
                reason: 'adaptive_limit_exceeded',
                retryAfter: new Date(now + delay)
            };
        }
        
        // Record request
        adaptive.history.push({
            requestId,
            timestamp: now,
            success: true // Will be updated later
        });
        
        // Keep only recent history
        adaptive.history = adaptive.history.filter(r => r.timestamp >= now - this.adaptiveConfig.historyWindow);
        
        this.metrics.requests.set(adaptiveKey, adaptive);
        
        return { allowed: true, delay: 0 };
    }
    
    /**
     * Queue a request for later processing
     */
    async queueRequest(provider, requestId, priority, rateLimitResult) {
        try {
            const queueKey = `${provider}_queue`;
            
            if (!this.queues.has(queueKey)) {
                this.queues.set(queueKey, {
                    requests: [],
                    processing: false,
                    stats: {
                        totalQueued: 0,
                        totalProcessed: 0,
                        totalRejected: 0,
                        averageWaitTime: 0
                    }
                });
            }
            
            const queue = this.queues.get(queueKey);
            
            // Check queue size limit
            if (queue.requests.length >= this.queueConfig.maxQueueSize) {
                queue.stats.totalRejected++;
                return {
                    allowed: false,
                    delay: 0,
                    reason: 'queue_full',
                    error: 'Queue is full'
                };
            }
            
            const queueItem = {
                requestId,
                priority,
                timestamp: Date.now(),
                rateLimitResult,
                attempts: 0
            };
            
            // Add to queue based on priority
            this.addToPriorityQueue(queue, queueItem);
            queue.stats.totalQueued++;
            
            this.queues.set(queueKey, queue);
            
            // Save queue state
            await this.saveQueueState(queueKey, queue);
            
            return {
                allowed: false,
                delay: this.estimateQueueDelay(queue, priority),
                reason: 'queued',
                queuePosition: this.getQueuePosition(queue, requestId)
            };
        } catch (error) {
            console.error('Failed to queue request:', error);
            return {
                allowed: false,
                delay: 0,
                reason: 'queue_error',
                error: error.message
            };
        }
    }
    
    /**
     * Process queued requests
     */
    async processQueue(provider) {
        try {
            const queueKey = `${provider}_queue`;
            const queue = this.queues.get(queueKey);
            
            if (!queue || queue.processing || queue.requests.length === 0) {
                return;
            }
            
            queue.processing = true;
            
            // Process high priority requests first
            for (const priority of this.queueConfig.priorityLevels) {
                const priorityRequests = queue.requests.filter(r => r.priority === priority);
                
                for (const request of priorityRequests) {
                    // Check if request has expired
                    if (Date.now() - request.timestamp > this.queueConfig.maxWaitTime) {
                        queue.requests = queue.requests.filter(r => r.requestId !== request.requestId);
                        queue.stats.totalRejected++;
                        continue;
                    }
                    
                    // Check rate limit again
                    const rateLimitResult = await this.checkRateLimit(provider, request.requestId, request.priority);
                    
                    if (rateLimitResult.allowed) {
                        // Remove from queue and process
                        queue.requests = queue.requests.filter(r => r.requestId !== request.requestId);
                        queue.stats.totalProcessed++;
                        
                        // Update wait time statistics
                        const waitTime = Date.now() - request.timestamp;
                        queue.stats.averageWaitTime = (queue.stats.averageWaitTime + waitTime) / 2;
                        
                        // Trigger request processing (this would integrate with the actual request handler)
                        await this.processRequest(provider, request.requestId);
                    } else if (rateLimitResult.reason === 'queue_full') {
                        // Remove from queue if it's full
                        queue.requests = queue.requests.filter(r => r.requestId !== request.requestId);
                        queue.stats.totalRejected++;
                    }
                    // Otherwise, keep in queue for next processing cycle
                }
            }
            
            queue.processing = false;
            this.queues.set(queueKey, queue);
            
            // Save updated queue state
            await this.saveQueueState(queueKey, queue);
            
        } catch (error) {
            console.error('Failed to process queue:', error);
        }
    }
    
    /**
     * Optimize rate limits based on performance data
     */
    async optimizeLimits(provider) {
        try {
            if (!this.adaptiveConfig.enabled) {
                return false;
            }
            
            console.log(`🚦 Optimizing rate limits for ${provider}...`);
            
            const providerConfig = this.providers.get(provider);
            if (!providerConfig) {
                return false;
            }
            
            // Analyze recent performance
            const performance = await this.analyzePerformance(provider);
            
            // Calculate optimization
            const optimization = this.calculateOptimization(performance, providerConfig);
            
            // Apply optimization if significant
            if (Math.abs(optimization.adjustment) > this.adaptiveConfig.adjustmentThreshold) {
                const newLimits = {
                    requestsPerMinute: Math.max(
                        this.adaptiveConfig.minLimit,
                        Math.min(
                            this.adaptiveConfig.maxLimit,
                            providerConfig.limits.requestsPerMinute + optimization.adjustment
                        )
                    )
                };
                
                await this.setProviderLimit(provider, newLimits);
                
                // Record optimization
                this.metrics.optimizations.push({
                    provider,
                    timestamp: Date.now(),
                    oldLimit: providerConfig.limits.requestsPerMinute,
                    newLimit: newLimits.requestsPerMinute,
                    reason: optimization.reason,
                    performance: performance
                });
                
                console.log(`🚦 Optimized ${provider}: ${providerConfig.limits.requestsPerMinute} → ${newLimits.requestsPerMinute}`);
                return true;
            }
            
            return false;
        } catch (error) {
            console.error('Failed to optimize limits:', error);
            return false;
        }
    }
    
    /**
     * Get rate limit status
     */
    getRateLimitStatus(provider = null) {
        try {
            if (provider) {
                const providerConfig = this.providers.get(provider);
                if (!providerConfig) {
                    return null;
                }
                
                const queue = this.queues.get(`${provider}_queue`);
                
                return {
                    provider,
                    enabled: providerConfig.enabled,
                    strategy: providerConfig.strategy,
                    limits: providerConfig.limits,
                    queue: queue ? {
                        size: queue.requests.length,
                        processing: queue.processing,
                        stats: queue.stats
                    } : null,
                    lastUpdated: providerConfig.lastUpdated
                };
            }
            
            // Return status for all providers
            const status = {
                total: this.providers.size,
                enabled: 0,
                disabled: 0,
                providers: []
            };
            
            for (const [providerName, config] of this.providers.entries()) {
                if (config.enabled) {
                    status.enabled++;
                } else {
                    status.disabled++;
                }
                
                const queue = this.queues.get(`${providerName}_queue`);
                
                status.providers.push({
                    provider: providerName,
                    enabled: config.enabled,
                    strategy: config.strategy,
                    queueSize: queue ? queue.requests.length : 0
                });
            }
            
            return status;
        } catch (error) {
            console.error('Failed to get rate limit status:', error);
            return null;
        }
    }
    
    /**
     * Get queue status
     */
    getQueueStatus(provider = null) {
        try {
            if (provider) {
                const queue = this.queues.get(`${provider}_queue`);
                return queue ? {
                    provider,
                    size: queue.requests.length,
                    processing: queue.processing,
                    stats: queue.stats,
                    requests: queue.requests.slice(0, 10) // First 10 requests
                } : null;
            }
            
            // Return status for all queues
            const status = {
                total: this.queues.size,
                totalQueued: 0,
                totalProcessing: 0,
                queues: []
            };
            
            for (const [queueKey, queue] of this.queues.entries()) {
                const provider = queueKey.replace('_queue', '');
                status.totalQueued += queue.requests.length;
                if (queue.processing) status.totalProcessing++;
                
                status.queues.push({
                    provider,
                    size: queue.requests.length,
                    processing: queue.processing,
                    stats: queue.stats
                });
            }
            
            return status;
        } catch (error) {
            console.error('Failed to get queue status:', error);
            return null;
        }
    }
    
    /**
     * Export rate limit data
     */
    async exportRateLimitData(format = 'json') {
        try {
            const data = {
                providers: Array.from(this.providers.values()),
                limits: Array.from(this.limits.values()),
                queues: Object.fromEntries(this.queues),
                metrics: Object.fromEntries(this.metrics.requests),
                optimizations: this.metrics.optimizations,
                status: this.getRateLimitStatus()
            };
            
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            
            switch (format.toLowerCase()) {
                case 'json':
                    const jsonPath = path.join(this.rateLimitPath, `export_${timestamp}.json`);
                    await fs.writeFile(jsonPath, JSON.stringify(data, null, 2));
                    return jsonPath;
                    
                case 'csv':
                    const csvPath = path.join(this.rateLimitPath, `export_${timestamp}.csv`);
                    const csvData = this.convertRateLimitToCSV(data);
                    await fs.writeFile(csvPath, csvData);
                    return csvPath;
                    
                default:
                    throw new Error(`Unsupported export format: ${format}`);
            }
        } catch (error) {
            console.error('Failed to export rate limit data:', error);
            return null;
        }
    }
    
    // Utility methods
    
    async startQueueProcessing() {
        setInterval(async () => {
            for (const [provider] of this.providers.entries()) {
                await this.processQueue(provider);
            }
        }, 5000); // Process queues every 5 seconds
    }
    
    async startMonitoring() {
        this.monitoringInterval = setInterval(async () => {
            await this.updateMetrics();
        }, this.updateInterval);
    }
    
    addToPriorityQueue(queue, item) {
        const priorities = this.queueConfig.priorityLevels;
        const itemPriorityIndex = priorities.indexOf(item.priority);
        
        let insertIndex = queue.requests.length;
        for (let i = 0; i < queue.requests.length; i++) {
            const currentPriorityIndex = priorities.indexOf(queue.requests[i].priority);
            if (itemPriorityIndex < currentPriorityIndex) {
                insertIndex = i;
                break;
            }
        }
        
        queue.requests.splice(insertIndex, 0, item);
    }
    
    estimateQueueDelay(queue, priority) {
        const priorities = this.queueConfig.priorityLevels;
        const priorityIndex = priorities.indexOf(priority);
        
        let estimatedDelay = 0;
        for (const request of queue.requests) {
            const requestPriorityIndex = priorities.indexOf(request.priority);
            if (requestPriorityIndex <= priorityIndex) {
                estimatedDelay += 5000; // 5 seconds per request
            }
        }
        
        return estimatedDelay;
    }
    
    getQueuePosition(queue, requestId) {
        return queue.requests.findIndex(r => r.requestId === requestId) + 1;
    }
    
    async processRequest(provider, requestId) {
        // This would integrate with the actual request processing system
        console.log(`🚦 Processing request ${requestId} for ${provider}`);
    }
    
    async adjustAdaptiveLimit(adaptive, provider) {
        // Analyze success rate and adjust limit accordingly
        const recentHistory = adaptive.history.filter(h => 
            h.timestamp > Date.now() - this.adaptiveConfig.historyWindow
        );
        
        if (recentHistory.length === 0) return;
        
        const successRate = recentHistory.filter(h => h.success).length / recentHistory.length;
        const errorRate = 1 - successRate;
        
        adaptive.successRate = successRate;
        adaptive.errorRate = errorRate;
        
        // Adjust limit based on performance
        if (successRate > 0.95) {
            // Increase limit if success rate is high
            adaptive.currentLimit = Math.min(
                this.adaptiveConfig.maxLimit,
                adaptive.currentLimit * (1 + this.adaptiveConfig.learningRate)
            );
        } else if (errorRate > 0.1) {
            // Decrease limit if error rate is high
            adaptive.currentLimit = Math.max(
                this.adaptiveConfig.minLimit,
                adaptive.currentLimit * (1 - this.adaptiveConfig.learningRate)
            );
        }
    }
    
    async analyzePerformance(provider) {
        // Analyze recent performance metrics
        const now = Date.now();
        const windowStart = now - this.adaptiveConfig.historyWindow;
        
        const requests = [];
        for (const [key, data] of this.metrics.requests.entries()) {
            if (key.startsWith(`${provider}_`) && data.timestamp >= windowStart) {
                requests.push(data);
            }
        }
        
        return {
            totalRequests: requests.length,
            successRate: requests.filter(r => r.success !== false).length / requests.length,
            averageResponseTime: requests.reduce((sum, r) => sum + (r.responseTime || 0), 0) / requests.length,
            errorRate: requests.filter(r => r.success === false).length / requests.length
        };
    }
    
    calculateOptimization(performance, providerConfig) {
        const currentLimit = providerConfig.limits.requestsPerMinute;
        let adjustment = 0;
        let reason = '';
        
        if (performance.successRate > 0.95 && performance.averageResponseTime < 2000) {
            // High success rate and fast response - can increase limit
            adjustment = Math.floor(currentLimit * 0.1);
            reason = 'high_performance';
        } else if (performance.errorRate > 0.1 || performance.averageResponseTime > 5000) {
            // High error rate or slow response - decrease limit
            adjustment = -Math.floor(currentLimit * 0.1);
            reason = 'poor_performance';
        }
        
        return { adjustment, reason };
    }
    
    updateMetrics(provider, result) {
        const key = `${provider}_metrics_${Date.now()}`;
        this.metrics.requests.set(key, {
            provider,
            timestamp: Date.now(),
            success: result.allowed,
            delay: result.delay,
            reason: result.reason
        });
    }
    
    async saveProviderConfig(config) {
        try {
            const configPath = path.join(this.rateLimitPath, 'configs', `${config.provider}.json`);
            await fs.writeFile(configPath, JSON.stringify(config, null, 2));
        } catch (error) {
            console.error('Failed to save provider config:', error);
        }
    }
    
    async saveQueueState(queueKey, queue) {
        try {
            const queuePath = path.join(this.rateLimitPath, 'queues', `${queueKey}.json`);
            await fs.writeFile(queuePath, JSON.stringify(queue, null, 2));
        } catch (error) {
            console.error('Failed to save queue state:', error);
        }
    }
    
    convertRateLimitToCSV(data) {
        let csv = 'Provider,Strategy,Enabled,Requests Per Minute,Queue Size,Success Rate\n';
        
        for (const provider of data.providers) {
            const queue = data.queues[`${provider.provider}_queue`];
            const queueSize = queue ? queue.requests.length : 0;
            const successRate = queue ? (queue.stats.totalProcessed / (queue.stats.totalProcessed + queue.stats.totalRejected)) * 100 : 0;
            
            csv += `${provider.provider},${provider.strategy},${provider.enabled},${provider.limits.requestsPerMinute},${queueSize},${successRate.toFixed(2)}%\n`;
        }
        
        return csv;
    }
}

module.exports = AdvancedRateLimitManager; 