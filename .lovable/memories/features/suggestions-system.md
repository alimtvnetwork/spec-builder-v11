# Memory: features/suggestions-system

**Updated:** 2026-02-04  
**Version:** 1.0.0  
**Status:** Active  
**Spec Location:** `spec/22-ai-bridge-cli/01-backend/34-suggestions-system.md`

---

## Overview

The Suggestions System generates actionable and informational recommendations after every AI response across all modules (Chat, Blog, FAQ, Code, Paragraph). Uses a hybrid storage model with session-scoped tables and a global registry for cross-referencing.

---

## Key Design Principles

| Principle | Implementation |
|-----------|----------------|
| **Auto-increment** | Database handles `Id` via `INTEGER PRIMARY KEY AUTOINCREMENT` |
| **Display Formatting** | Add `S` prefix at retrieval: `S001`, `S042` |
| **Unified Schema** | Same `Suggestions` table in every session DB |
| **Hybrid Storage** | Session-scoped storage + global registry for search |

---

## Suggestion Types

| Type | Behavior |
|------|----------|
| **Actionable** | User can accept → queues as new prompt |
| **Informational** | Reference-only, manual follow-up |

---

## Database Schema Summary

```sql
-- In each session/content DB
CREATE TABLE Suggestions (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    Title TEXT NOT NULL,
    Description TEXT NOT NULL,
    Type TEXT NOT NULL,  -- 'Actionable' or 'Informational'
    Priority TEXT DEFAULT 'Medium',
    Status TEXT DEFAULT 'Open',
    ...
);

-- Global registry at data/{app}/rag/suggestions-registry.db
CREATE TABLE SuggestionsRegistry (...);
```

---

## Display ID Format

| Database Id | Display Format |
|-------------|----------------|
| 1 | S001 |
| 42 | S042 |
| 999 | S999 |
| 1000+ | S1000 (no padding) |

---

## API Pattern

| Endpoint | Description |
|----------|-------------|
| `GET /{module}/{id}/suggestions` | List suggestions |
| `POST /{module}/{id}/suggestions/{id}/accept` | Accept actionable |
| `POST /{module}/{id}/suggestions/{id}/dismiss` | Dismiss |
| `GET /suggestions/search` | Global search |

---

## Error Codes (9710-9715)

| Code | Name |
|------|------|
| 9710 | SUGGESTION_NOT_FOUND |
| 9711 | SUGGESTION_NOT_ACTIONABLE |
| 9712 | SUGGESTION_ALREADY_PROCESSED |
| 9713 | SUGGESTION_CREATE_FAILED |
| 9714 | REGISTRY_SYNC_FAILED |
| 9715 | SUGGESTION_LIMIT_EXCEEDED |

---

## Related Files

- Full Spec: `34-suggestions-system.md`
- Revisions: `35-unified-revisions-architecture.md`
- Paths: `26-database-paths-reference.md`
