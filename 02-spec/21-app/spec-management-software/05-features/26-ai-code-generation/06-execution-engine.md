# 06. Execution Engine

**Version:** 2.0.0  
**Status:** Planned  
**Updated:** 2026-03-09
**Parent:** [Overview](./00-overview.md)

---

## Purpose

Define the execution engine that compiles and runs generated Golang code in a sandboxed environment with proper error handling, timeout management, and output capture.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    EXECUTION ENGINE                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │   Compiler   │───▶│   Sandbox    │───▶│   Runner     │  │
│  │              │    │              │    │              │  │
│  │  go build    │    │  Isolation   │    │  Execute     │  │
│  │  validation  │    │  Limits      │    │  Capture     │  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
│         │                   │                   │           │
│         ▼                   ▼                   ▼           │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                   OUTPUT HANDLER                      │   │
│  │  • Stdout/Stderr capture                              │   │
│  │  • Exit code handling                                 │   │
│  │  • JSON result parsing                                │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Execution Pipeline

### Phase 1: Preparation

```go
type ExecutionConfig struct {
    WorkDir       string
    TargetDir     string
    DryRun        bool
    Timeout       time.Duration
    MaxMemoryMb   int
    MaxFileSizeMb int
    EnableNetwork bool
}

type ExecutionEngine struct {
    config    ExecutionConfig
    compiler  *Compiler
    sandbox   *Sandbox
    logger    *HistoryLogger
}

func NewExecutionEngine(config ExecutionConfig) *ExecutionEngine {
    return &ExecutionEngine{
        config:   config,
        compiler: NewCompiler(),
        sandbox:  NewSandbox(config),
    }
}

func (ee *ExecutionEngine) Prepare(code string) appfault.Result[*PreparedTask] {
    // Create isolated work directory
    workDir, err := pathutil.MkdirTemp("", "codegen-exec-*")
    if err != nil {
        return appfault.Fail[*PreparedTask](
            appfault.Wrap(
                err,
                ErrWorkDirCreate,
                "failed to create work dir",
            ),
        )
    }
    
    // Write source code
    mainPath := filepath.Join(workDir, "main.go")
    if err := pathutil.WriteFile(mainPath, []byte(code), 0644); err != nil {
        return appfault.Fail[*PreparedTask](
            appfault.Wrap(
                err,
                ErrFileWrite,
                "failed to write source",
            ),
        )
    }
    
    // Write go.mod
    modContent := "module task\n\ngo 1.21\n"
    modPath := filepath.Join(workDir, "go.mod")
    if err := pathutil.WriteFile(modPath, []byte(modContent), 0644); err != nil {
        return appfault.Fail[*PreparedTask](
            appfault.Wrap(
                err,
                ErrFileWrite,
                "failed to write go.mod",
            ),
        )
    }
    
    return appfault.Ok(&PreparedTask{
        WorkDir:    workDir,
        SourcePath: mainPath,
        BinaryPath: filepath.Join(workDir, "task"),
    })
}
```

### Phase 2: Compilation

```go
type Compiler struct {
    goPath string
}

type CompileResult struct {
    Success    bool
    BinaryPath string         `json:",omitempty"`
    Errors     []CompileError `json:",omitempty"`
    Duration   time.Duration
}

type CompileError struct {
    File    string
    Line    int
    Column  int
    Message string
}

func (c *Compiler) Compile(task *PreparedTask) appfault.Result[*CompileResult] {
    startTime := time.Now()
    
    cmd := exec.Command("go", "build", "-o", task.BinaryPath, ".")
    cmd.Dir = task.WorkDir
    cmd.Env = append(os.Environ(),
        "CGO_ENABLED=0",
        "GOOS="+runtime.GOOS,
        "GOARCH="+runtime.GOARCH,
    )
    
    output, err := cmd.CombinedOutput()
    result := &CompileResult{
        Duration: time.Since(startTime),
    }
    
    if err != nil {
        result.Success = false
        result.Errors = parseCompileErrors(string(output))
        return appfault.Ok(result)
    }
    
    result.Success = true
    result.BinaryPath = task.BinaryPath
    return appfault.Ok(result)
}

func parseCompileErrors(output string) []CompileError {
    var errors []CompileError
    
    // Parse Go compiler output format: file:line:column: message
    re := regexp.MustCompile(`([^:]+):(\d+):(\d+): (.+)`)
    matches := re.FindAllStringSubmatch(output, -1)
    
    for _, match := range matches {
        if len(match) == 5 {
            line, _ := strconv.Atoi(match[2])
            col, _ := strconv.Atoi(match[3])
            errors = append(errors, CompileError{
                File:    match[1],
                Line:    line,
                Column:  col,
                Message: match[4],
            })
        }
    }
    
    return errors
}
```

