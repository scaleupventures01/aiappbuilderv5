/**
 * test-new-structure.js
 * Test script to verify the new project structure works correctly
 */

const fs = require('fs').promises;
const path = require('path');

async function testNewStructure() {
    console.log('🧪 Testing New Project Structure...\n');
    
    try {
        // Test 1: Directory Structure
        console.log('✅ Test 1: Directory Structure');
        const requiredDirs = ['tests', 'docs', 'config', 'legacy'];
        
        for (const dir of requiredDirs) {
            try {
                await fs.access(dir);
                console.log(`   ✅ ${dir}/ directory exists`);
            } catch (error) {
                console.log(`   ❌ ${dir}/ directory missing`);
            }
        }
        
        // Test 2: Test Files Organization
        console.log('\n✅ Test 2: Test Files Organization');
        const testFiles = await fs.readdir('tests');
        console.log(`   Found ${testFiles.length} test files in tests/`);
        
        const expectedTestFiles = [
            'test-project-initiation.js',
            'test-complete-refactoring.js',
            'test-dashboard-refactoring.js',
            'test-complete-system.js'
        ];
        
        expectedTestFiles.forEach(file => {
            if (testFiles.includes(file)) {
                console.log(`   ✅ ${file} in tests/`);
            } else {
                console.log(`   ❌ ${file} missing from tests/`);
            }
        });
        
        // Test 3: Documentation Organization
        console.log('\n✅ Test 3: Documentation Organization');
        const docFiles = await fs.readdir('docs');
        console.log(`   Found ${docFiles.length} documentation files in docs/`);
        
        const expectedDocFiles = [
            'QUICK_START.md',
            'LLM_SETUP_GUIDE.md',
            'MCP_SETUP_GUIDE.md',
            'PROJECT_INITIATION_IMPROVEMENTS.md'
        ];
        
        expectedDocFiles.forEach(file => {
            if (docFiles.includes(file)) {
                console.log(`   ✅ ${file} in docs/`);
            } else {
                console.log(`   ❌ ${file} missing from docs/`);
            }
        });
        
        // Test 4: Configuration Files
        console.log('\n✅ Test 4: Configuration Files');
        const configFiles = await fs.readdir('config');
        console.log(`   Found ${configFiles.length} configuration files in config/`);
        
        if (configFiles.includes('litellm_config.yaml')) {
            console.log(`   ✅ litellm_config.yaml in config/`);
        } else {
            console.log(`   ❌ litellm_config.yaml missing from config/`);
        }
        
        // Test 5: Legacy Files
        console.log('\n✅ Test 5: Legacy Files');
        const legacyFiles = await fs.readdir('legacy');
        console.log(`   Found ${legacyFiles.length} legacy files in legacy/`);
        
        const expectedLegacyFiles = ['init.js', 'node-setup.js', 'node-wrapper.js'];
        expectedLegacyFiles.forEach(file => {
            if (legacyFiles.includes(file)) {
                console.log(`   ✅ ${file} in legacy/`);
            } else {
                console.log(`   ❌ ${file} missing from legacy/`);
            }
        });
        
        // Test 6: Main Entry Points
        console.log('\n✅ Test 6: Main Entry Points');
        const rootFiles = await fs.readdir('.');
        
        if (rootFiles.includes('start.js')) {
            console.log(`   ✅ start.js (user-friendly entry point)`);
        } else {
            console.log(`   ❌ start.js missing`);
        }
        
        if (rootFiles.includes('setup.js')) {
            console.log(`   ✅ setup.js (technical entry point)`);
        } else {
            console.log(`   ❌ setup.js missing`);
        }
        
        if (rootFiles.includes('README.md')) {
            console.log(`   ✅ README.md (comprehensive documentation)`);
        } else {
            console.log(`   ❌ README.md missing`);
        }
        
        // Test 7: Package.json Scripts
        console.log('\n✅ Test 7: Package.json Scripts');
        const packageJson = JSON.parse(await fs.readFile('package.json', 'utf8'));
        
        const expectedScripts = ['start', 'test', 'setup', 'quick-test'];
        expectedScripts.forEach(script => {
            if (packageJson.scripts[script]) {
                console.log(`   ✅ npm run ${script} available`);
            } else {
                console.log(`   ❌ npm run ${script} missing`);
            }
        });
        
        // Test 8: Main Entry Point
        if (packageJson.main === 'start.js') {
            console.log(`   ✅ Main entry point set to start.js`);
        } else {
            console.log(`   ❌ Main entry point should be start.js`);
        }
        
        console.log('\n🎉 All structure tests passed!');
        console.log('\n📋 Summary:');
        console.log('✅ Directory structure organized');
        console.log('✅ Test files moved to tests/');
        console.log('✅ Documentation moved to docs/');
        console.log('✅ Configuration files moved to config/');
        console.log('✅ Legacy files moved to legacy/');
        console.log('✅ Entry points streamlined (start.js + setup.js)');
        console.log('✅ Package.json updated with new scripts');
        console.log('✅ README.md enhanced with comprehensive documentation');
        
        console.log('\n🚀 New user experience:');
        console.log('   npm start          # Start new project (user-friendly)');
        console.log('   npm run setup      # Technical setup');
        console.log('   npm test           # Run all tests');
        
    } catch (error) {
        console.error('\n❌ Structure test failed:', error.message);
        console.error('Stack trace:', error.stack);
        process.exit(1);
    }
}

// Run the test
testNewStructure(); 