#!/usr/bin/env node

import { existsSync, readFileSync } from 'node:fs';
import { dirname, extname, relative, resolve } from 'node:path';

const root = process.cwd();
const required = [
  'LICENSE',
  'README.md',
  'AGENTS.md',
  'E2E_GUIDE.md',
  'docs/PRODUCT_BRIEF.md',
  'docs/CURRENT_STATE_AUDIT.md',
  'docs/ARCHITECTURE.md',
  'docs/AUTHENTICATION.md',
  'docs/DATA_MODEL_AND_MIGRATION.md',
  'docs/UX_DESIGN.md',
  'docs/PREVIEW_ENVIRONMENTS.md',
  'docs/IMPLEMENTATION_PLAN.md',
  'docs/mockups/library-desktop.png',
  'docs/mockups/game-detail-desktop.png',
  'docs/mockups/library-mobile.png',
  'docs/mockups/README.md',
  'preview/index.html',
  'preview/styles.css'
];

const failures = [];
for (const path of required) {
  if (!existsSync(resolve(root, path))) failures.push(`Missing required file: ${path}`);
}

const markdownFiles = required.filter((path) => extname(path) === '.md');
for (const path of markdownFiles) {
  const content = readFileSync(resolve(root, path), 'utf8');
  const links = content.matchAll(/!?(?:\[[^\]]*\])\(([^)]+)\)/g);
  for (const match of links) {
    const rawTarget = match[1].trim().replace(/^<|>$/g, '');
    if (/^(?:https?:|mailto:|#)/.test(rawTarget)) continue;
    const target = decodeURIComponent(rawTarget.split('#')[0].split('?')[0]);
    if (!target) continue;
    const absolute = resolve(dirname(resolve(root, path)), target);
    const display = relative(root, absolute);
    if (display.startsWith('..')) {
      failures.push(`${path}: link escapes repository: ${rawTarget}`);
    } else if (!existsSync(absolute)) {
      failures.push(`${path}: broken local link: ${rawTarget}`);
    }
  }
}

const mockups = required.filter((path) => extname(path) === '.png');
for (const path of mockups) {
  if (!existsSync(resolve(root, path))) continue;
  const image = readFileSync(resolve(root, path));
  const signature = image.subarray(0, 8).toString('hex');
  if (signature !== '89504e470d0a1a0a') {
    failures.push(`${path}: not a valid PNG signature`);
    continue;
  }
  const width = image.readUInt32BE(16);
  const height = image.readUInt32BE(20);
  if (width < 800 || height < 700) {
    failures.push(`${path}: mockup is too small (${width}x${height})`);
  }
}

if (existsSync(resolve(root, 'preview/index.html'))) {
  const preview = readFileSync(resolve(root, 'preview/index.html'), 'utf8');
  for (const path of mockups) {
    const name = path.split('/').at(-1);
    if (!preview.includes(`mockups/${name}`)) {
      failures.push(`preview/index.html: does not reference ${name}`);
    }
  }
  if (!preview.includes('Design only · fixture')) {
    failures.push('preview/index.html: data mode is not visible');
  }
}

const license = existsSync(resolve(root, 'LICENSE'))
  ? readFileSync(resolve(root, 'LICENSE'), 'utf8')
  : '';
if (!license.includes('GNU GENERAL PUBLIC LICENSE') || !license.includes('Version 3')) {
  failures.push('LICENSE: expected the full GNU GPL version 3 text');
}

if (failures.length > 0) {
  console.error(`Design package validation failed:\n- ${failures.join('\n- ')}`);
  process.exit(1);
}

console.log(`Design package valid: ${required.length} required files, ${mockups.length} mockups.`);
