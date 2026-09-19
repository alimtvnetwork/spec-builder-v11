# Loop Validation System

**Version:** 2.0.0  
**Status:** Draft  
**Updated:** 2026-03-09

---

## Overview

The Loop Validation System provides iterative validation and auto-fix capabilities for both specifications and generated code. It runs validation cycles until reaching a target quality score (99%+) or error-free state, automatically applying AI-generated fixes between iterations. All iterations are logged for auditability.

**Cross-References:**
- [Consistency Checker](../08-consistency-checker/00-overview.md)
- [Build Runner CLI](../23-build-runner-cli/00-overview.md)
- [Code Generation System](./00-overview.md)
- [Project Editor UI](./20-project-editor-ui.md)
- [AI Integration](../06-ai-integration/00-overview.md)

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         LOOP VALIDATION SYSTEM                                   │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌──────────────────────────────────────────────────────────────────────────┐   │
│  │                        SPEC LOOP VALIDATOR                                │   │
│  │                                                                           │   │
│  │  ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐               │   │
│  │  │Validate │───▶│ Analyze │───▶│AI Fix   │───▶│ Apply   │───┐           │   │
│  │  │  Spec   │    │ Issues  │    │Generator│    │ Fixes   │   │           │   │
│  │  └─────────┘    └─────────┘    └─────────┘    └─────────┘   │           │   │
│  │       ▲                                                      │           │   │
│  │       └──────────────────────────────────────────────────────┘           │   │
│  │                          (loop until 99%+)                                │   │
│  └──────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
│  ┌──────────────────────────────────────────────────────────────────────────┐   │
│  │                        BUILD LOOP VALIDATOR                               │   │
│  │                                                                           │   │
│  │  ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐               │   │
│  │  │brun     │───▶│ Parse   │───▶│AI Fix   │───▶│ Apply   │───┐           │   │
│  │  │ check   │    │ Errors  │    │Generator│    │ Patches │   │           │   │
│  │  └─────────┘    └─────────┘    └─────────┘    └─────────┘   │           │   │
│  │       ▲                                                      │           │   │
│  │       └──────────────────────────────────────────────────────┘           │   │
│  │                        (loop until 0 errors)                              │   │
│  └──────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
│  ┌──────────────────────────────────────────────────────────────────────────┐   │
│  │                         LOGGING & REPORTING                               │   │
│  │                                                                           │   │
│  │  logs/validation/                                                         │   │
│  │  ├── 2026-01-29_001_spec-loop.json                                       │   │
│  │  ├── 2026-01-29_002_build-loop-golang.json                               │   │
│  │  └── 2026-01-29_003_build-loop-react.json                                │   │
│  └──────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Spec Loop Validation

### Configuration

```go
type SpecLoopConfig struct {
    TargetScore        float64       // Target consistency score (default: 99.0)
    MaxIterations      int           // Maximum loops (default: 10)
    StopOnNoImprovement bool         // Stop if score doesn't improve (default: true)
    MinImprovementPercent float64    // Minimum improvement to continue (default: 0.5)
    FixCategories      []string      // Issue categories to auto-fix
    PauseOnMajorChange bool          // Pause for user approval on major changes
    MajorChangeThreshold int         // Files changed to consider "major" (default: 5)
    Timeout            time.Duration // Overall timeout (default: 30min)
    IterationTimeout   time.Duration // Per-iteration timeout (default: 5min)
}

func DefaultSpecLoopConfig() SpecLoopConfig {
    return SpecLoopConfig{
        TargetScore:          99.0,
        MaxIterations:        10,
        StopOnNoImprovement:  true,
        MinImprovementPercent: 0.5,
        FixCategories:        []string{"broken_links", "missing_sections", "naming"},
        PauseOnMajorChange:   false,
        MajorChangeThreshold: 5,
        Timeout:              30 * time.Minute,
        IterationTimeout:     5 * time.Minute,
    }
}
```

### Issue Categories

| Category | Description | Auto-Fixable |
|----------|-------------|--------------|
| `broken_links` | Invalid cross-references | ✓ |
| `missing_sections` | Required sections not present | ✓ |
| `naming` | Inconsistent naming conventions | ✓ |
| `duplicate_ids` | Duplicate identifiers | ✓ |
| `orphan_files` | Unreferenced files | Partial |
| `circular_refs` | Circular references | ✗ (notify) |
| `schema_mismatch` | Schema validation failures | ✓ |
| `outdated_refs` | Stale references to old content | ✓ |

