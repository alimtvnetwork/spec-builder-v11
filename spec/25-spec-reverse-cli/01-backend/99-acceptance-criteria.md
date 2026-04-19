# Spec Reverse CLI: Acceptance Criteria

**Version:** 2.0.0  
**Status:** Active  
**Updated:** 2026-03-09  
**Format:** GIVEN/WHEN/THEN (E2E-test-ready)

---

## Architecture (01-architecture.md)

### SR-01: Code Analysis Pipeline

**GIVEN** a source code directory  
**WHEN** `specreverse analyze --dir ./src` is executed  
**THEN** the code is parsed via AST analysis  
**AND** functions, types, interfaces, and dependencies are extracted  
**AND** results are stored in the analysis database

**Edge Cases:**
- **GIVEN** the directory contains no supported files (Go, TypeScript, PHP) **WHEN** analysis runs **THEN** a warning is returned listing supported file types
- **GIVEN** a file has syntax errors **WHEN** AST parsing fails **THEN** the file is skipped with a warning and analysis continues for remaining files
- **GIVEN** the source directory contains >10,000 files **WHEN** analysis runs **THEN** files are processed in batches of 500 with progress reporting and memory usage stays under 200MB

### SR-02: Spec Generation

**GIVEN** analysis results exist  
**WHEN** spec generation is triggered  
**THEN** Markdown specification files are generated following the project's spec template  
**AND** generated specs include interfaces, API endpoints, acceptance criteria, and cross-references

**Edge Cases:**
- **GIVEN** the output directory already contains spec files **WHEN** generation runs **THEN** the user is prompted to overwrite, merge, or skip existing files

---

## Code Analysis (02-code-analysis.md)

### SR-03: Multi-Language Support

**GIVEN** a project with mixed Go and TypeScript code  
**WHEN** analysis runs  
**THEN** both languages are parsed with language-specific AST parsers  
**AND** cross-language references (e.g., API contracts) are identified

### SR-03b: Dependency Graph

**GIVEN** a codebase has been analyzed  
**WHEN** `specreverse graph --format dot` is executed  
**THEN** a dependency graph is generated in DOT format  
**AND** nodes represent modules/packages and edges represent import relationships

---

## AI Bridge Integration (03-ai-bridge-integration.md)

### SR-04: AI-Assisted Spec Enhancement

**GIVEN** raw analysis results  
**WHEN** AI Bridge integration is enabled  
**THEN** the AI enhances specs with descriptions, rationale, and edge cases  
**AND** `db.Raw()` is used for SQLite-vss vector operations (documented ORM exception)

**Edge Cases:**
- **GIVEN** AI Bridge is unavailable **WHEN** spec generation runs **THEN** specs are generated without AI enhancement (template-only mode) with a warning
- **GIVEN** AI Bridge returns a response exceeding the configured max token limit **WHEN** the response is processed **THEN** the response is truncated and a warning is included in the generated spec

---

## Settings, Observability, Reset (04-06)

### SR-05: Settings Service

**GIVEN** the Spec Reverse settings service  
**WHEN** analysis configuration is modified  
**THEN** changes follow the seedable config golden rule with error codes 11500–11556

### SR-06: Observability

**GIVEN** Spec Reverse is running  
**WHEN** Prometheus metrics are scraped  
**THEN** analysis latency, file count, and spec generation metrics are available

### SR-07: Reset API

**GIVEN** a reset request with scope `analysis`  
**WHEN** confirmed within 5 minutes  
**THEN** all analysis databases and generated specs are deleted  
**AND** error codes 11600–11606 are used for reset errors

**Edge Cases:**
- **GIVEN** scope is `all` **WHEN** reset is confirmed **THEN** analysis data, generated specs, dependency graphs, and RAG indexes are all deleted
- **GIVEN** a generated spec file is open in another process **WHEN** deletion is attempted **THEN** the locked file is skipped and reported in the response

### SR-08: Health Check

**GIVEN** Spec Reverse is running  
**WHEN** GET `/health/ready` is called  
**THEN** database status, AST parser availability, and AI Bridge connectivity are returned

---

*Wave 6 — Batch 4 (Patched): Spec Reverse CLI acceptance criteria expanded from 7 to 13 criteria with large directory memory bounds, dependency graph output, spec overwrite handling, AI response truncation, and comprehensive reset edge cases.*
