#!/usr/bin/env node
// Fix non-GitHub repo URLs to use GitHub mirrors

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const toolsPath = path.join(__dirname, '../registry/tools.json');
const data = JSON.parse(fs.readFileSync(toolsPath, 'utf8'));

// Map of slugs to GitHub mirrors
const repoFixes = {
  'wget': 'https://github.com/mirror/wget',
  'dig': 'https://github.com/isc-projects/bind9',
  'socat': 'https://github.com/3ndG4me/socat',
  'sed': 'https://github.com/mirror/sed',
  'awk': 'https://github.com/onetrueawk/awk',
  'tar': 'https://github.com/Distrotech/tar',
  'gzip': 'https://github.com/madler/zlib', // gzip is part of zlib
  'ncdu': 'https://github.com/rofl0r/ncdu',
  'screen': 'https://github.com/alexander-naumov/gnu-screen'
};

let fixed = 0;
for (const tool of data.tools) {
  if (repoFixes[tool.slug]) {
    console.log(`Fixing ${tool.slug}: ${tool.repo} -> ${repoFixes[tool.slug]}`);
    tool.repo = repoFixes[tool.slug];
    fixed++;
  }
}

// Write back
fs.writeFileSync(toolsPath, JSON.stringify(data, null, 2));
console.log(`Fixed ${fixed} repos`);
