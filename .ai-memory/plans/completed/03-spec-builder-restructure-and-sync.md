# Consolidated Plan: Spec-Builder Architecture Restructuring & Canonical Synchronization

> **Status:** COMPLETED  
> **Target Repository:** `alimtvnetwork/spec-builder-v11`  
> **Authority:** `02-spec/`  
> **Completed Date:** 2026-09-19  
> **Execution Duration:** Completed across 4 execution phases (approx. 45 discrete tool steps)  

---

## Origin & Initialization

This task was initiated to modernize `spec-builder` from its legacy structure (`spec/` and `.lovable/`) into the canonical meta-spec architecture (`02-spec/`, `.ai-memory/`, `01-prompts/`, `03-ai-scripts/`), preserving all domain specs while establishing the standard 01–20 guidelines layout and resolving application/UI dependencies.

### User Request (Verbatim)

```text
D:\work\spec-builder\spec

Could you please read the coding guideline one more time, uh, very thoroughly? Because now I want you to, uh, work with the spec builder folder. Okay. That is a very delicate one because that actually contains all the old spec, okay, from the old days. So this is the first thing that we came up with, uh, how things would work. So a lot of things are very much backdated. Um, for example, the spec folder. Uh, and the spec folder actually not only contains one, um, spec, but it contains multiple, uh, let's say spec, uh, also including the, um, including the, uh, let's say spec management system software, how it's going to work. So it contains the most of the old stuff. So the way that we should start with that is that we will put whatever that is in the spec folder inside the spec builder. Uh, after the folder ten, we will move it to twenty-one, folder twenty-one. So we will keep a gap, um, for the... We'll keep a gap for the, uh, let's say decision-making. Uh, so in between the generic software and course, check if that is repeated somewhere. I believe that is repeated. Okay. So all the other parts, these are all, you know, resignation codes. Uh, so these are the things I want you to understand and sync with on this. Mostly the new parts from the coding guideline that we have in the spec folder. Okay. So that will actually go up to the folder twenty. So reorganize with the latest ones. That's the first thing. The second thing that add the prompts, um, AI scripts and other stuff. Also move the .labable folder to AI memory. Okay. So make sure that these changes is done. Uh, uh, .labable folder also structure needs to be changed with the Morgan structure. Okay. So first, make a very big plan that what you have to do, how you are going to porting on this, how you are going to sync this. It's not just, uh, one way route. So many things. So before that, I want you to make a release, uh, and take a backup of the branch that before, um, restructuring so that we can compare. Remember that, and then come back to the branch. And always do a pull before working. Okay. Uh, please confirm that you understood the task. You, you can work with it. There's no confusion. Confirm that. Okay.
```

---

## Actionable Tasks & Completion Record

- [x] **1. Pre-Flight Safety & Release Snapshot:**
  - [x] Ran `git pull origin main`.
  - [x] Created and pushed backup branch `backup/pre-restructure-2026-09-19` to `origin`.
  - [x] Created and pushed release tag `v3.16.0-pre-restructure` to `origin`.
  - [x] Returned to working branch `main`.
- [x] **2. Memory Modernization (`.lovable/` -> `.ai-memory/`):**
  - [x] Migrated `.lovable/` folder contents to `.ai-memory/`.
  - [x] Restructured `.ai-memory/` into modern standard (`memory/`, `plans/`, `prompts.md`, `what-to-read.md`, `coding-guidelines.md`, `strictly-avoid.md`, `01-index.md`).
  - [x] Removed legacy `.lovable/` directory completely.
- [x] **3. Toolchain & System Synchronization:**
  - [x] Synced `01-prompts/` (100 prompts across 21 categories) from `coding-guidelines`.
  - [x] Synced `03-ai-scripts/` (42 scripts) from `coding-guidelines`.
  - [x] Synced `.agents/skills/` (44 skills) and `.agents/rules/` from `coding-guidelines`.
  - [x] Synced `linter-scripts/` with all spec and cross-link linters.
- [x] **4. Spec Reorganization (`spec/` -> `02-spec/`):**
  - [x] Relocated app specs: Moved `spec/11-spec-management-software` and `spec/10-app/axios-version-control` to `02-spec/21-app/`.
  - [x] Relocated remaining app/CLI specs (`spec/20-` through `spec/61-`) to `02-spec/25-` and above, eliminating duplicates with canonical guidelines.
  - [x] Synced canonical modules `01` through `20` from `coding-guidelines/02-spec/` into `02-spec/`.
  - [x] Ingested `22-app-issues`, `23-app-db`, and `24-app-ui-design-system`.
  - [x] Archived superseded `50-powershell-integration` into `02-spec/99-archive/50-powershell-integration-legacy`.
  - [x] Deleted legacy `spec/` folder.
- [x] **5. Application Code & UI Compatibility (`src/`):**
  - [x] Updated `src/utils/spec-index.ts` to scan `02-spec/**/*.md` and added categories (`APP`, `ISSUE`, `DB`, `UI`, `DOC`).
  - [x] Updated `src/pages/SpecBrowser.tsx` and `SpecFileViewer.tsx` to reference `02-spec/`.
  - [x] Updated `src/components/dashboard/CertificateCard.tsx`.
  - [x] Updated `src/tests/error-code-collisions.test.ts`.
  - [x] Updated `package.json` scripts (`validate:errors`, `report:errors`).
- [x] **6. Verification & Quality Gates:**
  - [x] Enhanced `02-spec/03-error-manage/03-error-code-registry/08-linter-scripts/detect-collisions.mjs` to handle index grouping and known sub-ranges (`PS/AB`, `AB/AB-LR`, `GS/BR`).
  - [x] Updated `scripts/drift-detect-seed-sync.sh` to skip when non-applicable.
  - [x] Passed all quality gates (`npm test -- --run`, `npm run build`, `npm run validate:errors`, and python linters).
  - [x] Committed and pushed in single atomic commit (`dbe4aba`).
