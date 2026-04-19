# Phase 1: Foundation & Cross-Cutting Standards Audit

**Date:** 2026-02-06  
**Auditor:** AI  
**Scope:** `spec/01-general-spec/`, `spec/17-enum-specification/`, `spec/00-folder-structure-guideline.md`  
**Files Reviewed:** 37  
**Status:** Complete

---

## 1. Inconsistency Report

| # | File(s) | Description | Severity |
|---|---------|-------------|----------|
| I-01 | `spec/17-enum-specification/00-overview.md` lines 76-84 | **Stale compliance table.** Shows all CLIs as "❌ Non-Compliant" with old scores (e.g., BRun 2/50, AI Bridge 8/50) but all 9 CLIs have been remediated to 50/50 per `.lovable/audits/*-remediation-phases.md`. The overview is outdated and misleading. | 🔴 Critical |
| I-02 | `spec/00-folder-structure-guideline.md` lines 30-121 | **Missing CLI folders.** Directory tree does not list `spec/25-spec-reverse-cli/`, `spec/14-wp-seo-publish-cli/` (dual numbering collision on 14), `spec/26-ai-transcribe-cli/`, `spec/60-ai-research/`, or `spec/17-enum-specification/`. The "Global Spec Directory Structure" is incomplete. | 🔴 Critical |
| I-03 | `spec/00-folder-structure-guideline.md` lines 156-166 | **Numbering range table outdated.** States "20-29: WordPress" but actual WP specs are at `30-wp-plugin/` and `31-wp-plugin-builder/`. Also states "08-19: CLI Tools" but `spec/14` is used by both Spec Reverse CLI and WP SEO Publish CLI (collision). | 🔴 Critical |
| I-04 | `spec/01-general-spec/01-foundation/01-coding-standards-foundation.md` line 23 | **ORM property naming conflicts with project-wide PascalCase mandate.** Spec says ORM properties use `camelCase` (e.g., `createdAt`), but the project-wide naming convention (memory: `style/naming-convention`) mandates PascalCase for all JSON transport fields and Go struct fields. This creates ambiguity for Go developers — do Go GORM models use `camelCase` or `PascalCase`? | 🟡 Warning |
| I-05 | `spec/01-general-spec/01-foundation/02-error-management-foundation.md` lines 277-287 | **Error code ranges conflict with CLI error code registry.** Foundation spec defines `ERR_1xxx` through `ERR_9xxx` with `ERR_` prefix. CLI tools use numeric ranges without prefix (e.g., GSearch 7000-7099, AI Bridge 9000-9499). No cross-reference explains the relationship between these two systems. | 🟡 Warning |
| I-06 | `spec/01-general-spec/01-foundation/error-resolution/` | **Stale files remain after migration.** Files `00-overview.md`, `01-health-endpoint-mismatch.md`, `02-coding-guidelines-php.md`, `03-debugging-php.md` still exist alongside `MOVED.md`. These should have been deleted after the move to `spec/04-error-resolution/`. | 🟡 Warning |
| I-07 | `spec/01-general-spec/99-meta/03-consistency-report-meta.md` lines 4-5 | **Document count incorrect.** States "Documents Reviewed: 32" and references old flat numbering (documents 30-35) instead of the current hierarchical folder structure. The consistency report itself is inconsistent with the current structure. | 🟡 Warning |
| I-08 | `spec/01-general-spec/00-overview.md` lines 139-148 | **Error code quick reference incomplete.** Shows generic ranges 1xxx-9xxx but doesn't mention the CLI-specific ranges (7000+, 9000+, 10000+, etc.) defined in `spec/03-error-code-registry/`. | 🟠 Minor |
| I-09 | `spec/17-enum-specification/02-required-methods.md` line 9 | **Method count discrepancy.** Overview says "9 mandatory methods" (from memory context) but the checklist in `04-validation-checklist.md` lists 7 methods (String, Label, IsValid, Is{Value}, All, ByIndex, Parse). MarshalJSON/UnmarshalJSON are listed as "Optional" in `02-required-methods.md` line 170 but all remediation audits treat them as mandatory. | 🟡 Warning |
| I-10 | `spec/17-enum-specification/03-folder-structure.md` lines 96-167 | **Enum category listings are outdated.** Shows simplified/incorrect enum lists for each CLI (e.g., BRun has `build_type`, `run_mode`, `log_level`, `profile` but remediation shows 7 different enums: `runtime`, `copy_mode`, `severity`, `package_manager`, `mod_tidy_mode`, `output_format`, `http_method`). | 🟡 Warning |
| I-11 | `spec/01-general-spec/04-advanced/03-database-conventions-advanced.md` lines 304-343 | **PostgreSQL enum style conflicts with Go enum spec.** Database conventions show `CREATE TYPE OrderStatus AS ENUM ('Pending', ...)` with PascalCase values, but Go enum spec mandates `variantStrings` use lowercase (e.g., `"pending"`). No guidance on how SQL enum values map to Go enum strings. | 🟠 Minor |
| I-12 | `spec/01-general-spec/03-quality/03-api-conventions-quality.md` lines 117-135 | **Response envelope uses `camelCase` field names.** Shows `success`, `data`, `error`, `meta` with `camelCase` keys (e.g., `request_id`, `token_type`), but project-wide PascalCase mandate requires `RequestId`, `TokenType`. The Go CLIs use PascalCase in their API responses. | 🟡 Warning |
| I-13 | `spec/01-general-spec/03-quality/01-testing-standards-quality.md` line 1 | **Version date uses 2025.** States "Last Updated: 2025-01-26" while other docs use 2026. Inconsistent year. | 🟠 Minor |

