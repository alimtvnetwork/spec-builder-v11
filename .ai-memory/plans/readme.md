# Master Plans Index

> **Directory:** `.ai-memory/plans/`  
> **Status:** 5 Active Pending Plans, 2 Subtasks, 3 Completed Archives

---

## Active Pending Plans

| # | Slug | Priority | Description | Subtasks |
|---|------|----------|-------------|----------|
| 01 | [01-sm010-golang-backend.md](./pending/01-sm010-golang-backend.md) | High | Implement Golang Backend (downstream repo task SM-010) | `subtasks/01-sm010/` |
| 02 | [02-extract-reusable-chrome-pill-component.md](./pending/02-extract-reusable-chrome-pill-component.md) | Medium | Extract reusable `<ChromePill>` component in dashboard | None |
| 03 | [03-apply-pill-pattern-sidebar-dashboard.md](./pending/03-apply-pill-pattern-sidebar-dashboard.md) | Low | Extend Poppins discrete pill pattern to search and topbar | None |
| 04 | [04-update-health-dashboard-file-counts.md](./pending/04-update-health-dashboard-file-counts.md) | Medium | Update `02-spec/00-overview.md` for `02-spec/10-app/` file count (P-084) | None |
| 05 | [05-validate-axios-module-cross-refs.md](./pending/05-validate-axios-module-cross-refs.md) | Low | Validate internal links in `axios-version-control` (P-085) | None |

---

## Subtasks

| Subtask | Parent Plan | Batch Scope | Description |
|---------|-------------|-------------|-------------|
| [01-sqlite-setup.md](./subtasks/01-sm010/01-sqlite-setup.md) | `01-sm010-golang-backend` | 5 files | 4-tier SQLite connection & embedded seeding |
| [02-rest-endpoints.md](./subtasks/01-sm010/02-rest-endpoints.md) | `01-sm010-golang-backend` | 5 files | REST API routes and error response envelope |

---

## Completed Plans Archive

| Plan | Completed Date | Scope | Description |
|------|----------------|-------|-------------|
| [01-axios-version-control-specs.md](./completed/01-axios-version-control-specs.md) | 2026-04-01 | 6 files | Strict pinning policy & drift detection specs |
| [02-code-block-toolbar-redesign.md](./completed/02-code-block-toolbar-redesign.md) | 2026-04-19 | UI + spec | Discrete-pill pattern with Poppins button labels |
| [03-spec-builder-restructure-and-sync.md](./completed/03-spec-builder-restructure-and-sync.md) | 2026-09-19 | System-wide | Spec restructuring (02-spec), toolchain sync, and UI compatibility |
| [04-spec-audit-and-error-management-modernization.md](./completed/04-spec-audit-and-error-management-modernization.md) | 2026-09-19 | Folders 21–60 (290 files) | Spec audit & error management modernization to canonical `appfault` architecture |
| [05-compact-type-extraction-and-ai-audit.md](./completed/05-compact-type-extraction-and-ai-audit.md) | 2026-09-19 | Repository-wide (133 files) | Compact type extraction (`SearchResultSlice`), `ResultSlice[T]` conversion, and AI perspective audit |
| [06-compact-type-extraction-and-ai-audit-enhancement.md](./completed/06-compact-type-extraction-and-ai-audit-enhancement.md) | 2026-09-19 | Folders 21–60 (174 files) | Repository-wide compact type extraction (340+ signatures), elimination of generic brackets, and AI audit v2.0 |
| [06-guidelines-sync-and-index-to-readme-migration.md](./completed/06-guidelines-sync-and-index-to-readme-migration.md) | 2026-09-25 | Folders 01–20 + Repo-wide | Coding guidelines sync from upstream, index-to-readme migration across all folders, theme tester, and v3.18.0 release |
