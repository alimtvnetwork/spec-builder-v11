# Memory: technical/debugging-cheat-sheet

**Updated:** 2026-02-04  
**Version:** 1.0.0  
**Status:** Active  
**Source:** `spec/04-error-resolution/05-debugging-cheat-sheet.md`

---

## Quick Reference

A multi-language debugging cheat sheet consolidates patterns for PHP, Go, and TypeScript debugging across the ecosystem.

---

## Universal Principles

| Principle | Description |
|-----------|-------------|
| **Never Assume** | Always verify endpoints exist before implementing |
| **HTTP Status First** | Use HTTP status codes (2xx) as primary indicator, not response body |
| **Standard Envelope** | All backends return `{success, data, error}` format |
| **Diagnostics** | Always show raw env vars vs resolved values |

---

## Initialization Order (ALL Languages)

```
1. Configuration    → Load env vars and config files FIRST
2. Directories      → Ensure all required directories exist
3. Database         → Initialize connections (only after dirs exist)
4. Services         → Initialize business logic components
5. Server/App       → Start ONLY after all dependencies ready
```

---

## Language Quick References

### PHP
- **Log Locations:** `wp-content/uploads/{plugin-slug}/logs/debug.log`
- **Enable:** `define('PLUGIN_DEBUG_LOGGING', true);`
- **Common Issues:** PDO SQLite extension, directory permissions

### Go
- **Logging:** zerolog with correlation IDs
- **Debug Mode:** `export DEBUG=true && ./cli-name serve`
- **Test Endpoint:** `curl -s http://localhost:8080/api/v1/health | jq .`
- **Common Issues:** Address binding, CORS, database locks (use WAL mode)

### TypeScript/React
- **Logger Methods:** `logger.debug()`, `logger.info()`, `logger.warn()`, `logger.error()`, `logger.api()`
- **Detection:** Use `response.ok` as PRIMARY indicator
- **DevTools:** React Query DevTools for state debugging
- **Common Issues:** API URL mismatch, CORS, env vars in production

---

## Error Code Ranges

| System | Range |
|--------|-------|
| General | 1000-1999 |
| GSearch CLI | 7000-7099 |
| BRun CLI | 7100-7599 |
| Nexus Flow CLI | 8000-8399 |
| AI Bridge CLI | 9000-9499 |
| WP Plugin Builder | 10000-10999 |

---

## Database Operation Standards

### DBOperation Wrapper (MANDATORY)

All database operations MUST use the centralized wrapper from `pkg/database`:

```go
op := database.NewDBOperation("TableName", database.OpCreate).
    ExpectRows(1)

result := op.Execute(func() (int64, error) {
    tx := r.db.Create(entity)
    return tx.RowsAffected, tx.Error
})
```

### Stack Trace Format

```
[ERROR] Database operation completed
  Table: User
  Operation: Create
  ExpectedRows: 1
  AffectedRows: 0
  Error: UNIQUE constraint failed
  Stack:
    -> repository.go:45 (Create)
    -> service.go:112 (Register)
    -> handler.go:78 (Handle)
```

### Required Log Fields

| Field | Required | Purpose |
|-------|----------|---------|
| `Table` | Always | Table being operated on |
| `Operation` | Always | Create/Read/Update/Delete |
| `AffectedRows` | Writes | Actual rows changed |
| `ExpectedRows` | Writes | Expected for validation |
| `Stack` | On error | Full caller chain |

### ORM-Only Rule

| ❌ Forbidden | ✅ Required |
|--------------|-------------|
| `db.Exec("INSERT...")` | `db.Create(&model)` |
| `db.Raw("SELECT...")` | `db.Find(&models)` |
| Direct SQL joins | `db.Preload()` / `db.Joins()` |

**Exceptions:** FTS5, vectors, complex CTEs, PRAGMAs

---

## Cross-References

| Document | Path |
|----------|------|
| Full Cheat Sheet | `spec/04-error-resolution/05-debugging-cheat-sheet.md` |
| PHP Debugging | `spec/04-error-resolution/03-debugging-guides/01-debugging-php.md` |
| Go Debugging | `spec/04-error-resolution/03-debugging-guides/02-debugging-go.md` |
| TypeScript Debugging | `spec/04-error-resolution/03-debugging-guides/03-debugging-typescript.md` |
| Cross-Reference Diagram | `spec/04-error-resolution/04-cross-reference-diagram.md` |
| DBOperation Wrapper Spec | `spec/11-spec-management-software/13-shared-packages/06-pkg-database-operations.md` |
| ORM-Only Policy | `.lovable/memories/standards/orm-only-policy.md` |

---

*Quick-access memory for debugging across PHP, Go, and TypeScript ecosystems.*
