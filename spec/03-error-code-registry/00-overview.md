# Error Code Registry - Cross-Project Utility

> **Version:** 2.1.0  
> **Updated:** 2026-03-30  
> **AI Confidence:** Production-Ready  
> **Ambiguity:** None  
> **Purpose:** Standardized error code ranges for all projects  
> **Scope:** Cross-project utility

---

## Keywords

`error-codes` · `registry` · `cross-project` · `debugging` · `integer-codes` · `prefixed-codes` · `collision-prevention`

---

## Scoring

| Metric | Value |
|--------|-------|
| AI Confidence | Production-Ready |
| Ambiguity | None |
| Health Score | 100/100 (A+) |

---

## Overview

This specification defines a centralized error code registry that ensures:
- **No collisions** between projects
- **Consistent structure** for debugging
- **Machine-parseable** error codes
- **Human-readable** messages

---

## Error Code Formats

The ecosystem supports **two** error code formats:

### Format 1: Prefixed (General Specs & PHP Plugins)

```
[PROJECT]-[CATEGORY]-[NUMBER]
```

| Component | Format | Example |
|-----------|--------|---------|
| PROJECT | 2-4 uppercase letters | `SM`, `LM`, `PS` |
| CATEGORY | 3-digit number | `100`, `500` |
| NUMBER | 2-digit number | `01`, `99` |

**Full Example:** `SM-500-01` = Spec Management, Database category, error #01

### Format 2: Integer (Go CLI Tools)

```
[4-5 digit integer]
```

| Component | Format | Example |
|-----------|--------|---------|
| Code | 4-5 digit integer | `7001`, `9301`, `14200` |

**Full Example:** `9301` = AI Bridge, RAG Validation, error #01

Go CLI tools (GSearch, BRun, AI Bridge, Nexus Flow, WP SEO Publish, Spec Reverse, WP Plugin Builder, AI Transcribe) use flat integer codes in API responses, `const` definitions, and logs. The project prefix is implicit from the range.

---

## Registered Ranges (Quick Reference)

| Prefix | Project | Range |
|--------|---------|-------|
| `GEN` | General/Shared | 0-999 |
| `SM` | Spec Management | 2000-2999 |
| `GS` | GSearch (all modules) | 7000-7919 |
| `BR` | BRun | 7100-7599 |
| `NF` | Nexus Flow | 8000-8099 |
| `AB` | AI Bridge (all modules) | 9000-9999, 19000-19049 |
| `PS` | PowerShell | 9500-9540 |
| `WPB` | WP Plugin Builder | 10000-10499 |
| `SRC` | Spec Reverse | 11000-11999 |
| `WSP` | WP SEO Publish | 12000-12599 |
| `WPP` | WP Plugin Publish | 13000-13499 |
| `AIT` | AI Transcribe | 14000-14499 |
| `EQM` | Exam Manager | 14500-14999 |
| `LM` | Link Manager | 15000-15999 |
| `SM-CG` | SM Code Generation | 16000-16799 |
| `SM-PE` | SM Project Editor | 17000-17999 |
| `SM-GS` | SM GSearch (Ecosystem Remap) | 18000-18249 |
| `AB-LR` | AB Lovable Reasoning | 19000-19049 |

> See `01-registry.md` for the complete master list with sub-ranges, collision resolution log, and range allocation map.

---

## Category Ranges (Per Project)

Within each project's range (applicable to prefixed format):

| Offset | Category | Description |
|--------|----------|-------------|
| +000-099 | General | Initialization, config |
| +100-199 | Authentication | Login, tokens, sessions |
| +200-299 | Authorization | Permissions, roles |
| +300-399 | Validation | Input validation |
| +400-499 | Business Logic | Domain-specific errors |
| +500-599 | Database | CRUD, migrations |
| +600-699 | External Services / Type Casting | APIs, integrations; GEN uses for cast/conversion |
| +700-799 | File System | I/O operations |
| +800-899 | Network | HTTP, WebSocket |
| +900-999 | Reserved | Future use |

---

## Files in This Spec

| File | Purpose |
|------|---------|
| `00-overview.md` | This file - structure and conventions |
| `01-registry.md` | Master list of all registered codes |
| `02-integration-guide.md` | How to add codes to your project |
| `error-codes-master.json` | Machine-readable master index of all modules |
| `04-error-code-utilization-report.md` | Auto-generated range utilization report |
| `98-changelog.md` | Version history and registry changes |
| `schemas/error-code.schema.json` | JSON schema for validation |
| `templates/error-codes.template.md` | Template for project error docs |

---

## Quick Reference

**To register new codes:**
1. Check the Range Allocation Map in `01-registry.md`
2. Claim a project prefix
3. Add your codes following category offsets
4. Document in your project's spec folder
5. Update `01-registry.md` in the same commit

**To use in code (Go CLI):**
```go
// Go CLI — integer codes
const (
    ErrRagChunkSizeInvalid = 9301
    ErrRagOverlapTooLarge  = 9303
)
```

**To use in code (PHP / General):**
```go
// General format
return errors.New("SM-500-01: Database connection failed")
```

```typescript
// TypeScript example  
throw new AppError("SM-300-01", "Invalid email format");
// or for CLI frontend:
throw new AppError(9301, "Chunk size outside valid range");
```

---

## Related Specs

| Reference | Description |
|-----------|-------------|
| [Error Resolution](../04-error-resolution/00-overview.md) | Debugging and verification patterns |
| [Go Debugging Guide](../04-error-resolution/03-debugging-guides/02-debugging-go.md) | Error response envelope implementation |
| [PHP Debugging Guide](../04-error-resolution/03-debugging-guides/01-debugging-php.md) | WordPress error handling |
| [TypeScript Debugging Guide](../04-error-resolution/03-debugging-guides/03-debugging-typescript.md) | React frontend error handling |
| [PowerShell Error Codes](../50-powershell-integration/04-error-codes.md) | PowerShell exit codes |
| [SM Project Errors](../11-spec-management-software/06-error-management/) | Spec Management errors |
