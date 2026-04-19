# Phase 15 Audit: Nexus Flow CLI

**Version:** 1.0.0  
**Date:** 2026-02-07  
**Scope:** `spec/24-nexus-flow-cli/` (19 files across 3 folders)  
**Status:** Complete

---

## Summary

| Metric | Count |
|--------|-------|
| Files Audited | 19 |
| Total Findings | 78 |
| 🔴 Critical | 28 |
| 🟡 Warning | 31 |
| 🔵 Info | 19 |

---

## 🔴 CRITICAL FINDINGS

### C-01: Port Assignment Chaos (6 conflicting values)

**Severity:** 🔴 Critical  
**Impact:** Build/deploy failure, port collisions

The Nexus Flow port is specified differently in **6 locations**:

| File | Port(s) | Context |
|------|---------|---------|
| `01-backend/00-microservices-context.md` (L29) | **9000** | Service Registry |
| `01-backend/01-core-specification.md` (L4) | **8085** | Service header |
| `01-backend/03-openapi-specification.md` (L6-7) | **8092** | OpenAPI header |
| `02-frontend/02-frontend-architecture.md` (L232) | **8089** (fallback 8120, 8121) | config.seed.json |
| `02-frontend/02-implementation-checklist.md` (L18) | **8089** (fallback 8120, 8121) | Primary Port |
| `03-deploy/01-powershell.md` (L22) | **8113**, 8114, 8115 | powershell.json |
| `03-deploy/02-deployment-guide.md` (L77) | **8113**, 8114 | config.json |

**Canonical port (per memory `cli-port-registry`):** **5050**

**Remediation:** Unify ALL specs to port **5050**. Worker port: **5051**. Frontend dev: standard Vite port.

---

### C-02: Error Code Range Conflict (8xxx vs 10xxx)

**Severity:** 🔴 Critical  
**Impact:** Error misrouting, debugging confusion

| File | Error Range |
|------|-------------|
| `00-overview.md` (L68) | **8000-8399** ✅ Correct |
| `04-error-codes.md` (L10) | **8xxx** ✅ Correct |
| `06-implementation-checklist.md` (L268) | **8000-8399** ✅ Correct |
| `00-microservices-context.md` (L46) | **10xxx** ❌ WRONG |
| `03-openapi-specification.md` (L7) | **10xxx** ❌ WRONG |

**Canonical range (per memory `error-code-registry`):** **NF 8000-8399**

**Remediation:** Update `00-microservices-context.md` L46 and `03-openapi-specification.md` L7 to `8xxx (8000-8399)`.

---

### C-03: Dependency Port References Stale

**Severity:** 🔴 Critical  
**Impact:** Integration failures at runtime

| Dependency | Referenced Port | Canonical Port |
|------------|----------------|----------------|
| AI Bridge | 8089 (`01-powershell.md` L74) | **5040** |
| AI Bridge | 8082 (`00-microservices-context.md` L27) | **5040** |
| GSearch | 8088 (`01-powershell.md` L75) | **5020** |
| BRun | 8100 (`01-powershell.md` L76) | **5030** |

**Remediation:** Update all dependency URLs to canonical ports.

---

### C-04: Settings Service camelCase Keys

**Severity:** 🔴 Critical  
**Impact:** PascalCase mandate violation

`08-settings-service.md` uses camelCase setting keys throughout:

| ❌ Current | ✅ Required |
|-----------|------------|
| `workflow.defaultTimeout` | `Workflow.DefaultTimeout` |
| `workflow.maxConcurrentWorkflows` | `Workflow.MaxConcurrentWorkflows` |
| `websocket.pingInterval` | `Websocket.PingInterval` |
| `node.executionTimeout` | `Node.ExecutionTimeout` |
| `rbac.enabled` | `Rbac.Enabled` |
| `observability.metricsEnabled` | `Observability.MetricsEnabled` |
| `reset.confirmationTtlMinutes` | `Reset.ConfirmationTtlMinutes` |

