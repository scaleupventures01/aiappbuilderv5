import fs from 'node:fs';
import path from 'node:path';
import { execSync, exec } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const orchRoot = path.resolve(__dirname, '../..');
const appRoot = path.resolve(__dirname, '../../../app');

export function flipRoadmapStatus(roadmapId, newStatus) {
  const roadmapPath = path.join(appRoot, 'Plans', 'product-roadmap.md');
  let content = fs.readFileSync(roadmapPath, 'utf8');
  
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(`| ${roadmapId} |`)) {
      const cols = lines[i].split('|');
      if (cols.length > 4) {
        cols[4] = ` ${newStatus} `;
        lines[i] = cols.join('|');
      }
      break;
    }
  }
  
  content = lines.join('\n');
  fs.writeFileSync(roadmapPath, content);
  return true;
}

export function regenerateRoadmapHtml() {
  try {
    execSync('node lib/generate-roadmap-html.mjs', { 
      cwd: orchRoot,
      stdio: 'pipe'
    });
    console.log('Regenerated docs/product-roadmap.html from canonical markdown for all subsections.');
    return true;
  } catch (error) {
    console.error('Failed to regenerate roadmap HTML:', error.message);
    return false;
  }
}

export function getRoadmapItem(roadmapId) {
  const roadmapPath = path.join(appRoot, 'Plans', 'product-roadmap.md');
  const content = fs.readFileSync(roadmapPath, 'utf8');
  
  const lines = content.split('\n');
  for (const line of lines) {
    if (line.includes(`| ${roadmapId} |`)) {
      const cols = line.split('|').map(c => c.trim());
      return {
        phase: cols[1],
        id: cols[2],
        item: cols[3],
        status: cols[4],
        owner: cols[5],
        prd: cols[6],
        qa: cols[7]
      };
    }
  }
  return null;
}

// Mirror sync functionality
export async function syncRoadmapMirror(options = {}) {
  const { autoCommit = false, validateFirst = true } = options;
  const results = {
    markdown: { status: 'pending', path: null },
    html: { status: 'pending', path: null },
    validation: { status: 'pending', issues: [] },
    sync: { status: 'pending', message: '' }
  };
  
  try {
    // Step 1: Validate markdown roadmap
    if (validateFirst) {
      results.validation = await validateRoadmap();
      if (results.validation.status === 'failed') {
        results.sync.status = 'failed';
        results.sync.message = 'Validation failed, sync aborted';
        return results;
      }
    }
    
    // Step 2: Read current markdown roadmap
    const roadmapPath = path.join(appRoot, 'Plans', 'product-roadmap.md');
    if (!fs.existsSync(roadmapPath)) {
      throw new Error('Roadmap markdown not found');
    }
    results.markdown.status = 'found';
    results.markdown.path = roadmapPath;
    
    // Step 3: Generate HTML mirror
    const htmlGenerated = regenerateRoadmapHtml();
    if (!htmlGenerated) {
      throw new Error('Failed to generate HTML mirror');
    }
    
    const htmlPath = path.join(orchRoot, 'docs', 'product-roadmap.html');
    results.html.status = 'generated';
    results.html.path = htmlPath;
    
    // Step 4: Verify sync
    const syncValid = await verifySyncIntegrity(roadmapPath, htmlPath);
    if (!syncValid) {
      throw new Error('Mirror sync verification failed');
    }
    
    results.sync.status = 'completed';
    results.sync.message = 'Roadmap and mirror successfully synchronized';
    
    // Step 5: Auto-commit if requested
    if (autoCommit) {
      const commitResult = await commitRoadmapChanges();
      results.sync.commit = commitResult;
    }
    
  } catch (error) {
    results.sync.status = 'failed';
    results.sync.message = error.message;
  }
  
  return results;
}

// Validate roadmap structure and content
async function validateRoadmap() {
  const validation = {
    status: 'pending',
    issues: [],
    warnings: []
  };
  
  try {
    const roadmapPath = path.join(appRoot, 'Plans', 'product-roadmap.md');
    const content = fs.readFileSync(roadmapPath, 'utf8');
    const lines = content.split('\n');
    
    // Check for required sections
    const requiredSections = ['## Phase', '| Phase |', '| --- |'];
    requiredSections.forEach(section => {
      if (!content.includes(section)) {
        validation.issues.push(`Missing required section: ${section}`);
      }
    });
    
    // Validate table structure
    const tableLines = lines.filter(l => l.includes('|'));
    const ids = new Set();
    
    tableLines.forEach((line, index) => {
      const cols = line.split('|').map(c => c.trim()).filter(c => c);
      
      // Skip header rows
      if (line.includes('Phase') || line.includes('---')) return;
      
      if (cols.length >= 7) {
        const id = cols[1];
        
        // Check for duplicate IDs
        if (ids.has(id)) {
          validation.issues.push(`Duplicate ID found: ${id}`);
        }
        ids.add(id);
        
        // Validate ID format
        if (!id.match(/^\d+\.\d+\.\d+\.\d+\.\d+\.\d+$/)) {
          validation.warnings.push(`Invalid ID format at line ${index + 1}: ${id}`);
        }
        
        // Check status values
        const validStatuses = ['Ready', 'In Progress', 'Done', 'Blocked', 'Not Started'];
        const status = cols[3];
        if (status && !validStatuses.includes(status)) {
          validation.warnings.push(`Invalid status at line ${index + 1}: ${status}`);
        }
        
        // Check for required PRD link if status is Ready or Done
        if ((status === 'Ready' || status === 'Done') && !cols[5]) {
          validation.warnings.push(`Missing PRD link for ${id} with status ${status}`);
        }
        
        // Check for QA link if status is Done
        if (status === 'Done' && !cols[6]) {
          validation.warnings.push(`Missing QA link for ${id} with status Done`);
        }
      }
    });
    
    validation.status = validation.issues.length === 0 ? 'passed' : 'failed';
    
  } catch (error) {
    validation.status = 'error';
    validation.issues.push(error.message);
  }
  
  return validation;
}

