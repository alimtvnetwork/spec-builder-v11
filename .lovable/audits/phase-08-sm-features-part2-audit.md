# Phase 8: Spec Management Features Part 2 (16-30) Audit

**Date:** 2026-02-07  
**Auditor:** AI  
**Scope:** `spec/11-spec-management-software/05-features/16-*` through `30-*`  
**Files Reviewed:** ~85  
**Status:** Complete

---

## 1. Inconsistency Report

| # | File(s) | Description | Severity |
|---|---------|-------------|----------|
| I-01 | `16-state-management/01-state-architecture.md` lines 34-63 | **camelCase TypeScript interface fields.** `sidebarOpen`, `sidebarWidth`, `editorSplitRatio`, `activePanel` — while this is TypeScript frontend code (not Go), the interface fields used as state keys will appear in sync payloads to the backend. If synced to Go via API, these must map to PascalCase. No mapping strategy is documented. | 🟡 Warning |
| I-02 | `17-monitoring/01-system-monitoring.md` lines 139-165 | **camelCase health metrics fields.** `avgLatency`, `errorRate`, `requestsPerMinute` in `HealthMetrics` interface. Health status uses string union `'healthy' | 'degraded' | 'critical'` instead of a `health_status.Variant` enum on the Go side. No cross-reference to the Go `health_status` enum defined in AI Transcribe or other CLIs. | 🟡 Warning |
| I-03 | `17-monitoring/01-system-monitoring.md` line 257 | **String-based error status enum.** `AggregatedError.status` uses `'new' | 'acknowledged' | 'resolved'` — should reference an enum type, not inline strings. | 🟠 Minor |
| I-04 | `18-realtime/01-websocket-integration.md` lines 77-84 | **camelCase WebSocket message fields.** `WebSocketMessage` uses `type`, `channel`, `payload`, `timestamp`, `id` in camelCase. Per Phase 4 audit (AC-P4-001), WebSocket JSON fields MUST use PascalCase for Go backend compatibility. | 🔴 Critical |
| I-05 | `18-realtime/01-websocket-integration.md` vs `18-realtime/04-error-recovery.md` | **Duplicate error code prefix.** WebSocket errors use `ERR_WS_4xxx` pattern in `01-websocket-integration.md` (line 421) and `04-error-recovery.md` (lines 50-73). This `ERR_` prefix format conflicts with the Go CLI numeric-only error code standard. SM's own error codes should use plain integers from an allocated range, not `ERR_WS_` prefixed strings. | 🔴 Critical |
| I-06 | `18-realtime/02-sse-streaming.md` lines 71-106 | **camelCase event payload fields.** `TokenEvent.sessionId`, `isComplete`; `NotificationEvent.actionUrl`, `expiresAt`; `BuildProgressEvent.buildId`. All must be PascalCase for Go API compatibility. | 🔴 Critical |
| I-07 | `18-realtime/03-presence-system.md` lines 82-122 | **camelCase TypeScript fields.** `PresenceState` uses `userId`, `currentFile`, `lastSeen`; `PresenceEvent` uses `type: 'join' | 'leave' | 'update' | 'sync'` as string union instead of enum. | 🔴 Critical |
| I-08 | `18-realtime/03-presence-system.md` line 84 | **String union for PresenceStatus.** `type PresenceStatus = 'online' | 'away' | 'busy' | 'offline'` — should reference a typed enum for Go backend alignment. | 🟡 Warning |
| I-09 | `18-realtime/03-presence-system.md` vs `18-realtime/01-websocket-integration.md` | **Inconsistent presence status set.** Presence system defines `'online' | 'away' | 'busy' | 'offline'` (4 states) while WebSocket integration defines `'online' | 'away' | 'busy'` (3 states, line 199). The `'offline'` state is missing from the WebSocket spec. | 🟡 Warning |
| I-10 | `19-performance/01-optimization-strategies.md` | **No acceptance criteria.** This spec has zero testable criteria despite being labeled "Planned". It defines performance budgets (line 199-208) but no validation mechanism. | 🟡 Warning |
| I-11 | `20-testing/01-test-strategy.md` lines 163-188 | **Outdated MSW syntax.** Uses `rest.get()` from MSW v1 API. MSW v2 uses `http.get()` from `msw`. This will cause build failures with current MSW versions. | 🟡 Warning |
| I-12 | `20-testing/01-test-strategy.md` lines 20-31 | **Test pyramid inconsistency.** Shows 10% E2E, 20% integration, 70% unit. Foundation spec (`01-general-spec/03-quality/01-testing-standards-quality.md`) mandates 10% E2E, 30% integration, 60% unit. The integration/unit split differs (20/70 vs 30/60). | 🟡 Warning |
| I-13 | `21-i18n/01-internationalization.md` | **No acceptance criteria.** Zero testable criteria for internationalization. No RTL test plan, no translation completeness validation. | 🟡 Warning |
| I-14 | `22-golang-search-cli/15-error-codes.md` lines 43-58 | **Error code range collision with central registry.** The GSearch SM-internal spec uses ranges 1xxx-12xxx, which overlap heavily with the central error code registry (GSearch CLI allocated 7000-7099, BRun 7100-7599, Code Generation 12xxx). The SM-internal GSearch spec defines its own 1xxx-12xxx ranges independently of the central registry. | 🔴 Critical |
| I-15 | `23-build-runner-cli/06-error-handling.md` lines 390-468 | **BRun error codes conflict.** SM-internal BRun spec uses `7000-7599` range which matches the central registry allocation for BRun CLI. However, the SM-internal version is a **duplicate definition** that may drift from the authoritative `spec/21-brun-cli/` specs. No cross-reference ensures sync. | 🟡 Warning |
| I-16 | `23-build-runner-cli/06-error-handling.md` lines 34-56 | **camelCase JSON tags in Go structs.** `BuildError` and `ExecutionResult` use `json:"file,omitempty"`, `json:"runId"`, `json:"exitCode"` — all camelCase. Must use PascalCase per naming convention. | 🔴 Critical |
| I-17 | `24-code-generation-system/16-error-codes.md` lines 1-11 | **Code Generation uses 12xxx range.** This collides with the SM-internal GSearch spec's 12xxx encryption range (line 226-234 of `22-golang-search-cli/15-error-codes.md`). Two features in the same software claim the same error code range. | 🔴 Critical |
| I-18 | `26-ai-code-generation/11-database-schema.md` lines 283-347 | **camelCase TypeScript interface fields.** `TempCodingTask` uses `taskName`, `golangCode`, `filePath`, `complexityScore`, `isReusable`, `createdAt`, `lastExecutedAt` — all camelCase. Go GORM models on lines 204-277 correctly use PascalCase column names but the TS interfaces don't match. | 🔴 Critical |
| I-19 | `26-ai-code-generation/11-database-schema.md` line 244 | **String-based OperationType in Go model.** `FilesystemHistory.OperationType` is `string` — should be `operation_type.Variant` per enum specification. The TS side defines an `OperationType` enum (line 309-317) but Go side uses raw string. | 🟡 Warning |
| I-20 | `26-ai-code-generation/11-database-schema.md` line 72 | **JSON blob in Metadata column.** `Metadata TEXT (JSON)` in `TempCodingTasks` and `FilesystemHistory` violates the project mandate against JSON blobs. Should use per-type metadata tables. | 🟡 Warning |
| I-21 | `27-automation-pipeline/01-database-schema.md` lines 35-37 | **JSON blob in Metadata column.** `PromptTemplate.Metadata TEXT NULL` storing `{category, tags, version, author}` as JSON. Should be separate columns or a metadata table. | 🟡 Warning |
| I-22 | `27-automation-pipeline/01-database-schema.md` lines 55-59 | **String-based enum columns.** `Pipeline.ExecutionMode` is `TEXT NOT NULL` with comment `SEQUENTIAL, PARALLEL, HYBRID`. Same issue for `Stage.StageType` (line 102), `PipelineVariable.Scope` (line 216), `PipelineVariable.DataType` (line 217), `ValidationScript.Language` (line 244), `BlockConnection.ConnectionType` (line 268), `ConditionalBranch.ConditionType` (line 292), `LoopConstruct.LoopType` (line 312), `ErrorHandler.ErrorType` (line 334), `ErrorHandler.HandlerType` (line 335), `PipelineExecution.Status` (line 356), `PipelineExecution.TriggerType` (line 360), `StageExecution.Status` (line 387), `ExecutionCheckpoint.CheckpointType` (line 419). All 14 fields use TEXT with comments instead of enum types. | 🔴 Critical |
| I-23 | `27-automation-pipeline/01-database-schema.md` lines 431-510 | **TypeScript enums use SCREAMING_SNAKE_CASE values.** `ExecutionMode.SEQUENTIAL`, `StageType.PROMPT`, etc. Go backend should use byte-based Variant enums per spec/17. The TS `enum` keyword should be avoided in favor of `as const` objects for tree-shaking, per modern TS best practices. | 🟡 Warning |
| I-24 | `28-project-editor/05-error-codes.md` line 7 | **Error range 13000-13999 not in central registry.** The Project Editor module claims `13xxx` range but this is not registered in `spec/03-error-code-registry/`. Risk of future collision. | 🟡 Warning |
| I-25 | `29-trigger-event-system/01-event-types.md` lines 96-142 | **TypeScript enums with SCREAMING_SNAKE_CASE.** `EventType`, `EventPriority`, `EventDeliveryStatus`, `SchemaStatus` all use TS `enum` with SCREAMING values. Should align with Go byte-variant enum pattern for backend and use PascalCase values. | 🟡 Warning |
| I-26 | `29-trigger-event-system/01-event-types.md` lines 148-242 | **camelCase event interface fields.** `TriggerEvent` uses `correlationId`, `causationId`; `EventSource` uses `service`, `instance`; `EventMetadata` uses `userId`, `projectId`, `sessionId`, `traceId`, `spanId`, `parentSpanId`, `retentionDays`. All must be PascalCase for Go transport. | 🔴 Critical |
| I-27 | `30-ai-bridge/01-architecture.md` lines 47-91 | **camelCase JSON tags in Go structs.** `NormalizedRequest` uses `json:"systemPrompt"`, `json:"userPrompt"`, `json:"modelCategory"`, `json:"maxTokens"`, etc. All camelCase. Must be PascalCase or omit JSON tags. | 🔴 Critical |
| I-28 | `30-ai-bridge/01-architecture.md` lines 113-126 | **camelCase JSON tags.** `Response` struct uses `json:"finishReason"`, `json:"tokensUsed"`, `json:"durationMs"`, `json:"modelUsed"`. `StreamChunk` uses `json:"finishReason,omitempty"`. | 🔴 Critical |
| I-29 | `30-ai-bridge/05-error-codes.md` lines 96-104 | **camelCase JSON tags in BridgeError.** `json:"code"`, `json:"message"`, `json:"details,omitempty"`, `json:"context,omitempty"`, `json:"retryable"`, `json:"timestamp"`. All must be PascalCase or tags omitted. | 🔴 Critical |
| I-30 | `30-ai-bridge/05-error-codes.md` vs `spec/22-ai-bridge-cli/01-backend/05-error-codes.md` | **Duplicate AI Bridge error spec.** The SM-internal AI Bridge spec (feature 30) defines the same 9000-9499 error codes as the standalone AI Bridge CLI spec. Two authoritative sources risk drift. The SM spec should reference the standalone spec, not duplicate it. | 🔴 Critical |
| I-31 | `25-ai-enhancements/99-consistency-report.md` lines 85-101 | **Database table names use snake_case.** Tables listed as `sync_queue`, `audio_recordings`, `memory_shares`, `execution_plans`, `plan_step_history`, `diagram_models`, `embedded_chunks`, `share_sync_state`, `share_invitations`, `share_collections`, `share_content_cache`, `share_audit_log` — all snake_case. Must be PascalCase (e.g., `SyncQueue`, `AudioRecording`). | 🔴 Critical |
| I-32 | `18-realtime/04-error-recovery.md` lines 176-186 | **MessageQueue uses camelCase priority.** `priority: 'high' | 'normal' | 'low'` — should use a typed enum. | 🟠 Minor |

