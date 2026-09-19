# Integration API

**Version:** 2.0.0  
**Status:** Draft  
**Updated:** 2026-03-09  

---

## Overview

Communication protocol for integrating brun with the main Spec Management application, especially for AI-assisted error fixing loops.

**Cross-References:**
- [Error Handling](./06-error-handling.md)
- [CLI Interface](./02-cli-interface.md)
- [AI Integration](../06-ai-integration/00-overview.md)

---

## Integration Modes

### 1. CLI Subprocess Mode

Main application spawns brun as a subprocess and reads JSON output.

```go
// In main application
func (app *App) runBuildCheck(profile string) appfault.Result[BuildResult] {
    command := exec.Command("brun", "check",
        "--profile", profile,
        "--json",
        "--tidy", "run",
    )

    output, err := command.Output()

    if err != nil {
        var exitErr *exec.ExitError
        isExitError := errors.As(err, &exitErr)

        if isExitError {
            output = exitErr.Stderr
        }
    }

    var result BuildResult
    parseErr := json.Unmarshal(output, &result)

    if parseErr != nil {
        return appfault.FailWrap[BuildResult](
            parseErr,
            "failed to parse brun output",
        )
    }

    return appfault.Ok(result)
}
```

### 2. Library Import Mode (Future)

Import brun as a Go library.

```go
import "github.com/user/brun/pkg/runner"

func (app *App) runBuildCheck(profile string) appfault.Result[runner.ExecutionResult] {
    r := runner.New(runner.Config{
        ConfigPath: "./config.json",
    })

    return r.ExecuteProfile(context.Background(), profile)
}
```

---

## Subprocess Call Patterns

> **Note:** brun contains NO AI capabilities. All AI processing occurs in the main Spec Management application. brun is invoked purely as a subprocess.

### BrunRunner Service

The main application wraps all brun interactions in a dedicated service:

```go
package brun

import (
    "bytes"
    stdctx "context"
    "encoding/json"
    "fmt"
    "os"
    "os/exec"
    "path/filepath"
    "time"
)

// BrunRunner manages subprocess calls to the brun CLI
type BrunRunner struct {
    binaryPath   string        // Path to brun executable
    configPath   string        // Path to config.json
    workDir      string        // Working directory for execution
    timeout      time.Duration // Default timeout for commands
    env          []string      // Additional environment variables
}

// NewBrunRunner creates a new runner instance
func NewBrunRunner(opts ...Option) *BrunRunner {
    r := &BrunRunner{
        binaryPath: "brun",           // Assumes brun is in PATH
        configPath: "./config.json",
        workDir:    ".",
        timeout:    5 * time.Minute,
        env:        os.Environ(),
    }
    for _, opt := range opts {
        opt(r)
    }
    return r
}

// Option pattern for configuration
type Option func(*BrunRunner)

func WithBinaryPath(path string) Option {
    return func(r *BrunRunner) { r.binaryPath = path }
}

func WithConfigPath(path string) Option {
    return func(r *BrunRunner) { r.configPath = path }
}

func WithWorkDir(dir string) Option {
    return func(r *BrunRunner) { r.workDir = dir }
}

func WithTimeout(d time.Duration) Option {
    return func(r *BrunRunner) { r.timeout = d }
}

func WithEnv(key, value string) Option {
    return func(r *BrunRunner) {
        r.env = append(r.env, fmt.Sprintf("%s=%s", key, value))
    }
}
```

### Core Execution Method