// Verify sync integrity between markdown and HTML
async function verifySyncIntegrity(markdownPath, htmlPath) {
  try {
    const mdContent = fs.readFileSync(markdownPath, 'utf8');
    const htmlContent = fs.readFileSync(htmlPath, 'utf8');
    
    // Extract IDs from markdown
    const mdIds = [];
    const mdLines = mdContent.split('\n');
    mdLines.forEach(line => {
      const match = line.match(/\| (\d+\.\d+\.\d+\.\d+\.\d+\.\d+) \|/);
      if (match) mdIds.push(match[1]);
    });
    
    // Check that all markdown IDs exist in HTML
    let allFound = true;
    mdIds.forEach(id => {
      if (!htmlContent.includes(id)) {
        console.error(`ID ${id} missing in HTML mirror`);
        allFound = false;
      }
    });
    
    // Check timestamps match (within 1 minute)
    const mdTime = fs.statSync(markdownPath).mtime;
    const htmlTime = fs.statSync(htmlPath).mtime;
    const timeDiff = Math.abs(htmlTime - mdTime);
    
    if (timeDiff > 60000) { // More than 1 minute difference
      console.warn(`Time difference between files: ${timeDiff / 1000}s`);
    }
    
    return allFound;
  } catch (error) {
    console.error('Sync verification error:', error.message);
    return false;
  }
}

// Commit roadmap changes
async function commitRoadmapChanges() {
  try {
    // Check git status
    const { stdout: status } = await execAsync('git status --porcelain', { cwd: appRoot });
    
    if (!status) {
      return { committed: false, message: 'No changes to commit' };
    }
    
    // Add roadmap files
    await execAsync('git add Plans/product-roadmap.md', { cwd: appRoot });
    await execAsync('git add ../orch/docs/product-roadmap.html', { cwd: appRoot });
    
    // Create commit
    const message = `chore: sync roadmap and mirror [${new Date().toISOString()}]`;
    await execAsync(`git commit -m "${message}"`, { cwd: appRoot });
    
    return { committed: true, message };
  } catch (error) {
    return { committed: false, message: error.message };
  }
}

// Update roadmap with QA results
export function updateRoadmapWithQA(roadmapId, qaPath) {
  const roadmapPath = path.join(appRoot, 'Plans', 'product-roadmap.md');
  let content = fs.readFileSync(roadmapPath, 'utf8');
  
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(`| ${roadmapId} |`)) {
      const cols = lines[i].split('|');
      if (cols.length > 7) {
        // Update QA column with relative path
        const qaRelPath = path.relative(path.dirname(roadmapPath), qaPath);
        cols[7] = ` [QA Pass](${qaRelPath}) `;
        lines[i] = cols.join('|');
      }
      break;
    }
  }
  
  content = lines.join('\n');
  fs.writeFileSync(roadmapPath, content);
  
  // Regenerate HTML mirror
  regenerateRoadmapHtml();
  
  return true;
}

// Batch update multiple roadmap items
export function batchUpdateRoadmap(updates) {
  const roadmapPath = path.join(appRoot, 'Plans', 'product-roadmap.md');
  let content = fs.readFileSync(roadmapPath, 'utf8');
  let lines = content.split('\n');
  
  let changesCount = 0;
  
  updates.forEach(update => {
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes(`| ${update.id} |`)) {
        const cols = lines[i].split('|');
        
        if (update.status && cols.length > 4) {
          cols[4] = ` ${update.status} `;
        }
        if (update.owner && cols.length > 5) {
          cols[5] = ` ${update.owner} `;
        }
        if (update.prd && cols.length > 6) {
          cols[6] = ` ${update.prd} `;
        }
        if (update.qa && cols.length > 7) {
          cols[7] = ` ${update.qa} `;
        }
        
        lines[i] = cols.join('|');
        changesCount++;
        break;
      }
    }
  });
  
  if (changesCount > 0) {
    content = lines.join('\n');
    fs.writeFileSync(roadmapPath, content);
    regenerateRoadmapHtml();
    console.log(`Updated ${changesCount} roadmap items`);
  }
  
  return changesCount;
}

// Get roadmap statistics
export function getRoadmapStats() {
  const roadmapPath = path.join(appRoot, 'Plans', 'product-roadmap.md');
  const content = fs.readFileSync(roadmapPath, 'utf8');
  
  const stats = {
    total: 0,
    byStatus: {
      'Not Started': 0,
      'Ready': 0,
      'In Progress': 0,
      'Done': 0,
      'Blocked': 0
    },
    byPhase: {},
    withPRD: 0,
    withQA: 0
  };
  
  const lines = content.split('\n');
  lines.forEach(line => {
    if (line.includes('|') && !line.includes('Phase') && !line.includes('---')) {
      const cols = line.split('|').map(c => c.trim()).filter(c => c);
      
      if (cols.length >= 7) {
        stats.total++;
        
        const phase = cols[0];
        const status = cols[3];
        const prd = cols[5];
        const qa = cols[6];
        
        if (status in stats.byStatus) {
          stats.byStatus[status]++;
        }
        
        if (phase) {
          stats.byPhase[phase] = (stats.byPhase[phase] || 0) + 1;
        }
        
        if (prd && prd !== '-') stats.withPRD++;
        if (qa && qa !== '-') stats.withQA++;
      }
    }
  });
  
  stats.completionRate = stats.total > 0 
    ? Math.round((stats.byStatus.Done / stats.total) * 100) 
    : 0;
  
  return stats;
}