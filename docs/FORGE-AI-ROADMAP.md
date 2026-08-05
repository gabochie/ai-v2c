# FORGE AI — Build Roadmap (v3 · Revised 2026-08-05)

**Project:** FORGE AI OS ("AI Engineering OS" / AI Studio)
**Goal:** A local-first platform that plans, builds, tests, and releases **agentic
WordPress systems** autonomously, with human approval gates.
**Working method:** Phases are additive — preserve existing features, views, and data
structures. Do not restructure components unless a phase says so.
**Source of truth:** this roadmap is synchronized with `docs/PRODUCTION-AUDIT.md` (2026-08-05).
Legend: ✅ done · ⚠️ partial/stub · ⬜ not started.

---

## Phase 0 — Baseline & Guardrails ✅ (done, needs one cleanup)

**Goal:** Stable base that all later phases build on.

- ✅ Tech stack locked: React 19 + TS + Vite + Tailwind + Express + `@libsql/client` +
  `@google/genai` + Hermes/OpenClaw gateway clients.
- ✅ 9 views preserved: Dashboard, Sprint Planner, AI Agent Library, Prompt Library,
  Knowledge Base, Folder Explorer, Slash Commands, Settings.
- ✅ `/api/*` JSON contract established; server builds (`npm run build`), typechecks
  (`npm run lint`), tests pass (5/5), boots on :3001 with healthcheck.
- ⚠️ **Cleanup debt (P0/P1):** `npm run clean` is POSIX-only (`rm -rf`); fix for win32.
- ⚠️ **Acceptance criteria drift:** app runs on **:3001**, not :3000 as roadmap stated.

---

## Phase 1 — Local Persistence (SQLite/WAL) ⚠️ **server done, client NOT migrated**

**Goal:** Replace browser `localStorage` with crash-safe, on-device persistence.

- ✅ `src/server/db/` with WAL mode; tables: `tasks`, `sprints`, `agents`, `prompts`,
  `knowledge_articles`, `agent_runs`, `audit_log`, `users`.
- ✅ Seed data migrated from `src/shared/data/*` into SQLite on first boot.
- ✅ `/api/tasks|sprints|agents|prompts|knowledge|audit-logs` endpoints.
- ❌ **Client still reads/writes `localStorage('ai_eng_os_tasks')` — the DB layer is dead
  code from the UI's perspective.** Dashboard/Sprint/Prompt/Knowledge views never fetch
  `/api/*`. Backups export an empty DB while real data sits in localStorage.
- ⬜ One-time localStorage → DB migration on boot; wire client data layer to `/api/*`.
- **Acceptance criteria (next):** refresh loses nothing *from the DB*; two tabs stay
  consistent; audit_log records all writes; backup round-trip verified via UI.

---

## Phase 2 — AI Engine & Router ✅ (implemented; harden)

**Goal:** Run AI on-device; cloud only when it earns its cost.

- ✅ `src/server/ai/provider.ts`: Ollama, Gemini, Hermes gateway, OpenClaw gateway.
- ✅ `src/server/ai/router.ts` fallback chain:
  Ollama (local, per-task-type model) → Gemini → Hermes → OpenClaw → offline standby.
- ✅ `/api/ai/chat` + legacy `/api/agent/chat`.
- ✅ Settings panel connection test hits Ollama `/api/tags` live.
- ⚠️ Router has no per-request timeout composition; Hermes/OpenClaw timeouts (60s/180s) can
  pile up under load (see Phase 5 concurrency cap).
- **Acceptance criteria (next):** connection test runs real inference; every provider
  failure falls through the chain in <2s of cumulative budget.

---

## Phase 3 — Filesystem & Tool Layer ⚠️ implemented, **CRITICAL security fix required**

**Goal:** The app reads/writes real files and executes *safe* shell commands.

- ✅ `src/server/fs/`: real directory browsing, read/write/delete, workspace-root-bound.
- ✅ `src/server/tools/`: allowlisted `execFile` (shell:false) + sandboxed OpenClaw path.
- ✅ `src/server/agent/loop.ts`: tool-calling loop (`run_command|read_file|write_file|list_dir`).
- 🔴 **CRITICAL-1 (audit):** `resolveSafePath` uses `startsWith(root)` — **confirmed escape**
  via sibling-prefix paths (`workspace-evil\...`). Same bug in `agent/loop.ts`. Fix with
  segment-aware containment + `realpath` + symlink rejection.
