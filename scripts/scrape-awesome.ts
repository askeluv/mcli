#!/usr/bin/env npx tsx
/**
 * Scrape awesome-cli-apps and generate registry entries using AI.
 * 
 * Usage: npx tsx scripts/scrape-awesome.ts [--limit 50] [--category entertainment]
 */

import OpenAI from "openai";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REGISTRY_PATH = join(__dirname, "..", "registry", "tools.json");
const CACHE_PATH = join(__dirname, "..", ".cache");
const AWESOME_URL = "https://raw.githubusercontent.com/agarrharr/awesome-cli-apps/master/readme.md";

interface AgentScores {
  jsonOutput: number;      // 1-5
  nonInteractive: number;  // 1-5
  tokenEfficiency: number; // 1-5
  safetyFeatures: number;  // 1-5
  pipelineFriendly: number; // 1-5
}

interface ToolEntry {
  slug: string;
  name: string;
  vendor: { name: string; domain: string; verified: boolean };
  repo?: string;
  docs?: string;
  install: Record<string, string>;
  capabilities: {
    jsonOutput: boolean;
    auth: string[];
    idempotent: boolean;
    interactive: boolean;
    streaming: boolean;
  };
  agentScore: number;
  agentScores: AgentScores;
  categories: string[];
  tier: "verified" | "community" | "unverified";
  description: string;
}

function computeAgentScore(scores: AgentScores): number {
  const weighted = 
    scores.jsonOutput * 3 +
    scores.nonInteractive * 3 +
    scores.tokenEfficiency * 2 +
    scores.safetyFeatures * 1 +
    scores.pipelineFriendly * 1;
  return Math.round((weighted / 50) * 10);
}

interface ParsedTool {
  name: string;
  repo: string;
  description: string;
  category: string;
}

// Parse awesome-cli-apps markdown
function parseAwesomeList(markdown: string): ParsedTool[] {
  const tools: ParsedTool[] = [];
  const lines = markdown.split("\n");
  
  let currentCategory = "";
  
  for (const line of lines) {
    // Category headers (## or ###)
    const categoryMatch = line.match(/^#{2,3}\s+(.+)/);
    if (categoryMatch) {
      currentCategory = categoryMatch[1].trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
      continue;
    }
    
    // Tool entries: - [name](url) - description
    const toolMatch = line.match(/^-\s+\[([^\]]+)\]\(([^)]+)\)\s*[-–—]?\s*(.*)/);
    if (toolMatch && currentCategory) {
      const [, name, url, description] = toolMatch;
      
      // Only GitHub repos
      if (url.includes("github.com")) {
        tools.push({
          name: name.trim(),
          repo: url.trim(),
          description: description.trim() || name.trim(),
          category: currentCategory,
        });
      }
    }
  }
  
  return tools;
}

// Fetch with simple caching
async function fetchWithCache(url: string, cacheKey: string): Promise<string> {
  const cachePath = join(CACHE_PATH, `${cacheKey}.txt`);
  
  if (existsSync(cachePath)) {
    return readFileSync(cachePath, "utf-8");
  }
  
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  
  const text = await res.text();
  
  // Ensure cache dir exists
  const { mkdirSync } = await import("fs");
  mkdirSync(CACHE_PATH, { recursive: true });
  writeFileSync(cachePath, text);
  
  return text;
}

// Fetch README from GitHub repo
async function fetchReadme(repoUrl: string): Promise<string | null> {
  try {
    // Extract owner/repo from URL
    const match = repoUrl.match(/github\.com\/([^\/]+\/[^\/]+)/);
    if (!match) return null;
    
    const repo = match[1].replace(/\.git$/, "");
    const cacheKey = repo.replace("/", "_");
    
    // Try common README paths
    for (const file of ["README.md", "readme.md", "Readme.md"]) {
      try {
        const url = `https://raw.githubusercontent.com/${repo}/main/${file}`;
        return await fetchWithCache(url, `readme_${cacheKey}`);
      } catch {
        try {
          const url = `https://raw.githubusercontent.com/${repo}/master/${file}`;
          return await fetchWithCache(url, `readme_${cacheKey}`);
        } catch {
          continue;
        }
      }
    }
    return null;
  } catch {
    return null;
  }
}

