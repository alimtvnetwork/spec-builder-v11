# Subtask 02 — REST API Endpoints & Response Envelope

> **Parent Plan:** `plans/pending/01-sm010-golang-backend.md`  
> **Batch Scope:** 5 files

---

## Files to Create/Modify (Downstream Repo)

1. `internal/api/router.go` — Route registration using HttpMethod enum
2. `internal/api/handlers/health.go` — Standard `{ success: true, data: { status: "ok" } }` handler
3. `internal/api/handlers/spec.go` — Spec CRUD operations returning `apperror.Result[T]`
4. `internal/api/middleware/auth.go` — JWT auth and Casbin RBAC middleware
5. `internal/api/response.go` — Universal response envelope serialization
