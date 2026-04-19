# Code Generation System - Parallel Executor

**Version:** 2.0.0  
**Status:** Draft  
**Updated:** 2026-03-09  

---

## Overview

Concurrent code generation engine with per-project worker pools and batch-based execution respecting topological order.

**Cross-References:**
- [Overview](./00-overview.md)
- [Plan Generator](./04-plan-generator.md)
- [LLM Server Management](../06-ai-integration/07-llm-server-management.md)

---

## Execution Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         PARALLEL EXECUTION ENGINE                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                        PROJECT WORKER POOLS                              ││
│  │                                                                          ││
│  │  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐       ││
│  │  │  Project A Pool  │  │  Project B Pool  │  │  Project C Pool  │       ││
│  │  │  ┌────┐ ┌────┐   │  │  ┌────┐ ┌────┐   │  │  ┌────┐ ┌────┐   │       ││
│  │  │  │ W1 │ │ W2 │   │  │  │ W1 │ │ W2 │   │  │  │ W1 │ │ W2 │   │       ││
│  │  │  └────┘ └────┘   │  │  └────┘ └────┘   │  │  └────┘ └────┘   │       ││
│  │  │  ┌────┐ ┌────┐   │  │  ┌────┐ ┌────┐   │  │  ┌────┐ ┌────┐   │       ││
│  │  │  │ W3 │ │ W4 │   │  │  │ W3 │ │ W4 │   │  │  │ W3 │ │ W4 │   │       ││
│  │  │  └────┘ └────┘   │  │  └────┘ └────┘   │  │  └────┘ └────┘   │       ││
│  │  └──────────────────┘  └──────────────────┘  └──────────────────┘       ││
│  │                                                                          ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                          SHARED RESOURCES                                ││
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐  ││
│  │  │    Model     │  │    Credit    │  │     Git      │  │  WebSocket  │  ││
│  │  │   Selector   │  │   Tracker    │  │   Manager    │  │   Streamer  │  ││
│  │  └──────────────┘  └──────────────┘  └──────────────┘  └─────────────┘  ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Data Models

### ExecutionSession

```go
type ExecutionSession struct {
    Id              uint            `gorm:"primaryKey"`
    Uuid            string          `gorm:"uniqueIndex;size:36"`
    PlanId          uint            `gorm:"index"`
    Plan            *GenerationPlan `gorm:"foreignKey:PlanId"`
    
    Status          SessionStatus   `gorm:"default:0"`
    
    TotalFiles      int
    CompletedFiles  int
    FailedFiles     int
    SkippedFiles    int
    
    TotalTokens     int64
    TotalCredits    float64
    
    CurrentBatch    int
    WorkersActive   int
    
    StartedAt       time.Time
    CompletedAt     *time.Time
    
    ErrorLog        string          `gorm:"type:text"`  // JSON array of errors
}

type SessionStatus int

const (
    SessionStatusPending   SessionStatus = iota
    SessionStatusRunning
    SessionStatusPaused
    SessionStatusCompleted
    SessionStatusFailed
    SessionStatusCancelled
)
```

### GeneratedFile

```go
type GeneratedFile struct {
    Id              uint            `gorm:"primaryKey"`
    SessionId       uint            `gorm:"index"`
    PlannedFileId   uint            `gorm:"index"`
    
    FilePath        string          `gorm:"size:500"`
    Content         string          `gorm:"type:longtext"`
    ContentHash     string          `gorm:"size:64"`
    
    ModelUsed       string          `gorm:"size:100"`
    PromptTokens    int64
    CompletionTokens int64
    
    GenerationTime  int64           // milliseconds
    
    Status          GeneratedStatus `gorm:"default:0"`
    ErrorMessage    string          `gorm:"type:text"`
    
    CreatedAt       time.Time
}

type GeneratedStatus int

const (
    GeneratedStatusSuccess GeneratedStatus = iota
    GeneratedStatusError
    GeneratedStatusRetried
)
```

---

## Worker Pool Implementation

