# Wave 4 Remediation: ORM Migration (raw SQL → GORM)

**Date:** 2026-02-07  
**Status:** Complete  
**Scope:** Migrate `database/sql` and raw SQL usage to GORM models across 3 silos

---

## WP SEO Publish CLI — `06-split-db-schema.md`

### Critical: `*sql.DB` → `*gorm.DB` Migration

| Component | Before | After |
|-----------|--------|-------|
| `DatabaseManager.settingDB` | `*sql.DB` | `*gorm.DB` |
| `DatabaseManager.websiteDBs` | `map[string]*sql.DB` | `map[string]*gorm.DB` |
| `NewDatabaseManager()` | `sql.Open("sqlite3", ...)` | `gorm.Open(sqlite.Open(...))` |
| `GetWebsiteDB()` | `sql.Open(...)` + `initWebsiteSchema()` | `gorm.Open(...)` + `AutoMigrate(...)` |
| `CreatePublicationDB()` | `sql.Open(...)` + `initPublicationSchema()` | `gorm.Open(...)` + `AutoMigrate(...)` |
| Schema init | Manual `initSettingSchema()` / `initWebsiteSchema()` | `db.AutoMigrate(...)` with model list |

### GORM Models Added

| DB Tier | Models Added |
|---------|-------------|
| Setting DB | `SchemaVersion`, `Config`, `Website`, `Credential`, `GlobalVariable`, `AIBridgeConfig`, `GSearchConfig` |
| Website DB | `SiteMetadata`, `Category`, `Tag`, `Publication`, `Modification`, `WebsiteVariable`, `VariableSource`, `ContentVariable`, `SitemapCache`, `Automation`, `AutomationRun` |
| Publication DB | `Detail`, `CategoryAssignment`, `TagAssignment`, `InternalLink`, `SEOMetadata`, `Version`, `UsedVariable` |

### Relationships Defined

- `Website` → `Credential` (has one)
- `Publication` → `Modification` (has many)
- `Automation` → `VariableSource` (belongs to), `AutomationRun` (has many)

### PascalCase Cleanup (Import/Export)

| File | Changes |
|------|---------|
| `09-import-export.md` | JSON export example: 27 keys → PascalCase (`version` → `Version`, `exportedAt` → `ExportedAt`, `siteUrl` → `SiteURL`, etc.) |

---

## WP Plugin Builder — `05-rag-system.md`, `04-database-schema.md`

### Vector Search — Documented ORM Exception

| File | Line | Change |
|------|------|--------|
| `05-rag-system.md` | ~219 | Added ORM EXCEPTION comment for `db.Raw()` sqlite-vec cosine similarity |
| `04-database-schema.md` | ~356 | Added ORM EXCEPTION comment for `db.Raw()` sqlite-vec search |

**Justification:** Vector search using `vec_distance_cosine()` is an explicitly allowed exception per the ORM-Only Policy (vector search operations where native ORM support is unavailable).

---

## Spec Reverse CLI — `03-ai-bridge-integration.md`

### Vector Search — Documented ORM Exception

| File | Line | Change |
|------|------|--------|
| `03-ai-bridge-integration.md` | ~527 | Added ORM EXCEPTION comment for `db.Raw()` SQLite-vss distance function |

**Justification:** Vector search using `vss_distance()` is an explicitly allowed exception per the ORM-Only Policy.

---

## Summary

| Silo | Violations Found | Violations Fixed | Exceptions Documented |
|------|-----------------|-----------------|----------------------|
| WP SEO Publish | 3 (`*sql.DB` usage) + 27 camelCase keys | 3 + 27 | 0 |
| WP Plugin Builder | 0 (vector search = allowed exception) | 0 | 2 |
| Spec Reverse | 0 (vector search = allowed exception) | 0 | 1 |
| **Total** | **30** | **30** | **3** |

---

## Cross-References

| Reference | Location |
|-----------|----------|
| Wave 1 (Error Registry) | `.lovable/audits/wave-1-error-registry-remediation.md` |
| Wave 2 (Port Sync) | `.lovable/audits/wave-2-port-synchronization-remediation.md` |
| Wave 3 (PascalCase) | `.lovable/audits/wave-3-pascalcase-remediation.md` |
| ORM-Only Policy | `.lovable/memories/standards/orm-only-policy.md` |
| DBOperation Wrapper | `.lovable/memories/standards/database-operation-wrapper.md` |
