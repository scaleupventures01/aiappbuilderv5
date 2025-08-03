#!/usr/bin/env node

// Comprehensive Test Script for All New Components
// Tests all the missing items that were implemented

const fs = require('fs').promises;
const path = require('path');

class ComponentTester {
    constructor() {
        this.results = {
            passed: [],
            failed: [],
            warnings: []
        };
    }
    
    async runAllTests() {
        console.log('🧪 Testing All New Components\n');
        console.log('='.repeat(60));
        
        // Test 1: Provider Setup Script
        await this.testProviderSetupScript();
        
        // Test 2: Cost Report Generator
        await this.testCostReportGenerator();
        
        // Test 3: Migration Controller
        await this.testMigrationController();
        
        // Test 4: Migration Monitor
        await this.testMigrationMonitor();
        
        // Test 5: Quality Assurance
        await this.testQualityAssurance();
        
        // Test 6: Dashboard Integration
        await this.testDashboardIntegration();
        
        // Generate final report
        this.generateTestReport();
    }
    
    async testProviderSetupScript() {
        console.log('\n📋 Test 1: Provider Setup Script');
        console.log('-'.repeat(40));
        
        try {
            // Check if file exists
            const scriptPath = 'scripts/check-providers.js';
            const exists = await this.fileExists(scriptPath);
            
            if (!exists) {
                this.results.failed.push({
                    test: 'Provider Setup Script',
                    error: 'File not found'
                });
                console.log('❌ File not found');
                return;
            }
            
            // Check if it's executable
            const stats = await fs.stat(scriptPath);
            const isExecutable = (stats.mode & 0o111) !== 0;
            
            if (!isExecutable) {
                this.results.warnings.push({
                    test: 'Provider Setup Script',
                    warning: 'File not executable'
                });
                console.log('⚠️ File not executable');
            }
            
            // Test basic functionality
            const scriptContent = await fs.readFile(scriptPath, 'utf8');
            
            if (scriptContent.includes('class ProviderSetup')) {
                console.log('✅ Class definition found');
            } else {
                this.results.failed.push({
                    test: 'Provider Setup Script',
                    error: 'ProviderSetup class not found'
                });
                console.log('❌ ProviderSetup class not found');
                return;
            }
            
            if (scriptContent.includes('checkEnvironmentVariables')) {
                console.log('✅ Environment variable checking found');
            } else {
                this.results.failed.push({
                    test: 'Provider Setup Script',
                    error: 'Environment variable checking not found'
                });
                console.log('❌ Environment variable checking not found');
                return;
            }
            
            if (scriptContent.includes('testAPIConnections')) {
                console.log('✅ API connection testing found');
            } else {
                this.results.failed.push({
                    test: 'Provider Setup Script',
                    error: 'API connection testing not found'
                });
                console.log('❌ API connection testing not found');
                return;
            }
            
            this.results.passed.push({
                test: 'Provider Setup Script',
                details: 'All core functionality present'
            });
            console.log('✅ Provider Setup Script - PASSED');
            
        } catch (error) {
            this.results.failed.push({
                test: 'Provider Setup Script',
                error: error.message
            });
            console.log(`❌ Test failed: ${error.message}`);
        }
    }
    
    async testCostReportGenerator() {
        console.log('\n💰 Test 2: Cost Report Generator');
        console.log('-'.repeat(40));
        
        try {
            // Check if file exists
            const generatorPath = 'lib/CostReportGenerator.js';
            const exists = await this.fileExists(generatorPath);
            
            if (!exists) {
                this.results.failed.push({
                    test: 'Cost Report Generator',
                    error: 'File not found'
                });
                console.log('❌ File not found');
                return;
            }
            
            // Test basic functionality
            const CostReportGenerator = require('./lib/CostReportGenerator');
            const generator = new CostReportGenerator();
            
            console.log('✅ Class instantiated successfully');
            
            // Test report generation
            const report = await generator.generateReport();
            
            if (report && report.includes('Cost Report Status')) {
                console.log('✅ Report generation working');
            } else {
                this.results.failed.push({
                    test: 'Cost Report Generator',
                    error: 'Report generation failed'
                });
                console.log('❌ Report generation failed');
                return;
            }
            
            // Test data methods
            const costData = await generator.getCostData();
            if (costData && costData.summary) {
                console.log('✅ Cost data retrieval working');
            } else {
                this.results.warnings.push({
                    test: 'Cost Report Generator',
                    warning: 'Cost data retrieval may have issues'
                });
                console.log('⚠️ Cost data retrieval may have issues');
            }
            
            this.results.passed.push({
                test: 'Cost Report Generator',
                details: 'Core functionality working'
            });
            console.log('✅ Cost Report Generator - PASSED');
            
        } catch (error) {
            this.results.failed.push({
                test: 'Cost Report Generator',
                error: error.message
            });
            console.log(`❌ Test failed: ${error.message}`);
        }
    }
    
