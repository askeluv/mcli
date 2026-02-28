#!/usr/bin/env npx tsx
/**
 * Migrate existing tools to use the new agentScores schema.
 * Maps old agentScore (1-10) to new multi-dimensional scores.
 */

import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REGISTRY_PATH = join(__dirname, "..", "registry", "tools.json");

interface AgentScores {
  jsonOutput: number;
  nonInteractive: number;
  tokenEfficiency: number;
  safetyFeatures: number;
  pipelineFriendly: number;
}

// Hand-crafted scores for existing tools based on their actual capabilities
const manualScores: Record<string, AgentScores> = {
  "hcloud": {
    jsonOutput: 5,      // Full --output=json
    nonInteractive: 5,  // env:HCLOUD_TOKEN
    tokenEfficiency: 4, // --quiet available
    safetyFeatures: 4,  // Good exit codes
    pipelineFriendly: 5 // Clean output
  },
  "doctl": {
    jsonOutput: 5,      // --output json
    nonInteractive: 4,  // env + interactive auth
    tokenEfficiency: 4, // --no-header
    safetyFeatures: 3,  // Basic exit codes
    pipelineFriendly: 4 // Good separation
  },
  "aws": {
    jsonOutput: 5,      // --output json
    nonInteractive: 4,  // env vars but complex
    tokenEfficiency: 2, // Verbose by default
    safetyFeatures: 4,  // --dry-run on some commands
    pipelineFriendly: 4 // --query for filtering
  },
  "gcloud": {
    jsonOutput: 5,      // --format=json
    nonInteractive: 3,  // Requires gcloud auth
    tokenEfficiency: 4, // --quiet flag
    safetyFeatures: 3,  // Some commands have --dry-run
    pipelineFriendly: 4 // Good filtering
  },
  "flyctl": {
    jsonOutput: 5,      // --json flag
    nonInteractive: 4,  // env:FLY_API_TOKEN
    tokenEfficiency: 3, // Reasonable output
    safetyFeatures: 3,  // Basic
    pipelineFriendly: 4 // Good separation
  },
  "gh": {
    jsonOutput: 5,      // --json with jq-like queries
    nonInteractive: 4,  // env:GH_TOKEN
    tokenEfficiency: 5, // --jq for minimal output
    safetyFeatures: 4,  // Good exit codes
    pipelineFriendly: 5 // Excellent chaining
  },
  "jq": {
    jsonOutput: 5,      // It IS JSON processing
    nonInteractive: 5,  // No auth needed
    tokenEfficiency: 5, // Outputs exactly what you ask
    safetyFeatures: 5,  // Pure function, exit codes
    pipelineFriendly: 5 // Built for pipes
  },
  "rg": {
    jsonOutput: 5,      // --json flag
    nonInteractive: 5,  // No auth
    tokenEfficiency: 5, // --quiet, -c for counts only
    safetyFeatures: 5,  // Read-only, clear exit codes
    pipelineFriendly: 5 // Perfect for pipes
  },
  "fzf": {
    jsonOutput: 1,      // No JSON, interactive UI
    nonInteractive: 1,  // Requires TTY
    tokenEfficiency: 3, // Outputs selection only
    safetyFeatures: 3,  // Exit codes work
    pipelineFriendly: 3 // Can be piped to/from
  },
  "docker": {
    jsonOutput: 5,      // --format '{{json .}}'
    nonInteractive: 3,  // docker login required
    tokenEfficiency: 4, // --quiet flag
    safetyFeatures: 3,  // Some --dry-run
    pipelineFriendly: 4 // Good filtering
  }
};

function computeAgentScore(scores: AgentScores): number {
  const weighted = 
    scores.jsonOutput * 3 +
    scores.nonInteractive * 3 +
    scores.tokenEfficiency * 2 +
    scores.safetyFeatures * 1 +
    scores.pipelineFriendly * 1;
  return Math.round((weighted / 50) * 10);
}

async function main() {
  const registry = JSON.parse(readFileSync(REGISTRY_PATH, "utf-8"));
  
  for (const tool of registry.tools) {
    const scores = manualScores[tool.slug];
    if (scores) {
      tool.agentScores = scores;
      tool.agentScore = computeAgentScore(scores);
      console.log(`✓ ${tool.slug}: agentScore ${tool.agentScore} (was ${tool.agentScore})`);
    } else {
      console.log(`⚠ ${tool.slug}: no manual scores defined`);
    }
  }
  
  registry.updated = new Date().toISOString().split("T")[0];
  writeFileSync(REGISTRY_PATH, JSON.stringify(registry, null, 2));
  console.log(`\n✓ Registry updated`);
}

main().catch(console.error);
