// Query Cache System
// Reduces API calls by caching common requests and responses

const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

class QueryCache {
    constructor() {
        this.cache = new Map();
        this.cachePath = '.teamleader/cache';
        this.maxCacheSize = 1000; // Maximum number of cached items
        this.cacheExpiry = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
        this.stats = {
            hits: 0,
            misses: 0,
            saves: 0,
            evictions: 0
        };
        
        this.initializeCache();
    }
    
    /**
     * Initialize cache directory and load existing cache
     */
    async initializeCache() {
        try {
            await fs.mkdir(this.cachePath, { recursive: true });
            await this.loadCacheFromDisk();
        } catch (error) {
            console.warn('Cache initialization failed:', error.message);
        }
    }
    
    /**
     * Generate cache key from request parameters
     */
    generateCacheKey(model, prompt, options = {}) {
        const data = {
            model,
            prompt: this.normalizePrompt(prompt),
            options: this.normalizeOptions(options)
        };
        
        const hash = crypto.createHash('sha256')
            .update(JSON.stringify(data))
            .digest('hex');
            
        return hash;
    }
    
    /**
     * Normalize prompt for consistent caching
     */
    normalizePrompt(prompt) {
        // Remove extra whitespace and normalize line endings
        return prompt.trim().replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    }
    
    /**
     * Normalize options for consistent caching
     */
    normalizeOptions(options) {
        const normalized = {};
        
        // Only include relevant options that affect the response
        const relevantKeys = ['temperature', 'max_tokens', 'top_p', 'frequency_penalty', 'presence_penalty'];
        
        for (const key of relevantKeys) {
            if (options[key] !== undefined) {
                normalized[key] = options[key];
            }
        }
        
        return normalized;
    }
    
    /**
     * Check if a request is cached
     */
    async get(model, prompt, options = {}) {
        const key = this.generateCacheKey(model, prompt, options);
        const cached = this.cache.get(key);
        
        if (!cached) {
            this.stats.misses++;
            return null;
        }
        
        // Check if cache entry is expired
        if (Date.now() - cached.timestamp > this.cacheExpiry) {
            this.cache.delete(key);
            this.stats.misses++;
            return null;
        }
        
        this.stats.hits++;
        return cached.response;
    }
    
    /**
     * Cache a response
     */
    async set(model, prompt, options, response) {
        const key = this.generateCacheKey(model, prompt, options);
        
        // Check cache size and evict if necessary
        if (this.cache.size >= this.maxCacheSize) {
            await this.evictOldest();
        }
        
        const cacheEntry = {
            response,
            timestamp: Date.now(),
            model,
            prompt: this.normalizePrompt(prompt),
            options: this.normalizeOptions(options)
        };
        
        this.cache.set(key, cacheEntry);
        this.stats.saves++;
        
        // Save to disk periodically
        if (this.stats.saves % 10 === 0) {
            await this.saveCacheToDisk();
        }
        
        return key;
    }
    
    /**
     * Evict oldest cache entries
     */
    async evictOldest() {
        const entries = Array.from(this.cache.entries());
        
        // Sort by timestamp (oldest first)
        entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
        
        // Remove oldest 10% of entries
        const toRemove = Math.ceil(entries.length * 0.1);
        
        for (let i = 0; i < toRemove; i++) {
            this.cache.delete(entries[i][0]);
        }
        
        this.stats.evictions += toRemove;
    }
    
    /**
     * Clear expired cache entries
     */
    async clearExpired() {
        const now = Date.now();
        let cleared = 0;
        
        for (const [key, entry] of this.cache.entries()) {
            if (now - entry.timestamp > this.cacheExpiry) {
                this.cache.delete(key);
                cleared++;
            }
        }
        
        if (cleared > 0) {
            console.log(`🧹 Cleared ${cleared} expired cache entries`);
        }
        
        return cleared;
    }
    
    /**
     * Clear all cache
     */
    async clear() {
        this.cache.clear();
        this.stats = {
            hits: 0,
            misses: 0,
            saves: 0,
            evictions: 0
        };
        
        try {
            await fs.rm(this.cachePath, { recursive: true, force: true });
            await fs.mkdir(this.cachePath, { recursive: true });
        } catch (error) {
            console.warn('Failed to clear cache files:', error.message);
        }
    }
    