### Spec Loop Service

```go
package validation

import (
    stdctx "context"
    "fmt"
    "time"
    
    "github.com/google/uuid"
)

// SpecLoopValidator runs iterative spec validation
type SpecLoopValidator struct {
    config            SpecLoopConfig
    consistencyEngine ConsistencyEngine
    aiService         AIService
    fileService       FileService
    loopRepo          LoopValidationRepository
    eventBus          EventBus
}

// SpecLoopResult represents the complete loop result
type SpecLoopResult struct {
    Id               string
    ProjectId        string
    StartedAt        time.Time
    CompletedAt      time.Time
    TotalDurationMs  int
    
    // Iterations
    TotalIterations  int
    Iterations       []SpecIteration
    
    // Final State
    InitialScore     float64
    FinalScore       float64
    ScoreImprovement float64
    Success          bool
    StopReason       string  // "target_reached", "max_iterations", "no_improvement", "timeout", "error"
    
    // Aggregates
    TotalIssuesFound int
    TotalIssuesFixed int
    TotalFilesChanged int
    TotalTokensUsed  int
}

// SpecIteration represents one validation cycle
type SpecIteration struct {
    Number           int
    StartedAt        time.Time
    CompletedAt      time.Time
    DurationMs       int
    
    // Validation
    ScoreBefore      float64
    ScoreAfter       float64
    IssuesFound      []ConsistencyIssue
    IssuesFixed      []FixedIssue
    
    // Changes
    FilesAnalyzed    int
    FilesChanged     []FileChange
    
    // AI Usage
    TokensUsed       int
    ModelUsed        string
}

// FileChange tracks a file modification
type FileChange struct {
    FilePath     string
    ChangeType   string  // "modified", "created", "deleted"
    LinesAdded   int
    LinesRemoved int
    Diff         string  // Unified diff format
}

// FixedIssue represents a fixed issue
type FixedIssue struct {
    IssueId      string
    Category     string
    Description  string
    FilePath     string
    FixApplied   string
    Success      bool
}

// RunLoop executes the validation loop
func (v *SpecLoopValidator) RunLoop(
    context stdctx.Context,
    projectId string,
) appfault.Result[SpecLoopResult] {
    // Initialize result
    result := &SpecLoopResult{
        Id:          uuid.New().String(),
        ProjectId:   projectId,
        StartedAt:   time.Now(),
        Iterations:  make([]SpecIteration, 0),
    }
    
    // Create timeout context
    context, cancel := stdctx.WithTimeout(context, v.config.Timeout)
    defer cancel()
    
    // Get initial score
    initialReport, err := v.consistencyEngine.Validate(context, projectId)
    if err != nil {
        return appfault.FailWrap[SpecLoopResult](
            err,
            "E7100",
            "initial validation failed",
        )
    }

    result.InitialScore = initialReport.Score
    
    // --- Typed Event Payloads (no map[string]interface{}) ---
    type LoopStartedEvent struct {
        LoopId       string  
        ProjectId    string  
        InitialScore float64 
    }
    type LoopIterationEvent struct {
        LoopId      string  
        Iteration   int     
        ScoreBefore float64 
        ScoreAfter  float64 
        IssuesFixed int     
    }
    type LoopPausedEvent struct {
        LoopId       string 
        Iteration    int    
        FilesChanged int    
        Reason       string 
    }
    
    v.eventBus.Publish("loop:spec:started", LoopStartedEvent{
        LoopId:       result.Id,
        ProjectId:    projectId,
        InitialScore: result.InitialScore,
    })
    
    currentScore := result.InitialScore
    var lastScore float64 = 0
    
    // Main loop
    for i := 1; i <= v.config.MaxIterations; i++ {
        select {
        case <-context.Done():
            result.StopReason = "timeout"
            break
        default:
        }
        
        // Check if target reached
        if currentScore >= v.config.TargetScore {
            result.StopReason = "target_reached"
            result.Success = true
            break
        }
        
        // Check for improvement stall
        if v.config.StopOnNoImprovement && i > 1 {
            improvement := currentScore - lastScore
            if improvement < v.config.MinImprovementPercent {
                result.StopReason = "no_improvement"
                break
            }
        }

        lastScore = currentScore
        
        // Run iteration
        iterationResult := v.runIteration(context, projectId, i, currentScore)
        if iterationResult.HasError() {
            result.StopReason = fmt.Sprintf("error: %v", iterationResult.Error())
            break
        }
        
        iteration := iterationResult.Value()
        result.Iterations = append(result.Iterations, iteration)
        currentScore = iteration.ScoreAfter
        
        // Aggregate stats
        result.TotalIssuesFound += len(iteration.IssuesFound)
        result.TotalIssuesFixed += len(iteration.IssuesFixed)
        result.TotalFilesChanged += len(iteration.FilesChanged)
        result.TotalTokensUsed += iteration.TokensUsed
        
        v.eventBus.Publish("loop:spec:iteration", LoopIterationEvent{
            LoopId:      result.Id,
            Iteration:   i,
            ScoreBefore: iteration.ScoreBefore,
            ScoreAfter:  iteration.ScoreAfter,
            IssuesFixed: len(iteration.IssuesFixed),
        })
        
        // Check for major changes
        if v.config.PauseOnMajorChange && len(iteration.FilesChanged) >= v.config.MajorChangeThreshold {
            v.eventBus.Publish("loop:spec:paused", LoopPausedEvent{
                LoopId:       result.Id,
                Iteration:    i,
                FilesChanged: len(iteration.FilesChanged),
                Reason:       "major_changes",
            })
            // Wait for user approval (would need approval mechanism)
        }
    }
    
    if result.StopReason == "" && result.TotalIterations >= v.config.MaxIterations {
        result.StopReason = "max_iterations"
    }
    
    // Finalize result
    result.CompletedAt = time.Now()
    result.TotalDurationMs = int(time.Since(result.StartedAt).Milliseconds())
    result.TotalIterations = len(result.Iterations)
    result.FinalScore = currentScore
    result.ScoreImprovement = currentScore - result.InitialScore
    
    // Save result
    if err := v.loopRepo.SaveSpecLoopResult(context, result); err != nil {
        return appfault.FailWrap[SpecLoopResult](
            err,
            "E7100",
            "failed to save loop result",
        )
    }
    
    // Write log file
    if err := v.writeLogFile(context, projectId, result); err != nil {
        // Log but don't fail
        fmt.Printf("Warning: failed to write log file: %v\n", err)
    }
    
    v.eventBus.Publish("loop:spec:completed", SpecLoopCompletedEvent{
        LoopId:          result.Id,
        TotalIterations: result.TotalIterations,
        InitialScore:    result.InitialScore,
        FinalScore:      result.FinalScore,
        Success:         result.Success,
        StopReason:      result.StopReason,
    })
    
    return appfault.Ok(*result)
}

// runIteration executes a single validation-fix cycle
func (v *SpecLoopValidator) runIteration(
    context stdctx.Context,
    projectId string,
    number int,
    currentScore float64,
) appfault.Result[SpecIteration] {
    context, cancel := stdctx.WithTimeout(context, v.config.IterationTimeout)
    defer cancel()
    
    iteration := &SpecIteration{
        Number:      number,
        StartedAt:   time.Now(),
        ScoreBefore: currentScore,
    }
    
    // 1. Run consistency check
    report, err := v.consistencyEngine.Validate(context, projectId)
    if err != nil {
        return appfault.FailWrap[SpecIteration](
            err,
            "E7101",
            "validation failed",
        )
    }
    
    iteration.FilesAnalyzed = report.FilesAnalyzed
    iteration.IssuesFound = report.Issues
    
    // 2. Filter fixable issues
    fixableIssues := v.filterFixableIssues(report.Issues)
    if len(fixableIssues) == 0 {
        // No fixable issues, score won't improve
        iteration.ScoreAfter = report.Score
        iteration.CompletedAt = time.Now()
        iteration.DurationMs = int(time.Since(iteration.StartedAt).Milliseconds())

        return appfault.Ok(*iteration)
    }
    
    // 3. Generate fixes with AI
    fixes, tokensUsed, err := v.generateFixes(context, projectId, fixableIssues)
    if err != nil {
        return appfault.FailWrap[SpecIteration](
            err,
            "E7101",
            "fix generation failed",
        )
    }

    iteration.TokensUsed = tokensUsed
    
    // 4. Apply fixes
    var appliedFixes []FixedIssue
    var fileChanges []FileChange
    
    for _, fix := range fixes {
        applied, change, err := v.applyFix(context, fix)
        if err != nil {
            applied = FixedIssue{
                IssueId:     fix.IssueId,
                Category:    fix.Category,
                Description: fix.Description,
                FilePath:    fix.FilePath,
                Success:     false,
            }
        }

        appliedFixes = append(appliedFixes, applied)
        if change != nil {
            fileChanges = append(fileChanges, *change)
        }
    }
    
    iteration.IssuesFixed = appliedFixes
    iteration.FilesChanged = fileChanges
    
    // 5. Re-validate to get new score
    newReport, err := v.consistencyEngine.Validate(context, projectId)
    if err != nil {
        return appfault.FailWrap[SpecIteration](
            err,
            "E7101",
            "post-fix validation failed",
        )
    }
    
    iteration.ScoreAfter = newReport.Score
    iteration.CompletedAt = time.Now()
    iteration.DurationMs = int(time.Since(iteration.StartedAt).Milliseconds())
    
    return appfault.Ok(*iteration)
}

// filterFixableIssues returns issues that can be auto-fixed
func (v *SpecLoopValidator) filterFixableIssues(issues []ConsistencyIssue) []ConsistencyIssue {
    var fixable []ConsistencyIssue
    for _, issue := range issues {
        for _, category := range v.config.FixCategories {
            if issue.Category == category {
                fixable = append(fixable, issue)
                break
            }
        }
    }
    return fixable
}

// Fix generation prompt
const specFixPrompt = `You are a technical documentation expert fixing spec consistency issues.

