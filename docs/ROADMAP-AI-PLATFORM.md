# Vitek AI Platform Roadmap

Step-by-step implementation plan for items:
- **2)** MCP write-safe tools
- **3)** Contract testing and drift detection
- **4)** Observability (OpenTelemetry + structured logging)
- **API expansion)** Webhooks + Jobs/Queue + Event Bus + Scheduler
- **8)** Data layer generators (Prisma/Drizzle/SQL-first)
- **10)** Health score CLI (`vitek doctor`)

This plan is designed so each phase is additive and does not break previous phases.

---

## 1) Goals, Constraints, and Principles

## Goals
- Make Vitek a strong AI-native backend platform.
- Keep current DX simple for existing users.
- Add production-grade quality controls for AI-generated code.
- Provide optional AI analysis workflows with privacy controls.

## Constraints
- Backward compatibility first (beta users should not be forced to migrate).
- Every feature has opt-in mode before default mode.
- No phase depends on unreleased behavior from later phases.

## Principles
- Additive rollout.
- Guardrails over magic.
- CI-friendly by default.
- Human review remains the final authority.

---

## 2) High-Level Architecture (Target)

At the end of this roadmap, Vitek includes:
- **Observability core** (`trace + logs + correlation IDs`).
- **Contract engine** (`spec/runtime drift checks`).
- **Write-safe MCP tools** (`dry-run`, diff preview, apply).
- **Webhook runtime** (`inbound signature verification + outbound delivery`).
- **Async processing** (`jobs/queue + retries + dead-letter`).
- **Domain events** (`internal event bus`).
- **Scheduler** (`cron-like tasks with safe locking`).
- **Data generators** (`route + schema + validation + tests`).
- **Doctor score** (`project quality report with optional AI suggestions`).

Cross-cutting module:
- **AI Analyzer Adapter** (optional)
  - OpenAI / Anthropic / local models
  - strict redaction and minimal payload mode
  - deterministic JSON output for CI usage

---

## 3) Delivery Sequence (Safe Order)

## Phase 0 - Foundation (shared interfaces only)
Introduce only interfaces/config contracts used by later phases.

## Phase 1 - Observability (Item 4)
Add instrumentation and structured logs first, because later phases use this telemetry.

## Phase 2 - Contract Testing and Drift (Item 3)
Build contract checks on top of existing OpenAPI/AsyncAPI and runtime metadata.

## Phase 3 - MCP Write-Safe Tools (Item 2)
Leverage contract + telemetry to make tool outputs safer and reviewable.

## Phase 4 - Webhooks + Jobs/Queue (API expansion)
Add reliable inbound/outbound integration and async execution.

## Phase 5 - Event Bus + Scheduler (API expansion)
Add internal event orchestration and recurring task execution.

## Phase 6 - Data Layer Generators (Item 8)
Generate backend modules using prior guardrails, tests, and contracts.

## Phase 7 - Doctor Score CLI (Item 10)
Aggregate signals from all previous phases and optionally send a redacted summary to AI.

No phase requires changing behavior in previous phases. Each one only adds capabilities.

---

## 4) Phase-by-Phase Plan

## Phase 0 - Foundation

## Scope
- Add config schema for AI and platform features.
- Add internal feature flags.
- Add redaction policy utilities.

## Deliverables
- `vitek.platform.json` (optional project-level config).
- Internal types:
  - `AiAnalyzerConfig`
  - `RedactionPolicy`
  - `FeatureFlags`

## Suggested config
```json
{
  "features": {
    "observability": true,
    "contracts": true,
    "mcpWriteTools": false,
    "dataGenerators": false,
    "doctor": true
  },
  "ai": {
    "enabled": false,
    "provider": "openai",
    "model": "gpt-4.1-mini",
    "redaction": {
      "stripHeaders": ["authorization", "cookie"],
      "stripFields": ["password", "token", "secret"]
    }
  }
}
```

## Acceptance criteria
- Reading config is optional and fully backward compatible.
- Redaction utility has unit tests.

---

## Phase 1 - Observability (Item 4)

**Shipped in plugin (minimal):** With `features.observability: true` in `vitek.platform.json`, the runtime adds `X-Request-Id`, `context.requestId`, structured JSON HTTP logs (dev/preview/`vitek-serve`), and `requestId` on `beforeApiRequest`. OpenTelemetry spans and exporters remain future work.

## Scope
- OpenTelemetry traces for HTTP routes, middlewares, and sockets.
- Structured logs with correlation IDs.
- Exporter abstraction.

