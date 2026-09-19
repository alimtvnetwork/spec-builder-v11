# Spec Repository — Full Audit Report

**Generated:** 2026-03-14  
**Version:** 1.0.0  
**Scope:** All files and folders under `spec/`

---

## 1. Drift Detection Results (Automated Scripts)

| Risk | Category | Status | Matches | Baseline |
|------|----------|--------|---------|----------|
| R1 | Raw SQL | ✅ Pass | 0 | 0 |
| R2 | Magic Strings | ✅ Pass | 0 | 0 |
| R3 | Seed Sync | ⚠️ Skip | N/A | `pkg/settings/keys.go` not found |
| R11 | `ctx` abbreviation | ✅ Pass | 0 | 0 |
| R12 | `fmt.Errorf` | ✅ Pass | 11 | 11 |
| R13 | Tuple returns | ✅ Pass | 1 | 1 |
| R14 | Raw `os.*` | ✅ Pass | 10 | 10 |
| R14b | `os.IsNotExist` | ✅ Pass | 0 | 0 |
| R15 | Boolean negation | ✅ Pass | 32 | 32 |
| R16 | Abbreviation casing | ✅ Pass | 0 | 0 |
| R16a | `interface{}` | ✅ Pass | 121 | 121 |
| R16b | `map[string]any` | ✅ Pass | 73 | 73 |

**Verdict:** All code-example drift checks are at baseline. R3 (seed sync) cannot run — source file missing from this repo (expected: spec-only repo).

---

## 2. File Naming Convention Violations

### 2.1 — Files missing numeric prefix (non-kebab-case or uppercase)

| # | File | Issue |
|---|------|-------|
| 1 | `02-spec/11-spec-management-software/05-features/SM-010-golang-backend-implementation.md` | Uppercase + non-standard prefix (`SM-010`) |
| 2 | `02-spec/01-general-spec/01-foundation/error-resolution/MOVED.md` | Uppercase `MOVED.md` |
| 3 | `02-spec/11-spec-management-software/05-features/05-voice-input/REFERENCE.md` | Uppercase `REFERENCE.md` |
| 4 | `02-spec/11-spec-management-software/05-features/22-golang-search-cli/REFERENCE.md` | Uppercase `REFERENCE.md` |
| 5 | `02-spec/11-spec-management-software/14-microservices/NEXUS-FLOW-REFERENCE.md` | Uppercase `NEXUS-FLOW-REFERENCE.md` |
| 6 | `02-spec/27-ai-bridge-cli/01-backend/voice/REFERENCE.md` | Uppercase `REFERENCE.md` |

### 2.2 — Files without numeric prefix