---

## 2. Missing Acceptance Criteria

**All 37 files in Phase 1 lack formal acceptance criteria.** None of the foundation specs, enum spec files, or folder structure guideline contain testable GIVEN/WHEN/THEN acceptance criteria suitable for E2E test generation.

| File | Has AC? | Notes |
|------|---------|-------|
| `spec/00-folder-structure-guideline.md` | ❌ | No validation criteria beyond prose rules |
| `spec/01-general-spec/01-foundation/01-coding-standards-foundation.md` | ❌ | Has examples but no testable criteria |
| `spec/01-general-spec/01-foundation/02-error-management-foundation.md` | ❌ | Has code samples but no criteria |
| `spec/01-general-spec/02-systems/01-logging-system-systems.md` | ❌ | Has format examples but no test criteria |
| `spec/01-general-spec/02-systems/02-configuration-hierarchy-systems.md` | ❌ | Has tier definitions but no criteria |
| `spec/01-general-spec/02-systems/03-conditional-helpers-systems.md` | ❌ | Has usage examples but no criteria |
| `spec/01-general-spec/03-quality/01-testing-standards-quality.md` | ❌ | Defines test patterns but has no self-criteria |
| `spec/01-general-spec/03-quality/02-file-organization-quality.md` | ❌ | Has line limits but no enforcement criteria |
| `spec/01-general-spec/03-quality/03-api-conventions-quality.md` | ❌ | Has response formats but no criteria |
| `spec/01-general-spec/04-advanced/01-security-patterns-advanced.md` | ❌ | Has patterns but no criteria |
| `spec/01-general-spec/04-advanced/02-caching-patterns-advanced.md` | ❌ | No criteria |
| `spec/01-general-spec/04-advanced/03-database-conventions-advanced.md` | ❌ | No criteria |
| `spec/17-enum-specification/*` (5 files) | ❌ | Has checklist but not in GIVEN/WHEN/THEN format |

---

## 3. Detailed Acceptance Criteria

### 3.1 Folder Structure Guideline (`spec/00-folder-structure-guideline.md`)

---

**AC-P1-001: CLI Folder Structure Validation**

GIVEN: A new CLI tool specification folder is created under `spec/` with a numeric prefix (e.g., `spec/18-new-cli/`)

WHEN: The folder structure is validated against the folder structure guideline

THEN:
- The folder MUST contain a `00-overview.md` file at its root
- The folder MUST contain three subdirectories: `01-backend/`, `02-frontend/`, `03-deploy/`
- Each subdirectory MUST contain at least one numbered markdown file (e.g., `01-architecture.md`)
- All files MUST use 2-digit numeric prefix followed by kebab-case name (e.g., `05-error-codes.md`)
- No spaces exist in any file or folder name
- A `99-consistency-report.md` file MAY exist at the root level
- The numeric prefix of the CLI folder MUST fall within the range designated for its category (08-19 for CLI Tools per the numbering table)

EDGE CASES:
- Dual-numbering collision (two different CLIs sharing the same numeric prefix like `14`) MUST be flagged as a structural error and resolved by reassigning one CLI to a different number
- Folders with numbers outside their designated category range MUST be flagged (e.g., a CLI tool at `spec/25-*` which is in the WordPress range)
- Folders missing `00-overview.md` MUST fail validation even if all other required subdirectories exist

---

**AC-P1-002: File Naming Convention Enforcement**

GIVEN: Any markdown file exists under `spec/`

WHEN: The filename is validated against the naming convention

THEN:
- The filename MUST match the pattern `{NN}-{kebab-case-name}.md` where NN is a 2-digit number (00-99)
- The filename MUST be entirely lowercase (no uppercase characters)
- The filename MUST NOT contain spaces, underscores (except in compound technical terms like `ci-cd`), or special characters other than hyphens
- The file MUST include a version header in the first 10 lines containing at minimum: Version, Last Updated (or Updated), and Status fields
- The Last Updated date MUST be in ISO 8601 format (YYYY-MM-DD)

EDGE CASES:
- Files with single-digit prefix (e.g., `1-architecture.md` instead of `01-architecture.md`) MUST fail validation
- Files with no numeric prefix (e.g., `architecture.md`) MUST fail validation unless they are special files (`MOVED.md`, `README.md`, `CHANGELOG.md`)
- Files with prefix `00` MUST be overview/index files

---

### 3.2 Coding Standards (`spec/01-general-spec/01-foundation/01-coding-standards-foundation.md`)

---

**AC-P1-003: 15-Line Function Rule Enforcement**

GIVEN: A source code file (PHP, TypeScript, Go, or Python) is submitted for code review

WHEN: A static analysis tool counts the lines of logic in each function (excluding blank lines, comments, closing braces/brackets, and type annotations)

