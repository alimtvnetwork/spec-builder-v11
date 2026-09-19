# Error Handling

**Version:** 2.0.0  
**Status:** Draft  
**Updated:** 2026-03-09  

---

## Overview

Error capture, parsing, and reporting for build processes. Designed for AI-assisted error fixing workflows.

**Cross-References:**
- [Core Architecture](./01-core-architecture.md)
- [Runtime Executors](./04-runtime-executors.md)
- [Integration API](./09-integration-api.md)
- [**Error Code Registry (Centralized)**](../../06-error-management/01-error-code-registry.md) — Authoritative source for all 7xxx error codes

---

## Error Capture Service

### Interface

```go
type ErrorCapture struct {
    logger      *LogService
    runId       string
    logDir      string
    stackParser *StackTraceParser
}

type BuildError struct {
    File       string `json:",omitempty"`
    Line       int    `json:",omitempty"`
    Column     int    `json:",omitempty"`
    Message    string
    Severity   string // error, warning, info
    Code       string `json:",omitempty"` // TS2304, ESLint rule, etc.
    StackTrace string `json:",omitempty"`
    Context    string `json:",omitempty"` // Source code context
}

type ExecutionResult struct {
    RunId     string
    IsSuccess bool
    IsFailed  bool
    ExitCode  int
    Stdout    string
    Stderr    string
    StartTime time.Time
    EndTime   time.Time
    Duration  time.Duration
    Errors    []BuildError `json:",omitempty"`
    Warnings  []BuildError `json:",omitempty"`
    Port      int          `json:",omitempty"`
    LogPath   string       `json:",omitempty"`
}
```

---

## Error Parsing

### Pattern-Based Parsing

```go
type ErrorPattern struct {
    Name     string
    Regex    *regexp.Regexp
    Severity string
    Extract  func(matches []string) BuildError
}

type ErrorParser struct {
    patterns []ErrorPattern
}

func NewGoErrorParser() *ErrorParser {
    return &ErrorParser{
        patterns: []ErrorPattern{
            {
                Name:     "compile_error",
                Regex:    regexp.MustCompile(`^(.+\.go):(\d+):(\d+): (.+)$`),
                Severity: "error",
                Extract: func(m []string) BuildError {
                    line, _ := strconv.Atoi(m[2])
                    col, _ := strconv.Atoi(m[3])
                    return BuildError{
                        File:     m[1],
                        Line:     line,
                        Column:   col,
                        Message:  m[4],
                        Severity: "error",
                    }
                },
            },
            {
                Name:     "undefined",
                Regex:    regexp.MustCompile(`^(.+\.go):(\d+):(\d+): undefined: (.+)$`),
                Severity: "error",
            },
            {
                Name:     "import_error",
                Regex:    regexp.MustCompile(`^package (.+): cannot find package "(.+)"`),
                Severity: "error",
            },
            {
                Name:     "mod_error",
                Regex:    regexp.MustCompile(`^go: (.+)$`),
                Severity: "error",
            },
        },
    }
}

func (p *ErrorParser) Parse(output string) []BuildError {
    var errors []BuildError
    lines := strings.Split(output, "\n")

    for _, line := range lines {
        parsedError := p.parseLine(line)

        if parsedError != nil {
            errors = append(errors, *parsedError)
        }
    }

    return errors
}

func (p *ErrorParser) parseLine(line string) *BuildError {
    for _, pattern := range p.patterns {
        matches := pattern.Regex.FindStringSubmatch(line)
        hasMatch := matches != nil

        if hasMatch {
            return p.extractError(pattern, matches, line)
        }
    }

    return nil
}

func (p *ErrorParser) extractError(pattern ErrorPattern, matches []string, line string) *BuildError {
    hasExtractor := pattern.Extract != nil

    if hasExtractor {
        result := pattern.Extract(matches)
        return &result
    }

    return &BuildError{
        Message:  line,
        Severity: pattern.Severity,
    }
}
```

### Language-Specific Parsers

