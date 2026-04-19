# Coding Guidelines

**Version:** 2.1.0  
**Updated:** 2026-03-30  
**AI Confidence:** Production-Ready  
**Ambiguity:** None

---

## Purpose

Consolidated coding standards and conventions organized by category. This folder is the **single canonical location** for all language-specific and cross-language coding guidelines.

---

## Keywords

`coding-standards` · `cross-language` · `typescript` · `golang` · `php` · `rust` · `naming-conventions` · `boolean-patterns` · `dry` · `strict-typing`

---

## Scoring

| Metric | Value |
|--------|-------|
| AI Confidence | Production-Ready |
| Ambiguity | None |
| Health Score | 100/100 (A+) |

---

## Categories

| # | Category | Description | Files |
|---|----------|-------------|-------|
| 01 | [Cross-Language](./01-cross-language/00-overview.md) | Language-agnostic rules: DRY, naming, booleans, typing, complexity | 19 |
| 02 | [TypeScript](./02-typescript/00-overview.md) | TypeScript enum patterns, type safety, connection/entity/export status | 12 |
| 03 | [Golang](./03-golang/00-overview.md) | Go coding standards, enum specification, boolean rules, HTTP method enum | 13 |
| 04 | [PHP](./04-php/00-overview.md) | PHP coding standards, enums, forbidden patterns, naming conventions | 11 |
| 05 | [Rust](./05-rust/00-overview.md) | Rust standards: naming, error handling, async, memory safety, FFI | 9 |

---

## Migration Note

This folder consolidates content previously located at:

| Old Location | New Location |
|-------------|--------------|
| `spec/02-coding-guidelines/01-cross-language/` | `spec/02-coding-guidelines/01-cross-language/` |
| `spec/02-coding-guidelines/02-typescript/` | `spec/02-coding-guidelines/02-typescript/` |
| `spec/02-coding-guidelines/03-golang/` | `spec/02-coding-guidelines/03-golang/` |
| `spec/02-coding-guidelines/04-php/` | `spec/02-coding-guidelines/04-php/` |

---

## Cross-References

- [General Spec](../01-general-spec/00-overview.md)
- [Error Resolution](../04-error-resolution/00-overview.md)
- [Generic Enforce](../08-generic-enforce/00-overview.md)
