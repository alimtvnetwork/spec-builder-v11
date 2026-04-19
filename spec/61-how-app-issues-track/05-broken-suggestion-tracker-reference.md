# 05 — Broken Suggestion Tracker Reference

**Created:** 2026-02-23  
**Version:** 1.0.0  
**Status:** Resolved  
**Severity:** Low

---

## Issue Summary

### What happened

The master status file (`.lovable/memories/workflow/03-master-status.md`) referenced `.lovable/memories/suggestions/01-suggestions-tracker.md` in the "Next Steps for New AI" section, but that file does not exist. The actual file at that location is `.lovable/memories/suggestions/README.md`.

### Where it happened

- **Feature / Module:** Master Status / AI Handoff
- **File paths:** `.lovable/memories/workflow/03-master-status.md` (line 148)

### Symptoms and impact

A new AI agent following the handoff steps would fail to locate the suggestions tracker, causing confusion during onboarding. Low severity because the suggestions system has migrated to `.lovable/memories/suggestions/` with individual timestamped files (per `workflow/suggestions-management` memory), making the legacy path non-critical.

### How it was discovered

Found during a cross-reference validation scan of the master status file on 2026-02-23.

---

## Root Cause Analysis

### Direct cause

The suggestions tracker was restructured from a single `01-suggestions-tracker.md` file to individual timestamped files in `.lovable/memories/suggestions/`, but the master status reference was never updated.

### Contributing factors

- The master status file was not updated when the suggestions system was migrated
- Two parallel suggestion directories existed (`.lovable/memory/suggestions/` and `.lovable/memories/suggestions/`) which added confusion — now consolidated into `.lovable/memories/suggestions/`

### Triggering conditions

Occurs when internal file structures are reorganized without updating all cross-references in handoff documents.

### Why the existing spec did not prevent it

The cross-reference validation scans (v9.3.0 and v9.4.0) focused on spec files and memory references within spec directories. The master status file's "Next Steps" section was not included in those scans.

---

## Fix Description

### What was changed in the spec

- `.lovable/memories/workflow/03-master-status.md` — Updated line 148 from `.lovable/memories/suggestions/01-suggestions-tracker.md` to `.lovable/memories/suggestions/README.md`

### New rules or constraints added

- Cross-reference validation scans must include the master status file's "Next Steps for New AI" section.

### Why the fix resolves the root cause

The reference now points to an existing file. Future scans that include the master status file will catch similar drift.

### Config changes or defaults affected

None

### Logging or diagnostics required

None

---

## Prevention and Non-Regression

### Prevention rule

Every cross-reference validation scan must include `.lovable/memories/workflow/03-master-status.md` as a mandatory scan target, especially the "Next Steps for New AI" section.

### Acceptance criteria / test scenarios

- GIVEN the master status file is scanned, WHEN all backtick-quoted and markdown-linked paths are extracted, THEN every path must resolve to an existing file or directory.

### Guardrails or linting policies

None — manual process check.

### Spec sections updated

- `.lovable/memories/workflow/03-master-status.md`

---

## TODO and Follow-Ups

- [x] Reference fixed in master status
- [x] Issue write-up created
- [x] Memory registry updated

---

## Done Checklist

- [x] Issue write-up created at `spec/61-how-app-issues-track/05-broken-suggestion-tracker-reference.md`
- [x] Relevant spec(s) updated with corrected behavior and constraints
- [x] Memory updated with summary and prevention rule
- [x] Acceptance criteria updated or added
- [ ] Iterations recorded (if applicable) — N/A, single-pass fix
