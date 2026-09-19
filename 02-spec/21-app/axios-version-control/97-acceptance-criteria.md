# Acceptance Criteria — Axios Version Control

**Version:** 1.0.0  
**Last Updated:** 2026-04-01  

---

## Acceptance Criteria

| ID | Criterion | Source | Status |
|----|-----------|--------|--------|
| AC-001 | Axios version is always defined as an exact version without `^`, `~`, `*`, or range symbols | `01-version-policy.md` §1.1 | Draft |
| AC-002 | No usage of blocked versions (`1.14.1`, `0.30.4`) is present in any environment | `01-version-policy.md` §2.2 | Draft |
| AC-003 | Dependency update tools do not alter Axios version automatically | `01-version-policy.md` §4.1 | Draft |
| AC-004 | Code reviews enforce strict compliance with version policy | `01-version-policy.md` §4.2 | Draft |
| AC-005 | Security note is documented and accessible to developers | `01-version-policy.md` §3 | Draft |
| AC-006 | Forbidden syntax (`^`, `~`, `*`, `>=`, `<`, `\|\|`) is rejected by validation | `03-package-json-safeguard.md` §1.2 | Draft |
| AC-007 | Safeguard validation returns AX-001 on range syntax detection | `03-package-json-safeguard.md` §3.1 | Draft |
| AC-008 | Safeguard validation returns AX-002 on blocked version detection | `03-package-json-safeguard.md` §3.1 | Draft |
| AC-009 | Safeguard validation returns AX-003 warning on unapproved versions | `03-package-json-safeguard.md` §3.1 | Draft |
| AC-010 | Dependabot and Renovate are configured to skip Axios | `03-package-json-safeguard.md` §3.3 | Draft |
| AC-011 | Husky pre-commit hook blocks commits with non-compliant Axios versions | `03-package-json-safeguard.md` §3.2 | Draft |

---

## Edge Cases

| ID | Edge Case | Expected Behavior |
|----|-----------|-------------------|
| EC-001 | Developer adds `"axios": "^1.14.0"` | CI check fails; PR rejected |
| EC-002 | Dependabot opens PR upgrading Axios to `1.14.1` | PR auto-rejected or flagged for manual review |
| EC-003 | New Axios version `1.15.0` released | Remains blocked until manual security audit approves it |
| EC-004 | Lock file contains different Axios version than `package.json` | Drift detection flags mismatch |

