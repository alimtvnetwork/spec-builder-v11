# Changelog


**Version:** 1.0.0  
**Last Updated:** 2026-03-20  

All notable changes to the spec-management-software documentation structure.

---

## [16.0.0] - 2026-03-09

### Global Version Bump

Project-wide major version increment (+1.0.0) applied to all ~357 specification files in `11-spec-management-software`.

#### Changed
- Every spec file across all subdirectories (00-master-index, 02-instructions, 03-project-overview, 04-coding-guidelines, 05-features/01–30, 06-error-management, 07-database-design, 08-roadmap, 09-diagrams, 10-research, 11-skipped, 12-prompts, 13-shared-packages, 14-microservices, 15-external-tools, 19-data-models, and root-level reports) received a major version bump.
- All `**Updated:**`, `**Last Updated:**`, and `**Generated:**` dates set to 2026-03-09.
- Part of a global effort spanning ~638 files across all 30+ spec folders, establishing a new project-wide versioning baseline.

---

## [15.0.1] - 2026-02-23

### Master Status & Cross-Reference Fixes

Patch release resolving two issues discovered during post-v15.0.0 validation.

### Fixed
- **Issue #04 — Stale wave count in master status** (`spec/61-how-app-issues-track/04-master-status-stale-wave-count.md`)
  - `.lovable/memories/workflow/03-master-status.md` reported 8/8 waves and v14.0.0 despite 11 waves and v15.0.0 being current
  - Updated to v12.0.0: wave count 11/11, Waves 9–11 added, Known Issues updated to v15.0.0
- **Issue #05 — Broken suggestion tracker reference** (`spec/61-how-app-issues-track/05-broken-suggestion-tracker-reference.md`)
  - Master status referenced nonexistent `.lovable/memories/suggestions/01-suggestions-tracker.md`
  - Corrected to `.lovable/memories/suggestions/README.md`

### Changed
- **`spec/61-how-app-issues-track/00-overview.md`** — Added Issue Index table documenting issues 03–05
- **`.lovable/memories/workflow/03-mistake-remediation-protocol.md`** — Added registry entries for issues 04 and 05

### Summary
- **Issues resolved:** 2 (master status accuracy + broken reference)
- **Files edited:** 3 (master status, overview index, remediation registry)
- **Broken links remaining:** 0 (confirmed via full ecosystem scan)

---

## [15.0.0] - 2026-02-22

### Memory Reference Validation & Issue Tracking System

Ecosystem-wide validation of `.lovable/memories/` references, fixing 15 broken links across two passes (v9.3.0 and v9.4.0). Established a systematic issue tracking and prevention workflow.

### Added
- **`spec/61-how-app-issues-track/`** — New issue tracking folder with 3 files:
  - `00-overview.md` — Folder index and workflow
  - `01-issue-template.md` — Standardized issue write-up template
  - `02-process-checklist.md` — Mandatory 4-step checklist after every fix
  - `03-broken-memory-references.md` — First tracked issue (15 broken memory refs)
- **`.lovable/memories/workflow/03-mistake-remediation-protocol.md`** — Memory for issue tracking with registry table

### Fixed
- **v9.3.0 — 7 broken memory references** across 7 spec files:
  - `standards/naming-convention-enforcement` (missing .md, nonexistent) → `style/naming-convention.md`
  - `technical/powershell-deployment-standard.md` (absolute path, nonexistent) → `50-powershell-integration/00-overview.md`
  - `technical/rag-architecture.md` → `technical/rag-chunk-configuration.md`
  - `technical/cli-frontend-standard.md` (×3 files) → `technical/frontend-ui-patterns.md`
  - `technical/seo-testing-infrastructure.md` → `technical/seo-openapi-specification.md`
  - `features/ai-bridge/rag-pipeline.md` → `features/ai-bridge/memory-classification.md`
- **v9.4.0 — 8 additional fixes** across 4 spec files:
  - `constraints/data-resilience.md` (nonexistent + absolute) → `constraints/validation-data-pattern.md`
  - `style/chat-ui.md` (nonexistent + absolute, ×2 files) → `ui/ai-chat-interface.md`
  - `constraints/file-operation-safety.md` (nonexistent, ×2 refs) → `constraints/error-management.md`
  - 3 absolute path corrections (`/` prefix → relative)