## Use cases
- "Which middleware increased latency on `/api/orders`?"
- "Which socket route emits most failures?"
- "Correlate a REST call and subsequent socket emit for same request."

## Step-by-step
1. Add request correlation ID creation and propagation.
2. Add structured logger interface with context fields:
   - `requestId`, `route`, `method`, `status`, `durationMs`.
3. Add trace spans:
   - request span
   - middleware spans
   - handler span
   - socket handler spans
4. Add exporter config:
   - console/json exporter
   - OTLP exporter (optional)
5. Add docs and one example (`examples/observability` in future cycle).

## Example code (route-level instrumentation)
```ts
import { withSpan } from 'vitek-plugin/observability';

export default async function handler(ctx) {
  return withSpan('orders.get', async (span) => {
    span.setAttribute('user.id', ctx.headers['x-user-id'] ?? 'anonymous');
    const data = await loadOrders();
    return { data };
  });
}
```

## Acceptance criteria
- Trace IDs appear in logs.
- Optional exporter works with zero impact when disabled.
- No regression on existing examples.

---

## Phase 2 - Contract Testing and Drift (Item 3)

**Shipped in plugin (baseline):** `vitek contract snapshot` and `vitek contract check` compare generated OpenAPI/AsyncAPI to `.vitek/contract/*.json`; severities error/warning; [Contract drift](/guide/contract) documents GitHub Actions. Deeper runtime-vs-spec checks remain future work.

## Scope
- Compare generated OpenAPI/AsyncAPI against runtime behavior.
- Detect breaking changes and undocumented routes.
- Add CI command and report output.

## Use cases
- "Route returns 422 but contract says 400."
- "New route exists in runtime but missing in OpenAPI."
- "Response schema drift after AI-generated refactor."

## Step-by-step
1. Add contract snapshot command:
   - `vitek contract snapshot`
2. Add drift check command:
   - `vitek contract check`
3. Add severity levels:
   - error (blocking)
   - warning (non-blocking)
4. Add GitHub Actions example.

## Example command flow
```bash
pnpm vitek contract snapshot
pnpm vitek contract check --fail-on=error
```

## Example output
```txt
Contract Drift Report
- ERROR: GET /users/{id} response schema mismatch (field "name" missing)
- WARNING: Route /debug/status undocumented in OpenAPI
```

## Acceptance criteria
- Detect at least:
  - missing path
  - missing method
  - status mismatch
  - basic schema mismatch
- CI integration documented.

---

## Phase 3 - MCP Write-Safe Tools (Item 2)

## Scope
- Extend MCP from read-only to write-safe tools.
- Require dry-run and diff preview by default.
- Add apply confirmation mode.

## Proposed MCP tools
- `vitek_route_create`
- `vitek_route_update`
- `vitek_validation_suggest`
- `vitek_test_generate`
- `vitek_openapi_sync`

## Safety model
- Default: `dryRun: true`
- Return unified diff and risk notes.
- Explicit `apply: true` required for changes.

## Use cases
- AI proposes a new route with schema + test scaffold.
- AI updates validation based on contract drift report.
- AI syncs JSDoc/OpenAPI tags after handler changes.

## Example tool payload
```json
{
  "tool": "vitek_route_create",
  "input": {
    "path": "src/api/users/[id].get.ts",
    "prompt": "Get user by id and return 404 when missing",
    "dryRun": true
  }
}
```

## Example tool response
```json
{
  "ok": true,
  "dryRun": true,
  "diff": "--- a/src/api/users/[id].get.ts\n+++ b/src/api/users/[id].get.ts\n...",
  "risk": ["No auth middleware detected for /users/*"],
  "next": "Call again with apply=true to write file"
}
```

## Acceptance criteria
- No write operation without explicit apply signal.
- All write tools emit diff and risk metadata.
- At least one full example flow documented.

---

## Phase 4 - Webhooks + Jobs/Queue (API expansion)

## Scope
- Inbound webhooks:
  - signature verification
  - replay protection
  - idempotency
- Outbound webhooks:
  - delivery queue
  - retries/backoff
  - dead-letter support
- Async jobs:
  - enqueue/process interface
  - in-memory adapter (dev)
  - Redis adapter (prod)

## Why this phase comes before generators
- Webhook and queue primitives are platform-level runtime features.
- Generated code in later phases can rely on these primitives.

