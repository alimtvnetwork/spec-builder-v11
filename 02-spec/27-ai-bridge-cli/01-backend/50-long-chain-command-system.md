# AI Bridge: Long-Chain Command System

**Version:** 5.0.0  
**Status:** Draft  
**Error Range:** 9970-9989  
**Last Updated:** 2026-03-04

---

## 1. Overview

The Long-Chain Command System replaces external agentic dependencies (Quincoder) with an internal, Go-based implementation. It provides a command registry, parallel execution engine, and step-based workflow processing for reasoning, coding assistance, and multi-step operations.

### 1.1 Goals

| Goal | Target | Metric |
|------|--------|--------|
| Speed | <50ms query latency | 100k document processing |
| Accuracy | 92-97% recall | RAG retrieval benchmarks |
| Parallelism | Concurrent execution | Independent step processing |
| Integration | Every query/conversation | Long-chain suggestions embedded |

### 1.2 Key Benefits

- **No External Dependencies**: Eliminates Quincoder latency
- **Parallel Processing**: Independent steps execute concurrently
- **Customizable**: User-defined command templates
- **Observable**: Real-time progress via WebSocket

---

## 2. Architecture

### 2.1 Component Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    Long-Chain Command System                     │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │ Command Registry │  │ Step Executor   │  │ Parallel Engine │  │
│  │                 │  │                 │  │                 │  │
│  │ - Built-in      │  │ - ReadFile      │  │ - WorkerPool    │  │
│  │ - User-defined  │  │ - ReadUrl       │  │ - TaskQueue     │  │
│  │ - Templates     │  │ - Search        │  │ - ResultMerge   │  │
│  └────────┬────────┘  │ - VectorQuery   │  └────────┬────────┘  │
│           │           │ - Transform     │           │           │
│           │           │ - Filter        │           │           │
│           │           │ - Aggregate     │           │           │
│           │           │ - Branch        │           │           │
│           │           │ - Execute       │           │           │
│           │           └────────┬────────┘           │           │
│           └────────────────────┼────────────────────┘           │
│                                │                                 │
│  ┌─────────────────────────────▼─────────────────────────────┐  │
│  │                   Dependency Resolver                      │  │
│  │  - DAG Construction  - Topological Sort  - Cycle Detection │  │
│  └─────────────────────────────┬─────────────────────────────┘  │
│                                │                                 │
│  ┌─────────────────────────────▼─────────────────────────────┐  │
│  │                   Progress Streamer                        │  │
│  │  - WebSocket /ws/longchain/{id}  - Step-level updates     │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Data Flow

```
User Query → Command Match → Step Resolution → Dependency Graph
                                                      │
                    ┌─────────────────────────────────┘
                    ▼
              Parallel Executor
                    │
    ┌───────────────┼───────────────┐
    ▼               ▼               ▼
 Worker 1       Worker 2       Worker N
 (ReadFile)     (ReadUrl)      (Search)
    │               │               │
    └───────────────┼───────────────┘
                    ▼
              Result Merger
                    │
                    ▼
              Transform/Filter
                    │
                    ▼
              Aggregate → Response
```

---

## 3. Database Schema

### 3.1 LongChainCommands Table

```sql
CREATE TABLE LongChainCommands (
    Id              TEXT PRIMARY KEY,
    Name            TEXT NOT NULL UNIQUE,
    Description     TEXT,
    Category        TEXT NOT NULL,           -- Reasoning, Coding, Search, Custom
    IsBuiltIn       INTEGER NOT NULL DEFAULT 0,
    IsEnabled       INTEGER NOT NULL DEFAULT 1,
    Priority        INTEGER NOT NULL DEFAULT 100,
    TriggerPatterns TEXT,                    -- JSON array of regex patterns
    StepTemplate    TEXT NOT NULL,           -- JSON array of step definitions
    Settings        TEXT,                    -- JSON object for command-specific settings
    CreatedAt       TEXT NOT NULL,
    UpdatedAt       TEXT NOT NULL
);

CREATE INDEX IdxLongChainCommandsCategory ON LongChainCommands(Category);
CREATE INDEX IdxLongChainCommandsEnabled ON LongChainCommands(IsEnabled);
```

### 3.2 LongChainSteps Table

```sql
CREATE TABLE LongChainSteps (
    Id              TEXT PRIMARY KEY,
    CommandId       TEXT NOT NULL,
    StepOrder       INTEGER NOT NULL,
    StepType        TEXT NOT NULL,           -- ReadFile, ReadUrl, Search, etc.
    StepName        TEXT NOT NULL,
    Config          TEXT NOT NULL,           -- JSON step configuration
    DependsOn       TEXT,                    -- JSON array of step IDs
    TimeoutMs       INTEGER DEFAULT 30000,
    RetryCount      INTEGER DEFAULT 3,
    IsParallel      INTEGER DEFAULT 1,       -- Can run in parallel with siblings
    CreatedAt       TEXT NOT NULL,
    
    FOREIGN KEY (CommandId) REFERENCES LongChainCommands(Id) ON DELETE CASCADE
);

CREATE INDEX IdxLongChainStepsCommand ON LongChainSteps(CommandId);
CREATE INDEX IdxLongChainStepsOrder ON LongChainSteps(CommandId, StepOrder);
```

### 3.3 LongChainExecutions Table

```sql
CREATE TABLE LongChainExecutions (
    Id              TEXT PRIMARY KEY,
    CommandId       TEXT NOT NULL,
    SessionId       TEXT,                    -- Link to chat session if applicable
    Status          TEXT NOT NULL,           -- Pending, Running, Completed, Failed, Cancelled
    Input           TEXT NOT NULL,           -- JSON input parameters
    Output          TEXT,                    -- JSON final output
    StartedAt       TEXT,
    CompletedAt     TEXT,
    ErrorCode       INTEGER,
    ErrorMessage    TEXT,
    DurationMs      INTEGER,
    StepResults     TEXT,                    -- JSON map of stepId -> result
    CreatedAt       TEXT NOT NULL,
    
    FOREIGN KEY (CommandId) REFERENCES LongChainCommands(Id)
);

CREATE INDEX IdxLongChainExecutionsStatus ON LongChainExecutions(Status);
CREATE INDEX IdxLongChainExecutionsSession ON LongChainExecutions(SessionId);
```

