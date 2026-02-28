import { describe, it, expect } from 'vitest';
import {
  scoreColor,
  reset,
  formatToolHeader,
  formatToolBrief,
  formatToolDetailed,
  formatCompareTable,
  formatInstallCommands,
} from '../format.js';
import type { CliTool } from '../types.js';

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

describe('scoreColor', () => {
  it('returns green for scores 8-10', () => {
    expect(scoreColor(8)).toBe('\x1b[32m');
    expect(scoreColor(9)).toBe('\x1b[32m');
    expect(scoreColor(10)).toBe('\x1b[32m');
  });

  it('returns yellow for scores 5-7', () => {
    expect(scoreColor(5)).toBe('\x1b[33m');
    expect(scoreColor(6)).toBe('\x1b[33m');
    expect(scoreColor(7)).toBe('\x1b[33m');
  });

  it('returns red for scores 1-4', () => {
    expect(scoreColor(1)).toBe('\x1b[31m');
    expect(scoreColor(2)).toBe('\x1b[31m');
    expect(scoreColor(3)).toBe('\x1b[31m');
    expect(scoreColor(4)).toBe('\x1b[31m');
  });

  it('handles boundary values', () => {
    expect(scoreColor(4)).toBe('\x1b[31m'); // red
    expect(scoreColor(5)).toBe('\x1b[33m'); // yellow
    expect(scoreColor(7)).toBe('\x1b[33m'); // yellow
    expect(scoreColor(8)).toBe('\x1b[32m'); // green
  });
});

describe('reset', () => {
  it('returns ANSI reset code', () => {
    expect(reset()).toBe('\x1b[0m');
  });
});

describe('formatToolHeader', () => {
  it('includes tier badge', () => {
    expect(formatToolHeader(createTool({ tier: 'verified' }))).toContain('✓');
    expect(formatToolHeader(createTool({ tier: 'community' }))).toContain('○');
    expect(formatToolHeader(createTool({ tier: 'unverified' }))).toContain('?');
  });

  it('includes tool name and slug', () => {
    const header = formatToolHeader(createTool({ name: 'My Tool', slug: 'my-tool' }));
    expect(header).toContain('My Tool');
    expect(header).toContain('my-tool');
  });

  it('includes agent score with color', () => {
    const header = formatToolHeader(createTool({ agentScore: 9 }));
    expect(header).toContain('9/10');
    expect(header).toContain('\x1b[32m'); // green
  });

  it('includes reset code', () => {
    const header = formatToolHeader(createTool());
    expect(header).toContain('\x1b[0m');
  });
});

describe('formatToolBrief', () => {
  it('includes header and description', () => {
    const tool = createTool({ description: 'A great tool' });
    const brief = formatToolBrief(tool);
    expect(brief).toContain('Test Tool');
    expect(brief).toContain('A great tool');
  });

  it('matches snapshot', () => {
    const tool = createTool({
      slug: 'jq',
      name: 'jq',
      agentScore: 10,
      tier: 'verified',
      description: 'Lightweight JSON processor.',
    });
    expect(formatToolBrief(tool)).toMatchSnapshot();
  });
});

describe('formatToolDetailed', () => {
  it('includes all sections', () => {
    const tool = createTool({
      repo: 'https://github.com/test/tool',
      docs: 'https://test.com/docs',
    });
    const detailed = formatToolDetailed(tool);
    
    expect(detailed).toContain('Vendor:');
    expect(detailed).toContain('Categories:');
    expect(detailed).toContain('Install:');
    expect(detailed).toContain('Capabilities:');
    expect(detailed).toContain('Repo:');
    expect(detailed).toContain('Docs:');
  });

  it('shows capabilities correctly', () => {
    const tool = createTool({
      capabilities: {
        jsonOutput: true,
        idempotent: false,
        interactive: true,
        streaming: false,
        auth: ['env:TOKEN', 'config file'],
      },
    });
    const detailed = formatToolDetailed(tool);
    
    expect(detailed).toContain('JSON output: yes');
    expect(detailed).toContain('Idempotent: no');
    expect(detailed).toContain('Interactive: yes');
    expect(detailed).toContain('Auth: env:TOKEN, config file');
  });

  it('omits repo and docs if not present', () => {
    const tool = createTool();
    delete (tool as Record<string, unknown>).repo;
    delete (tool as Record<string, unknown>).docs;
    
    const detailed = formatToolDetailed(tool);
    expect(detailed).not.toContain('Repo:');
    expect(detailed).not.toContain('Docs:');
  });

  it('matches snapshot', () => {
    const tool = createTool({
      slug: 'gh',
      name: 'GitHub CLI',
      agentScore: 9,
      tier: 'verified',
      vendor: { name: 'GitHub', domain: 'github.com', verified: true },
      categories: ['git', 'devtools'],
      install: { brew: 'gh', apt: 'gh' },
      capabilities: {
        jsonOutput: true,
        idempotent: true,
        interactive: true,
        streaming: false,
        auth: ['gh auth login', 'env:GH_TOKEN'],
      },
      description: 'GitHub from the command line.',
      repo: 'https://github.com/cli/cli',
      docs: 'https://cli.github.com/manual/',
    });
    expect(formatToolDetailed(tool)).toMatchSnapshot();
  });
});

