# Plan: Spec-Builder Architecture Restructuring & Canonical Synchronization

> **Status:** IN_PROGRESS  
> **Target Repository:** `alimtvnetwork/spec-builder-v11`  
> **Authority:** `02-spec/`  

---

## User Request (Verbatim)

```text
D:\work\spec-builder\spec

Could you please read the coding guideline one more time, uh, very thoroughly? Because now I want you to, uh, work with the spec builder folder. Okay. That is a very delicate one because that actually contains all the old spec, okay, from the old days. So this is the first thing that we came up with, uh, how things would work. So a lot of things are very much backdated. Um, for example, the spec folder. Uh, and the spec folder actually not only contains one, um, spec, but it contains multiple, uh, let's say spec, uh, also including the, um, including the, uh, let's say spec management system software, how it's going to work. So it contains the most of the old stuff. So the way that we should start with that is that we will put whatever that is in the spec folder inside the spec builder. Uh, after the folder ten, we will move it to twenty-one, folder twenty-one. So we will keep a gap, um, for the... We'll keep a gap for the, uh, let's say decision-making. Uh, so in between the generic software and course, check if that is repeated somewhere. I believe that is repeated. Okay. So all the other parts, these are all, you know, resignation codes. Uh, so these are the things I want you to understand and sync with on this. Mostly the new parts from the coding guideline that we have in the spec folder. Okay. So that will actually go up to the folder twenty. So reorganize with the latest ones. That's the first thing. The second thing that add the prompts, um, AI scripts and other stuff. Also move the .labable folder to AI memory. Okay. So make sure that these changes is done. Uh, uh, .labable folder also structure needs to be changed with the Morgan structure. Okay. So first, make a very big plan that what you have to do, how you are going to porting on this, how you are going to sync this. It's not just, uh, one way route. So many things. So before that, I want you to make a release, uh, and take a backup of the branch that before, um, restructuring so that we can compare. Remember that, and then come back to the branch. And always do a pull before working. Okay. Uh, please confirm that you understood the task. You, you can work with it. There's no confusion. Confirm that. Okay.
```

---

## Extracted Actionable Task List

- [x] **1. Pre-Flight Safety & Release Snapshot:**
  - [x] Run `git pull origin main`.
  - [x] Create and push backup branch `backup/pre-restructure-2026-09-19` to `origin`.
  - [x] Create and push release tag `v3.16.0-pre-restructure` to `origin`.
  - [x] Return to working branch `main`.
- [x] **2. Memory Modernization (`.lovable/` -> `.ai-memory/`):**
  - [x] Move `.lovable/` folder contents to `.ai-memory/`.
  - [x] Restructure `.ai-memory/` into modern standard (`memory/`, `plans/`, `prompts.md`, `what-to-read.md`, `coding-guidelines.md`, `strictly-avoid.md`, `01-index.md`).
  - [x] Remove legacy `.lovable/` directory.
- [x] **3. Toolchain & System Synchronization:**
  - [x] Copy `01-prompts/` (100 prompts across 21 categories) from `coding-guidelines`.
  - [x] Copy `03-ai-scripts/` (42 scripts) from `coding-guidelines`.
  - [x] Copy `.agents/skills/` (41 skills) and `.agents/rules/` from `coding-guidelines`.
  - [x] Copy `linter-scripts/` with all spec and cross-link linters.
- [x] **4. Spec Reorganization (`spec/` -> `02-spec/`):**
  - [x] Relocate app specs: Move `spec/11-spec-management-software` and `spec/10-app/axios-version-control` to `02-spec/21-app/`.
  - [x] Relocate remaining app/CLI specs (`spec/20-` through `spec/61-`) to `02-spec/25-` and above, eliminating duplicates with canonical guidelines.
  - [x] Sync canonical modules `01` through `20` from `d:\work\coding-guidelines\02-spec/` into `02-spec/`.
  - [x] Remove legacy `spec/` folder.
- [x] **5. Application Code & UI Compatibility (`src/`):**
  - [x] Update `src/utils/spec-index.ts` to scan `02-spec/**/*.md`.
  - [x] Update `src/pages/SpecBrowser.tsx` and `SpecFileViewer.tsx` to reference `02-spec/`.
  - [x] Update `package.json` scripts (`validate:errors`, `report:errors`).
- [x] **6. Verification & Quality Gates:**
  - [x] Run spec linters (`check-prompts-loaded.py`, `check-spec-cross-links.py`, `check-spec-folder-refs.py`).
  - [x] Run frontend build (`npm run build`).
  - [x] Run test suite (`npm test -- --run`).
  - [x] Commit all changes cleanly.
