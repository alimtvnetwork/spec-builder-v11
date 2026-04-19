# Phase 2: Error Resolution & Error Code Registry Audit

**Date:** 2026-02-06  
**Auditor:** AI  
**Scope:** `spec/04-error-resolution/`, `spec/03-error-code-registry/`  
**Files Reviewed:** 12  
**Status:** Complete

---

## 1. Inconsistency Report

| # | File(s) | Description | Severity |
|---|---------|-------------|----------|
| I-01 | `spec/03-error-code-registry/00-overview.md` lines 38-45 vs `01-registry.md` lines 10-27 | **Dual error code format systems.** The overview defines the format `[PROJECT]-[CATEGORY]-[NUMBER]` (e.g., `SM-500-01`) with category offsets +000 through +900. But the registry (`01-registry.md`) also lists CLI tools with flat numeric ranges (7000-7099, 9000-9499) that do NOT follow the `XX-NNN-NN` format. The overview claims `CLI` prefix covers range 4000-4999 but that range is marked "⚠️ Deprecated" in the registry while GSearch uses 7000+. No document reconciles these two systems. | 🔴 Critical |
| I-02 | `spec/03-error-code-registry/01-registry.md` line 25 | **Incorrect spec location for Spec Reverse CLI.** Registry shows `SRC` prefix at range 11000-11999 with location `spec/12-spec-reverse-cli/` but the actual folder is `spec/25-spec-reverse-cli/`. | 🔴 Critical |
| I-03 | `spec/03-error-code-registry/01-registry.md` line 26 | **Incorrect spec location for WP SEO Publish.** Registry shows location `spec/14-wp-seo-publish/` but actual folder is `spec/14-wp-seo-publish-cli/`. | 🟡 Warning |
| I-04 | `spec/03-error-code-registry/01-registry.md` lines 49-63 | **AI Bridge extended range conflicts.** The "AI Bridge Error Code Details" table shows range 9600-9999 as "Reserved — Future expansion" but `spec/22-ai-bridge-cli/01-backend/05-error-codes.md` actively uses codes 9600-9849 (confirmed in remediation audits for code pattern learning 9850-9869, research mode 9848-9849, vector DB 9990-9999, long-chain 9970-9989, HTML blog 9720-9729). The registry is significantly out of date. | 🔴 Critical |
| I-05 | `spec/04-error-resolution/00-overview.md` lines 56-64 | **Response envelope uses `camelCase` field names.** Shows `"success": true, "data": {...}` with lowercase keys, but the project-wide PascalCase mandate (and Go CLI implementations) use `"Success": true, "Data": {...}`. This contradicts both the Phase 1 findings and Go debugging guide patterns. | 🟡 Warning |
| I-06 | `spec/03-error-code-registry/schemas/error-code.schema.json` line 9 | **Schema pattern doesn't match CLI error codes.** The JSON schema enforces `^[A-Z]{2,4}-[0-9]{3}-[0-9]{2}$` but CLI tools use flat integers (7001, 9301). The schema cannot validate CLI error codes at all. | 🟡 Warning |
| I-07 | `spec/04-error-resolution/05-debugging-cheat-sheet.md` lines 267-279 | **Error code ranges incomplete.** The cheat sheet lists ranges for 10 CLIs but omits the recently added ranges: AI Bridge extended (9600-9999), GSearch BI Suite (7700-7839), GSearch YouTube/settings (7606-7609). | 🟠 Minor |
| I-08 | `spec/03-error-code-registry/01-registry.md` lines 14-15 | **Link Manager location incorrect.** Shows `spec/link-manager/` but actual location is `spec/30-wp-plugin/link-manager/`. | 🟠 Minor |
| I-09 | `spec/04-error-resolution/04-cross-reference-diagram.md` lines 149-153 | **Stale spec references.** Lists `06-powershell-integration-v1` as "Deprecated" and `12-spec-management-software` as "Empty/duplicate folder" without verification. | 🟠 Minor |
| I-10 | `spec/03-error-code-registry/00-overview.md` line 44 | **PowerShell range mismatch.** Overview says `PS` prefix uses range 9500-9599, but registry line 22 confirms this. However, the overview's "Reserved Project Prefixes" table (line 38-45) only shows ranges up to 4999, while all CLI tools use 7000+. The table is misleading. | 🟡 Warning |
| I-11 | `spec/04-error-resolution/03-debugging-guides/02-debugging-go.md` lines 137-142 | **Response struct uses `camelCase` JSON tags.** Shows `json:"success"`, `json:"data"`, `json:"error"` but project standard mandates PascalCase JSON transport (`"Success"`, `"Data"`, `"Error"`). | 🟡 Warning |

