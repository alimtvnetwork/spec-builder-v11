# Database Standards Training Bundle

**Version:** 1.0.0  
**Updated:** 2026-02-04  
**Purpose:** Consolidated training package for database operation standards

---

## 🎯 Overview

This bundle consolidates all database-related standards, patterns, and compliance tracking into a single training resource for new AI onboarding. It provides immediate context on the mandatory DBOperation wrapper, ORM-only policy, and ecosystem compliance.

---

## 📍 Quick Navigation

| Resource | Path | Priority |
|----------|------|----------|
| **Database Standards Hub** | `.lovable/memories/standards/00-database-standards-hub.md` | 🔴 Critical |
| DBOperation Wrapper Spec | `02-spec/11-spec-management-software/13-shared-packages/06-pkg-database-operations.md` | 🔴 Critical |
| ORM-Only Policy | `.lovable/memories/standards/database/orm-relationship-first-mandate.md` | 🔴 Critical |
| Stack Trace Pattern | `.lovable/memories/standards/database/stack-trace-capture-pattern.md` | 🟡 Important |
| Compliance Tracking | `.lovable/memories/workflow/cli-cross-reference-completion.md` | 🟢 Reference |
| Audit Report | `.lovable/memories/workflow/dboperation-cross-reference-audit-report.md` | 🟢 Reference |

---

## 🔴 Mandatory DBOperation Wrapper

All Go-based database operations MUST use the centralized wrapper:

```go
op := database.NewDBOperation("TableName", database.OpCreate).
    ExpectRows(1)

result := op.Execute(func() (int64, error) {
    tx := r.db.Create(entity)
    return tx.RowsAffected, tx.Error
})

if result.HasError() {
    // Stack trace automatically captured
    log.Error().
        Str("Table", result.TableName).
        Str("Operation", result.OperationType).
        Int64("ExpectedRows", result.ExpectedRows).
        Int64("AffectedRows", result.AffectedRows).
        Strs("Stack", result.StackTrace).
        Err(result.Error).
        Msg("Database operation failed")
}
```

---

## 🔴 ORM-Only Policy (Relationship-First)

### Forbidden Pattern

```go
// ❌ NEVER DO THIS
db.Exec("INSERT INTO File (ProjectId, Name) VALUES (?, ?)", id, name)
```

### Required Pattern

```go
// ✅ ALWAYS DO THIS
// 1. Find parent via ORM
var project Project
db.First(&project, "Id = ?", projectId)

// 2. Manipulate relationship
project.Files = append(project.Files, File{Name: name})

// 3. Save via ORM
db.Save(&project)
```

### Exceptions (Only 3)

| Exception | Reason |
|-----------|--------|
| FTS5 Virtual Tables | SQLite limitation, no ORM support |
| Vector Storage | Specialized operations lack ORM bindings |
| Complex CTEs | Performance-critical analytical queries |

---

## 📊 Log Field Requirements

Every database error log MUST include:

| Field | Type | Description |
|-------|------|-------------|
| `Table` | string | Target table name |
| `Operation` | string | Create, Read, Update, Delete |
| `ExpectedRows` | int64 | Expected affected rows |
| `AffectedRows` | int64 | Actual affected rows |
| `Duration` | string | Operation timing |
| `Stack` | []string | Caller chain via `runtime.Callers(3)` |
| `Error` | error | Error message if failed |

---

## ✅ Ecosystem Compliance

### Go-Based CLI Tools (100% Compliant)

| Tool | DBOperation | ORM-Only | Stack Trace |
|------|-------------|----------|-------------|
| GSearch CLI | ✅ | ✅ | ✅ |
| BRun CLI | ✅ | ✅ | ✅ |
| AI Bridge CLI | ✅ | ✅ | ✅ |
| Nexus Flow CLI | ✅ | ✅ | ✅ |
| Spec Reverse CLI | ✅ | ✅ | ✅ |
| AI Transcribe CLI | ✅ | ✅ | ✅ |
| WP SEO Publish CLI | ✅ | ✅ | ✅ |
| WP Plugin Builder CLI | ✅ | ✅ | ✅ |
| WP Plugin Publish | ✅ | ✅ | ✅ |

### PHP-Based Plugins (Excluded)

| Plugin | Reason |
|--------|--------|
| Exam Manager | Uses WordPress `$wpdb` patterns |
| Link Manager | Uses WordPress `$wpdb` patterns |

---

## 🧪 Validation Checklist

Before any database implementation, verify:

- [ ] Using `database.NewDBOperation()` wrapper
- [ ] `ExpectRows(n)` set for write operations
- [ ] Stack trace auto-captured on errors
- [ ] No raw SQL (except FTS5/Vector/CTE)
- [ ] Relationship-First pattern followed
- [ ] All 7 log fields present in error logs

---

## 🔗 Related Training

| Topic | File |
|-------|------|
| Split DB Architecture | `.lovable/memories/training/09-database-naming-conventions.md` |
| Seedable Configuration | `.lovable/memories/patterns/seedable-configuration.md` |
| Error Code Registry | `.lovable/memories/technical/error-code-registry.md` |
| AI Quickstart Guide | `.lovable/memories/training/08-ai-quickstart-guide.md` |

---

## ⚡ 30-Second Summary

1. **DBOperation Wrapper** — Mandatory for all Go database operations
2. **ORM-Only** — No raw SQL except FTS5, vectors, CTEs
3. **Relationship-First** — Find parent, manipulate relationship, save
4. **Auto Stack Traces** — `runtime.Callers(3)` on every error
5. **7 Log Fields** — Table, Operation, Expected, Affected, Duration, Stack, Error
6. **9 Go Tools Compliant** — 100% ecosystem coverage
7. **PHP Excluded** — WordPress plugins use native `$wpdb`