THEN:
- Every function/method MUST have ≤15 lines of logic
- Functions exceeding 15 lines MUST be flagged as a violation with the exact line count reported
- The violation report MUST include: function name, file path, line number of function start, actual line count, and a recommendation to split into smaller functions
- Functions that exceed 15 lines but consist entirely of a single `switch`/`match` statement with ≤1 line per case ARE exempt from this rule (documented exception for exhaustive enum switches)

EDGE CASES:
- Anonymous functions/closures count as separate functions for line-counting purposes
- Struct/class field declarations do not count as function lines
- A function containing only a single multi-line SQL query string spanning 20 lines MUST still be flagged (the query should be extracted to a constant or separate method)

---

**AC-P1-004: Boolean Naming Convention Enforcement**

GIVEN: A source code file contains boolean variable declarations, struct/class fields, or function parameters

WHEN: A static analysis tool or code reviewer validates boolean naming

THEN:
- Every boolean variable, field, or parameter MUST be prefixed with one of: `is`, `has`, `can`, `should`, `was`
- Variables named without these prefixes (e.g., `active`, `deleted`, `permissions`, `enabled`) MUST be flagged as violations
- The flag MUST include the current name and a suggested correction (e.g., `active` → `isActive`)
- Go struct fields that are boolean MUST use the `Is`/`Has`/`Can`/`Should`/`Was` prefix in PascalCase (e.g., `IsActive`, `HasPermissions`)

EDGE CASES:
- Boolean function return values (e.g., `func isValid() bool`) follow the same naming rule via the function name
- Boolean constants (e.g., `const DEBUG_MODE = true`) are exempt from the prefix rule since constants use `SCREAMING_SNAKE_CASE`
- Map values of type `bool` (e.g., `features["darkMode"]`) are exempt since the key describes the feature, not a boolean state

---

**AC-P1-005: No Negation Operator Rule**

GIVEN: A source code file contains conditional logic

WHEN: The code is reviewed for negation operator usage

THEN:
- The `!` operator (or `not` in Python) MUST NOT appear in conditional expressions
- All negation MUST use positive helper functions: `isNull()`, `isDefined()`, `isEmpty()`, `hasContent()`, `isFalse()`, `excludes()`, etc.
- Each violation MUST be reported with: file path, line number, the offending expression, and the suggested replacement using the appropriate helper function
- The project MUST provide a `BooleanHelpers` class/module in each language (PHP, TypeScript, Python, Go) that implements all required helper functions

EDGE CASES:
- The `!` operator inside helper function implementations themselves IS allowed (since the helpers encapsulate negation)
- Third-party library code is exempt
- Template literals and JSX expressions that use `!` for conditional rendering (e.g., `{!isLoading && <Content />}`) MUST use `isFalse(isLoading)` instead

---

### 3.3 Error Management (`spec/01-general-spec/01-foundation/02-error-management-foundation.md`)

---

**AC-P1-006: Exception Auto-Logging on Construction**

GIVEN: A custom exception class extends `BaseException` in any language (PHP, TypeScript, Python, Go)

WHEN: An instance of the exception is constructed with a message, error code, and context

THEN:
- The constructor MUST automatically invoke a logging method before completing construction
- The log entry MUST be written to the error log file (`error.log`) at ERROR level
- The log entry MUST contain all of: error code, message, context dictionary/map, file path where the exception originated, line number, and a stack trace
- If a previous/cause exception is provided, its message MUST also appear in the log entry under a "Previous" or "Cause" field
- The exception MUST expose a `toArray()`/`toJSON()`/`to_dict()` method that returns a structured object with fields: `error` (boolean, always `true`), `code` (string), `message` (string), `context` (object)
- The structured output MUST NOT include the stack trace (to avoid leaking internals to API consumers)

EDGE CASES:
- If the logging subsystem itself throws an error during auto-logging, the original exception MUST still propagate (logging failure must not mask the original error)
- If the exception is constructed in a test environment, auto-logging MAY be suppressed via a global flag or dependency injection to avoid polluting test output
- Nested exception chains of 3+ levels MUST preserve the entire chain in the log, not just the immediate cause

---

**AC-P1-007: Error Code Range Compliance**

GIVEN: A new error is defined in any codebase (PHP, TypeScript, Go)

WHEN: An error code is assigned

THEN:
- For **general-spec applications** (PHP/TypeScript frontend): the code MUST follow the pattern `ERR_{NXXX}` where N is the category digit (1=Validation, 2=Auth, 3=Database, 4=External, 5=Business, 9=System) and XXX is a sequential number
- For **Go CLI applications**: the code MUST be a plain integer within the CLI's allocated range (e.g., 7000-7099 for GSearch, 9000-9499 for AI Bridge) as defined in `spec/03-error-code-registry/`
- No two distinct errors within the same codebase MAY share the same error code
- The error code registry (`spec/03-error-code-registry/01-registry.md`) MUST be updated whenever a new range is allocated
- The relationship between the `ERR_NXXX` pattern (general spec) and the numeric-only pattern (CLI tools) MUST be documented in both `spec/01-general-spec/01-foundation/02-error-management-foundation.md` and `spec/03-error-code-registry/`

EDGE CASES:
- WordPress plugins using PHP follow the `ERR_NXXX` pattern from the general spec, NOT the CLI numeric pattern
- If a CLI tool needs more than 100 error codes in its primary range, it MUST request a secondary range from the registry (documented and non-overlapping)
- Error codes from deprecated features MUST NOT be reused; they should be marked as "retired" in the registry

