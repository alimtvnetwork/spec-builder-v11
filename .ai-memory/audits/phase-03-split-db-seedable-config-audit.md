# Phase 3: Split DB & Seedable Config Architecture Audit

**Date:** 2026-02-06  
**Auditor:** AI  
**Scope:** `02-spec/06-split-db-architecture/`, `02-spec/07-seedable-config-architecture/`  
**Files Reviewed:** 12  
**Status:** Complete

---

## 1. Inconsistency Report

| # | File(s) | Description | Severity |
|---|---------|-------------|----------|
| I-01 | `02-spec/07-seedable-config-architecture/00-overview.md` lines 258-287 | **Database table names use `snake_case`.** Tables are named `config_meta`, `settings`, `settings_history` with `snake_case` column names (`seed_version`, `created_at`). This directly violates the project-wide PascalCase database naming convention established in `02-spec/01-general-spec/04-advanced/03-database-conventions-advanced.md` and enforced in Split DB specs. | 🔴 Critical |
| I-02 | `02-spec/07-seedable-config-architecture/03-rag-validation-helpers.md` lines 19-30 | **Error code mapping inconsistency.** The helper maps error names like `RAG_CHUNK_SIZE_INVALID` to code `AB-9301`, using the `AB-NNNN` prefix format. But the actual error codes in Go implementations (per `02-spec/22-ai-bridge-cli/`) use plain integers (9301). The prefix is never used in runtime code. | 🟡 Warning |
| I-03 | `02-spec/06-split-db-architecture/00-overview.md` lines 198-199 | **`Status` field uses string type.** The `Projects.Status` column is `TEXT DEFAULT 'active'` with comment "active, archived, deleted" — this should reference `pipeline_status.Variant` or a shared `entity_status.Variant` enum per the enum specification. Same issue in `Databases.Status` (line 220). | 🟡 Warning |
| I-04 | `02-spec/06-split-db-architecture/01-cli-examples.md` lines 54-55 | **AI Bridge chat session path mismatch.** CLI examples show `data/{app}/ai/chat/001-{id}.db` but the memory context and `02-spec/22-ai-bridge-cli/01-backend/12-database-architecture.md` use the updated path `data/{app}/rag/chat/{company}/{seq}-{sessionId}.db` with company-scoping. The CLI examples document is outdated. | 🔴 Critical |
| I-05 | `02-spec/07-seedable-config-architecture/06-validation-data-seeding.md` lines 230-238 | **`ValidationCategory` uses `string` type instead of enum.** The spec defines `type ValidationCategory string` with const values — this should use the byte-based `Variant` pattern per `02-spec/17-enum-specification/`. Same issue with `SeoKey`, `RagKey`, `FaqKey`, `SearchKey` types. | 🟡 Warning |
| I-06 | `02-spec/06-split-db-architecture/04-rbac-casbin.md` lines 190-196 | **`RbacLevel` uses `string` type.** Defines `type RbacLevel string` with const values `"root"`, `"app"`, `"company"` — should use byte-based enum pattern. | 🟡 Warning |
| I-07 | `02-spec/06-split-db-architecture/05-user-scoped-isolation.md` lines 240-243 | **`ScopeLevel` uses `string` type.** Defines `type ScopeLevel string` with `"app"` and `"company"` — should use byte-based enum pattern. | 🟡 Warning |
| I-08 | `02-spec/07-seedable-config-architecture/02-rag-chunk-settings.md` lines 122-127 | **Error code numbering mismatch.** Validator uses codes AB-9301 through AB-9306 for chunk validation, but the error code mapping in `03-rag-validation-helpers.md` uses AB-9301 through AB-9310 with different assignments (e.g., `9303` is "overlap too large" in helpers but "chunk size not multiple" in chunk settings). The chunk size validator assigns 9301=range check and 9303=multiple check, while the helpers assign 9301=range and 9302=multiple. | 🟡 Warning |
| I-09 | `02-spec/06-split-db-architecture/02-reset-api-standard.md` lines 309-315 | **BRun reset error range mismatch.** States BRun reset errors are at 6401-6409, but BRun's allocated range is 7100-7599 per the error code registry. Reset errors should be at 7401-7409 or within 7100-7599. | 🟡 Warning |

---

## 2. Missing Acceptance Criteria

