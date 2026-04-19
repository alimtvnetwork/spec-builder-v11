# 00 — How App Issues Track — Overview

**Version:** 3.1.0  
**Created:** 2026-03-09  
**Updated:** 2026-03-30  
**Status:** Active  
**AI Confidence:** Production-Ready  
**Ambiguity:** None

---

## Keywords

`issue-tracking` · `bug-fixes` · `recurring-mistakes` · `accountability` · `postmortem` · `prevention` · `ecosystem-wide`

---

## Scoring

| Metric | Value |
|--------|-------|
| AI Confidence | Production-Ready |
| Ambiguity | None |
| Health Score | 100/100 (A+) |

---

## Purpose

This folder is the **single source of truth** for tracking, documenting, and preventing recurring mistakes across the entire spec ecosystem. Every fix must be recorded here with a standardized write-up so the AI agent and all contributors maintain historical accountability.

---

## Folder Contents

| File | Description |
|------|-------------|
| `00-overview.md` | This file — folder index and purpose |
| `01-issue-template.md` | Copy-paste template for all issue write-ups |
| `02-process-checklist.md` | Mandatory checklist to follow after every fix |
| `03-*` onward | Individual issue write-ups (sequentially numbered) |

---

## Issue Index

| # | File | Summary | Status |
|---|------|---------|--------|
| 03 | `03-broken-memory-references.md` | 15 broken/malformed memory refs across 14 spec files (v9.3.0 + v9.4.0) | Resolved |
| 04 | `04-master-status-stale-wave-count.md` | Master status reported 8/8 waves and v14.0.0 despite 11 waves and v15.0.0 being current | Resolved |
| 05 | `05-broken-suggestion-tracker-reference.md` | Master status referenced nonexistent `01-suggestions-tracker.md` in "Next Steps" section | Resolved |
| 06 | `06-broken-plan-md-references.md` | 3 broken cross-references in plan.md (stale folder, missing spec, wrong tracker path) | Resolved |
| 07 | `07-magic-string-tuple-return-audit.md` | ~1,399 violations: ~101 magic string HTTP methods + ~1,298 tuple returns across 7 CLIs | Open |
| 08 | `08-p7-inline-assignment-contradiction.md` | P7 inline assignment contradiction | Resolved |
| 09 | `09-magic-string-enum-comparison.md` | Magic string enum comparison patterns | Resolved |
| 10 | `10-domain-status-magic-strings.md` | Domain status magic strings across specs | Resolved |
| 11 | `11-http-method-magic-strings.md` | HTTP method magic strings | Resolved |
| 12 | `12-http-method-magic-string-remediation-plan.md` | Remediation plan for HTTP method magic strings (Tiers 1–2 done, 3–4 deferred) | Open |
| 13 | `13-raw-filesystem-nested-if-violations.md` | ~1,769 raw `os.*` calls across 104 spec files | Open |
| 14 | `14-snake-case-log-keys-and-inline-calls.md` | Snake-case log keys and inline calls (renumbered from 07b) | Resolved |
| 15 | `15-v16-remediation-summary.md` | v16.0.0 structural remediation summary and team handoff record | Resolved |
| 16 | `16-error-code-collision-remediation.md` | Error code range collisions across 6 overlapping registries | Resolved |
| 17 | `17-missing-stack-trace-in-catch-blocks.md` | Missing stack traces in catch blocks | Resolved |
| 18 | `18-comprehensive-code-example-audit.md` | ~18,900 violations across 9 categories, 89 remediation waves | Resolved |
| 19 | `19-legacy-readme-naming-violation.md` | 11 legacy README/readme files renamed to numeric prefixes, ~60+ cross-refs updated | Resolved |
| 20 | `20-missing-root-master-index.md` | Missing root `spec/00-overview.md` master index — created with dependency diagram | Resolved |
| 21 | `21-residual-prefix-collisions.md` | 2 prefix collisions from Issue #19 renames in `02-coding-guidelines/02-typescript/` and `02-coding-guidelines/04-php/` | Resolved |

---

## File Naming Convention

All issue write-ups follow:

```
{NN}-{issue-slug-name}.md
```

- `NN` = sequential number starting from `03` (01 and 02 are reserved)
- `issue-slug-name` = lowercase, hyphen-separated, short, descriptive, stable
- No spaces or special characters

---

## Workflow

1. A mistake is discovered or a fix is applied
2. Follow the process checklist (`02-process-checklist.md`)
3. Create an issue write-up using the template (`01-issue-template.md`)
4. Update memory with the prevention rule
5. Fix is **not complete** until memory is updated

---

## Cross-References

- Memory: `.lovable/memories/workflow/03-mistake-remediation-protocol.md`
- Process checklist: `./02-process-checklist.md`
- Template: `./01-issue-template.md`