---

## 4. Go Interfaces

### 4.1 Core Types

```go
package longchain

import (
    stdctx "context"
    "time"

    "ai-bridge/internal/enums/steptype"
    "ai-bridge/internal/enums/commandcategorytype"
    "ai-bridge/internal/enums/executionstatustype"
)

// StepType, CommandCategory, and ExecutionStatus are now type-safe enums.
// See: 02-spec/27-ai-bridge-cli/01-backend/53-enum-architecture.md
//
// Usage:
//   step_type.ReadFile, step_type.Search, step_type.VectorQuery, etc.
//   command_category.Reasoning, command_category.Coding, etc.
//   execution_status.Pending, execution_status.Running, etc.
//
// Key methods:
//   step_type.Parse("read_file") → (step_type.ReadFile, nil)
//   step_type.ReadFile.IsParallelizable() → true
//   execution_status.Completed.IsTerminal() → true
```

### 4.2 Command Definition

```go
// Command represents a long-chain command definition
type Command struct {
    Id              string                    `json:",omitempty"`
    Name            string
    Description     string                    `json:",omitempty"`
    Category        command_category.Variant
    IsBuiltIn       bool
    IsEnabled       bool
    Priority        int
    TriggerPatterns []string                  `json:",omitempty"`
    Steps           []StepDefinition
    Settings        CommandSettings           `json:",omitempty"`
    CreatedAt       time.Time
    UpdatedAt       time.Time
}

// StepDefinition defines a single step in the command chain
type StepDefinition struct {
    Id         string
    StepOrder  int
    StepType   step_type.Variant
    StepName   string
    Config     StepConfig
    DependsOn  []string `json:",omitempty"`
    TimeoutMs  int
    RetryCount int
    IsParallel bool
}

// StepConfig is the base interface for step configurations
type StepConfig interface {
    Validate() error
    StepType() step_type.Variant
}

// CommandSettings holds command-specific configuration
type CommandSettings struct {
    MaxConcurrency int    `json:",omitempty"`
    OutputFormat   string `json:",omitempty"`
    CacheResults   bool   `json:",omitempty"`
    TimeoutMs      int    `json:",omitempty"`
}

// MetadataFilter for vector query and document filtering
type MetadataFilter struct {
    Field    string
    Operator string // Eq, Ne, Gt, Lt, Gte, Lte, Contains
    Value    FilterValue
}

// ExecutionInput provides strongly-typed input for command execution
type ExecutionInput struct {
    Text       string              `json:",omitempty"`
    FilePaths  []string            `json:",omitempty"`
    Parameters ExecutionParameters `json:",omitempty"`
}

// ExecutionParameters for command parameterization
type ExecutionParameters struct {
    SessionId string `json:",omitempty"`
    TopK      int    `json:",omitempty"`
    MaxTokens int    `json:",omitempty"`
    Format    string `json:",omitempty"`
}

// ExecutionOutput holds the final result of a command execution
type ExecutionOutput struct {
    Text      string   `json:",omitempty"`
    Documents []string `json:",omitempty"`
    Summary   string   `json:",omitempty"`
}

// StepOutput holds the result of a single step execution
type StepOutput struct {
    Text      string   `json:",omitempty"`
    Items     []string `json:",omitempty"`
    Count     int      `json:",omitempty"`
}

// ErrorDetails provides structured error context
type ErrorDetails struct {
    StepId     string `json:",omitempty"`
    Input      string `json:",omitempty"`
    Suggestion string `json:",omitempty"`
}
```

### 4.3 Step Configurations

