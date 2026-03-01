/**
 * Tool verification system for mcli.
 * Checks provenance and authenticity of CLI tools.
 */
import type { CliTool } from './types.js';

export interface VerificationResult {
  slug: string;
  checks: {
    repoExists: { passed: boolean; detail: string };
    repoActive: { passed: boolean; detail: string };
    domainMatch: { passed: boolean; detail: string };
    hasInstallMethod: { passed: boolean; detail: string };
  };
  score: number;  // 0-100
  recommendation: 'verified' | 'community' | 'unverified';
}

function extractGitHubOrg(repoUrl: string): string | null {
  const match = repoUrl.match(/github\.com\/([^\/]+)/);
  return match ? match[1].toLowerCase() : null;
}

function domainToOrg(domain: string): string[] {
  // Generate possible GitHub org names from domain
  const base = domain.replace(/\.(com|org|io|co|dev|sh)$/, '').toLowerCase();
  return [
    base,
    base.replace(/\./g, ''),
    base.replace(/\./g, '-'),
    base.split('.')[0],
  ];
}

export async function verifyTool(
  tool: CliTool,
  fetcher: typeof fetch = fetch
): Promise<VerificationResult> {
  const checks: VerificationResult['checks'] = {
    repoExists: { passed: false, detail: 'No repo URL provided' },
    repoActive: { passed: false, detail: 'Could not check activity' },
    domainMatch: { passed: false, detail: 'Could not verify domain match' },
    hasInstallMethod: { passed: false, detail: 'No install method provided' },
  };

  // Check 1: Has install method
  const installMethods = Object.values(tool.install).filter(Boolean);
  if (installMethods.length > 0) {
    checks.hasInstallMethod = { passed: true, detail: `${installMethods.length} install method(s)` };
  }

  // Check 2: Repo exists and is active
  if (tool.repo && tool.repo.includes('github.com')) {
    try {
      const repoPath = tool.repo.replace('https://github.com/', '');
      const response = await fetcher(`https://api.github.com/repos/${repoPath}`, {
        headers: { 'User-Agent': 'mcli-verify' },
      });
      
      if (response.ok) {
        const data = await response.json() as { pushed_at?: string; stargazers_count?: number };
        checks.repoExists = { passed: true, detail: 'Repository exists on GitHub' };
        
        // Check if pushed in last year
        if (data.pushed_at) {
          const lastPush = new Date(data.pushed_at);
          const oneYearAgo = new Date();
          oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
          
          if (lastPush > oneYearAgo) {
            checks.repoActive = { 
              passed: true, 
              detail: `Last activity: ${lastPush.toISOString().split('T')[0]}, ${data.stargazers_count || 0} stars` 
            };
          } else {
            checks.repoActive = { 
              passed: false, 
              detail: `Inactive since ${lastPush.toISOString().split('T')[0]}` 
            };
          }
        }
        
        // Check 3: Domain matches GitHub org
        const githubOrg = extractGitHubOrg(tool.repo);
        const possibleOrgs = domainToOrg(tool.vendor.domain);
        
        if (githubOrg && possibleOrgs.includes(githubOrg)) {
          checks.domainMatch = { 
            passed: true, 
            detail: `GitHub org "${githubOrg}" matches vendor domain` 
          };
        } else if (githubOrg) {
          checks.domainMatch = { 
            passed: false, 
            detail: `GitHub org "${githubOrg}" doesn't match "${tool.vendor.domain}"` 
          };
        }
      } else {
        checks.repoExists = { passed: false, detail: `GitHub returned ${response.status}` };
      }
    } catch (err) {
      checks.repoExists = { passed: false, detail: 'Failed to fetch repo info' };
    }
  }

  // Calculate score
  const passedChecks = Object.values(checks).filter(c => c.passed).length;
  const score = Math.round((passedChecks / 4) * 100);

  // Determine recommendation
  let recommendation: VerificationResult['recommendation'] = 'unverified';
  if (passedChecks >= 4) {
    recommendation = 'verified';
  } else if (passedChecks >= 2) {
    recommendation = 'community';
  }

  return {
    slug: tool.slug,
    checks,
    score,
    recommendation,
  };
}

export function formatVerificationResult(result: VerificationResult): string {
  const lines: string[] = [];
  const checkMark = (passed: boolean) => passed ? '✓' : '✗';
  const color = (passed: boolean) => passed ? '\x1b[32m' : '\x1b[31m';
  const reset = '\x1b[0m';

  lines.push(`\nVerification Report: ${result.slug}`);
  lines.push('─'.repeat(40));
  
  for (const [name, check] of Object.entries(result.checks)) {
    const label = name.replace(/([A-Z])/g, ' $1').trim();
    lines.push(`${color(check.passed)}${checkMark(check.passed)}${reset} ${label}: ${check.detail}`);
  }
  
  lines.push('─'.repeat(40));
  lines.push(`Score: ${result.score}/100`);
  lines.push(`Recommendation: ${result.recommendation.toUpperCase()}`);
  
  return lines.join('\n');
}
