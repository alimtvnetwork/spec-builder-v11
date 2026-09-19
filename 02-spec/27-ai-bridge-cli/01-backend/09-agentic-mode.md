# AI Bridge CLI: Agentic Mode & Tool Delegation

**Version:** 5.0.0  
**Status:** Draft  
**Updated:** 2026-03-09  

---

## Overview

Agentic mode enables AI Bridge CLI to execute **long-chain events** by delegating tasks to external tools and CLIs. This includes Google searches via gSearch CLI, file operations, code execution, and multi-step reasoning.

---

## Tool Delegation Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         TOOL DELEGATION FLOW                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   User Query: "Search for Go concurrency patterns and summarize"            │
│                                                                              │
│   1. LLM PLANNING PHASE (agentic category)                                   │
│      └── Model decides: need web search → delegate to gsearch-cli           │
│      └── Output: tool_call { Name: "web_search", Args: {...} }              │
│                                                                              │
│   2. TOOL DISPATCH                                                           │
│      └── AI Bridge receives tool_call                                        │
│      └── Looks up delegation config for "web_search"                        │
│      └── Finds: TargetCli = "gsearch-cli"                                   │
│                                                                              │
│   3. EXTERNAL CLI EXECUTION                                                  │
│      └── Spawn: gsearch search "Go concurrency patterns"                    │
│      └── Capture stdout/stderr                                               │
│      └── Parse structured JSON response                                      │
│                                                                              │
│   4. RESULT CACHING                                                          │
│      └── Log search in: data/{app}/search.db                               │
│      └── Cache results in: data/{app}/rag/cache/search/{seq}-{slug}.db     │
│      └── TTL: 5 days (from seedable config → aibridge.db → app override)   │
│                                                                              │
│   5. CONTINUE CHAIN                                                          │
│      └── Inject search results into context                                  │
│      └── LLM generates summary                                               │
│      └── Stream response to user                                             │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Tool Delegation Configuration

### Schema

```go
type ToolDelegation struct {
    ToolName    string
    TargetCli   string
    Command     string
    ArgMapping  map[string]string
    CacheMode   string            // local, rag, none
    CacheTtl    int               // Seconds (0 = forever)
    Timeout     int               // Execution timeout (seconds)
    RetryCount  int               // Retries on failure
}
```

### Default Delegations (config.seed.json)

```json
{
  "ToolDelegations": {
    "WebSearch": {
      "ToolName": "web_search",
      "TargetCli": "gsearch-cli",
      "Command": "search",
      "ArgMapping": {
        "Query": "--query",
        "MaxResults": "--limit",
        "Language": "--lang"
      },
      "CacheMode": "rag",
      "CacheTtlDays": 5,
      "Timeout": 30,
      "RetryCount": 2
    },
    "CodeSearch": {
      "ToolName": "code_search",
      "TargetCli": "gsearch-cli",
      "Command": "code",
      "ArgMapping": {
        "Query": "--query",
        "Language": "--lang",
        "Repo": "--repo"
      },
      "CacheMode": "rag",
      "CacheTtlDays": 5,
      "Timeout": 45,
      "RetryCount": 2
    },
    "FileRead": {
      "ToolName": "file_read",
      "TargetCli": "internal",
      "Command": "read_file",
      "CacheMode": "local",
      "CacheTtl": 0,
      "Timeout": 10
    },
    "FileWrite": {
      "ToolName": "file_write",
      "TargetCli": "internal",
      "Command": "write_file",
      "CacheMode": "none",
      "Timeout": 10
    },
    "ShellExec": {
      "ToolName": "shell_exec",
      "TargetCli": "internal",
      "Command": "exec",
      "CacheMode": "none",
      "Timeout": 60
    }
  }
}
```

---

## LLM Tool Definition

When agentic mode is active, the LLM receives these tool definitions:

```json
{
  "Tools": [
    {
      "Name": "web_search",
      "Description": "Search the web for information. Use when you need current information, documentation, or answers to factual questions.",
      "Parameters": {
        "Type": "object",
        "Properties": {
          "Query": {
            "Type": "string",
            "Description": "Search query"
          },
          "MaxResults": {
            "Type": "integer",
            "Description": "Maximum results to return (1-10)",
            "Default": 5
          },
          "Language": {
            "Type": "string",
            "Description": "Result language (en, es, de, etc.)",
            "Default": "en"
          }
        },
        "Required": ["Query"]
      }
    },
    {
      "Name": "code_search",
      "Description": "Search code repositories for examples, patterns, or implementations.",
      "Parameters": {
        "Type": "object",
        "Properties": {
          "Query": {
            "Type": "string",
            "Description": "Code search query"
          },
          "Language": {
            "Type": "string",
            "Description": "Programming language filter"
          },
          "Repo": {
            "Type": "string",
            "Description": "Specific repository to search"
          }
        },
        "Required": ["Query"]
      }
    },
    {
      "Name": "file_read",
      "Description": "Read the contents of a file from the current project.",
      "Parameters": {
        "Type": "object",
        "Properties": {
          "Path": {
            "Type": "string",
            "Description": "File path relative to project root"
          }
        },
        "Required": ["Path"]
      }
    },
    {
      "Name": "file_write",
      "Description": "Write content to a file. Creates the file if it doesn't exist.",
      "Parameters": {
        "Type": "object",
        "Properties": {
          "Path": {
            "Type": "string",
            "Description": "File path relative to project root"
          },
          "Content": {
            "Type": "string",
            "Description": "Content to write"
          }
        },
        "Required": ["Path", "Content"]
      }
    }
  ]
}
```

---

## Long-Chain Event Orchestration

### Execution Model

```go
type ChainExecution struct {
    Id          string
    SessionId   string
    Steps       []ChainStep
    Status      string        // pending, running, completed, failed
    StartedAt   time.Time     
    CompletedAt time.Time     
    TotalTokens int           
}

type ChainStep struct {
    StepNum       int           
    Type          string        // reasoning, tool_call, response
    ToolName      string        `json:",omitempty"`
    ToolArgs      ToolCallArgs  `json:",omitempty"`
    ToolResult    ToolCallResult `json:",omitempty"`
    Reasoning     string        `json:",omitempty"`
    TokensUsed    int           
    DurationMs    int64         
    Status        string        
}

// ToolCallArgs holds strongly-typed arguments for tool invocations
type ToolCallArgs struct {
    Query      string `json:",omitempty"`
    Path       string `json:",omitempty"`
    Content    string `json:",omitempty"`
    MaxResults int    `json:",omitempty"`
    Language   string `json:",omitempty"`
    Repo       string `json:",omitempty"`
}

// ToolCallResult holds strongly-typed results from tool executions
type ToolCallResult struct {
    Success    bool
    Output     string `json:",omitempty"`
    ErrorMsg   string `json:",omitempty"`
    ResultCount int   `json:",omitempty"`
}
```

### WebSocket Events for Long-Chain

```typescript
// Step started
{ "Type": "ChainStepStarted", "StepNum": 1, "StepType": "reasoning" }

// Tool call initiated
{ "Type": "ChainToolStarted", "StepNum": 2, "ToolName": "web_search", "Args": {...} }

// Tool result received
{ "Type": "ChainToolCompleted", "StepNum": 2, "ToolName": "web_search", "Success": true }

// Reasoning step
{ "Type": "ChainStepReasoning", "StepNum": 3, "Delta": "Based on the search results..." }

// Chain completed
{ "Type": "ChainCompleted", "TotalSteps": 5, "TotalTokens": 2341 }
```

---

## gSearch CLI Integration

### Expected CLI Interface

```bash
# Web search
gsearch search --query "Go concurrency patterns" --limit 5 --output json

# Code search
gsearch code --query "sync.WaitGroup example" --lang go --output json
```

### Expected JSON Output

```json
{
  "Query": "Go concurrency patterns",
  "Results": [
    {
      "Title": "Concurrency in Go - Go by Example",
      "Url": "https://gobyexample.com/goroutines",
      "Snippet": "Go's goroutines and channels provide a powerful way to...",
      "Rank": 1
    }
  ],
  "TotalResults": 150000,
  "SearchDurationMs": 234
}
```

### Error Handling

| gSearch Exit Code | AI Bridge Error | Recovery |
|-------------------|-----------------|----------|
| 0 | Success | Continue chain |
| 1 | Generic error | Retry (up to RetryCount) |
| 2 | Rate limited | Wait 60s, retry |
| 3 | No results | Continue without results |
| 4 | Network error | Retry with backoff |
| 5 | Auth error | Fail chain, notify user |

---

## Cache Management

### Cache Database Architecture

Search caching follows a multi-database pattern:

```
data/
├── aibridge.db                           # Root: Settings.Search.Cache.TtlDays = 5
│
└── {appName}/
    ├── search.db                         # Metadata: when/what searched, expiry tracking
    │
    └── rag/cache/search/
        ├── 001-{search-slug}.db          # Full results for search 1
        ├── 002-{search-slug}.db          # Full results for search 2
        └── ...
```