## Use cases
- "Receive Stripe webhook, verify signature, process once."
- "Dispatch webhook to partner service with retry and dead-letter."
- "Offload expensive route work to queue and return 202 quickly."

## Step-by-step
1. Add `core/webhooks/` verification and event parsing modules.
2. Add `core/jobs/` queue abstraction and execution contracts.
3. Add adapters:
   - `adapters/jobs/in-memory`
   - `adapters/jobs/redis`
4. Add outbound delivery worker with retry policy.
5. Add docs and one dedicated example (`examples/webhooks-jobs` in a future cycle).

## Example code (inbound webhook route)
```ts
import { badRequest, ok } from 'vitek-plugin/response';
import { verifyWebhookSignature } from 'vitek-plugin/webhooks';
import { enqueue } from '../lib/jobs';

export default async function handler(ctx) {
  const valid = verifyWebhookSignature({
    provider: 'stripe',
    rawBody: ctx.bodyRaw,
    signature: ctx.headers['stripe-signature'],
    secret: process.env.STRIPE_WEBHOOK_SECRET
  });

  if (!valid.ok) return badRequest({ error: 'Invalid signature' });

  await enqueue('webhooks.stripe.process', valid.event);
  return ok({ accepted: true });
}
```

## Acceptance criteria
- Signature verification test coverage for at least one provider.
- Idempotency behavior verified in integration tests.
- Queue adapter can be swapped without handler changes.

---

## Phase 5 - Event Bus + Scheduler (API expansion)

## Scope
- Internal event bus:
  - publish/subscribe
  - typed event contracts
  - async handlers
- Scheduler:
  - cron-like definitions
  - task locking
  - observability hooks

## Why this phase is separate
- Keeps webhook/queue delivery concerns isolated.
- Allows event-driven orchestration without coupling to HTTP paths.

## Use cases
- "After user.created event, trigger welcome email and analytics sync."
- "Run nightly cleanup and contract health checks."
- "Schedule retries for failed outbound webhooks."

## Step-by-step
1. Add `core/events/` with typed event contracts.
2. Add `core/scheduler/` task registry and runner.
3. Add locking strategy:
   - in-memory lock for dev
   - Redis lock for multi-instance prod
4. Add `vitek schedule run` CLI command.
5. Add docs and one example (`examples/scheduler-events` in a future cycle).

## Example code (event bus)
```ts
import { eventBus } from '../lib/events';

eventBus.on('user.created', async (payload) => {
  await sendWelcomeEmail(payload.userId);
  await publishAnalyticsEvent(payload);
});
```

## Example code (scheduler)
```ts
import { defineSchedule } from 'vitek-plugin/scheduler';

export default defineSchedule({
  tasks: [
    {
      name: 'cleanup.sessions',
      cron: '0 */6 * * *',
      run: async () => cleanupExpiredSessions()
    }
  ]
});
```

## Acceptance criteria
- Event handlers are observable with correlation IDs.
- Scheduler prevents duplicate execution in multi-instance mode.
- Failed scheduled tasks are reported in structured logs.

---

## Phase 6 - Data Layer Generators (Item 8)

## Scope
- Official generator pipelines for:
  - Prisma
  - Drizzle
  - SQL-first (minimal adapter)
- Generate route handlers + validation + tests + docs tags.

## Use cases
- "Generate CRUD for `User` model with pagination and validation."
- "Generate read-only analytics routes from SQL schema."
- "Bootstrap data API with tests and contracts in one command."

## Step-by-step
1. Add `vitek generate crud` command.
2. Add adapter interface:
   - `DataAdapterGenerator`
3. Implement Prisma adapter first.
4. Implement Drizzle adapter.
5. Add SQL-first adapter template.
6. Add generated test templates:
   - unit
   - post-build contract assertions

## Example command
```bash
pnpm vitek generate crud User --adapter prisma --out src/api/users
```

## Example generated route snippet
```ts
import { notFound, ok } from 'vitek-plugin/response';
import { validateQuery } from 'vitek-plugin/validation';
import { prisma } from '../../lib/prisma';

export default async function handler(ctx) {
  const query = validateQuery(ctx.query, {
    includePosts: { type: 'boolean' }
  });
  const user = await prisma.user.findUnique({
    where: { id: Number(ctx.params.id) },
    include: { posts: Boolean(query.includePosts) }
  });
  if (!user) return notFound({ error: 'User not found' });
  return ok(user);
}
```

## Acceptance criteria
- Generated output compiles and passes baseline tests.
- Includes validation and at least one contract test.
- Includes OpenAPI tags/comments scaffold.

