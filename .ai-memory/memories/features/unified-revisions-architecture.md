# Memory: features/unified-revisions-architecture

**Updated:** 2026-02-04
**Version:** 1.0.0  

---

## Summary

The system implements a unified revisions architecture for all content types (Blog, FAQ, Code, Chat, Paragraph). It uses a core 'Revisions' table with **per-type metadata tables** (BlogRevisionMeta, CodeRevisionMeta, etc.) for full SQL searchability—replacing the previous JSON Metadata column approach. Versioning is handled via database-level atomic increments (MAX(Version) + 1), and snapshots allow iterative content refinement based on user feedback.

---

## Key Points

- **Normalized Schema**: Per-type metadata tables (BlogRevisionMeta, CodeRevisionMeta, ChatRevisionMeta, FaqRevisionMeta, ParagraphRevisionMeta) instead of JSON
- **Full Searchability**: All metadata fields are indexed and SQL-queryable
- **Atomic Versioning**: Database handles version increment via `SELECT MAX(Version) + 1`
- **RAG Integration**: Session-scoped RAG memory updated on revision creation
- **Error Codes**: 9700-9709 for revision operations

---

## Related Specs

- `02-spec/22-ai-bridge-cli/01-backend/35-unified-revisions-architecture.md`
- `02-spec/22-ai-bridge-cli/01-backend/36-session-scoped-rag-memory.md`
