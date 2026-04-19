# Nexus-Flow Specification

**Service:** Nexus-Flow (Orchestration Engine)  
**Port:** 8085  
**CLI:** `nexus-flow`  
**Phase:** 7  
**Status:** Draft  
**Last Updated:** 2026-03-09
**Version:** 1.0.0  

---

## 1. Overview

Nexus-Flow is the standalone orchestration engine for automation pipelines. It provides a CLI interface, WebSocket server for real-time execution, and a block-based execution architecture supporting 7 stage types with conditional branching and concurrency control.

### 1.1 Core Capabilities

| Capability | Description |
|------------|-------------|
| Pipeline Orchestration | DAG-based workflow execution |
| Block Execution | 7 stage types with isolated execution |
| WebSocket Server | Real-time bidirectional communication |
| CLI Interface | Command-line pipeline management |
| Visual Canvas | React Flow node-based editor integration |
| RES Integration | Fault-tolerant execution via Resilient Execution System |
| Concurrency Control | Throttled parallel execution |

### 1.2 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Nexus-Flow Service                          │
│                            (:8085)                                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────────────┐   │
│  │   CLI Layer   │  │  HTTP API     │  │  WebSocket Server     │   │
│  │  nexus-flow   │  │  /api/v1/*    │  │  /ws/pipeline         │   │
│  └───────┬───────┘  └───────┬───────┘  └───────────┬───────────┘   │
│          │                  │                      │               │
│          ▼                  ▼                      ▼               │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    Pipeline Engine                           │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │   │
│  │  │ Scheduler │  │ Executor │  │ RES      │  │ State    │    │   │
│  │  │          │  │          │  │ Bridge   │  │ Manager  │    │   │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                              │                                     │
│  ┌───────────────────────────┴─────────────────────────────────┐   │
│  │                    Block Registry                            │   │
│  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌──────────┐ ┌─────────┐  │   │
│  │  │ Prompt │ │ Search │ │CodeGen │ │Validation│ │Transform│  │   │
│  │  └────────┘ └────────┘ └────────┘ └──────────┘ └─────────┘  │   │
│  │  ┌────────┐ ┌────────┐                                       │   │
│  │  │  HTTP  │ │ FileOp │                                       │   │
│  │  └────────┘ └────────┘                                       │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
         │                    │                    │
         ▼                    ▼                    ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   AI-Bridge     │  │     Scout       │  │   SpecManager   │
│    (:8082)      │  │    (:8084)      │  │    (:8081)      │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

---

## 2. Directory Structure

```
cmd/nexus-flow/
├── main.go                    # CLI entry point
├── cli/
│   ├── root.go                # Root command
│   ├── run.go                 # Pipeline execution
│   ├── serve.go               # WebSocket server
│   ├── validate.go            # Pipeline validation
│   ├── list.go                # List pipelines
│   └── export.go              # Export pipeline

internal/
├── engine/
│   ├── pipeline.go            # Pipeline execution engine
│   ├── scheduler.go           # DAG-based task scheduler
│   ├── executor.go            # Block execution coordinator
│   └── state.go               # Execution state management
├── block/
│   ├── registry.go            # Block type registry
│   ├── interface.go           # Block interface definition
│   ├── prompt.go              # Prompt block
│   ├── search.go              # Search block
│   ├── codegen.go             # CodeGen block
│   ├── validation.go          # Validation block
│   ├── transform.go           # Transform block
│   ├── http.go                # HTTP block
│   └── fileop.go              # FileOp block
├── control/
│   ├── branch.go              # Conditional branching
│   ├── loop.go                # Loop with concurrency throttle
│   └── parallel.go            # Parallel execution group
├── websocket/
│   ├── server.go              # WebSocket server
│   ├── handler.go             # Message handlers
│   ├── protocol.go            # Protocol definitions
│   └── session.go             # Session management
├── res/
│   ├── bridge.go              # RES integration bridge
│   ├── checkpoint.go          # Checkpoint management
│   └── recovery.go            # Error recovery strategies
├── handler/
│   ├── pipeline.go            # Pipeline HTTP handlers
│   ├── execution.go           # Execution HTTP handlers
│   └── health.go              # Health check handlers
├── repository/
│   ├── pipeline_repo.go       # Pipeline persistence
│   ├── execution_repo.go      # Execution history
│   └── checkpoint_repo.go     # Checkpoint storage
└── model/
    ├── pipeline.go            # Pipeline domain model
    ├── block.go               # Block domain model
    ├── execution.go           # Execution domain model
    └── message.go             # WebSocket message types

migrations/
└── nexus-flow/
    ├── 001_create_pipelines.sql
    ├── 002_create_executions.sql
    ├── 003_create_checkpoints.sql
    └── 004_create_telemetry.sql
```

---

## 3. CLI Design

### 3.1 Command Structure

```
nexus-flow
├── serve                      # Start WebSocket server
│   ├── --port, -p             # Server port (default: 8085)
│   ├── --host                 # Bind address (default: 0.0.0.0)
│   └── --config, -c           # Config file path
│
├── run                        # Execute pipeline
│   ├── <pipeline-id>          # Pipeline ID or file path
│   ├── --project, -p          # Project ID context
│   ├── --input, -i            # Input JSON/file
│   ├── --output, -o           # Output file path
│   ├── --async                # Run asynchronously
│   ├── --timeout              # Execution timeout
│   └── --dry-run              # Validate without execution
│
├── validate                   # Validate pipeline definition
│   ├── <pipeline-id|file>     # Pipeline to validate
│   └── --strict               # Strict validation mode
│
├── list                       # List pipelines
│   ├── --project, -p          # Filter by project
│   ├── --status               # Filter by status
│   └── --format               # Output format (table|json)
│
├── export                     # Export pipeline
│   ├── <pipeline-id>          # Pipeline to export
│   ├── --output, -o           # Output file
│   └── --format               # Export format (json|yaml)
│
├── import                     # Import pipeline
│   ├── <file>                 # Pipeline file to import
│   └── --project, -p          # Target project
│
├── history                    # Execution history
│   ├── <pipeline-id>          # Pipeline ID
│   ├── --limit, -n            # Number of entries
│   └── --status               # Filter by status
│
└── version                    # Show version info
```

### 3.2 CLI Implementation

```go
// cmd/nexus-flow/cli/root.go
package cli

import (
    "fmt"
    "os"
    "runtime"
    
    "github.com/spf13/cobra"
    "github.com/spf13/viper"
    
    "pkg/logging"
)

var (
    cfgFile string
    logger  *logging.Logger
)

// rootCmd represents the base command
var rootCmd = &cobra.Command{
    Use:   "nexus-flow",
    Short: "Nexus-Flow orchestration engine",
    Long: `Nexus-Flow is a standalone orchestration engine for automation pipelines.
    
It provides DAG-based workflow execution with 7 block types:
  - Prompt:     AI prompt execution
  - Search:     RAG-powered search
  - CodeGen:    Code generation
  - Validation: Output validation
  - Transform:  Data transformation
  - HTTP:       External API calls
  - FileOp:     File system operations`,
    PersistentPreRun: func(cmd *cobra.Command, args []string) {
        _, file, line, _ := runtime.Caller(0)
        logger.Debug("Command starting",
            "file", file,
            "line", line,
            "command", cmd.Name(),
            "args", args,
        )
    },
}

// Execute runs the CLI
func Execute() {
    _, file, line, _ := runtime.Caller(0)
    
    if err := rootCmd.Execute(); err != nil {
        logger.Error("Command failed",
            "file", file,
            "line", line,
            "error", err,
        )
        os.Exit(1)
    }
}

func init() {
    cobra.OnInitialize(initConfig)
    
    rootCmd.PersistentFlags().StringVar(&cfgFile, "config", "", "config file")
    rootCmd.PersistentFlags().String("log-level", "info", "log level")
    rootCmd.PersistentFlags().Bool("json-logs", false, "output logs as JSON")
    
    viper.BindPFlag("log.level", rootCmd.PersistentFlags().Lookup("log-level"))
    viper.BindPFlag("log.json", rootCmd.PersistentFlags().Lookup("json-logs"))
}

func initConfig() {
    _, file, line, _ := runtime.Caller(0)
    
    if cfgFile != "" {
        viper.SetConfigFile(cfgFile)
    } else {
        viper.SetConfigName("nexus-flow")
        viper.SetConfigType("yaml")
        viper.AddConfigPath(".")
        viper.AddConfigPath("./config")
        viper.AddConfigPath("/etc/nexus-flow")
    }
    
    viper.AutomaticEnv()
    viper.SetEnvPrefix("NEXUS")
    
    if err := viper.ReadInConfig(); err != nil {
        if _, ok := err.(viper.ConfigFileNotFoundError); !ok {
            fmt.Printf("[%s:%d] Error reading config: %v\n", file, line, err)
        }
    }
    
    // Initialize logger with AddSource: true
    logConfig := logging.Config{
        Level:     viper.GetString("log.level"),
        Format:    "json",
        AddSource: true, // MANDATORY: Include function names and line numbers
    }
    logger = logging.NewLogger(logConfig)
}
```

### 3.3 Run Command

```go
// cmd/nexus-flow/cli/run.go
package cli

import (
    stdctx "context"
    "encoding/json"
    "os"
    "runtime"
    "time"
    
    "github.com/spf13/cobra"
    
    "nexus-flow/internal/engine"
    "nexus-flow/internal/model"
    "pkg/errors"
    "pkg/types"
)

var runCmd = &cobra.Command{
    Use:   "run <pipeline-id>",
    Short: "Execute a pipeline",
    Args:  cobra.ExactArgs(1),
    RunE:  runPipeline,
}

func init() {
    rootCmd.AddCommand(runCmd)
    
    runCmd.Flags().StringP("project", "p", "", "Project ID context")
    runCmd.Flags().StringP("input", "i", "", "Input JSON or file path")
    runCmd.Flags().StringP("output", "o", "", "Output file path")
    runCmd.Flags().Bool("async", false, "Run asynchronously")
    runCmd.Flags().Duration("timeout", 30*time.Minute, "Execution timeout")
    runCmd.Flags().Bool("dry-run", false, "Validate without execution")
}

func runPipeline(cmd *cobra.Command, args []string) error {
    _, file, line, _ := runtime.Caller(0)
    
    pipelineId := args[0]
    projectId, _ := cmd.Flags().GetString("project")
    inputStr, _ := cmd.Flags().GetString("input")
    outputPath, _ := cmd.Flags().GetString("output")
    async, _ := cmd.Flags().GetBool("async")
    timeout, _ := cmd.Flags().GetDuration("timeout")
    dryRun, _ := cmd.Flags().GetBool("dry-run")
    
    logger.Info("Running pipeline",
        "file", file,
        "line", line,
        "pipelineId", pipelineId,
        "projectId", projectId,
        "async", async,
        "dryRun", dryRun,
    )
    
    // Parse input
    var input json.RawMessage
    if inputStr != "" {
        if err := parseInput(inputStr, &input); err != nil {
            return errors.Wrap(err, errors.CodeValidationError,
                "Failed to parse input",
                "file", file,
                "line", line,
            )
        }
    }
    
    // Create execution context
    context, cancel := stdctx.WithTimeout(stdctx.Background(), timeout)
    defer cancel()
    
    // Initialize engine
    eng, err := engine.New(engine.Config{
        ProjectId: types.ProjectId(projectId),
    })
    if err != nil {
        return errors.Wrap(err, errors.CodeInternalError,
            "Failed to initialize engine",
            "file", file,
            "line", line,
        )
    }
    
    // Load pipeline
    pipeline, err := eng.LoadPipeline(context, pipelineId)
    if err != nil {
        return err
    }
    
    // Dry run - validate only
    if dryRun {
        if err := eng.ValidatePipeline(context, pipeline); err != nil {
            return err
        }
        logger.Info("Pipeline validation successful",
            "file", file,
            "line", line,
            "pipelineId", pipelineId,
        )
        return nil
    }
    
    // Execute pipeline
    execReq := model.ExecutionRequest{
        PipelineId: types.PipelineId(pipelineId),
        ProjectId:  types.ProjectId(projectId),
        Input:      input,
        Async:      async,
    }
    
    result, err := eng.Execute(context, execReq)
    if err != nil {
        return err
    }
    
    // Handle output
    if outputPath != "" {
        if err := writeOutput(outputPath, result); err != nil {
            return err
        }
    } else {
        // Print to stdout
        output, _ := json.MarshalIndent(result, "", "  ")
        fmt.Println(string(output))
    }
    
    return nil
}

func parseInput(input string, target *json.RawMessage) error {
    // Try as file path first
    if pathutil.Exists(input) {
        data, err := pathutil.ReadFile(input)
        if err != nil {
            return err
        }
        return json.Unmarshal(data, target)
    }
    
    // Try as JSON string
    return json.Unmarshal([]byte(input), target)
}

func writeOutput(path string, result *model.ExecutionResult) error {
    data, err := json.MarshalIndent(result, "", "  ")
    if err != nil {
        return err
    }
    return pathutil.WriteFile(path, data, 0644)
}
```

---

## 4. WebSocket Protocol

### 4.1 Connection Flow

```
┌──────────────────────────────────────────────────────────────────────┐
│                      WebSocket Connection Flow                        │
├──────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  Client                                  Server                       │
│    │                                        │                         │
│    │  1. WS Connect /ws/pipeline            │                         │
│    │ ──────────────────────────────────────>│                         │
│    │                                        │                         │
│    │  2. session.created                    │                         │
│    │ <──────────────────────────────────────│                         │
│    │                                        │                         │
│    │  3. session.configure                  │                         │
│    │ ──────────────────────────────────────>│                         │
│    │                                        │                         │
│    │  4. session.configured                 │                         │
│    │ <──────────────────────────────────────│                         │
│    │                                        │                         │
│    │  5. pipeline.execute                   │                         │
│    │ ──────────────────────────────────────>│                         │
│    │                                        │                         │
│    │  6. execution.started                  │                         │
│    │ <──────────────────────────────────────│                         │
│    │                                        │                         │
│    │  7. block.started (per block)          │                         │
│    │ <──────────────────────────────────────│                         │
│    │                                        │                         │
│    │  8. block.progress (streaming)         │                         │
│    │ <──────────────────────────────────────│                         │
│    │                                        │                         │
│    │  9. block.completed                    │                         │
│    │ <──────────────────────────────────────│                         │
│    │                                        │                         │
│    │  10. execution.completed               │                         │
│    │ <──────────────────────────────────────│                         │
│    │                                        │                         │
└──────────────────────────────────────────────────────────────────────┘
```

### 4.2 Message Types

```go
// internal/websocket/protocol.go
package websocket

import (
    "time"
    
    "pkg/types"
)

// MessageType defines WebSocket message types
type MessageType string

const (
    // Client -> Server
    MsgSessionConfigure  MessageType = "session.configure"
    MsgPipelineExecute   MessageType = "pipeline.execute"
    MsgPipelineCancel    MessageType = "pipeline.cancel"
    MsgPipelinePause     MessageType = "pipeline.pause"
    MsgPipelineResume    MessageType = "pipeline.resume"
    MsgBlockRetry        MessageType = "block.retry"
    MsgBlockSkip         MessageType = "block.skip"
    MsgInputProvide      MessageType = "input.provide"
    MsgPing              MessageType = "ping"
    
    // Server -> Client
    MsgSessionCreated    MessageType = "session.created"
    MsgSessionConfigured MessageType = "session.configured"
    MsgExecutionStarted  MessageType = "execution.started"
    MsgExecutionProgress MessageType = "execution.progress"
    MsgExecutionCompleted MessageType = "execution.completed"
    MsgExecutionFailed   MessageType = "execution.failed"
    MsgExecutionCanceled MessageType = "execution.canceled"
    MsgBlockStarted      MessageType = "block.started"
    MsgBlockProgress     MessageType = "block.progress"
    MsgBlockCompleted    MessageType = "block.completed"
    MsgBlockFailed       MessageType = "block.failed"
    MsgBlockWaiting      MessageType = "block.waiting"
    MsgCheckpointCreated MessageType = "checkpoint.created"
    MsgEscalationRequired MessageType = "escalation.required"
    MsgPong              MessageType = "pong"
    MsgError             MessageType = "error"
)

// BaseMessage is the base structure for all messages
type BaseMessage struct {
    Type      MessageType
    EventId   string
    Timestamp time.Time
}

// SessionCreatedMessage sent when connection established
type SessionCreatedMessage struct {
    BaseMessage
    SessionId   string
    ServerInfo  ServerInfo
}

type ServerInfo struct {
    Version     string
    BlockTypes  []string
    MaxParallel int
}

// SessionConfigureMessage sent by client to configure session
type SessionConfigureMessage struct {
    BaseMessage
    ProjectId   types.ProjectId
    Settings    SessionSettings
}

type SessionSettings struct {
    MaxParallel       int
    DefaultTimeout    time.Duration
    EnableCheckpoints bool
    EnableStreaming   bool
}

// PipelineExecuteMessage sent by client to start execution
type PipelineExecuteMessage struct {
    BaseMessage
    PipelineId  types.PipelineId
    Input       json.RawMessage  `json:",omitempty"`
    Options     ExecutionOptions `json:",omitempty"`
}

type ExecutionOptions struct {
    StartFromBlock string        `json:",omitempty"`
    StopAtBlock    string        `json:",omitempty"`
    Timeout        time.Duration `json:",omitempty"`
    DryRun         bool          `json:",omitempty"`
}

// ExecutionStartedMessage sent when execution begins
type ExecutionStartedMessage struct {
    BaseMessage
    ExecutionId  types.ExecutionId
    PipelineId   types.PipelineId
    TotalBlocks  int
}

// BlockStartedMessage sent when a block begins execution
type BlockStartedMessage struct {
    BaseMessage
    ExecutionId types.ExecutionId
    BlockId     string
    BlockType   string
    BlockName   string
    Index       int
    TotalBlocks int
}

// BlockProgressMessage sent during block execution (streaming)
type BlockProgressMessage struct {
    BaseMessage
// BlockProgressMetadata holds typed metadata for block progress.
type BlockProgressMetadata struct {
    TokensUsed int    `json:",omitempty"`
    Model      string `json:",omitempty"`
}

    ExecutionId types.ExecutionId
    BlockId     string
    Progress    float64
    Delta       string                `json:",omitempty"`
    Metadata    BlockProgressMetadata `json:",omitempty"`
}

// BlockOutputData holds typed output from block execution.
type BlockOutputData struct {
    Response     string          `json:",omitempty"`
    Prompt       string          `json:",omitempty"`
    FullResponse string          `json:",omitempty"`
    Code         string          `json:",omitempty"`
    Language     string          `json:",omitempty"`
    Query        string          `json:",omitempty"`
    TotalCount   int             `json:",omitempty"`
    Results      json.RawMessage `json:",omitempty"`
    RagContext   json.RawMessage `json:",omitempty"`
}

// BlockCompletedMessage sent when block finishes
type BlockCompletedMessage struct {
    BaseMessage
    ExecutionId types.ExecutionId
    BlockId     string
    Output      BlockOutputData
    DurationMs  int64
}

// BlockFailedMessage sent when block fails
type BlockFailedMessage struct {
    BaseMessage
    ExecutionId types.ExecutionId
    BlockId     string
    Error       ErrorInfo
    Retryable   bool
    RetryCount  int
}

type ErrorInfo struct {
    Code       int
    Message    string
    Details    string   `json:",omitempty"`
    StackTrace []string `json:",omitempty"`
}

// EscalationRequiredMessage sent when human input needed
type EscalationRequiredMessage struct {
    BaseMessage
    ExecutionId types.ExecutionId
    BlockId     string
    Reason      string
    Options     []EscalationOption
    Timeout     time.Duration
}

type EscalationOption struct {
    Id          string
    Label       string
    Description string `json:",omitempty"`
}

// InputProvideMessage sent by client to provide escalation input
type InputProvideMessage struct {
    BaseMessage
    ExecutionId types.ExecutionId
    BlockId     string
    OptionId    string          `json:",omitempty"`
    Input       json.RawMessage `json:",omitempty"`
}

// ExecutionCompletedMessage sent when execution finishes
type ExecutionCompletedMessage struct {
    BaseMessage
    ExecutionId types.ExecutionId
    Status      string
    Output      BlockOutputData
    Stats       ExecutionStats
}

type ExecutionStats struct {
    TotalBlocks     int
    CompletedBlocks int
    FailedBlocks    int
    SkippedBlocks   int
    TotalDurationMs int64
    RetryCount      int
}
```

### 4.3 WebSocket Server Implementation

```go
// internal/websocket/server.go
package websocket

import (
    stdctx "context"
    "encoding/json"
    "net/http"
    "runtime"
    "sync"
    "time"
    
    "github.com/gorilla/websocket"
    
    "nexus-flow/internal/engine"
    "pkg/errors"
    "pkg/logging"
)

var upgrader = websocket.Upgrader{
    ReadBufferSize:  1024,
    WriteBufferSize: 1024,
    CheckOrigin: func(r *http.Request) bool {
        return true // Configure appropriately for production
    },
}

// Server manages WebSocket connections
type Server struct {
    engine   *engine.Engine
    sessions map[string]*Session
    mu       sync.RWMutex
    logger   *logging.Logger
}

// NewServer creates a new WebSocket server
func NewServer(eng *engine.Engine, logger *logging.Logger) *Server {
    _, file, line, _ := runtime.Caller(0)
    logger.Info("Initializing WebSocket server",
        "file", file,
        "line", line,
    )
    
    return &Server{
        engine:   eng,
        sessions: make(map[string]*Session),
        logger:   logger,
    }
}

// HandleConnection handles new WebSocket connections
func (s *Server) HandleConnection(w http.ResponseWriter, r *http.Request) {
    _, file, line, _ := runtime.Caller(0)
    
    conn, err := upgrader.Upgrade(w, r, nil)
    if err != nil {
        s.logger.Error("WebSocket upgrade failed",
            "file", file,
            "line", line,
            "error", err,
        )
        return
    }
    
    session := NewSession(conn, s.engine, s.logger)
    
    s.mu.Lock()
    s.sessions[session.Id] = session
    s.mu.Unlock()
    
    s.logger.Info("WebSocket session created",
        "file", file,
        "line", line,
        "sessionId", session.Id,
        "remoteAddr", r.RemoteAddr,
    )
    
    // Send session.created
    session.Send(SessionCreatedMessage{
        BaseMessage: BaseMessage{
            Type:      MsgSessionCreated,
        EventId:   generateEventId(),
            Timestamp: time.Now(),
        },
        SessionId: session.Id,
        ServerInfo: ServerInfo{
            Version:     "1.0.0",
            BlockTypes:  []string{"prompt", "search", "codegen", "validation", "transform", "http", "fileop"},
            MaxParallel: 10,
        },
    })
    
    // Start handling messages
    go session.ReadPump()
    go session.WritePump()
    
    // Cleanup on disconnect
    go func() {
        <-session.Done()
        s.mu.Lock()
        delete(s.sessions, session.Id)
        s.mu.Unlock()
        
        s.logger.Info("WebSocket session closed",
            "file", file,
            "line", line,
            "sessionId", session.Id,
        )
    }()
}

// Session represents a WebSocket session
type Session struct {
    ID       string
    conn     *websocket.Conn
    engine   *engine.Engine
    send     chan BaseMessage
    done     chan struct{}
    settings SessionSettings
    mu       sync.RWMutex
    logger   *logging.Logger
}

// NewSession creates a new session
func NewSession(conn *websocket.Conn, eng *engine.Engine, logger *logging.Logger) *Session {
    return &Session{
        Id:     generateSessionId(),
        conn:   conn,
        engine: eng,
        send:   make(chan BaseMessage, 256),
        done:   make(chan struct{}),
        logger: logger,
    }
}

// ReadPump reads messages from the connection
func (s *Session) ReadPump() {
    _, file, line, _ := runtime.Caller(0)
    defer close(s.done)
    
    s.conn.SetReadDeadline(time.Now().Add(60 * time.Second))
    s.conn.SetPongHandler(func(string) error {
        s.conn.SetReadDeadline(time.Now().Add(60 * time.Second))
        return nil
    })
    
    for {
        _, message, err := s.conn.ReadMessage()
        if err != nil {
            if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
                s.logger.Error("WebSocket read error",
                    "file", file,
                    "line", line,
                    "sessionId", s.Id,
                    "error", err,
                )
            }
            return
        }
        
        s.handleMessage(message)
    }
}

// WritePump writes messages to the connection
func (s *Session) WritePump() {
    _, file, line, _ := runtime.Caller(0)
    ticker := time.NewTicker(30 * time.Second)
    defer ticker.Stop()
    
    for {
        select {
        case message, ok := <-s.send:
            if !ok {
                s.conn.WriteMessage(websocket.CloseMessage, []byte{})
                return
            }
            
            data, err := json.Marshal(message)
            if err != nil {
                s.logger.Error("Message marshal failed",
                    "file", file,
                    "line", line,
                    "error", err,
                )
                continue
            }
            
            if err := s.conn.WriteMessage(websocket.TextMessage, data); err != nil {
                s.logger.Error("WebSocket write error",
                    "file", file,
                    "line", line,
                    "error", err,
                )
                return
            }
            
        case <-ticker.C:
            if err := s.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
                return
            }
            
        case <-s.done:
            return
        }
    }
}

// Send sends a message to the client
func (s *Session) Send(msg BaseMessage) {
    select {
    case s.send <- msg:
    default:
        _, file, line, _ := runtime.Caller(0)
        s.logger.Warn("Send channel full, dropping message",
            "file", file,
            "line", line,
            "sessionId", s.Id,
        )
    }
}

// Done returns the done channel
func (s *Session) Done() <-chan struct{} {
    return s.done
}

// handleMessage processes incoming messages
func (s *Session) handleMessage(data []byte) {
    _, file, line, _ := runtime.Caller(0)
    
    var base BaseMessage
    if err := json.Unmarshal(data, &base); err != nil {
        s.logger.Error("Message unmarshal failed",
            "file", file,
            "line", line,
            "error", err,
        )
        return
    }
    
    s.logger.Debug("Received message",
        "file", file,
        "line", line,
            "sessionId", s.Id,
        "type", base.Type,
    )
    
    switch base.Type {
    case MsgSessionConfigure:
        s.handleConfigure(data)
    case MsgPipelineExecute:
        s.handleExecute(data)
    case MsgPipelineCancel:
        s.handleCancel(data)
    case MsgInputProvide:
        s.handleInput(data)
    case MsgPing:
        s.Send(BaseMessage{Type: MsgPong, Timestamp: time.Now()})
    default:
        s.logger.Warn("Unknown message type",
            "file", file,
            "line", line,
            "type", base.Type,
        )
    }
}

func (s *Session) handleExecute(data []byte) {
    _, file, line, _ := runtime.Caller(0)
    
    var msg PipelineExecuteMessage
    if err := json.Unmarshal(data, &msg); err != nil {
        s.sendError(errors.CodeValidationError, "Invalid execute message", err)
        return
    }
    
    s.logger.Info("Executing pipeline",
        "file", file,
        "line", line,
        "sessionId", s.Id,
        "pipelineId", msg.PipelineId,
    )
    
    // Create execution context with session for callbacks
    context := stdctx.Background()
    
    // Execute with streaming callbacks
    go func() {
        result, err := s.engine.ExecuteWithCallbacks(context, msg.PipelineId, msg.Input, ExecutionCallbacks{
            OnBlockStart: func(block BlockInfo) {
                s.Send(BlockStartedMessage{
                    BaseMessage: BaseMessage{
                        Type:      MsgBlockStarted,
                        EventId:   generateEventId(),
                        Timestamp: time.Now(),
                    },
                    BlockId:   block.Id,
                    BlockType: block.Type,
                    BlockName: block.Name,
                })
            },
            OnBlockProgress: func(block BlockInfo, progress float64, delta string) {
                s.Send(BlockProgressMessage{
                    BaseMessage: BaseMessage{
                        Type:      MsgBlockProgress,
                        EventId:   generateEventId(),
                        Timestamp: time.Now(),
                    },
                    BlockId:  block.Id,
                    Progress: progress,
                    Delta:    delta,
                })
            },
            OnBlockComplete: func(block BlockInfo, output BlockOutputData, duration time.Duration) {
                s.Send(BlockCompletedMessage{
                    BaseMessage: BaseMessage{
                        Type:      MsgBlockCompleted,
                        EventId:   generateEventId(),
                        Timestamp: time.Now(),
                    },
                    BlockId:    block.Id,
                    Output:     output,
                    DurationMs: duration.Milliseconds(),
                })
            },
            OnEscalation: func(block BlockInfo, reason string, options []EscalationOption) {
                s.Send(EscalationRequiredMessage{
                    BaseMessage: BaseMessage{
                        Type:      MsgEscalationRequired,
                        EventId:   generateEventId(),
                        Timestamp: time.Now(),
                    },
                    BlockId: block.Id,
                    Reason:  reason,
                    Options: options,
                    Timeout: 5 * time.Minute,
                })
            },
        })
        
        if err != nil {
            s.Send(ExecutionFailedMessage{
                BaseMessage: BaseMessage{
                    Type:      MsgExecutionFailed,
                    EventId:   generateEventId(),
                    Timestamp: time.Now(),
                },
                Error: ErrorInfo{
                    Code:    errors.GetCode(err),
                    Message: err.Error(),
                },
            })
            return
        }
        
        s.Send(ExecutionCompletedMessage{
            BaseMessage: BaseMessage{
                Type:      MsgExecutionCompleted,
                EventId:   generateEventId(),
                Timestamp: time.Now(),
            },
            ExecutionId: result.ExecutionId,
            Status:      "completed",
            Output:      result.Output,
            Stats:       result.Stats,
        })
    }()
}
```

---

## 5. Block Execution Architecture

### 5.1 Block Interface

```go
// internal/block/interface.go
package block

import (
    stdctx "context"
    
    "nexus-flow/internal/model"
)

// BlockType defines the 7 supported block types
type BlockType string

const (
    BlockTypePrompt     BlockType = "prompt"
    BlockTypeSearch     BlockType = "search"
    BlockTypeCodeGen    BlockType = "codegen"
    BlockTypeValidation BlockType = "validation"
    BlockTypeTransform  BlockType = "transform"
    BlockTypeHttp       BlockType = "http"
    BlockTypeFileOp     BlockType = "fileop"
)

// Block is the interface all block types implement
type Block interface {
    // Type returns the block type
    Type() BlockType
    
    // Validate validates block configuration
    Validate() *apperror.AppError
    
    // Execute runs the block
    Execute(context stdctx.Context, input BlockInput) apperror.Result[BlockOutput]
    
    // SupportsStreaming returns true if block supports streaming output
    SupportsStreaming() bool
    
    // ExecuteStreaming runs the block with streaming callbacks
    ExecuteStreaming(context stdctx.Context, input BlockInput, callback StreamCallback) apperror.Result[BlockOutput]
}

// BlockInput contains input data for block execution
type BlockInput struct {
    Data       BlockOutputData   // Input data from previous blocks
    Context    ExecutionContext  // Execution context
    Config     BlockConfig       // Block-specific configuration
}

// BlockOutput contains block execution results
type BlockOutput struct {
    Data       BlockOutputData // Output data
    Metadata   OutputMetadata  // Execution metadata
}

// OutputMetadata contains execution metadata
type OutputMetadata struct {
    DurationMs   int64
    TokensUsed   int
    CacheHit     bool
    RetryCount   int
}

// ExecutionContext provides execution context
type ExecutionContext struct {
    ExecutionId types.ExecutionId
    ProjectId   types.ProjectId
    Variables   map[string]string
    Secrets     map[string]string
}

// BlockConfig contains block configuration
type BlockConfig struct {
    Id          string
    Name        string
    Type        BlockType
    Settings    json.RawMessage
    Inputs      []ConnectionRef
    Outputs     []ConnectionRef
    Conditions  []Condition    `json:",omitempty"`
    RetryPolicy *RetryPolicy   `json:",omitempty"`
}

// ConnectionRef references a connection between blocks
type ConnectionRef struct {
    BlockId  string
    PortName string
}

// Condition for conditional branching
type Condition struct {
    Expression string // CEL expression
    TargetPort string
}

// RetryPolicy defines retry behavior
type RetryPolicy struct {
    MaxRetries     int
    InitialDelay   time.Duration
    MaxDelay       time.Duration
    BackoffFactor  float64
    RetryableError []int // Error codes
}

// StreamCallback for streaming execution
type StreamCallback func(delta StreamDelta)

// StreamDelta represents a streaming output chunk
type StreamDelta struct {
    Type    string // "text", "code", "progress"
    Content string
    Done    bool
}
```

### 5.2 Block Registry

```go
// internal/block/registry.go
package block

import (
    "fmt"
    "runtime"
    "sync"
    
    "pkg/errors"
    "pkg/logging"
)

// Registry manages block type registrations
type Registry struct {
    blocks map[BlockType]BlockFactory
    mu     sync.RWMutex
    logger *logging.Logger
}

// BlockFactory creates new block instances
type BlockFactory func(config BlockConfig) apperror.Result[Block]

// NewRegistry creates a new block registry
func NewRegistry(logger *logging.Logger) *Registry {
    _, file, line, _ := runtime.Caller(0)
    logger.Info("Initializing block registry",
        "file", file,
        "line", line,
    )
    
    r := &Registry{
        blocks: make(map[BlockType]BlockFactory),
        logger: logger,
    }
    
    // Register default block types
    r.Register(BlockTypePrompt, NewPromptBlock)
    r.Register(BlockTypeSearch, NewSearchBlock)
    r.Register(BlockTypeCodeGen, NewCodeGenBlock)
    r.Register(BlockTypeValidation, NewValidationBlock)
    r.Register(BlockTypeTransform, NewTransformBlock)
    r.Register(BlockTypeHttp, NewHttpBlock)
    r.Register(BlockTypeFileOp, NewFileOpBlock)
    
    return r
}

// Register registers a block factory
func (r *Registry) Register(blockType BlockType, factory BlockFactory) {
    _, file, line, _ := runtime.Caller(0)
    
    r.mu.Lock()
    defer r.mu.Unlock()
    
    r.blocks[blockType] = factory
    
    r.logger.Debug("Registered block type",
        "file", file,
        "line", line,
        "type", blockType,
    )
}

// Create creates a new block instance
func (r *Registry) Create(config BlockConfig) apperror.Result[Block] {
    _, file, line, _ := runtime.Caller(0)
    
    r.mu.RLock()
    factory, exists := r.blocks[config.Type]
    r.mu.RUnlock()
    
    if !exists {
        return nil, errors.New(errors.CodeValidationError,
            fmt.Sprintf("Unknown block type: %s", config.Type),
            "file", file,
            "line", line,
        )
    }
    
    block, err := factory(config)
    if err != nil {
        return nil, errors.Wrap(err, errors.CodeInternalError,
            "Failed to create block",
            "file", file,
            "line", line,
            "type", config.Type,
        )
    }
    
    return block, nil
}

// ListTypes returns all registered block types
func (r *Registry) ListTypes() []BlockType {
    r.mu.RLock()
    defer r.mu.RUnlock()
    
    types := make([]BlockType, 0, len(r.blocks))
    for t := range r.blocks {
        types = append(types, t)
    }
    return types
}
```

### 5.3 Block Implementations

#### 5.3.1 Prompt Block

```go
// internal/block/prompt.go
package block

import (
    stdctx "context"
    "fmt"
    "runtime"
    "text/template"
    "bytes"
    
    "nexus-flow/internal/client"
    "pkg/errors"
    "pkg/logging"
)

// PromptBlock executes AI prompts via AI-Bridge
type PromptBlock struct {
    config       BlockConfig
    aiBridge     *client.AIBridgeClient
    logger       *logging.Logger
    template     *template.Template
}

// PromptSettings defines prompt-specific settings
type PromptSettings struct {
    Model          string
    PromptTemplate string
    SystemPrompt   string            `json:",omitempty"`
    Temperature    float64
    MaxTokens      int
    Variables      map[string]string `json:",omitempty"`
}

// NewPromptBlock creates a new prompt block
func NewPromptBlock(config BlockConfig) apperror.Result[Block] {
    _, file, line, _ := runtime.Caller(0)
    
    settings, err := parsePromptSettings(config.Settings)
    if err != nil {
        return nil, errors.Wrap(err, errors.CodeValidationError,
            "Invalid prompt settings",
            "file", file,
            "line", line,
        )
    }
    
    tmpl, err := template.New("prompt").Parse(settings.PromptTemplate)
    if err != nil {
        return nil, errors.Wrap(err, errors.CodeValidationError,
            "Invalid prompt template",
            "file", file,
            "line", line,
        )
    }
    
    return &PromptBlock{
        config:   config,
        template: tmpl,
        logger:   logging.Default(),
    }, nil
}

func (b *PromptBlock) Type() BlockType {
    return BlockTypePrompt
}

func (b *PromptBlock) Validate() error {
    settings, err := parsePromptSettings(b.config.Settings)
    if err != nil {
        return err
    }
    
    if settings.PromptTemplate == "" {
        _, file, line, _ := runtime.Caller(0)
        return errors.New(errors.CodeValidationError,
            "Prompt template is required",
            "file", file,
            "line", line,
        )
    }
    
    return nil
}

func (b *PromptBlock) SupportsStreaming() bool {
    return true
}

func (b *PromptBlock) Execute(context stdctx.Context, input BlockInput) apperror.Result[BlockOutput] {
    _, file, line, _ := runtime.Caller(0)
    
    settings, _ := parsePromptSettings(b.config.Settings)
    
    // Render prompt template
    var buf bytes.Buffer
    data := mergeData(input.Data, settings.Variables)
    if err := b.template.Execute(&buf, data); err != nil {
        return nil, errors.Wrap(err, errors.CodeInternalError,
            "Failed to render prompt template",
            "file", file,
            "line", line,
        )
    }
    
    prompt := buf.String()
    
    b.logger.Debug("Executing prompt",
        "file", file,
        "line", line,
        "blockId", b.config.Id,
        "model", settings.Model,
        "promptLength", len(prompt),
    )
    
    // Call AI-Bridge
    resp, err := b.aiBridge.Complete(context, client.CompletionRequest{
        Model:        settings.Model,
        Prompt:       prompt,
        SystemPrompt: settings.SystemPrompt,
        Temperature:  settings.Temperature,
        MaxTokens:    settings.MaxTokens,
    })
    if err != nil {
        return nil, errors.Wrap(err, errors.CodeExternalServiceError,
            "AI completion failed",
            "file", file,
            "line", line,
            "model", settings.Model,
        )
    }
    
    return &BlockOutput{
        Data: BlockOutputData{
            Response: resp.Content,
            Prompt:   prompt,
        },
        Metadata: OutputMetadata{
            TokensUsed: resp.TokensUsed,
        },
    }, nil
}

func (b *PromptBlock) ExecuteStreaming(context stdctx.Context, input BlockInput, callback StreamCallback) apperror.Result[BlockOutput] {
    _, file, line, _ := runtime.Caller(0)
    
    settings, _ := parsePromptSettings(b.config.Settings)
    
    // Render prompt template
    var buf bytes.Buffer
    data := mergeData(input.Data, settings.Variables)
    if err := b.template.Execute(&buf, data); err != nil {
        return nil, errors.Wrap(err, errors.CodeInternalError,
            "Failed to render prompt template",
            "file", file,
            "line", line,
        )
    }
    
    prompt := buf.String()
    
    var fullResponse bytes.Buffer
    tokensUsed := 0
    
    err := b.aiBridge.CompleteStreaming(context, client.CompletionRequest{
        Model:        settings.Model,
        Prompt:       prompt,
        SystemPrompt: settings.SystemPrompt,
        Temperature:  settings.Temperature,
        MaxTokens:    settings.MaxTokens,
    }, func(delta client.StreamDelta) {
        fullResponse.WriteString(delta.Content)
        tokensUsed = delta.TotalTokens
        
        callback(StreamDelta{
            Type:    "text",
            Content: delta.Content,
            Done:    delta.Done,
        })
    })
    
    if err != nil {
        return nil, errors.Wrap(err, errors.CodeExternalServiceError,
            "Streaming completion failed",
            "file", file,
            "line", line,
        )
    }
    
    return &BlockOutput{
        Data: BlockOutputData{
            Response: fullResponse.String(),
            Prompt:   prompt,
        },
        Metadata: OutputMetadata{
            TokensUsed: tokensUsed,
        },
    }, nil
}
```

#### 5.3.2 Search Block

```go
// internal/block/search.go
package block

import (
    stdctx "context"
    "runtime"
    
    "nexus-flow/internal/client"
    "pkg/errors"
    "pkg/logging"
)

// SearchBlock performs RAG-powered search via Scout
type SearchBlock struct {
    config   BlockConfig
    scout    *client.ScoutClient
    logger   *logging.Logger
}

// SearchSettings defines search-specific settings
type SearchSettings struct {
    Query      string   // fts, vss, hybrid
    SearchType string
    TopK       int
    MinScore   float64
    FileTypes  []string `json:",omitempty"`
    IncludeRag bool
}

func NewSearchBlock(config BlockConfig) apperror.Result[Block] {
    return &SearchBlock{
        config: config,
        logger: logging.Default(),
    }, nil
}

func (b *SearchBlock) Type() BlockType {
    return BlockTypeSearch
}

func (b *SearchBlock) Validate() error {
    settings, err := parseSearchSettings(b.config.Settings)
    if err != nil {
        return err
    }
    
    if settings.Query == "" {
        _, file, line, _ := runtime.Caller(0)
        return errors.New(errors.CodeValidationError,
            "Search query is required",
            "file", file,
            "line", line,
        )
    }
    
    return nil
}

func (b *SearchBlock) SupportsStreaming() bool {
    return false
}

func (b *SearchBlock) Execute(context stdctx.Context, input BlockInput) apperror.Result[BlockOutput] {
    _, file, line, _ := runtime.Caller(0)
    
    settings, _ := parseSearchSettings(b.config.Settings)
    
    // Interpolate query with input data
    query := interpolateString(settings.Query, input.Data)
    
    b.logger.Debug("Executing search",
        "file", file,
        "line", line,
        "blockId", b.config.Id,
        "query", query,
        "searchType", settings.SearchType,
    )
    
    resp, err := b.scout.Search(context, client.SearchRequest{
        Query:      query,
        ProjectId:  input.Context.ProjectId,
        SearchType: settings.SearchType,
        TopK:       settings.TopK,
        MinScore:   settings.MinScore,
        FileTypes:  settings.FileTypes,
    })
    if err != nil {
        return nil, errors.Wrap(err, errors.CodeExternalServiceError,
            "Search failed",
            "file", file,
            "line", line,
        )
    }
    
    // SearchBlockOutput holds the typed output from a search block.
    type SearchBlockOutput struct {
        Results    json.RawMessage
        TotalCount int
        Query      string
    }
    output := SearchBlockOutput{
        Results:    mustMarshal(resp.Results),
        TotalCount: resp.TotalCount,
        Query:      query,
    }
    
    // Include RAG context if requested
    if settings.IncludeRAG {
        ragResp, err := b.scout.GetRAGContext(context, client.RAGRequest{
            Query:     query,
            ProjectId: input.Context.ProjectId,
            TopK:      settings.TopK,
        })
        if err == nil {
            output["ragContext"] = ragResp.FormattedPrompt
            output["sources"] = ragResp.Sources
        }
    }
    
    return &BlockOutput{
        Data:     output,
        Metadata: OutputMetadata{},
    }, nil
}

func (b *SearchBlock) ExecuteStreaming(context stdctx.Context, input BlockInput, callback StreamCallback) apperror.Result[BlockOutput] {
    return b.Execute(context, input)
}
```

#### 5.3.3 CodeGen Block

```go
// internal/block/codegen.go
package block

import (
    stdctx "context"
    "runtime"
    
    "nexus-flow/internal/client"
    "pkg/errors"
    "pkg/logging"
)

// CodeGenBlock generates code via AI-Bridge with specialized models
type CodeGenBlock struct {
    config   BlockConfig
    aiBridge *client.AIBridgeClient
    logger   *logging.Logger
}

// CodeGenSettings defines codegen-specific settings
type CodeGenSettings struct {
    Model       string // codellama, deepseek-coder, etc.
    Language    string // go, typescript, python, etc.
    Task        string // generate, refactor, fix, explain
    Context     string // Surrounding code context
    Instruction string // What to generate
    MaxTokens   int
}

func NewCodeGenBlock(config BlockConfig) apperror.Result[Block] {
    return &CodeGenBlock{
        config: config,
        logger: logging.Default(),
    }, nil
}

func (b *CodeGenBlock) Type() BlockType {
    return BlockTypeCodeGen
}

func (b *CodeGenBlock) Validate() error {
    settings, err := parseCodeGenSettings(b.config.Settings)
    if err != nil {
        return err
    }
    
    if settings.Instruction == "" {
        _, file, line, _ := runtime.Caller(0)
        return errors.New(errors.CodeValidationError,
            "Instruction is required",
            "file", file,
            "line", line,
        )
    }
    
    return nil
}

func (b *CodeGenBlock) SupportsStreaming() bool {
    return true
}

func (b *CodeGenBlock) Execute(context stdctx.Context, input BlockInput) apperror.Result[BlockOutput] {
    _, file, line, _ := runtime.Caller(0)
    
    settings, _ := parseCodeGenSettings(b.config.Settings)
    
    // Build code generation prompt
    prompt := buildCodeGenPrompt(settings, input.Data)
    
    b.logger.Debug("Executing codegen",
        "file", file,
        "line", line,
        "blockId", b.config.Id,
        "language", settings.Language,
        "task", settings.Task,
    )
    
    resp, err := b.aiBridge.Complete(context, client.CompletionRequest{
        Model:       settings.Model,
        Prompt:      prompt,
        MaxTokens:   settings.MaxTokens,
        Temperature: 0.2, // Lower temperature for code
    })
    if err != nil {
        return nil, errors.Wrap(err, errors.CodeExternalServiceError,
            "Code generation failed",
            "file", file,
            "line", line,
        )
    }
    
    // Extract code from response
    code := extractCodeBlock(resp.Content, settings.Language)
    
    return &BlockOutput{
        Data: BlockOutputData{
            Code:         code,
            FullResponse: resp.Content,
            Language:     settings.Language,
        },
        Metadata: OutputMetadata{
            TokensUsed: resp.TokensUsed,
        },
    }, nil
}

func (b *CodeGenBlock) ExecuteStreaming(context stdctx.Context, input BlockInput, callback StreamCallback) apperror.Result[BlockOutput] {
    // Similar to Prompt block streaming
    return b.Execute(context, input)
}
```

#### 5.3.4 Additional Block Types (Transform, HTTP, FileOp, Validation)

```go
// internal/block/transform.go
package block

// TransformBlock applies data transformations using expressions
type TransformBlock struct {
    config BlockConfig
    logger *logging.Logger
}

// TransformSettings defines transform operations
type TransformSettings struct {
    Operations []TransformOp
}

type TransformOp struct {
    Type       string // map, filter, reduce, extract, merge
    Expression string // CEL expression
    TargetKey  string
}

// internal/block/http.go
package block

// HTTPBlock makes external HTTP requests
type HTTPBlock struct {
    config     BlockConfig
    httpClient *http.Client
    logger     *logging.Logger
}

// HTTPSettings defines HTTP request configuration
type HTTPSettings struct {
    Method   string
    Url      string
    Headers  map[string]string `json:",omitempty"`
    Body     string            `json:",omitempty"`
    BodyType string            // json, form, raw
    Timeout  time.Duration
    RetryOn  []int             // Status codes to retry
}

// internal/block/fileop.go
package block

// FileOpBlock performs file system operations
type FileOpBlock struct {
    config    BlockConfig
    validator *PathValidator
    logger    *logging.Logger
}

// FileOpSettings defines file operation configuration
type FileOpSettings struct {
    Operation string // read, write, append, delete, copy, move, list
    Path      string
    Content   string `json:",omitempty"`
    Encoding  string // utf8, base64
    CreateDir bool
}

// internal/block/validation.go
package block

// ValidationBlock validates block outputs
type ValidationBlock struct {
    config BlockConfig
    logger *logging.Logger
}

// ValidationSettings defines validation rules
type ValidationSettings struct {
    Rules    []ValidationRule
    FailFast bool
}

type ValidationRule struct {
    Name       string
    Expression string // CEL expression
    Message    string
    Severity   string // error, warning, info
}
```

---

## 6. Control Flow

### 6.1 Conditional Branching

```go
// internal/control/branch.go
package control

import (
    stdctx "context"
    "runtime"
    
    "github.com/google/cel-go/cel"
    
    "nexus-flow/internal/model"
    "pkg/errors"
    "pkg/logging"
)

// BranchController handles conditional branching
type BranchController struct {
    env    *cel.Env
    logger *logging.Logger
}

// BranchConfig defines branching configuration
type BranchConfig struct {
    Conditions []BranchCondition
    Default    string            `json:",omitempty"` // Default branch ID
}

// BranchCondition defines a single branch condition
type BranchCondition struct {
    Expression string // CEL expression
    TargetId   string // Target block Id
    Priority   int    // Evaluation order
}

// NewBranchController creates a new branch controller
func NewBranchController(logger *logging.Logger) apperror.Result[BranchController] {
    _, file, line, _ := runtime.Caller(0)
    
    env, err := cel.NewEnv(
        cel.Declarations(
            // Add common declarations
        ),
    )
    if err != nil {
        return nil, errors.Wrap(err, errors.CodeInternalError,
            "Failed to create CEL environment",
            "file", file,
            "line", line,
        )
    }
    
    logger.Info("Initializing BranchController",
        "file", file,
        "line", line,
    )
    
    return &BranchController{
        env:    env,
        logger: logger,
    }, nil
}

// Evaluate evaluates conditions and returns the target block Id
func (c *BranchController) Evaluate(context stdctx.Context, config BranchConfig, data BlockOutputData) apperror.Result[string] {
    _, file, line, _ := runtime.Caller(0)
    
    // Sort conditions by priority
    sortedConditions := sortByPriority(config.Conditions)
    
    for _, cond := range sortedConditions {
        ast, issues := c.env.Compile(cond.Expression)
        if issues != nil && issues.Err() != nil {
            c.logger.Warn("Invalid condition expression",
                "file", file,
                "line", line,
                "expression", cond.Expression,
                "error", issues.Err(),
            )
            continue
        }
        
        prg, err := c.env.Program(ast)
        if err != nil {
            continue
        }
        
        result, _, err := prg.Eval(data)
        if err != nil {
            c.logger.Warn("Condition evaluation failed",
                "file", file,
                "line", line,
                "expression", cond.Expression,
                "error", err,
            )
            continue
        }
        
        if result.Value() == true {
            c.logger.Debug("Branch condition matched",
                "file", file,
                "line", line,
                "expression", cond.Expression,
                "targetId", cond.TargetId,
            )
            return cond.TargetId, nil
        }
    }
    
    // Return default if no condition matched
    if config.Default != "" {
        return config.Default, nil
    }
    
    return "", errors.New(errors.CodeValidationError,
        "No branch condition matched and no default specified",
        "file", file,
        "line", line,
    )
}
```

### 6.2 Concurrency-Throttled Loops

```go
// internal/control/loop.go
package control

import (
    stdctx "context"
    "runtime"
    "sync"
    
    "golang.org/x/sync/semaphore"
    
    "nexus-flow/internal/block"
    "pkg/errors"
    "pkg/logging"
)

// LoopController handles loop execution with concurrency control
type LoopController struct {
    registry *block.Registry
    logger   *logging.Logger
}

// LoopConfig defines loop configuration
type LoopConfig struct {
    Type           LoopType // forEach, while, repeat
    MaxConcurrency int      // Max parallel iterations
    MaxIterations  int      // Safety limit
    Collection     string   // For forEach: data path
    Condition      string   // For while: CEL expression
    RepeatCount    int      // For repeat: iteration count
    BlockIds       []string // Blocks to execute per iteration
}

// LoopType defines loop behavior
type LoopType string

const (
    LoopTypeForEach LoopType = "forEach"
    LoopTypeWhile   LoopType = "while"
    LoopTypeRepeat  LoopType = "repeat"
)

// NewLoopController creates a new loop controller
func NewLoopController(registry *block.Registry, logger *logging.Logger) *LoopController {
    _, file, line, _ := runtime.Caller(0)
    logger.Info("Initializing LoopController",
        "file", file,
        "line", line,
    )
    
    return &LoopController{
        registry: registry,
        logger:   logger,
    }
}

// Execute runs a loop with concurrency throttling
func (c *LoopController) Execute(
    context stdctx.Context,
    config LoopConfig,
    input block.BlockInput,
    callback block.StreamCallback,
) apperror.Result[[]BlockOutputData] {
    _, file, line, _ := runtime.Caller(0)
    
    maxConcurrency := config.MaxConcurrency
    if maxConcurrency <= 0 {
        maxConcurrency = 1
    }
    
    c.logger.Info("Executing loop",
        "file", file,
        "line", line,
        "type", config.Type,
        "maxConcurrency", maxConcurrency,
    )
    
    switch config.Type {
    case LoopTypeForEach:
        return c.executeForEach(context, config, input, callback, maxConcurrency)
    case LoopTypeWhile:
        return c.executeWhile(context, config, input, callback)
    case LoopTypeRepeat:
        return c.executeRepeat(context, config, input, callback, maxConcurrency)
    default:
        return nil, errors.New(errors.CodeValidationError,
            "Unknown loop type",
            "file", file,
            "line", line,
            "type", config.Type,
        )
    }
}

// executeForEach runs forEach loop with parallel execution
func (c *LoopController) executeForEach(
    context stdctx.Context,
    config LoopConfig,
    input block.BlockInput,
    callback block.StreamCallback,
    maxConcurrency int,
) apperror.Result[[]BlockOutputData] {
    _, file, line, _ := runtime.Caller(0)
    
    // Get collection from input data — use json.RawMessage for arbitrary collection items
    collection := getCollectionItems(input.Data, config.Collection)
    if collection == nil {
        return nil, errors.New(errors.CodeValidationError,
            "Collection not found or not an array",
            "file", file,
            "line", line,
            "path", config.Collection,
        )
    }
    
    if len(collection) > config.MaxIterations {
        collection = collection[:config.MaxIterations]
        c.logger.Warn("Collection truncated to max iterations",
            "file", file,
            "line", line,
            "maxIterations", config.MaxIterations,
        )
    }
    
    // Use semaphore for concurrency control
    sem := semaphore.NewWeighted(int64(maxConcurrency))
    results := make([]BlockOutputData, len(collection))
    errs := make([]error, len(collection))
    
    // --- Typed Iteration Input (no interface{} or map[string]interface{}) ---
    type IterationItem struct {
        Item   BlockOutputData
        Index  int
        Parent BlockOutputData
    }
    
    var wg sync.WaitGroup
    
    for i, item := range collection {
        wg.Add(1)
        
        go func(idx int, itemData BlockOutputData) {
            defer wg.Done()
            
            if err := sem.Acquire(context, 1); err != nil {
                errs[idx] = err
                return
            }
            defer sem.Release(1)
            
            // Execute blocks for this iteration
            iterInput := input
            iterInput.Data = IterationItem{
                Item:   itemData,
                Index:  idx,
                Parent: input.Data,
            }
            
            result, err := c.executeBlocks(context, config.BlockIds, iterInput, callback)
            if err != nil {
                errs[idx] = err
                return
            }
            
            results[idx] = result
        }(i, item)
    }
    
    wg.Wait()
    
    // Check for errors
    for i, err := range errs {
        if err != nil {
            return results, errors.Wrap(err, errors.CodeInternalError,
                "Loop iteration failed",
                "file", file,
                "line", line,
                "iteration", i,
            )
        }
    }
    
    return results, nil
}

// executeBlocks executes a sequence of blocks
func (c *LoopController) executeBlocks(
    context stdctx.Context,
    blockIds []string,
    input block.BlockInput,
    callback block.StreamCallback,
) apperror.Result[BlockOutputData] {
    data := input.Data
    
    for _, blockId := range blockIds {
        blk, err := c.registry.Create(block.BlockConfig{Id: blockId})
        if err != nil {
            return nil, err
        }
        
        blockInput := block.BlockInput{
            Data:    data,
            Context: input.Context,
        }
        
        output, err := blk.ExecuteStreaming(context, blockInput, callback)
        if err != nil {
            return nil, err
        }
        
        // Merge output into data for next block
        for k, v := range output.Data {
            data[k] = v
        }
    }
    
    return data, nil
}
```

---

## 7. RES Integration

### 7.1 RES Bridge

```go
// internal/res/bridge.go
package res

import (
    stdctx "context"
    "runtime"
    "time"
    
    "nexus-flow/internal/block"
    "nexus-flow/internal/model"
    "pkg/errors"
    "pkg/logging"
)

// Bridge integrates with the Resilient Execution System
type Bridge struct {
    checkpointRepo CheckpointRepository
    consensusRepo  ConsensusRepository
    escalationRepo EscalationRepository
    logger         *logging.Logger
}

// CheckpointRepository handles checkpoint persistence
type CheckpointRepository interface {
    Create(context stdctx.Context, checkpoint model.Checkpoint) *apperror.AppError
    GetLatest(context stdctx.Context, executionId string) apperror.Result[model.Checkpoint]
    List(context stdctx.Context, executionId string) apperror.Result[[]model.Checkpoint]
}

// NewBridge creates a new RES bridge
func NewBridge(
    checkpointRepo CheckpointRepository,
    consensusRepo ConsensusRepository,
    escalationRepo EscalationRepository,
    logger *logging.Logger,
) *Bridge {
    _, file, line, _ := runtime.Caller(0)
    logger.Info("Initializing RES Bridge",
        "file", file,
        "line", line,
    )
    
    return &Bridge{
        checkpointRepo: checkpointRepo,
        consensusRepo:  consensusRepo,
        escalationRepo: escalationRepo,
        logger:         logger,
    }
}

// ExecuteWithResilience wraps block execution with RES protections
func (b *Bridge) ExecuteWithResilience(
    context stdctx.Context,
    blk block.Block,
    input block.BlockInput,
    config ResilienceConfig,
) apperror.Result[block.BlockOutput] {
    _, file, line, _ := runtime.Caller(0)
    
    b.logger.Debug("Executing with resilience",
        "file", file,
        "line", line,
        "blockId", input.Config.Id,
        "blockType", blk.Type(),
    )
    
    var lastErr error
    var output *block.BlockOutput
    
    // Adaptive retry loop
    for attempt := 0; attempt <= config.MaxRetries; attempt++ {
        if attempt > 0 {
            // Apply backoff
            delay := calculateBackoff(attempt, config)
            select {
            case <-context.Done():
                return nil, context.Err()
            case <-time.After(delay):
            }
            
            b.logger.Debug("Retrying block execution",
                "file", file,
                "line", line,
                "attempt", attempt,
                "delay", delay,
            )
        }
        
        // Create checkpoint before execution
        if config.EnableCheckpoints {
            checkpoint := model.Checkpoint{
                ExecutionId: string(input.Context.ExecutionId),
                BlockId:     input.Config.Id,
                State:       input.Data,
                Attempt:     attempt,
                CreatedAt:   time.Now(),
            }
            
            if err := b.checkpointRepo.Create(context, checkpoint); err != nil {
                b.logger.Warn("Failed to create checkpoint",
                    "file", file,
                    "line", line,
                    "error", err,
                )
            }
        }
        
        // Execute block
        output, lastErr = blk.Execute(context, input)
        
        if lastErr == nil {
            return output, nil
        }
        
        // Check if error is retryable
        if !isRetryableError(lastErr, config) {
            b.logger.Warn("Non-retryable error",
                "file", file,
                "line", line,
                "error", lastErr,
            )
            break
        }
        
        // Self-correction: Try alternative approach
        if config.EnableSelfCorrection && attempt > 0 {
            corrected, corrErr := b.attemptSelfCorrection(context, blk, input, lastErr)
            if corrErr == nil {
                return corrected, nil
            }
        }
    }
    
    // Multi-model consensus for critical blocks
    if config.EnableConsensus && config.IsCritical {
        consensusOutput, err := b.executeWithConsensus(context, blk, input)
        if err == nil {
            return consensusOutput, nil
        }
    }
    
    // Escalate to human if configured
    if config.EnableEscalation {
        return b.escalateToHuman(context, input, lastErr)
    }
    
    return nil, errors.Wrap(lastErr, errors.CodeInternalError,
        "Block execution failed after retries",
        "file", file,
        "line", line,
        "attempts", config.MaxRetries+1,
    )
}

// executeWithConsensus uses multi-model voting
func (b *Bridge) executeWithConsensus(
    context stdctx.Context,
    blk block.Block,
    input block.BlockInput,
) apperror.Result[block.BlockOutput] {
    _, file, line, _ := runtime.Caller(0)
    
    b.logger.Info("Executing with multi-model consensus",
        "file", file,
        "line", line,
        "blockId", input.Config.Id,
    )
    
    // Execute with multiple models and vote
    // Implementation depends on AI-Bridge multi-model support
    
    return nil, errors.New(errors.CodeNotImplemented,
        "Consensus execution not implemented",
        "file", file,
        "line", line,
    )
}

// escalateToHuman triggers human escalation
func (b *Bridge) escalateToHuman(
    context stdctx.Context,
    input block.BlockInput,
    originalErr error,
) apperror.Result[block.BlockOutput] {
    _, file, line, _ := runtime.Caller(0)
    
    b.logger.Info("Escalating to human",
        "file", file,
        "line", line,
        "blockId", input.Config.Id,
        "error", originalErr,
    )
    
    escalation := model.EscalationRequest{
        ExecutionId: string(input.Context.ExecutionId),
        BlockId:     input.Config.Id,
        Reason:      originalErr.Error(),
        State:       input.Data,
        CreatedAt:   time.Now(),
    }
    
    if err := b.escalationRepo.Create(context, escalation); err != nil {
        return nil, errors.Wrap(err, errors.CodeInternalError,
            "Failed to create escalation request",
            "file", file,
            "line", line,
        )
    }
    
    // Return waiting status - execution pauses until human responds
    return nil, ErrAwaitingEscalation
}

// ResilienceConfig defines RES behavior
type ResilienceConfig struct {
    MaxRetries           int
    InitialDelay         time.Duration
    MaxDelay             time.Duration
    BackoffFactor        float64
    RetryableErrors      []int
    EnableCheckpoints    bool
    EnableSelfCorrection bool
    EnableConsensus      bool
    EnableEscalation     bool
    IsCritical           bool
}

// DefaultResilienceConfig returns default configuration
func DefaultResilienceConfig() ResilienceConfig {
    return ResilienceConfig{
        MaxRetries:           3,
        InitialDelay:         1 * time.Second,
        MaxDelay:             30 * time.Second,
        BackoffFactor:        2.0,
        EnableCheckpoints:    true,
        EnableSelfCorrection: true,
        EnableEscalation:     true,
    }
}
```

---

## 8. Database Schema

```sql
-- migrations/nexus-flow/001_create_pipelines.sql
CREATE TABLE IF NOT EXISTS Pipelines (
    Id          TEXT PRIMARY KEY,
    ProjectId   TEXT NOT NULL,
    Name        TEXT NOT NULL,
    Description TEXT,
    Definition  TEXT NOT NULL,  -- JSON pipeline definition
    Version     INTEGER NOT NULL DEFAULT 1,
    Status      TEXT NOT NULL DEFAULT 'draft',  -- draft, active, archived
    CreatedAt   TEXT NOT NULL DEFAULT (datetime('now')),
    UpdatedAt   TEXT NOT NULL DEFAULT (datetime('now')),
    
    UNIQUE(ProjectId, Name, Version)
);

CREATE INDEX IdxPipelinesProject ON Pipelines(ProjectId);
CREATE INDEX IdxPipelinesStatus ON Pipelines(Status);

-- migrations/nexus-flow/002_create_executions.sql
CREATE TABLE IF NOT EXISTS Executions (
    Id          TEXT PRIMARY KEY,
    PipelineId  TEXT NOT NULL REFERENCES Pipelines(Id),
    ProjectId   TEXT NOT NULL,
    Status      TEXT NOT NULL DEFAULT 'pending',  -- pending, running, completed, failed, canceled
    Input       TEXT,           -- JSON input data
    Output      TEXT,           -- JSON output data
    Error       TEXT,           -- Error details if failed
    StartedAt   TEXT,
    CompletedAt TEXT,
    CreatedAt   TEXT NOT NULL DEFAULT (datetime('now')),
    
    FOREIGN KEY (PipelineId) REFERENCES Pipelines(Id)
);

CREATE INDEX IdxExecutionsPipeline ON Executions(PipelineId);
CREATE INDEX IdxExecutionsStatus ON Executions(Status);
CREATE INDEX IdxExecutionsProject ON Executions(ProjectId);

-- migrations/nexus-flow/003_create_checkpoints.sql
CREATE TABLE IF NOT EXISTS ExecutionCheckpoints (
    Id          TEXT PRIMARY KEY,
    ExecutionId TEXT NOT NULL REFERENCES Executions(Id),
    BlockId     TEXT NOT NULL,
    State       TEXT NOT NULL,  -- JSON state snapshot
    Attempt     INTEGER NOT NULL DEFAULT 0,
    CreatedAt   TEXT NOT NULL DEFAULT (datetime('now')),
    
    FOREIGN KEY (ExecutionId) REFERENCES Executions(Id) ON DELETE CASCADE
);

CREATE INDEX IdxCheckpointsExecution ON ExecutionCheckpoints(ExecutionId);

-- migrations/nexus-flow/004_create_telemetry.sql
CREATE TABLE IF NOT EXISTS ExecutionTelemetry (
    Id          TEXT PRIMARY KEY,
    ExecutionId TEXT NOT NULL REFERENCES Executions(Id),
    BlockId     TEXT NOT NULL,
    BlockType   TEXT NOT NULL,
    Status      TEXT NOT NULL,
    DurationMs  INTEGER,
    TokensUsed  INTEGER,
    RetryCount  INTEGER DEFAULT 0,
    Error       TEXT,
    Metadata    TEXT,  -- JSON metadata
    CreatedAt   TEXT NOT NULL DEFAULT (datetime('now')),
    
    FOREIGN KEY (ExecutionId) REFERENCES Executions(Id) ON DELETE CASCADE
);

CREATE INDEX IdxTelemetryExecution ON ExecutionTelemetry(ExecutionId);
CREATE INDEX IdxTelemetryBlock ON ExecutionTelemetry(BlockId);

-- migrations/nexus-flow/005_create_escalations.sql
CREATE TABLE IF NOT EXISTS EscalationRequests (
    Id          TEXT PRIMARY KEY,
    ExecutionId TEXT NOT NULL REFERENCES Executions(Id),
    BlockId     TEXT NOT NULL,
    Reason      TEXT NOT NULL,
    State       TEXT NOT NULL,  -- JSON state at escalation
    Response    TEXT,           -- JSON human response
    Status      TEXT NOT NULL DEFAULT 'pending',  -- pending, responded, timeout
    CreatedAt   TEXT NOT NULL DEFAULT (datetime('now')),
    RespondedAt TEXT,
    
    FOREIGN KEY (ExecutionId) REFERENCES Executions(Id) ON DELETE CASCADE
);

CREATE INDEX IdxEscalationsExecution ON EscalationRequests(ExecutionId);
CREATE INDEX IdxEscalationsStatus ON EscalationRequests(Status);
```

---

## 9. Error Codes

Nexus-Flow uses error code range **10xxx**:

| Code | Name | Description |
|------|------|-------------|
| 10001 | `ErrPipelineNotFound` | Pipeline not found |
| 10002 | `ErrPipelineInvalid` | Invalid pipeline definition |
| 10003 | `ErrBlockNotFound` | Block not found in pipeline |
| 10004 | `ErrBlockExecutionFailed` | Block execution failed |
| 10005 | `ErrConditionEvalFailed` | Branch condition evaluation failed |
| 10006 | `ErrLoopLimitExceeded` | Loop iteration limit exceeded |
| 10007 | `ErrCheckpointFailed` | Checkpoint creation failed |
| 10008 | `ErrEscalationTimeout` | Human escalation timed out |
| 10009 | `ErrExecutionCanceled` | Execution was canceled |
| 10010 | `ErrConcurrencyLimit` | Concurrency limit exceeded |

---

## 10. Configuration

```yaml
# config/nexus-flow.yaml
service:
  name: nexus-flow
  port: 8085
  host: "0.0.0.0"

websocket:
  readBufferSize: 1024
  writeBufferSize: 1024
  pingInterval: 30s
  pongTimeout: 60s
  maxMessageSize: 1048576  # 1MB

execution:
  defaultTimeout: 30m
  maxConcurrency: 10
  maxLoopIterations: 1000

resilience:
  maxRetries: 3
  initialDelay: 1s
  maxDelay: 30s
  backoffFactor: 2.0
  enableCheckpoints: true
  enableSelfCorrection: true
  enableEscalation: true

database:
  path: "./data/nexus-flow.db"
  maxOpenConns: 25

services:
  aibridge:
    url: "http://localhost:8082"
    timeout: 30s
  scout:
    url: "http://localhost:8084"
    timeout: 10s
  specmanager:
    url: "http://localhost:8081"
    timeout: 10s

logging:
  level: "info"
  format: "json"
  addSource: true  # MANDATORY: Include function names and line numbers
```

---

## 11. References

- Memory: `features/automation-pipeline` (Nexus-Flow core design)
- Memory: `features/resilient-execution-system` (RES integration)
- Memory: `features/ai-plan-mode` (Plan Mode workflow)
- Phase 5: AI-Bridge Specification (`04-ai-bridge.md`)
- Phase 6: Scout Specification (`05-scout.md`)
