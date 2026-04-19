# Runtime Executors

**Version:** 4.0.0  
**Status:** Active  
**Updated:** 2026-03-09  

---

## Overview

Specification for runtime executors that handle command execution across PowerShell, Node.js, and Go environments.

**Cross-References:**
- [Core Architecture](./01-core-architecture.md)
- [CLI Interface](./02-cli-interface.md)
- [Enum Architecture](./19-enum-architecture.md)
- [Error Handling](./06-error-handling.md)

---

## Runtime Type Enum

```go
// internal/enums/runtimetype/runtimetype.go

package runtimetype

import (
    "encoding/json"
    "strings"

    "brun/pkg/apperror"
)

type RuntimeType byte

const (
    PowerShell RuntimeType = iota
    NodeJs
    Golang
)

var variantLabels = map[RuntimeType]string{
    PowerShell: "PowerShell",
    NodeJs:     "NodeJs",
    Golang:     "Golang",
}

func (rt RuntimeType) String() string {
    if label, ok := variantLabels[rt]; ok {
        return label
    }

    panic("unhandled RuntimeType")
}

func (rt RuntimeType) Label() string {
    return rt.String()
}

func (rt RuntimeType) IsPowerShell() bool {
    return rt == PowerShell
}

func (rt RuntimeType) IsNodeJs() bool {
    return rt == NodeJs
}

func (rt RuntimeType) IsGolang() bool {
    return rt == Golang
}

func Values() []RuntimeType {
    values := make([]RuntimeType, 0, len(variantLabels))
    for v := range variantLabels {
        values = append(values, v)
    }

    return values
}

func Parse(value string) (RuntimeType, *apperror.AppError) {
    for k, v := range variantLabels {
        if strings.EqualFold(v, value) {
            return k, nil
        }
    }

    return 0, apperror.New(
        7106,
        "invalid runtime type: "+value,
    )
}

func (rt RuntimeType) MarshalJSON() ([]byte, error) {
    return json.Marshal(rt.String())
}

func (rt *RuntimeType) UnmarshalJSON(data []byte) error {
    var raw string

    unmarshalErr := json.Unmarshal(data, &raw)
    if unmarshalErr != nil {
        return unmarshalErr
    }

    parsed, parseErr := Parse(raw)
    if parseErr != nil {
        return parseErr
    }

    *rt = parsed

    return nil
}
```

---

## Package Manager Type Enum

```go
// internal/enums/packagemanagertype/packagemanagertype.go

package packagemanagertype

type PackageManagerType byte

const (
    Npm  PackageManagerType = iota
    Yarn
    Bun
)

var variantLabels = map[PackageManagerType]string{
    Npm:  "npm",
    Yarn: "yarn",
    Bun:  "bun",
}

func (pm PackageManagerType) String() string {
    if label, ok := variantLabels[pm]; ok {
        return label
    }

    panic("unhandled PackageManagerType")
}

func (pm PackageManagerType) Label() string {
    return pm.String()
}

func (pm PackageManagerType) IsNpm() bool {
    return pm == Npm
}

func (pm PackageManagerType) IsYarn() bool {
    return pm == Yarn
}

func (pm PackageManagerType) IsBun() bool {
    return pm == Bun
}
```

---

## Mod Tidy Mode Enum

```go
// internal/enums/modtidymodetype/modtidymodetype.go

package modtidymodetype

type ModTidyModeType byte

const (
    Skip  ModTidyModeType = iota
    Run
    Force
)

var variantLabels = map[ModTidyModeType]string{
    Skip:  "Skip",
    Run:   "Run",
    Force: "Force",
}

func (m ModTidyModeType) String() string {
    if label, ok := variantLabels[m]; ok {
        return label
    }

    panic("unhandled ModTidyModeType")
}

func (m ModTidyModeType) Label() string {
    return m.String()
}

func (m ModTidyModeType) IsSkip() bool {
    return m == Skip
}

func (m ModTidyModeType) IsRun() bool {
    return m == Run
}

func (m ModTidyModeType) IsForce() bool {
    return m == Force
}
```