**See:** `12-database-architecture.md` for complete schema details.

### Cache Lookup Flow

```go
func (e *Executor) ExecuteTool(context stdctx.Context, call ToolCall) apperror.Result[*ToolCallResult] {
    // 1. Check cache
    if hasMismatch(e.config.CacheMode, CacheMode.None) {
        cached := e.cache.Get(call.Name, call.Args)
        if isDefined(cached) {
            return apperror.Ok(cached)
        }
    }
    
    // 2. Execute tool
    dispatchResult := e.dispatchTool(context, call)
    if dispatchResult.IsErr() {
        return apperror.Fail[*ToolCallResult](dispatchResult.Err())
    }

    result := dispatchResult.Value()
    
    // 3. Cache result
    if e.config.CacheMode != "none" {
        e.cache.Set(call.Name, call.Args, result, e.config.CacheTtl)
    }
    
    // 4. Optionally index in RAG
    if e.config.CacheMode == "rag" {
        e.ragIndexer.Index(call, result)
    }
    
    return apperror.Ok(result)
}
```

---

## API Endpoints

### Agentic Mode Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/agentic/execute` | Execute long-chain task |
| GET | `/api/v1/agentic/chains` | List recent chains |
| GET | `/api/v1/agentic/chains/:id` | Get chain details |
| POST | `/api/v1/agentic/chains/:id/cancel` | Cancel running chain |
| GET | `/api/v1/tools` | List available tools |
| GET | `/api/v1/tools/:name` | Get tool details |
| PUT | `/api/v1/tools/:name/config` | Update tool config |

### Execute Long-Chain Request

```json
POST /api/v1/agentic/execute
{
  "AppName": "my-project",
  "SessionId": "chat_abc123",
  "Prompt": "Search for React state management best practices and create a summary document",
  "MaxSteps": 10,
  "AllowedTools": ["web_search", "file_write"],
  "Stream": true
}
```

---

## Prompt-to-Search Instruction Pipeline

### Overview

When a user prompt arrives, the system must determine **what to search**, **how to search**, and **what to do with results** — all before executing any tools. This pipeline uses a fast model (`llama3.1:8b`) to analyze the prompt and produce a structured `SearchPlan` JSON that drives GSearch CLI execution.

### Fast Model Configuration

```go
type PromptAnalyzerConfig struct {
    Model           string        // Default: llama3.1:8b (writing category)
    MaxTokens       int           // Default: 1024 (plan output is compact)
    Temperature     float64       // Default: 0.1 (deterministic output)
    Timeout         time.Duration // Default: 5s (must be fast)
    FallbackModel   string        // Default: gemma3:4b (if 8b unavailable)
}

var DefaultPromptAnalyzerConfig = PromptAnalyzerConfig{
    Model:         "llama3.1:8b",
    MaxTokens:     1024,
    Temperature:   0.1,
    Timeout:       5 * time.Second,
    FallbackModel: "gemma3:4b",
}
```

**Why `llama3.1:8b`:** Balances speed (~100ms) with reasoning quality. Can reliably extract search intent, identify dependencies between tasks, and output structured JSON. The 32B model is reserved for the actual content generation phase.

### Search Plan Schema

The fast model outputs this structured JSON — the contract between prompt analysis and execution:

```go
// SearchPlan is the structured output from prompt analysis
type SearchPlan struct {
    Intent          string              // High-level intent summary
    RequiresSearch  bool                // Whether external search is needed
    SearchInstructions []SearchInstruction // Ordered search tasks
    TaskChain       []TaskInstruction   // Post-search task chain
    Confidence      float64             // 0.0-1.0 confidence in plan
    Reasoning       string              // Brief explanation of decisions
}

// SearchInstruction defines a single search operation
type SearchInstruction struct {
    Id              string              // Unique step ID (e.g., "search-1")
    SearchType      string              // "web", "code", "documentation", "news"
    Query           string              // Optimized search query
    Purpose         string              // Why this search is needed
    Priority        string              // "required", "helpful", "optional"
    Constraints     SearchPlanConstraints
    DependsOn       []string            // Other instruction IDs this depends on
    ExpectedOutput  string              // What we expect to find
}

type SearchPlanConstraints struct {
    Domains         []string `json:",omitempty"` // Preferred domains
    ExcludeDomains  []string `json:",omitempty"` // Domains to exclude
    DateFilter      string   `json:",omitempty"` // "day", "week", "month", "year"
    Language        string   `json:",omitempty"` // Result language
    CodeLanguage    string   `json:",omitempty"` // For code search
    MaxResults      int      `json:",omitempty"` // Per-search limit
}

// TaskInstruction defines a post-search operation
type TaskInstruction struct {
    Id              string   // Unique task ID (e.g., "task-1")
    Action          string   // "write_file", "read_file", "read_code", "generate_code",
                             // "summarize", "compare", "extract", "transform"
    Description     string   // What this task does
    DependsOn       []string // IDs of searches or tasks this depends on
    InputFrom       []string // Which step outputs to use as input
    OutputType      string   // "file", "code", "text", "structured"
    IsParallel      bool     // Can run alongside sibling tasks
    Config          TaskConfig
}

type TaskConfig struct {
    FilePath        string   `json:",omitempty"` // For file operations
    FileFormat      string   `json:",omitempty"` // "go", "md", "json", etc.
    Template        string   `json:",omitempty"` // Output template
    MaxTokens       int      `json:",omitempty"` // Token budget for generation
}
```

### System Prompt for Fast Model

```go
const PromptAnalysisSystemPrompt = `You are a task planning assistant. Given a user prompt, analyze it and produce a structured SearchPlan JSON.

Rules:
1. Determine if external search is needed (current info, docs, examples, error fixes)
2. Generate optimized search queries — NOT the raw user text
3. Identify task dependencies: which tasks depend on search results, which can run in parallel
4. Classify each search by type: web, code, documentation, news
5. Add domain constraints when the topic implies specific sources
6. Create a task chain for post-search operations (file writes, code generation, etc.)
7. Mark tasks as parallel when they have no dependency on each other

Output ONLY valid JSON matching the SearchPlan schema. No explanation text.

Examples of search query optimization:
- User: "How do I handle errors in Go?" → Query: "Go error handling best practices idiomatic"
- User: "Fix my CORS issue with Vite" → Query: "Vite CORS error dev server fix"  
- User: "What's new in React 19?" → Query: "React 19 new features changelog 2026"
`
```

### Prompt Analyzer Implementation

```go
type PromptAnalyzer struct {
    config    PromptAnalyzerConfig
    backend   BackendAdapter
    cache     *PlanCache
}

func (pa *PromptAnalyzer) AnalyzePrompt(
    context stdctx.Context,
    prompt string,
    sessionContext []RAGChunk,
) apperror.Result[*SearchPlan] {
    // 1. Check plan cache (same prompt in same session → reuse)
    cacheKey := generatePlanCacheKey(prompt, sessionContext)
    cached := pa.cache.Get(cacheKey)
    if cached.IsDefined() {
        return apperror.Ok(cached)
    }

    // 2. Build analysis request
    contextSummary := summarizeContext(sessionContext, 500) // Max 500 tokens
    analysisPrompt := fmt.Sprintf(
        "User prompt: %s\n\nAvailable context summary: %s",
        prompt,
        contextSummary,
    )

    // 3. Call fast model with structured output
    resp := pa.backend.Generate(context, GenerateRequest{
        Model:       pa.config.Model,
        System:      PromptAnalysisSystemPrompt,
        Prompt:      analysisPrompt,
        MaxTokens:   pa.config.MaxTokens,
        Temperature: pa.config.Temperature,
        Format:      "json",
    })

    if resp.HasError() {
        // Fallback to simpler model
        resp = pa.backend.Generate(context, GenerateRequest{
            Model:       pa.config.FallbackModel,
            System:      PromptAnalysisSystemPrompt,
            Prompt:      analysisPrompt,
            MaxTokens:   pa.config.MaxTokens,
            Temperature: pa.config.Temperature,
            Format:      "json",
        })

        if resp.HasError() {
            return apperror.Fail[*SearchPlan](resp.Error())
        }
    }

    // 4. Parse structured output
    var plan SearchPlan
    err := json.Unmarshal([]byte(resp.Value().Content), &plan)
    if err != nil {
        return apperror.FailWrap[*SearchPlan](
            err, 9509, "search plan JSON parse failed",
        )
    }

    // 5. Validate plan
    validateResult := validateSearchPlan(&plan)
    if validateResult.HasError() {
        return apperror.Fail[*SearchPlan](validateResult.Error())
    }

    // 6. Cache and return
    pa.cache.Set(cacheKey, &plan, 10*time.Minute)

    return apperror.Ok(&plan)
}

func validateSearchPlan(plan *SearchPlan) *apperror.AppError {
    // Validate no circular dependencies
    allIds := map[string]bool{}
    for _, si := range plan.SearchInstructions {
        allIds[si.Id] = true
    }
    for _, ti := range plan.TaskChain {
        allIds[ti.Id] = true
    }

    for _, ti := range plan.TaskChain {
        for _, dep := range ti.DependsOn {
            if !allIds[dep] {
                return apperror.New(
                    9510,
                    "task %s depends on unknown step %s", ti.Id, dep,
                )
            }
        }
    }

    return nil
}
```

