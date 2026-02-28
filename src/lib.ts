/**
 * Core library functions for mcli.
 * Extracted from CLI for testability.
 */
import type { Registry, CliTool, AgentScores } from './types.js';

/**
 * Compute overall agentScore from detailed agentScores.
 * Weighted average: json(3) + nonInteractive(3) + tokenEfficiency(2) + safety(1) + pipeline(1)
 * Returns 1-10 scale.
 */
export function computeAgentScore(scores: AgentScores): number {
  const weighted = 
    scores.jsonOutput * 3 +
    scores.nonInteractive * 3 +
    scores.tokenEfficiency * 2 +
    scores.safetyFeatures * 1 +
    scores.pipelineFriendly * 1;
  
  // Max possible = 5*10 = 50, scale to 1-10
  return Math.round((weighted / 50) * 10);
}

/**
 * Validate agentScores object.
 */
export function validateAgentScores(scores: unknown): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!scores || typeof scores !== 'object') {
    return { valid: false, errors: ['agentScores must be an object'] };
  }
  
  const s = scores as Record<string, unknown>;
  const dimensions = ['jsonOutput', 'nonInteractive', 'tokenEfficiency', 'safetyFeatures', 'pipelineFriendly'];
  
  for (const dim of dimensions) {
    const val = s[dim];
    if (typeof val !== 'number' || val < 1 || val > 5 || !Number.isInteger(val)) {
      errors.push(`agentScores.${dim} must be an integer 1-5`);
    }
  }
  
  return { valid: errors.length === 0, errors };
}

/**
 * Search tools by query string.
 * Matches against slug, name, description, and categories.
 */
export function searchTools(registry: Registry, query: string): CliTool[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  
  return registry.tools.filter(tool =>
    tool.slug.toLowerCase().includes(q) ||
    tool.name.toLowerCase().includes(q) ||
    tool.description.toLowerCase().includes(q) ||
    tool.categories.some(c => c.toLowerCase().includes(q))
  );
}

/**
 * Find a tool by exact slug match.
 */
export function findTool(registry: Registry, slug: string): CliTool | undefined {
  return registry.tools.find(t => t.slug === slug);
}

/**
 * Get all unique categories from the registry.
 */
export function getCategories(registry: Registry): string[] {
  const cats = new Set<string>();
  registry.tools.forEach(t => t.categories.forEach(c => cats.add(c)));
  return [...cats].sort();
}

/**
 * Sort tools by agent score (descending).
 */
export function sortByAgentScore(tools: CliTool[]): CliTool[] {
  return [...tools].sort((a, b) => b.agentScore - a.agentScore);
}

/**
 * Get tier boost value for ranking.
 * Verified tools get priority in search results.
 */
export function tierBoost(tier: CliTool['tier']): number {
  switch (tier) {
    case 'verified': return 2;
    case 'community': return 1;
    default: return 0;
  }
}

/**
 * Compute effective score for ranking (agent score + tier boost).
 */
export function effectiveScore(tool: CliTool): number {
  return tool.agentScore + tierBoost(tool.tier);
}

/**
 * Sort tools by effective score (agent score + tier boost), descending.
 * Within same effective score, verified tools come first.
 */
export function sortByRelevance(tools: CliTool[]): CliTool[] {
  return [...tools].sort((a, b) => {
    const scoreDiff = effectiveScore(b) - effectiveScore(a);
    if (scoreDiff !== 0) return scoreDiff;
    // Tiebreaker: verified > community > unverified
    return tierBoost(b.tier) - tierBoost(a.tier);
  });
}

/**
 * Filter tools by minimum agent score.
 */
export function filterByMinScore(tools: CliTool[], minScore: number): CliTool[] {
  return tools.filter(t => t.agentScore >= minScore);
}

/**
 * Filter tools by category.
 */
export function filterByCategory(tools: CliTool[], category: string): CliTool[] {
  const cat = category.toLowerCase();
  return tools.filter(t => t.categories.some(c => c.toLowerCase() === cat));
}

/**
 * Filter tools by verification tier.
 */
export function filterByTier(tools: CliTool[], tier: CliTool['tier']): CliTool[] {
  return tools.filter(t => t.tier === tier);
}

/**
 * Get tier badge character.
 */
export function tierBadge(tier: string): string {
  switch (tier) {
    case 'verified': return '✓';
    case 'community': return '○';
    default: return '?';
  }
}

/**
 * Validate a tool object has required fields.
 */
