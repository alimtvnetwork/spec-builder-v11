# 01 — Axios Version Security Vulnerability

**Created:** 2026-04-01  
**Status:** Resolved  
**Severity:** Critical

---

## Issue Summary

### What happened

Certain Axios versions (1.14.1 and 0.30.4) were identified as having security vulnerabilities. The project needed strict version pinning to prevent accidental upgrades to affected versions.

### Where it happened

- **Feature / Module:** Dependency management
- **File paths:** `package.json`, `spec/10-app/axios-version-control/`

### Symptoms and impact

Using vulnerable Axios versions could expose the application to security risks. Automatic dependency updates (via `^` or `~`) could silently upgrade to blocked versions.

### How it was discovered

Identified during security review of Axios package versions.

---

## Root Cause Analysis

### Direct cause

Axios versions 1.14.1 and 0.30.4 contain known security vulnerabilities.

### Contributing factors

- Default npm behavior uses caret (`^`) ranges allowing minor/patch upgrades
- Automated tools (Dependabot, Renovate) could propose upgrades to vulnerable versions

### Why the existing spec did not prevent it

No version control policy existed for Axios prior to this fix.

---

## Fix Description

### What was changed in the spec

1. Created `spec/10-app/axios-version-control/` module (6 files)
2. Defined version policy with safe (1.14.0, 0.30.3) and blocked (1.14.1, 0.30.4) versions
3. Created drift detection script spec (AX-001, AX-002, AX-003 rules)
4. Created package.json safeguard spec with CI/Husky enforcement
5. Added acceptance criteria AC-001 through AC-011

### New rules or constraints added

- **Exact pinning only:** No `^`, `~`, `*`, `>=` allowed for Axios
- **Blocked versions:** 1.14.1, 0.30.4 must never be used
- **Tool exclusions:** Dependabot and Renovate must ignore Axios
- **Pre-commit enforcement:** Husky hook validates before every commit

### Why the fix resolves the root cause

Strict pinning prevents any automatic or accidental upgrade to vulnerable versions. Drift detection catches violations at multiple stages (pre-commit, CI, code review).

---

## Prevention and Non-Regression

### Prevention rule

Never use range syntax for Axios. Only approved exact versions (1.14.0 or 0.30.3) are permitted.

### Acceptance criteria / test scenarios

- AC-001: Only exact pinned versions in package.json
- AC-004: Blocked versions rejected with error
- AC-006–AC-011: Drift detection rules enforced

### Spec sections updated

- `spec/10-app/axios-version-control/01-version-policy.md`
- `spec/10-app/axios-version-control/02-drift-detection-script.md`
- `spec/10-app/axios-version-control/03-package-json-safeguard.md`
- `spec/10-app/axios-version-control/97-acceptance-criteria.md`

---

## Done Checklist

- [x] Issue write-up created at `.lovable/solved-issues/01-axios-version-security.md`
- [x] Relevant spec(s) created with corrected behavior and constraints
- [x] Memory updated with summary and prevention rule
- [x] Acceptance criteria added (AC-001 through AC-011)
