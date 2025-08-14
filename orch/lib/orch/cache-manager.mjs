/**
 * Smart Caching System for Orchestration
 * Caches expensive operations like roadmap lookups, PRD parsing, and test results
 */

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

export class OrchestrationCache {
  constructor(repoRoot, options = {}) {
    this.repoRoot = repoRoot;
    this.cacheDir = path.join(repoRoot, '.orch-cache');
    this.indexPath = path.join(this.cacheDir, 'index.json');
    this.index = this.loadIndex();
    
    // Configurable TTLs for different cache types
    this.ttls = {
      'roadmap-lookup': options.roadmapTTL || 3600000,     // 1 hour
      'prd-parse': options.prdParseTTL || 1800000,         // 30 minutes
      'test-results': options.testResultsTTL || 7200000,   // 2 hours
      'prd-resolve': options.prdResolveTTL || 3600000,     // 1 hour
      'workflow': options.workflowTTL || 900000,           // 15 minutes
      'qa-validation': options.qaValidationTTL || 1800000, // 30 minutes
      'default': options.defaultTTL || 3600000             // 1 hour
    };
    
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      errors: 0
    };
    
    // Auto-cleanup old entries on startup
    this.cleanup();
  }

  /**
   * Load cache index from disk
   * @returns {Object} Cache index
   */
  loadIndex() {
    try {
      if (fs.existsSync(this.indexPath)) {
        const data = JSON.parse(fs.readFileSync(this.indexPath, 'utf8'));
        return data || {};
      }
    } catch (err) {
      console.warn('Cache index load failed, starting fresh:', err.message);
    }
    return {};
  }

  /**
   * Save cache index to disk
   */
  saveIndex() {
    try {
      fs.mkdirSync(this.cacheDir, { recursive: true });
      fs.writeFileSync(this.indexPath, JSON.stringify(this.index, null, 2));
    } catch (err) {
      console.error('Cache index save failed:', err.message);
      this.stats.errors++;
    }
  }

  /**
   * Generate hash for cache key
   * @param {string} content - Content to hash
   * @returns {string} Hash string
   */
  hash(content) {
    return crypto.createHash('sha256').update(content).digest('hex').slice(0, 16);
  }

  /**
   * Generate cache key
   * @param {string} type - Cache type
   * @param {string|Object} input - Input to cache
   * @returns {string} Cache key
   */
  getCacheKey(type, input) {
    const inputHash = typeof input === 'string' 
      ? this.hash(input) 
      : this.hash(JSON.stringify(input));
    return `${type}-${inputHash}`;
  }

  /**
   * Get TTL for cache type
   * @param {string} type - Cache type
   * @returns {number} TTL in milliseconds
   */
  getTTL(type) {
    return this.ttls[type] || this.ttls.default;
  }

  /**
   * Get cached value
   * @param {string} type - Cache type
   * @param {string|Object} input - Input key
   * @returns {any} Cached value or null
   */
  get(type, input) {
    const key = this.getCacheKey(type, input);
    const entry = this.index[key];
    
    if (!entry) {
      this.stats.misses++;
      return null;
    }
    
    // Check if expired
    const ttl = this.getTTL(type);
    if (Date.now() - entry.timestamp > ttl) {
      delete this.index[key];
      this.stats.evictions++;
      this.stats.misses++;
      
      // Delete cached file
      try {
        const cachePath = path.join(this.cacheDir, entry.file);
        if (fs.existsSync(cachePath)) {
          fs.unlinkSync(cachePath);
        }
      } catch (err) {
        this.stats.errors++;
      }
      
      return null;
    }
    
    // Read cached data
    try {
      const cachePath = path.join(this.cacheDir, entry.file);
      if (fs.existsSync(cachePath)) {
        this.stats.hits++;
        entry.lastAccessed = Date.now();
        entry.hits = (entry.hits || 0) + 1;
        return JSON.parse(fs.readFileSync(cachePath, 'utf8'));
      }
    } catch (err) {
      console.error('Cache read failed:', err.message);
      this.stats.errors++;
      delete this.index[key];
    }
    
    this.stats.misses++;
    return null;
  }

  /**
   * Set cache value
   * @param {string} type - Cache type
   * @param {string|Object} input - Input key
   * @param {any} data - Data to cache
   * @returns {any} The cached data
   */
  set(type, input, data) {
    const key = this.getCacheKey(type, input);
    const filename = `${key}-${Date.now()}.json`;
    const cachePath = path.join(this.cacheDir, filename);
    
    try {
      fs.mkdirSync(this.cacheDir, { recursive: true });
      fs.writeFileSync(cachePath, JSON.stringify(data));
      
      // Remove old file if exists
      const oldEntry = this.index[key];
      if (oldEntry && oldEntry.file) {
        try {
          const oldPath = path.join(this.cacheDir, oldEntry.file);
          if (fs.existsSync(oldPath)) {
            fs.unlinkSync(oldPath);
          }
        } catch (err) {
          // Ignore cleanup errors
        }
      }
      
      this.index[key] = {
        file: filename,
        timestamp: Date.now(),
        lastAccessed: Date.now(),
        type,
        size: JSON.stringify(data).length,
        hits: 0
      };
      
      this.saveIndex();
    } catch (err) {
      console.error('Cache write failed:', err.message);
      this.stats.errors++;
    }
    
    return data;
  }

  /**
   * Cache wrapper for async operations
   * @param {string} type - Cache type
   * @param {string|Object} input - Input key
   * @param {Function} fn - Function to call if cache miss
   * @returns {Promise<any>} Cached or computed result
   */
  async withCache(type, input, fn) {
    const cached = this.get(type, input);
    if (cached !== null) {
      return cached;
    }
    
    const result = await fn();
    return this.set(type, input, result);
  }

  /**
   * Invalidate specific cache entry
   * @param {string} type - Cache type
   * @param {string|Object} input - Input key
   */
  invalidate(type, input) {
    const key = this.getCacheKey(type, input);
    const entry = this.index[key];
    
    if (entry) {
      try {
        const cachePath = path.join(this.cacheDir, entry.file);
        if (fs.existsSync(cachePath)) {
          fs.unlinkSync(cachePath);
        }
      } catch (err) {
        this.stats.errors++;
      }
      
      delete this.index[key];
      this.saveIndex();
    }
  }

  /**
   * Invalidate all cache entries of a type
   * @param {string} type - Cache type
   */
  invalidateType(type) {
    const keysToDelete = [];
    
    for (const [key, entry] of Object.entries(this.index)) {
      if (entry.type === type) {
        keysToDelete.push(key);
        
        try {
          const cachePath = path.join(this.cacheDir, entry.file);
          if (fs.existsSync(cachePath)) {
            fs.unlinkSync(cachePath);
          }
        } catch (err) {
          this.stats.errors++;
        }
      }
    }
    
    keysToDelete.forEach(key => delete this.index[key]);
    
    if (keysToDelete.length > 0) {
      this.saveIndex();
    }
  }

  /**
   * Clear entire cache
   */
  clear() {
    try {
      // Delete all cache files
      for (const entry of Object.values(this.index)) {
        try {
          const cachePath = path.join(this.cacheDir, entry.file);
          if (fs.existsSync(cachePath)) {
            fs.unlinkSync(cachePath);
          }
        } catch (err) {
          // Continue clearing even if some files fail
        }
      }
      
      this.index = {};
      this.saveIndex();
      this.stats = {
        hits: 0,
        misses: 0,
        evictions: 0,
        errors: 0
      };
    } catch (err) {
      console.error('Cache clear failed:', err.message);
      this.stats.errors++;
    }
  }

  /**
   * Clean up expired entries
   */
  cleanup() {
    let cleaned = 0;
    const now = Date.now();
    const keysToDelete = [];
    
    for (const [key, entry] of Object.entries(this.index)) {
      const ttl = this.getTTL(entry.type);
      if (now - entry.timestamp > ttl) {
        keysToDelete.push(key);
        
        try {
          const cachePath = path.join(this.cacheDir, entry.file);
          if (fs.existsSync(cachePath)) {
            fs.unlinkSync(cachePath);
          }
        } catch (err) {
          // Continue cleanup even if some files fail
        }
        
        cleaned++;
      }
    }
    
    keysToDelete.forEach(key => delete this.index[key]);
    
    if (cleaned > 0) {
      this.saveIndex();
      this.stats.evictions += cleaned;
    }
    
    return cleaned;
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache statistics
   */
  getStats() {
    const totalSize = Object.values(this.index).reduce((sum, entry) => sum + (entry.size || 0), 0);
    const avgHits = Object.values(this.index).reduce((sum, entry) => sum + (entry.hits || 0), 0) / 
                    (Object.keys(this.index).length || 1);
    
    return {
      ...this.stats,
      entries: Object.keys(this.index).length,
      totalSize,
      avgHits: Math.round(avgHits * 100) / 100,
      hitRate: this.stats.hits + this.stats.misses > 0 
        ? Math.round((this.stats.hits / (this.stats.hits + this.stats.misses)) * 100) + '%'
        : '0%'
    };
  }

  /**
   * Get cache info for debugging
   * @returns {Object} Cache information
   */
  getInfo() {
    const byType = {};
    
    for (const entry of Object.values(this.index)) {
      const type = entry.type || 'unknown';
      if (!byType[type]) {
        byType[type] = { count: 0, size: 0, hits: 0 };
      }
      byType[type].count++;
      byType[type].size += entry.size || 0;
      byType[type].hits += entry.hits || 0;
    }
    
    return {
      cacheDir: this.cacheDir,
      stats: this.getStats(),
      byType,
      ttls: this.ttls
    };
  }
}

/**
 * Create a global cache instance (singleton)
 */
let globalCache = null;

export function getGlobalCache(repoRoot, options = {}) {
  if (!globalCache) {
    globalCache = new OrchestrationCache(repoRoot, options);
  }
  return globalCache;
}

/**
 * Reset global cache
 */
export function resetGlobalCache() {
  if (globalCache) {
    globalCache.clear();
    globalCache = null;
  }
}