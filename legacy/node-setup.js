// node-setup.js - Node.js compatible setup
const fs = require('fs').promises;
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function setup() {
    console.clear();
    console.log(`
╔═══════════════════════════════════════════════════════════════╗
║       🚀 Team Leader System v4.0 - Node.js Setup             ║
╚═══════════════════════════════════════════════════════════════╝

Welcome! Let's set up your project.

📋 Project Templates:
1. webapp     - Web application
2. saas       - SaaS platform  
3. ecommerce  - E-commerce site
4. mobile     - Mobile app
5. custom     - Custom configuration
`);

    const projectType = await question('\nSelect template (1-5): ');
    const projectName = await question('Project name: ');
    
    console.log(`\n✅ Creating ${projectName} as a ${projectType} project...`);
    
    // Create project structure
    const dirs = [
        projectName,
        `${projectName}/agents`,
        `${projectName}/communications`,
        `${projectName}/outputs`,
        `${projectName}/approvals`
    ];
    
    for (const dir of dirs) {
        await fs.mkdir(dir, { recursive: true });
    }
    
    console.log('✅ Project structure created!');
    console.log(`\n📂 Project location: ./${projectName}`);
    console.log('\nNext steps:');
    console.log('1. cd ' + projectName);
    console.log('2. Start adding your requirements\n');
    
    rl.close();
}

setup().catch(console.error);