| File | Has AC? |
|------|---------|
| `02-spec/06-split-db-architecture/00-overview.md` | ❌ |
| `02-spec/06-split-db-architecture/01-cli-examples.md` | ❌ |
| `02-spec/06-split-db-architecture/02-reset-api-standard.md` | ❌ |
| `02-spec/06-split-db-architecture/03-database-flow-diagrams.md` | ❌ |
| `02-spec/06-split-db-architecture/04-rbac-casbin.md` | ❌ |
| `02-spec/06-split-db-architecture/05-user-scoped-isolation.md` | ❌ |
| `02-spec/07-seedable-config-architecture/00-overview.md` | ❌ |
| `02-spec/07-seedable-config-architecture/02-rag-chunk-settings.md` | ❌ |
| `02-spec/07-seedable-config-architecture/03-rag-validation-helpers.md` | ❌ |
| `02-spec/07-seedable-config-architecture/04-rag-validation-tests.md` | ❌ (has test patterns but no formal AC) |
| `02-spec/07-seedable-config-architecture/05-rag-test-coverage-matrix.md` | ❌ |
| `02-spec/07-seedable-config-architecture/06-validation-data-seeding.md` | ❌ |

---

## 3. Detailed Acceptance Criteria

### 3.1 Split DB Architecture

---

**AC-P3-001: Root DB Initialization**

GIVEN: A Go CLI tool is starting for the first time on a fresh system with no existing `data/` directory

WHEN: The `DBManager.NewDBManager(dataDir)` function is called with a `dataDir` path (e.g., `./data`)

THEN:
- The `data/` directory MUST be created with permissions `0755` if it does not exist
- The root database file (`data/{cli-name}.db`) MUST be created and opened with SQLite
- The root database MUST be configured with: `PRAGMA journal_mode=WAL`, `PRAGMA busy_timeout=5000`, `PRAGMA foreign_keys=ON`
- The following tables MUST be created: `Settings` (Key TEXT PK, Value TEXT, ValueType TEXT, Source TEXT, Description TEXT, CreatedAt DATETIME, UpdatedAt DATETIME), `Applications` or equivalent registry table, `Counters` (for sequence numbering), `DbRegistry` (for tracking child databases), `ResetRequests` (for 2-step reset API)
- All table and column names MUST use PascalCase (e.g., `CreatedAt`, not `created_at`)
- The `Settings` table MUST be seeded from `config.seed.json` if a seed file exists at the configured path
- The `DBManager` struct MUST track all open database connections in a thread-safe `sync.RWMutex`-protected map
- The function MUST return a non-nil `*DBManager` and nil error on success

EDGE CASES:
- If the `data/` directory exists but the root DB file is corrupted (e.g., not a valid SQLite file), the function MUST return an error with the specific SQLite error message, NOT silently create a new file
- If `os.MkdirAll` fails (e.g., read-only filesystem), the error MUST be wrapped with context: `"failed to create data dir: <os error>"`
- If the root DB exists and has all required tables, the function MUST NOT attempt to recreate tables (idempotent via `CREATE TABLE IF NOT EXISTS`)

---

**AC-P3-002: Child Database Dynamic Creation**

GIVEN: A root database is initialized and a `DBManager` is available

WHEN: `DBManager.GetOrCreateDB(projectSlug, dbType, entityID)` is called for a database that does not yet exist

THEN:
- The function MUST construct the database file path following the pattern: `data/{projectSlug}/{dbType}/{sequenceNum}-{entityID}.db`
- The sequence number MUST be obtained by atomically incrementing the `Counters` table for the `(projectSlug, dbType)` combination
- The parent directory structure MUST be created if it does not exist (e.g., `data/myapp/ai/chat/`)
- The new SQLite database file MUST be created, opened, and configured with WAL mode, busy timeout, and foreign keys
- A record MUST be inserted into the root DB's `DbRegistry` table with: unique ID, project reference, type, entity ID, sequence number, relative file path, size (0), record count (0), timestamps, and status "active"
- The open database handle MUST be cached in the `DBManager.openDBs` map using the key `"{projectSlug}/{dbType}/{entityID}"`
- Subsequent calls with the same parameters MUST return the cached handle without creating a new file

EDGE CASES:
- If the maximum number of open databases (`maxOpen`, default 50) is exceeded, the least-recently-accessed database MUST be closed and removed from the cache before opening the new one
- If two goroutines simultaneously request the same database, the `sync.Mutex` MUST ensure only one creates the file while the other waits and receives the cached handle
- If the disk is full and the SQLite file cannot be created, the error MUST be returned without leaving a partial/empty file on disk

---

**AC-P3-003: 2-Step Reset API — Request Phase**

