#!/usr/bin/env node
// Batch 7: Final push to 700+

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const toolsPath = path.join(__dirname, '../registry/tools.json');
const data = JSON.parse(fs.readFileSync(toolsPath, 'utf8'));

const existingSlugs = new Set(data.tools.map(t => t.slug));

const newTools = [
  {
    slug: "caddy",
    name: "Caddy",
    vendor: { name: "Caddy", domain: "caddyserver.com", verified: false },
    repo: "https://github.com/caddyserver/caddy",
    docs: "https://caddyserver.com/docs/",
    install: { brew: "caddy", apt: "caddy" },
    capabilities: { jsonOutput: true, auth: [], idempotent: true, interactive: false, streaming: true },
    agentScores: { jsonOutput: 5, nonInteractive: 5, tokenEfficiency: 4, safetyFeatures: 5, pipelineFriendly: 5 },
    agentScore: 10,
    categories: ["web-server", "https", "reverse-proxy"],
    tier: "community",
    description: "Fast, multi-platform web server with automatic HTTPS."
  },
  {
    slug: "traefik",
    name: "Traefik",
    vendor: { name: "Traefik Labs", domain: "traefik.io", verified: true },
    repo: "https://github.com/traefik/traefik",
    docs: "https://doc.traefik.io/traefik/",
    install: { brew: "traefik" },
    capabilities: { jsonOutput: true, auth: [], idempotent: true, interactive: false, streaming: true },
    agentScores: { jsonOutput: 5, nonInteractive: 5, tokenEfficiency: 4, safetyFeatures: 4, pipelineFriendly: 5 },
    agentScore: 10,
    categories: ["reverse-proxy", "load-balancer", "kubernetes"],
    tier: "verified",
    description: "Cloud-native edge router and reverse proxy."
  },
  {
    slug: "gitea",
    name: "Gitea",
    vendor: { name: "Gitea", domain: "gitea.io", verified: false },
    repo: "https://github.com/go-gitea/gitea",
    docs: "https://docs.gitea.io/",
    install: { brew: "gitea" },
    capabilities: { jsonOutput: true, auth: [], idempotent: true, interactive: false, streaming: false },
    agentScores: { jsonOutput: 5, nonInteractive: 5, tokenEfficiency: 4, safetyFeatures: 4, pipelineFriendly: 4 },
    agentScore: 9,
    categories: ["git", "server", "self-hosted"],
    tier: "community",
    description: "Self-hosted lightweight Git service."
  },
  {
    slug: "forgejo",
    name: "Forgejo",
    vendor: { name: "Forgejo", domain: "forgejo.org", verified: false },
    repo: "https://github.com/forgejo/forgejo",
    docs: "https://forgejo.org/docs/latest/",
    install: {},
    capabilities: { jsonOutput: true, auth: [], idempotent: true, interactive: false, streaming: false },
    agentScores: { jsonOutput: 5, nonInteractive: 5, tokenEfficiency: 4, safetyFeatures: 4, pipelineFriendly: 4 },
    agentScore: 9,
    categories: ["git", "server", "self-hosted"],
    tier: "community",
    description: "Self-hosted lightweight software forge (Gitea fork)."
  },
  {
    slug: "etcd",
    name: "etcd",
    vendor: { name: "etcd-io", domain: "etcd.io", verified: true },
    repo: "https://github.com/etcd-io/etcd",
    docs: "https://etcd.io/docs/",
    install: { brew: "etcd" },
    capabilities: { jsonOutput: true, auth: ["env:ETCDCTL_ENDPOINTS"], idempotent: true, interactive: false, streaming: false },
    agentScores: { jsonOutput: 5, nonInteractive: 5, tokenEfficiency: 4, safetyFeatures: 5, pipelineFriendly: 5 },
    agentScore: 10,
    categories: ["distributed", "key-value", "kubernetes"],
    tier: "verified",
    description: "Distributed reliable key-value store for critical data."
  },
  {
    slug: "nats",
    name: "NATS CLI",
    vendor: { name: "NATS", domain: "nats.io", verified: true },
    repo: "https://github.com/nats-io/natscli",
    docs: "https://docs.nats.io/using-nats/nats-tools/nats_cli",
    install: { brew: "nats-io/nats-tools/nats" },
    capabilities: { jsonOutput: true, auth: ["env:NATS_URL"], idempotent: true, interactive: false, streaming: true },
    agentScores: { jsonOutput: 5, nonInteractive: 5, tokenEfficiency: 4, safetyFeatures: 4, pipelineFriendly: 5 },
    agentScore: 10,
    categories: ["messaging", "streaming", "pubsub"],
    tier: "verified",
    description: "CLI for NATS, the cloud native messaging system."
  },
  {
    slug: "redis-benchmark",
    name: "redis-benchmark",
    vendor: { name: "Redis", domain: "redis.io", verified: true },
    repo: "https://github.com/redis/redis",
    docs: "https://redis.io/docs/management/optimization/benchmarks/",
    install: { brew: "redis", apt: "redis-tools" },
    capabilities: { jsonOutput: false, auth: [], idempotent: true, interactive: false, streaming: true },
    agentScores: { jsonOutput: 2, nonInteractive: 5, tokenEfficiency: 4, safetyFeatures: 4, pipelineFriendly: 4 },
    agentScore: 8,
    categories: ["database", "benchmarking", "redis"],
    tier: "verified",
    description: "Built-in Redis benchmarking utility."
  },
  {
    slug: "wrk2",
    name: "wrk2",
    vendor: { name: "Gil Tene", domain: "github.com/giltene", verified: false },
    repo: "https://github.com/giltene/wrk2",
    docs: "https://github.com/giltene/wrk2#readme",
    install: {},
    capabilities: { jsonOutput: false, auth: [], idempotent: true, interactive: false, streaming: true },
    agentScores: { jsonOutput: 2, nonInteractive: 5, tokenEfficiency: 4, safetyFeatures: 4, pipelineFriendly: 4 },
    agentScore: 8,
    categories: ["http", "benchmarking", "load-testing"],
    tier: "community",
    description: "Constant throughput, correct latency recording HTTP benchmarking tool."
  },
  {
    slug: "bat-extras",
    name: "bat-extras",
    vendor: { name: "eth-p", domain: "github.com/eth-p", verified: false },
    repo: "https://github.com/eth-p/bat-extras",
    docs: "https://github.com/eth-p/bat-extras#readme",
    install: { brew: "bat-extras" },
    capabilities: { jsonOutput: false, auth: [], idempotent: true, interactive: false, streaming: true },
    agentScores: { jsonOutput: 2, nonInteractive: 5, tokenEfficiency: 4, safetyFeatures: 5, pipelineFriendly: 5 },
    agentScore: 9,
    categories: ["bat", "extensions", "utilities"],
    tier: "community",
    description: "Bash scripts that integrate bat with various tools."
  },
  {
    slug: "fpp",
    name: "PathPicker",
    vendor: { name: "Meta", domain: "facebook.github.io/PathPicker", verified: true },
    repo: "https://github.com/facebook/PathPicker",
    docs: "https://facebook.github.io/PathPicker/",
    install: { brew: "fpp", apt: "fpp" },
    capabilities: { jsonOutput: false, auth: [], idempotent: true, interactive: true, streaming: true },
    agentScores: { jsonOutput: 1, nonInteractive: 3, tokenEfficiency: 4, safetyFeatures: 4, pipelineFriendly: 4 },
    agentScore: 7,
    categories: ["files", "selector", "interactive"],
    tier: "verified",
    description: "Interactive file selector that parses input for file paths."
  }
];

// Filter out existing tools
const toolsToAdd = newTools.filter(t => !existingSlugs.has(t.slug));

console.log(`Adding ${toolsToAdd.length} new tools (${newTools.length - toolsToAdd.length} skipped as duplicates)`);

// Add new tools
data.tools.push(...toolsToAdd);

// Update timestamp
data.updated = new Date().toISOString().split('T')[0];

// Write back
fs.writeFileSync(toolsPath, JSON.stringify(data, null, 2));

console.log(`Total tools now: ${data.tools.length}`);
console.log('Added tools:', toolsToAdd.map(t => t.slug).join(', '));