```go
// ReadFileConfig configures file reading operations
type ReadFileConfig struct {
    Paths     []string   // File paths or glob patterns
    Encoding  string     `json:",omitempty"` // utf-8, base64
    MaxSizeKb int        `json:",omitempty"` // Max file size limit
    LineRange *LineRange `json:",omitempty"` // Optional line range
}

type LineRange struct {
    Start int
    End   int
}

func (c ReadFileConfig) Validate() error              { /* implementation */ }
func (c ReadFileConfig) StepType() step_type.Variant   { return step_type.ReadFile }

// ReadUrlConfig configures URL fetching operations
type ReadUrlConfig struct {
    Urls          []string          // URLs to fetch
    Method        string            `json:",omitempty"` // GET, POST
    Headers       map[string]string `json:",omitempty"`
    TimeoutMs     int               `json:",omitempty"`
    ExtractFormat string            `json:",omitempty"` // markdown, html, text
    MaxConcurrent int               `json:",omitempty"` // Parallel fetch limit
}

func (c ReadUrlConfig) Validate() error              { /* implementation */ }
func (c ReadUrlConfig) StepType() step_type.Variant   { return step_type.ReadUrl }

// SearchConfig configures search operations via GSearch CLI
type SearchConfig struct {
    Query      string
    Engine     string     `json:",omitempty"` // google, bing, duckduckgo
    NumResults int        `json:",omitempty"`
    SearchType string     `json:",omitempty"` // web, code, news, images
    SiteFilter []string   `json:",omitempty"`
    DateRange  *DateRange `json:",omitempty"`
}

type DateRange struct {
    From string // YYYY-MM-DD
    To   string // YYYY-MM-DD
}

func (c SearchConfig) Validate() error              { /* implementation */ }
func (c SearchConfig) StepType() step_type.Variant   { return step_type.Search }

// VectorQueryConfig configures vector database queries
type VectorQueryConfig struct {
    Query          string
    Collection     string         `json:",omitempty"` // RAG collection name
    TopK           int            `json:",omitempty"` // Number of results
    MinScore       float64        `json:",omitempty"` // Similarity threshold
    Filters        []MetadataFilter `json:",omitempty"` // Metadata filters
    IncludeContent bool           `json:",omitempty"`
}

func (c VectorQueryConfig) Validate() error              { /* implementation */ }
func (c VectorQueryConfig) StepType() step_type.Variant   { return step_type.VectorQuery }

// TransformConfig configures data transformation
type TransformConfig struct {
    InputSteps   []string // Step IDs to take input from
    Operation    string   // map, flatMap, extract, parse
    Template     string   `json:",omitempty"` // Go template for transformation
    JsonPath     string   `json:",omitempty"` // JSONPath expression
    OutputFormat string   `json:",omitempty"` // json, text, markdown
}

func (c TransformConfig) Validate() error              { /* implementation */ }
func (c TransformConfig) StepType() step_type.Variant   { return step_type.Transform }

// FilterConfig configures data filtering
type FilterConfig struct {
    InputStep  string
    Conditions []FilterCondition
    Logic      string `json:",omitempty"` // and, or
}

type FilterCondition struct {
    Field    string
    Operator string       // eq, ne, gt, lt, gte, lte, contains, matches
    Value    FilterValue
}

// FilterValue is a strongly-typed union for filter operands
type FilterValue struct {
    StringVal  string  `json:",omitempty"`
    IntVal     int     `json:",omitempty"`
    FloatVal   float64 `json:",omitempty"`
    BoolVal    *bool   `json:",omitempty"`
}

func (c FilterConfig) Validate() error              { /* implementation */ }
func (c FilterConfig) StepType() step_type.Variant   { return step_type.Filter }

// AggregateConfig configures result aggregation
type AggregateConfig struct {
    InputSteps  []string
    Operation   string // merge, concat, dedupe, rank, summarize
    SortBy      string `json:",omitempty"`
    SortOrder   string `json:",omitempty"` // asc, desc
    Limit       int    `json:",omitempty"`
    DedupeField string `json:",omitempty"`
}

func (c AggregateConfig) Validate() error              { /* implementation */ }
func (c AggregateConfig) StepType() step_type.Variant   { return step_type.Aggregate }

// BranchConfig configures conditional branching
type BranchConfig struct {
    Condition  string   // Go template expression returning bool
    TrueSteps  []string // Step IDs to execute if true
    FalseSteps []string // Step IDs to execute if false
}

func (c BranchConfig) Validate() error              { /* implementation */ }
func (c BranchConfig) StepType() step_type.Variant   { return step_type.Branch }

// ExecuteConfig configures external command execution
type ExecuteConfig struct {
    Command       string // CLI command (gcli, shell)
    Args          []string
    WorkDir       string `json:",omitempty"`
    TimeoutMs     int    `json:",omitempty"`
    CaptureOutput bool   `json:",omitempty"`
}

func (c ExecuteConfig) Validate() error              { /* implementation */ }
func (c ExecuteConfig) StepType() step_type.Variant   { return step_type.Execute }
```

### 4.4 Executor Interfaces

```go
// ParallelExecutor handles concurrent step execution
type ParallelExecutor interface {
    // Execute runs the command with given input
    Execute(context stdctx.Context, cmd *Command, input *ExecutionInput) apperror.Result[*ExecutionResult]
    
    // Cancel stops an in-progress execution
    Cancel(executionId string) *apperror.AppError
    
    // Status returns current execution status
    Status(executionId string) apperror.Result[execution_status.Variant]
}

// ExecutionResult contains the final output of a command execution
type ExecutionResult struct {
    ExecutionId string
    CommandId   string
    Status      execution_status.Variant
    Output      *ExecutionOutput
    StepResults map[string]*StepResult
    StartedAt   time.Time
    CompletedAt time.Time
    DurationMs  int64
    Error       *ExecutionError `json:",omitempty"`
}

// StepResult contains the output of a single step
type StepResult struct {
    StepId      string
    StepName    string
    StepType    step_type.Variant
    Status      execution_status.Variant
    Output      *StepOutput
    StartedAt   time.Time
    CompletedAt time.Time
    DurationMs  int64
    RetryCount  int
    Error       *ExecutionError `json:",omitempty"`
}

// ExecutionError provides detailed error information
type ExecutionError struct {
    Code    int
    Message string
    Details *ErrorDetails  `json:",omitempty"`
    Stack   string         `json:",omitempty"`
}
```

### 4.5 Registry Interface

```go
// CommandRegistry manages command registration and lookup
type CommandRegistry interface {
    // Register adds a new command
    Register(cmd *Command) *apperror.AppError
    
    // Unregister removes a command by ID
    Unregister(commandId string) *apperror.AppError
    
    // Get retrieves a command by ID
    Get(commandId string) apperror.Result[*Command]
    
    // GetByName retrieves a command by name
    GetByName(name string) apperror.Result[*Command]
    
    // Match finds commands matching the input text
    Match(input string) apperror.Result[[]*Command]
    
    // List returns all registered commands
    List(filter *CommandFilter) apperror.Result[[]*Command]
    
    // LoadBuiltIn loads all built-in commands
    LoadBuiltIn() *apperror.AppError
}

// CommandFilter for listing commands
type CommandFilter struct {
    Category  command_category.Variant `json:",omitempty"`
    IsEnabled *bool           `json:",omitempty"`
    IsBuiltIn *bool           `json:",omitempty"`
}
```

### 4.6 Parallel Fetcher

