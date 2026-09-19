# Compliance Risk Matrix

**Version:** 2.0.0  
**Created:** 2026-03-03  
**Updated:** 2026-03-14  
**Status:** Active

---

## Overview

This document identifies potential compliance drift scenarios across the 9 Go-based CLI tools and defines mitigation strategies, detection methods, and ownership for each risk. **v2.0.0** adds 7 new risks (R11–R17) covering all Issue #18 audit categories with automated drift detection scripts and verified baselines.

---

## Risk Severity Definitions

| Level | Label | Description |
|-------|-------|-------------|
| 🔴 | **Critical** | Breaks data integrity or security; requires immediate remediation |
| 🟠 | **High** | Degrades observability or violates mandatory standards; fix within 1 sprint |
| 🟡 | **Medium** | Inconsistency that may compound over time; fix within 1 quarter |
| 🟢 | **Low** | Cosmetic or documentation gap; fix opportunistically |

---

## Original Risks (R1–R10)

### R1 — Raw SQL Bypass

| Attribute | Detail |
|-----------|--------|
| **ID** | RISK-001 |
| **Severity** | 🔴 Critical |
| **Scenario** | Developer adds raw SQL (INSERT/UPDATE/DELETE) outside DBOperation wrapper, bypassing structured logging and AffectedRows validation |
| **Affected Standard** | ORM-Only Policy, DBOperation Wrapper |
| **Detection** | `scripts/drift-detect-raw-sql.sh` |
| **Mitigation** | ✅ Fully integrated — pre-commit hook (Husky) + GitHub Actions CI |

---

### R2 — Magic String Configuration Keys

| Attribute | Detail |
|-----------|--------|
| **ID** | RISK-002 |
| **Severity** | 🟠 High |
| **Scenario** | New settings accessed via inline string literals instead of typed constants from `pkg/settings/keys.go` |
| **Detection** | `scripts/drift-detect-magic-strings.sh` |
| **Mitigation** | ✅ Fully integrated — pre-commit hook (Husky) + GitHub Actions CI |

---

### R3 — Missing config.seed.json Entry

| Attribute | Detail |
|-----------|--------|
| **ID** | RISK-003 |
| **Severity** | 🟠 High |
| **Scenario** | New setting added to code with typed constant but not added to `config.seed.json` |
| **Detection** | `scripts/drift-detect-seed-sync.sh` |
| **Mitigation** | ✅ Fully integrated — pre-commit hook (Husky) + GitHub Actions CI |

---

### R4 — Structured Log Field Omission

| Attribute | Detail |
|-----------|--------|
| **ID** | RISK-004 |
| **Severity** | 🟠 High |
| **Scenario** | Database operation logged without all 7 mandatory fields |
| **Detection** | Log output schema validation in integration tests |
| **Mitigation** | ✅ Wrapper enforces all 7 fields automatically |

---

### R5 — Initialization Order Violation

| Attribute | Detail |
|-----------|--------|
| **ID** | RISK-005 |
| **Severity** | 🟡 Medium |
| **Scenario** | Service initialized before database or config, causing nil pointer panics |
| **Detection** | Integration test — `/health/ready` returns all-green within timeout |
| **Mitigation** | ✅ Sequential init with error gates |

---

### R6 — Error Code Range Collision

| Attribute | Detail |
|-----------|--------|
| **ID** | RISK-006 |
| **Severity** | 🟡 Medium |
| **Scenario** | New error codes allocated outside the tool's assigned range |
| **Detection** | CI validator script (SM-RV, codes 2850–2859) |
| **Mitigation** | ✅ SM-RV in CI |

---

### R7 — Schema Migration Without PascalCase

| Attribute | Detail |
|-----------|--------|
| **ID** | RISK-007 |
| **Severity** | 🟡 Medium |
| **Scenario** | New migration adds columns using snake_case or camelCase |
| **Detection** | GORM tag audit |
| **Mitigation** | ✅ Automated struct tag audit |

---

### R8 — Health Endpoint Regression

| Attribute | Detail |
|-----------|--------|
| **ID** | RISK-008 |
| **Severity** | 🟡 Medium |
| **Scenario** | `/health/live` or `/health/ready` removed or broken during refactoring |
| **Detection** | CI smoke test |
| **Mitigation** | ⚠️ Manual — CI recommended |

---

### R9 — Stale Audit Reports

| Attribute | Detail |
|-----------|--------|
| **ID** | RISK-009 |
| **Severity** | 🟢 Low |
| **Scenario** | Quarterly re-audit not performed; reports reference outdated tool versions |
| **Detection** | Date comparison against [quarterly schedule](./quarterly-reaudit-schedule.md) |
| **Mitigation** | ⚠️ Calendar-based |

---

### R10 — Dual/Split Database Drift

| Attribute | Detail |
|-----------|--------|
| **ID** | RISK-010 |
| **Severity** | 🟡 Medium |
| **Scenario** | Standards applied to primary database but not secondary in split-DB tools |
| **Detection** | Multi-DB audit |
| **Mitigation** | ⚠️ Manual |

