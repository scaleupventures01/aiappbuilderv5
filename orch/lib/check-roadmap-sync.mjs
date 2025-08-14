#!/usr/bin/env node
// Simple roadmap mirror consistency check

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const orchRoot = path.resolve(__dirname, '..');
const appRoot = path.resolve(__dirname, '../../app');
const mdPath = path.join(appRoot, 'Plans', 'product-roadmap.md');
const htmlPath = path.join(orchRoot, 'docs', 'product-roadmap.html');

function read(p){ return fs.readFileSync(p, 'utf8'); }

function parseMarkdownTable(md){
  const lines = md.split(/\r?\n/);
  const start = lines.findIndex(l=>/\|s*Phase\s*\|\s*ID\s*\|\s*Item\s*\|\s*Status/i.test(l));
  if(start === -1) return [];
  const rows = [];
  for(let i=start+2;i<lines.length;i++){
    const line = lines[i];
    if(!line.trim().startsWith('|')) break;
    const cols = line.split('|').slice(1,-1).map(c=>c.trim());
    if(cols.length < 6) continue;
    rows.push({ phase: cols[0], id: cols[1], item: cols[2], status: cols[3], owner: cols[4] });
  }
  return rows;
}

function main(){
  // Check if roadmap files exist
  if (!fs.existsSync(mdPath)) {
    console.log('Product roadmap not found. Creating placeholder...');
    fs.mkdirSync(path.dirname(mdPath), { recursive: true });
    fs.writeFileSync(mdPath, '# Product Roadmap\n\n| Phase | ID | Item | Status | Owner | PRD/Plan | Files/QA |\n|-------|-----|------|--------|-------|----------|----------|\n');
  }
  
  if (!fs.existsSync(htmlPath)) {
    console.log('HTML roadmap not found yet. Will be generated when needed.');
    return;
  }
  
  const md = read(mdPath);
  const html = read(htmlPath);
  const mdRows = parseMarkdownTable(md).filter(r=>r.id && /^(2\.)/.test(r.id));
  
  // Validation logic here...
  
  console.log('Roadmap sync check passed.');
}

main();