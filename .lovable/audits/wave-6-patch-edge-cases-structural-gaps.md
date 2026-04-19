# Wave 6 Patch: Missing Edge Cases & Structural Gaps

**Date:** 2026-02-07  
**Scope:** All 13 acceptance criteria files  
**Status:** Complete

---

## Structural Fixes (12 gaps resolved)

| # | Gap | Resolution |
|---|-----|-----------|
| 1 | `CL-01` ID collision (Changelog vs Component Library) | Component Library renamed to `CL-03` in `spec/28-shared-cli-frontend/99-acceptance-criteria.md` |
| 2 | `SS-01` ID collision (GSearch Scheduled Search vs Settings Service) | Scheduled Search renamed to `GS-SS-02` in `spec/20-gsearch-cli/01-backend/99-acceptance-criteria.md` |
| 3 | Shared Frontend Settings IDs ambiguous | Prefixed to `SF-SS-01` / `SF-SS-02` |
| 4 | Nexus Flow thin coverage (8 criteria) | Expanded to 16 criteria: added NF-03 (parallel), NF-04 (dry run), NF-08 (CRUD), NF-10 edge, NF-12 (metrics), NF-13–NF-16 (timeout, output, cancellation, webhooks) |
| 5 | Spec Reverse thin coverage (7 criteria) | Expanded to 13 criteria: added SR-03b (dependency graph), SR-02 edge (overwrite), SR-04 edge (AI truncation), SR-07 edges (scope all, locked files), SR-08 (health check) |
| 6 | Missing recursive variable resolution in AI Bridge | Added AB-08 edge cases for recursive resolution and circular reference detection |
| 7 | Missing recursive variable resolution in WP SEO | Added WS-04 edge case for circular reference loop detection |
| 8 | Missing model switching during active session in AI Bridge | Added AB-04b criterion |
| 9 | Missing malformed WebSocket JSON handling | Added to WS-04 (Shared Frontend) and WS-06 (WP SEO) |
| 10 | Missing clipboard fallback for AT-04/cURL Export | Added to Shared Frontend AT-04 |
| 11 | All files bumped to version 1.1.0 (BRun to 2.1.0) | Consistent versioning |
| 12 | Footer notes updated to indicate "(Patched)" status | All 13 files |

---

## Edge Cases Added (34 total)

### Error Resolution (2 added)
- ER-01: Sensitive data redaction in error Details
- ER-02: Clipboard API unavailable fallback + missing Code field handling

### Shared CLI Frontend (2 added)
- WS-04: Malformed WebSocket JSON parse error handling
- AT-04: Clipboard API fallback for cURL export

### Split DB Architecture (3 added)
- SD-01: Read-only filesystem error
- SD-03: Concurrent goroutine race condition on sequence numbers
- RA-02: Locked database file during reset

### Seedable Config (2 added)
- SC-02: Concurrent CLI instance seeding race condition
- SC-05: sync.Map concurrent write safety

### PowerShell Integration (1 added)
- PS-06: SIGINT pipeline interruption cleanup

### GSearch CLI (2 added)
- NS-02: 429 rate limiting on content fetch
- FC-01: Malformed robots.txt best-effort parsing

### BRun CLI (1 added)
- RT-06: Windows SIGTERM → taskkill fallback

### AI Bridge CLI (4 added)
- AB-04b: Model switching during active session (new criterion)
- AB-08: Recursive variable resolution (3 levels)
- AB-08: Circular variable reference detection

### Nexus Flow CLI (8 added — expansion)
- NF-01: Circular dependency cycle detection
- NF-03: Parallel stage execution + failure handling
- NF-04: Pipeline dry run
- NF-06: Error wrapping for delegated CLIs
- NF-08: Pipeline definition CRUD + 409 conflict
- NF-10: Degraded health check on DB unreachable
- NF-11: Scope `all` reset + error code range
- NF-13–NF-16: Stage timeout, output capture, cancellation, webhooks

### WP Plugin Builder (2 added)
- WB-01: PHP namespace sanitization
- WB-06: Ambiguous hook name disambiguation

### WP SEO Publish CLI (3 added)
- WS-02: 429 rate limiting during publish
- WS-04: Recursive variable loop detection
- WS-06: Malformed WebSocket notification JSON

### Spec Reverse CLI (6 added — expansion)
- SR-01: Large directory (>10K files) memory bounds
- SR-02: Spec overwrite/merge/skip prompt
- SR-03b: Dependency graph generation (new criterion)
- SR-04: AI response truncation on max token limit
- SR-07: Scope `all` reset + locked file handling
- SR-08: Health check (new criterion)

### AI Transcribe CLI (2 added)
- AT-05: OS-level microphone permission denial
- AT-07: Voice cloning minimum duration validation

---

## Summary

| Metric | Before | After |
|--------|--------|-------|
| Total criteria | ~188 | ~200 |
| Total edge cases | ~95 | ~129 |
| Intra-silo ID collisions | 2 | 0 |
| Cross-silo ID collisions | 3 | 0 |
| Thin silos (<10 criteria) | 2 | 0 |

---

## Cross-Silo ID Collision Fix (Patch v2)

| # | Collision | Resolution |
|---|-----------|------------|
| 1 | WS-* (WP SEO) vs WS-* (Shared FE WebSocket) | WP SEO renamed to **WSP-*** |
| 2 | AT-* (Shared FE API Tester) vs AT-* (AI Transcribe) | API Tester renamed to **APT-*** |
| 3 | PM-01 (Shared FE) vs PM-01 (BRun) | Shared FE renamed to **SF-PM-01** |

---

*All 13 acceptance criteria files patched in a single batch.*
