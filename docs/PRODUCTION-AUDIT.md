# FORGE AI OS — Production-Grade Quality Audit

**Audited:** 2026-08-05 · **Version:** 2.4.0 · **Auditor:** Sisyphus
**Scope:** build pipeline, server, client, security, tests, deployment, roadmap fidelity.

---

## 0. Executive Summary

The project builds, typechecks, and tests green (5/5), boots cleanly, and has a credible
feature surface (React 19 + Express + libSQL + Ollama/Gemini/Hermes/OpenClaw providers +
agent loop + WP scaffold engine). **It is not production-grade yet.** The audit found:

- **2 Critical security vulnerabilities** — one a *confirmed* workspace-escape path
  traversal, the other a stub auth middleware that grants full access to every `/api/*`
  route including arbitrary command execution.
- **1 Major architecture gap** — the React client still runs on `localStorage`; the entire
  DB/API backend is effectively dead code from the client's perspective.
- **~10 High findings** spanning auth, validation, secrets, operational robustness, CI, and
  roadmap drift.

---

## 1. Security Findings

### 🔴 CRITICAL-1 — Workspace escape via path-prefix bypass (confirmed exploit)
**File:** `src/server/fs/index.ts:34` (`FilesystemManager.resolveSafePath`)
**Also affected:** `src/server/agent/loop.ts:129` (same pattern, own copy)
**Proof (executed):**
```
ALLOWED: C:\AI\ai-builder\workspace-evil\x.php -> C:\AI\ai-builder\workspace-evil\x.php
```
`resolved.startsWith(root)` accepts any sibling whose name shares the workspace prefix
(`workspace-evil`, `workspace2`, …) as a valid in-workspace path. Since the API exposes
`/api/fs/read|write|delete` and `AgentLoop` writes/executes inside its workspace, an
attacker (or prompt-injected agent) can read/write/delete files **outside** the intended
root. Also lacks symlink-escape handling and case normalization (Windows).
**Fix:** segment-aware containment (`resolved === root || resolved.startsWith(root + sep)`)
plus `realpath` comparison and symlink resolution.

### 🔴 CRITICAL-2 — `requireRole` is a no-op; every API route is unauthenticated
**File:** `src/server/security/auth.ts:36-46`
The middleware returns `next()` unconditionally when no `Authorization` header is present
("desktop local mode"), and also calls `next()` when a token *is* present. It is **never
attached to any route** (`grep requireRole` → only its own definition). Consequently:
`/api/tools/exec` (arbitrary allowlisted command execution), `/api/fs/*`, `/api/agent/run`
(goal-driven agent with shell access), `/api/backup/import` (DB overwrite), `/api/pipeline/*`
are all reachable without any credential.
**Fix:** session/JWT auth, attach `requireRole` to every route, fail closed.

### 🟠 HIGH-1 — Secrets in code: hardcoded auth salt & password scheme
**File:** `src/server/security/password.ts:3`
`AUTH_SALT = "forge_desktop_salt_2026"` hardcoded fallback + fixed-salt scrypt → identical
passwords produce identical hashes; no per-user salt; no pepper; `timingSafeEqual` guard is
correct but the scheme is weak. Backup uses `scryptSync(secretKey, "forge_salt", 32)` — a
second hardcoded salt.
**Fix:** per-user random salt (`salt:hash` format), require `AUTH_SALT` env in production.

### 🟠 HIGH-2 — No input validation anywhere (zod is a dependency but unused)
`zod@^4.4.3` is in `package.json` but `grep zod` finds zero imports. Every route trusts
`req.body` / `req.query` shapes. Malformed payloads → 500s; oversized fields pass to
`JSON.parse`; `/api/tools/exec` accepts arbitrary command strings.
**Fix:** schema-validate all request bodies (zod), return 400 on mismatch.

### 🟠 HIGH-3 — Error handler leaks internals to clients
**File:** `src/server/index.ts:425-431`
Global error handler returns `err.message` verbatim with 500. Internal paths, provider
secrets in error text (Ollama/Hermes messages echo upstream bodies), DB internals can leak.
**Fix:** log full error server-side; return generic message + correlation ID to client.