For each issue, provide a specific fix that can be applied to the file.
Maintain consistent formatting and cross-references.

Output Format (JSON array):
[
  {
    "issueId": "issue_123",
    "filePath": "path/to/file.md",
    "fixType": "replace|insert|delete",
    "searchText": "text to find (for replace)",
    "replaceText": "replacement text",
    "lineNumber": 42,
    "explanation": "Brief explanation of the fix"
  }
]`
```

---

## Build Loop Validation

### Configuration

```go
type BuildLoopConfig struct {
    Language           string        // "golang", "react", or specific
    MaxIterations      int           // Maximum loops (default: 10)
    StopOnNoProgress   bool          // Stop if error count doesn't decrease
    BrunOptions        BrunCheckOptions
    Timeout            time.Duration // Overall timeout (default: 60min)
    IterationTimeout   time.Duration // Per-iteration (default: 10min)
}

type BrunCheckOptions struct {
    WorkDir      string
    BuildProfile string
    Verbose      bool
    JsonOutput   bool
}

func DefaultBuildLoopConfig() BuildLoopConfig {
    return BuildLoopConfig{
        MaxIterations:    10,
        StopOnNoProgress: true,
        Timeout:          60 * time.Minute,
        IterationTimeout: 10 * time.Minute,
        BrunOptions: BrunCheckOptions{
            Verbose:    true,
            JsonOutput: true,
        },
    }
}
```