---

## Executor Interface

```go
import (
    "context"

    "brun/internal/enums/runtimetype"
    "brun/pkg/apperror"
)

type Executor interface {
    Execute(context context.Context, cmd *Command) apperror.Result[*ExecutionResult]
    Validate() *apperror.AppError
    GetVersion() apperror.Result[string]
    ParseErrors(output string) []BuildError
}

type Command struct {
    Type        runtimetype.RuntimeType // Type-safe runtime enum
    Script      string                  // Script path or inline command
    Args        []string               // Additional arguments
    WorkDir     string                  // Working directory
    Env         map[string]string       // Environment variables
    Timeout     time.Duration           // Execution timeout
    PreCommands []string               // Commands before main execution
}
```

---

## 1. PowerShell Executor

### Supported Platforms
- Windows: `pwsh.exe` (PowerShell Core) or `powershell.exe` (Windows PowerShell)
- Linux/macOS: `pwsh` (PowerShell Core)

### Implementation

```go
type PowerShellExecutor struct {
    path    string
    args    []string
    logger  *LogService
}

func (e *PowerShellExecutor) Execute(context context.Context, cmd *Command) apperror.Result[*ExecutionResult] {
    // Build command
    args := append(e.args, "-Command", cmd.Script)
    if cmd.Script != "" && isFilePath(cmd.Script) {
        args = append(e.args, "-File", cmd.Script)
        args = append(args, cmd.Args...)
    }
    
    // Execute with timeout
    execCmd := exec.CommandContext(context, e.path, args...)
    execCmd.Dir = cmd.WorkDir
    execCmd.Env = mergeEnv(os.Environ(), cmd.Env)
    
    // Capture output
    var stdout, stderr bytes.Buffer
    execCmd.Stdout = &stdout
    execCmd.Stderr = &stderr
    
    startTime := time.Now()
    runErr := execCmd.Run()
    endTime := time.Now()
    
    return apperror.Ok(&ExecutionResult{
        Success:   runErr == nil,
        ExitCode:  getExitCode(runErr),
        Stdout:    stdout.String(),
        Stderr:    stderr.String(),
        StartTime: startTime,
        EndTime:   endTime,
        Duration:  endTime.Sub(startTime),
        Errors:    e.ParseErrors(stderr.String()),
    })
}
```

### Error Patterns

```go
var psErrorPatterns = []ErrorPattern{
    {
        Regex:    regexp.MustCompile(`(?m)^(.+):(\d+):\d+: (.+)$`),
        Severity: severity.Error,
        Extract:  func(m []string) BuildError { /* parse file, line, message */ },
    },
    {
        Regex:    regexp.MustCompile(`(?m)^At (.+):(\d+) char:(\d+)`),
        Severity: severity.Error,
    },
    {
        Regex:    regexp.MustCompile(`(?m)^.*FullyQualifiedErrorId : (.+)$`),
        Severity: severity.Error,
    },
}
```

---

## 2. Node.js Executor

### Supported Package Managers
- npm (default)
- yarn
- bun

### Implementation

```go
import "brun/internal/enums/packagemanagertype"

type NodeJSExecutor struct {
    nodePath       string
    packageManager packagemanagertype.PackageManagerType
    logger         *LogService
}

func (e *NodeJSExecutor) Execute(context context.Context, cmd *Command) apperror.Result[*ExecutionResult] {
    var execPath string
    var args []string
    
    // Use type-safe enum methods instead of string comparison
    if e.packageManager.IsNpm() {
        execPath = "npm"
        args = []string{"run", cmd.Script}
    } else if e.packageManager.IsYarn() {
        execPath = "yarn"
        args = []string{cmd.Script}
    } else if e.packageManager.IsBun() {
        execPath = "bun"
        args = []string{"run", cmd.Script}
    }
    
    args = append(args, cmd.Args...)
    
    execCmd := exec.CommandContext(context, execPath, args...)
    execCmd.Dir = cmd.WorkDir
    execCmd.Env = mergeEnv(os.Environ(), cmd.Env)
    
    // ... execution logic (same pattern as PowerShellExecutor)
}

func (e *NodeJSExecutor) Validate() *apperror.AppError {
    // Check if package manager is installed using enum's String() method
    _, lookErr := exec.LookPath(e.packageManager.String())
    if lookErr != nil {
        return apperror.Wrap(
            lookErr,
            7201,
            e.packageManager.Label()+" not found in PATH",
        )
    }
    
    return nil
}
```

