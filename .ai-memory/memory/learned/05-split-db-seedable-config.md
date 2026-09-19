# Learned: Split Database & Seedable Configuration Architecture

> **Source:** `02-spec/06-split-db-architecture/` & `02-spec/07-seedable-config-architecture/`

---

## 1. 4-Tier Split Database System

All CLIs and services adhere to the 4-tier database model:

| Tier | DB Name | Mutability | Content | Lifecycle |
|------|---------|------------|---------|-----------|
| **System** | `system.db` | Read-only | Seeded defaults from embedded JSON | Never modified at runtime |
| **Config** | `config.db` | User-modifiable | User preferences, custom settings | Versioned migrations with rollback |
| **Session**| `session.db`| Ephemeral | Runtime state, tokens, active tasks | Purged on app restart |
| **Cache**  | `cache.db`  | Ephemeral | API responses, scraped data | Automated TTL-based eviction |

## 2. Seedable Configuration Pattern

Versioned configuration lifecycle:
- Seed Version format: `YYYYMMDD.N` (e.g. `20260204.1`).
- **Seeding Rule:**
  ```sql
  IF NOT EXISTS OR (SeedVersion > StoredVersion AND IsUserModified == FALSE)
  THEN seed the value
  ```
- Protects user customizations from being overwritten during application updates.