### Build Loop Service

```go
package validation

// BuildLoopValidator runs iterative build validation
type BuildLoopValidator struct {
    config      BuildLoopConfig
    brunRunner  BrunRunner
    aiService   AIService
    fileService FileService
    loopRepo    LoopValidationRepository
    eventBus    EventBus
}

// BuildLoopResult represents complete build loop result
type BuildLoopResult struct {
    Id               string
    ProjectId        string
    Language         string
    StartedAt        time.Time
    CompletedAt      time.Time
    TotalDurationMs  int
    
    // Iterations
    TotalIterations  int
    Iterations       []BuildIteration
    
    // Final State
    InitialErrors    int
    FinalErrors      int
    Success          bool
    StopReason       string
    
    // Aggregates
    TotalFixesApplied int
    TotalFilesChanged int
    TotalTokensUsed   int
}

// BuildIteration represents one build-fix cycle
type BuildIteration struct {
    Number           int
    StartedAt        time.Time
    CompletedAt      time.Time
    DurationMs       int
    
    // Build Results
    ErrorsBefore     int
    ErrorsAfter      int
    BuildOutput      string
    Errors           []BuildError
    
    // Fixes
    FixesGenerated   []CodeFix
    FixesApplied     []AppliedFix
    
    // Changes
    FilesChanged     []FileChange
    
    // AI Usage
    TokensUsed       int
    ModelUsed        string
}

// BuildError from brun check
type BuildError struct {
    Code        string
    Message     string
    FilePath    string
    Line        int
    Column      int
    Severity    string
    Suggestion  string
}

// CodeFix represents an AI-generated fix
type CodeFix struct {
    ErrorCode   string
    FilePath    string
    FixType     string  // "replace", "insert", "delete"
    OldCode     string
    NewCode     string
    LineStart   int
    LineEnd     int
    Explanation string
}

// AppliedFix tracks fix application result
type AppliedFix struct {
    Fix       CodeFix
    Success   bool
    Error     string
}

// --- Typed Event Payloads for Build Loop (no map[string]interface{}) ---

type SpecLoopCompletedEvent struct {
    LoopId          string
    TotalIterations int
    InitialScore    float64
    FinalScore      float64
    Success         bool
    StopReason      string
}

type BuildLoopStartedEvent struct {
    LoopId        string
    ProjectId     string
    Language      string
    InitialErrors int
}

type BuildLoopIterationEvent struct {
    LoopId       string
    Iteration    int
    ErrorsBefore int
    ErrorsAfter  int
    FixesApplied int
}

type BuildLoopCompletedEvent struct {
    LoopId          string
    TotalIterations int
    InitialErrors   int
    FinalErrors     int
    Success         bool
    StopReason      string
}

type ParallelBuildCompletedEvent struct {
    LoopId          string
    BackendSuccess  bool
    FrontendSuccess bool
}

// RunLoop executes the build validation loop
func (v *BuildLoopValidator) RunLoop(
    context stdctx.Context,
    projectId string,
    language string,
) appfault.Result[BuildLoopResult] {
    result := &BuildLoopResult{
        Id:          uuid.New().String(),
        ProjectId:   projectId,
        Language:    language,
        StartedAt:   time.Now(),
        Iterations:  make([]BuildIteration, 0),
    }
    
    context, cancel := stdctx.WithTimeout(context, v.config.Timeout)
    defer cancel()
    
    // Get initial error count
    initialCheck, err := v.brunRunner.Check(context, BrunCheckRequest{
        WorkDir:  v.getWorkDir(projectId, language),
        Language: language,
        Options:  v.config.BrunOptions,
    })
    if err != nil {
        return appfault.FailWrap[BuildLoopResult](
            err,
            "E7102",
            "initial build check failed",
        )
    }
    
    result.InitialErrors = len(initialCheck.Errors)
    currentErrors := result.InitialErrors
    
    v.eventBus.Publish("loop:build:started", BuildLoopStartedEvent{
        LoopId:        result.Id,
        ProjectId:     projectId,
        Language:      language,
        InitialErrors: result.InitialErrors,
    })
    
    var lastErrorCount int = -1
    
    // Main loop
    for i := 1; i <= v.config.MaxIterations; i++ {
        select {
        case <-context.Done():
            result.StopReason = "timeout"
            break
        default:
        }
        
        // Check if build is clean
        if currentErrors == 0 {
            result.StopReason = "build_clean"
            result.Success = true
            break
        }
        
        // Check for progress stall
        if v.config.StopOnNoProgress && lastErrorCount >= 0 && currentErrors >= lastErrorCount {
            result.StopReason = "no_progress"
            break
        }

        lastErrorCount = currentErrors
        
        // Run iteration
        iterationResult := v.runBuildIteration(context, projectId, language, i, currentErrors)
        if iterationResult.HasError() {
            result.StopReason = fmt.Sprintf("error: %v", iterationResult.Error())
            break
        }
        
        iteration := iterationResult.Value()
        result.Iterations = append(result.Iterations, iteration)
        currentErrors = iteration.ErrorsAfter
        
        // Aggregate
        result.TotalFixesApplied += len(iteration.FixesApplied)
        result.TotalFilesChanged += len(iteration.FilesChanged)
        result.TotalTokensUsed += iteration.TokensUsed
        
        v.eventBus.Publish("loop:build:iteration", BuildLoopIterationEvent{
            LoopId:       result.Id,
            Iteration:    i,
            ErrorsBefore: iteration.ErrorsBefore,
            ErrorsAfter:  iteration.ErrorsAfter,
            FixesApplied: len(iteration.FixesApplied),
        })
    }
    
    if result.StopReason == "" && len(result.Iterations) >= v.config.MaxIterations {
        result.StopReason = "max_iterations"
    }
    
    result.CompletedAt = time.Now()
    result.TotalDurationMs = int(time.Since(result.StartedAt).Milliseconds())
    result.TotalIterations = len(result.Iterations)
    result.FinalErrors = currentErrors
    
    // Save result
    if err := v.loopRepo.SaveBuildLoopResult(context, result); err != nil {
        return appfault.FailWrap[BuildLoopResult](
            err,
            "E7102",
            "failed to save build loop result",
        )
    }
    
    // Write log file
    if err := v.writeLogFile(context, projectId, language, result); err != nil {
        fmt.Printf("Warning: failed to write log file: %v\n", err)
    }
    
    v.eventBus.Publish("loop:build:completed", BuildLoopCompletedEvent{
        LoopId:          result.Id,
        TotalIterations: result.TotalIterations,
        InitialErrors:   result.InitialErrors,
        FinalErrors:     result.FinalErrors,
        Success:         result.Success,
        StopReason:      result.StopReason,
    })
    
    return appfault.Ok(*result)
}

// runBuildIteration executes one build-fix cycle
func (v *BuildLoopValidator) runBuildIteration(
    context stdctx.Context,
    projectId string,
    language string,
    number int,
    currentErrors int,
) appfault.Result[BuildIteration] {
    context, cancel := stdctx.WithTimeout(context, v.config.IterationTimeout)
    defer cancel()
    
    iteration := &BuildIteration{
        Number:       number,
        StartedAt:    time.Now(),
        ErrorsBefore: currentErrors,
    }
    
    // 1. Run brun check
    workDir := v.getWorkDir(projectId, language)
    checkResult, err := v.brunRunner.Check(context, BrunCheckRequest{
        WorkDir:  workDir,
        Language: language,
        Options:  v.config.BrunOptions,
    })
    if err != nil {
        return appfault.FailWrap[BuildIteration](
            err,
            "E7103",
            "brun check failed",
        )
    }
    
    iteration.BuildOutput = checkResult.Output
    iteration.Errors = checkResult.Errors
    
    if len(checkResult.Errors) == 0 {
        iteration.ErrorsAfter = 0
        iteration.CompletedAt = time.Now()
        iteration.DurationMs = int(time.Since(iteration.StartedAt).Milliseconds())

        return appfault.Ok(*iteration)
    }
    
    // 2. Convert errors to markdown for AI
    errorContext := v.formatErrorsForAI(checkResult.Errors)
    
    // 3. Generate fixes with AI
    fixes, tokensUsed, err := v.generateCodeFixes(context, projectId, language, errorContext)
    if err != nil {
        return appfault.FailWrap[BuildIteration](
            err,
            "E7103",
            "fix generation failed",
        )
    }
    
    iteration.FixesGenerated = fixes
    iteration.TokensUsed = tokensUsed
    
    // 4. Apply fixes
    var appliedFixes []AppliedFix
    var fileChanges []FileChange
    
    for _, fix := range fixes {
        applied, change, err := v.applyCodeFix(context, workDir, fix)
        appliedFixes = append(appliedFixes, AppliedFix{
            Fix:     fix,
            Success: err == nil,
            Error:   errorString(err),
        })
        if change != nil {
            fileChanges = append(fileChanges, *change)
        }
    }
    
    iteration.FixesApplied = appliedFixes
    iteration.FilesChanged = fileChanges
    
    // 5. Re-check build
    recheckResult, err := v.brunRunner.Check(context, BrunCheckRequest{
        WorkDir:  workDir,
        Language: language,
        Options:  v.config.BrunOptions,
    })
    if err != nil {
        return appfault.FailWrap[BuildIteration](
            err,
            "E7103",
            "post-fix check failed",
        )
    }
    
    iteration.ErrorsAfter = len(recheckResult.Errors)
    iteration.CompletedAt = time.Now()
    iteration.DurationMs = int(time.Since(iteration.StartedAt).Milliseconds())
    
    return appfault.Ok(*iteration)
}

// Fix generation prompt for code
const codeFixPrompt = `You are an expert programmer fixing build errors.
Analyze the errors and provide minimal, targeted fixes.
Do not change code unrelated to the error.
Preserve existing formatting and style.

