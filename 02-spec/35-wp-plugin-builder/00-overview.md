# WP Plugin Builder CLI (wpb)

**Version:** 2.1.0  
**Status:** Draft  
**Updated:** 2026-03-30  
**AI Confidence:** Medium  
**Ambiguity:** Medium

---

## Keywords

`wp-plugin-builder` · `golang` · `cli` · `wordpress` · `rag` · `ai-bridge` · `code-generation` · `vector-embeddings` · `sqlite`

---

## Scoring

| Metric | Value |
|--------|-------|
| AI Confidence | Medium |
| Ambiguity | Medium |
| Health Score | 100/100 (A+) |

---

## Overview

A Golang CLI tool for AI-assisted WordPress plugin development, leveraging RAG (Retrieval-Augmented Generation) and the AI Bridge for intelligent code generation. Manages project-specific SQLite databases with vector embeddings for context-aware plugin creation.

**Binary Name:** `wpb`  
**Module Path:** `github.com/user/wp-plugin-builder`

---

## Design Philosophy

**RAG-Driven Development:** Every plugin project maintains its own knowledge base, enabling context-aware code generation that follows WordPress best practices and project-specific patterns.

**Isolation by Design:** Each project has a dedicated SQLite database containing RAG vectors, file tracking, and generation history—enabling portable, self-contained development environments.

---

## Cross-References

- [AI Bridge](../27-ai-bridge-cli/00-overview.md) — LLM communication layer
- [BRun CLI](../26-brun-cli/00-overview.md) — Build and execution patterns
- [GSearch CLI](../25-gsearch-cli/00-overview.md) — Configuration patterns
- [Error Code Registry](../03-error-manage/03-error-code-registry/02-registry.md) — Error code allocation (10xxx)
- [Error Resolution](../03-error-manage/01-error-resolution/00-overview.md) — Debugging and verification patterns
- [PHP Debugging Guide](../03-error-manage/01-error-resolution/05-debugging-cheat-sheet.md) — WordPress/PHP debugging
- [DBOperation Wrapper](../21-app/spec-management-software/13-shared-packages/08-pkg-database-operations.md) — Mandatory database operation wrapper
- [ORM-Only Policy](../../.ai-memory/memories/workflow/implementation-strategy.md) — Raw SQL prohibition
- [Database Pre-flight Checklist](../../.ai-memory/memories/workflow/implementation-strategy.md) — Pre-development verification

---

## Document Index

| # | Document | Description | Status |
|---|----------|-------------|--------|
| 00 | [Overview](./00-overview.md) | This file | ✅ Complete |
| 01 | [Core Architecture](./01-core-architecture.md) | System design and components | ✅ Complete |
| 02 | [CLI Interface](./02-cli-interface.md) | Commands and parameters | ✅ Complete |
| 03 | [Configuration](./03-configuration.md) | config.json schema and seeding | ✅ Complete |
| 04 | [Database Schema](./04-database-schema.md) | Root DB and project DBs | ✅ Complete |
| 05 | [RAG System](./05-rag-system.md) | Vector embeddings and retrieval | ✅ Complete |
| 06 | [Project Management](./06-project-management.md) | Create, clone, import, export | ✅ Complete |
| 07 | [Code Generation](./07-code-generation.md) | AI-driven PHP code generation | ✅ Complete |
| 08 | [Spec Processing](./08-spec-processing.md) | PRD/spec import and parsing | ✅ Complete |
| 09 | [Preset Learning](./09-preset-learning.md) | WordPress plugin best practices | ✅ Complete |
| 10 | [Error Handling](./10-error-handling.md) | Error codes and logging | ✅ Complete |
| 11 | [API Interface](./11-api-interface.md) | REST API for port mode | ✅ Complete |
| 12 | [Coding Guidelines](./12-coding-guidelines.md) | PHP/WordPress code standards | ✅ Complete |
| 13 | [Testing Strategy](./13-testing-strategy.md) | Unit and integration tests | ✅ Complete |
| 14 | [Implementation Guide](./14-implementation-guide.md) | Build order and dependencies | ✅ Complete |
| 99 | [Consistency Report](./99-consistency-report.md) | Cross-reference validation | 📋 Pending |