---

## Issue #18 Risks (R11–R17) — Added 2026-03-14

These risks protect against regression of the ~18,900 violations remediated during the Issue #18 campaign. All have automated drift detection scripts with verified baselines.

### R11 — Context Naming Regression (`ctx`)

| Attribute | Detail |
|-----------|--------|
| **ID** | RISK-011 |
| **Severity** | 🟠 High |
| **Scenario** | New spec code examples introduce `ctx context.Context` instead of `context context.Context` |
| **Affected Standard** | §1.1 Naming — `ctx` abbreviation prohibited |
| **Baseline** | 0 matches (2026-03-14) |
| **Detection** | `scripts/drift-detect-ctx.sh` |
| **Mitigation** | ✅ Fully integrated — pre-commit + CI |

---

### R12 — Error Wrapping Regression (`fmt.Errorf`)

| Attribute | Detail |
|-----------|--------|
| **ID** | RISK-012 |
| **Severity** | 🟠 High |
| **Scenario** | New spec code examples use `fmt.Errorf()` instead of `apperror.Wrap()`/`apperror.New()` |
| **Affected Standard** | §6 Error Handling |
| **Baseline** | 11 matches (2026-03-14) — all in apperror framework docs or historical changelogs |
| **Detection** | `scripts/drift-detect-fmt-errorf.sh` |
| **Mitigation** | ✅ Fully integrated — pre-commit + CI |

---

### R13 — Tuple Return Regression (`(*T, error)`)

| Attribute | Detail |
|-----------|--------|
| **ID** | RISK-013 |
| **Severity** | 🟠 High |
| **Scenario** | New spec code examples use raw `(T, error)` tuples instead of `apperror.Result[T]` |
| **Affected Standard** | §7.1 Single Return |
| **Baseline** | 1 match (2026-03-14) — enum `Parse()` convention, documented as ALLOWED |
| **Detection** | `scripts/drift-detect-tuple-returns.sh` |
| **Mitigation** | ✅ Fully integrated — pre-commit + CI |

---

### R14 — Raw Filesystem Regression (`os.*` / `os.IsNotExist`)

| Attribute | Detail |
|-----------|--------|
| **ID** | RISK-014 |
| **Severity** | 🟡 Medium |
| **Scenario** | New spec code examples use raw `os.Remove`, `os.Stat`, etc. instead of `pathutil` wrappers |
| **Affected Standard** | §13 Filesystem Policy |
| **Baseline** | Cat 4: 10 matches, Cat 5: 0 matches (2026-03-14) — test context ALLOWED |
| **Detection** | `scripts/drift-detect-raw-os.sh` |
| **Mitigation** | ✅ Fully integrated — pre-commit + CI |

---

### R15 — Boolean Negation Regression (raw `!`)

| Attribute | Detail |
|-----------|--------|
| **ID** | RISK-015 |
| **Severity** | 🟡 Medium |
| **Scenario** | New spec code examples use `!v.IsValid()` instead of positive guard methods like `v.IsInvalid()` |
| **Affected Standard** | §3 Boolean Standards |
| **Baseline** | 32 matches (2026-03-14) — exempt patterns (`!ok`, handler guards) |
| **Detection** | `scripts/drift-detect-bool-negation.sh` |
| **Mitigation** | ✅ Fully integrated — pre-commit + CI |

---

### R16 — Type Safety Regression (`interface{}` / `map[string]any`)

| Attribute | Detail |
|-----------|--------|
| **ID** | RISK-016 |
| **Severity** | 🟠 High |
| **Scenario** | New spec code examples introduce `interface{}` or `map[string]any` instead of concrete types or generics |
| **Affected Standard** | §7 Type Safety |
| **Baseline** | `interface{}`: 121, `map[string]any`: 73 (2026-03-14) — framework boundaries, prompt templates |
| **Detection** | `scripts/drift-detect-type-safety.sh` |
| **Mitigation** | ✅ Fully integrated — pre-commit + CI |

---

### R17 — Abbreviation Casing Regression (uppercase `ID`/`URL`/`API`)

| Attribute | Detail |
|-----------|--------|
| **ID** | RISK-017 |
| **Severity** | 🟠 High |
| **Scenario** | New spec code examples use uppercase abbreviations (`UserID`, `BaseURL`, `APIKey`) instead of PascalCase-first-letter (`UserId`, `BaseUrl`, `ApiKey`) |
| **Affected Standard** | §1.2 Abbreviation Standard |
| **Baseline** | 0 matches (2026-03-14) — all exempted patterns excluded (stdlib, proper nouns, research docs) |
| **Detection** | `scripts/drift-detect-abbrev-casing.sh` |
| **Mitigation** | ✅ Fully integrated — pre-commit + CI |

---

## Risk Summary Matrix

