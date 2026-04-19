# 09. Multi-Model Executor

**Version:** 2.0.0  
**Status:** Planned  
**Updated:** 2026-03-09
**Parent:** [Overview](./00-overview.md)

---

## Purpose

Define the multi-model parallel execution system that orchestrates different LLM models for different task phases, enabling fast parallel processing of long-chain commands while selecting optimal models for each subtask.

---

## Model Categories

| Category | Purpose | Recommended Models | Use Cases |
|----------|---------|-------------------|------------|
| Thinking | Reasoning, planning | r1, o1, qwen-thinking | Intent analysis, complexity scoring |
| Coding | Code generation | codellama, deepseek, starcoder | Golang code generation, fixes |
| Writing | Content generation | llama-3, mistral, claude | Documentation, tag generation |
| Fast | Quick responses | llama-3-8b, mistral-7b | Simple tasks, validation |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  MULTI-MODEL EXECUTOR                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                 TASK ORCHESTRATOR                     │   │
│  │  • Decomposes long-chain commands                     │   │
│  │  • Assigns models to subtasks                         │   │
│  │  • Manages dependencies                               │   │
│  └──────────────────────────────────────────────────────┘   │
│                           │                                  │
│           ┌───────────────┼───────────────┐                 │
│           ▼               ▼               ▼                 │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │  THINKING   │ │   CODING    │ │  WRITING    │           │
│  │   MODEL     │ │   MODEL     │ │   MODEL     │           │
│  │             │ │             │ │             │           │
│  │  - r1       │ │ - codellama │ │ - llama-3   │           │
│  │  - o1       │ │ - deepseek  │ │ - mistral   │           │
│  └─────────────┘ └─────────────┘ └─────────────┘           │
│           │               │               │                 │
│           └───────────────┼───────────────┘                 │
│                           ▼                                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                 RESULT AGGREGATOR                     │   │
│  │  • Combines subtask outputs                           │   │
│  │  • Handles errors and retries                         │   │
│  │  • Returns final result                               │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Model Selection

### Selection Hierarchy

```go
type ModelCategory string

const (
    CategoryThinking ModelCategory = "thinking"
    CategoryCoding   ModelCategory = "coding"
    CategoryWriting  ModelCategory = "writing"
    CategoryFast     ModelCategory = "fast"
)

type ModelConfig struct {
    Id          string
    Name        string
    Category    ModelCategory
    Endpoint    string
    MaxTokens   int
    Temperature float64
    Timeout     time.Duration
    Priority    int           // Lower = preferred
}

type ModelSelector struct {
    models   map[ModelCategory][]ModelConfig
    fallback ModelConfig
}

func (ms *ModelSelector) SelectModel(category ModelCategory, taskComplexity int) ModelConfig {
    candidates, ok := ms.models[category]
    if !ok || len(candidates) == 0 {
        return ms.fallback
    }
    
    // Sort by priority
    sort.Slice(candidates, func(i, j int) bool {
        return candidates[i].Priority < candidates[j].Priority
    })
    
    // For complex tasks, prefer larger models
    if taskComplexity > 7 {
        for _, model := range candidates {
            if strings.Contains(model.Id, "large") || strings.Contains(model.Id, "70b") {
                return model
            }
        }
    }
    
    return candidates[0]
}
```

### Task-to-Model Mapping

```go
type TaskPhase string

const (
    PhaseIntentAnalysis    TaskPhase = "intent_analysis"
    PhaseComplexityScoring TaskPhase = "complexity_scoring"
    PhaseCodeGeneration    TaskPhase = "code_generation"
    PhaseCodeFix           TaskPhase = "code_fix"
    PhaseTagGeneration     TaskPhase = "tag_generation"
    PhaseDocumentation     TaskPhase = "documentation"
    PhaseValidation        TaskPhase = "validation"
)

var phaseToCategory = map[TaskPhase]ModelCategory{
    PhaseIntentAnalysis:    CategoryThinking,
    PhaseComplexityScoring: CategoryThinking,
    PhaseCodeGeneration:    CategoryCoding,
    PhaseCodeFix:           CategoryCoding,
    PhaseTagGeneration:     CategoryWriting,
    PhaseDocumentation:     CategoryWriting,
    PhaseValidation:        CategoryFast,
}

func (ms *ModelSelector) SelectForPhase(phase TaskPhase, complexity int) ModelConfig {
    category := phaseToCategory[phase]
    return ms.SelectModel(category, complexity)
}
```

