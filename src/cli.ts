#!/usr/bin/env node
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import type { CliTool } from './types.js';
import { searchTools, findTool, getCategories, sortByAgentScore, tierBadge, filterByMinScore, filterByCategory } from './lib.js';
import { loadRegistry, RegistryError } from './registry.js';

// Parse --flag and --flag=value from args
function parseFlag(args: string[], flag: string): string | null {
  for (const arg of args) {
    if (arg === flag) return 'true';
    if (arg.startsWith(`${flag}=`)) return arg.slice(flag.length + 1);
  }
  return null;
}

function parseNumericFlag(args: string[], flag: string): number | null {
  const val = parseFlag(args, flag);
  if (val === null) return null;
  const num = parseInt(val, 10);
  return isNaN(num) ? null : num;
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const registryPath = join(__dirname, '..', 'registry', 'tools.json');

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
    
    // Show agent score breakdown if available
    if (tool.agentScores) {
      console.log(`  Agent Scores (1-5 each):`);
      console.log(`    JSON Output:     ${tool.agentScores.jsonOutput}/5`);
      console.log(`    Non-Interactive: ${tool.agentScores.nonInteractive}/5`);
      console.log(`    Token Efficiency:${tool.agentScores.tokenEfficiency}/5`);
      console.log(`    Safety Features: ${tool.agentScores.safetyFeatures}/5`);
      console.log(`    Pipeline Friend: ${tool.agentScores.pipelineFriendly}/5`);
    }
    
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
  categories               List all categories

Filters (for search and list):
  --min-score=N            Only show tools with agent score >= N
  --category=NAME          Filter by category
  --agent-friendly         Sort by agent score (highest first)

Tier Badges:
  ✓ = Verified (traced to official vendor source)
  ○ = Community (reviewed but not vendor-verified)
  ? = Unverified (auto-indexed, use with caution)

Examples:
  mcli search cloud
  mcli search git --category=git
  mcli list --agent-friendly --min-score=8
  mcli info gh
  mcli compare aws gcloud hcloud
`);
    return;
  }

  let registry;
  try {
    registry = loadRegistry(registryPath);
  } catch (err) {
    if (err instanceof RegistryError) {
      console.error(`Error: ${err.message}`);
      if (err.cause) {
        console.error(`  Caused by: ${err.cause.message}`);
      }
    } else {
      console.error('Unexpected error loading registry:', err);
    }
    process.exit(1);
  }

  switch (command) {
    case 'search': {
      // Extract query (non-flag args after command)
      const queryParts = args.slice(1).filter(a => !a.startsWith('--'));
      const query = queryParts.join(' ');
      if (!query) {
        console.log('Usage: mcli search <query> [--min-score=N] [--category=NAME]');
        return;
      }
      
      let results = searchTools(registry, query);
      
      // Apply filters
      const minScore = parseNumericFlag(args, '--min-score');
      if (minScore !== null) {
        results = filterByMinScore(results, minScore);
      }
      
      const category = parseFlag(args, '--category');
      if (category && category !== 'true') {
        results = filterByCategory(results, category);
      }
      
      // Sort by score if requested
      if (args.includes('--agent-friendly')) {
        results = sortByAgentScore(results);
      }
      
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
      
      // Apply filters
      const minScore = parseNumericFlag(args, '--min-score');
      if (minScore !== null) {
        tools = filterByMinScore(tools, minScore);
      }
      
      const category = parseFlag(args, '--category');
      if (category && category !== 'true') {
        tools = filterByCategory(tools, category);
      }
      
      // Sort by score if requested
      if (args.includes('--agent-friendly')) {
        tools = sortByAgentScore(tools);
      }
      
      if (tools.length === 0) {
        console.log('No tools found matching filters');
      } else {
        tools.forEach(t => printTool(t));
      }
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
