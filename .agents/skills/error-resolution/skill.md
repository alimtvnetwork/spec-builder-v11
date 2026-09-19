---
name: error-resolution
description: Diagnose, resolve, and document root cause analysis (RCA) records and retrospectives
---

# Error Resolution Skill

Follows `02-spec/04-error-resolution/` and `.ai-memory/issues/` protocols:

1. **RCA Structure:**
   - Error description & symptoms
   - Exact file/line location
   - One-sentence root cause + deep analysis
   - Fix strategy & verified solution
   - Prevention checklist & non-regression rules
2. **Standard Envelopes:**
   - `{ success: boolean, data: T, error?: { code, message, details, stack }, meta: ApiMeta }`
3. **Core Lessons from Past Failures:**
   - Do not rely on React Query retry loops (use `retry: false`, `refetchOnWindowFocus: false`).
   - Never use `defer` for ZIP writer finalization before returning archive paths.
   - Match backend API endpoints directly with client/PHP route registrations.
   - Never drop stack traces in catch blocks.