---

## Phase 7 - Doctor Score CLI (Item 10)

## Scope
- Add quality scanner and score report:
  - testing, docs, contracts, observability, security checks.
- Add optional AI analysis mode.

## Use cases
- Team lead checks release readiness in CI.
- AI-generated PR gets objective quality score.
- New contributors get actionable quality checklist.

## Step-by-step
1. Add `vitek doctor` command.
2. Add scoring dimensions:
   - Contracts
   - Tests
   - Security
   - Observability
   - Webhooks/Queue reliability
   - Scheduler/Event health
   - Docs
3. Output formats:
   - terminal table
   - JSON (`--json`) for CI bots
4. Add optional AI review mode:
   - `--ai-analyze`
   - send redacted summary only

## Example command
```bash
pnpm vitek doctor --json > doctor-report.json
pnpm vitek doctor --ai-analyze --provider openai
```

## Example doctor output
```txt
Vitek Doctor Score: 81/100
- Contracts: 22/25
- Tests: 18/25
- Security: 14/20
- Observability: 12/15
- Docs: 15/15
Top actions:
1) Add contract test for /orders/{id}
2) Enable trace exporter in production
```

## Acceptance criteria
- Deterministic score with repeatable rules.
- AI mode fully optional and disabled by default.
- Redaction tests enforce no sensitive payload leak.

---

## 5) AI Integration Option (Cross-Phase)

## Objective
Allow teams to send selected project health data to AI for analysis and suggestions without exposing sensitive runtime data.

## Data flow
1. Gather local reports:
   - contract drift
   - doctor score
   - observability aggregates (non-PII)
2. Redact payload.
3. Send to AI provider.
4. Receive structured recommendations.
5. Display recommendations and optional MCP actions.

## Privacy modes
- `off` (default)
- `local-only` (write analysis prompt to file, no network)
- `remote-redacted` (remote call with strict redaction)

## Suggested redacted payload
```json
{
  "project": "vitek-plugin",
  "score": 81,
  "contractErrors": 2,
  "contractWarnings": 5,
  "topSlowRoutes": [
    { "route": "/api/orders", "p95Ms": 320 }
  ],
  "missingTests": [
    "src/api/orders/[id].patch.ts"
  ]
}
```

## Suggested AI response schema
```json
{
  "summary": "Main risk is contract drift in order routes",
  "priorityActions": [
    "Add response contract test for GET /orders/{id}",
    "Add validation for PATCH /orders/{id}"
  ],
  "estimatedImpact": "high"
}
```

---

## 6) Testing Strategy per Phase

- **Unit**
  - adapters, redaction, score rules, MCP tool input validation.
- **Integration**
  - end-to-end CLI flows (`contract check`, `doctor`, generator commands, schedule run).
- **Examples**
  - at least one example per phase capability.
- **E2E**
  - smoke tests for `vitek-serve`, sockets, MCP write-safe dry-runs, and webhook delivery.

---

## 7) Rollout and Risk Control

## Rollout model
- Release A: Foundation + Observability (opt-in).
- Release B: Contract checks (warning mode default).
- Release C: MCP write-safe tools (dry-run default).
- Release D: Webhooks + jobs/queue primitives.
- Release E: Event bus + scheduler.
- Release F: Data generators (Prisma first).
- Release G: Doctor score + optional AI analysis.

## Risk mitigations
- Feature flags for every new subsystem.
- Keep strict defaults conservative.
- Add migration notes and examples before enabling stronger defaults.

---

## 8) Suggested Milestone Backlog (Practical)

## Milestone M1 (2-3 weeks)
- Phase 0 + Phase 1 core.
- Deliver logs + trace correlation.

## Milestone M2 (2 weeks)
- Phase 2 contract snapshot/check.
- CI template and baseline docs.

## Milestone M3 (2-3 weeks)
- Phase 3 MCP write-safe dry-run tools.
- Diff preview protocol.

## Milestone M4 (3 weeks)
- Phase 4 webhooks + jobs/queue.
- Inbound verification + outbound retry worker.

## Milestone M5 (2 weeks)
- Phase 5 event bus + scheduler.
- Locking and observability integration.

## Milestone M6 (3 weeks)
- Phase 6 Prisma generator.
- Generated tests + contract hooks.

## Milestone M7 (2 weeks)
- Phase 7 doctor score and JSON output.
- Optional AI analysis with redaction.

---

## 9) Definition of Done for this Roadmap