### Changed
- **`spec/99-consistency-report.md`** bumped v9.3.0 → v9.4.0
  - Added v9.3.0 memory ref fix table, v9.4.0 full validation table
  - Folder 22 added to structure compliance
  - Total spec folders: 19 → 20
- **`plan.md`** bumped to v15.0.0
  - Wave 11 added (memory reference validation)
  - Issue tracking system documented
  - Remediation waves: 10/10 → 11/11
- **`.lovable/memories/workflow/02-folder-conventions.md`** — Added folders 14–22 to root index

### Summary
- **Broken links fixed:** 15 (7 + 8 across two passes)
- **New files created:** 4 (issue tracking) + 1 (memory)
- **Spec files edited:** 14
- **Stale references remaining:** 0

---

## [9.1.0] - 2026-02-18

### Specification Enhancements

Two new specification documents improving editor reliability and error resilience.

### Added
- **`05-features/04-spec-editor/04-monaco-configuration.md`** (SM-021) - Monaco editor configuration
  - Editor selection matrix (Monaco for code, CodeMirror 6 for Markdown)
  - Language-specific overrides (JSON, Go, TypeScript, YAML)
  - Custom Monarch tokenizer for Go syntax highlighting
  - JSON schema validation integration
  - Diff editor configuration
  - MonacoWrapper React component specification
  - Performance mitigations for large files
  - Error codes 6010-6013
- **`05-features/13-error-ui/02-error-recovery-patterns.md`** (SM-022) - Error recovery patterns
  - Exponential backoff engine with jitter
  - Circuit breaker pattern (Closed → Open → Half-Open)
  - File save queue with conflict resolution
  - Offline resilience with IndexedDB sync queue
  - Optimistic update rollback
  - Graceful degradation tiers (Full → Degraded → Offline → Emergency)
  - Error recovery UI components
  - Error codes 6020-6027
  - 28 acceptance criteria

### Changed
- **`05-features/04-spec-editor/00-overview.md`** updated to v1.2.0 — added Monaco config reference
- **`05-features/13-error-ui/00-overview.md`** updated to v1.1.0 — added error recovery patterns reference

### Summary
- **New files:** 2 specification documents
- **Reliability improvement:** +0.5% (SM-021: +0.3%, SM-022: +0.2%)
- **New error codes:** 12 (6010-6013, 6020-6027)
- **Acceptance criteria:** 36 total (8 + 28)

---

## [9.0.0] - 2026-02-17

### Cross-Reference & Memory Remediation (v9.0.0)

Ecosystem-wide remediation of stale spec paths, duplicate folder conflicts, and memory file inconsistencies.

### Fixed
- **Stale cross-references in spec files** — `../spec-management-software/` → `../11-spec-management-software/` in 2 files (nexus-flow error codes, general-spec coding standards)
- **Orphan folder `03-shared-frontend-architecture/`** — merged v2.0.0 hooks library into canonical `28-shared-cli-frontend/15-hooks-library.md`, deleted orphan
- **gsearch-cli `03-extensions/` prefix collision** — renamed to `04-extensions/` to avoid conflict with `03-deploy/`
- **IX_ index prefix migration** — all `IX_` → `Idx` across 18 spec files (51 edits), confirmed 0 remaining functional occurrences
- **Stale paths in `.lovable/memories/`** — ~60 edits across 25 memory files fixing un-prefixed folder names (`spec/brun-cli/` → `spec/21-brun-cli/`, etc.)
- **Renamed `03-cw-config-architecture.md`** → `03-seedable-config-architecture.md` in memories/architecture

### Changed
- **`spec/99-consistency-report.md`** bumped to v9.0.0 — stale patterns section updated to show all resolved, success probability 99%
- **`spec/20-gsearch-cli/02-frontend/`** — 3 files updated to reference `28-shared-cli-frontend/` instead of deleted `03-shared-frontend-architecture/`
- **`.lovable/memories/training/06-ai-handoff-package.md`** — stale patterns table updated to show all resolved
- **`.lovable/memories/project/remediation-status.md`** — added Phase 7 (IX_→Idx) and Phase 8 (v9.0.0 cross-ref)
- **`.lovable/memories/workflow/implementation-strategy.md`** — added Wave 9 & 10, compliance stats updated to ≥95%