### Phase 3: Sandboxed Execution

```go
type Sandbox struct {
    config ExecutionConfig
}

type SandboxLimits struct {
    MaxMemoryBytes int64
    MaxFileSize    int64
    MaxProcesses   int
    MaxOpenFiles   int
    Timeout        time.Duration
    AllowNetwork   bool
    AllowedPaths   []string
}

func (s *Sandbox) Execute(task *PreparedTask, args []string) appfault.Result[*ExecutionResult] {
    ctx, cancel := context.WithTimeout(context.Background(), s.config.Timeout)
    defer cancel()
    
    // Build command with arguments
    cmdArgs := append([]string{}, args...)
    if s.config.DryRun {
        cmdArgs = append(cmdArgs, "--dry-run")
    }
    cmdArgs = append(cmdArgs, "--json")
    cmdArgs = append(cmdArgs, "--dir", s.config.TargetDir)
    
    cmd := exec.CommandContext(ctx, task.BinaryPath, cmdArgs...)
    cmd.Dir = task.WorkDir
    
    // Set resource limits (Linux-specific)
    if runtime.GOOS == "linux" {
        cmd.SysProcAttr = &syscall.SysProcAttr{
            Setpgid: true,
        }
    }
    
    // Capture output
    var stdout, stderr bytes.Buffer
    cmd.Stdout = &stdout
    cmd.Stderr = &stderr
    
    startTime := time.Now()
    err := cmd.Run()
    duration := time.Since(startTime)
    
    result := &ExecutionResult{
        Duration: duration,
        Stdout:   stdout.String(),
        Stderr:   stderr.String(),
    }
    
    if ctx.Err() == context.DeadlineExceeded {
        result.Success = false
        result.ExitCode = -1
        result.ErrorMessage = "execution timeout exceeded"
        return appfault.Ok(result)
    }
    
    if err != nil {
        // EXEMPTED: stdlib boundary — exec.ExitError (§7.2)
        if exitErr, ok := err.(*exec.ExitError); ok {
            result.ExitCode = exitErr.ExitCode()
        } else {
            result.ExitCode = -1
        }
        result.Success = false
        result.ErrorMessage = err.Error()
        return appfault.Ok(result)
    }
    
    result.Success = true
    result.ExitCode = 0
    
    // Parse JSON output
    if err := json.Unmarshal([]byte(stdout.String()), &result.TaskOutput); err != nil {
        result.ParseError = err.Error()
    }
    
    return appfault.Ok(result)
}
```

---

## Execution Result

```go
type ExecutionResult struct {
    Success       bool
    ExitCode      int
    Duration      time.Duration
    Stdout        string
    Stderr        string
    ErrorMessage  string          `json:",omitempty"`
    ParseError    string          `json:",omitempty"`
    TaskOutput    *TaskOutput     `json:",omitempty"`
    FilesAffected int
    Operations    []HistoryEntry  `json:",omitempty"`
}

type TaskOutput struct {
    Success       bool
    FilesAffected int
    Operations    []HistoryEntry
    Duration      time.Duration
    ErrorMessage  string `json:",omitempty"`
}
```

---

## Error Recovery

### Compilation Error Fix Loop

