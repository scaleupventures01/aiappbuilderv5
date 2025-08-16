/**
 * Unit tests for Natural Language Workflow Parser
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { NaturalLanguageWorkflowParser } from '../../lib/orch/nl-workflow-parser.mjs';

describe('NaturalLanguageWorkflowParser', () => {
  let parser;

  beforeEach(() => {
    parser = new NaturalLanguageWorkflowParser();
  });

  describe('PRD ID Extraction', () => {
    it('should extract PRD IDs from text', () => {
      const text = 'Run PRD-1.1.2.1 and PRD-1.1.2.2 together';
      const ids = parser.extractPRDIds(text);
      expect(ids).toEqual(['1.1.2.1', '1.1.2.2']);
    });

    it('should extract IDs without PRD prefix', () => {
      const text = 'Execute 1.1.2.1, 1.1.2.2, and 1.1.2.3';
      const ids = parser.extractPRDIds(text);
      expect(ids).toEqual(['1.1.2.1', '1.1.2.2', '1.1.2.3']);
    });

    it('should handle 6-segment IDs', () => {
      const text = 'Start with 1.1.1.1.0.0 then 1.1.1.2.0.0';
      const ids = parser.extractPRDIds(text);
      expect(ids).toEqual(['1.1.1.1.0.0', '1.1.1.2.0.0']);
    });

    it('should deduplicate repeated IDs', () => {
      const text = 'Run 1.1.2.1 and 1.1.2.1 again';
      const ids = parser.extractPRDIds(text);
      expect(ids).toEqual(['1.1.2.1']);
    });
  });

  describe('Stage Parsing', () => {
    it('should parse simple sequential workflow', async () => {
      const description = 'Run 1.1.2.1 then 1.1.2.2 then 1.1.2.3';
      const workflow = await parser.parseWorkflowDescription(description);
      
      expect(workflow.stages.length).toBe(3);
      expect(workflow.stages[0].prds).toEqual(['1.1.2.1']);
      expect(workflow.stages[0].parallel).toBe(false);
      expect(workflow.stages[1].dependsOn).toContain('stage-1');
    });

    it('should parse parallel execution', async () => {
      const description = 'Run 1.1.2.1, 1.1.2.2, and 1.1.2.3 in parallel';
      const workflow = await parser.parseWorkflowDescription(description);
      
      expect(workflow.stages.length).toBe(1);
      expect(workflow.stages[0].prds).toEqual(['1.1.2.1', '1.1.2.2', '1.1.2.3']);
      expect(workflow.stages[0].parallel).toBe(true);
    });

    it('should parse mixed parallel and sequential', async () => {
      const description = 'Run 1.1.2.1 and 1.1.2.2 together, then 1.1.2.3';
      const workflow = await parser.parseWorkflowDescription(description);
      
      expect(workflow.stages.length).toBe(2);
      expect(workflow.stages[0].prds).toEqual(['1.1.2.1', '1.1.2.2']);
      expect(workflow.stages[0].parallel).toBe(true);
      expect(workflow.stages[1].prds).toEqual(['1.1.2.3']);
      expect(workflow.stages[1].parallel).toBe(false);
    });

    it('should detect parallel keywords', () => {
      const parallelPhrases = [
        'run them together',
        'execute in parallel',
        'do them concurrently',
        'simultaneously run',
        'at the same time'
      ];

      parallelPhrases.forEach(phrase => {
        expect(parser.isParallelSegment(phrase)).toBe(true);
      });
    });

    it('should detect sequential keywords', () => {
      const segments = parser.splitByKeywords('Do A then B after C followed by D');
      expect(segments.length).toBeGreaterThan(1);
    });
  });

  describe('Dependency Management', () => {
    it('should build dependency graph', async () => {
      const stages = [
        { id: 'stage-1', prds: ['1.1.2.1'], dependsOn: [] },
        { id: 'stage-2', prds: ['1.1.2.2'], dependsOn: ['stage-1'] },
        { id: 'stage-3', prds: ['1.1.2.3'], dependsOn: ['stage-2'] }
      ];

      const graph = parser.buildDependencyGraph(stages);
      expect(graph.nodes.length).toBe(3);
      expect(graph.edges.length).toBe(2);
      expect(graph.edges[0]).toEqual({ from: 'stage-1', to: 'stage-2' });
    });

    it('should detect circular dependencies', () => {
      const circularGraph = {
        nodes: [
          { id: 'A' }, { id: 'B' }, { id: 'C' }
        ],
        edges: [
          { from: 'A', to: 'B' },
          { from: 'B', to: 'C' },
          { from: 'C', to: 'A' }
        ]
      };

      const result = parser.detectCircularDependencies(circularGraph);
      expect(result.hasCircular).toBe(true);
      expect(result.cycle).toContain('A');
      expect(result.cycle).toContain('B');
      expect(result.cycle).toContain('C');
    });

    it('should handle disconnected graphs', () => {
      const disconnectedGraph = {
        nodes: [
          { id: 'A' }, { id: 'B' }, { id: 'C' }, { id: 'D' }
        ],
        edges: [
          { from: 'A', to: 'B' },
          { from: 'C', to: 'D' }
        ]
      };

      const result = parser.detectCircularDependencies(disconnectedGraph);
      expect(result.hasCircular).toBe(false);
    });
  });

  describe('Time and Resource Estimation', () => {
    it('should calculate time for sequential execution', () => {
      const stages = [
        { prds: ['1.1.2.1'], parallel: false },
        { prds: ['1.1.2.2'], parallel: false },
        { prds: ['1.1.2.3'], parallel: false }
      ];

      const time = parser.calculateEstimatedTime(stages);
      expect(time).toBe(45); // 3 PRDs * 15 minutes each
    });

    it('should calculate time for parallel execution', () => {
      const stages = [
        { prds: ['1.1.2.1', '1.1.2.2', '1.1.2.3'], parallel: true }
      ];

      const time = parser.calculateEstimatedTime(stages);
      expect(time).toBe(21); // Base 15 + (3 * 2) overhead
    });

    it('should estimate agent requirements', () => {
      const stages = [
        { id: 'stage-1', prds: ['1.1.2.1', '1.1.2.2'], parallel: true },
        { id: 'stage-2', prds: ['1.1.2.3'], parallel: false }
      ];

      const requirements = parser.estimateAgentRequirements(stages);
      expect(requirements.totalAgents).toBe(24); // 2 PRDs * 12 agents
      expect(requirements.peakConcurrent).toBe(24); // All agents in parallel stage
      expect(requirements.byStage.length).toBe(2);
    });
  });

  describe('Validation', () => {
    it('should report error for no PRD IDs', async () => {
      const description = 'Run some stuff';
      const workflow = await parser.parseWorkflowDescription(description);
      
      expect(workflow.validationErrors.length).toBeGreaterThan(0);
      expect(workflow.validationErrors[0]).toContain('No valid PRD IDs');
    });

    it('should handle malformed input gracefully', async () => {
      const description = '';
      const workflow = await parser.parseWorkflowDescription(description);
      
      expect(workflow.validationErrors.length).toBeGreaterThan(0);
    });
  });

  describe('Confirmation Generation', () => {
    it('should generate readable confirmation prompt', async () => {
      const workflow = {
        stages: [
          { name: 'Stage 1', prds: ['1.1.2.1', '1.1.2.2'], parallel: true, dependsOn: [] },
          { name: 'Stage 2', prds: ['1.1.2.3'], parallel: false, dependsOn: ['stage-1'] }
        ],
        prdCount: 3,
        estimatedTime: 30,
        agentRequirements: { peakConcurrent: 24 },
        validationErrors: []
      };

      const confirmation = parser.generateConfirmation(workflow);
      expect(confirmation).toContain('Workflow Execution Plan');
      expect(confirmation).toContain('Stage 1 (Parallel)');
      expect(confirmation).toContain('Stage 2 (Sequential)');
      expect(confirmation).toContain('Total PRDs: 3');
      expect(confirmation).toContain('Estimated time: 30 minutes');
    });

    it('should show validation errors in confirmation', () => {
      const workflow = {
        stages: [],
        validationErrors: ['Error 1', 'Error 2']
      };

      const confirmation = parser.generateConfirmation(workflow);
      expect(confirmation).toContain('Validation Errors');
      expect(confirmation).toContain('Error 1');
      expect(confirmation).toContain('Error 2');
    });
  });

  describe('Dry Run Planning', () => {
    it('should generate dry run execution plan', () => {
      const workflow = {
        stages: [
          { id: 'stage-1', prds: ['1.1.2.1', '1.1.2.2'], parallel: true },
          { id: 'stage-2', prds: ['1.1.2.3'], parallel: false }
        ]
      };

      const plan = parser.generateDryRunPlan(workflow);
      expect(plan.stages.length).toBe(2);
      expect(plan.stages[0].tasks.length).toBe(2);
      expect(plan.stages[0].tasks[0].command).toContain('orch start --id 1.1.2.1');
      expect(plan.totalDuration).toBeGreaterThan(0);
    });
  });
});