---

### 3.4 Logging System (`spec/01-general-spec/02-systems/01-logging-system-systems.md`)

---

**AC-P1-008: Dual-File Logging Strategy**

GIVEN: An application is running in production mode with the logging system initialized

WHEN: Various log events occur at different severity levels

THEN:
- DEBUG-level messages MUST only be written in development mode (`APP_ENV=development`) and MUST NOT appear in production logs
- INFO and WARNING messages MUST be written to the general log file (`app.log`) ONLY
- ERROR messages MUST be written to BOTH the general log file (`app.log`) AND the error log file (`error.log`)
- CRITICAL messages MUST be written to both log files AND trigger an alert notification (via the `sendAlert()` integration)
- Each log entry in `app.log` MUST follow the format: `[TIMESTAMP] LEVEL [REQUEST_ID] MESSAGE | CONTEXT_JSON`
- Each entry in `error.log` MUST include: timestamp, ERROR level, request ID, message, serialized context, file path, line number, stack trace, and previous error message if available, terminated by a `---` separator line
- The request ID MUST be consistent across all log entries within the same HTTP request or CLI command execution

EDGE CASES:
- If both `app.log` and `error.log` reach their maximum size simultaneously, both MUST be rotated independently without data loss
- If the log directory does not exist at startup, the logger MUST create it with permissions `0755` before writing
- If file write fails (e.g., disk full), the logger MUST NOT throw an exception that crashes the application; it SHOULD fall back to stderr

---

**AC-P1-009: Log Rotation**

GIVEN: A log file (`app.log` or `error.log`) exists and is actively receiving writes

WHEN: The log file size exceeds the maximum configured size (default: 10MB)

THEN:
- The log file MUST be compressed using gzip (level 9) and moved to an `archive/` subdirectory within the logs folder
- The archived file MUST be named with the pattern `{original_name}.{YYYY-MM-DD-HHmmss}.gz`
- After archiving, the original log file MUST be truncated to empty (0 bytes), not deleted and recreated
- If the archive directory does not exist, it MUST be created automatically with permissions `0755`
- Archive files older than 30 days (configurable via `MAX_AGE`) MUST be automatically deleted
- If the number of archive files exceeds 10 (configurable via `MAX_ARCHIVES`), the oldest archives MUST be deleted

EDGE CASES:
- If gzip compression fails, the original uncompressed file MUST be preserved (no data loss)
- Concurrent writes during rotation MUST be handled safely (file locking via `LOCK_EX` or equivalent)
- If the archive directory is on a different filesystem, the archive operation MUST use copy-then-delete instead of rename

---

### 3.5 Configuration Hierarchy (`spec/01-general-spec/02-systems/02-configuration-hierarchy-systems.md`)

---

**AC-P1-010: Three-Tier Configuration Resolution**

GIVEN: An application has the following configuration sources:
- Tier 1 (Database): A `settings` table with key-value pairs
- Tier 2 (Config File): A `config/defaults.json` file with nested keys
- Tier 3 (Code Constants): A `Consts` class/module with hardcoded defaults

WHEN: `Settings.get("max_upload_size")` is called

THEN:
- The system MUST first check the `settings` table for a row where `setting_key = "max_upload_size"`
- If a database value exists, it MUST be returned immediately without checking lower tiers
- If no database value exists, the system MUST check `config/defaults.json` for the key `"max_upload_size"` (supporting dot-notation traversal for nested keys)
- If no config file value exists, the system MUST check the `Consts` class for a matching constant (converting dot-notation to `SCREAMING_SNAKE_CASE`, e.g., `"upload.max_size"` → `MAX_UPLOAD_SIZE`)
- If no value is found in any tier, the system MUST return the provided fallback value (or `null`/`nil` if no fallback was given)
- Database values MUST be cached in memory for the duration of the request to avoid repeated queries
- After `Settings.set("max_upload_size", newValue)` is called, the in-memory cache for that key MUST be invalidated so subsequent `get()` calls return the new value

EDGE CASES:
- If the database is unavailable (connection error), the system MUST gracefully fall through to Tier 2 and Tier 3 without crashing, and SHOULD log a warning
- If the config file is missing or contains invalid JSON, the system MUST treat Tier 2 as empty and fall through to Tier 3
- Setting a database value to `null` explicitly MUST be distinguishable from "no database value exists" — an explicit null should return null, not fall through to lower tiers

---

### 3.6 Conditional Helpers (`spec/01-general-spec/02-systems/03-conditional-helpers-systems.md`)

---

**AC-P1-011: execIf Conditional Execution**

GIVEN: The `ConditionalHelpers` module is available with the `execIf` function

WHEN: `execIf(condition, callback, ...args)` is called

THEN:
- If `condition` is `true`, the `callback` MUST be invoked with the provided `...args` and its return value MUST be returned
- If `condition` is `false`, the callback MUST NOT be invoked and `null`/`nil`/`None` MUST be returned
- The function MUST be type-safe: the return type should be `T | null` where `T` is the callback's return type
- The `execIfElse(condition, ifTrue, ifFalse, ...args)` variant MUST invoke `ifTrue` when condition is true and `ifFalse` when condition is false, never both
- The `execUnless(condition, callback, ...args)` variant MUST behave as `execIf(!condition, callback, ...args)`

