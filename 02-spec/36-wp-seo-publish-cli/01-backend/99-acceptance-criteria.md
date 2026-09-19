# WP SEO Publish CLI: Acceptance Criteria

**Version:** 2.0.0  
**Status:** Active  
**Updated:** 2026-03-09  
**Format:** GIVEN/WHEN/THEN (E2E-test-ready)

---

## Architecture (01-architecture.md)

### WSP-01: WordPress Connection

**GIVEN** valid WordPress credentials (URL, username, app password)  
**WHEN** `wpseo connect --url https://example.com` is executed  
**THEN** the connection is tested via WordPress REST API  
**AND** the site is registered in the database with credentials encrypted at rest

**Edge Cases:**
- **GIVEN** invalid credentials **WHEN** connection is tested **THEN** a specific auth error is returned without storing the credentials
- **GIVEN** the WordPress site has REST API disabled **WHEN** connection is tested **THEN** a clear error explains the requirement

### WSP-02: Content Publishing

**GIVEN** a connected WordPress site and generated content  
**WHEN** `wpseo publish --site example.com --content post.md` is executed  
**THEN** the content is published as a WordPress post/page via REST API  
**AND** SEO metadata (title, description, slug) is set

**Edge Cases:**
- **GIVEN** the content already exists (matching slug) **WHEN** publishing is attempted **THEN** the user is prompted to update or create a new post
- **GIVEN** the network connection drops during publish **WHEN** the error is caught **THEN** the draft is saved locally for retry
- **GIVEN** the WordPress site returns a 429 (rate limited) **WHEN** publishing is attempted **THEN** the retry-after header is respected and publishing is retried automatically

---

## AI Bridge Client (04-ai-bridge-client.md)

### WSP-03: AI Content Generation

**GIVEN** an AI Bridge instance is running  
**WHEN** content generation is requested through WP SEO  
**THEN** the request is delegated to AI Bridge via REST API  
**AND** the response is formatted for WordPress publishing

---

## Variable System (05-variable-system.md)

### WSP-04: Variable Resolution

**GIVEN** a content template with variables  
**WHEN** publishing is triggered  
**THEN** all variables (`{{SiteUrl}}`, `{{AuthorName}}`, etc.) are resolved  
**AND** unresolved variables cause the publish to halt with a list of missing variables

**Edge Cases:**
- **GIVEN** a recursive variable reference loop exists (e.g., `{{A}}` → `{{B}}` → `{{A}}`) **WHEN** resolution runs **THEN** the cycle is detected within 3 levels and an error listing the cycle chain is returned

---

## Split DB Schema (06-split-db-schema.md)

### WSP-05: Three-Tier Database

**GIVEN** WP SEO starts for the first time  
**WHEN** database initialization runs  
**THEN** three database tiers are created: Setting DB, Website DB, and Publication DB  
**AND** all 26 GORM models are migrated with proper foreign key relationships

---

## API Endpoints (07-api-endpoints.md)

### WSP-06: REST API

**GIVEN** the WP SEO API server is running  
**WHEN** endpoints are called  
**THEN** all request/response payloads use PascalCase keys  
**AND** WebSocket notifications are sent for long-running operations (publish, bulk import)

**Edge Cases:**
- **GIVEN** a WebSocket notification message is malformed JSON **WHEN** the client parses it **THEN** a parse error is logged and the notification is dropped without crashing the client

---

## Import/Export (09-import-export.md)

### WSP-07: Data Export

**GIVEN** websites and publications exist in the database  
**WHEN** `wpseo export --format zip` is executed  
**THEN** all data is exported as a zip file containing SQLite databases  
**AND** the export includes version metadata for re-import compatibility

### WSP-08: Data Import

**GIVEN** a valid WP SEO export zip file  
**WHEN** `wpseo import --file backup.zip` is executed  
**THEN** data is restored to the database  
**AND** conflicts (duplicate sites) are reported with resolution options (skip, overwrite, rename)

---

## Settings, Observability, Reset (10, 11, 13)

### WSP-09: Settings Service

**GIVEN** the WP SEO settings service  
**WHEN** settings are modified  
**THEN** changes follow the seedable config golden rule with error codes 12520–12527

### WSP-10: Health Check

**GIVEN** WP SEO is running  
**WHEN** GET `/health/ready` is called  
**THEN** database status, AI Bridge connectivity, and connected WordPress sites count are returned

### WSP-11: Reset API

**GIVEN** a reset request with scope `publications`  
**WHEN** confirmed within 5 minutes  
**THEN** all publication data is deleted while website connections and settings are preserved

---

*Wave 6 — Batch 4 (Patched v2): WP SEO Publish CLI acceptance criteria. ID prefix renamed from WS-\* to WSP-\* to resolve cross-silo collision with Shared Frontend WebSocket IDs.*