```go
// ExecutionResult represents parsed brun JSON output
type ExecutionResult struct {
    RunId     string
    IsSuccess bool
    IsFailed  bool
    ExitCode  int
    StartTime time.Time
    EndTime   time.Time
    Duration  string
    Stdout    string
    Stderr    string
    Errors    []BuildError
    Warnings  []BuildError
    Port      int    `json:",omitempty"`
    LogPath   string
}

// BuildError represents a single build error
type BuildError struct {
    File     string
    Line     int
    Column   int
    Message  string
    Severity string
    Context  string
    Code     string `json:",omitempty"` // Error code if available
    Source   string `json:",omitempty"` // Source line content
}

// execute runs brun with given arguments and parses JSON output
func (r *BrunRunner) execute(context context.Context, args ...string) appfault.Result[ExecutionResult] {
    args = append(args, "--json", "--config", r.configPath)

    timeoutContext, cancel := context.WithTimeout(context, r.timeout)
    defer cancel()

    command := exec.CommandContext(timeoutContext, r.binaryPath, args...)
    command.Dir = r.workDir
    command.Env = r.env

    var stdout, stderr bytes.Buffer
    command.Stdout = &stdout
    command.Stderr = &stderr

    err := command.Run()

    return r.parseExecutionOutput(timeoutContext, err, stdout, stderr)
}

func (r *BrunRunner) parseExecutionOutput(context context.Context, err error, stdout bytes.Buffer, stderr bytes.Buffer) appfault.Result[ExecutionResult] {
    var result ExecutionResult
    hasOutput := stdout.Len() > 0

    if hasOutput {
        parseErr := json.Unmarshal(stdout.Bytes(), &result)

        if parseErr != nil {
            return appfault.FailWrap[ExecutionResult](
                parseErr,
                "failed to parse brun JSON output",
            )
        }
    }

    if err == nil {
        return appfault.Ok(result)
    }

    return r.handleExecutionError(context, err, result, stderr)
}

func (r *BrunRunner) handleExecutionError(context context.Context, err error, result ExecutionResult, stderr bytes.Buffer) appfault.Result[ExecutionResult] {
    isTimeout := context.Err() == context.DeadlineExceeded

    if isTimeout {
        return appfault.FailNew[ExecutionResult](
            ErrBrunRuntimeTimeout,
            "brun execution timed out after %v",
            r.timeout,
        )
    }

    var exitErr *exec.ExitError
    isExitError := errors.As(err, &exitErr)

    if isExitError {
        hasResult := result.RunId != ""

        if hasResult {
            return appfault.Ok(result)
        }

        return appfault.FailNew[ExecutionResult](
            ErrBrunRuntimeCrashed,
            "brun exited with code %d: %s",
            exitErr.ExitCode(),
            stderr.String(),
        )
    }

    return appfault.FailWrap[ExecutionResult](err, "failed to execute brun")
}
```

### Command-Specific Methods