- 🔴 **CRITICAL-2 (audit):** `/api/fs/*`, `/api/tools/exec`, `/api/agent/run` are
  unauthenticated (see Phase 8).
- 🟠 Allowlist contains arbitrary-exec vectors (`npm`, `bun`, `composer`, `npx`, `python`).
  Restrict `run_command` to introspection commands; code-bearing commands → sandbox only.
- 🟠 `GET /api/tests/run` mutates state (writes files, seeds DB) — convert to POST+auth or
  CI-only.
- **Acceptance criteria (next):** traversal + symlink escape attempts rejected with 400
  *and covered by a regression test*; sandboxed exec is the default path.

---

## Phase 4 — WordPress Build Engine ✅ implemented; validate deeper

**Goal:** Generate real, installable WordPress plugins/themes.

- ✅ `src/server/templates/`: plugin boilerplate, Gutenberg block, REST API scaffold,
  admin settings, WooCommerce hooks, theme scaffold.
- ✅ `src/server/wp/factory.ts`: writes files + runs `php -l` per PHP file.
- ✅ Orchestrator + pipeline consume the factory end-to-end.
- ⚠️ Template interpolation is **unvalidated** (no zod) — plugin `name`/`slug`/`author`
  flow raw into generated PHP. Add schema validation + identifier sanitization.
- **Acceptance criteria (next):** one click produces a plugin that activates in LocalWP;
  every generated PHP file passes `php -l`; generated identifiers are injection-safe.

---

## Phase 5 — Agent Orchestration ⚠️ partial; persistence & budget missing

**Goal:** Agents become executable units with steps, artifacts, and accounting.

- ✅ `agent_runs` table; `src/server/orchestrator/run.ts` (plan → scaffold → lint → commit);
  `/api/agents/run`, `/api/agents/runs`, `/api/agents/runs/:id`.
- ⚠️ No per-run token budget enforcement (`tokensUsed` is an estimate).
- ⚠️ No retry of a failed step without restarting the run (roadmap promise).
- ⚠️ No SSE/streaming progress — clients poll `GET :id`.
- ⚠️ Background runs are fire-and-forget; a restart leaves `agent_runs` stuck in
  `running`; no concurrency cap (DoS vector on `/api/agent/run` — 30 iterations × 120s).
- ⬜ Crash recovery: mark orphaned runs `failed` on boot; add run queue with max
  concurrent runs (e.g. 2).
- **Acceptance criteria (next):** a failing step can be retried; token budget halts runaway
  loops; restart marks orphaned runs failed.

---

## Phase 6 — Autonomy Pipeline ⚠️ gates exist; **quality checks are stubbed**

**Goal:** Planner → Architect → Developer → Tester → Security → Reviewer → Release, with
human approval gates.

- ✅ 7-stage pipeline with human gates (write, release, final release).
- ✅ `/api/pipeline/start|all|status/:id|approve|reject`.
- ⚠️ **phpcs check is faked** — Reviewer stage hardcodes "0 errors, 0 critical warnings"
  instead of running `phpcs`.
- ⚠️ Security scan is grep-based only (`$_POST`/`$wpdb->query` heuristics) — no AI review.
- ⚠️ Pipeline state is an in-memory `Map` — **lost on restart**; no persistence table.
- ⬜ Persist pipelines; real `phpcs` (WordPress ruleset) + PHPUnit when present; AI security
  review pass.
- **Acceptance criteria (next):** full feature-request → released-plugin run with real
  checks; a rejected gate halts and preserves artifacts; pipelines survive restart.

---

## Phase 7 — Knowledge & RAG ⚠️ keyword search only; rename or implement

**Goal:** Search the knowledge base and prompt library by meaning, locally.

- ✅ `/api/search/semantic` + `src/server/rag/`.
- ❌ **No embeddings** — it's TF-IDF-style substring token scoring, not semantic search.
  Roadmap promised Ollama embeddings (`nomic-embed-text`) + LanceDB/Chroma.
- ⬜ **Decision:** either rename to `/api/search` (honest keyword search) and defer true RAG,
  or implement embeddings + vector store as originally specced.
- **Acceptance criteria (next):** natural-language query returns relevant results that
  don't share keywords (or endpoint renamed + documented as keyword search).

---

## Phase 8 — Enterprise Hardening ⚠️ **critical gaps; this is the current priority**

**Goal:** Ship-ready security, backups, automation. (Audit P0s live here.)