```go
type WorkerPool struct {
    projectId     string
    maxWorkers    int
    workers       []*Worker
    taskQueue     chan *GenerationTask
    resultChan    chan *GenerationResult
    ctx           context.Context
    cancel        context.CancelFunc
    wg            sync.WaitGroup
    metrics       *PoolMetrics
}

func NewWorkerPool(projectId string, maxWorkers int) *WorkerPool {
    ctx, cancel := context.WithCancel(context.Background())
    
    pool := &WorkerPool{
        projectId:  projectId,
        maxWorkers: maxWorkers,
        taskQueue:  make(chan *GenerationTask, 100),
        resultChan: make(chan *GenerationResult, 100),
        ctx:        ctx,
        cancel:     cancel,
        metrics:    &PoolMetrics{},
    }
    
    // Start workers
    for i := 0; i < maxWorkers; i++ {
        worker := NewWorker(i, pool)
        pool.workers = append(pool.workers, worker)
        pool.wg.Add(1)
        go worker.Run()
    }
    
    return pool
}

func (p *WorkerPool) Submit(task *GenerationTask) error {
    select {
    case p.taskQueue <- task:
        return nil
    case <-p.ctx.Done():
        return ErrPoolShutdown
    default:
        return ErrQueueFull
    }
}

func (p *WorkerPool) Shutdown() {
    p.cancel()
    close(p.taskQueue)
    p.wg.Wait()
    close(p.resultChan)
}
```

### Worker Implementation

```go
type Worker struct {
    id           int
    pool         *WorkerPool
    modelClient  *ModelClient
    codeWriter   *CodeWriter
}

func (w *Worker) Run() {
    defer w.pool.wg.Done()
    
    for {
        select {
        case task, ok := <-w.pool.taskQueue:
            if !ok {
                return
            }
            result := w.process(task)
            w.pool.resultChan <- result
            
        case <-w.pool.ctx.Done():
            return
        }
    }
}

func (w *Worker) process(task *GenerationTask) *GenerationResult {
    start := time.Now()
    result := &GenerationResult{
        Task: task,
    }
    
    // Build prompt from guidelines and spec
    prompt := w.buildPrompt(task)
    
    // Call LLM
    response, err := w.modelClient.Generate(task.Model, prompt)
    if err != nil {
        result.Error = err
        return result
    }
    
    result.GeneratedCode = response.Content
    result.TokensUsed = response.TokensInput + response.TokensOutput
    result.Duration = time.Since(start)
    
    return result
}
```

---

## Batch Execution Flow

```go
type BatchExecutor struct {
    pool          *WorkerPool
    batchQueue    []*ExecutionBatch
    currentBatch  int
    results       map[string]*GenerationResult
    mutex         sync.Mutex
}

func (e *BatchExecutor) ExecutePlan(plan *GenerationPlan) error {
    batches, err := e.loadBatches(plan.Id)
    if err != nil {
        return err
    }
    
    for _, batch := range batches {
        // Wait for dependent batches to complete
        if err := e.waitForDependencies(batch); err != nil {
            return err
        }
        
        // Submit all files in batch (they run in parallel)
        for _, file := range batch.Files {
            task := e.createTask(file, plan)
            if err := e.pool.Submit(task); err != nil {
                return err
            }
        }
        
        // Wait for all files in batch to complete
        if err := e.waitForBatch(batch); err != nil {
            return err
        }
        
        // Write files to disk
        if err := e.writeFiles(batch); err != nil {
            return err
        }
        
        e.currentBatch++
    }
    
    return nil
}

func (e *BatchExecutor) waitForBatch(batch *ExecutionBatch) error {
    completed := 0
    expected := len(batch.Files)
    
    for completed < expected {
        select {
        case result := <-e.pool.resultChan:
            e.mutex.Lock()
            e.results[result.Task.File.FilePath] = result
            e.mutex.Unlock()
            
            if result.Error != nil {
                // Handle error but continue
                log.Error("File generation failed",
                    "file", result.Task.File.FilePath,
                    "error", result.Error)
            }
            completed++
            
        case <-time.After(30 * time.Minute):
            return ErrBatchTimeout
        }
    }
    
    return nil
}
```

---

## Code Writer

