# 03 — Broken Memory References

**Created:** 2026-02-22  
**Version:** 1.0.0  
**Status:** Resolved  
**Severity:** Medium

---

## Issue Summary

### What happened

15 cross-reference links from spec files to `.lovable/memories/` pointed to memory files that do not exist, were missing the `.md` extension, or used absolute paths instead of relative paths. Fixed across two passes: v9.3.0 (7 fixes) and v9.4.0 (8 fixes).

### Where it happened

- **Feature / Module:** Cross-reference integrity across spec ecosystem
- **File paths (v9.3.0 — 7 fixes):**
  1. `spec/20-gsearch-cli/01-backend/54-model-decomposition.md`
  2. `spec/26-ai-transcribe-cli/03-deploy/03-powershell-deployment.md`
  3. `spec/22-ai-bridge-cli/01-backend/51-vector-database-integration.md`
  4. `spec/20-gsearch-cli/02-frontend/05-ui-patterns.md`
  5. `spec/20-gsearch-cli/01-backend/49-testing-ui.md`
  6. `spec/20-gsearch-cli/01-backend/48-unified-rest-api.md`
  7. `spec/60-ai-research/00-overview.md`
- **File paths (v9.4.0 — 8 fixes):**
  8. `spec/11-spec-management-software/05-features/28-project-editor/06-input-state-persistence.md` (2 refs)
  9. `spec/11-spec-management-software/04-coding-guidelines/04-react-guidelines.md`
  10. `spec/11-spec-management-software/14-microservices/20-specmanager-openapi.md` (2 refs)
  11. `spec/11-spec-management-software/05-features/27-automation-pipeline/99-architecture-diagram.md`
  12. `spec/11-spec-management-software/04-coding-guidelines/06-eslint-enforcement.md`
  13. `spec/11-spec-management-software/02-instructions/01-file-naming-convention.md`

### Symptoms and impact

Spec files contained dead links to nonexistent memory files, reducing cross-reference reliability below 100%. Any AI agent or contributor following these links would fail to resolve the referenced content, leading to context loss and potential misinterpretation of standards.

### How it was discovered

A targeted scan for `.lovable/memories/` references across all 53 spec files containing such references (319 total matches) was run after the v9.2.0 cross-reference validation. Each referenced memory path was compared against the actual directory listing of `.lovable/memories/`.

---

## Root Cause Analysis

### Direct cause

Memory files were renamed, reorganized, or never created, but the spec files referencing them were not updated to match.

### Contributing factors

1. **No validation step for memory references** — previous cross-reference scans focused on spec-to-spec links but did not verify spec-to-memory links.
2. **Inconsistent naming** — some references used assumed filenames (e.g., `cli-frontend-standard.md`) that never matched actual memory filenames (e.g., `frontend-ui-patterns.md`).
3. **Missing `.md` extension** — one reference omitted the file extension entirely (`naming-convention-enforcement` instead of `naming-convention-enforcement.md`).
4. **Absolute path usage** — multiple references used a leading `/` (`/.lovable/memories/...`) instead of a relative path, which breaks resolution from the spec file's location. Found in 4 files during v9.4.0 scan.

### Triggering conditions

Occurs whenever a memory file is created, renamed, or reorganized without a corresponding update pass across all spec files that reference it.

### Why the existing spec did not prevent it

The cross-reference validation process (documented in `spec/99-consistency-report.md`) only covered spec-to-spec references. Memory references were treated as informational and were not included in the automated validation scope.

---

## Fix Description

### What was changed in the spec

All 15 broken references were corrected across two passes:

#### v9.3.0 — 7 fixes (nonexistent files, missing extension)

| File | Broken Reference | Corrected To |
|------|-----------------|--------------|
| `54-model-decomposition.md` | `standards/naming-convention-enforcement` | `style/naming-convention.md` |
| `03-powershell-deployment.md` | `/.lovable/memories/technical/powershell-deployment-standard.md` | `../../../50-powershell-integration/00-overview.md` |
| `51-vector-database-integration.md` | `technical/rag-architecture.md` | `technical/rag-chunk-configuration.md` |
| `05-ui-patterns.md` | `technical/cli-frontend-standard.md` | `technical/frontend-ui-patterns.md` |
| `49-testing-ui.md` | `technical/cli-frontend-standard.md` + `technical/seo-testing-infrastructure.md` | `technical/frontend-ui-patterns.md` + `technical/seo-openapi-specification.md` |
| `48-unified-rest-api.md` | `technical/cli-frontend-standard.md` | `technical/frontend-ui-patterns.md` |
| `60-ai-research/00-overview.md` | `features/ai-bridge/rag-pipeline.md` | `features/ai-bridge/memory-classification.md` |

#### v9.4.0 — 8 fixes (nonexistent files + absolute path corrections)