EDGE CASES:
- If the callback throws an exception, the exception MUST propagate normally (not be caught by `execIf`)
- If `condition` is a truthy/falsy value rather than strict boolean (e.g., `0`, `""`, `undefined`), behavior depends on language: PHP and Python use truthiness, TypeScript version MUST accept only `boolean` type parameter
- `execIfAsync` (TypeScript) MUST properly await the callback and return `Promise<T | null>`

---

### 3.7 Testing Standards (`spec/01-general-spec/03-quality/01-testing-standards-quality.md`)

---

**AC-P1-012: Test Pyramid Coverage Distribution**

GIVEN: A project's test suite has been executed with coverage reporting enabled

WHEN: The test distribution is analyzed

THEN:
- Unit tests MUST comprise at least 60% of the total test count
- Integration tests MUST comprise approximately 30% of the total test count
- E2E tests MUST comprise no more than 10% of the total test count
- Individual unit test execution time MUST be under 10ms
- Individual integration test execution time MUST be under 500ms
- Individual E2E test execution time MUST be under 30 seconds
- Overall coverage MUST meet minimum thresholds: 80% line, 75% branch, 85% function
- Critical paths (authentication, payment, data mutations, security checks) MUST have 100% coverage

EDGE CASES:
- A project with fewer than 10 total tests MAY have skewed distribution percentages but MUST still meet the minimum coverage thresholds
- If a critical path function has 100% line coverage but <100% branch coverage (e.g., missing error path), it MUST be flagged as incomplete
- Test files themselves are excluded from coverage metrics

---

**AC-P1-013: Test Naming Convention**

GIVEN: A test file is created for a service or component

WHEN: Test methods/functions are named

THEN:
- Test file MUST be named `{ClassName}Test.{ext}` (PHP), `{ClassName}.test.{ext}` (TypeScript), or `test_{module_name}.py` (Python)
- Each test method MUST follow the pattern `test_{action}_{scenario}_{expectedResult}` (PHP/Python) or be a descriptive string in `it('description')` (TypeScript/Vitest/Jest)
- Every test MUST follow the Arrange-Act-Assert (AAA) pattern with clear visual separation (comments or blank lines between sections)
- Fixture files MUST be named `{entity}.json` or `{entity}.fixture.ts`
- Mock classes MUST be named `Mock{ClassName}` and MUST implement the same interface as the real class

EDGE CASES:
- Parameterized/data-driven tests MAY have a single test method with multiple data sets but each data set MUST be identifiable in the test output
- Snapshot tests (if used) MUST have `.snap` extension and MUST be committed to version control
- Tests that test error conditions MUST set up the assertion/expectation BEFORE the act step (for exception tests)

---

### 3.8 API Conventions (`spec/01-general-spec/03-quality/03-api-conventions-quality.md`)

---

**AC-P1-014: Standard Response Envelope**

GIVEN: Any REST API endpoint is called

WHEN: The server returns a response (success or error)

THEN:
- The response body MUST be valid JSON
- The response MUST contain exactly these top-level fields: `Success` (boolean), `Data` (object/array/null), `Error` (object/null)
- For success responses: `Success` MUST be `true`, `Data` MUST contain the resource(s), `Error` MUST be `null`
- For error responses: `Success` MUST be `false`, `Data` MUST be `null`, `Error` MUST contain at minimum `Code` (string) and `Message` (string)
- A `Meta` field MAY be included containing `RequestId` (string, UUID format), `Timestamp` (ISO 8601), and for collections: `Pagination` with `Page`, `PerPage`, `Total`, `TotalPages`, `HasNext`, `HasPrev`
- For **Go CLI APIs**: all JSON field names MUST use PascalCase (e.g., `Success`, `Data`, `Error`, `RequestId`)
- For **PHP/TypeScript general apps**: field names use the convention specified by the framework (typically `camelCase`), but the project-wide standard mandates PascalCase for Go ecosystems

EDGE CASES:
- `204 No Content` responses MUST NOT have a response body (no envelope)
- `201 Created` responses MUST include the full created resource in `Data`
- Streaming responses (SSE/WebSocket) are exempt from the envelope requirement
- Binary responses (file downloads) are exempt from the envelope requirement

---

**AC-P1-015: Pagination Compliance**

GIVEN: An API endpoint returns a collection of resources

WHEN: The collection contains more items than the default page size (20)

THEN:
- The response MUST include pagination metadata in `Meta.Pagination`
- Offset-based pagination MUST support `page` and `per_page` query parameters
- `per_page` MUST be capped at a maximum value (default: 100) — requests exceeding this MUST be silently capped, not rejected
- The pagination object MUST include: `Page` (current page number), `PerPage` (items per page), `Total` (total item count), `TotalPages` (calculated), `HasNext` (boolean), `HasPrev` (boolean)
- A `Links` object MAY include `First`, `Prev`, `Next`, `Last` with full URL paths
- Cursor-based pagination (for large/real-time datasets) MUST support `cursor` and `limit` parameters, returning `HasMore` (boolean) and `NextCursor` (string)

EDGE CASES:
- Page 0 or negative page numbers MUST be treated as page 1
- `per_page=0` MUST be treated as the default page size (20), not as "return all"
- Requesting a page beyond `TotalPages` MUST return an empty `Data` array with correct pagination metadata (not a 404)
- If the total count is expensive to compute, `Total` and `TotalPages` MAY be omitted but `HasNext` MUST still be present

