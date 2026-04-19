# Suggestions Tracker

> **Version:** 26.0.0  
> **Updated:** 2026-04-01
> **Purpose:** Single consolidated tracker for all project suggestions  
> **Naming Convention:** Individual files use `YYYYMMDD-HHMMSS-suggestion-<slug>.md`

---

## 🚨 CRITICAL CONSTRAINT

**THIS IS A SPEC-ONLY REPOSITORY.** All suggestions must focus on specification improvements, not code implementation.

---

## Summary

| Status | Count |
|--------|-------|
| ✅ Completed | 83 |
| 📋 Pending | 2 |
| **Total** | 85 |

---

## 📋 Pending Suggestions

### P-084: Update spec/00-overview.md Health Dashboard

- **Created:** 2026-04-01
- **Priority:** Medium
- **Description:** Update the health dashboard file count in `spec/00-overview.md` to reflect the new `axios-version-control` module files (6 files added).
- **Acceptance Criteria:** Module file counts in dashboard match disk inventory.

### P-085: Run Cross-Reference Validation on Axios Module

- **Created:** 2026-04-01
- **Priority:** Low
- **Description:** Run cross-reference validation scan on `spec/10-app/axios-version-control/` to confirm all internal and external paths resolve correctly.
- **Acceptance Criteria:** Zero broken links in the axios-version-control module.

---

## ✅ Recently Completed Suggestions

### C-083: Axios Version Control — Acceptance Criteria for Package Safeguard ✅

Completed 2026-04-01. Added AC-006 through AC-011 to `spec/10-app/axios-version-control/97-acceptance-criteria.md` covering pinning syntax validation (AX-001), blocked version detection (AX-002), unapproved version warnings (AX-003), Dependabot/Renovate exclusion, and Husky pre-commit enforcement.

### C-082: Axios Version Control — Package.json Safeguard Spec ✅

Completed 2026-04-01. Created `spec/10-app/axios-version-control/03-package-json-safeguard.md` with strict pinning rules, version registry (Safe: 1.14.0, 0.30.3; Blocked: 1.14.1, 0.30.4), validation pseudocode for CI/Husky, and Dependabot/Renovate configuration exclusions.

### C-081: Axios Version Control — Drift Detection Script Spec ✅

Completed 2026-04-01. Created `spec/10-app/axios-version-control/02-drift-detection-script.md` defining requirements for `scripts/drift-detect-axios.sh` including detection rules AX-001 (range syntax), AX-002 (blocked versions), AX-003 (unapproved versions), Mermaid logic flow, and CI/Husky integration points.

### C-080: Final Cross-Reference Validation & Project Completion Summary ✅

Completed 2026-03-15. Ran final cross-reference validation scan across all 1,289 markdown files (4,516 links). Confirmed **zero actionable broken links** remain. Updated `spec/validation-reports/01-cross-reference-validation.md` to v8.0.0 with full remediation history (841 links fixed across 7 waves, 100% actionable remediation).

---

## ✅ Completed Suggestions (Full History)