---

## 2. Summary Statistics

| Severity | Count |
|----------|-------|
| 🔴 Critical | 14 |
| 🟡 Warning | 14 |
| 🟠 Minor | 4 |
| **Total** | **32** |

### Critical Issue Categories

| Category | Count | Key Files |
|----------|-------|-----------|
| camelCase JSON tags in Go structs | 5 | `30-ai-bridge`, `23-build-runner`, `26-ai-code-generation`, `18-realtime`, `29-trigger-event-system` |
| camelCase WebSocket/SSE fields | 3 | `18-realtime/*` |
| Error code range collisions | 3 | `22-golang-search-cli`, `24-code-generation`, `30-ai-bridge` |
| snake_case database tables | 1 | `25-ai-enhancements` |
| String-based enum columns | 1 | `27-automation-pipeline` (14 fields) |
| Duplicate spec definitions | 1 | `30-ai-bridge` vs standalone |

---

## 3. Acceptance Criteria

### 3.1 State Management (`16-state-management/`)

---

**AC-P8-001: Zustand Store Persistence**

GIVEN: The UI store is initialized with default values (sidebarOpen=true, sidebarWidth=280, editorSplitRatio=0.5)

WHEN: The user modifies a preference (e.g., closes sidebar) and refreshes the page

THEN:
- The modified preference MUST persist across page reloads via localStorage key `ui-preferences`
- The stored value MUST be valid JSON parseable by Zustand's `persist` middleware
- If localStorage is unavailable, the store MUST fall back to in-memory defaults without crashing
- A `useSyncPreferences` hook MUST debounce server sync by 2000ms to avoid excessive API calls

