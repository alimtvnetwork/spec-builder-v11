# Package.json Pinning Safeguard

**Version:** 1.0.0  
**Last Updated:** 2026-04-01  
**Status:** Active  

---

## Overview

This specification defines the safeguard mechanism for Axios version pinning in `package.json`. It ensures the declared version is exact (no `^`, `~`, `*`, or range operators), matches an approved safe version, and is never automatically modified by dependency update tools.

## Scope

### In Scope

- Exact version declaration rules for `package.json`
- Safeguard validation logic for CI and pre-commit
- Blocked and approved version registry

### Out of Scope

- Lock file integrity checks (separate concern)
- Other dependency pinning policies

---

## 1. Pinning Rules

### 1.1 Declaration Format

Axios must appear in `package.json` with an exact version string — no range syntax permitted.

```json
// ✅ Compliant — exact pin
{
  "dependencies": {
    "axios": "1.14.0"
  }
}
```

```json
// ❌ Non-compliant — caret allows minor/patch drift
{
  "dependencies": {
    "axios": "^1.14.0"
  }
}
```

```json
// ❌ Non-compliant — tilde allows patch drift
{
  "dependencies": {
    "axios": "~1.14.0"
  }
}
```

### 1.2 Forbidden Syntax

| Symbol | Example | Reason |
|--------|---------|--------|
| `^` | `"^1.14.0"` | Allows automatic minor/patch upgrades |
| `~` | `"~1.14.0"` | Allows automatic patch upgrades |
| `*` | `"*"` | Installs latest — completely uncontrolled |
| `>=` | `">=1.14.0"` | Open-ended range |
| `<` | `"<2.0.0"` | Range allows vulnerable versions |
| `\|\|` | `"1.14.0 \|\| 0.30.3"` | Multi-range — ambiguous resolution |

---

## 2. Version Registry

### 2.1 Approved Safe Versions

| Version | Status | Use Case |
|---------|--------|----------|
| `1.14.0` | ✅ Approved | Modern projects, primary recommendation |
| `0.30.3` | ✅ Approved | Legacy compatibility only |

### 2.2 Blocked Versions

| Version | Status | Reason |
|---------|--------|--------|
| `1.14.1` | ❌ Blocked | Known security vulnerability |
| `0.30.4` | ❌ Blocked | Known security vulnerability |
| Any unlisted version | ❌ Blocked until verified | Requires manual security audit |

> **Security Note:** There has been a known security issue affecting Axios versions `1.14.1` and `0.30.4`. Using these versions may expose the application to vulnerabilities. Only approved safe versions (`1.14.0`, `0.30.3`) shall be used until further validation is completed. Any upgrade must go through manual verification and explicit approval.

---

## 3. Safeguard Validation Logic

### 3.1 Pseudocode

```
FUNCTION validateAxiosPin(packageJson):
    version = packageJson.dependencies["axios"]
                OR packageJson.devDependencies["axios"]

    IF version is undefined:
        RETURN PASS  // Axios not used

    IF version contains any of ['^', '~', '*', '>=', '<', '||']:
        RETURN FAIL "AX-001: Range syntax detected"

    IF version IN ['1.14.1', '0.30.4']:
        RETURN FAIL "AX-002: Blocked version"

    IF version NOT IN ['1.14.0', '0.30.3']:
        RETURN WARN "AX-003: Unapproved version — manual review required"

    RETURN PASS
```

### 3.2 Enforcement Points

| Layer | Mechanism | Behavior on Fail |
|-------|-----------|-----------------|
| Local | Husky pre-commit via `drift-detect-all.sh` | Commit blocked |
| CI | GitHub Actions via `compliance.yml` | PR check fails |
| Review | Manual `package.json` inspection | PR rejected |

### 3.3 Automated Tool Exclusions

The following tools must be configured to **skip** Axios:

| Tool | Configuration |
|------|---------------|
| Dependabot | Add `axios` to `ignore` list in `.github/dependabot.yml` |
| Renovate | Add `"axios"` to `ignoreDeps` in `renovate.json` |
| `npm update` | Must not be run without `--save-exact` and version verification |

---

## 4. Guard Pattern

Consistent with the project's [guard pattern standards](../../../.lovable/memories/architecture/coding-standards/guard-patterns.md), version validation uses positive existence guards — no compound checks or double negations.

```
// ✅ Compliant guard flow
IF NOT axisVersionExists:
    EXIT early (pass — not a dependency)

IF hasRangeSyntax:
    FAIL immediately

IF isBlockedVersion:
    FAIL immediately

// Only reached if all guards pass
PASS
```

---

## Cross-References

- [Version Policy](./01-version-policy.md)
- [Drift Detection Script](./02-drift-detection-script.md)
- [Acceptance Criteria](./97-acceptance-criteria.md)
- [Guard Pattern Standards](../../../.lovable/memories/architecture/coding-standards/guard-patterns.md)

