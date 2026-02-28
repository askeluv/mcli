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

export interface CliTool {
  slug: string;
  name: string;
  vendor: Vendor;
  repo?: string;
  docs?: string;
  install: InstallMethods;
  capabilities: Capabilities;
  agentScore: number; // 1-10
  categories: string[];
  description: string;
  tier: 'verified' | 'community' | 'unverified';
}

export interface Registry {
  version: string;
  updated: string;
  tools: CliTool[];
}
