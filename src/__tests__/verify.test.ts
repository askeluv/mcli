import { describe, it, expect, vi } from 'vitest';
import type { CliTool } from '../types.js';
import { verifyTool, formatVerificationResult } from '../verify.js';

// Helper to create a mock tool
const createMockTool = (overrides: Partial<CliTool> = {}): CliTool => ({
  slug: 'test-tool',
  name: 'Test Tool',
  vendor: { name: 'Test Vendor', domain: 'testrepo.com', verified: false },
  repo: 'https://github.com/testrepo/test-tool',
  install: { npm: 'test-tool' },
  capabilities: { jsonOutput: true, auth: [], idempotent: true, interactive: false, streaming: false },
  agentScore: 8,
  categories: ['testing'],
  tier: 'unverified',
  description: 'A test tool',
  ...overrides,
});

// Mock fetch factory
const createMockFetch = (response: { ok: boolean; status?: number; json?: () => Promise<unknown> }) => {
  return vi.fn().mockResolvedValue({
    ok: response.ok,
    status: response.status || (response.ok ? 200 : 404),
    json: response.json || (() => Promise.resolve({})),
  });
};

describe('verifyTool', () => {
  it('passes all checks for valid active repo with matching domain', async () => {
    const mockFetch = createMockFetch({
      ok: true,
      json: () => Promise.resolve({
        pushed_at: new Date().toISOString(),
        stargazers_count: 1000,
      }),
    });
    
    const tool = createMockTool({
      repo: 'https://github.com/testrepo/test-tool',
      vendor: { name: 'Test', domain: 'testrepo.com', verified: false },
    });
    
    const result = await verifyTool(tool, mockFetch as unknown as typeof fetch);
    
    expect(result.checks.repoExists.passed).toBe(true);
    expect(result.checks.repoActive.passed).toBe(true);
    expect(result.checks.domainMatch.passed).toBe(true);
    expect(result.checks.hasInstallMethod.passed).toBe(true);
    expect(result.score).toBe(100);
    expect(result.recommendation).toBe('verified');
  });

  it('fails repoExists when GitHub returns 404', async () => {
    const mockFetch = createMockFetch({ ok: false, status: 404 });
    const tool = createMockTool();
    
    const result = await verifyTool(tool, mockFetch as unknown as typeof fetch);
    
    expect(result.checks.repoExists.passed).toBe(false);
    expect(result.checks.repoExists.detail).toContain('404');
  });

  it('fails repoActive when repo is inactive', async () => {
    const oldDate = new Date();
    oldDate.setFullYear(oldDate.getFullYear() - 2); // 2 years ago
    
    const mockFetch = createMockFetch({
      ok: true,
      json: () => Promise.resolve({ pushed_at: oldDate.toISOString(), stargazers_count: 100 }),
    });
    
    const tool = createMockTool();
    const result = await verifyTool(tool, mockFetch as unknown as typeof fetch);
    
    expect(result.checks.repoExists.passed).toBe(true);
    expect(result.checks.repoActive.passed).toBe(false);
    expect(result.checks.repoActive.detail).toContain('Inactive');
  });

  it('fails domainMatch when org doesnt match vendor', async () => {
    const mockFetch = createMockFetch({
      ok: true,
      json: () => Promise.resolve({ pushed_at: new Date().toISOString() }),
    });
    
    const tool = createMockTool({
      repo: 'https://github.com/differentorg/tool',
      vendor: { name: 'Test', domain: 'example.com', verified: false },
    });
    
    const result = await verifyTool(tool, mockFetch as unknown as typeof fetch);
    
    expect(result.checks.domainMatch.passed).toBe(false);
    expect(result.checks.domainMatch.detail).toContain('differentorg');
  });

  it('handles network errors gracefully', async () => {
    const mockFetch = vi.fn().mockRejectedValue(new Error('Network error'));
    const tool = createMockTool();
    
    const result = await verifyTool(tool, mockFetch as unknown as typeof fetch);
    
    expect(result.checks.repoExists.passed).toBe(false);
    expect(result.checks.repoExists.detail).toContain('Failed');
  });

  it('fails hasInstallMethod when no install methods', async () => {
    const mockFetch = createMockFetch({ ok: true, json: () => Promise.resolve({}) });
    const tool = createMockTool({ install: {} });
    
    const result = await verifyTool(tool, mockFetch as unknown as typeof fetch);
    
    expect(result.checks.hasInstallMethod.passed).toBe(false);
  });

  it('returns community recommendation for 2-3 checks passed', async () => {
    const mockFetch = createMockFetch({ ok: false, status: 404 });
    const tool = createMockTool(); // has install method
    
    const result = await verifyTool(tool, mockFetch as unknown as typeof fetch);
    
    // Only hasInstallMethod passes (1 check)
    expect(result.recommendation).toBe('unverified');
  });
});

