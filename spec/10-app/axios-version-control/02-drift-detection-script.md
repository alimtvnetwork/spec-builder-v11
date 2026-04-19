# Drift Detection: Axios Version Pinning

**Version:** 1.0.0  
**Last Updated:** 2026-04-01  
**Status:** Draft  

---

## Overview

This specification defines a drift detection script (`scripts/drift-detect-axios.sh`) that validates Axios version declarations in `package.json` against the version control policy defined in [01-version-policy.md](./01-version-policy.md). The script prevents blocked versions, range syntax, and unpinned declarations from entering the codebase.

## Scope

### In Scope

- Scanning `package.json` for Axios version declarations
- Detecting caret (`^`), tilde (`~`), wildcard (`*`), and range (`>=`, `<`, `||`) syntax
- Blocking known vulnerable versions (`1.14.1`, `0.30.4`)
- Reporting pass/fail with actionable error messages
- Integration with `scripts/drift-detect-all.sh`, Husky pre-commit, and GitHub Actions CI

### Out of Scope

- Scanning lock files (handled separately)
- Validating other dependencies
- Auto-remediation or version replacement

---

## Script Specification

### File Path

```
scripts/drift-detect-axios.sh
```

### Input

- Reads `package.json` from project root (both `dependencies` and `devDependencies`)

### Exit Codes

| Code | Meaning |
|------|---------|
| `0` | Pass — Axios version is compliant |
| `1` | Fail — Blocked version, range syntax, or missing pin detected |

### Detection Rules

| Rule ID | Check | Fail Condition | Error Message |
|---------|-------|----------------|---------------|
| AX-001 | Range syntax | Version string contains `^`, `~`, `*`, `>=`, `<`, `\|\|` | `FAIL [AX-001]: Axios uses range syntax "{version}". Exact pinning required.` |
| AX-002 | Blocked version | Version matches `1.14.1` or `0.30.4` | `FAIL [AX-002]: Axios version "{version}" is blocked (security vulnerability).` |
| AX-003 | Unapproved version | Version does not match `1.14.0` or `0.30.3` and is not blocked | `WARN [AX-003]: Axios version "{version}" is not in the approved list. Manual review required.` |

### Pass Output

```
✅ Axios version pinning: PASS (version: 1.14.0)
```

### Fail Output Example

```
❌ FAIL [AX-001]: Axios uses range syntax "^1.14.0". Exact pinning required.
   Fix: Set "axios": "1.14.0" in package.json
```

### Logic Flow

```mermaid
flowchart TD
    A[Read package.json] --> B{Axios declared?}
    B -- No --> C[EXIT 0 — not a dependency]
    B -- Yes --> D{Contains ^ ~ * >= < ||?}
    D -- Yes --> E[FAIL AX-001]
    D -- No --> F{Matches blocked list?}
    F -- Yes --> G[FAIL AX-002]
    F -- No --> H{Matches approved list?}
    H -- No --> I[WARN AX-003]
    H -- Yes --> J[PASS]
```

---

## Integration Points

### Unified Runner

Add to `scripts/drift-detect-all.sh`:

```bash
# Axios version pinning check
bash scripts/drift-detect-axios.sh || FAIL=1
```

### Pre-Commit Hook (Husky)

Already covered by `drift-detect-all.sh` invocation in `.husky/pre-commit`.

### GitHub Actions CI

Already covered by `drift-detect-all.sh` invocation in `.github/workflows/compliance.yml`.

### Risk Matrix Mapping

| Risk ID | Description |
|---------|-------------|
| RISK-018 (proposed) | Axios version drift — unpinned or vulnerable version declared |

---

## Exemption Mechanism

Consistent with existing drift detection scripts, a line-level exemption comment is supported:

```json
"axios": "1.14.1" // drift-exempt: testing-only
```

Valid justifications: `testing-only`, `migration-in-progress`.

---

## Cross-References

- [Axios Version Policy](./01-version-policy.md)
- [Acceptance Criteria](./97-acceptance-criteria.md)
- [CI/CD Compliance Automation](../../../.lovable/memories/project/ci-cd-compliance-automation.md)
- [Drift Detection System Memory](../../../.lovable/memories/qa/drift-detection-system.md)
- [Compliance Risk Matrix](../../../.lovable/audits/compliance-risk-matrix.md)