GIVEN: A CLI backend is running with at least one active database in its `DbRegistry`, and the reset API endpoints are registered at `/api/v1/reset/`

WHEN: A POST request is sent to `/api/v1/reset/request` with body `{"Scope": "all"}`

THEN:
- The response MUST be HTTP 200 with a JSON body containing: `ResetId` (format: `rst_{12-char-uuid}`), `Scope` ("all"), `ExpiresAt` (ISO8601 datetime exactly 5 minutes from now, configurable via `reset.confirmationTtlMinutes` setting), `AffectedItems` (object with CLI-specific breakdown of what will be deleted: database count, total size in bytes, per-category counts), `Message` (human-readable instruction to confirm within 5 minutes)
- A record MUST be inserted into the `ResetRequests` table with Status "pending"
- The `AffectedItems` preview MUST be computed by scanning the `DbRegistry` for all databases matching the scope — the preview MUST be accurate (not estimated)
- The reset ID MUST be cryptographically random (not sequential or predictable)
- Multiple pending reset requests for the same scope MUST be allowed — each gets a unique ID

EDGE CASES:
- If an invalid scope is provided (e.g., `"nonexistent"`), the response MUST be HTTP 400 with error message listing valid scopes for that CLI
- If the scope is `"app"` but no `AppName` parameter is provided, the response MUST be HTTP 400 with error message "AppName required for app-scoped reset"
- If there are no databases to delete for the given scope, the response MUST still succeed with `AffectedItems` showing zero counts and a message indicating nothing to reset

---

**AC-P3-004: 2-Step Reset API — Confirm Phase**

GIVEN: A pending reset request exists in the `ResetRequests` table with a valid (non-expired) `ExpiresAt` timestamp

WHEN: A POST request is sent to `/api/v1/reset/confirm` with body `{"ResetId": "rst_abc123def456"}`

THEN:
- The system MUST validate that the reset ID exists, has status "pending", and has not expired (current time < ExpiresAt)
- If valid, the system MUST: (1) close all open database handles for the affected databases, (2) delete the physical `.db` files from disk (including WAL and SHM files), (3) remove or mark as "deleted" the corresponding `DbRegistry` entries, (4) reset the `Counters` for affected categories to 0, (5) update the `ResetRequests` row with Status "completed", `ConfirmedAt`, `CompletedAt`, `DeletedCount`, and `FreedBytes`
- The response MUST be HTTP 200 with: `Status` "completed", `DeletedDatabases` (integer count), `FreedBytes` (integer bytes), `Duration` (string, e.g., "1.2s")
- All deletion operations MUST be performed within a single transaction to ensure atomicity — if any file deletion fails, the entire reset MUST be rolled back

EDGE CASES:
- If the reset ID does not exist, the response MUST be HTTP 404 with `{"Status": "invalid", "Error": "Invalid or already used reset ID"}`
- If the reset has expired (current time > ExpiresAt), the system MUST update the status to "expired" and return HTTP 410 with `{"Status": "expired", "Error": "Reset confirmation expired. Please request again."}`
- If the reset ID has already been confirmed (status "completed"), the response MUST be HTTP 409 with `{"Status": "already_completed"}`
- If a database file is locked by another process during deletion, the system MUST wait up to 5 seconds (busy_timeout) before failing the reset with an appropriate error

---

### 3.2 Seedable Config Architecture

---

**AC-P3-005: First-Run Configuration Seeding**

GIVEN: A CLI tool is starting for the first time with a valid `config.seed.json` file in its `configs/` directory and no existing configuration in the database

WHEN: `ConfigService.SeedWithVersionCheck()` is called

THEN:
- The system MUST parse the `config.seed.json` file and validate it against `config.schema.json`
- For each category in `categories`, and each setting in that category's `settings`: a row MUST be inserted into the `Settings` table with: `Id` (generated UUID), `Category` (category key), `Key` (setting key), `Value` (JSON-encoded default value), `Type` (setting type), `AddedInVersion` (seed version)
- A `ConfigMeta` singleton row MUST be created with: `SeedVersion` = seed file version, `CurrentVersion` = seed file version, `LastSeededAt` = current timestamp
- If the `config.seed.json` contains a non-empty `changelog` field, the system MUST create or update `CHANGELOG.md` with a new entry under the seed version heading
- The entire seeding operation MUST be performed within a single database transaction — if any insert fails, all inserts MUST be rolled back
- After successful seeding, the system MUST log: `"Configuration seeded from config.seed.json (version X.Y.Z, N settings)"`