| File | Broken Reference | Corrected To | Issue Type |
|------|-----------------|--------------|------------|
| `28-project-editor/06-input-state-persistence.md` | `/.lovable/memories/constraints/data-resilience.md` | `.lovable/memories/constraints/validation-data-pattern.md` | Nonexistent + absolute path |
| `28-project-editor/06-input-state-persistence.md` | `/.lovable/memories/style/chat-ui.md` | `.lovable/memories/ui/ai-chat-interface.md` | Nonexistent + absolute path |
| `04-coding-guidelines/04-react-guidelines.md` | `/.lovable/memories/style/chat-ui.md` | `.lovable/memories/ui/ai-chat-interface.md` | Nonexistent + absolute path |
| `14-microservices/20-specmanager-openapi.md` (line 19) | `../.lovable/memories/constraints/file-operation-safety.md` | `../.lovable/memories/constraints/error-management.md` | Nonexistent |
| `14-microservices/20-specmanager-openapi.md` (line 2480) | `../.lovable/memories/constraints/file-operation-safety.md` | `../.lovable/memories/constraints/error-management.md` | Nonexistent |
| `27-automation-pipeline/99-architecture-diagram.md` | `/.lovable/memories/features/automation-pipeline.md` | `.lovable/memories/features/automation-pipeline.md` | Absolute path |
| `04-coding-guidelines/06-eslint-enforcement.md` | `/.lovable/memories/constraints/coding-guidelines.md` | `.lovable/memories/constraints/coding-guidelines.md` | Absolute path |
| `02-instructions/01-file-naming-convention.md` | `/.lovable/memories/spec-management/file-structure-conventions.md` | `.lovable/memories/spec-management/file-structure-conventions.md` | Absolute path |

### New rules or constraints added

1. **Memory references must be included in cross-reference validation scans** — not just spec-to-spec links.
2. **All file references must include the `.md` extension.**
3. **All file references must use relative paths** — never absolute paths starting with `/`.

### Why the fix resolves the root cause

By correcting all 15 links to existing files and adding memory references to the validation scope, future scans will catch any new broken memory links before they accumulate.

### Config changes or defaults affected

None.

### Logging or diagnostics required

None. The existing `lov-search-files` scan pattern (`\.lovable/memories/` across `spec/`) is sufficient for future validation.

---

## Iterations History

### Iteration 1 (v9.3.0)

- **What was tried:** Scanned all `spec/` files for `.lovable/memories/` backtick references and validated against actual memory directory listings.
- **Result:** Found and fixed 7 broken links (nonexistent files, missing `.md`, 1 absolute path). Believed scan was complete.

### Iteration 2 (v9.4.0)

- **What was tried:** Full validation scan including markdown link syntax `[text](path)` in addition to backtick references.
- **Result:** Found 8 additional issues: 5 nonexistent memory files and 3 absolute-path-only corrections. All fixed, bringing total to 15.
- **Why iteration 1 missed these:** The v9.3.0 scan focused on backtick-quoted references (`\`path\``) but did not check markdown link references (`[text](path)`), which use a different regex pattern.

---

## Prevention and Non-Regression

### Prevention rule

**Every cross-reference validation scan must include `.lovable/memories/` references in both backtick and markdown link formats.** When adding or modifying a memory reference in any spec file, verify the target file exists by checking the directory listing of the referenced memory subfolder.

### Acceptance criteria / test scenarios

1. Run `search spec/ for ".lovable/memories/"` — every matched path must resolve to an existing file.
2. Scan both backtick references and `[text](path)` link references.
3. No reference may omit the `.md` extension.
4. No reference may use an absolute path (starting with `/`).
5. After any memory file rename or deletion, a scan must confirm zero broken references.

### Guardrails or linting policies

- Include memory reference validation as a mandatory step in the cross-reference validation checklist (`spec/61-how-app-issues-track/02-process-checklist.md`).

### Spec sections updated

- `spec/99-consistency-report.md` — bumped to v9.3.0 then v9.4.0
- `spec/20-gsearch-cli/01-backend/54-model-decomposition.md` (line 657)
- `spec/26-ai-transcribe-cli/03-deploy/03-powershell-deployment.md` (line 16)
- `spec/22-ai-bridge-cli/01-backend/51-vector-database-integration.md` (line 778)
- `spec/20-gsearch-cli/02-frontend/05-ui-patterns.md` (line 312)
- `spec/20-gsearch-cli/01-backend/49-testing-ui.md` (lines 1212–1213)
- `spec/20-gsearch-cli/01-backend/48-unified-rest-api.md` (line 981)
- `spec/60-ai-research/00-overview.md` (line 142)
- `spec/11-spec-management-software/05-features/28-project-editor/06-input-state-persistence.md` (lines 495–496)
- `spec/11-spec-management-software/04-coding-guidelines/04-react-guidelines.md` (line 685)
- `spec/11-spec-management-software/14-microservices/20-specmanager-openapi.md` (lines 19, 2480)
- `spec/11-spec-management-software/05-features/27-automation-pipeline/99-architecture-diagram.md` (line 533)
- `spec/11-spec-management-software/04-coding-guidelines/06-eslint-enforcement.md` (line 15)
- `spec/11-spec-management-software/02-instructions/01-file-naming-convention.md` (line 193)

---

## TODO and Follow-Ups

- [x] All 15 references corrected (7 in v9.3.0 + 8 in v9.4.0)
- [x] Global consistency report updated to v9.4.0
- [x] Issue write-up created and updated with iterations
- [x] Memory updated with prevention rule

---

## Done Checklist

- [x] Issue write-up created at `spec/61-how-app-issues-track/03-broken-memory-references.md`
- [x] Relevant spec(s) updated with corrected references
- [x] Memory updated with summary and prevention rule
- [x] Acceptance criteria documented
- [x] Iterations recorded (2 iterations: v9.3.0 and v9.4.0)
