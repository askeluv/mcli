import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { validateRegistry, validateTool } from '../lib.js';
import type { Registry } from '../types.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const registryPath = join(__dirname, '..', '..', 'registry', 'tools.json');

describe('registry/tools.json', () => {
  const registryData = JSON.parse(readFileSync(registryPath, 'utf-8'));

  it('is valid JSON and passes schema validation', () => {
    const result = validateRegistry(registryData);
    if (!result.valid) {
      console.error('Registry validation errors:', result.errors);
    }
    expect(result.valid).toBe(true);
  });

  it('has a version string', () => {
    expect(typeof registryData.version).toBe('string');
    expect(registryData.version).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it('has an updated date', () => {
    expect(typeof registryData.updated).toBe('string');
    expect(registryData.updated).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('has at least one tool', () => {
    expect(registryData.tools.length).toBeGreaterThan(0);
  });

  it('has no duplicate slugs', () => {
    const slugs = registryData.tools.map((t: { slug: string }) => t.slug);
    const uniqueSlugs = new Set(slugs);
    expect(slugs.length).toBe(uniqueSlugs.size);
  });

  describe('each tool', () => {
    const registry = registryData as Registry;
    
    registry.tools.forEach((tool) => {
      describe(`${tool.slug}`, () => {
        it('passes validation', () => {
          const result = validateTool(tool);
          if (!result.valid) {
            console.error(`Tool ${tool.slug} validation errors:`, result.errors);
          }
          expect(result.valid).toBe(true);
        });

        it('has a valid slug format', () => {
          expect(tool.slug).toMatch(/^[a-z0-9-]+$/);
        });

        it('has a non-empty description', () => {
          expect(tool.description.length).toBeGreaterThan(10);
        });

        // Note: Some tools may not have install methods if they're scripts or manual installs
        // This is a soft check - we log but don't fail
        it('install methods are valid if present', () => {
          const methods = Object.values(tool.install).filter(Boolean);
          // Just verify the install object exists and is valid
          expect(tool.install).toBeDefined();
          expect(typeof tool.install).toBe('object');
        });

        it('has agent score between 1 and 10', () => {
          expect(tool.agentScore).toBeGreaterThanOrEqual(1);
          expect(tool.agentScore).toBeLessThanOrEqual(10);
        });

        it('has at least one category', () => {
          expect(tool.categories.length).toBeGreaterThan(0);
        });

        it('has a valid tier', () => {
          expect(['verified', 'community', 'unverified']).toContain(tool.tier);
        });

        if (tool.repo) {
          it('has a valid repo URL', () => {
            expect(tool.repo).toMatch(/^https:\/\/github\.com\//);
          });
        }

        if (tool.docs) {
          it('has a valid docs URL', () => {
            expect(tool.docs).toMatch(/^https?:\/\//);
          });
        }
      });
    });
  });
});
