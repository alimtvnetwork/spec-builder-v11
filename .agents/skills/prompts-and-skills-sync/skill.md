---
name: prompts-and-skills-sync
description: Autonomously synchronize canonical prompts (01-prompts/), Antigravity skills (.agents/skills/), and AI scripts (03-ai-scripts/) from coding-guidelines across all connected repositories using 03-ai-scripts/38-sync-prompts-skills-scripts.py.
---

# Prompts, Skills & AI Scripts Multi-Repository Synchronizer

> **/goal** Propagate canonical prompt templates, Antigravity skills, and AI automation scripts across all connected target repositories, ensuring 100% parity and hygiene.
> **/learn** Execute `03-ai-scripts/38-sync-prompts-skills-scripts.py` safely with git pre-checks, branch status verification, and automated downstream commits.

**Version:** 1.0.0
**Updated:** 2026-09-24
**Status:** Active
**AI Confidence:** High
**Ambiguity:** None

---

## 1. When to Use

Activate this skill when:
- New prompts are added or updated in `01-prompts/`.
- New Antigravity skills are authored or updated in `.agents/skills/`.
- New shared scripts are added in `03-ai-scripts/` or `.agents/scripts/`.
- The user requests cross-repository synchronization or prompt deployment.

---

## 2. Connected Target Repositories

The synchronizer mirrors assets to the following sibling repositories located in the parent directory:

1. `antigravity-manager`
2. `cat-my`
3. `movie-cli`
4. `scripts-fixer`
5. `spec-builder`
6. `kita-social-media-content-calender`
7. `laravel-automation`
8. `wp-exam`
9. `gitmap`

---

## 3. Synchronized Directories

- `01-prompts/` -> `01-prompts/`
- `.agents/skills/` -> `.agents/skills/`
- `03-ai-scripts/` -> `03-ai-scripts/`
- `.agents/scripts/` -> `.agents/scripts/`

---

## 4. Execution Workflow

### Step 1: Pre-Flight Verification
Ensure the source repository (`coding-guidelines`) has all changes saved and committed:

```bash
git status -s
```

### Step 2: Dry Run or Target Inspection
Run the synchronization script in preview mode or target-specific mode if only one repo is desired:

```bash
python 03-ai-scripts/38-sync-prompts-skills-scripts.py --dry-run
```

### Step 3: Full Synchronization & Propagation
Run the complete sync. The script pulls latest changes, mirrors directories, stages changes, and creates atomic commits:

```bash
python 03-ai-scripts/38-sync-prompts-skills-scripts.py
```

---

## 5. Non-Negotiable Quality Gates

- [ ] All mirrored skill files must use strictly lowercase `skill.md` filenames.
- [ ] No temporary files (`.pyc`, `.tmp`, `__pycache__`) are synced.
- [ ] Every target repository commit message must follow standard semantic convention (`chore(sync): update prompts, skills, and ai scripts`).
- [ ] Never force-push or overwrite uncommitted local work on target repositories without user consent.
