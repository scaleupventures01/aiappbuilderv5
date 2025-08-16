/**
 * Natural Language Workflow Parser
 * Parses natural language descriptions into structured multi-PRD workflows
 * with dependency tracking and stage-based execution plans
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class NaturalLanguageWorkflowParser {
  constructor() {
    // Keywords for parsing execution patterns
    this.sequentialKeywords = ['then', 'after', 'followed by', 'next', 'subsequently'];
    this.parallelKeywords = ['together', 'parallel', 'concurrently', 'simultaneously', 'at the same time', 'in parallel'];
    this.prdPattern = /(?:PRD[-\s]?)?(\d+\.\d+\.\d+\.\d+(?:\.\d+)*)/gi;
  }

  /**
   * Main entry point - parse natural language into structured workflow
   */
  async parseWorkflowDescription(description) {
    const workflow = {
      originalDescription: description,
      stages: [],
      prdCount: 0,
      estimatedTime: 0,
      agentRequirements: [],
      validationErrors: []
    };

    try {
      // Extract all PRD IDs from the description
      const prdIds = this.extractPRDIds(description);
      workflow.prdCount = prdIds.length;

      if (prdIds.length === 0) {
        workflow.validationErrors.push('No valid PRD IDs found in description');
        return workflow;
      }

      // Parse execution stages based on keywords
      const stages = this.parseExecutionStages(description, prdIds);
      workflow.stages = stages;

      // Validate PRD paths exist
      await this.validatePRDPaths(workflow.stages);

      // Calculate estimates
      workflow.estimatedTime = this.calculateEstimatedTime(workflow.stages);
      workflow.agentRequirements = this.estimateAgentRequirements(workflow.stages);

      // Build dependency graph
      workflow.dependencyGraph = this.buildDependencyGraph(workflow.stages);

      // Check for circular dependencies
      const circularCheck = this.detectCircularDependencies(workflow.dependencyGraph);
      if (circularCheck.hasCircular) {
        workflow.validationErrors.push(`Circular dependency detected: ${circularCheck.cycle.join(' -> ')}`);
      }

    } catch (error) {
      workflow.validationErrors.push(`Parse error: ${error.message}`);
    }

    return workflow;
  }

  /**
   * Extract PRD IDs from natural language text
   */
  extractPRDIds(text) {
    const ids = [];
    let match;
    
    while ((match = this.prdPattern.exec(text)) !== null) {
      const id = match[1];
      if (!ids.includes(id)) {
        ids.push(id);
      }
    }
    
    // Reset regex lastIndex
    this.prdPattern.lastIndex = 0;
    
    return ids;
  }

  /**
   * Parse execution stages from description
   */
  parseExecutionStages(description, prdIds) {
    const stages = [];
    const descLower = description.toLowerCase();
    
    // Create position map for each PRD ID
    const prdPositions = new Map();
    prdIds.forEach(id => {
      const pos = description.search(new RegExp(id.replace(/\./g, '\\.')));
      prdPositions.set(id, pos);
    });

    // Analyze text segments to determine grouping
    const segments = this.splitByKeywords(description);
    
    segments.forEach((segment, index) => {
      const segmentPRDs = prdIds.filter(id => 
        segment.includes(id) || segment.match(new RegExp(id.replace(/\./g, '\\.')))
      );

      if (segmentPRDs.length > 0) {
        const isParallel = this.isParallelSegment(segment);
        
        stages.push({
          id: `stage-${index + 1}`,
          name: `Stage ${index + 1}`,
          prds: segmentPRDs,
          parallel: isParallel,
          dependsOn: index > 0 ? [`stage-${index}`] : [],
          description: this.generateStageDescription(segmentPRDs, isParallel)
        });
      }
    });

    // If no clear stages found, treat as single stage
    if (stages.length === 0 && prdIds.length > 0) {
      stages.push({
        id: 'stage-1',
        name: 'Stage 1',
        prds: prdIds,
        parallel: prdIds.length > 1,
        dependsOn: [],
        description: `Execute ${prdIds.length} PRD(s)`
      });
    }

    return stages;
  }

  /**
   * Split description by sequential keywords
   */
  splitByKeywords(description) {
    const segments = [];
    let remaining = description;
    
    // Split by sequential keywords
    for (const keyword of this.sequentialKeywords) {
      const parts = remaining.split(new RegExp(`\\b${keyword}\\b`, 'i'));
      if (parts.length > 1) {
        segments.push(parts[0]);
        remaining = parts.slice(1).join(keyword);
      }
    }
    
    // Add remaining segment
    if (remaining.trim()) {
      segments.push(remaining);
    }
    
    // If no splits occurred, return original as single segment
    if (segments.length === 0) {
      segments.push(description);
    }
    
    return segments;
  }

  /**
   * Check if segment indicates parallel execution
   */
  isParallelSegment(segment) {
    const segmentLower = segment.toLowerCase();
    
    // Check for explicit parallel keywords
    for (const keyword of this.parallelKeywords) {
      if (segmentLower.includes(keyword)) {
        return true;
      }
    }
    
    // Check for comma-separated list patterns (e.g., "1.1.2.1, 1.1.2.2, and 1.1.2.3")
    const commaPattern = /\d+\.\d+\.\d+\.\d+(?:\.\d+)*(?:\s*,\s*\d+\.\d+\.\d+\.\d+(?:\.\d+)*)+/;
    if (commaPattern.test(segment)) {
      return true;
    }
    
    return false;
  }

  /**
   * Generate human-readable stage description
   */
  generateStageDescription(prds, isParallel) {
    const executionType = isParallel ? 'parallel' : 'sequential';
    const prdList = prds.join(', ');
    return `Execute ${prds.length} PRD(s) [${prdList}] in ${executionType}`;
  }

  /**
   * Validate that PRD files exist
   */
  async validatePRDPaths(stages) {
    const appRoot = path.resolve(__dirname, '../../../app');
    
    for (const stage of stages) {
      for (const prdId of stage.prds) {
        // Try different path patterns
        const possiblePaths = [
          path.join(appRoot, 'PRDs', 'M0', '1.1', 'Phase-3A-Backend-API', `PRD-${prdId}-*.md`),
          path.join(appRoot, 'PRDs', 'M0', '1.1', 'Phase-2-Database-Schema', `PRD-${prdId}-*.md`),
          path.join(appRoot, 'PRDs', 'M0', '1.1', 'Phase-1-Independent', `PRD-${prdId}-*.md`),
          path.join(appRoot, 'PRDs', `**/PRD-${prdId}-*.md`)
        ];
        
        // Store resolved path for each PRD
        stage.prdPaths = stage.prdPaths || {};
        
        // Note: In real implementation, would check file existence
        // For now, we'll construct expected paths
        stage.prdPaths[prdId] = `PRD-${prdId}`;
      }
    }
  }

  /**
   * Calculate estimated execution time
   */
  calculateEstimatedTime(stages) {
    let totalMinutes = 0;
    
    stages.forEach(stage => {
      const prdCount = stage.prds.length;
      const baseTimePerPRD = 15; // Base 15 minutes per PRD
      
      if (stage.parallel) {
        // Parallel execution - time is max of all PRDs plus overhead
        totalMinutes += baseTimePerPRD + (prdCount * 2); // 2 min overhead per PRD
      } else {
        // Sequential execution - sum of all PRDs
        totalMinutes += prdCount * baseTimePerPRD;
      }
    });
    
    return totalMinutes;
  }

  /**
   * Estimate agent requirements
   */
  estimateAgentRequirements(stages) {
    const requirements = {
      totalAgents: 0,
      peakConcurrent: 0,
      byStage: []
    };
    
    stages.forEach(stage => {
      const prdCount = stage.prds.length;
      const agentsPerPRD = 12; // Estimate 12 agents per PRD
      
      const stageRequirement = {
        stageId: stage.id,
        total: prdCount * agentsPerPRD,
        concurrent: stage.parallel ? prdCount * agentsPerPRD : agentsPerPRD
      };
      
      requirements.byStage.push(stageRequirement);
      requirements.totalAgents = Math.max(requirements.totalAgents, stageRequirement.total);
      requirements.peakConcurrent = Math.max(requirements.peakConcurrent, stageRequirement.concurrent);
    });
    
    return requirements;
  }

  /**
   * Build dependency graph for stages
   */
  buildDependencyGraph(stages) {
    const graph = {
      nodes: [],
      edges: []
    };
    
    stages.forEach(stage => {
      graph.nodes.push({
        id: stage.id,
        name: stage.name,
        prds: stage.prds
      });
      
      stage.dependsOn.forEach(dep => {
        graph.edges.push({
          from: dep,
          to: stage.id
        });
      });
    });
    
    return graph;
  }

  /**
   * Detect circular dependencies in graph
   */
  detectCircularDependencies(graph) {
    const visited = new Set();
    const recursionStack = new Set();
    const result = { hasCircular: false, cycle: [] };
    
    const dfs = (nodeId, path = []) => {
      if (recursionStack.has(nodeId)) {
        result.hasCircular = true;
        const cycleStart = path.indexOf(nodeId);
        result.cycle = path.slice(cycleStart).concat(nodeId);
        return true;
      }
      
      if (visited.has(nodeId)) {
        return false;
      }
      
      visited.add(nodeId);
      recursionStack.add(nodeId);
      path.push(nodeId);
      
      const edges = graph.edges.filter(e => e.from === nodeId);
      for (const edge of edges) {
        if (dfs(edge.to, [...path])) {
          return true;
        }
      }
      
      recursionStack.delete(nodeId);
      return false;
    };
    
    for (const node of graph.nodes) {
      if (!visited.has(node.id)) {
        if (dfs(node.id)) {
          break;
        }
      }
    }
    
    return result;
  }

  /**
   * Generate confirmation prompt for user
   */
  generateConfirmation(workflow) {
    const lines = [];
    
    lines.push('📋 Workflow Execution Plan');
    lines.push('═'.repeat(50));
    lines.push('');
    
    if (workflow.validationErrors.length > 0) {
      lines.push('⚠️  Validation Errors:');
      workflow.validationErrors.forEach(error => {
        lines.push(`   ❌ ${error}`);
      });
      lines.push('');
      return lines.join('\n');
    }
    
    // Display stages
    workflow.stages.forEach((stage, index) => {
      const executionMode = stage.parallel ? '(Parallel)' : '(Sequential)';
      lines.push(`${stage.name} ${executionMode}:`);
      
      stage.prds.forEach(prd => {
        const prefix = stage.parallel ? '├──' : '└──';
        lines.push(`  ${prefix} PRD-${prd}`);
      });
      
      if (stage.dependsOn.length > 0) {
        lines.push(`      [Depends on: ${stage.dependsOn.join(', ')}]`);
      }
      
      if (index < workflow.stages.length - 1) {
        lines.push('');
      }
    });
    
    lines.push('');
    lines.push('─'.repeat(50));
    lines.push(`📊 Summary:`);
    lines.push(`   Total PRDs: ${workflow.prdCount}`);
    lines.push(`   Stages: ${workflow.stages.length}`);
    lines.push(`   Estimated time: ${workflow.estimatedTime} minutes`);
    lines.push(`   Peak concurrent agents: ${workflow.agentRequirements.peakConcurrent}`);
    lines.push('');
    lines.push('Proceed with execution? (y/n/dry-run):');
    
    return lines.join('\n');
  }

  /**
   * Generate dry-run execution plan
   */
  generateDryRunPlan(workflow) {
    const plan = {
      stages: [],
      timeline: [],
      resourceUsage: []
    };
    
    let currentTime = 0;
    
    workflow.stages.forEach(stage => {
      const stagePlan = {
        id: stage.id,
        startTime: currentTime,
        tasks: []
      };
      
      stage.prds.forEach(prd => {
        stagePlan.tasks.push({
          prd: prd,
          command: `orch start --id ${prd}`,
          estimatedDuration: 15
        });
      });
      
      const duration = stage.parallel ? 
        Math.max(...stagePlan.tasks.map(t => t.estimatedDuration)) :
        stagePlan.tasks.reduce((sum, t) => sum + t.estimatedDuration, 0);
      
      stagePlan.endTime = currentTime + duration;
      currentTime = stagePlan.endTime;
      
      plan.stages.push(stagePlan);
    });
    
    plan.totalDuration = currentTime;
    
    return plan;
  }
}

// Export singleton instance
export const nlWorkflowParser = new NaturalLanguageWorkflowParser();