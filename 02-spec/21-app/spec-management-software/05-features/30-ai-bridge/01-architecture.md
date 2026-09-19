# AI Bridge: Architecture

**Version:** 2.0.0  
**Status:** Complete  
**Updated:** 2026-03-09

---

## Overview

AI Bridge is a standalone adapter that normalizes input from multiple formats and routes requests to configured LLM backends with unified error handling and response streaming.

---

## Core Components

### 1. Input Router

Routes incoming requests to the appropriate parser based on file extension or content-type.

```go
type InputRouter struct {
    parsers map[string]InputParser
}

type InputParser interface {
    Parse(input []byte) appfault.Result[*NormalizedRequest]
    SupportedExtensions() []string
    ContentType() string
}

func (r *InputRouter) Route(filename string, content []byte) appfault.Result[*NormalizedRequest] {
    ext := filepath.Ext(filename)
    parser, ok := r.parsers[ext]
    if !ok {
        return appfault.Fail[*NormalizedRequest](
            appfault.New(
                ErrUnsupportedFormat,
                "unsupported format: %s",
                ext,
            ),
        )
    }
    return parser.Parse(content)
}
```

### 2. Normalized Request

All input formats are normalized to this structure:

```go
type NormalizedRequest struct {
    // Core fields
    Id            string
    SystemPrompt  string
    UserPrompt    string
    
    // Model selection
    ModelCategory ModelCategory     // thinking, writing, coding, voice
    ModelId       string            `json:",omitempty"` // Specific model override
    
    // Parameters
    Temperature   float64           `json:",omitempty"`
    MaxTokens     int               `json:",omitempty"`
    TopP          float64           `json:",omitempty"`
    
    // Context
    Variables     map[string]string `json:",omitempty"`
    Context       []ContextItem     `json:",omitempty"`
    
    // Execution
    Stream        bool
    OutputFormat  OutputFormat      // text, json, markdown
    BatchMode     bool
    BatchItems    []BatchItem       `json:",omitempty"`
    
    // Metadata
    Source        InputSource
    CreatedAt     time.Time
}

type InputSource struct {
    Format   string // markdown, json, yaml, csv
    FilePath string `json:",omitempty"`
    LineNo   int    `json:",omitempty"`
}

type ContextItem struct {
    Role    string // system, user, assistant
    Content string
}

type BatchItem struct {
    Id        string
    Variables map[string]string
}
```

### 3. Backend Adapter Interface

```go
type BackendAdapter interface {
    Name() string
    IsAvailable(context stdctx.Context) bool
    
    // Synchronous generation
    Generate(context stdctx.Context, req *NormalizedRequest) appfault.Result[*Response]
    
    // Streaming generation
    GenerateStream(context stdctx.Context, req *NormalizedRequest) appfault.Result[<-chan StreamChunk]
    
    // Model management
    ListModels(context stdctx.Context) appfault.ResultSlice[ModelInfo]
    LoadModel(context stdctx.Context, modelId string) *appfault.AppError
    UnloadModel(context stdctx.Context, modelId string) *appfault.AppError
}

type Response struct {
    Id            string
    Content       string
    FinishReason  string
    TokensUsed    TokenUsage
    DurationMs    int64
    ModelUsed     string
}

type StreamChunk struct {
    Delta        string
    FinishReason string `json:",omitempty"`
    Error        *appfault.AppError `json:",omitempty"`
}
```

---

## Request Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          REQUEST PROCESSING FLOW                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   1. INPUT               2. PARSE              3. VALIDATE                  │
│   ─────────────────      ─────────────────     ─────────────────            │
│   File/API request  ───▶  Format-specific  ───▶ Schema validation           │
│   (MD/JSON/YAML/CSV)     parser                 + variable resolution        │
│                                                                              │
│   4. NORMALIZE           5. ROUTE              6. EXECUTE                   │
│   ─────────────────      ─────────────────     ─────────────────            │
│   Convert to         ───▶ Select backend   ───▶ Call LLM with               │
│   NormalizedRequest      (Ollama/llama.cpp)    retry logic                  │
│                                                                              │
│   7. TRANSFORM           8. OUTPUT                                          │
│   ─────────────────      ─────────────────                                  │
│   Format response    ───▶ Return via CLI                                    │
│   (text/json/md)         stdout or API                                      │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Backend Priority

When multiple backends are configured, AI Bridge uses this priority:

1. **Explicit override** — `--backend ollama` CLI flag
2. **Model availability** — Check which backend has the requested model loaded
3. **Health status** — Use the healthiest backend
4. **Config default** — Fall back to `ai.backend` config value

```go
func (m *BackendManager) SelectBackend(context stdctx.Context, req *NormalizedRequest) appfault.Result[BackendAdapter] {
    // 1. Explicit override
    if req.BackendOverride != "" {
        if backend, ok := m.backends[req.BackendOverride]; ok {
            return appfault.Ok(backend)
        }
    }
    
    // 2. Check model availability
    for _, backend := range m.backends {
        if backend.HasModel(req.ModelId) && backend.IsAvailable(context) {
            return appfault.Ok(backend)
        }
    }
    
    // 3. Health-based selection
    healthiest := m.getHealthiestBackend()
    if healthiest != nil {
        return appfault.Ok[BackendAdapter](healthiest)
    }
    
    // 4. Config default
    return appfault.Ok(m.backends[m.config.DefaultBackend])
}
```

---

## Retry & Failover

```go
type RetryConfig struct {
    MaxAttempts     int           `yaml:"maxAttempts"`
    InitialDelay    time.Duration `yaml:"initialDelay"`
    MaxDelay        time.Duration `yaml:"maxDelay"`
    BackoffFactor   float64       `yaml:"backoffFactor"`
    RetryableErrors []int         `yaml:"retryableErrors"` // Error codes to retry
}

var DefaultRetryConfig = RetryConfig{
    MaxAttempts:     3,
    InitialDelay:    500 * time.Millisecond,
    MaxDelay:        10 * time.Second,
    BackoffFactor:   2.0,
    RetryableErrors: []int{9200, 9201, 9202}, // Backend connection errors
}
```

---

## Directory Structure

```
cmd/
├── aibridge/
│   └── main.go              # CLI entrypoint
internal/
├── bridge/
│   ├── router.go            # Input router
│   ├── normalizer.go        # Request normalizer
│   └── executor.go          # Execution engine
├── parser/
│   ├── parser.go            # Parser interface
│   ├── markdown.go          # Markdown parser
│   ├── json.go              # JSON parser
│   ├── yaml.go              # YAML parser
│   └── csv.go               # CSV parser
├── backend/
│   ├── adapter.go           # Backend interface
│   ├── ollama.go            # Ollama adapter
│   ├── llamacpp.go          # llama.cpp adapter
│   └── manager.go           # Backend manager
├── daemon/
│   ├── server.go            # HTTP/WebSocket server
│   └── handler.go           # Request handlers
└── config/
    └── config.go            # Configuration
```

---

## See Also

- [Input Formats](./02-input-formats.md)
- [Startup Modes](./03-startup-modes.md)
- [Error Codes](./05-error-codes.md)