EDGE CASES:
- If `config.seed.json` does not exist, the system MUST return an error `"failed to load seed: file not found"` — it MUST NOT start with an empty configuration
- If `config.seed.json` contains invalid JSON, the error MUST include the parse error with line/column information
- If a setting's `default` value is `null`, the system MUST store the string `"null"` as the JSON-encoded value, NOT skip the setting

---

**AC-P3-006: Version-Aware Configuration Merge**

GIVEN: A CLI tool has an existing seeded configuration at version `1.1.0` in its database, and the `config.seed.json` has been updated to version `1.2.0` with new settings added

WHEN: `ConfigService.SeedWithVersionCheck()` is called on subsequent startup

THEN:
- The system MUST compare the seed file version (`1.2.0`) with the database's `ConfigMeta.SeedVersion` (`1.1.0`) using semantic versioning comparison
- Since `1.2.0 > 1.1.0`, the system MUST perform a merge operation: for each setting in the seed file, if the setting does NOT exist in the database (new setting), it MUST be inserted with its default value and `AddedInVersion = "1.2.0"`; if the setting ALREADY exists in the database (existing setting), it MUST be PRESERVED (user modifications are never overwritten)
- The `ConfigMeta.SeedVersion` and `CurrentVersion` MUST be updated to `1.2.0`
- The `ConfigMeta.LastSeededAt` MUST be updated to the current timestamp
- The `CHANGELOG.md` MUST be updated with the new version's changelog entry
- If the seed version is EQUAL TO or LESS THAN the database version, the seed MUST be skipped entirely with no database writes

EDGE CASES:
- If a setting was removed from the seed file (present in DB at `AddedInVersion = "1.1.0"` but absent in `1.2.0` seed), the existing database row MUST be preserved — the system MUST NOT delete settings that users may have configured
- If a setting's `type` changed between versions (e.g., from `"number"` to `"select"`), the existing value MUST be preserved but a warning MUST be logged: `"Setting {category}.{key} type changed from {old} to {new}"`
- If the seed version uses a pre-release suffix (e.g., `1.2.0-beta.1`), semver comparison MUST follow RFC: `1.2.0-beta.1 < 1.2.0`

---

**AC-P3-007: RAG Configuration Validation**

GIVEN: A `RagConfig` struct is populated with values (from seed, root DB, or app-level override)

WHEN: `DefaultValidator.Validate(config)` is called

THEN:
- `ChunkSize` MUST be validated: value MUST be ≥ 256 and ≤ 8192 (error 9301 if out of range), value MUST be a multiple of 256 (error 9302 if not)
- `ChunkOverlap` MUST be validated: value MUST be ≥ 0 and ≤ 512 (error 9303 if out of range), value MUST NOT exceed 25% of `ChunkSize` (error 9303 with message indicating the max overlap)
- `ContextTokenBudget` MUST be validated: value MUST be ≥ 512 and ≤ 16384 (error 9304 if out of range)
- `EmbeddingModel` MUST be validated against the supported models list: `nomic-embed-text`, `text-embedding-3-small`, `text-embedding-3-large`, `all-MiniLM-L6-v2` (error 9305 if unsupported)
- `SimilarityThreshold` MUST be validated: value MUST be ≥ 0.0 and ≤ 1.0 (error 9306 if out of range)
- `TopK` MUST be validated: value MUST be ≥ 1 and ≤ 50 (error 9307 if out of range)
- Each validation error MUST include: error code (integer), error name (SCREAMING_SNAKE_CASE), human-readable message, field name, actual value, expected range/format, timestamp
- If multiple fields are invalid, ALL errors MUST be returned (not just the first one)

EDGE CASES:
- If `ChunkSize` is 256 (minimum) and `ChunkOverlap` is 65 (> 25% of 256 = 64), the overlap validation MUST fail even though 65 is within the absolute 0-512 range
- If `ChunkOverlap` is 0 (disabled), the validation MUST pass — zero overlap is valid
- If `SimilarityThreshold` is exactly 0.0 or exactly 1.0, the validation MUST pass — boundary values are inclusive
- If `EmbeddingModel` is an empty string, error 9305 MUST be returned (not a nil pointer or panic)

---

**AC-P3-008: Configuration Priority Resolution**

GIVEN: A RAG setting (e.g., `ChunkSize`) exists at three levels: seed default (2048), root DB setting (4096), and app-level override (8192)

WHEN: `RagConfigService.Load(appName)` is called

