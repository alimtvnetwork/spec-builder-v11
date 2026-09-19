# CLI Compliance Audit Template

**Version:** 1.0.0  
**Updated:** 2026-02-04  
**Purpose:** Standardized audit template for verifying CLI tool compliance with Database Standards and Seedable Configuration

---

## Audit Information

| Field | Value |
|-------|-------|
| **CLI Tool Name** | _[Tool Name]_ |
| **Audit Date** | _[YYYY-MM-DD]_ |
| **Auditor** | _[Name/AI Model]_ |
| **Version Audited** | _[Version]_ |
| **Overall Status** | ☐ Compliant ☐ Non-Compliant ☐ Partial |

---

## Section 1: Database Standards Compliance

### 1.1 DBOperation Wrapper

| Requirement | Status | Evidence/Notes |
|-------------|--------|----------------|
| All DB operations use `NewDBOperation()` | ☐ Pass ☐ Fail | |
| Write operations include `ExpectRows(n)` | ☐ Pass ☐ Fail | |
| No direct `r.db.Create/Update/Delete` calls | ☐ Pass ☐ Fail | |
| Wrapper imported from `pkg/database` | ☐ Pass ☐ Fail | |

**Verification Command:**
```bash
grep -r "NewDBOperation" ./internal/ ./pkg/ | wc -l
# Expected: All database operations
```

### 1.2 ORM-Only Policy

| Requirement | Status | Evidence/Notes |
|-------------|--------|----------------|
| No raw SQL INSERT statements | ☐ Pass ☐ Fail | |
| No raw SQL UPDATE statements | ☐ Pass ☐ Fail | |
| No raw SQL DELETE statements | ☐ Pass ☐ Fail | |
| Relationship-First pattern used | ☐ Pass ☐ Fail | |
| Exceptions documented (FTS5/Vector) | ☐ Pass ☐ N/A | |

**Verification Command:**
```bash
grep -rE "(db\.Exec|db\.Raw|INSERT INTO|UPDATE .* SET|DELETE FROM)" ./internal/
# Expected: Empty or only FTS5/Vector exceptions
```

### 1.3 Structured Logging

| Field | Present | Implementation |
|-------|---------|----------------|
| `Table` | ☐ Yes ☐ No | |
| `Operation` | ☐ Yes ☐ No | |
| `ExpectedRows` | ☐ Yes ☐ No | |
| `AffectedRows` | ☐ Yes ☐ No | |
| `Duration` | ☐ Yes ☐ No | |
| `Stack` (on errors) | ☐ Yes ☐ No | |
| `Error` (on errors) | ☐ Yes ☐ No | |

**Total Fields:** _[X]_ / 7

### 1.4 Schema Standards

| Requirement | Status | Evidence/Notes |
|-------------|--------|----------------|
| PascalCase column names | ☐ Pass ☐ Fail | |
| SQLite WAL mode enabled | ☐ Pass ☐ Fail | |
| GORM tags on all models | ☐ Pass ☐ Fail | |
| Foreign keys via relationships | ☐ Pass ☐ Fail | |

---

## Section 2: Seedable Configuration Compliance

### 2.1 Configuration Source

| Requirement | Status | Evidence/Notes |
|-------------|--------|----------------|
| `config.seed.json` exists | ☐ Pass ☐ Fail | |
| All settings defined in seed file | ☐ Pass ☐ Fail | |
| No hardcoded configuration values | ☐ Pass ☐ Fail | |

**Verification Command:**
```bash
cat config.seed.json | jq '.settings | length'
# Expected: Count of all settings
```

### 2.2 Typed Constants

| Requirement | Status | Evidence/Notes |
|-------------|--------|----------------|
| Constants file exists | ☐ Pass ☐ Fail | Path: |
| All setting keys as constants | ☐ Pass ☐ Fail | |
| No magic strings for keys | ☐ Pass ☐ Fail | |

**Verification Command:**
```bash
grep -r "const.*Key.*=" ./pkg/settings/
# Expected: All setting key constants
```

### 2.3 Typed Accessors

| Accessor | Used Correctly |
|----------|----------------|
| `GetString(key)` | ☐ Yes ☐ No ☐ N/A |
| `GetInt(key)` | ☐ Yes ☐ No ☐ N/A |
| `GetBool(key)` | ☐ Yes ☐ No ☐ N/A |
| `GetStringArray(key)` | ☐ Yes ☐ No ☐ N/A |
| `GetJSON(key, target)` | ☐ Yes ☐ No ☐ N/A |

### 2.4 Settings Schema

| Requirement | Status | Evidence/Notes |
|-------------|--------|----------------|
| Settings table exists | ☐ Pass ☐ Fail | |
| Correct schema (Id, Key, Value, Category, Version, ValueType) | ☐ Pass ☐ Fail | |
| Settings history table exists | ☐ Pass ☐ Fail | |
| Versioned seeding implemented | ☐ Pass ☐ Fail | |

---

## Section 3: Initialization Order

| Step | Order | Verified |
|------|-------|----------|
| Config loading | 1 | ☐ Yes ☐ No |
| Directory creation | 2 | ☐ Yes ☐ No |
| Database initialization | 3 | ☐ Yes ☐ No |
| Settings seeding | 3a | ☐ Yes ☐ No |
| Services initialization | 4 | ☐ Yes ☐ No |
| HTTP Server/App start | 5 | ☐ Yes ☐ No |

---

## Section 4: Health Endpoints

| Endpoint | Implemented | Response Format |
|----------|-------------|-----------------|
| `/health/live` | ☐ Yes ☐ No | |
| `/health/ready` | ☐ Yes ☐ No | |

---

## Section 5: Error Handling

| Requirement | Status | Evidence/Notes |
|-------------|--------|----------------|
| Error codes from assigned range | ☐ Pass ☐ Fail | Range: |
| Standard error envelope used | ☐ Pass ☐ Fail | |
| Correlation IDs in logs | ☐ Pass ☐ Fail | |
| Stack traces on DB errors | ☐ Pass ☐ Fail | |

---

## Audit Summary

### Compliance Score

| Section | Pass | Fail | N/A | Score |
|---------|------|------|-----|-------|
| 1. Database Standards | | | | __%|
| 2. Seedable Configuration | | | | __%|
| 3. Initialization Order | | | | __%|
| 4. Health Endpoints | | | | __%|
| 5. Error Handling | | | | __%|
| **Overall** | | | | **__%** |

### Issues Found

| # | Section | Issue | Severity | Remediation |
|---|---------|-------|----------|-------------|
| 1 | | | ☐ Critical ☐ Major ☐ Minor | |
| 2 | | | ☐ Critical ☐ Major ☐ Minor | |
| 3 | | | ☐ Critical ☐ Major ☐ Minor | |

### Recommendations

1. _[Recommendation 1]_
2. _[Recommendation 2]_
3. _[Recommendation 3]_

---

## Sign-Off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Auditor | | | ☐ Approved |
| Reviewer | | | ☐ Approved |

---

## Reference Documents

| Document | Path |
|----------|------|
| Database Standards Hub | `.lovable/memories/standards/00-database-standards-hub.md` |
| Unified Pre-Flight Checklist | `.lovable/memories/standards/unified-preflight-checklist.md` |
| Database Training Bundle | `.lovable/memories/training/11-database-standards-training-bundle.md` |
| Seedable Training Bundle | `.lovable/memories/training/12-seedable-config-training-bundle.md` |
| CONTEXT-FOR-AI | `context-for-ai.md` |

---

*Template for standardized CLI tool compliance auditing across the ecosystem.*
