export interface Vendor {
  name: string;
  domain: string;
  verified: boolean;
}

export interface InstallMethods {
  brew?: string;
  apt?: string;
  npm?: string;
  cargo?: string;
  go?: string;
  binary?: string;
  script?: string;
}

export interface Capabilities {
  jsonOutput: boolean;
  auth: string[];
  idempotent: boolean;
  interactive: boolean;
  streaming: boolean;
}

/**
 * Multi-dimensional agent-friendliness scores.
 * Each dimension is 1-5 (5 = best).
 */
export interface AgentScores {
  /** Structured output: --json, --output=json, parseable formats */
  jsonOutput: number;
  /** Non-interactive: --yes, env auth, no prompts, no TTY required */
  nonInteractive: number;
  /** Token efficiency: --quiet, --compact, --id-only, minimal output */
  tokenEfficiency: number;
  /** Safety features: --dry-run, structured exit codes (0/1/2), confirmation flags */
  safetyFeatures: number;
  /** Pipeline friendly: clean stderr/stdout separation, chainable output */
  pipelineFriendly: number;
}

export interface CliTool {
  slug: string;
  name: string;
  vendor: Vendor;
  repo?: string;
  docs?: string;
  install: InstallMethods;
  capabilities: Capabilities;
  agentScore: number; // 1-10 (computed from agentScores)
  agentScores?: AgentScores; // Detailed breakdown (optional for backwards compat)
  categories: string[];
  description: string;
  tier: 'verified' | 'community' | 'unverified';
}

export interface Registry {
  version: string;
  updated: string;
  tools: CliTool[];
}
