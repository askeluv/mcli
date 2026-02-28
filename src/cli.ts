#!/usr/bin/env node
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import type { Registry, CliTool } from './types.js';
import { searchTools, findTool, getCategories, sortByAgentScore, tierBadge } from './lib.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const registryPath = join(__dirname, '..', 'registry', 'tools.json');

function loadRegistry(): Registry {
  const data = readFileSync(registryPath, 'utf-8');
  return JSON.parse(data);
}

function scoreColor(score: number): string {
  if (score >= 8) return '\x1b[32m'; // green
  if (score >= 5) return '\x1b[33m'; // yellow
  return '\x1b[31m'; // red
}

function reset(): string {
  return '\x1b[0m';
}

function printTool(tool: CliTool, verbose = false): void {
  const badge = tierBadge(tool.tier);
  const color = scoreColor(tool.agentScore);
  
  console.log(`${badge} ${tool.name} (${tool.slug}) - Agent Score: ${color}${tool.agentScore}/10${reset()}`);
  console.log(`  ${tool.description}`);
  
  if (verbose) {
    console.log(`  Vendor: ${tool.vendor.name} (${tool.vendor.domain})`);
    console.log(`  Categories: ${tool.categories.join(', ')}`);
    console.log(`  Install:`);
    for (const [method, cmd] of Object.entries(tool.install)) {
      if (cmd) console.log(`    ${method}: ${cmd}`);
    }
    console.log(`  Capabilities:`);
    console.log(`    JSON output: ${tool.capabilities.jsonOutput ? 'yes' : 'no'}`);
    console.log(`    Idempotent: ${tool.capabilities.idempotent ? 'yes' : 'no'}`);
    console.log(`    Interactive: ${tool.capabilities.interactive ? 'yes' : 'no'}`);
    if (tool.capabilities.auth.length > 0) {
      console.log(`    Auth: ${tool.capabilities.auth.join(', ')}`);
    }
    if (tool.repo) console.log(`  Repo: ${tool.repo}`);
    if (tool.docs) console.log(`  Docs: ${tool.docs}`);
  }
  console.log();
}

// search function moved to lib.ts as searchTools

function compare(registry: Registry, slugs: string[]): void {
  const tools = slugs.map(slug => 
    registry.tools.find(t => t.slug === slug)
  ).filter((t): t is CliTool => t !== undefined);

  if (tools.length === 0) {
    console.log('No tools found');
    return;
  }

  // Header
  console.log('Tool'.padEnd(20) + tools.map(t => t.slug.padEnd(15)).join(''));
  console.log('-'.repeat(20 + tools.length * 15));
  
  // Rows
  console.log('Agent Score'.padEnd(20) + tools.map(t => `${t.agentScore}/10`.padEnd(15)).join(''));
  console.log('JSON Output'.padEnd(20) + tools.map(t => (t.capabilities.jsonOutput ? 'yes' : 'no').padEnd(15)).join(''));
  console.log('Idempotent'.padEnd(20) + tools.map(t => (t.capabilities.idempotent ? 'yes' : 'no').padEnd(15)).join(''));
  console.log('Interactive'.padEnd(20) + tools.map(t => (t.capabilities.interactive ? 'yes' : 'no').padEnd(15)).join(''));
  console.log('Verified'.padEnd(20) + tools.map(t => (t.tier === 'verified' ? '✓' : '○').padEnd(15)).join(''));
  console.log('Install (brew)'.padEnd(20) + tools.map(t => (t.install.brew || '-').padEnd(15)).join(''));
}

function installCmd(tool: CliTool): void {
  console.log(`# Install ${tool.name}\n`);
  if (tool.install.brew) console.log(`# macOS (Homebrew)\nbrew install ${tool.install.brew}\n`);
  if (tool.install.apt) console.log(`# Debian/Ubuntu\nsudo apt install ${tool.install.apt}\n`);
  if (tool.install.npm) console.log(`# npm\nnpm install -g ${tool.install.npm}\n`);
  if (tool.install.cargo) console.log(`# Cargo (Rust)\ncargo install ${tool.install.cargo}\n`);
  if (tool.install.go) console.log(`# Go\ngo install ${tool.install.go}\n`);
  if (tool.install.binary) console.log(`# Binary download\n${tool.install.binary}\n`);
  if (tool.install.script) console.log(`# Install script\n${tool.install.script}\n`);
}

function main(): void {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || command === 'help' || command === '--help') {
    console.log(`
mcli - A CLI for discovering CLI tools

Commands:
  search <query>           Search for CLI tools
  info <slug>              Show detailed info about a tool
  compare <slug> [slug...] Compare multiple tools
  install <slug>           Show install commands for a tool
  list                     List all tools
  list --agent-friendly    List tools sorted by agent score
  categories               List all categories

Examples:
  mcli search cloud
  mcli info hcloud
  mcli compare aws gcloud hcloud
  mcli install gh
`);
    return;
  }

  const registry = loadRegistry();

  switch (command) {
    case 'search': {
      const query = args.slice(1).join(' ');
      if (!query) {
        console.log('Usage: mcli search <query>');
        return;
      }
      const results = searchTools(registry, query);
      if (results.length === 0) {
        console.log('No tools found');
      } else {
        results.forEach(t => printTool(t));
      }
      break;
    }

    case 'info': {
      const slug = args[1];
      if (!slug) {
        console.log('Usage: mcli info <slug>');
        return;
      }
      const tool = findTool(registry, slug);
      if (!tool) {
        console.log(`Tool not found: ${slug}`);
      } else {
        printTool(tool, true);
      }
      break;
    }

    case 'compare': {
      const slugs = args.slice(1);
      if (slugs.length < 2) {
        console.log('Usage: mcli compare <slug> <slug> [slug...]');
        return;
      }
      compare(registry, slugs);
      break;
    }

    case 'install': {
      const slug = args[1];
      if (!slug) {
        console.log('Usage: mcli install <slug>');
        return;
      }
      const tool = findTool(registry, slug);
      if (!tool) {
        console.log(`Tool not found: ${slug}`);
      } else {
        installCmd(tool);
      }
      break;
    }

    case 'list': {
      let tools = [...registry.tools];
      if (args.includes('--agent-friendly')) {
        tools = sortByAgentScore(tools);
      }
      tools.forEach(t => printTool(t));
      break;
    }

    case 'categories': {
      const cats = getCategories(registry);
      console.log('Categories:', cats.join(', '));
      break;
    }

    default:
      console.log(`Unknown command: ${command}\nRun 'mcli help' for usage.`);
  }
}

main();