---

## Component Summary

| Component | Count | Purpose |
|-----------|-------|---------|
| Specifications | 14 | Complete feature documentation |
| CLI Commands | 8 | project, preset, generate, validate, import, export, server, help |
| Database Types | 2 | Root DB (meta) + Project DBs (RAG + files) |
| Preset Categories | 5 | Core, Admin, API, Shortcode, Block |

---

## Key Features

### 1. Dual Database Architecture
- **Root Database:** Tracks all projects, presets, and global settings
- **Project Databases:** Self-contained RAG vectors + file metadata per project
- Portable: Export project as single SQLite file

### 2. RAG-Powered Code Generation
- Vector embeddings stored in SQLite (via sqlite-vec or similar)
- Context retrieval from project knowledge base
- WordPress-specific prompt engineering

### 3. Preset Learning System
- Import WordPress plugin best practices from markdown
- Train on existing plugin structures
- Convert learning to vector DB for fast retrieval

### 4. Flexible Execution Modes
- **CLI Mode:** Direct command execution
- **Server Mode:** REST API on configurable port
- Daemon support for long-running operations

### 5. Spec-Driven Development
- Import PRD or spec folder (zip or directory)
- Parse markdown specifications
- AI validates generated code against specs

### 6. Project Portability
- Export: Full project → single SQLite DB + optional zip
- Import: SQLite DB or spec folder
- Clone: Duplicate project with new name

---

## Quick Start

```bash
# Initialize a new plugin project
wpb project create exam-manager --author "John Doe" --website "example.com"

# Import preset learning
wpb preset import ./presets/wordpress-plugin-standards.md

# Generate code from specification
wpb generate --spec ./specs/requirements.md --output ./plugins/exam-manager

# Start server mode
wpb server start --port 8090

# Export project for sharing
wpb project export exam-manager --output ./exports/exam-manager.sqlite
```

---

## Technology Stack

| Component | Technology |
|-----------|------------|
| Language | Go 1.21+ |
| CLI Framework | Cobra + Viper |
| Config Format | JSON |
| Database | SQLite (root + per-project) |
| ORM | GORM |
| Vector Store | sqlite-vec extension |
| AI Backend | AI Bridge |

---

## Error Code Range

> ⚠️ **COMPRESSED (2026-02-28):** Previously used 10000-10999. Compressed to 10000-10499 to resolve collision with AB Lovable Reasoning.

WP Plugin Builder uses error codes **10000-10499**:

| Range | Category |
|-------|----------|
| 10000-10099 | General/Startup |
| 10100-10199 | Configuration |
| 10200-10299 | Database Operations |
| 10300-10399 | Project Management |
| 10400-10419 | RAG/Vector Operations |
| 10420-10439 | Code Generation |
| 10440-10459 | Spec Processing |
| 10460-10479 | Server/API |
| 10480-10489 | Settings |
| 10490-10499 | Reset |

---

## Project Status

| Phase | Name | Status |
|-------|------|--------|
| 1 | Core CLI & Config | Planned |
| 2 | Database Schema | Planned |
| 3 | RAG System | Planned |
| 4 | Code Generation | Planned |
| 5 | AI Bridge Integration | Planned |

---

## Dependencies

- [AI Bridge](../27-ai-bridge-cli/00-overview.md) — LLM abstraction layer
- [Shared Error Package](../03-error-manage/03-error-code-registry/02-registry.md) — Centralized error handling

---

## See Also

- [WordPress Plugin Spec](../34-wp-plugin/00-overview.md)
- [Coding Guidelines - PHP](../21-app/spec-management-software/12-prompts/01-coding-guideline/00-overview.md)
