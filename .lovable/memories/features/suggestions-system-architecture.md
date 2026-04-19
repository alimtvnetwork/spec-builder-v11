# Memory: features/suggestions-system-architecture

**Updated:** 2026-02-04
**Version:** 1.0.0  

---

## Summary

The suggestions system uses a hybrid storage model combining session-scoped tables with a global registry. Suggestions are assigned a database-level auto-incrementing integer ID, which is formatted with an 'S' prefix and three-digit padding (e.g., S001) for display. Suggestions can be 'Actionable' (triggering specific AI prompts/tasks) or 'Informational' (referential notes), and each includes a Title, Description, and unique ID.

---

## Key Points

- **Hybrid Storage**: Session DB stores suggestions in context; global registry enables cross-session search
- **ID Format**: Database uses INTEGER PRIMARY KEY; display adds 'S' prefix (S001, S042)
- **Types**: Actionable (user can accept to trigger action) or Informational (reference only)
- **Integration**: Every AI response includes suggestions; linked to revisions when applicable
- **Filesystem**: AI-generated suggestions persisted to `.lovable/memory/suggestions/ai-generated/`

---

## Related Specs

- `spec/22-ai-bridge-cli/01-backend/34-suggestions-system.md`
- `spec/11-spec-management-software/05-features/30-ai-bridge/03-ai-suggestions-filesystem-persistence.md`
