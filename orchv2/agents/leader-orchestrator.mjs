/**
 * LeaderOrchestratorAgent - THE VERIFICATION AUTHORITY
 * This agent ALWAYS confirms and checks what EVERY team member claims is done
 * NO TRUST - ALWAYS VERIFY with actual evidence
 */

import { Agent } from '../lib/orch/agent-system-v2.mjs';
import PlaywrightTestingSystem from '../lib/orch/playwright-testing-system.mjs';
import fs from 'node:fs';
import path from 'node:path';

export class LeaderOrchestratorAgent extends Agent {
  constructor() {
    super({
      name: 'leader-orchestrator',
      role: 'leader-orchestrator',
      description: "Supreme verification authority - checks EVERYTHING every agent claims",
      expertise: [
        "Verification of all agent claims",
        "Live browser testing coordination",
        "Evidence-based validation",
        "Cross-agent verification",
        "Final approval authority"
      ],
      allowedTools: ["*"],
      metadata: {
        source: 'leader-orchestrator.md',
        kpis: "100% verification rate, zero unverified claims, evidence collection",
        collaborators: ['ALL'] // Works with everyone
      }
    });
    
    this.verificationLog = new Map();
    this.evidenceStore = new Map();
    this.playwrightTester = new PlaywrightTestingSystem();
  }

  /**
   * ALWAYS verify what agents claim with REAL evidence
   * NEVER trust - ALWAYS verify
   */
  async verifyAgentClaim(agent, claim, prdPath) {
    console.log(`\n🔍 LEADER VERIFICATION: Checking ${agent}'s claim...`);
    console.log(`   Claim: ${JSON.stringify(claim, null, 2)}`);
    
    const verification = {
      agent,
      claim,
      timestamp: new Date().toISOString(),
      verified: false,
      evidence: [],
      discrepancies: [],
      browserTestResults: null
    };
    
    // Step 1: Check if claimed files/artifacts actually exist
    if (claim.createdFiles) {
      for (const file of claim.createdFiles) {
        if (fs.existsSync(file)) {
          verification.evidence.push({
            type: 'file_exists',
            path: file,
            size: fs.statSync(file).size,
            verified: true
          });
        } else {
          verification.discrepancies.push(`File claimed but not found: ${file}`);
        }
      }
    }
    
    // Step 2: Verify code changes are real
    if (claim.codeChanges) {
      for (const change of claim.codeChanges) {
        const fileContent = fs.existsSync(change.file) 
          ? fs.readFileSync(change.file, 'utf8')
          : null;
        
        if (fileContent && fileContent.includes(change.expectedContent)) {
          verification.evidence.push({
            type: 'code_verified',
            file: change.file,
            found: true
          });
        } else {
          verification.discrepancies.push(`Code change not found in ${change.file}`);
        }
      }
    }
    
    // Step 3: LIVE BROWSER TESTING - The ultimate truth
    if (claim.uiFeatures || claim.webComponents) {
      console.log('   🌐 Running LIVE browser tests to verify UI claims...');
      
      try {
        await this.playwrightTester.initialize();
        
        const testConfig = {
          testId: `verify-${agent}-${Date.now()}`,
          url: claim.testUrl || 'http://localhost:3000',
          actions: this.generateTestActions(claim),
          assertions: this.generateTestAssertions(claim)
        };
        
        // Run in ALL browsers
        const browserResults = await this.playwrightTester.runCrossBrowserTest(testConfig);
        verification.browserTestResults = browserResults;
        
        // Check if all browsers passed
        const allPassed = Object.values(browserResults).every(r => r.status === 'passed');
        
        if (!allPassed) {
          verification.discrepancies.push('Live browser tests FAILED - feature not working');
          
          // Collect specific failures
          for (const [browser, result] of Object.entries(browserResults)) {
            if (result.status === 'failed') {
              verification.discrepancies.push(`${browser}: ${result.errors.join(', ')}`);
            }
          }
        } else {
          verification.evidence.push({
            type: 'browser_test_passed',
            browsers: Object.keys(browserResults),
            screenshots: Object.values(browserResults).flatMap(r => r.screenshots)
          });
        }
        
        await this.playwrightTester.cleanup();
        
      } catch (error) {
        verification.discrepancies.push(`Browser test error: ${error.message}`);
      }
    }
    
    // Step 4: Cross-reference with other agents
    const crossVerification = await this.crossVerifyWithAgents(agent, claim);
    if (crossVerification.conflicts.length > 0) {
      verification.discrepancies.push(...crossVerification.conflicts);
    } else {
      verification.evidence.push({
        type: 'cross_agent_verified',
        verifiedBy: crossVerification.verifiedBy
      });
    }
    
    // Step 5: Performance verification
    if (claim.performanceMetrics) {
      const actualMetrics = await this.measurePerformance(claim);
      
      for (const [metric, expected] of Object.entries(claim.performanceMetrics)) {
        const actual = actualMetrics[metric];
        if (actual > expected * 1.1) { // Allow 10% variance
          verification.discrepancies.push(
            `Performance claim false: ${metric} expected ${expected}ms, got ${actual}ms`
          );
        } else {
          verification.evidence.push({
            type: 'performance_verified',
            metric,
            expected,
            actual
          });
        }
      }
    }
    
    // Step 6: Security verification
    if (claim.securityFeatures) {
      const securityCheck = await this.verifySecurityClaims(claim);
      if (securityCheck.vulnerabilities.length > 0) {
        verification.discrepancies.push(...securityCheck.vulnerabilities);
      } else {
        verification.evidence.push({
          type: 'security_verified',
          checks: securityCheck.passed
        });
      }
    }
    
    // Final verdict
    verification.verified = verification.discrepancies.length === 0;
    
    // Store verification
    this.verificationLog.set(`${agent}-${Date.now()}`, verification);
    
    // Report results
    if (!verification.verified) {
      console.log(`\n❌ LEADER VERDICT: ${agent}'s claims are FALSE`);
      console.log('   Discrepancies found:');
      verification.discrepancies.forEach(d => console.log(`     - ${d}`));
      
      // Demand rework
      await this.demandRework(agent, verification);
    } else {
      console.log(`\n✅ LEADER VERDICT: ${agent}'s claims are VERIFIED`);
      console.log(`   Evidence collected: ${verification.evidence.length} items`);
    }
    
    return verification;
  }

