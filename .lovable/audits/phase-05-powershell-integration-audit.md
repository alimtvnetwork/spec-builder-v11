# Phase 5: PowerShell Integration v1/v2 Audit

**Date:** 2026-02-07  
**Auditor:** AI  
**Scope:** `spec/06-powershell-integration-v1/`, `spec/06-powershell-integration-v2/`  
**Files Reviewed:** 13 (+ 6 template/schema/example files)  
**Status:** Complete

---

## 1. Inconsistency Report

| # | File(s) | Description | Severity |
|---|---------|-------------|----------|
| I-01 | v1 `00-overview.md` line 6, v2 `00-overview.md` line 7 | **Stale location reference.** Both state `Location: spec/powershell-integration/` but actual paths are `spec/06-powershell-integration-v1/` and `spec/06-powershell-integration-v2/`. | 🔴 Critical |
| I-02 | v1 `00-overview.md` lines 209-211 | **Stale cross-references.** References `spec/spec-management-software/` and `link-manager/` — neither matches current folder structure (`spec/11-spec-management-software/`, and Link Manager is under `spec/30-wp-plugin/`). | 🟡 Warning |
| I-03 | v1 `02-script-reference.md` lines 312-322, v2 `02-script-reference.md` lines 399-411 | **Exit code conflict.** v1 defines exit codes 0-4; v2 defines exit codes 0-6. Yet v1's `04-error-codes.md` already defines codes 5-10 (ERR_CONFIG_MISSING through ERR_FIREWALL). The script reference and error codes doc disagree on exit code mapping. | 🔴 Critical |
| I-04 | v1 `02-script-reference.md` line 149 | **Hardcoded project name in firewall rule.** `$ruleName = "LLM Runner (Go Backend) TCP $p"` — hardcodes "LLM Runner" instead of using `$config.projectName`. v2 fixes this to `"$ProjectName (Go Backend) TCP $p"` but v1 still has the hardcoded version. | 🟡 Warning |
| I-05 | v1 `05-firewall-rules.md` line 37, v2 `05-firewall-rules.md` line 37 | **Identical content.** Both v1 and v2 `05-firewall-rules.md` are virtually identical (same "LLM Runner" hardcoded DisplayName). v2 should use `$ProjectName` but still shows "LLM Runner" in examples and implementation. | 🟡 Warning |
| I-06 | v1 `04-error-codes.md` lines 2-3 vs v2 `04-error-codes.md` lines 2-3 | **v2 error codes still reference npm.** Error names `ERR_NPM_INSTALL` and `ERR_NPM_BUILD` remain in v2 exit codes table, but v2 uses pnpm. Should be `ERR_PNPM_INSTALL` and `ERR_PNPM_BUILD`. Similarly, 9520 range still uses `ERR_NPM_INSTALL_FAILED` / `ERR_NPM_BUILD_FAILED`. | 🟡 Warning |
| I-07 | v2 `00-overview.md` line 22 | **Missing "WP Plugin Publish" from project list.** v2 overview mentions "WP Plugin Publish" and "Spec Management Software" but doesn't mention GSearch, BRun, AI Bridge, Nexus Flow, AI Transcribe, or the other CLIs that also follow this spec. | 🟠 Minor |
| I-08 | v1 `01-configuration-schema.md` line 23 | **v1 schema only requires `projectName` and `backendDir`.** v2 adds `version`, `usePnp`, `pnpmStorePath`, `installCommand`, `requiredModules`, and `env` fields. No migration guide exists for projects upgrading from v1 to v2 config schema. | 🟡 Warning |
| I-09 | v2 `02-script-reference.md` lines 299-317 | **Unclosed code block.** The "Step 4: Frontend Build" section has a broken code block — `Pop-Location` appears outside the block, followed by a `---` and "Important Notes" section nested inside what appears to be a broken fence. | 🔴 Critical |
| I-10 | v1 `00-overview.md` lines 172-182 | **Stale cross-reference paths.** References `../../powershell-integration/00-overview.md` and `../../../spec/powershell-integration/00-overview.md` — these are relative paths that don't match the actual `06-powershell-integration-v1/` location. | 🟡 Warning |
| I-11 | v1/v2 `04-error-codes.md` line 11 | **Error code range 9500-9599 conflicts.** The PowerShell error range 9500-9599 overlaps with the central error code registry where PS (Spec Reverse CLI) uses 9500-9999. The `spec/03-error-code-registry/` assigns 9500 to a different tool. | 🔴 Critical |
| I-12 | v2 `01-configuration-schema.md` line 90 | **Default pnpmStorePath is drive-letter specific.** Default `"E:/.pnpm-store"` is Windows drive-specific and will fail on systems without an E: drive. Should default to a portable path like `.pnpm-store` (relative). | 🟠 Minor |
| I-13 | v1 `03-integration-guide.md` lines 273, 280 | **Stale spec path references.** References `30-powershell-integration/` and `spec/powershell-integration/` — neither is the current folder name. | 🟡 Warning |
| I-14 | v2 `02-script-reference.md` line 60 | **OperationType enum in DBOperation wrapper uses `string` type.** `type OperationType string` in `13-shared-packages/06-pkg-database-operations.md` violates the enum specification which mandates `type Variant byte`. | 🟡 Warning (cross-ref) |

