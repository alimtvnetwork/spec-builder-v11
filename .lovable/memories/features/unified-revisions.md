# Memory: features/unified-revisions

**Updated:** 2026-02-04  
**Version:** 1.0.0  
**Status:** Active  
**Spec Location:** `spec/22-ai-bridge-cli/01-backend/35-unified-revisions-architecture.md`

---

## Overview

Simplified, unified revisions architecture that applies **one schema across all content types**. Replaces module-specific revision tables with a single `Revisions` table using JSON metadata for content-type-specific fields.

---

## Design Philosophy

| Old Approach | New Unified Approach |
|--------------|---------------------|
| Different schema per content type | One `Revisions` table everywhere |
| Content-specific columns | Generic + JSON `Metadata` column |
| Module-specific APIs | Same API pattern for all modules |

---

## Unified Schema

```sql
CREATE TABLE Revisions (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    Version INTEGER NOT NULL,       -- Auto-calculated: MAX(Version)+1
    ContentType TEXT NOT NULL,      -- 'Blog', 'Faq', 'Code', 'Chat', 'Paragraph'
    Content TEXT NOT NULL,
    ContentHash TEXT NOT NULL,      -- SHA256 for dedup
    IsActive INTEGER DEFAULT 0,
    IsPinned INTEGER DEFAULT 0,
    Metadata TEXT,                  -- JSON for content-specific data
    ...
);
```

---

## Metadata Examples

**Blog:** `{"Slug": "...", "Category": "...", "WordCount": 1250}`  
**Code:** `{"Language": "Go", "FilePath": "...", "LinesChanged": 45}`  
**FAQ:** `{"QuestionCount": 10, "Category": "Pricing"}`

---

## Version Calculation

**Database handles increment**, not application code:

```sql
-- Atomic insert with next version
SELECT COALESCE(MAX(Version), 0) + 1 FROM Revisions WHERE ContentType = ?
```

---

## Unified API Pattern

All modules use same endpoint structure:

```
/{module}/{id}/revisions              -- List
/{module}/{id}/revisions/active       -- Get current
/{module}/{id}/revisions/{version}    -- Get specific
/{module}/{id}/revisions/{version}/feedback    -- Submit feedback
/{module}/{id}/revisions/{version}/regenerate  -- Regenerate
/{module}/{id}/revisions/{version}/rollback    -- Rollback
```

---

## Regeneration Flow

1. User submits feedback on v3
2. System builds prompt: original request + v3 content + feedback
3. AI generates new content
4. Create v4: `IsActive=1`, `ParentVersion=3`
5. Update: v3.`IsActive=0`, Feedback.`Status='Applied'`
6. RAG memory updated with new content

---

## Error Codes (9700-9709)

| Code | Name |
|------|------|
| 9700 | REVISION_NOT_FOUND |
| 9701 | REVISION_CREATE_FAILED |
| 9702 | FEEDBACK_INVALID |
| 9703 | SELECTION_OUT_OF_BOUNDS |
| 9704 | ROLLBACK_FAILED |
| 9705 | DIFF_COMPUTE_FAILED |
| 9706 | VERSION_PINNED |
| 9707 | REGENERATION_IN_PROGRESS |
| 9708 | CONTENT_HASH_DUPLICATE |
| 9709 | MAX_VERSIONS_EXCEEDED |

---

## Related Files

- Full Spec: `35-unified-revisions-architecture.md`
- Old Spec: `31-revision-feedback-system.md` (still valid, more detail)
- Suggestions: `34-suggestions-system.md`