```go
// TypeScript/JavaScript
var tsPatterns = []ErrorPattern{
    {
        Regex: regexp.MustCompile(`^(.+)\((\d+),(\d+)\): error (TS\d+): (.+)$`),
        Extract: func(m []string) BuildError {
            return BuildError{
                File:    m[1],
                Line:    atoi(m[2]),
                Column:  atoi(m[3]),
                Code:    m[4],
                Message: m[5],
            }
        },
    },
}

// PowerShell
var psPatterns = []ErrorPattern{
    {
        Regex: regexp.MustCompile(`^At (.+):(\d+) char:(\d+)`),
    },
    {
        Regex: regexp.MustCompile(`^\+ (.+)$`), // Error line indicator
    },
}
```

---

## Stack Trace Parsing

```go
type StackTraceParser struct {
    maxDepth int
}

type StackFrame struct {
    Function string
    File     string
    Line     int
    Column   int `json:",omitempty"`
}

func (p *StackTraceParser) ParseGoStack(stack string) []StackFrame {
    var frames []StackFrame
    lines := strings.Split(stack, "\n")

    for i := 0; i < len(lines)-1 && len(frames) < p.maxDepth; i += 2 {
        frame := p.parseFramePair(lines[i], lines[i+1])

        if frame != nil {
            frames = append(frames, *frame)
        }
    }

    return frames
}

func (p *StackTraceParser) parseFramePair(funcLine string, locLine string) *StackFrame {
    funcName := strings.TrimSpace(funcLine)
    location := strings.TrimSpace(locLine)

    isIndented := strings.HasPrefix(location, "\t") || strings.HasPrefix(location, "    ")

    if !isIndented {
        return nil
    }

    frame := &StackFrame{Function: funcName}

    locMatch := regexp.MustCompile(`\s*(.+):(\d+)`).FindStringSubmatch(location)
    hasLocation := len(locMatch) > 0

    if hasLocation {
        frame.File = locMatch[1]
        frame.Line, _ = strconv.Atoi(locMatch[2])
    }

    return frame
}
```

---

## File Logging

### Run Folder Structure

```
logs/
├── run_20260129_143052/
│   ├── log.txt          # stdout
│   ├── error.txt        # stderr + parsed errors
│   ├── combined.txt     # merged output
│   └── meta.json        # run metadata
├── run_20260129_143155/
│   └── ...
└── latest/              # symlink to most recent run
```

### Log Writer

