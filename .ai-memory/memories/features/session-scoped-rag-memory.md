# Memory: features/session-scoped-rag-memory

**Updated:** 2026-02-04
**Version:** 1.0.0  

---

## Summary

RAG memory operates at the session scope, not globally. Each codebase, chat session, or content generation context maintains isolated RAG memory. The system uses a two-tier model: Tier 1 (Core Memory) persists across sessions, while Tier 2 (Session Memory) is ephemeral and cleared on session close.

---

## Key Points

- **Session = Codebase**: Each codebase context is a session boundary
- **Tier 1 (Core)**: Project config, company profile, training data, base code index - persists
- **Tier 2 (Session)**: Conversation chunks, dynamic expansions, feedback refinements - ephemeral
- **Threshold Warning**: At 50MB (configurable), user prompted to archive/reset/continue
- **Session Close**: Options are KeepAll, KeepCore (clear Tier 2), or ClearAll
- **Model Startup**: MUST load RAG memories first before processing prompts
- **Error Codes**: 9800-9805 for RAG session operations

---

## Related Specs

- `02-spec/22-ai-bridge-cli/01-backend/36-session-scoped-rag-memory.md`
- `02-spec/22-ai-bridge-cli/01-backend/11-rag-reindexing.md`