EDGE CASES:
- If localStorage is corrupted, the store MUST reset to defaults and log a warning
- If the stored schema version differs from current (migration needed), the store MUST handle migration or reset gracefully

---

**AC-P8-002: React Query Optimistic Updates**

GIVEN: A file update mutation is triggered via `useUpdateFile`

WHEN: The mutation is in-flight

THEN:
- The query cache MUST be immediately updated with the optimistic value via `onMutate`
- Previous queries for the same key MUST be cancelled via `cancelQueries`
- If the mutation fails, the cache MUST be rolled back to the `previous` value stored in context
- On settlement (success or error), the query MUST be invalidated to fetch fresh server data
- The user MUST see the optimistic update within 16ms (one frame) of the mutation trigger

EDGE CASES:
- Concurrent mutations to the same file MUST not produce stale cache states (last-write-wins via invalidation)
- If the user navigates away before settlement, the invalidation MUST still occur on the background

---

### 3.2 Monitoring (`17-monitoring/`)

---

**AC-P8-003: Health Status Computation**

GIVEN: The health dashboard receives API metrics, frontend vitals, and error counts

WHEN: `getHealthStatus(metrics)` is called

THEN:
- `'critical'` MUST be returned when `errorRate > 0.1` (10%) OR `criticalErrors > 0`
- `'degraded'` MUST be returned when `errorRate > 0.05` (5%) OR `avgLatency > 2000ms`
- `'healthy'` MUST be returned when all metrics are below degraded thresholds
- The health check MUST evaluate conditions in order: critical first, then degraded, then healthy

