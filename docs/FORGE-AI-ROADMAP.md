# FORGE AI — Enterprise Roadmap: Agentic Organizations on WordPress

**Project:** FORGE AI Build Pro (AI Engineering OS)
**Goal:** Evolve the current planning/management app into an enterprise-grade, local-first platform that plans, builds, tests, and releases **agentic WordPress systems** autonomously (with human approval gates).
**Working method:** Complete phases in order. Each phase is additive — preserve every existing feature, view, and data structure. Do not restructure existing components unless a phase explicitly says so.

---

## Phase 0 — Baseline & Guardrails

**Goal:** Lock the current state so all later phases build on a stable base.

- Keep the current tech stack: React 19 + TypeScript + Vite + Tailwind + Express server + `@google/genai`.
- Keep all 9 existing views: Dashboard, Sprint Planner, AI Agent Library, Prompt Library, Knowledge Base, Folder Explorer, Slash Commands, Settings.
- All new server features must go through Express endpoints under `/api/*` with JSON bodies.
- **Acceptance criteria:** app still runs on `http://localhost:3000`; existing features unchanged; `npm run lint` passes.

---

## Phase 1 — Local Persistence (SQLite, WAL mode)

**Goal:** Replace browser `localStorage` with crash-safe, on-device persistence.

- Add `better-sqlite3` (or `@libsql/client` for SQLite over libSQL). Use **WAL mode** (`PRAGMA journal_mode=WAL`).
- Create a data-access layer (`src/server/db/`) with tables for: `tasks`, `sprints`, `agents`, `prompts`, `knowledge_articles`, `files`, `agent_runs`, `audit_log`.
- Migrate seed data from `src/data/*` into SQLite on first boot.
- Change `src/App.tsx` to load/save via new `/api/*` endpoints instead of `localStorage` (keep a one-time localStorage → DB migration).
- **Acceptance criteria:** refresh loses nothing; data survives server restart; two tabs stay consistent; audit_log records all writes.

---

## Phase 2 — Local AI Engine (Ollama / LM Studio) + AI Router

**Goal:** Run AI on-device; use cloud only when it earns its cost.

- Server-side client for **OpenAI-compatible endpoints** (`http://localhost:11434/v1` for Ollama, LM Studio default). Add `src/server/ai/provider.ts` supporting: Ollama, LM Studio, Gemini, OpenRouter.
- Implement **AI Router** in `src/server/ai/router.ts`:
  - PHP / WordPress plugin work → local Ollama (e.g., qwen2.5-coder)
  - JavaScript / refactoring → local Ollama
  - Architecture / strategy → Gemini
  - Security review → Claude (OpenRouter) when configured
  - Fallback chain: Ollama → OpenRouter → Gemini.
- Add `/api/ai/chat` that accepts a `taskType` and routes automatically. Keep `/api/agent/chat` for backward compatibility.
- **Acceptance criteria:** Settings panel connection test actually runs a local model inference; each task type hits the intended provider; provider failures fall through the chain.

---

## Phase 3 — Filesystem & Tool Layer (real access)

**Goal:** The app reads/writes real files and executes safe shell commands.

- Replace the mock Folder Explorer with **real directory browsing** backed by `src/server/fs/` (allowlist a workspace root, e.g. `C:\AI\workspace`; no writes outside it).
- Add `/api/fs/read|write|list|delete` with strict path-allowlist validation (no `..` escapes, no symlink escape).
- Add a **tool registry** (`src/server/tools/`) with tool contracts: `write_file`, `read_file`, `run_command` (allowlisted commands only: `wp`, `php`, `git`, `bun`, `npm`), `git_commit`, `list_dir`.
- Expose tools to AI providers via function-calling so an agent run can actually create files.
- **Acceptance criteria:** explorer shows real disk; an agent can create a file in the workspace; path-escape attempts are rejected with 400.

---

## Phase 4 — WordPress Build Engine (Project Factory)

**Goal:** Generate real, installable WordPress plugins/themes into a LocalWP site.

- Target root: LocalWP site `wp-content/plugins/` and `wp-content/themes/` (configurable in Settings).
- Templates (`src/server/templates/`):
  - **Plugin boilerplate** (main PHP file header, autoloader, uninstall.php, `readme.txt`)
  - **Gutenberg block** (block.json, build tooling)
  - **REST API scaffold** (custom endpoint registration, permission callbacks)
  - **Admin settings page** (WP Settings API)
  - **WooCommerce hooks scaffold**
  - **Theme scaffold** (functions.php, style.css header, template parts)
