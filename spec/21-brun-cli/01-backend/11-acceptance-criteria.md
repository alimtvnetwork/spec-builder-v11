# BRun CLI: Acceptance Criteria

**Version:** 4.0.0  
**Status:** Active  
**Updated:** 2026-03-09  
**Format:** GIVEN/WHEN/THEN (E2E-test-ready)

---

## Cross-References

- [CLI Interface](./02-cli-interface.md)
- [Error Handling](./06-error-handling.md)
- [Integration API](./09-integration-api.md)

---

## Core Functionality

### BR-01: CLI Binary Compilation

**GIVEN** the BRun source code on Windows, Linux, or macOS  
**WHEN** `go build` is executed  
**THEN** the binary compiles without errors  
**AND** the output binary is executable on the target platform

### BR-02: Help Output

**GIVEN** the BRun binary is available  
**WHEN** `brun --help` is executed  
**THEN** all commands and flags are displayed with descriptions  
**AND** the output matches the documented CLI interface specification

### BR-03: Version Output

**GIVEN** the BRun binary is built with version ldflags  
**WHEN** `brun --version` is executed  
**THEN** the correct semantic version number is displayed

### BR-04: Exit Codes

**GIVEN** a build command completes  
**WHEN** the process exits  
**THEN** the exit code matches the documented values (0=success, 1=build error, 2=config error, 3=runtime error)

**Edge Cases:**
- **GIVEN** multiple errors occur **WHEN** the process exits **THEN** the highest-priority exit code is used
- **GIVEN** the process is interrupted via SIGINT **WHEN** cleanup runs **THEN** exit code 130 is returned

### BR-05: JSON Output

**GIVEN** `--output json` flag is set  
**WHEN** any command completes  
**THEN** stdout contains valid, parseable JSON matching the documented schema  
**AND** human-readable output goes to stderr only

---

## Configuration

### CF-01: Default Config Loading

**GIVEN** a `config.json` exists in the default search paths (CWD, `~/.config/brun/`)  
**WHEN** BRun starts without `--config` flag  
**THEN** the configuration is loaded from the first matching path

**Edge Cases:**
- **GIVEN** no config file exists in any default path **WHEN** BRun starts **THEN** built-in defaults are used and a warning is logged

### CF-02: Config Override via Flag

**GIVEN** a config file at `/custom/path/config.json`  
**WHEN** `brun --config /custom/path/config.json` is executed  
**THEN** the specified config file is loaded instead of defaults

### CF-03: Environment Variable Override

**GIVEN** a config value `port: 5020` exists in config.json  
**WHEN** environment variable `BRUN_PORT=5030` is set  
**THEN** the port value is overridden to 5030

### CF-04: Invalid Config Handling

**GIVEN** a config.json with invalid JSON syntax or schema violations  
**WHEN** BRun attempts to load it  
**THEN** a clear error message is displayed with the specific validation failure  
**AND** the exit code is 2 (config error)

### CF-05: Config Validate Command

**GIVEN** a config.json file  
**WHEN** `brun config validate` is executed  
**THEN** all schema violations are reported with field paths and expected types  
**AND** exit code 0 for valid, 2 for invalid

### CF-06: Config Init Command

**GIVEN** no config.json exists  
**WHEN** `brun config init` is executed  
**THEN** a valid default config file is created in the current directory  
**AND** the file passes `brun config validate`

---

## Runtime Executors

### RT-01: PowerShell Executor (Windows)

**GIVEN** PowerShell is installed on Windows  
**WHEN** a build profile specifies `executor: "powershell"`  
**THEN** the script is executed via `powershell.exe` with the configured arguments  
**AND** stdout/stderr are captured and streamed

### RT-02: PowerShell Executor (Linux/macOS)

**GIVEN** `pwsh` (PowerShell Core) is installed on Linux or macOS  
**WHEN** a build profile specifies `executor: "powershell"`  
**THEN** the script is executed via `pwsh` instead of `powershell.exe`

### RT-03: Node.js Executor

**GIVEN** Node.js is installed with a package manager (npm, yarn, or bun)  
**WHEN** a build profile specifies `executor: "node"` with `packageManager: "pnpm"`  
**THEN** the build command is executed via `pnpm run build`

**Edge Cases:**
- **GIVEN** the specified package manager is not installed **WHEN** the executor runs **THEN** available alternatives are suggested in the error message