### Summary
- **Spec files edited:** 20
- **Memory files edited:** 25
- **Stale paths remaining:** 0
- **Consistency score:** 100/100

---

## [2.4.0] - 2026-01-30

### File Safety & Persistence Enhancements

Critical updates for data protection, file operation safety, and Lovable-style input persistence.

### Added
- **`05-features/02-file-management/05-external-file-safety.md`** - External file operation consent system
  - Type-to-confirm dialogs for external file operations
  - Danger level classification (None → Critical)
  - Audit logging for all external operations
  - Integration with AI Code Generation execution engine
- **`05-features/02-file-management/06-trash-system.md`** - Recoverable trash bin
  - Soft delete with 30-day retention
  - Restore from trash functionality
  - Metadata preservation (.meta files)
  - Auto-cleanup via retention policy
- **`05-features/03-project-editor/06-input-state-persistence.md`** - Lovable-style input persistence
  - Never-lose-input philosophy
  - Tiered storage (localStorage < 1KB, IndexedDB for larger)
  - Cross-project state management
  - Draft recovery banners

### Changed
- **`05-features/02-file-management/00-overview.md`** updated
  - Added External File Safety and Trash System components
  - Updated Key Features section
- **`05-features/07-history-system/01-git-integration.md`** updated
  - Move/Rename operations now trigger **immediate commits** (bypass debounce)
  - Added "Commit Required" column to Action Types table
  - Enables full reversibility via git revert

### Summary
- **New files:** 3 specification documents
- **Safety features:** Consent dialogs, trash bin, input persistence
- **Reversibility:** All moves/renames create instant Git commits

---

## [2.3.0] - 2026-01-30

### Automation Pipeline Specification Suite

Comprehensive expansion of the Automation Pipeline feature with integration specs and full E2E test coverage.

### Added
- **`05-features/27-automation-pipeline/28-res-integration.md`** - Resilient Execution System integration
  - Self-correction, multi-model consensus, checkpoint/rollback mechanisms
  - Database schema for RES configuration and execution logging
  - React components for configuration and live monitoring
- **`05-features/27-automation-pipeline/29-prompt-import-tests.md`** - 12 E2E test cases
- **`05-features/27-automation-pipeline/30-pipeline-creation-tests.md`** - 18 E2E test cases
- **`05-features/27-automation-pipeline/31-variable-resolution-tests.md`** - 16 E2E test cases
- **`05-features/27-automation-pipeline/32-stage-execution-tests.md`** - 20 E2E test cases
- **`05-features/27-automation-pipeline/33-branching-tests.md`** - 18 E2E test cases
- **`05-features/27-automation-pipeline/34-parallel-execution-tests.md`** - 16 E2E test cases

### Changed
- **`05-features/27-automation-pipeline/00-overview.md`** updated to v1.5.0
  - Added Integration Specifications section
  - Added E2E Test Specifications section (6 phase-based test files)
  - Added Architecture Reference link to `99-architecture-diagram.md`
  - Total specification files: 27 → 36
- **`.lovable/memories/features/automation-pipeline.md`** updated with full file count
- **`95-master-index.md`** updated to v2.3.0
  - Total files: 292+ → 328+
  - Feature specs: 140+ → 176+
  - Full 27-automation-pipeline section (36 files) indexed

### Verified
- All 36 automation-pipeline file references validated against filesystem
- Cross-references corrected for actual file names (01-24 core specs)

### Summary
- **New files:** 7 specification documents
- **E2E test cases:** 100 total across 6 test files
- **Coverage:** Phases 1-6 (Prompt Import → Parallel Execution)

---

## [2.2.0] - 2026-01-29

### .lovable Directory Consolidation

Consolidated all historical reports and planning documents into two archive files for cleaner project structure.

### Added
- **`.lovable/audit-history.md`** - Consolidated archive of 6 consistency reports
- **`.lovable/standards-archive.md`** - Consolidated archive of 4 planning documents

