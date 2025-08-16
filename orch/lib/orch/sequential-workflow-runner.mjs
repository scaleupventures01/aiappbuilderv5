/**
 * Sequential Workflow Runner
 * 
 * Simplified approach that uses the proven orch start process directly
 * without subprocess spawning. Based on user feedback that the simple
 * approach works better than complex orchestrator.
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { WorkflowController } from './workflow-controller.mjs';
import { NaturalLanguageWorkflowParser } from './nl-workflow-parser.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class SequentialWorkflowRunner {
  constructor() {
    this.parser = new NaturalLanguageWorkflowParser();
    this.workflowController = new WorkflowController();
    this.results = [];
  }

  /**
   * Execute PRDs sequentially using the proven orch start approach
   * Based on user's working pattern: "orch start PRD-X.X.X with real agents"
   */
  async executeSequentialWorkflow(workflowDescription) {
    console.log('\n🚀 Sequential Workflow Runner - Simplified Approach');
    console.log('═'.repeat(60));
    
    try {
      // Parse the workflow description to extract PRD IDs and sequence
      console.log('📝 Parsing workflow description...');
      const workflow = await this.parser.parseWorkflowDescription(workflowDescription);
      
      if (workflow.validationErrors.length > 0) {
        console.error('❌ Workflow validation failed:');
        workflow.validationErrors.forEach(error => console.error(`   ${error}`));
        return { success: false, errors: workflow.validationErrors };
      }

      console.log(`\n📋 Workflow Plan:`);
      console.log(`   Stages: ${workflow.stages.length}`);
      console.log(`   Total PRDs: ${workflow.stages.reduce((sum, stage) => sum + stage.prds.length, 0)}`);

      // Execute each stage sequentially
      for (const stage of workflow.stages) {
        console.log(`\n🎯 Executing Stage: ${stage.name}`);
        console.log('─'.repeat(50));
        
        if (stage.parallel) {
          // For parallel stages, still run sequentially but note the intent
          console.log('⚠️  Note: Parallel execution requested but running sequentially for reliability');
        }

        // Execute each PRD in the stage sequentially
        for (const prdId of stage.prds) {
          console.log(`\n  🔄 Starting PRD-${prdId}...`);
          
          const result = await this.executeSinglePRD(prdId);
          this.results.push(result);
          
          if (result.success) {
            console.log(`  ✅ PRD-${prdId} completed successfully`);
          } else {
            console.error(`  ❌ PRD-${prdId} failed: ${result.error}`);
            console.log('\n🛑 Stopping workflow due to failure (fail-fast approach)');
            return {
              success: false,
              completedPRDs: this.results.filter(r => r.success).map(r => r.prdId),
              failedPRDs: this.results.filter(r => !r.success).map(r => r.prdId),
              error: `Workflow stopped at PRD-${prdId}: ${result.error}`
            };
          }
        }
        
        console.log(`✅ Stage "${stage.name}" completed`);
      }

      // All stages completed successfully
      console.log('\n🎉 Sequential Workflow Completed Successfully!');
      
      return {
        success: true,
        completedPRDs: this.results.filter(r => r.success).map(r => r.prdId),
        failedPRDs: this.results.filter(r => !r.success).map(r => r.prdId),
        totalDuration: this.results.reduce((sum, r) => sum + (r.duration || 0), 0),
        results: this.results
      };

    } catch (error) {
      console.error(`❌ Sequential workflow failed: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Execute a single PRD using the proven WorkflowController approach
   * This mimics the user's working command: "orch start PRD-X.X.X with real agents"
   */
  async executeSinglePRD(prdId) {
    const startTime = Date.now();
    
    try {
      // Resolve PRD path using the same logic as the working orch start command
      const prdPath = this.resolvePRDPath(prdId);
      if (!prdPath) {
        return {
          prdId,
          success: false,
          error: `PRD path not found for ${prdId}`,
          duration: 0
        };
      }

      console.log(`    📄 PRD Path: ${prdPath}`);
      console.log(`    🤖 Using WorkflowController.orchestrateFeature()...`);

      // Use the proven WorkflowController.orchestrateFeature method
      // This is the same approach that works in your command
      const orchestrationResult = await this.workflowController.orchestrateFeature(
        prdPath, 
        prdId,
        {
          autonomous: true,
          doItFully: true,
          withRealAgents: true
        }
      );

      const duration = (Date.now() - startTime) / 1000 / 60; // in minutes

      return {
        prdId,
        success: orchestrationResult.success,
        error: orchestrationResult.success ? null : orchestrationResult.error,
        duration,
        details: orchestrationResult
      };

    } catch (error) {
      const duration = (Date.now() - startTime) / 1000 / 60;
      
      return {
        prdId,
        success: false,
        error: error.message,
        duration,
        details: null
      };
    }
  }

  /**
   * Resolve PRD file path - same logic as MultiPRDOrchestrator but simpler
   */
  resolvePRDPath(prdId) {
    // Use the same PRD mappings as before, but simplified
    const prdMappings = {
      '1.1.2.1': 'app/PRDs/M0/1.1/Phase-3A-Backend-API/PRD-1.1.2.1-express-server.md',
      '1.1.2.2': 'app/PRDs/M0/1.1/Phase-3A-Backend-API/PRD-1.1.2.2-cors-configuration.md',
      '1.1.2.3': 'app/PRDs/M0/1.1/Phase-3A-Backend-API/PRD-1.1.2.3-socketio-server.md',
      '1.1.2.4': 'app/PRDs/M0/1.1/Phase-3A-Backend-API/PRD-1.1.2.4-message-post-endpoint.md',
      '1.1.2.5': 'app/PRDs/M0/1.1/Phase-3A-Backend-API/PRD-1.1.2.5-message-get-endpoint.md',
      '1.1.2.6': 'app/PRDs/M0/1.1/Phase-3A-Backend-API/PRD-1.1.2.6-socket-message-handler.md',
      '1.1.2.7': 'app/PRDs/M0/1.1/Phase-3A-Backend-API/PRD-1.1.2.7-socket-broadcast.md',
      '1.1.1.2': 'app/PRDs/M0/1.1/Phase-1-Independent/PRD-1.1.1.2-users-table.md',
      '1.1.1.3': 'app/PRDs/M0/1.1/Phase-2-Database-Schema/PRD-1.1.1.3-conversations-table.md',
      '1.1.1.4': 'app/PRDs/M0/1.1/Phase-2-Database-Schema/PRD-1.1.1.4-messages-table.md',
      '1.1.3.1': 'app/PRDs/M0/1.1/Phase-1-Independent/PRD-1.1.3.1-react-vite-setup.md',
      '1.1.3.3': 'app/PRDs/M0/1.1/Phase-3B-Frontend-Foundation/PRD-1.1.3.3-tailwindcss-setup.md',
      '1.1.3.4': 'app/PRDs/M0/1.1/Phase-3B-Frontend-Foundation/PRD-1.1.3.4-base-layout.md',
      '1.1.5.1': 'app/PRDs/M0/1.1/Phase-1-Independent/PRD-1.1.5.1-cloudinary-setup.md'
    };

    if (prdMappings[prdId]) {
      const projectRoot = path.resolve(__dirname, '../../..');
      return path.join(projectRoot, prdMappings[prdId]);
    }

    console.warn(`⚠️  PRD mapping not found for ${prdId}`);
    return null;
  }

  /**
   * Get a summary of the current results
   */
  getSummary() {
    const successful = this.results.filter(r => r.success);
    const failed = this.results.filter(r => !r.success);
    const totalTime = this.results.reduce((sum, r) => sum + (r.duration || 0), 0);

    return {
      total: this.results.length,
      successful: successful.length,
      failed: failed.length,
      successRate: this.results.length > 0 ? (successful.length / this.results.length) * 100 : 0,
      totalTimeMinutes: totalTime,
      averageTimePerPRD: this.results.length > 0 ? totalTime / this.results.length : 0
    };
  }
}

// Convenience function for direct usage
export async function runSequentialWorkflow(workflowDescription) {
  const runner = new SequentialWorkflowRunner();
  return await runner.executeSequentialWorkflow(workflowDescription);
}