### RT-04: Go Executor

**GIVEN** Go is installed  
**WHEN** a build profile specifies `executor: "go"` with build flags  
**THEN** `go build` is executed with the specified flags and output path

### RT-05: Go Mod Tidy Handling

**GIVEN** Go executor is configured with `modTidy: "run"`  
**WHEN** the build starts  
**THEN** `go mod tidy` runs before `go build`

**Edge Cases:**
- **GIVEN** `modTidy: "skip"` **WHEN** the build starts **THEN** `go mod tidy` is not executed
- **GIVEN** `modTidy: "force"` **WHEN** `go mod tidy` fails **THEN** the build is aborted with the tidy error

### RT-06: Executor Timeout

**GIVEN** a build command is running  
**WHEN** the configured timeout (e.g., 300s) is exceeded  
**THEN** the process is terminated via SIGTERM  
**AND** after 10s grace period, SIGKILL is sent if still running  
**AND** a timeout error with the elapsed time is reported

**Edge Cases:**
- **GIVEN** the OS is Windows **WHEN** SIGTERM is sent **THEN** `taskkill` is used instead since Windows does not support POSIX signals, and the process tree is terminated

### RT-07: Runtime Not Found

**GIVEN** a build profile requires a runtime (e.g., Go, Node.js)  
**WHEN** the runtime binary is not found in PATH  
**THEN** a clear error "Runtime not found: {name}" is displayed with installation guidance

### RT-08: Runtime Version Detection

**GIVEN** a runtime is available  
**WHEN** `brun --health` or version detection runs  
**THEN** the runtime name and version are reported (e.g., "Go 1.22.1", "Node 20.11.0")

---

## Error Handling

### EH-01: Go Compile Error Parsing

**GIVEN** a Go build fails with compilation errors  
**WHEN** the error output is parsed  
**THEN** each error includes: file path, line number, column number, and error message  
**AND** the errors are structured in JSON for AI consumption

### EH-02: TypeScript Error Parsing

**GIVEN** a TypeScript/frontend build fails  
**WHEN** the error output is parsed  
**THEN** TypeScript diagnostic errors are extracted with file, line, and message

### EH-03: PowerShell Error Capture

**GIVEN** a PowerShell script fails  
**WHEN** the error is captured  
**THEN** the PowerShell error record (message, category, position) is included in the structured output

### EH-04: Stack Trace Capture

**GIVEN** a runtime error occurs (not compile error)  
**WHEN** a stack trace is available  
**THEN** up to 40 frames are captured and included in the error output

### EH-05: JSON Error Output Schema

**GIVEN** `--output json` is set  
**WHEN** any error occurs  
**THEN** the JSON output matches the documented error schema with `code`, `message`, `errors[]`, and `stack`

### EH-06: Log File Creation

**GIVEN** a build run starts  
**WHEN** the configured log directory exists  
**THEN** a log file is created at `{logDir}/{runId}/build.log` with all stdout/stderr output

### EH-07: Dynamic Run IDs

**GIVEN** multiple builds are executed  
**WHEN** each build starts  
**THEN** a unique run ID is generated (format: `{timestamp}-{random}`)  
**AND** no two runs share the same ID

### EH-08: Log Cleanup

**GIVEN** `keepRuns: 10` is configured  
**WHEN** the 11th build completes  
**THEN** the oldest run folder is deleted  
**AND** exactly 10 run folders remain

**Edge Cases:**
- **GIVEN** a run folder is locked by another process **WHEN** cleanup runs **THEN** the locked folder is skipped and cleanup continues with the next oldest

---

## Port Management

### PM-01: Port Availability Check

**GIVEN** BRun is starting up  
**WHEN** the configured port is checked  
**THEN** if available, the server binds to it; if occupied, the process name and PID of the occupying process are reported

### PM-02: Port Fallback

**GIVEN** the primary port (e.g., 5020) is occupied  
**WHEN** fallback is enabled in config  
**THEN** the next available port in the range is used  
**AND** the actual bound port is logged and reported in health output

### PM-03: Process Identification

**GIVEN** a port is occupied  
**WHEN** BRun checks the port  
**THEN** the process name and PID using the port are identified and displayed

### PM-04: Port Check Command

**GIVEN** BRun is available  
**WHEN** `brun port --check` is executed  
**THEN** a JSON response with port number, availability status, and occupying process (if any) is returned

