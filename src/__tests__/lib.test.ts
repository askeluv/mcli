import { describe, it, expect, beforeEach } from 'vitest';
import {
  searchTools,
  findTool,
  getCategories,
  sortByAgentScore,
  filterByMinScore,
  filterByCategory,
  filterByTier,
  tierBadge,
  validateTool,
  validateRegistry,
  getInstallCommand,
  compareTools,
} from '../lib.js';
import type { Registry, CliTool } from '../types.js';

// Test fixtures
const createTool = (overrides: Partial<CliTool> = {}): CliTool => ({
  slug: 'test-tool',
  name: 'Test Tool',
  vendor: { name: 'Test Vendor', domain: 'test.com', verified: true },
  install: { brew: 'test-tool' },
  capabilities: {
    jsonOutput: true,
    auth: ['env:TEST_TOKEN'],
    idempotent: true,
    interactive: false,
    streaming: false,
  },
  agentScore: 8,
  categories: ['devtools'],
  tier: 'verified',
  description: 'A test tool for testing',
  ...overrides,
});

const createRegistry = (tools: CliTool[] = []): Registry => ({
  version: '0.1.0',
  updated: '2026-02-28',
  tools,
});

describe('searchTools', () => {
  it('returns empty array for empty query', () => {
    const registry = createRegistry([createTool()]);
    expect(searchTools(registry, '')).toEqual([]);
    expect(searchTools(registry, '   ')).toEqual([]);
  });

  it('finds tools by slug', () => {
    const tool = createTool({ slug: 'hcloud' });
    const registry = createRegistry([tool]);
    expect(searchTools(registry, 'hcloud')).toEqual([tool]);
  });

  it('finds tools by name', () => {
    const tool = createTool({ name: 'GitHub CLI' });
    const registry = createRegistry([tool]);
    expect(searchTools(registry, 'github')).toEqual([tool]);
  });

  it('finds tools by description', () => {
    const tool = createTool({ description: 'Manage cloud infrastructure' });
    const registry = createRegistry([tool]);
    expect(searchTools(registry, 'infrastructure')).toEqual([tool]);
  });

  it('finds tools by category', () => {
    const tool = createTool({ categories: ['cloud', 'infrastructure'] });
    const registry = createRegistry([tool]);
    expect(searchTools(registry, 'cloud')).toEqual([tool]);
  });

  it('is case-insensitive', () => {
    const tool = createTool({ slug: 'HCloud', name: 'HCLOUD CLI' });
    const registry = createRegistry([tool]);
    expect(searchTools(registry, 'hcloud')).toEqual([tool]);
    expect(searchTools(registry, 'HCLOUD')).toEqual([tool]);
  });

  it('returns multiple matches', () => {
    const tool1 = createTool({ slug: 'aws', description: 'Cloud CLI' });
    const tool2 = createTool({ slug: 'gcloud', description: 'Cloud CLI' });
    const registry = createRegistry([tool1, tool2]);
    expect(searchTools(registry, 'cloud')).toHaveLength(2);
  });

  it('returns empty array when no matches', () => {
    const registry = createRegistry([createTool()]);
    expect(searchTools(registry, 'nonexistent')).toEqual([]);
  });
});

describe('findTool', () => {
  it('finds tool by exact slug', () => {
    const tool = createTool({ slug: 'gh' });
    const registry = createRegistry([tool]);
    expect(findTool(registry, 'gh')).toEqual(tool);
  });

  it('returns undefined for non-existent slug', () => {
    const registry = createRegistry([createTool({ slug: 'gh' })]);
    expect(findTool(registry, 'nonexistent')).toBeUndefined();
  });

  it('is case-sensitive', () => {
    const registry = createRegistry([createTool({ slug: 'gh' })]);
    expect(findTool(registry, 'GH')).toBeUndefined();
  });
});

describe('getCategories', () => {
  it('returns empty array for empty registry', () => {
    const registry = createRegistry([]);
    expect(getCategories(registry)).toEqual([]);
  });

  it('returns unique categories sorted alphabetically', () => {
    const registry = createRegistry([
      createTool({ categories: ['cloud', 'devtools'] }),
      createTool({ slug: 'tool2', categories: ['devtools', 'ci'] }),
    ]);
    expect(getCategories(registry)).toEqual(['ci', 'cloud', 'devtools']);
  });
});