EDGE CASES:
- If metrics are unavailable (null/undefined), the system MUST return `'degraded'` (not healthy) and log a warning
- If only some metrics are available, evaluation MUST use available data (partial evaluation)

---

**AC-P8-004: Error Fingerprinting and Aggregation**

GIVEN: Multiple error events flow into the monitoring system

WHEN: Errors are grouped by fingerprint

THEN:
- Fingerprint MUST be computed from error message + first 3 stack frames (normalized without line numbers)
- Identical fingerprints MUST increment `count` and update `lastSeen`
- Status transitions MUST follow: `new` → `acknowledged` → `resolved` (no backwards transitions without reset)
- Maximum 10 samples MUST be retained per fingerprint group
- Sorting MUST support: count (desc), lastSeen (desc), firstSeen (asc)

EDGE CASES:
- Errors with no stack trace MUST use message-only fingerprinting
- Unicode in error messages MUST not break fingerprint generation

---

### 3.3 Realtime (`18-realtime/`)

---

**AC-P8-005: WebSocket Connection Lifecycle**

GIVEN: The WebSocket manager is initialized

WHEN: `connect()` is called

THEN:
- Connection state MUST transition: `disconnected` → `connecting` → `connected`
- On unexpected close, state MUST transition to `reconnecting` and exponential backoff MUST begin
- Backoff delays MUST follow: 1s, 2s, 4s, 8s, 16s, 30s (capped) with ±10% jitter
- Maximum reconnection attempts MUST be configurable (default: 10)
- After max attempts exceeded, state MUST be `disconnected` and an `maxRetriesExceeded` event MUST be emitted
- All JSON message fields MUST use PascalCase (e.g., `Type`, `Payload`, `Timestamp`, `Id`)

