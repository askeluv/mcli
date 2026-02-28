import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { writeFileSync, unlinkSync, mkdirSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { loadRegistry, RegistryError } from '../registry.js';

describe('loadRegistry', () => {
  const testDir = join(tmpdir(), 'mcli-test-' + Date.now());
  
  beforeEach(() => {
    mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  describe('file not found', () => {
    it('throws RegistryError for missing file', () => {
      const missingPath = join(testDir, 'nonexistent.json');
      
      expect(() => loadRegistry(missingPath)).toThrow(RegistryError);
      expect(() => loadRegistry(missingPath)).toThrow(/not found/);
    });

    it('includes file path in error message', () => {
      const missingPath = join(testDir, 'missing.json');
      
      try {
        loadRegistry(missingPath);
        expect.fail('Should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(RegistryError);
        expect((err as RegistryError).message).toContain('missing.json');
      }
    });
  });

  describe('invalid JSON', () => {
    it('throws RegistryError for malformed JSON', () => {
      const badJsonPath = join(testDir, 'bad.json');
      writeFileSync(badJsonPath, '{ invalid json }');
      
      expect(() => loadRegistry(badJsonPath)).toThrow(RegistryError);
      expect(() => loadRegistry(badJsonPath)).toThrow(/invalid JSON/);
    });

    it('throws for truncated JSON', () => {
      const truncatedPath = join(testDir, 'truncated.json');
      writeFileSync(truncatedPath, '{"version": "1.0.0", "tools": [');
      
      expect(() => loadRegistry(truncatedPath)).toThrow(RegistryError);
    });

    it('throws for empty file', () => {
      const emptyPath = join(testDir, 'empty.json');
      writeFileSync(emptyPath, '');
      
      expect(() => loadRegistry(emptyPath)).toThrow(RegistryError);
    });
  });

  describe('invalid schema', () => {
    it('throws RegistryError for missing version', () => {
      const noVersionPath = join(testDir, 'no-version.json');
      writeFileSync(noVersionPath, JSON.stringify({ tools: [] }));
      
      expect(() => loadRegistry(noVersionPath)).toThrow(RegistryError);
      expect(() => loadRegistry(noVersionPath)).toThrow(/validation failed/);
    });

    it('throws for missing tools array', () => {
      const noToolsPath = join(testDir, 'no-tools.json');
      writeFileSync(noToolsPath, JSON.stringify({ version: '1.0.0' }));
      
      expect(() => loadRegistry(noToolsPath)).toThrow(RegistryError);
    });

    it('throws for invalid tool in array', () => {
      const invalidToolPath = join(testDir, 'invalid-tool.json');
      writeFileSync(invalidToolPath, JSON.stringify({
        version: '1.0.0',
        updated: '2026-02-28',
        tools: [{ slug: 'INVALID SLUG!' }] // Invalid: uppercase and spaces
      }));
      
      expect(() => loadRegistry(invalidToolPath)).toThrow(RegistryError);
    });

    it('includes validation errors in message', () => {
      const badToolPath = join(testDir, 'bad-tool.json');
      writeFileSync(badToolPath, JSON.stringify({
        version: '1.0.0',
        updated: '2026-02-28',
        tools: [{
          slug: 'test',
          name: 'Test',
          description: 'Test tool',
          agentScore: 15, // Invalid: > 10
          tier: 'verified',
          categories: ['test'],
          vendor: { name: 'Test', domain: 'test.com', verified: true },
          install: { brew: 'test' },
          capabilities: {
            jsonOutput: true,
            idempotent: true,
            interactive: false,
            streaming: false,
            auth: [],
          },
        }]
      }));
      
      try {
        loadRegistry(badToolPath);
        expect.fail('Should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(RegistryError);
        expect((err as RegistryError).message).toContain('agentScore');
      }
    });
  });

  describe('valid registry', () => {
    it('loads valid registry successfully', () => {
      const validPath = join(testDir, 'valid.json');
      const validRegistry = {
        version: '1.0.0',
        updated: '2026-02-28',
        tools: [{
          slug: 'test-tool',
          name: 'Test Tool',
          description: 'A test tool for testing',
          agentScore: 8,
          tier: 'verified',
          categories: ['test'],
          vendor: { name: 'Test', domain: 'test.com', verified: true },
          install: { brew: 'test' },
          capabilities: {
            jsonOutput: true,
            idempotent: true,
            interactive: false,
            streaming: false,
            auth: [],
          },
        }]
      };
      writeFileSync(validPath, JSON.stringify(validRegistry));
      
      const registry = loadRegistry(validPath);
      expect(registry.version).toBe('1.0.0');
      expect(registry.tools).toHaveLength(1);
      expect(registry.tools[0].slug).toBe('test-tool');
    });

    it('loads empty tools array', () => {
      const emptyToolsPath = join(testDir, 'empty-tools.json');
      writeFileSync(emptyToolsPath, JSON.stringify({
        version: '1.0.0',
        updated: '2026-02-28',
        tools: []
      }));
      
      const registry = loadRegistry(emptyToolsPath);
      expect(registry.tools).toHaveLength(0);
    });
  });

  describe('RegistryError', () => {
    it('has correct name property', () => {
      const error = new RegistryError('test');
      expect(error.name).toBe('RegistryError');
    });

    it('preserves cause', () => {
      const cause = new Error('original');
      const error = new RegistryError('wrapped', cause);
      expect(error.cause).toBe(cause);
    });

    it('works with instanceof', () => {
      const error = new RegistryError('test');
      expect(error instanceof RegistryError).toBe(true);
      expect(error instanceof Error).toBe(true);
    });
  });
});