describe('sortByAgentScore', () => {
  it('sorts tools by agent score descending', () => {
    const low = createTool({ slug: 'low', agentScore: 3 });
    const mid = createTool({ slug: 'mid', agentScore: 6 });
    const high = createTool({ slug: 'high', agentScore: 9 });
    
    const sorted = sortByAgentScore([low, high, mid]);
    expect(sorted.map(t => t.slug)).toEqual(['high', 'mid', 'low']);
  });

  it('does not mutate original array', () => {
    const tools = [
      createTool({ slug: 'low', agentScore: 3 }),
      createTool({ slug: 'high', agentScore: 9 }),
    ];
    const original = [...tools];
    sortByAgentScore(tools);
    expect(tools).toEqual(original);
  });
});

describe('filterByMinScore', () => {
  it('filters tools below minimum score', () => {
    const tools = [
      createTool({ slug: 'low', agentScore: 3 }),
      createTool({ slug: 'mid', agentScore: 6 }),
      createTool({ slug: 'high', agentScore: 9 }),
    ];
    const filtered = filterByMinScore(tools, 5);
    expect(filtered.map(t => t.slug)).toEqual(['mid', 'high']);
  });

  it('includes tools at exactly minimum score', () => {
    const tool = createTool({ agentScore: 5 });
    expect(filterByMinScore([tool], 5)).toHaveLength(1);
  });
});

describe('filterByCategory', () => {
  it('filters tools by category', () => {
    const cloud = createTool({ slug: 'cloud', categories: ['cloud'] });
    const devtools = createTool({ slug: 'dev', categories: ['devtools'] });
    const both = createTool({ slug: 'both', categories: ['cloud', 'devtools'] });
    
    const filtered = filterByCategory([cloud, devtools, both], 'cloud');
    expect(filtered.map(t => t.slug)).toEqual(['cloud', 'both']);
  });

  it('is case-insensitive', () => {
    const tool = createTool({ categories: ['Cloud'] });
    expect(filterByCategory([tool], 'cloud')).toHaveLength(1);
    expect(filterByCategory([tool], 'CLOUD')).toHaveLength(1);
  });
});

describe('filterByTier', () => {
  it('filters tools by verification tier', () => {
    const verified = createTool({ slug: 'v', tier: 'verified' });
    const community = createTool({ slug: 'c', tier: 'community' });
    const unverified = createTool({ slug: 'u', tier: 'unverified' });
    
    expect(filterByTier([verified, community, unverified], 'verified')).toEqual([verified]);
    expect(filterByTier([verified, community, unverified], 'community')).toEqual([community]);
  });
});

describe('tierBadge', () => {
  it('returns correct badge for each tier', () => {
    expect(tierBadge('verified')).toBe('✓');
    expect(tierBadge('community')).toBe('○');
    expect(tierBadge('unverified')).toBe('?');
  });

  it('returns ? for unknown tier', () => {
    expect(tierBadge('invalid')).toBe('?');
  });
});

describe('validateTool', () => {
  it('validates a correct tool', () => {
    const tool = createTool();
    expect(validateTool(tool)).toEqual({ valid: true, errors: [] });
  });

  it('rejects non-object', () => {
    expect(validateTool(null).valid).toBe(false);
    expect(validateTool('string').valid).toBe(false);
  });

  it('requires slug', () => {
    const tool = createTool();
    delete (tool as Record<string, unknown>).slug;
    const result = validateTool(tool);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Missing or invalid field: slug');
  });

  it('validates slug format', () => {
    const tool = createTool({ slug: 'Invalid Slug!' });
    const result = validateTool(tool);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Slug must be lowercase alphanumeric with hyphens only');
  });

  it('validates agent score range', () => {
    expect(validateTool(createTool({ agentScore: 0 })).valid).toBe(false);
    expect(validateTool(createTool({ agentScore: 11 })).valid).toBe(false);
    expect(validateTool(createTool({ agentScore: 5 })).valid).toBe(true);
  });

  it('validates tier values', () => {
    expect(validateTool(createTool({ tier: 'invalid' as any })).valid).toBe(false);
    expect(validateTool(createTool({ tier: 'verified' })).valid).toBe(true);
    expect(validateTool(createTool({ tier: 'community' })).valid).toBe(true);
  });

  it('requires non-empty categories', () => {
    const tool = createTool({ categories: [] });
    expect(validateTool(tool).valid).toBe(false);
  });

  it('validates vendor object', () => {
    const tool = createTool();
    (tool as Record<string, unknown>).vendor = null;
    expect(validateTool(tool).valid).toBe(false);
  });

  it('validates capabilities object', () => {
    const tool = createTool();
    tool.capabilities.jsonOutput = 'yes' as any;
    const result = validateTool(tool);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('jsonOutput'))).toBe(true);
  });
});

