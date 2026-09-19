# WP Plugin Builder: Acceptance Criteria

**Version:** 2.0.0  
**Status:** Active  
**Updated:** 2026-03-09  
**Format:** GIVEN/WHEN/THEN (E2E-test-ready)

---

## Core Architecture (01-core-architecture.md)

### WB-01: Plugin Project Scaffolding

**GIVEN** a valid plugin name and target WordPress version  
**WHEN** `wpbuilder init --name my-plugin --wp-version 6.4` is executed  
**THEN** a complete plugin directory structure is created with main PHP file, readme.txt, and asset folders  
**AND** the project is registered in the WP Builder database

**Edge Cases:**
- **GIVEN** the plugin name contains characters invalid for PHP namespaces **WHEN** scaffolding runs **THEN** the name is sanitized for the namespace and the original name is preserved in readme.txt

### WB-02: CLI Interface

**GIVEN** the WP Builder binary is available  
**WHEN** `wpbuilder --help` is executed  
**THEN** all commands (init, build, test, deploy, spec) are listed with descriptions

---

## Configuration (03-configuration.md)

### WB-03: Config Loading

**GIVEN** a valid `config.json` with PascalCase keys  
**WHEN** WP Builder starts  
**THEN** all configuration values are loaded and validated against the schema

**Edge Cases:**
- **GIVEN** legacy camelCase keys exist **WHEN** config is loaded **THEN** a migration warning is emitted listing the non-compliant keys

---

## Database Schema (04-database-schema.md)

### WB-04: GORM Model Migration

**GIVEN** WP Builder starts for the first time  
**WHEN** database initialization runs  
**THEN** all 7 tables (Projects, Templates, Plugins, Hooks, Assets, Builds, Deployments) are created via GORM AutoMigrate  
**AND** PascalCase column names are used throughout

---

## RAG System (05-rag-system.md)

### WB-05: Vector Search

**GIVEN** plugin specs are indexed in the RAG database  
**WHEN** a semantic search query is executed  
**THEN** relevant spec chunks are returned ranked by similarity  
**AND** `db.Raw()` is used for sqlite-vec operations (documented ORM exception)

**Edge Cases:**
- **GIVEN** the vector index is empty **WHEN** a search is performed **THEN** an empty result set is returned with a message suggesting indexing

---

## Code Generation (07-code-generation.md)

### WB-06: PHP Code Generation

**GIVEN** a spec file describing a WordPress hook or shortcode  
**WHEN** code generation is triggered  
**THEN** valid PHP code is generated following WordPress coding standards  
**AND** generated code includes proper sanitization, escaping, and nonce verification

**Edge Cases:**
- **GIVEN** the spec contains ambiguous hook names **WHEN** code generation runs **THEN** a disambiguation prompt is shown listing possible hook matches

### WB-07: Spec Processing

**GIVEN** a Markdown spec file  
**WHEN** `wpbuilder spec process --file spec.md` is executed  
**THEN** the spec is parsed into structured data (interfaces, hooks, settings)  
**AND** the parsed data is stored for code generation

---

## Project Management (06-project-management.md)

### WB-08: Multi-Project Support

**GIVEN** multiple plugin projects are registered  
**WHEN** `wpbuilder list` is executed  
**THEN** all projects are displayed with name, version, and last build status

---

## Settings, Observability, Reset (16-18)

### WB-09: Settings Service

**GIVEN** the WP Builder settings service  
**WHEN** a setting is updated  
**THEN** the change follows the seedable config golden rule with error codes 10480–10487

### WB-10: Observability

**GIVEN** WP Builder is running  
**WHEN** Prometheus metrics are scraped  
**THEN** build latency, request count, and storage usage metrics are available

### WB-11: Reset API

**GIVEN** a reset request with scope `projects`  
**WHEN** confirmed within 5 minutes  
**THEN** all project data is deleted while configuration is preserved  
**AND** error codes 10490–10496 are used for reset-specific errors

---

*Wave 6 — Batch 4 (Patched): WP Plugin Builder acceptance criteria with added PHP namespace sanitization and ambiguous hook disambiguation edge cases.*
