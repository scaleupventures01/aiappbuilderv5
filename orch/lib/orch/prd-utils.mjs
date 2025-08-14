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
  const updated = prdContent.replace(/(^|\n)(owner:\s*)(.*)(\n)/, ($0, p1, p2, _p3, p4) => `${p1}${p2}${owner}${p4}`);
  return updated;
}

export function ensureQaArtifactsBlock(prdContent, qaCasesRel, qaResultsRel) {
  const block = `### 7.3 QA Artifacts\n- Test cases file: \`${qaCasesRel}\`\n- Latest results: \`${qaResultsRel}\` (Overall Status: Pass required)\n`;
  if (/### 7\.3 QA Artifacts/.test(prdContent)) {
    return prdContent.replace(/### 7\.3 QA Artifacts[\s\S]*?(?=\n## |\n<a id=|\n$)/, block + '\n');
  }
  if (/### 7\.2/.test(prdContent)) {
    return prdContent.replace(/(### 7\.2[\s\S]*?)(?=\n## |\n<a id=|\n$)/, (m) => m + '\n' + block + '\n');
  }
  if (/## 7\./.test(prdContent)) {
    return prdContent.replace(/(## 7\.[\s\S]*?)(?=\n## |\n<a id=|\n$)/, (m) => m + '\n' + block + '\n');
  }
  return prdContent + '\n' + block + '\n';
}

export function appendChangelog(prdContent, note) {
  const today = new Date().toISOString().slice(0, 10);
  const entry = `- ${note} on ${today}.`;
  if (!/## 8\. Changelog/.test(prdContent)) {
    return prdContent + `\n## 8. Changelog\n${entry}\n`;
  }
  return prdContent.replace(/(## 8\. Changelog\n)/, `$1${entry}\n`);
}

export function ensureExecutionPlanAfter93(prdContent) {
  const already = /Execution Plan \(Decomposed Tasks\)/.test(prdContent);
  if (already) return prdContent;
  const table = `\n#### Execution Plan (Decomposed Tasks)\n\n| Task ID | Owner (Role) | Description | Preconditions/Dependencies | Outputs (Files/PRD sections) | Risks/Issues | Status |\n| --- | --- | --- | --- | --- | --- | --- |\n| ORCH-TBD | Implementation Owner | Populate tasks per PRD | — | PRD §9.3 updated | — | Planned |\n\n`;
  if (/### 9\.3 Handoff Contracts/.test(prdContent)) {
    return prdContent.replace(/(### 9\.3 Handoff Contracts[\s\S]*?)(?=\n### 9\.4|\n<a id=|\n$)/, (m) => m + table);
  }
  if (/## 9\./.test(prdContent)) {
    return prdContent.replace(/(## 9\.[\s\S]*?)(?=\n## |\n<a id=|\n$)/, (m) => m + table);
  }
  return prdContent + table;
}