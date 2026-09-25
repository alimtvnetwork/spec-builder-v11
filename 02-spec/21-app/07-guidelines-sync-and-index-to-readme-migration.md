# Canonical Specification: Coding Guidelines Synchronization & Index-to-Readme Migration

## User Request (Verbatim)

```text
There are ten presenting code base, spec folder, everything, permit structure according to the latest coding guideline. So in previous and past, we have zero one index file. We are taking that out. That would be the README.md file, lowercase, every folder. And check, what are the latest changes in the coding guideline. Synchronize here onto these folders, okay? Up to the folder 20, and rest of the folders have in and out, that's fine. So check each file accurately where the changes are, and only check the latest changes. That means I don't think that this is where we have changed anything. But yeah, latest means whoever has the latest commit, the date. Okay? Take that file as very seriously and yeah, compare these each files, spec, prompts, and skills, and migrate everything here. Okay? Before migrating, create a backup branch, create a release, and then start working. After you complete, you make another bump in the version, make a release, okay? And make sure you update the root README regarding to this. Is it clear? Do you understand everything?
```

---

## 1. Architectural Overview & Context

This specification directs the comprehensive synchronization and structural modernization of `spec-builder` (`alimtvnetwork/spec-builder-v11`) to align with the authoritative upstream standards in `coding-guidelines` (`d:\work\coding-guidelines`).

### 1.1 Key Architectural Shifts
1. **Index Elimination:** Deprecation and replacement of all legacy `readme.md` and `index.md` files in favor of standard lowercase `readme.md` files across all directories and subdirectories.
2. **Foundational Specs Synchronization (Folders 01–20):** Synchronization of core architectural guidelines, error handling models, database standards, CLI patterns, and consolidated guidelines from the upstream source based on latest commit timestamps.
3. **Application Specs Preservation (Folders 21+):** Preserving domain-specific applications, CLI specifications, and WordPress builder specs in folders 21–60 while applying the `readme.md` naming convention and updated cross-references.
4. **Tooling & Skills Harmonization:** Updating `01-prompts/`, `.agents/skills/`, `.agents/rules/`, and `03-ai-scripts/` with the latest enhancements.
5. **Dashboard & Manifest Compatibility:** Updating `src/utils/spec-index.ts`, `src/pages/SpecBrowser.tsx`, and `scripts/generate-dashboard-data.cjs` so that `readme.md` is treated as the primary overview document.

---

## 2. Release & Git Safety Gates

1. **Pre-Migration Gate:**
   - Create local and remote backup branch `backup/pre-sync-migration`.
   - Create baseline release tag `v3.17.0` before any files are modified.
2. **Post-Migration Gate:**
   - Execute targeted quality checks and error collision tests.
   - Update root `readme.md` and `changelog.md`.
   - Bump minor version to `v3.18.0`.
   - Create post-migration release tag `v3.18.0`.
   - Atomic commit and push to remote `main`.
