# Unified Pre-Flight Checklist

**Version:** 1.0.0  
**Updated:** 2026-02-04  
**Purpose:** Combined Database Standards + Seedable Configuration compliance verification

---

## Overview

This checklist consolidates both **Database Standards** and **Seedable Configuration** requirements into a single verification document. All CLI tools must pass ALL sections before database-related code is considered valid.

---

## 🔴 Section 1: Database Operation Standards

### 1.1 DBOperation Wrapper (Mandatory)

- [ ] All database operations use `database.NewDBOperation(tableName, opType)`
- [ ] Write operations include `.ExpectRows(n)` validation
- [ ] No direct `r.db.Create/Update/Delete` calls outside wrapper
- [ ] Wrapper imported from `pkg/database`

**Example:**
```go
op := database.NewDBOperation("User", database.OpCreate).ExpectRows(1)
result := op.Execute(func() (int64, error) {
    tx := r.db.Create(user)
    return tx.RowsAffected, tx.Error
})
```

### 1.2 ORM-Only Policy (Mandatory)

- [ ] No raw SQL statements (INSERT, UPDATE, DELETE)
- [ ] All queries use GORM methods
- [ ] Relationship-First pattern followed:
  1. Find parent via ORM
  2. Manipulate relationships
  3. Save parent

**Exceptions (document if used):**
- [ ] FTS5 virtual tables (SQLite limitation)
- [ ] Vector storage operations (no ORM support)
- [ ] Complex CTEs (document justification)

### 1.3 Structured Logging (Mandatory)

All database logs MUST include these 7 fields:

| Field | Requirement |
|-------|-------------|
| `Table` | ✅ Always required |
| `Operation` | ✅ Always required (Create/Read/Update/Delete) |
| `ExpectedRows` | ✅ Required for writes |
| `AffectedRows` | ✅ Required for writes |
| `Duration` | ✅ Always required |
| `Stack` | ✅ Required on errors |
| `Error` | ✅ Required on errors |

- [ ] All 7 fields present in log output
- [ ] Stack traces auto-captured via `runtime.Callers(3)`
- [ ] zerolog used for structured output

### 1.4 Schema Standards

- [ ] All column names use `PascalCase`
- [ ] SQLite databases use WAL mode
- [ ] Tables have proper GORM tags
- [ ] Foreign keys defined via GORM relationships

---

## 🟢 Section 2: Seedable Configuration Standards

### 2.1 No Hardcoded Values (Mandatory)

- [ ] All configuration values in `config.seed.json`
- [ ] No magic strings for setting keys in code
- [ ] All setting keys defined as constants

**Example:**
```go
// pkg/settings/keys.go
const (
    KeyCacheTTLDays       = "cache.ttl.days"
    KeyMaxRetries         = "api.max_retries"
    KeySeoTransitionWords = "seo.transition_words"
)
```

### 2.2 config.seed.json Structure

- [ ] Every setting has `key`, `value`, `category`, `valueType`
- [ ] Categories group related settings
- [ ] ValueType matches accessor method

```json
{
  "settings": [
    {
      "key": "cache.ttl.days",
      "value": "5",
      "category": "cache",
      "valueType": "int"
    }
  ]
}
```

### 2.3 Typed Accessors (Mandatory)

- [ ] All setting reads use typed getter methods
- [ ] No raw string queries to settings table
- [ ] Default values provided where appropriate

| Type | Accessor Method |
|------|-----------------|
| String | `settings.GetString(key)` |
| Int | `settings.GetInt(key)` |
| Bool | `settings.GetBool(key)` |
| Array | `settings.GetStringArray(key)` |
| JSON | `settings.GetJSON(key, target)` |

### 2.4 Settings Schema

- [ ] Settings table matches expected schema:

```go
type Setting struct {
    Id        uint   `gorm:"primaryKey"`
    Key       string `gorm:"uniqueIndex;not null"`
    Value     string `gorm:"type:text"`
    Category  string `gorm:"index"`
    Version   string
    ValueType string
}
```

- [ ] Settings history table exists for audit trail
- [ ] Versioned seeding follows Golden Rule

**Golden Rule:**
```
Seed IF: NOT EXISTS OR (SeedVersion > StoredVersion AND IsUserModified == FALSE)
```

---

## 🟡 Section 3: Integration Verification

### 3.1 Startup Sequence

- [ ] Config loaded before database initialization
- [ ] Directories created before database files
- [ ] Settings seeded at startup from `config.seed.json`
- [ ] Initialization order: Config → Dirs → DB → Services → App

### 3.2 Combined Compliance

- [ ] Settings reads use DBOperation wrapper internally
- [ ] Settings schema follows ORM-only pattern
- [ ] Settings errors include stack traces
- [ ] Settings logs include mandatory 7 fields

---

## 📋 Quick Verification Commands

### Check DBOperation Usage
```bash
# Should find all database operations using wrapper
grep -r "NewDBOperation" ./internal/ ./pkg/
```

### Check for Raw SQL (Should Return Empty)
```bash
# These should NOT appear in code
grep -rE "(db\.Exec|db\.Raw|INSERT INTO|UPDATE .* SET|DELETE FROM)" ./internal/
```

### Check Typed Constants
```bash
# Should find constant definitions
grep -r "const.*Key.*=" ./pkg/settings/
```

### Check Seed File
```bash
# Verify seed file exists and is valid JSON
cat config.seed.json | jq .
```

---

## ✅ Sign-Off

Before submitting code, verify:

| Area | Verified |
|------|----------|
| DBOperation wrapper used | ☐ |
| ExpectRows on writes | ☐ |
| No raw SQL | ☐ |
| Relationship-First pattern | ☐ |
| 7 log fields present | ☐ |
| No hardcoded config | ☐ |
| Typed constants defined | ☐ |
| Typed accessors used | ☐ |
| config.seed.json updated | ☐ |
| Startup order correct | ☐ |

---

## Related Documents

| Document | Path |
|----------|------|
| Database Standards Hub | [./00-database-standards-hub.md](./00-database-standards-hub.md) |
| Database Training Bundle | [../training/11-database-standards-training-bundle.md](../training/11-database-standards-training-bundle.md) |
| Seedable Training Bundle | [../training/12-seedable-config-training-bundle.md](../training/12-seedable-config-training-bundle.md) |
| CONTEXT-FOR-AI | `context-for-ai.md` (project root) |

---

*Unified checklist ensuring full compliance with ecosystem database and configuration standards.*