Output Format (JSON array):
[
  {
    "errorCode": "ErrLoopValidation7101",
    "filePath": "path/to/file.go",
    "fixType": "replace",
    "lineStart": 42,
    "lineEnd": 45,
    "oldCode": "original code...",
    "newCode": "fixed code...",
    "explanation": "Brief explanation"
  }
]`
```

---

## Parallel Backend/Frontend Validation

```go
// ParallelBuildValidator runs BE and FE loops simultaneously
type ParallelBuildValidator struct {
    buildValidator *BuildLoopValidator
    eventBus       EventBus
}

// RunParallel executes both backend and frontend loops concurrently
func (v *ParallelBuildValidator) RunParallel(
    context stdctx.Context,
    projectId string,
) appfault.Result[ParallelBuildResult] {
    result := &ParallelBuildResult{
        Id:        uuid.New().String(),
        ProjectId: projectId,
        StartedAt: time.Now(),
    }
    
    g, gContext := errgroup.WithContext(context)
    
    var backendResult BuildLoopResult
    var frontendResult BuildLoopResult
    
    // Backend loop
    g.Go(func() error {
        r := v.buildValidator.RunLoop(gContext, projectId, "golang")
        if r.HasError() {
            return r.Error()
        }

        backendResult = r.Value()
        return nil
    })
    
    // Frontend loop
    g.Go(func() error {
        r := v.buildValidator.RunLoop(gContext, projectId, "react")
        if r.HasError() {
            return r.Error()
        }

        frontendResult = r.Value()
        return nil
    })
    
    if err := g.Wait(); err != nil {
        return appfault.FailWrap[ParallelBuildResult](
            err,
            "E7104",
            "parallel build validation failed",
        )
    }
    
    result.BackendResult = &backendResult
    result.FrontendResult = &frontendResult
    result.CompletedAt = time.Now()
    result.TotalDurationMs = int(time.Since(result.StartedAt).Milliseconds())
    result.Success = backendResult.Success && frontendResult.Success
    
    v.eventBus.Publish("loop:parallel:completed", ParallelBuildCompletedEvent{
        LoopId:          result.Id,
        BackendSuccess:  backendResult.Success,
        FrontendSuccess: frontendResult.Success,
    })
    
    return appfault.Ok(*result)
}

type ParallelBuildResult struct {
    Id              string
    ProjectId       string
    StartedAt       time.Time
    CompletedAt     time.Time
    TotalDurationMs int
    
    BackendResult   *BuildLoopResult
    FrontendResult  *BuildLoopResult
    
    Success         bool
}
```

