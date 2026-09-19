# Memory: done/2026-03-30-spec-and-memory-overhaul

**Updated:** 2026-03-30  
**Version:** 1.0.0  
**Status:** Done

---

## Overview

Summary of all changes made on 2026-03-30 across the spec authoring guide, coding guidelines, and memory folder restructuring.

---

## 1. Spec Authoring Guide (`02-spec/05-spec-authoring-guide/`)

### `00-overview.md` → v2.0.0

- **AI Confidence Score** — Added tiered label system: Low / Medium / High / Production-Ready
- **Ambiguity Score** — Added tiered label system: None / Low / Medium / High / Critical
- **Keywords section** — Searchable tags for AI discoverability
- **File Categories table** — Every spec file categorized (Overview, Architecture, API, Logic, UI, Backend, Diagrams, Testing, Meta)
- **Folder structure examples** — Three patterns documented: flat module, CLI 3-folder, WP plugin multi-layer (admin/frontend/backend/diagrams)
- **Files table** — Added Category column; included missing files (`08-typescript-standards-reference.md`, `97-acceptance-criteria.md`)
- **Cross-reference validation checklist** — 7-point validation rules
- **Reliability Check Report** — Documented when and how to create reliability assessments
- **`.lovable/` folder section** — Expanded with task tracking folders, consolidation rule, "Where AI Should Write" routing table
- **Quick Start for AI Agents** — 9-step onboarding checklist

### `03-required-files.md`

- Updated scoring fields to use tiered labels instead of percentages
- Added Keywords/Categories block to the template

### `06-memory-folder-guide.md` → v2.0.0

- Added `planned/`, `done/`, `completed-issues/`, `reports/` folders to tree
- Expanded categories table with 12 entries (up from 7)
- Added Task & Issue Tracking section with lifecycle workflow diagram
- Added consolidation rule: single `.lovable/memories/` folder, `memory/` prohibited

### `99-consistency-report.md` → v2.0.0

- Updated to reflect new overview structure and scoring system

---

## 2. Coding Guidelines (`02-spec/02-coding-guidelines/`)

### Cross-Language: `06-cyclomatic-complexity.md`

- **C# example** (line 70): `!order.IsVerified` → `order.IsUnverified` with comment about dual accessors
- **C# example**: Added named boolean variables (`isItemListEmpty`, `hasExcessiveItems`, `isStatusMismatch`) with blank lines before `if`
- **PHP example** (line 147): `$hasNoFile` → `$isUploadFileMissing` with comment about positive naming
- **PHP example**: Added blank lines before all `if` statements
- **Go example** (line 227): `!order.IsVerified` → `order.IsUnverified()` with comment about dual accessors
- **Go example**: Added named booleans (`isItemListEmpty`, `hasExcessiveItems`, `isStatusMismatch`)
- **TypeScript example**: Added blank line before `if` and comment about positive naming

### TypeScript: `07-type-safety-remediation-plan.md` → v2.0.0

- All string union types → proper enums with `Type` suffix and PascalCase values
- `E2E` → `E2e` (last letter lowercase)
- `const enum` → regular `enum` for runtime values
- `RawEnvelope<T = unknown>` → `RawEnvelope<T>` with no default; explicit rule against `unknown`/`any` as T
- `Record<string, unknown>` → typed metadata interfaces per activity type
- All interface properties → `readonly`
- Enum values all PascalCase (e.g., `"Connected"` not `"connected"`)

### TypeScript: `08-typescript-standards-reference.md`

- Rule 3.3: String union type aliases now forbidden; proper enums required with example

### TypeScript: `00-overview.md` → v2.0.0

- Added AI Confidence, Ambiguity, Keywords, file categories, cross-references
- Added missing files to inventory

### TypeScript: `99-consistency-report.md` → v3.0.0

- Added cross-reference validation, recent changes log

---

## 3. Memory Folder Restructuring

### Legacy folder deleted

- `.lovable/memory/` deleted (contents already migrated to `.lovable/memories/`)

### New folders created

- `.lovable/memories/planned/` — Queued tasks for future execution
- `.lovable/memories/done/` — Completed tasks archive
- `.lovable/memories/completed-issues/` — Resolved issues archive

### `00-memory-index.md` → v2.0.0

- Registered `planned/`, `done/`, `completed-issues/`, `reports/` folders
- Updated summary table: 24 folders, ~178 files

### Stale reference cleanup

- Fixed 89 references to `.lovable/memory/` → `.lovable/memories/` across 8 files:
  - `plan.md`
  - `02-spec/61-how-app-issues-track/05-broken-suggestion-tracker-reference.md`
  - `02-spec/61-how-app-issues-track/06-broken-plan-md-references.md`
  - `02-spec/11-spec-management-software/98-changelog.md`
  - `02-spec/11-spec-management-software/05-features/30-ai-bridge/07-ai-suggestions-persistence.md`
  - `02-spec/11-spec-management-software/05-features/30-ai-bridge/08-ai-suggestions-filesystem-persistence.md`
- 15 remaining mentions are intentional (consolidation rules documenting the prohibition)

---

## 4. Audits Performed

| Audit | Scope | Result |
|-------|-------|--------|
| Boolean negatives in coding guidelines | All `✅ CORRECT` code examples | Fixed 4 violations in cyclomatic complexity |
| String union types in TypeScript guidelines | 8 files | Fixed 1 violation in standards reference |
| String unions in cross-language guidelines | 15 files | ✅ Clean — all in `❌ FORBIDDEN` examples |
| String unions in Go guidelines | All files | ✅ Clean |
| String unions in PHP guidelines | All files | ✅ Clean |
| String unions in Rust guidelines | All files | ✅ Clean |
| Stale `.lovable/memory/` references | Entire project | Fixed all 89 → 0 active stale refs |

---

## Cross-References

| Reference | Location |
|-----------|----------|
| Spec Authoring Guide | `02-spec/05-spec-authoring-guide/00-overview.md` |
| Cyclomatic Complexity | `02-spec/02-coding-guidelines/01-cross-language/06-cyclomatic-complexity.md` |
| Type Safety Plan | `02-spec/02-coding-guidelines/02-typescript/07-type-safety-remediation-plan.md` |
| Memory Index | `.lovable/memories/00-memory-index.md` |
| Memory Folder Guide | `02-spec/05-spec-authoring-guide/06-memory-folder-guide.md` |
