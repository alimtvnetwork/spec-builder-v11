# Learned: Retrospectives & Architectural Failure Learnings

> **Source:** `02-spec/04-error-resolution/01-retrospectives/` & `.lovable/solved-issues/`

---

## 1. Health Endpoint Format Mismatch (E9005)

- **Symptom:** Frontend displayed "Backend disconnected" despite healthy Go backend.
- **Root Cause:** Backend returned `status: "healthy"`, while frontend checked `data.status === "ok"`.
- **Fix:** Standardized response envelope `{ success: true, data: { status: "ok", timestamp: ... } }`. Frontend relies on 2xx HTTP status.

## 2. React Query Retry Loops & Refetch Storms

- **Symptom:** Triple error toasts on failure and storm of 10-20 API requests on window focus.
- **Root Cause:** React Query default `retry: 3` and `refetchOnWindowFocus: true`.
- **Fix:** Configured `retry: false` and `refetchOnWindowFocus: false` globally. Added 30s dedup cooldown locks.

## 3. ZIP File Finalization Race Condition

- **Symptom:** "Could not find plugin file after extraction" on upload.
- **Root Cause:** Functions used `defer zipWriter.Close()`, closing the archive *after* return, so caller opened it before central directory was written.
- **Fix:** Explicitly close writer first, then file *before* returning the path. Never use defer for ZIP finalization.

## 4. Activation Endpoint 404

- **Symptom:** 404 error calling `/plugins/{slug}/enable`.
- **Root Cause:** Go backend declared endpoints not present in PHP companion plugin.
- **Fix:** Pass `activate: true` during upload or fall back to WordPress Core API (`PUT /wp/v2/plugins/{id}`).

## 5. Axios Security Vulnerabilities

- **Symptom:** Security audit flagged Axios 1.14.1 and 0.30.4.
- **Fix:** Strictly pin to 1.14.0 or 0.30.3; ban range syntax (`^`, `~`) in package manifests.
