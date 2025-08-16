/**
 * Integration tests for Multi-PRD Workflow execution
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { MultiPRDOrchestrator } from '../../lib/orch/multi-prd-orchestrator.mjs';
import { EventEmitter } from 'node:events';
import { spawn } from 'node:child_process';

// Mock child_process spawn
jest.mock('node:child_process', () => ({
  spawn: jest.fn()
}));

class MockProcess extends EventEmitter {
  constructor(exitCode = 0) {
    super();
    this.stdout = new EventEmitter();
    this.stderr = new EventEmitter();
    this.exitCode = exitCode;
    
    // Simulate process execution
    setTimeout(() => {
      this.stdout.emit('data', Buffer.from('🚀 PHASE 1: DISCOVERY\n'));
      this.stdout.emit('data', Buffer.from('✅ Agent completed task\n'));
      this.emit('close', this.exitCode);
    }, 100);
  }
  
  kill() {
    this.emit('close', 1);
  }
}

describe('Multi-PRD Workflow Integration', () => {
  let orchestrator;
  let mockProcesses;

  beforeEach(() => {
    orchestrator = new MultiPRDOrchestrator();
    mockProcesses = [];
    
    // Mock spawn to return controlled processes
    spawn.mockImplementation((cmd, args) => {
      const mockProcess = new MockProcess(0);
      mockProcesses.push(mockProcess);
      return mockProcess;
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
    mockProcesses = [];
  });

  describe('Workflow Execution', () => {
    it('should execute simple sequential workflow', async () => {
      const description = 'Run 1.1.2.1 then 1.1.2.2';
      
      const result = await orchestrator.executeWorkflow(description, {
        autoConfirm: true
      });

      expect(result.success).toBe(true);
      expect(result.stages.length).toBe(2);
      expect(result.completedPRDs).toContain('1.1.2.1');
      expect(result.completedPRDs).toContain('1.1.2.2');
    });

    it('should execute parallel workflow', async () => {
      const description = 'Run 1.1.2.1, 1.1.2.2, and 1.1.2.3 in parallel';
      
      const result = await orchestrator.executeWorkflow(description, {
        autoConfirm: true
      });

      expect(result.success).toBe(true);
      expect(result.stages.length).toBe(1);
      expect(result.completedPRDs.length).toBe(3);
      expect(spawn).toHaveBeenCalledTimes(3); // All three PRDs spawn simultaneously
    });

    it('should handle mixed parallel and sequential execution', async () => {
      const description = 'Run 1.1.2.1 and 1.1.2.2 together, then 1.1.2.3, then 1.1.2.4';
      
      const result = await orchestrator.executeWorkflow(description, {
        autoConfirm: true
      });

      expect(result.success).toBe(true);
      expect(result.stages.length).toBe(3);
      expect(result.stages[0].completedPRDs.length).toBe(2); // Parallel stage
      expect(result.stages[1].completedPRDs.length).toBe(1); // Sequential
      expect(result.stages[2].completedPRDs.length).toBe(1); // Sequential
    });
  });

  describe('Failure Handling', () => {
    it('should block dependent stages on failure', async () => {
      // Make second PRD fail
      let callCount = 0;
      spawn.mockImplementation((cmd, args) => {
        const exitCode = callCount === 1 ? 1 : 0; // Fail second call
        callCount++;
        return new MockProcess(exitCode);
      });

      const description = 'Run 1.1.2.1 then 1.1.2.2 then 1.1.2.3';
      
      const result = await orchestrator.executeWorkflow(description, {
        autoConfirm: true
      });

      expect(result.success).toBe(false);
      expect(result.completedPRDs).toContain('1.1.2.1');
      expect(result.failedPRDs).toContain('1.1.2.2');
      expect(result.completedPRDs).not.toContain('1.1.2.3'); // Blocked
    });

    it('should handle partial failures in parallel execution', async () => {
      let callCount = 0;
      spawn.mockImplementation((cmd, args) => {
        const prdId = args[args.indexOf('--id') + 1];
        const exitCode = prdId === '1.1.2.2' ? 1 : 0; // Fail middle PRD
        callCount++;
        return new MockProcess(exitCode);
      });

      const description = 'Run 1.1.2.1, 1.1.2.2, and 1.1.2.3 in parallel';
      
      const result = await orchestrator.executeWorkflow(description, {
        autoConfirm: true
      });

      expect(result.success).toBe(false);
      expect(result.completedPRDs).toContain('1.1.2.1');
      expect(result.failedPRDs).toContain('1.1.2.2');
      expect(result.completedPRDs).toContain('1.1.2.3');
    });
  });

  describe('Progress Tracking', () => {
    it('should emit progress events during execution', async () => {
      const progressEvents = [];
      
      orchestrator.on('prdProgress', (event) => {
        progressEvents.push(event);
      });

      const description = 'Run 1.1.2.1';
      
      await orchestrator.executeWorkflow(description, {
        autoConfirm: true
      });

      expect(progressEvents.length).toBeGreaterThan(0);
      expect(progressEvents[0]).toHaveProperty('prdId');
      expect(progressEvents[0]).toHaveProperty('stage');
      expect(progressEvents[0]).toHaveProperty('output');
    });

    it('should track progress for parallel execution', async () => {
      const description = 'Run 1.1.2.1 and 1.1.2.2 in parallel';
      
      // Start execution but don't await
      const executionPromise = orchestrator.executeWorkflow(description, {
        autoConfirm: true
      });

      // Check that both PRDs are being tracked
      await new Promise(resolve => setTimeout(resolve, 50));
      
      expect(orchestrator.progressTrackers.size).toBe(2);
      expect(orchestrator.progressTrackers.has('1.1.2.1')).toBe(true);
      expect(orchestrator.progressTrackers.has('1.1.2.2')).toBe(true);

      await executionPromise;
    });
  });

  describe('Dry Run Mode', () => {
    it('should generate execution plan without running', async () => {
      const description = 'Run 1.1.2.1 and 1.1.2.2 together, then 1.1.2.3';
      
      // Mock user input for dry-run
      orchestrator.getUserConfirmation = jest.fn().mockResolvedValue('dry-run');
      
      const result = await orchestrator.executeWorkflow(description);

      expect(result.dryRun).toBe(true);
      expect(result.plan).toBeDefined();
      expect(result.plan.stages.length).toBe(2);
      expect(spawn).not.toHaveBeenCalled(); // No actual execution
    });
  });

  describe('Cross-PRD Dependencies', () => {
    it('should detect potential conflicts', async () => {
      const alerts = [];
      
      orchestrator.on('crossPRDAlert', (alert) => {
        alerts.push(alert);
      });

      // Simulate changes that affect other PRDs
      await orchestrator.checkCrossPRDDependencies('1.1.2.1', 'database schema changed');

      expect(alerts.length).toBeGreaterThan(0);
      expect(alerts[0].sourcePRD).toBe('1.1.2.1');
      expect(alerts[0].affectedPRDs).toBeDefined();
    });
  });

  describe('Cancellation', () => {
    it('should cancel running workflow', async () => {
      const description = 'Run 1.1.2.1, 1.1.2.2, and 1.1.2.3 in parallel';
      
      // Start execution but don't await
      const executionPromise = orchestrator.executeWorkflow(description, {
        autoConfirm: true
      });

      // Wait for processes to start
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Cancel the workflow
      await orchestrator.cancelWorkflow();

      // Check that processes were killed
      mockProcesses.forEach(process => {
        expect(process.listenerCount('close')).toBeGreaterThan(0);
      });

      // Complete the execution
      await executionPromise;
    });
  });

  describe('Report Generation', () => {
    it('should generate comprehensive final report', async () => {
      const result = {
        success: true,
        totalDuration: 25.5,
        completedPRDs: ['1.1.2.1', '1.1.2.2', '1.1.2.3'],
        failedPRDs: [],
        stages: [
          { stageName: 'Stage 1', success: true, completedPRDs: ['1.1.2.1', '1.1.2.2'] },
          { stageName: 'Stage 2', success: true, completedPRDs: ['1.1.2.3'] }
        ]
      };

      const report = orchestrator.generateFinalReport(result);

      expect(report).toContain('WORKFLOW EXECUTION REPORT');
      expect(report).toContain('Status: SUCCESS');
      expect(report).toContain('Duration: 25.5 minutes');
      expect(report).toContain('Completed PRDs: 3');
      expect(report).toContain('PRD-1.1.2.1');
      expect(report).toContain('PRD-1.1.2.2');
      expect(report).toContain('PRD-1.1.2.3');
    });
  });
});