**Also affects:** Implementation constants (L177-208), config.seed.json (L136-169).

Note: `05-database-architecture.md` already uses PascalCase keys in its seed data (L80-85) — this is the CORRECT pattern.

**Remediation:** Batch rename all setting keys to PascalCase in `08-settings-service.md`.

---

### C-05: Frontend config.seed.json camelCase

**Severity:** 🔴 Critical  
**Impact:** Naming convention violation

`02-frontend/02-frontend-architecture.md` (L169-241) config.seed.json uses camelCase:

| ❌ Current | ✅ Required |
|-----------|------------|
| `maxConcurrentNodes` | `MaxConcurrentNodes` |
| `nodeTimeout` | `NodeTimeout` |
| `retryOnError` | `RetryOnError` |
| `maxRetries` | `MaxRetries` |
| `snapToGrid` | `SnapToGrid` |
| `gridSize` | `GridSize` |
| `showMinimap` | `ShowMinimap` |

---

### C-06: Deployment Config camelCase + snake_case

**Severity:** 🔴 Critical  

`03-deploy/02-deployment-guide.md` config.json (L72-107) uses camelCase:
- `maxConnections`, `maxConcurrent`, `retryAttempts`, `outputPath`

Log format (L240-248) uses snake_case:
- `workflow_id`, `duration_ms`, `node_count`

**Remediation:** Convert all to PascalCase.

---

### C-07: HealthStatus Uses String Type Instead of Byte Variant

**Severity:** 🔴 Critical  
**File:** `07-observability.md` (L307)

```go
type HealthStatus string  // ❌ WRONG
```

Must be:
```go
type Variant byte  // ✅ Per enum specification
```

This also affects `StatusHealthy`, `StatusDegraded`, `StatusUnhealthy` constants.

**Remediation:** Create `internal/enums/health_status/variant.go` with byte pattern. Add to `10-enum-architecture.md`.

---

### C-08: Cross-Reference Errors in Standalone Architecture

**Severity:** 🔴 Critical  
**File:** `02-standalone-architecture.md` (L14-17)

References use OLD microservices paths:
- `./06-nexus-flow.md` → Should be `./01-core-specification.md`
- `./07-react-flow-canvas.md` → Should be `../02-frontend/01-react-flow-canvas.md`
- `./08-shared-pkg-modules.md` → Should be `../../11-spec-management-software/13-shared-packages/`

---

### C-09: Data Path Inconsistency

**Severity:** 🔴 Critical  

| File | Root Data Path |
|------|---------------|
| `05-database-architecture.md` (L37) | `data/` ✅ |
| `02-standalone-architecture.md` (L162) | `nexus-flow-data/` ❌ |
| `03-deploy/02-deployment-guide.md` (L59) | `data/nexus.db` ❌ (should be `nexusflow.db`) |

**Canonical:** `data/nexusflow.db` (per `05-database-architecture.md`).

---

### C-10: Missing Acceptance Criteria (All Specs)

**Severity:** 🔴 Critical  
**Impact:** Not E2E-test-ready

Per standard `detailed-acceptance-criteria-format`, all specs must include GIVEN/WHEN/THEN acceptance criteria. **Zero** of the 19 files contain acceptance criteria.

**Affected files:** All 19 specification files.

---

### C-11: Consistency Report (99) is Stale

**Severity:** 🔴 Critical  

`99-consistency-report.md` claims **9 files** and **100/100 score**, but:
- Backend now has **11 files** (00-overview through 10-enum-architecture)
- Frontend has **4 files** (not 3 as implied)
- Deploy has **3 files** (not referenced)
- Total is **19 files**, not 9
- Report doesn't audit files 08, 09, 10

---

### C-12: OpenAPI Schemas Use camelCase Properties

**Severity:** 🔴 Critical  
**File:** `03-openapi-specification.md`