```go
type FileLogger struct {
    baseDir     string
    runId       string
    runDir      string
    stdoutFile  *os.File
    stderrFile  *os.File
    combinedFile *os.File
}

func (l *FileLogger) Initialize() *appfault.AppError {
    l.runId = fmt.Sprintf("run_%s", time.Now().Format("20060102_150405"))
    l.runDir = filepath.Join(l.baseDir, l.runId)

    err := pathutil.EnsureDir(l.runDir)

    if err != nil {
        return appfault.Wrap(
            err,
            "failed to create run directory",
        ).WithSkip(1)
    }

    openErr := l.openLogFiles()

    if openErr != nil {
        return openErr
    }

    l.updateLatestSymlink()
    return nil
}

func (l *FileLogger) openLogFiles() *appfault.AppError {
    var err error

    l.stdoutFile, err = pathutil.Create(filepath.Join(l.runDir, "log.txt"))

    if err != nil {
        return appfault.Wrap(err, "failed to create stdout log").WithSkip(1)
    }

    l.stderrFile, err = pathutil.Create(filepath.Join(l.runDir, "error.txt"))

    if err != nil {
        return appfault.Wrap(err, "failed to create stderr log").WithSkip(1)
    }

    l.combinedFile, err = pathutil.Create(filepath.Join(l.runDir, "combined.txt"))

    if err != nil {
        return appfault.Wrap(err, "failed to create combined log").WithSkip(1)
    }

    return nil
}

func (l *FileLogger) updateLatestSymlink() {
    latestPath := filepath.Join(l.baseDir, "latest")
    pathutil.Remove(latestPath)
    pathutil.Symlink(l.runDir, latestPath)
}

// RunMetadata holds structured metadata for a run result
type RunMetadata struct {
    RunId     string
    IsSuccess bool
    ExitCode  int
    StartTime time.Time
    EndTime   time.Time
    Duration  string
    Errors    int
    Warnings  int
}

func (l *FileLogger) WriteMetadata(result *ExecutionResult) *appfault.AppError {
    meta := RunMetadata{
        RunId:     l.runId,
        IsSuccess: result.IsSuccess,
        ExitCode:  result.ExitCode,
        StartTime: result.StartTime,
        EndTime:   result.EndTime,
        Duration:  result.Duration.String(),
        Errors:    len(result.Errors),
        Warnings:  len(result.Warnings),
    }

    data, err := json.MarshalIndent(meta, "", "  ")

    if err != nil {
        return appfault.Wrap(err, "failed to marshal metadata").WithSkip(1)
    }

    writeErr := pathutil.WriteFile(
        filepath.Join(l.runDir, "meta.json"),
        data,
        0644,
    )

    if writeErr != nil {
        return appfault.Wrap(writeErr, "failed to write metadata").WithSkip(1)
    }

    return nil
}

func (l *FileLogger) Cleanup(keepRuns int) *appfault.AppError {
    entries, err := pathutil.ReadDir(l.baseDir)

    if err != nil {
        return appfault.Wrap(err, "failed to read log directory").WithSkip(1)
    }

    runs := l.filterRunEntries(entries)
    l.removeOldRuns(runs, keepRuns)
    return nil
}

func (l *FileLogger) filterRunEntries(entries []os.DirEntry) []os.DirEntry {
    var runs []os.DirEntry

    for _, e := range entries {
        isRunDir := e.IsDir() && strings.HasPrefix(e.Name(), "run_")

        if isRunDir {
            runs = append(runs, e)
        }
    }

    return runs
}

func (l *FileLogger) removeOldRuns(runs []os.DirEntry, keepRuns int) {
    hasExcess := len(runs) > keepRuns

    if hasExcess {
        for _, run := range runs[:len(runs)-keepRuns] {
            pathutil.RemoveAll(filepath.Join(l.baseDir, run.Name()))
        }
    }
}
```

---

## JSON Output Format

### Full Result

```json
{
  "runId": "run_20260129_143052",
  "success": false,
  "exitCode": 1,
  "startTime": "2026-01-29T14:30:52Z",
  "endTime": "2026-01-29T14:30:55Z",
  "duration": "3.245s",
  "stdout": "Building...\n",
  "stderr": "main.go:15:10: undefined: SomeFunction\n",
  "errors": [
    {
      "file": "main.go",
      "line": 15,
      "column": 10,
      "message": "undefined: SomeFunction",
      "severity": "error",
      "stackTrace": null,
      "context": "    result := SomeFunction()"
    }
  ],
  "warnings": [],
  "logPath": "./logs/run_20260129_143052"
}
```

### Compact Error List (for AI)

```json
{
  "success": false,
  "errorCount": 2,
  "errors": [
    {
      "file": "main.go",
      "line": 15,
      "message": "undefined: SomeFunction"
    },
    {
      "file": "main.go",
      "line": 22,
      "message": "too many arguments to function"
    }
  ]
}
```

---

## Error Code Registry

Following the project's error registry standards, brun uses the **7xxx range** for CLI/Config errors.

> **📋 Canonical Reference:** The authoritative error code definitions are maintained in the [Central Error Code Registry](../../06-error-management/01-error-code-registry.md). This section provides a local reference; for the latest codes and cross-domain consistency, always consult the central registry.

### Error Code Ranges

| Range | Domain | Description |
|-------|--------|-------------|
| 7000-7099 | CLI General | Command-line parsing, flags, arguments |
| 7100-7199 | Configuration | Config file loading, validation, schema |
| 7200-7299 | Runtime Execution | PowerShell, Node.js, Go execution |
| 7300-7399 | Port Management | Port checking, firewall, network |
| 7400-7499 | Build Process | Compilation, linking, asset operations |
| 7500-7599 | Health Check | Application health monitoring |

### Complete Error Code Table