---

## 2. Missing Acceptance Criteria

All 13 files in Phase 5 lack formal GIVEN/WHEN/THEN acceptance criteria.

| File | Has AC? |
|------|---------|
| v1/v2 `00-overview.md` | ❌ |
| v1/v2 `01-configuration-schema.md` | ❌ |
| v1/v2 `02-script-reference.md` | ❌ |
| v1/v2 `03-integration-guide.md` | ❌ |
| v1/v2 `04-error-codes.md` | ❌ |
| v1/v2 `05-firewall-rules.md` | ❌ |
| v2 `CHANGELOG.md` | N/A (changelog) |

---

## 3. Detailed Acceptance Criteria

### 3.1 Configuration Loading

---

**AC-P5-001: Configuration File Discovery and Parsing**

GIVEN: A `powershell.json` file exists in the same directory as `run.ps1`

WHEN: `.\run.ps1` is executed

THEN:
- The script MUST locate `powershell.json` relative to its own path (`$MyInvocation.MyCommand.Path`)
- The file MUST be parsed as valid JSON
- Required fields `projectName` and `backendDir` MUST be validated as non-empty strings
- If `powershell.json` is missing, the script MUST exit with code 5 and print `ERROR [9500]: powershell.json not found in project root`
- If JSON parsing fails, the script MUST exit with code 6 and print `ERROR [9501]: Failed to parse powershell.json: {details}`
- If `backendDir` path does not exist on disk, the script MUST exit with code 7 and print `ERROR [9503]: Path '{path}' in config does not exist`
- Optional fields MUST use defaults: `rootDir="."`, `frontendDir="."`, `distDir="dist"`, `ports=[8080]`

EDGE CASES:
- A `powershell.json` with valid JSON but containing only `{}` (empty object) MUST fail with code 6 for missing required fields
- A `powershell.json` with a BOM (Byte Order Mark) at the start MUST still parse correctly
- If `backendDir` is an absolute path outside the project root, validation MUST still pass (paths are not restricted to the project tree)

---

**AC-P5-002: Configuration Schema Upgrade (v1 to v2)**

GIVEN: A project has a v1 `powershell.json` without `version`, `usePnp`, or `pnpmStorePath` fields

WHEN: The v2 `run.ps1` script processes this config

THEN:
- Missing `usePnp` MUST default to `true`
- Missing `pnpmStorePath` MUST default to `E:/.pnpm-store` (or a portable default)
- Missing `installCommand` MUST default to `pnpm install`
- Missing `buildCommand` MUST default to `pnpm run build`
- The script MUST NOT require a `version` field — absence is valid
- v1 configs with `prerequisites.npm: true` MUST be treated as equivalent to `prerequisites.pnpm: true` in v2

EDGE CASES:
- A config with `"usePnp": false` MUST fall back to npm-style `node_modules` behavior
- A config with both `prerequisites.npm: true` and `prerequisites.pnpm: true` MUST install pnpm and use it (pnpm takes priority)

---

### 3.2 Pipeline Execution

---

**AC-P5-003: Five-Step Pipeline Execution Order**

GIVEN: A valid `powershell.json` exists and all prerequisites are installed

WHEN: `.\run.ps1` is executed with no flags

