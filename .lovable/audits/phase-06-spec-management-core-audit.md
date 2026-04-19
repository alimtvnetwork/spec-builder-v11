# Phase 6: Spec Management Software — Core Audit

**Date:** 2026-02-07  
**Auditor:** AI  
**Scope:** `spec/11-spec-management-software/` (core infrastructure — overview, data models, coding guidelines, error management, database design, shared packages, microservices, project overview), `spec/12-spec-management-software/`  
**Files Reviewed:** ~45  
**Status:** Complete

---

## 1. Inconsistency Report

| # | File(s) | Description | Severity |
|---|---------|-------------|----------|
| I-01 | `03-data-models/00-overview.md` line 42 | **Naming convention conflict.** States "Use PascalCase for types, camelCase for properties" but the project-wide mandate (memory: `style/naming-convention`) requires PascalCase for all JSON transport fields and Go struct fields. The TypeScript data models use `camelCase` properties (`createdAt`, `userId`) while Go models use PascalCase tags. | 🔴 Critical |
| I-02 | `07-database-design/01-schema.md` lines 109-113 | **JSON tag format violates naming convention.** `BaseModel` uses `json:"id"`, `json:"createdAt"`, `json:"updatedAt"` — all camelCase. The PascalCase mandate requires these to be `json:"Id"`, `json:"CreatedAt"`, `json:"UpdatedAt"` (or omitted entirely per the Go JSON tag rule: "omit tags unless adding `,omitempty`"). | 🔴 Critical |
| I-03 | `07-database-design/01-schema.md` lines 147-161 | **User model JSON tags use camelCase.** Fields like `json:"username"`, `json:"email"`, `json:"displayName"`, `json:"themePreference"`, `json:"lastLoginAt"` — all violate PascalCase mandate. Should omit tags or use PascalCase. | 🔴 Critical |
| I-04 | `06-error-management/00-overview.md` lines 60-69 | **Error struct uses camelCase JSON tags.** `AppError` has `json:"code"`, `json:"constant"`, `json:"message"`, `json:"details"`, `json:"retryable"` — should be PascalCase or omitted. | 🔴 Critical |
| I-05 | `06-error-management/00-overview.md` line 139-149 | **Error response envelope uses camelCase.** Shows `"success": false`, `"error": { "code": ... }` — conflicts with the standard PascalCase envelope `"Success": false`, `"Error": { "Code": ... }` defined in Phase 1 AC-P1-014. | 🔴 Critical |
| I-06 | `06-error-management/error-code-registry.md` lines 28-43 | **SM error ranges 1xxx-14xxx overlap with central registry.** SM defines its own 1xxx-9xxx ranges internally (e.g., 7xxx for LLM/Config/CLI), but the central `spec/03-error-code-registry/` assigns 7000-7099 to GSearch, 7100-7599 to BRun. SM's 7001-7099 LLM server codes collide with GSearch's 7000-7099 range. | 🔴 Critical |
| I-07 | `07-database-design/05-enum-architecture.md` line 11 | **States "7 mandatory methods" but ecosystem requires 9.** The enum spec and all other CLI audits confirm 9 methods are mandatory (including MarshalJSON/UnmarshalJSON). The SM enum architecture document claims compliance with "7 mandatory methods" which is inconsistent. However, the actual implementations DO include Marshal/Unmarshal — the text is just wrong. | 🟡 Warning |
| I-08 | `13-shared-packages/06-pkg-database-operations.md` lines 53-61 | **OperationType uses `string` instead of `byte`.** `type OperationType string` with constants `"Create"`, `"Read"`, `"Update"`, `"Delete"` violates the enum specification which mandates `type Variant byte` with `iota`. | 🟡 Warning |
| I-09 | `00-overview.md` line 53 | **Feature folder count is outdated.** States "22 feature folders" but `99-consistency-report.md` documents 28 feature folders (01-28). The overview hasn't been updated. | 🟡 Warning |
| I-10 | `03-project-overview/00-overview.md` lines 88-111 | **Feature index incomplete.** Lists features 01-21 but actual feature folders go up to 28 (missing 22-golang-search-cli through 28-project-editor). | 🟡 Warning |
| I-11 | `03-project-overview/00-overview.md` line 163 | **Stale cross-reference.** References `../../general-spec/00-overview.md` but the actual path is `../../01-general-spec/00-overview.md`. | 🟡 Warning |
| I-12 | `04-coding-guidelines/00-overview.md` lines 65-66 | **Stale file references.** References `01-go-guidelines.md` and `02-react-guidelines.md` but actual files are `01-helper-naming-guidelines.md` through `06-eslint-enforcement.md`. The Go and React guideline files are `03-typescript-guidelines.md` and `04-react-guidelines.md`. | 🟡 Warning |
| I-13 | `04-coding-guidelines/00-overview.md` line 87 | **Functions naming convention conflict.** States "Functions: camelCase (`getUserById`, `handleSubmit`)" for Go functions, but Go convention and the project's PascalCase mandate require exported functions to be PascalCase (`GetUserById`, `HandleSubmit`). | 🟡 Warning |
| I-14 | `13-shared-packages/` | **Duplicate numbered files.** Both `06-pkg-database-operations.md` and `06-pkg-database.md` exist with prefix `06`. This violates the unique numbering convention. | 🟡 Warning |
| I-15 | `14-microservices/` | **Duplicate numbered files.** Both `02-shared-pkg-modules.md` and `02-specmanager.md` share prefix `02`. Similarly `06-database-migrations.md` and `06-nexus-flow.md` share `06`, and `07-gateway-openapi.md` and `07-react-flow-canvas.md` share `07`. | 🟡 Warning |
| I-16 | `14-microservices/NEXUS-FLOW-REFERENCE.md` | **Non-compliant filename.** Uses `SCREAMING-CASE.md` instead of `NN-kebab-case.md` per the folder structure guideline. | 🟠 Minor |
| I-17 | `spec/12-spec-management-software/05-features/` | **Orphaned secondary spec folder.** `spec/12-spec-management-software/` contains only 2 files (`01-ai-suggestions-persistence.md`, `02-ai-suggestions-filesystem-persistence.md`) with no `00-overview.md`. These files should be in `spec/11-spec-management-software/05-features/` or cross-referenced from there. | 🟡 Warning |
| I-18 | `07-database-design/01-schema.md` lines 206-213 | **Enum type stored as `gorm:"type:text"`.** Project/File Type fields use `project_type.Variant` and `file_type.Variant` (byte enums) but store as `type:text`. SQLite will store the JSON-marshaled string representation. This works but is inconsistent with the byte-based storage implied by `type Variant byte`. | 🟠 Minor |

