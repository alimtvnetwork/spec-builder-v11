# Spec Consistency Improvement Plan

**Version:** 2.0.0  
**Created:** 2026-02-11  
**Status:** ✅ Complete — All 10 batches done  
**Method:** Deep audit across 400+ spec files, 55 audit files, 17 memory/tracking files

---

## 🚨 CRITICAL CONSTRAINT

**THIS IS A SPEC-ONLY REPOSITORY.** All phases below produce spec/doc changes only.

---

## Completed Phases (v1.0.0)

All 6 original phases completed 2026-02-12. See git history for full details.

| Phase | Description | Status |
|-------|-------------|--------|
| 1 | Stale Enum v2.0.0 References | ✅ Done |
| 2 | Stale Cross-References (Non-Numbered Paths) | ✅ Done |
| 3 | `interface{}`/`map[string]any` Residual Violations | ✅ Done |
| 4 | `database/sql` Raw Usage Residuals | ✅ Done |
| 5 | Table Naming Convention Conflict | ✅ Done |
| 6 | Dashboard & Tracker Staleness | ✅ Done |

---

## Active Phase: Resequencing (v2.0.0)

### Summary

Insert `spec/05-spec-authoring-guide/` as a new module. All existing modules at prefix 08+ shift by +1. This requires renaming 23 folders and updating ~834 cross-reference files across spec, memories, dashboard code, and generated data.

**Renames must proceed from HIGHEST to LOWEST** to avoid prefix collisions.

---

### Resequencing Map

| Current | New | Module Name | Cross-Ref Files |
|---------|-----|-------------|-----------------|
| 42-time-log-combined | 42-time-log-combined | Time Log Combined | ~2 |
| 41-time-log-ui | 41-time-log-ui | Time Log UI | ~12 |
| 40-time-log-cli | 40-time-log-cli | Time Log CLI | ~23 |
| 23-ai-bridge-non-vector-rag | 23-ai-bridge-non-vector-rag | Non-Vector RAG | ~8 |
| 52-shared-preset-data | 52-shared-preset-data | Shared Preset Data | ~9 |
| 08-generic-enforce | 08-generic-enforce | Generic Enforce | ~17 |
| 53-e2-activity-feed | 53-e2-activity-feed | E2 Activity Feed | ~12 |
| 51-upload-scripts | 51-upload-scripts | Upload Scripts | ~11 |
| 33-wp-plugin-development | 33-wp-plugin-development | WP Plugin Dev | ~17 |
| 61-how-app-issues-track | 61-how-app-issues-track | Issue Tracking | ~53 |
| 32-wp-seo-publish-cli | 32-wp-seo-publish-cli | WP SEO Publish | ~25 |
| 28-shared-cli-frontend | 28-shared-cli-frontend | Shared CLI Frontend | ~66 |
| 27-license-manager | 27-license-manager | License Manager | ~12 |
| 04-error-resolution | 04-error-resolution | Error Resolution | ~68 |
| 60-ai-research | 60-ai-research | AI Research | ~14 |
| 26-ai-transcribe-cli | 26-ai-transcribe-cli | AI Transcribe | ~38 |
| 25-spec-reverse-cli | 25-spec-reverse-cli | Spec Reverse | ~20 |
| 31-wp-plugin-builder | 31-wp-plugin-builder | WP Plugin Builder | ~30 |
| 30-wp-plugin | 30-wp-plugin | WP Plugin | ~63 |
| 24-nexus-flow-cli | 24-nexus-flow-cli | Nexus Flow | ~42 |
| 22-ai-bridge-cli | 22-ai-bridge-cli | AI Bridge | ~140 |
| 21-brun-cli | 21-brun-cli | BRun CLI | ~52 |
| 20-gsearch-cli | 20-gsearch-cli | GSearch CLI | ~101 |

---

### Batch Plan (5+ Folders per Step)

#### Batch 1 ✅ (DONE): Create `05-spec-authoring-guide/`
- Created 10 files in `spec/05-spec-authoring-guide/`
- No renames needed yet