THEN:
- Step 1 (Git Pull): MUST execute `git pull` in `$RootDir` if `.git` exists; skip silently if no `.git` directory
- Step 2 (Prerequisites): MUST check `go`, `node`, and `pnpm` (v2) or `npm` (v1) are in PATH; auto-install via winget if missing
- Step 3 (Install): MUST run `pnpm install` (v2) or `npm install` (v1) in `$FrontendDir` if `node_modules` is missing (or `.pnp.cjs` for PnP)
- Step 4 (Build): MUST run the `buildCommand` in `$FrontendDir`
- Step 5 (Copy & Run): MUST copy `$DistDir` to `$TargetDir`, create config from example if missing, then run `$RunCommand` in `$BackendDir`
- Each step MUST display a header `[N/5] Step description...`
- Each step MUST display elapsed time with format `⏱ N.Ns` or `⏱ Nm N.Ns`
- The overall build time MUST be displayed at the end

EDGE CASES:
- If `git pull` fails (non-zero exit), the script MUST warn but continue (non-fatal)
- If `npm install` / `pnpm install` fails, the script MUST exit with code 2
- If build fails, the script MUST exit with code 3
- If `go run` fails to start, the script MUST exit with code 4

---

**AC-P5-004: Flag Combinations**

GIVEN: A valid project configuration

WHEN: Various flag combinations are provided

