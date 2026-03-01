import { describe, it, expect } from 'vitest';
import type { CliTool } from '../types.js';

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