export function validateTool(tool: unknown): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!tool || typeof tool !== 'object') {
    return { valid: false, errors: ['Tool must be an object'] };
  }
  
  const t = tool as Record<string, unknown>;
  
  // Required string fields
  const requiredStrings = ['slug', 'name', 'description'];
  for (const field of requiredStrings) {
    if (typeof t[field] !== 'string' || !t[field]) {
      errors.push(`Missing or invalid field: ${field}`);
    }
  }
  
  // Slug format: lowercase, alphanumeric, hyphens
  if (typeof t.slug === 'string' && !/^[a-z0-9-]+$/.test(t.slug)) {
    errors.push('Slug must be lowercase alphanumeric with hyphens only');
  }
  
  // Agent score: 1-10
  if (typeof t.agentScore !== 'number' || t.agentScore < 1 || t.agentScore > 10) {
    errors.push('agentScore must be a number between 1 and 10');
  }
  
  // Tier validation
  const validTiers = ['verified', 'community', 'unverified'];
  if (!validTiers.includes(t.tier as string)) {
    errors.push(`tier must be one of: ${validTiers.join(', ')}`);
  }
  
  // Categories: non-empty array
  if (!Array.isArray(t.categories) || t.categories.length === 0) {
    errors.push('categories must be a non-empty array');
  }
  
  // Vendor object
  if (!t.vendor || typeof t.vendor !== 'object') {
    errors.push('vendor must be an object');
  } else {
    const v = t.vendor as Record<string, unknown>;
    if (typeof v.name !== 'string' || !v.name) errors.push('vendor.name is required');
    if (typeof v.domain !== 'string' || !v.domain) errors.push('vendor.domain is required');
    if (typeof v.verified !== 'boolean') errors.push('vendor.verified must be boolean');
  }
  
  // Install object
  if (!t.install || typeof t.install !== 'object') {
    errors.push('install must be an object');
  }
  
  // Capabilities object
  if (!t.capabilities || typeof t.capabilities !== 'object') {
    errors.push('capabilities must be an object');
  } else {
    const c = t.capabilities as Record<string, unknown>;
    if (typeof c.jsonOutput !== 'boolean') errors.push('capabilities.jsonOutput must be boolean');
    if (typeof c.idempotent !== 'boolean') errors.push('capabilities.idempotent must be boolean');
    if (typeof c.interactive !== 'boolean') errors.push('capabilities.interactive must be boolean');
    if (typeof c.streaming !== 'boolean') errors.push('capabilities.streaming must be boolean');
    if (!Array.isArray(c.auth)) errors.push('capabilities.auth must be an array');
  }
  
  return { valid: errors.length === 0, errors };
}

/**
 * Validate entire registry.
 */
export function validateRegistry(registry: unknown): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!registry || typeof registry !== 'object') {
    return { valid: false, errors: ['Registry must be an object'] };
  }
  
  const r = registry as Record<string, unknown>;
  
  if (typeof r.version !== 'string') {
    errors.push('Registry must have a version string');
  }
  
  if (!Array.isArray(r.tools)) {
    errors.push('Registry must have a tools array');
    return { valid: false, errors };
  }
  
  // Check for duplicate slugs
  const slugs = new Set<string>();
  for (const tool of r.tools as unknown[]) {
    const t = tool as Record<string, unknown>;
    if (typeof t.slug === 'string') {
      if (slugs.has(t.slug)) {
        errors.push(`Duplicate slug: ${t.slug}`);
      }
      slugs.add(t.slug);
    }
    
    const toolValidation = validateTool(tool);
    if (!toolValidation.valid) {
      errors.push(`Tool "${t.slug || 'unknown'}": ${toolValidation.errors.join(', ')}`);
    }
  }
  
  return { valid: errors.length === 0, errors };
}

/**
 * Generate install command string for a tool and platform.
 */
export function getInstallCommand(tool: CliTool, platform: keyof CliTool['install']): string | null {
  const cmd = tool.install[platform];
  if (!cmd) return null;
  
  switch (platform) {
    case 'brew': return `brew install ${cmd}`;
    case 'apt': return `sudo apt install ${cmd}`;
    case 'npm': return `npm install -g ${cmd}`;
    case 'cargo': return `cargo install ${cmd}`;
    case 'go': return `go install ${cmd}`;
    case 'binary': return cmd;
    case 'script': return cmd;
    default: return null;
  }
}

/**
 * Compare tools and return a comparison matrix.
 */
export interface ComparisonRow {
  field: string;
  values: (string | boolean | number)[];
}

export function compareTools(tools: CliTool[]): ComparisonRow[] {
  if (tools.length === 0) return [];
  
  return [
    { field: 'Agent Score', values: tools.map(t => t.agentScore) },
    { field: 'JSON Output', values: tools.map(t => t.capabilities.jsonOutput) },
    { field: 'Idempotent', values: tools.map(t => t.capabilities.idempotent) },
    { field: 'Interactive', values: tools.map(t => t.capabilities.interactive) },
    { field: 'Streaming', values: tools.map(t => t.capabilities.streaming) },
    { field: 'Tier', values: tools.map(t => t.tier) },
  ];
}
