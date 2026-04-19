# Error Resolution & Error Management Specification

> **Version:** 3.1.0  
> **Created:** 2026-02-04  
> **Updated:** 2026-03-30  
> **Status:** PRODUCTION-READY  
> **AI Confidence:** Production-Ready  
> **Ambiguity:** None  
> **Purpose:** Comprehensive error handling, diagnostics, resolution patterns, and structured error architecture across the full React → Go → Delegated Server stack.

---

## Keywords

`error-resolution` · `debugging` · `diagnostics` · `error-handling` · `react` · `golang` · `typescript` · `php` · `stack-trace` · `verification-patterns`

---

## Scoring

| Metric | Value |
|--------|-------|
| AI Confidence | Production-Ready |
| Ambiguity | None |
| Health Score | 100/100 (A+) |

---

## Why This Folder Exists

During development, significant time was wasted on API connectivity issues where:
1. The frontend incorrectly diagnosed a healthy backend as "disconnected"
2. Error diagnostics showed confusing or misleading information
3. The API endpoint response format didn't match frontend expectations

This specification ensures that **ALL projects** (React, CLI, WordPress) follow consistent verification patterns, structured error handling, and comprehensive diagnostics.

---

## Folder Structure

```
04-error-resolution/
├── 00-overview.md                          # This file
├── 01-retrospectives/                      # Case studies of resolved issues
│   ├── 01-health-endpoint-mismatch.md
│   ├── 02-retry-debounce-dedup-fixes.md
│   ├── 03-zip-finalization-before-return.md
│   └── 04-activation-endpoint-mismatch.md
├── 02-verification-patterns/               # Mandatory verification protocols
│   └── 01-frontend-backend-sync.md
├── 03-debugging-guides/                    # Language-specific debugging
│   ├── 01-debugging-php.md
│   ├── 02-debugging-go.md
│   └── 03-debugging-typescript.md
├── 04-cross-reference-diagram.md           # Visual architecture diagram
├── 05-debugging-cheat-sheet.md             # Quick reference for all languages
├── 06-error-handling/                      # Cross-stack error handling architecture
│   ├── 02-error-handling-reference.md                           # 3-tier error flow (React → Go → Delegated)
│   └── go-delegation-fix.md               # DelegatedRequestServer implementation
├── 07-error-modal/                         # Frontend error modal specification
│   ├── 02-error-handling-reference.md                           # Modal architecture, data model, tabs
│   ├── copy-formats.md                     # Copy/export format samples
│   └── react-components.md                # Portable React component code
├── 08-logging-and-diagnostics/             # Logging systems
│   ├── react-execution-logger.md          # Frontend execution tracking
│   └── session-based-logging.md           # Backend session-based request logging
├── 09-response-envelope/                   # Universal Response Envelope spec
│   ├── 02-error-handling-reference.md                           # Canonical envelope specification
│   ├── adr.md                              # Architecture Decision Record
│   ├── configurability.md                  # Conditional section rules
│   ├── changelog.md                        # Migration timeline
│   ├── envelope.schema.json               # JSON Schema (Draft 2020-12)
│   ├── envelope-single.json               # Single-item response sample
│   ├── envelope-multiple.json             # Paginated list sample
│   ├── envelope-error.json                # Error response sample
│   ├── envelope-debug.json                # Debug mode sample
│   └── envelope-minimal.json             # Minimal response sample
├── 10-apperror-package/                    # Go apperror package specification
│   └── readme.md                           # StackTrace, AppError, Result[T], ResultSlice[T], ResultMap[K,V]
├── 97-acceptance-criteria.md
└── 99-consistency-report.md
```

---

## Core Principles

### 1. Never Assume — Always Verify

Before claiming any API endpoint works, ALWAYS verify **both directions**:

| Direction | Verification | Example |
|-----------|--------------|---------|
| **Backend** | Test actual endpoint response | `curl http://localhost:8080/api/v1/health \| jq .` |
| **Frontend** | Check detection logic | What conditions trigger "connected" vs "disconnected"? |

### 2. Response Format Standardization