### 8a — Auth & RBAC 🔴 P0
- ⚠️ `users` table + login endpoint exist; passwords scrypt-hashed.
- 🔴 **`requireRole` is a no-op and never attached to any route — every `/api/*` endpoint
  is unauthenticated.** Sessions aren't issued (login returns a user object, no token/cookie).
- 🔴 Password scheme: hardcoded `AUTH_SALT` fallback, no per-user salt.
- ⬜ Session/JWT auth; enforce on ALL routes; fail closed; per-user random salt; rate-limit
  login.
- **Acceptance:** unauthenticated requests rejected with 401; RBAC enforced per role.

### 8b — Input validation & headers 🟠 P1
- ⬜ zod schemas on all request bodies (currently zero zod imports despite the dependency).
- ⬜ CORS restricted to app origin; CSP + modern security headers; drop `X-XSS-Protection`.
- ⬜ Global error handler must not leak `err.message` to clients.

### 8c — Rate limiting 🟠 P1
- ✅ Global limiter exists (500/15min).
- ⚠️ `trust proxy` unconditional → spoofable when not behind a proxy.
- ⬜ Conditional `TRUST_PROXY`; per-route limits (login 10/15m; exec/run 30/h).

### 8d — Backups 🔴 P0 (non-functional)
- ✅ AES-256-GCM export/import endpoints exist; round-trip unit-tested.
- 🔴 **`importBackup` parses the payload but never writes the DB — restore is a no-op.**
- ⬜ Implement actual restore; versioned migration framework for schema evolution.

### 8e — Audit & secrets 🟠 P1
- ⚠️ Audit log writes JSONL into `workspace/.audit/` (not a git repo) + DB rows.
- ⚠️ `.env.example` claims GCP Secret Manager — `secretManager.ts` only reads `process.env`.
- ⬜ Git-backed audit repo w/ rollback; OS keyring or real Secret Manager; fail-fast when
  `ADMIN_PASSWORD` unset in prod (stop logging generated admin passwords).

### 8f — CI/CD ⚠️ CI only, no CD
- ✅ Lint → test → build → docker-build jobs on push/PR.
- ⚠️ No registry push, no deploy step — "CD" is aspirational.
- ⬜ Publish image (GHCR), optional Cloud Run deploy; add `npm audit`; pin Node 22 (match
  Dockerfile); coverage gate; workflow concurrency.

---

## Phase 9 — Operations & Scale (new)

- ⬜ Graceful shutdown (SIGTERM drain) + unhandled-rejection handlers.
- ⬜ Structured log shipping/rotation; audit-trail consumer.
- ⬜ Bundle code-splitting (client is 788 kB / 225 kB gzip, >500 kB warning).
- ⬜ Strict TS config (`strict: true`, `noUncheckedIndexedAccess`); drop `as any` casts
  and unused deps (`puppeteer-core`, duplicated `vite`).
- ⬜ HTTP-level test suite (supertest) covering auth, traversal regression, backup round-trip.

---

## Priority Order (next 3 sprints)

| Sprint | Deliverables | Closes |
|---|---|---|
| **S1 — Lock the door** | Path-traversal fix + regression test · auth on all routes (session, fail-closed) · zod validation · error-handler sanitization · traversal test | CRITICAL-1, CRITICAL-2, HIGH-2, HIGH-3 |
| **S2 — Make it real** | Client → `/api/*` migration + localStorage→DB boot migration · working backup import + migrations · per-user salts, prod `ADMIN_PASSWORD` gate · narrow tool allowlist · CORS/CSP/trust-proxy/rate limits | MAJOR gap, HIGH-1/4/5/6/7, HIGH-8 |
| **S3 — Prove it ships** | HTTP test suite in CI · registry push + deploy step · Node 22 pin · `npm audit` · real phpcs in pipeline · pipeline persistence · run queue + crash recovery | HIGH-8/9/10, Phase 6 gaps, Phase 5 gaps |

## Definition of "Autonomous Level" reached

- A natural-language feature request produces a reviewed, security-scanned, installable
  WordPress plugin in LocalWP.
- Humans only approve/reject gates — never write code by hand.
- Full history and rollback for every agent action.
- AI runs local-first; cloud spend minimized by the router.

## Non-Goals (unchanged)

- Multi-tenant cloud SaaS hosting.
- Browser-based team collaboration / shared workspaces.
- Payments or billing inside the app.