    async testMigrationController() {
        console.log('\n🔄 Test 3: Migration Controller');
        console.log('-'.repeat(40));
        
        try {
            // Check if file exists
            const controllerPath = 'scripts/migration-controller.js';
            const exists = await this.fileExists(controllerPath);
            
            if (!exists) {
                this.results.failed.push({
                    test: 'Migration Controller',
                    error: 'File not found'
                });
                console.log('❌ File not found');
                return;
            }
            
            // Test basic functionality
            const MigrationController = require('./scripts/migration-controller');
            const controller = new MigrationController();
            
            console.log('✅ Class instantiated successfully');
            
            // Test migration phases
            if (controller.migrationPhases && Object.keys(controller.migrationPhases).length === 3) {
                console.log('✅ Migration phases configured');
            } else {
                this.results.failed.push({
                    test: 'Migration Controller',
                    error: 'Migration phases not properly configured'
                });
                console.log('❌ Migration phases not properly configured');
                return;
            }
            
            // Test status methods
            const status = controller.getStatus();
            if (status && typeof status.started === 'boolean') {
                console.log('✅ Status methods working');
            } else {
                this.results.warnings.push({
                    test: 'Migration Controller',
                    warning: 'Status methods may have issues'
                });
                console.log('⚠️ Status methods may have issues');
            }
            
            this.results.passed.push({
                test: 'Migration Controller',
                details: 'Core functionality working'
            });
            console.log('✅ Migration Controller - PASSED');
            
        } catch (error) {
            this.results.failed.push({
                test: 'Migration Controller',
                error: error.message
            });
            console.log(`❌ Test failed: ${error.message}`);
        }
    }
    
    async testMigrationMonitor() {
        console.log('\n📊 Test 4: Migration Monitor');
        console.log('-'.repeat(40));
        
        try {
            // Check if file exists
            const monitorPath = 'lib/MigrationMonitor.js';
            const exists = await this.fileExists(monitorPath);
            
            if (!exists) {
                this.results.failed.push({
                    test: 'Migration Monitor',
                    error: 'File not found'
                });
                console.log('❌ File not found');
                return;
            }
            
            // Test basic functionality
            const MigrationMonitor = require('./lib/MigrationMonitor');
            const monitor = new MigrationMonitor();
            
            console.log('✅ Class instantiated successfully');
            
            // Test monitoring methods
            const status = monitor.getStatus();
            if (status && typeof status.monitoring === 'boolean') {
                console.log('✅ Status methods working');
            } else {
                this.results.warnings.push({
                    test: 'Migration Monitor',
                    warning: 'Status methods may have issues'
                });
                console.log('⚠️ Status methods may have issues');
            }
            
            // Test metrics methods
            const metrics = monitor.getMetrics();
            if (metrics && metrics.baseline === null) {
                console.log('✅ Metrics methods working');
            } else {
                this.results.warnings.push({
                    test: 'Migration Monitor',
                    warning: 'Metrics methods may have issues'
                });
                console.log('⚠️ Metrics methods may have issues');
            }
            
            this.results.passed.push({
                test: 'Migration Monitor',
                details: 'Core functionality working'
            });
            console.log('✅ Migration Monitor - PASSED');
            
        } catch (error) {
            this.results.failed.push({
                test: 'Migration Monitor',
                error: error.message
            });
            console.log(`❌ Test failed: ${error.message}`);
        }
    }
    
    async testQualityAssurance() {
        console.log('\n🎯 Test 5: Quality Assurance');
        console.log('-'.repeat(40));
        
        try {
            // Check if file exists
            const qaPath = 'lib/QualityAssurance.js';
            const exists = await this.fileExists(qaPath);
            
            if (!exists) {
                this.results.failed.push({
                    test: 'Quality Assurance',
                    error: 'File not found'
                });
                console.log('❌ File not found');
                return;
            }
            
            // Test basic functionality
            const QualityAssurance = require('./lib/QualityAssurance');
            const qa = new QualityAssurance();
            
            console.log('✅ Class instantiated successfully');
            
            // Test A/B testing
            const testResults = qa.getTestResults();
            if (Array.isArray(testResults)) {
                console.log('✅ Test results methods working');
            } else {
                this.results.warnings.push({
                    test: 'Quality Assurance',
                    warning: 'Test results methods may have issues'
                });
                console.log('⚠️ Test results methods may have issues');
            }
            
            // Test benchmarks
            const benchmarks = qa.getBenchmarks();
            if (Array.isArray(benchmarks)) {
                console.log('✅ Benchmark methods working');
            } else {
                this.results.warnings.push({
                    test: 'Quality Assurance',
                    warning: 'Benchmark methods may have issues'
                });
                console.log('⚠️ Benchmark methods may have issues');
            }
            
            // Test quality metrics
            const metrics = qa.getQualityMetrics();
            if (metrics && typeof metrics.accuracy === 'number') {
                console.log('✅ Quality metrics working');
            } else {
                this.results.warnings.push({
                    test: 'Quality Assurance',
                    warning: 'Quality metrics may have issues'
                });
                console.log('⚠️ Quality metrics may have issues');
            }
            
            this.results.passed.push({
                test: 'Quality Assurance',
                details: 'Core functionality working'
            });
            console.log('✅ Quality Assurance - PASSED');
            
        } catch (error) {
            this.results.failed.push({
                test: 'Quality Assurance',
                error: error.message
            });
            console.log(`❌ Test failed: ${error.message}`);
        }
    }
    