---

### 3.9 Security Patterns (`spec/01-general-spec/04-advanced/01-security-patterns-advanced.md`)

---

**AC-P1-016: Password Hashing Requirements**

GIVEN: A user registration or password change operation is performed

WHEN: The password is stored in the database

THEN:
- The password MUST be hashed using Argon2id (preferred) or bcrypt with cost ≥ 12 (acceptable)
- MD5, SHA1, SHA256 (alone), or any non-salted hashing algorithm MUST NOT be used
- The hashed password MUST include an embedded salt (Argon2id and bcrypt do this automatically)
- Argon2id MUST be configured with at minimum: `memory_cost` = 65536 (64MB), `time_cost` = 4, `threads` = 3
- A `needsRehash()` check MUST be performed on every successful login — if the stored hash uses outdated parameters, it MUST be transparently re-hashed with current parameters
- The raw password MUST NOT appear in any log output, error message, or API response at any point

EDGE CASES:
- If Argon2id is not available in the runtime environment, the system MUST fall back to bcrypt with cost 12 and log a warning
- Passwords exceeding 128 characters MUST be rejected at validation time (before hashing) to prevent denial-of-service via expensive hashing
- Empty string passwords MUST be rejected at validation time, not during hashing

---

**AC-P1-017: Input Validation — Never Trust User Input**

GIVEN: Any user input is received via API request body, query parameters, URL parameters, or form submission

WHEN: The input is processed by the server

THEN:
- All input MUST be validated on the server side, regardless of client-side validation
- Validation MUST check type, length, format, and range for every field
- String inputs MUST have maximum length constraints enforced
- Email fields MUST be validated against RFC 5322 format
- Numeric inputs MUST be validated for range (min/max)
- Validation errors MUST return HTTP 400 with the standard error envelope containing field-specific error messages in `Error.Details` as a map of field name → array of error strings
- SQL queries MUST use parameterized queries / prepared statements — string concatenation for SQL construction is FORBIDDEN
- HTML output MUST use context-aware encoding (HTML entities for HTML context, URL encoding for URL context, JSON encoding for JavaScript context)

EDGE CASES:
- Null bytes (`\0`) in string input MUST be stripped or rejected
- Unicode homoglyph attacks (e.g., Cyrillic "а" vs Latin "a" in emails) SHOULD be detected and flagged
- Extremely long input (>1MB) MUST be rejected at the middleware level before reaching validation logic
- File upload filenames MUST be sanitized (no path traversal characters like `../`)

---

### 3.10 Database Conventions (`spec/01-general-spec/04-advanced/03-database-conventions-advanced.md`)

---

**AC-P1-018: Table and Column Naming**

GIVEN: A new database table or column is created in any database (PostgreSQL, MySQL, SQLite)

WHEN: The DDL statement is validated

THEN:
- Table names MUST be singular and PascalCase (e.g., `User`, `OrderItem`, `ExamParticipant`)
- Column names MUST be PascalCase (e.g., `CreatedAt`, `UserId`, `IsActive`)
- Primary key columns MUST be named `Id`
- Foreign key columns MUST follow the pattern `{ReferencedTable}Id` (e.g., `UserId`, `OrderId`)
- Boolean columns MUST use `Is`/`Has`/`Can` prefix (e.g., `IsActive`, `HasVerified`)
- Timestamp columns MUST use `At` suffix (e.g., `CreatedAt`, `UpdatedAt`, `DeletedAt`)
- Every table MUST have `Id`, `CreatedAt`, and `UpdatedAt` columns at minimum
- Index names MUST follow `IX_{Table}_{Column(s)}` format; unique constraints MUST follow `UQ_{Table}_{Column(s)}`; foreign keys MUST follow `FK_{Table}_{ReferencedTable}`

EDGE CASES:
- Join tables (many-to-many) MUST be named as the combination of both tables in PascalCase (e.g., `UserRole`, not `user_roles` or `UserRoleMapping`)
- Tables with soft deletes MUST have a nullable `DeletedAt` column (null = not deleted)
- If a table has a composite primary key, each component column still follows the naming rules but the constraint is named `PK_{Table}_{Col1}_{Col2}`

---

### 3.11 Enum Specification (`spec/17-enum-specification/`)

---

**AC-P1-019: Enum Declaration Compliance**

GIVEN: A new Go enum is created for any CLI tool in the ecosystem

WHEN: The enum file is validated against the enum specification

THEN:
- The enum MUST be declared as `type Variant byte` (not `string`, not `int`)
- The first constant MUST be `Unknown Variant = iota` (the zero value)
- All subsequent constants MUST use `iota` implicitly (no explicit integer assignments)
- All constant names MUST be PascalCase
- Each constant MUST have a Go doc comment explaining its purpose
- The enum file MUST be located at `internal/enums/{category}/variant.go` where `{category}` is `snake_case`
- Two unexported lookup arrays MUST exist: `variantStrings` (lowercase string representations) and `variantLabels` (human-readable labels), both using array literal syntax (`[...]string{}`), not slice syntax (`[]string{}`)