| # | File | Issue |
|---|------|-------|
| 1 | `02-spec/04-error-resolution/06-error-handling/go-delegation-fix.md` | Missing numeric prefix |
| 2 | `02-spec/04-error-resolution/07-error-modal/copy-formats.md` | Missing numeric prefix |
| 3 | `02-spec/04-error-resolution/07-error-modal/react-components.md` | Missing numeric prefix |
| 4 | `02-spec/04-error-resolution/08-logging-and-diagnostics/react-execution-logger.md` | Missing numeric prefix |
| 5 | `02-spec/04-error-resolution/08-logging-and-diagnostics/session-based-logging.md` | Missing numeric prefix |
| 6 | `02-spec/04-error-resolution/09-response-envelope/adr.md` | Missing numeric prefix |
| 7 | `02-spec/04-error-resolution/09-response-envelope/changelog.md` | Missing numeric prefix |
| 8 | `02-spec/04-error-resolution/09-response-envelope/configurability.md` | Missing numeric prefix |
| 9 | `02-spec/11-spec-management-software/06-error-management/error-code-registry.md` | Missing numeric prefix |
| 10 | `02-spec/11-spec-management-software/enum-consumer-checklist.md` | Missing numeric prefix + wrong location |
| 11 | `02-spec/03-error-code-registry/collision-resolution-summary.md` | Missing numeric prefix |
| 12 | `02-spec/03-error-code-registry/error-code-utilization-report.md` | Missing numeric prefix |
| 13 | `02-spec/03-error-code-registry/templates/error-codes.template.md` | Missing numeric prefix |
| 14 | `02-spec/34-wp-plugin/auto-update-301-redirect.md` | Missing numeric prefix |
| 15 | `02-spec/34-wp-plugin/database-snapshots.md` | Missing numeric prefix |
| 16 | `02-spec/34-wp-plugin/exam-manager/01-admin-backend/exam-questions-manager-full-spec.md` | Missing numeric prefix |
| 17 | `02-spec/34-wp-plugin/exam-manager/02-frontend/frontend-full-spec.md` | Missing numeric prefix |
| 18 | `02-spec/02-coding-guidelines/02-typescript/connection-status-enum.md` | Missing numeric prefix |
| 19 | `02-spec/02-coding-guidelines/02-typescript/entity-status-enum.md` | Missing numeric prefix |
| 20 | `02-spec/02-coding-guidelines/02-typescript/execution-status-enum.md` | Missing numeric prefix |
| 21 | `02-spec/02-coding-guidelines/02-typescript/export-status-enum.md` | Missing numeric prefix |
| 22 | `02-spec/02-coding-guidelines/02-typescript/http-method-enum.md` | Missing numeric prefix |
| 23 | `02-spec/02-coding-guidelines/02-typescript/message-status-enum.md` | Missing numeric prefix |
| 24 | `02-spec/02-coding-guidelines/02-typescript/type-safety-remediation-plan.md` | Missing numeric prefix |
| 25 | `02-spec/02-coding-guidelines/04-php/enums.md` | Missing numeric prefix |
| 26 | `02-spec/02-coding-guidelines/04-php/forbidden-patterns.md` | Missing numeric prefix |
| 27 | `02-spec/02-coding-guidelines/04-php/naming-conventions.md` | Missing numeric prefix |
| 28 | `02-spec/02-coding-guidelines/04-php/php-go-consistency-audit.md` | Missing numeric prefix |
| 29 | `02-spec/02-coding-guidelines/04-php/response-array-standard.md` | Missing numeric prefix |
| 30 | `02-spec/02-coding-guidelines/04-php/response-key-type-inventory.md` | Missing numeric prefix |

### 2.3 — Lettered sub-prefix pattern (`02a-`, `03b-`)

Non-standard numbering — should use sequential `02-`, `03-`, `04-` etc.

| # | File |
|---|------|
| 1 | `02-spec/11-spec-management-software/07-database-design/02a-migrations.md` |
| 2 | `02-spec/11-spec-management-software/07-database-design/02b-unified-schema.md` |
| 3 | `02-spec/11-spec-management-software/07-database-design/03a-relationships.md` |
| 4 | `02-spec/11-spec-management-software/07-database-design/03b-seed-data.md` |
| 5 | `02-spec/11-spec-management-software/08-roadmap-overview/02a-implementation-order-guide.md` |
| 6 | `02-spec/11-spec-management-software/08-roadmap-overview/02b-summary.md` |
| 7 | `02-spec/11-spec-management-software/10-research/01a-e2e-integration-tests.md` |
| 8 | `02-spec/11-spec-management-software/10-research/01b-llm-server-multi-model.md` |
| 9 | `02-spec/34-wp-plugin/exam-manager/01-admin-backend/split-spec/41a-test-spec-conditional-helpers.md` |
| 10 | `02-spec/34-wp-plugin/exam-manager/01-admin-backend/split-spec/41b-test-spec-file-loader.md` |
| 11 | `02-spec/34-wp-plugin/exam-manager/01-admin-backend/split-spec/41c-test-spec-feature-flags.md` |
| 12 | `02-spec/34-wp-plugin/exam-manager/01-admin-backend/split-spec/41d-test-spec-deadline-engine.md` |
| 13 | `02-spec/34-wp-plugin/exam-manager/01-admin-backend/split-spec/41e-test-spec-progress-calculation.md` |

---

## 3. Folder Structure Violations

### 3.1 — Top-level folder without numeric prefix

| Folder | Issue |
|--------|-------|
| `spec/shared-preset-data` | Missing numeric prefix (should be `{NN}-shared-preset-data`) |

### 3.2 — Subfolders without numeric prefix

Non-standard subfolder names (expected `{NN}-{name}` pattern):