- Add a **Project Factory** view: form (name, type, features) → generates files → writes to target → runs `wp-cli` to validate (e.g., `wp plugin list`, `wp eval-file` smoke test).
- **Acceptance criteria:** one click produces a plugin that activates in LocalWP; scaffolded plugin passes `php -l` on every PHP file.

---

## Phase 5 — Agent Orchestration (runs, not profiles)

**Goal:** Agents become executable units with steps, artifacts, and accounting.

- New model `agent_runs` in DB: `id`, `agentId`, `status`, `steps[]`, `artifacts[]`, `tokensUsed`, `startedAt`, `completedAt`.
- `src/server/orchestrator/run.ts`: executes an agent run = sequence of (plan → tool calls → model calls) with checkpoints, retries, and a per-run token budget.
- Agents get real `tools` + `outputFormat` from `src/data/agentLibrary.ts`.
- `/api/agents/run` starts a run; `/api/agents/runs/:id` streams progress (SSE or polling).
- **Acceptance criteria:** starting an agent produces a persisted run with visible steps; token usage is recorded per run; a failing step can be retried without restarting the run.

---

## Phase 6 — Autonomy Pipeline (multi-agent, gated)

**Goal:** Planner → Architect → Developer → Tester → Security → Reviewer → Release, with human approval at gates.

- Define pipeline stages as ordered steps over agent runs (reuse Phase 5).
- **Quality gates** between stages:
  - Coding standards: `phpcs` (WordPress ruleset)
  - Tests: PHPUnit (when present)
  - Security: OWASP-oriented scan of generated PHP (grep-based rules + AI review)
- **Human-in-the-loop gates** (in-app approval UI) before: writing to a WordPress target, committing to a git repo, running destructive commands, "Release".
- `/api/pipeline/start`, `/api/pipeline/status`, `/api/pipeline/:runId/approve|reject`.
- **Acceptance criteria:** a full run from feature request → released plugin works end-to-end with approvals; a rejected gate halts the pipeline and preserves artifacts.

---

## Phase 7 — Knowledge & RAG (semantic search)

**Goal:** Search the knowledge base and prompt library by meaning, locally.

- Embed chunks with the local Ollama embed model (e.g., `nomic-embed-text`).
- Store vectors in **LanceDB** or **ChromaDB** (embedded, file-based).
- Backfill from `knowledge_articles` + `prompts` tables; index on change.
- `/api/search/semantic?q=...` returns ranked results; Surface in Knowledge Base + Prompt Library search.
- **Acceptance criteria:** typing a natural-language query returns relevant articles/prompts that don't share keywords.

---

## Phase 8 — Enterprise Hardening

**Goal:** Ship-ready security, backups, and automation.

- **Auth & RBAC:** local user accounts (passwords hashed with scrypt/argon2); roles: admin, developer, reviewer; enforce on all `/api/*` routes.
- **Rate limiting** per endpoint (`express-rate-limit`); **CORS** restricted to app origin; input validation (zod) on all request bodies.
- **Git-backed audit:** every mutating action writes a human-readable `.json`/`.md` artifact into a `workspace/.audit/` git repo; `git log` = history; one-click rollback.
- **Encrypted backups:** AES-256-GCM export/import of the full DB + workspace (password-protected), via `/api/backup/export|import`.
- **OS keyring:** store API keys in the OS keyring (keytar / Electron safeStorage) instead of `.env`; migrate existing keys on upgrade.
- **CI/CD:** GitHub Actions workflow — `tsc` → `vite build` → unit tests → deploy (Cloud Run or artifact). Add a unit test suite (Vitest) for server + DB layers.
- **Acceptance criteria:** unauthenticated requests are rejected; rate limit triggers under load; backup/restore round-trip succeeds; CI pipeline is green.

---

## Definition of "Autonomous Level" reached

- A feature request (in natural language) produces a reviewed, security-scanned, installable WordPress plugin in a LocalWP site.
- Human only approves/rejects gates — never writes code by hand.
- Full history and rollback for every agent action.
- All AI runs local-first; cloud spend is minimized by the router.

## Non-Goals (for now)

- Multi-tenant cloud SaaS hosting.
- Browser-based team collaboration / shared workspaces.
- Payments or billing inside the app.