---

## Parallel Execution

### Task Decomposition

```go
type SubTask struct {
    Id           string
    Phase        TaskPhase
    Prompt       string
    DependsOn    []string
    Priority     int
    Timeout      time.Duration
    RetryCount   int
    ModelOverride *string `json:",omitempty"`
}

type TaskGraph struct {
    Tasks    []SubTask
    Results  map[string]*TaskResult
    mu       sync.RWMutex
}

func DecomposeCommand(command string) *TaskGraph {
    graph := &TaskGraph{
        Tasks:   []SubTask{},
        Results: make(map[string]*TaskResult),
    }
    
    // Phase 1: Intent Analysis (no dependencies)
    graph.Tasks = append(graph.Tasks, SubTask{
        Id:       "intent",
        Phase:    PhaseIntentAnalysis,
        Prompt:   fmt.Sprintf("Analyze the intent of this command: %s", command),
        Priority: 1,
        Timeout:  10 * time.Second,
    })
    
    // Phase 2: Complexity Scoring (depends on intent)
    graph.Tasks = append(graph.Tasks, SubTask{
        Id:        "complexity",
        Phase:     PhaseComplexityScoring,
        Prompt:    "Score the complexity of this task based on the intent analysis",
        DependsOn: []string{"intent"},
        Priority:  2,
        Timeout:   5 * time.Second,
    })
    
    // Phase 3: Code Generation (depends on complexity)
    graph.Tasks = append(graph.Tasks, SubTask{
        Id:        "codegen",
        Phase:     PhaseCodeGeneration,
        Prompt:    "Generate Golang code for this task",
        DependsOn: []string{"complexity"},
        Priority:  3,
        Timeout:   30 * time.Second,
    })
    
    // Phase 4: Tag Generation (can run parallel with code validation)
    graph.Tasks = append(graph.Tasks, SubTask{
        Id:        "tags",
        Phase:     PhaseTagGeneration,
        Prompt:    "Generate tags for this task",
        DependsOn: []string{"intent"},
        Priority:  4,
        Timeout:   5 * time.Second,
    })
    
    return graph
}
```

### Parallel Executor

```go
type ParallelExecutor struct {
    selector    *ModelSelector
    llmClient   LLMClient
    maxParallel int
    results     chan TaskResult
}

type TaskResult struct {
    TaskId    string
    Success   bool
    Output    string
    Model     string
    Duration  time.Duration
    Error     string `json:",omitempty"`
    TokensIn  int
    TokensOut int
}

func (pe *ParallelExecutor) Execute(graph *TaskGraph) apperror.Result[map[string]*TaskResult] {
    var wg sync.WaitGroup
    semaphore := make(chan struct{}, pe.maxParallel)
    
    // Track completed tasks
    completed := make(map[string]bool)
    var mu sync.Mutex
    
    // Process tasks in dependency order
    for len(completed) < len(graph.Tasks) {
        for _, task := range graph.Tasks {
            // Skip if already completed
            mu.Lock()
            if completed[task.Id] {
                mu.Unlock()
                continue
            }
            
            // Check dependencies
            allDepsComplete := true
            for _, dep := range task.DependsOn {
                if !completed[dep] {
                    allDepsComplete = false
                    break
                }
            }
            mu.Unlock()
            
            if !allDepsComplete {
                continue
            }
            
            // Execute task
            wg.Add(1)
            go func(t SubTask) {
                defer wg.Done()
                semaphore <- struct{}{}
                defer func() { <-semaphore }()
                
                result := pe.executeTask(t, graph)
                
                mu.Lock()
                graph.Results[t.Id] = &result
                completed[t.Id] = true
                mu.Unlock()
            }(task)
        }
        
        // Wait a bit before checking again
        time.Sleep(10 * time.Millisecond)
    }
    
    wg.Wait()
    return graph.Results, nil
}

func (pe *ParallelExecutor) executeTask(task SubTask, graph *TaskGraph) TaskResult {
    startTime := time.Now()
    
    // Select model
    model := pe.selector.SelectForPhase(task.Phase, 5)
    if task.ModelOverride != nil {
        model.Id = *task.ModelOverride
    }
    
    // Build prompt with dependency results
    prompt := task.Prompt
    for _, dep := range task.DependsOn {
        if result, ok := graph.Results[dep]; ok && result.Success {
            prompt = fmt.Sprintf("%s\n\nContext from %s:\n%s", prompt, dep, result.Output)
        }
    }
    
    // Execute with retry
    var lastErr error
    for attempt := 0; attempt <= task.RetryCount; attempt++ {
        ctx, cancel := context.WithTimeout(context.Background(), task.Timeout)
        defer cancel()
        
        output, tokensIn, tokensOut, err := pe.llmClient.Call(ctx, model, prompt)
        if err != nil {
            lastErr = err
            continue
        }
        
        return TaskResult{
            TaskId:    task.Id,
            Success:   true,
            Output:    output,
            Model:     model.Id,
            Duration:  time.Since(startTime),
            TokensIn:  tokensIn,
            TokensOut: tokensOut,
        }
    }
    
    return TaskResult{
        TaskId:   task.Id,
        Success:  false,
        Error:    lastErr.Error(),
        Model:    model.Id,
        Duration: time.Since(startTime),
    }
}
```

