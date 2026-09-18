---
name: database-operations
description: Execute and specify relational database models and operations using ORM wrappers
---

# Database Operations Skill

Follows `spec/06-split-db-architecture/` and `.lovable/memories/standards/`:

1. **4-Tier Split DB Architecture:**
   - `system.db`: Read-only seeded data from embedded JSON
   - `config.db`: User modifications with versioned migrations
   - `session.db`: Ephemeral runtime state, cleared on restart
   - `cache.db`: TTL auto-purged query and API cache
2. **Centralized DBOperation Wrapper:**
   - `database.NewDBOperation(tableName, opType).ExpectRows(n).Execute(...)`
   - Auto-captures stack traces via `runtime.Callers()`.
   - Records expected vs actual affected rows.
3. **ORM-Only Enforcement:**
   - GORM for all relational operations.
   - Relationship-first model manipulation (fetch parent, modify relationship, save parent).
   - Raw SQL restricted strictly to FTS5, vector search, or complex recursive CTEs.