    /**
     * Get cache statistics
     */
    getStats() {
        const hitRate = this.stats.hits + this.stats.misses > 0 
            ? (this.stats.hits / (this.stats.hits + this.stats.misses) * 100).toFixed(2)
            : 0;
            
        return {
            size: this.cache.size,
            maxSize: this.maxCacheSize,
            hitRate: `${hitRate}%`,
            hits: this.stats.hits,
            misses: this.stats.misses,
            saves: this.stats.saves,
            evictions: this.stats.evictions,
            memoryUsage: this.getMemoryUsage()
        };
    }
    
    /**
     * Get memory usage of cache
     */
    getMemoryUsage() {
        let totalSize = 0;
        
        for (const [key, entry] of this.cache.entries()) {
            totalSize += JSON.stringify(entry).length;
        }
        
        return {
            bytes: totalSize,
            mb: (totalSize / 1024 / 1024).toFixed(2)
        };
    }
    
    /**
     * Save cache to disk
     */
    async saveCacheToDisk() {
        try {
            const cacheData = {
                timestamp: Date.now(),
                entries: Array.from(this.cache.entries()),
                stats: this.stats
            };
            
            const cacheFile = path.join(this.cachePath, 'query-cache.json');
            await fs.writeFile(cacheFile, JSON.stringify(cacheData, null, 2));
        } catch (error) {
            console.warn('Failed to save cache to disk:', error.message);
        }
    }
    
    /**
     * Load cache from disk
     */
    async loadCacheFromDisk() {
        try {
            const cacheFile = path.join(this.cachePath, 'query-cache.json');
            const data = await fs.readFile(cacheFile, 'utf8');
            const cacheData = JSON.parse(data);
            
            // Check if cache is too old (more than 7 days)
            const cacheAge = Date.now() - cacheData.timestamp;
            if (cacheAge > 7 * 24 * 60 * 60 * 1000) {
                console.log('🧹 Cache is too old, clearing...');
                return;
            }
            
            // Restore cache entries
            for (const [key, entry] of cacheData.entries) {
                this.cache.set(key, entry);
            }
            
            // Restore stats
            this.stats = cacheData.stats || this.stats;
            
            console.log(`📦 Loaded ${this.cache.size} cache entries from disk`);
        } catch (error) {
            // Cache file doesn't exist or is corrupted, start fresh
            console.log('📦 No existing cache found, starting fresh');
        }
    }
    
    /**
     * Search cache for similar prompts
     */
    async searchSimilar(prompt, limit = 5) {
        const normalizedPrompt = this.normalizePrompt(prompt);
        const results = [];
        
        for (const [key, entry] of this.cache.entries()) {
            const similarity = this.calculateSimilarity(normalizedPrompt, entry.prompt);
            
            if (similarity > 0.7) { // 70% similarity threshold
                results.push({
                    key,
                    entry,
                    similarity
                });
            }
        }
        
        // Sort by similarity and return top results
        return results
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, limit);
    }
    
    /**
     * Calculate similarity between two prompts
     */
    calculateSimilarity(prompt1, prompt2) {
        const words1 = new Set(prompt1.toLowerCase().split(/\s+/));
        const words2 = new Set(prompt2.toLowerCase().split(/\s+/));
        
        const intersection = new Set([...words1].filter(x => words2.has(x)));
        const union = new Set([...words1, ...words2]);
        
        return intersection.size / union.size;
    }
    
    /**
     * Get cache analytics
     */
    getAnalytics() {
        const modelUsage = new Map();
        const promptLengths = [];
        
        for (const entry of this.cache.values()) {
            // Track model usage
            const count = modelUsage.get(entry.model) || 0;
            modelUsage.set(entry.model, count + 1);
            
            // Track prompt lengths
            promptLengths.push(entry.prompt.length);
        }
        
        const avgPromptLength = promptLengths.length > 0 
            ? (promptLengths.reduce((a, b) => a + b, 0) / promptLengths.length).toFixed(0)
            : 0;
            
        return {
            modelUsage: Object.fromEntries(modelUsage),
            avgPromptLength,
            totalPrompts: promptLengths.length,
            cacheEfficiency: this.getStats().hitRate
        };
    }
}

module.exports = QueryCache; 