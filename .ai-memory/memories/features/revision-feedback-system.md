# Memory: features/revision-feedback-system

**Updated:** 2026-02-04  
**Version:** 1.0.0  
**Status:** Active (see also `unified-revisions.md` for simplified architecture)  
**Spec Location:** `02-spec/22-ai-bridge-cli/01-backend/31-revision-feedback-system.md`

---

## Overview

The Revision & Feedback System enables iterative refinement of AI-generated content across all content types with full version history, feedback notes, and rollback capabilities.

**Note:** For the simplified unified schema, see `35-unified-revisions-architecture.md` and the `unified-revisions.md` memory file.

---

## Supported Content Types

| Type | Database Path | Use Case |
|------|---------------|----------|
| Blog Post | `data/{app}/rag/seo/blog/{company}/{seq}-{slug}.db` | SEO content |
| FAQ | `data/{app}/rag/seo/faq/{company}/{seq}-{slug}.db` | FAQ generation |
| HTML Paragraph | `data/{app}/rag/seo/paragraph/{company}/{seq}-{slug}.db` | HTML snippets |
| Code | `data/{app}/rag/code/{company}/{seq}-{task-id}.db` | Code generation |
| Chat | `data/{app}/rag/chat/{company}/{seq}-{session-id}.db` | Conversations |

---

## Database Tables

Each content DB includes:
- **Revisions**: Version history with content snapshots, model used, generation metadata
- **RevisionFeedback**: User feedback notes with optional inline selections
- **RevisionDiffs**: Cached computed differences between versions

---

## Revision Flow

1. **Initial Generation**: User request → AI generates → Revision v1 (IsActive=TRUE)
2. **Feedback Submission**: User reviews v1 → Writes feedback → RevisionFeedback created
3. **Regeneration**: System builds prompt with previous content + feedback → AI generates v2
4. **Promotion**: v2.IsActive=TRUE, v1.IsActive=FALSE, Feedback.ProcessedAt=NOW
5. **Optional**: Compare versions, rollback to any version, pin/label important versions

---

## Key API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/{contentType}/{id}/revisions` | GET | List all revisions |
| `/{contentType}/{id}/revisions/{version}` | GET | Get revision content |
| `/{contentType}/{id}/revisions/{version}/feedback` | POST | Submit feedback |
| `/{contentType}/{id}/revisions/{version}/regenerate` | POST | Regenerate from feedback |
| `/{contentType}/{id}/revisions/diff` | GET | Compare two versions |
| `/{contentType}/{id}/revisions/{version}/rollback` | POST | Rollback to version |

---

## Inline Feedback

Feedback can include text selections:
- `SelectionStart`: Character offset start
- `SelectionEnd`: Character offset end
- `SelectedText`: The highlighted text
- Allows precise feedback on specific sections

---

## Error Codes (9700-9707)

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

---

## Configuration (PascalCase)

```yaml
Revision:
  MaxVersionsPerContent: 50
  AutoArchiveAfterDays: 90
  DiffCacheEnabled: true
  DiffCacheTtlDays: 30
  FeedbackMaxLength: 5000
  SelectionsMaxPerFeedback: 10
```

---

## Related Files

- Spec: `31-revision-feedback-system.md`
- Path Reference: `26-database-paths-reference.md`
- Database Architecture: `12-database-architecture.md`
- Blog Generation: `27-ai-seo-blog-generation.md`
- FAQ Generation: `22-ai-seo-faq-generation.md`
