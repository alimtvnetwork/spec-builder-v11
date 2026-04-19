# Runtime Executors

**Version:** 2.0.0  
**Status:** Draft  
**Updated:** 2026-03-09  

---

## Overview

Specification for runtime executors that handle command execution across PowerShell, Node.js, and Go environments.

**Cross-References:**
- [Core Architecture](./01-core-architecture.md)
- [CLI Interface](./02-cli-interface.md)
- [Error Handling](./06-error-handling.md)

---

## Executor Interface

```go
type Executor interface {
    Execute(context context.Context, command *Command) apperror.Result[ExecutionResult]
    Validate() *apperror.AppError
    GetVersion() apperror.Result[string]
    ParseErrors(output string) []BuildError
}

type Command struct {
    Type        runtimetype.Variant
    Script      string              // Script path or inline command
    Args        []string            // Additional arguments
    WorkDir     string              // Working directory
    Env         map[string]string   // Environment variables
    Timeout     time.Duration       // Execution timeout
    PreCommands []string            // Commands before main execution
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

func (e *PowerShellExecutor) Execute(context context.Context, command *Command) apperror.Result[ExecutionResult] {
    args := e.buildArgs(command)

    execCmd := exec.CommandContext(context, e.path, args...)
    execCmd.Dir = command.WorkDir
    execCmd.Env = mergeEnv(os.Environ(), command.Env)

    return e.captureExecution(execCmd)
}

func (e *PowerShellExecutor) buildArgs(command *Command) []string {
    isFilePath := command.Script != "" && isFilePath(command.Script)

    if isFilePath {
        args := append(e.args, "-File", command.Script)
        return append(args, command.Args...)
    }

    return append(e.args, "-Command", command.Script)
}

func (e *PowerShellExecutor) captureExecution(execCmd *exec.Cmd) apperror.Result[ExecutionResult] {
    var stdout, stderr bytes.Buffer
    execCmd.Stdout = &stdout
    execCmd.Stderr = &stderr

    startTime := time.Now()
    err := execCmd.Run()
    endTime := time.Now()

    isSuccess := err == nil
    isFailed := err != nil

    return apperror.Ok(ExecutionResult{
        IsSuccess: isSuccess,
        IsFailed:  isFailed,
        ExitCode:  getExitCode(err),
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
        Severity: "error",
        Extract:  func(m []string) BuildError { /* parse file, line, message */ },
    },
    {
        Regex:    regexp.MustCompile(`(?m)^At (.+):(\d+) char:(\d+)`),
        Severity: "error",
    },
    {
        Regex:    regexp.MustCompile(`(?m)^.*FullyQualifiedErrorId : (.+)$`),
        Severity: "error",
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
type NodeJSExecutor struct {
    nodePath       string
    packageManager string  // npm, yarn, bun
    logger         *LogService
}

func (e *NodeJSExecutor) Execute(context context.Context, command *Command) apperror.Result[ExecutionResult] {
    execPath, args := e.resolvePackageManager(command)
    args = append(args, command.Args...)

    execCmd := exec.CommandContext(context, execPath, args...)
    execCmd.Dir = command.WorkDir
    execCmd.Env = mergeEnv(os.Environ(), command.Env)

    return e.captureExecution(execCmd)
}

func (e *NodeJSExecutor) resolvePackageManager(command *Command) (string, []string) {
    switch e.packageManager {
    case "yarn":
        return "yarn", []string{command.Script}

    case "bun":
        return "bun", []string{"run", command.Script}

    default:
        return "npm", []string{"run", command.Script}
    }
}

func (e *NodeJSExecutor) Validate() *apperror.AppError {
    _, err := exec.LookPath(e.packageManager)

    if err != nil {
        return apperror.New(
            "%s not found in PATH",
            e.packageManager,
        ).WithSkip(1)
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
        Severity: "error",
    },
    // ESLint errors
    {
        Regex:    regexp.MustCompile(`(?m)^\s*(\d+):(\d+)\s+error\s+(.+)$`),
        Severity: "error",
    },
    // Vite/webpack build errors
    {
        Regex:    regexp.MustCompile(`(?m)^ERROR in (.+)$`),
        Severity: "error",
    },
    // npm ERR!
    {
        Regex:    regexp.MustCompile(`(?m)^npm ERR! (.+)$`),
        Severity: "error",
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
type GolangExecutor struct {
    goPath     string
    buildFlags []string
    modTidy    string  // skip, run, force
    logger     *LogService
}

func (e *GolangExecutor) Execute(context context.Context, command *Command) apperror.Result[ExecutionResult] {
    results := &ExecutionResult{StartTime: time.Now()}

    tidyErr := e.handleModTidy(context, command, results)

    if tidyErr != nil {
        return apperror.Fail[ExecutionResult](tidyErr)
    }

    return e.runGoBuild(context, command, results)
}

func (e *GolangExecutor) handleModTidy(context context.Context, command *Command, results *ExecutionResult) *apperror.AppError {
    shouldSkip := e.modTidy == "skip"

    if shouldSkip {
        return nil
    }

    tidyResult := e.runModTidy(context, command)
    results.Stdout += tidyResult.Stdout
    results.Stderr += tidyResult.Stderr

    hasFailed := tidyResult.ExitCode != 0
    isForceMode := e.modTidy == "force"

    if hasFailed && isForceMode {
        return apperror.New(
            "go mod tidy failed",
        ).
            WithCode(ErrBrunGoModTidyFailed).
            WithSkip(1)
    }

    return nil
}

func (e *GolangExecutor) runGoBuild(context context.Context, command *Command, results *ExecutionResult) apperror.Result[ExecutionResult] {
    args := []string{"build"}
    args = append(args, e.buildFlags...)
    args = append(args, command.Args...)
    args = append(args, command.Script)

    execCmd := exec.CommandContext(context, e.goPath, args...)
    execCmd.Dir = command.WorkDir
    execCmd.Env = mergeEnv(os.Environ(), command.Env)

    var stdout, stderr bytes.Buffer
    execCmd.Stdout = &stdout
    execCmd.Stderr = &stderr

    err := execCmd.Run()
    isSuccess := err == nil
    isFailed := err != nil

    results.EndTime = time.Now()
    results.Duration = results.EndTime.Sub(results.StartTime)
    results.ExitCode = getExitCode(err)
    results.IsSuccess = isSuccess
    results.IsFailed = isFailed
    results.Stdout += stdout.String()
    results.Stderr += stderr.String()
    results.Errors = e.ParseErrors(stderr.String())

    return apperror.Ok(*results)
}

func (e *GolangExecutor) runModTidy(context context.Context, command *Command) ExecutionResult {
    execCmd := exec.CommandContext(context, e.goPath, "mod", "tidy")
    execCmd.Dir = command.WorkDir

    var stdout, stderr bytes.Buffer
    execCmd.Stdout = &stdout
    execCmd.Stderr = &stderr

    err := execCmd.Run()

    return ExecutionResult{
        ExitCode: getExitCode(err),
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
    // Package error
    {
        Regex:    regexp.MustCompile(`(?m)^package (.+): (.+)$`),
        Severity: "error",
    },
    // Import error
    {
        Regex:    regexp.MustCompile(`(?m)^(.+\.go):(\d+):(\d+): could not import (.+)$`),
        Severity: "error",
    },
    // Undefined error
    {
        Regex:    regexp.MustCompile(`(?m)^(.+\.go):(\d+):(\d+): undefined: (.+)$`),
        Severity: "error",
    },
}
```