EDGE CASES:
- An enum with only 1 valid variant (plus Unknown) is valid but unusual and SHOULD include a comment explaining why
- Enum packages MUST NOT import other enum packages (no circular dependencies between enums)
- If a variant name is an acronym (e.g., `API`, `URL`), it MUST follow PascalCase with title-case acronyms (e.g., `Api`, `Url`) per the project-wide naming convention

---

**AC-P1-020: Enum Required Methods Compliance**

GIVEN: A Go enum exists at `internal/enums/{category}/variant.go`

WHEN: The file is audited for method completeness

THEN:
- `String() string` MUST return `variantStrings[Unknown]` for invalid values and `variantStrings[v]` for valid ones
- `Label() string` MUST return `variantLabels[Unknown]` for invalid values and `variantLabels[v]` for valid ones
- `IsValid() bool` MUST return `v > Unknown && v < Variant(len(variantStrings))`
- One `Is{Value}() bool` method MUST exist for EVERY constant including `IsUnknown()`
- `All() []Variant` MUST return a slice of all valid variants EXCLUDING `Unknown`
- `ByIndex(i int) Variant` MUST return `Unknown` for negative indices or indices ≥ `len(variantStrings)`
- `Parse(s string) (Variant, error)` MUST perform case-insensitive matching after `strings.ToLower(strings.TrimSpace(s))` and return `(Unknown, error)` for unrecognized strings
- `MarshalJSON() ([]byte, error)` MUST delegate to `json.Marshal(v.String())`
- `UnmarshalJSON(data []byte) error` MUST unmarshal the string and delegate to `Parse()`
- `Values() []string` MUST return all string values excluding "unknown"
- The total required method count is **9 categories** (String, Label, IsValid, Is{Value} per variant, All, ByIndex, Parse, MarshalJSON, UnmarshalJSON) — however the Is{Value} methods scale with variant count

EDGE CASES:
- `Parse("")` (empty string) MUST return `(Unknown, error)` — not silently default to the first valid variant
- `Parse("unknown")` MUST return `(Unknown, nil)` — parsing the string "unknown" is valid and returns the Unknown variant without error
- `ByIndex(0)` MUST return `Unknown` (the zero value), which is a valid return but `Unknown.IsValid()` MUST return `false`

---

**AC-P1-021: Enum Audit Scoring**

GIVEN: A CLI tool's codebase is audited using the validation checklist

WHEN: Each check item is evaluated

THEN:
- The audit MUST produce a score out of 50 points distributed as: Structure (10), Declaration (10), Required Methods (14), Lookup Tables (6), No Hardcoded Strings (10)
- A score of 45-50 is "Compliant" — no action needed
- A score of 35-44 is "Partial" — fix missing methods
- A score of 25-34 is "Needs Work" — refactor required
- A score of 0-24 is "Non-Compliant" — full rewrite needed
- The audit report MUST be saved at `.lovable/audits/{cli-name}-enum-compliance-audit-{date}.md`
- After remediation, the CLI's score in the enum specification overview (`spec/17-enum-specification/00-overview.md`) MUST be updated to reflect the new score

EDGE CASES:
- A CLI with zero enums (no type-differentiating fields whatsoever) scores 50/50 by default — the checklist only applies to codebases that HAVE values that should be enums
- A CLI that has all enums compliant but uses hardcoded strings in test files MAY receive a partial deduction under "No Hardcoded Strings" only if the test strings bypass the enum Parse() function

---

### 3.12 Caching Patterns (`spec/01-general-spec/04-advanced/02-caching-patterns-advanced.md`)

---

**AC-P1-022: Cache Key Format Compliance**

GIVEN: Any value is stored in a cache (in-memory, Redis, or file-based)

WHEN: The cache key is generated

THEN:
- The key MUST follow the format `{prefix}:{version}:{entity}:{identifier}:{variant}` (e.g., `app:v1:user:123:profile`)
- The `prefix` defaults to `app` if not specified
- The `version` defaults to `v1` if not specified
- Multi-word variant keys MUST be sorted alphabetically to ensure cache hits for equivalent queries (e.g., `include:posts,sort:name` not `sort:name,include:posts`)
- Tag-based invalidation MUST be supported: every cached item MAY be associated with one or more tags, and `deleteByTag(tag)` MUST delete ALL items associated with that tag
- TTL MUST default to 3600 seconds (1 hour) if not explicitly specified

EDGE CASES:
- Cache keys containing user-generated content MUST be sanitized (no colons or special characters in the identifier portion) — use URL encoding or hashing
- `getOrSet()` MUST be atomic or use a mutex/lock to prevent thundering herd (multiple simultaneous cache misses triggering parallel fetches for the same key)
- Setting a cache value to `null` explicitly MUST be distinguishable from a cache miss (use a sentinel value or wrapper object)

---

### 3.13 File Organization (`spec/01-general-spec/03-quality/02-file-organization-quality.md`)

---

**AC-P1-023: File Size Limits**

GIVEN: A source code file exists in the project

WHEN: the file is evaluated during code review or CI