// Use GPT-4 to analyze a tool and generate registry entry
async function analyzeToolWithAI(
  client: OpenAI,
  tool: ParsedTool,
  readme: string | null
): Promise<ToolEntry | null> {
  const prompt = `Analyze this CLI tool and generate a registry entry for mcli (a CLI tool discovery system for AI agents).

Tool: ${tool.name}
Repo: ${tool.repo}
Category: ${tool.category}
Description: ${tool.description}

${readme ? `README (truncated to 4000 chars):\n${readme.slice(0, 4000)}` : "No README available."}

Generate a JSON object with this exact structure:
{
  "slug": "lowercase-hyphenated-name",
  "name": "Display Name",
  "vendor": {
    "name": "Author or Org name",
    "domain": "github.com/author or company.com",
    "verified": false
  },
  "repo": "${tool.repo}",
  "docs": "documentation URL if found, or null",
  "install": {
    "brew": "formula name if available",
    "npm": "package name if it's a node tool",
    "cargo": "crate name if it's rust",
    "go": "go install path if it's go",
    "apt": "package name if available"
  },
  "capabilities": {
    "jsonOutput": true/false (does it support --json or structured output?),
    "auth": ["list of auth methods like env:VAR_NAME or config file"],
    "idempotent": true/false (same command = same result?),
    "interactive": true/false (requires TTY/user input?),
    "streaming": true/false (handles long-running output?)
  },
  "agentScores": {
    "jsonOutput": 1-5 (5=full JSON/structured output, 3=partial, 1=text only),
    "nonInteractive": 1-5 (5=fully scriptable with --yes/env auth, 1=requires TTY/prompts),
    "tokenEfficiency": 1-5 (5=has --quiet/--compact/--id-only, 1=verbose only),
    "safetyFeatures": 1-5 (5=has --dry-run + structured exit codes, 1=no safety features),
    "pipelineFriendly": 1-5 (5=clean stdout/stderr separation, chainable, 1=mixed output)
  },
  "categories": ["${tool.category}", "other relevant categories"],
  "tier": "unverified",
  "description": "One-line description (max 100 chars)"
}

Only include install methods that are actually available. If unsure about a capability, make a reasonable guess based on the tool type.

Agent Scores Guidelines (each dimension 1-5):
- jsonOutput: 5=--json flag, 4=--format=json, 3=parseable text, 2=semi-structured, 1=human text only
- nonInteractive: 5=--yes + env auth, 4=env auth only, 3=config file, 2=one-time setup, 1=interactive prompts
- tokenEfficiency: 5=--quiet + --id-only, 4=--quiet, 3=reasonable output, 2=verbose, 1=very verbose
- safetyFeatures: 5=--dry-run + exit codes 0/1/2, 4=--dry-run, 3=exit codes, 2=basic, 1=none
- pipelineFriendly: 5=clean separation + chainable, 4=mostly clean, 3=usable, 2=messy, 1=breaks pipes

Return ONLY the JSON object, no markdown or explanation.`;

  try {
    const response = await client.chat.completions.create({
      model: "gpt-4.1",
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }],
    });

    const text = response.choices[0]?.message?.content || "";
    
    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    
    const entry = JSON.parse(jsonMatch[0]) as ToolEntry;
    
    // Clean up null values in install
    entry.install = Object.fromEntries(
      Object.entries(entry.install).filter(([, v]) => v && v !== "null")
    );
    
    // Compute agentScore from agentScores
    if (entry.agentScores) {
      entry.agentScore = computeAgentScore(entry.agentScores);
    } else {
      entry.agentScore = 5; // Default fallback
    }
    
    // Ensure required fields
    if (!entry.slug || !entry.name || !entry.description) return null;
    
    return entry;
  } catch (err) {
    console.error(`Failed to analyze ${tool.name}:`, err);
    return null;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const limitIdx = args.indexOf("--limit");
  const limit = limitIdx >= 0 ? parseInt(args[limitIdx + 1]) : 100;
  
  const categoryIdx = args.indexOf("--category");
  const filterCategory = categoryIdx >= 0 ? args[categoryIdx + 1] : null;
  
  console.log(`Fetching awesome-cli-apps list...`);
  const markdown = await fetchWithCache(AWESOME_URL, "awesome-cli-apps");
  
  let tools = parseAwesomeList(markdown);
  console.log(`Found ${tools.length} tools in awesome-cli-apps`);
  
  if (filterCategory) {
    tools = tools.filter(t => t.category.includes(filterCategory));
    console.log(`Filtered to ${tools.length} tools in category "${filterCategory}"`);
  }
  
  // Load existing registry
  const registry = JSON.parse(readFileSync(REGISTRY_PATH, "utf-8"));
  const existingSlugs = new Set(registry.tools.map((t: ToolEntry) => t.slug));
  
  // Filter out already-added tools
  tools = tools.filter(t => {
    const slug = t.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    return !existingSlugs.has(slug);
  });
  
  console.log(`${tools.length} new tools to process (excluding existing)`);
  tools = tools.slice(0, limit);
  console.log(`Processing ${tools.length} tools (limit: ${limit})`);
  
  if (!process.env.OPENAI_API_KEY) {
    console.error('Error: OPENAI_API_KEY environment variable is required');
    process.exit(1);
  }
  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  const newTools: ToolEntry[] = [];
  
  for (let i = 0; i < tools.length; i++) {
    const tool = tools[i];
    console.log(`[${i + 1}/${tools.length}] Analyzing ${tool.name}...`);
    
    const readme = await fetchReadme(tool.repo);
    const entry = await analyzeToolWithAI(client, tool, readme);
    
    if (entry && !existingSlugs.has(entry.slug)) {
      newTools.push(entry);
      existingSlugs.add(entry.slug);
      console.log(`  ✓ Added: ${entry.slug} (score: ${entry.agentScore})`);
    } else {
      console.log(`  ✗ Skipped`);
    }
    
    // Rate limiting
    await new Promise(r => setTimeout(r, 200));
  }
  
  // Merge and save
  registry.tools.push(...newTools);
  registry.updated = new Date().toISOString().split("T")[0];
  
  writeFileSync(REGISTRY_PATH, JSON.stringify(registry, null, 2));
  console.log(`\n✓ Added ${newTools.length} tools. Registry now has ${registry.tools.length} tools.`);
}

main().catch(console.error);
