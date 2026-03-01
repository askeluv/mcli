import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { writeFileSync, readFileSync, rmSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { computeAgentScore, validateTool } from '../lib.js';

// Test the core logic used by add.ts (can't easily test interactive prompts)

describe('add command helpers', () => {
  describe('computeAgentScore', () => {
    it('computes weighted average correctly', () => {
      const scores = {
        jsonOutput: 5,
        nonInteractive: 5,
        tokenEfficiency: 5,
        safetyFeatures: 5,
        pipelineFriendly: 5,
      };
      // Max score: (5*3 + 5*3 + 5*2 + 5*1 + 5*1) / 50 * 10 = 10
      expect(computeAgentScore(scores)).toBe(10);
    });

    it('handles low scores', () => {
      const scores = {
        jsonOutput: 1,
        nonInteractive: 1,
        tokenEfficiency: 1,
        safetyFeatures: 1,
        pipelineFriendly: 1,
      };
      // Min score: (1*3 + 1*3 + 1*2 + 1*1 + 1*1) / 50 * 10 = 2
      expect(computeAgentScore(scores)).toBe(2);
    });

    it('handles mixed scores', () => {
      const scores = {
        jsonOutput: 5,      // 15
        nonInteractive: 3,  // 9
        tokenEfficiency: 4, // 8
        safetyFeatures: 2,  // 2
        pipelineFriendly: 3,// 3
      };
      // (15 + 9 + 8 + 2 + 3) / 50 * 10 = 7.4 → 7
      expect(computeAgentScore(scores)).toBe(7);
    });
  });

  describe('validateTool for new submissions', () => {
    const validTool = {
      slug: 'test-tool',
      name: 'Test Tool',
      description: 'A test tool',
      vendor: { name: 'Test', domain: 'test.com', verified: false },
      install: { npm: 'test-tool' },
      capabilities: {
        jsonOutput: true,
        auth: [],
        idempotent: true,
        interactive: false,
        streaming: false,
      },
      agentScores: {
        jsonOutput: 4,
        nonInteractive: 5,
        tokenEfficiency: 3,
        safetyFeatures: 4,
        pipelineFriendly: 4,
      },
      agentScore: 8,
      categories: ['testing'],
      tier: 'unverified' as const,
    };

    it('accepts valid tool submission', () => {
      const result = validateTool(validTool);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('rejects invalid slug format', () => {
      const result = validateTool({ ...validTool, slug: 'Invalid Slug!' });
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('Slug'))).toBe(true);
    });

    it('rejects missing description', () => {
      const { description, ...noDesc } = validTool;
      const result = validateTool(noDesc);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('description'))).toBe(true);
    });

    it('rejects empty categories', () => {
      const result = validateTool({ ...validTool, categories: [] });
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('categories'))).toBe(true);
    });

    it('rejects agent score out of range', () => {
      const result = validateTool({ ...validTool, agentScore: 15 });
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('agentScore'))).toBe(true);
    });
  });

  describe('slug validation', () => {
    it('accepts lowercase alphanumeric with hyphens', () => {
      const validSlugs = ['aws', 'gh', 'docker-compose', 'k9s', 'aws-cli-2'];
      validSlugs.forEach(slug => {
        expect(/^[a-z0-9-]+$/.test(slug)).toBe(true);
      });
    });

    it('rejects invalid slugs', () => {
      const invalidSlugs = ['AWS', 'my tool', 'test_tool', 'tool!', ''];
      invalidSlugs.forEach(slug => {
        expect(/^[a-z0-9-]+$/.test(slug)).toBe(false);
      });
    });
  });
});
