# Memory: project/remediation-status

**Updated:** 2026-03-14  
**Version:** 1.0.0  
**Status:** Active

---

## Overview

The project consists of nine CLI modules and has achieved v13.0.0+ specification readiness. Phase 3 (Strong Typing Remediation) is **fully complete** — all 8 groups remediated across 70+ files. The ecosystem-wide naming remediation (struct tags, JSON keys) is **fully complete** across all specification directories.

---

## Struct Tag & JSON Key Remediation (Complete)

All Go struct JSON/YAML/Mapstructure tags have been converted to implicit PascalCase (redundant tags removed) across the entire specification tree:

| Module | Scope | Status |
|--------|-------|--------|
| AI Bridge CLI (`02-spec/22-ai-bridge-cli/`) | ~75 YAML/JSON tag violations | ✅ |
| Microservices (`02-spec/11-spec-management-software/14-microservices/`) | ~200 struct tags (largest cluster) | ✅ |
| GSearch CLI | JSON key + struct tag alignment | ✅ |
| Exam Manager (`02-spec/30-wp-plugin/`) | JSON keys + PHP log context keys | ✅ |
| WP Plugin ecosystem | 100% remediated | ✅ |
| Feature specifications | All feature spec struct tags | ✅ |
| Database design files | All DB spec struct tags | ✅ |

All external API boundaries (Ollama, OpenAI, Ahrefs, OpenPageRank, Moz) are explicitly annotated with `// EXEMPTED: External API`.

---

## Phase 3 Completion Summary

| Group | Description | Files | Status |
|-------|-------------|-------|--------|
| 1 | Settings Services (`SettingValue` union + `GetTyped[T]()`) | 4 | ✅ |
| 2 | Event Bus payloads (typed event structs) | 12 | ✅ |
| 3 | GORM `.Updates()` (map → typed struct) | 10 | ✅ |
| 4 | API/WebSocket payloads (`APIResponse[T]` generics) | 8 | ✅ |
| 5 | Observability metadata (`ComponentStatus[T any]`) | 6 | ✅ |
| 6 | Test JSON parsing (typed response structs) | 4 | ✅ |
| 7 | Remaining features (case-by-case typed structs) | 25+ | ✅ |
| 8 | `// ALLOWED:` comments on legitimate 3rd-party | 5 | ✅ |

**Strong typing compliance: ≥95%** (up from 78%)

---

## Key Patterns Established

- `ComponentStatus[T any]` — generic health check metadata
- `WSMessage[T any]` — generic WebSocket message envelope
- `WebhookPayload[T any]` — generic webhook data
- `RespondSuccess[T any]()` / `RespondPaginated[T any]()` — generic API helpers
- `ValidateRequest[T any]()` — generic request validation
- `SettingValue` union + `GetTyped[T]()` — typed settings access
- `RagConfigUpdate` with `*int`, `*string`, `*float64` — typed partial updates
- `ErrorDetail` struct — replaces variadic `...interface{}`
- `// ALLOWED: <reason>` — documented exceptions for LangChain Go, Qdrant, OpenAI API, JSON-LD, `database/sql/driver`
- `// EXEMPTED: External API` — annotated third-party contract structs (Ollama, OpenAI, Ahrefs, Moz, OpenPageRank)

---

## Enum Standard

All 9 CLIs are fully migrated to the v2.0.0 enum standard with `Invalid` as the mandatory zero-value constant at index 0.

---

## Completed Phases

- **Phase 4:** ✅ Fixed `database/sql` raw usage residuals (18 files) — replaced with GORM equivalents or ALLOWED comments
- **Phase 5:** ✅ Table naming convention conflict resolved (WP Plugin → PascalCase singular)
- **Phase 6:** ✅ Dashboard & tracker staleness fixed — all percentages, suggestion statuses, and port ranges updated
- **Phase 7:** ✅ IX_ → Idx index prefix migration complete across all spec files (v8.0.0)
- **Phase 8:** ✅ Cross-reference remediation v9.0.0 — stale `../spec-management-software/` paths fixed, orphan `03-shared-frontend-architecture/` merged into `28-shared-cli-frontend/`, gsearch `03-extensions/` renamed to `04-extensions/`
- **Phase 9:** ✅ Struct tag & JSON key remediation — camelCase/snake_case → PascalCase across all spec directories (~275+ tags remediated)
