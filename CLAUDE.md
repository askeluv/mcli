# CLAUDE.md

You're working on **mcli** — a CLI for discovering CLI tools, optimized for AI agents.

## ⚠️ Test-Driven Development (TDD)

**This repo follows strict TDD. No exceptions.**

### The Rule
1. **Write tests FIRST** — Before implementing any feature
2. **Run tests, see them fail** — Confirms the test is valid
3. **Implement the minimum code** — Make tests pass
4. **Refactor** — Clean up while tests stay green

### Commands
```bash
npm test              # Run all tests once
npm run test:watch    # Watch mode (run on file changes)
npm run test:coverage # Run with coverage report
```

### What to Test
- **All new functions in `src/lib.ts`** — Unit tests required
- **Registry changes** — `registry.test.ts` validates all tools
- **CLI behavior** — For user-facing changes, add integration tests

### Test Location
- Unit tests: `src/__tests__/lib.test.ts`
- Registry validation: `src/__tests__/registry.test.ts`
- Future CLI tests: `src/__tests__/cli.test.ts`

### Before Committing
```bash
npm test  # Must pass
```

If tests fail, fix them before pushing. No "I'll add tests later."

---

## Project Overview

mcli is "the app store for AI agents." It helps agents (and humans) discover, compare, and evaluate CLI tools based on structured metadata and agent-generated reviews.

**Key differentiators:**
- Agent-friendliness scoring (JSON output, idempotency, auth complexity)
- Verification tiers (verified vendor provenance, not just popularity)
- Agent reviews weighted by PR contributions to CLI repos

## Tech Stack

- **Language:** TypeScript (ESM)
- **Runtime:** Node.js 20+
- **Dev runner:** tsx (for development)
- **Build:** tsc → dist/

## Project Structure

```
mcli/
├── src/
│   ├── cli.ts          # Main CLI entry point
│   └── types.ts        # TypeScript interfaces
├── registry/
│   └── tools.json      # The tool registry (source of truth)
├── bin/
│   └── mcli.js         # npm bin entry point
├── dist/               # Compiled output (gitignored)
├── TODO.md             # Roadmap
└── README.md
```

## Commands

```bash
# Development
npm run dev -- search cloud      # Run with tsx
npm run dev -- info hcloud
npm run dev -- compare aws gcloud hcloud

# Build
npm run build                    # Compile TypeScript
npm start                        # Run compiled version
```

## Registry Schema

Tools in `registry/tools.json` follow this structure:

```typescript
{
  slug: string;              // Unique identifier (e.g., "hcloud")
  name: string;              // Display name
  vendor: {
    name: string;
    domain: string;
    verified: boolean;
  };
  repo?: string;             // GitHub repo URL
  docs?: string;             // Documentation URL
  install: {
    brew?: string;
    apt?: string;
    npm?: string;
    cargo?: string;
    go?: string;
    binary?: string;
    script?: string;
  };
  capabilities: {
    jsonOutput: boolean;     // Supports --json or similar
    auth: string[];          // Auth methods (env vars, config files)
    idempotent: boolean;     // Same command = same result
    interactive: boolean;    // Requires TTY/user input
    streaming: boolean;      // Handles long-running output
  };
  agentScore: number;        // 1-10, higher = more agent-friendly
  categories: string[];      // e.g., ["cloud", "infrastructure"]
  tier: "verified" | "community" | "unverified";
  description: string;
}
```

## Agent Score Guidelines

Rate tools 1-10 based on:

| Score | Meaning |
|-------|---------|
| 9-10  | Excellent: JSON output, env auth, idempotent, clear errors |
| 7-8   | Good: JSON output, minor friction (interactive auth, some non-idempotent commands) |
| 5-6   | Usable: Partial JSON support, workable but not ideal |
| 3-4   | Difficult: Text parsing required, complex auth flows |
| 1-2   | Hostile: Interactive-only, unpredictable output |

## Verification Tiers

- **verified**: We traced provenance to official vendor source (GitHub org → domain → docs)
- **community**: Submitted by community, reviewed, but not vendor-verified  
- **unverified**: Auto-indexed or unreviewed submission

## Contributing a Tool

1. Edit `registry/tools.json`
2. Add tool following the schema above
3. Set appropriate `agentScore` and `tier`
4. Submit PR with rationale

## Coding Conventions

- Use TypeScript strict mode
- Prefer explicit types over inference for public APIs
- Keep CLI output human-readable with optional `--json` flag (eat our own dogfood)
- No external dependencies unless necessary (keep it light)
- Test commands manually before committing

## Future: Agent Reviews

When implementing agent reviews (Phase 3), the review submission flow:

1. Agent uses a tool and evaluates it
2. Agent calls `mcli review <slug>` with structured scores
3. Review includes optional proof hash (sha256 of command + output)
4. Reviews aggregate into tool scores
5. Reviews weighted by agent reputation (PR contributions)

## Future: PR Reputation

Agents earn reputation by contributing to CLI repos:
- Track merged PRs to repos in the registry
- Weight: docs (0.1) < minor (0.3) < major (0.5)
- Higher reputation = reviews count more

## Quick Reference

```bash
# Add a tool to registry
# Edit registry/tools.json, then:
git add registry/tools.json
git commit -m "Add <tool>: <brief description>"
git push

# Test your changes
npm run dev -- info <new-tool-slug>
npm run dev -- search <category>
```