| Code | Constant | Exit | HTTP | Description | Retryable |
|------|----------|------|------|-------------|-----------|
| **CLI General (7000-7099)** |
| 7001 | `ErrBrunInvalidCommand` | 126 | 400 | Unknown or invalid command | No |
| 7002 | `ErrBrunInvalidFlag` | 126 | 400 | Unknown or invalid flag | No |
| 7003 | `ErrBrunMissingArgument` | 126 | 400 | Required argument not provided | No |
| 7004 | `ErrBrunConflictingFlags` | 126 | 400 | Mutually exclusive flags specified | No |
| 7005 | `ErrBrunBinaryNotFound` | 127 | 500 | brun executable not in PATH | No |
| 7006 | `ErrBrunVersionMismatch` | 126 | 400 | Config version incompatible with binary | No |
| **Configuration (7100-7199)** |
| 7101 | `ErrBrunConfigNotFound` | 2 | 404 | config.json not found at path | No |
| 7102 | `ErrBrunConfigParseError` | 2 | 400 | Invalid JSON in config file | No |
| 7103 | `ErrBrunConfigSchemaInvalid` | 2 | 400 | Config does not match JSON schema | No |
| 7104 | `ErrBrunConfigProfileNotFound` | 2 | 404 | Named profile not defined in config | No |
| 7105 | `ErrBrunConfigAppNotFound` | 2 | 404 | Named application not defined in config | No |
| 7106 | `ErrBrunConfigRuntimeInvalid` | 2 | 400 | Invalid runtime type specified | No |
| 7107 | `ErrBrunConfigPathInvalid` | 2 | 400 | Invalid path in configuration | No |
| 7108 | `ErrBrunConfigWriteFailed` | 2 | 500 | Failed to write config file | No |
| 7109 | `ErrBrunConfigPermission` | 6 | 403 | Permission denied reading/writing config | No |
| **Runtime Execution (7200-7299)** |
| 7201 | `ErrBrunRuntimeNotFound` | 3 | 500 | Runtime executable not found (go, node, pwsh) | No |
| 7202 | `ErrBrunRuntimeVersion` | 3 | 500 | Runtime version not supported | No |
| 7203 | `ErrBrunRuntimeCrashed` | 1 | 500 | Runtime process crashed unexpectedly | Yes |
| 7204 | `ErrBrunRuntimeTimeout` | 5 | 408 | Runtime execution exceeded timeout | Yes |
| 7205 | `ErrBrunRuntimePermission` | 6 | 403 | Permission denied executing runtime | No |
| 7206 | `ErrBrunRuntimeSignaled` | 130 | 500 | Runtime killed by signal (SIGINT/SIGTERM) | No |
| 7210 | `ErrBrunGoBuildFailed` | 1 | 422 | Go compilation failed | No |
| 7211 | `ErrBrunGoModTidyFailed` | 8 | 422 | go mod tidy failed | No |
| 7212 | `ErrBrunGoUndefinedSymbol` | 1 | 422 | Undefined variable/function in Go code | No |
| 7213 | `ErrBrunGoImportError` | 1 | 422 | Go import/package not found | No |
| 7220 | `ErrBrunNodeBuildFailed` | 1 | 422 | Node.js/npm build failed | No |
| 7221 | `ErrBrunNodePackageMissing` | 1 | 422 | npm package not installed | No |
| 7222 | `ErrBrunNodeScriptNotFound` | 7 | 404 | npm script not defined in package.json | No |
| 7223 | `ErrBrunTsCompileError` | 1 | 422 | TypeScript compilation error | No |
| 7230 | `ErrBrunPsScriptError` | 1 | 422 | PowerShell script execution error | No |
| 7231 | `ErrBrunPsSyntaxError` | 1 | 422 | PowerShell syntax error | No |
| 7232 | `ErrBrunPsCmdletNotFound` | 1 | 422 | PowerShell cmdlet not found | No |
| **Port Management (7300-7399)** |
| 7301 | `ErrBrunPortUnavailable` | 4 | 409 | Requested port in use, no fallback available | Yes |
| 7302 | `ErrBrunPortPermission` | 6 | 403 | Permission denied binding to port (<1024) | No |
| 7303 | `ErrBrunPortInvalid` | 4 | 400 | Invalid port number (0, >65535) | No |
| 7304 | `ErrBrunFirewallFailed` | 10 | 500 | Firewall rule creation/deletion failed | No |
| 7305 | `ErrBrunFirewallPermission` | 6 | 403 | Insufficient privileges for firewall ops | No |
| 7306 | `ErrBrunFirewallNotFound` | 10 | 404 | Firewall rule not found for deletion | No |
| 7307 | `ErrBrunNetworkUnreachable` | 4 | 503 | Network interface not available | Yes |
| **Build Process (7400-7499)** |
| 7401 | `ErrBrunBuildFailed` | 1 | 422 | General build failure | No |
| 7402 | `ErrBrunSourceNotFound` | 7 | 404 | Source path does not exist | No |
| 7403 | `ErrBrunOutputDirFailed` | 7 | 500 | Cannot create output directory | No |
| 7404 | `ErrBrunAssetCopyFailed` | 9 | 500 | Asset copy operation failed | No |
| 7405 | `ErrBrunAssetClearFailed` | 9 | 500 | Asset clear operation failed | No |
| 7406 | `ErrBrunAssetSourceMissing` | 7 | 404 | Asset source path not found | No |
| 7407 | `ErrBrunWorkdirNotFound` | 7 | 404 | Working directory does not exist | No |
| 7408 | `ErrBrunWorkdirPermission` | 6 | 403 | Working directory not accessible | No |
| 7409 | `ErrBrunExternalDirBlocked` | 6 | 403 | External directory access denied (allowExternalDirs=false) | No |
| 7410 | `ErrBrunPathTraversal` | 6 | 403 | Path traversal attempt blocked | No |
| **Health Check (7500-7599)** |
| 7501 | `ErrBrunHealthTimeout` | 5 | 408 | Health check did not pass in time | Yes |
| 7502 | `ErrBrunHealthFailed` | 1 | 503 | Health check endpoint returned error | Yes |
| 7503 | `ErrBrunHealthUnreachable` | 1 | 503 | Health check endpoint unreachable | Yes |
| 7504 | `ErrBrunHealthStatusMismatch` | 1 | 422 | Unexpected HTTP status from health endpoint | No |
| 7505 | `ErrBrunHealthBodyMismatch` | 1 | 422 | Health response body did not match expected | No |