### 🟠 HIGH-4 — Missing CORS & incomplete security headers
No CORS configuration anywhere. Served app + API share an origin in dev (Vite middleware)
and prod (static), which limits exposure today, but the moment the API is deployed apart
from the SPA (Cloud Run / different port) it becomes an open endpoint for any origin.
Headers set: nosniff, X-Frame-Options, X-XSS-Protection (deprecated), Referrer-Policy, HSTS
(prod only). **Missing:** CSP, COOP, CORP, Permissions-Policy; `X-XSS-Protection` should be
removed.
**Fix:** `helmet` or equivalent; explicit CSP; `cors` restricted to app origin.

### 🟠 HIGH-5 — Admin bootstrap password written to console
**File:** `src/server/db/index.ts:157-175`
When `ADMIN_PASSWORD` is unset (the default in compose), a random one-time password is
generated and `console.warn`'d. In any containerized/CI log-collection setup this leaks the
admin credential into logs.
**Fix:** require `ADMIN_PASSWORD` (fail fast) in production; log only a setup URL/hint.

### 🟠 HIGH-6 — Rate limiter trust-proxy spoofing + no per-route limits
`app.set("trust proxy", 1)` is unconditional, but the app only sits behind a proxy in some
deployments. When NOT behind a proxy, `X-Forwarded-For` is spoofable → rate-limit bypass.
Also a single global limiter (500/15min) with no stricter limits on auth/agent/exec routes.
**Fix:** condition `trust proxy` on `TRUST_PROXY` env; per-route limiters (login: 10/15m;
exec/run: 30/h).

### 🟠 HIGH-7 — Tool allowlist includes arbitrary-exec vectors
**File:** `src/server/tools/index.ts:9` + `src/server/agent/loop.ts:47-52`
Allowlist includes `npm`, `bun`, `composer`, `npx`, `node`, `python` — all of which can
execute arbitrary code beyond their argv (postinstall scripts, `npm exec`, `python -c`).
Combined with CRITICAL-2 this is unauthenticated RCE. The agent loop's `BLOCKED_STRINGS`
blocklist is bypassable (e.g. `rm -rf /tmp/x && evil` patterns, `$()` if shell were
involved, `git` subcommands like `git -c core.hooksPath=`).
**Fix:** narrow to read-only/introspection commands for `run_command`; execute code-bearing
commands only inside the sandbox (OpenClaw); remove shell metacharacter acceptance entirely.

### 🟠 HIGH-8 — `GET /api/tests/run` mutates state
`GET /api/tests/run` executes `runEnterpriseTestSuite()` which initializes the DB, **writes
files to the workspace** (ProjectFactory.buildProject), and runs backups. A GET must be
side-effect-free; also unauthenticated (per CRITICAL-2).
**Fix:** POST + auth, or remove from server and run only in CI.

### 🟡 MEDIUM — `deleteFile` recursive-deletes directories
`src/server/fs/index.ts:92-102` — `/api/fs/delete` accepts any path and `rmSync(recursive)`
on directories. No confirmation, no trash. With CRITICAL-1 this can delete outside workspace.

### 🟡 MEDIUM — Audit log writes outside git (roadmap Phase 8 drifted)
`logAudit` writes JSONL into `workspace/.audit/` (not a git repo, per `Test-Path` false),
duplicating DB rows with `console.warn`-swallowed failures. Roadmap promised "git-backed
audit with one-click rollback".

---

## 2. Architecture & Code Quality

### 🔴 MAJOR — Client is still `localStorage`-based; DB API is dead code
`src/client/App.tsx` seeds state from `INITIAL_TASKS`/`localStorage('ai_eng_os_tasks')` and
persists to localStorage. Only three call sites touch the backend: `AgentLibraryView`
(`/api/agent/chat`), `SlashCommandView` (`/api/agent/chat`), `SettingsView` (Ollama tags +
simulated health log). **No client component calls `/api/tasks`, `/api/sprints`,
`/api/agents`, `/api/prompts`, `/api/knowledge`, `/api/audit-logs`** — the entire Phase 1
DB layer, WAL persistence, audit trail, backup export (which dumps DB tables), and agent_runs
are unreachable from the UI. Backups export an empty/fake DB while the user's real data sits
in localStorage. This is the single largest production blocker after security.
**Fix:** client data layer (`fetch`/`react-query`) wired to `/api/*`; one-time
localStorage→DB migration on boot; remove `INITIAL_*` fallbacks.