```go
type CodeWriter struct {
    rootPath    string
    pathManager *PathManager
    gitManager  *GitManager
}

func (w *CodeWriter) WriteGeneratedFiles(results []*GenerationResult) error {
    for _, result := range results {
        if result.Error != nil {
            continue
        }
        
        fullPath := filepath.Join(w.rootPath, result.Task.File.FilePath)
        
        // Create directory if needed
        dir := filepath.Dir(fullPath)
        if err := pathutil.EnsureDir(dir); err != nil {
            return err
        }
        
        // Write file
        if err := pathutil.WriteFile(fullPath, []byte(result.GeneratedCode), 0644); err != nil {
            return err
        }
        
        // Format file based on language
        if err := w.formatFile(fullPath, result.Task.File.Language); err != nil {
            log.Warn("Format failed", "file", fullPath, "error", err)
        }
    }
    
    return nil
}

func (w *CodeWriter) formatFile(path, language string) error {
    switch language {
    case "go":
        return exec.Command("gofmt", "-w", path).Run()
    case "react", "typescript":
        return exec.Command("npx", "prettier", "--write", path).Run()
    default:
        return nil
    }
}
```

---

## Prompt Building

```go
type PromptBuilder struct {
    guidelineResolver *GuidelineResolver
    templateEngine    *template.Template
}

// PromptTemplateContext is the typed template data for prompt building (no map[string]interface{})
type PromptTemplateContext struct {
    Guidelines     string
    FilePath       string
    FileType       string
    Language       string
    Description    string
    SpecContent    string
    Dependencies   string
    ProjectContext string
}

func (b *PromptBuilder) BuildPrompt(task *GenerationTask) apperror.Result[string] {
    // Get merged guidelines
    guidelines, err := b.guidelineResolver.Resolve(
        task.ProjectId,
        task.UserId,
        task.File.Language,
    )
    if err != nil {
        return "", err
    }
    
    // Build template context
    ctx := PromptTemplateContext{
        Guidelines:     guidelines.MergedPrompt,
        FilePath:       task.File.FilePath,
        FileType:       task.File.FileType,
        Language:       task.File.Language,
        Description:    task.File.Description,
        SpecContent:    task.SpecContent,
        Dependencies:   task.DependencyContext,
        ProjectContext: task.ProjectContext,
    }
    
    var buf bytes.Buffer
    if err := b.templateEngine.Execute(&buf, ctx); err != nil {
        return "", err
    }
    
    return buf.String(), nil
}
```

### Prompt Template

```
You are an expert {{.Language}} developer. Generate code following these guidelines:

## Coding Guidelines
{{.Guidelines}}

## File to Generate
- Path: {{.FilePath}}
- Type: {{.FileType}}
- Description: {{.Description}}

## Specification
{{.SpecContent}}

## Dependency Context
{{range .Dependencies}}
### {{.FilePath}}
{{.Summary}}
{{end}}

## Instructions
1. Generate only the code for the specified file
2. Follow all coding guidelines strictly
3. Use proper imports based on dependencies
4. Include comprehensive documentation
5. Handle errors according to guidelines

Generate the complete, production-ready code:
```

---

## Progress Streaming

```go
type ProgressStreamer struct {
    wsHub       *WebSocketHub
    sessionId   string
}

func (s *ProgressStreamer) StreamProgress(event *ProgressEvent) {
    s.wsHub.Broadcast(s.sessionId, &WSMessage{
        Type: "codegen:progress",
        Payload: event,
    })
}

type ProgressEvent struct {
    SessionId      string
    CurrentBatch   int
    TotalBatches   int
    CurrentFile    string
    CompletedFiles int
    TotalFiles     int
    FailedFiles    int
    TokensUsed     int64
    ElapsedTime    int64
    Status         string
}
```

---

## Configuration

```json
{
  "ParallelExecution": {
    "MaxWorkersPerProject": 4,
    "MaxConcurrentProjects": 3,
    "TaskQueueSize": 100,
    "BatchTimeout": "30m",
    "FileTimeout": "5m",
    "RetryAttempts": 2,
    "RetryDelay": "5s"
  }
}
```

---

## Error Handling

| Error Code | Description |
|------------|-------------|
| 16300 | Execution session failed |
| 16301 | Worker pool exhausted |
| 16302 | Task queue full |
| 16303 | Batch timeout |
| 16304 | File generation timeout |
| 16305 | Model unavailable |
| 16306 | Insufficient credits |
| 16307 | Dependency resolution failed |
