# Memory: technical/split-db-standardization

**Updated:** 2026-02-04
**Version:** 1.0.0  

---

## Summary

The Split DB architecture is standardized across all CLI tools, utilizing a hierarchical terminology with support for user-scoped and company-scoped isolation.

---

## Database Terminology

| Term | Meaning | Example Path |
|------|---------|--------------|
| **Root DB** | Global registry, settings | `data/aibridge.db` |
| **Settings DB** | Configuration (seeded + user) | Inside Root DB |
| **App DB** | Application-scoped metadata | `data/{appName}/search.db` |
| **Session DB** | Per-session isolated storage | `data/{appName}/ai/chat/{seq}-{id}.db` |
| **Cache DB** | Cached results with TTL | `data/{appName}/rag/cache/{slug}.db` |
| **User DB** | Per-user isolated storage | `data/{appName}/users/{userId}/` |
| **Company DB** | Per-company isolated storage | `data/{appName}/companies/{companySlug}/` |

---

## Scoping Patterns

### App-Level User Isolation
```
data/{appName}/users/{userId}/settings.db
data/{appName}/users/{userId}/sessions/{sessionId}.db
```

### Company + User Isolation (Enterprise)
```
data/{appName}/companies/{companySlug}/users/{userId}/settings.db
data/{appName}/companies/{companySlug}/users/{userId}/sessions/{sessionId}.db
```

### Module-Based Isolation
```
data/{appName}/chat/users/{userId}/{sessionId}.db
data/{appName}/rag/users/{userId}/documents/{docId}.db
```

---

## RBAC Integration

Role-Based Access Control uses [Casbin](https://casbin.org/) with three scope levels:

| Level | Database Path | Use Case |
|-------|---------------|----------|
| Root | `data/rbac.db` | Platform-wide |
| App | `data/{appName}/rbac.db` | Single application |
| Company | `data/{appName}/companies/{companySlug}/rbac.db` | Multi-tenant |

---

## Naming Convention

**CRITICAL: All field names use PascalCase. No underscores allowed.**

| ❌ Wrong | ✅ Correct |
|----------|-----------|
| `session_id` | `SessionId` |
| `created_at` | `CreatedAt` |
| `message_count` | `MessageCount` |

---

## Key References

- Architecture: `spec/06-split-db-architecture/00-overview.md`
- CLI Examples: `spec/06-split-db-architecture/01-cli-examples.md`
- RBAC: `spec/06-split-db-architecture/04-rbac-casbin.md`
- User Isolation: `spec/06-split-db-architecture/05-user-scoped-isolation.md`
