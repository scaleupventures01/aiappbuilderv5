# check-roadmap-sync.mjs

```javascript
#!/usr/bin/env node
// Simple roadmap mirror consistency check
// - Compares section 2 table rows in Plans/product-roadmap.md vs WBS rows in docs/product-roadmap.html
// - Validates Phase/ID/Item/Status/Owner parity and natural ascending phase ordering
// - Validates that all file paths in HTML are clickable links and exist on disk

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const mdPath = path.join(repoRoot, 'Plans', 'product-roadmap.md');
const htmlPath = path.join(repoRoot, 'docs', 'product-roadmap.html');

function read(p){ return fs.readFileSync(p, 'utf8'); }

function parseMarkdownTable(md){
  const lines = md.split(/\r?\n/);
  const start = lines.findIndex(l=>/\|\s*Phase\s*\|\s*ID\s*\|\s*Item\s*\|\s*Status/i.test(l));
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

function parseHtmlWbs(html){
  // Very lightweight parser: find tbody rows under WBS details; extract first 5 <td>
  const sectionRegex = /<div class="section"[\s\S]*?<h2>2\. Phases and Milestones.*?<\/div>/i;
  const match = html.match(sectionRegex);
  let body = match ? match[0] : html;
  // strip scripts to avoid catching template hrefs inside JS strings
  body = body.replace(/<script[\s\S]*?<\/script>/g, '');
  const rowRegex = /<tr>[\s\S]*?<\/tr>/g;
  const cellRegex = /<td[^>]*>([\s\S]*?)<\/td>/g;
  const rows = [];
  let r;
  while((r = rowRegex.exec(body))){
    const tds = Array.from(r[0].matchAll(cellRegex)).map(m=>normalizeHtmlText(m[1]));
    if(tds.length >= 5){
      rows.push({ phase: tds[0], id: tds[1], item: tds[2], status: tds[3], owner: tds[4] });
    }
  }
  return rows;
}

function decodeHtmlEntities(s){
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#8212;|&mdash;/g, '—');
}

function normalizeHtmlText(s){
  return decodeHtmlEntities(String(s||'')
    .replace(/<[^>]+>/g,'')
    .replace(/`/g,'')
    .replace(/\s+/g,' ')
    .trim());
}

function normalizeMdText(s){
  return String(s||'')
    .replace(/`/g,'')
    .replace(/\s+/g,' ')
    .trim();
}

function normalizeStatus(s){
  const x = (s||'').toLowerCase();
  if(x.startsWith('done')) return 'done';
  if(x.includes('in progress')) return 'in progress';
  if(x.includes('ready')) return 'ready';
  if(x.includes('blocked')) return 'blocked';
  return 'planned';
}

function main(){
  const md = read(mdPath);
  const html = read(htmlPath);
  const mdRows = parseMarkdownTable(md).filter(r=>r.id && /^(2\.)/.test(r.id));
  const htmlRows = parseHtmlWbs(html).filter(r=>r.id && /^(2\.)/.test(r.id));

  const mdIndex = new Map(mdRows.map(r=>[r.id, r]));
  const htmlIndex = new Map(htmlRows.map(r=>[r.id, r]));

  const errors = [];

  // Parity check for IDs present in markdown
  for(const r of mdRows){
    const h = htmlIndex.get(r.id);
    if(!h){ errors.push(`Missing in HTML: ${r.id} ${r.item}`); continue; }
    if(normalizeHtmlText(h.phase) !== normalizeMdText(r.phase)) errors.push(`Phase mismatch for ${r.id}: md='${r.phase}' html='${h.phase}'`);
    if(normalizeHtmlText(h.item) !== normalizeMdText(r.item)) errors.push(`Item mismatch for ${r.id}: md='${r.item}' html='${h.item}'`);
    if(normalizeStatus(h.status) !== normalizeStatus(r.status)) errors.push(`Status mismatch for ${r.id}: md='${r.status}' html='${h.status}'`);
    if(h.owner !== r.owner) errors.push(`Owner mismatch for ${r.id}: md='${r.owner}' html='${h.owner}'`);
  }

  // Ordering rule: natural ascending M order (M0, M1, M2, M3, M4, M5, ...)
  const expectedOrder = ['M0','M1','M2','M3','M4','M5','M6','M7','M8','M9'];
  const firstIndex = new Map();
  htmlRows.forEach((r, i)=>{
    const tag = (r.phase||'').split('—')[0].trim();
    if(!firstIndex.has(tag)) firstIndex.set(tag, i);
  });
  let last = -1;
  for(const tag of expectedOrder){
    const idx = firstIndex.has(tag) ? firstIndex.get(tag) : -1;
    if(idx === -1) continue;
    if(idx < last){
      errors.push(`Ordering rule violated: ${tag} appears before a lower-numbered phase in HTML.`);
      break;
    }
    last = idx;
  }

  // Link existence check in HTML tables
  const linkRegex = /<a\s+class="file-link"\s+href="([^"]+)">/g;
  let m;
  while((m = linkRegex.exec(html))){
    const target = m[1];
    // ignore in-page anchors and template placeholders inside JS
    if(target.startsWith('#') || target.includes('${')) continue;
    const abs = path.join(path.dirname(htmlPath), target);
    // allow directory links and globs collapsed to directories
    if(abs.endsWith('/') && fs.existsSync(abs)) continue;
    if(!fs.existsSync(abs)){
      // allow optional results links tagged with data-optional
      const tail = html.slice(linkRegex.lastIndex, linkRegex.lastIndex+200);
      const isOptional = /data-optional/.test(tail);
      if(!isOptional) errors.push(`Missing file for link: ${target}`);
    }
  }

  if(errors.length){
    console.error('Roadmap sync check failed:\n' + errors.map(e=>' - '+e).join('\n'));
    process.exit(1);
  }
  console.log('Roadmap sync check passed.');
}

main();



```

# check-size.mjs

```javascript
#!/usr/bin/env node
/**
 * File size governance checker
 * - Warn when a source file exceeds 400 lines
 * - Fail (exit 1) when a source file exceeds 600 lines
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const WARN_LINES = 300;
const FAIL_LINES = 400;
const EXTENSIONS = new Set(['.js', '.mjs', '.cjs', '.css', '.html']);
const IGNORE_DIRS = new Set(['node_modules', '.git', 'QA', 'docs']);
const IGNORE_FILES = new Set([]);

function isIgnoredDir(dir) { return IGNORE_DIRS.has(path.basename(dir)); }
function shouldCheck(file) {
  if (IGNORE_FILES.has(path.basename(file))) return false;
  return EXTENSIONS.has(path.extname(file));
}

function listFilesRecursive(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (!isIgnoredDir(full)) files.push(...listFilesRecursive(full));
    } else if (e.isFile()) {
      if (shouldCheck(full)) files.push(full);
    }
  }
  return files;
}

function countLines(file) {
  const content = fs.readFileSync(file, 'utf8');
  return content.split(/\r?\n/).length;
}

function main() {
  const root = PROJECT_ROOT;
  const files = listFilesRecursive(root);
  let hasFailure = false;
  let hasWarning = false;
  const results = [];

  for (const f of files) {
    const lines = countLines(f);
    results.push({ file: path.relative(root, f), lines });
    if (lines > FAIL_LINES) {
      hasFailure = true;
      console.error(`FAIL: ${path.relative(root, f)} — ${lines} lines (> ${FAIL_LINES})`);
    } else if (lines > WARN_LINES) {
      hasWarning = true;
      console.warn(`WARN: ${path.relative(root, f)} — ${lines} lines (> ${WARN_LINES})`);
    }
  }

  if (process.argv.includes('--report')) {
    const sorted = results.sort((a, b) => b.lines - a.lines);
    console.log('# Size Audit Report');
    console.log('');
    console.log(`- Root: ${root}`);
    console.log(`- Thresholds: WARN > ${WARN_LINES} lines; FAIL > ${FAIL_LINES} lines`);
    console.log('');
    console.log('| File | Lines | Status |');
    console.log('|---|---:|---|');
    for (const r of sorted) {
      const status = r.lines > FAIL_LINES ? 'FAIL' : (r.lines > WARN_LINES ? 'WARN' : 'OK');
      console.log(`| ${r.file} | ${r.lines} | ${status} |`);
    }
  } else if (!hasFailure && !hasWarning) {
    console.log('OK: All checked files are within thresholds');
  }

  process.exit(hasFailure ? 1 : 0);
}

main();



```

# generate-roadmap-html.mjs

```javascript
#!/usr/bin/env node
// Generator to update docs/product-roadmap.html WBS tables from Plans/product-roadmap.md section 2
// Rebuilds each subsection (2.x.y) table body from the canonical markdown rows.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const mdPath = path.join(repoRoot, 'Plans', 'product-roadmap.md');
const htmlPath = path.join(repoRoot, 'docs', 'product-roadmap.html');

function read(p){ return fs.readFileSync(p, 'utf8'); }
function write(p, s){ fs.writeFileSync(p, s); }

function parseMdRows(md){
  const lines = md.split(/\r?\n/);
  const rows = [];
  for(let idx=0; idx<lines.length; idx++){
    if(/\|\s*Phase\s*\|\s*ID\s*\|\s*Item\s*\|\s*Status/i.test(lines[idx])){
      // Skip separator line next
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
  // collapse globs to directory
  if(clean.includes('*')){
    clean = clean.split('*')[0];
  }
  return clean
    .replace(/^docs\//,'../docs/')
    .replace(/^QA\//,'../QA/')
    .replace(/^PRDs\//,'../PRDs/')
    .replace(/^Plans\//,'../Plans/')
    .replace(/^js\//,'../js/')
    .replace(/^css\//,'../css/')
    .replace(/^lib\//,'../lib/')
    .replace(/^team\//,'../team/')
    .replace(/^index\.html$/,'../index.html');
}

function toHtmlCells(r){
  function splitArtifacts(csv){
    if(!csv) return [];
    return csv
      .replace(/`/g, '')
      .replace(/\bQA:\s*/gi, '')
      .split(/[;,]+/)
      .map(s=>s.trim())
      .filter(Boolean);
  }
  function toLinks(csv){
    const parts = splitArtifacts(csv);
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

function injectRows(html, rows){
  let out = html;
  // Identify all subsection panels by summary containing an id like 2.x.y
  const summaryRegex = /<details[^>]*class=\"panel\"[^>]*>\s*<summary>[\s\S]*?(2\.[0-9]+\.[0-9]+)[\s\S]*?<\/summary>/g;
  const found = [];
  let m;
  while((m = summaryRegex.exec(html))){ found.push(m[1]); }
  const subsectionIds = Array.from(new Set(found));
  for(const sid of subsectionIds){
    const panelRegex = new RegExp(`(<details[^>]*class=\\"panel\\"[^>]*>\\s*<summary>[\\s\\S]*?${sid}[\\s\\S]*?<\\/summary>[\\s\\S]*?)<tbody>[\\s\\S]*?<\\/tbody>`);
    const subrows = rows.filter(r=>r.id.startsWith(sid)).map(r=>`<tr>\n${toHtmlCells(r)}\n</tr>`).join('\n');
    out = out.replace(panelRegex, (whole, beforeTbody)=>{
      return `${beforeTbody}<tbody>\n${subrows}\n</tbody>`;
    });
  }
  // Update Last Mirror Sync
  out = out.replace(/(<span data-sync>)([^<]*)(<\/span>)/, `$1${new Date().toISOString().slice(0,19).replace('T',' ')}$3`);

  // Also pre-render At-a-Glance bars from markdown to avoid runtime discrepancies
  const phases = ['M2', 'M5', 'M3'];
  const percentByPhase = new Map();
  phases.forEach(prefix=>{
    const phaseRow = rows.find(r=>r.phase.startsWith(prefix));
    const phaseName = phaseRow ? phaseRow.phase.split('—')[0].trim() : prefix;
    const sub = rows.filter(r=>r.phase.startsWith(prefix));
    const totals = sub.reduce((acc,r)=>{
      const s = (r.status||'').toLowerCase();
      if(s.startsWith('done')) acc.done++;
      else if(s.includes('in progress')) acc.inprog++;
      else if(s.includes('ready')) acc.ready++;
      else if(s.includes('blocked')) acc.blocked++;
      else acc.planned++;
      acc.total++;
      return acc;
    }, {done:0,inprog:0,ready:0,blocked:0,planned:0,total:0});
    const pct = totals.total ? Math.round((totals.done / totals.total) * 100) : 0;
    percentByPhase.set(prefix, pct);
  });
  function applyCard(outHtml, anchor, pct){
    const color = pct === 100 ? '#28a745' : '#f1c40f';
    // width replacement: ensure we match 0 or number followed by optional %
    const widthRe = new RegExp(`(<a href=\\"${anchor}\\"[\\s\\S]*?<div style=\\"height:6px[\\s\\S]*?<span style=\\"display:block; height:6px; width:)`+
                               `(?:[0-9]+|0)(?:%?);?([^>]*>)[\\s\\S]*?<\\/span>`);
    if(widthRe.test(outHtml)){
      outHtml = outHtml.replace(widthRe, `$1${pct}%; background:${color};$2</span>`);
    }
    // percentage label replacement
    const labelRe = new RegExp(`(<a href=\\"${anchor}\\"[\\s\\S]*?<span data-pct>)`+
                               `[^<]*(<\\/span>)`);
    if(labelRe.test(outHtml)){
      outHtml = outHtml.replace(labelRe, `$1${pct}%$2`);
    }
    return outHtml;
  }
  out = applyCard(out, '#phase-M2', percentByPhase.get('M2')||0);
  out = applyCard(out, '#phase-M5', percentByPhase.get('M5')||0);
  out = applyCard(out, '#phase-M3', percentByPhase.get('M3')||0);
  return out;
}

function main(){
  const md = read(mdPath);
  const html = read(htmlPath);
  const rows = parseMdRows(md);
  const updated = injectRows(html, rows);
  write(htmlPath, updated);
  console.log('Regenerated docs/product-roadmap.html from canonical markdown for all subsections.');
}

main();



```

# orch-backfill.mjs

```javascript
/* Backfill helper (placeholder) */
export function planBackfill() { return []; }

```

# orch-start.mjs

```javascript
#!/usr/bin/env node
// Minimal ORCH START CLI: resolves a PRD, ensures QA artifacts, updates PRD changelog, and (optionally) generates code.
// Modes supported:
//   --prd-path <path> | --id <ROADMAP_ID>
//   --dry-run           (simulate actions; default: false)
//   --gen               (enable code generation; default: false)
//   --overwrite         (allow overwriting existing files during generation; default: false)
//   --roles "A,B,C"     (explicit role list; default: auto)
//   --review            (add review notes/checklist)
// Range/List grammar can be added incrementally; this CLI focuses on single-item execution.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ensureQa } from './orch/qa-utils.mjs';
import { readPrd, writePrd, setFrontmatterOwner, ensureQaArtifactsBlock, appendChangelog, ensureExecutionPlanAfter93, ensurePerRoleExecutionPlanAfter93, ensureRolesSection, ensureHandoffContractsFromRoles, ensureOptionalTeamRoles, ensureReviewerNotes, tickReviewChecklist, updateFrontmatterRoles, updateQaResultPathInReview, ensureReviewLogFromRoles } from './orch/prd-utils.mjs';
import { listTeamRoles } from './orch/team-utils.mjs';
import { flipRoadmapStatus, regenerateRoadmapHtml } from './orch/roadmap-utils.mjs';
import { runDefaultWorkflow, runE2E } from './orch/workflow-runner.mjs';
import { runSecurityGates } from './orch/security-runner.mjs';
import { applyRoleContributions } from './orch/role-agents.mjs';
import { evaluateQaPass, evaluateSecurity } from './orch/status-gates.mjs';
import { executeRoleTasks } from './orch/role-executors.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(path.join(__dirname, '..'));

function readUtf8(p) {
  return fs.readFileSync(p, 'utf8');
}

function writeUtf8(p, s) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, s);
}