---

## Long-Chain Command Handling

### Chain Types

| Chain Type | Description | Parallelization |
|------------|-------------|-----------------|
| Sequential | Each step depends on previous | None |
| Fork-Join | Multiple independent steps, then merge | High |
| Pipeline | Streaming results between stages | Partial |
| DAG | Arbitrary dependencies | Optimal |

### Example: Complex Refactoring Command

```
Command: "Rename all files to lowercase, update all cross-references, 
         and regenerate the master index"

Decomposition:
├── [PARALLEL] Analyze command intent
├── [PARALLEL] Extract file patterns
├── [PARALLEL] Identify cross-reference patterns
├── [SEQUENTIAL - depends on above]
│   └── Generate rename code
├── [SEQUENTIAL - depends on rename]
│   └── Generate cross-reference update code
├── [SEQUENTIAL - depends on cross-ref]
│   └── Generate index regeneration code
└── [PARALLEL with above] Generate tags
```

```go
func DecomposeComplexCommand(command string) *TaskGraph {
    graph := &TaskGraph{
        Tasks:   []SubTask{},
        Results: make(map[string]*TaskResult),
    }
    
    // Parallel analysis phase
    graph.Tasks = append(graph.Tasks,
        SubTask{Id: "analyze_intent", Phase: PhaseIntentAnalysis, Priority: 1},
        SubTask{Id: "extract_patterns", Phase: PhaseIntentAnalysis, Priority: 1},
        SubTask{Id: "identify_refs", Phase: PhaseIntentAnalysis, Priority: 1},
    )
    
    // Sequential code generation (with dependencies)
    graph.Tasks = append(graph.Tasks,
        SubTask{
            Id:        "code_rename",
            Phase:     PhaseCodeGeneration,
            DependsOn: []string{"analyze_intent", "extract_patterns"},
            Priority:  2,
        },
        SubTask{
            Id:        "code_crossref",
            Phase:     PhaseCodeGeneration,
            DependsOn: []string{"code_rename", "identify_refs"},
            Priority:  3,
        },
        SubTask{
            Id:        "code_index",
            Phase:     PhaseCodeGeneration,
            DependsOn: []string{"code_crossref"},
            Priority:  4,
        },
    )
    
    // Parallel metadata generation
    graph.Tasks = append(graph.Tasks,
        SubTask{
            Id:        "generate_tags",
            Phase:     PhaseTagGeneration,
            DependsOn: []string{"analyze_intent"},
            Priority:  2,
        },
    )
    
    return graph
}
```

---

## TypeScript Types