---

## Executor Factory

```go
type ExecutorFactory struct {
    config *Config
    logger *LogService
}

func (f *ExecutorFactory) Create(runtime runtimetype.Variant) apperror.Result[Executor] {
    switch runtime {
    case runtimetype.PowerShell:
        return &PowerShellExecutor{
            path:   f.config.Runtimes.PowerShell.Path,
            args:   f.config.Runtimes.PowerShell.Args,
            logger: f.logger,
        })
        
    case runtimetype.NodeJs:
        return &NodeJSExecutor{
            nodePath:       f.config.Runtimes.NodeJS.Path,
            packageManager: f.config.Runtimes.NodeJS.PackageManager,
            logger:         f.logger,
        })
        
    case runtimetype.Golang:
        return &GolangExecutor{
            goPath:     f.config.Runtimes.Golang.Path,
            buildFlags: f.config.Runtimes.Golang.BuildFlags,
            modTidy:    f.config.Runtimes.Golang.ModTidy,
            logger:     f.logger,
        })
        
    default:
        return apperror.FailNew[Executor](
            ErrBrunConfigRuntimeInvalid,
            "unknown runtime: %s",
            runtime,
        )
    }
}
```

---

## Runtime Version Detection

```go
func (e *GolangExecutor) GetVersion() apperror.Result[string] {
    cmd := exec.Command(e.goPath, "version")
    output, err := cmd.Output()

    if err != nil {
        return apperror.FailWrap[string](err, "failed to get Go version")
    }

    return apperror.Ok(parseGoVersion(string(output)))
}

func (e *NodeJSExecutor) GetVersion() apperror.Result[string] {
    cmd := exec.Command(e.nodePath, "--version")
    output, err := cmd.Output()

    if err != nil {
        return apperror.FailWrap[string](err, "failed to get Node.js version")
    }

    return apperror.Ok(strings.TrimSpace(string(output)))
}

func (e *PowerShellExecutor) GetVersion() apperror.Result[string] {
    cmd := exec.Command(e.path, "-Command", "$PSVersionTable.PSVersion.ToString()")
    output, err := cmd.Output()

    if err != nil {
        return apperror.FailWrap[string](err, "failed to get PowerShell version")
    }

    return apperror.Ok(strings.TrimSpace(string(output)))
}
```

---

## See Also

- [CLI Interface](./02-cli-interface.md)
- [Error Handling](./06-error-handling.md)
- [Integration API](./09-integration-api.md)