### Search Plan Execution Bridge

Converts a `SearchPlan` into GSearch CLI calls and long-chain tasks:

```go
func (e *AgenticExecutor) ExecuteSearchPlan(
    context stdctx.Context,
    plan *SearchPlan,
    session *ChainExecution,
) apperror.Result[*PlanExecutionResult] {
    result := &PlanExecutionResult{
        SearchResults: map[string]*WebSearchResult{},
        TaskOutputs:   map[string]*TaskOutput{},
    }

    // Phase 1: Execute search instructions (respecting dependencies)
    searchDAG := buildSearchDAG(plan.SearchInstructions)
    waves := searchDAG.Schedule()

    for _, wave := range waves {
        var wg sync.WaitGroup
        var mu sync.Mutex

        for _, instrId := range wave {
            instr := findInstruction(plan.SearchInstructions, instrId)
            wg.Add(1)
            go func(si SearchInstruction) {
                defer wg.Done()

                searchResult := e.executeSearch(context, si)
                mu.Lock()
                if searchResult.IsSuccess() {
                    result.SearchResults[si.Id] = searchResult.Value()
                }
                mu.Unlock()
            }(*instr)
        }

        wg.Wait()
    }

    // Phase 2: Execute task chain (respecting dependencies)
    taskDAG := buildTaskDAG(plan.TaskChain)
    taskWaves := taskDAG.Schedule()

    for _, wave := range taskWaves {
        var wg sync.WaitGroup
        var mu sync.Mutex

        for _, taskId := range wave {
            task := findTask(plan.TaskChain, taskId)
            if !task.IsParallel {
                // Sequential task — execute inline
                taskResult := e.executeTask(context, *task, result)
                mu.Lock()
                if taskResult.IsSuccess() {
                    result.TaskOutputs[task.Id] = taskResult.Value()
                }
                mu.Unlock()
                continue
            }

            wg.Add(1)
            go func(ti TaskInstruction) {
                defer wg.Done()

                taskResult := e.executeTask(context, ti, result)
                mu.Lock()
                if taskResult.IsSuccess() {
                    result.TaskOutputs[ti.Id] = taskResult.Value()
                }
                mu.Unlock()
            }(*task)
        }

        wg.Wait()
    }

    return apperror.Ok(result)
}

func (e *AgenticExecutor) executeSearch(
    context stdctx.Context,
    instr SearchInstruction,
) apperror.Result[*WebSearchResult] {
    // Map SearchInstruction → GSearch CLI call
    switch instr.SearchType {
    case "web", "documentation", "news":
        return e.gsearch.WebSearch(context, WebSearchRequest{
            Query:        instr.Query,
            MaxResults:   instr.Constraints.MaxResults,
            DateFilter:   instr.Constraints.DateFilter,
            DomainFilter: instr.Constraints.Domains,
            Language:     instr.Constraints.Language,
        })
    case "code":
        codeResult := e.gsearch.CodeSearch(context, CodeSearchRequest{
            Query:    instr.Query,
            Language: instr.Constraints.CodeLanguage,
        })
        if codeResult.HasError() {
            return apperror.Fail[*WebSearchResult](codeResult.Error())
        }
        return apperror.Ok(convertCodeToWebResult(codeResult.Value()))
    default:
        return apperror.FailNew[*WebSearchResult](
            9502, "unsupported search type: %s", instr.SearchType,
        )
    }
}

type PlanExecutionResult struct {
    SearchResults map[string]*WebSearchResult
    TaskOutputs   map[string]*TaskOutput
}

type TaskOutput struct {
    Content  string
    FilePath string `json:",omitempty"`
    Format   string
}
```

### Worked Example: End-to-End Flow