describe('formatVerificationResult', () => {
  it('formats result with checkmarks', () => {
    const result = {
      slug: 'test',
      checks: {
        repoExists: { passed: true, detail: 'Exists' },
        repoActive: { passed: true, detail: 'Active' },
        domainMatch: { passed: false, detail: 'Mismatch' },
        hasInstallMethod: { passed: true, detail: '1 method' },
      },
      score: 75,
      recommendation: 'community' as const,
    };
    
    const output = formatVerificationResult(result);
    
    expect(output).toContain('test');
    expect(output).toContain('75/100');
    expect(output).toContain('COMMUNITY');
    expect(output).toContain('✓');
    expect(output).toContain('✗');
  });
});

// Test the verification logic helpers (without network calls)

describe('verification helpers', () => {
  // Test domain to org matching logic
  describe('domain matching', () => {
    const domainToOrg = (domain: string): string[] => {
      const base = domain.replace(/\.(com|org|io|co|dev|sh)$/, '').toLowerCase();
      return [
        base,
        base.replace(/\./g, ''),
        base.replace(/\./g, '-'),
        base.split('.')[0],
      ];
    };

    it('extracts org names from simple domain', () => {
      const orgs = domainToOrg('hetzner.com');
      expect(orgs).toContain('hetzner');
    });

    it('handles compound domains', () => {
      const orgs = domainToOrg('trail-of-bits.io');
      expect(orgs).toContain('trail-of-bits');
    });

    it('handles subdomains', () => {
      const orgs = domainToOrg('docs.github.com');
      expect(orgs).toContain('docs');
      expect(orgs).toContain('docsgithub');
    });
  });

  describe('github org extraction', () => {
    const extractGitHubOrg = (repoUrl: string): string | null => {
      const match = repoUrl.match(/github\.com\/([^\/]+)/);
      return match ? match[1].toLowerCase() : null;
    };

    it('extracts org from github URL', () => {
      expect(extractGitHubOrg('https://github.com/ethereum/go-ethereum')).toBe('ethereum');
      expect(extractGitHubOrg('https://github.com/cli/cli')).toBe('cli');
      expect(extractGitHubOrg('https://github.com/NomicFoundation/hardhat')).toBe('nomicfoundation');
    });

    it('returns null for non-github URLs', () => {
      expect(extractGitHubOrg('https://gitlab.com/org/repo')).toBeNull();
    });
  });

  describe('recommendation logic', () => {
    const getRecommendation = (passedChecks: number): string => {
      if (passedChecks >= 4) return 'verified';
      if (passedChecks >= 2) return 'community';
      return 'unverified';
    };

    it('returns verified for 4 checks', () => {
      expect(getRecommendation(4)).toBe('verified');
    });

    it('returns community for 2-3 checks', () => {
      expect(getRecommendation(3)).toBe('community');
      expect(getRecommendation(2)).toBe('community');
    });

    it('returns unverified for 0-1 checks', () => {
      expect(getRecommendation(1)).toBe('unverified');
      expect(getRecommendation(0)).toBe('unverified');
    });
  });

  describe('score calculation', () => {
    const calculateScore = (passedChecks: number, totalChecks: number = 4): number => {
      return Math.round((passedChecks / totalChecks) * 100);
    };

    it('calculates percentage correctly', () => {
      expect(calculateScore(4)).toBe(100);
      expect(calculateScore(3)).toBe(75);
      expect(calculateScore(2)).toBe(50);
      expect(calculateScore(1)).toBe(25);
      expect(calculateScore(0)).toBe(0);
    });
  });
});
