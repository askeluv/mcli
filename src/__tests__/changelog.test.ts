import { describe, it, expect } from 'vitest';
import { formatRelease, formatChangelogText, formatChangelogJson, type ChangelogEntry } from '../changelog.js';

describe('formatRelease', () => {
  it('extracts version without v prefix', () => {
    const release = {
      tag_name: 'v1.2.3',
      name: 'Release 1.2.3',
      published_at: '2026-03-01T12:00:00Z',
      body: 'Release notes here',
      html_url: 'https://github.com/askeluv/mcli/releases/v1.2.3',
    };
    
    const entry = formatRelease(release);
    
    expect(entry.version).toBe('1.2.3');
    expect(entry.date).toBe('2026-03-01');
    expect(entry.notes).toBe('Release notes here');
    expect(entry.url).toContain('releases');
  });

  it('handles missing body', () => {
    const release = {
      tag_name: 'v1.0.0',
      name: 'Release',
      published_at: '2026-01-01T00:00:00Z',
      body: '',
      html_url: 'https://example.com',
    };
    
    const entry = formatRelease(release);
    expect(entry.notes).toBe('No release notes.');
  });
});

describe('formatChangelogText', () => {
  const entries: ChangelogEntry[] = [
    { version: '1.1.0', date: '2026-03-01', notes: 'Added feature X\nFixed bug Y', url: 'https://example.com/1.1.0' },
    { version: '1.0.0', date: '2026-02-01', notes: 'Initial release', url: 'https://example.com/1.0.0' },
  ];

  it('formats compact changelog', () => {
    const output = formatChangelogText(entries, false);
    
    expect(output).toContain('## 1.1.0 (2026-03-01)');
    expect(output).toContain('## 1.0.0 (2026-02-01)');
    expect(output).toContain('Added feature X');
  });

  it('formats verbose changelog with full notes', () => {
    const output = formatChangelogText(entries, true);
    
    expect(output).toContain('Fixed bug Y');
    expect(output).toContain('→ https://example.com/1.1.0');
  });

  it('truncates long first lines in compact mode', () => {
    const longEntry: ChangelogEntry[] = [{
      version: '1.0.0',
      date: '2026-01-01',
      notes: 'A'.repeat(100),
      url: 'https://example.com',
    }];
    
    const output = formatChangelogText(longEntry, false);
    expect(output).toContain('...');
  });
});

describe('formatChangelogJson', () => {
  it('outputs valid JSON', () => {
    const entries: ChangelogEntry[] = [
      { version: '1.0.0', date: '2026-01-01', notes: 'Initial', url: 'https://example.com' },
    ];
    
    const output = formatChangelogJson(entries);
    const parsed = JSON.parse(output);
    
    expect(parsed).toHaveLength(1);
    expect(parsed[0].version).toBe('1.0.0');
  });
});