```typescript
enum ModelCategory {
  Thinking = "thinking",
  Coding = "coding",
  Writing = "writing",
  Fast = "fast",
}

enum TaskPhase {
  IntentAnalysis = "intent_analysis",
  ComplexityScoring = "complexity_scoring",
  CodeGeneration = "code_generation",
  CodeFix = "code_fix",
  TagGeneration = "tag_generation",
  Documentation = "documentation",
  Validation = "validation",
}

interface ModelConfig {
  readonly id: string;
  readonly name: string;
  readonly category: ModelCategory;
  readonly endpoint: string;
  readonly maxTokens: number;
  readonly temperature: number;
  readonly timeoutMs: number;
  readonly priority: number;
}

interface SubTask {
  readonly id: string;
  readonly phase: TaskPhase;
  readonly prompt: string;
  readonly dependsOn: readonly string[];
  readonly priority: number;
  readonly timeoutMs: number;
  readonly retryCount: number;
  readonly modelOverride: string | null;
}

interface TaskResult {
  readonly taskId: string;
  readonly success: boolean;
  readonly output: string;
  readonly model: string;
  readonly durationMs: number;
  readonly error: string | null;
  readonly tokensIn: number;
  readonly tokensOut: number;
}

interface ExecutionSummary {
  readonly totalTasks: number;
  readonly successCount: number;
  readonly failureCount: number;
  readonly totalDurationMs: number;
  readonly parallelEfficiency: number;
  readonly modelsUsed: readonly string[];
}
```

---

## Model Router (Classifier)

The Model Router selects the optimal model based on query complexity and intent.

### Router Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    MODEL ROUTER                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                 QUERY CLASSIFIER                      │   │
│  │  • Tokenization                                       │   │
│  │  • Intent detection                                   │   │
│  │  • Complexity scoring                                 │   │
│  └──────────────────────────────────────────────────────┘   │
│                           │                                  │
│                           ▼                                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              COMPLEXITY THRESHOLD                     │   │
│  │                                                       │   │
│  │  complexity_threshold = 0.7 (from settings)           │   │
│  │                                                       │   │
│  │  if score < 0.7  → Simple model                       │   │
│  │  if score >= 0.7 → Complex model                      │   │
│  └──────────────────────────────────────────────────────┘   │
│                           │                                  │
│                           ▼                                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                 MODEL POOL                            │   │
│  │                                                       │   │
│  │  simple:   Sonar-Small                                │   │
│  │  complex:  GPT-5                                      │   │
│  │  code:     Code-Llama-34B                             │   │
│  │  creative: Claude-Opus                                │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Router Implementation

```go
type ModelRouter struct {
    settings      *SettingsService
    classifier    *ComplexityClassifier
}

type RoutingDecision struct {
    Model           string
    Category        string
    ComplexityScore float64
    Reason          string
}

func (mr *ModelRouter) Route(query string, intent string) apperror.Result[RoutingDecision] {
    // Get threshold from settings (Seedable Config)
    threshold, err := mr.settings.GetFloat("model_routing", "complexity_threshold")
    if err != nil {
        threshold = 0.7 // Default
    }
    
    // Get model pool from settings
    modelPool, err := mr.settings.GetMap("model_routing", "model_pool")
    if err != nil {
        return nil, apperror.Wrap(
            err,
            ErrModelPoolConfig,
            "failed to get model pool",
        )
    }
    
    // Classify complexity
    score := mr.classifier.Score(query)
    
    // Determine category and model
    var category, model, reason string
    
    switch intent {
    case "coding":
        category = "code"
        model = modelPool.Code
        reason = "Intent detected as coding task"
    case "creative":
        category = "creative"
        model = modelPool.Creative
        reason = "Intent detected as creative task"
    default:
        if score >= threshold {
            category = "complex"
            model = modelPool.Complex
            reason = fmt.Sprintf("Complexity %.2f >= threshold %.2f", score, threshold)
        } else {
            category = "simple"
            model = modelPool.Simple
            reason = fmt.Sprintf("Complexity %.2f < threshold %.2f", score, threshold)
        }
    }
    
    return &RoutingDecision{
        Model:           model,
        Category:        category,
        ComplexityScore: score,
        Reason:          reason,
    }, nil
}

type ComplexityClassifier struct {
    // Uses lightweight model for fast classification
}

func (cc *ComplexityClassifier) Score(query string) float64 {
    // Factors that increase complexity:
    // - Query length
    // - Technical terms
    // - Multi-step requirements
    // - Ambiguity
    
    score := 0.0
    
    // Length factor
    if len(query) > 200 {
        score += 0.2
    }
    
    // Technical terms
    technicalTerms := []string{"algorithm", "implement", "optimize", "architecture", "refactor"}
    for _, term := range technicalTerms {
        if strings.Contains(strings.ToLower(query), term) {
            score += 0.15
        }
    }
    
    // Multi-step indicators
    multiStepWords := []string{"then", "after", "and then", "finally", "first", "next"}
    for _, word := range multiStepWords {
        if strings.Contains(strings.ToLower(query), word) {
            score += 0.1
        }
    }
    
    // Cap at 1.0
    if score > 1.0 {
        score = 1.0
    }
    
    return score
}
```