```
User Prompt: "Research Go generics best practices, find example patterns,
              and create a summary document at docs/generics-guide.md"

┌─────────────────────────────────────────────────────────────────────────────┐
│ PHASE 1: Prompt Analysis (llama3.1:8b, ~100ms)                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Input: Raw user prompt                                                      │
│  Output: SearchPlan JSON:                                                    │
│                                                                              │
│  {                                                                           │
│    "Intent": "Research Go generics and create summary document",             │
│    "RequiresSearch": true,                                                   │
│    "Confidence": 0.92,                                                       │
│    "SearchInstructions": [                                                   │
│      {                                                                       │
│        "Id": "search-1",                                                     │
│        "SearchType": "web",                                                  │
│        "Query": "Go generics best practices type parameters 2026",           │
│        "Priority": "required",                                               │
│        "Constraints": { "Domains": ["go.dev", "gobyexample.com"] }           │
│      },                                                                      │
│      {                                                                       │
│        "Id": "search-2",                                                     │
│        "SearchType": "code",                                                 │
│        "Query": "Go generics patterns constraints interface",                │
│        "Priority": "required",                                               │
│        "Constraints": { "CodeLanguage": "go" }                               │
│      }                                                                       │
│    ],                                                                        │
│    "TaskChain": [                                                            │
│      {                                                                       │
│        "Id": "task-1",                                                       │
│        "Action": "summarize",                                                │
│        "DependsOn": ["search-1", "search-2"],                                │
│        "IsParallel": false                                                   │
│      },                                                                      │
│      {                                                                       │
│        "Id": "task-2",                                                       │
│        "Action": "write_file",                                               │
│        "DependsOn": ["task-1"],                                              │
│        "Config": { "FilePath": "docs/generics-guide.md" }                    │
│      }                                                                       │
│    ]                                                                         │
│  }                                                                           │
│                                                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│ PHASE 2: Search Execution (GSearch CLI)                                      │
│                                                                              │
│  Wave 1 (parallel):                                                          │
│    ├── search-1: gsearch search --query "Go generics best..." --limit 5      │
│    └── search-2: gsearch code --query "Go generics patterns..." --lang go    │
│                                                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│ PHASE 3: Task Chain Execution                                                │
│                                                                              │
│  Wave 2 (sequential, depends on search):                                     │
│    └── task-1: Summarize search results using 32B reasoning model            │
│                                                                              │
│  Wave 3 (sequential, depends on task-1):                                     │
│    └── task-2: Write summary to docs/generics-guide.md                       │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Performance Optimization

### Fast Model Selection

For long-chain events that require quick decisions:

1. **Prompt Analysis:** Use `llama3.1:8b` for search plan generation (~100ms)
2. **Tool Selection:** Use `llama3.1:8b` for tool routing (~50ms)
3. **Reasoning:** Use `qwen2.5-coder:32b` for complex reasoning
4. **Output:** Use appropriate category model for final output

```go
type ChainModelConfig struct {
    PromptAnalysis   string  // llama3.1:8b (fast, structured output)
    ToolSelection    string  // llama3.1:8b (fast routing)
    Reasoning        string  // qwen2.5-coder:32b (strong model)
    OutputGeneration string  // Category-based
}
```

---

## Error Codes

| Code | Error | Description |
|------|-------|-------------|
| 9500 | `ErrChainMaxStepsExceeded` | Exceeded MaxSteps limit |
| 9501 | `ErrToolNotFound` | Unknown tool requested |
| 9502 | `ErrToolExecutionFailed` | Tool returned error |
| 9503 | `ErrToolTimeout` | Tool execution timed out |
| 9504 | `ErrChainCancelled` | Chain was cancelled by user |
| 9505 | `ErrExternalCliNotFound` | Target CLI not installed |
| 9506 | `ErrExternalCliError` | Target CLI returned error |
| 9507 | `ErrCacheWriteFailed` | Failed to write to cache |
| 9508 | `ErrToolRateLimited` | Tool is rate limited |
| 9509 | `ErrSearchPlanParseFailed` | Failed to parse search plan JSON |
| 9510 | `ErrSearchPlanInvalid` | Search plan has invalid dependencies |

---

## Cross-References

| Reference | Location |
|-----------|----------|
| Model Management | `07-model-management.md` |
| Split DB Integration | `08-split-db-integration.md` |
| Error Codes | `05-error-codes.md` |
| gSearch CLI | `../../25-gsearch-cli/00-overview.md` |
| GSearch Context Integration | `40-gsearch-context-integration.md` |
| Long-Chain Command System | `50-long-chain-command-system.md` |
| Adaptive Reasoning Flow | `37-adaptive-reasoning-flow.md` |