| ID | Summary | Date Completed |
|----|---------|----------------|
| C-001 | Established standardized filesystem convention for tracking suggestions | 2026-01-31 |
| C-002 | Created 18 PHP entity models and 10 enums for Link Manager | 2026-01-31 |
| C-003 | Updated RAG System spec to Complete status with TypeScript interfaces | 2026-01-31 |
| C-004 | Updated reliability scores to 95%/97% after completing specs | 2026-01-31 |
| C-005 | Created guide for Link Manager separation | 2026-01-31 |
| C-006 | Fresh analysis of all specs; updated reliability report | 2026-01-31 |
| C-007 | Extracted Link Manager to self-contained folder | 2026-01-31 |
| C-008 | Completed fresh analysis; 95% success probability | 2026-01-31 |
| C-009 | Created 8-file AI Bridge specification | 2026-01-31 |
| C-010 | Created shared CLI frontend architecture specification (10 files) | 2026-02-01 |
| C-011 | Applied shared frontend spec to all 4 CLIs, updated consistency reports | 2026-02-01 |
| C-012 | Created GSearch implementation checklist | 2026-02-01 |
| C-013 | Updated central external tools consistency report to v2.0.0 | 2026-02-01 |
| C-014 | Registered 9xxx error range for AI Bridge with frontend sub-ranges | 2026-02-01 |
| C-015 | Created Split DB and Seedable Config shared architecture specs | 2026-02-01 |
| C-016 | Refined Split DB spec with concurrency, WAL mode, backup/recovery | 2026-02-01 |
| C-017 | Expanded Seedable Config theme system to 20+ themes | 2026-02-01 |
| C-018 | Created shared React component library spec | 2026-02-01 |
| C-019 | Created E2E test specifications for CLI frontends | 2026-02-01 |
| C-020 | Updated Split DB v2.0: multi-layer, zip import/export, logging | 2026-02-01 |
| C-021 | Renamed CW Config to Seedable Config Architecture | 2026-02-01 |
| C-022 | Created accessibility compliance spec (WCAG 2.1 AA) | 2026-02-01 |
| C-023 | Created visual regression testing spec (Storybook/Chromatic) | 2026-02-01 |
| C-024 | Renamed AI Bridge to AI Bridge CLI with new folder structure | 2026-02-01 |
| C-025 | Created comprehensive model management spec with 10 categories | 2026-02-01 |
| C-026 | Created Split DB integration spec for chat/RAG/file history | 2026-02-01 |
| C-027 | Created comprehensive API interface spec with 38 endpoints | 2026-02-01 |
| C-028 | Created complete frontend architecture spec with 10 pages | 2026-02-01 |
| C-029 | Reorganized all spec folders with numbered prefixes (01-13) | 2026-02-01 |
| C-030 | Renamed cw-config-architecture to seedable-config-architecture | 2026-02-01 |
| C-031 | Merged ai-bridge and ai-bridge-cli into single 22-ai-bridge-cli folder | 2026-02-01 |
| C-032 | Added 01-backend, 02-frontend, 03-deploy subfolders to all CLIs | 2026-02-01 |
| C-033 | Created shared hooks library spec | 2026-02-01 |
| C-034 | Moved GSearch CLI files to proper subfolders (25 files) | 2026-02-01 |
| C-035 | Moved BRun CLI files to proper subfolders (17 files) | 2026-02-01 |
| C-036 | Moved Nexus Flow CLI files to proper subfolders (7 files) | 2026-02-01 |
| C-037 | Created Nexus Flow deploy specs (PowerShell + deployment guide) | 2026-02-01 |
| C-038 | Fixed old cross-references in 8+ key spec files | 2026-02-01 |
| C-039 | Refreshed reliability report to v10.0.0 with consolidated memory | 2026-02-01 |
| C-040 | Updated memory README with explicit NO IMPL constraint | 2026-02-01 |
| C-041 | Created CLI error code summary memory file | 2026-02-01 |
| C-042 | Fixed stale cross-references in consistency reports | 2026-02-01 |
| C-043 | Updated plan.md v9.0.0 with completed migration tasks | 2026-02-01 |
| C-044 | Created BRun CLI implementation checklist | 2026-02-01 |
| C-045 | Created AI Bridge CLI implementation checklist | 2026-02-01 |
| C-046 | Created Nexus Flow CLI implementation checklist | 2026-02-01 |
| C-047 | Fixed stale cross-references in WP Plugin Builder (7 files) | 2026-02-02 |
| C-048 | Fixed stale cross-references in Seedable Config Architecture | 2026-02-02 |
| C-049 | Created consolidated AI training package | 2026-02-02 |
| C-050 | Created debugging cheat sheet | 2026-02-04 |
| C-051 | Created cross-reference diagram | 2026-02-04 |
| C-052 | Promoted error-resolution to root-level spec with debugging guides | 2026-02-04 |
| C-053 | Wave 7: AI Bridge naming & type-safety remediation (~944 violations) | 2026-02-07 |
| C-054 | Wave 8a: Shared Packages strong typing remediation | 2026-02-08 |
| C-055 | Wave 8b: Automation Pipeline strong typing remediation | 2026-02-08 |
| C-056 | Wave 8c: Nexus Flow CLI strong typing remediation (4 files) | 2026-02-08 |
| C-057 | Wave 8d: GSearch CLI strong typing remediation (6 files) | 2026-02-09 |
| C-058 | Wave 8e: WordPress Plugins strong typing remediation (21 files) | 2026-02-09 |
| C-059 | Wave 8f: General Spec + Remaining strong typing remediation (12 files) | 2026-02-09 |
| C-060 | Wave 8g: IdxPascalCase index rename across all silos (~1,774 occurrences, 35+ files) | 2026-02-09 |
| C-061 | Wave 8h: Final verification grep — 0 remaining idx_[a-z] violations | 2026-02-09 |
| C-062 | P-050: Applied UI Patterns to existing frontend components | 2026-02-09 |
| C-063 | P-051: Created shared useLocalStorageForm hook specification | 2026-02-09 |
| C-064 | Renamed 11 legacy README/readme files to numeric-prefixed equivalents | 2026-03-15 |
| C-065 | Created root spec/00-overview.md master index (30 modules, 6 categories) | 2026-03-15 |
| C-066 | Added Mermaid dependency diagram to spec/00-overview.md | 2026-03-15 |
| C-067 | Added critical path analysis to spec/00-overview.md | 2026-03-15 |
| C-068 | P-052: Full spec audit — 100/100, 2 prefix collisions fixed | 2026-03-15 |
| C-069 | Added module health dashboard to spec/00-overview.md | 2026-03-15 |
| C-070 | Created spec/validation-reports/ with all 6 audit reports | 2026-03-15 |
| C-071 | Wave 1 broken link remediation — 340 fixes | 2026-03-15 |
| C-072 | Wave 2 broken link remediation — 119 fixes | 2026-03-15 |
| C-073 | Wave 3 broken link remediation — 318 fixes | 2026-03-15 |
| C-074 | Memory & status update for Wave 4 results | 2026-03-15 |
| C-075 | Wave 4 broken link cleanup — 18 fixes | 2026-03-15 |
| C-076 | Wave 5 test spec placeholders — 18 files created | 2026-03-15 |
| C-077 | Wave 6 API path corrections — 4 fixes | 2026-03-15 |
| C-078 | Final validation scan — 3 path corrections | 2026-03-15 |
| C-079 | Trigger-event-system placeholders — 17 files created, 100% remediation | 2026-03-15 |
| C-080 | Final cross-reference validation & project completion summary | 2026-03-15 |
| C-081 | Axios version control — drift detection script spec | 2026-04-01 |
| C-082 | Axios version control — package.json safeguard spec | 2026-04-01 |
| C-083 | Axios version control — acceptance criteria for package safeguard | 2026-04-01 |

---

## Statistics

| Metric | Value |
|--------|-------|
| Total Pending | 2 |
| Completed Total | 83 |
| Last Updated | 2026-04-01 |

---

## Suggestion Workflow

### Adding New Suggestions
1. **Preferred:** Add directly to this file in Pending section
2. **Alternative:** Create individual file: `YYYYMMDD-HHMMSS-suggestion-<slug>.md`

### Completing Suggestions
1. Update status to `done` in tracker
2. Move summary to Completed section
3. Optionally create archive: `completed/C-XXX-<slug>.md`

---

*Updated 2026-04-01 — C-081–C-083 completed (Axios version control specs). 2 pending (P-084, P-085). 83 total completed.*