describe('validateRegistry', () => {
  it('validates a correct registry', () => {
    const registry = createRegistry([createTool()]);
    expect(validateRegistry(registry)).toEqual({ valid: true, errors: [] });
  });

  it('rejects non-object', () => {
    expect(validateRegistry(null).valid).toBe(false);
  });

  it('requires version', () => {
    const registry = { tools: [] };
    const result = validateRegistry(registry);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Registry must have a version string');
  });

  it('requires tools array', () => {
    const registry = { version: '1.0.0' };
    const result = validateRegistry(registry);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Registry must have a tools array');
  });

  it('detects duplicate slugs', () => {
    const registry = createRegistry([
      createTool({ slug: 'dupe' }),
      createTool({ slug: 'dupe' }),
    ]);
    const result = validateRegistry(registry);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('Duplicate slug'))).toBe(true);
  });

  it('validates each tool', () => {
    const registry = createRegistry([
      createTool({ agentScore: 15 }), // invalid
    ]);
    const result = validateRegistry(registry);
    expect(result.valid).toBe(false);
  });
});

describe('getInstallCommand', () => {
  it('generates brew command', () => {
    const tool = createTool({ install: { brew: 'mycli' } });
    expect(getInstallCommand(tool, 'brew')).toBe('brew install mycli');
  });

  it('generates apt command', () => {
    const tool = createTool({ install: { apt: 'mycli' } });
    expect(getInstallCommand(tool, 'apt')).toBe('sudo apt install mycli');
  });

  it('generates npm command', () => {
    const tool = createTool({ install: { npm: 'mycli' } });
    expect(getInstallCommand(tool, 'npm')).toBe('npm install -g mycli');
  });

  it('generates cargo command', () => {
    const tool = createTool({ install: { cargo: 'mycli' } });
    expect(getInstallCommand(tool, 'cargo')).toBe('cargo install mycli');
  });

  it('generates go command', () => {
    const tool = createTool({ install: { go: 'github.com/org/mycli@latest' } });
    expect(getInstallCommand(tool, 'go')).toBe('go install github.com/org/mycli@latest');
  });

  it('returns raw value for binary and script', () => {
    const tool = createTool({ install: { binary: 'https://example.com/dl' } });
    expect(getInstallCommand(tool, 'binary')).toBe('https://example.com/dl');
  });

  it('returns null for unavailable platform', () => {
    const tool = createTool({ install: { brew: 'mycli' } });
    expect(getInstallCommand(tool, 'apt')).toBeNull();
  });
});

describe('compareTools', () => {
  it('returns empty array for no tools', () => {
    expect(compareTools([])).toEqual([]);
  });

  it('returns comparison matrix', () => {
    const tools = [
      createTool({ slug: 'a', agentScore: 8, capabilities: { jsonOutput: true, idempotent: true, interactive: false, streaming: false, auth: [] } }),
      createTool({ slug: 'b', agentScore: 5, capabilities: { jsonOutput: false, idempotent: false, interactive: true, streaming: true, auth: [] } }),
    ];
    const result = compareTools(tools);
    
    expect(result.find(r => r.field === 'Agent Score')?.values).toEqual([8, 5]);
    expect(result.find(r => r.field === 'JSON Output')?.values).toEqual([true, false]);
    expect(result.find(r => r.field === 'Idempotent')?.values).toEqual([true, false]);
    expect(result.find(r => r.field === 'Interactive')?.values).toEqual([false, true]);
    expect(result.find(r => r.field === 'Streaming')?.values).toEqual([false, true]);
  });
});