```go
// ParallelFetcher handles concurrent URL and file fetching
type ParallelFetcher interface {
    // FetchUrls fetches multiple URLs concurrently
    FetchUrls(context stdctx.Context, urls []string, opts *FetchOptions) apperror.Result[[]*FetchResult]
    
    // FetchFiles reads multiple files concurrently
    FetchFiles(context stdctx.Context, paths []string, opts *FileOptions) apperror.Result[[]*FileResult]
}

// FetchOptions configures URL fetching
type FetchOptions struct {
    MaxConcurrent int
    TimeoutMs     int
    Headers       map[string]string
    ExtractFormat string
}

// FetchResult contains URL fetch output
type FetchResult struct {
    Url       string
    Content   string
    Status    int
    Headers   map[string]string
    DurationMs int64
    Error     *apperror.AppError `json:",omitempty"`
}

// FileOptions configures file reading
type FileOptions struct {
    MaxConcurrent int
    MaxSizeKB     int
    Encoding      string
}

// FileResult contains file read output
type FileResult struct {
    Path      string
    Content   string
    SizeBytes int64
    ModTime   time.Time
    Error     *apperror.AppError `json:",omitempty"`
}
```

---

## 5. Built-In Commands

### 5.1 Reasoning Commands

```yaml
# deep-analysis: Multi-source research and synthesis
Name: deep-analysis
Category: reasoning
TriggerPatterns:
  - "analyze.*in depth"
  - "research.*thoroughly"
  - "deep dive.*into"
Steps:
  - StepType: Search
    StepName: web-search
    Config:
      NumResults: 10
      SearchType: web
  - StepType: Search
    StepName: code-search
    Config:
      NumResults: 10
      SearchType: code
  - StepType: VectorQuery
    StepName: rag-context
    Config:
      TopK: 20
      MinScore: 0.7
  - StepType: Aggregate
    StepName: merge-sources
    DependsOn: [web-search, code-search, rag-context]
    Config:
      Operation: merge
      DedupeField: url

# clarify-ambiguity: Identify unclear aspects and generate questions
Name: clarify-ambiguity
Category: reasoning
TriggerPatterns:
  - "what do you mean"
  - "clarify.*requirements"
  - "understand.*better"
Steps:
  - StepType: VectorQuery
    StepName: similar-queries
    Config:
      Collection: chat-history
      TopK: 5
  - StepType: Transform
    StepName: extract-patterns
    DependsOn: [similar-queries]
    Config:
      Operation: extract
      Template: "{{.Ambiguities}}"
```

### 5.2 Coding Commands

```yaml
# code-review: Analyze code quality and suggest improvements
Name: code-review
Category: coding
TriggerPatterns:
  - "review.*code"
  - "check.*implementation"
  - "audit.*file"
Steps:
  - StepType: ReadFile
    StepName: read-target
    Config:
      Encoding: utf-8
  - StepType: VectorQuery
    StepName: find-patterns
    Config:
      Collection: code-patterns
      TopK: 10
  - StepType: Search
    StepName: best-practices
    DependsOn: [read-target]
    Config:
      SearchType: code
      NumResults: 5

# implement-feature: Plan and scaffold feature implementation
Name: implement-feature
Category: coding
TriggerPatterns:
  - "implement.*feature"
  - "add.*functionality"
  - "create.*component"
Steps:
  - StepType: VectorQuery
    StepName: existing-patterns
    Config:
      Collection: codebase
      TopK: 15
  - StepType: Search
    StepName: reference-impl
    Config:
      SearchType: code
      NumResults: 10
  - StepType: ReadFile
    StepName: related-files
    DependsOn: [existing-patterns]
    Config:
      Paths: "{{.SuggestedPaths}}"
```

### 5.3 Search Commands

```yaml
# multi-source-search: Search across web, code, and local sources
Name: multi-source-search
Category: search
TriggerPatterns:
  - "search.*everywhere"
  - "find.*information"
Steps:
  - StepType: Search
    StepName: google-search
    Config:
      Engine: google
      NumResults: 10
    IsParallel: true
  - StepType: Search
    StepName: code-search
    Config:
      SearchType: code
      NumResults: 10
    IsParallel: true
  - StepType: VectorQuery
    StepName: local-search
    Config:
      TopK: 10
    IsParallel: true
  - StepType: Aggregate
    StepName: rank-results
    DependsOn: [google-search, code-search, local-search]
    Config:
      Operation: rank
      SortBy: relevance
      Limit: 20
```

---

## 6. API Endpoints

### 6.1 Command Management

```yaml
# List all commands
GET /api/v1/longchain/commands
Query:
  category: string (optional)
  enabled: boolean (optional)
  builtin: boolean (optional)
Response:
  Success: true
  Data:
    Commands: Command[]
    Total: int

# Get command by ID
GET /api/v1/longchain/commands/{id}
Response:
  Success: true
  Data: Command

# Create custom command
POST /api/v1/longchain/commands
Body: Command
Response:
  Success: true
  Data: Command

# Update command
PUT /api/v1/longchain/commands/{id}
Body: Command (partial)
Response:
  Success: true
  Data: Command

# Delete command
DELETE /api/v1/longchain/commands/{id}
Response:
  Success: true
  Data:
    Deleted: true
```

### 6.2 Execution

```yaml
# Execute command
POST /api/v1/longchain/execute
Body:
  CommandId: string (optional - uses matching if not provided)
  Input: string
  Parameters: ExecutionParameters (optional)
  StreamProgress: boolean (optional, default: true)
Response:
  Success: true
  Data:
    ExecutionId: string
    WebSocketUrl: string (if streaming)

# Get execution status
GET /api/v1/longchain/executions/{id}
Response:
  Success: true
  Data: ExecutionResult

# Cancel execution
POST /api/v1/longchain/executions/{id}/cancel
Response:
  Success: true
  Data:
    Cancelled: true

# List executions
GET /api/v1/longchain/executions
Query:
  status: string (optional)
  commandId: string (optional)
  sessionId: string (optional)
  limit: int (default: 50)
Response:
  Success: true
  Data:
    Executions: ExecutionResult[]
    Total: int
```