| ID | Risk | Severity | Baseline | Detection | Mitigation Status |
|----|------|----------|----------|-----------|-------------------|
| RISK-001 | Raw SQL Bypass | 🔴 Critical | N/A | `drift-detect-raw-sql.sh` | ✅ Pre-commit + CI |
| RISK-002 | Magic String Keys | 🟠 High | N/A | `drift-detect-magic-strings.sh` | ✅ Pre-commit + CI |
| RISK-003 | Missing Seed Entry | 🟠 High | N/A | `drift-detect-seed-sync.sh` | ✅ Pre-commit + CI |
| RISK-004 | Log Field Omission | 🟠 High | N/A | Integration test | ✅ Wrapper enforces |
| RISK-005 | Init Order Violation | 🟡 Medium | N/A | Smoke test | ✅ Sequential init |
| RISK-006 | Error Code Collision | 🟡 Medium | N/A | Registry validator | ✅ SM-RV in CI |
| RISK-007 | Schema Non-PascalCase | 🟡 Medium | N/A | Struct tag audit | ✅ Automated |
| RISK-008 | Health Endpoint Regression | 🟡 Medium | N/A | CI smoke test | ⚠️ Manual |
| RISK-009 | Stale Audit Reports | 🟢 Low | N/A | Date comparison | ⚠️ Calendar-based |
| RISK-010 | Dual/Split DB Drift | 🟡 Medium | N/A | Multi-DB audit | ⚠️ Manual |
| RISK-011 | `ctx` abbreviation | 🟠 High | 0 | `drift-detect-ctx.sh` | ✅ Pre-commit + CI |
| RISK-012 | `fmt.Errorf` usage | 🟠 High | 11 | `drift-detect-fmt-errorf.sh` | ✅ Pre-commit + CI |
| RISK-013 | Tuple returns | 🟠 High | 1 | `drift-detect-tuple-returns.sh` | ✅ Pre-commit + CI |
| RISK-014 | Raw `os.*` calls | 🟡 Medium | 10/0 | `drift-detect-raw-os.sh` | ✅ Pre-commit + CI |
| RISK-015 | Boolean negation | 🟡 Medium | 32 | `drift-detect-bool-negation.sh` | ✅ Pre-commit + CI |
| RISK-016 | Type safety | 🟠 High | 121/73 | `drift-detect-type-safety.sh` | ✅ Pre-commit + CI |
| RISK-017 | Abbreviation casing | 🟠 High | 0 | `drift-detect-abbrev-casing.sh` | ✅ Pre-commit + CI |

---

## Post-Remediation Baseline (2026-03-14)

Established after completion of Issue #18 (89 waves, ~18,900 remediations). All counts represent non-actionable residuals (rule-prose, framework boundaries, exempted patterns).

| Category | Script | Baseline | Notes |
|----------|--------|:--------:|-------|
| Cat 1 — `ctx` | `drift-detect-ctx.sh` | 0 | All exempted in guideline/issue dirs |
| Cat 2 — `fmt.Errorf` | `drift-detect-fmt-errorf.sh` | 11 | apperror docs, changelogs |
| Cat 3 — Tuples | `drift-detect-tuple-returns.sh` | 1 | Enum `Parse()` convention |
| Cat 4 — Raw `os.*` | `drift-detect-raw-os.sh` | 10 | Test context ALLOWED |
| Cat 5 — `os.IsNotExist` | `drift-detect-raw-os.sh` | 0 | All in excluded dirs |
| Cat 6 — Boolean `!` | `drift-detect-bool-negation.sh` | 32 | `!ok`, handler guards |
| Cat 7 — Abbreviations | `drift-detect-abbrev-casing.sh` | 0 | Stdlib, proper nouns, research docs excluded |
| Cat 8a — `interface{}` | `drift-detect-type-safety.sh` | 121 | Framework boundaries, prompts |
| Cat 8b — `map[string]any` | `drift-detect-type-safety.sh` | 73 | Prompt templates, seedable-config |

---

## Related Documents

| Document | Path |
|----------|------|
| Compliance Dashboard | [00-compliance-dashboard.md](./00-compliance-dashboard.md) |
| Consolidated Audit Summary | [consolidated-cli-audit-summary-2026-03-03.md](./consolidated-cli-audit-summary-2026-03-03.md) |
| Quarterly Re-Audit Schedule | [quarterly-reaudit-schedule.md](./quarterly-reaudit-schedule.md) |
| Drift Detection Script Spec | [drift-detection-script-spec.md](./drift-detection-script-spec.md) |
| Issue #18 Completion Certificate | [CERT-2026-0314-ISS18](../../02-spec/validation-reports/05-completion-certificate-issue-18.md) |
| Issue #18 Tracking | [02-spec/61-how-app-issues-track/18-comprehensive-code-example-audit.md](../../02-spec/61-how-app-issues-track/18-comprehensive-code-example-audit.md) |

---

*Risk matrix v2.0.0 — updated 2026-03-14. Review quarterly alongside re-audit cycle.*