### 🟠 HIGH — Server code smell: config-hardcoded version + duplicate health
`version: "2.4.0"` hardcoded in `src/server/index.ts:89` and `backup.ts:24` (drift risk with
package.json); duplicated healthcheck definition in Dockerfile + compose.

### 🟠 HIGH — In-memory pipeline state, no persistence/recovery
`activePipelines` is a `Map` in `pipeline/index.ts` — lost on restart; no recovery of
`agent_runs` left in `running` state; background processing is fire-and-forget with no
queue, no cancellation, no per-run token budget enforcement (roadmap Phase 5/6 gaps).

### 🟠 HIGH — No graceful shutdown, no error tracking
`app.listen` with no SIGTERM/SIGINT handling, no server close, no unhandled-rejection
handler, no connection draining. DB writes during shutdown can corrupt/truncate WAL.

### 🟠 HIGH — Windows-incompatible `clean` script
`"clean": "rm -rf dist server.js"` — this project is developed on win32 (bash tool), but the
script is POSIX-only.

### 🟡 MEDIUM — Vite chunk >500kB warning
`dist/assets/index-*.js` = 788 kB (gzip 225 kB) — no code splitting, no manualChunks
(recharts/lucide/motion all in one bundle). Load-time regression risk on cold start.

### 🟡 MEDIUM — `puppeteer-core` unused dependency; `vite` duplicated in deps+devDeps
`puppeteer-core@^25.4.0` is installed but never imported. `vite` appears in both blocks.

### 🟡 MEDIUM — `tsconfig` lacks `strict`, `noUnusedLocals`, `noUncheckedIndexedAccess`
Type safety is nominal: no strict null checks — matches the `as any` usage in
`auth.ts:26`, `orchestrator/run.ts`, `pipeline` casts.

### 🟡 MEDIUM — AgentLoop has a regex bug
`BLOCKED_STRINGS` + tokenizer in `agent/loop.ts` handles quotes, but `MAX_ITERATIONS` of 30
with 120s timeouts can pin the server for up to an hour per run; no concurrency cap on
`/api/agent/run` (DoS vector, amplifies HIGH-7).

---

## 3. Test & CI/CD Findings

### 🟠 HIGH — Test suite covers ~4 utilities; zero coverage of HTTP surface
`tests/server.test.ts` (5 tests): secret masking (3), password hash (2). The "Enterprise
Test Suite" at `GET /api/tests/run` is not part of `npm test`, mutates state (see
HIGH-8), and asserts only happy paths. **No tests for**: auth (login/reject), routes, path
traversal (which fails — see CRITICAL-1), tool allowlist, backup round-trip in CI, agent
loop, pipeline gates, DB migrations.

### 🟠 HIGH — CI "CD" half is missing
`ci-cd.yml` runs lint → test → build → docker-build, but **never publishes the image or
deploys anywhere** (no registry push, no Cloud Run, no artifact upload). The "CD" in the
workflow name is aspirational. Also: no `npm audit`, no dependency caching layer beyond
`setup-node`, no workflow concurrency/dedup, no `docker-build-push` action usage.

### 🟡 MEDIUM — Node version mismatch
CI pins Node 20 (`engines: >=20`, workflows `node-version: '20'`), Dockerfile uses
`node:22-alpine`. The runtime (22) differs from CI (20) — CI can pass on a version whose
behavior differs in prod.

### 🟡 MEDIUM — No coverage gate, no lint beyond tsc
`npm run lint` = `tsc --noEmit` only — no ESLint, no style, no unused-imports detection.

---

## 4. Deployment & Ops Findings

### 🟠 HIGH — Secrets not production-managed
`.env.example` claims "Fetched from GCP Secret Manager in production" but
`secretManager.ts` only reads `process.env`; there is no Secret Manager integration. Compose
passes `ADMIN_PASSWORD`/`BACKUP_KEY`/`GEMINI_API_KEY` via env (fine for local, insufficient
for prod). No secret rotation story.