### 6.3 WebSocket Streaming

```yaml
# Progress streaming endpoint
WS /ws/longchain/{executionId}

# Message types (server -> client)
StepStarted:
  Type: "step_started"
  StepId: string
  StepName: string
  StepType: string
  Timestamp: string

StepProgress:
  Type: "step_progress"
  StepId: string
  Progress: float64 (0-1)
  Message: string

StepCompleted:
  Type: "step_completed"
  StepId: string
  DurationMs: int
  OutputPreview: string (truncated)

StepFailed:
  Type: "step_failed"
  StepId: string
  ErrorCode: int
  ErrorMessage: string

ExecutionCompleted:
  Type: "execution_completed"
  ExecutionId: string
  Status: string
  DurationMs: int
```

---

## 7. Error Codes

| Code | Constant | Description | HTTP |
|------|----------|-------------|------|
| 9970 | `ErrLongChainCommandNotFound` | Command not found by ID or name | 404 |
| 9971 | `ErrLongChainCommandExists` | Command with name already exists | 409 |
| 9972 | `ErrLongChainInvalidStep` | Invalid step type or configuration | 400 |
| 9973 | `ErrLongChainCyclicDependency` | Circular dependency detected in steps | 400 |
| 9974 | `ErrLongChainExecutionFailed` | Execution failed (see step errors) | 500 |
| 9975 | `ErrLongChainStepTimeout` | Step exceeded timeout limit | 504 |
| 9976 | `ErrLongChainStepRetryExhausted` | Step failed after max retries | 500 |
| 9977 | `ErrLongChainInvalidInput` | Invalid input parameters | 400 |
| 9978 | `ErrLongChainExecutionNotFound` | Execution ID not found | 404 |
| 9979 | `ErrLongChainExecutionCancelled` | Execution was cancelled | 499 |
| 9980 | `ErrLongChainParallelFetchFailed` | Parallel fetch operation failed | 500 |
| 9981 | `ErrLongChainTransformError` | Transform template or operation failed | 400 |
| 9982 | `ErrLongChainFilterError` | Filter condition evaluation failed | 400 |
| 9983 | `ErrLongChainBranchError` | Branch condition evaluation failed | 400 |
| 9984 | `ErrLongChainRegistryError` | Command registry operation failed | 500 |
| 9985 | `ErrLongChainWebSocketError` | WebSocket connection or streaming failed | 500 |
| 9986 | `ErrLongChainBuiltInModify` | Cannot modify built-in command | 403 |
| 9987 | `ErrLongChainInvalidPattern` | Invalid trigger pattern regex | 400 |
| 9988 | `ErrLongChainDependencyMissing` | Referenced step dependency not found | 400 |
| 9989 | `ErrLongChainMaxDepthExceeded` | Execution exceeded max step depth | 400 |

---

## 8. Settings Integration

### 8.1 Configuration Schema

```yaml
# config/longchain.seed.yaml
LongChain:
  Execution:
    MaxConcurrentSteps: 10
    DefaultTimeoutMs: 30000
    MaxStepDepth: 20
    RetryDefaults:
      MaxAttempts: 3
      BackoffMs: 1000
      BackoffMultiplier: 2.0
  
  ParallelFetcher:
    MaxConcurrentUrls: 20
    MaxConcurrentFiles: 50
    UrlTimeoutMs: 10000
    MaxFileSizeKB: 5120
  
  Registry:
    LoadBuiltInOnStart: true
    AllowCustomCommands: true
    MaxCustomCommands: 100
  
  WebSocket:
    ProgressIntervalMs: 100
    HeartbeatIntervalMs: 30000
    MaxConnectionsPerExecution: 5
```

### 8.2 Runtime Settings API

```yaml
# Get long-chain settings
GET /api/v1/settings/longchain
Response:
  Success: true
  Data: LongChainSettings

# Update long-chain settings
PUT /api/v1/settings/longchain
Body: LongChainSettings (partial)
Response:
  Success: true
  Data: LongChainSettings

# Reset to defaults
POST /api/v1/settings/longchain/reset
Body:
  Scope: string (execution, fetcher, registry, websocket, all)
Response:
  Success: true
  Data: LongChainSettings
```

---

## 9. Dependency Resolution Algorithm

### 9.1 DAG Construction

```go
// BuildDependencyGraph constructs a DAG from step definitions
func BuildDependencyGraph(steps []StepDefinition) apperror.Result[*DependencyGraph] {
    graph := &DependencyGraph{
        Nodes: make(map[string]*GraphNode),
        Edges: make(map[string][]string),
    }
    
    // 1. Create nodes for each step
    for _, step := range steps {
        graph.Nodes[step.Id] = &GraphNode{
            Step:     step,
            InDegree: 0,
        }
    }
    
    // 2. Build edges from DependsOn
    for _, step := range steps {
        for _, depId := range step.DependsOn {
            if _, exists := graph.Nodes[depId]; !exists {
                return apperror.FailNew[*DependencyGraph](
                    ErrLongChainDependencyNotFound,
                    "dependency %s not found",
                    depId,
                )
            }

            graph.Edges[depId] = append(graph.Edges[depId], step.Id)
            graph.Nodes[step.Id].InDegree++
        }
    }
    
    // 3. Detect cycles using Kahn's algorithm
    if hasCycle := graph.DetectCycle(); hasCycle {
        return apperror.FailNew[*DependencyGraph](
            ErrLongChainCyclicDependency,
            "cyclic dependency detected in task graph",
        )
    }
    
    return apperror.Ok(graph)
}
```

### 9.2 Parallel Execution Scheduler

