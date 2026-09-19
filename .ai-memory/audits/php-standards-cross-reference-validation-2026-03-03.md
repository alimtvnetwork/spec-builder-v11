# PHP Coding Standards — Cross-Reference Validation Report

> **Date:** 2026-03-03 (updated)  
> **Scope:** All PHP-related memory files in `.lovable/memories/architecture/coding-standards/`

---

## Memory Files Validated

| # | Memory File | Canonical Spec | Status |
|---|------------|----------------|--------|
| 1 | `php-plugin-identity-constants.md` | `02-spec/02-coding-guidelines/04-php/forbidden-patterns.md` § 9 | ✅ Consistent |
| 2 | `php-plugin-identity-constants.md` | `02-spec/33-wp-plugin-development/11-coding-guidelines.md` | ✅ Consistent |
| 3 | `php-array-keys-pascalcase.md` | `02-spec/02-coding-guidelines/04-php/naming-conventions.md` §API/DB keys | ✅ Consistent |
| 4 | `php-array-keys-pascalcase.md` | `02-spec/02-coding-guidelines/04-php/forbidden-patterns.md` § 11 | ✅ Consistent |
| 5 | `php-file-logging-and-error-stack.md` | `02-spec/33-wp-plugin-development/02-logging-standards.md` | ✅ Consistent |
| 6 | `php-file-logging-and-error-stack.md` | `02-spec/33-wp-plugin-development/07-error-handling.md` | ✅ Consistent |
| 7 | `php-file-logging-and-error-stack.md` | `02-spec/02-coding-guidelines/04-php/forbidden-patterns.md` § 1.8 | ✅ Consistent |
| 8 | `filesystem-access.md` (PHP portion) | `02-spec/33-wp-plugin-development/13-path-handling.md` | ✅ Consistent |
| 9 | `no-magic-strings-log-keys.md` (PHP cross-ref) | `php-plugin-identity-constants.md` | ✅ Consistent |
| 10 | `boolean-logic.md` (PHP casing) | `02-spec/02-coding-guidelines/04-php/naming-conventions.md` | ✅ Consistent |

---

## Rule Consistency Details

### 1. Plugin Identity Constants (Rules 9.1–9.8)

| Rule | Memory | Spec | Match |
|------|--------|------|-------|
| LogPrefix from enum | ✅ Prohibited section | ✅ Rule 9.1 | ✅ |
| Name from enum | ✅ Prohibited section | ✅ Rules 9.3–9.6 | ✅ |
| Slug from enum | ✅ Prohibited section (`$handle`) | ✅ Rule 9.7 | ✅ |
| Templates must use enum | ✅ Templates section | ✅ Rules 9.7, 9.8 | ✅ |
| Autoloader exempt | ✅ Exception section | ✅ Spec line 308 | ✅ |
| PHPDoc exempt | ✅ Exception section | ✅ Spec line 310 | ✅ |

### 2. Array Keys PascalCase

| Rule | Memory | Spec | Match |
|------|--------|------|-------|
| API response keys PascalCase | ✅ | `naming-conventions.md` §API Response Keys | ✅ |
| DB column keys PascalCase | ✅ | `naming-conventions.md` §Database Column Keys | ✅ |
| WP core hooks exempt | ✅ (implicit) | `naming-conventions.md` summary table | ✅ |

### 3. File Logging & Error Stack (Updated 2026-03-03)

| Rule | Memory | Spec | Match |
|------|--------|------|-------|
| Dual-file logging (plugin.log + error.txt) | ✅ | `02-logging-standards.md` §File Logger | ✅ |
| Every file load logged | ✅ | `02-logging-standards.md` §What to Log | ✅ |
| Error stack captured on failure | ✅ | `07-error-handling.md` §Core Principle | ✅ |
| `FileLogger::error()` accepts `?Throwable` | ✅ Required Pattern section | ✅ `02-logging-standards.md` signature | ✅ |
| Every catch block must pass `$e` | ✅ Critical rule | ✅ `07-error-handling.md` §CRITICAL | ✅ |
| Forbidden: `->error($e->getMessage())` without `$e` | ✅ Forbidden Pattern section | ✅ `forbidden-patterns.md` rule 1.8 | ✅ |
| Early-boot uses `errorLogWithPrefix()` | ✅ (implicit via cross-ref) | ✅ `02-logging-standards.md` §Early-Boot | ✅ |

### 4. Filesystem Access (PHP)

| Rule | Memory | Spec | Match |
|------|--------|------|-------|
| No raw `file_exists` | ✅ | `13-path-handling.md` §PathHelper | ✅ |
| Use `PathHelper` wrappers | ✅ | `13-path-handling.md` §2.1 | ✅ |

---

## Issues Found & Fixed

| # | Issue | File | Fix | Date |
|---|-------|------|-----|------|
| 1 | Broken reference to `php-api-design.md` (file doesn't exist) | `php-array-keys-pascalcase.md` | Updated reference to canonical spec | 2026-03-03 |
| 2 | Catch blocks drop stack trace — `$e` not passed to logger (Issue #17) | `php-file-logging-and-error-stack.md`, 4 spec files | Added rule 1.8, updated FileLogger signature, fixed all 10+ code examples | 2026-03-03 |

---

## Audit Trail — Full Inventory

| Report | Location | Date | Scope |
|--------|----------|------|-------|
| PHP Standards Cross-Reference | `.lovable/audits/php-standards-cross-reference-validation-2026-03-03.md` | 2026-03-03 | PHP memory ↔ spec alignment |
| Struct Tag Compliance Certificate | `.lovable/audits/compliance-certificate-struct-tags-2026-03-03.md` | 2026-03-03 | Go struct tag standards |
| Final Struct Tag Verification | `.lovable/audits/final-struct-tag-verification-2026-03-03.md` | 2026-03-03 | 12-wave remediation summary |
| Struct Tag Scan | `.lovable/audits/struct-tag-verification-scan-2026-03-03.md` | 2026-03-03 | ~1,601 violation tracking |
| Remediation Summary | `.lovable/audits/remediation-summary-report-2026-03-03.md` | 2026-03-03 | Ecosystem-wide remediation |
| Phases 01–17 | `.lovable/audits/phase-{01..17}-*-audit.md` | 2026-02 | Per-module compliance audits |
| CLI Audits | `.lovable/audits/{tool}-cli-*-audit-*.md` | 2026-02 | Per-CLI tool compliance |
| Waves 1–6 | `.lovable/audits/wave-{1..6}-*-remediation.md` | 2026-02/03 | Incremental remediation waves |

---

## Verdict

**All 7 PHP-related memory files are consistent with their canonical spec files.** Two issues were found and fixed: one broken cross-reference and one critical missing-stack-trace pattern (Issue #17). Zero content inconsistencies remain.