---

## Configuration (Seedable)

Uses the [Seedable Configuration Pattern](../../04-coding-guidelines/05-seedable-config-pattern.md).

### File: `config/seeding-models.json`

```json
{
  "Version": "1.0.0",
  "Category": "model_routing",
  "Values": {
    "ComplexityThreshold": 0.7,
    "ModelPool": {
      "Simple": "Sonar-Small",
      "Complex": "GPT-5",
      "Code": "Code-Llama-34B",
      "Creative": "Claude-Opus"
    },
    "CategoryModels": {
      "Thinking": ["r1", "o1", "qwen-thinking"],
      "Coding": ["codellama", "deepseek", "starcoder"],
      "Writing": ["llama-3", "mistral", "claude"],
      "Fast": ["llama-3-8b", "mistral-7b"]
    },
    "TimeoutSeconds": {
      "Simple": 10,
      "Complex": 60,
      "Code": 30,
      "Creative": 45
    },
    "MaxParallel": 4,
    "DefaultRetryCount": 2
  }
}
```

### Legacy Config (Deprecated)

```json
{
  "MultiModelExecutor": {
    "MaxParallel": 4,
    "DefaultTimeout": 30000,
    "RetryCount": 2,
    "Models": {
      "Thinking": [
        {"Id": "r1", "Priority": 1, "Endpoint": "http://localhost:11434"},
        {"Id": "qwen-thinking", "Priority": 2}
      ],
      "Coding": [
        {"Id": "codellama-34b", "Priority": 1},
        {"Id": "deepseek-coder", "Priority": 2}
      ],
      "Writing": [
        {"Id": "llama-3-70b", "Priority": 1},
        {"Id": "mistral-7b", "Priority": 2}
      ],
      "Fast": [
        {"Id": "llama-3-8b", "Priority": 1}
      ]
    }
  }
}
```

---

## TypeScript Types (Extended)

```typescript
enum ModelPoolCategory {
  Simple = "simple",
  Complex = "complex",
  Code = "code",
  Creative = "creative",
}

interface ModelPool {
  readonly simple: string;
  readonly complex: string;
  readonly code: string;
  readonly creative: string;
}

interface RoutingDecision {
  readonly model: string;
  readonly category: ModelPoolCategory;
  readonly complexityScore: number;
  readonly reason: string;
}

interface ModelRoutingConfig {
  readonly complexity_threshold: number;
  readonly model_pool: ModelPool;
  readonly category_models: Record<ModelCategory, readonly string[]>;
  readonly timeout_seconds: Record<ModelPoolCategory, number>;
  readonly max_parallel: number;
  readonly default_retry_count: number;
}
```

---

## Performance Metrics

| Metric | Target | Description |
|--------|--------|-------------|
| Parallel Efficiency | >70% | (Sequential time / Parallel time) |
| Model Selection Latency | <10ms | Time to select optimal model |
| Task Startup Overhead | <50ms | Time from dispatch to first token |
| Error Recovery Time | <2s | Time to retry failed task |
| Routing Accuracy | >90% | Correct model selection rate |

---

## Related Specs

- [01-system-overview.md](./01-system-overview.md) — Architecture context
- [03-code-generator.md](./03-code-generator.md) — Code generation phase
- [06-execution-engine.md](./06-execution-engine.md) — Execution after generation
- [10-agentic-search.md](./10-agentic-search.md) — Agentic search pipeline
- [Seedable Config Pattern](../../04-coding-guidelines/05-seedable-config-pattern.md) — Configuration management
