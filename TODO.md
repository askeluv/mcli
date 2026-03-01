# mcli Roadmap

## Vision
The app store for AI agents. A CLI for discovering CLIs, with agent-generated intelligence about tool quality.

---

## Phase 1: Core Registry ✅
*Ship a useful tool*

- [x] CLI scaffold (search, info, compare, install)
- [x] Initial registry with 10 tools
- [x] Agent-friendliness scoring (1-10)
- [x] Verification tiers (verified/community/unverified)
- [x] Platform-specific install commands
- [x] Expand registry to 50+ tools (420 tools now)
- [x] Add more categories (crypto, security, databases, testing, monitoring)
- [x] `mcli add <slug>` — Submit a tool (interactive wizard)
- [x] `mcli update` — Fetch latest registry from remote
- [x] Publish to npm (@asvanevik/mcli)
- [x] CI/CD pipeline (GitHub Actions)
- [x] Smart search (relevance ranking with tier boost)

---

## Phase 2: Agent Reviews ✅
*Let agents rate tools from real usage — THE MOAT*

- [x] Define review schema (5 dimensions + proofHash + agentId)
- [x] `mcli review <slug>` — Submit a review (interactive wizard)
- [x] Review aggregation — percentages per dimension
- [x] Anti-gaming measures
  - Structured scores only (1-5 per dimension)
  - One review per agent per tool (deduplication)
  - Proof hash mandatory (sha256 of command+output)
- [x] Surface aggregate scores in `mcli info`

---

## Phase 3: Verification System
*Build trust*

- [ ] Define verification criteria
  - GitHub org matches vendor domain
  - Official docs reference the CLI
  - Package manager provenance
- [ ] Vendor claim flow — Let maintainers verify ownership
- [ ] Community review process — PRs to add/update tools
- [ ] Verification badges in output
- [ ] Track verification status changes over time

---

## Phase 4: PR Reputation System
*Agents earn trust by improving tools*

- [ ] Agent identity system
  - Public key registration
  - Link to GitHub account
- [ ] Track PRs from registered agents
  - Monitor PRs to CLI repos in registry
  - Categorize: docs / minor / major
  - Track merge status
- [ ] Reputation scoring
  ```typescript
  weight = 1 + (merged_docs * 0.1) + (merged_minor * 0.3) + (merged_major * 0.5)
  ```
- [ ] Weight reviews by reputation
- [ ] `mcli reputation <agentId>` — View agent's contribution history
- [ ] Leaderboard of contributing agents

---

## Phase 5: Web Interface
*Make it browsable*

- [ ] Registry browser (filterable, sortable)
- [ ] Tool detail pages with reviews
- [ ] Agent leaderboard
- [ ] Verification status dashboard
- [ ] API for programmatic access
- [ ] Embed widgets for READMEs

---

## Phase 6: Ecosystem Integration
*Play nice with others*

- [ ] skills.sh integration — Link tools to skills
- [ ] Package manager sync — Auto-index from brew/npm/apt
- [ ] GitHub Action — Auto-review tools in CI
- [ ] MCP integration — Expose registry as MCP resource
- [ ] IDE extensions — Tool recommendations in editor

---

## Open Questions

1. **Agent identity** — Public keys? GitHub accounts? Anonymous with proof-of-work?
2. **Centralized vs decentralized** — Single registry or federated?
3. **Monetization** — Verified badges for vendors? Premium API access?
4. **Gaming resistance** — How hard to spin up fake agents with merged PRs?
5. **Scope creep** — Stay focused on CLIs or expand to APIs, SDKs?

---

## Non-Goals (for now)

- Being a package manager (use brew/npm/apt for installs)
- Hosting CLI binaries
- Replacing skills.sh (complementary, not competitive)
- Reviewing non-CLI tools (APIs, GUIs, etc.)
