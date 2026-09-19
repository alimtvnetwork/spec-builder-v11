# Drift Detection System

**Version:** 1.0.0  
**Last Updated:** 2026-04-01

---

## Overview

Architectural integrity is protected by a Compliance Risk Matrix (v2.0.0) and an automated drift detection system (`scripts/drift-detect-all.sh`). This system enforces 17+ risks (RISK-001 to RISK-018) through pre-commit hooks and CI pipelines.

## Enforced Risks

| Risk ID | Description |
|---------|-------------|
| RISK-001–RISK-010 | Core naming, structure, and convention checks |
| RISK-011 | Naming convention violations |
| RISK-012 | Error handling violations |
| RISK-013 | Return signature violations |
| RISK-014–RISK-015 | Filesystem access violations |
| RISK-016 | Boolean logic violations |
| RISK-017 | Abbreviation casing violations |
| RISK-018 | Axios version drift (unpinned or vulnerable) |

## Integration

- **Pre-commit:** Husky hook runs `scripts/drift-detect-all.sh`
- **CI:** GitHub Actions `compliance.yml` runs the same script
- **Per-dependency scripts:** `scripts/drift-detect-axios.sh` for Axios-specific checks

## Cross-References

- [Compliance Risk Matrix](../../audits/compliance-risk-matrix.md)
- [Axios Drift Detection Spec](../../../02-spec/10-app/axios-version-control/02-drift-detection-script.md)
