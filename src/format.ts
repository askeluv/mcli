/**
 * Formatting helpers for CLI output.
 * Extracted for testability.
 */
import type { CliTool } from './types.js';
import { tierBadge, compareTools, type ComparisonRow } from './lib.js';

/**
 * ANSI color code for agent score.
 */
export function scoreColor(score: number): string {
  if (score >= 8) return '\x1b[32m'; // green
  if (score >= 5) return '\x1b[33m'; // yellow
  return '\x1b[31m'; // red
}

/**
 * ANSI reset code.
 */
export function reset(): string {
  return '\x1b[0m';
}

/**
 * Format a tool's header line.
 */
export function formatToolHeader(tool: CliTool): string {
  const badge = tierBadge(tool.tier);
  const color = scoreColor(tool.agentScore);
  return `${badge} ${tool.name} (${tool.slug}) - Agent Score: ${color}${tool.agentScore}/10${reset()}`;
}

/**
 * Format a tool for brief display.
 */
export function formatToolBrief(tool: CliTool): string {
  return `${formatToolHeader(tool)}\n  ${tool.description}`;
}

/**
 * Format a tool for detailed display.
 */
export function formatToolDetailed(tool: CliTool): string {
  const lines = [formatToolHeader(tool), `  ${tool.description}`];
  
  lines.push(`  Vendor: ${tool.vendor.name} (${tool.vendor.domain})`);
  lines.push(`  Categories: ${tool.categories.join(', ')}`);
  
  lines.push(`  Install:`);
  for (const [method, cmd] of Object.entries(tool.install)) {
    if (cmd) lines.push(`    ${method}: ${cmd}`);
  }
  
  lines.push(`  Capabilities:`);
  lines.push(`    JSON output: ${tool.capabilities.jsonOutput ? 'yes' : 'no'}`);
  lines.push(`    Idempotent: ${tool.capabilities.idempotent ? 'yes' : 'no'}`);
  lines.push(`    Interactive: ${tool.capabilities.interactive ? 'yes' : 'no'}`);
  if (tool.capabilities.auth.length > 0) {
    lines.push(`    Auth: ${tool.capabilities.auth.join(', ')}`);
  }
  
  if (tool.repo) lines.push(`  Repo: ${tool.repo}`);
  if (tool.docs) lines.push(`  Docs: ${tool.docs}`);
  
  return lines.join('\n');
}

/**
 * Format a comparison table for multiple tools.
 */
export function formatCompareTable(tools: CliTool[]): string {
  if (tools.length === 0) {
    return 'No tools found';
  }

  const rows = compareTools(tools);
  const lines: string[] = [];
  
  // Header
  lines.push('Tool'.padEnd(20) + tools.map(t => t.slug.padEnd(15)).join(''));
  lines.push('-'.repeat(20 + tools.length * 15));
  
  // Format values
  const formatValue = (v: string | boolean | number): string => {
    if (typeof v === 'boolean') return v ? 'yes' : 'no';
    if (v === 'verified') return '✓';
    if (v === 'community') return '○';
    if (v === 'unverified') return '?';
    return String(v);
  };
  
  for (const row of rows) {
    const label = row.field === 'Agent Score' ? 'Agent Score' :
                  row.field === 'JSON Output' ? 'JSON Output' :
                  row.field === 'Idempotent' ? 'Idempotent' :
                  row.field === 'Interactive' ? 'Interactive' :
                  row.field === 'Streaming' ? 'Streaming' :
                  row.field === 'Tier' ? 'Verified' : row.field;
    
    const values = row.values.map(v => {
      const formatted = formatValue(v);
      return (row.field === 'Agent Score' ? `${formatted}/10` : formatted).padEnd(15);
    }).join('');
    
    lines.push(label.padEnd(20) + values);
  }
  
  return lines.join('\n');
}

/**
 * Format install commands for a tool.
 */
export function formatInstallCommands(tool: CliTool): string {
  const lines = [`# Install ${tool.name}`, ''];
  
  if (tool.install.brew) {
    lines.push('# macOS (Homebrew)');
    lines.push(`brew install ${tool.install.brew}`);
    lines.push('');
  }
  if (tool.install.apt) {
    lines.push('# Debian/Ubuntu');
    lines.push(`sudo apt install ${tool.install.apt}`);
    lines.push('');
  }
  if (tool.install.npm) {
    lines.push('# npm');
    lines.push(`npm install -g ${tool.install.npm}`);
    lines.push('');
  }
  if (tool.install.cargo) {
    lines.push('# Cargo (Rust)');
    lines.push(`cargo install ${tool.install.cargo}`);
    lines.push('');
  }
  if (tool.install.go) {
    lines.push('# Go');
    lines.push(`go install ${tool.install.go}`);
    lines.push('');
  }
  if (tool.install.binary) {
    lines.push('# Binary download');
    lines.push(tool.install.binary);
    lines.push('');
  }
  if (tool.install.script) {
    lines.push('# Install script');
    lines.push(tool.install.script);
    lines.push('');
  }
  
  return lines.join('\n');
}
