#!/usr/bin/env node
// Generator to update docs/product-roadmap.html WBS tables from app/Plans/product-roadmap.md

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
function write(p, s){ 
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, s); 
}

function parseMdRows(md){
  const lines = md.split(/\r?\n/);
  const rows = [];
  for(let idx=0; idx<lines.length; idx++){
    if(/\|\s*Phase\s*\|\s*ID\s*\|\s*Item\s*\|\s*Status/i.test(lines[idx])){
      idx += 2;
      for(; idx < lines.length; idx++){
        const line = lines[idx];
        if(!line || !line.trim().startsWith('|')){ break; }
        const cols = line.split('|').slice(1,-1).map(c=>c.trim());
        if(cols.length < 7) continue;
        rows.push({ phase: cols[0], id: cols[1], item: cols[2], status: cols[3], owner: cols[4], plan: cols[5]||'', files: cols[6]||'' });
      }
    }
  }
  return rows;
}

function mapPathToHref(p){
  let clean = p.replace(/^`|`$/g,'');
  if(clean.includes('*')){
    clean = clean.split('*')[0];
  }
  // Update paths to point to app folder
  return clean
    .replace(/^PRDs\//,'../../app/PRDs/')
    .replace(/^Plans\//,'../../app/Plans/')
    .replace(/^QA\//,'../../app/QA/')
    .replace(/^security\//,'../../app/security/')
    .replace(/^tests\//,'../../app/tests/');
}

function toHtmlCells(r){
  function toLinks(csv){
    const parts = csv
      .replace(/`/g, '')
      .replace(/\bQA:\s*/gi, '')
      .split(/[;,]+/)
      .map(s=>s.trim())
      .filter(Boolean);
    if(!parts.length) return '—';
    return parts.map(p=>{
      const clean = p.replace(/^`|`$/g,'');
      const href = mapPathToHref(clean);
      return `<a class="file-link" href="${href}">${clean}</a>`;
    }).join(', ');
  }
  function toPlanLink(plan){
    const clean = (plan||'').replace(/^`|`$/g,'');
    if(!clean) return '—';
    const href = mapPathToHref(clean);
    return `<a class="file-link" href="${href}">${clean}</a>`;
  }
  return [
    `<td>${r.phase}</td>`,
    `<td>${r.id}</td>`,
    `<td>${r.item}</td>`,
    `<td>${r.status}</td>`,
    `<td>${r.owner}</td>`,
    `<td>${toPlanLink(r.plan)}</td>`,
    `<td>${toLinks(r.files)}</td>`,
    `<td>${toLinks(r.files)}</td>`
  ].join('\n');
}

function generateHtml(rows) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Product Roadmap</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 20px; }
    table { border-collapse: collapse; width: 100%; margin: 20px 0; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #f2f2f2; font-weight: 600; }
    tr:hover { background-color: #f5f5f5; }
    a { color: #0066cc; text-decoration: none; }
    a:hover { text-decoration: underline; }
    h1 { color: #333; }
  </style>
</head>
<body>
  <h1>Product Roadmap</h1>
  <table>
    <thead>
      <tr>
        <th>Phase</th>
        <th>ID</th>
        <th>Item</th>
        <th>Status</th>
        <th>Owner</th>
        <th>PRD/Plan</th>
        <th>Files</th>
        <th>QA</th>
      </tr>
    </thead>
    <tbody>
      ${rows.map(r => `<tr>${toHtmlCells(r)}</tr>`).join('\n')}
    </tbody>
  </table>
</body>
</html>`;
}

function main(){
  if (!fs.existsSync(mdPath)) {
    console.log('Product roadmap markdown not found. Skipping HTML generation.');
    return;
  }
  
  const md = read(mdPath);
  const rows = parseMdRows(md);
  const html = generateHtml(rows);
  
  write(htmlPath, html);
  console.log('Regenerated docs/product-roadmap.html from canonical markdown for all subsections.');
}

main();