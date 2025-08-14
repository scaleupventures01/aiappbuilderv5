/**
 * Batch File Operations Optimizer
 * Reduces I/O overhead by batching file operations and executing them in parallel
 */

import fs from 'node:fs/promises';
import path from 'node:path';

export class BatchFileOperator {
  constructor() {
    this.queue = new Map();
    this.reads = new Map();
    this.stats = {
      queued: 0,
      executed: 0,
      errors: 0
    };
  }

  /**
   * Queue a file write operation
   * @param {string} filepath - Path to file
   * @param {string} content - Content to write
   */
  queueWrite(filepath, content) {
    this.queue.set(filepath, { 
      action: 'write', 
      content,
      timestamp: Date.now()
    });
    this.stats.queued++;
  }

  /**
   * Queue a file append operation
   * @param {string} filepath - Path to file
   * @param {string} content - Content to append
   */
  queueAppend(filepath, content) {
    const existing = this.queue.get(filepath);
    if (existing && existing.action === 'write') {
      // If we're already writing to this file, just append to the content
      existing.content += '\n' + content;
    } else {
      this.queue.set(filepath, { 
        action: 'append', 
        content,
        timestamp: Date.now()
      });
    }
    this.stats.queued++;
  }

  /**
   * Queue a file read operation (cached)
   * @param {string} filepath - Path to file
   * @returns {Promise<string>} Promise that resolves to file content
   */
  queueRead(filepath) {
    if (!this.reads.has(filepath)) {
      this.reads.set(filepath, fs.readFile(filepath, 'utf8'));
    }
    return this.reads.get(filepath);
  }

  /**
   * Queue a directory creation
   * @param {string} dirpath - Path to directory
   */
  queueMkdir(dirpath) {
    this.queue.set(dirpath, { 
      action: 'mkdir', 
      timestamp: Date.now()
    });
    this.stats.queued++;
  }

  /**
   * Execute all queued operations in parallel
   * @returns {Promise<Object>} Results of all operations
   */
  async flush() {
    const operations = [];
    const results = {
      successful: [],
      failed: [],
      totalTime: 0
    };
    
    const startTime = Date.now();
    
    // Group operations by directory for efficient creation
    const dirs = new Set();
    const fileOps = [];
    
    for (const [filepath, op] of this.queue) {
      if (op.action === 'mkdir') {
        dirs.add(filepath);
      } else if (op.action === 'write' || op.action === 'append') {
        dirs.add(path.dirname(filepath));
        fileOps.push([filepath, op]);
      }
    }
    
    // Create all directories first (in parallel)
    if (dirs.size > 0) {
      await Promise.all(
        Array.from(dirs).map(dir => 
          fs.mkdir(dir, { recursive: true })
            .then(() => results.successful.push({ type: 'mkdir', path: dir }))
            .catch(err => {
              // Ignore if directory already exists
              if (err.code !== 'EEXIST') {
                results.failed.push({ type: 'mkdir', path: dir, error: err.message });
                this.stats.errors++;
              }
            })
        )
      );
    }
    
    // Execute all file operations in parallel
    for (const [filepath, op] of fileOps) {
      if (op.action === 'write') {
        operations.push(
          fs.writeFile(filepath, op.content, 'utf8')
            .then(() => {
              results.successful.push({ type: 'write', path: filepath });
              this.stats.executed++;
            })
            .catch(err => {
              results.failed.push({ type: 'write', path: filepath, error: err.message });
              this.stats.errors++;
            })
        );
      } else if (op.action === 'append') {
        operations.push(
          fs.appendFile(filepath, op.content, 'utf8')
            .catch(() => fs.writeFile(filepath, op.content, 'utf8'))
            .then(() => {
              results.successful.push({ type: 'append', path: filepath });
              this.stats.executed++;
            })
            .catch(err => {
              results.failed.push({ type: 'append', path: filepath, error: err.message });
              this.stats.errors++;
            })
        );
      }
    }
    
    await Promise.all(operations);
    
    // Clear queues after execution
    this.queue.clear();
    this.reads.clear();
    
    results.totalTime = Date.now() - startTime;
    return results;
  }

  /**
   * Get current queue size
   * @returns {number} Number of queued operations
   */
  getQueueSize() {
    return this.queue.size;
  }

  /**
   * Get statistics
   * @returns {Object} Operation statistics
   */
  getStats() {
    return {
      ...this.stats,
      queueSize: this.queue.size,
      readCacheSize: this.reads.size
    };
  }

  /**
   * Clear all queued operations without executing
   */
  clear() {
    this.queue.clear();
    this.reads.clear();
    this.stats.queued = 0;
  }
}

/**
 * Convenience function for simple batch operations
 * @param {Function} fn - Function that uses the batch operator
 * @returns {Promise<any>} Result of the function
 */
export async function withBatchOps(fn) {
  const batchOps = new BatchFileOperator();
  const result = await fn(batchOps);
  await batchOps.flush();
  return result;
}