---

## 2. Missing Acceptance Criteria

All 12 files in Phase 2 lack formal GIVEN/WHEN/THEN acceptance criteria.

| File | Has AC? |
|------|---------|
| `spec/04-error-resolution/00-overview.md` | ❌ |
| `spec/04-error-resolution/01-retrospectives/01-health-endpoint-mismatch.md` | ❌ |
| `spec/04-error-resolution/02-verification-patterns/01-frontend-backend-sync.md` | ❌ |
| `spec/04-error-resolution/03-debugging-guides/01-debugging-php.md` | ❌ |
| `spec/04-error-resolution/03-debugging-guides/02-debugging-go.md` | ❌ |
| `spec/04-error-resolution/03-debugging-guides/03-debugging-typescript.md` | ❌ |
| `spec/04-error-resolution/04-cross-reference-diagram.md` | ❌ |
| `spec/04-error-resolution/05-debugging-cheat-sheet.md` | ❌ |
| `spec/03-error-code-registry/00-overview.md` | ❌ |
| `spec/03-error-code-registry/01-registry.md` | ❌ |
| `spec/03-error-code-registry/02-integration-guide.md` | ❌ |
| `spec/03-error-code-registry/schemas/error-code.schema.json` | ❌ |

---

## 3. Detailed Acceptance Criteria

### 3.1 Frontend-Backend Sync Verification

---

**AC-P2-001: Health Endpoint Response Format Compliance**

GIVEN: A Go CLI backend (GSearch, BRun, AI Bridge, or Nexus Flow) is running and has registered a health endpoint at `/api/v1/health`

WHEN: An HTTP GET request is sent to `http://{host}:{port}/api/v1/health` with no authentication headers

THEN:
- The response HTTP status code MUST be `200 OK` when the backend is healthy, or `503 Service Unavailable` when degraded
- The response `Content-Type` header MUST be `application/json`
- The response body MUST conform to the standard envelope: `{"Success": true, "Data": {"Status": "ok", "Timestamp": "<ISO8601>", "Version": "<semver>"}}`
- The `Data.Status` field MUST be exactly `"ok"` (not `"healthy"`, `"running"`, or any other variant)
- The `Data.Timestamp` field MUST be in RFC3339 format (e.g., `2026-02-06T12:00:00Z`)
- The `Data.Version` field MUST match the CLI binary's compiled version string
- CORS headers `Access-Control-Allow-Origin`, `Access-Control-Allow-Methods`, and `Access-Control-Allow-Headers` MUST be present if the backend serves a separate frontend origin
- The response MUST be returned within 5000ms (health check timeout)

EDGE CASES:
- If the database is unreachable, the endpoint MUST return HTTP 503 with `{"Success": false, "Error": {"Code": <cli-specific-code>, "Message": "Database unavailable"}}`
- If the health endpoint is called with an unsupported HTTP method (e.g., POST), the response MUST be HTTP 405 Method Not Allowed
- If the backend is in a startup phase (not yet fully initialized), the endpoint SHOULD return HTTP 503 with `Data.Status = "starting"` rather than refusing the connection entirely

---

**AC-P2-002: Frontend Connection Detection Logic**

GIVEN: A React frontend application is configured with `VITE_API_BASE_URL` pointing to a Go backend, and the `BackendStatus` component is mounted in the DOM

WHEN: The frontend performs its periodic health check (default: every 10 seconds)

THEN:
- The frontend MUST use `response.ok` (HTTP 2xx status) as the PRIMARY connection indicator — it MUST NOT parse the response body to determine connection status
- If `response.ok` is `true`, the connection status MUST be set to "connected" regardless of the response body content
- If `response.ok` is `false`, the connection status MUST be set to "disconnected" and the error modal MUST display: the raw `VITE_API_BASE_URL` environment variable value, the resolved API origin URL, the current `window.location.origin`, and the full absolute API base URL
- If the `fetch` call throws a network error (e.g., DNS failure, connection refused), the status MUST be set to "disconnected" and the error details MUST indicate "Network error" rather than an HTTP status
- The health check MUST use `AbortSignal.timeout(5000)` to prevent hanging on unresponsive backends
- On transition from "connected" to "disconnected", a toast notification MUST appear with the error code from the CLI's frontend error range (e.g., 7050 for GSearch, 9050 for AI Bridge)
- On transition from "disconnected" to "connected", a toast notification MUST appear confirming reconnection

