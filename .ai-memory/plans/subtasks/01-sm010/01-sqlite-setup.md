# Subtask 01 — Core SQLite 4-Tier Setup

> **Parent Plan:** `plans/pending/01-sm010-golang-backend.md`  
> **Batch Scope:** 5 files

---

## Files to Create/Modify (Downstream Repo)

1. `internal/db/system.go` — Read-only embedded SQLite connection
2. `internal/db/config.go` — User configuration database connection & migrator
3. `internal/db/session.go` — Ephemeral session database
4. `internal/db/cache.go` — TTL auto-purging cache database
5. `internal/db/manager.go` — Centralized database manager and health checker