### 🟠 HIGH — No migrations system
Schema is `CREATE TABLE IF NOT EXISTS` inline in `db/index.ts`. Adding/altering columns
(the D1-style `vertical` change seen in the mywa project) requires hand-editing; no
versioned migration framework; `importBackup` **restores nothing** (parses dump, logs,
returns `true` — DB is never written) — verified in `backup.ts:48-64`. **Backup/restore is
non-functional.**

### 🟡 MEDIUM — `HOST=0.0.0.0` default binds all interfaces
`.env.example` + server default. On a LAN-connected dev machine the unauthenticated API
(CRITICAL-2) is reachable network-wide. Docker compose mitigates (127.0.0.1) but the
host-process path doesn't.

### 🟡 MEDIUM — No log shipping/rotation story
Structured JSON logs to stdout are good; but nothing consumes them; no pino-level
performance (custom logger is fine), no audit-trail consumer.

---

## 5. Roadmap Fidelity (FORGE-AI-ROADMAP vs reality)

| Phase | Claimed | Actual |
|---|---|---|
| 0 Baseline | app on :3000, lint passes | ✅ builds (build on :3001; lint=tsc passes) |
| 1 Local persistence (SQLite/WAL) | server layer done | ⚠️ **client never migrated — localStorage is source of truth** |
| 2 AI Router | Ollama→Gemini→Hermes→OpenClaw chain | ✅ implemented (plus Hermes/OpenClaw beyond roadmap) |
| 3 FS & tools | allowlisted real FS | ⚠️ implemented but CRITICAL-1 traversal + RCE-ish allowlist |
| 4 WP Factory | plugin/block/api/etc + `php -l` | ✅ implemented (templates + validation) |
| 5 Agent orchestration | steps/artifacts/retry/budget | ⚠️ runs exist, **no retry, no token budget enforcement, no SSE** |
| 6 Autonomy pipeline | gates + phpcs + security scan | ⚠️ gates exist; **phpcs is faked** (hardcoded "0 errors"), scan is grep |
| 7 RAG semantic search | embeddings (LanceDB/Chroma) | ⚠️ **keyword/TF-IDF only, no embeddings** — misleading name |
| 8 Enterprise hardening | auth/RBAC/rate/zod/audit/backup/CI | ⚠️ auth stub, zod unused, backup import no-op, CI no CD |

**Verdict:** the roadmap (committed Jul 31, since deleted from working tree) claims Phase 8
"ship-ready" — the codebase is ~Phase 3 with partial 5–6. The roadmap must be rewritten to
reflect reality before it can drive the build.

---

## 6. Prioritized Fix Plan (P0 first)

| # | Sev | Item | Effort |
|---|---|---|---|
| 1 | 🔴 | Fix path traversal (CRITICAL-1) | S |
| 2 | 🔴 | Real auth on every route, fail closed (CRITICAL-2) | M |
| 3 | 🔴 | Wire client to `/api/*` + localStorage→DB migration (MAJOR) | L |
| 4 | 🟠 | zod validation on all bodies | M |
| 5 | 🟠 | Fix error handler (no internals to client) | S |
| 6 | 🟠 | Backup import actually restores DB; add migrations | M |
| 7 | 🟠 | Narrow tool allowlist; sandbox-only code execution | M |
| 8 | 🟠 | CORS + CSP headers; conditional trust proxy; per-route limits | M |
| 9 | 🟠 | Per-user salt; require ADMIN_PASSWORD in prod; stop logging it | S |
| 10 | 🟠 | Real CD (registry push/deploy) + npm audit + Node 22 pin | S |
| 11 | 🟠 | HTTP-level tests (supertest) incl. traversal regression test | M |
| 12 | 🟡 | Code splitting, strict tsconfig, drop unused deps, graceful shutdown, Windows-clean script, pipeline persistence | L |

**Definition of production-ready:** P0 items closed, `npm test` covers HTTP surface with
traversal/auth regressions, backup round-trip verified in CI, image published, and the app
reaches "Autonomous Level" as defined in the roadmap (feature request → reviewed,
security-scanned, installable plugin, human approves gates only).
