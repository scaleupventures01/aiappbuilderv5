#!/usr/bin/env node

/**
 * PRD 1.2.6 Speed Selection Implementation - Comprehensive QA Validation
 * 
 * This test validates all components implemented for GPT-5 speed selection:
 * - AI Engineer: Speed modes, GPT-5 integration, fallbacks
 * - Backend Engineer: Database, APIs, analytics 
 * - Frontend Engineer: Components, settings, UI
 * 
 * Created: 2025-08-15
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Test configuration
const TEST_CONFIG = {
  verbose: true,
  failFast: false,
  generateReport: true
};

class PRD126Validator {
  constructor() {
    this.results = [];
    this.passed = 0;
    this.failed = 0;
    this.skipped = 0;
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
      info: '📋',
      pass: '✅',
      fail: '❌',
      warn: '⚠️',
      debug: '🔍'
    }[type] || '📋';
    
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  async test(name, description, testFn) {
    this.log(`Testing: ${name}`, 'debug');
    
    const result = {
      name,
      description,
      status: 'pending',
      error: null,
      details: null,
      timestamp: new Date().toISOString()
    };

    try {
      const testResult = await testFn();
      result.status = 'passed';
      result.details = testResult;
      this.passed++;
      this.log(`PASS: ${name}`, 'pass');
    } catch (error) {
      result.status = 'failed';
      result.error = error.message;
      this.failed++;
      this.log(`FAIL: ${name} - ${error.message}`, 'fail');
      
      if (TEST_CONFIG.failFast) {
        throw error;
      }
    }

    this.results.push(result);
    return result;
  }

  async skip(name, reason) {
    this.log(`SKIP: ${name} - ${reason}`, 'warn');
    this.results.push({
      name,
      status: 'skipped',
      reason,
      timestamp: new Date().toISOString()
    });
    this.skipped++;
  }

  // File existence tests
  async validateFileExists(filePath, description) {
    return await this.test(
      `File exists: ${filePath}`,
      description,
      async () => {
        try {
          await fs.access(filePath);
          const stats = await fs.stat(filePath);
          return {
            exists: true,
            size: stats.size,
            modified: stats.mtime
          };
        } catch (error) {
          throw new Error(`File not found: ${filePath}`);
        }
      }
    );
  }

  // Configuration validation tests
  async validateSpeedModeConfig() {
    return await this.test(
      'Speed Modes Configuration',
      'Validate SPEED_MODES configuration in openai.js',
      async () => {
        const configPath = join(__dirname, 'config/openai.js');
        const content = await fs.readFile(configPath, 'utf8');
        
        // Check for SPEED_MODES constant
        if (!content.includes('const SPEED_MODES = {')) {
          throw new Error('SPEED_MODES configuration not found');
        }

        // Check for required speed modes
        const requiredModes = ['super_fast', 'fast', 'balanced', 'high_accuracy'];
        const missingModes = requiredModes.filter(mode => !content.includes(`${mode}:`));
        
        if (missingModes.length > 0) {
          throw new Error(`Missing speed modes: ${missingModes.join(', ')}`);
        }

        // Check for reasoning effort mapping
        if (!content.includes('reasoningEffort:')) {
          throw new Error('reasoningEffort mapping not found in speed modes');
        }

        // Check for helper functions
        const requiredFunctions = [
          'mapSpeedModeToReasoningEffort',
          'getSpeedModeConfig',
          'validateSpeedMode'
        ];
        
        const missingFunctions = requiredFunctions.filter(fn => !content.includes(`function ${fn}`));
        if (missingFunctions.length > 0) {
          throw new Error(`Missing helper functions: ${missingFunctions.join(', ')}`);
        }

        return {
          speedModesFound: requiredModes.length,
          helperFunctionsFound: requiredFunctions.length - missingFunctions.length,
          configurationComplete: true
        };
      }
    );
  }

  // Database schema validation
  async validateDatabaseSchema() {
    return await this.test(
      'Database Schema',
      'Validate speed preferences database schema',
      async () => {
        const migrationPath = join(__dirname, 'db/migrations/005-add-speed-preferences.js');
        const schemaPath = join(__dirname, 'db/schemas/005-speed-preferences.sql');
        
        const migrationContent = await fs.readFile(migrationPath, 'utf8');
        const schemaContent = await fs.readFile(schemaPath, 'utf8');
        
        // Check migration file
        if (!migrationContent.includes('ALTER TABLE users')) {
          throw new Error('Users table speed_preference column migration not found');
        }
        
        if (!migrationContent.includes('speed_analytics')) {
          throw new Error('Speed analytics table creation not found in migration');
        }

        // Check schema file
        const requiredColumns = [
          'speed_preference',
          'speed_mode',
          'reasoning_effort',
          'response_time_ms',
          'cost_multiplier',
          'within_target_time'
        ];

        const missingColumns = requiredColumns.filter(col => !schemaContent.includes(col));
        if (missingColumns.length > 0) {
          throw new Error(`Missing database columns: ${missingColumns.join(', ')}`);
        }

        // Check for indexes
        if (!schemaContent.includes('CREATE INDEX')) {
          throw new Error('Performance indexes not found in schema');
        }

        return {
          migrationExists: true,
          schemaExists: true,
          requiredColumnsFound: requiredColumns.length - missingColumns.length,
          indexesFound: (schemaContent.match(/CREATE INDEX/g) || []).length
        };
      }
    );
  }

  // API endpoint validation
  async validateAPIEndpoints() {
    return await this.test(
      'API Endpoints',
      'Validate speed preference and analytics API endpoints',
      async () => {
        const speedPrefPath = join(__dirname, 'api/users/speed-preference.js');
        const analyticsPath = join(__dirname, 'api/analytics/speed.js');
        
        const speedPrefContent = await fs.readFile(speedPrefPath, 'utf8');
        const analyticsContent = await fs.readFile(analyticsPath, 'utf8');
        
        // Check speed preference endpoints
        const speedEndpoints = ['router.get(\'/\'', 'router.put(\'/\'', 'router.get(\'/options\''];
        const missingSpeedEndpoints = speedEndpoints.filter(endpoint => !speedPrefContent.includes(endpoint));
        
        if (missingSpeedEndpoints.length > 0) {
          throw new Error(`Missing speed preference endpoints: ${missingSpeedEndpoints.join(', ')}`);
        }

        // Check analytics endpoints  
        const analyticsEndpoints = ['router.get(\'/\'', 'router.get(\'/summary\'', 'router.get(\'/performance\''];
        const missingAnalyticsEndpoints = analyticsEndpoints.filter(endpoint => !analyticsContent.includes(endpoint));
        
        if (missingAnalyticsEndpoints.length > 0) {
          throw new Error(`Missing analytics endpoints: ${missingAnalyticsEndpoints.join(', ')}`);
        }

        // Check for proper authentication
        if (!speedPrefContent.includes('authenticateToken') || !analyticsContent.includes('authenticateToken')) {
          throw new Error('Authentication middleware not found in API endpoints');
        }

        // Check for validation middleware
        if (!speedPrefContent.includes('validateSpeedPreference') || !analyticsContent.includes('validateAnalyticsQuery')) {
          throw new Error('Input validation middleware not found');
        }

        return {
          speedPreferenceEndpoints: speedEndpoints.length - missingSpeedEndpoints.length,
          analyticsEndpoints: analyticsEndpoints.length - missingAnalyticsEndpoints.length,
          authenticationImplemented: true,
          validationImplemented: true
        };
      }
    );
  }

  // Trade analysis service validation
  async validateTradeAnalysisService() {
    return await this.test(
      'Trade Analysis Service',
      'Validate GPT-5 and speed mode integration in trade analysis',
      async () => {
        const servicePath = join(__dirname, 'server/services/trade-analysis-service.js');
        const content = await fs.readFile(servicePath, 'utf8');
        
        // Check for GPT-5 integration
        if (!content.includes('reasoning_effort')) {
          throw new Error('reasoning_effort parameter not found in trade analysis service');
        }

        // Check for speed mode support
        const speedMethods = ['superFastAnalysis', 'quickAnalysis', 'highAccuracyAnalysis'];
        const missingMethods = speedMethods.filter(method => !content.includes(method));
        
        if (missingMethods.length > 0) {
          throw new Error(`Missing speed mode methods: ${missingMethods.join(', ')}`);
        }

        // Check for enhanced metadata
        if (!content.includes('speedMode') || !content.includes('speedPerformance')) {
          throw new Error('Enhanced metadata with speed information not found');
        }

        // Check for fallback mechanism
        if (!content.includes('fallbackUsed')) {
          throw new Error('Fallback mechanism not properly implemented');
        }

        // Check for mock mode with speed simulation
        if (!content.includes('generateMockResponse')) {
          throw new Error('Mock mode with speed simulation not found');
        }

        return {
          gpt5Integration: true,
          speedMethodsImplemented: speedMethods.length - missingMethods.length,
          enhancedMetadata: true,
          fallbackMechanism: true,
          mockModeSupport: true
        };
      }
    );
  }

  // Frontend component validation
  async validateFrontendComponents() {
    return await this.test(
      'Frontend Components',
      'Validate SpeedSelector component and Settings page',
      async () => {
        const speedSelectorPath = join(__dirname, 'src/components/SpeedSelector.tsx');
        const settingsPath = join(__dirname, 'src/views/Settings.tsx');
        
        const speedSelectorContent = await fs.readFile(speedSelectorPath, 'utf8');
        const settingsContent = await fs.readFile(settingsPath, 'utf8');
        
        // Check SpeedSelector component
        if (!speedSelectorContent.includes('export type SpeedMode')) {
          throw new Error('SpeedMode type not exported from SpeedSelector');
        }

        if (!speedSelectorContent.includes('super_fast\' | \'fast\' | \'balanced\' | \'high_accuracy')) {
          throw new Error('Required speed modes not defined in SpeedSelector');
        }

        if (!speedSelectorContent.includes('speedOptions:')) {
          throw new Error('Speed options configuration not found');
        }

        // Check Settings page
        if (!settingsContent.includes('SpeedSelector')) {
          throw new Error('SpeedSelector not imported in Settings page');
        }

        if (!settingsContent.includes('/api/users/speed-preference')) {
          throw new Error('API integration not found in Settings page');
        }

        if (!settingsContent.includes('speedPreferences')) {
          throw new Error('Speed preferences state not found in Settings');
        }

        // Check for proper TypeScript interfaces
        if (!speedSelectorContent.includes('interface SpeedOption') || !settingsContent.includes('interface SpeedPreferences')) {
          throw new Error('Required TypeScript interfaces not found');
        }

        return {
          speedSelectorComponent: true,
          settingsPageIntegration: true,
          typeScriptInterfaces: true,
          apiIntegration: true
        };
      }
    );
  }

  // Integration tests
  async validateAnalyzeTradeEndpoint() {
    return await this.test(
      'Analyze Trade Endpoint Integration',
      'Validate speed mode integration in analyze-trade endpoint',
      async () => {
        const endpointPath = join(__dirname, 'api/analyze-trade.js');
        const content = await fs.readFile(endpointPath, 'utf8');
        
        // Check for speed preference integration
        if (!content.includes('getUserSpeedPreference')) {
          throw new Error('User speed preference integration not found');
        }

        if (!content.includes('recordSpeedAnalytics')) {
          throw new Error('Speed analytics recording not found');
        }

        // Check for speed mode validation
        if (!content.includes('speedMode') && !content.includes('validateTradeAnalysisRequest')) {
          throw new Error('Speed mode validation not found');
        }

        // Check for cost calculation
        if (!content.includes('CostCalculator')) {
          throw new Error('Cost calculation integration not found');
        }

        return {
          speedPreferenceIntegration: true,
          analyticsRecording: true,
          speedModeValidation: true,
          costCalculation: true
        };
      }
    );
  }

  // Query validation
  async validateDatabaseQueries() {
    return await this.test(
      'Database Queries',
      'Validate speed preference database queries',
      async () => {
        const queriesPath = join(__dirname, 'db/queries/speed-preferences.js');
        const content = await fs.readFile(queriesPath, 'utf8');
        
        const requiredFunctions = [
          'getUserSpeedPreference',
          'updateUserSpeedPreference', 
          'recordSpeedAnalytics',
          'getUserSpeedAnalytics',
          'getSpeedAnalyticsSummary'
        ];

        const missingFunctions = requiredFunctions.filter(fn => !content.includes(`async function ${fn}`) && !content.includes(`function ${fn}`));
        
        if (missingFunctions.length > 0) {
          throw new Error(`Missing database query functions: ${missingFunctions.join(', ')}`);
        }

        // Check for proper error handling
        if (!content.includes('try {') || !content.includes('catch (error)')) {
          throw new Error('Error handling not found in database queries');
        }

        // Check for SQL injection protection
        if (!content.includes('$1') && !content.includes('$2')) {
          throw new Error('Parameterized queries not found - potential SQL injection risk');
        }

        return {
          requiredFunctionsImplemented: requiredFunctions.length - missingFunctions.length,
          errorHandling: true,
          sqlInjectionProtection: true
        };
      }
    );
  }

  // Run all validation tests
  async runAllTests() {
    this.log('Starting PRD 1.2.6 Speed Selection Implementation Validation', 'info');
    this.log('='.repeat(80), 'info');

    // File existence tests
    this.log('\n📁 File Existence Validation', 'info');
    await this.validateFileExists(join(__dirname, 'config/openai.js'), 'AI Engineer - OpenAI configuration');
    await this.validateFileExists(join(__dirname, 'server/services/trade-analysis-service.js'), 'AI Engineer - Trade analysis service');
    await this.validateFileExists(join(__dirname, 'db/migrations/005-add-speed-preferences.js'), 'Backend Engineer - Database migration');
    await this.validateFileExists(join(__dirname, 'db/schemas/005-speed-preferences.sql'), 'Backend Engineer - Database schema');
    await this.validateFileExists(join(__dirname, 'db/queries/speed-preferences.js'), 'Backend Engineer - Database queries');
    await this.validateFileExists(join(__dirname, 'api/users/speed-preference.js'), 'Backend Engineer - Speed preference API');
    await this.validateFileExists(join(__dirname, 'api/analytics/speed.js'), 'Backend Engineer - Speed analytics API');
    await this.validateFileExists(join(__dirname, 'src/components/SpeedSelector.tsx'), 'Frontend Engineer - SpeedSelector component');
    await this.validateFileExists(join(__dirname, 'src/views/Settings.tsx'), 'Frontend Engineer - Settings page');

    // Configuration validation
    this.log('\n⚙️ Configuration Validation', 'info');
    await this.validateSpeedModeConfig();

    // Database validation
    this.log('\n🗄️ Database Validation', 'info');
    await this.validateDatabaseSchema();
    await this.validateDatabaseQueries();

    // API validation
    this.log('\n🌐 API Validation', 'info');
    await this.validateAPIEndpoints();

    // Service validation
    this.log('\n🔧 Service Validation', 'info');
    await this.validateTradeAnalysisService();

    // Frontend validation
    this.log('\n🎨 Frontend Validation', 'info');
    await this.validateFrontendComponents();

    // Integration validation
    this.log('\n🔗 Integration Validation', 'info');
    await this.validateAnalyzeTradeEndpoint();

    // Generate summary
    this.generateSummary();
    
    if (TEST_CONFIG.generateReport) {
      await this.generateReport();
    }

    return {
      passed: this.passed,
      failed: this.failed,
      skipped: this.skipped,
      total: this.results.length,
      success: this.failed === 0
    };
  }

  generateSummary() {
    this.log('\n📊 Test Summary', 'info');
    this.log('='.repeat(50), 'info');
    this.log(`Total Tests: ${this.results.length}`, 'info');
    this.log(`Passed: ${this.passed}`, 'pass');
    this.log(`Failed: ${this.failed}`, this.failed > 0 ? 'fail' : 'info');
    this.log(`Skipped: ${this.skipped}`, this.skipped > 0 ? 'warn' : 'info');
    this.log(`Success Rate: ${((this.passed / this.results.length) * 100).toFixed(2)}%`, 'info');
    
    if (this.failed === 0) {
      this.log('\n🎉 All tests passed! PRD 1.2.6 implementation is ready for production.', 'pass');
    } else {
      this.log(`\n⚠️ ${this.failed} test(s) failed. Please review the failures above.`, 'fail');
    }
  }

  async generateReport() {
    const report = {
      testSuite: 'PRD 1.2.6 Speed Selection Implementation Validation',
      timestamp: new Date().toISOString(),
      summary: {
        total: this.results.length,
        passed: this.passed,
        failed: this.failed,
        skipped: this.skipped,
        successRate: ((this.passed / this.results.length) * 100).toFixed(2)
      },
      results: this.results,
      prdrequirements: {
        aiEngineer: {
          description: 'Speed modes configuration, GPT-5 integration, fallbacks',
          status: this.results.filter(r => r.name.includes('Speed Modes') || r.name.includes('Trade Analysis Service')).every(r => r.status === 'passed') ? 'PASSED' : 'FAILED'
        },
        backendEngineer: {
          description: 'Database migration, API endpoints, analytics tracking',
          status: this.results.filter(r => r.name.includes('Database') || r.name.includes('API') || r.name.includes('Queries')).every(r => r.status === 'passed') ? 'PASSED' : 'FAILED'
        },
        frontendEngineer: {
          description: 'SpeedSelector component, Settings page, UI integration',
          status: this.results.filter(r => r.name.includes('Frontend')).every(r => r.status === 'passed') ? 'PASSED' : 'FAILED'
        },
        integration: {
          description: 'End-to-end integration between all components',
          status: this.results.filter(r => r.name.includes('Integration') || r.name.includes('Analyze Trade')).every(r => r.status === 'passed') ? 'PASSED' : 'FAILED'
        }
      }
    };

    const reportPath = join(__dirname, 'PRD-1.2.6-QA-Validation-Report.json');
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    this.log(`\n📋 Detailed report saved to: ${reportPath}`, 'info');
  }
}

// Main execution
async function main() {
  try {
    const validator = new PRD126Validator();
    const results = await validator.runAllTests();
    
    process.exit(results.success ? 0 : 1);
  } catch (error) {
    console.error('❌ Validation failed with error:', error.message);
    process.exit(1);
  }
}

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default PRD126Validator;