OpenAPI request/response schemas use camelCase property names:
- `projectId`, `flowId`, `stageId` (path params L850-851)
- `fromStageId`, `useCheckpoint` (L850-852)
- `includeExecutions` (L365)
- `builtIn` (L955)

**Remediation:** Convert all OpenAPI schema properties to PascalCase.

---

## 🟡 WARNING FINDINGS

### W-01: Duplicate File Numbering in Frontend

`02-frontend/` has two files starting with `02-`:
- `02-frontend-architecture.md`
- `02-implementation-checklist.md`

Should be `03-implementation-checklist.md`.

---

### W-02: Standalone Architecture Schema Diverges from Database Architecture

`02-standalone-architecture.md` defines a **completely different schema** (project-centric with FlowIndex, Stage, StageConnection, Variable, Condition, ExecutionRun tables) vs `05-database-architecture.md` (pipeline-centric with Pipelines, Blocks, Edges, BlockExecutions).

**05-database-architecture.md** should be authoritative per Split DB mandate.

**Remediation:** Add deprecation header to schema sections in `02-standalone-architecture.md` pointing to `05-database-architecture.md`.

---

### W-03: WebSocket Code Inconsistency (EventId vs EventID)

`01-core-specification.md`:
- Struct field: `EventId` (L510) — PascalCase ✅
- Usage in code: `EventID` (L739) — Acronym violation ❌

Per naming standard, acronyms are words: `EventId` is correct.

---

### W-04: Frontend API Endpoints Don't Match OpenAPI

`02-frontend-architecture.md` lists simplified endpoints:
- `GET /api/workflows` vs OpenAPI `GET /projects/{projectId}/flows`
- `POST /api/workflows/:id/execute` vs OpenAPI `POST /projects/{projectId}/flows/{flowId}/executions`

**Remediation:** Update frontend spec to match OpenAPI paths, or document the facade/proxy layer.

---

### W-05: Implementation Checklist API Endpoints Don't Match OpenAPI

`06-implementation-checklist.md` (L152-161) lists:
- `GET /api/v1/pipelines` vs OpenAPI `/projects/{projectId}/flows`
- `POST /api/v1/pipelines/{id}/execute` vs OpenAPI uses executions endpoint

---

### W-06: Missing `10-enum-architecture.md` from Backend Overview

`01-backend/00-overview.md` file listing doesn't include `10-enum-architecture.md`.

---

### W-07: PowerShell json Port Mismatch with Frontend

`03-deploy/01-powershell.md` powershell.json specifies `frontendPort: 5176` but frontend architecture doesn't reference this port.

---

### W-08: config.seed.json Format Inconsistency

Two different config.seed.json formats:
- `08-settings-service.md`: Array format `{ "settings": [...] }`
- `02-frontend-architecture.md`: Nested categories format `{ "categories": { ... } }`

Should follow one canonical format.

---

### W-09: Upload Path Uses Timestamp Pattern

`02-standalone-architecture.md` (L388-420) uses `{timestamp}_{filename}` pattern.

Canonical upload path (per memory): `data/{appName}/upload/{reason}/{company}/{slug}-{taskId}/`

---

### W-10: Core Spec Uses `map[string]interface{}` for Input

`01-core-specification.md` uses `map[string]interface{}` extensively. Should reference typed models or at minimum use `any` (Go 1.18+).

---

### W-11: Missing DBOperation Wrapper References

Core spec repository layer (`01-core-specification.md` L117-119) defines repositories without referencing the mandatory `pkg/database` DBOperation wrapper.

---

### W-12: Error Codes in Reset API (09) Overlap with Error Codes (04)

`09-reset-api.md` defines errors NF-8301 through NF-8308 (L165-173).
`04-error-codes.md` defines 83xx as "State Errors" (L44-49) with codes 8301-8303.

Codes **8301-8303 collide** between Reset API and State Errors.

---

### W-13: Observability ComponentStatus Uses json Tag