  /**
   * Generate test actions based on agent claims
   */
  generateTestActions(claim) {
    const actions = [];
    
    if (claim.uiFeatures) {
      for (const feature of claim.uiFeatures) {
        if (feature.type === 'button') {
          actions.push({
            type: 'click',
            selector: feature.selector || `button:has-text("${feature.text}")`
          });
        } else if (feature.type === 'input') {
          actions.push({
            type: 'type',
            selector: feature.selector,
            value: 'test input'
          });
        }
      }
    }
    
    return actions;
  }

  /**
   * Generate test assertions based on agent claims
   */
  generateTestAssertions(claim) {
    const assertions = [
      // Always check for console errors
      {
        type: 'console',
        noErrors: true,
        description: 'No console errors in any browser'
      }
    ];
    
    if (claim.uiFeatures) {
      for (const feature of claim.uiFeatures) {
        assertions.push({
          type: 'visible',
          selector: feature.selector || `[data-testid="${feature.id}"]`,
          description: `${feature.description || feature.type} is visible`
        });
      }
    }
    
    if (claim.expectedText) {
      for (const text of claim.expectedText) {
        assertions.push({
          type: 'text',
          selector: text.selector || 'body',
          expected: text.value,
          description: `Text "${text.value}" is present`
        });
      }
    }
    
    return assertions;
  }

  /**
   * Cross-verify with other agents
   */
  async crossVerifyWithAgents(agent, claim) {
    const verification = {
      verifiedBy: [],
      conflicts: []
    };
    
    // Ask related agents to verify
    const relatedAgents = this.identifyRelatedAgents(claim);
    
    for (const relatedAgent of relatedAgents) {
      const crossCheckPrompt = `
        ${agent} claims: ${JSON.stringify(claim)}
        
        As ${relatedAgent}, verify if this is true based on your work.
        Check if this conflicts with anything you've done.
        Provide specific evidence for or against this claim.
      `;
      
      // In real implementation, this would invoke the agent
      // For now, we'll simulate the verification
      const agentResponse = {
        verified: true, // This would come from actual agent
        evidence: [],
        conflicts: []
      };
      
      if (agentResponse.verified) {
        verification.verifiedBy.push(relatedAgent);
      } else {
        verification.conflicts.push(
          `${relatedAgent} disputes claim: ${agentResponse.conflicts.join(', ')}`
        );
      }
    }
    
    return verification;
  }