```go
// Schedule returns execution waves (steps that can run in parallel)
func (g *DependencyGraph) Schedule() [][]string {
    waves := [][]string{}
    inDegree := make(map[string]int)
    
    // Copy in-degrees
    for id, node := range g.Nodes {
        inDegree[id] = node.InDegree
    }
    
    for len(inDegree) > 0 {
        // Find all nodes with in-degree 0
        wave := []string{}
        for id, degree := range inDegree {
            if degree == 0 {
                wave = append(wave, id)
            }
        }
        
        // Remove processed nodes and update degrees
        for _, id := range wave {
            delete(inDegree, id)
            for _, childId := range g.Edges[id] {
                inDegree[childId]--
            }
        }
        
        waves = append(waves, wave)
    }
    
    return waves
}
```

---

## 10. Acceptance Criteria

### 10.1 Command Registry

| ID | Criterion | Validation |
|----|-----------|------------|
| CR-01 | Built-in commands load on startup | Unit test + integration |
| CR-02 | Custom commands persist to database | Integration test |
| CR-03 | Trigger pattern matching works | Unit test with regex suite |
| CR-04 | Duplicate command names rejected | Unit test |
| CR-05 | Built-in commands cannot be deleted | Integration test |

### 10.2 Step Execution

| ID | Criterion | Validation |
|----|-----------|------------|
| SE-01 | ReadFile handles glob patterns | Unit test |
| SE-02 | ReadUrl fetches in parallel | Benchmark test |
| SE-03 | Search integrates with GSearch CLI | Integration test |
| SE-04 | VectorQuery uses RAG pipeline | Integration test |
| SE-05 | Transform applies Go templates | Unit test |
| SE-06 | Filter evaluates conditions correctly | Unit test |
| SE-07 | Aggregate merges/dedupes results | Unit test |
| SE-08 | Branch evaluates conditions | Unit test |
| SE-09 | Execute captures command output | Integration test |

### 10.3 Parallel Execution

| ID | Criterion | Validation |
|----|-----------|------------|
| PE-01 | Independent steps run concurrently | Benchmark test |
| PE-02 | Dependencies block correctly | Unit test |
| PE-03 | Cyclic dependencies detected | Unit test |
| PE-04 | Step timeout enforced | Integration test |
| PE-05 | Retry logic with backoff works | Unit test |
| PE-06 | Cancellation stops all workers | Integration test |

### 10.4 Performance

| ID | Criterion | Validation |
|----|-----------|------------|
| PF-01 | <50ms latency for 100k docs | Benchmark test |
| PF-02 | 20 concurrent URL fetches | Load test |
| PF-03 | 50 concurrent file reads | Load test |
| PF-04 | WebSocket updates <100ms interval | Integration test |

### 10.5 API Compliance

| ID | Criterion | Validation |
|----|-----------|------------|
| AC-01 | All endpoints return standard envelope | Integration test |
| AC-02 | Error codes match registry | Unit test |
| AC-03 | WebSocket follows protocol spec | Integration test |
| AC-04 | Settings persist and reset | Integration test |

---

## 11. Implementation Checklist

### Phase 1A: Core Infrastructure
- [ ] Create database tables (LongChainCommands, LongChainSteps, LongChainExecutions)
- [ ] Implement StepConfig interfaces for all 9 step types
- [ ] Build CommandRegistry with CRUD operations
- [ ] Add trigger pattern matching with regex

### Phase 1B: Execution Engine
- [ ] Implement DependencyGraph with cycle detection
- [ ] Build parallel scheduler with wave-based execution
- [ ] Create ParallelExecutor with worker pool
- [ ] Add step timeout and retry logic

### Phase 1C: Step Implementations
- [ ] Implement ReadFile step with glob support
- [ ] Implement ReadUrl step with ParallelFetcher
- [ ] Integrate Search step with GSearch CLI
- [ ] Integrate VectorQuery with RAG pipeline
- [ ] Implement Transform with Go templates
- [ ] Implement Filter with condition evaluation
- [ ] Implement Aggregate operations
- [ ] Implement Branch with condition evaluation
- [ ] Implement Execute for shell commands

### Phase 1D: API & Streaming
- [ ] Create REST endpoints for command management
- [ ] Create REST endpoints for execution
- [ ] Implement WebSocket progress streaming
- [ ] Add settings API integration

### Phase 1E: Built-In Commands
- [ ] Create deep-analysis command
- [ ] Create clarify-ambiguity command
- [ ] Create code-review command
- [ ] Create implement-feature command
- [ ] Create multi-source-search command

### Phase 1F: Testing & Validation
- [ ] Unit tests for all step types
- [ ] Integration tests for execution flow
- [ ] Benchmark tests for performance targets
- [ ] WebSocket protocol tests

---

## 12. Prompt-to-DAG Decomposition

### 12.1 Overview

When a user prompt arrives, the system decomposes it into a **Directed Acyclic Graph (DAG)** of tasks. Each node represents a discrete operation (search, read, write, generate), and edges represent data dependencies. The DAG enables maximum parallelism: independent tasks execute concurrently, while dependent tasks wait for their inputs.

### 12.2 TaskNode and TaskEdge Types

```go
// TaskNode represents a single operation in the execution DAG
type TaskNode struct {
    Id          string
    Type        step_type.Variant      // ReadFile, Search, VectorQuery, Transform, etc.
    Name        string                 // Human-readable name
    Config      StepConfig             // Step-specific configuration
    Priority    int                    // Execution priority (lower = higher)
    IsParallel  bool                   // Can run in parallel with same-wave siblings
    TimeoutMs   int                    // Per-task timeout
    RetryCount  int                    // Max retries on failure
    Origin      string                 // "prompt_analysis" | "search_plan" | "user_defined"
}

// TaskEdge represents a dependency between two tasks
type TaskEdge struct {
    FromId      string                 // Producer task ID
    ToId        string                 // Consumer task ID
    DataFlow    string                 // What data flows: "full_output", "filtered", "metadata"
}

// TaskDAG is the complete execution graph
type TaskDAG struct {
    Nodes       map[string]*TaskNode
    Edges       []TaskEdge
    EntryNodes  []string               // Nodes with no dependencies (wave 0)
    ExitNodes   []string               // Nodes with no dependents (final wave)
    Metadata    DAGMetadata
}

type DAGMetadata struct {
    SourcePrompt    string
    TotalNodes      int
    MaxParallelism  int                // Max nodes in any single wave
    EstimatedMs     int                // Estimated total execution time
    CreatedAt       time.Time
}
```

