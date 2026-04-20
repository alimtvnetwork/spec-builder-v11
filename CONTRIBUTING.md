# Contributing

> **Audience:** Humans and AI agents proposing changes to this repository.
> **Author / Owner:** [alimtvnetwork](https://github.com/alimtvnetwork)
> **Last updated:** 2026-04-20

This repository is **specification-first**. Every change — even a one-line typo fix in a spec — follows the same disciplined workflow so the spec tree stays internally consistent and downstream implementations don't drift.

Read this file in full before opening a PR or pushing a commit.

---

## 🚨 Hard Rules

| Rule | Why |
|---|---|
| ❌ **No application code** outside `src/` (the Health Dashboard). | This is a spec-only repo; CLI/Go/PHP/Rust implementations live in their own repositories. |
| ❌ **Never edit `.release/`.** | Release artifacts are generated, not hand-written. |
| ✅ **Bump at least the `minor` version on every code change** in `src/` or `scripts/`. | Forces every change to be released and traceable. |
| ✅ **Specs only — no "implement X" suggestions** in PR descriptions. | Implementation belongs to downstream repos; here we describe and govern. |
| ✅ **`any` and `unknown` are banned** in TypeScript. | Type safety is non-negotiable. |

---

## 🧭 The Plan-Before-Execute Workflow

Every non-trivial change MUST go through these four phases. Trivial = a single-file typo or formatting fix in one spec. Everything else is non-trivial.

### 1. Plan

Produce a short written plan covering:

- **Scope** — exactly which files/modules change.
- **Why** — the user need or spec gap being addressed.
- **Reliability risk report** — for each affected module, list:
  - Likelihood of breaking downstream implementers (Low / Medium / High).
  - Cross-references that must be updated.
  - Tests or consistency reports that must be re-run.
- **Out of scope** — what you are deliberately NOT touching.

For AI agents: surface the plan to the user and wait for explicit approval before editing anything.

### 2. Execute

- Make the smallest possible diff that satisfies the plan.
- Don't bundle unrelated cleanups — file them as separate PRs.
- Keep `spec/` changes and `src/` (dashboard) changes in **separate commits**, ideally separate PRs.
- Follow the conventions in [`spec/03-coding-guidelines/`](./spec/03-coding-guidelines/) and the per-language rules surfaced in `.lovable/memories/architecture/coding-standards/`.

### 3. Update governance artifacts

For **every** change that adds, renames, removes, or materially edits a file inside a spec module, update — in the same PR:

- **`<module>/98-changelog.md`** — append a dated entry. See [Changelog Rules](#-changelog-rules) below.
- **`<module>/99-consistency-report.md`** — re-run / hand-update so cross-references and file inventory match reality.
- **`spec/00-overview.md`** — only when modules are added, removed, or renumbered.
- **`.lovable/memory/index.md`** — only when a new long-lived rule, constraint, or feature memory is introduced.

### 4. Verify

- `bun run lint` — must pass.
- `bun run test` — must pass.
- `bun run build` — must pass.
- For dashboard changes: open the affected route(s) and confirm the UI behaves as described in the plan.
- For spec changes: open the rendered file in the dashboard's spec browser and confirm it parses, links resolve, and code blocks render cleanly.

---

## 📓 Changelog Rules

The repository uses **two layers** of changelogs.

### Root `CHANGELOG.md`

- Format: [Keep a Changelog](https://keepachangelog.com/) style, ordered newest-first.
- Sections per release: `### Added`, `### Changed`, `### Deprecated`, `### Removed`, `### Fixed`, `### Security`, `### Refactored`, `### Why this approach` (optional rationale).
- Every release header MUST include the version and ISO date:

  ```
  ## [3.16.0] — 2026-04-21
  ```

- Every entry MUST reference the affected files or spec modules in backticks.
- Add a "Why this approach" subsection when the change is non-obvious or when an alternative was rejected.

### Per-module `98-changelog.md`

Lives inside each spec module directory (e.g. `spec/09-code-block-system/98-changelog.md`).

- One entry per dated change to that module.
- Format:

  ```markdown
  ## YYYY-MM-DD — <one-line summary>

  - **Added/Changed/Removed:** <details with file paths in backticks>
  - **Cross-refs updated:** `path/to/other/spec.md`
  - **Reason:** <why>
  ```

- If the change is purely editorial (typo, formatting), still add an entry — mark it as `Editorial`.
- Never delete or rewrite past entries. Append-only.

---

## 🔢 Version-Bump Policy

The repo uses [Semantic Versioning](https://semver.org/). The version in `package.json` is the single source of truth.

| Change type | Bump |
|---|---|
| Spec-only change (no `src/` or `scripts/` edits) | **No version bump required**, but a per-module `98-changelog.md` entry is mandatory. |
| Bug fix in dashboard / scripts (no behaviour change for users) | `patch` — `3.15.1` |
| New dashboard feature, new spec module, new linter rule, new memory category | `minor` — `3.16.0` |
| Breaking change: rename of a public spec module, removal of a rule, restructured manifest schema, dashboard route removal | `major` — `4.0.0` |
| Re-indexing of spec folders (renumbering prefixes) | `major` — always treat as breaking. |

### Rules

1. **Every PR that touches `src/` or `scripts/` MUST bump at least `minor`.** This is enforced socially; reviewers will block PRs that don't.
2. **Bump in the same commit as the change** — never in a follow-up "version bump" commit.
3. **Update the root `CHANGELOG.md`** with the new version header in the same PR.
4. **Tag the release** as `v<major>.<minor>.<patch>` (e.g. `v3.16.0`). Tagging is handled by `bun run release` / `release.sh`.
5. **Never reuse a version number.** If a release is botched, bump again — never overwrite a tag.

---

## 🤖 For AI Agents

If you are an AI agent (Lovable, Claude, GPT, Cursor, etc.) editing this repo:

1. Load `.lovable/memory/index.md` and the relevant memory files **before** making changes.
2. Produce the plan from §1 above and surface it to the user. Wait for approval.
3. Never re-propose ideas the user has rejected (those live in `.lovable/memories/constraints/`).
4. After every work session, list **remaining tasks** at the end of your reply. If none remain, suggest next actions sourced from open items in memory.
5. Do **not** append boilerplate confirmation blocks ("Do you understand?", "If you have any question…").
6. Default to discussion for broad/ambiguous requests; only implement when scope is narrow and clear.

---

## ❓ Questions

Open a GitHub Issue on this repository and tag the owner: **[@alimtvnetwork](https://github.com/alimtvnetwork)**.

— Maintained by **[alimtvnetwork](https://github.com/alimtvnetwork)**
