# External Tool: WP Plugin Builder

**Version:** 2.0.0  
**Updated:** 2026-03-09  

---

## Overview

AI-assisted WordPress plugin development CLI using RAG and the AI Bridge.

---

## Specification Location

`spec/30-wp-plugin/wp-plugin-builder/`

---

## Quick Reference

| Attribute | Value |
|-----------|-------|
| Binary Name | `wpb` |
| Language | Go 1.21+ |
| Error Code Range | 10000-10499 |
| Database | SQLite (root + per-project) |
| AI Backend | AI Bridge |

---

## Key Features

- Dual-database architecture (root + per-project)
- RAG-powered code generation
- Preset learning from markdown
- Spec-driven PHP generation
- CLI + Server modes

---

## Integration Points

- **AI Bridge:** LLM communication for embeddings and generation
- **Shared Error Package:** Consistent error handling with stack traces
- **Configuration Seeding:** Auto-seed on first run or version change

---

## Related Documents

- [WP Plugin Builder Overview](../../31-wp-plugin-builder/00-overview.md)
- [WordPress Plugin Development](../../33-wp-plugin-development/00-overview.md)
- [AI Bridge](../../22-ai-bridge-cli/00-overview.md)
- [Error Code Registry](../../03-error-code-registry/01-registry.md)
