# Nexus-Flow Standalone Architecture

**Version:** 2.0.0  
**Status:** Draft  
**Updated:** 2026-03-09  

---

## Overview

Nexus-Flow is a **standalone orchestration application** that can operate independently or integrate with the Spec Management Software. It features a desktop UI (CEF browser), visual pipeline editor, and portable binary builds with embedded SQLite databases.

**Cross-References:**
- [Nexus-Flow Service](./06-nexus-flow.md) — Core service specification
- [React Flow Canvas](./07-react-flow-canvas.md) — Visual editor components
- [Shared pkg/ Modules](./08-shared-pkg-modules.md) — Common utilities
- [Split Database System](../07-database-design/00-overview.md)

---

## Table of Contents

1. [Architecture Modes](#1-architecture-modes)
2. [Desktop Application](#2-desktop-application)
3. [Database Architecture](#3-database-architecture)
4. [File Storage Conventions](#4-file-storage-conventions)
5. [Visual Pipeline Editor](#5-visual-pipeline-editor)
6. [Stage/Block Features](#6-stageblock-features)
7. [Variable System](#7-variable-system)
8. [Code Execution Runtimes](#8-code-execution-runtimes)
9. [External Integrations](#9-external-integrations)
10. [Compact Build System](#10-compact-build-system)
11. [Import/Export System](#11-importexport-system)
12. [Safety Features](#12-safety-features)
13. [Voice CLI Integration](#13-voice-cli-integration)

---

## 1. Architecture Modes

### 1.1 Deployment Modes

| Mode | Description | Use Case |
|------|-------------|----------|
| **Standalone** | Independent desktop app with own databases | Portable automation tool |
| **Integrated** | Embedded within Spec Management Software | Unified project workflows |
| **Headless** | CLI-only execution without UI | CI/CD pipelines, servers |

### 1.2 Separation of Concerns

```
┌─────────────────────────────────────────────────────────────────┐
│                    Spec Management Software                      │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              Nexus-Flow Viewer (Read-Only)               │    │
│  │   - View flows from Nexus-Flow                          │    │
│  │   - Trigger execution                                    │    │
│  │   - Monitor progress                                     │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                              │
                    REST API / WebSocket
                              │
┌─────────────────────────────────────────────────────────────────┐
│                   Nexus-Flow (Standalone)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │ Desktop App  │  │   Backend    │  │   Execution Engine   │  │
│  │ (CEF/Wails)  │  │  (Go HTTP)   │  │   (Go + Runtimes)    │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
│                              │                                   │
│                    ┌─────────┴─────────┐                        │
│                    │   SQLite DBs      │                        │
│                    │   File Storage    │                        │
│                    └───────────────────┘                        │
└─────────────────────────────────────────────────────────────────┘
```

### 1.3 Codebase Separation

| Component | Repository | Language | Notes |
|-----------|------------|----------|-------|
| Nexus-Flow Backend | `nexus-flow/` | Go | Standalone service |
| Nexus-Flow Frontend | `nexus-flow/ui/` | TypeScript/React | CEF-embedded UI |
| Spec Management Integration | `spec-mgmt/integrations/nexus-flow/` | Go/TS | Viewer only |
| Voice CLI | `voice-cli/` | Go | Separate microservice |

---

## 2. Desktop Application

### 2.1 Technology Stack

| Component | Technology | Rationale |
|-----------|------------|-----------|
| Desktop Framework | **Wails v2** | Go backend + Web frontend, lightweight |
| Browser Engine | WebView2 (Windows) / WebKit (macOS/Linux) | Native performance |
| Frontend | React + TypeScript + Vite | Consistent with ecosystem |
| IPC | Wails bindings | Type-safe Go↔JS calls |

> **Alternative:** CEF (Chromium Embedded Framework) via go-cef for full Chrome compatibility

### 2.2 Application Structure

```
nexus-flow/
├── main.go                    # Wails application entry
├── app.go                     # Application lifecycle
├── internal/
│   ├── api/                   # HTTP API handlers
│   ├── engine/                # Execution engine
│   ├── db/                    # Database layer
│   └── integrations/          # External tool adapters
├── ui/                        # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── Canvas/        # React Flow pipeline editor
│   │   │   ├── StageEditor/   # Block configuration
│   │   │   ├── VariablePanel/ # Variable management
│   │   │   └── Toolbar/       # Actions and tools
│   │   ├── stores/            # Zustand state
│   │   └── hooks/             # Custom hooks
│   └── wailsjs/               # Generated bindings
├── pkg/                       # Shared packages (symlink to common)
└── build/                     # Build artifacts
```

### 2.3 Window Configuration

```go
// main.go
func main() {
    app := NewApp()
    
    err := wails.Run(&options.App{
        Title:            "Nexus-Flow",
        Width:            1400,
        Height:           900,
        MinWidth:         1024,
        MinHeight:        768,
        AssetServer:      &assetserver.Options{Assets: assets},
        BackgroundColour: &options.RGBA{R: 27, G: 38, B: 54, A: 1},
        OnStartup:        app.startup,
        OnShutdown:       app.shutdown,
        // EXEMPTED: Wails framework requires []interface{} for Bind — external API contract (I-1)
        Bind: []interface{}{
            app,
            app.FlowService,
            app.StageService,
            app.ExecutionService,
            app.FileService,
        },
    })
}
```

---

## 3. Database Architecture

### 3.1 Database Hierarchy

```
nexus-flow-data/
├── root.db                    # Global settings, project index
├── projects/
│   ├── {project-id}/
│   │   ├── project.db         # Project metadata, flow index
│   │   ├── flows/
│   │   │   ├── {flow-id}.db   # Individual flow definition
│   │   │   └── ...
│   │   └── executions/
│   │       ├── {exec-id}.db   # Execution history, state
│   │       └── ...
│   └── ...
└── voice/
    └── {conversation-id}.db   # Voice transcription data
```

### 3.2 Root Database Schema

```
Table: Settings
├── Id: TEXT PRIMARY KEY
├── Key: TEXT UNIQUE NOT NULL
├── Value: TEXT
├── Category: TEXT
├── CreatedAt: TEXT
└── UpdatedAt: TEXT

Table: ProjectIndex
├── Id: TEXT PRIMARY KEY
├── Name: TEXT NOT NULL
├── RootPath: TEXT NOT NULL        # Absolute path to project
├── DatabasePath: TEXT NOT NULL    # Path to project.db
├── LastAccessed: TEXT
├── CreatedAt: TEXT
└── UpdatedAt: TEXT

Table: VoiceCommandIndex
├── Id: TEXT PRIMARY KEY
├── ProjectId: TEXT REFERENCES ProjectIndex(Id)
├── ConversationId: TEXT NOT NULL
├── DatabasePath: TEXT NOT NULL
├── CreatedAt: TEXT
└── UpdatedAt: TEXT
```

### 3.3 Project Database Schema

```
Table: FlowIndex
├── Id: TEXT PRIMARY KEY
├── Name: TEXT NOT NULL
├── Description: TEXT
├── DatabasePath: TEXT NOT NULL    # Relative path to flow DB
├── Version: INTEGER DEFAULT 1
├── IsTemplate: INTEGER DEFAULT 0
├── Tags: TEXT                     # JSON array
├── CreatedAt: TEXT
└── UpdatedAt: TEXT

Table: FlowDependency
├── Id: TEXT PRIMARY KEY
├── FlowId: TEXT REFERENCES FlowIndex(Id)
├── DependsOnFlowId: TEXT
├── DependsOnDatabasePath: TEXT   # For external dependencies
├── ImportedAt: TEXT
└── CreatedAt: TEXT
```

### 3.4 Flow Database Schema

```
Table: FlowMetadata
├── Id: TEXT PRIMARY KEY
├── Name: TEXT NOT NULL
├── Description: TEXT
├── Version: INTEGER DEFAULT 1
├── CanvasState: TEXT             # JSON (viewport, zoom, etc.)
├── CreatedAt: TEXT
└── UpdatedAt: TEXT

Table: Stage
├── Id: TEXT PRIMARY KEY
├── FlowId: TEXT REFERENCES FlowMetadata(Id)
├── Name: TEXT NOT NULL
├── Description: TEXT
├── Type: TEXT NOT NULL           # PROMPT, CODEGEN, FILEOP, etc.
├── Position: TEXT                # JSON {x, y}
├── Config: TEXT                  # JSON (type-specific config)
├── InputSchema: TEXT             # JSON schema for inputs
├── OutputSchema: TEXT            # JSON schema for outputs
├── Order: INTEGER                # Execution order (for sequential)
├── CreatedAt: TEXT
└── UpdatedAt: TEXT

Table: StageConnection
├── Id: TEXT PRIMARY KEY
├── FlowId: TEXT REFERENCES FlowMetadata(Id)
├── SourceStageId: TEXT REFERENCES Stage(Id)
├── SourceHandle: TEXT            # Output handle name
├── TargetStageId: TEXT REFERENCES Stage(Id)
├── TargetHandle: TEXT            # Input handle name
├── DataMapping: TEXT             # JSON transformation rules
├── CreatedAt: TEXT
└── UpdatedAt: TEXT

Table: Variable
├── Id: TEXT PRIMARY KEY
├── FlowId: TEXT REFERENCES FlowMetadata(Id)
├── Name: TEXT NOT NULL
├── Type: TEXT NOT NULL           # STRING, NUMBER, BOOLEAN, JSON, FILE_PATH
├── Scope: TEXT NOT NULL          # GLOBAL, FLOW, STAGE
├── DefaultValue: TEXT
├── IsSystem: INTEGER DEFAULT 0   # Pre-defined system variables
├── CreatedAt: TEXT
└── UpdatedAt: TEXT

Table: Condition
├── Id: TEXT PRIMARY KEY
├── StageId: TEXT REFERENCES Stage(Id)
├── Expression: TEXT NOT NULL     # CEL expression
├── TrueTargetStageId: TEXT
├── FalseTargetStageId: TEXT
├── Order: INTEGER
├── CreatedAt: TEXT
└── UpdatedAt: TEXT
```

### 3.5 Execution Database Schema

```
Table: ExecutionRun
├── Id: TEXT PRIMARY KEY
├── FlowId: TEXT NOT NULL
├── Status: TEXT NOT NULL         # PENDING, RUNNING, PAUSED, COMPLETED, FAILED
├── StartedAt: TEXT
├── CompletedAt: TEXT
├── TriggerType: TEXT             # MANUAL, SCHEDULED, API, VOICE
├── TriggerMetadata: TEXT         # JSON
├── CreatedAt: TEXT
└── UpdatedAt: TEXT

Table: StageExecution
├── Id: TEXT PRIMARY KEY
├── ExecutionRunId: TEXT REFERENCES ExecutionRun(Id)
├── StageId: TEXT NOT NULL
├── Status: TEXT NOT NULL
├── Input: TEXT                   # JSON
├── Output: TEXT                  # JSON
├── Error: TEXT
├── StartedAt: TEXT
├── CompletedAt: TEXT
├── RetryCount: INTEGER DEFAULT 0
└── CreatedAt: TEXT

Table: ExecutionLog
├── Id: TEXT PRIMARY KEY
├── ExecutionRunId: TEXT REFERENCES ExecutionRun(Id)
├── StageId: TEXT
├── Level: TEXT                   # DEBUG, INFO, WARN, ERROR
├── Message: TEXT
├── Metadata: TEXT                # JSON
├── Timestamp: TEXT
└── CreatedAt: TEXT

Table: Checkpoint
├── Id: TEXT PRIMARY KEY
├── ExecutionRunId: TEXT REFERENCES ExecutionRun(Id)
├── StageId: TEXT NOT NULL
├── State: TEXT                   # JSON serialized state
├── VariableSnapshot: TEXT        # JSON
├── CreatedAt: TEXT
└── UpdatedAt: TEXT
```

---

## 4. File Storage Conventions

### 4.1 Core Principle

> **CRITICAL:** Never store file contents (Markdown, code, documents) directly in the database. Store only file paths (relative or absolute).

### 4.2 Root Path Configuration

```
Table: Settings
├── Key: "storage.root_path"
├── Value: "/Users/dev/nexus-flow-workspace"  # Absolute path
└── Category: "storage"
```

### 4.3 Path Resolution

| Path Type | Storage Format | Example |
|-----------|----------------|---------|
| **Relative** | `./path/to/file.md` | Resolved from `root_path` |
| **Absolute** | `/full/path/to/file.md` | Used as-is |
| **Project-relative** | `@project/docs/spec.md` | Resolved from project root |

```go
// pkg/paths/resolver.go
type PathResolver struct {
    RootPath    string
    ProjectPath string
}

func (r *PathResolver) Resolve(path string) appfault.Result[string] {
    switch {
    case strings.HasPrefix(path, "@project/"):
        return filepath.Join(r.ProjectPath, strings.TrimPrefix(path, "@project/")), nil
    case strings.HasPrefix(path, "./"):
        return filepath.Join(r.RootPath, path), nil
    case filepath.IsAbs(path):
        return path, nil
    default:
        return filepath.Join(r.RootPath, path), nil
    }
}
```

### 4.4 Upload Directory Structure

```
{root_path}/
├── .uploads/
│   ├── import/
│   │   ├── spec/
│   │   │   ├── markdown/
│   │   │   │   └── {timestamp}_{filename}.md
│   │   │   ├── json/
│   │   │   │   └── {timestamp}_{filename}.json
│   │   │   └── zip/
│   │   │       └── {timestamp}_{archive}.zip
│   │   ├── flow/
│   │   │   ├── sqlite/
│   │   │   │   └── {timestamp}_{flow-name}.db
│   │   │   └── zip/
│   │   │       └── {timestamp}_{bundle}.zip
│   │   └── prd/
│   │       └── {timestamp}_{filename}.md
│   ├── export/
│   │   ├── flow/
│   │   │   └── {flow-name}_{timestamp}.zip
│   │   └── bundle/
│   │       └── {bundle-name}_{timestamp}.zip
│   └── temp/
│       └── {session-id}/
│           └── ...
├── .generated/
│   ├── code/
│   │   └── {stage-id}/
│   │       └── output.{ext}
│   └── artifacts/
│       └── {execution-id}/
│           └── ...
└── projects/
    └── {project-name}/
        └── ...
```

### 4.5 File Reference Model

```
Table: FileReference
├── Id: TEXT PRIMARY KEY
├── FlowId: TEXT REFERENCES FlowMetadata(Id)
├── StageId: TEXT REFERENCES Stage(Id)
├── ReferenceType: TEXT           # INPUT, OUTPUT, DEPENDENCY
├── PathType: TEXT                # RELATIVE, ABSOLUTE, PROJECT_RELATIVE
├── Path: TEXT NOT NULL           # Stored path
├── MimeType: TEXT
├── Hash: TEXT                    # SHA256 for change detection
├── Size: INTEGER
├── CreatedAt: TEXT
└── UpdatedAt: TEXT
```

---

## 5. Visual Pipeline Editor

### 5.1 Editor Layout

```
┌──────────────────────────────────────────────────────────────────┐
│  Toolbar: [New Stage ▼] [Play ▶] [Stop ■] [Zoom] [Export] [Voice]│
├──────────────┬───────────────────────────────────────┬───────────┤
│              │                                       │           │
│   Stage      │                                       │  Stage    │
│   Palette    │         Canvas (React Flow)           │  Config   │
│              │                                       │  Panel    │
│   ┌────┐     │     ┌─────┐        ┌─────┐           │           │
│   │PRMT│     │     │START├───────►│STAGE├──►...     │  Name:    │
│   ├────┤     │     └─────┘        └─────┘           │  [______] │
│   │CODE│     │                                       │           │
│   ├────┤     │                                       │  Type:    │
│   │FILE│     │                                       │  [Select] │
│   ├────┤     │                                       │           │
│   │HTTP│     │                                       │  Config:  │
│   ├────┤     │                                       │  [______] │
│   │COND│     │                                       │  [______] │
│   └────┘     │                                       │           │
│              │                                       │           │
├──────────────┴───────────────────────────────────────┴───────────┤
│  Variables: [+Add] | $process_name | $root_path | $file_path     │
├──────────────────────────────────────────────────────────────────┤
│  Console: [Logs] [Output] [Errors]                               │
│  > Stage "prompt-1" completed in 1.2s                            │
│  > Output: { result: "..." }                                     │
└──────────────────────────────────────────────────────────────────┘
```

### 5.2 Stage Types (Blocks)

| Type | Icon | Description | Inputs | Outputs |
|------|------|-------------|--------|---------|
| **START** | ▶ | Flow entry point | None | `trigger` |
| **END** | ■ | Flow termination | `result` | None |
| **PROMPT** | 💬 | LLM prompt execution | `context`, `variables` | `response` |
| **CODEGEN** | 🔧 | AI code generation | `prompt`, `context` | `code`, `files` |
| **SEARCH** | 🔍 | RAG/Vector search | `query`, `filters` | `results` |
| **TRANSFORM** | ⚙ | Data transformation (JQ/JSONPath) | `data` | `transformed` |
| **VALIDATION** | ✓ | Schema/rule validation | `data`, `schema` | `valid`, `errors` |
| **HTTP** | 🌐 | HTTP request | `url`, `method`, `body` | `response` |
| **FILE_OP** | 📁 | File operations | `source`, `target` | `result` |
| **CONDITION** | ◇ | Branching (CEL) | `data` | `true`, `false` |
| **LOOP** | 🔄 | Iteration | `items` | `item`, `index` |
| **SUB_FLOW** | 📦 | Nested flow execution | `inputs` | `outputs` |
| **RECORDER** | 🎬 | Macro recorder trigger | `config` | `recording` |
| **GSEARCH** | 🔎 | Google Search via CLI | `query` | `results` |
| **VOICE** | 🎤 | Voice command input | `audio` | `transcript` |
| **CODE_EXEC** | ▶ | Execute custom code | `code`, `runtime` | `result` |

### 5.3 Stage Zoom View

When a user double-clicks a stage, the canvas zooms into a detailed view:

```
┌────────────────────────────────────────────────────────────┐
│  Stage: "Generate Documentation"          [Back ←] [Save] │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  ┌─────────────────┐          ┌─────────────────┐         │
│  │     INPUTS      │          │     OUTPUTS     │         │
│  ├─────────────────┤          ├─────────────────┤         │
│  │ ● context       │          │ ○ response      │         │
│  │   (from: prev)  │    ───►  │   (to: next)    │         │
│  │ ● template      │          │ ○ metadata      │         │
│  │   (variable)    │          │   (to: logger)  │         │
│  └─────────────────┘          └─────────────────┘         │
│                                                            │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  Configuration                                       │  │
│  ├─────────────────────────────────────────────────────┤  │
│  │  Prompt Template:                                    │  │
│  │  ┌─────────────────────────────────────────────┐    │  │
│  │  │ Generate documentation for:                  │    │  │
│  │  │ {{context.code}}                            │    │  │
│  │  │                                             │    │  │
│  │  │ Use template: {{$template_name}}            │    │  │
│  │  └─────────────────────────────────────────────┘    │  │
│  │                                                      │  │
│  │  Model: [gemini-2.5-flash ▼]                        │  │
│  │  Max Tokens: [4096    ]                             │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                            │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  Conditions (CEL)                         [+Add]    │  │
│  ├─────────────────────────────────────────────────────┤  │
│  │  IF: context.type == "api"  → [API Handler Stage]   │  │
│  │  IF: context.type == "ui"   → [UI Docs Stage]       │  │
│  │  ELSE                       → [Default Stage]       │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### 5.4 Drag-and-Drop Behavior

```typescript
// ui/src/stores/canvasStore.ts
interface CanvasState {
  nodes: Node[];
  edges: Edge[];
  selectedNodeId: string | null;
  zoomLevel: number;
  viewMode: 'canvas' | 'stage-detail';
  focusedStageId: string | null;
}

interface CanvasActions {
  // Drag from palette
  onDragStart: (stageType: StageType) => void;
  onDrop: (position: XYPosition) => void;
  
  // Stage manipulation
  addStage: (type: StageType, position: XYPosition) => void;
  removeStage: (stageId: string) => void;
  duplicateStage: (stageId: string) => void;
  
  // Connections
  connectStages: (source: string, target: string, handles: HandlePair) => void;
  validateConnection: (connection: Connection) => boolean;
  
  // Zoom
  zoomToStage: (stageId: string) => void;
  zoomOut: () => void;
}
```

### 5.5 Execution Visualization

```
┌─────────────────────────────────────────────────────────────┐
│  Execution Mode                                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│    ┌─────┐       ┌─────┐       ┌─────┐       ┌─────┐       │
│    │START│──────►│LOAD │──────►│PRMT │──────►│ END │       │
│    │  ✓  │       │  ✓  │       │ ⟳  │       │     │       │
│    └─────┘       └─────┘       └─────┘       └─────┘       │
│                                    │                         │
│                              ┌─────┴─────┐                  │
│                              │  Running  │                  │
│                              │  Token: 42│                  │
│                              │  Time: 2s │                  │
│                              └───────────┘                  │
│                                                              │
│  ════════════════════════════════════════════════════       │
│  Progress: ████████████░░░░░░░░░░░░░░░  45%                 │
│  Stage 3/7 | Elapsed: 5.2s | ETA: 6.4s                      │
└─────────────────────────────────────────────────────────────┘

Legend:
  ✓  = Completed (green)
  ⟳  = Running (blue, animated pulse)
  ✕  = Failed (red)
  ○  = Pending (gray)
  ⏸  = Paused (yellow)
```

---

## 6. Stage/Block Features

### 6.1 Stage Configuration Interface

```go
// internal/engine/stage.go

// StageConfigParams holds typed stage-specific configuration (no map[string]interface{})
type StageConfigParams struct {
    Command     string        `json:",omitempty"`
    WorkDir     string        `json:",omitempty"`
    Environment []EnvVar      `json:",omitempty"`
    Template    string        `json:",omitempty"`
    Model       string        `json:",omitempty"`
    MaxTokens   int           `json:",omitempty"`
    FilePath    string        `json:",omitempty"`
    Endpoint    string        `json:",omitempty"`
}

type StageConfig struct {
    Id          string
    Name        string
    Description string
    Type        StageType
    Inputs      []HandleDefinition
    Outputs     []HandleDefinition
    Config      StageConfigParams
    Conditions  []ConditionRule
    Timeout     time.Duration
    RetryPolicy *RetryPolicy
}

type HandleDefinition struct {
    Name     string
    Type     DataType
    Required bool
    Schema   *JSONSchema `json:",omitempty"`
}

type ConditionRule struct {
    Expression    string // CEL
    TargetStageId string
    Priority      int
}
```

### 6.2 File Operation Stage

```go
// internal/engine/stages/fileop.go
type FileOpConfig struct {
    Operation   FileOperation
    Source      PathSpec
    Destination PathSpec      `json:",omitempty"`
    Options     FileOpOptions
}

type FileOperation string

const (
    FileOpRead     FileOperation = "READ"
    FileOpWrite    FileOperation = "WRITE"
    FileOpCopy     FileOperation = "COPY"
    FileOpMove     FileOperation = "MOVE"
    FileOpDelete   FileOperation = "DELETE"
    FileOpRename   FileOperation = "RENAME"
    FileOpMkdir    FileOperation = "MKDIR"
    FileOpList     FileOperation = "LIST"
    FileOpExists   FileOperation = "EXISTS"
    FileOpStat     FileOperation = "STAT"
)

type PathSpec struct {
    Path     string
    PathType PathType // RELATIVE, ABSOLUTE, PROJECT_RELATIVE
    Pattern  string   `json:",omitempty"` // Glob pattern for LIST
}

type FileOpOptions struct {
    CreateDirs    bool       // utf-8, base64, etc.
    Overwrite     bool
    Recursive     bool
    PreservePerms bool
    Encoding      string     // utf-8, base64, etc.
    Format        FileFormat // JSON, YAML, TOML, TEXT, BINARY
}

type FileFormat string

const (
    FormatJson   FileFormat = "JSON"
    FormatYaml   FileFormat = "YAML"
    FormatToml   FileFormat = "TOML"
    FormatText   FileFormat = "TEXT"
    FormatBinary FileFormat = "BINARY"
    FormatHtml   FileFormat = "HTML"
    FormatMd     FileFormat = "MARKDOWN"
)
```

### 6.3 Sub-Flow Stage (Nested Flows)

```go
// internal/engine/stages/subflow.go
type SubFlowConfig struct {
    FlowReference FlowRef              // local var → sub-flow input
    InputMapping  map[string]string    // local var → sub-flow input
    OutputMapping map[string]string    // sub-flow output → local var
    Execution     SubFlowExecutionMode
}

type FlowRef struct {
    Type         FlowRefType
    FlowId       string      `json:",omitempty"` // Same project
    DatabasePath string      `json:",omitempty"` // External SQLite
    ProjectId    string      `json:",omitempty"` // Cross-project
}

type FlowRefType string

const (
    FlowRefInternal FlowRefType = "INTERNAL" // Same project
    FlowRefExternal FlowRefType = "EXTERNAL" // Different SQLite DB
    FlowRefRemote   FlowRefType = "REMOTE"   // API endpoint
)
```

---

## 7. Variable System

### 7.1 Variable Scopes

| Scope | Lifetime | Access |
|-------|----------|--------|
| **SYSTEM** | Application lifetime | Read-only |
| **GLOBAL** | Across all flows | Read/Write |
| **FLOW** | Single flow execution | Read/Write |
| **STAGE** | Single stage execution | Read/Write |

### 7.2 System Variables (Pre-defined)

| Variable | Type | Description |
|----------|------|-------------|
| `$process_name` | STRING | Current flow name |
| `$process_id` | STRING | Current execution ID |
| `$template_name` | STRING | Active template name |
| `$root_path` | FILE_PATH | Configured root directory |
| `$project_path` | FILE_PATH | Current project directory |
| `$upload_path` | FILE_PATH | `.uploads/` directory |
| `$current_file` | FILE_PATH | Active file being processed |
| `$timestamp` | STRING | ISO8601 current time |
| `$date` | STRING | YYYY-MM-DD current date |
| `$user` | STRING | Current system user |
| `$stage_name` | STRING | Current stage name |
| `$stage_index` | NUMBER | Current stage order index |
| `$iteration_index` | NUMBER | Loop iteration index |
| `$iteration_item` | JSON | Current loop item |

### 7.3 Variable Reference Syntax

```
// In templates and expressions
{{$variable_name}}              // Direct reference
{{$variable.property}}          // Object property access
{{$variable[0]}}               // Array index access
{{$variable.items | length}}   // Pipe to function

// In CEL expressions
variable_name                   // Direct reference
variable.property              // Property access
variable[index]               // Index access

// Special prefixes
{{@input.field}}              // Stage input reference
{{@output.field}}             // Previous stage output
{{@env.VAR_NAME}}            // Environment variable
{{@secret.SECRET_KEY}}       // Secret (from secure store)
```

### 7.4 Variable UI Panel

```typescript
// ui/src/components/VariablePanel/VariablePanel.tsx
interface VariablePanelProps {
  flowId: string;
  variables: Variable[];
  onAdd: (variable: NewVariable) => void;
  onEdit: (id: string, updates: Partial<Variable>) => void;
  onDelete: (id: string) => void;
}

interface Variable {
  id: string;
  name: string;
  type: VariableType;
  scope: VariableScope;
  defaultValue: unknown;
  currentValue?: unknown;
  isSystem: boolean;
  description?: string;
}

type VariableType = 
  | 'STRING' 
  | 'NUMBER' 
  | 'BOOLEAN' 
  | 'JSON' 
  | 'FILE_PATH' 
  | 'ARRAY' 
  | 'OBJECT';

type VariableScope = 'SYSTEM' | 'GLOBAL' | 'FLOW' | 'STAGE';
```

---

## 8. Code Execution Runtimes

### 8.1 Supported Runtimes

| Runtime | Extension | Compiler/Interpreter | Notes |
|---------|-----------|---------------------|-------|
| **Go** | `.go` | `go run` | Compiled at execution |
| **TypeScript** | `.ts` | `bun` / `tsx` | Transpiled to JS |
| **JavaScript** | `.js` | `node` / `bun` | Direct execution |
| **Python** | `.py` | `python3` | Direct execution |
| **PHP** | `.php` | `php` | Direct execution |
| **Shell** | `.sh` | `bash` / `sh` | Direct execution |

### 8.2 Runtime Detection

```go
// internal/engine/runtime/detector.go
type RuntimeConfig struct {
    Type        RuntimeType
    Version     string
    Executable  string
    Available   bool
    InstallPath string
}

func DetectRuntimes() map[RuntimeType]*RuntimeConfig {
    runtimes := make(map[RuntimeType]*RuntimeConfig)
    
    // Go
    if path, err := exec.LookPath("go"); err == nil {
        version, _ := execCommand("go", "version")
        runtimes[RuntimeGo] = &RuntimeConfig{
            Type:        RuntimeGo,
            Version:     parseGoVersion(version),
            Executable:  path,
            Available:   true,
            InstallPath: path,
        }
    }
    
    // Similar for other runtimes...
    return runtimes
}
```

### 8.3 Prerequisite Checking

```go
// internal/engine/runtime/prerequisites.go
type PrerequisiteCheck struct {
    Runtime    RuntimeType
    Required   bool
    MinVersion string `json:",omitempty"`
    Satisfied  bool
    Message    string
}

type PrerequisiteConfig struct {
    Enabled  bool          // Enable/disable checks
    Strict   bool          // Fail on missing
    Runtimes []RuntimeType // Required runtimes
}

// Note: PrerequisiteCheckSlice is defined in types.go (created from generic appfault.ResultSlice[PrerequisiteCheck]):
// type PrerequisiteCheckSlice = appfault.ResultSlice[PrerequisiteCheck]
func (e *Engine) CheckPrerequisites(config PrerequisiteConfig) PrerequisiteCheckSlice {
    if !config.Enabled {
        return nil, nil
    }
    
    checks := make([]PrerequisiteCheck, 0)
    runtimes := DetectRuntimes()
    
    for _, rt := range config.Runtimes {
        rc, exists := runtimes[rt]
        check := PrerequisiteCheck{
            Runtime:  rt,
            Required: true,
        }
        
        if !exists || !rc.Available {
            check.Satisfied = false
            check.Message = fmt.Sprintf("%s is not installed", rt)
        } else {
            check.Satisfied = true
            check.Message = fmt.Sprintf("%s %s available", rt, rc.Version)
        }
        
        checks = append(checks, check)
    }
    
    return checks, nil
}
```

### 8.4 Code Execution Stage

```go
// internal/engine/stages/codeexec.go
type CodeExecConfig struct {
    Runtime     RuntimeType       
    Code        string            `json:",omitempty"`       // Inline code
    FilePath    string            `json:",omitempty"`       // External file
    EntryPoint  string            `json:",omitempty"`       // Function name
    Args        []string          `json:",omitempty"`
    Env         map[string]string `json:",omitempty"`
    WorkingDir  string            `json:",omitempty"`
    Timeout     time.Duration     
    CaptureMode OutputCaptureMode 
}

type OutputCaptureMode string

const (
    CaptureStdout OutputCaptureMode = "STDOUT"
    CaptureStderr OutputCaptureMode = "STDERR"
    CaptureBoth   OutputCaptureMode = "BOTH"
    CaptureJson   OutputCaptureMode = "JSON" // Parse stdout as JSON
)

// Execution wrapper
func (s *CodeExecStage) Execute(context stdctx.Context, input StageInput) appfault.Result[StageOutput] {
    // Generate temp file if inline code
    var codePath string
    if s.config.Code != "" {
        codePath = s.writeTempFile(s.config.Code, s.config.Runtime)
        defer pathutil.Remove(codePath)
    } else {
        codePath = s.config.FilePath
    }
    
    // Build command based on runtime
    cmd := s.buildCommand(codePath)
    cmd.Dir = s.config.WorkingDir
    cmd.Env = s.buildEnv()
    
    // Execute with timeout
    ctx, cancel := context.WithTimeout(ctx, s.config.Timeout)
    defer cancel()
    
    output, err := cmd.Output()
    if err != nil {
        return nil, wrapError(err, ErrCodeExecFailed)
    }
    
    return s.parseOutput(output)
}
```

---

## 9. External Integrations

### 9.1 Macro Recorder API

```go
// internal/integrations/recorder/client.go
// TODO: Documentation pending - API specification to be provided

type RecorderClient struct {
    BaseUrl    string
    ApiKey     string
    HttpClient *http.Client
}

type RecordingConfig struct {
    // TODO: Define based on external API documentation
    Name        string
    CaptureArea string // "fullscreen", "window", "region"
    // Additional config TBD
}

type RecordingSession struct {
    Id        string
    Status    string    // "recording", "paused", "stopped"
    StartedAt time.Time
    // Additional fields TBD
}

// Placeholder methods - implementation pending API documentation
func (c *RecorderClient) StartRecording(config RecordingConfig) appfault.Result[RecordingSession] {
    // TODO: Implement when API documentation is available
    return appfault.FailNew[RecordingSession](ErrNotImplemented, "recorder API not yet implemented")
}

func (c *RecorderClient) StopRecording(sessionId string) appfault.Result[Recording] {
    // TODO: Implement when API documentation is available
    return appfault.FailNew[Recording](ErrNotImplemented, "recorder API not yet implemented")
}

func (c *RecorderClient) GetRecording(sessionId string) appfault.Result[Recording] {
    // TODO: Implement when API documentation is available
    return appfault.FailNew[Recording](ErrNotImplemented, "recorder API not yet implemented")
}
```

### 9.2 Google Search Integration (GSearch CLI)

```go
// internal/integrations/gsearch/client.go
type GSearchClient struct {
    CLIPath string // Path to gsearch binary
}

type SearchQuery struct {
    Query         string
    MaxResults    int
    MinConfidence float64
    Domains       []string `json:",omitempty"`
    Recency       string   `json:",omitempty"` // "day", "week", "month", "year"
}

type SearchResult struct {
    Title       string
    Url         string
    Snippet     string
    Confidence  float64
    Authority   float64
    PublishedAt time.Time `json:",omitempty"`
}

// Note: SearchResultSlice is defined in types.go (created from generic appfault.ResultSlice[SearchResult]):
// type SearchResultSlice = appfault.ResultSlice[SearchResult]
func (c *GSearchClient) Search(context stdctx.Context, query SearchQuery) SearchResultSlice {
    args := []string{
        "search",
        "--query", query.Query,
        "--max-results", strconv.Itoa(query.MaxResults),
        "--min-confidence", fmt.Sprintf("%.2f", query.MinConfidence),
        "--output", "json",
    }
    
    cmd := exec.CommandContext(context, c.CLIPath, args...)
    output, err := cmd.Output()
    if err != nil {
        return nil, wrapError(err, ErrGSearchFailed)
    }
    
    var results []SearchResult
    if err := json.Unmarshal(output, &results); err != nil {
        return nil, wrapError(err, ErrGSearchParseFailed)
    }
    
    return results, nil
}
```

### 9.3 Integration Registry

```go
// internal/integrations/registry.go
type IntegrationRegistry struct {
    integrations map[string]Integration
    mu           sync.RWMutex
}

type Integration interface {
    Name() string
    Type() IntegrationType
    IsAvailable() bool
    Initialize(config IntegrationConfig) *appfault.AppError
    Execute(context stdctx.Context, params IntegrationParams) appfault.Result[IntegrationResult]
}

type IntegrationType string

const (
    IntegrationRecorder IntegrationType = "RECORDER"
    IntegrationGSearch  IntegrationType = "GSEARCH"
    IntegrationVoice    IntegrationType = "VOICE"
    IntegrationRAG      IntegrationType = "RAG"
    IntegrationHttp     IntegrationType = "HTTP"
)

func NewRegistry() *IntegrationRegistry {
    return &IntegrationRegistry{
        integrations: map[string]Integration{
            "recorder": &RecorderIntegration{},
            "gsearch":  &GSearchIntegration{},
            "voice":    &VoiceIntegration{},
        },
    }
}
```

---

## 10. Compact Build System

### 10.1 Build Modes

| Mode | Description | Output |
|------|-------------|--------|
| **Standard** | Development with hot-reload | Running app |
| **Compact** | Single binary + embedded DBs | `{flow-name}.nfx` |
| **Bundle** | Multiple flows in one package | `{bundle-name}.nfxb` |

### 10.2 Compact Build Structure

```
{flow-name}.nfx (Binary)
├── Embedded Resources:
│   ├── flow.db           # Main flow definition
│   ├── dependencies/
│   │   ├── sub-flow-1.db
│   │   └── sub-flow-2.db
│   ├── templates/
│   │   └── *.txt, *.md
│   └── static/
│       └── *.json, *.yaml
└── Go Binary:
    ├── Execution engine
    ├── SQLite driver
    └── Runtime launchers
```

### 10.3 Build Configuration

```go
// internal/build/config.go
type BuildConfig struct {
    FlowId           string
    OutputPath       string
    Mode             BuildMode
    IncludeDeps      bool
    EmbedTemplates   bool
    PrerequisitesReq []RuntimeType
    Compression      CompressionType
    Signing          *SigningConfig `json:",omitempty"`
}

type BuildMode string

const (
    BuildModeCompact BuildMode = "COMPACT"
    BuildModeBundle  BuildMode = "BUNDLE"
    BuildModeDebug   BuildMode = "DEBUG"
)

func (b *Builder) Build(context stdctx.Context, config BuildConfig) appfault.Result[BuildResult] {
    // 1. Collect all dependencies
    deps, err := b.collectDependencies(config.FlowId)
    if err != nil {
        return nil, err
    }
    
    // 2. Package SQLite databases
    dbBundle, err := b.packageDatabases(config.FlowId, deps)
    if err != nil {
        return nil, err
    }
    
    // 3. Embed resources using go:embed
    resources, err := b.embedResources(dbBundle)
    if err != nil {
        return nil, err
    }
    
    // 4. Compile Go binary
    binary, err := b.compileRunner(resources, config)
    if err != nil {
        return nil, err
    }
    
    // 5. Apply compression and signing
    output, err := b.finalize(binary, config)
    if err != nil {
        return nil, err
    }
    
    return &BuildResult{
        Path: output,
        Size: getFileSize(output),
        Hash: computeHash(output),
    }, nil
}
```

### 10.4 Runtime Extraction

```go
// Embedded in compiled binary
//go:embed databases/*
var embeddedDbs embed.FS

func (r *Runner) extractDatabases() appfault.Result[string] {
    // Extract to temp directory
    tempDir, err := pathutil.MkdirTemp("", "nfx-run-*")
    if err != nil {
        return "", err
    }
    
    // Walk embedded FS and extract
    err = fs.WalkDir(embeddedDbs, "databases", func(path string, d fs.DirEntry, err error) error {
        if err != nil || d.IsDir() {
            return err
        }
        
        data, err := embeddedDbs.ReadFile(path)
        if err != nil {
            return err
        }
        
        outPath := filepath.Join(tempDir, path)
        pathutil.EnsureDir(filepath.Dir(outPath), 0755)
        return pathutil.WriteFile(outPath, data, 0644)
    })
    
    return tempDir, err
}
```

---

## 11. Import/Export System

### 11.1 Export Formats

| Format | Extension | Contains | Use Case |
|--------|-----------|----------|----------|
| **Flow** | `.nff` | Single flow DB | Share individual flows |
| **Project** | `.nfp` | Project + all flows | Full project backup |
| **Bundle** | `.nfb` | Multiple flows + deps | Multi-flow packages |
| **Execution** | `.nfe` | Flow + execution data | Debugging, audit |

### 11.2 Export Structure

```
{name}.nfb (Zip Archive)
├── manifest.json
│   {
│     "version": "1.0",
│     "type": "bundle",
│     "created": "2026-01-30T...",
│     "flows": ["flow-1", "flow-2"],
│     "dependencies": [...],
│     "checksums": {...}
│   }
├── flows/
│   ├── flow-1.db
│   └── flow-2.db
├── shared/
│   └── common-deps.db
└── metadata/
    └── export-info.json
```

### 11.3 Import/Export API

```go
// internal/transfer/export.go
type Exporter struct {
    db        *database.Manager
    tempDir   string
}

type ExportOptions struct {
    Format           ExportFormat
    FlowIds          []string
    IncludeExecution bool
    IncludeSecrets   bool
    Compression      string // none, gzip, zstd
}

func (e *Exporter) Export(context stdctx.Context, opts ExportOptions) appfault.Result[ExportResult] {
    // 1. Validate flows exist
    // 2. Collect all databases
    // 3. Create manifest
    // 4. Package into zip
    // 5. Return path
}

// internal/transfer/import.go
type Importer struct {
    db      *database.Manager
    tempDir string
}

type ImportOptions struct {
    Path            string
    ConflictPolicy  ConflictPolicy
    TargetProjectId string
    Validate        bool
}

type ConflictPolicy string

const (
    ConflictSkip      ConflictPolicy = "SKIP"
    ConflictOverwrite ConflictPolicy = "OVERWRITE"
    ConflictRename    ConflictPolicy = "RENAME"
    ConflictAsk       ConflictPolicy = "ASK"
)

func (i *Importer) Import(context stdctx.Context, opts ImportOptions) appfault.Result[ImportResult] {
    // 1. Extract archive
    // 2. Validate manifest
    // 3. Check for conflicts
    // 4. Apply conflict policy
    // 5. Import databases
    // 6. Update references
}
```

### 11.4 Multi-Database Import

```go
// internal/transfer/multidb.go
type MultiDbImport struct {
    Archives  []string  // Multiple .nfb files
    MergeMode MergeMode
    ProjectId string
}

type MergeMode string

const (
    MergeAppend     MergeMode = "APPEND"     // Add all, no dedup
    MergeDedupe     MergeMode = "DEDUPE"     // Skip duplicates
    MergeUpdate     MergeMode = "UPDATE"     // Update if exists
)

func (i *Importer) ImportMultiple(context stdctx.Context, opts MultiDbImport) appfault.Result[MultiImportResult] {
    results := make([]*ImportResult, 0, len(opts.Archives))
    
    for _, archive := range opts.Archives {
        result, err := i.Import(context, ImportOptions{
            Path:            archive,
            ConflictPolicy:  conflictFromMergeMode(opts.MergeMode),
            TargetProjectId: opts.ProjectId,
        })
        if err != nil {
            return nil, appfault.Wrap(
                err,
                ErrImportFailed,
                "import archive",
            ).WithContext("archive", archive)
        }
        results = append(results, result)
    }
    
    return &MultiImportResult{
        Results:       results,
        TotalFlows:    countFlows(results),
        TotalStages:   countStages(results),
    }, nil
}
```

---

## 12. Safety Features

### 12.1 Destructive Operation Confirmation

```go
// internal/safety/confirm.go
type DestructiveOperation string

const (
    OpFileDelete   DestructiveOperation = "FILE_DELETE"
    OpFileMove     DestructiveOperation = "FILE_MOVE"
    OpFileRename   DestructiveOperation = "FILE_RENAME"
    OpDirDelete    DestructiveOperation = "DIR_DELETE"
    OpDatabaseDrop DestructiveOperation = "DATABASE_DROP"
)

type SafetyConfig struct {
    Enabled             bool                   // Require typing to confirm
    RequireConfirmation []DestructiveOperation
    TypeToConfirm       bool                   // Require typing to confirm
    ExcludePatterns     []string               // Paths excluded from checks
    AutoApproveInternal bool                   // Auto-approve within project
}

// Default safe configuration
var DefaultSafetyConfig = SafetyConfig{
    Enabled: true,
    RequireConfirmation: []DestructiveOperation{
        OpFileDelete,
        OpFileMove,
        OpFileRename,
        OpDirDelete,
    },
    TypeToConfirm:       true,
    ExcludePatterns:     []string{".tmp/*", ".cache/*", ".uploads/temp/*"},
    AutoApproveInternal: false,
}
```

### 12.2 Confirmation Dialog (UI)

```typescript
// ui/src/components/ConfirmDialog/DestructiveConfirm.tsx
interface DestructiveConfirmProps {
  operation: DestructiveOperation;
  target: string;              // File/path being affected
  impact: string;              // Description of impact
  typeToConfirm?: string;      // Text user must type to confirm
  onConfirm: () => void;
  onCancel: () => void;
}

// Example usage for file deletion outside project
<DestructiveConfirm
  operation="FILE_DELETE"
  target="/external/path/important.md"
  impact="This file is outside the project directory and will be permanently deleted."
  typeToConfirm="DELETE"
  onConfirm={handleDelete}
  onCancel={handleCancel}
/>
```

### 12.3 Confirmation API

```go
// internal/safety/api.go
type ConfirmationRequest struct {
    Id           string
    Operation    DestructiveOperation
    Target       string
    Impact       string
    TypeRequired string        `json:",omitempty"`
    Timeout      time.Duration
}

type ConfirmationResponse struct {
    Id        string
    Confirmed bool
    TypedText string    `json:",omitempty"`
    Timestamp time.Time
}

// WebSocket message for confirmation
type WSConfirmationMessage struct {
    Type    string              // "confirmation_required"
    Request ConfirmationRequest
}

// Engine waits for confirmation
func (e *Engine) awaitConfirmation(context stdctx.Context, req ConfirmationRequest) appfault.Result[bool] {
    // Send via WebSocket
    e.ws.Send(WSConfirmationMessage{
        Type:    "confirmation_required",
        Request: req,
    })
    
    // Wait for response or timeout
    select {
    case resp := <-e.confirmationChan:
        if resp.Id != req.Id {
            return false, ErrConfirmationMismatch
        }
        if req.TypeRequired != "" && resp.TypedText != req.TypeRequired {
            return false, ErrConfirmationTextMismatch
        }
        return resp.Confirmed, nil
        
    case <-time.After(req.Timeout):
        return false, ErrConfirmationTimeout
        
    case <-ctx.Done():
        return false, ctx.Err()
    }
}
```

### 12.4 Path Boundary Detection

```go
// internal/safety/boundaries.go
type PathBoundary struct {
    ProjectRoot string
    AllowedDirs []string
}

func (b *PathBoundary) IsOutsideProject(path string) bool {
    absPath, _ := filepath.Abs(path)
    absRoot, _ := filepath.Abs(b.ProjectRoot)
    
    // Check if path is outside project root
    rel, err := filepath.Rel(absRoot, absPath)
    if err != nil || strings.HasPrefix(rel, "..") {
        return true
    }
    return false
}

func (b *PathBoundary) RequiresConfirmation(op DestructiveOperation, path string) bool {
    // Operations outside project always require confirmation
    if b.IsOutsideProject(path) {
        return true
    }
    
    // Check if in allowed auto-approve directories
    for _, allowed := range b.AllowedDirs {
        if strings.HasPrefix(path, allowed) {
            return false
        }
    }
    
    return true
}
```

---

## 13. Voice CLI Integration

### 13.1 Voice CLI Architecture

The Voice CLI is a **separate microservice** for voice-to-text transcription, operating independently but integrating with Nexus-Flow and Spec Management Software.

```
┌─────────────────────────────────────────────────────────────────┐
│                      Voice CLI (voice-cli/)                      │
├─────────────────────────────────────────────────────────────────┤
│  CLI Interface      │  HTTP API       │  WebSocket Server       │
│  - voice record     │  POST /transcr  │  ws://voice/stream     │
│  - voice transcribe │  GET /sessions  │  Real-time transcription│
│  - voice list       │  GET /history   │                         │
├─────────────────────┴─────────────────┴─────────────────────────┤
│                         LLM Integration                          │
│  Whisper / Local Model / External API                           │
├─────────────────────────────────────────────────────────────────┤
│                      Database Layer                              │
│  root.db (global index) │ {conversation-id}.db (transcripts)   │
└─────────────────────────────────────────────────────────────────┘
```

### 13.2 Voice CLI Commands

```bash
# Start recording
voice-cli record --project my-project --conversation conv-123

# Transcribe audio file
voice-cli transcribe --input audio.wav --output transcript.json

# Real-time transcription
voice-cli stream --project my-project --live

# List transcription history
voice-cli list --project my-project

# Export conversation
voice-cli export --conversation conv-123 --format json
```

### 13.3 Voice Database Schema

```
// Root database: voice-cli-data/root.db

Table: ProjectIndex
├── Id: TEXT PRIMARY KEY
├── ProjectName: TEXT NOT NULL
├── ExternalProjectId: TEXT        # Links to Spec Management Software
├── RootPath: TEXT NOT NULL
├── CreatedAt: TEXT
└── UpdatedAt: TEXT

Table: ConversationIndex
├── Id: TEXT PRIMARY KEY
├── ProjectId: TEXT REFERENCES ProjectIndex(Id)
├── Name: TEXT
├── DatabasePath: TEXT NOT NULL    # Path to conversation DB
├── TotalDuration: INTEGER         # Seconds
├── WordCount: INTEGER
├── CreatedAt: TEXT
└── UpdatedAt: TEXT

// Conversation database: voice-cli-data/{project}/{conversation-id}.db

Table: TranscriptSegment
├── Id: TEXT PRIMARY KEY
├── ConversationId: TEXT NOT NULL
├── StartTime: REAL               # Seconds from start
├── EndTime: REAL
├── Text: TEXT NOT NULL
├── Confidence: REAL              # 0.0 - 1.0
├── Speaker: TEXT                 # Speaker identification
├── Metadata: TEXT                # JSON (language, model, etc.)
├── CreatedAt: TEXT
└── UpdatedAt: TEXT

Table: TranscriptEntity
├── Id: TEXT PRIMARY KEY
├── SegmentId: TEXT REFERENCES TranscriptSegment(Id)
├── Type: TEXT                    # COMMAND, VARIABLE, STAGE_NAME, etc.
├── Value: TEXT
├── StartOffset: INTEGER          # Character offset in segment
├── EndOffset: INTEGER
├── Confidence: REAL
└── CreatedAt: TEXT

Table: VoiceCommand
├── Id: TEXT PRIMARY KEY
├── ConversationId: TEXT NOT NULL
├── SegmentId: TEXT REFERENCES TranscriptSegment(Id)
├── Command: TEXT NOT NULL        # Parsed command
├── Parameters: TEXT              # JSON
├── Executed: INTEGER DEFAULT 0
├── ExecutedAt: TEXT
├── Result: TEXT                  # JSON execution result
└── CreatedAt: TEXT
```

### 13.4 Voice-to-Flow Integration

```go
// internal/integrations/voice/flow_builder.go
type VoiceFlowBuilder struct {
    voiceCLI   *VoiceCLIClient
    llmClient  *LLMClient
    flowSvc    *FlowService
}

// Convert voice transcript to flow stages
func (b *VoiceFlowBuilder) TranscriptToFlow(context stdctx.Context, conversationId string) appfault.Result[Flow] {
    // 1. Get transcript from Voice CLI
    transcript, err := b.voiceCLI.GetTranscript(conversationId)
    if err != nil {
        return nil, err
    }
    
    // 2. Use LLM to parse intent and extract stages
    prompt := buildFlowExtractionPrompt(transcript)
    response, err := b.llmClient.Complete(context, prompt)
    if err != nil {
        return nil, err
    }
    
    // 3. Parse LLM response into flow definition
    flowDef, err := parseFlowDefinition(response)
    if err != nil {
        return nil, err
    }
    
    // 4. Create flow in database
    return b.flowSvc.CreateFromDefinition(context, flowDef)
}

// Real-time voice stage creation
func (b *VoiceFlowBuilder) StreamVoiceToStage(context stdctx.Context, flowId string) error {
    stream, err := b.voiceCLI.StreamTranscription()
    if err != nil {
        return err
    }
    
    for segment := range stream {
        // Parse commands from segment
        commands := b.parseCommands(segment)
        
        for _, cmd := range commands {
            switch cmd.Type {
            case "ADD_STAGE":
                b.flowSvc.AddStage(context, flowId, cmd.StageConfig)
            case "CONNECT_STAGES":
                b.flowSvc.ConnectStages(context, flowId, cmd.Source, cmd.Target)
            case "SET_VARIABLE":
                b.flowSvc.SetVariable(context, flowId, cmd.VarName, cmd.VarValue)
            }
        }
    }
    
    return nil
}
```

### 13.5 Voice Commands Grammar

```
// Recognized voice commands for flow creation

"Create a new stage called {name}"
"Add a {type} stage named {name}"
"Connect {source} to {target}"
"Set variable {name} to {value}"
"Add condition if {expression} then go to {stage}"
"Run this stage in parallel with {other_stage}"
"Loop over {variable} and {action}"
"When {event} happens, {action}"
"Delete stage {name}"
"Rename stage {old_name} to {new_name}"
```

---

## 14. Execution Views

### 14.1 Tree View (Hierarchical)

```
Flow: "Process Documentation"
│
├─► START
│   └─► Load Files
│       ├─► [Parallel Group]
│       │   ├─► Parse Markdown
│       │   └─► Extract Code
│       └─► Merge Results
│           ├─► IF: hasCode
│           │   └─► Generate API Docs
│           └─► ELSE
│               └─► Generate Summary
│                   └─► END
```

### 14.2 Pod View (Grouped Execution)

```
┌─────────────────────────────────────────────────────────────┐
│  Execution Pods                                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Pod 1      │  │   Pod 2      │  │   Pod 3      │      │
│  │  Sequential  │  │   Parallel   │  │  Sequential  │      │
│  ├──────────────┤  ├──────────────┤  ├──────────────┤      │
│  │ START    ✓   │  │ Parse    ⟳   │  │ Merge    ○   │      │
│  │ Load     ✓   │  │ Extract  ⟳   │  │ Condition○   │      │
│  │              │  │              │  │ Output   ○   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                              │
│  Concurrency: 2/4 | Completed: 2/7 | Running: 2            │
└─────────────────────────────────────────────────────────────┘
```

### 14.3 Execution Mode Configuration

```go
type ExecutionMode string

const (
    ExecSequential ExecutionMode = "SEQUENTIAL"
    ExecParallel   ExecutionMode = "PARALLEL"
    ExecMixed      ExecutionMode = "MIXED"
)

type ExecutionConfig struct {
    Mode            ExecutionMode
    MaxConcurrency  int
    FailFast        bool
    ContinueOnError bool
    TimeoutPerStage time.Duration
    TotalTimeout    time.Duration
    RetryPolicy     *RetryPolicy
}
```

---

## 15. Error Codes

Nexus-Flow uses error code range **10xxx** (shared with core service).

| Code | Name | Description |
|------|------|-------------|
| 10001 | ErrFlowNotFound | Flow does not exist |
| 10002 | ErrStageNotFound | Stage does not exist |
| 10003 | ErrInvalidConnection | Invalid stage connection |
| 10004 | ErrCycleDetected | Cycle in flow graph |
| 10005 | ErrExecutionFailed | Stage execution failed |
| 10006 | ErrRuntimeNotAvailable | Required runtime not installed |
| 10007 | ErrPrerequisiteFailed | Prerequisite check failed |
| 10008 | ErrConfirmationTimeout | User confirmation timed out |
| 10009 | ErrConfirmationDenied | User denied destructive operation |
| 10010 | ErrImportFailed | Failed to import flow/bundle |
| 10011 | ErrExportFailed | Failed to export flow/bundle |
| 10012 | ErrBuildFailed | Compact build failed |
| 10013 | ErrDatabaseCorrupt | SQLite database corruption |
| 10014 | ErrVoiceTranscriptionFailed | Voice transcription error |
| 10015 | ErrIntegrationUnavailable | External integration not available |

---

## Related Documents

- [Nexus-Flow Service](./06-nexus-flow.md) — Core service architecture
- [React Flow Canvas](./07-react-flow-canvas.md) — Visual editor details
- [Database Design](../07-database-design/00-overview.md) — Schema conventions
- [Error Management](../06-error-management/02-backend/01-error-codes.md) — Error handling patterns
- [AI-Bridge Service](./04-ai-bridge.md) — LLM integration for prompts
- [Scout Service](./05-scout.md) — RAG integration for search stages
