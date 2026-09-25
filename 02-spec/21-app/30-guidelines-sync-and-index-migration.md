# 30 — Guidelines Synchronization & Index-to-Readme Modernization

> **Status:** ACTIVE  
> **Authority:** Single Source of Truth for Guidelines Synchronization & Index Modernization  
> **Version:** 3.18.0  
> **Date:** 2026-09-25

---

## User Request (Verbatim)

```text
is it done properly? Please release it.

There are ten presenting code base, spec folder, everything, permit structure according to the latest coding guideline. So in previous and past, we have zero one index file. We are taking that out. That would be the README.md file, lowercase, every folder. And check, what are the latest changes in the coding guideline. Synchronize here onto these folders, okay? Up to the folder 20, and rest of the folders have in and out, that's fine. So check each file accurately where the changes are, and only check the latest changes. That means I don't think that this is where we have changed anything. But yeah, latest means whoever has the latest commit, the date. Okay? Take that file as very seriously and yeah, compare these each files, spec, prompts, and skills, and migrate everything here. Okay? Before migrating, create a backup branch, create a release, and then start working. After you complete, you make another bump in the version, make a release, okay? And make sure you update the root README regarding to this. Is it clear? Do you understand everything?
```

---

## Architectural Overview

This specification establishes the architectural and procedural standard for:
1. **Safety Pre-Flight:** Establishing snapshot branches (`backup/pre-sync-migration`) and baseline release tags (`v3.17.0`) prior to large-scale structural tree synchronization.
2. **Chronological Ingestion Protocol:** Timestamp-driven file comparisons against upstream repositories (`d:\work\coding-guidelines`), strictly migrating files where `src_time > dst_time` while preserving local advancements.
3. **Repository-Wide Index Elimination:** Permanent deprecation and migration of all `01-index.md`, `00-index.md`, and uppercase `README.md` files into standard lowercase `readme.md` files across all tiers.
4. **Tooling & Dashboard Alignment:** Updating spec indexing functions, sort orders, and data generators so `readme.md` is canonically recognized as `00 — Overview (Readme)`.
5. **Release Ceremonies:** Automated packaging, checksum calculation, installer stamping, tag creation, and GitHub Release publication.

---

## Data Contracts & File System Layout

### Readme File Standard
- Every specification folder, memory directory, script category, and module directory MUST contain a single lowercase `readme.md` file serving as the module entry point.
- The root document must strictly remain lowercase `readme.md`.
- No folder shall contain `01-index.md`, `00-index.md`, or `index.md`.

### Spec Sorting Order (spec-index.ts)
```typescript
export function sortSpecFiles(files: SpecFile[]): SpecFile[] {
  return [...files].sort((a, b) => {
    const isReadmeA = a.name.toLowerCase() === 'readme.md';
    const isReadmeB = b.name.toLowerCase() === 'readme.md';
    if (isReadmeA && !isReadmeB) return -1;
    if (!isReadmeA && isReadmeB) return 1;
    return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
  });
}
```

---

## Verification Gates

1. **Zero Index Markdown Files:** `git ls-files "*index.md"` must return zero folder overview index files.
2. **Strict Lowercase Readmes:** `git ls-files | Where-Object { $_ -cmatch 'README\.md$' }` must return 0 results.
3. **Test Suite Verification:** `bun run test` must pass 100% (7 test suites, 26 unit tests).
4. **Build Verification:** `bun run build` must compile cleanly without TypeScript or bundler errors.
5. **Release Verification:** `gh release view v3.18.0` must exist on `alimtvnetwork/spec-builder-v11` with attached zip, tar.gz, installer scripts, and checksums.