### Error Code Implementation

```go
package errors

// Error code constants for brun CLI
const (
    // CLI General (7000-7099)
    ErrBrunInvalidCommand    = 7001
    ErrBrunInvalidFlag       = 7002
    ErrBrunMissingArgument   = 7003
    ErrBrunConflictingFlags  = 7004
    ErrBrunBinaryNotFound    = 7005
    ErrBrunVersionMismatch   = 7006
    
    // Configuration (7100-7199)
    ErrBrunConfigNotFound       = 7101
    ErrBrunConfigParseError     = 7102
    ErrBrunConfigSchemaInvalid  = 7103
    ErrBrunConfigProfileNotFound = 7104
    ErrBrunConfigAppNotFound    = 7105
    ErrBrunConfigRuntimeInvalid = 7106
    ErrBrunConfigPathInvalid    = 7107
    ErrBrunConfigWriteFailed    = 7108
    ErrBrunConfigPermission     = 7109
    
    // Runtime Execution (7200-7299)
    ErrBrunRuntimeNotFound   = 7201
    ErrBrunRuntimeVersion    = 7202
    ErrBrunRuntimeCrashed    = 7203
    ErrBrunRuntimeTimeout    = 7204
    ErrBrunRuntimePermission = 7205
    ErrBrunRuntimeSignaled   = 7206
    ErrBrunGoBuildFailed     = 7210
    ErrBrunGoModTidyFailed   = 7211
    ErrBrunGoUndefinedSymbol = 7212
    ErrBrunGoImportError     = 7213
    ErrBrunNodeBuildFailed   = 7220
    ErrBrunNodePackageMissing = 7221
    ErrBrunNodeScriptNotFound = 7222
    ErrBrunTsCompileError    = 7223
    ErrBrunPsScriptError     = 7230
    ErrBrunPsSyntaxError     = 7231
    ErrBrunPsCmdletNotFound  = 7232
    
    // Port Management (7300-7399)
    ErrBrunPortUnavailable     = 7301
    ErrBrunPortPermission      = 7302
    ErrBrunPortInvalid         = 7303
    ErrBrunFirewallFailed      = 7304
    ErrBrunFirewallPermission  = 7305
    ErrBrunFirewallNotFound    = 7306
    ErrBrunNetworkUnreachable  = 7307
    
    // Build Process (7400-7499)
    ErrBrunBuildFailed        = 7401
    ErrBrunSourceNotFound     = 7402
    ErrBrunOutputDirFailed    = 7403
    ErrBrunAssetCopyFailed    = 7404
    ErrBrunAssetClearFailed   = 7405
    ErrBrunAssetSourceMissing = 7406
    ErrBrunWorkdirNotFound    = 7407
    ErrBrunWorkdirPermission  = 7408
    ErrBrunExternalDirBlocked = 7409
    ErrBrunPathTraversal      = 7410
    
    // Health Check (7500-7599)
    ErrBrunHealthTimeout       = 7501
    ErrBrunHealthFailed        = 7502
    ErrBrunHealthUnreachable   = 7503
    ErrBrunHealthStatusMismatch = 7504
    ErrBrunHealthBodyMismatch  = 7505
)

// Error constructors using *appfault.AppError
func NewConfigNotFoundError(path string) *appfault.AppError {
    return appfault.New(
        "configuration file not found",
    ).
        WithCode(ErrBrunConfigNotFound).
        WithContext("path", path).
        WithSkip(1)
}

func NewPortUnavailableError(port int, fallbackTried []int) *appfault.AppError {
    return appfault.New(
        "port %d unavailable, all fallbacks exhausted",
        port,
    ).
        WithCode(ErrBrunPortUnavailable).
        WithContext("triedPorts", fallbackTried).
        WithSkip(1)
}

func NewHealthTimeoutError(url string, timeout time.Duration) *appfault.AppError {
    return appfault.New(
        "health check did not pass within timeout",
    ).
        WithCode(ErrBrunHealthTimeout).
        WithContext("url", url).
        WithContext("timeout", timeout.String()).
        WithSkip(1)
}

func NewGoBuildError(file string, line int, message string) *appfault.AppError {
    return appfault.New(
        message,
    ).
        WithCode(ErrBrunGoBuildFailed).
        WithContext("file", file).
        WithContext("line", line).
        WithSkip(1)
}
```