#### Batch 2 ✅ (DONE): Rename folders 35→36, 34→35, 33→34, 32→33, 31→32, 30→31
- **Folders:** 6 renames completed
- **Cross-refs:** 102 references updated via sed (reverse-order to prevent collisions)
- **Verified:** 0 stale references remaining

#### Batch 3 ✅ (DONE): Rename folders 29→30, 28→29, 27→28, 22→23, 20→21
- **Folders:** 5 renames completed
- **Cross-refs:** 218 references updated via sed (reverse-order)
- **Verified:** 0 stale references remaining

#### Batch 4 ✅ (DONE): Rename folders 19→20, 18→19, 17→18, 16→17, 15→16
- **Folders:** 5 renames completed
- **Cross-refs:** 474 references updated via sed (reverse-order)
- **Verified:** 0 stale references remaining

#### Batch 5 ✅ (DONE): Rename folders 14→15, 13→14, 12→13, 11→12, 10→11
- **Folders:** 5 renames completed
- **Cross-refs:** 700 references updated via sed (reverse-order)
- **Verified:** 0 stale references remaining

#### Batch 6 ✅ (DONE): Rename folders 09→10, 08-gsearch→09
- **Folders:** 2 renames completed
- **Cross-refs:** 390 references updated via sed (reverse-order)
- **Verified:** 0 stale references remaining

#### Batch 7 ✅ (DONE): Update master files
- `spec/00-overview.md` — Updated to v34.0.0: all module numbers, mermaid diagram, health dashboard, tree stats (35 modules)
- `spec/00-folder-structure-guideline.md` — Updated to v6.0.0: folder tree, number ranges, new module 08
- `spec/02-prefix-disambiguation.md` — Updated to v3.0.0: added full resequencing table
- `spec/99-consistency-report.md` — Updated to v3.0.0: 33 subfolders inventory
- `spec/05-spec-authoring-guide/01-folder-structure.md` — Already accurate (created with new numbers)

#### Batch 8 ✅ (DONE): Update memory files
- Most memory files were already updated by sed in batches 2–6 (which scoped `.lovable/`)
- Fixed 3 remaining stale references in audit/historical files
- **Verified:** 0 stale references remaining across all `.lovable/` files

#### Batch 9 ✅ (DONE): Update dashboard code + regenerate data
- `scripts/generate-dashboard-data.cjs` — Updated CLI_MODULE_MAP with new prefixes (09-31)
- `src/components/dashboard/SpecFileViewer.tsx` — All module paths shifted +1, added 08-spec-authoring-guide, fixed pre-existing path mismatches (02-error-resolution→18, 03-shared-cli-frontend→20, 23-coding-guidelines→03)
- `spec/03-error-code-registry/error-codes-master.json` — Fixed WPP/EQM subfolder paths
- Regenerated `dashboard-data.json`: 1523 specs, 32 modules, 100/100 A+, 0 broken links
- **All 25 tests pass**

#### Batch 10 ✅ (DONE): Final validation
- Link scanner: 0 broken links confirmed
- Health dashboard: all 31 scored modules at 100/100 A+
- Module count: 32 (was 31, +1 for spec-authoring-guide)
- Test suite: 25/25 passing

---

### Risk Mitigation

1. **Rename highest-first** to prevent prefix collisions
2. **Script-based cross-ref updates** using sed/grep for reliability
3. **Validate after each batch** with link scanner
4. **Consistency reports** updated as part of the batch that renames the folder

---

### Estimated Effort

| Batch | Folders | Cross-Ref Files | Complexity |
|-------|---------|-----------------|------------|
| 1 | 0 (create) | 0 | ✅ Done |
| 2 | 6 | ~71 | Low |
| 3 | 5 | ~118 | Medium |
| 4 | 5 | ~198 | Medium-High |
| 5 | 5 | ~295 | High |
| 6 | 2 | ~153 | Medium |
| 7 | 0 | ~5 master files | Low |
| 8 | 0 | ~5 memory files | Low |
| 9 | 0 | ~3 code files | Low |
| 10 | 0 | Validation only | Low |
| **Total** | **23** | **~834** | — |

