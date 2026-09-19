# CI/CD Compliance Automation

**Created:** 2026-03-04  
**Version:** 1.0.0  
**Status:** Active

---

## Overview

Automated compliance drift detection is enforced at two layers: **local** (pre-commit hooks via Husky) and **remote** (GitHub Actions CI on pull requests). This ensures architectural standards are validated before code enters the repository.

---

## Drift Detection Scripts

| Script | Path | Risk Covered | Description |
|--------|------|--------------|-------------|
| Raw SQL Detector | `scripts/drift-detect-raw-sql.sh` | RISK-001 | Flags `db.Exec`, `db.Raw`, raw INSERT/UPDATE/DELETE outside `DBOperation` wrapper |
| Magic String Detector | `scripts/drift-detect-magic-strings.sh` | RISK-002 | Flags `GetString("…")` etc. using inline literals instead of typed constants from `pkg/settings/keys.go` |
| Seed Sync Validator | `scripts/drift-detect-seed-sync.sh` | RISK-003 | Compares constants in `pkg/settings/keys.go` against keys in `config.seed.json` |
| Unified Runner | `scripts/drift-detect-all.sh` | All | Runs all three detectors and reports combined pass/fail |

### Exemption Mechanism

Lines containing `// drift-exempt: <justification>` are excluded from detection. Valid justifications: `fts5`, `vector`, `cte`.

---

## Integration Points

### Pre-Commit Hook (Husky)

- **File:** `.husky/pre-commit`
- **Trigger:** Every `git commit`
- **Command:** `bash scripts/drift-detect-all.sh`
- **Behavior:** Commit is blocked if any drift check fails

### GitHub Actions CI

- **File:** `.github/workflows/compliance.yml`
- **Trigger:** Pull requests modifying `internal/**`, `pkg/**`, or `config.seed.json`
- **Steps:** Checkout → Install `jq` → Run `bash scripts/drift-detect-all.sh`
- **Behavior:** PR check fails if any drift check fails

---

## Error Code Validation (Separate Pipeline)

Error code registry integrity is enforced independently via:
- `npm run validate:errors` (also in `.husky/pre-commit`)
- Vitest-based collision detection for integer codes and constant names
- Whitelisted intentional overlaps: PowerShell/AI Bridge (9500–9540), GSearch/BRun (7100–7599)

---

## Related Documents

| Document | Path |
|----------|------|
| Compliance Risk Matrix | `.lovable/audits/compliance-risk-matrix.md` |
| Drift Detection Script Spec | `.lovable/audits/drift-detection-script-spec.md` |
| Compliance Dashboard | `.lovable/audits/00-compliance-dashboard.md` |
| Error Code Automation Memory | `.lovable/memories/architecture/error-code-registry/automation-and-ci.md` |
| Quarterly Re-Audit Schedule | `.lovable/audits/quarterly-reaudit-schedule.md` |