---

## Log File Structure

### Filesystem Layout

```
{workDirectory}/
└── data/
    └── projects/
        └── {project_name}/
            └── logs/
                └── validation/
                    ├── 2026-01-29_001_spec-loop.json
                    ├── 2026-01-29_002_build-loop-golang.json
                    ├── 2026-01-29_003_build-loop-react.json
                    └── 2026-01-29_004_parallel-build.json
```

### Log File Schema

```typescript
interface ValidationLog {
  // Metadata
  id: string;
  projectId: string;
  projectName: string;
  type: 'spec-loop' | 'build-loop' | 'parallel-build';
  language?: string;  // For build loops
  
  // Timing
  startedAt: string;  // ISO8601
  completedAt: string;
  totalDurationMs: number;
  
  // Summary
  initialState: {
    score?: number;      // Spec loop
    errorCount?: number; // Build loop
  };
  finalState: {
    score?: number;
    errorCount?: number;
  };
  success: boolean;
  stopReason: string;
  
  // Iterations
  totalIterations: number;
  iterations: IterationLog[];
  
  // Aggregates
  totals: {
    issuesFound?: number;
    issuesFixed?: number;
    fixesApplied?: number;
    filesChanged: number;
    tokensUsed: number;
  };
}

interface IterationLog {
  number: number;
  startedAt: string;
  completedAt: string;
  durationMs: number;
  
  // Before/After
  stateBefore: number;  // Score or error count
  stateAfter: number;
  
  // Issues/Errors
  items: Array<{
    id: string;
    type: string;
    description: string;
    filePath: string;
    fixed: boolean;
  }>;
  
  // Changes
  changes: Array<{
    filePath: string;
    changeType: string;
    linesAdded: number;
    linesRemoved: number;
  }>;
}
```

