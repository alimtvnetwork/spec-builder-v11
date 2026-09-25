# Completed Plan: Coding Guidelines Synchronization & Index-to-Readme Migration

Canonical Spec: [02-spec/21-app/30-guidelines-sync-and-index-migration.md](../../../02-spec/21-app/30-guidelines-sync-and-index-migration.md)  
Status: Completed  
Completed Date: 2026-09-25  
Version Released: v3.18.0  
Execution Steps: 6 Subtasks Across 2 Execution Phases

## Initial User Request (Verbatim)

```text
There are ten presenting code base, spec folder, everything, permit structure according to the latest coding guideline. So in previous and past, we have zero one index file. We are taking that out. That would be the README.md file, lowercase, every folder. And check, what are the latest changes in the coding guideline. Synchronize here onto these folders, okay? Up to the folder 20, and rest of the folders have in and out, that's fine. So check each file accurately where the changes are, and only check the latest changes. That means I don't think that this is where we have changed anything. But yeah, latest means whoever has the latest commit, the date. Okay? Take that file as very seriously and yeah, compare these each files, spec, prompts, and skills, and migrate everything here. Okay? Before migrating, create a backup branch, create a release, and then start working. After you complete, you make another bump in the version, make a release, okay? And make sure you update the root README regarding to this. Is it clear? Do you understand everything?
```

## Consolidated Subtasks & Verified Outcomes

### Subtask 01: Pre-Migration Backup Branch & Baseline Release
- Created backup branch `backup/pre-sync-migration` and pushed to origin.
- Created annotated release tag `v3.17.0` establishing pre-sync baseline snapshot and pushed to origin.
- Published GitHub Release `v3.17.0` on GitHub.

### Subtask 02: Synchronize Coding Guidelines Specifications (Folders 01 to 20)
- Compared each specification file against `d:\work\coding-guidelines\02-spec\`.
- Evaluated commit dates: synchronized 151 new files and 473 updated files, while strictly preserving 469 files where destination was newer or equal (e.g. in `19-main-worker-service`).
- Ingested complete `02-spec/07-design-system` suite including Sweet Digs design system, design tokens (`17-theme-tokens.json`), modern animations, and standalone `theme-tester/`.

### Subtask 03: Synchronize Prompts, Skills, and AI Scripts
- Synchronized latest prompts in `01-prompts/` (incorporating A/H parameters, 2-agent reading lifecycle).
- Synchronized 54 agent skills in `.agents/skills/` and rules in `.agents/rules/`.
- Synchronized 38 AI scripts in `03-ai-scripts/` including `39-migrate-indexes-to-readme.py`.

### Subtask 04: Repository-Wide Index to Readme Migration
- Identified and migrated all `01-index.md`, `index.md`, and `00-index.md` files across all directories (01 through 60, `.ai-memory`, `linter-scripts`, `.agents/scripts`) to canonical lowercase `readme.md`.
- Normalized `.ai-memory/memories/` uppercase files to lowercase `readme.md`.
- Executed repository-wide reference rewrites, updating markdown links and references to `readme.md`.
- Verified zero index markdown files remain in the repository.

### Subtask 05: Dashboard and Tool Compatibility Updates
- Updated `scripts/generate-dashboard-data.cjs` to scan `.ai-memory` and recognize `readme.md` files as module overviews.
- Updated `src/utils/spec-index.ts` to prioritize `readme.md` and display as `00 — Overview (Readme)`.
- Verified Vitest test suite (`bun run test`) passes with all 7 test files and 26 tests passing.
- Verified Vite production build (`bun run build`) compiles cleanly in 5.66s across 2,000+ spec assets.

### Subtask 06: Version Bump, Release Packaging & GitHub Release Publication
- Updated root `readme.md` detailing the index-to-readme modernization, upstream guidelines sync, and installer examples.
- Updated `package.json` and `AGENTS.md` version to `3.18.0`.
- Authored `changelog.md`.
- Stamped installer templates and scripts (`release.ps1`, `release.sh`, `install.ps1`, `install.sh`, `templates/release-version.*.tmpl`) for `alimtvnetwork/spec-builder-v11`.
- Built full release pack and published GitHub Release `v3.18.0` with assets attached (`coding-guidelines-v3.18.0.zip`, `dashboard-v3.18.0.zip`, `release-version.ps1`, `release-version.sh`, `checksums.txt`).
- Pushed atomic commits and updated release tag `v3.18.0` to `origin/main`.