All backend APIs MUST return the Universal Response Envelope (see [09-response-envelope/](./09-response-envelope/04-response-envelope-reference.md)):

```json
{
  "Status": { "IsSuccess": true, "Code": 200, "Message": "OK" },
  "Attributes": { "RequestedAt": "..." },
  "Results": [{ ... }]
}
```

### 3. HTTP Status as Primary Indicator

Frontend detection logic MUST use HTTP status codes (2xx) as the primary indicator, NOT response body fields.

### 4. Structured Error Architecture

All errors use the three-tier architecture documented in [06-error-handling/](./06-error-handling/02-error-handling-reference.md):
- **Tier 1:** Delegated Server (PHP/other) — structured error responses
- **Tier 2:** Go Backend — `apperror` package with stack traces (see [10-apperror-package/](./10-apperror-package/01-apperror-reference.md))
- **Tier 3:** Frontend — Error store, Global Error Modal (see [07-error-modal/](./07-error-modal/03-error-modal-reference.md))

---

## Quick Reference: Common Pitfalls

| Symptom | Likely Cause | Check |
|---------|--------------|-------|
| "Backend disconnected" but backend running | Response format mismatch | Compare handler output to frontend detection logic |
| 404 on API base URL | No index route registered | Check router for `GET /api/v1` handler |
| VITE_API_URL shows wrong value | Resolved vs raw env confusion | Distinguish raw env var from resolved origin |
| HTML instead of JSON | SPA fallback serving index.html | Check if route exists in backend router |
| CORS errors | Missing CORS headers | Check backend CORS middleware configuration |
| 401/403 on protected routes | Token not sent or expired | Check Authorization header, token validity |

---

## Documents

### Debugging & Resolution

| # | Document | Purpose |
|---|----------|---------|
| 01 | [Retrospectives](./01-retrospectives/) | Case studies of resolved time-wasting issues |
| 02 | [Verification Patterns](./02-verification-patterns/) | Mandatory verification protocols |
| 03 | [Debugging Guides](./03-debugging-guides/) | Language-specific debugging guides |
| 04 | [Cross-Reference Diagram](./04-cross-reference-diagram.md) | Visual architecture of all connected specs |
| 05 | [Debugging Cheat Sheet](./05-debugging-cheat-sheet.md) | Quick reference for PHP, Go, TypeScript |

### Error Architecture (from error-manage merger)

| # | Document | Purpose |
|---|----------|---------|
| 06 | [Error Handling](./06-error-handling/) | Cross-stack 3-tier error flow architecture |
| 07 | [Error Modal](./07-error-modal/) | Frontend Global Error Modal specification |
| 08 | [Logging & Diagnostics](./08-logging-and-diagnostics/) | React execution logger + session-based logging |
| 09 | [Response Envelope](./09-response-envelope/) | Universal Response Envelope spec + schema |
| 10 | [apperror Package](./10-apperror-package/) | Go structured error package specification |

---

## Cross-References

| Reference | Location |
|-----------|----------|
| Coding Guidelines | `../02-coding-guidelines/01-cross-language/15-master-coding-guidelines.md` |
| TypeScript Standards | `../02-coding-guidelines/02-typescript/08-typescript-standards-reference.md` |
| Golang Standards | `../02-coding-guidelines/03-golang/04-golang-standards-reference.md` |
| PHP Standards | `../02-coding-guidelines/04-php/07-php-standards-reference.md` |
| Error Code Registry | `../03-error-code-registry/00-overview.md` |
| Shared CLI Frontend | `../28-shared-cli-frontend/00-overview.md` |
| PowerShell Integration | `../50-powershell-integration/00-overview.md` |

---

## How to Add New Retrospectives

When you encounter a time-wasting issue:

1. Create a new file: `NN-short-description.md` in `01-retrospectives/`
2. Include:
   - **Symptoms**: What did you observe?
   - **Root Cause**: Why did it happen?
   - **Time Wasted**: How long did debugging take?
   - **Solution**: What fixed it?
   - **Prevention**: How to avoid next time?

---

*This specification is mandatory for all projects. Violations result in debugging time waste.*