| Folder | Issue |
|--------|-------|
| `02-spec/11-spec-management-software/api/` | Missing numeric prefix |
| `02-spec/11-spec-management-software/config/` | Missing numeric prefix |
| `02-spec/11-powershell-integration/examples/` | Missing numeric prefix |
| `02-spec/11-powershell-integration/schemas/` | Missing numeric prefix |
| `02-spec/11-powershell-integration/templates/` | Missing numeric prefix |
| `02-spec/03-error-code-registry/schemas/` | Missing numeric prefix |
| `02-spec/03-error-code-registry/scripts/` | Missing numeric prefix |
| `02-spec/03-error-code-registry/templates/` | Missing numeric prefix |
| `02-spec/25-gsearch-cli/configs/` | Missing numeric prefix |
| `02-spec/27-ai-bridge-cli/01-backend/voice/` | Missing numeric prefix |
| `02-spec/34-wp-plugin/exam-manager/` | Missing numeric prefix |
| `02-spec/34-wp-plugin/link-manager/` | Missing numeric prefix |
| `02-spec/34-wp-plugin/wp-plugin-publish/` | Missing numeric prefix |
| `02-spec/01-general-spec/01-foundation/error-resolution/` | Should be `{NN}-error-resolution/` |

### 3.3 — Missing `00-overview.md` (61 folders)

61 folders containing `.md` files lack the mandatory `00-overview.md` index file. Key offenders:

- All 11 subfolders of `02-spec/01-general-spec/`
- All 8 subfolders of `02-spec/04-error-resolution/`
- `02-spec/11-spec-management-software/api/`, `config/`, `01-ideas/`, `02-instructions/`
- `02-spec/11-powershell-integration/examples/`, `schemas/`, `templates/`
- `02-spec/03-error-code-registry/schemas/`, `scripts/`, `templates/`
- `02-spec/25-gsearch-cli/04-extensions/`

### 3.4 — Missing `99-consistency-report.md` (top-level folders)

| Folder |
|--------|
| `02-spec/01-general-spec/` |
| `02-spec/06-split-db-architecture/` |
| `02-spec/07-seedable-config-architecture/` |
| `02-spec/11-powershell-integration/` |
| `02-spec/03-error-code-registry/` |
| `02-spec/34-wp-plugin/` |
| `02-spec/60-ai-research/` |
| `02-spec/61-how-app-issues-track/` |
| `02-spec/02-coding-guidelines/01-cross-language/` |
| `02-spec/02-coding-guidelines/02-typescript/` |
| `02-spec/02-coding-guidelines/04-php/` |
| `02-spec/99-archive/` |
| `02-spec/shared-preset-data/` |

---

## 4. Summary Statistics

| Category | Count | Severity |
|----------|-------|----------|
| Drift detection failures (code examples) | 0 | ✅ Clean |
| R3 seed sync (skipped — no source file) | 1 | 🟡 N/A for spec repo |
| Uppercase/non-standard file names | 6 | 🔴 High |
| Files missing numeric prefix | 30 | 🔴 High |
| Lettered sub-prefixes (`02a-` style) | 13 | 🟠 Medium |
| Folders missing numeric prefix | 14 | 🟠 Medium |
| Top-level folder missing prefix | 1 | 🔴 High |
| Missing `00-overview.md` | 61 | 🟠 Medium |
| Missing `99-consistency-report.md` | 13 | 🟡 Low–Medium |
| **Total issues** | **139** | — |

---

## 5. Recommended Remediation Priority

1. **P0 — Rename uppercase files** (6 files): `MOVED.md`, `REFERENCE.md`, `SM-010-*.md` → lowercase kebab with numeric prefix
2. **P1 — Add numeric prefixes** to 30 unprefixed `.md` files (especially `02-spec/02-coding-guidelines/02-typescript/` and `02-spec/02-coding-guidelines/04-php/`)
3. **P1 — Rename lettered sub-prefixes** (`02a-` → `02-`, `03-`, etc.) in 13 files
4. **P2 — Add numeric prefix** to 14 subfolders and 1 top-level folder (`shared-preset-data`)
5. **P3 — Create missing `00-overview.md`** for 61 folders (batch-generate stubs)
6. **P3 — Create missing `99-consistency-report.md`** for 13 top-level folders
7. **P4 — Remove R3 seed sync script** from pre-commit (not applicable to spec-only repo)