---

## 2. Missing Acceptance Criteria

All core SM files lack formal GIVEN/WHEN/THEN acceptance criteria.

| Folder | Files | Has AC? |
|--------|-------|---------|
| `03-data-models/` (6 files) | Core, AI, Pipeline, History, Realtime, RAG | ❌ |
| `04-coding-guidelines/` (6 files) | All | ❌ |
| `06-error-management/` (~8 files) | All | ❌ |
| `07-database-design/` (8 files) | All | ❌ |
| `13-shared-packages/` (8 files) | All | ❌ |
| `14-microservices/` (22 files) | All | ❌ |

---

## 3. Detailed Acceptance Criteria

### 3.1 Database Schema

---

**AC-P6-001: BaseModel UUID Generation**

GIVEN: A new entity (User, Project, File, etc.) is being created via GORM

WHEN: `BeforeCreate` hook fires and `Id` is empty

THEN:
- A UUID v4 MUST be generated and assigned to `Id`
- The UUID MUST be in standard string format (`xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)
- If `Id` is already set (non-empty), the hook MUST NOT overwrite it
- `CreatedAt` and `UpdatedAt` MUST be automatically set by GORM's `autoCreateTime` / `autoUpdateTime`
- For `TimestampModel` entities (e.g., Session, Snapshot): `UpdatedAt` MUST NOT exist; only `CreatedAt` is set

EDGE CASES:
- If the caller provides a custom UUID, it MUST be preserved (no overwrite)
- If the caller provides an invalid UUID string (not matching UUID format), the entity MUST still be created (UUID format validation is the caller's responsibility, not the hook's)
- Concurrent creates MUST NOT produce duplicate UUIDs (UUID v4 collision probability is negligible but the uniqueIndex constraint provides a safety net)

---

**AC-P6-002: Project Visibility and Access Control**

GIVEN: A Project exists with `OwnerId="user-1"` and `Visibility=visibility.Global`

WHEN: Access checks are performed

THEN:
- `CanView("user-1")` MUST return `true` (owner)
- `CanView("user-2")` MUST return `true` (global visibility)
- `CanEdit("user-1")` MUST return `true` (owner)
- `CanEdit("user-2")` MUST return `false` (only owner can edit regardless of visibility)
- `IsOwner("user-1")` MUST return `true`
- `IsOwner("user-2")` MUST return `false`

GIVEN: A Project exists with `Visibility=visibility.User`

THEN:
- `CanView("user-1")` (owner) MUST return `true`
- `CanView("user-2")` (non-owner) MUST return `false`
- `CanEdit("user-2")` MUST return `false`

EDGE CASES:
- A project with `Visibility=visibility.Unknown` (invalid value) MUST be treated as `User` visibility (most restrictive default)
- Soft-deleted projects (`DeletedAt IS NOT NULL`) MUST still respect visibility rules when queried with `Unscoped()` — the access check is on the model, not the query

---

**AC-P6-003: Soft Delete Behavior**

GIVEN: A User has Projects, Files, Sessions, and Instructions via cascading relationships

WHEN: The User is soft-deleted via GORM (`DELETE` which sets `DeletedAt`)

THEN:
- The User record MUST have `DeletedAt` set to current timestamp
- Regular queries (`db.Find`) MUST NOT return the soft-deleted User
- `db.Unscoped().Find` MUST return the soft-deleted User
- Cascade behavior: Projects with `OnDelete:CASCADE` MUST be soft-deleted when the User is soft-deleted
- Sessions with `OnDelete:CASCADE` MUST be cascade-deleted
- PromptPresets and Instructions with `OnDelete:SET NULL` MUST have their `CreatedById` set to NULL (not deleted)
- Files belonging to the user's projects MUST also be cascade soft-deleted (through Project cascade)

EDGE CASES:
- Hard-deleting a soft-deleted user (`db.Unscoped().Delete`) MUST permanently remove the record and all cascaded records
- Restoring a soft-deleted user (setting `DeletedAt` to NULL) MUST also restore cascade-deleted projects if they were soft-deleted at the same timestamp
- A project owned by a soft-deleted user with `Visibility=Global` MUST NOT appear in queries for other users

---

### 3.2 Configuration and Seeding

---

**AC-P6-004: Config Seeding Lifecycle**

GIVEN: A `config.seed.json` file exists with version "1.2.0" and the database has seeded configs at version "1.1.0"

WHEN: The application starts and runs the seeding process

THEN:
- The Golden Rule MUST be applied: Seed ONLY if record does NOT exist OR if (SeedVersion > StoredVersion AND IsUserModified == FALSE)
- Keys present in seed file but NOT in database MUST be inserted with `Source=config_source.Seed`
- Keys present in both where SeedVersion > StoredVersion AND Source is `Seed` MUST be updated
- Keys present in both where Source is `User` MUST NOT be overwritten (user modification preserved)
- A `ConfigSeedEvent` record MUST be created with `EventType=seed_event_type.Reseed`, `KeysSeeded` count, and `KeysModified` list
- If this is the first-ever seed, `IsFirstSeed` MUST be `true`

EDGE CASES:
- If `config.seed.json` is missing or invalid JSON, the application MUST log a warning and continue with existing config values
- If the database is empty (fresh install), ALL seed values MUST be inserted as `IsFirstSeed=true`
- If a seed key's value type changes between versions (e.g., string→int), the update MUST apply the new value and type

---

### 3.3 Error Management

---

**AC-P6-005: Error Code Uniqueness and Range Compliance**

GIVEN: A new error code is being added to the Spec Management Software

WHEN: The developer assigns a numeric code

THEN:
- The code MUST fall within the allocated ranges defined in `error-code-registry.md`
- 1xxx: Validation, 2xxx: Auth, 3xxx: Database, 4xxx: External, 5xxx: Business, 6xxx: FileSystem, 7xxx: LLM/Config, 8xxx: RAG, 9xxx: System, 10xxx: Context, 11xxx: Instructions, 12xxx: CodeGen, 13xxx: ProjectEditor
- No two errors within the SM codebase MAY share the same code number
- The error MUST have a `Constant` field following `ERR_CATEGORY_NAME` pattern
- The `AppError` struct MUST include: `Code` (int), `Constant` (string), `Message` (string), `Details` (map), `Retryable` (bool), `StatusCode` (int)

EDGE CASES:
- SM's internal 7xxx LLM range (7001-7049) MUST NOT collide with GSearch's 7000-7099 range — these are separate codebases but share the same numeric space. The central registry must either carve out SM-specific sub-ranges or SM must use a different range
- Error codes in the 14xxx range (AI Transcribe) MUST NOT be used by SM even if SM integrates with AI Transcribe

---

**AC-P6-006: Error Response Envelope Format**

GIVEN: Any SM REST API endpoint encounters an error

WHEN: The error response is serialized to JSON

THEN:
- The response MUST use the standard envelope: `{ "Success": false, "Data": null, "Error": { "Code": N, "Constant": "ERR_...", "Message": "..." } }`
- All JSON field names MUST be PascalCase (not camelCase)
- The `Error.Details` field MAY be included for additional context
- Stack traces MUST NOT appear in the response body
- The HTTP status code MUST match the error's `StatusCode` field

EDGE CASES:
- `204 No Content` responses MUST have no body
- Streaming/WebSocket errors follow the WebSocket error frame format, not the REST envelope

---

### 3.4 DBOperation Wrapper

---

**AC-P6-007: DBOperation Wrapper Mandatory Usage**

GIVEN: Any repository method in SM needs to perform a database operation

WHEN: The method is implemented

THEN:
- The method MUST use `database.NewDBOperation(tableName, opType)` to create an operation wrapper
- Write operations (Create, Update, Delete) MUST call `.ExpectRows(n)` with the expected affected row count
- The operation MUST be executed via `.Execute(func() (int64, error) { ... })`
- On success: a structured log MUST be emitted with fields `Table`, `Operation`, `AffectedRows`, `Duration`
- On error: the log MUST additionally include `ExpectedRows`, `Error`, and `Stack` (caller chain)
- Direct GORM calls (`r.db.Create(...)`) without the wrapper are FORBIDDEN

EDGE CASES:
- Read operations MAY omit `ExpectRows` since result count varies
- Batch operations with variable affected rows SHOULD set `ExpectedRows` to 0 (skip validation) but still use the wrapper for logging
- FTS5 virtual table operations using `db.Exec()` are the ONLY exception to the wrapper requirement

---

### 3.5 Shared Packages

---

**AC-P6-008: Package Import Hierarchy**

GIVEN: The SM backend has shared packages in `pkg/` (errors, types, logging, config, database)

WHEN: A service or repository imports packages

THEN:
- `pkg/database` MUST be the only package that imports GORM directly
- `pkg/errors` MUST define all error types and constants; services MUST NOT define their own error structs
- `pkg/config` MUST provide the `SettingsService` interface with typed accessors (`GetString`, `GetInt`, etc.)
- `pkg/logging` MUST configure zerolog with structured fields
- Circular imports between `pkg/*` packages MUST NOT exist
- Service packages MAY import from `pkg/*` but `pkg/*` MUST NOT import from service packages

EDGE CASES:
- If a service needs a custom error type, it MUST extend `pkg/errors.AppError` (embed, not redefine)
- Integration tests MAY import both service and pkg packages
- The `internal/enums/` directory is separate from `pkg/` — enums MAY be imported by both `pkg/` and service code

---

### 3.6 Microservices Architecture

---

**AC-P6-009: Service Registry Consistency**

GIVEN: SM defines 7 microservices (Gateway, SpecManager, Chronicle, AIBridge, Scout, NexusFlow, VoiceCLI)

WHEN: The microservices overview and individual specs are validated

THEN:
- Each service MUST have exactly one canonical spec file in `14-microservices/` (no duplicates)
- Each service MUST have a corresponding OpenAPI spec file
- The Gateway service MUST define routes that proxy to all other services
- Service-to-service communication patterns MUST be documented in each service spec
- Error codes used by each service MUST be within the SM error code ranges (1xxx-14xxx)

EDGE CASES:
- If a service is split into multiple processes (e.g., VoiceCLI runs as a separate binary), each binary MUST have its own error code sub-range
- If two services need to share database tables, they MUST go through the shared `pkg/database` package (no direct cross-service DB access)

---

### 3.7 Data Models (TypeScript Frontend)

---

**AC-P6-010: TypeScript Model Naming Convention**

GIVEN: TypeScript interfaces are defined in `03-data-models/` for frontend use

WHEN: The interfaces are validated against the naming convention

THEN:
- Type/Interface names MUST be PascalCase (e.g., `User`, `Project`, `AIRequest`)
- Property names MUST match the Go model's JSON serialization format
- Since Go models SHOULD omit JSON tags (using PascalCase export names), TypeScript properties MUST also be PascalCase (`Id`, `CreatedAt`, `Username`)
- Optional properties MUST use `?` syntax, never `| undefined`
- Date fields MUST use `string` type (ISO 8601)
- ID fields MUST use `string` type (UUIDs)
- Enums in TypeScript MUST use string literal unions matching the Go enum's `variantStrings` values (lowercase)

EDGE CASES:
- If the Go model explicitly defines a `json:"customName"` tag, the TypeScript property MUST match that custom name exactly
- Nested objects MUST be defined as separate interfaces (not inline)
- Arrays of enums (e.g., `Tags: string[]`) MUST specify the union type if the values are constrained

---

## 4. Remediation Recommendations

| # | Priority | Recommendation |
|---|----------|----------------|
| R-01 | 🔴 High | Remove all camelCase JSON tags from Go models in `07-database-design/01-schema.md`. Either omit tags entirely (letting PascalCase export names be the JSON keys) or explicitly use PascalCase tags. |
| R-02 | 🔴 High | Update error response envelope in `06-error-management/00-overview.md` to use PascalCase field names (`"Success"`, `"Error"`, `"Code"`, `"Message"`). |
| R-03 | 🔴 High | Resolve SM's 7xxx error code range conflict with GSearch (7000-7099) and BRun (7100-7599). SM should use a dedicated range (e.g., 15xxx-15999 or prefix SM codes with 2xxx for its internal categorization). |
| R-04 | 🟡 Medium | Fix `05-enum-architecture.md` text to say "9 mandatory methods" instead of "7 mandatory methods". |
| R-05 | 🟡 Medium | Convert `OperationType string` in `06-pkg-database-operations.md` to the compliant `type Variant byte` pattern. |
| R-06 | 🟡 Medium | Update `00-overview.md` feature folder count from 22 to 28. |
| R-07 | 🟡 Medium | Complete the feature index in `03-project-overview/00-overview.md` to include features 22-28. |
| R-08 | 🟡 Medium | Resolve duplicate numeric prefixes in `13-shared-packages/` and `14-microservices/`. |
| R-09 | 🟡 Medium | Migrate or cross-reference `spec/12-spec-management-software/05-features/` files to/from `spec/11-spec-management-software/`. |
| R-10 | 🟡 Medium | Fix coding guidelines to reference correct file names (remove stale `01-go-guidelines.md` reference). |
| R-11 | 🟡 Medium | Update TypeScript data model conventions from camelCase to PascalCase properties. |
| R-12 | 🟠 Low | Rename `NEXUS-FLOW-REFERENCE.md` to `NN-nexus-flow-reference.md` per naming convention. |

---

## Cross-References

| Resource | Location |
|----------|----------|
| SM Overview | `spec/11-spec-management-software/00-overview.md` |
| SM Database Schema | `spec/11-spec-management-software/07-database-design/01-schema.md` |
| SM Enum Architecture | `spec/11-spec-management-software/07-database-design/05-enum-architecture.md` |
| SM Error Registry | `spec/11-spec-management-software/06-error-management/error-code-registry.md` |
| Central Error Registry | `spec/03-error-code-registry/` |
| Naming Convention | memory: `style/naming-convention` |
| DBOperation Wrapper | `spec/11-spec-management-software/13-shared-packages/06-pkg-database-operations.md` |

---

*Phase 6 audit complete. 18 inconsistencies found (6 critical), 10 acceptance criteria generated.*