describe('formatCompareTable', () => {
  it('returns "No tools found" for empty array', () => {
    expect(formatCompareTable([])).toBe('No tools found');
  });

  it('includes header row with tool slugs', () => {
    const tools = [
      createTool({ slug: 'aws' }),
      createTool({ slug: 'gcloud' }),
    ];
    const table = formatCompareTable(tools);
    expect(table).toContain('aws');
    expect(table).toContain('gcloud');
  });

  it('includes all comparison rows', () => {
    const tools = [createTool(), createTool({ slug: 'other' })];
    const table = formatCompareTable(tools);
    
    expect(table).toContain('Agent Score');
    expect(table).toContain('JSON Output');
    expect(table).toContain('Idempotent');
    expect(table).toContain('Interactive');
  });

  it('formats boolean values as yes/no', () => {
    const tools = [
      createTool({ capabilities: { ...createTool().capabilities, jsonOutput: true } }),
      createTool({ slug: 'b', capabilities: { ...createTool().capabilities, jsonOutput: false } }),
    ];
    const table = formatCompareTable(tools);
    expect(table).toContain('yes');
    expect(table).toContain('no');
  });

  it('formats tier values with badges', () => {
    const tools = [
      createTool({ tier: 'verified' }),
      createTool({ slug: 'b', tier: 'community' }),
    ];
    const table = formatCompareTable(tools);
    expect(table).toContain('✓');
    expect(table).toContain('○');
  });

  it('matches snapshot', () => {
    const tools = [
      createTool({
        slug: 'aws',
        agentScore: 6,
        tier: 'verified',
        capabilities: { jsonOutput: true, idempotent: true, interactive: false, streaming: true, auth: [] },
      }),
      createTool({
        slug: 'gcloud',
        agentScore: 7,
        tier: 'verified',
        capabilities: { jsonOutput: true, idempotent: true, interactive: true, streaming: false, auth: [] },
      }),
    ];
    expect(formatCompareTable(tools)).toMatchSnapshot();
  });
});

describe('formatInstallCommands', () => {
  it('includes tool name in header', () => {
    const tool = createTool({ name: 'My Tool' });
    const output = formatInstallCommands(tool);
    expect(output).toContain('# Install My Tool');
  });

  it('formats brew command', () => {
    const tool = createTool({ install: { brew: 'mytool' } });
    const output = formatInstallCommands(tool);
    expect(output).toContain('# macOS (Homebrew)');
    expect(output).toContain('brew install mytool');
  });

  it('formats apt command', () => {
    const tool = createTool({ install: { apt: 'mytool' } });
    const output = formatInstallCommands(tool);
    expect(output).toContain('# Debian/Ubuntu');
    expect(output).toContain('sudo apt install mytool');
  });

  it('formats npm command', () => {
    const tool = createTool({ install: { npm: 'mytool' } });
    const output = formatInstallCommands(tool);
    expect(output).toContain('# npm');
    expect(output).toContain('npm install -g mytool');
  });

  it('formats cargo command', () => {
    const tool = createTool({ install: { cargo: 'mytool' } });
    const output = formatInstallCommands(tool);
    expect(output).toContain('# Cargo (Rust)');
    expect(output).toContain('cargo install mytool');
  });

  it('formats go command', () => {
    const tool = createTool({ install: { go: 'github.com/test/mytool@latest' } });
    const output = formatInstallCommands(tool);
    expect(output).toContain('# Go');
    expect(output).toContain('go install github.com/test/mytool@latest');
  });

  it('formats binary and script as-is', () => {
    const tool = createTool({ 
      install: { 
        binary: 'https://example.com/download',
        script: 'curl -L https://example.com | sh',
      } 
    });
    const output = formatInstallCommands(tool);
    expect(output).toContain('# Binary download');
    expect(output).toContain('https://example.com/download');
    expect(output).toContain('# Install script');
    expect(output).toContain('curl -L https://example.com | sh');
  });

  it('includes all available methods', () => {
    const tool = createTool({
      install: {
        brew: 'tool',
        apt: 'tool',
        npm: 'tool',
      },
    });
    const output = formatInstallCommands(tool);
    expect(output).toContain('brew install');
    expect(output).toContain('apt install');
    expect(output).toContain('npm install');
  });

  it('matches snapshot', () => {
    const tool = createTool({
      name: 'ripgrep',
      install: {
        brew: 'ripgrep',
        apt: 'ripgrep',
        cargo: 'ripgrep',
      },
    });
    expect(formatInstallCommands(tool)).toMatchSnapshot();
  });
});
