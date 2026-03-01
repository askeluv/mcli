/**
 * Interactive tool submission for mcli.
 */
import * as readline from 'readline';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import type { CliTool } from './types.js';
import { validateTool, computeAgentScore } from './lib.js';

const PENDING_DIR = join(homedir(), '.mcli');
const PENDING_FILE = join(PENDING_DIR, 'pending-tools.json');

function prompt(rl: readline.Interface, question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => resolve(answer.trim()));
  });
}

function promptNumber(rl: readline.Interface, question: string, min: number, max: number): Promise<number> {
  return new Promise((resolve) => {
    const ask = () => {
      rl.question(question, (answer) => {
        const num = parseInt(answer.trim(), 10);
        if (isNaN(num) || num < min || num > max) {
          console.log(`  Please enter a number between ${min} and ${max}`);
          ask();
        } else {
          resolve(num);
        }
      });
    };
    ask();
  });
}

export async function runAddWizard(slug: string): Promise<void> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  console.log(`\nAdding new tool: ${slug}\n`);

  try {
    // Basic info
    const name = await prompt(rl, 'Tool name (e.g., "GitHub CLI"): ');
    const description = await prompt(rl, 'Short description: ');
    
    // Vendor
    console.log('\n— Vendor Info —');
    const vendorName = await prompt(rl, 'Vendor name (e.g., "GitHub"): ');
    const vendorDomain = await prompt(rl, 'Vendor domain (e.g., "github.com"): ');
    
    // URLs
    console.log('\n— URLs —');
    const repo = await prompt(rl, 'GitHub repo URL (optional): ');
    const docs = await prompt(rl, 'Documentation URL (optional): ');
    
    // Install methods
    console.log('\n— Install Commands (leave blank if N/A) —');
    const brewPkg = await prompt(rl, 'Homebrew package: ');
    const npmPkg = await prompt(rl, 'npm package: ');
    const aptPkg = await prompt(rl, 'apt package: ');
    const cargoPkg = await prompt(rl, 'cargo crate: ');
    
    // Categories
    console.log('\n— Categories —');
    const categoriesStr = await prompt(rl, 'Categories (comma-separated, e.g., "cloud,infrastructure"): ');
    const categories = categoriesStr.split(',').map(c => c.trim()).filter(Boolean);
    
    // Agent scores
    console.log('\n— Agent Friendliness Scores (1-5 each) —');
    const jsonOutput = await promptNumber(rl, 'JSON output support? (1=none, 5=excellent): ', 1, 5);
    const nonInteractive = await promptNumber(rl, 'Non-interactive usage? (1=requires TTY, 5=fully scriptable): ', 1, 5);
    const tokenEfficiency = await promptNumber(rl, 'Token efficiency? (1=verbose, 5=concise): ', 1, 5);
    const safetyFeatures = await promptNumber(rl, 'Safety features? (1=dangerous, 5=safe defaults): ', 1, 5);
    const pipelineFriendly = await promptNumber(rl, 'Pipeline friendly? (1=hard to chain, 5=easy): ', 1, 5);

    const agentScores = { jsonOutput, nonInteractive, tokenEfficiency, safetyFeatures, pipelineFriendly };
    const agentScore = computeAgentScore(agentScores);

    // Build tool object
    const tool: CliTool = {
      slug,
      name,
      vendor: {
        name: vendorName,
        domain: vendorDomain,
        verified: false,
      },
      install: {},
      capabilities: {
        jsonOutput: jsonOutput >= 3,
        auth: [],
        idempotent: true,
        interactive: nonInteractive < 3,
        streaming: false,
      },
      agentScores,
      agentScore,
      categories: categories.length > 0 ? categories : ['other'],
      tier: 'unverified' as const,
      description,
    };

    // Add optional fields
    if (repo) tool.repo = repo;
    if (docs) tool.docs = docs;
    if (brewPkg) tool.install.brew = brewPkg;
    if (npmPkg) tool.install.npm = npmPkg;
    if (aptPkg) tool.install.apt = aptPkg;
    if (cargoPkg) tool.install.cargo = cargoPkg;

    // Validate
    const validation = validateTool(tool);
    if (!validation.valid) {
      console.error('\n❌ Validation failed:');
      validation.errors.forEach(e => console.error(`  - ${e}`));
      rl.close();
      process.exit(1);
    }

    // Save to pending file
    mkdirSync(PENDING_DIR, { recursive: true });
    
    let pending: CliTool[] = [];
    if (existsSync(PENDING_FILE)) {
      try {
        pending = JSON.parse(require('fs').readFileSync(PENDING_FILE, 'utf-8'));
      } catch {
        pending = [];
      }
    }
    pending.push(tool);
    writeFileSync(PENDING_FILE, JSON.stringify(pending, null, 2));

    console.log(`\n✓ Tool saved to ${PENDING_FILE}`);
    console.log(`  Agent Score: ${agentScore}/10`);
    console.log('\nTo submit, create a PR adding this to registry/tools.json:');
    console.log('─'.repeat(50));
    console.log(JSON.stringify(tool, null, 2));
    console.log('─'.repeat(50));
    console.log('\nOr run: mcli pending --export');

  } finally {
    rl.close();
  }
}