```go
func (ee *ExecutionEngine) ExecuteWithRetry(code string, maxRetries int) appfault.Result[ExecutionResult] {
    var lastError error
    currentCode := code
    
    for attempt := 0; attempt < maxRetries; attempt++ {
        // Prepare
        task, err := ee.Prepare(currentCode)
        if err != nil {
            return nil, err
        }
        defer pathutil.RemoveAll(task.WorkDir)
        
        // Compile
        compileResult, err := ee.compiler.Compile(task)
        if err != nil {
            return nil, err
        }
        
        if !compileResult.Success {
            // Try to fix with AI
            if attempt < maxRetries-1 {
                currentCode, err = ee.fixCodeWithAI(currentCode, compileResult.Errors)
                if err != nil {
                    lastError = err
                    continue
                }
                continue
            }
            return nil, appfault.New(
                ErrCompilationFailed,
                fmt.Sprintf("compilation failed: %v", compileResult.Errors),
            )
        }
        
        // Execute
        result, err := ee.sandbox.Execute(task, nil)
        if err != nil {
            return nil, err
        }
        
        if !result.Success && result.ExitCode != 0 {
            // Try to fix runtime errors
            if attempt < maxRetries-1 {
                currentCode, err = ee.fixRuntimeError(currentCode, result.Stderr)
                if err != nil {
                    lastError = err
                    continue
                }
                continue
            }
        }
        
        return result, nil
    }
    
    return nil, appfault.Wrap(
        lastError,
        ErrExecutionFailed,
        fmt.Sprintf("execution failed after %d attempts", maxRetries),
    )
}

func (ee *ExecutionEngine) fixCodeWithAI(code string, errors []CompileError) appfault.Result[string] {
    prompt := fmt.Sprintf(`
The following Golang code has compilation errors:

ERRORS:
%s

CODE:
%s

Fix all compilation errors and return the corrected code only.
`, formatCompileErrors(errors), code)
    
    // Call LLM to fix
    return ee.llmClient.GenerateCode(prompt)
}
```

---

## Cleanup

```go
func (ee *ExecutionEngine) Cleanup(task *PreparedTask) error {
    if task == nil || task.WorkDir == "" {
        return nil
    }
    
    // Remove work directory
    if err := pathutil.RemoveAll(task.WorkDir); err != nil {
        return appfault.Wrap(
            err,
            ErrCleanup,
            "failed to cleanup work dir",
        )
    }
    
    return nil
}
```

---

## TypeScript Types

```typescript
interface ExecutionConfig {
  readonly workDir: string;
  readonly targetDir: string;
  readonly dryRun: boolean;
  readonly timeoutMs: number;
  readonly maxMemoryMb: number;
  readonly maxFileSizeMb: number;
  readonly enableNetwork: boolean;
}

interface CompileResult {
  readonly success: boolean;
  readonly binaryPath: string | null;
  readonly errors: readonly CompileError[];
  readonly durationMs: number;
}

interface CompileError {
  readonly file: string;
  readonly line: number;
  readonly column: number;
  readonly message: string;
}

interface ExecutionResult {
  readonly success: boolean;
  readonly exitCode: number;
  readonly durationMs: number;
  readonly stdout: string;
  readonly stderr: string;
  readonly errorMessage: string | null;
  readonly parseError: string | null;
  readonly taskOutput: TaskOutput | null;
  readonly filesAffected: number;
  readonly operations: readonly HistoryEntry[];
}

interface TaskOutput {
  readonly success: boolean;
  readonly filesAffected: number;
  readonly operations: readonly HistoryEntry[];
  readonly durationMs: number;
  readonly errorMessage: string | null;
}
```

---

## Security Considerations

| Concern | Mitigation |
|---------|------------|
| Path Traversal | Validate all paths against target directory |
| Resource Exhaustion | Memory/CPU/time limits via sandbox |
| Network Access | Disabled by default, configurable |
| File System Access | Restricted to target directory |
| Process Spawning | Limited child processes |

---

## Related Specs

- [03-code-generator.md](./03-code-generator.md) — Generates code to execute
- [07-approval-workflow.md](./07-approval-workflow.md) — Approval before execution
- [08-history-logger.md](./08-history-logger.md) — Logs execution operations