function parseArgs(argv) {
  const args = { prdPath: '', id: '', dryRun: false, gen: false, overwrite: false, roles: 'auto', review: false };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--dry-run') { args.dryRun = true; continue; }
    if (a === '--gen') { args.gen = true; continue; }
    if (a === '--overwrite') { args.overwrite = true; continue; }
    // Support --key=value with hyphenated keys
    let m = a.match(/^--([\w-]+?)=(.*)$/);
    if (m) {
      const [, k, v] = m;
      if (k === 'prd-path') args.prdPath = v;
      else if (k === 'id') args.id = v;
      else if (k === 'roles') args.roles = v;
      else if (k === 'dry-run') args.dryRun = v === 'true' || v === '1';
      else if (k === 'gen') args.gen = v === 'true' || v === '1';
      else if (k === 'overwrite') args.overwrite = v === 'true' || v === '1';
      else if (k === 'review') args.review = v === 'true' || v === '1';
      continue;
    }
    // Support split form: --prd-path <value> or --id <value>
    if (a === '--prd-path' && i + 1 < argv.length) { args.prdPath = argv[++i]; continue; }
    if (a === '--id' && i + 1 < argv.length) { args.id = argv[++i]; continue; }
    if (a === '--roles' && i + 1 < argv.length) { args.roles = argv[++i]; continue; }
    if (a === '--review') { args.review = true; continue; }
  }
  return args;
}
function autoSelectRoles(prdText) {
  // Always-on governance
  const roles = ['PM', 'Technical Product Manager', 'Implementation Owner', 'QA', 'Security'];
  // Heuristics
  if (/### 6\.5/.test(prdText) || /\bUX\b|labels|error states|a11y|wireframe/i.test(prdText)) roles.push('UX/UI');
  if (/Legal|disclaimer|privacy policy|consent|ToS/i.test(prdText)) roles.push('Legal');
  if (/app\/api\//i.test(prdText) || /Prisma|migration|schema|route handler|API/i.test(prdText)) roles.push('Backend Engineer');
  if (/infra\/next-app\/app\//i.test(prdText) || /page\.tsx|component|form|index\.html/i.test(prdText)) roles.push('Frontend Engineer');
  if (/CI|CD|deploy|Vercel|Docker|Kubernetes|monitoring|runbook|GitHub Actions/i.test(prdText)) roles.push('DevOps/SRE');
  if (/SBOM|gitleaks|npm audit|SAST|DAST/i.test(prdText)) roles.push('DevSecOps');
  if (/analytics|KPI|metrics|experiment/i.test(prdText)) roles.push('Data Analyst');
  if (/LLM|prompt|model routing|AI\b/i.test(prdText)) roles.push('AI Engineer');
  if (/## 9\./.test(prdText)) roles.push('VP‑Eng');
  // Deduplicate
  return Array.from(new Set(roles));
}


function resolvePrdPathById(roadmapId) {
  // Attempt to read plan cell from roadmap; if not present, derive default path using slug in file name if exists.
  const roadmapPath = path.join(repoRoot, 'Plans', 'product-roadmap.md');
  const md = readUtf8(roadmapPath);
  const line = md.split(/\r?\n/).find(l => l.includes(`| ${roadmapId} |`));
  if (!line) return '';
  const cols = line.split('|').map(s => s.trim());
  // cols: [ '', Phase, ID, Item, Status, Owner, PRD/Plan, Files/QA, '' ]
  const planCell = cols[6] || '';
  const m = planCell.match(/`([^`]+)`/);
  if (m) return path.join(repoRoot, m[1]);
  // Fallback to default convention: PRDs/<Milestone>/<ID>-<slug>-prd.md using phase cell's milestone head
  const phase = cols[1] || 'M0';
  const milestone = (phase.split('—')[0] || 'M0').trim();
  const item = cols[3] || '';
  const slug = item.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').replace(/--+/g, '-');
  return path.join(repoRoot, 'PRDs', milestone, `${roadmapId}-${slug}-prd.md`);
}

function resolveOwnerFromRoadmap(roadmapId) {
  const roadmapPath = path.join(repoRoot, 'Plans', 'product-roadmap.md');
  const md = readUtf8(roadmapPath);
  const line = md.split(/\r?\n/).find(l => l.includes(`| ${roadmapId} |`));
  if (!line) return '';
  const cols = line.split('|').map(s => s.trim());
  return cols[5] || '';
}

function deriveIdFromContent(prdText, prdPath) {
  // Prefer §9.2 line (Status: Plans/product-roadmap.md (X.X.X.X))
  let m = prdText.match(/\(\s*(\d+\.\d+\.\d+\.\d+)\s*\)/);
  if (m) return m[1];
  // Try §7.3 QA path e.g., QA/X.X.X.X-...
  m = prdText.match(/QA\/(\d+\.\d+\.\d+\.\d+)-/);
  if (m) return m[1];
  // Try frontmatter milestone: Mx (X.X.X.X)
  m = prdText.match(/milestone:\s*[^\n]*\((\d+\.\d+\.\d+\.\d+)\)/);
  if (m) return m[1];
  // Fallback to filename
  const base = path.basename(prdPath);
  m = base.match(/^((\d+\.){3}\d+)-/);
  return m ? m[1] : '';
}

function buildPerRoleTasks(id, slug) {
  const qaPath = `QA/${id}-${slug}/`;
  return [
    { id: 'ORCH-PRD-01', owner: 'PM', description: 'Confirm scope/user stories; set acceptance', deps: 'PRD §§1–6 drafted', outputs: 'PRD §§2,4,7.2 updated' },
    { id: 'ORCH-TPM-02', owner: 'Technical Product Manager', description: 'Define trigger grammar; idempotency; evidence schema', deps: 'ORCH-PRD-01', outputs: 'PRD §5 finalized; §10 links' },
    { id: 'ORCH-CTO-03', owner: 'CTO', description: 'Confirm architecture/defaults and guardrails', deps: 'ORCH-TPM-02', outputs: 'PRD §6 updated' },
    { id: 'ORCH-SEC-04', owner: 'Security', description: 'Scans plan; threat model; gate policy', deps: 'ORCH-CTO-03', outputs: 'PRD §6 Security/Privacy; §9.4 evidence refs' },
    { id: 'ORCH-UX-05', owner: 'UX/UI', description: 'Summaries/labels/states formatting', deps: 'ORCH-PRD-01', outputs: 'PRD §6.5 updated' },
    { id: 'ORCH-LEGAL-06', owner: 'Legal', description: 'Privacy/disclaimer copy approvals', deps: 'ORCH-UX-05', outputs: 'PRD §6.6 updated' },
    { id: 'ORCH-QA-07', owner: 'QA', description: 'Translate scenarios; create test cases/results', deps: 'ORCH-PRD-01', outputs: `${qaPath}test-cases.md; ${qaPath}test-results-<DATE>.md` },
    { id: 'ORCH-VPE-08', owner: 'VP‑Eng', description: 'Feasibility/sequencing; Ready recommendation', deps: 'All above', outputs: 'PRD §9.6 decision; §9.4 checked' },
    { id: 'ORCH-IMP-09', owner: 'Implementation Owner', description: 'Implementation + rollback notes', deps: 'ORCH-VPE-08', outputs: 'PRD §9.6 updated' },
  ];
}

function parseIdAndSlugFromPrd(prdPath) {
  const base = path.basename(prdPath);
  const m = base.match(/^((\d+\.){3}\d+)-(.*?)-prd\.md$/);
  if (m) return { id: m[1], slug: m[3] };
  // If filename is non-standard, derive from content
  try {
    const text = readUtf8(prdPath);
    const id = deriveIdFromContent(text, prdPath);
    const slugMatch = text.match(/name:\s*([\w-]+)/) || base.match(/-(.*?)-prd\.md$/);
    const slug = slugMatch ? (slugMatch[1] || slugMatch[0]).replace(/-prd\.md$/,'') : '';
    return { id, slug };
  } catch {
    return { id: '', slug: '' };
  }
}

function ensureQaArtifacts(id, slug, dryRun) {
  const qaFolder = path.join(repoRoot, 'QA', `${id}-${slug}`);
  const casesPath = path.join(qaFolder, 'test-cases.md');
  const today = new Date().toISOString().slice(0, 10);
  const resultsPath = path.join(qaFolder, `test-results-${today}.md`);
  const actions = [];
  if (!fs.existsSync(qaFolder)) {
    actions.push({ type: 'mkdir', path: qaFolder });
    if (!dryRun) fs.mkdirSync(qaFolder, { recursive: true });
  }
  if (!fs.existsSync(casesPath)) {
    actions.push({ type: 'write', path: casesPath });
    if (!dryRun) writeUtf8(casesPath, `# Test Cases — ${id}-${slug}\n\n- Derive from PRD section 7.1/7.2.\n\n## Scenarios\n- [ ] ORCH-CLI-001 — Trigger parsing\n- [ ] ORCH-CLI-002 — PRD edits idempotent\n\n## Acceptance\n- Overall Status: Pass required before Ready flip.\n`);
  }
  if (!fs.existsSync(resultsPath)) {
    actions.push({ type: 'write', path: resultsPath });
    if (!dryRun) writeUtf8(resultsPath, `# ORCH START — Results (${today})\n\n- Build under test: local (N/A)\n- Overall Status: Pending\n- Notes: Initial orchestrator scaffold run.\n`);
  }
  return { qaFolder, casesPath, resultsPath, actions };
}

function updatePrd(prdPath, qaCasesRel, qaResultsRel, dryRun) {
  let text = readUtf8(prdPath);
  let changed = false;

  // Ensure §7.3 QA Artifacts lines exist/are updated
  if (/### 7\.3 QA Artifacts[\s\S]*?\n/.test(text)) {
    const updated = text.replace(/(### 7\.3 QA Artifacts[\s\S]*?)(\n<|\n## |\n<a id=|\n$)/m, (m0, p1, p2) => {
      const block = `### 7.3 QA Artifacts\n- Test cases file: \`${qaCasesRel}\`\n- Latest results: \`${qaResultsRel}\` (Overall Status: Pass required)\n`;
      return block + (p2 || '\n');
    });
    if (updated !== text) { text = updated; changed = true; }
  }

  // Append to §8 Changelog
  if (/## 8\. Changelog/.test(text)) {
    const today = new Date().toISOString().slice(0, 10);
    const updated = text.replace(/(## 8\. Changelog\n)/, `$1- orch: initial scaffold executed on ${today}.\n`);
    if (updated !== text) { text = updated; changed = true; }
  }

  if (changed && !dryRun) writeUtf8(prdPath, text);
  return changed;
}

function main() {
  const args = parseArgs(process.argv);
  let prdPath = args.prdPath ? path.resolve(args.prdPath) : '';
  if (!prdPath && args.id) {
    prdPath = resolvePrdPathById(args.id);
  }
  if (!prdPath || !fs.existsSync(prdPath)) {
    console.error('PRD not found. Use --prd-path <path> or --id <ROADMAP_ID>.');
    process.exit(1);
  }

  const { id, slug } = parseIdAndSlugFromPrd(prdPath);
  if (!id || !slug) {
    console.error('Unable to parse id/slug from PRD filename. Expected <id>-<slug>-prd.md');
    process.exit(1);
  }

  const { qaFolder, casesPath, resultsPath, actions } = ensureQa(id, slug, repoRoot, args.dryRun);
  const qaCasesRel = path.relative(repoRoot, casesPath).replace(/\\/g, '/');
  const qaResultsRel = path.relative(repoRoot, resultsPath).replace(/\\/g, '/');

  // PRD edits: owner (from roadmap), roles, handoffs, QA block, execution plan, changelog
  let prdText = readPrd(prdPath);
  let prdChanged = false;
  const roadmapOwner = resolveOwnerFromRoadmap(id);
  if (roadmapOwner) {
    prdText = setFrontmatterOwner(prdText, roadmapOwner);
  }
  // Roles: auto or explicit
  let selectedRoles = [];
  if (args.roles && args.roles !== 'auto') selectedRoles = args.roles.split(',').map(s => s.trim()).filter(Boolean);
  if (selectedRoles.length === 0) selectedRoles = autoSelectRoles(prdText);
  prdText = ensureRolesSection(prdText, roadmapOwner, selectedRoles);
  prdText = updateFrontmatterRoles(prdText, selectedRoles.map(r => `'${r}'`));
  const teamRoles = listTeamRoles(repoRoot);
  prdText = ensureOptionalTeamRoles(prdText, teamRoles);
  prdText = ensureHandoffContractsFromRoles(prdText, selectedRoles);
  prdText = ensureQaArtifactsBlock(prdText, qaCasesRel, qaResultsRel);
  const perRoleTasks = buildPerRoleTasks(id, slug).filter(t => selectedRoles.includes(t.owner) || (t.owner === 'VP‑Eng' && selectedRoles.includes('VP‑Eng')));
  prdText = ensurePerRoleExecutionPlanAfter93(prdText, perRoleTasks);
  // Role agents: auto-author contributions into PRD and QA artifacts
  const roleApply = applyRoleContributions(prdText, {
    id,
    slug,
    qaCasesPath: casesPath,
    evidenceRelPath: path.relative(repoRoot, path.join(repoRoot, 'security', 'evidence', `${id}-${slug}`)).replace(/\\/g, '/'),
    selectedRoles,
    repoRoot,
  });
  prdText = roleApply.text;
  // Execute per-role tasks (development-first)
  // Generation is disabled by default unless --gen is passed
  const exec = !!args.gen;
  const roleExec = executeRoleTasks(prdText, selectedRoles, { qaCasesPath: casesPath, exec, repoRoot, dryRun: args.dryRun, overwrite: args.overwrite });
  if (args.review) {
    prdText = ensureReviewerNotes(prdText, { 'PM': 'Initial review and scope confirmation', 'Technical Product Manager': 'Technical spec/grammar confirmed' });
    prdText = tickReviewChecklist(prdText, ['PM', 'Technical Product Manager']);
    prdText = updateQaResultPathInReview(prdText, qaResultsRel);
  }
  // Dynamic sign-off checklist from roles
  prdText = ensureReviewLogFromRoles(prdText, selectedRoles, qaResultsRel);
  prdText = appendChangelog(prdText, `- orch: scaffold + QA links updated on ${new Date().toISOString().slice(0, 10)}.`);
  prdChanged = true;
  if (!args.dryRun) writePrd(prdPath, prdText);

  // Run default workflow (install, lint, unit) — stop on failure
  const workflow = runDefaultWorkflow(repoRoot, args.dryRun);
  // E2E flow (optional gate): run after unit tests if previous steps ok
  const e2e = runE2E(repoRoot, args.dryRun);
  // Security gates and evidence capture
  const security = runSecurityGates(repoRoot, id, slug, args.dryRun);

  // Auto flip to Ready/Done if gates pass (apply mode only)
  let autoFlips = { ready: false, done: false };
  if (!args.dryRun) {
    const qaOk = evaluateQaPass(path.join(repoRoot, 'QA', `${id}-${slug}`)).ok;
    const secOk = evaluateSecurity(path.join(repoRoot, 'security', 'evidence', `${id}-${slug}`)).ok;
    if (qaOk && secOk) {
      // Mark Ready then Done (with date) in roadmap
      // Ready -> done handled by two flips, keeping it simple: set to Done (date)
      const today = new Date().toISOString().slice(0, 10);
      const doneChanged = flipRoadmapStatus(repoRoot, id, `Done (${today})`, path.relative(repoRoot, prdPath).replace(/\\/g, '/'), path.relative(repoRoot, qaFolder).replace(/\\/g, '/'), true);
      if (doneChanged) {
        autoFlips = { ready: true, done: true };
        regenerateRoadmapHtml(repoRoot);
      }
    }
  }

  // Flip roadmap to In Progress and regenerate mirror when not dry-run
  let roadmapChanged = false;
  if (!args.dryRun) {
    roadmapChanged = flipRoadmapStatus(repoRoot, id, 'In Progress', path.relative(repoRoot, prdPath).replace(/\\/g, '/'), path.relative(repoRoot, qaFolder).replace(/\\/g, '/'), true);
    if (roadmapChanged) regenerateRoadmapHtml(repoRoot);
  }

  const development = [];
  for (const a of actions) {
    if (a.type === 'write' || a.type === 'mkdir') development.push({ role: 'QA', path: path.relative(repoRoot, a.path || (a.target || '')).replace(/\\/g,'/') });
  }
  for (const a of roleExec.developmentActions || []) {
    development.push(a);
  }
  const summary = {
    mode: args.dryRun ? 'dry-run' : 'apply',
    gen: !!args.gen,
    overwrite: !!args.overwrite,
    prdPath: path.relative(repoRoot, prdPath),
    id,
    slug,
    qaFolder: path.relative(repoRoot, qaFolder),
    actions,
    development,
    prdChanged,
    workflow,
    e2e,
    security,
    roadmapChanged,
    autoFlips,
  };
  console.log(JSON.stringify(summary, null, 2));
}

main();



```

# scaffold-feature.mjs

```javascript
#!/usr/bin/env node
// Scaffolds a feature from the roadmap:
// - Creates PRD from template
// - Creates QA folder with test-cases.md
// - Creates a Kickoff Plan from template
// - Updates Plans/product-roadmap.md row (Status → In Progress if Planned; set PRD/QA paths)
// - Regenerates docs/product-roadmap.html

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

const mdPath = path.join(repoRoot, 'Plans', 'product-roadmap.md');
const prdTemplatePath = path.join(repoRoot, 'PRDs', '_templates', 'PRD-template.md');
const kickoffTemplatePath = path.join(repoRoot, 'PRDs', '_templates', 'feature-kickoff-plan.md');

function read(p) { return fs.readFileSync(p, 'utf8'); }
function write(p, s) { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, s); }
function exists(p) { return fs.existsSync(p); }

function slugify(title) {
  const ascii = title
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
  return ascii
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .replace(/--+/g, '-');
}

function parseArgs(argv) {
  const args = { id: '', kickoff: false };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--kickoff') { args.kickoff = true; continue; }
    const m = a.match(/^--(\w+?)=(.*)$/);
    if (m) { args[m[1]] = m[2]; continue; }
    if (!args.id && /^(\d+\.){3}\d+$/.test(a)) { args.id = a; continue; }
  }
  if (!args.id) {
    console.error('Usage: node lib/scaffold-feature.mjs --id 2.1.1.2 [--kickoff]');
    process.exit(1);
  }
  return args;
}

function parseRoadmapRows(md) {
  const lines = md.split(/\r?\n/);
  const rows = [];
  for (let idx = 0; idx < lines.length; idx++) {
    if (/\|\s*Phase\s*\|\s*ID\s*\|\s*Item\s*\|\s*Status/i.test(lines[idx])) {
      idx += 2; // skip header separator
      for (; idx < lines.length; idx++) {
        const line = lines[idx];
        if (!line || !line.trim().startsWith('|')) break;
        const cols = line.split('|').slice(1, -1).map(c => c.trim());
        if (cols.length < 7) continue;
        rows.push({
          raw: line,
          phase: cols[0],
          id: cols[1],
          item: cols[2],
          status: cols[3],
          owner: cols[4],
          plan: cols[5],
          files: cols[6],
          idx,
        });
      }
    }
  }
  return rows;
}

function deriveMilestone(phaseCell) {
  // Expect formats like: "M0 — Founder Instance"
  const head = (phaseCell || '').split('—')[0].trim();
  return head || 'M0';
}

function ensurePrd(prdPath, roadmapId, owner, milestone, featureTitle) {
  if (exists(prdPath)) return false;
  const template = read(prdTemplatePath);
  const today = new Date().toISOString().slice(0, 10);
  const slug = path.basename(prdPath).replace(/^(\d+\.){3}\d+-|(-prd\.md)$/g, '');
  const out = template
    .replace(/<feature-name>/g, slug)
    .replace(/<yyyy-mm-dd>/g, today)
    .replace(/<team\/role>/g, owner || 'Implementation Owner')
    .replace(/<link to strategy or parent doc>/g, 'Plans/product-roadmap.md')
    .replace(/M<0-9> \(<roadmap id e\.g\., 2\.1\.1\.1\)>/g, `${milestone} (${roadmapId})`);
  write(prdPath, out);
  return true;
}

function ensureQa(qaCasesPath) {
  if (exists(qaCasesPath)) return false;
  const idSlug = qaCasesPath
    .replace(/^.*QA\//, '')
    .replace(/\/test-cases\.md$/, '');
  const content = `# Test Cases — ${idSlug}\n\n- Derive from PRD section 7.1/7.2.\n- Record environment assumptions and acceptance expectations.\n\n## Scenarios\n- [ ] T-001 — ...\n- [ ] T-002 — ...\n\n## Acceptance\n- Overall Status: Pass required before Ready flip.\n`;
  write(qaCasesPath, content);
  return true;
}

function ensureKickoff(kickoffPath, ctx) {
  if (!ctx.createKickoff) return false;
  if (exists(kickoffPath)) return false;
  if (!exists(kickoffTemplatePath)) return false;
  let t = read(kickoffTemplatePath);
  t = t
    .replace(/{{ROADMAP_ID}}/g, ctx.id)
    .replace(/{{FEATURE_TITLE}}/g, ctx.item)
    .replace(/{{PRD_PATH}}/g, ctx.prdPath)
    .replace(/{{QA_FOLDER}}/g, path.dirname(ctx.qaCasesPath) + '/');
  write(kickoffPath, t);
  return true;
}

function updateRoadmap(md, target, newPlan, newFiles, newStatus) {
  const lines = md.split(/\r?\n/);
  let changed = false;
  for (let idx = 0; idx < lines.length; idx++) {
    const line = lines[idx];
    if (!line || !line.trim().startsWith('|')) continue;
    if (!line.includes(`| ${target.id} |`)) continue;
    const cols = line.split('|');
    if (cols.length < 9) continue;
    const status = cols[4].trim();
    const plan = cols[6].trim();
    const files = cols[7].trim();
    const nextStatus = newStatus || status;
    const nextPlan = newPlan || plan;
    const nextFiles = newFiles || files;
    const rebuilt = [
      cols[0],
      ` ${target.phase} `,
      ` ${target.id} `,
      ` ${target.item} `,
      ` ${nextStatus} `,
      ` ${target.owner} `,
      ` ${nextPlan} `,
      ` ${nextFiles} `,
      cols[8] ?? ' '
    ].join('|');
    if (rebuilt !== line) {
      lines[idx] = rebuilt;
      changed = true;
    }
    break;
  }
  return { text: lines.join('\n'), changed };
}

function main() {
  const args = parseArgs(process.argv);
  const md = read(mdPath);
  const rows = parseRoadmapRows(md);
  const row = rows.find(r => r.id === args.id);
  if (!row) {
    console.error(`Roadmap ID not found in ${mdPath}: ${args.id}`);
    process.exit(1);
  }

  const milestone = deriveMilestone(row.phase);
  const title = row.item;
  const slug = slugify(title);

  // Determine PRD path and QA folder
  const planCell = (row.plan || '').replace(/`/g, '');
  const filesCell = (row.files || '').replace(/`/g, '');
  const defaultPrd = path.join('PRDs', milestone, `${row.id}-${slug}-prd.md`);
  const prdPath = planCell || defaultPrd;
  const defaultQaFolder = path.join('QA', `${row.id}-${slug}`);
  const qaFolder = filesCell || defaultQaFolder;

  const absPrdPath = path.join(repoRoot, prdPath);
  const qaCasesPath = path.join(repoRoot, qaFolder, 'test-cases.md');
  const kickoffPath = path.join(repoRoot, 'PRDs', milestone, `${row.id}-${slug}-kickoff.md`);

  const prdCreated = ensurePrd(absPrdPath, row.id, row.owner, milestone, title);
  const qaCreated = ensureQa(qaCasesPath);
  const kickoffCreated = ensureKickoff(kickoffPath, { id: row.id, item: title, prdPath, qaCasesPath, createKickoff: args.kickoff });

  // Update roadmap line: ensure backticked paths and flip status if still Planned
  const desiredStatus = (/^planned/i.test(row.status) ? 'In Progress' : row.status);
  const desiredPlan = `\`${prdPath}\``;
  const desiredFiles = `\`${qaFolder}/\``;
  const { text: updatedMd, changed } = updateRoadmap(md, row, desiredPlan, desiredFiles, desiredStatus);
  if (changed) write(mdPath, updatedMd);

  // Regenerate HTML mirror
  try {
    execSync('node lib/generate-roadmap-html.mjs', { cwd: repoRoot, stdio: 'inherit' });
  } catch (e) {
    console.error('Failed to regenerate roadmap HTML:', e?.message || e);
    process.exit(1);
  }

  console.log('Scaffold complete:', {
    prdCreated,
    qaCreated,
    kickoffCreated,
    prdPath,
    qaFolder: qaFolder + '/',
    kickoffPath: path.relative(repoRoot, kickoffPath),
  });
}

main();



```

# prd-extractors.mjs

```javascript
// PRD content extractors
// - Resilient to common wording variations
// - Case-insensitive parsing
// - Deduplicates results and normalizes shapes

/**
 * Extract API route specifications from PRD text.
 * Returns entries like: { resource: 'auth/login', path: '/api/auth/login', methods: ['POST'] }
 * @param {string} prdText
 * @returns {Array<{ resource: string, path: string, methods: string[] }>} 
 */
export function extractAPIRoutesFromPRD(prdText) {
  const text = String(prdText || '');
  const routesByPath = new Map();

  const addRoute = (pathStr, methods) => {
    if (!pathStr || !pathStr.startsWith('/api/')) return;
    const cleanPath = sanitizePath(pathStr);
    const resource = cleanPath.replace(/^\/?api\//i, '');
    const existing = routesByPath.get(cleanPath) || { resource, path: cleanPath, methods: [] };
    for (const m of (methods && methods.length ? methods : ['GET', 'POST'])) {
      const up = m.toUpperCase();
      if (!existing.methods.includes(up)) existing.methods.push(up);
    }
    routesByPath.set(cleanPath, existing);
  };

  // Pattern A: "API endpoint POST /api/foo" or "API endpoint GET /api/foo"
  for (const m of matchAll(text, /API\s+endpoint\s+(GET|POST|PUT|PATCH|DELETE|OPTIONS|HEAD)\s+((?:\/api\/[\w\-\/]+))/gi)) {
    addRoute(m[2], [m[1]]);
  }

  // Pattern B: "Create POST /api/foo endpoint" or "Add GET /api/foo endpoint"
  for (const m of matchAll(text, /(Create|Add|Expose|Provide)\s+(GET|POST|PUT|PATCH|DELETE|OPTIONS|HEAD)\s+((?:\/api\/[\w\-\/]+))\s+endpoint/gi)) {
    addRoute(m[3], [m[2]]);
  }

  // Pattern C: "Create /api/foo endpoint" (methods default to GET, POST)
  for (const m of matchAll(text, /(Create|Add|Expose|Provide)\s+((?:\/api\/[\w\-\/]+))\s+endpoint/gi)) {
    addRoute(m[2], ['GET', 'POST']);
  }

  // Pattern D: method-first mentions like "POST /api/foo" or list forms "- [POST] /api/foo"
  for (const m of matchAll(text, /(?:\[)?(GET|POST|PUT|PATCH|DELETE|OPTIONS|HEAD)(?:\])?\s+((?:\/api\/[\w\-\/]+))/gi)) {
    addRoute(m[2], [m[1]]);
  }

  // Pattern E: generic mention "endpoint at /api/foo"
  for (const m of matchAll(text, /endpoint\s+(?:at\s+)?((?:\/api\/[\w\-\/]+))/gi)) {
    addRoute(m[1], ['GET', 'POST']);
  }

  return Array.from(routesByPath.values());
}

/**
 * Extract page specifications from PRD text.
 * Returns entries like: { name, route: '/dashboard', title, hasForm?, fields? }
 * @param {string} prdText
 * @returns {Array<{ name: string, route: string, title: string, hasForm?: boolean, fields?: string[] }>} 
 */
export function extractPagesFromPRD(prdText) {
  const text = String(prdText || '');
  const byRoute = new Map();

  const addPage = (name, route) => {
    if (!route || !route.startsWith('/')) return;
    const cleanRoute = sanitizePath(route);
    const pageName = (name || route.split('/').filter(Boolean).slice(-1)[0] || 'page').toLowerCase();
    const title = toTitleCase(pageName);
    if (!byRoute.has(cleanRoute)) {
      byRoute.set(cleanRoute, { name: pageName, route: cleanRoute, title });
    }
  };

  // Pattern A: "dashboard page at /dashboard"
  for (const m of matchAll(text, /(\w[\w\s\-]+?)\s+page\s+at\s+(\/[\w\-\/]*)/gi)) {
    addPage(m[1].trim(), m[2]);
  }

  // Pattern B: "Create page /foo" or "Add page at /foo"
  for (const m of matchAll(text, /(?:Create|Add)\s+page(?:\s+at)?\s+(\/[\w\-\/]*)/gi)) {
    addPage(undefined, m[1]);
  }

  // Pattern C: user stories "user can view <name>" → route '/<name>'
  for (const m of matchAll(text, /user\s+can\s+view\s+([\w\-]+)/gi)) {
    const name = m[1];
    addPage(name, `/${name.toLowerCase()}`);
  }

  // Pattern D: explicit routes: "page: /foo/bar"
  for (const m of matchAll(text, /page\s*:\s*(\/[\w\-\/]*)/gi)) {
    addPage(undefined, m[1]);
  }

  // Augment with form hints and fields when nearby mentions exist
  const pages = Array.from(byRoute.values());
  for (const page of pages) {
    const near = windowAround(text, page.route, 600);
    const hasForm = /\bform\b|\bsubmit\b|\bsubmission\b/i.test(near) || new RegExp(`${escapeRegExp(page.name)}\s+form`, 'i').test(near);
    if (hasForm) {
      page.hasForm = true;
      page.fields = extractFormFields(near, page.name);
    }
  }

  return pages;
}

/**
 * Extract Prisma model specifications from PRD text.
 * Returns entries like: { modelName: 'User', fields: [{ name, type, required, unique? }, ...] }
 * @param {string} prdText
 * @returns {Array<{ modelName: string, fields: Array<{ name: string, type: string, required?: boolean, unique?: boolean }> }>} 
 */
export function extractModelsFromPRD(prdText) {
  const text = String(prdText || '');
  const byModel = new Map();

  const addModel = (modelName, fieldsList) => {
    if (!modelName) return;
    const canonical = toPascalCase(modelName);
    const fields = (fieldsList || []).map((f) => normalizeFieldSpec(f));
    const existing = byModel.get(canonical) || { modelName: canonical, fields: [] };
    // Merge fields, dedupe by name
    for (const fld of fields) {
      if (!existing.fields.find((e) => e.name === fld.name)) existing.fields.push(fld);
    }
    byModel.set(canonical, existing);
  };

  // Pattern A: "User model with email, password fields"
  for (const m of matchAll(text, /(\w[\w\s]+?)\s+model\s+with\s+([^\.!?\n]+)/gi)) {
    const modelName = m[1].trim();
    const fieldsText = m[2];
    addModel(modelName, parseFieldsFromText(fieldsText));
  }

  // Pattern B: "Model User with fields: email, password"
  for (const m of matchAll(text, /model\s+(\w[\w\s]+?)\s+with\s+fields?:\s*([^\.!?\n]+)/gi)) {
    const modelName = m[1].trim();
    addModel(modelName, parseFieldsFromText(m[2]));
  }

  // Pattern C: "Prisma model: User { email, password }"
  for (const m of matchAll(text, /prisma\s+model:\s*(\w[\w\s]+?)\s*\{([^\}]*)\}/gi)) {
    const modelName = m[1].trim();
    addModel(modelName, parseFieldsFromText(m[2]));
  }

  // Pattern D: "Database table User: email, password"
  for (const m of matchAll(text, /(database\s+table|db\s+table)\s+(\w[\w\s]+?):\s*([^\.!?\n]+)/gi)) {
    const modelName = m[2].trim();
    addModel(modelName, parseFieldsFromText(m[3]));
  }

  // Heuristics for common auth cases mentioned without explicit model
  if (/user\s+authentication|login|signup|register/i.test(text) && !byModel.has('User')) {
    addModel('User', [
      { name: 'email' },
      { name: 'password' },
      { name: 'name' }
    ]);
  }

  return Array.from(byModel.values());
}

// ------------------ Helpers ------------------

function matchAll(text, regex) {
  const results = [];
  let m;
  while ((m = regex.exec(text)) !== null) results.push(m);
  return results;
}

function sanitizePath(p) {
  return String(p || '').trim().replace(/[#.,;]+$/, '');
}

function toTitleCase(s) {
  return String(s || '')
    .split(/\s|[-_]/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

function toPascalCase(s) {
  return String(s || '')
    .split(/\s|[-_]/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join('');
}

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function windowAround(text, pivot, span = 400) {
  const idx = text.toLowerCase().indexOf(String(pivot || '').toLowerCase());
  if (idx === -1) return text.slice(0, Math.min(text.length, span));
  const start = Math.max(0, idx - span);
  const end = Math.min(text.length, idx + span);
  return text.slice(start, end);
}

function parseFieldsFromText(fieldsText) {
  const raw = String(fieldsText || '')
    .replace(/\bfields?\b/i, '')
    .replace(/\bwith\b/i, '')
    .split(/[,\n]|\band\b/i)
    .map((s) => s.trim())
    .filter(Boolean);
  const dedup = [];
  for (const f of raw) {
    const norm = f.toLowerCase();
    if (!dedup.includes(norm)) dedup.push(norm);
  }
  return dedup.map((name) => ({ name }));
}

function normalizeFieldSpec(field) {
  const name = typeof field === 'string' ? field : field?.name;
  const type = inferFieldType(name);
  const spec = { name: toCamelCase(name), type, required: true };
  if (/email/i.test(name)) spec.unique = true;
  return spec;
}

function toCamelCase(s) {
  const parts = String(s || '').split(/\s|[-_]/).filter(Boolean);
  if (parts.length === 0) return '';
  return parts
    .map((w, i) => (i === 0 ? w.toLowerCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()))
    .join('');
}

function extractFormFields(text, formName) {
  const near = windowAround(text, formName, 500);
  // Patterns like: "fields: email, password" | "inputs: name and email" | "with email, password fields"
  const patterns = [
    /fields?\s*:\s*([^\.!?\n]+)/i,
    /inputs?\s*:\s*([^\.!?\n]+)/i,
    /with\s+([^\.!?\n]+)\s+fields?/i,
  ];
  for (const re of patterns) {
    const m = near.match(re);
    if (m) return String(m[1])
      .split(/,|\band\b/i)
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => s.toLowerCase());
  }
  // Defaults for common forms if unspecified
  const lower = String(formName || '').toLowerCase();
  if (/(login|signin)/i.test(lower)) return ['email', 'password'];
  if (/(register|signup)/i.test(lower)) return ['name', 'email', 'password'];
  return [];
}

function inferFieldType(fieldName) {
  const name = String(fieldName || '').toLowerCase();
  if (name.includes('email')) return 'String';
  if (name.includes('password') || name.includes('hash')) return 'String';
  if (name.includes('name') || name.includes('title')) return 'String';
  if (name.includes('date') || name.includes('time') || name.endsWith('At')) return 'DateTime';
  if (name.includes('count') || name.includes('number') || name.includes('age') || /^num[A-Z]/.test(fieldName || '')) return 'Int';
  if (/^is[A-Z]|^has[A-Z]|active$|enabled$/.test(fieldName || '') || name.startsWith('is') || name.startsWith('has')) return 'Boolean';
  if (name.includes('json') || name.includes('meta')) return 'Json';
  return 'String';
}

// Export helper for external use in page generators if needed
export { extractFormFields };



```

# prd-utils.mjs

```javascript
import fs from 'node:fs';
import path from 'node:path';

export function readPrd(prdPath) {
  return fs.readFileSync(prdPath, 'utf8');
}

export function writePrd(prdPath, content) {
  fs.mkdirSync(path.dirname(prdPath), { recursive: true });
  fs.writeFileSync(prdPath, content);
}

export function setFrontmatterOwner(prdContent, owner) {
  // Replace owner: <...> in YAML frontmatter
  const updated = prdContent.replace(/(^|\n)(owner:\s*)(.*)(\n)/, ($0, p1, p2, _p3, p4) => `${p1}${p2}${owner}${p4}`);
  return updated;
}

export function ensureRolesSection(prdContent, owner, rolesList) {
  const defaultLine = '- PM → VP-Product → Technical Product Manager → CTO → Security (CISO) → UX/UI → Legal → QA → VP‑Eng → Implementation Owner';
  const labelMap = {
    'Security': 'Security (CISO)',
  };
  const rolesLine = rolesList && rolesList.length > 0
    ? `- ${rolesList.map(r => labelMap[r] || r).join(' → ')}`
    : defaultLine;
  const block = `### 9.1 Roles and Order\n${rolesLine}\n`;
  if (/### 9\.1 Roles and Order/.test(prdContent)) {
    return prdContent.replace(/### 9\.1 Roles and Order[\s\S]*?(?=\n### 9\.2|\n<a id=|\n$)/, block + (owner ? `\n` : '\n'));
  }
  // Insert before 9.2 if possible
  if (/### 9\.2 /.test(prdContent)) {
    return prdContent.replace(/(### 9\.2[\s\S]*?)/, block + '\n$1');
  }
  return prdContent + '\n' + block + '\n';
}

export function ensureOptionalTeamRoles(prdContent, roles) {
  const header = '#### Additional Available Roles (Optional)';
  const exists = new RegExp(header.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).test(prdContent);
  if (exists) return prdContent;
  if (!roles || roles.length === 0) return prdContent;
  const list = roles.map(r => `- ${r.name} — \`${r.path}\``).join('\n');
  const block = `\n${header}\n${list}\n`;
  if (/### 9\.1 Roles and Order/.test(prdContent)) {
    return prdContent.replace(/(### 9\.1 Roles and Order[\s\S]*?)(?=\n### 9\.2|\n<a id=|\n$)/, (m) => m + block);
  }
  if (/## 9\./.test(prdContent)) {
    return prdContent.replace(/(## 9\.[\s\S]*?)(?=\n## |\n<a id=|\n$)/, (m) => m + block);
  }
  return prdContent + block;
}

export function ensureHandoffContractsFromRoles(prdContent, roles) {
  const roleToContract = {
    'PM': '- PM: scope, user stories, acceptance',
    'Technical Product Manager': '- Technical Product Manager: specs/grammar, constraints, evidence schema',
    'Implementation Owner': '- Implementation Owner: implementation plan and rollback',
    'Frontend Engineer': '- Frontend Engineer: UI components/pages; states; tests',
    'Backend Engineer': '- Backend Engineer: APIs/handlers; DB/prisma changes; tests',
    'UX/UI': '- UX/UI: labels, error states, a11y notes',
    'Legal': '- Legal: disclaimers/privacy/consent approvals',
    'Security': '- Security: threat model; scans plan; evidence paths; no High/Critical',
    'DevOps/SRE': '- DevOps/SRE: CI/CD jobs; environments; monitoring/runbook',
    'DevSecOps': '- DevSecOps: CI security gates; SBOM/secrets/deps/SAST/DAST',
    'QA': '- QA: test scenarios; results; evidence',
    'VP‑Eng': '- VP‑Eng: feasibility/sequencing; Ready recommendation',
  };
  const lines = roles.map(r => roleToContract[r]).filter(Boolean);
  const block = `### 9.3 Handoff Contracts (Inputs → Outputs)\n${lines.join('\n')}\n`;
  if (/### 9\.3 Handoff Contracts/.test(prdContent)) {
    return prdContent.replace(/### 9\.3 Handoff Contracts[\s\S]*?(?=\n### 9\.4|\n<a id=|\n$)/, block);
  }
  if (/### 9\.2 /.test(prdContent)) {
    return prdContent.replace(/(### 9\.2[\s\S]*?)(?=\n### 9\.4|\n<a id=|\n$)/, (m) => m + '\n' + block);
  }
  return prdContent + '\n' + block + '\n';
}

export function ensureReviewLogFromRoles(prdContent, roles, qaResultsRel) {
  const governance = new Set(roles);
  // Enforce required governance sign-offs
  if (roles.some(r => ['Frontend Engineer', 'Backend Engineer', 'Implementation Owner'].includes(r))) governance.add('VP‑Eng');
  if (roles.includes('Security')) governance.add('Security (Leadership)');
  if (roles.includes('UX/UI')) governance.add('UX Lead');
  if (roles.includes('Legal')) governance.add('Legal/Compliance');
  governance.add('QA');
  const label = (r) => {
    if (r === 'Security (Leadership)') return 'Security — Leadership';
    if (r === 'UX Lead') return 'UX — Lead';
    if (r === 'Legal/Compliance') return 'Legal/Compliance';
    return r;
  };
  const lines = Array.from(governance).map(r => `- [ ] ${label(r)}${r === 'QA' && qaResultsRel ? ` — Results published at: \`${qaResultsRel}\`` : ''}`);
  const block = `### 9.4 Review Log & Sign‑offs\n${lines.join('\n')}\n`;
  if (/### 9\.4 Review Log/.test(prdContent)) {
    return prdContent.replace(/### 9\.4[\s\S]*?(?=\n### 9\.5|\n<a id=|\n$)/, block);
  }
  return prdContent + '\n' + block + '\n';
}

export function ensureQaArtifactsBlock(prdContent, qaCasesRel, qaResultsRel) {
  // Replace or insert §7.3
  const block = `### 7.3 QA Artifacts\n- Test cases file: \`${qaCasesRel}\`\n- Latest results: \`${qaResultsRel}\` (Overall Status: Pass required)\n`;
  if (/### 7\.3 QA Artifacts/.test(prdContent)) {
    return prdContent.replace(/### 7\.3 QA Artifacts[\s\S]*?(?=\n## |\n<a id=|\n$)/, block + '\n');
  }
  // Insert after 7.2 if present, else after §7
  if (/### 7\.2/.test(prdContent)) {
    return prdContent.replace(/(### 7\.2[\s\S]*?)(?=\n## |\n<a id=|\n$)/, (m) => m + '\n' + block + '\n');
  }
  if (/## 7\./.test(prdContent)) {
    return prdContent.replace(/(## 7\.[\s\S]*?)(?=\n## |\n<a id=|\n$)/, (m) => m + '\n' + block + '\n');
  }
  return prdContent + '\n' + block + '\n';
}

export function appendChangelog(prdContent, note) {
  if (!/## 8\. Changelog/.test(prdContent)) {
    return prdContent + `\n## 8. Changelog\n${note}\n`;
  }
  return prdContent.replace(/(## 8\. Changelog\n)/, `$1${note}\n`);
}

export function ensureExecutionPlanAfter93(prdContent) {
  // Insert minimal Execution Plan table after §9.3 if no table exists
  const already = /Execution Plan \(Decomposed Tasks\)/.test(prdContent);
  if (already) return prdContent;
  const table = `\n#### Execution Plan (Decomposed Tasks)\n\n| Task ID | Owner (Role) | Description | Preconditions/Dependencies | Outputs (Files/PRD sections) | Risks/Issues | Status |\n| --- | --- | --- | --- | --- | --- | --- |\n| ORCH-TBD | Implementation Owner | Populate tasks per PRD | — | PRD §9.3 updated | — | Planned |\n\n`;
  if (/### 9\.3 Handoff Contracts/.test(prdContent)) {
    return prdContent.replace(/(### 9\.3 Handoff Contracts[\s\S]*?)(?=\n### 9\.4|\n<a id=|\n$)/, (m) => m + table);
  }
  // If §9.3 not found, append near §9
  if (/## 9\./.test(prdContent)) {
    return prdContent.replace(/(## 9\.[\s\S]*?)(?=\n## |\n<a id=|\n$)/, (m) => m + table);
  }
  return prdContent + table;
}

export function ensurePerRoleExecutionPlanAfter93(prdContent, tasks) {
  // Do not insert if one already exists
  const already = /Execution Plan \(Decomposed Tasks\)/.test(prdContent);
  if (already) return prdContent;
  const header = `\n#### Execution Plan (Decomposed Tasks)\n\n| Task ID | Owner (Role) | Description | Preconditions/Dependencies | Outputs (Files/PRD sections) | Risks/Issues | Status |\n| --- | --- | --- | --- | --- | --- | --- |\n`;
  const rows = tasks.map(t => `| ${t.id} | ${t.owner} | ${t.description} | ${t.deps || '—'} | ${t.outputs || '—'} | ${t.risks || '—'} | Planned |`).join('\n');
  const table = header + rows + '\n\n';
  if (/### 9\.3 Handoff Contracts/.test(prdContent)) {
    return prdContent.replace(/(### 9\.3 Handoff Contracts[\s\S]*?)(?=\n### 9\.4|\n<a id=|\n$)/, (m) => m + table);
  }
  if (/## 9\./.test(prdContent)) {
    return prdContent.replace(/(## 9\.[\s\S]*?)(?=\n## |\n<a id=|\n$)/, (m) => m + table);
  }
  return prdContent + table;
}

export function ensureReviewerNotes(prdContent, notesByRole) {
  if (!notesByRole || Object.keys(notesByRole).length === 0) return prdContent;
  const today = new Date().toISOString().slice(0, 10);
  const lines = Object.entries(notesByRole).map(([role, note]) => `- [${role} ${today}] ${note}`);
  const block = `### 9.5 Reviewer Notes\n${lines.join('\n')}\n`;
  if (/### 9\.5 Reviewer Notes/.test(prdContent)) {
    // Append new lines rather than replace entirely
    return prdContent.replace(/(### 9\.5 Reviewer Notes\n)([\s\S]*?)(?=\n### 9\.6|\n<a id=|\n$)/, (m, p1, p2) => p1 + (p2?.trim() ? p2.trim() + '\n' : '') + lines.join('\n') + '\n');
  }
  // Insert before 9.6 if possible
  if (/### 9\.6 /.test(prdContent)) {
    return prdContent.replace(/(### 9\.6[\s\S]*?)/, block + '\n$1');
  }
  return prdContent + '\n' + block + '\n';
}

export function tickReviewChecklist(prdContent, rolesToTick) {
  if (!rolesToTick || rolesToTick.length === 0) return prdContent;
  let text = prdContent;
  for (const role of rolesToTick) {
    const escaped = role.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Replace line like "- [ ] PM —" to "- [x] PM —"
    const re = new RegExp(`- \\[ \\] ${escaped}(\\s+—[\\"][^\\n]*|\\s+—[^\\n]*)?`, '');
    text = text.replace(re, (m) => m.replace('[ ]', '[x]'));
  }
  return text;
}

export function updateQaResultPathInReview(prdContent, qaResultsRel) {
  const re = /(### 9\.4[\s\S]*?- \[[ x]\] QA — Results published at:\s*)`[^`]+`/;
  if (re.test(prdContent)) {
    return prdContent.replace(re, ($0, p1) => `${p1}\`${qaResultsRel}\``);
  }
  return prdContent;
}

function upsertFrontmatterKey(prdContent, key, valueLine) {
  const fmStart = prdContent.indexOf('---');
  if (fmStart !== 0) return prdContent;
  const fmEnd = prdContent.indexOf('\n---', 3);
  if (fmEnd === -1) return prdContent;
  const head = prdContent.slice(0, fmEnd + 4);
  const body = prdContent.slice(fmEnd + 4);
  const lines = head.split(/\r?\n/);
  const idx = lines.findIndex(l => l.startsWith(`${key}:`));
  if (idx !== -1) {
    lines[idx] = `${key}: ${valueLine}`;
  } else {
    // Insert after owner if present, else before closing ---
    const ownerIdx = lines.findIndex(l => l.startsWith('owner:'));
    const insertIdx = ownerIdx !== -1 ? ownerIdx + 1 : lines.length - 1;
    lines.splice(insertIdx, 0, `${key}: ${valueLine}`);
  }
  return lines.join('\n') + body;
}

export function updateFrontmatterRoles(prdContent, roles) {
  const yamlArray = `[${roles.join(', ')}]`;
  return upsertFrontmatterKey(prdContent, 'roles', yamlArray);
}



```

# qa-utils.mjs

```javascript
import fs from 'node:fs';
import path from 'node:path';

export function ensureQa(id, slug, repoRoot, dryRun = false) {
  const qaFolder = path.join(repoRoot, 'QA', `${id}-${slug}`);
  const casesPath = path.join(qaFolder, 'test-cases.md');
  const today = new Date().toISOString().slice(0, 10);
  const resultsPath = path.join(qaFolder, `test-results-${today}.md`);
  const actions = [];
  if (!fs.existsSync(qaFolder)) {
    actions.push({ type: 'mkdir', path: qaFolder });
    if (!dryRun) fs.mkdirSync(qaFolder, { recursive: true });
  }
  if (!fs.existsSync(casesPath)) {
    actions.push({ type: 'write', path: casesPath });
    if (!dryRun) fs.writeFileSync(casesPath, `# Test Cases — ${id}-${slug}\n\n- Derive from PRD section 7.1/7.2.\n\n## Scenarios\n- [ ] ORCH-CLI-001 — Trigger parsing\n- [ ] ORCH-CLI-002 — PRD edits idempotent\n\n## Acceptance\n- Overall Status: Pass required before Ready flip.\n`);
  }
  if (!fs.existsSync(resultsPath)) {
    actions.push({ type: 'write', path: resultsPath });
    if (!dryRun) fs.writeFileSync(resultsPath, `# ORCH START — Results (${today})\n\n- Build under test: local\n- Overall Status: Pending\n- Notes: Orchestrator run.\n`);
  }
  return { qaFolder, casesPath, resultsPath, actions };
}



```

# roadmap-utils.mjs

```javascript
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

export function flipRoadmapStatus(repoRoot, id, desiredStatus, prdRelPath, qaFolderRel, apply = false) {
  const roadmapPath = path.join(repoRoot, 'Plans', 'product-roadmap.md');
  let md = fs.readFileSync(roadmapPath, 'utf8');
  const lines = md.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.includes(`| ${id} |`)) continue;
    const cols = line.split('|');
    if (cols.length < 9) break;
    cols[4] = ` ${desiredStatus} `;
    cols[6] = ` \`${prdRelPath}\` `;
    cols[7] = ` \`${qaFolderRel}/\` `;
    const rebuilt = cols.join('|');
    lines[i] = rebuilt;
    break;
  }
  const updated = lines.join('\n');
  if (apply) fs.writeFileSync(roadmapPath, updated);
  return updated !== md;
}

export function regenerateRoadmapHtml(repoRoot) {
  execSync('node lib/generate-roadmap-html.mjs', { cwd: repoRoot, stdio: 'inherit' });
}



```

# role-agents.mjs

```javascript
import fs from 'node:fs';
import path from 'node:path';
import { getRoleSnippets } from './role-style.mjs';

function appendToSection(prdText, sectionHeaderRegex, content) {
  const re = new RegExp(`(${sectionHeaderRegex.source}[\n\r]+)([\s\S]*?)(?=\n## |\n<a id=|\n$)`, 'm');
  if (re.test(prdText)) {
    return prdText.replace(re, (m, p1, p2) => {
      if (p2 && p2.includes(content.trim())) return m; // idempotent
      return p1 + (p2 || '') + (p2 && !p2.endsWith('\n') ? '\n' : '') + content + '\n';
    });
  }
  // If section not found, append at end
  return prdText + '\n' + content + '\n';
}

export function applyRoleContributions(prdText, ctx) {
  const { id, slug, qaCasesPath, evidenceRelPath, selectedRoles } = ctx;
  let text = prdText;
  const updates = [];

  // PM: Scope additions and reviewer note
  if (selectedRoles.includes('PM')) {
    const style = getRoleSnippets(ctx.repoRoot, 'PM');
    text = appendToSection(text, /## 2\./, `- PM (auto): Scope reviewed for ${id}; ${style || 'acceptance criteria to be finalized with QA.'}`);
    text = appendToSection(text, /## 3\./, `- PM (auto): KPIs draft — login success rate ≥ 95%, error rate < 1%.`);
    updates.push('PM');
  }

  // Technical Product Manager: specs note
  if (selectedRoles.includes('Technical Product Manager')) {
    const style = getRoleSnippets(ctx.repoRoot, 'Technical Product Manager');
    text = appendToSection(text, /## 5\./, `- TPM (auto): Confirmed trigger grammar; idempotent edits; evidence schema linked in §10. ${style || ''}`.trim());
    updates.push('TPM');
  }

  // CTO: Architecture defaults
  if (selectedRoles.includes('CTO')) {
    const style = getRoleSnippets(ctx.repoRoot, 'CTO');
    text = appendToSection(text, /### 6\.1/, `- CTO (auto): Server-side handlers; cookie session flags (HttpOnly, Secure in prod); reversible edits. ${style || ''}`.trim());
    updates.push('CTO');
  }

  // UX/UI: labels/errors
  if (selectedRoles.includes('UX/UI')) {
    const style = getRoleSnippets(ctx.repoRoot, 'UX/UI');
    text = appendToSection(text, /### 6\.5/, `- UX (auto): Login form labels and error states; disabled state during processing. ${style || ''}`.trim());
    updates.push('UX');
  }

  // Legal: privacy/disclaimer
  if (selectedRoles.includes('Legal')) {
    const style = getRoleSnippets(ctx.repoRoot, 'Legal');
    text = appendToSection(text, /### 6\.6/, `- Legal (auto): Privacy copy placeholder; cookie policy mention; review pending. ${style || ''}`.trim());
    updates.push('Legal');
  }

  // Security: threat model and evidence path note
  if (selectedRoles.includes('Security')) {
    const style = getRoleSnippets(ctx.repoRoot, 'Security');
    const securityNote = `- Security (auto): Threat model — assets: session cookie, password hashes; controls: argon2 hashing, HttpOnly cookies, rate limiting. Evidence: \`${evidenceRelPath}\`. ${style || ''}`.trim();
    // Append under §6 (Technical Requirements) block
    text = appendToSection(text, /## 6\./, securityNote);
    updates.push('Security');
  }

  // QA: ensure QA scenarios stub in test-cases file
  if (selectedRoles.includes('QA') && qaCasesPath) {
    try {
      if (fs.existsSync(qaCasesPath)) {
        const existing = fs.readFileSync(qaCasesPath, 'utf8');
        const marker = '## Scenarios';
        if (!existing.includes('QA-LOGIN-OK')) {
          const add = `\n- [ ] QA-LOGIN-OK — Successful login creates session; guard passes\n- [ ] QA-LOGIN-ERR — Invalid password shows error; attempt count increments\n- [ ] QA-LOGOUT — Logout clears session; guard blocks\n`;
          const updated = existing.includes(marker)
            ? existing.replace(marker, marker + add)
            : existing + '\n' + marker + add + '\n';
          fs.writeFileSync(qaCasesPath, updated);
          updates.push('QA-cases');
        }
      }
    } catch { /* ignore */ }
  }

  // VP‑Eng: decision log note
  if (selectedRoles.includes('VP‑Eng')) {
    const style = getRoleSnippets(ctx.repoRoot, 'VP‑Eng');
    text = appendToSection(text, /### 9\.6/, `- [VP‑Eng auto] Feasibility confirmed; Ready recommended pending QA Pass and security gates. ${style || ''}`.trim());
    updates.push('VP‑Eng');
  }

  // Implementation Owner: rollback plan note
  if (selectedRoles.includes('Implementation Owner')) {
    const style = getRoleSnippets(ctx.repoRoot, 'Implementation Owner');
    text = appendToSection(text, /### 9\.6/, `- [Implementation Owner auto] Rollback: disable login route & middleware; revert cookie config; remove seed user if created. ${style || ''}`.trim());
    updates.push('Implementation Owner');
  }

  return { text, updates };
}



```

# role-executors.mjs

```javascript
import fs from 'node:fs';
import path from 'node:path';
import { getGenerator } from './generators/index.mjs';
import { extractAPIRoutesFromPRD, extractPagesFromPRD, extractModelsFromPRD } from './prd-extractors.mjs';

function safeAppend(filePath, content) {
  try {
    if (!fs.existsSync(filePath)) return;
    const existing = fs.readFileSync(filePath, 'utf8');
    if (existing.includes(content.trim())) return; // idempotent
    fs.writeFileSync(filePath, existing + (existing.endsWith('\n') ? '' : '\n') + content + '\n');
  } catch {
    // ignore
  }
}

export function executeRoleTasks(prdText, selectedRoles, ctx) {
  const developmentActions = [];
  const { qaCasesPath, exec, repoRoot } = ctx;
  const dryRun = Boolean(ctx?.dryRun);
  const overwrite = Boolean(ctx?.overwrite);

  // QA: additive scenarios are allowed even with exec disabled
  if (selectedRoles.includes('QA') && qaCasesPath && fs.existsSync(qaCasesPath)) {
    const add = '\n- [ ] ORCH-DEV-001 — Orchestrator updates dynamic §9 blocks correctly\n- [ ] ORCH-DEV-002 — Plan merge dedupes by Task ID and preserves custom rows\n';
    safeAppend(qaCasesPath, add);
    developmentActions.push({ role: 'QA', action: 'append', path: qaCasesPath });
  }

  // Other roles: execution disabled unless exec=true; even then, this release performs no code edits by default
  if (!exec) {
    for (const role of selectedRoles) {
      if (role !== 'QA') {
        developmentActions.push({ role, action: 'skip', reason: 'execution disabled (exec=false)' });
      }
    }
    return { developmentActions };
  }

  // New: Extract actionable tasks from PRD and generate code via generators
  try {
    const tasks = extractExecutableTasksFromPRD(prdText || '', selectedRoles);
    for (const task of tasks) {
      try {
        const generator = getGenerator(task.generator);
        const plannedFiles = awaitPlan(generator, task.inputs, task, { repoRoot, dryRun, options: { overwrite } });
        const actions = applyPlannedFiles(repoRoot, plannedFiles, { dryRun, overwrite, role: task.owner });
        developmentActions.push(...actions);
      } catch (err) {
        developmentActions.push({ role: task.owner, action: 'error', path: task.targetHint || '', error: String(err?.message || err) });
      }
    }
  } catch (err) {
    developmentActions.push({ role: 'orchestrator', action: 'error', reason: 'task extraction failed', error: String(err?.message || err) });
  }

  // Minimal, reversible artifacts per role within safe boundaries
  const ensureFile = (absPath, content, role) => {
    try {
      if (!fs.existsSync(path.dirname(absPath))) fs.mkdirSync(path.dirname(absPath), { recursive: true });
      if (!fs.existsSync(absPath)) {
        fs.writeFileSync(absPath, content);
        developmentActions.push({ role, action: 'create', path: path.relative(repoRoot, absPath).replace(/\\/g,'/') });
      }
    } catch {
      // ignore
    }
  };

  if (selectedRoles.includes('Frontend Engineer')) {
    const feNote = path.join(repoRoot, 'infra', 'next-app', 'app', 'orch-dev.md');
    ensureFile(feNote, '# Orchestrator FE Note\n\n- Minimal placeholder created by orchestrator.\n', 'Frontend Engineer');
    const fePage = path.join(repoRoot, 'infra', 'next-app', 'app', 'orch-check', 'page.tsx');
    ensureFile(
      fePage,
      "export default function OrchCheckPage(){ return (<main style={{padding:'1rem'}}><h1>Orch Check</h1><p>This page was created by the orchestrator.</p></main>); }\n",
      'Frontend Engineer'
    );
  }
  if (selectedRoles.includes('Backend Engineer')) {
    const beNote = path.join(repoRoot, 'infra', 'next-app', 'app', 'api', 'orch-dev.md');
    ensureFile(beNote, '# Orchestrator BE Note\n\n- Minimal placeholder created by orchestrator.\n', 'Backend Engineer');
    const beRouteDir = path.join(repoRoot, 'infra', 'next-app', 'app', 'api', 'orch-check');
    const beRoute = path.join(beRouteDir, 'route.ts');
    if (!fs.existsSync(beRouteDir)) fs.mkdirSync(beRouteDir, { recursive: true });
    ensureFile(
      beRoute,
      "import { NextResponse } from 'next/server';\nexport async function GET(){ return NextResponse.json({ ok: true, service: 'orch-check' }); }\n",
      'Backend Engineer'
    );
  }
  if (selectedRoles.includes('UX/UI')) {
    const uxNote = path.join(repoRoot, 'infra', 'next-app', 'app', 'orch-ux-notes.md');
    ensureFile(uxNote, '# UX Notes\n\n- Labels/error states to be refined per PRD §6.5.\n', 'UX/UI');
  }
  if (selectedRoles.includes('DevOps/SRE')) {
    const helper = path.join(repoRoot, 'lib', 'orch-backfill.mjs');
    ensureFile(helper, '/* Backfill helper (placeholder) */\nexport function planBackfill() { return []; }\n', 'DevOps/SRE');
  }
  if (selectedRoles.includes('AI Engineer')) {
    const aiReadme = path.join(repoRoot, 'ai', 'README.md');
    ensureFile(aiReadme, '# AI\n\n- Place AI integration notes and prompts here.\n', 'AI Engineer');
  }
  if (selectedRoles.includes('Data Analyst')) {
    const dataReadme = path.join(repoRoot, 'data', 'README.md');
    ensureFile(dataReadme, '# Data\n\n- Place analytics/KPI definitions and reports here.\n', 'Data Analyst');
  }

  return { developmentActions };
}


function extractExecutableTasksFromPRD(prdText, selectedRoles) {
  const tasks = [];
  const roles = new Set(selectedRoles || []);

  // Backend Engineer: API routes and models
  if (roles.has('Backend Engineer')) {
    const routes = extractAPIRoutesFromPRD(prdText);
    for (const r of routes) {
      tasks.push({
        owner: 'Backend Engineer',
        generator: 'next-api-route',
        targetHint: `infra/next-app/app/api/${r.resource}/route.ts`,
        inputs: { resource: r.resource, methods: r.methods },
      });
    }
    const models = extractModelsFromPRD(prdText);
    for (const m of models) {
      tasks.push({
        owner: 'Backend Engineer',
        generator: 'prisma-model',
        targetHint: 'infra/next-app/prisma/schema.prisma',
        inputs: { modelName: m.modelName, fields: m.fields },
      });
    }
  }

  // Frontend Engineer: Pages
  if (roles.has('Frontend Engineer')) {
    const pages = extractPagesFromPRD(prdText);
    for (const p of pages) {
      tasks.push({
        owner: 'Frontend Engineer',
        generator: 'next-page',
        targetHint: `infra/next-app/app${p.route}/page.tsx`,
        inputs: { route: p.route, title: p.title, hasForm: Boolean(p.hasForm), fields: p.fields || [] },
      });
    }
  }

  return tasks;
}

function awaitPlan(generator, inputs, task, ctx) {
  // Generators may implement plan(); prefer it when present
  if (typeof generator.plan === 'function') {
    return generator.plan(inputs, task, ctx);
  }
  return generator.generate(inputs, task, ctx);
}

function applyPlannedFiles(repoRoot, plannedFiles, options) {
  const actions = [];
  const dryRun = Boolean(options?.dryRun);
  const overwrite = Boolean(options?.overwrite);
  const role = options?.role || 'orchestrator';

  for (const pf of plannedFiles || []) {
    const abs = path.resolve(repoRoot, pf.path);
    if (!abs.startsWith(path.resolve(repoRoot))) {
      actions.push({ role, action: 'skip', path: pf.path, reason: 'unsafe path' });
      continue;
    }

    const dir = path.dirname(abs);
    const exists = fs.existsSync(abs);
    const willUpdate = exists && pf.action === 'update';
    const willCreate = !exists && (pf.action === 'create' || !pf.action);
    if (exists && !willUpdate && !overwrite) {
      actions.push({ role, action: 'skip', path: pf.path, reason: 'exists (use overwrite to replace)' });
      continue;
    }

    if (dryRun) {
      actions.push({ role, action: willUpdate ? 'plan-update' : 'plan-create', path: pf.path });
      continue;
    }

    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    try {
      fs.writeFileSync(abs, pf.content);
      actions.push({ role, action: willUpdate ? 'update' : 'create', path: pf.path });
    } catch (err) {
      actions.push({ role, action: 'error', path: pf.path, error: String(err?.message || err) });
    }
  }
  return actions;
}



```

# role-style.mjs

```javascript
import fs from 'node:fs';
import path from 'node:path';

const ROLE_TO_FILE = {
  'PM': 'product-manager.md',
  'Product Manager': 'product-manager.md',
  'Technical Product Manager': 'technical-product-manager.md',
  'CTO': 'cto.md',
  'Security': 'application-security-engineer.md',
  'UX/UI': 'ux-ui-designer.md',
  'Legal': 'legal.md',
  'QA': 'qa-engineer.md',
  'VP‑Eng': 'vp-engineering.md',
  'Implementation Owner': 'implementation-owner.md',
};

function tryRead(filePath) {
  try { return fs.readFileSync(filePath, 'utf8'); } catch { return ''; }
}

export function getRoleSnippets(repoRoot, roleName) {
  const teamDir = path.join(repoRoot, 'team');
  const fname = ROLE_TO_FILE[roleName] || '';
  const p = fname ? path.join(teamDir, fname) : '';
  const content = p ? tryRead(p) : '';
  if (!content) return '';
  // Extract up to 2-3 bullets from "When responding" or "Checklist"
  const sectionMatch = content.match(/When responding[\s\S]*?(?:###|$)/i) || content.match(/Checklist[\s\S]*?(?:###|$)/i);
  if (!sectionMatch) return '';
  const bullets = (sectionMatch[0].match(/^-\s.*$/gm) || []).slice(0, 3).map(s => s.replace(/^-\\s*/, '').trim());
  return bullets.length ? bullets.join('; ') : '';
}



```

# security-runner.mjs

```javascript
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

export function runSecurityGates(repoRoot, id, slug, dryRun = false) {
  const evidenceDir = path.join(repoRoot, 'security', 'evidence', `${id}-${slug}`);
  if (!dryRun) fs.mkdirSync(evidenceDir, { recursive: true });

  const results = [];
  const steps = [
    { name: 'sbom', cmd: `npx cyclonedx-bom -o ${path.join(evidenceDir, 'sbom.json')} -j` },
    { name: 'deps', cmd: 'npm audit --json | cat', outFile: path.join(evidenceDir, 'npm-audit.json') },
    { name: 'secrets', cmd: 'npx gitleaks detect --no-banner --source . --report-format json --report-path gitleaks.json | cat', moveFromCwd: 'gitleaks.json', outFile: path.join(evidenceDir, 'gitleaks.json') },
  ];

  for (const step of steps) {
    try {
      if (dryRun) { results.push({ step: step.name, skipped: true }); continue; }
      const output = execSync(step.cmd, { cwd: repoRoot, stdio: step.outFile ? 'pipe' : 'inherit', env: process.env });
      if (step.outFile && output) {
        fs.writeFileSync(step.outFile, output);
      }
      if (step.moveFromCwd && step.outFile && fs.existsSync(path.join(repoRoot, step.moveFromCwd))) {
        fs.renameSync(path.join(repoRoot, step.moveFromCwd), step.outFile);
      }
      results.push({ step: step.name, ok: true, evidence: path.relative(repoRoot, step.outFile || evidenceDir) });
    } catch (e) {
      results.push({ step: step.name, ok: false, error: e?.message || String(e) });
      break;
    }
  }
  return { evidenceDir: path.relative(repoRoot, evidenceDir), results };
}



```

# status-gates.mjs

```javascript
import fs from 'node:fs';
import path from 'node:path';

export function evaluateQaPass(qaFolder) {
  // Look for latest test-results-*.md containing "Overall Status: Pass"
  try {
    const entries = fs.readdirSync(qaFolder).filter(f => f.startsWith('test-results-') && f.endsWith('.md'));
    entries.sort();
    for (let i = entries.length - 1; i >= 0; i--) {
      const p = path.join(qaFolder, entries[i]);
      const t = fs.readFileSync(p, 'utf8');
      if (/Overall Status:\s*Pass/i.test(t)) return { ok: true, path: p };
    }
  } catch {}
  return { ok: false };
}

export function evaluateSecurity(evidenceDir) {
  // Simple heuristic: presence of sbom.json and npm-audit.json with no "critical"/"high" issues and gitleaks.json exists
  try {
    const sbom = path.join(evidenceDir, 'sbom.json');
    const audit = path.join(evidenceDir, 'npm-audit.json');
    const leaks = path.join(evidenceDir, 'gitleaks.json');
    const sbomOk = fs.existsSync(sbom);
    const leaksOk = fs.existsSync(leaks);
    let depsOk = false;
    if (fs.existsSync(audit)) {
      const j = JSON.parse(fs.readFileSync(audit, 'utf8'));
      const advisories = JSON.stringify(j).toLowerCase();
      depsOk = !(advisories.includes('critical') || advisories.includes('high'));
    }
    return { ok: sbomOk && leaksOk && depsOk };
  } catch {
    return { ok: false };
  }
}



```

# team-utils.mjs

```javascript
import fs from 'node:fs';
import path from 'node:path';

function parseFrontmatterName(markdown) {
  const m = markdown.match(/\nname:\s*([^\n]+)\n/);
  if (m) return m[1].trim();
  return '';
}

export function listTeamRoles(repoRoot) {
  const teamDir = path.join(repoRoot, 'team');
  if (!fs.existsSync(teamDir)) return [];
  const files = fs.readdirSync(teamDir).filter(f => f.endsWith('.md') && f !== 'README.md');
  const roles = [];
  for (const f of files) {
    const p = path.join(teamDir, f);
    const rel = path.relative(repoRoot, p).replace(/\\/g, '/');
    try {
      const txt = fs.readFileSync(p, 'utf8');
      const name = parseFrontmatterName(txt) || f.replace(/\.md$/, '').replace(/-/g, ' ');
      roles.push({ name, path: rel });
    } catch (_) {
      roles.push({ name: f.replace(/\.md$/, ''), path: rel });
    }
  }
  // Sort alphabetically by name for consistency
  roles.sort((a, b) => a.name.localeCompare(b.name));
  return roles;
}



```

# workflow-runner.mjs

```javascript
import { execSync } from 'node:child_process';

export function runDefaultWorkflow(repoRoot, dryRun = false) {
  const steps = [
    { name: 'install', cmd: 'npm ci', skipOnDry: false },
    { name: 'lint', cmd: 'npm run lint --silent | cat', skipOnDry: false },
    { name: 'unit', cmd: 'npm test --silent | cat', skipOnDry: false },
  ];
  const results = [];
  for (const step of steps) {
    if (dryRun && step.skipOnDry) { results.push({ step: step.name, skipped: true }); continue; }
    try {
      execSync(step.cmd, { cwd: repoRoot, stdio: 'inherit', env: process.env });
      results.push({ step: step.name, ok: true });
    } catch (e) {
      results.push({ step: step.name, ok: false, error: e?.message || String(e) });
      break;
    }
  }
  return results;
}

export function runE2E(repoRoot, dryRun = false) {
  const results = [];
  const steps = [
    { name: 'e2e:install', cmd: 'npm run e2e:install | cat' },
    { name: 'e2e', cmd: 'npm run e2e:local | cat' },
  ];
  for (const step of steps) {
    if (dryRun && step.name !== 'e2e:install') { results.push({ step: step.name, skipped: true }); continue; }
    try {
      execSync(step.cmd, { cwd: repoRoot, stdio: 'inherit', env: process.env });
      results.push({ step: step.name, ok: true });
    } catch (e) {
      results.push({ step: step.name, ok: false, error: e?.message || String(e) });
      break;
    }
  }
  return results;
}



```

# base.mjs

```javascript
// Base contract for code generators used by the orchestrator
// - ESM module style
// - Named exports
// - High-verbosity, readable code with clear interfaces

import path from 'node:path';

/**
 * @typedef {Object} GeneratorContext
 * @property {string} repoRoot - Absolute path to the repository root
 * @property {boolean} [dryRun] - When true, generators should not perform irreversible actions
 * @property {Record<string, any>} [patterns] - Detected project patterns (frameworks, conventions)
 * @property {{ info: Function, warn: Function, error: Function }} [logger] - Optional logger
 * @property {Record<string, any>} [options] - Additional options (e.g., overwrite flags)
 */

/**
 * @typedef {Object} PlannedFile
 * @property {string} path - Repository-relative POSIX path (e.g., "infra/next-app/app/api/health/route.ts")
 * @property {string} content - File contents to write
 * @property {'create'|'update'} [action] - File operation intent; defaults to 'create'
 */

/**
 * Base class for all project-specific code generators.
 * Generators SHOULD NOT write to disk. They return an array of PlannedFile objects.
 */
export class BaseGenerator {
  /**
   * @param {string} generatorName - Unique stable name for the generator (e.g., 'next-api-route')
   */
  constructor(generatorName) {
    this.generatorName = generatorName;
  }

  /**
   * The unique generator name.
   * @returns {string}
   */
  get name() {
    return this.generatorName;
  }

  /**
   * Generate files for a given task. MUST be overridden by subclasses.
   * @param {Record<string, any>} inputs - Domain inputs parsed from PRD (e.g., { resource, methods })
   * @param {Record<string, any>} task - The higher-level task descriptor (owner, targetFiles, etc.)
   * @param {GeneratorContext} ctx - Execution context (patterns, repoRoot, dryRun, logger)
   * @returns {Promise<PlannedFile[]>}
   */
  generate(inputs, task, ctx) {
    throw new Error(`Generator '${this.name}' must implement generate(inputs, task, ctx)`);
  }

  /**
   * Optional planning wrapper. Subclasses may override to perform validation prior to generation.
   * @param {Record<string, any>} inputs
   * @param {Record<string, any>} task
   * @param {GeneratorContext} ctx
   * @returns {Promise<PlannedFile[]>}
   */
  plan(inputs, task, ctx) {
    return this.generate(inputs, task, ctx);
  }
}

/**
 * Create a PlannedFile entry with normalized POSIX path and default action.
 * @param {string} relativePath - Repo-relative path using '/' separators
 * @param {string} content - File content
 * @param {'create'|'update'} [action='create'] - Intent
 * @returns {PlannedFile}
 */
export function makePlannedFile(relativePath, content, action = 'create') {
  const normalized = toPosixPath(relativePath);
  return { path: normalized, content, action };
}

/**
 * Ensure a path string uses POSIX separators regardless of host OS.
 * @param {string} p
 * @returns {string}
 */
export function toPosixPath(p) {
  if (!p) return p;
  const asPosix = p.split(path.sep).join('/');
  return asPosix;
}

/**
 * Validate that a repository-relative path stays within the repository when resolved.
 * @param {string} repoRoot - Absolute repository root
 * @param {string} relativePath - Repo-relative path (may include '../')
 * @returns {boolean}
 */
export function isSafeRepoRelativePath(repoRoot, relativePath) {
  try {
    const abs = path.resolve(repoRoot, relativePath);
    const normalizedRoot = path.resolve(repoRoot);
    return abs.startsWith(normalizedRoot + path.sep) || abs === normalizedRoot;
  } catch {
    return false;
  }
}

/**
 * Normalize and validate a list of PlannedFile specs.
 * @param {string} repoRoot
 * @param {PlannedFile[]} files
 * @returns {PlannedFile[]}
 */
export function normalizePlannedFiles(repoRoot, files) {
  const normalized = [];
  for (const file of files || []) {
    const posixPath = toPosixPath(file.path);
    if (!isSafeRepoRelativePath(repoRoot, posixPath)) {
      throw new Error(`Unsafe path resolved outside repo: ${file.path}`);
    }
    normalized.push({ path: posixPath, content: file.content, action: file.action || 'create' });
  }
  return normalized;
}



```

# index.mjs

```javascript
// Generator registry
// - Exports a map of generator names to instances
// - Provides getGenerator(name) helper

import { nextApiRouteGenerator } from './next-api-route.mjs';
import { nextPageGenerator } from './next-page.mjs';
import { prismaModelGenerator } from './prisma-model.mjs';

export const generators = {
  'next-api-route': nextApiRouteGenerator,
  'next-page': nextPageGenerator,
  'prisma-model': prismaModelGenerator,
};

export function getGenerator(name) {
  const gen = generators[name];
  if (!gen) throw new Error(`Unknown generator: ${name}. Available: ${Object.keys(generators).join(', ')}`);
  return gen;
}

export default generators;



```

# next-api-route.mjs

```javascript
// Generator for Next.js App Router API routes
// - Uses NextResponse.json for responses
// - Named exports for HTTP methods (GET, POST, ...)
// - Direct PrismaClient usage by default
// - try/catch error handling, standard status codes

import { BaseGenerator, makePlannedFile } from './base.mjs';

export class NextApiRouteGenerator extends BaseGenerator {
  constructor() {
    super('next-api-route');
  }

  /**
   * @param {Record<string, any>} inputs - { resource: string, methods?: string[], requireAuth?: boolean, prismaModel?: string }
   * @param {Record<string, any>} task
   * @param {import('./base.mjs').GeneratorContext} ctx
   */
  generate(inputs, task, ctx) {
    const resource = String(inputs?.resource || '').replace(/^\/+|\/+$/g, '');
    if (!resource) throw new Error("next-api-route: 'resource' is required (e.g., 'users' or 'posts')");

    const methods = Array.isArray(inputs?.methods) && inputs.methods.length > 0
      ? inputs.methods.map((m) => String(m).toUpperCase())
      : ['GET', 'POST'];
    const requireAuth = Boolean(inputs?.requireAuth);
    const prismaModel = String(inputs?.prismaModel || deriveModelFromResource(resource));

    const routeContent = this.generateRouteFile({ resource, methods, requireAuth, prismaModel });
    const filePath = `infra/next-app/app/api/${resource}/route.ts`;
    return [makePlannedFile(filePath, routeContent, 'create')];
  }

  /**
   * @param {{ resource: string, methods: string[], requireAuth: boolean, prismaModel: string }} cfg
   * @returns {string}
   */
  generateRouteFile(cfg) {
    const { resource, methods, requireAuth, prismaModel } = cfg;
    const handlers = [];

    if (methods.includes('GET')) handlers.push(generateGET({ requireAuth, prismaModel }));
    if (methods.includes('POST')) handlers.push(generatePOST({ requireAuth, prismaModel }));
    if (methods.includes('PUT')) handlers.push(generatePUT({ requireAuth, prismaModel }));
    if (methods.includes('PATCH')) handlers.push(generatePATCH({ requireAuth, prismaModel }));
    if (methods.includes('DELETE')) handlers.push(generateDELETE({ requireAuth, prismaModel }));

    return `import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

${handlers.join('\n\n')}
`;
  }
}

function deriveModelFromResource(resource) {
  const parts = String(resource).split('/').filter(Boolean);
  const last = parts[parts.length - 1] || 'item';
  // naive singularization: trim trailing 's' if present
  const singular = /ses$/.test(last) ? last.replace(/es$/, '') : last.replace(/s$/, '');
  return toCamelCase(singular);
}

function toCamelCase(s) {
  const parts = String(s || '').split(/[-_\s]/).filter(Boolean);
  if (parts.length === 0) return '';
  return parts
    .map((w, i) => (i === 0 ? w.toLowerCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()))
    .join('');
}

function authGuardSnippet() {
  return `const cookie = request.headers.get('cookie') || '';
  if (!cookie.includes('etc_session=')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }`;
}

function generateGET({ requireAuth, prismaModel }) {
  return `export async function GET(request) {
  try {
    ${requireAuth ? authGuardSnippet() : ''}
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (id) {
      const record = await prisma.${prismaModel}.findUnique({ where: { id } });
      if (!record) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      return NextResponse.json({ data: record }, { status: 200 });
    }
    const records = await prisma.${prismaModel}.findMany();
    return NextResponse.json({ data: records }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}`;
}

function generatePOST({ requireAuth, prismaModel }) {
  return `export async function POST(request) {
  try {
    ${requireAuth ? authGuardSnippet() : ''}
    const body = await request.json();
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Bad request' }, { status: 400 });
    }
    const created = await prisma.${prismaModel}.create({ data: body });
    return NextResponse.json({ data: created }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}`;
}

function generatePUT({ requireAuth, prismaModel }) {
  return `export async function PUT(request) {
  try {
    ${requireAuth ? authGuardSnippet() : ''}
    const body = await request.json();
    const id = body?.id;
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });
    const updated = await prisma.${prismaModel}.update({ where: { id }, data: body });
    return NextResponse.json({ data: updated }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}`;
}

function generatePATCH({ requireAuth, prismaModel }) {
  return `export async function PATCH(request) {
  try {
    ${requireAuth ? authGuardSnippet() : ''}
    const body = await request.json();
    const id = body?.id;
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });
    const updated = await prisma.${prismaModel}.update({ where: { id }, data: body });
    return NextResponse.json({ data: updated }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}`;
}

function generateDELETE({ requireAuth, prismaModel }) {
  return `export async function DELETE(request) {
  try {
    ${requireAuth ? authGuardSnippet() : ''}
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });
    const deleted = await prisma.${prismaModel}.delete({ where: { id } });
    return NextResponse.json({ data: deleted }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}`;
}

export const nextApiRouteGenerator = new NextApiRouteGenerator();



```

# next-page.mjs

```javascript
// Generator for Next.js App Router pages
// - Simple export default function components
// - Minimal imports; inline styles for scaffolding
// - Optional form component generated as ./form.tsx when hasForm=true

import { BaseGenerator, makePlannedFile } from './base.mjs';

export class NextPageGenerator extends BaseGenerator {
  constructor() {
    super('next-page');
  }

  /**
   * @param {Record<string, any>} inputs - { route: string, title?: string, hasForm?: boolean, fields?: string[] }
   * @param {Record<string, any>} task
   * @param {import('./base.mjs').GeneratorContext} ctx
   */
  generate(inputs, task, ctx) {
    const route = normalizeRoute(String(inputs?.route || ''));
    if (!route) throw new Error("next-page: 'route' is required (e.g., '/dashboard')");

    const componentBase = routeToComponentBase(route);
    const title = String(inputs?.title || componentBase);
    const hasForm = Boolean(inputs?.hasForm);
    const fields = Array.isArray(inputs?.fields) ? inputs.fields.filter(Boolean) : [];

    const files = [];
    const pageContent = this.generatePageFile({ title, componentBase, hasForm });
    files.push(makePlannedFile(`infra/next-app/app${route}/page.tsx`, pageContent, 'create'));

    if (hasForm) {
      const formContent = this.generateFormFile({ componentBase, route, fields });
      files.push(makePlannedFile(`infra/next-app/app${route}/form.tsx`, formContent, 'create'));
    }

    return files;
  }

  /**
   * @param {{ title: string, componentBase: string, hasForm: boolean }} cfg
   * @returns {string}
   */
  generatePageFile(cfg) {
    const { title, componentBase, hasForm } = cfg;
    const safeTitle = sanitizeTitle(title, componentBase);
    const formImport = hasForm ? `import { ${componentBase}Form } from './form';\n` : '';
    const formJSX = hasForm ? `\n      <${componentBase}Form />` : `\n      <p>Scaffolded page.</p>`;
    return `${formImport}export default function ${componentBase}Page() {
  return (
    <main style={{ padding: 24, fontFamily: 'system-ui, sans-serif' }}>
      <h1>${escapeJs(safeTitle)}</h1>${formJSX}
    </main>
  );
}
`;
  }

  /**
   * @param {{ componentBase: string, route: string, fields: string[] }} cfg
   * @returns {string}
   */
  generateFormFile(cfg) {
    const { componentBase, route } = cfg;
    const fields = (cfg.fields || []).map(toCamelCase);
    const apiPath = `/api${route}`.replace(/\/$/, '');
    const stateInit = fields.length
      ? `{ ${fields.map((f) => `${f}: ''`).join(', ')} }`
      : `{}`;
    const inputsJSX = fields.length ? fields.map(inputField).join('\n') : '';
    return `'use client';

import { useState } from 'react';

export function ${componentBase}Form() {
  const [formData, setFormData] = useState(${stateInit});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess(false);
    try {
      const res = await fetch('${apiPath}', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        setError('Submission failed');
      } else {
        setSuccess(true);
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 480 }}>
${inputsJSX}
      <button type="submit" disabled={submitting}>
        {submitting ? 'Submitting…' : 'Submit'}
      </button>
      {error && <p style={{ color: 'crimson' }}>{error}</p>}
      {success && <p style={{ color: 'green' }}>Submitted</p>}
    </form>
  );
}
`;
  }
}

function inputField(fieldName) {
  const label = toTitleCase(fieldName);
  const type = inferInputType(fieldName);
  return `      <div style={{ marginBottom: 12 }}>
        <label style={{ display: 'block', marginBottom: 4 }} htmlFor="${fieldName}">${label}</label>
        <input id="${fieldName}" name="${fieldName}" type="${type}" onChange={handleChange} value={formData.${fieldName} || ''} />
      </div>`;
}

function normalizeRoute(route) {
  const r = route.trim();
  if (!r) return '';
  return r.startsWith('/') ? r : `/${r}`;
}

function routeToComponentBase(route) {
  const parts = route.split('/').filter(Boolean);
  const last = parts.length ? parts[parts.length - 1] : 'Home';
  return toPascalCase(last);
}

function toPascalCase(s) {
  return String(s || '')
    .split(/[-_\s]/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join('');
}

function toCamelCase(s) {
  const parts = String(s || '').split(/[-_\s]/).filter(Boolean);
  if (parts.length === 0) return '';
  return parts
    .map((w, i) => (i === 0 ? w.toLowerCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()))
    .join('');
}

function toTitleCase(s) {
  return String(s || '')
    .split(/[-_\s]/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

function inferInputType(fieldName) {
  const n = String(fieldName || '').toLowerCase();
  if (n.includes('email')) return 'email';
  if (n.includes('password')) return 'password';
  if (n.includes('date')) return 'date';
  return 'text';
}

function escapeJs(s) {
  return String(s || '').replace(/`/g, '\\`');
}

export const nextPageGenerator = new NextPageGenerator();

function sanitizeTitle(title, fallbackBase) {
  const t = String(title || '').trim();
  // If title is too long or includes non-UI wording, prefer fallback
  if (!t) return fallbackBase;
  const wordCount = t.split(/\s+/).filter(Boolean).length;
  if (/endpoint|api|create\s+get|create\s+post/i.test(t) || wordCount > 4) return fallbackBase;
  return t;
}



```

# prisma-model.mjs

```javascript
// Generator for Prisma model additions to schema.prisma
// - Reads existing schema
// - Appends new model if not present
// - Keeps two-space indentation and simple field ordering

import fs from 'node:fs';
import path from 'node:path';
import { BaseGenerator, makePlannedFile } from './base.mjs';

export class PrismaModelGenerator extends BaseGenerator {
  constructor() {
    super('prisma-model');
  }

  /**
   * @param {Record<string, any>} inputs - { modelName: string, fields: Array<{ name: string, type?: string, required?: boolean, unique?: boolean }> }
   * @param {Record<string, any>} task
   * @param {import('./base.mjs').GeneratorContext} ctx
   */
  generate(inputs, task, ctx) {
    const modelName = toPascalCase(String(inputs?.modelName || ''));
    if (!modelName) throw new Error("prisma-model: 'modelName' is required");
    const fields = Array.isArray(inputs?.fields) ? inputs.fields : [];

    const schemaRel = 'infra/next-app/prisma/schema.prisma';
    const schemaAbs = path.join(ctx?.repoRoot || process.cwd(), schemaRel);
    const existing = safeReadFile(schemaAbs);
    const alreadyExists = new RegExp(`\\bmodel\\s+${escapeRegExp(modelName)}\\b`).test(existing);
    if (alreadyExists) {
      return []; // Model present, no-op
    }

    const modelBlock = this.generateModelBlock(modelName, fields);
    const updated = appendModel(existing, modelBlock);
    return [makePlannedFile(schemaRel, updated, 'update')];
  }

  generateModelBlock(modelName, fields) {
    const normalized = fields.map(normalizeField).filter((f) => !!f.name);
    const fieldLines = [
      `id        String   @id @default(cuid())`,
      ...normalized.map(renderFieldLine),
      `createdAt DateTime @default(now())`,
    ];
    return `\nmodel ${modelName} {\n  ${fieldLines.join('\n  ')}\n}`;
  }
}

function normalizeField(field) {
  if (!field) return { name: '', type: '' };
  const name = preserveCamelCase(String(field.name || ''));
  const type = normalizePrismaType(field.type || inferTypeFromName(name));
  const required = field.required !== false; // default true
  const unique = Boolean(field.unique);
  return { name, type, required, unique };
}

function renderFieldLine(f) {
  const opt = f.required ? '' : '?';
  const unique = f.unique ? ' @unique' : '';
  return `${f.name} ${f.type}${opt}${unique}`;
}

function appendModel(schemaText, modelBlock) {
  if (!schemaText || !schemaText.trim()) return modelBlock.trimStart();
  // Place at the end with a separating newline
  const needsNL = schemaText.endsWith('\n') ? '' : '\n';
  return `${schemaText}${needsNL}${modelBlock}\n`;
}

function normalizePrismaType(t) {
  const map = {
    string: 'String',
    int: 'Int',
    number: 'Int',
    boolean: 'Boolean',
    bool: 'Boolean',
    datetime: 'DateTime',
    date: 'DateTime',
    json: 'Json',
  };
  const lower = String(t || '').toLowerCase();
  return map[lower] || 'String';
}

function inferTypeFromName(name) {
  const n = String(name || '').toLowerCase();
  if (n.includes('email')) return 'String';
  if (n.includes('password') || n.includes('hash')) return 'String';
  if (n.includes('name') || n.includes('title')) return 'String';
  if (n.includes('date') || n.includes('time') || /at$/.test(name)) return 'DateTime';
  if (n.includes('count') || n.includes('number') || n.includes('age')) return 'Int';
  if (n.startsWith('is') || n.startsWith('has') || /active$|enabled$/.test(n)) return 'Boolean';
  if (n.includes('json') || n.includes('meta')) return 'Json';
  return 'String';
}

function toCamelCase(s) {
  const parts = String(s || '').split(/[-_\s]/).filter(Boolean);
  if (parts.length === 0) return '';
  return parts
    .map((w, i) => (i === 0 ? w.toLowerCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()))
    .join('');
}

function toPascalCase(s) {
  return String(s || '')
    .split(/[-_\s]/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join('');
}

function preserveCamelCase(s) {
  // If already camelCase or PascalCase with internal capitals, keep casing for internal boundaries
  if (/^[a-z][a-zA-Z0-9]*$/.test(s)) return s;
  if (/^[A-Z][a-zA-Z0-9]*$/.test(s)) return s.charAt(0).toLowerCase() + s.slice(1);
  return toCamelCase(s);
}

function safeReadFile(absPath) {
  try {
    if (fs.existsSync(absPath)) return fs.readFileSync(absPath, 'utf8');
  } catch {}
  return '';
}

function escapeRegExp(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export const prismaModelGenerator = new PrismaModelGenerator();



```