THEN:
- The system MUST resolve the value using this priority order (highest first): (1) App-level override (`data/{appName}/settings/config.db`), (2) Root DB setting (`data/{cli}.db → Settings`), (3) Seed default (`config.seed.json`)
- The returned `RagConfig.ChunkSize` MUST be `8192` (app-level override wins)
- The returned `RagConfig.Source` MUST be `"app"` to indicate where the effective value came from
- If the app-level DB does not exist or has no override for `ChunkSize`, the root DB value (4096) MUST be used with `Source = "root"`
- If neither app nor root has a value, the seed default (2048) MUST be used with `Source = "seed"`
- After priority resolution, the final config MUST pass validation (`DefaultValidator.Validate`) — if the resolved config is invalid, an error MUST be returned (not the invalid config)

EDGE CASES:
- If the app-level DB exists but the `Settings` table is empty, the system MUST fall through to root DB (not treat empty table as "all values are zero")
- If `ChunkOverlap` comes from app-level (e.g., 200) but `ChunkSize` comes from root (e.g., 512), the cross-field validation (overlap ≤ 25% of chunk size = 128) MUST use the mixed sources — and MUST fail if 200 > 128
- If the `appName` parameter is empty string, the system MUST skip app-level resolution entirely and use root + seed only

---

### 3.3 RBAC with Casbin

---

**AC-P3-009: RBAC Policy Enforcement**

GIVEN: A Casbin RBAC enforcer is initialized with the standard model (`rbac_model.conf`) and the following seed policies: admin can access `*` with action `*`, viewer can access `/api/*` with action `read`, and user `alice` has role `admin`

WHEN: `RbacManager.Enforce("alice", "/api/users", "delete")` is called

THEN:
- The function MUST return `(true, nil)` because `alice` has role `admin` which has wildcard permission
- `RbacManager.Enforce("bob", "/api/users", "read")` where `bob` has role `viewer` MUST return `(true, nil)`
- `RbacManager.Enforce("bob", "/api/users", "delete")` MUST return `(false, nil)` because viewers can only read
- `RbacManager.Enforce("unknown_user", "/api/users", "read")` where the user has no assigned role MUST return `(false, nil)` — default deny
- All `Enforce` calls MUST acquire a read lock (`mu.RLock()`) and release it before returning
- Policy changes via `AddPolicy` or `AddRoleForUser` MUST acquire a write lock (`mu.Lock()`) and auto-save to the SQLite database via `enforcer.EnableAutoSave(true)`
- The `CasbinRule` table in the SQLite database MUST reflect all current policies and role assignments

EDGE CASES:
- If the RBAC database file is deleted while the enforcer is running, subsequent policy saves MUST fail with an error (not silently lose policies)
- If `ReloadPolicy()` is called while an `Enforce` check is in progress, the mutex MUST prevent data races — the reload waits for the read lock to be released
- If a role hierarchy exists (admin → manager → editor → viewer), a user with role `editor` MUST inherit `viewer` permissions but NOT `manager` permissions

---

## 4. Remediation Recommendations

| Priority | Action | Files Affected |
|----------|--------|----------------|
| 🔴 P0 | Convert all table/column names in `02-spec/07-seedable-config-architecture/00-overview.md` from `snake_case` to PascalCase (`config_meta` → `ConfigMeta`, `seed_version` → `SeedVersion`, etc.) | `00-overview.md` |
| 🔴 P0 | Update AI Bridge chat session paths in `02-spec/06-split-db-architecture/01-cli-examples.md` to match the current company-scoped pattern `data/{app}/rag/chat/{company}/{seq}-{sessionId}.db` | `01-cli-examples.md` |
| 🟡 P1 | Convert `RbacLevel`, `ScopeLevel`, `ValidationCategory`, `SeoKey` etc. from `string` types to byte-based `Variant` enums per `02-spec/17-enum-specification/` | `04-rbac-casbin.md`, `05-user-scoped-isolation.md`, `06-validation-data-seeding.md` |
| 🟡 P1 | Fix BRun reset error range from 6401-6409 to a range within 7100-7599 | `02-reset-api-standard.md` |
| 🟡 P1 | Reconcile RAG validation error code numbering between `02-rag-chunk-settings.md` and `03-rag-validation-helpers.md` | Both files |
| 🟡 P1 | Remove `AB-` prefix from error codes in validation helpers to match Go integer code convention | `03-rag-validation-helpers.md` |

---

*Phase 3 audit completed. 9 inconsistencies found, 9 acceptance criteria written.*