---

## Database Schema

```sql
CREATE TABLE LoopValidationRun (
    Id TEXT PRIMARY KEY,
    ProjectId TEXT NOT NULL,
    
    -- Type
    Type TEXT NOT NULL CHECK (Type IN ('spec', 'build', 'parallel')),
    Language TEXT,                    -- For build type
    
    -- Timing
    StartedAt TEXT NOT NULL,
    CompletedAt TEXT,
    TotalDurationMs INTEGER,
    
    -- Initial State
    InitialScore REAL,               -- Spec loop
    InitialErrors INTEGER,           -- Build loop
    
    -- Final State
    FinalScore REAL,
    FinalErrors INTEGER,
    Success INTEGER NOT NULL DEFAULT 0,
    StopReason TEXT,
    
    -- Aggregates
    TotalIterations INTEGER DEFAULT 0,
    TotalIssuesFound INTEGER DEFAULT 0,
    TotalIssuesFixed INTEGER DEFAULT 0,
    TotalFilesChanged INTEGER DEFAULT 0,
    TotalTokensUsed INTEGER DEFAULT 0,
    
    -- Log File
    LogFilePath TEXT,
    
    -- Timestamps
    CreatedAt TEXT NOT NULL DEFAULT (datetime('now')),
    
    FOREIGN KEY (ProjectId) REFERENCES Project(Id) ON DELETE CASCADE
);

CREATE INDEX IdxLoopValidationRunProjectId ON LoopValidationRun(ProjectId);
CREATE INDEX IdxLoopValidationRunType ON LoopValidationRun(Type);
CREATE INDEX IdxLoopValidationRunStartedAt ON LoopValidationRun(StartedAt DESC);
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/projects/{id}/validate/spec-loop` | Start spec loop validation |
| POST | `/api/v1/projects/{id}/validate/build-loop` | Start build loop validation |
| POST | `/api/v1/projects/{id}/validate/parallel` | Start parallel BE/FE build loops |
| GET | `/api/v1/projects/{id}/validation-runs` | List validation runs |
| GET | `/api/v1/validation-runs/{id}` | Get validation run details |
| GET | `/api/v1/validation-runs/{id}/log` | Get full log file |
| DELETE | `/api/v1/validation-runs/{id}` | Delete validation run |
| POST | `/api/v1/validation-runs/{id}/cancel` | Cancel running validation |