EDGE CASES:
- If the browser goes offline (`navigator.onLine === false`), reconnection attempts MUST pause and resume when online
- If `disconnect()` is called during reconnection, all pending timeouts MUST be cleared

---

**AC-P8-006: SSE Token Streaming**

GIVEN: An AI completion is requested and the SSE endpoint `/api/v1/ai/stream/{sessionId}` is connected

WHEN: Token events arrive

THEN:
- `token` events MUST append `token` string to the output buffer in order
- `done` event MUST set streaming status to complete and close the connection
- `error` event MUST set error state with code and message, then close
- Last Event ID MUST be tracked for reconnection (resume from last received event)
- Reconnection MUST use exponential backoff with max 30s delay and 10% jitter
- Rendering MUST use `ReactMarkdown` for markdown content with a blinking cursor indicator during streaming

EDGE CASES:
- If the SSE connection drops mid-stream, reconnection with `lastEventId` MUST resume from the last received token
- If the server sends duplicate event IDs, the client MUST deduplicate by ID
- Empty token strings (`""`) MUST be ignored (not appended to buffer)

---

**AC-P8-007: Presence Cursor Tracking**

GIVEN: Multiple users are editing the same file in a shared project

WHEN: User A moves their cursor

THEN:
- Cursor position MUST be broadcast via `presence:cursor` WebSocket message within 50ms (throttled)
- Selection range updates MUST be throttled to 100ms
- Status changes and file switches MUST be sent immediately (0ms throttle)
- Each user MUST be assigned a unique color from the 8-color HSL palette based on `hashString(userId) % 8`
- Cursor overlay MUST display: colored line (2px wide), username label with colored background
- Users inactive for >60s MUST be automatically marked `away`
- Users with no heartbeat for >90s MUST be removed from the presence list

EDGE CASES:
- If two users hash to the same color, both MUST still function (color collision is acceptable)
- If the editor view scrolls, cursor overlay positions MUST update reactively via `editorView.coordsAtPos()`

---

**AC-P8-008: Offline Message Queue**

GIVEN: The WebSocket connection is lost

WHEN: The application attempts to send messages

THEN:
- Messages MUST be queued with `{id, type, payload, timestamp, retries, priority}` structure
- Queue MUST be sorted by priority: `high` → `normal` → `low`
- Maximum queue size MUST be 100 messages (1000 for WebSocket, per `18-realtime/01-websocket-integration.md` line 431 — inconsistency noted: 100 in `04-error-recovery.md` vs 1000 in `01-websocket-integration.md`)
- When queue is full and a new high/normal message arrives, the oldest `low` priority message MUST be evicted
- On reconnection, the queue MUST be flushed in priority order
- Messages exceeding `maxRetries` (default: 3) MUST be dropped and logged
- Queue MAY be persisted to localStorage for cross-session recovery

EDGE CASES:
- If flush fails partway through, remaining messages MUST stay in the queue with incremented retry count
- If the connection drops again during flush, messages MUST be re-queued (not lost)

---

### 3.4 Performance (`19-performance/`)

---

**AC-P8-009: Performance Budget Enforcement**

GIVEN: The application is deployed to production

WHEN: A Lighthouse CI audit runs

THEN:
- First Contentful Paint MUST be < 1.5s (critical threshold: 3s)
- Largest Contentful Paint MUST be < 2.5s (critical threshold: 4s)
- Time to Interactive MUST be < 3s (critical threshold: 5s)
- Main bundle size MUST be < 200KB gzipped (critical: 500KB)
- Vendor bundle size MUST be < 300KB gzipped (critical: 700KB)
- Route-based code splitting MUST be applied to `SpecEditor`, `ConsistencyDashboard`, `KnowledgeManagement` pages
- Virtual scrolling MUST be used for lists exceeding 100 items

EDGE CASES:
- If a bundle exceeds the critical threshold, the CI pipeline MUST fail
- If CodeMirror is loaded eagerly (not lazy), bundle size will likely exceed budget — it MUST be lazy-loaded

---

### 3.5 Testing (`20-testing/`)

---

**AC-P8-010: Test Coverage Enforcement**

GIVEN: The test suite is executed with coverage reporting