`07-observability.md` (L298-299):
```go
Message   string                 `json:",omitempty"`
Metadata  map[string]interface{} `json:",omitempty"`
```

Per naming standard, JSON tags should be omitted unless adding `,omitempty`.
These are acceptable since they use `,omitempty`, but the field naming is PascalCase ✅.

---

## 🔵 INFO FINDINGS

### I-01: Large Specification Files

| File | Lines | Recommendation |
|------|-------|----------------|
| `01-core-specification.md` | 2,550 | Consider splitting WebSocket, Block Registry, Engine into separate files |
| `03-openapi-specification.md` | 2,283 | Acceptable for OpenAPI |
| `01-react-flow-canvas.md` | 1,926 | Consider splitting node configs into separate file |
| `02-standalone-architecture.md` | 1,755 | Consider extracting desktop app spec |
| `10-enum-architecture.md` | 2,414 | Acceptable — one file per enum type pattern |

### I-02: Deploy Overview is Empty

`03-deploy/00-overview.md` says "Deployment files to be added" but `01-powershell.md` and `02-deployment-guide.md` already exist.

### I-03: Consistency Report References Non-Existent 06-frontend-architecture.md

The `99-consistency-report.md` references `06-frontend-architecture.md` as if it's in the backend folder, but it's actually `02-frontend/02-frontend-architecture.md`.

### I-04: Microservices Context is Legacy

`00-microservices-context.md` describes Nexus Flow within the SpecBuilder Pro microservices ecosystem. Since Nexus Flow is now a standalone CLI tool, this file should have a prominent note about the standalone extraction.

---

## Remediation Priority

### Wave 1: Port & Error Registry (Blocking)

| # | Action | Files Affected |
|---|--------|----------------|
| 1 | Unify port to **5050** | 7 files |
| 2 | Fix error range to **8000-8399** | 2 files |
| 3 | Fix dependency ports | 3 files |
| 4 | Resolve 8301-8303 collision | 2 files |

### Wave 2: PascalCase Sweep

| # | Action | Files Affected |
|---|--------|----------------|
| 5 | Settings service keys → PascalCase | 1 file |
| 6 | Frontend config.seed.json → PascalCase | 1 file |
| 7 | Deployment config → PascalCase | 1 file |
| 8 | OpenAPI schema properties → PascalCase | 1 file |
| 9 | Fix `EventID` → `EventId` | 1 file |

### Wave 3: Schema & Cross-Reference

| # | Action | Files Affected |
|---|--------|----------------|
| 10 | Deprecate standalone arch schema | 1 file |
| 11 | Fix cross-references | 2 files |
| 12 | Fix data paths | 2 files |
| 13 | Add `HealthStatus` byte variant | 2 files |

### Wave 4: Documentation Quality

| # | Action | Files Affected |
|---|--------|----------------|
| 14 | Add acceptance criteria (all specs) | 19 files |
| 15 | Update consistency report | 1 file |
| 16 | Rename `02-implementation-checklist.md` → `03-` | 1 file |
| 17 | Update backend overview file list | 1 file |
| 18 | Align frontend API endpoints with OpenAPI | 2 files |
| 19 | Unify config.seed.json format | 2 files |
| 20 | Update upload paths to canonical pattern | 1 file |

---

## Cross-References

| Reference | Location |
|-----------|----------|
| Port Registry | `.lovable/memories/technical/cli-port-registry` |
| Error Code Registry | `.lovable/memories/technical/error-code-registry` |
| Naming Convention | `.lovable/memories/style/naming-convention` |
| File Path Standards | `.lovable/memories/technical/file-path-standards` |
| Enum Specification | `.lovable/memories/standards/enum-specification` |
| Phase 14 Audit | `.lovable/audits/phase-14-ai-bridge-advanced-audit.md` |
| Consolidated Remediation | `.lovable/audits/consolidated-remediation-plan-p11-p13.md` |