THEN:
- Component files (React `.tsx`) MUST NOT exceed 250 lines (hard limit); files exceeding 150 lines (soft limit) SHOULD be flagged for review
- Service files MUST NOT exceed 300 lines (hard limit); files exceeding 200 lines SHOULD be flagged
- Utility files MUST NOT exceed 150 lines (hard limit); files exceeding 100 lines SHOULD be flagged
- Type definition files MUST NOT exceed 200 lines (hard limit)
- Test files MUST NOT exceed 500 lines (hard limit); files exceeding 300 lines SHOULD be flagged
- Files exceeding hard limits MUST be rejected in CI with a message indicating the file, line count, limit, and a recommendation to split

EDGE CASES:
- Auto-generated files (e.g., GraphQL types, Prisma client) are exempt from line limits
- Files that consist primarily of constants/configuration (e.g., a large enum mapping) MAY exceed the limit with a justification comment at the top
- Markdown specification files in `spec/` are exempt from line limits (they are documentation, not code)

---

## 4. Remediation Recommendations

| # | Recommendation | Priority | Affected Files |
|---|----------------|----------|----------------|
| R-01 | **Update enum spec overview table** to reflect all 9 CLIs at 50/50 compliance | 🔴 Critical | `spec/17-enum-specification/00-overview.md` |
| R-02 | **Update folder structure guideline** to include all current CLI folders (15-spec-reverse, 21-wp-seo-publish, 16-ai-transcribe, 60-ai-research) and resolve the `spec/14` numbering collision | 🔴 Critical | `spec/00-folder-structure-guideline.md` |
| R-03 | **Update numbering range table** to reflect actual folder assignments | 🔴 Critical | `spec/00-folder-structure-guideline.md` |
| R-04 | **Add cross-reference** between general-spec error code system (`ERR_NXXX`) and CLI error code registry (numeric ranges) explaining how they coexist | 🟡 Warning | `spec/01-general-spec/01-foundation/02-error-management-foundation.md`, `spec/03-error-code-registry/` |
| R-05 | **Delete stale files** in `spec/01-general-spec/01-foundation/error-resolution/` (keep only `MOVED.md` or delete the entire subfolder) | 🟡 Warning | `spec/01-general-spec/01-foundation/error-resolution/00-overview.md`, `01-health-endpoint-mismatch.md`, `02-coding-guidelines-php.md`, `03-debugging-php.md` |
| R-06 | **Clarify ORM property naming** — add a note to coding standards that Go structs use PascalCase (project convention) while PHP/TypeScript ORM properties MAY use camelCase per framework convention | 🟡 Warning | `spec/01-general-spec/01-foundation/01-coding-standards-foundation.md` |
| R-07 | **Update consistency report** to use current folder-based structure instead of flat document numbering | 🟡 Warning | `spec/01-general-spec/99-meta/03-consistency-report-meta.md` |
| R-08 | **Standardize MarshalJSON/UnmarshalJSON as mandatory** in the enum spec required methods document (not optional), since all CLIs implement them | 🟡 Warning | `spec/17-enum-specification/02-required-methods.md` |
| R-09 | **Update enum folder structure** enum category listings to match actual remediated enum sets | 🟡 Warning | `spec/17-enum-specification/03-folder-structure.md` |
| R-10 | **Clarify API response field casing** — add explicit note that Go CLI APIs use PascalCase JSON keys per project convention, while the general spec examples show framework-default casing | 🟡 Warning | `spec/01-general-spec/03-quality/03-api-conventions-quality.md` |
| R-11 | **Fix version date** from 2025 to 2026 in testing standards | 🟠 Minor | `spec/01-general-spec/03-quality/01-testing-standards-quality.md` |
| R-12 | **Add SQL-to-Go enum mapping guidance** explaining how PostgreSQL enum values relate to Go `variantStrings` | 🟠 Minor | `spec/01-general-spec/04-advanced/03-database-conventions-advanced.md` |

---

## 5. Remaining Phases

| Phase | Folder(s) | Status |
|-------|-----------|--------|
| ~~**Phase 1**~~ | ~~Foundation, Enum Spec, Folder Structure~~ | ✅ **Complete** |
| **Phase 2** | Error Resolution, Error Code Registry | ⏳ Pending |
| **Phase 3** | Split DB, Seedable Config | ⏳ Pending |
| **Phase 4** | Shared CLI Frontend | ⏳ Pending |
| **Phase 5** | PowerShell Integration v1/v2 | ⏳ Pending |
| **Phase 6** | Spec Management Core | ⏳ Pending |
| **Phase 7** | SM Features Part 1 (01-15) | ⏳ Pending |
| **Phase 8** | SM Features Part 2 (16-30) | ⏳ Pending |
| **Phase 9** | GSearch Core (00-23) | ⏳ Pending |
| **Phase 10** | GSearch BI Suite (40-60) | ⏳ Pending |
| **Phase 11** | BRun CLI | ⏳ Pending |
| **Phase 12** | AI Bridge Core (00-14) | ⏳ Pending |
| **Phase 13** | AI Bridge SEO (15-30) | ⏳ Pending |
| **Phase 14** | AI Bridge Advanced (31-55) | ⏳ Pending |
| **Phase 15** | Nexus Flow CLI | ⏳ Pending |
| **Phase 16** | WP Plugins, Builder, SEO Pub, Spec Rev | ⏳ Pending |
| **Phase 17** | AI Transcribe, AI Research | ⏳ Pending |

---

*Phase 1 audit completed. 13 inconsistencies found, 23 acceptance criteria written, 12 remediation recommendations issued.*