WHEN: Coverage results are analyzed

THEN:
- Utilities: ≥90% line coverage (target: 95%)
- Hooks: ≥80% line coverage (target: 90%)
- Components: ≥70% line coverage (target: 80%)
- Pages: ≥60% line coverage (target: 70%)
- Critical E2E flows (auth, project CRUD, file editing): 100% covered
- MSW handlers MUST use the v2 API (`http.get()` not `rest.get()`)
- All tests MUST follow AAA (Arrange-Act-Assert) pattern

EDGE CASES:
- Test files themselves MUST be excluded from coverage metrics
- Snapshot tests MUST have `.snap` extension committed to version control

---

### 3.6 Automation Pipeline (`27-automation-pipeline/`)

---

**AC-P8-011: Pipeline Execution Lifecycle**

GIVEN: A pipeline with N stages across M execution blocks is triggered

WHEN: Execution begins

THEN:
- Status MUST transition: `PENDING` → `RUNNING` → `SUCCESS`/`FAILED`/`CANCELLED`
- Blocks with the same `ParallelGroup` value MUST execute concurrently
- Blocks with different `ExecutionOrder` MUST execute sequentially
- Each stage MUST resolve `InputBindings` variables using `{{var.path}}` template syntax
- Stage output MUST be stored in the `OutputVariable` for downstream access
- Timeouts MUST default to 300s per stage, configurable via `TimeoutSeconds`
- Retry configuration MUST support `maxRetries`, `backoffMs`, and `retryOn` error codes
- All string-based enum fields (ExecutionMode, StageType, VariableScope, etc.) MUST be converted to byte-variant enums

EDGE CASES:
- Circular dependencies between blocks MUST be detected at pipeline save time and rejected with error
- If a parallel block fails and `ErrorHandler.HandlerType` is `STOP`, all sibling parallel blocks MUST be cancelled
- `LoopConstruct.MaxIterations` (default: 100) MUST prevent infinite loops even if the `Condition` never becomes false

---

**AC-P8-012: Execution Checkpoint Rollback**

GIVEN: A pipeline execution has created checkpoints at block boundaries

WHEN: A user requests rollback to a specific checkpoint

THEN:
- `VariableSnapshot` MUST be restored to the state at checkpoint creation
- Files listed in `FileManifest` MUST be checked for rollback feasibility
- `CanRollback` flag MUST be validated before attempting rollback
- Rollback MUST restore the `PipelineExecution.CompletedStages` counter to the checkpoint's stage index
- All `StageExecution` records after the checkpoint MUST be marked as `ROLLED_BACK` (new status needed)

EDGE CASES:
- If files in `FileManifest` have been modified since checkpoint creation, rollback MUST warn the user about conflicts
- If `CanRollback` is false, the rollback MUST be rejected with a clear error message

---

### 3.7 Trigger Event System (`29-trigger-event-system/`)

---

**AC-P8-013: Event Schema Compliance**

GIVEN: Any event is emitted through the Trigger Event System

WHEN: The event is serialized for transport

THEN:
- All JSON fields MUST use PascalCase (e.g., `CorrelationId`, `CausationId`, `TraceId`, `SpanId`)
- `id` MUST be UUID v7 (time-sortable)
- `timestamp` MUST be ISO 8601 with timezone
- `version` MUST follow semver (e.g., `"1.0.0"`)
- `priority` MUST be one of: `Critical`, `High`, `Normal`, `Low`, `Bulk`
- `source` MUST include `Service`, `Instance`, `Version`, `Environment`
- Schema validation MUST reject events missing required fields
- Events with `persist: true` MUST be stored in the event store
- Events with `persist: false` (or omitted) MUST be fire-and-forget

EDGE CASES:
- Events with unknown `type` values MUST be accepted but logged as warnings (forward compatibility)
- Events exceeding 1MB payload MUST be rejected with an appropriate error
- If `correlationId` is missing, the system MUST generate one automatically

---

**AC-P8-014: Event Priority Processing**

GIVEN: Events arrive with different priority levels

WHEN: The event processor dequeues events

THEN:
- `Critical` events MUST be processed immediately (within 10ms of receipt)
- `High` events MUST be processed within 100ms
- `Normal` events MUST use standard FIFO processing
- `Low` events MUST be processed after all higher-priority events
- `Bulk` events MUST be batched (configurable batch size, default: 100) and processed during idle periods
- Priority queue MUST prevent starvation: `Low` events waiting >30s MUST be promoted to `Normal`