THEN:
- `-SkipPull` / `-p`: MUST skip Step 1 entirely
- `-SkipBuild` / `-s`: MUST skip Steps 3 and 4, go directly to Step 5 (run backend)
- `-BuildOnly` / `-b`: MUST execute Steps 1-4 and copy dist, but NOT start the backend
- `-Force` / `-f`: MUST remove all paths listed in `cleanPaths` before installing; MUST trigger full reinstall
- `-Install` / `-i` (v2 only): MUST run `pnpm install` and `go mod tidy`, then exit without building
- `-Rebuild` / `-r` (v2 only): MUST force-clean first, then install, then build/run
- `-OpenFirewall` / `-fw`: MUST create firewall rules for all configured ports (requires Admin)
- `-Help` / `-h`: MUST display usage and exit with code 0
- `-SkipPull -Force`: MUST skip git pull but still clean and rebuild
- `-BuildOnly -SkipBuild`: These are contradictory; `-BuildOnly` MUST take precedence (build but don't run)

EDGE CASES:
- `-Force` with `cleanPaths` containing glob patterns (e.g., `*.db`) MUST resolve globs before deletion
- `-Force` when `node_modules` doesn't exist MUST not error (silently skip)
- `-OpenFirewall` without Admin MUST print a warning and skip firewall setup without exiting

---

### 3.3 Prerequisite Auto-Install

---

**AC-P5-005: Prerequisite Detection and Installation**

GIVEN: The `prerequisites` config is `{ "go": true, "node": true, "pnpm": true }`

WHEN: Step 2 (Prerequisites) executes

THEN:
- For each prerequisite where the config value is `true`:
  - The script MUST check if the command exists in PATH using `Get-Command`
  - If missing, MUST attempt installation via `winget install` (Go, Node.js) or `npm install -g pnpm` (pnpm)
  - After installation, PATH MUST be refreshed by re-reading Machine and User PATH variables
  - The installed version MUST be verified by re-running `Get-Command`
- If `winget` is not available, the script MUST exit with code 1 and print `ERROR [9510]`
- If installation fails, the script MUST exit with code 1

EDGE CASES:
- If Go is installed but not in PATH (common after fresh install), refreshing PATH MUST resolve the issue without requiring a terminal restart
- If `prerequisites.go` is `false`, Go check MUST be skipped entirely even if `runCommand` uses `go run`
- On systems where `winget` requires source agreement acceptance, the `--accept-package-agreements --accept-source-agreements` flags MUST be included

---

### 3.4 Firewall Rules

---

**AC-P5-006: Firewall Rule Creation**

GIVEN: The script is run with `-OpenFirewall` flag as Administrator with `ports: [8080, 8081]`

WHEN: `Ensure-FirewallRules` is called

THEN:
- For each port, an inbound TCP rule MUST be created with:
  - DisplayName: `{ProjectName} (Go Backend) TCP {port}` (v2) or `LLM Runner (Go Backend) TCP {port}` (v1)
  - Direction: Inbound
  - Action: Allow
  - Protocol: TCP
  - Profile: Private, Domain (NOT Public)
- If a rule with the same DisplayName already exists, it MUST NOT be recreated (idempotent)
- Each created rule MUST produce `✓ Firewall rule added: {ruleName}` in Green
- Each existing rule MUST produce `✓ Firewall rule exists: {ruleName}` in Green

EDGE CASES:
- If not running as Administrator, MUST print a Yellow warning and return without error (non-fatal)
- If `New-NetFirewallRule` cmdlet is not available (older PS versions), MUST warn and return
- Ports outside 1-65535 range MUST be validated and rejected with `ERROR [9504]`

---

### 3.5 Force Clean

---

**AC-P5-007: Force Clean Build**

GIVEN: `cleanPaths` is configured as `["node_modules", "dist", ".vite", ".pnp.cjs", "backend/data/*.db"]`

WHEN: `.\run.ps1 -Force` is executed

THEN:
- Each path in `cleanPaths` MUST be resolved relative to `$RootDir`
- Directories MUST be removed recursively with `-Recurse -Force`
- Glob patterns (e.g., `*.db`) MUST be expanded and each matching file deleted
- Files that don't exist MUST be silently skipped (no error)
- For v2: `pnpm store prune` MUST be called after cleaning to remove unused packages
- After cleaning, a full install + build cycle MUST run

EDGE CASES:
- If a file in `cleanPaths` is locked by another process, the script MUST warn but continue cleaning remaining paths
- If `cleanPaths` is not defined in config, `-Force` MUST still work by using default clean targets (`node_modules`, `dist`, `.vite`)
- If `pnpm store prune` fails (store path doesn't exist), it MUST warn but not exit

---

### 3.6 pnpm PnP Mode (v2 Only)

---

**AC-P5-008: pnpm Store Configuration and PnP Mode**

GIVEN: `usePnp: true` and `pnpmStorePath: "E:/.pnpm-store"` in v2 config

WHEN: Step 3 (pnpm Install) executes

THEN:
- `pnpm config set store-dir {resolvedStorePath}` MUST be called before install
- `pnpm install` MUST be executed in `$FrontendDir`
- If pnpm v10+ is detected, `--dangerously-allow-all-builds` MUST be appended to the install command
- If Node.js v24+ is detected OR the store is on a different drive than the project, the script MUST fall back to `node-linker=isolated` mode instead of PnP
- After install, if `requiredModules` is configured, each module MUST be verified to exist; if any are missing, install MUST be re-triggered

EDGE CASES:
- If `pnpmStorePath` is a relative path (e.g., `.pnpm-store`), it MUST be resolved relative to `$RootDir`
- If the store directory doesn't exist, pnpm MUST create it automatically (no pre-creation needed)
- If `usePnp: false`, the script MUST use standard `node_modules` mode (equivalent to npm)

---

## 4. Remediation Recommendations

| # | Priority | Recommendation |
|---|----------|----------------|
| R-01 | 🔴 High | Fix error code range conflict: PowerShell uses 9500-9599 but this collides with Spec Reverse CLI (PS) range 9500-9999 in the central registry. Reassign PowerShell to an unused range or document coexistence rules. |
| R-02 | 🔴 High | Fix the broken code block in v2 `02-script-reference.md` lines 299-317 (Step 4). |
| R-03 | 🔴 High | Reconcile exit codes between `02-script-reference.md` and `04-error-codes.md` in both v1 and v2. |
| R-04 | 🟡 Medium | Update all `Location:` headers and internal cross-references to use actual folder names (`spec/06-powershell-integration-v1/`, `spec/06-powershell-integration-v2/`). |
| R-05 | 🟡 Medium | Rename npm-specific error codes in v2 to pnpm equivalents (`ERR_PNPM_INSTALL`, `ERR_PNPM_BUILD`). |
| R-06 | 🟡 Medium | Replace hardcoded "LLM Runner" in v1/v2 firewall examples with `$ProjectName` variable. |
| R-07 | 🟡 Medium | Create a migration guide for v1→v2 config schema upgrade. |
| R-08 | 🟠 Low | Change default `pnpmStorePath` from `E:/.pnpm-store` to `.pnpm-store` for portability. |
| R-09 | 🟡 Medium | Consider deprecating v1 entirely since v2 is a superset. Add a `DEPRECATED.md` notice to v1. |

---

## Cross-References

| Resource | Location |
|----------|----------|
| PowerShell Integration v1 | `spec/06-powershell-integration-v1/` |
| PowerShell Integration v2 | `spec/06-powershell-integration-v2/` |
| Error Code Registry | `spec/03-error-code-registry/` |
| Shared CLI Frontend | `spec/28-shared-cli-frontend/` |

---

*Phase 5 audit complete. 14 inconsistencies found, 8 acceptance criteria generated.*
