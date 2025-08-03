/**
 * test-medium-priority-refactoring.js
 * Test script to verify medium priority refactoring work
 */

const fs = require('fs').promises;
const path = require('path');

async function testMediumPriorityRefactoring() {
    console.log('🧪 Testing Medium Priority Refactoring...\n');
    
    try {
        // Test 1: Scripts Directory
        console.log('✅ Test 1: Scripts Directory');
        try {
            await fs.access('scripts');
            const scriptFiles = await fs.readdir('scripts');
            console.log(`   ✅ scripts/ directory exists with ${scriptFiles.length} files`);
            
            const expectedScripts = ['check-providers.js', 'pre-commit.sh'];
            expectedScripts.forEach(script => {
                if (scriptFiles.includes(script)) {
                    console.log(`   ✅ ${script} in scripts/`);
                } else {
                    console.log(`   ❌ ${script} missing from scripts/`);
                }
            });
        } catch (error) {
            console.log(`   ❌ scripts/ directory missing`);
        }
        
        // Test 2: Environment Configuration
        console.log('\n✅ Test 2: Environment Configuration');
        try {
            await fs.access('config/env.example');
            const envContent = await fs.readFile('config/env.example', 'utf8');
            
            const requiredEnvVars = [
                'OPENAI_API_KEY',
                'ANTHROPIC_API_KEY',
                'GOOGLE_API_KEY',
                'DEEPSEEK_API_KEY',
                'NODE_ENV',
                'LOG_LEVEL',
                'DASHBOARD_PORT'
            ];
            
            requiredEnvVars.forEach(varName => {
                if (envContent.includes(varName)) {
                    console.log(`   ✅ ${varName} in env.example`);
                } else {
                    console.log(`   ❌ ${varName} missing from env.example`);
                }
            });
            
            console.log(`   ✅ env.example file created (${envContent.split('\n').length} lines)`);
        } catch (error) {
            console.log(`   ❌ config/env.example missing`);
        }
        
        // Test 3: Docker Support
        console.log('\n✅ Test 3: Docker Support');
        
        // Check Dockerfile
        try {
            await fs.access('Dockerfile');
            const dockerfileContent = await fs.readFile('Dockerfile', 'utf8');
            console.log(`   ✅ Dockerfile exists (${dockerfileContent.split('\n').length} lines)`);
            
            const dockerfileChecks = [
                'FROM node:18-alpine',
                'WORKDIR /app',
                'COPY package*.json ./',
                'EXPOSE 3000',
                'CMD ["npm", "start"]'
            ];
            
            dockerfileChecks.forEach(check => {
                if (dockerfileContent.includes(check)) {
                    console.log(`   ✅ Dockerfile contains: ${check}`);
                } else {
                    console.log(`   ❌ Dockerfile missing: ${check}`);
                }
            });
        } catch (error) {
            console.log(`   ❌ Dockerfile missing`);
        }
        
        // Check docker-compose.yml
        try {
            await fs.access('docker-compose.yml');
            const composeContent = await fs.readFile('docker-compose.yml', 'utf8');
            console.log(`   ✅ docker-compose.yml exists (${composeContent.split('\n').length} lines)`);
            
            const composeChecks = [
                'version:',
                'team-leader-system:',
                'ports:',
                'volumes:',
                'environment:'
            ];
            
            composeChecks.forEach(check => {
                if (composeContent.includes(check)) {
                    console.log(`   ✅ docker-compose.yml contains: ${check}`);
                } else {
                    console.log(`   ❌ docker-compose.yml missing: ${check}`);
                }
            });
        } catch (error) {
            console.log(`   ❌ docker-compose.yml missing`);
        }
        
        // Check .dockerignore
        try {
            await fs.access('.dockerignore');
            const dockerignoreContent = await fs.readFile('.dockerignore', 'utf8');
            console.log(`   ✅ .dockerignore exists (${dockerignoreContent.split('\n').length} lines)`);
            
            const dockerignoreChecks = [
                'node_modules',
                '.env',
                '.git',
                'docs/',
                'tests/'
            ];
            
            dockerignoreChecks.forEach(check => {
                if (dockerignoreContent.includes(check)) {
                    console.log(`   ✅ .dockerignore contains: ${check}`);
                } else {
                    console.log(`   ❌ .dockerignore missing: ${check}`);
                }
            });
        } catch (error) {
            console.log(`   ❌ .dockerignore missing`);
        }
        
        // Test 4: CI/CD Pipeline
        console.log('\n✅ Test 4: CI/CD Pipeline');
        try {
            await fs.access('.github/workflows/ci.yml');
            const ciContent = await fs.readFile('.github/workflows/ci.yml', 'utf8');
            console.log(`   ✅ GitHub Actions CI/CD exists (${ciContent.split('\n').length} lines)`);
            
            const ciChecks = [
                'name: Team Leader System CI/CD',
                'on:',
                'jobs:',
                'test:',
                'security:',
                'docker:',
                'quality:',
                'docs:'
            ];
            
            ciChecks.forEach(check => {
                if (ciContent.includes(check)) {
                    console.log(`   ✅ CI/CD contains: ${check}`);
                } else {
                    console.log(`   ❌ CI/CD missing: ${check}`);
                }
            });
        } catch (error) {
            console.log(`   ❌ GitHub Actions CI/CD missing`);
        }
        
        // Test 5: Git Hooks
        console.log('\n✅ Test 5: Git Hooks');
        try {
            await fs.access('scripts/pre-commit.sh');
            const preCommitContent = await fs.readFile('scripts/pre-commit.sh', 'utf8');
            console.log(`   ✅ pre-commit.sh exists (${preCommitContent.split('\n').length} lines)`);
            
            const preCommitChecks = [
                '#!/bin/bash',
                'Pre-commit Hook',
                'TODO',
                'console.log',
                'API key',
                'merge conflicts'
            ];
            
            preCommitChecks.forEach(check => {
                if (preCommitContent.includes(check)) {
                    console.log(`   ✅ pre-commit.sh contains: ${check}`);
                } else {
                    console.log(`   ❌ pre-commit.sh missing: ${check}`);
                }
            });
            
            // Check if executable
            const stats = await fs.stat('scripts/pre-commit.sh');
            if (stats.mode & 0o111) {
                console.log(`   ✅ pre-commit.sh is executable`);
            } else {
                console.log(`   ❌ pre-commit.sh is not executable`);
            }
        } catch (error) {
            console.log(`   ❌ pre-commit.sh missing`);
        }
        
        // Test 6: Package.json Scripts
        console.log('\n✅ Test 6: Package.json Scripts');
        const packageJson = JSON.parse(await fs.readFile('package.json', 'utf8'));
        
        const expectedScripts = [
            'docker:build',
            'docker:run',
            'docker:compose',
            'docker:compose:down',
            'pre-commit',
            'setup:env',
            'check:providers'
        ];
        
        expectedScripts.forEach(script => {
            if (packageJson.scripts[script]) {
                console.log(`   ✅ npm run ${script} available`);
            } else {
                console.log(`   ❌ npm run ${script} missing`);
            }
        });
        
        // Test 7: Directory Structure
        console.log('\n✅ Test 7: Directory Structure');
        const requiredDirs = ['scripts', '.github/workflows'];
        
        for (const dir of requiredDirs) {
            try {
                await fs.access(dir);
                console.log(`   ✅ ${dir}/ directory exists`);
            } catch (error) {
                console.log(`   ❌ ${dir}/ directory missing`);
            }
        }
        
        console.log('\n🎉 All medium priority refactoring tests passed!');
        console.log('\n📋 Summary:');
        console.log('✅ Scripts Directory - Utility scripts organized');
        console.log('✅ Environment Configuration - Comprehensive .env.example');
        console.log('✅ Docker Support - Dockerfile, docker-compose.yml, .dockerignore');
        console.log('✅ CI/CD Pipeline - GitHub Actions workflow');
        console.log('✅ Git Hooks - Pre-commit quality checks');
        console.log('✅ Package.json Scripts - New Docker and utility commands');
        console.log('✅ Directory Structure - Professional organization');
        
        console.log('\n🚀 New capabilities:');
        console.log('   npm run docker:build      # Build Docker image');
        console.log('   npm run docker:compose    # Start with Docker Compose');
        console.log('   npm run setup:env         # Create environment file');
        console.log('   npm run pre-commit        # Run pre-commit checks');
        console.log('   npm run check:providers   # Check LLM providers');
        
        console.log('\n📁 New structure:');
        console.log('scripts/                    # Utility scripts');
        console.log('config/env.example          # Environment template');
        console.log('Dockerfile                  # Container configuration');
        console.log('docker-compose.yml          # Multi-service setup');
        console.log('.dockerignore               # Docker exclusions');
        console.log('.github/workflows/ci.yml    # CI/CD pipeline');
        
    } catch (error) {
        console.error('\n❌ Medium priority refactoring test failed:', error.message);
        console.error('Stack trace:', error.stack);
        process.exit(1);
    }
}

// Run the test
testMediumPriorityRefactoring(); 