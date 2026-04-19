# Issue #19: Legacy README/readme Naming Convention Violation

**Version:** 1.0.0  
**Status:** ✅ Resolved  
**Updated:** 2026-03-15

---

## Issue Summary

### Symptoms
- 11 files across the spec tree used `README.md` or `readme.md` filenames instead of the required numeric-prefix lowercase kebab-case convention (`{NN}-{name}.md`).
- Inconsistency with the file naming standard at `spec/11-spec-management-software/02-instructions/01-file-naming-convention.md`.

### Discovery
- Identified during a comprehensive naming convention audit scan on 2026-03-15.
- Files existed in `spec/04-error-resolution/`, `spec/11-spec-management-software/`, `spec/20-gsearch-cli/`, `spec/30-wp-plugin/`, and `spec/24-26` standards folders.

---

## Root Cause Analysis

### Direct Cause
Files were created before the numeric-prefix naming convention was established, or were created using default README conventions without being migrated.

### Contributing Factors
- No automated enforcement of the naming convention during file creation.
- Legacy files from early project phases were not caught by previous audit waves.

### Spec Failure
The file naming convention spec existed but lacked enforcement tooling. Previous audits (Waves 1–11) focused on content violations rather than filename compliance.

---

## Fix Description

### Rules/Constraints Applied
1. All 11 README/readme files renamed to numeric-prefixed lowercase kebab-case.
2. ~60+ cross-references updated across the spec tree via `sed` batch processing.
3. Inventory tables in `00-overview.md` files synchronized with new filenames.

### Files Renamed

| Original | Renamed To | Location |
|----------|-----------|----------|
| `readme.md` | `02-error-handling-reference.md` | `spec/04-error-resolution/06-error-handling/` |
| `readme.md` | `03-error-modal-reference.md` | `spec/04-error-resolution/07-error-modal/` |
| `readme.md` | `04-response-envelope-reference.md` | `spec/04-error-resolution/09-response-envelope/` |
| `readme.md` | `01-apperror-reference.md` | `spec/04-error-resolution/10-apperror-package/` |
| `README.md` | `02-instructions-reference.md` | `spec/11-spec-management-software/02-instructions/` |
| `README.md` | `01-configs-reference.md` | `spec/11-spec-management-software/05-features/22-golang-search-cli/25-configs/` |
| `README.md` | `01-configs-reference.md` | `spec/20-gsearch-cli/06-configs/` |
| `README.md` | `03-ideas-reference.md` | `spec/30-wp-plugin/03-exam-manager/04-ideas/` |
| `readme.md` | `08-typescript-standards-reference.md` | `spec/02-coding-guidelines/02-typescript/` |
| `readme.md` | `04-golang-standards-reference.md` | `spec/02-coding-guidelines/03-golang/` |
| `readme.md` | `07-php-standards-reference.md` | `spec/02-coding-guidelines/04-php/` |

---

## Iterations History

| # | Action | Result |
|---|--------|--------|
| 1 | Scanned all spec folders for README/readme files | Found 11 violations |
| 2 | Renamed all 11 files to numeric-prefixed equivalents | All renamed successfully |
| 3 | Batch-updated ~60+ cross-references via sed | All references updated |
| 4 | Synchronized 00-overview.md inventory tables | Tables match new filenames |

---

## Prevention and Non-Regression

### Rule
All new files in `spec/` MUST use the `{NN}-{kebab-case-name}.md` naming convention. Uppercase filenames (`README.md`, `MOVED.md`) are prohibited.

### Acceptance Criteria
- [ ] `grep -ri "readme" spec/ --include="*.md" -l` returns 0 active README files (only references in changelogs/histories are acceptable)
- [ ] All `00-overview.md` inventory tables reference correct filenames

---

## TODO and Follow-ups

None — all 11 files renamed and cross-references validated.

---

## Done Checklist

- [x] Issue documented in `spec/61-how-app-issues-track/`
- [x] Affected specifications updated with corrected filenames
- [x] Cross-references validated (~60+ files)
- [x] 00-overview.md inventory tables synchronized
- [x] Memory updated (suggestions tracker, master status)

---

*Created 2026-03-15 — Issue #19 resolved. 11 legacy README files renamed, ~60+ cross-references updated.*