EDGE CASES:
- If `VITE_API_BASE_URL` is not set (undefined), the frontend MUST fall back to `window.location.origin` and log a warning to the console
- If the backend returns HTML (e.g., SPA fallback serving index.html for unregistered routes), the JSON parse MUST fail gracefully and the frontend MUST show "Invalid response format" in diagnostics
- If multiple health checks overlap (previous check still pending when new one fires), the previous check MUST be aborted via AbortController before starting the new one

---

**AC-P2-003: API Base Index Route Availability**

GIVEN: A Go CLI backend has registered its API router under the prefix `/api/v1`

WHEN: An HTTP GET request is sent to `http://{host}:{port}/api/v1` (no trailing path)

THEN:
- The response HTTP status code MUST be `200 OK` (NOT 404)
- The response body MUST be a standard envelope containing: `{"Success": true, "Data": {"Name": "<CLI Display Name>", "Version": "v1", "Health": "/api/v1/health", "Ws": "/ws"}}`
- The `Data.Name` field MUST match the CLI tool's display name (e.g., "GSearch CLI", "AI Bridge CLI")
- Both `/api/v1` and `/api/v1/` (with trailing slash) MUST return identical responses

EDGE CASES:
- If the API version is changed to v2 in the future, the v1 endpoint MUST still respond (with a deprecation notice in the response) until formally removed
- If an unregistered sub-path is requested (e.g., `/api/v1/nonexistent`), the response MUST be HTTP 404 with the standard error envelope, NOT a raw 404 or HTML page

---

### 3.2 Error Code Registry

---

**AC-P2-004: Error Code Range Non-Overlap Validation**

GIVEN: The error code registry at `spec/03-error-code-registry/01-registry.md` contains all registered project prefixes and their numeric ranges

WHEN: A validation tool or manual review checks all registered ranges for overlaps