```go
// Check runs build verification without producing artifacts
func (r *BrunRunner) Check(context context.Context, opts CheckOptions) appfault.Result[ExecutionResult] {
    args := []string{"check"}

    hasProfile := opts.Profile != ""

    if hasProfile {
        args = append(args, "--profile", opts.Profile)
    }

    hasGoPath := opts.GoPath != ""

    if hasGoPath {
        args = append(args, "--go", opts.GoPath)
    }

    hasNodePath := opts.NodePath != ""

    if hasNodePath {
        args = append(args, "--node", opts.NodePath)
    }

    hasTidy := opts.Tidy != ""

    if hasTidy {
        args = append(args, "--tidy", opts.Tidy)
    }

    hasPort := opts.Port > 0

    if hasPort {
        args = append(args, "--port", fmt.Sprintf("%d", opts.Port))
    }

    return r.execute(context, args...)
}

type CheckOptions struct {
    Profile  string
    GoPath   string
    NodePath string
    PSScript string
    Tidy     string // "skip", "run", "force"
    Port     int
}

// Build executes a full build using a profile
func (r *BrunRunner) Build(context context.Context, opts BuildOptions) appfault.Result[ExecutionResult] {
    args := []string{"build"}

    hasProfile := opts.Profile != ""

    if hasProfile {
        args = append(args, "--profile", opts.Profile)
    }

    if opts.IsClean {
        args = append(args, "--clean")
    }

    if opts.ShouldCopyAssets {
        args = append(args, "--copy-assets")
    }

    hasOutput := opts.Output != ""

    if hasOutput {
        args = append(args, "--output", opts.Output)
    }

    return r.execute(context, args...)
}

type BuildOptions struct {
    Profile          string
    IsClean          bool
    ShouldCopyAssets bool
    Output           string
}

// Run executes application with health check waiting
func (r *BrunRunner) Run(context context.Context, opts RunOptions) appfault.Result[ExecutionResult] {
    args := r.buildRunArgs(opts)
    return r.execute(context, args...)
}

func (r *BrunRunner) buildRunArgs(opts RunOptions) []string {
    args := []string{"run"}

    hasApp := opts.App != ""

    if hasApp {
        args = append(args, "--app", opts.App)
    }

    hasPort := opts.Port > 0

    if hasPort {
        args = append(args, "--port", fmt.Sprintf("%d", opts.Port))
    }

    if opts.IsDetached {
        args = append(args, "--detach")
    }

    for k, v := range opts.Env {
        args = append(args, "--env", fmt.Sprintf("%s=%s", k, v))
    }

    return args
}

type RunOptions struct {
    App           string
    GoPath        string
    NodeCmd       string
    Port          int
    HealthCheck   string
    HealthTimeout time.Duration
    IsDetached    bool
    WorkDir       string
    Env           map[string]string
}

// Port checks port availability
func (r *BrunRunner) Port(context context.Context, opts PortOptions) appfault.Result[PortResult] {
    args := []string{"port"}

    hasCheck := opts.Check > 0

    if hasCheck {
        args = append(args, "--check", fmt.Sprintf("%d", opts.Check))
    }

    hasFallback := len(opts.Fallback) > 0

    if hasFallback {
        ports := make([]string, len(opts.Fallback))
        for i, p := range opts.Fallback {
            ports[i] = fmt.Sprintf("%d", p)
        }

        args = append(args, "--fallback", strings.Join(ports, ","))
    }

    result := r.execute(context, args...)

    if result.HasError() {
        return appfault.Fail[PortResult](result.Error())
    }

    portResult := PortResult{
        RequestedPort: opts.Check,
        IsAvailable:   result.Value().IsSuccess,
    }

    return appfault.Ok(portResult)
}

type PortOptions struct {
    Check    int
    Fallback []int
    Enable   int
    Disable  int
    RuleName string
}

type PortResult struct {
    RequestedPort  int
    AvailablePort  int
    IsAvailable    bool
    CheckedPorts   []PortStatus
}

type PortStatus struct {
    Port        int
    IsAvailable bool
    Reason      string `json:",omitempty"`
}
...
type HealthResult struct {
    Status   string
    Version  string
    Runtimes map[string]RuntimeStatus
    Config   ConfigStatus
}

type RuntimeStatus struct {
    IsAvailable bool
    Version     string
}

type ConfigStatus struct {
    IsLoaded bool
    Path     string
}
```

### JSON Parsing Utilities

```go
package brun

import (
    "encoding/json"
    "io"
    "os"
)

// ParseResultFromFile reads a brun result from a log file
func ParseResultFromFile(path string) appfault.Result[ExecutionResult] {
    f, err := pathutil.Open(path)

    if err != nil {
        return appfault.FailWrap[ExecutionResult](err, "failed to open result file")
    }

    defer f.Close()
    return ParseResultFromReader(f)
}

func ParseResultFromReader(r io.Reader) appfault.Result[ExecutionResult] {
    var result ExecutionResult
    err := json.NewDecoder(r).Decode(&result)

    if err != nil {
        return appfault.FailWrap[ExecutionResult](err, "failed to decode result")
    }

    return appfault.Ok(result)
}

func ParseResultFromBytes(data []byte) appfault.Result[ExecutionResult] {
    var result ExecutionResult
    err := json.Unmarshal(data, &result)

    if err != nil {
        return appfault.FailWrap[ExecutionResult](err, "failed to unmarshal result")
    }

    return appfault.Ok(result)
}

// ErrorsToMap converts build errors to a file-grouped map for AI processing
func ErrorsToMap(errors []BuildError) map[string][]BuildError {
    result := make(map[string][]BuildError)
    for _, err := range errors {
        result[err.File] = append(result[err.File], err)
    }
    return result
}

// ErrorsToMarkdown formats errors as markdown for AI prompts
func ErrorsToMarkdown(errors []BuildError) string {
    var sb strings.Builder
    
    grouped := ErrorsToMap(errors)
    
    for file, fileErrors := range grouped {
        sb.WriteString(fmt.Sprintf("### File: `%s`\n\n", file))
        for _, err := range fileErrors {
            sb.WriteString(fmt.Sprintf("- **Line %d, Col %d**: %s\n", 
                err.Line, err.Column, err.Message))
            if err.Context != "" {
                sb.WriteString(fmt.Sprintf("  ```\n  %s\n  ```\n", err.Context))
            }
        }
        sb.WriteString("\n")
    }
    
    return sb.String()
}
```

