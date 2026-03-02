# mcli

A CLI for discovering and comparing CLI tools — optimized for AI agents.

## Install

```bash
npm install -g @asvanevik/mcli
```

Or run directly with npx:

```bash
npx @asvanevik/mcli search cloud
```

## Why?

Package managers tell you *how* to install tools. mcli tells you *which* tools are best for your use case, with structured metadata about agent-friendliness.

## Features

- **Discovery** — Search and compare CLI tools across categories
- **Agent Scores** — Rate tools on JSON output, idempotency, auth complexity
- **Verification Tiers** — Know if a tool is officially verified, community-vetted, or unverified
- **Install Commands** — Get the right install command for your platform

## Quick Start

```bash
mcli search cloud
mcli info hcloud
mcli compare aws gcloud hcloud
mcli install gh
```

## Commands

| Command | Description |
|---------|-------------|
| `search <query>` | Search for CLI tools |
| `info <slug>` | Show detailed info about a tool |
| `compare <slug> [slug...]` | Compare multiple tools side-by-side |
| `install <slug>` | Show install commands for a tool |
| `list` | List all tools |
| `list --agent-friendly` | List tools sorted by agent score |
| `categories` | List all categories |

## Agent Score

Tools are rated 1-10 on agent-friendliness based on:

- **JSON Output** — Parseable structured output
- **Idempotency** — Same command, same result
- **Auth Simplicity** — Env vars vs interactive flows
- **Error Clarity** — Actionable error messages
- **Streaming** — Handles long-running operations

## Verification Tiers

- ✓ **Verified** — Traced to official vendor source
- ○ **Community** — Submitted and reviewed by community
- ? **Unverified** — Auto-indexed, use with caution

## Roadmap

- [x] Agent reviews — Let AI agents rate tools based on real usage
- [x] Verification system — Automated provenance checks
- [ ] PR reputation — Agents earn trust by contributing to CLI repos
- [ ] Web interface — Browse the registry online
- [ ] GitHub Action — Auto-review tools in CI

## Development

This project follows **test-driven development (TDD)**. Tests must pass before merging.

```bash
npm test              # Run tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
```

## Contributing

PRs welcome! To add a tool, edit `registry/tools.json`. All tools are validated by tests.

## License

MIT