THEN:
- No two distinct project prefixes MAY have overlapping numeric ranges — if Project A owns 7000-7099 and Project B owns 7100-7599, there MUST be no code X where 7000 ≤ X ≤ 7099 AND 7100 ≤ X ≤ 7599 (no overlap)
- The deprecated `CLI` range (4000-4999) MUST NOT be reused by any new project
- Each CLI's `05-error-codes.md` (or equivalent) MUST list error codes exclusively within its allocated range
- Frontend sub-ranges (e.g., +50 to +69 within each CLI's range) MUST NOT overlap with backend codes in the same CLI's range
- Extended ranges (e.g., AI Bridge 9600-9849) MUST be explicitly registered in the registry, not just documented in the CLI's own error codes file
- The registry MUST be updated within the same PR/commit that introduces a new error code range in any CLI specification

EDGE CASES:
- If a CLI requires more codes than its primary range allows (e.g., AI Bridge needs 9000-9999 but originally had 9000-9499), the expansion MUST be registered as a separate line item in the registry with the same project prefix
- Retired error codes MUST remain in the registry with a "retired" status to prevent accidental reuse
- If two CLIs share the same project prefix (e.g., GSearch `GS` for core 7000-7099 and BI suite 7700-7839), each sub-range MUST be a separate registry entry

---

**AC-P2-005: Error Code Format Consistency**

GIVEN: A new error code is being defined for a project in the ecosystem

WHEN: The developer chooses the error code format

THEN:
- **Go CLI tools** (GSearch, BRun, AI Bridge, Nexus Flow, WP SEO Publish, Spec Reverse, AI Transcribe) MUST use plain integer codes (e.g., `7001`, `9301`) — these are the codes returned in API responses and logged
- **General-spec applications** (WordPress plugins, PHP backends, SM frontend) MUST use the `XX-NNN-NN` format (e.g., `SM-400-01`, `LM-300-02`)
- The JSON schema at `spec/03-error-code-registry/schemas/error-code.schema.json` MUST be updated to support BOTH formats: the existing `^[A-Z]{2,4}-[0-9]{3}-[0-9]{2}$` pattern AND a new `^[0-9]{4,5}$` pattern for CLI integer codes
- Error code constants in Go MUST be defined as `const` integers (not strings) in the CLI's `internal/errors/` package
- Error code constants in TypeScript MUST be defined as `as const` objects with numeric values for CLI codes

EDGE CASES:
- PowerShell exit codes (9500-9599) use the integer format but are also referenced with the `PS-9500-01` prefix format in the registry — both formats MUST resolve to the same underlying error
- The integration guide (`02-integration-guide.md`) shows Go examples using string format (`"SM-000-01"`) but CLI tools use integers — the guide MUST include CLI-specific examples with integer codes

---

**AC-P2-006: New Error Code Registration Workflow**

GIVEN: A developer needs to add a new error code to a CLI tool or application

WHEN: They follow the registration process defined in `spec/03-error-code-registry/02-integration-guide.md`

THEN:
- Step 1: The developer MUST verify their project prefix exists in `01-registry.md`; if not, they MUST claim the next available 1000-range with a unique 2-4 letter prefix
- Step 2: The developer MUST add the error code to their project's error codes file (e.g., `05-error-codes.md`) within the allocated range, with: a unique numeric code, a SCREAMING_SNAKE_CASE constant name, a human-readable message ≤200 characters, an optional HTTP status code mapping, and a severity level (info, warning, error, critical)
- Step 3: The developer MUST update `spec/03-error-code-registry/01-registry.md` with the new code if it extends into a previously unregistered sub-range
- Step 4: The developer MUST implement the error code as a typed constant in the codebase (Go `const` or TypeScript `as const`)
- Step 5: The developer MUST add a user-facing message mapping for the error code in the frontend's error message lookup table
- The entire process MUST be completed in a single specification update — partial updates (e.g., adding a code to the CLI spec but not the registry) are violations

EDGE CASES:
- If two developers independently add codes in the same range simultaneously, the merge conflict MUST be resolved by assigning the later addition the next available number
- If a CLI's range is fully exhausted, the developer MUST request a secondary range in the registry before using codes outside their allocated range
- Error codes used only internally (never exposed to API consumers) still MUST be registered to prevent future collisions

---

### 3.3 Debugging Guides

---

**AC-P2-007: Go Backend Initialization Order Enforcement**

GIVEN: A Go CLI tool is starting up (via `main()` or a `serve` command)

WHEN: The initialization sequence executes

THEN:
- The initialization MUST follow this exact order: (1) Configuration loading, (2) Directory creation/verification, (3) Database initialization (Split DB pattern), (4) Service initialization, (5) HTTP/WebSocket server start
- If Step 1 (configuration) fails, the process MUST exit with a fatal error (exit code 1) and log: the config file path attempted, the specific parse error, and a suggestion to check the config file format
- If Step 2 (directories) fails, the process MUST exit with a fatal error and log: the directory path, the OS error (e.g., permission denied), and the required permissions (0755)
- If Step 3 (database) fails, the process MUST exit with a fatal error and log: the database file path, the SQLite error, and whether WAL mode initialization failed
- Steps 4 and 5 MUST NOT begin until all previous steps have completed successfully — there MUST be no goroutine that starts the HTTP server before the database is ready
- All SQLite databases MUST be configured with: `PRAGMA journal_mode=WAL`, `PRAGMA busy_timeout=5000`, `PRAGMA foreign_keys=ON`
- The server address MUST bind to `:PORT` (all interfaces), NOT `localhost:PORT`, to allow external connections

EDGE CASES:
- If the configuration file does not exist on first run, the system MUST create a default `config.seed.json` and seed the database from it (Seedable Config pattern)
- If the database file exists but has a corrupted schema (e.g., missing tables), the system SHOULD attempt automatic migration before failing
- If the configured port is already in use, the system MUST try fallback ports (as defined in each CLI's port allocation) before exiting with a fatal error

---

**AC-P2-008: PHP Plugin Initialization Order Enforcement**

GIVEN: A WordPress plugin (Exam Manager, Link Manager, or WP Plugin Publish) is being activated in the WordPress admin

WHEN: The plugin's activation hook fires

THEN:
- The initialization MUST follow this exact order: (1) Directory creation via `ensure_directories_exist()`, (2) Database initialization via `ensure_database_ready()`, (3) Component initialization
- Each initialization function MUST be idempotent — calling it multiple times MUST produce the same result as calling it once
- Debug logging MUST be written to `wp-content/uploads/{plugin-slug}/logs/debug.log` with format: `[TIMESTAMP] [LEVEL] [Memory: X.X MB] Message`
- Error logging MUST be written to `wp-content/uploads/{plugin-slug}/logs/error.log` with full stack traces, separated by 80-character dashes
- If the PDO SQLite extension is not loaded, the plugin MUST fail activation gracefully with a WordPress admin notice explaining the missing extension — it MUST NOT cause a PHP fatal error that breaks the admin
- If directory creation fails (e.g., permissions), the plugin MUST NOT attempt database initialization — it MUST stop and report the directory error
- Log files MUST use `FILE_APPEND | LOCK_EX` flags to prevent concurrent write corruption

EDGE CASES:
- If `PLUGIN_DEBUG_LOGGING` and `PLUGIN_ERROR_LOGGING` constants are not defined, the logger MUST default to disabled (no logging) rather than throwing an error
- If the log directory's parent (`wp-content/uploads/`) does not exist, the system MUST call `wp_mkdir_p()` to create the full path recursively
- If the plugin is deactivated and reactivated, the existing database MUST be preserved — only missing tables should be created via `CREATE TABLE IF NOT EXISTS`

---

**AC-P2-009: TypeScript Frontend Diagnostics Display**

GIVEN: A React frontend application encounters a connection error to its Go backend

WHEN: The error modal (GlobalErrorModal) is triggered

THEN:
- The modal MUST display these diagnostic fields clearly separated: "Raw VITE_API_BASE_URL" showing the exact environment variable value (or "(not set)" if undefined), "Resolved API Origin" showing the computed URL after fallback logic, "UI Origin" showing `window.location.origin`, "API Base (absolute)" showing the full URL used for API calls
- The error code MUST be displayed prominently in the modal header, using the CLI's frontend error range (e.g., E7050 for GSearch WS_CONNECTION_FAILED)
- A "Copy All" button MUST copy all diagnostic information to the clipboard in a structured text format suitable for pasting into a bug report
- The diagnostics section MUST be collapsible (default: collapsed) to avoid overwhelming non-technical users
- The modal MUST include a "Retry" button that triggers an immediate health check rather than waiting for the next polling interval
- Console logging MUST use the structured logger pattern: `[LEVEL] message` with `console.log` for DEBUG/INFO, `console.warn` for WARN, `console.error` for ERROR

EDGE CASES:
- If the `fetch` call returns HTML instead of JSON (SPA fallback), the diagnostics MUST show "Response is not JSON" and include the first 200 characters of the HTML response for debugging
- If `window.location.protocol` is `https:` but `VITE_API_BASE_URL` uses `http:`, the diagnostics MUST flag this as a "Mixed content warning"
- If the browser's network tab shows the request was blocked by CORS, the diagnostics MUST suggest checking the backend's CORS middleware configuration

---

## 4. Remediation Recommendations

| Priority | Action | Files Affected |
|----------|--------|----------------|
| 🔴 P0 | Reconcile the two error code format systems (XX-NNN-NN vs flat integers) in the registry overview. Add a "Format" column to the registry distinguishing "prefix" format from "integer" format. | `00-overview.md`, `01-registry.md` |
| 🔴 P0 | Fix incorrect spec locations in registry: SRC → `spec/25-spec-reverse-cli/`, WSP → `spec/14-wp-seo-publish-cli/`, LM → `spec/30-wp-plugin/link-manager/` | `01-registry.md` |
| 🔴 P0 | Update AI Bridge extended range (9600-9999) in registry to reflect actually allocated sub-ranges (9600-9849 active, 9850-9869 code patterns, 9970-9989 long-chain, 9990-9999 vector DB, 9720-9729 HTML blog) | `01-registry.md` |
| 🟡 P1 | Update JSON schema to support both `^[A-Z]{2,4}-[0-9]{3}-[0-9]{2}$` and `^[0-9]{4,5}$` patterns via `oneOf` | `schemas/error-code.schema.json` |
| 🟡 P1 | Standardize response envelope JSON field casing across all debugging guides to PascalCase (`Success`, `Data`, `Error`) | All debugging guides, `00-overview.md` |
| 🟡 P1 | Update cheat sheet error code ranges table with all current ranges including BI Suite, extended AI Bridge, and GSearch movie/settings codes | `05-debugging-cheat-sheet.md` |

---

*Phase 2 audit completed. 11 inconsistencies found, 9 acceptance criteria written.*