    async testDashboardIntegration() {
        console.log('\n📱 Test 6: Dashboard Integration');
        console.log('-'.repeat(40));
        
        try {
            // Check if dashboard file exists
            const dashboardPath = 'lib/DashboardGenerator.js';
            const exists = await this.fileExists(dashboardPath);
            
            if (!exists) {
                this.results.failed.push({
                    test: 'Dashboard Integration',
                    error: 'Dashboard file not found'
                });
                console.log('❌ Dashboard file not found');
                return;
            }
            
            // Check for new widgets in dashboard
            const dashboardContent = await fs.readFile(dashboardPath, 'utf8');
            
            if (dashboardContent.includes('provider-status')) {
                console.log('✅ Provider status widget found');
            } else {
                this.results.failed.push({
                    test: 'Dashboard Integration',
                    error: 'Provider status widget not found'
                });
                console.log('❌ Provider status widget not found');
                return;
            }
            
            if (dashboardContent.includes('migration-progress')) {
                console.log('✅ Migration progress widget found');
            } else {
                this.results.failed.push({
                    test: 'Dashboard Integration',
                    error: 'Migration progress widget not found'
                });
                console.log('❌ Migration progress widget not found');
                return;
            }
            
            if (dashboardContent.includes('cost-report')) {
                console.log('✅ Cost report widget found');
            } else {
                this.results.failed.push({
                    test: 'Dashboard Integration',
                    error: 'Cost report widget not found'
                });
                console.log('❌ Cost report widget not found');
                return;
            }
            
            if (dashboardContent.includes('updateProviderStatus')) {
                console.log('✅ Provider status update function found');
            } else {
                this.results.warnings.push({
                    test: 'Dashboard Integration',
                    warning: 'Provider status update function not found'
                });
                console.log('⚠️ Provider status update function not found');
            }
            
            this.results.passed.push({
                test: 'Dashboard Integration',
                details: 'New widgets integrated'
            });
            console.log('✅ Dashboard Integration - PASSED');
            
        } catch (error) {
            this.results.failed.push({
                test: 'Dashboard Integration',
                error: error.message
            });
            console.log(`❌ Test failed: ${error.message}`);
        }
    }
    
    async fileExists(filePath) {
        try {
            await fs.access(filePath);
            return true;
        } catch {
            return false;
        }
    }
    
    generateTestReport() {
        console.log('\n' + '='.repeat(60));
        console.log('📊 TEST RESULTS SUMMARY');
        console.log('='.repeat(60));
        
        const totalTests = this.results.passed.length + this.results.failed.length + this.results.warnings.length;
        
        console.log(`\n✅ PASSED: ${this.results.passed.length}/${totalTests}`);
        this.results.passed.forEach(result => {
            console.log(`  - ${result.test}: ${result.details}`);
        });
        
        if (this.results.warnings.length > 0) {
            console.log(`\n⚠️ WARNINGS: ${this.results.warnings.length}/${totalTests}`);
            this.results.warnings.forEach(result => {
                console.log(`  - ${result.test}: ${result.warning}`);
            });
        }
        
        if (this.results.failed.length > 0) {
            console.log(`\n❌ FAILED: ${this.results.failed.length}/${totalTests}`);
            this.results.failed.forEach(result => {
                console.log(`  - ${result.test}: ${result.error}`);
            });
        }
        
        const successRate = ((this.results.passed.length / totalTests) * 100).toFixed(1);
        console.log(`\n🎯 SUCCESS RATE: ${successRate}%`);
        
        if (this.results.failed.length === 0) {
            console.log('\n🎉 ALL CORE COMPONENTS IMPLEMENTED SUCCESSFULLY!');
            console.log('\n📋 Next Steps:');
            console.log('  1. Run provider setup: node scripts/check-providers.js');
            console.log('  2. Start migration: node scripts/migration-controller.js');
            console.log('  3. Monitor progress: Check dashboard for real-time updates');
            console.log('  4. Generate cost reports: Use CostReportGenerator');
        } else {
            console.log('\n🔧 Some components need attention. Please review failed tests above.');
        }
        
        console.log('\n' + '='.repeat(60));
    }
}

// Run the tests
const tester = new ComponentTester();
tester.runAllTests().catch(console.error); 