---

## What This Plan Does NOT Cover

- **Implementation code** — specs only (Health Dashboard UI is the sole code-bearing exception)
- **New features** — no new specs
- **Archive files** (`spec/99-archive/`) — intentionally frozen

---

## Active Track: Health Dashboard UI Polish (v3.0.0)

**Started:** 2026-04-19

### ✅ Done
- Text selection (`::selection`) styling per visual rendering guide
- Code block syntax highlight + line numbers + copy button
- Table of Contents scroll-spy + auto-scroll
- Code block toolbar redesign — 5 discrete pill groups, Poppins, `py-[3px]`, `h-3 w-3` icons (image-17 reference)
- Chrome-pill pattern propagated to file-viewer header + TOC (`SpecBrowser.tsx`)
- Spec authored: `spec/11-spec-management-software/05-features/04-spec-editor/04-code-block-component.md` v2.1.0 (incl. Section 12 chrome-wide application)
- Memory pattern documented: `.lovable/memory/style/chrome-pill-pattern.md`

### ⏳ Pending
- Extract reusable `<ChromePill>` + `<ChromePillGroup>` to `src/components/ui/chrome-pill.tsx`
- Apply pill pattern to sidebar search + dashboard top-bar action buttons
- Keyboard shortcuts (c/d/t/f/+/-) with ⌘K-style help overlay
- Focus-visible ring + arrow-key nav for segmented A-/A/A+ pill (a11y)
- End-to-end visual verification: open spec with tree/typescript/json/plain-text code blocks; toggle TOC; confirm pill consistency

---

## Active Track: Release-Pinned Installer (v4.0.0)

**Started:** 2026-04-21
**Spec:** `spec/51-upload-scripts/06-release-version-installer.md` (v1.0.0, draft)
**Memory:** `mem://features/installer/release-version-pinned`

### Goal
Add a second installer pair (`release-version.ps1` / `release-version.sh`) that ships per-release as a GitHub Release asset and is hard-locked to the tag it was built for. The existing `install.ps1` / `install.sh` remain the general/dev installer.

### Decisions (locked)
- **Version source:** parsed from a build-time stamped URL constant (`__RELEASE_URL__` token replaced by `release.sh` / `release.ps1`). No `-Version` flag, no `package.json` lookup.
- **Failure mode:** hard fail (`exit 1`) with a message that explicitly directs users to `install.ps1` / `install.sh` for non-pinned installs. No silent fallback to `main` or latest.
- **Forbidden flags:** `-Branch`, `-Version`, `-ListVersions`, `-NoLatest:$false` — all rejected.
- **Banner contract:** must include literal `(pinned — will not auto-update)`.

### ⏳ Pending Phases
1. **Spec review & sign-off** — confirm `spec/51-upload-scripts/06-release-version-installer.md` v1.0.0
2. **Templates** — author `templates/release-version.ps1.tmpl` + `.sh.tmpl` with `__RELEASE_URL__` placeholder
3. **Release builder integration** — extend `release.sh` + `release.ps1` to stamp templates and emit them into `release-artifacts/` + `checksums.txt`
4. **CI** — extend `.github/workflows/release.yml` to upload both stamped scripts as Release assets
5. **Acceptance tests** — implement RVI-001 … RVI-010
6. **README update** — document the two-installer model and canonical Release-asset URLs

---

## Completed Tracks

### v1.0.0 — Spec Consistency Improvement (6 phases) — ✅ Complete 2026-02-12
### v2.0.0 — Resequencing (10 batches, 23 folder renames, ~834 cross-refs) — ✅ Complete 2026-03-30

---

*Plan v1.0.0 created 2026-02-11. All 6 phases complete as of 2026-02-12.*  
*Plan v2.0.0 created 2026-03-30. Resequencing complete.*  
*Plan v3.0.0 — Health Dashboard UI polish track active 2026-04-19.*
