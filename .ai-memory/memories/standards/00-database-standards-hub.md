# Database Standards Hub

**Updated:** 2026-02-04  
**Version:** 1.0.0  
**Status:** Active  
**Purpose:** Central reference for all database-related standards, patterns, and requirements

---

## 🎯 Quick Reference

| Standard | File | Description |
|----------|------|-------------|
| **DBOperation Wrapper** | [database-operation-wrapper.md](./database-operation-wrapper.md) | Mandatory wrapper for all DB operations |
| **ORM-Only Policy** | [orm-only-policy.md](./orm-only-policy.md) | Raw SQL prohibition (99% of cases) |
| **Pre-flight Checklist** | [database-preflight-checklist.md](./database-preflight-checklist.md) | Verification before development |

---

## 📋 Mandatory Requirements

### 1. DBOperation Wrapper (Critical)

All database operations MUST use the centralized wrapper:

```go
op := database.NewDBOperation("TableName", database.OpCreate).ExpectRows(1)
result := op.Execute(func() (int64, error) {
    tx := r.db.Create(entity)
    return tx.RowsAffected, tx.Error
})
```

**Key Features:**
- Automatic stack trace capture via `runtime.Callers(3)`
- Expected vs actual rows validation
- Mandatory table name and operation type logging
- Structured zerolog output

---

### 2. ORM-Only Policy (Critical)

**Rule:** Raw SQL is forbidden 99% of the time.

**Pattern:** Relationship-First
1. Find parent record via ORM
2. Manipulate relationships (Append, modify fields)
3. Save

**Only Exceptions:**
- FTS5 virtual tables (SQLite limitation)
- Vector storage operations (no ORM support)

---

### 3. Stack Trace Capture

Every database error MUST include:
- Full caller chain
- File, function, line number
- Automatic capture (no manual wrapping)

```
Stack:
  -> user_repository.go:45 (CreateUser)
  -> auth_service.go:112 (RegisterUser)
  -> auth_handler.go:78 (HandleRegister)
```

---

### 4. Mandatory Log Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `Table` | string | Always | Table being operated on |
| `Operation` | string | Always | Create/Read/Update/Delete |
| `AffectedRows` | int64 | Writes | Actual rows changed |
| `ExpectedRows` | int | Writes | Expected rows |
| `Duration` | duration | Always | Operation time |
| `Stack` | []string | Errors | Full caller chain |
| `Error` | string | Errors | Error message |

---

## 🏗️ Architecture References

| Document | Location |
|----------|----------|
| Split DB Architecture | `02-spec/06-split-db-architecture/00-overview.md` |
| Database Terminology | `.lovable/memories/architecture/02-database-terminology.md` |
| Database Naming | `.lovable/memories/training/09-database-naming-conventions.md` |
| PascalCase Requirement | `.lovable/memories/architecture/split-db-sql-pascal-case.md` |

---

## 📦 Specification References

| Specification | Location |
|---------------|----------|
| **pkg/database Operations** | `02-spec/11-spec-management-software/13-shared-packages/06-pkg-database-operations.md` |
| Go Debugging Guide | `02-spec/04-error-resolution/03-debugging-guides/02-debugging-go.md` |
| Error Resolution | `02-spec/04-error-resolution/00-overview.md` |

---

## 🔧 CLI Tool Compliance

### Go-Based Tools (DBOperation Required)

| CLI Tool | Status |
|----------|--------|
| GSearch CLI | ✅ Compliant |
| BRun CLI | ✅ Compliant |
| AI Bridge CLI | ✅ Compliant |
| Nexus Flow CLI | ✅ Compliant |
| Spec Reverse CLI | ✅ Compliant |
| AI Transcribe CLI | ✅ Compliant |
| WP SEO Publish CLI | ✅ Compliant |
| WP Plugin Builder CLI | ✅ Compliant |
| WP Plugin Publish | ✅ Compliant |

### PHP Plugins (Excluded)

| Plugin | Reason |
|--------|--------|
| Exam Manager | Uses WordPress $wpdb |
| Link Manager | Uses WordPress $wpdb |

**Tracking:** See [workflow/cli-cross-reference-completion.md](../workflow/cli-cross-reference-completion.md)

---

## ✅ Pre-Development Checklist

Before writing any database code:

- [ ] Using `NewDBOperation(tableName, opType)`?
- [ ] Using `ExpectRows(n)` for write operations?
- [ ] No raw SQL (unless FTS5/vector exception)?
- [ ] Following Relationship-First pattern?
- [ ] Table name included in every log?
- [ ] PascalCase for all column names?
- [ ] SQLite WAL mode enabled?

---

## 📊 Related Memory Files

### Standards
- [database-operation-wrapper.md](./database-operation-wrapper.md)
- [orm-only-policy.md](./orm-only-policy.md)
- [database-preflight-checklist.md](./database-preflight-checklist.md)

### Technical
- [../technical/stack-trace-capture.md](../technical/stack-trace-capture.md)
- [../technical/split-db-standardization.md](../technical/split-db-standardization.md)
- [../technical/debugging-cheat-sheet.md](../technical/debugging-cheat-sheet.md)

### Workflow
- [../workflow/cli-cross-reference-completion.md](../workflow/cli-cross-reference-completion.md)
- [../workflow/dboperation-cross-reference-audit-report.md](../workflow/dboperation-cross-reference-audit-report.md)
- Workflow: Database Standards Enforcement — *file removed; enforcement tracked in cli-cross-reference-completion.md*

### Training Bundles
- [../training/11-database-standards-training-bundle.md](../training/11-database-standards-training-bundle.md) — Rapid onboarding bundle

---

## 🔗 Cross-Reference: Related Architectural Patterns

### Seedable Configuration Integration

Database Standards and Seedable Configuration are **tightly coupled patterns**. The Settings table (which stores seeded configuration) follows all database standards:

| Integration Point | How They Connect |
|-------------------|------------------|
| **Settings Read/Write** | DBOperation wrapper used for all settings queries |
| **Settings Schema** | ORM model follows Relationship-First pattern |
| **Audit Logging** | `settings_history` uses 7-field log structure |
| **Error Handling** | Config load errors include stack traces |

### Related Seedable Configuration Files

| Resource | Path |
|----------|------|
| **Seedable Config Spec** | `02-spec/07-seedable-config-architecture/00-overview.md` |
| **Seedable Training Bundle** | `.lovable/memories/training/12-seedable-config-training-bundle.md` |
| **Settings Service Standard** | `.lovable/memories/technical/settings-service-standard.md` |
| **Validation Data Architecture** | `.lovable/memories/technical/validation-data-architecture.md` |

### Unified Pre-Flight Checklist

For combined Database + Seedable Configuration compliance, see:
**[unified-preflight-checklist.md](./unified-preflight-checklist.md)**

### Root Document Cross-Reference

Both patterns are documented in:
- **context-for-ai.md** (project root) — Visual diagrams and combined architecture

---

## 🚫 Anti-Patterns

| ❌ Don't | ✅ Do |
|----------|-------|
| `r.db.Create(entity)` directly | `op.Execute(func() {...})` |
| Raw SQL `INSERT INTO...` | ORM `r.db.Create(entity)` |
| `snake_case` columns | `PascalCase` columns |
| Missing table name in logs | Always include `Table` field |
| No expected rows validation | Always use `ExpectRows(n)` |

---

*Central hub for all database standards across the Go ecosystem.*