EDGE CASES:
- If the event queue exceeds 10,000 items, `Bulk` events MUST be dropped with a backpressure warning
- If the system is under critical load (event processing latency >1s), only `Critical` and `High` events MUST be processed

---

### 3.8 AI Bridge SM Integration (`30-ai-bridge/`)

---

**AC-P8-015: Input Format Normalization**

GIVEN: AI Bridge receives input in any supported format (MD, JSON, YAML, CSV)

WHEN: The input is parsed and normalized

THEN:
- The `InputRouter` MUST select the parser based on file extension
- All parsers MUST produce a `NormalizedRequest` struct
- All JSON fields in `NormalizedRequest` MUST use PascalCase (no `json:"camelCase"` tags)
- Variable resolution MUST replace all `{{variable}}` placeholders
- Unresolved variables MUST trigger error 9140 (`ErrVariableNotFound`)
- CSV inputs MUST require a companion `.config.yaml` file (error 9131 if missing)

EDGE CASES:
- Files with unknown extensions MUST return error 9100 with a list of supported formats
- Empty files MUST return the appropriate format-specific empty error (9111 for YAML, 9132 for CSV)
- UTF-8 BOM in input files MUST be stripped before parsing

---

**AC-P8-016: Backend Selection and Failover**

GIVEN: Multiple LLM backends are configured (e.g., Ollama + llama.cpp)

WHEN: A generation request is made

THEN:
- Backend selection priority: explicit override → model availability → health status → config default
- If the selected backend fails with a retryable error (9200, 9201, 9202), the system MUST retry with exponential backoff (500ms initial, 2x factor, 10s max, 3 attempts)
- If all retries fail, the system MUST attempt failover to the next available backend
- If no backend is available, error 9200 MUST be returned

EDGE CASES:
- If a backend becomes unavailable during streaming, the stream MUST be interrupted with error 9410 and the partial output preserved
- If the requested model is not loaded, the system MUST attempt auto-load before returning 9312

---

## 4. Cross-Reference Issues

| From | To | Issue |
|------|----|-------|
| `22-golang-search-cli/` | `spec/20-gsearch-cli/` | SM-internal GSearch spec is a **duplicate** of the standalone GSearch CLI spec. Should reference, not duplicate. |
| `23-build-runner-cli/` | `spec/21-brun-cli/` | SM-internal BRun spec is a **duplicate** of the standalone BRun CLI spec. Should reference, not duplicate. |
| `30-ai-bridge/` | `spec/22-ai-bridge-cli/` | SM-internal AI Bridge spec is a **duplicate** of the standalone AI Bridge CLI spec. Should reference, not duplicate. |
| `24-code-generation-system/16-error-codes.md` | `spec/03-error-code-registry/` | `12xxx` range not registered in central registry. |
| `28-project-editor/05-error-codes.md` | `spec/03-error-code-registry/` | `13xxx` range not registered in central registry. |

---

## 5. Remediation Recommendations

### Priority 1: PascalCase Enforcement
Convert all Go struct JSON tags and TypeScript transport interfaces to PascalCase across features 18, 26, 27, 29, and 30. This affects ~50 struct fields.

### Priority 2: Eliminate Duplicate CLI Specs
Features 22 (GSearch), 23 (BRun), and 30 (AI Bridge) duplicate standalone CLI specs. Replace with reference documents pointing to the authoritative specs.

### Priority 3: Error Code Registry Update
Register `12xxx` (Code Generation) and `13xxx` (Project Editor) ranges in the central `spec/03-error-code-registry/`. Resolve the `12xxx` collision between Code Generation and SM-internal GSearch encryption errors.

### Priority 4: Enum Conversion
Convert 14 string-based TEXT columns in `27-automation-pipeline/01-database-schema.md` to byte-variant enum types per `spec/17-enum-specification/`.

### Priority 5: Database Table Naming
Rename all snake_case tables in `25-ai-enhancements/` to PascalCase (e.g., `sync_queue` → `SyncQueue`).

---

*Phase 8 audit complete. 32 inconsistencies found (14 critical). 16 acceptance criteria generated.*