### 12.3 DAG Builder

```go
// DAGBuilder constructs a TaskDAG from a SearchPlan (produced by PromptAnalyzer)
type DAGBuilder struct {
    registry    CommandRegistry
    config      DAGBuilderConfig
}

type DAGBuilderConfig struct {
    MaxNodes        int           // Default: 50
    MaxDepth        int           // Default: 10 (longest path)
    DefaultTimeout  int           // Default: 30000ms
    DefaultRetry    int           // Default: 3
}

func (b *DAGBuilder) BuildFromSearchPlan(plan *SearchPlan) apperror.Result[*TaskDAG] {
    dag := &TaskDAG{
        Nodes:      make(map[string]*TaskNode),
        Edges:      []TaskEdge{},
        Metadata: DAGMetadata{
            SourcePrompt: plan.Intent,
            CreatedAt:    time.Now(),
        },
    }

    // 1. Convert SearchInstructions → TaskNodes
    for _, si := range plan.SearchInstructions {
        node := &TaskNode{
            Id:         si.Id,
            Type:       step_type.Search,
            Name:       fmt.Sprintf("Search: %s", si.Purpose),
            Config:     b.buildSearchConfig(si),
            Priority:   priorityToInt(si.Priority),
            IsParallel: true, // Searches are parallel by default
            TimeoutMs:  b.config.DefaultTimeout,
            RetryCount: b.config.DefaultRetry,
            Origin:     "search_plan",
        }
        dag.Nodes[si.Id] = node

        // Add edges for search dependencies
        for _, dep := range si.DependsOn {
            dag.Edges = append(dag.Edges, TaskEdge{
                FromId:   dep,
                ToId:     si.Id,
                DataFlow: "full_output",
            })
        }
    }

    // 2. Convert TaskInstructions → TaskNodes
    for _, ti := range plan.TaskChain {
        node := &TaskNode{
            Id:         ti.Id,
            Type:       b.actionToStepType(ti.Action),
            Name:       ti.Description,
            Config:     b.buildTaskConfig(ti),
            IsParallel: ti.IsParallel,
            TimeoutMs:  b.config.DefaultTimeout,
            RetryCount: b.config.DefaultRetry,
            Origin:     "search_plan",
        }
        dag.Nodes[ti.Id] = node

        // Add edges for task dependencies
        for _, dep := range ti.DependsOn {
            dag.Edges = append(dag.Edges, TaskEdge{
                FromId:   dep,
                ToId:     ti.Id,
                DataFlow: "full_output",
            })
        }
    }

    // 3. Compute entry/exit nodes
    dag.EntryNodes = b.findEntryNodes(dag)
    dag.ExitNodes = b.findExitNodes(dag)

    // 4. Validate DAG
    validationErr := b.validateDAG(dag)
    if validationErr != nil {
        return apperror.Fail[*TaskDAG](validationErr)
    }

    // 5. Compute metadata
    dag.Metadata.TotalNodes = len(dag.Nodes)
    dag.Metadata.MaxParallelism = b.computeMaxParallelism(dag)
    dag.Metadata.EstimatedMs = b.estimateExecutionTime(dag)

    return apperror.Ok(dag)
}

func (b *DAGBuilder) actionToStepType(action string) step_type.Variant {
    switch action {
    case "write_file":
        return step_type.Execute
    case "read_file", "read_code":
        return step_type.ReadFile
    case "generate_code", "summarize":
        return step_type.Transform
    case "compare", "extract":
        return step_type.Filter
    case "transform":
        return step_type.Transform
    default:
        return step_type.Execute
    }
}
```

### 12.4 Topological Sort with Wave Scheduling

```go
// ScheduleWaves returns execution waves using Kahn's algorithm.
// Each wave contains tasks that can execute in parallel.
// Tasks in wave N+1 depend on at least one task in wave N or earlier.
func (dag *TaskDAG) ScheduleWaves() apperror.Result[[]ExecutionWave] {
    // Build adjacency and in-degree maps
    inDegree := map[string]int{}
    children := map[string][]string{}

    for id := range dag.Nodes {
        inDegree[id] = 0
    }

    for _, edge := range dag.Edges {
        children[edge.FromId] = append(children[edge.FromId], edge.ToId)
        inDegree[edge.ToId]++
    }

    var waves []ExecutionWave
    remaining := len(dag.Nodes)

    for remaining > 0 {
        // Collect all zero in-degree nodes
        var parallelTasks []string
        var sequentialTasks []string

        for id, deg := range inDegree {
            if deg == 0 {
                node := dag.Nodes[id]
                if node.IsParallel {
                    parallelTasks = append(parallelTasks, id)
                } else {
                    sequentialTasks = append(sequentialTasks, id)
                }
            }
        }

        if len(parallelTasks) == 0 && len(sequentialTasks) == 0 {
            return apperror.FailNew[[]ExecutionWave](
                9973, "cyclic dependency detected in task DAG",
            )
        }

        wave := ExecutionWave{
            WaveNum:         len(waves),
            ParallelTasks:   parallelTasks,
            SequentialTasks: sequentialTasks,
        }
        waves = append(waves, wave)

        // Remove processed nodes, update in-degrees
        allInWave := append(parallelTasks, sequentialTasks...)
        for _, id := range allInWave {
            delete(inDegree, id)
            remaining--
            for _, childId := range children[id] {
                inDegree[childId]--
            }
        }
    }

    return apperror.Ok(waves)
}

type ExecutionWave struct {
    WaveNum         int
    ParallelTasks   []string   // Execute concurrently
    SequentialTasks []string   // Execute one-by-one within the wave
}
```

