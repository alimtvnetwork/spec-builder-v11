# Issue #21: Residual Prefix Collisions from Legacy README Renames

**Version:** 1.0.0  
**Status:** ✅ Resolved  
**Updated:** 2026-03-15

---

## Issue Summary

### Symptoms
- `spec/02-coding-guidelines/02-typescript/` had two files with prefix `06-`: `06-message-status-enum.md` and `06-typescript-standards-reference.md`.
- `spec/02-coding-guidelines/04-php/` had two files with prefix `06-`: `06-response-key-type-inventory.md` and `06-php-standards-reference.md`.

### Discovery
- Found during P-052 full spec audit on 2026-03-15.

---

## Root Cause Analysis

### Direct Cause
Issue #19 (legacy README renames) assigned prefix `06-` to the renamed reference files without checking whether that prefix was already occupied by existing files in those folders.

### Contributing Factors
- The rename was performed via bulk operation without per-folder prefix availability checks.
- No automated collision detection was run after the rename.

---

## Fix Description

### Rules/Constraints Applied
1. Each numeric prefix within a folder MUST be unique.
2. Renamed files take the next available prefix.

### Changes Made

| Folder | Old Name | New Name |
|--------|----------|----------|
| `spec/02-coding-guidelines/02-typescript/` | `06-typescript-standards-reference.md` | `08-typescript-standards-reference.md` |
| `spec/02-coding-guidelines/04-php/` | `06-php-standards-reference.md` | `07-php-standards-reference.md` |

### Cross-References Updated
- 17 files updated for TypeScript reference rename.
- 15 files updated for PHP reference rename.
- **Total: 32 files.**

---

## Iterations History

| # | Action | Result |
|---|--------|--------|
| 1 | Detected 2 prefix collisions during P-052 audit | Collisions identified |
| 2 | Renamed files to next available prefixes | Collisions resolved |
| 3 | Bulk-updated all cross-references (32 files) | Zero broken links |
| 4 | Verified zero collisions across entire spec tree | Confirmed clean |

---

## Learning

Bulk rename operations MUST include a post-rename collision check per folder. Never assume prefix availability without verification.

## What Not to Repeat Again

- Do NOT assign prefixes during bulk renames without checking existing files in each target folder.
- Always run a collision scan after any rename operation.

---

## Prevention and Non-Regression

### Rule
After any file rename or creation, verify that no duplicate numeric prefixes exist within the same folder.

### Acceptance Criteria
- [x] Zero prefix collisions across entire spec tree
- [x] All 32 cross-references updated
- [x] Verified with full tree scan

---

## Done Checklist

- [x] Issue documented in `spec/61-how-app-issues-track/`
- [x] Files renamed with correct prefixes
- [x] All cross-references updated
- [x] Full tree scan confirms zero collisions
- [x] Suggestions tracker updated (C-068)

---

*Created 2026-03-15 — Issue #21 resolved. Residual prefix collisions from Issue #19 fixed.*