### Error Patterns

```go
var nodeErrorPatterns = []ErrorPattern{
    // TypeScript errors
    {
        Regex:    regexp.MustCompile(`(?m)^(.+)\((\d+),(\d+)\): error TS\d+: (.+)$`),
        Severity: severity.Error,
    },
    // ESLint errors
    {
        Regex:    regexp.MustCompile(`(?m)^\s*(\d+):(\d+)\s+error\s+(.+)$`),
        Severity: severity.Error,
    },
    // Vite/webpack build errors
    {
        Regex:    regexp.MustCompile(`(?m)^ERROR in (.+)$`),
        Severity: severity.Error,
    },
    // npm ERR!
    {
        Regex:    regexp.MustCompile(`(?m)^npm ERR! (.+)$`),
        Severity: severity.Error,
    },
}
```

---

## 3. Golang Executor

### Features
- `go build` with customizable flags
- `go mod tidy` support (skip/run/force)
- Cross-compilation support
- CGO handling

### Implementation

```go
import "brun/internal/enums/modtidymodetype"

type GolangExecutor struct {
    goPath     string
    buildFlags []string
    modTidy    modtidymodetype.ModTidyModeType
    logger     *LogService
}

func (e *GolangExecutor) Execute(context context.Context, cmd *Command) apperror.Result[*ExecutionResult] {
    results := &ExecutionResult{
        StartTime: time.Now(),
    }
    
    // Step 1: go mod tidy (if configured) - use enum methods
    if !e.modTidy.IsSkip() {
        tidyResult := e.runModTidy(context, cmd)
        if tidyResult.ExitCode != 0 && e.modTidy.IsForce() {
            return apperror.Fail[*ExecutionResult](
                apperror.New(
                    7211,
                    "go mod tidy failed",
                ),
            )
        }

        results.Stdout += tidyResult.Stdout
        results.Stderr += tidyResult.Stderr
    }
    
    // Step 2: go build
    args := []string{"build"}
    args = append(args, e.buildFlags...)
    args = append(args, cmd.Args...)
    args = append(args, cmd.Script)
    
    execCmd := exec.CommandContext(context, e.goPath, args...)
    execCmd.Dir = cmd.WorkDir
    execCmd.Env = mergeEnv(os.Environ(), cmd.Env)
    
    var stdout, stderr bytes.Buffer
    execCmd.Stdout = &stdout
    execCmd.Stderr = &stderr
    
    runErr := execCmd.Run()
    
    results.EndTime = time.Now()
    results.Duration = results.EndTime.Sub(results.StartTime)
    results.ExitCode = getExitCode(runErr)
    results.Success = runErr == nil
    results.Stdout += stdout.String()
    results.Stderr += stderr.String()
    results.Errors = e.ParseErrors(stderr.String())
    
    return apperror.Ok(results)
}

func (e *GolangExecutor) runModTidy(context context.Context, cmd *Command) *ExecutionResult {
    execCmd := exec.CommandContext(context, e.goPath, "mod", "tidy")
    execCmd.Dir = cmd.WorkDir
    
    var stdout, stderr bytes.Buffer
    execCmd.Stdout = &stdout
    execCmd.Stderr = &stderr
    
    runErr := execCmd.Run()
    
    return &ExecutionResult{
        ExitCode: getExitCode(runErr),
        Stdout:   stdout.String(),
        Stderr:   stderr.String(),
    }
}
```