### Removed
- `.lovable/cleanup-report-2026-01-29.md` → archived
- `.lovable/consistency-audit-report.md` → archived
- `.lovable/consistency-check-report-2026-01-29.md` → archived
- `.lovable/diagram-consistency-report-2026-01-29.md` → archived
- `.lovable/final-consistency-check-2026-01-29.md` → archived
- `.lovable/final-consistency-report.md` → archived
- `.lovable/improvement-plan-94-to-99.md` → archived
- `.lovable/standardization-plan.md` → archived
- `.lovable/reviewer-feedback.md` → archived
- `.lovable/plan.md` → archived

### Result
- **Before:** 11 files in `.lovable/`
- **After:** 3 items (2 archive files + memories folder)
- **Reduction:** 10 individual files → 2 consolidated archives

---

## [2.1.0] - 2026-01-29

### Features Overview Update

Comprehensive update to the features overview with accurate file counts and implementation roadmap.

### Added
- **`09-diagrams/08-feature-dependency-diagram.md`** - Complete 25-feature Mermaid dependency graph
- **Implementation Priority** section in `05-features/00-overview.md` - 8-phase roadmap
- **File Distribution** table showing category breakdowns
- **Summary Statistics** section with totals

### Changed
- **`05-features/00-overview.md`** updated to v1.4.0
  - Feature folders: 24 → 25 (added 25-ai-enhancements)
  - Total files: 119 → 140+
  - Added accurate per-folder file counts
  - Linked to Feature Dependency Diagram
- **`09-diagrams/00-overview.md`** updated to v1.1.0
  - Diagram count: 8 → 10
  - Added 07-folder-structure-diagram.md
  - Added 08-feature-dependency-diagram.md
- **`99-consistency-report.md`** updated to v7.4.0
  - Total files scanned: 290+ → 292+
  - Diagram files section added
  - Cross-references: 3,200+ validated
- **`95-master-index.md`** updated to v2.1.0
  - Added Changelog section to Quick Navigation
  - Diagrams count: 8 → 10
  - Total files: 290+ → 292+

### Verified
- All 25 feature folders indexed
- All 10 diagram files indexed
- Cross-references validated across overview files

---

## [2.0.0] - 2026-01-29

### Major Restructuring Release

This release represents a comprehensive audit and restructuring of the entire specification system.

### Added
- **`01-ideas/06-golang-search-cli.md`** - Golang CLI search tool concept documentation
- **`api/types.ts`** - TypeScript API client types (918 lines, auto-generated from OpenAPI)
- **`05-features/25-ai-enhancements/`** - Complete AI enhancements directory (33 files)
  - Offline storage, voice resilience, plan mode, cross-project memory
  - Files numbered 00-32 following code-generation system convention
- **`09-diagrams/06-feature-dependency-graph.md`** - Feature dependency visualization
- **`09-diagrams/07-folder-structure-diagram.md`** - Mermaid folder structure diagram
- **`.lovable/consistency-check-report-2026-01-29.md`** - Audit trail documentation

### Changed
- **Master Index (`95-master-index.md`)** updated to v2.0.0
  - Total file count: 172+ → 290+
  - Ideas section: 7 → 8 files
  - Feature Specs: 75+ → 140+ files
  - CLI Tools: 35+ → 39 files
  - Code Generation: 17 → 34 files
  - Diagrams: 7 → 8 files
  - Prompts: 15 → 21 files
  - API: 1 → 2 files

### Fixed
- Restored missing `05-features/25-ai-enhancements/` directory to master index
- Corrected broken link to `09-diagrams/06-feature-dependency-graph.md`
- Fixed missing reference to `05-features/22-golang-search-cli/18-full-site-crawler.md`

### Verified
- 100% link validity across all 290+ indexed files
- All cross-references validated
- Numeric prefix conventions confirmed (00-32 for code-generation, 00-25 for features)

---

## [1.8.0] - 2026-01-28

### Added
- Initial consistency check framework
- Cross-reference validation system

### Changed
- Standardized file naming conventions across all directories

---

## [1.0.0] - 2026-01-15

### Initial Release
- Core folder structure established
- 22 feature specification folders created
- Master index and overview files initialized

---

## Versioning

This project follows [Semantic Versioning](https://semver.org/):
- **MAJOR**: Breaking structural changes
- **MINOR**: New sections or significant additions
- **PATCH**: Content updates and fixes