### PM-05: Firewall Enable (Windows)

**GIVEN** BRun runs on Windows with admin privileges  
**WHEN** `brun port --firewall enable` is executed  
**THEN** a `netsh advfirewall` inbound rule is created for the configured port

### PM-06: Firewall Enable (Linux)

**GIVEN** BRun runs on Linux with sudo access  
**WHEN** `brun port --firewall enable` is executed  
**THEN** a `ufw` or `iptables` rule is created for the configured port

### PM-07: Firewall List

**GIVEN** firewall rules have been created by BRun  
**WHEN** `brun port --list` is executed  
**THEN** all BRun-managed rules are displayed with port, protocol, and creation date

---

## Build Profiles

### BP-01: Profile Execution

**GIVEN** a build profile `dev` is configured  
**WHEN** `brun build --profile dev` is executed  
**THEN** the profile's executor, commands, flags, and environment variables are applied

### BP-02: Profile Not Found

**GIVEN** no profile named `staging` exists  
**WHEN** `brun build --profile staging` is executed  
**THEN** a clear error "Profile not found: staging" is displayed with available profile names listed

### BP-03: Profile Environment Variables

**GIVEN** a profile defines `env: { "CGO_ENABLED": "0" }`  
**WHEN** the build runs  
**THEN** the environment variable is set for the build process only (not globally)

### BP-04: Pre-Commands

**GIVEN** a profile defines `preCommands: ["go mod tidy", "go generate"]`  
**WHEN** the build runs  
**THEN** pre-commands execute in order before the main build command

**Edge Cases:**
- **GIVEN** a pre-command fails **WHEN** execution is in progress **THEN** the main build is not started and the pre-command error is reported

### BP-05: Post-Commands

**GIVEN** a profile defines `postCommands: ["cp dist/* target/"]`  
**WHEN** the main build succeeds  
**THEN** post-commands execute in order  

**Edge Cases:**
- **GIVEN** the main build fails **WHEN** post-commands are defined **THEN** post-commands are NOT executed

### BP-06: Add Profile Command

**GIVEN** valid profile parameters  
**WHEN** `brun config add-profile --name prod --executor go --flags "-ldflags '-s -w'"` is executed  
**THEN** the profile is saved to `config.json`

### BP-07: Remove Profile Command

**GIVEN** a profile `old` exists  
**WHEN** `brun config remove-profile --name old` is executed  
**THEN** the profile is removed from `config.json`  
**AND** a confirmation message is displayed

---

## Asset Operations

### AO-01: Copy Mode

**GIVEN** asset copy mode is set to `copy`  
**WHEN** the destination directory already contains files  
**THEN** the operation fails with "Destination not empty" error

### AO-02: Clear-Copy Mode

**GIVEN** asset copy mode is set to `clear-copy`  
**WHEN** the operation runs  
**THEN** the destination directory is emptied first  
**AND** source files are copied to the clean destination

### AO-03: Override Mode

**GIVEN** asset copy mode is set to `override`  
**WHEN** the operation runs  
**THEN** existing files at the destination are overwritten  
**AND** new files are added

### AO-04: Skip-Existing Mode

**GIVEN** asset copy mode is set to `skip-existing`  
**WHEN** the operation runs  
**THEN** only files that don't exist at the destination are copied  
**AND** existing files remain unchanged

### AO-05: Pattern Filtering

**GIVEN** an include pattern `*.js` is configured  
**WHEN** asset copy runs  
**THEN** only `.js` files are copied

### AO-06: Exclusion Patterns

**GIVEN** an exclude pattern `*.map` is configured  
**WHEN** asset copy runs  
**THEN** `.map` files are excluded from the copy

### AO-07: Flatten Option

**GIVEN** flatten mode is enabled  
**WHEN** assets from nested directories are copied  
**THEN** all files are placed in a single destination directory (no subdirectories)

**Edge Cases:**
- **GIVEN** flatten mode is on and two files have the same name in different subdirectories **WHEN** copy runs **THEN** a conflict error is reported listing the duplicate filenames

---

## Integration API

### IA-01: JSON Output for Parent Process

**GIVEN** BRun is invoked by a parent process (e.g., AI Bridge)  
**WHEN** the build completes  
**THEN** stdout contains valid JSON with `success`, `errors[]`, `duration`, and `runId`  
**AND** the output is parseable by the parent process

### IA-02: Exit Code Accuracy

