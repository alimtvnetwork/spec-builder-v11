# Axios Version Control Policy

**Version:** 1.0.0  
**Last Updated:** 2026-04-01  
**Status:** Active  

---

## Overview

There has been a known security issue affecting specific Axios versions. Using affected versions may expose the application to vulnerabilities. This policy enforces strict version pinning to prevent automatic or accidental adoption of vulnerable releases. Only approved safe versions must be used until further validation is completed.

## Scope

### In Scope

- Exact version pinning for Axios in all environments
- Blocking of known vulnerable versions
- CI and code review enforcement of version compliance
- Security advisory documentation

### Out of Scope

- Patching or forking Axios internals
- Version control policies for other dependencies (covered separately)

---

## 1. Version Pinning Rules

### 1.1 Strict Exact Versioning

Axios shall always be declared with an exact version number. No version range syntax is permitted.

| Symbol | Allowed? | Example |
|--------|----------|---------|
| Exact | ✅ | `"axios": "1.14.0"` |
| Caret (`^`) | ❌ | `"axios": "^1.14.0"` |
| Tilde (`~`) | ❌ | `"axios": "~1.14.0"` |
| Wildcard (`*`) | ❌ | `"axios": "*"` |
| Range (`>=`) | ❌ | `"axios": ">=1.14.0"` |

### 1.2 Dependency Declaration

```json
// ✅ Compliant
{
  "dependencies": {
    "axios": "1.14.0"
  }
}

// ❌ Non-compliant — uses caret
{
  "dependencies": {
    "axios": "^1.14.0"
  }
}
```

---

## 2. Approved and Blocked Versions

### 2.1 Approved Safe Versions

| Version | Status | Notes |
|---------|--------|-------|
| `1.14.0` | ✅ Safe | Recommended for modern projects |
| `0.30.3` | ✅ Safe | Legacy compatibility only |

Selection of version depends on compatibility requirements. It is recommended to define a single standard version per project for consistency.

### 2.2 Blocked Versions

| Version | Status | Reason |
|---------|--------|--------|
| `1.14.1` | ❌ Blocked | Known security vulnerability |
| `0.30.4` | ❌ Blocked | Known security vulnerability |
| Any future version | ❌ Blocked until verified | Must pass manual security review before approval |

> **Never update Axios version automatically. Always use exact version without caret (`^`) or tilde (`~`). Avoid all known vulnerable versions.**

---

## 3. Security Note

There has been a known security issue affecting specific Axios versions. The following points apply:

1. Versions `1.14.1` and `0.30.4` are confirmed affected and must never be used
2. Using affected versions may expose the application to request/response interception vulnerabilities
3. Only approved safe versions (`1.14.0`, `0.30.3`) must be used until further validation is completed
4. Any upgrade to a new Axios version must go through manual verification and explicit approval

---

## 4. Implementation Rules

### 4.1 Dependency Declaration

- Specify Axios version exactly (e.g., `"axios": "1.14.0"`)
- Do not allow automated dependency update tools (Dependabot, Renovate, etc.) to modify the Axios version
- Lock files must be committed and verified

### 4.2 Code Review Enforcement

- Validate `package.json` during every code review
- Reject any pull request that updates the Axios version without explicit security approval
- Reviewers must confirm Axios version matches an approved safe version

### 4.3 Monitoring and Logging

- Log dependency installation versions in CI output
- Track any deviation from approved versions via drift detection
- Alert on unauthorized version changes

### 4.4 CI Pipeline Checks

- Introduce a dependency audit check that validates Axios version on every build
- Add automated alerts for unauthorized version changes
- Integrate with existing drift detection scripts (see `scripts/drift-detect-all.sh`)

---

## 5. Ambiguities and Assumptions

| Item | Resolution |
|------|------------|
| Which version to prefer between `1.14.0` and `0.30.3` | Assume compatibility-based selection; recommend defining a single standard version per project |
| Whether other HTTP clients are affected | Out of scope; this policy covers Axios only |
| Future version approval process | Requires manual security audit and explicit sign-off before adding to approved list |

---

## Cross-References

- [Axios Version Control Overview](./00-overview.md)
- [Acceptance Criteria](./97-acceptance-criteria.md)
- [Consistency Report](./99-consistency-report.md)
- [CI/CD Compliance Automation](../../../.lovable/memories/project/ci-cd-compliance-automation.md)