### Error Handling Patterns

```go
package brun

import (
    "errors"
    "fmt"
)

// Package: exitcodetype
type Variant byte

const (
    Success        Variant = iota
    BuildFailed
    ConfigError
    RuntimeMissing
    PortUnavailable
    Timeout
    PermissionDenied
    PathNotFound
)

// ExecutionOutcome wraps brun execution results with error context
type ExecutionOutcome struct {
    ExitCode exitcodetype.Variant
    Result   *ExecutionResult
    Error    *appfault.AppError
}

func (o *ExecutionOutcome) IsRetryable() bool {
    switch o.ExitCode {
    case exitcodetype.BuildFailed:
        return true

    case exitcodetype.PortUnavailable:
        return true

    case exitcodetype.Timeout:
        return true

    default:
        return false
    }
}

func (o *ExecutionOutcome) RequiresAiFix() bool {
    hasErrors := o.Result != nil && len(o.Result.Errors) > 0
    isBuildFailure := o.ExitCode == exitcodetype.BuildFailed
    return isBuildFailure && hasErrors
}

// NewExecutionOutcome creates outcome from execution result
func NewExecutionOutcome(result *ExecutionResult) ExecutionOutcome {
    msg := "build failed"
    hasErrors := len(result.Errors) > 0

    if hasErrors {
        msg = result.Errors[0].Message
    }

    return ExecutionOutcome{
        ExitCode: exitcodetype.Variant(result.ExitCode),
        Result:   result,
        Error: appfault.New(
            msg,
        ).WithSkip(1),
    }
}

// HandleResult processes execution result
func HandleResult(result *ExecutionResult) *appfault.AppError {
    if result.IsSuccess {
        return nil
    }

    outcome := NewExecutionOutcome(result)
    return outcome.Error
}
```

### Usage in AI Error Fixing Loop

```go
package main

import (
    stdctx "context"
    "log"
    "time"
    
    "specmgr/internal/ai"
    "specmgr/internal/brun"
)

type BuildService struct {
    runner    *brun.BrunRunner
    aiService *ai.Service
    maxRetry  int
}

func NewBuildService(brunPath, configPath string, aiSvc *ai.Service) *BuildService {
    return &BuildService{
        runner: brun.NewBrunRunner(
            brun.WithBinaryPath(brunPath),
            brun.WithConfigPath(configPath),
            brun.WithTimeout(10*time.Minute),
        ),
        aiService: aiSvc,
        maxRetry:  5,
    }
}

// BuildWithAutoFix attempts to build, using AI to fix errors automatically
func (s *BuildService) BuildWithAutoFix(context stdctx.Context, profile string) *appfault.AppError {
    for attempt := 1; attempt <= s.maxRetry; attempt++ {
        log.Printf("Build attempt %d/%d for profile: %s", attempt, s.maxRetry, profile)

        // Step 1: Run brun check
        result, err := s.runner.Check(context, brun.CheckOptions{
            Profile: profile,
            Tidy:    "run",
        })
        if err != nil {
            return appfault.Wrap(err, "brun execution failed").WithSkip(1)
        }

        // Step 2: Check success
        if result.IsSuccess {
            log.Printf("Build succeeded on attempt %d", attempt)

            return nil
        }

        // Step 3: No errors to fix?
        hasNoErrors := len(result.Errors) == 0

        if hasNoErrors {
            return appfault.New(
                fmt.Sprintf("build failed but no errors captured (exit code: %d)", result.ExitCode),
            ).WithSkip(1)
        }

        log.Printf("Found %d build errors, requesting AI fix...", len(result.Errors))

        // Step 4: Format errors for AI
        errorMarkdown := brun.ErrorsToMarkdown(result.Errors)

        // Step 5: Get AI fix (AI runs in main app, NOT in brun)
        fixes, err := s.aiService.GenerateCodeFixes(context, ai.FixRequest{
            Errors:      errorMarkdown,
            ProjectPath: s.runner.WorkDir(),
            Language:    detectLanguage(profile),
        })
        if err != nil {
            return appfault.Wrap(err, "AI fix generation failed").WithSkip(1)
        }

        // Step 6: Apply fixes to filesystem
        for _, fix := range fixes {
            if err := applyFix(fix); err != nil {
                return appfault.Wrap(err, "failed to apply fix to "+fix.File).WithSkip(1)
            }

            log.Printf("Applied fix to %s", fix.File)
        }

        // Step 7: Loop back for retry
        log.Printf("Fixes applied, retrying build...")
    }

    return appfault.New(
        fmt.Sprintf("max retry attempts (%d) exceeded", s.maxRetry),
    ).WithSkip(1)
}

func detectLanguage(profile string) string {
    // Logic to determine language from profile
    return "go" // Simplified
}

func applyFix(fix ai.CodeFix) *appfault.AppError {
    // Write fix.Content to fix.File
    if err := pathutil.WriteFile(fix.File, []byte(fix.Content), 0644); err != nil {
        return appfault.Wrap(err, "write fix file").WithSkip(1)
    }

    return nil
}
```

