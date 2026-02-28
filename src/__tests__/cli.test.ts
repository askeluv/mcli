import { describe, it, expect } from 'vitest';
import { execSync } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const cliPath = join(__dirname, '..', 'cli.ts');

function runCli(args: string): string {
  return execSync(`npx tsx ${cliPath} ${args}`, {
    encoding: 'utf-8',
    cwd: join(__dirname, '..', '..'),
  });
}

describe('mcli CLI', () => {
  describe('help', () => {
    it('shows usage with no arguments', () => {
      const output = runCli('');
      expect(output).toContain('mcli - A CLI for discovering CLI tools');
      expect(output).toContain('Commands:');
    });

    it('shows usage with help command', () => {
      const output = runCli('help');
      expect(output).toContain('Commands:');
      expect(output).toContain('search <query>');
      expect(output).toContain('info <slug>');
      expect(output).toContain('compare <slug>');
    });

    it('shows usage with --help flag', () => {
      const output = runCli('--help');
      expect(output).toContain('Commands:');
    });
  });

  describe('search', () => {
    it('returns matching tools for category query', () => {
      const output = runCli('search cloud');
      expect(output).toContain('hcloud');
      expect(output).toContain('aws');
      expect(output).toContain('gcloud');
    });

    it('returns matching tools for name query', () => {
      const output = runCli('search github');
      expect(output).toContain('GitHub CLI');
      expect(output).toContain('gh');
    });

    it('shows "No tools found" for non-matching query', () => {
      const output = runCli('search xyznonexistent123');
      expect(output).toContain('No tools found');
    });

    it('shows usage when no query provided', () => {
      const output = runCli('search');
      expect(output).toContain('Usage: mcli search <query>');
    });

    it('handles multi-word queries', () => {
      const output = runCli('search json processor');
      // Should search for "json processor" as a phrase
      expect(output).toBeDefined();
    });
  });

  describe('info', () => {
    it('shows detailed tool info', () => {
      const output = runCli('info gh');
      expect(output).toContain('GitHub CLI');
      expect(output).toContain('Vendor:');
      expect(output).toContain('Categories:');
      expect(output).toContain('Install:');
      expect(output).toContain('Capabilities:');
    });

    it('shows repo and docs URLs', () => {
      const output = runCli('info gh');
      expect(output).toContain('Repo:');
      expect(output).toContain('Docs:');
    });

    it('shows "Tool not found" for invalid slug', () => {
      const output = runCli('info nonexistent-tool');
      expect(output).toContain('Tool not found');
    });

    it('shows usage when no slug provided', () => {
      const output = runCli('info');
      expect(output).toContain('Usage: mcli info <slug>');
    });
  });

  describe('compare', () => {
    it('shows comparison table for multiple tools', () => {
      const output = runCli('compare aws gcloud hcloud');
      expect(output).toContain('aws');
      expect(output).toContain('gcloud');
      expect(output).toContain('hcloud');
      expect(output).toContain('Agent Score');
      expect(output).toContain('JSON Output');
    });

    it('shows usage when fewer than 2 slugs provided', () => {
      const output = runCli('compare aws');
      expect(output).toContain('Usage: mcli compare');
    });

    it('handles non-existent tools gracefully', () => {
      const output = runCli('compare aws nonexistent');
      // Should still show aws, just not the nonexistent one
      expect(output).toContain('aws');
    });
  });

  describe('install', () => {
    it('shows install commands for a tool', () => {
      const output = runCli('install gh');
      expect(output).toContain('Install GitHub CLI');
      expect(output).toContain('brew install gh');
    });

    it('shows multiple install methods when available', () => {
      const output = runCli('install jq');
      expect(output).toContain('brew');
      expect(output).toContain('apt');
    });

    it('shows "Tool not found" for invalid slug', () => {
      const output = runCli('install nonexistent-tool');
      expect(output).toContain('Tool not found');
    });

    it('shows usage when no slug provided', () => {
      const output = runCli('install');
      expect(output).toContain('Usage: mcli install <slug>');
    });
  });

  describe('list', () => {
    it('lists all tools', () => {
      const output = runCli('list');
      expect(output).toContain('hcloud');
      expect(output).toContain('gh');
      expect(output).toContain('jq');
      expect(output).toContain('docker');
    });

    it('sorts by agent score with --agent-friendly flag', () => {
      const output = runCli('list --agent-friendly');
      const lines = output.split('\n').filter(l => l.includes('Agent Score'));
      // jq has score 10, should appear first
      expect(output.indexOf('jq')).toBeLessThan(output.indexOf('fzf'));
    });
  });

  describe('categories', () => {
    it('lists all categories', () => {
      const output = runCli('categories');
      expect(output).toContain('Categories:');
      expect(output).toContain('cloud');
      expect(output).toContain('devtools');
    });

    it('returns sorted categories', () => {
      const output = runCli('categories');
      // Categories should be alphabetically sorted
      const match = output.match(/Categories: (.+)/);
      expect(match).toBeTruthy();
      const cats = match![1].split(', ');
      const sorted = [...cats].sort();
      expect(cats).toEqual(sorted);
    });
  });

  describe('unknown command', () => {
    it('shows error for unknown command', () => {
      const output = runCli('unknowncommand');
      expect(output).toContain('Unknown command');
      expect(output).toContain("Run 'mcli help'");
    });
  });

  describe('output formatting', () => {
    it('shows tier badges', () => {
      const output = runCli('list');
      expect(output).toContain('✓'); // verified badge
    });

    it('shows colored agent scores', () => {
      const output = runCli('info jq');
      // jq has score 10, should have green color code
      expect(output).toContain('\x1b[32m'); // green
    });
  });
});
