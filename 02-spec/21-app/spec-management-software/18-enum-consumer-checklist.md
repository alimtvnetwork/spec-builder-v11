# Enum Consumer Checklist

**Version:** 2.0.0  
**Updated:** 2026-03-09  
**Status:** Active

---

## Overview

This checklist MUST be followed whenever an enum is added, modified, or removed across any language in the project. Enums are cross-language contracts — a change in one language may require updates in all consumers.

---

## Checklist

Any modification to an enum must complete **all** applicable steps:

1. **Update PHP enum file** — Add/modify/remove the backed enum case
2. **Update Go enum file** (if mirrored) — Ensure the Go `const` block matches
3. **Update TypeScript constants/types** — Sync frontend type definitions
4. **Update database migration** (if stored values change) — Add migration for renamed/removed values
5. **Update API documentation** — Reflect new/changed enum values in endpoint specs
6. **Update admin templates** referencing the enum — Fix dropdowns, filters, display logic

---

## When Does This Apply?

| Change Type | Checklist Required? |
|-------------|-------------------|
| New enum case added | ✅ Yes |
| Enum case renamed | ✅ Yes — includes DB migration |
| Enum case removed | ✅ Yes — includes DB migration + deprecation |
| Enum backing value changed | ✅ Yes — includes DB migration |
| New enum created | ✅ Yes |
| Enum method added (e.g., `route()`) | ⚠️ Only if consumed cross-language |
| Code referencing enum updated | ❌ No |

---

## Cross-Language Enum Locations

| Language | Location Pattern | Example |
|----------|-----------------|---------|
| PHP | `includes/Enums/{EnumName}Type.php` | `EndpointType.php` |
| Go | `internal/enums/{enum_name}.go` | `endpoint_type.go` |
| TypeScript | `src/lib/constants/{enum-name}.ts` | `endpoint-type.ts` |

---

## Cross-References

- [Master Coding Guidelines — §12](../02-coding-guidelines/01-cross-language/15-master-coding-guidelines.md) — Enum synchronization rules
- [PHP Enum Standards](../02-coding-guidelines/04-php/01-enums.md) — PHP backed enum patterns
- [Go Enum Specification](../02-coding-guidelines/03-golang/01-enum-specification/00-overview.md) — Go enum patterns
- [PHP-Go Consistency Audit](../02-coding-guidelines/04-php/04-php-go-consistency-audit.md) — Cross-language alignment