### 12.5 Worked Examples

#### Example 1: Simple Search + Summarize

```
Prompt: "What are the best Go testing frameworks in 2026?"

DAG:
  search-1 ──┐
              ├──→ task-1 (summarize)
  search-2 ──┘

Waves:
  Wave 0: [search-1 ∥ search-2]     ← parallel web + code search
  Wave 1: [task-1]                    ← summarize (depends on both searches)

Timeline: ████████ search (parallel) ████ summarize = ~2s total
```

#### Example 2: Research + Code Generation + File Write

```
Prompt: "Research React Server Components, read my existing App.tsx,
         and refactor it to use RSC patterns. Save to App.rsc.tsx"

DAG:
  search-1 (web: RSC docs) ──────────────────┐
  search-2 (code: RSC examples) ──────────────┤
  task-1 (read_file: src/App.tsx) ─────────────┤
                                               ├──→ task-2 (generate_code)
                                               │          │
                                               │          ▼
                                               │    task-3 (write_file: App.rsc.tsx)

Waves:
  Wave 0: [search-1 ∥ search-2 ∥ task-1]   ← all independent, run parallel
  Wave 1: [task-2]                           ← generate refactored code
  Wave 2: [task-3]                           ← write output file

Timeline: ████ fetch (parallel) ██████ generate ██ write = ~5s total
```

#### Example 3: Multi-Step with Branching Dependencies

```
Prompt: "Compare the performance of sync.Mutex vs sync.RWMutex in Go.
         Search for benchmarks, read our current mutex usage in pkg/cache/,
         and generate a recommendation document with code examples."

DAG:
  search-1 (web: Mutex vs RWMutex benchmarks) ───┐
  search-2 (code: Go mutex benchmark examples) ──┤
  task-1 (read_file: pkg/cache/*.go) ──────────────┤
                                                   │
  search-3 (web: sync.RWMutex best practices) ─────┤
                                                   │
                                                   ├──→ task-2 (compare: analyze results)
                                                   │          │
                                                   │          ├──→ task-3 (generate_code: examples)
                                                   │          │          │
                                                   │          │          ▼
                                                   │          └──→ task-4 (write_file: docs/mutex-recommendation.md)
                                                   │                     ▲
                                                   │                     │
                                                   └── task-3 ───────────┘

Waves:
  Wave 0: [search-1 ∥ search-2 ∥ search-3 ∥ task-1]   ← 4 parallel fetches
  Wave 1: [task-2]                                       ← compare/analyze
  Wave 2: [task-3]                                       ← generate code examples
  Wave 3: [task-4]                                       ← write final document

Timeline: ████ fetch ████ analyze ████ codegen ██ write = ~8s total
```

#### Example 4: Independent Parallel Chains

```
Prompt: "Generate API documentation for our user and product endpoints.
         Search for OpenAPI best practices for each."

DAG:
  search-1 (web: OpenAPI user endpoint patterns) ──→ task-1 (read_file: api/user.go)
       │                                                      │
       └─────────────────────────────────────────→ task-3 (generate: user API docs)
                                                              │
  search-2 (web: OpenAPI product endpoint patterns) ──→ task-2 (read_file: api/product.go)
       │                                                      │
       └─────────────────────────────────────────→ task-4 (generate: product API docs)
                                                              │
                                              task-3 ∥ task-4 ──→ task-5 (aggregate + write)

Waves:
  Wave 0: [search-1 ∥ search-2]                            ← parallel searches
  Wave 1: [task-1 ∥ task-2]                                 ← parallel file reads
  Wave 2: [task-3 ∥ task-4]                                 ← parallel doc generation
  Wave 3: [task-5]                                          ← merge and write

Timeline: ████ search ██ read ██████ generate (parallel) ██ merge = ~6s total
```

---

## 13. Cross-References

| Document | Relevance |
|----------|-----------|
| `02-spec/04-error-resolution/` | Error handling patterns |
| `02-spec/27-ai-bridge-cli/01-backend/05-error-codes.md` | Error code registry |
| `02-spec/27-ai-bridge-cli/01-backend/09-agentic-mode.md` | Prompt-to-Search pipeline, SearchPlan schema |
| `02-spec/27-ai-bridge-cli/01-backend/37-adaptive-reasoning-flow.md` | Reasoning mode selection, heuristics |
| `02-spec/27-ai-bridge-cli/01-backend/40-gsearch-context-integration.md` | GSearch delegation, context detection |
| `02-spec/27-ai-bridge-cli/01-backend/49-execution-retry-strategies.md` | Retry patterns |
| `.lovable/plan.md` | Phase 1 plan overview |

---

## Appendix A: Example Command Definition

```json
{
  "Name": "research-topic",
  "Category": "reasoning",
  "TriggerPatterns": ["research.*about", "find.*information"],
  "Steps": [
    {
      "Id": "step-1",
      "StepType": "Search",
      "StepName": "web-search",
      "Config": {
        "NumResults": 15,
        "SearchType": "web"
      },
      "IsParallel": true
    },
    {
      "Id": "step-2",
      "StepType": "VectorQuery",
      "StepName": "local-context",
      "Config": {
        "TopK": 10,
        "MinScore": 0.75
      },
      "IsParallel": true
    },
    {
      "Id": "step-3",
      "StepType": "Aggregate",
      "StepName": "combine-results",
      "DependsOn": ["step-1", "step-2"],
      "Config": {
        "Operation": "merge",
        "DedupeField": "url",
        "Limit": 20
      }
    },
    {
      "Id": "step-4",
      "StepType": "Transform",
      "StepName": "format-output",
      "DependsOn": ["step-3"],
      "Config": {
        "Operation": "map",
        "OutputFormat": "markdown"
      }
    }
  ]
}
```