## AI Error Fixing Loop

### Workflow

```
┌─────────────────┐
│  Main App       │
│  (AI Orchestrator)│
└────────┬────────┘
         │ 1. Trigger build check
         ▼
┌─────────────────┐
│  brun check     │
│  --json --go    │
└────────┬────────┘
         │ 2. Return JSON with errors
         ▼
┌─────────────────┐
│  Error Parser   │
│  (Main App)     │
└────────┬────────┘
         │ 3. Format errors for AI
         ▼
┌─────────────────┐
│  AI Model       │
│  (Code Fixer)   │
└────────┬────────┘
         │ 4. Generate fix
         ▼
┌─────────────────┐
│  File Writer    │
│  (Main App)     │
└────────┬────────┘
         │ 5. Apply fix to source
         ▼
    ┌────┴────┐
    │ Retry?  │──── No ──► Done
    └────┬────┘
         │ Yes
         └──────────► Back to step 1
```

### Implementation

```go
type AIErrorFixer struct {
    maxRetries int
    runner     *BrunRunner
    ai         *AIService
    fileWriter *FileWriter
}

func (f *AIErrorFixer) FixBuildErrors(context stdctx.Context, profile string) *appfault.AppError {
    for attempt := 0; attempt < f.maxRetries; attempt++ {
        // Run build check
        result, err := f.runner.Check(context, profile)
        if err != nil {
            return appfault.Wrap(err, "build check failed").WithSkip(1)
        }

        // Success - no errors
        if result.IsSuccess {
            f.log.Info("Build successful", "attempts", attempt+1)

            return nil
        }

        // No errors but failed (shouldn't happen)
        hasNoErrors := len(result.Errors) == 0

        if hasNoErrors {
            return appfault.New("build failed but no errors captured").WithSkip(1)
        }

        // Format errors for AI
        prompt := f.formatErrorsForAI(result.Errors)

        // Get AI fix
        fix, err := f.ai.GenerateFix(context, prompt)
        if err != nil {
            return appfault.Wrap(err, "AI fix generation failed").WithSkip(1)
        }

        // Apply fix
        if err := f.fileWriter.ApplyFix(fix); err != nil {
            return appfault.Wrap(err, "failed to apply fix").WithSkip(1)
        }

        f.log.Info("Applied AI fix", "attempt", attempt+1, "errors", len(result.Errors))
    }

    return appfault.New(
        fmt.Sprintf("max retries (%d) exceeded", f.maxRetries),
    ).WithSkip(1)
}

func (f *AIErrorFixer) formatErrorsForAI(errors []BuildError) string {
    var sb strings.Builder
    sb.WriteString("The following build errors occurred:\n\n")
    
    for i, err := range errors {
        sb.WriteString(fmt.Sprintf("%d. File: %s (line %d)\n", i+1, err.File, err.Line))
        sb.WriteString(fmt.Sprintf("   Error: %s\n", err.Message))
        if err.Context != "" {
            sb.WriteString(fmt.Sprintf("   Context: %s\n", err.Context))
        }
        sb.WriteString("\n")
    }
    
    sb.WriteString("Please provide fixes for these errors.\n")
    return sb.String()
}
```

