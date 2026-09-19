# Phase 11: BRun CLI Audit

**Date:** 2026-02-07  
**Auditor:** AI  
**Scope:** `02-spec/21-brun-cli/` (21 backend + 3 frontend + 2 deploy files)  
**Files Reviewed:** 26  
**Status:** Complete

---

## 1. Inconsistency Report

| # | File(s) | Description | Severity |
|---|---------|-------------|----------|
| I-01 | `01-core-architecture.md` lines 76-83 | **String-based RuntimeType enum.** Uses `type RuntimeType string` with `const RuntimePowerShell RuntimeType = "powershell"` but `19-enum-architecture.md` defines the compliant `runtime.Variant` (byte pattern). The core architecture still shows the old string-based pattern and is not updated to reference the enum. | 🔴 Critical |
| I-02 | `01-core-architecture.md` lines 97-117 | **camelCase JSON tags on ExecutionResult/BuildError.** Uses `json:"runId"`, `json:"exitCode"`, `json:"startTime"`, `json:"severity"`, `json:"stackTrace"` etc. Project mandate requires PascalCase JSON transport (`"RunId"`, `"ExitCode"`, `"StartTime"`). | 🔴 Critical |
| I-03 | `05-port-management.md` lines 31-50 | **camelCase JSON tags on PortConfig/PortCheckResult/PortResolution.** Uses `json:"default"`, `json:"port"`, `json:"available"`, `json:"requestedPort"`, `json:"availablePort"`. Should be PascalCase. | 🔴 Critical |
| I-04 | `05-port-management.md` lines 196-208 | **FirewallRule uses camelCase JSON.** Fields `json:"name"`, `json:"port"`, `json:"protocol"`, `json:"direction"`, `json:"action"`. Should be PascalCase. Also `Protocol`, `Direction`, `Action` fields are string-based — these should be enum types per spec/17. | 🟡 Warning |
| I-05 | `06-error-handling.md` lines 37-60 | **Dual ExecutionResult/BuildError definitions.** The error handling spec redefines `BuildError` and `ExecutionResult` with `json:",omitempty"` tags (implicit PascalCase) while `01-core-architecture.md` defines them with explicit camelCase tags. These two definitions conflict — the error handling version is correct but the core architecture version is stale. | 🔴 Critical |
| I-06 | `06-error-handling.md` lines 186-208 | **StackFrame uses camelCase JSON.** `json:"function"`, `json:"file"`, `json:"line"`, `json:"column,omitempty"`. Should be PascalCase or use omitted tags. | 🟡 Warning |
| I-07 | `06-error-handling.md` lines 288-309 | **FileLogger.WriteMetadata uses map with camelCase keys.** `"runId"`, `"success"`, `"exitCode"`, `"startTime"`, `"endTime"`, `"duration"`, `"errors"`, `"warnings"` — should be PascalCase. | 🟡 Warning |
| I-08 | `06-error-handling.md` lines 340-387 | **JSON output examples use camelCase.** Sample JSON shows `"runId"`, `"exitCode"`, `"severity"`, `"stackTrace"` etc. These are rendered output examples but contradict the PascalCase mandate. | 🟡 Warning |
| I-09 | `06-error-handling.md` lines 393-405 | **Error code range table conflicts with 00-overview.md.** Error handling spec shows range 7000-7099 for "CLI General" but `00-overview.md` shows 71xx for CLI/argument errors. The error handling spec starts at 7000 (GSearch's range) while BRun's allocated range is 7100-7599. Codes 7001-7006 fall in GSearch's 7000-7099 range, creating a collision with the central error registry. | 🔴 Critical |
| I-10 | `09-integration-api.md` lines 147-172 | **Integration API BuildError.Severity is string.** `Severity string` at line 169 should be `severity.Variant`. The integration module doesn't use the enum. | 🟡 Warning |
| I-11 | `09-integration-api.md` line 214 | **Field name inconsistency.** Uses `result.RunID` (line 214) but the struct field is defined as `RunId` (line 148). Go convention for ID abbreviations in PascalCase should be consistent — the project treats acronyms as words (`RunId` not `RunID`). | 🟠 Minor |
| I-12 | `09-integration-api.md` lines 536-544 | **Duplicate BrunError struct.** A second `BrunError` type is defined in the integration API (lines 536-544) with different fields from the one in `06-error-handling.md` (lines 548-555). Two competing error structs with the same name. | 🔴 Critical |
| I-13 | `10-data-models.md` lines 296-303 | **Raw SQL in database initialization.** `db.Exec("CREATE INDEX IF NOT EXISTS idx_build_runs_profile ON build_runs(profile_name)")` uses `snake_case` table/column names (`build_runs`, `profile_name`) but the GORM models use PascalCase (`BuildRuns`, `ProfileName`). The raw SQL also violates the ORM-only policy. | 🔴 Critical |
| I-14 | `10-data-models.md` lines 192-240 | **Repository uses raw WHERE clauses with snake_case.** `Where("run_id = ?", runID)`, `Where("profile_name = ?", profileName)`, `Where("success = ? AND created_at > ?", ...)` — all use `snake_case` column names. GORM auto-translates PascalCase struct fields, but these raw `Where` strings assume `snake_case` DB columns, contradicting the PascalCase DB naming mandate. | 🔴 Critical |
| I-15 | `10-data-models.md` vs `16-database-architecture.md` | **Conflicting data model designs.** `10-data-models.md` uses a single-database approach with GORM auto-migrate and `uint` primary keys. `16-database-architecture.md` uses the Split DB pattern with TEXT UUIDs for primary keys and separate session databases per run. These two specs describe fundamentally different architectures for the same data. | 🔴 Critical |
| I-16 | `15-observability.md` lines 387-394 | **HealthStatus uses string enum.** `type HealthStatus string` with `StatusHealthy HealthStatus = "healthy"` etc. Should use the `health_status.Variant` byte pattern from `02-spec/17-enum-specification/`. | 🟡 Warning |
| I-17 | `16-database-architecture.md` lines 59, 79, 165, 209, 228 | **SQL schema uses string comments for enum values.** `ValueType TEXT DEFAULT 'string' -- string, int, float, bool, json`, `Runtime TEXT NOT NULL -- powershell, nodejs, golang`, `Severity TEXT NOT NULL -- error, warning, info`, `Mode TEXT NOT NULL -- copy, clear-copy, override, skip-existing`. These should reference the byte-variant enums defined in `19-enum-architecture.md`. | 🟡 Warning |
| I-18 | `17-settings-service.md` lines 142-165 | **ConfigCategory uses string enum.** `type ConfigCategory string` with `CategoryBuildDefaults ConfigCategory = "build_defaults"`. Should use `byte` variant pattern per spec/17. | 🟡 Warning |
| I-19 | `17-settings-service.md` lines 267-278 | **Settings error codes use different format.** Shows `BR-7200` through `BR-7209` with `BR-` prefix, but `06-error-handling.md` uses plain integers (7200+) and the 7200 range is already used for "Runtime Execution" errors. The settings service codes would collide with runtime execution codes. | 🔴 Critical |
| I-20 | `18-reset-api.md` lines 37-77 | **Reset API uses camelCase JSON.** `"resetId"`, `"scope"`, `"expiresAt"`, `"affectedItems"`, `"createdAt"`. Should be PascalCase (`"ResetId"`, `"Scope"`, `"ExpiresAt"`). | 🟡 Warning |
| I-21 | `18-reset-api.md` lines 160-167 | **Reset error codes collide with Build Process range.** Reset errors use BR-7401 through BR-7407, but `06-error-handling.md` already allocates 7400-7499 to "Build Process" errors (7401=`ERR_BRUN_BUILD_FAILED` through 7410=`ERR_BRUN_PATH_TRAVERSAL`). Direct collision at 7401-7407. | 🔴 Critical |
| I-22 | `99-consistency-report.md` line 182 | **Consistency report claims camelCase JSON is correct.** States `JSON fields | "runId", "exitCode" | ✅ camelCase` as compliant, but the project-wide PascalCase mandate requires PascalCase JSON keys for Go CLIs. The report validates the wrong standard. | 🔴 Critical |
| I-23 | `99-consistency-report.md` lines 30-52 | **Document inventory lists 19 files but folder has 22.** The consistency report doesn't list `16-database-architecture.md`, `17-settings-service.md`, `18-reset-api.md`, or `19-enum-architecture.md`. | 🟡 Warning |
| I-24 | `00-overview.md` lines 40-46 | **Folder structure in overview is outdated.** Lists files up to `15-observability.md` but doesn't include `16-database-architecture.md`, `17-settings-service.md`, `18-reset-api.md`, or `19-enum-architecture.md`. | 🟠 Minor |
| I-25 | `12-ai-config-generation.md` throughout | **Config schema examples use camelCase.** AI-description schema fields use `"_aiDescription"`, `"modTidy"`, `"packageManager"`, `"checkTimeout"` etc. in the JSON schema. While JSON Schema property names are external format, the Go struct fields should still marshal to PascalCase. | 🟠 Minor |
| I-26 | `14-implementation-guide.md` lines 230-279 | **Implementation guide Config structs use camelCase JSON tags AND `mapstructure` tags.** Shows `json:"version" mapstructure:"version"`, `json:"workDir"`, `json:"runtime"`, `json:"sourceDir"`, `json:"preCommands"`. This directly contradicts `03-configuration.md` (lines 430-579) which correctly uses PascalCase tags (`json:"Version"`, `json:"Runtimes"`). The implementation guide is teaching developers the wrong pattern. | 🔴 Critical |
| I-27 | `14-implementation-guide.md` lines 371-395 | **Run model uses camelCase JSON AND string-based RunStatus.** Uses `json:"runId"`, `json:"profileName"`, `json:"exitCode"` and `type RunStatus string` with `StatusPending RunStatus = "pending"`. Both violate project standards. This contradicts the Split DB models in `16-database-architecture.md`. | 🔴 Critical |
| I-28 | `14-implementation-guide.md` line 18 | **References `10-data-models.md` as authoritative.** Cross-reference links to `10-data-models.md` (Single DB, `uint` PKs) instead of `16-database-architecture.md` (Split DB, UUID PKs). Developers following the implementation guide would build the wrong architecture. | 🔴 Critical |
| I-29 | `13-testing-strategy.md` lines 185-227 | **Test environment uses Single DB models.** `TestEnv` auto-migrates `models.Run` and `models.BuildError` from the old single-DB model. Should test against Split DB session database schema. | 🟡 Warning |
| I-30 | `13-testing-strategy.md` lines 207-227 | **`CreateTestProject` uses string literals instead of enums.** `switch runtime { case "golang": ... case "nodejs": ...}` — should use `runtime.Variant` enum with `rt.IsGolang()` pattern. | 🟡 Warning |
| I-31 | `08-asset-operations.md` lines 110-117 | **CopyResult struct uses camelCase JSON tags.** `json:"filesCopied"`, `json:"filesSkipped"`, `json:"bytesCopied"`, `json:"duration"`, `json:"errors,omitempty"`. Should be PascalCase or use tag-omitted pattern. | 🟡 Warning |
| I-32 | `08-asset-operations.md` lines 374-391 | **JSON output examples use camelCase.** Shows `"success"`, `"filesCopied"`, `"filesSkipped"`, `"bytesCopied"`, `"totalFiles"`, `"totalBytes"`, `"totalDuration"`. | 🟡 Warning |
| I-33 | `02-cli-interface.md` lines 242-276 | **CLI JSON output examples use camelCase.** Shows `"runId"`, `"exitCode"`, `"requestedPort"`, `"availablePort"`, `"checkedPorts"`. These are user-facing documentation that teaches the wrong JSON key convention. | 🟡 Warning |
| I-34 | `04-runtime-executors.md` lines 99-113 | **ErrorPattern.Severity is string.** `Severity: "error"` uses hardcoded string literal instead of `severity.Variant` enum. | 🟠 Minor |
| I-35 | `03-deploy/01-deployment-guide.md` lines 270-298 | **Deployment guide config schema differs from `03-configuration.md`.** Uses `"database": {"path": "..."}` (no database section exists in `03-configuration.md`), uses `"profiles"` as object (not array), and shows `"timeout": "300s"` string instead of duration type. Fundamental structural mismatch. | 🔴 Critical |
| I-36 | `03-deploy/01-deployment-guide.md` lines 247-252 | **Config search order differs.** Shows `~/.config/brun/config.json` but `03-configuration.md` line 25 says `~/.brun/config.json`. Inconsistent user home location. | 🟡 Warning |
| I-37 | `03-deploy/01-deployment-guide.md` lines 482-499 | **Deployment guide JSON output uses camelCase.** Shows `"runId"`, `"exitCode"`, `"requiresAIFix"`. Same PascalCase violation as other files. | 🟡 Warning |
| I-38 | `03-deploy/01-deployment-guide.md` lines 518-541 | **Runtime config section uses camelCase keys.** Shows `"packageManager"`, `"executionPolicy"` in JSON examples. Should be PascalCase. | 🟡 Warning |
| I-39 | `03-deploy/01-deployment-guide.md` line 22 & 938 | **Stale cross-reference.** References `../22-golang-search-cli/17-deployment-guide.md` — the GSearch CLI is at `02-spec/20-gsearch-cli/`, not `02-spec/22-golang-search-cli/`. This is a broken link to a non-existent path. | 🟡 Warning |
| I-40 | `02-frontend/01-frontend-architecture.md` lines 169-173 | **Seedable config uses camelCase keys.** Shows `"defaultRuntime"`, `"assetMode"` as settings keys. Should use PascalCase (`"DefaultRuntime"`, `"AssetMode"`) per the project naming mandate for config keys. | 🟡 Warning |
| I-41 | `03-configuration.md` lines 32-228 vs 235-368 | **JSON Schema uses camelCase but Go structs use PascalCase.** The JSON Schema property names (`"packageManager"`, `"modTidy"`, `"checkTimeout"`, `"createRunFolders"`) differ from the Go struct JSON tags (`"PackageManager"`, `"ModTidy"`, `"CheckTimeout"`, `"CreateRunFolders"`). The example JSON (lines 235-368) follows the schema's camelCase, making it incompatible with the Go struct tags that actually marshal/unmarshal the data. | 🔴 Critical |
| I-42 | `03-deploy/01-deployment-guide.md` lines 410-416 | **SQL query uses camelCase column names.** Shows `SELECT * FROM Run ORDER BY StartedAt DESC` and `WHERE RunId = 'run-abc123'` — while the PascalCase column names are correct, the database table names should be verified against `16-database-architecture.md` which defines different table names (e.g., `RunMeta`, `BuildErrors`). The deployment guide references `Run` and `BuildError` tables from the deprecated `10-data-models.md`. | 🟠 Minor |

---

## 2. Missing Acceptance Criteria

Files with existing acceptance criteria:

| File | Has AC? | Notes |
|------|---------|-------|
| `11-acceptance-criteria.md` | ✅ Partial | Has criteria but needs review for E2E-readiness |

All other 25 files lack formal GIVEN/WHEN/THEN acceptance criteria.

---

## 3. Detailed Acceptance Criteria

### 3.1 Runtime Executor Selection

---

**AC-P11-001: Runtime Executor Factory Dispatch**

GIVEN: A `BuildProfile` with `Runtime` set to a valid `runtime.Variant` (e.g., `runtime.Golang`)

WHEN: The `ExecutorFactory.Create(rt runtime.Variant)` method is called

THEN:
- If `rt.IsGolang()` returns true, a `GolangExecutor` MUST be returned configured with the `GolangConfig` from the loaded configuration
- If `rt.IsNodeJs()` returns true, a `NodeJSExecutor` MUST be returned with the configured `package_manager.Variant`
- If `rt.IsPowerShell()` returns true, a `PowerShellExecutor` MUST be returned with default args from config
- If `rt.IsUnknown()` or `rt.IsValid()` returns false, the factory MUST return `(nil, error)` with error code 7106 (`ERR_BRUN_CONFIG_RUNTIME_INVALID`)
- The returned executor MUST have its `Validate()` method callable without panic

EDGE CASES:
- If the runtime binary (e.g., `go`, `node`, `pwsh`) is not found in PATH, `Validate()` MUST return error code 7201 (`ERR_BRUN_RUNTIME_NOT_FOUND`)
- If two executors are created for the same runtime type, they MUST be independent instances (no shared mutable state)

---

**AC-P11-002: Go Executor mod tidy Behavior**

GIVEN: A `GolangExecutor` with `ModTidy` set to a `mod_tidy_mode.Variant`

WHEN: `Execute()` is called on a Go project directory

THEN:
- If `modTidy.IsSkip()`, `go mod tidy` MUST NOT be executed
- If `modTidy.IsRun()`, `go mod tidy` MUST be executed before `go build`; if it fails, the failure MUST be logged as a warning but execution MUST continue to the build step
- If `modTidy.IsForce()`, `go mod tidy` MUST be executed; if it fails, the entire execution MUST abort immediately with error code 7211 (`ERR_BRUN_GO_MOD_TIDY_FAILED`)
- The tidy output (stdout/stderr) MUST be prepended to the final `ExecutionResult.Stdout` and `ExecutionResult.Stderr`

EDGE CASES:
- If no `go.mod` file exists in the working directory and `modTidy.IsRun()`, the tidy step SHOULD be silently skipped (not an error)
- If `modTidy.IsForce()` and no `go.mod` exists, `go mod tidy` will fail — this MUST produce error code 7211

---

### 3.2 Port Management

---

**AC-P11-003: Port Resolution with Fallback**

GIVEN: A `PortManager` with primary port `P` and fallback ports `[F1, F2, F3]`

WHEN: `ResolvePort(P, [F1, F2, F3])` is called

THEN:
- The primary port `P` MUST be checked first by attempting `net.Listen("tcp", ":P")`
- If `P` is available, `PortResolution.AvailablePort` MUST equal `P` and `CheckedPorts` MUST contain exactly 1 entry
- If `P` is in use, fallback ports MUST be checked in order (F1, then F2, then F3)
- The first available fallback port MUST be returned as `AvailablePort`
- All checked ports (including unavailable ones) MUST appear in `CheckedPorts` with their availability status
- For unavailable ports, `Reason` MUST be "in use" and `Process` / `PID` SHOULD be populated if detectable
- If no port is available (primary + all fallbacks exhausted), the method MUST return error code 7301 (`ERR_BRUN_PORT_UNAVAILABLE`)

EDGE CASES:
- Port 0 MUST be rejected with error code 7303 (`ERR_BRUN_PORT_INVALID`)
- Ports > 65535 MUST be rejected with error code 7303
- Ports < 1024 on Linux/macOS without root privileges MUST return error code 7302 (`ERR_BRUN_PORT_PERMISSION`)
- If the fallback list is empty and primary is unavailable, return 7301 immediately

---

**AC-P11-004: Firewall Rule Management**

GIVEN: A `FirewallManager` with `Enabled = true`

WHEN: `EnablePort(port, name, protocol)` is called

THEN:
- On Windows, `netsh advfirewall firewall add rule` MUST be executed with the rule name `{name}-{port}`
- On Linux with `ufw` available, `sudo ufw allow {port}/{protocol}` MUST be executed
- On Linux without `ufw`, `sudo iptables -A INPUT -p {protocol} --dport {port} -j ACCEPT` MUST be executed
- On macOS, a `pf` anchor rule MUST be written to `/etc/pf.anchors/{ruleName}`
- If the firewall command fails, error code 7304 (`ERR_BRUN_FIREWALL_FAILED`) MUST be returned
- If insufficient privileges, error code 7305 (`ERR_BRUN_FIREWALL_PERMISSION`) MUST be returned

EDGE CASES:
- If a rule with the same name already exists, `EnablePort` SHOULD succeed silently (idempotent)
- `DisablePort` for a non-existent rule MUST return error code 7306 (`ERR_BRUN_FIREWALL_NOT_FOUND`)

---

### 3.3 Asset Copy Operations

---

**AC-P11-005: Asset Copy Mode Behavior**

GIVEN: An `AssetCopier` executing an `AssetOperation` with a `copy_mode.Variant`

WHEN: The operation is executed against a source directory with files

THEN:
- **Copy** (`copy_mode.Copy`): Files MUST be copied to destination; if any destination file already exists, the operation MUST fail with error code 7404
- **ClearCopy** (`copy_mode.ClearCopy`): All files in the destination directory MUST be deleted first, then source files MUST be copied; the destination directory itself MUST NOT be deleted (only its contents)
- **Override** (`copy_mode.Override`): Files MUST be copied, overwriting any existing files; new files MUST also be copied
- **SkipExisting** (`copy_mode.SkipExisting`): Only files that do NOT exist at the destination MUST be copied; existing files MUST be left unchanged
- `CopyResult.FilesCopied` MUST reflect the actual number of files written
- `CopyResult.FilesSkipped` MUST reflect files that were not copied (due to skip-existing or exclusions)
- `CopyResult.BytesCopied` MUST reflect the total bytes of all copied files

EDGE CASES:
- If the source path does not exist, error code 7406 (`ERR_BRUN_ASSET_SOURCE_MISSING`) MUST be returned
- If the destination directory cannot be created, error code 7403 (`ERR_BRUN_OUTPUT_DIR_FAILED`) MUST be returned
- Empty source directories MUST succeed with `FilesCopied = 0`
- Symlinks in the source SHOULD be copied as regular files (follow the link)

---

**AC-P11-006: Asset Pattern and Exclusion Filtering**

GIVEN: An `AssetOperation` with `Pattern = "*.js"` and `Exclude = ["*.test.js", "node_modules"]`

WHEN: The copier walks the source directory tree

THEN:
- Only files matching the pattern (`*.js`) MUST be considered for copying
- Files matching any exclusion pattern (`*.test.js`) MUST be skipped
- Directories matching exclusion entries (`node_modules`) MUST have all their contents skipped
- Pattern matching MUST use `filepath.Match` semantics (glob patterns)
- If `Flatten = true`, all matched files MUST be placed directly in the destination directory, ignoring source subdirectory structure
- If `Flatten = false`, the source directory structure MUST be preserved relative to the source root

EDGE CASES:
- If `Pattern` is empty, ALL files MUST be considered (no filtering)
- If a pattern is syntactically invalid, the operation MUST fail with an error (not silently skip)
- If flatten causes filename collisions (two files with the same name from different subdirectories), the later file in walk order MUST overwrite the earlier one

---

### 3.4 Build Profile Management

---

**AC-P11-007: Profile CRUD Operations**

GIVEN: A `ProfileManager` loaded from `config.json`

WHEN: Profile operations are performed

THEN:
- `Get(name)` MUST return the profile if it exists, or error code 7104 (`ERR_BRUN_CONFIG_PROFILE_NOT_FOUND`) if not
- `Add(profile)` MUST validate: name is non-empty, `Runtime.IsValid()` returns true, and either `Source` or `Command` is non-empty; validation failure MUST return a descriptive error
- `Add(profile)` for a name that already exists MUST return an error (no silent overwrite)
- `Remove(name)` for a non-existent profile MUST return error code 7104
- `List()` MUST return all profiles; the order is not guaranteed
- After `Add` or `Remove`, the `ProfileManager` MUST persist changes to `config.json` via `save()`

EDGE CASES:
- Profile names containing path separators (`/`, `\`) MUST be rejected
- Profile names with spaces SHOULD be allowed but trimmed
- If `config.json` write fails during `save()`, error code 7108 (`ERR_BRUN_CONFIG_WRITE_FAILED`) MUST be returned

---

**AC-P11-008: Profile Execution with Post-Commands and Assets**

GIVEN: A `BuildProfile` with `PostCommands = ["echo done"]` and `Assets.Enabled = true`

WHEN: `ExecutionEngine.ExecuteProfile(ctx, profileName)` is called and the build succeeds

THEN:
- Pre-commands MUST execute before the main build; if any pre-command fails, the entire execution MUST abort with the pre-command's error
- The main build MUST use the executor matching `profile.Runtime`
- Post-commands MUST execute ONLY if `result.Success` is true
- If a post-command fails, it MUST be logged as a warning but MUST NOT change `result.Success` to false
- Asset operations MUST execute ONLY if the build succeeded AND `Assets.Enabled` is true
- If asset copy fails, a warning MUST be appended to `result.Warnings` (build is still considered successful)

EDGE CASES:
- If `profile.Timeout` is empty, the engine MUST fall back to `config.Execution.Timeout`
- If `profile.Port > 0`, the engine MUST call `executeWithPort` which sets the `PORT` environment variable

---

### 3.5 Health Check

---

**AC-P11-009: Health Check Retry Logic**

GIVEN: A `brun run` command with `--health-check "localhost:8080/health" --health-timeout 30s` and the application definition specifies `Retries = 30` and `Interval = 1s`

WHEN: The application is started and the health check loop begins

THEN:
- The health checker MUST poll `GET http://localhost:8080/health` at the configured interval (1s)
- Each poll MUST have an individual timeout of `HealthCheck.Timeout` (default 5s)
- If the response HTTP status matches any value in `ExpectedStatus` (default `[200]`), the health check MUST pass
- If `ExpectedBody` is set, the response body MUST contain the expected substring
- If the health check does not pass within `Retries` attempts, error code 7501 (`ERR_BRUN_HEALTH_TIMEOUT`) MUST be returned
- If a response is received but with wrong status, error code 7504 (`ERR_BRUN_HEALTH_STATUS_MISMATCH`) MUST be returned on the final attempt
- If the endpoint is completely unreachable (connection refused), error code 7503 (`ERR_BRUN_HEALTH_UNREACHABLE`) MUST be returned

EDGE CASES:
- If the process being health-checked exits before the health check passes, the health checker MUST immediately return error code 7502 (`ERR_BRUN_HEALTH_FAILED`)
- If `--health-timeout` exceeds the total time of `Retries * Interval`, the retry count governs termination
- Method `HEAD` MUST only check the status code, ignoring body content even if `ExpectedBody` is set

---

### 3.6 Error Capture and Parsing

---

**AC-P11-010: Multi-Language Error Parsing**

GIVEN: An `ErrorParser` initialized for a specific runtime (Go, Node.js, or PowerShell)

WHEN: Build stderr output is passed to `Parse(output string)`

THEN:
- **Go errors**: Lines matching `^(.+\.go):(\d+):(\d+): (.+)$` MUST produce a `BuildError` with `File`, `Line`, `Column`, `Message`, and `Severity = severity.Error`
- **TypeScript errors**: Lines matching `^(.+)\((\d+),(\d+)\): error (TS\d+): (.+)$` MUST produce a `BuildError` with the `Code` field set to the TS error code (e.g., "TS2304")
- **PowerShell errors**: Lines matching `^At (.+):(\d+) char:(\d+)` MUST produce a `BuildError` with file and location
- Each line MUST be matched against patterns in order; the first matching pattern wins
- Non-matching lines MUST be silently ignored (no error)
- The method MUST return `[]BuildError` — empty slice for no errors, never nil

EDGE CASES:
- Multi-line Go error messages (e.g., `cannot use X (type Y) as type Z`) where the message spans two lines MUST capture at minimum the first line
- If `stderr` is empty, an empty slice MUST be returned
- Binary/garbage output MUST not cause a panic

---

### 3.7 Configuration Loading

---

**AC-P11-011: Configuration Search Order**

GIVEN: No `--config` flag is passed to `brun`

WHEN: The configuration loader searches for `config.json`

THEN:
- The loader MUST search in this exact order: (1) `./config.json` in the current directory, (2) `~/.brun/config.json` in user home, (3) `/etc/brun/config.json` on Linux/macOS
- The FIRST found file MUST be loaded; subsequent locations MUST NOT be checked
- If no config file is found at any location, the loader MUST use built-in defaults (not fail)
- If a config file is found but contains invalid JSON, error code 7102 (`ERR_BRUN_CONFIG_PARSE_ERROR`) MUST be returned
- If a config file is found but fails schema validation, error code 7103 (`ERR_BRUN_CONFIG_SCHEMA_INVALID`) MUST be returned

EDGE CASES:
- If `--config` flag IS provided and the file doesn't exist, error code 7101 (`ERR_BRUN_CONFIG_NOT_FOUND`) MUST be returned (no fallback search)
- If the config file exists but is empty (0 bytes), it MUST be treated as invalid JSON (error 7102)
- Environment variable overrides (`BRUN_*`) MUST be applied AFTER loading the config file, taking precedence

---

**AC-P11-012: Environment Variable Override**

GIVEN: A loaded `config.json` with `Runtimes.Golang.Path = "go"` and environment variable `BRUN_RUNTIMES_GOLANG_PATH = "/usr/local/go/bin/go"`

WHEN: The configuration is resolved

THEN:
- The environment variable value MUST override the config file value
- The `BRUN_` prefix MUST be stripped, and the remaining key MUST be mapped to nested config using `_` as separator converted to dot-notation (`RUNTIMES_GOLANG_PATH` → `Runtimes.Golang.Path`)
- Type coercion MUST be performed: string env values for boolean configs (`"true"` → `true`), integer configs (`"8080"` → `8080`), and duration configs (`"5m"` → 5 minutes)
- Invalid type coercion (e.g., `BRUN_PORTS_DEFAULT = "abc"`) MUST be logged as a warning and the config file value MUST be preserved

EDGE CASES:
- `BRUN_PORTS_FALLBACK` for array values MUST support comma-separated format (`"8081,8082,8083"`)
- Empty environment variable value (`BRUN_OUTPUT_FORMAT=""`) MUST be treated as "not set" (config file value preserved)

---

### 3.8 Split DB Session Management

---

**AC-P11-013: Run Session Database Lifecycle**

GIVEN: A build execution is triggered (e.g., `brun check --go ./cmd/app`)

WHEN: The execution begins

THEN:
- The Counters table in Root DB (`data/brun.db`) MUST be incremented atomically for category "runs"
- A new Session DB file MUST be created at `data/runs/{seq}-{profile}-{shortId}.db` where `seq` is the zero-padded counter, `profile` is the profile name (or "adhoc"), and `shortId` is the first 6 chars of a UUID
- The DbRegistry table in Root DB MUST receive a new entry with the session's path, category "runs", and status "active"
- The Session DB MUST contain tables: `RunMeta`, `Output`, `BuildErrors`, `AssetOperations`, `PortChecks`
- `RunMeta` MUST be a singleton row (Id = "singleton") containing all execution metadata
- On execution completion, `RunMeta.EndTime` and `RunMeta.DurationMs` MUST be populated

EDGE CASES:
- If the `data/runs/` directory does not exist, it MUST be created with permissions `0755`
- If Session DB creation fails (e.g., disk full), the execution MUST still proceed but with database logging disabled; the error MUST be logged to stderr
- Concurrent executions MUST each get their own Session DB (no sharing)

---

**AC-P11-014: Run History Cleanup**

GIVEN: The Root DB setting `Runs.KeepCount = 100`

WHEN: A cleanup operation is triggered (e.g., after a new run completes)

THEN:
- If the total number of run entries in DbRegistry exceeds `KeepCount`, the oldest entries (by `CreatedAt`) MUST be deleted
- For each deleted registry entry, the corresponding Session DB file MUST be removed from the filesystem
- The deletion MUST occur in a single transaction to maintain consistency
- After cleanup, the total run count MUST be ≤ `KeepCount`

EDGE CASES:
- If a Session DB file is already missing (manually deleted), the registry entry MUST still be removed without error
- Cleanup MUST NOT delete runs that are currently "active" (still executing)

---

### 3.9 Working Directory Security

---

**AC-P11-015: External Directory Access Control**

GIVEN: `config.AllowExternalDirs = false` and `config.WorkDirectory = "/home/user/projects"`

WHEN: A command is executed with `--workdir "/etc/sensitive"` or a profile has `WorkDir = "../../../etc"`

THEN:
- The resolved absolute path of the working directory MUST be validated against the configured `WorkDirectory`
- If the resolved path is outside `WorkDirectory` (not a subdirectory) AND `AllowExternalDirs = false`, error code 7409 (`ERR_BRUN_EXTERNAL_DIR_BLOCKED`) MUST be returned
- Path traversal attempts using `..` MUST be resolved to absolute paths before comparison
- If `AllowExternalDirs = true`, any valid directory path MUST be accepted

EDGE CASES:
- Symlinks MUST be resolved to their real path before validation to prevent symlink-based traversal
- If the path contains null bytes, error code 7410 (`ERR_BRUN_PATH_TRAVERSAL`) MUST be returned
- Windows UNC paths (`\\server\share`) MUST be rejected unless `AllowExternalDirs = true`

---

### 3.10 AI Integration (from Spec Management perspective)

---

**AC-P11-016: Subprocess JSON Parsing**

GIVEN: The Spec Management application invokes `brun check --profile backend --json`

WHEN: brun completes and outputs JSON to stdout

THEN:
- The JSON output MUST be valid JSON parseable by `json.Unmarshal`
- All JSON field names MUST use PascalCase (e.g., `"RunId"`, `"ExitCode"`, `"Success"`, `"Errors"`)
- If brun exits with code 0, `Success` MUST be `true` and `Errors` MUST be an empty array
- If brun exits with code 1, `Success` MUST be `false` and `Errors` MUST contain at least one `BuildError`
- If brun outputs non-JSON (e.g., panic stack trace), the parent process MUST handle the parse error gracefully and report "failed to parse brun output"
- The `Duration` field MUST be a human-readable duration string (e.g., `"3.245s"`)

EDGE CASES:
- If brun is killed by SIGTERM during execution, it SHOULD attempt to write a partial JSON result before exiting
- If stdout contains both JSON and non-JSON content (e.g., debug logs before JSON), the parser MUST extract the JSON portion
- Extremely large outputs (>100MB stdout) MUST not cause OOM in the parent process

---

### 3.11 Config Schema / Go Struct Alignment

---

**AC-P11-017: JSON Schema Property Names Must Match Go Struct Tags**

GIVEN: A `config.json` file exists for BRun CLI and Go structs define JSON tags for config deserialization

WHEN: A config file is loaded via `json.Unmarshal` into the Go Config struct

THEN:
- The JSON property names in `config.json` MUST exactly match the Go struct JSON tags
- Since Go struct tags use PascalCase (`json:"Version"`, `json:"Runtimes"`), the config file MUST use PascalCase keys
- The JSON Schema (`$schema`) definition MUST also use PascalCase property names to match
- If the JSON Schema and Go struct tags disagree on casing, the Go struct tags are authoritative (they control actual deserialization)

EDGE CASES:
- If a developer writes `config.json` with camelCase keys (following the schema) but Go expects PascalCase (following struct tags), all values will silently be zero/default — this MUST be detected by config validation
- External tools generating config from the schema will produce incompatible JSON unless the schema is corrected

---

### 3.12 Deployment Config Alignment

---

**AC-P11-018: Deployment Guide Config Must Match Configuration Spec**

GIVEN: A user follows the deployment guide (`03-deploy/01-deployment-guide.md`) to configure BRun

WHEN: They create a `config.json` based on the deployment guide examples

THEN:
- The config structure MUST match `03-configuration.md` exactly — same sections, same nesting, same key names
- The config search path MUST be consistent: `./config.json`, `~/.brun/config.json`, `/etc/brun/config.json`
- Database configuration (if any) MUST be documented in `03-configuration.md` before being referenced in the deployment guide
- Profile definitions MUST use array format (as in `03-configuration.md`) not object/map format

EDGE CASES:
- If a deployment guide example config is used verbatim and fails to parse, it indicates a spec inconsistency that MUST be resolved before implementation

---

## 4. Remediation Recommendations

| # | Recommendation | Priority | Affected Files |
|---|----------------|----------|----------------|
| R-01 | **Remove string-based RuntimeType** from `01-core-architecture.md` and replace with `runtime.Variant` reference from `19-enum-architecture.md` | 🔴 Critical | `01-core-architecture.md` |
| R-02 | **Convert all camelCase JSON tags to PascalCase** across all Go structs or use tag-omitted pattern (`json:",omitempty"`) | 🔴 Critical | `01-core-architecture.md`, `05-port-management.md`, `06-error-handling.md`, `08-asset-operations.md`, `09-integration-api.md`, `18-reset-api.md` |
| R-03 | **Resolve error code range collision** — relocate "CLI General" codes 7001-7006 to BRun's actual range (e.g., 7100-7105 or add a dedicated sub-range 7050-7099) | 🔴 Critical | `06-error-handling.md`, central error registry |
| R-04 | **Resolve settings service error code collision** — relocate BR-7200+ settings codes to an unused sub-range (e.g., 7550-7569) to avoid collision with Runtime Execution 7200-7299 | 🔴 Critical | `17-settings-service.md` |
| R-05 | **Resolve reset API error code collision** — relocate BR-7401+ reset codes to avoid collision with Build Process 7400-7499 (e.g., use 7570-7589) | 🔴 Critical | `18-reset-api.md` |
| R-06 | **Designate 16-database-architecture.md as authoritative** and mark `10-data-models.md` as deprecated/superseded — the Split DB pattern is the correct architecture | 🔴 Critical | `10-data-models.md`, `16-database-architecture.md` |
| R-07 | **Remove raw SQL** from `10-data-models.md` database initialization and repository queries — use GORM methods exclusively | 🔴 Critical | `10-data-models.md` |
| R-08 | **Remove duplicate BrunError struct** from `09-integration-api.md` — reference the canonical definition in `06-error-handling.md` | 🔴 Critical | `09-integration-api.md` |
| R-09 | **Rewrite implementation guide** (`14-implementation-guide.md`) to use PascalCase JSON tags and reference `16-database-architecture.md` instead of `10-data-models.md` | 🔴 Critical | `14-implementation-guide.md` |
| R-10 | **Align JSON Schema with Go struct tags** — update the JSON Schema in `03-configuration.md` to use PascalCase property names, and update all example JSON to match | 🔴 Critical | `03-configuration.md` |
| R-11 | **Align deployment guide with configuration spec** — fix config search path (`~/.brun/` not `~/.config/brun/`), remove non-existent `database` section, match profile format (array not object) | 🔴 Critical | `03-deploy/01-deployment-guide.md` |
| R-12 | **Convert string-based enums** in `15-observability.md` (HealthStatus), `17-settings-service.md` (ConfigCategory), and `04-runtime-executors.md` (ErrorPattern.Severity) to byte variant pattern | 🟡 Warning | `15-observability.md`, `17-settings-service.md`, `04-runtime-executors.md` |
| R-13 | **Update SQL schema comments** in `16-database-architecture.md` to reference enum types instead of listing string values | 🟡 Warning | `16-database-architecture.md` |
| R-14 | **Update testing strategy** to use Split DB models and enum types instead of Single DB models and string literals | 🟡 Warning | `13-testing-strategy.md` |
| R-15 | **Update all JSON output examples** in `02-cli-interface.md`, `08-asset-operations.md`, and `03-deploy/01-deployment-guide.md` to use PascalCase keys | 🟡 Warning | `02-cli-interface.md`, `08-asset-operations.md`, `03-deploy/01-deployment-guide.md` |
| R-16 | **Update consistency report** to reflect all 26 files and correct the JSON naming standard from camelCase to PascalCase | 🟡 Warning | `99-consistency-report.md` |
| R-17 | **Fix stale cross-reference** in deployment guide from `../22-golang-search-cli/` to `../../20-gsearch-cli/` | 🟡 Warning | `03-deploy/01-deployment-guide.md` |
| R-18 | **Update 00-overview.md folder structure** to include files 16-19 | 🟠 Minor | `00-overview.md` |
| R-19 | **Standardize ID field naming** — use `Id` (project convention: acronyms as words) not `ID` across all structs | 🟠 Minor | `09-integration-api.md` |
| R-20 | **Update seedable config** keys to PascalCase in frontend architecture | 🟡 Warning | `02-frontend/01-frontend-architecture.md` |

---

## 5. Summary Statistics

| Metric | Count |
|--------|-------|
| **Total Inconsistencies** | 42 |
| **Critical (🔴)** | 17 |
| **Warning (🟡)** | 19 |
| **Minor (🟠)** | 6 |
| **Acceptance Criteria** | 18 |
| **Remediation Recommendations** | 20 |

### Issue Category Breakdown

| Category | Count |
|----------|-------|
| camelCase JSON violations | 14 |
| Error code collisions | 3 |
| String-based enum violations | 5 |
| Single DB vs Split DB conflicts | 4 |
| Cross-reference / config mismatches | 6 |
| Duplicate/stale definitions | 5 |
| Raw SQL violations | 2 |
| Other structural issues | 3 |

---

## 6. Remaining Phases

| Phase | Focus | Status |
|-------|-------|--------|
| ~~**Phase 11**~~ | ~~BRun CLI~~ | ✅ **Complete** |
| **Phase 12** | AI Bridge Core (00-14) | ⏳ Pending |
| **Phase 13** | AI Bridge SEO (15-30) | ⏳ Pending |
| **Phase 14** | AI Bridge Advanced (31-55) | ⏳ Pending |
| **Phase 15** | Nexus Flow CLI | ⏳ Pending |
| **Phase 16** | WP Plugins, Builder, SEO Pub, Spec Rev | ⏳ Pending |
| **Phase 17** | AI Transcribe & AI Research | ⏳ Pending |

---

*Phase 11 audit completed. 42 inconsistencies found (17 critical), 18 acceptance criteria written, 20 remediation recommendations issued.*