- Each phase ships with:
  - docs updates
  - at least one runnable example or fixture
  - unit + integration tests
- No phase introduces breaking behavior by default.
- AI integration remains optional and privacy-safe.
- `pnpm run check` stays green after each phase.

---

## 10) Code Organization and Separation Guidelines (Maximum Practical Split)

This section defines how to keep the codebase highly organized while avoiding unnecessary complexity.

## Objectives
- Keep modules small and focused.
- Separate responsibilities clearly by domain and layer.
- Make imports intentional and stable over time.
- Improve maintainability for human and AI-generated changes.

## Architecture boundaries

Use this dependency direction:
- `cli/*` -> can depend on `core/*`, `shared/*`, `adapters/*`
- `adapters/*` -> can depend on `core/*`, `shared/*`
- `core/*` -> can depend on `shared/*` only
- `shared/*` -> depends on nothing project-specific
- `public/*` -> re-export layer only (no heavy logic)

Avoid reverse dependencies (for example `core/*` importing from `cli/*`).

## Folder organization rules

Split by **domain first**, then by **role**:
- `core/<domain>/`
  - `types.ts`
  - `service.ts`
  - `mapper.ts` (if needed)
  - `index.ts` (optional local barrel)
  - `*.test.ts`

Example:
```txt
src/core/contracts/
  types.ts
  snapshot.ts
  drift-check.ts
  report.ts
  drift-check.test.ts
```

## File size and complexity targets

- Prefer files up to ~200 lines for core logic.
- Split when a file has:
  - more than one responsibility,
  - mixed orchestration + low-level helpers,
  - difficult test setup due to too many branches.

## Import organization strategy

When possible, keep imports grouped and separated by intent:
1. Node built-ins
2. Third-party dependencies
3. Internal aliases / internal modules
4. Local relative modules
5. Type-only imports separated from runtime imports

Example:
```ts
import * as path from 'path';

import { z } from 'zod';

import { buildReport } from '../core/contracts/report.js';
import { logger } from '../shared/logger.js';

import { toSummary } from './mappers.js';

import type { ContractReport } from '../core/contracts/types.js';
```

## Subpath and internal import policy

- Public-facing usage should prefer subpaths:
  - `vitek-plugin/plugin`
  - `vitek-plugin/response`
  - `vitek-plugin/errors`
  - `vitek-plugin/validation`
  - `vitek-plugin/introspection`
  - `vitek-plugin/testing`
- Internal source should avoid crossing layers through deep relative paths when a stable internal module boundary exists.
- Keep `public/*` files as thin re-export facades.

## Separation patterns for new features in this roadmap

### MCP write-safe tools
- `core/mcp-tools/` for tool logic
- `cli/mcp-project.ts` as transport/orchestration only
- `core/mcp-tools/schemas.ts` for zod schemas

### Contracts
- `core/contracts/` for snapshot/check/report
- `core/contracts/formatters/` for output renderers (json, text, markdown)

### Observability
- `core/observability/` for telemetry contracts
- `adapters/observability/` for provider-specific implementations

### Data generators
- `core/generators/`
  - `adapters/prisma/`
  - `adapters/drizzle/`
  - `adapters/sql/`
  - `templates/`

### Doctor CLI
- `core/doctor/` for scoring engine
- `cli/doctor.ts` only for argument parsing + output

### Webhooks + jobs
- `core/webhooks/` for signature/replay/idempotency logic
- `core/jobs/` for queue contracts
- `adapters/jobs/` for provider-specific queue backends
- `workers/webhooks/` for outbound delivery workers

### Event bus + scheduler
- `core/events/` for event contracts and dispatcher
- `core/scheduler/` for task registry and planner
- `adapters/locks/` for distributed lock providers

## Testing organization for separated code

- Keep tests close to modules (`*.test.ts` beside implementation) for core.
- Add scenario tests in `cli/*` for command behavior.
- Add fixture folders per domain (`fixtures/<domain>/...`) instead of global mixed fixtures.

## Refactor checklist (safe and incremental)

When splitting files/modules:
1. Extract pure types first.
2. Extract pure utility/helper functions.
3. Extract side-effect boundaries (I/O, file system, process env).
4. Keep old public API unchanged.
5. Add/adjust tests before deleting old code paths.

## Acceptance criteria for organization improvements

- New modules follow boundary rules.
- No new cyclic dependencies between layers.
- Imports are consistently grouped in touched files.
- Public API remains stable unless explicitly planned.