**GIVEN** a build fails with a compilation error  
**WHEN** the process exits  
**THEN** exit code 1 is returned (not 0)

### IA-03: AI-Consumable Errors

**GIVEN** a build fails  
**WHEN** `--output json` is used  
**THEN** the `errors[]` array contains structured entries with file, line, column, and message  
**AND** each entry is suitable for AI-driven fix suggestion

### IA-04: Unique Run ID

**GIVEN** two builds are triggered simultaneously  
**WHEN** both complete  
**THEN** each has a distinct `runId`

### IA-05: Duration Format

**GIVEN** a build takes 2 minutes and 15.3 seconds  
**WHEN** the result is returned  
**THEN** `duration` is reported as `"2m15.3s"` (human-readable) and `durationMs: 135300` (machine-readable)

### IA-06: Health Check

**GIVEN** BRun is installed  
**WHEN** `brun --health` is executed  
**THEN** a JSON response lists each runtime with name, version, and availability status

---

## Performance

### PF-01: CLI Startup Time

**GIVEN** no build command is executed (e.g., `brun --version`)  
**WHEN** startup time is measured  
**THEN** it completes in under 100ms

### PF-02: Config Loading Time

**GIVEN** a standard config.json (< 10KB)  
**WHEN** config loading time is measured  
**THEN** it completes in under 50ms

### PF-03: Non-Blocking Error Parsing

**GIVEN** a build produces streaming output  
**WHEN** errors are parsed in real-time  
**THEN** the output stream is not blocked by error parsing  
**AND** results appear progressively

### PF-04: Memory Usage

**GIVEN** a typical build with moderate output (<10MB stdout)  
**WHEN** memory usage is measured  
**THEN** BRun uses less than 50MB of RAM

---

## Cross-Platform

### XP-01: Windows AMD64 Build

**GIVEN** the Go build matrix includes `GOOS=windows GOARCH=amd64`  
**WHEN** the build is executed  
**THEN** a valid `.exe` binary is produced

### XP-02: Linux AMD64 Build

**GIVEN** the Go build matrix includes `GOOS=linux GOARCH=amd64`  
**WHEN** the build is executed  
**THEN** a valid ELF binary is produced

### XP-03: macOS AMD64/ARM64 Build

**GIVEN** the Go build matrix includes macOS targets  
**WHEN** builds for `amd64` and `arm64` are executed  
**THEN** valid Mach-O binaries are produced for both architectures

### XP-04: Path Separator Handling

**GIVEN** file paths are used in build commands  
**WHEN** running on Windows vs Unix  
**THEN** path separators are normalized correctly (`\` vs `/`)

### XP-05: Line Ending Handling

**GIVEN** build output contains mixed line endings  
**WHEN** error parsing runs  
**THEN** both `\r\n` (Windows) and `\n` (Unix) are handled correctly

---

## Database (Optional)

### DB-01: Database Auto-Creation

**GIVEN** BRun starts for the first time with database features enabled  
**WHEN** no database exists  
**THEN** the database is created and migrated automatically

### DB-02: Build Run Persistence

**GIVEN** a build completes (success or failure)  
**WHEN** the result is persisted  
**THEN** the run record includes: runId, profile, duration, success, error count, and timestamp

### DB-03: Old Run Cleanup

**GIVEN** `keepRuns: 10` is configured  
**WHEN** cleanup runs  
**THEN** database records for runs beyond the 10 most recent are deleted  
**AND** associated log files are also deleted

### DB-04: Statistics Query

**GIVEN** multiple build runs are recorded  
**WHEN** `brun stats` is executed  
**THEN** accurate statistics are returned: total runs, success rate, average duration, most common errors

---

## Validation Checklist

### Pre-Release
- [ ] All Critical criteria pass
- [ ] All High criteria pass
- [ ] Integration test with main application passes
- [ ] AI error fixing loop works end-to-end
- [ ] Documentation matches implementation

### Release Candidate
- [ ] All Medium criteria pass
- [ ] Performance benchmarks within targets
- [ ] Cross-platform builds verified
- [ ] No known critical bugs

### General Availability
- [ ] All criteria pass
- [ ] User documentation complete
- [ ] Example configurations provided
- [ ] Error messages user-friendly

---

*Wave 6 — Batch 1 (Patched): BRun CLI acceptance criteria with added Windows SIGTERM/taskkill edge case for RT-06.*