---

## WebSocket Events

| Event | Direction | Payload |
|-------|-----------|---------|
| `loop:spec:started` | Server→Client | `{loopId, projectId, initialScore}` |
| `loop:spec:iteration` | Server→Client | `{loopId, iteration, scoreBefore, scoreAfter}` |
| `loop:spec:paused` | Server→Client | `{loopId, reason, filesChanged}` |
| `loop:spec:completed` | Server→Client | `{loopId, finalScore, success, stopReason}` |
| `loop:build:started` | Server→Client | `{loopId, language, initialErrors}` |
| `loop:build:iteration` | Server→Client | `{loopId, iteration, errorsBefore, errorsAfter}` |
| `loop:build:completed` | Server→Client | `{loopId, finalErrors, success, stopReason}` |
| `loop:parallel:completed` | Server→Client | `{loopId, backendSuccess, frontendSuccess}` |

---

## Configuration Keys

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `validation.spec.targetScore` | float | 99.0 | Target consistency score |
| `validation.spec.maxIterations` | int | 10 | Maximum spec loop iterations |
| `validation.spec.timeoutMinutes` | int | 30 | Overall timeout |
| `validation.build.maxIterations` | int | 10 | Maximum build loop iterations |
| `validation.build.timeoutMinutes` | int | 60 | Overall timeout |
| `validation.logs.retentionDays` | int | 30 | Log file retention |
| `validation.ai.modelCategory` | string | "coding" | Model for fix generation |

---

## Error Codes

| Code | Constant | Description |
|------|----------|-------------|
| 12800 | ERR_LOOP_VALIDATION_FAILED | Loop validation failed |
| 12801 | ERR_LOOP_TIMEOUT | Loop timeout exceeded |
| 12802 | ERR_LOOP_NO_PROGRESS | No improvement detected |
| 12803 | ERR_LOOP_MAX_ITERATIONS | Maximum iterations reached |
| 12804 | ERR_LOOP_FIX_FAILED | Fix application failed |
| 12805 | ERR_LOOP_CANCELLED | Loop cancelled by user |
| 12806 | ERR_LOOP_LOG_WRITE_FAILED | Log file write failed |

---

## Related Specifications

- [Consistency Checker](../08-consistency-checker/00-overview.md)
- [Build Runner CLI](../23-build-runner-cli/00-overview.md)
- [Code Generation System](./00-overview.md)
- [Project Editor UI](./20-project-editor-ui.md)
- [AI Integration](../06-ai-integration/00-overview.md)
- [Error Code Registry](../../06-error-management/01-error-code-registry.md)
