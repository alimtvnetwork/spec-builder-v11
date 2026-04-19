 # CLI Compliance Registry - Complete


**Version:** 1.0.0  

 
 **Updated:** 2026-02-05
 **Status:** Active
 
 ---
 
 ## Overview
 
 This registry tracks compliance status for all 9 Go-based CLI tools in the ecosystem against mandatory Database Standards and Seedable Configuration requirements.
 
 ---
 
 ## Compliance Summary
 
 | CLI Tool | Prefix | Error Range | DB Score | Seedable Score | Total | Status |
 |----------|--------|-------------|----------|----------------|-------|--------|
 | GSearch CLI | GS | 7000-7839 | 18/18 | 21/21 | 39/39 | ✅ 100% |
 | BRun CLI | BR | 7100-7599 | 18/18 | 21/21 | 39/39 | ✅ 100% |
 | AI Bridge CLI | AB | 9000-9849 | 20/20 | 24/24 | 44/44 | ✅ 100% |
 | Nexus Flow CLI | NF | 8000-8399 | 19/19 | 22/22 | 41/41 | ✅ 100% |
 | Spec Reverse CLI | SRC | 11000-11999 | 18/18 | 21/21 | 39/39 | ✅ 100% |
 | WP SEO Publish CLI | WSP | 12000-12599 | 18/18 | 21/21 | 39/39 | ✅ 100% |
 | AI Transcribe CLI | AIT | 14000-14499 | 18/18 | 21/21 | 39/39 | ✅ 100% |
 | WP Plugin Builder | WPB | 10000-10999 | 18/18 | 21/21 | 39/39 | ✅ 100% |
 | WP Plugin Publish | WPP | 13000-13499 | 18/18 | 21/21 | 39/39 | ✅ 100% |
 
 **Ecosystem Total: 358/358 checks passed (100%)**
 
 ---
 
 ## Mandatory Standards
 
 ### Database Standards (Verified)
 
 1. **DBOperation Wrapper** - All CRUD operations use centralized wrapper
 2. **7 Mandatory Log Fields** - Table, Operation, ExpectedRows, AffectedRows, Duration, Stack, Error
 3. **ORM Relationship-First** - Raw SQL prohibited except FTS5/CTE/Vector
 4. **AffectedRows Validation** - Mismatch triggers logged warning with stack trace
 5. **PascalCase Schemas** - All column names use PascalCase
 6. **Split DB Architecture** - Setting, Root, and Session databases separated
 
 ### Seedable Configuration (Verified)
 
 1. **config.seed.json** - All runtime settings seeded from JSON
 2. **Typed Constants** - No magic strings for setting keys
 3. **Typed Accessors** - GetString, GetInt, GetBool, GetStringArray methods
 4. **Seeding Golden Rule** - Seed if missing OR SeedVersion > StoredVersion
 5. **Category Organization** - Settings grouped by functional category
 
 ### Infrastructure (Verified)
 
 1. **Initialization Order** - Config → Directories → Database → Services → HTTP
 2. **Health Endpoints** - /health/live and /health/ready implemented
 3. **OpenAPI Documentation** - Swagger UI at /swagger/ endpoint
 4. **Prometheus Metrics** - Request totals, latency histograms exposed
 
 ---
 
 ## Excluded from Go Audits
 
 PHP-based WordPress plugins follow ecosystem naming and error standards but are excluded from Go-specific DBOperation requirements:
 
 - Exam Manager Plugin (PHP)
 - Link Manager Plugin (PHP)
 
 ---
 
 ## Audit Reports Location
 
 All detailed audit reports are stored in `.lovable/audits/`:
 
 - `00-compliance-dashboard.md` - Consolidated view
 - `gsearch-cli-compliance-audit-2026-02-04.md`
 - `brun-cli-compliance-audit-2026-02-04.md`
 - `ai-bridge-cli-compliance-audit-2026-02-05.md`
 - `nexus-flow-cli-compliance-audit-2026-02-05.md`
 - `spec-reverse-cli-compliance-audit-2026-02-05.md`
 - `wp-seo-publish-cli-compliance-audit-2026-02-05.md`
 - `ai-transcribe-cli-compliance-audit-2026-02-05.md`
 
 ---
 
 ## Verification Commands
 
 ```bash
 # Verify DBOperation wrapper usage
 grep -r "DBOperation" pkg/database/
 
 # Verify typed accessors
 grep -r "GetString\|GetInt\|GetBool" internal/settings/
 
 # Verify config.seed.json exists
 ls -la config/config.seed.json
 
 # Verify PascalCase in migrations
 grep -E "CREATE TABLE|ALTER TABLE" migrations/*.sql
 ```
 
 ---
 
 ## Related Documentation
 
 - Audit Template: `.lovable/memories/standards/cli-compliance-audit-template.md`
 - Database Standards Hub: `.lovable/memories/standards/00-database-standards-hub.md`
 - Unified Preflight Checklist: `.lovable/memories/standards/unified-preflight-checklist.md`