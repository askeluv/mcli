/**
 * Agent review submission for mcli.
 */
import * as readline from 'readline';
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { homedir } from 'os';
import { fileURLToPath } from 'url';
import { createHash } from 'crypto';
import type { Review } from './types.js';
import { loadRegistry, hasLocalRegistry, LOCAL_REGISTRY_PATH } from './registry.js';
import { findTool } from './lib.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const bundledRegistryPath = join(__dirname, '..', 'registry', 'tools.json');

const PENDING_DIR = join(homedir(), '.mcli');
const PENDING_REVIEWS_FILE = join(PENDING_DIR, 'pending-reviews.json');

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

function generateAgentId(): string {
  // Simple agent ID based on machine + timestamp
  const data = `${homedir()}-${Date.now()}-${Math.random()}`;
  return createHash('sha256').update(data).digest('hex').slice(0, 16);
}

function getOrCreateAgentId(): string {
  const idFile = join(PENDING_DIR, 'agent-id');
  mkdirSync(PENDING_DIR, { recursive: true });
  
  if (existsSync(idFile)) {
    return readFileSync(idFile, 'utf-8').trim();
  }
  
  const newId = generateAgentId();
  writeFileSync(idFile, newId);
  return newId;
}

export function computeReviewScore(scores: Review['scores']): number {
  const sum = scores.jsonParseable + scores.errorClarity + 
              scores.authSimplicity + scores.idempotency + scores.docsSufficient;
  return Math.round((sum / 25) * 10);
}

export async function runReviewWizard(slug: string): Promise<void> {
  // Validate slug exists in registry before accepting review
  const registryPath = hasLocalRegistry() ? LOCAL_REGISTRY_PATH : bundledRegistryPath;
  const registry = loadRegistry(registryPath);
  const tool = findTool(registry, slug);
  
  if (!tool) {
    console.error(`Error: Tool not found: ${slug}`);
    console.error('You can only review tools that exist in the registry.');
    process.exit(1);
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const agentId = getOrCreateAgentId();
  console.log(`\nReviewing: ${tool.name} (${slug})`);
  console.log(`Agent ID: ${agentId}\n`);

  try {
    console.log('Rate each dimension 1-5 (1=poor, 5=excellent):\n');
    
    const jsonParseable = await promptNumber(rl, 'JSON output parseable? ', 1, 5);
    const errorClarity = await promptNumber(rl, 'Error messages clear? ', 1, 5);
    const authSimplicity = await promptNumber(rl, 'Auth setup simple? ', 1, 5);
    const idempotency = await promptNumber(rl, 'Commands idempotent? ', 1, 5);
    const docsSufficient = await promptNumber(rl, 'Docs sufficient? ', 1, 5);

    const notes = await prompt(rl, '\nOptional notes (or press Enter to skip): ');
    
    console.log('\n— Proof of Use (required) —');
    console.log('Run a command and hash the output:');
    console.log('  echo -n "command: <cmd>, output: <output>" | sha256sum');
    const proofHashInput = await prompt(rl, 'Proof hash: ');
    
    if (!proofHashInput || !/^[a-f0-9]{64}$/i.test(proofHashInput)) {
      console.error('\n❌ Proof hash is required (must be a valid SHA256 hash - 64 hex characters)');
      console.log('This prevents spam by requiring you to actually use the tool.');
      console.log('Generate with: echo -n "command: <cmd>, output: <output>" | sha256sum');
      rl.close();
      process.exit(1);
    }

    const scores = { jsonParseable, errorClarity, authSimplicity, idempotency, docsSufficient };
    const overallScore = computeReviewScore(scores);

    // Check for duplicate review
    let pending: Review[] = [];
    if (existsSync(PENDING_REVIEWS_FILE)) {
      try {
        pending = JSON.parse(readFileSync(PENDING_REVIEWS_FILE, 'utf-8'));
      } catch {
        pending = [];
      }
    }
    
    const existingReview = pending.find(r => r.tool === slug && r.agentId === agentId);
    if (existingReview) {
      console.error(`\n❌ You already have a pending review for ${slug}`);
      console.log('One review per agent per tool.');
      rl.close();
      process.exit(1);
    }

    const review: Review = {
      tool: slug,
      agentId,
      scores,
      proofHash: proofHashInput,
      timestamp: new Date().toISOString(),
    };

    if (notes) review.notes = notes;

    // Save to pending reviews
    mkdirSync(PENDING_DIR, { recursive: true });
    pending.push(review);
    writeFileSync(PENDING_REVIEWS_FILE, JSON.stringify(pending, null, 2));

    console.log(`\n✓ Review saved (score: ${overallScore}/10)`);
    console.log(`  Saved to ${PENDING_REVIEWS_FILE}`);
    console.log('\nTo submit, create a PR adding this to registry/reviews.json:');
    console.log('─'.repeat(50));
    console.log(JSON.stringify(review, null, 2));
    console.log('─'.repeat(50));

  } finally {
    rl.close();
  }
}

export function loadReviews(path: string): Review[] {
  if (!existsSync(path)) return [];
  try {
    const data = JSON.parse(readFileSync(path, 'utf-8'));
    return data.reviews || [];
  } catch {
    return [];
  }
}

export function getToolReviews(reviews: Review[], slug: string): Review[] {
  return reviews.filter(r => r.tool === slug);
}

export function aggregateReviews(reviews: Review[]): {
  count: number;
  avgScore: number;
  dimensions: Record<string, { avg: number; pct: number }>;
} | null {
  if (reviews.length === 0) return null;

  const dims = ['jsonParseable', 'errorClarity', 'authSimplicity', 'idempotency', 'docsSufficient'] as const;
  const dimensions: Record<string, { avg: number; pct: number }> = {};
  
  let totalScore = 0;
  
  for (const dim of dims) {
    const values = reviews.map(r => r.scores[dim]);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const goodCount = values.filter(v => v >= 4).length;
    dimensions[dim] = {
      avg: Math.round(avg * 10) / 10,
      pct: Math.round((goodCount / values.length) * 100),
    };
    totalScore += avg;
  }

  return {
    count: reviews.length,
    avgScore: Math.round((totalScore / 5 / 5) * 10 * 10) / 10,
    dimensions,
  };
}