### Error Patterns

```go
var goErrorPatterns = []ErrorPattern{
    // Standard Go error: file.go:10:5: error message
    {
        Regex:    regexp.MustCompile(`(?m)^(.+\.go):(\d+):(\d+): (.+)$`),
        Severity: severity.Error,
        Extract: func(m []string) BuildError {
            line, _ := strconv.Atoi(m[2])
            col, _ := strconv.Atoi(m[3])

            return BuildError{
                File:     m[1],
                Line:     line,
                Column:   col,
                Message:  m[4],
                Severity: severity.Error,
            }
        },
    },
    // Package error
    {
        Regex:    regexp.MustCompile(`(?m)^package (.+): (.+)$`),
        Severity: severity.Error,
    },
    // Import error
    {
        Regex:    regexp.MustCompile(`(?m)^(.+\.go):(\d+):(\d+): could not import (.+)$`),
        Severity: severity.Error,
    },
    // Undefined error
    {
        Regex:    regexp.MustCompile(`(?m)^(.+\.go):(\d+):(\d+): undefined: (.+)$`),
        Severity: severity.Error,
    },
}
```

---

## Executor Factory

```go
import "brun/internal/enums/runtimetype"

type ExecutorFactory struct {
    config *Config
    logger *LogService
}

func (f *ExecutorFactory) Create(rt runtimetype.RuntimeType) apperror.Result[Executor] {
    if rt.IsPowerShell() {
        return apperror.Ok[Executor](&PowerShellExecutor{
            path:   f.config.Runtimes.PowerShell.Path,
            args:   f.config.Runtimes.PowerShell.Args,
            logger: f.logger,
        })
    }
    
    if rt.IsNodeJs() {
        return apperror.Ok[Executor](&NodeJSExecutor{
            nodePath:       f.config.Runtimes.NodeJS.Path,
            packageManager: f.config.Runtimes.NodeJS.PackageManager,
            logger:         f.logger,
        })
    }
    
    if rt.IsGolang() {
        return apperror.Ok[Executor](&GolangExecutor{
            goPath:     f.config.Runtimes.Golang.Path,
            buildFlags: f.config.Runtimes.Golang.BuildFlags,
            modTidy:    f.config.Runtimes.Golang.ModTidy,
            logger:     f.logger,
        })
    }
    
    return apperror.Fail[Executor](
        apperror.New(
            7106,
            "unknown runtime: "+rt.Label(),
        ),
    )
}
```

---

## Runtime Version Detection

```go
func (e *GolangExecutor) GetVersion() apperror.Result[string] {
    cmd := exec.Command(e.goPath, "version")
    output, execErr := cmd.Output()
    if execErr != nil {
        return apperror.Fail[string](
            apperror.Wrap(
                execErr,
                7201,
                "go runtime not found",
            ),
        )
    }

    // Parse: "go version go1.21.0 linux/amd64"
    return apperror.Ok(parseGoVersion(string(output)))
}

func (e *NodeJSExecutor) GetVersion() apperror.Result[string] {
    cmd := exec.Command(e.nodePath, "--version")
    output, execErr := cmd.Output()
    if execErr != nil {
        return apperror.Fail[string](
            apperror.Wrap(
                execErr,
                7201,
                "node runtime not found",
            ),
        )
    }

    return apperror.Ok(strings.TrimSpace(string(output)))
}

func (e *PowerShellExecutor) GetVersion() apperror.Result[string] {
    cmd := exec.Command(e.path, "-Command", "$PSVersionTable.PSVersion.ToString()")
    output, execErr := cmd.Output()
    if execErr != nil {
        return apperror.Fail[string](
            apperror.Wrap(
                execErr,
                7201,
                "powershell runtime not found",
            ),
        )
    }

    return apperror.Ok(strings.TrimSpace(string(output)))
}
```

---

## See Also

- [CLI Interface](./02-cli-interface.md)
- [Error Handling](./06-error-handling.md)
- [Integration API](./09-integration-api.md)
