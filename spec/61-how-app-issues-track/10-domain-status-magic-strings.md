# 10 — Domain Status Magic String Violations

**Created:** 2026-02-27  
**Version:** 1.0.0  
**Status:** Resolved  
**Severity:** Medium

---

## Issue Summary

### What happened

A project-wide scan revealed ~430 instances across ~36 spec files where domain status values are compared using raw string literals (e.g., `status === 'active'`, `status === 'failed'`) instead of enum constants. This violates the universal enum architecture mandate (memory: `architecture/enum-standard`) and master coding guidelines §8 (magic strings zero tolerance).

### Where it happened

- **Feature / Module:** Frontend spec code examples across all projects
- **File paths:** See [Affected Files](#affected-files) below

### Symptoms and impact

- **Type-safety gap:** Typos in status strings (e.g., `'actve'` vs `'active'`) are not caught at compile time
- **Refactoring risk:** Renaming a status requires grep-and-replace across dozens of files
- **Inconsistency with Issue #09:** The `hasMismatch`/`isEqual` magic string violations were fixed, but the broader `=== 'string'` pattern was not addressed
- **Cross-language parity gap:** Go backend uses typed enums; frontend specs use raw strings

### How it was discovered

Follow-up scan after Issue #09 resolution. User requested a broader magic string audit beyond `hasMismatch`/`isEqual` patterns on 2026-02-27.

---

## Root Cause Analysis

### Direct cause

Frontend spec code examples were written with inline string literals for status comparisons, following common React/TypeScript conventions rather than the project's enum-first standard.

### Contributing factors

1. No automated scan existed for `=== 'string'` patterns in spec files
2. Issue #09 scoped narrowly to `hasMismatch`/`isEqual` helpers only
3. The `HttpMethod` enum spec existed but no equivalent `Status` or domain-specific enum specs were created for other categorical values

### Triggering conditions

Any spec code example that compares a status, phase, role, or categorical field against a string literal.

### Why the existing spec did not prevent it

- Master coding guidelines §8 prohibits magic strings but enforcement focused on Go code and comparison helpers
- No explicit rule required TypeScript spec examples to use enums for status comparisons
- The `HttpMethod` enum spec (`spec/02-coding-guidelines/02-typescript/http-method-enum.md`) covered only HTTP methods, not domain statuses

---

## Fix Description

### What needs to change in the specs

Each affected module needs:
1. A domain-specific enum definition (e.g., `ExecutionStatus`, `ConnectionStatus`, `ExportStatus`)
2. All `=== 'string'` comparisons in code examples replaced with enum constant references

### New rules or constraints to add

1. **Rule:** All domain status comparisons in TypeScript spec examples MUST use enum constants, not string literals
2. **Rule:** Each spec module introducing status values MUST define a corresponding enum in a `types` or `enums` section
3. **Rule:** Post-remediation scans MUST include `=== '...'` pattern checks for categorical values

### Why the fix resolves the root cause

Defining enums per domain and replacing literals ensures compile-time safety, single-source-of-truth for valid values, and IDE autocompletion. Combined with scan rules, new violations will be caught.

### Config changes or defaults affected

None

### Logging or diagnostics required

None

---

## Affected Files

### Tier 1 — High Violation Count (10+ matches each)

| File | ~Count | Key Patterns |
|------|--------|-------------|
| `spec/11-spec-management-software/05-features/06-ai-integration/08-ai-chat-ui.md` | 20+ | `slot.status === 'active'/'loading'/'idle'/'error'` |
| `spec/11-spec-management-software/05-features/25-ai-enhancements/05-03-message-display.md` | 15+ | `message.status === 'streaming'/'error'/'pending'`, `execution.status === 'success'/'failed'` |
| `spec/11-spec-management-software/05-features/09-knowledge-memory/11-knowledge-memory-ui.md` | 15+ | `source.status === 'processing'`, `job.status === 'running'/'completed'/'failed'` |
| `spec/11-spec-management-software/05-features/03-project-management/02-import-export-ui.md` | 12+ | `exportStatus === 'completed'/'failed'/'processing'` |
| `spec/11-spec-management-software/05-features/27-automation-pipeline/24-collaboration.md` | 12+ | `participant.status === 'ACTIVE'/'IDLE'/'DISCONNECTED'` |

### Tier 2 — Moderate Violation Count (5–9 matches each)

| File | ~Count | Key Patterns |
|------|--------|-------------|
| `spec/11-spec-management-software/05-features/27-automation-pipeline/10-react-flow-canvas.md` | 8 | `executionState?.status === 'RUNNING'` |
| `spec/11-spec-management-software/05-features/05-voice-input/06-voice-session-manager.md` | 7 | `connection.status === 'connected'`, `permissions.microphone === 'granted'` |
| `spec/11-spec-management-software/05-features/25-ai-enhancements/03-02-plan-execution.md` | 6 | Plan execution status checks |
| `spec/11-spec-management-software/05-features/25-ai-enhancements/03-03-approval-workflow.md` | 6 | Approval status checks |
| `spec/26-ai-transcribe-cli/02-frontend/01-testing-ui.md` | 6 | Recording/connection status |
| `spec/24-nexus-flow-cli/02-frontend/01-react-flow-canvas.md` | 5 | Node execution status |
| `spec/28-shared-cli-frontend/15-hooks-library.md` | 5 | `Status === 'running'/'error'` |
| `spec/30-wp-plugin/05-wp-plugin-publish/02-frontend/28-remote-plugins.md` | 5 | `plugin.status === 'active'` |

### Tier 3 — Low Violation Count (1–4 matches each)

| File | ~Count |
|------|--------|
| `spec/04-error-resolution/07-error-modal/react-components.md` | 3 |
| `spec/04-error-resolution/03-debugging-guides/03-debugging-typescript.md` | 2 |
| `spec/04-error-resolution/01-retrospectives/02-retry-debounce-dedup-fixes.md` | 2 |
| `spec/30-wp-plugin/03-exam-manager/01-admin-backend/split-spec/26-secret-key-analytics.md` | 2 |
| `spec/30-wp-plugin/03-exam-manager/01-admin-backend/split-spec/41a-test-spec-conditional-helpers.md` | 2 |
| `spec/02-coding-guidelines/01-cross-language/06-cyclomatic-complexity.md` | 1 |
| ~15 additional files | 1–3 each |

### Exempt Patterns (No Action Required)

| Pattern | Reason |
|---------|--------|
| `process.env.NODE_ENV === 'production'` | Framework/runtime API |
| `event.type === 'updated'` (React Query internals) | Library API |
| `mediaRecorder.state === 'recording'` | Browser Web API |
| `typeof x === 'string'` | Language operator |
| PHP `$body['status'] === 'success'` (backend response parsing) | Backend/PHP scope, not TypeScript |

---

## Fix Strategy

### Phase 1 — Define Domain Enums (~5 new enum files)

Create enum definitions for recurring status domains:

| Enum | Values | Location |
|------|--------|----------|
| `ExecutionStatus` | `Idle`, `Running`, `Paused`, `Completed`, `Failed`, `Cancelled` | `spec/02-coding-guidelines/02-typescript/` |
| `ConnectionStatus` | `Connected`, `Disconnected`, `Connecting`, `Error` | `spec/02-coding-guidelines/02-typescript/` |
| `ExportStatus` | `Pending`, `Processing`, `Completed`, `Failed` | `spec/02-coding-guidelines/02-typescript/` |
| `MessageStatus` | `Pending`, `Streaming`, `Completed`, `Error` | `spec/02-coding-guidelines/02-typescript/` |
| `EntityStatus` | `Active`, `Inactive`, `Draft`, `Archived` | `spec/02-coding-guidelines/02-typescript/` |

### Phase 2 — Remediate Tier 1 Files (~5 files, ~75 violations)

Replace all magic string comparisons with enum constants in the highest-impact files first.

### Phase 3 — Remediate Tier 2 Files (~8 files, ~50 violations)

### Phase 4 — Remediate Tier 3 Files (~15 files, ~40 violations)

### Phase 5 — Verification Scan

Run `=== '...'` pattern scan to confirm zero remaining domain status magic strings.

---

## Prevention and Non-Regression

### Prevention rule

All TypeScript spec code examples comparing status, phase, role, or categorical values MUST use enum constants from a defined enum type. Raw string literals are prohibited for domain status comparisons.

### Acceptance criteria / test scenarios

- [ ] Zero `status === 'string'` patterns for domain values in any TypeScript spec code example
- [ ] Each status domain has a corresponding enum definition in `spec/02-coding-guidelines/02-typescript/`
- [ ] Enum definitions include cross-language parity table with Go equivalents
- [ ] Master coding guidelines §8 updated to explicitly cover `=== 'string'` comparison pattern

### Guardrails or linting policies

Future scans should include regex: `=== ['"](?:active|inactive|pending|failed|completed|success|error|idle|loading|running|stopped|paused|ready|connected|disconnected|enabled|disabled|draft|published|archived)['"]`

### Spec sections updated

- `spec/11-spec-management-software/05-features/06-ai-integration/08-ai-chat-ui.md` — SlotStatus enum refs
- `spec/11-spec-management-software/05-features/25-ai-enhancements/05-03-message-display.md` — MessageStatus, ExecutionStatus enum refs
- `spec/11-spec-management-software/05-features/09-knowledge-memory/11-knowledge-memory-ui.md` — ExecutionStatus, ActivityType enum refs
- `spec/11-spec-management-software/05-features/03-project-management/02-import-export-ui.md` — ExportStatus enum refs
- `spec/11-spec-management-software/05-features/27-automation-pipeline/24-collaboration.md` — ParticipantStatus enum refs
- `spec/11-spec-management-software/05-features/27-automation-pipeline/10-react-flow-canvas.md` — ExecutionStatus enum refs
- `spec/11-spec-management-software/05-features/27-automation-pipeline/23-sharing.md` — InvitationStatus enum refs
- `spec/11-spec-management-software/05-features/27-automation-pipeline/33-branching-tests.md` — ExecutionStatus enum refs
- `spec/11-spec-management-software/05-features/27-automation-pipeline/34-parallel-execution-tests.md` — ExecutionStatus enum refs
- `spec/11-spec-management-software/05-features/27-automation-pipeline/20-import-export.md` — IssueSeverity enum refs
- `spec/11-spec-management-software/05-features/25-ai-enhancements/03-03-approval-workflow.md` — PlanStatus, StepStatus enum refs
- `spec/11-spec-management-software/05-features/25-ai-enhancements/02-04-voice-ui-components.md` — RecordingPhase enum refs
- `spec/11-spec-management-software/05-features/25-ai-enhancements/02-03-audio-sync.md` — SyncStatus enum refs
- `spec/11-spec-management-software/05-features/25-ai-enhancements/05-04-mode-selector.md` — RunStatus enum refs
- `spec/11-spec-management-software/05-features/06-ai-integration/09-instruction-builder-ui.md` — ExecutionStatus enum refs
- `spec/11-spec-management-software/05-features/06-ai-integration/14-telemetry-dashboard.md` — EventStatus enum refs
- `spec/11-spec-management-software/05-features/24-code-generation-system/32-url-context-system.md` — ActivityStatus enum refs
- `spec/11-spec-management-software/05-features/24-code-generation-system/29-long-chain-events.md` — StepStatus enum refs
- `spec/11-spec-management-software/05-features/05-voice-input/06-voice-session-manager.md` — SessionPhase, ConnectionStatus enum refs
- `spec/11-spec-management-software/05-features/05-voice-input/03-audio-player.md` — PlaybackStatus enum refs
- `spec/11-spec-management-software/08-roadmap-overview/05-gap-analysis.md` — IssueSeverity, ExecutionStatus, ConnectionStatus enum refs
- `spec/01-general-spec/09-api-integration/02-websocket-patterns-api-integration.md` — ConnectionStatus enum refs
- `spec/28-shared-cli-frontend/15-hooks-library.md` — ExecutionStatus enum refs
- `spec/20-gsearch-cli/02-frontend/05-ui-patterns.md` — ExecutionStatus enum refs
- `spec/30-wp-plugin/05-wp-plugin-publish/02-frontend/28-remote-plugins.md` — EntityStatus enum refs
- `spec/30-wp-plugin/05-wp-plugin-publish/02-frontend/24-error-console.md` — LogLevel enum refs
- `spec/30-wp-plugin/05-wp-plugin-publish/02-frontend/26-ui-patterns.md` — ExecutionStatus enum refs

---

## TODO and Follow-Ups

- [x] Create 5 domain enum spec files in `spec/02-coding-guidelines/02-typescript/`
- [x] Remediate Tier 1 files (~75 violations across 5 files)
- [x] Remediate Tier 2 files (~50 violations across 8 files)
- [x] Remediate Tier 3 files (~40 violations across ~15 files)
- [x] Update master coding guidelines §8 to cover `=== 'string'` pattern
- [x] Run verification scan to confirm zero remaining violations
- [x] Update master status and remediation protocol

---

## Done Checklist

- [x] Issue write-up created at `spec/61-how-app-issues-track/10-domain-status-magic-strings.md`
- [x] Relevant spec(s) updated with corrected behavior and constraints
- [x] Memory updated with summary and prevention rule
- [x] Acceptance criteria updated or added
- [x] Iterations recorded (if applicable)