### Exit Code Mapping

| Exit Code | Error Range | Description |
|-----------|-------------|-------------|
| 0 | - | Success |
| 1 | 7210-7232, 7401, 7501-7505 | Build/execution failed |
| 2 | 7101-7109 | Configuration error |
| 3 | 7201-7202 | Runtime not found |
| 4 | 7301, 7303, 7307 | Port/network error |
| 5 | 7204, 7501 | Timeout |
| 6 | 7109, 7205, 7302, 7305, 7408-7410 | Permission denied |
| 7 | 7402-7403, 7406-7407, 7222 | Path not found |
| 8 | 7211 | go mod tidy failed |
| 9 | 7404-7405 | Asset operation failed |
| 10 | 7304, 7306 | Firewall error |
| 126 | 7001-7006 | Command/flag error |
| 127 | 7005 | Binary not found |
| 130 | 7206 | Killed by SIGINT |

### JSON Error Response

When `--json` flag is used, errors are returned in structured format:

```json
{
  "runId": "run_20260129_143052",
  "success": false,
  "exitCode": 1,
  "error": {
    "code": 7210,
    "constant": "ERR_BRUN_GO_BUILD_FAILED",
    "message": "Go compilation failed",
    "details": "file: main.go, line: 15",
    "retryable": false,
    "exitCode": 1
  },
  "errors": [
    {
      "file": "main.go",
      "line": 15,
      "column": 10,
      "message": "undefined: SomeFunction",
      "severity": "error",
      "code": "7212"
    }
  ],
  "logPath": "./logs/run_20260129_143052"
}
```

---

## See Also

- [Runtime Executors](./04-runtime-executors.md)
- [Integration API](./09-integration-api.md)
- [Acceptance Criteria](./11-acceptance-criteria.md)