---

## JSON Response Schema

### Success Response

```json
{
  "runId": "run_20260129_143052",
  "success": true,
  "exitCode": 0,
  "startTime": "2026-01-29T14:30:52Z",
  "endTime": "2026-01-29T14:30:55Z",
  "duration": "3.245s",
  "stdout": "Build succeeded.\n",
  "stderr": "",
  "errors": [],
  "warnings": [],
  "port": 8080,
  "logPath": "./logs/run_20260129_143052"
}
```

### Error Response

```json
{
  "runId": "run_20260129_143155",
  "success": false,
  "exitCode": 1,
  "startTime": "2026-01-29T14:31:55Z",
  "endTime": "2026-01-29T14:31:57Z",
  "duration": "2.102s",
  "stdout": "",
  "stderr": "cmd/api/main.go:15:10: undefined: handlers.NewRouter\ncmd/api/main.go:22:5: too many arguments in call to db.Connect\n",
  "errors": [
    {
      "file": "cmd/api/main.go",
      "line": 15,
      "column": 10,
      "message": "undefined: handlers.NewRouter",
      "severity": "error",
      "context": "\trouter := handlers.NewRouter()"
    },
    {
      "file": "cmd/api/main.go",
      "line": 22,
      "column": 5,
      "message": "too many arguments in call to db.Connect",
      "severity": "error",
      "context": "\tconn := db.Connect(cfg.Database, cfg.Debug, cfg.Timeout)"
    }
  ],
  "warnings": [],
  "logPath": "./logs/run_20260129_143155"
}
```

---

## Exit Code Reference

| Code | Constant | Description | Action |
|------|----------|-------------|--------|
| 0 | `exitcodetype.Success` | Build/check successful | Continue |
| 1 | `exitcodetype.BuildFailed` | Build failed with errors | Parse errors, retry with AI |
| 2 | `exitcodetype.ConfigError` | Configuration invalid | Fix config, retry |
| 3 | `exitcodetype.RuntimeMissing` | Runtime not found | Install runtime |
| 4 | `exitcodetype.PortUnavailable` | No port available | Wait or change ports |
| 5 | `exitcodetype.Timeout` | Execution timeout | Increase timeout |
| 6 | `exitcodetype.PermissionDenied` | Permission error | Check permissions |
| 7 | `exitcodetype.PathNotFound` | Source not found | Check paths |

---

## Environment Variables

brun respects environment variables set by the parent process:

| Variable | Description |
|----------|-------------|
| `BRUN_CONFIG` | Override config file path |
| `BRUN_LOG_DIR` | Override log directory |
| `BRUN_JSON_OUTPUT` | Force JSON output (true/false) |
| `BRUN_VERBOSE` | Enable verbose logging |
| `BRUN_NO_COLOR` | Disable colored output |
| `BRUN_TIMEOUT` | Override default timeout |

---

## Streaming Output (Future)

For long-running builds, stream output via JSON lines:

```bash
brun build --profile backend --stream
```

```json
{"type":"start","runId":"run_20260129_143052","timestamp":"2026-01-29T14:30:52Z"}
{"type":"stdout","line":"Compiling main.go..."}
{"type":"stdout","line":"Compiling handlers/..."}
{"type":"stderr","line":"warning: unused variable 'x'"}
{"type":"progress","percent":75,"message":"Linking..."}
{"type":"complete","success":true,"exitCode":0,"duration":"12.5s"}
```

---

## Health Check

```bash
brun --health
```

```json
{
  "status": "healthy",
  "version": "1.0.0",
  "runtimes": {
    "powershell": {"available": true, "version": "7.4.0"},
    "nodejs": {"available": true, "version": "20.10.0"},
    "golang": {"available": true, "version": "1.21.0"}
  },
  "config": {"loaded": true, "path": "./config.json"},
  "ports": {"default": 8080, "fallbackCount": 5}
}
```

---

## See Also

- [Error Handling](./06-error-handling.md)
- [CLI Interface](./02-cli-interface.md)
- [AI Integration](../06-ai-integration/00-overview.md)