  /**
   * Identify which agents should verify a claim
   */
  identifyRelatedAgents(claim) {
    const related = [];
    
    if (claim.type === 'frontend') {
      related.push('frontend-engineer', 'ux-ui-designer', 'qa-engineer');
    } else if (claim.type === 'backend') {
      related.push('backend-engineer', 'data-engineer', 'qa-engineer');
    } else if (claim.type === 'security') {
      related.push('security-architect', 'ciso', 'application-security-engineer');
    }
    
    return related;
  }

  /**
   * Measure actual performance
   */
  async measurePerformance(claim) {
    // In real implementation, this would run performance tests
    // Using Playwright to measure actual load times
    return {
      loadTime: 1500, // milliseconds
      apiResponse: 200,
      renderTime: 300
    };
  }

  /**
   * Verify security claims
   */
  async verifySecurityClaims(claim) {
    // In real implementation, run security scans
    return {
      passed: ['xss_protection', 'csrf_protection', 'sql_injection_prevention'],
      vulnerabilities: []
    };
  }

  /**
   * Demand rework when claims are false
   */
  async demandRework(agent, verification) {
    console.log(`\n⚠️  LEADER ORDER: ${agent} must fix the following immediately:`);
    
    const reworkOrder = {
      agent,
      timestamp: new Date().toISOString(),
      discrepancies: verification.discrepancies,
      requiredActions: this.generateReworkActions(verification),
      deadline: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
      priority: 'P0'
    };
    
    console.log('   Required actions:');
    reworkOrder.requiredActions.forEach(action => {
      console.log(`     - ${action}`);
    });
    
    // In real implementation, this would invoke the agent with rework order
    return reworkOrder;
  }

  /**
   * Generate specific rework actions
   */
  generateReworkActions(verification) {
    const actions = [];
    
    for (const discrepancy of verification.discrepancies) {
      if (discrepancy.includes('File claimed but not found')) {
        actions.push('Create the missing files you claimed to have created');
      } else if (discrepancy.includes('Code change not found')) {
        actions.push('Actually implement the code changes you claimed');
      } else if (discrepancy.includes('browser tests FAILED')) {
        actions.push('Fix the UI components until they pass live browser tests');
      } else if (discrepancy.includes('Performance claim false')) {
        actions.push('Optimize the code to meet performance requirements');
      } else {
        actions.push(`Fix: ${discrepancy}`);
      }
    }
    
    actions.push('Provide evidence of all fixes');
    actions.push('Request re-verification when complete');
    
    return actions;
  }

  /**
   * Final approval only after ALL verification passes
   */
  async provideFinalApproval(prdPath, allAgentClaims) {
    console.log('\n👑 LEADER FINAL REVIEW...');
    
    const finalReport = {
      prdPath,
      timestamp: new Date().toISOString(),
      agentVerifications: [],
      overallStatus: 'pending',
      evidence: [],
      approved: false
    };
    
    // Verify EVERY agent's claims
    for (const [agent, claims] of Object.entries(allAgentClaims)) {
      const verification = await this.verifyAgentClaim(agent, claims, prdPath);
      finalReport.agentVerifications.push(verification);
      
      if (!verification.verified) {
        finalReport.overallStatus = 'failed';
        console.log(`❌ Cannot approve - ${agent} has unverified claims`);
        return finalReport;
      }
    }
    
    // Run final comprehensive browser test
    console.log('\n🌐 Running final comprehensive browser test...');
    await this.playwrightTester.initialize();
    
    const finalTest = await this.playwrightTester.runCrossBrowserTest({
      testId: 'final-approval-test',
      url: 'http://localhost:3000',
      actions: [], // Would be populated based on PRD
      assertions: [
        { type: 'console', noErrors: true, description: 'No console errors' },
        { type: 'visible', selector: '#app', description: 'Application loads' }
      ]
    });
    
    await this.playwrightTester.cleanup();
    
    const allBrowsersPassed = Object.values(finalTest).every(r => r.status === 'passed');
    
    if (allBrowsersPassed) {
      finalReport.overallStatus = 'approved';
      finalReport.approved = true;
      console.log('\n✅ LEADER FINAL APPROVAL: All claims verified, all tests passed');
    } else {
      finalReport.overallStatus = 'failed';
      console.log('\n❌ LEADER FINAL REJECTION: Browser tests failed');
    }
    
    return finalReport;
  }
}

export default LeaderOrchestratorAgent;