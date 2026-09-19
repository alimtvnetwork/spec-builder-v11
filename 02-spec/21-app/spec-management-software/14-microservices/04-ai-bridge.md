# AI-Bridge Service Specification

> **Phase**: 5  
> **Service ID**: `ai-bridge`  
> **Default Port**: `:8084`  
> **Status**: Specification Complete  
> **Date**: 2026-01-30  
> **Dependencies**: pkg/errors, pkg/logging, pkg/config, pkg/types
**Version:** 1.0.0  

---

## 1. Executive Summary

AI-Bridge is the **unified LLM abstraction layer** that provides a consistent API for interacting with multiple AI model backends. It handles provider routing, streaming responses, model lifecycle management, and failover between Ollama, llama.cpp (router mode), and llama-swap proxy configurations.

### 1.1 Core Responsibilities

| Responsibility | Description |
|----------------|-------------|
| **Provider Abstraction** | Unified interface across Ollama, llama.cpp, llama-swap |
| **Model Routing** | Route requests to appropriate backend based on model ID |
| **Streaming** | Server-Sent Events (SSE) for real-time token streaming |
| **Load Management** | Model loading/unloading, warmup, TTL-based eviction |
| **Failover** | Automatic fallback to secondary providers on failure |
| **Rate Limiting** | Per-model and per-client rate limiting |
| **Metrics** | Token counts, latency tracking, error rates |

### 1.2 Design Principles

1. **Provider Agnostic**: Client code never knows which backend serves the request  
2. **Streaming First**: All completions stream by default; buffered mode is opt-in  
3. **Graceful Degradation**: Service continues with reduced capacity on partial failures  
4. **Observable**: Every request traced with correlation IDs, latency histograms

---

## 2. Architecture

### 2.1 Component Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                            AI-Bridge Service                            │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │   Router    │  │  Provider   │  │   Stream    │  │   Model     │    │
│  │  Middleware │──│   Manager   │──│   Handler   │──│   Registry  │    │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘    │
│         │                │                │                │            │
│         ▼                ▼                ▼                ▼            │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                      Provider Adapters                          │   │
│  ├─────────────────┬─────────────────┬─────────────────────────────┤   │
│  │  OllamaAdapter  │  LlamaAdapter   │  LlamaSwapAdapter           │   │
│  │  (Native API)   │  (Router Mode)  │  (Proxy Mode)               │   │
│  └─────────────────┴─────────────────┴─────────────────────────────┘   │
│                              │                                          │
└──────────────────────────────│──────────────────────────────────────────┘
                               ▼
        ┌──────────────────────┼──────────────────────┐
        │                      │                      │
        ▼                      ▼                      ▼
   ┌─────────┐           ┌─────────┐           ┌─────────┐
   │ Ollama  │           │ llama   │           │ llama   │
   │ :11434  │           │ -server │           │ -swap   │
   │         │           │ :8085   │           │ :8086   │
   └─────────┘           └─────────┘           └─────────┘
```

### 2.2 Package Structure

```
services/ai-bridge/
├── cmd/
│   └── ai-bridge/
│       └── main.go              # Entry point with graceful shutdown
├── internal/
│   ├── config/
│   │   └── config.go            # Service-specific configuration
│   ├── handler/
│   │   ├── completion.go        # /v1/chat/completions endpoint
│   │   ├── models.go            # /v1/models endpoint
│   │   ├── health.go            # Health and readiness probes
│   │   └── stream.go            # SSE streaming utilities
│   ├── provider/
│   │   ├── interface.go         # Provider contract definition
│   │   ├── ollama.go            # Ollama adapter implementation
│   │   ├── llama.go             # llama.cpp adapter (router mode)
│   │   ├── llamaswap.go         # llama-swap proxy adapter
│   │   └── registry.go          # Provider registry and routing
│   ├── model/
│   │   ├── manager.go           # Model lifecycle management
│   │   ├── slot.go              # Model slot allocation
│   │   └── warmup.go            # Model preloading logic
│   ├── middleware/
│   │   ├── ratelimit.go         # Token bucket rate limiting
│   │   ├── metrics.go           # Prometheus metrics collection
│   │   └── trace.go             # Request tracing propagation
│   └── service/
│       └── bridge.go            # Core service orchestration
├── api/
│   └── openapi.yaml             # OpenAPI 3.0 specification
└── Makefile
```

---

## 3. Provider Interface

### 3.1 Core Contract

```go
// File: internal/provider/interface.go
package provider

import (
    stdctx "context"
    "io"
    
    "spec-manager/pkg/errors"
    "spec-manager/pkg/types"
)

// Provider defines the contract all LLM backends must implement.
// Each method MUST propagate context for cancellation and tracing.
type Provider interface {
    // Id returns the unique provider identifier (e.g., "ollama", "llama-router")
    Id() string
    
    // Name returns human-readable provider name
    Name() string
    
    // Available checks if provider is reachable and ready
    Available(context stdctx.Context) bool
    
    // Models returns list of available models on this provider
    Models(context stdctx.Context) appfault.Result[[]ModelInfo]
    
    // LoadModel loads a model into memory (may be no-op for some providers)
    LoadModel(context stdctx.Context, modelId string) *appfault.AppError
    
    // UnloadModel removes model from memory
    UnloadModel(context stdctx.Context, modelId string) *appfault.AppError
    
    // ModelStatus returns current status of a model
    ModelStatus(context stdctx.Context, modelId string) appfault.Result[ModelStatus]
    
    // Complete performs a chat completion (non-streaming)
    Complete(context stdctx.Context, req CompletionRequest) appfault.Result[CompletionResponse]
    
    // Stream performs a streaming chat completion
    // Returns a channel that emits tokens until completion or error
    Stream(context stdctx.Context, req CompletionRequest) appfault.Result[<-chan StreamChunk]
    
    // Embeddings generates embeddings for input text (optional capability)
    Embeddings(context stdctx.Context, req EmbeddingRequest) appfault.Result[EmbeddingResponse]
}

// ModelInfo describes an available model
type ModelInfo struct {
    Id           string
    Name         string
    Provider     string
    Size         int64             // size in bytes
    Parameters   string            // e.g., "7B", "13B"
    Quantization string            // e.g., "Q4_K_M"
    ContextSize  int
    Capabilities []string          // ["chat", "embedding", "vision"]
    Metadata     map[string]string
}

// ModelStatus represents current model state
type ModelStatus string

const (
    ModelStatusUnknown   ModelStatus = "unknown"
    ModelStatusUnloaded  ModelStatus = "unloaded"
    ModelStatusLoading   ModelStatus = "loading"
    ModelStatusLoaded    ModelStatus = "loaded"
    ModelStatusError     ModelStatus = "error"
)

// CompletionRequest mirrors OpenAI chat completion request format
type CompletionRequest struct {
    Model       string
    Messages    []Message
    Temperature float64   `json:",omitempty"`
    MaxTokens   int       `json:",omitempty"`
    TopP        float64   `json:",omitempty"`
    TopK        int       `json:",omitempty"`
    Stop        []string  `json:",omitempty"`
    Stream      bool      `json:",omitempty"`
    
    // Provider-specific options (passed through as raw JSON)
    Options     json.RawMessage `json:",omitempty"`
    
    // Internal tracking
    RequestId   string    `json:"-"`
    ClientId    string    `json:"-"`
}

// Message represents a chat message
type Message struct {
    Role    string // "system", "user", "assistant"
    Content string
}

// CompletionResponse for non-streaming completions
type CompletionResponse struct {
    Id      string
    Model   string
    Created int64
    Choices []Choice
    Usage   Usage
}

// Choice represents a completion choice
type Choice struct {
    Index        int
    Message      Message
    FinishReason string // "stop", "length", "error"
}

// Usage tracks token consumption
type Usage struct {
    PromptTokens     int
    CompletionTokens int
    TotalTokens      int
}

// StreamChunk represents a single streaming token
type StreamChunk struct {
    Id      string
    Model   string
    Created int64
    Delta   *DeltaChoice `json:",omitempty"`
    
    // Error is set if streaming encountered an error
    Error   *appfault.AppError `json:",omitempty"`
    
    // Done signals stream completion
    Done    bool
    
    // Final usage stats (only on last chunk)
    Usage   *Usage       `json:",omitempty"`
}

// DeltaChoice for streaming deltas
type DeltaChoice struct {
    Index        int
    Delta        Delta
    FinishReason string `json:",omitempty"`
}

// Delta contains the incremental content
type Delta struct {
    Role    string `json:",omitempty"`
    Content string `json:",omitempty"`
}

// EmbeddingRequest for generating embeddings
type EmbeddingRequest struct {
    Model string
    Input []string
}

// EmbeddingResponse contains generated embeddings
type EmbeddingResponse struct {
    Model      string
    Embeddings [][]float32
    Usage      Usage
}
```

### 3.2 Provider Errors

```go
// Provider-specific error codes (8xxx range per pkg/errors spec)
const (
    // 8100-8199: Provider connectivity errors
    ErrProviderUnavailable    = 8100  // Provider not reachable
    ErrProviderTimeout        = 8101  // Request timed out
    ErrProviderRejected       = 8102  // Provider rejected request
    
    // 8200-8299: Model errors
    ErrModelNotFound          = 8200  // Model not available on provider
    ErrModelLoadFailed        = 8201  // Failed to load model
    ErrModelBusy              = 8202  // Model is busy/loading
    ErrModelContextExceeded   = 8203  // Input exceeds context window
    
    // 8300-8399: Streaming errors
    ErrStreamInitFailed       = 8300  // Failed to initialize stream
    ErrStreamInterrupted      = 8301  // Stream was interrupted
    ErrStreamTimeout          = 8302  // Stream timed out
    
    // 8400-8499: Rate limiting
    ErrRateLimitExceeded      = 8400  // Too many requests
    ErrQuotaExceeded          = 8401  // Token quota exceeded
    
    // 8500-8599: Routing errors
    ErrNoProviderAvailable    = 8500  // No providers can serve request
    ErrRoutingFailed          = 8501  // Failed to route to provider
    ErrFailoverExhausted      = 8502  // All failover attempts failed
)
```

---

## 4. Provider Implementations

### 4.1 Ollama Adapter

```go
// File: internal/provider/ollama.go
package provider

import (
    "bufio"
    "bytes"
    stdctx "context"
    "encoding/json"
    "fmt"
    "io"
    "net/http"
    "runtime"
    "time"
    
    "spec-manager/pkg/errors"
    "spec-manager/pkg/logging"
)

// OllamaAdapter implements Provider for Ollama server
type OllamaAdapter struct {
    baseUrl    string
    httpClient *http.Client
    logger     *logging.Logger
}

// OllamaConfig for adapter initialization
type OllamaConfig struct {
    Host           string        `mapstructure:"host"`
    Port           int           `mapstructure:"port"`
    Timeout        time.Duration `mapstructure:"timeout"`
    MaxRetries     int           `mapstructure:"max_retries"`
    KeepAlive      string        `mapstructure:"keep_alive"`
}

// NewOllamaAdapter creates a new Ollama provider adapter
// MUST log function entry with file:line for debugging
func NewOllamaAdapter(cfg OllamaConfig, logger *logging.Logger) *OllamaAdapter {
    _, file, line, _ := runtime.Caller(0)
    logger.Info("creating Ollama adapter",
        "func", "NewOllamaAdapter",
        "file", fmt.Sprintf("%s:%d", file, line),
        "host", cfg.Host,
        "port", cfg.Port,
    )
    
    return &OllamaAdapter{
        baseUrl: fmt.Sprintf("http://%s:%d", cfg.Host, cfg.Port),
        httpClient: &http.Client{
            Timeout: cfg.Timeout,
        },
        logger: logger,
    }
}

func (o *OllamaAdapter) Id() string   { return "ollama" }
func (o *OllamaAdapter) Name() string { return "Ollama Server" }

// Available checks if Ollama server is reachable
func (o *OllamaAdapter) Available(context stdctx.Context) bool {
    _, file, line, _ := runtime.Caller(0)
    o.logger.Debug("checking Ollama availability",
        "func", "Available",
        "file", fmt.Sprintf("%s:%d", file, line),
    )
    
    req, err := http.NewRequestWithContext(context, httpmethod.Get.String(), o.baseUrl+"/api/tags", nil)
    if err != nil {
        return false
    }
    
    resp, err := o.httpClient.Do(req)
    if err != nil {
        o.logger.Warn("Ollama unavailable", "error", err)
        return false
    }
    defer resp.Body.Close()
    
    return resp.StatusCode == http.StatusOK
}

// Models returns all models available on Ollama
func (o *OllamaAdapter) Models(context stdctx.Context) appfault.Result[[]ModelInfo] {
    _, file, line, _ := runtime.Caller(0)
    o.logger.Debug("fetching Ollama models",
        "func", "Models",
        "file", fmt.Sprintf("%s:%d", file, line),
    )
    
    req, err := http.NewRequestWithContext(context, httpmethod.Get.String(), o.baseUrl+"/api/tags", nil)
    if err != nil {
        return nil, errors.New(ErrProviderUnavailable, "failed to create request", err)
    }
    
    resp, err := o.httpClient.Do(req)
    if err != nil {
        return nil, errors.New(ErrProviderUnavailable, "failed to fetch models", err)
    }
    defer resp.Body.Close()
    
    // EXEMPTED: External API (Ollama) — lowercase/snake_case keys
    var result struct {
        Models []struct {
            Name       string
            Size       int64
            Digest     string
            ModifiedAt string `json:"modified_at"` // External API: snake_case
            Details    struct {
                Format            string
                Family            string
                ParameterSize     string `json:"parameter_size"`     // External API: snake_case
                QuantizationLevel string `json:"quantization_level"` // External API: snake_case
            }
        }
    }
    
    if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
        return nil, errors.New(ErrProviderUnavailable, "failed to decode response", err)
    }
    
    models := make([]ModelInfo, len(result.Models))
    for i, m := range result.Models {
        models[i] = ModelInfo{
            Id:          m.Name,
            Name:        m.Name,
            Provider:    o.Id(),
            Size:        m.Size,
            Parameters:  m.Details.ParameterSize,
            Quantization: m.Details.QuantizationLevel,
        }
    }
    
    return models, nil
}

// Stream performs streaming chat completion via Ollama
func (o *OllamaAdapter) Stream(context stdctx.Context, req CompletionRequest) appfault.Result[<-chan StreamChunk] {
    _, file, line, _ := runtime.Caller(0)
    o.logger.Info("starting Ollama stream",
        "func", "Stream",
        "file", fmt.Sprintf("%s:%d", file, line),
        "model", req.Model,
        "request_id", req.RequestId,
    )
    
    // Convert to Ollama format
    ollamaReq := o.toOllamaRequest(req)
    ollamaReq["stream"] = true
    
    body, err := json.Marshal(ollamaReq)
    if err != nil {
        return nil, errors.New(ErrStreamInitFailed, "failed to marshal request", err)
    }
    
    httpReq, err := http.NewRequestWithContext(
        context,
        "POST",
        o.baseUrl+"/api/chat",
        bytes.NewReader(body),
    )
    if err != nil {
        return nil, errors.New(ErrStreamInitFailed, "failed to create request", err)
    }
    httpReq.Header.Set("Content-Type", "application/json")
    
    resp, err := o.httpClient.Do(httpReq)
    if err != nil {
        return nil, errors.New(ErrProviderUnavailable, "failed to connect", err)
    }
    
    if resp.StatusCode != http.StatusOK {
        resp.Body.Close()
        return nil, errors.New(ErrProviderRejected,
            fmt.Sprintf("Ollama returned status %d", resp.StatusCode), nil)
    }
    
    chunks := make(chan StreamChunk, 100)
    
    go func() {
        defer close(chunks)
        defer resp.Body.Close()
        
        scanner := bufio.NewScanner(resp.Body)
        // Increase buffer for large responses
        scanner.Buffer(make([]byte, 64*1024), 1024*1024)
        
        for scanner.Scan() {
            select {
            case <-context.Done():
                chunks <- StreamChunk{Error: context.Err(), Done: true}
                return
            default:
            }
            
            line := scanner.Bytes()
            if len(line) == 0 {
                continue
            }
            
            // EXEMPTED: External API (Ollama) — lowercase/snake_case response keys
            var ollamaResp struct {
                Model     string `json:"model"`
                CreatedAt string `json:"created_at"`
                Message   struct {
                    Role    string `json:"role"`
                    Content string `json:"content"`
                } `json:"message"`
                Done bool `json:"done"`
                TotalDuration   int64 `json:"total_duration"`
                PromptEvalCount int   `json:"prompt_eval_count"`
                EvalCount       int   `json:"eval_count"`
            }
            
            if err := json.Unmarshal(line, &ollamaResp); err != nil {
                o.logger.Warn("failed to parse stream chunk",
                    "error", err,
                    "line", string(line),
                )
                continue
            }
            
            chunk := StreamChunk{
                Id:      req.RequestId,
                Model:   ollamaResp.Model,
                Created: time.Now().Unix(),
                Delta: &DeltaChoice{
                    Index: 0,
                    Delta: Delta{
                        Content: ollamaResp.Message.Content,
                    },
                },
                Done: ollamaResp.Done,
            }
            
            if ollamaResp.Done {
                chunk.Usage = &Usage{
                    PromptTokens:     ollamaResp.PromptEvalCount,
                    CompletionTokens: ollamaResp.EvalCount,
                    TotalTokens:      ollamaResp.PromptEvalCount + ollamaResp.EvalCount,
                }
                chunk.Delta.FinishReason = "stop"
            }
            
            chunks <- chunk
        }
        
        if err := scanner.Err(); err != nil {
            o.logger.Error("stream scanner error",
                "func", "Stream",
                "error", err,
            )
            chunks <- StreamChunk{Error: err, Done: true}
        }
    }()
    
    return chunks, nil
}

// EXEMPTED: External API (Ollama) — request/response contract
// OllamaRequest is the typed request body for Ollama API.
type OllamaRequest struct {
    Model    string              `json:"model"`
    Messages []OllamaMessage     `json:"messages"`
    Options  *OllamaOptions      `json:"options,omitempty"`
}

// EXEMPTED: External API (Ollama)
type OllamaMessage struct {
    Role    string `json:"role"`
    Content string `json:"content"`
}

// EXEMPTED: External API (Ollama)
type OllamaOptions struct {
    Temperature float64  `json:"temperature,omitempty"`
    NumPredict  int      `json:"num_predict,omitempty"`
    TopP        float64  `json:"top_p,omitempty"`
    TopK        int      `json:"top_k,omitempty"`
    Stop        []string `json:"stop,omitempty"`
}

// toOllamaRequest converts CompletionRequest to Ollama format
func (o *OllamaAdapter) toOllamaRequest(req CompletionRequest) OllamaRequest {
    messages := make([]OllamaMessage, len(req.Messages))
    for i, m := range req.Messages {
        messages[i] = OllamaMessage{
            Role:    m.Role,
            Content: m.Content,
        }
    }
    
    result := OllamaRequest{
        Model:    req.Model,
        Messages: messages,
    }
    
    opts := OllamaOptions{}
    hasOpts := false
    if req.Temperature > 0 {
        opts.Temperature = req.Temperature
        hasOpts = true
    }
    if req.MaxTokens > 0 {
        opts.NumPredict = req.MaxTokens
        hasOpts = true
    }
    if req.TopP > 0 {
        opts.TopP = req.TopP
        hasOpts = true
    }
    if req.TopK > 0 {
        opts.TopK = req.TopK
        hasOpts = true
    }
    if len(req.Stop) > 0 {
        opts.Stop = req.Stop
        hasOpts = true
    }
    
    if hasOpts {
        result.Options = &opts
    }
    
    return result
}

// LoadModel triggers model loading in Ollama
func (o *OllamaAdapter) LoadModel(context stdctx.Context, modelId string) error {
    _, file, line, _ := runtime.Caller(0)
    o.logger.Info("loading model in Ollama",
        "func", "LoadModel",
        "file", fmt.Sprintf("%s:%d", file, line),
        "model", modelId,
    )
    
    // Ollama auto-loads on first request, but we can prime it
    body, _ := json.Marshal(OllamaRequest{
        Model: modelId,
        Messages: []OllamaMessage{
            {Role: "user", Content: "hi"},
        },
        Options: &OllamaOptions{
            NumPredict: 1,
        },
    })
    
    req, err := http.NewRequestWithContext(context, httpmethod.Post.String(), o.baseUrl+"/api/chat", bytes.NewReader(body))
    if err != nil {
        return errors.New(ErrModelLoadFailed, "failed to create request", err)
    }
    req.Header.Set("Content-Type", "application/json")
    
    resp, err := o.httpClient.Do(req)
    if err != nil {
        return errors.New(ErrModelLoadFailed, "failed to load model", err)
    }
    defer resp.Body.Close()
    
    // Drain response
    io.Copy(io.Discard, resp.Body)
    
    if resp.StatusCode != http.StatusOK {
        return errors.New(ErrModelLoadFailed,
            fmt.Sprintf("Ollama returned status %d", resp.StatusCode), nil)
    }
    
    return nil
}

// ModelStatus checks if model is loaded in Ollama
func (o *OllamaAdapter) ModelStatus(context stdctx.Context, modelId string) appfault.Result[ModelStatus] {
    req, err := http.NewRequestWithContext(context, httpmethod.Get.String(), o.baseUrl+"/api/ps", nil)
    if err != nil {
        return appfault.FailNew[ModelStatus](ErrProviderUnavailable, "failed to create request")
    }
    
    resp, err := o.httpClient.Do(req)
    if err != nil {
        return appfault.FailNew[ModelStatus](ErrProviderUnavailable, "failed to check status")
    }
    defer resp.Body.Close()
    
    // EXEMPTED: External API (Ollama) — lowercase keys
    var result struct {
        Models []struct {
            Name string `json:"name"`
        } `json:"models"`
    }
    
    if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
        return appfault.FailNew[ModelStatus](ErrProviderUnavailable, "failed to decode response")
    }
    
    for _, m := range result.Models {
        if m.Name == modelId {
            return appfault.Ok(ModelStatusLoaded)
        }
    }
    
    return appfault.Ok(ModelStatusUnloaded)
}

// Complete performs non-streaming completion
func (o *OllamaAdapter) Complete(context stdctx.Context, req CompletionRequest) appfault.Result[CompletionResponse] {
    _, file, line, _ := runtime.Caller(0)
    o.logger.Info("Ollama completion request",
        "func", "Complete",
        "file", fmt.Sprintf("%s:%d", file, line),
        "model", req.Model,
        "request_id", req.RequestId,
    )
    
    ollamaReq := o.toOllamaRequest(req)
    ollamaReq["stream"] = false
    
    body, err := json.Marshal(ollamaReq)
    if err != nil {
        return appfault.FailNew[CompletionResponse](ErrProviderUnavailable, "failed to marshal request")
    }
    
    httpReq, err := http.NewRequestWithContext(context, httpmethod.Post.String(), o.baseUrl+"/api/chat", bytes.NewReader(body))
    if err != nil {
        return appfault.FailNew[CompletionResponse](ErrProviderUnavailable, "failed to create request")
    }

    httpReq.Header.Set("Content-Type", "application/json")
    
    resp, err := o.httpClient.Do(httpReq)
    if err != nil {
        return appfault.FailNew[CompletionResponse](ErrProviderUnavailable, "failed to connect")
    }
    defer resp.Body.Close()
    
    if resp.StatusCode != http.StatusOK {
        bodyBytes, _ := io.ReadAll(resp.Body)
        return appfault.FailNew[CompletionResponse](
            ErrProviderRejected,
            fmt.Sprintf("Ollama returned %d: %s", resp.StatusCode, string(bodyBytes)),
        )
    }
    
    // EXEMPTED: External API (Ollama) — lowercase/snake_case response keys
    var ollamaResp struct {
        Model     string `json:"model"`
        CreatedAt string `json:"created_at"`
        Message   struct {
            Role    string `json:"role"`
            Content string `json:"content"`
        } `json:"message"`
        PromptEvalCount int `json:"prompt_eval_count"`
        EvalCount       int `json:"eval_count"`
    }
    
    if err := json.NewDecoder(resp.Body).Decode(&ollamaResp); err != nil {
        return appfault.FailNew[CompletionResponse](ErrProviderUnavailable, "failed to decode response")
    }
    
    return appfault.Ok(CompletionResponse{
        Id:      req.RequestId,
        Model:   ollamaResp.Model,
        Created: time.Now().Unix(),
        Choices: []Choice{
            {
                Index: 0,
                Message: Message{
                    Role:    ollamaResp.Message.Role,
                    Content: ollamaResp.Message.Content,
                },
                FinishReason: "stop",
            },
        },
        Usage: Usage{
            PromptTokens:     ollamaResp.PromptEvalCount,
            CompletionTokens: ollamaResp.EvalCount,
            TotalTokens:      ollamaResp.PromptEvalCount + ollamaResp.EvalCount,
        },
    })
}

// UnloadModel is a no-op for Ollama (managed by keep_alive)
func (o *OllamaAdapter) UnloadModel(context stdctx.Context, modelId string) error {
    o.logger.Info("Ollama unload requested (managed by keep_alive)",
        "model", modelId,
    )
    return nil
}

// Embeddings generates embeddings via Ollama
func (o *OllamaAdapter) Embeddings(context stdctx.Context, req EmbeddingRequest) appfault.Result[EmbeddingResponse] {
    _, file, line, _ := runtime.Caller(0)
    o.logger.Info("Ollama embedding request",
        "func", "Embeddings",
        "file", fmt.Sprintf("%s:%d", file, line),
        "model", req.Model,
        "input_count", len(req.Input),
    )
    
    embeddings := make([][]float32, len(req.Input))
    totalTokens := 0
    
    for i, input := range req.Input {
        // EXEMPTED: External API (Ollama) — lowercase keys
        // OllamaEmbeddingRequest is the typed request for Ollama embedding endpoint.
        type OllamaEmbeddingRequest struct {
            Model  string `json:"model"`
            Prompt string `json:"prompt"`
        }
        body, _ := json.Marshal(OllamaEmbeddingRequest{
            Model:  req.Model,
            Prompt: input,
        })
        
        httpReq, err := http.NewRequestWithContext(context, httpmethod.Post.String(), o.baseUrl+"/api/embeddings", bytes.NewReader(body))
        if err != nil {
            return appfault.FailNew[EmbeddingResponse](ErrProviderUnavailable, "failed to create request")
        }

        httpReq.Header.Set("Content-Type", "application/json")
        
        resp, err := o.httpClient.Do(httpReq)
        if err != nil {
            return appfault.FailNew[EmbeddingResponse](ErrProviderUnavailable, "failed to get embedding")
        }
        
        // EXEMPTED: External API (Ollama) — lowercase keys
        var embResp struct {
            Embedding []float32 `json:"embedding"`
        }
        json.NewDecoder(resp.Body).Decode(&embResp)
        resp.Body.Close()
        
        embeddings[i] = embResp.Embedding
        totalTokens += len(input) / 4 // Rough estimate
    }
    
    return appfault.Ok(EmbeddingResponse{
        Model:      req.Model,
        Embeddings: embeddings,
        Usage: Usage{
            PromptTokens: totalTokens,
            TotalTokens:  totalTokens,
        },
    }, nil
}
```

### 4.2 llama.cpp Router Mode Adapter

```go
// File: internal/provider/llama.go
package provider

import (
    "bufio"
    "bytes"
    stdctx "context"
    "encoding/json"
    "fmt"
    "net/http"
    "runtime"
    "strings"
    "time"
    
    "spec-manager/pkg/errors"
    "spec-manager/pkg/logging"
)

// LlamaAdapter implements Provider for llama.cpp server in router mode
type LlamaAdapter struct {
    baseUrl    string
    modelsDir  string
    httpClient *http.Client
    logger     *logging.Logger
}

// LlamaConfig for llama.cpp adapter
type LlamaConfig struct {
    Host       string        `mapstructure:"host"`
    Port       int           `mapstructure:"port"`
    ModelsDir  string        `mapstructure:"models_dir"`
    RouterMode bool          `mapstructure:"router_mode"`
    Timeout    time.Duration `mapstructure:"timeout"`
}

// NewLlamaAdapter creates a new llama.cpp provider adapter
func NewLlamaAdapter(cfg LlamaConfig, logger *logging.Logger) *LlamaAdapter {
    _, file, line, _ := runtime.Caller(0)
    logger.Info("creating llama.cpp adapter",
        "func", "NewLlamaAdapter",
        "file", fmt.Sprintf("%s:%d", file, line),
        "host", cfg.Host,
        "port", cfg.Port,
        "router_mode", cfg.RouterMode,
    )
    
    return &LlamaAdapter{
        baseUrl:   fmt.Sprintf("http://%s:%d", cfg.Host, cfg.Port),
        modelsDir: cfg.ModelsDir,
        httpClient: &http.Client{
            Timeout: cfg.Timeout,
        },
        logger: logger,
    }
}

func (l *LlamaAdapter) ID() string   { return "llama-router" }
func (l *LlamaAdapter) Name() string { return "llama.cpp Router" }

// Available checks if llama-server is reachable
func (l *LlamaAdapter) Available(context stdctx.Context) bool {
    req, err := http.NewRequestWithContext(context, httpmethod.Get.String(), l.baseUrl+"/health", nil)
    if err != nil {
        return false
    }
    
    resp, err := l.httpClient.Do(req)
    if err != nil {
        l.logger.Warn("llama-server unavailable", "error", err)
        return false
    }
    defer resp.Body.Close()
    
    return resp.StatusCode == http.StatusOK
}

// Models returns models available in router mode
func (l *LlamaAdapter) Models(context stdctx.Context) appfault.Result[[]ModelInfo] {
    _, file, line, _ := runtime.Caller(0)
    l.logger.Debug("fetching llama.cpp models",
        "func", "Models",
        "file", fmt.Sprintf("%s:%d", file, line),
    )
    
    req, err := http.NewRequestWithContext(context, httpmethod.Get.String(), l.baseUrl+"/models", nil)
    if err != nil {
        return nil, errors.New(ErrProviderUnavailable, "failed to create request", err)
    }
    
    resp, err := l.httpClient.Do(req)
    if err != nil {
        return nil, errors.New(ErrProviderUnavailable, "failed to fetch models", err)
    }
    defer resp.Body.Close()
    
    // EXEMPTED: External API (OpenAI-compatible) — lowercase keys
    var result struct {
        Data []struct {
            Id     string `json:"id"`
            Object string `json:"object"`
        } `json:"data"`
    }
    
    if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
        return nil, errors.New(ErrProviderUnavailable, "failed to decode response", err)
    }
    
    models := make([]ModelInfo, len(result.Data))
    for i, m := range result.Data {
        models[i] = ModelInfo{
            Id:       m.Id,
            Name:     m.Id,
            Provider: l.Id(),
        }
    }
    
    return models, nil
}

// LoadModel loads a model in router mode
func (l *LlamaAdapter) LoadModel(context stdctx.Context, modelId string) *appfault.AppError {
    _, file, line, _ := runtime.Caller(0)
    l.logger.Info("loading model in llama.cpp",
        "func", "LoadModel",
        "file", fmt.Sprintf("%s:%d", file, line),
        "model", modelId,
    )
    
    // In router mode, POST to /models/load
    body, _ := json.Marshal(map[string]string{
        "model": l.modelsDir + "/" + modelId,
    })
    
    req, err := http.NewRequestWithContext(context, httpmethod.Post.String(), l.baseUrl+"/models/load", bytes.NewReader(body))
    if err != nil {
        return errors.New(ErrModelLoadFailed, "failed to create request", err)
    }
    req.Header.Set("Content-Type", "application/json")
    
    resp, err := l.httpClient.Do(req)
    if err != nil {
        return errors.New(ErrModelLoadFailed, "failed to load model", err)
    }
    defer resp.Body.Close()
    
    if resp.StatusCode != http.StatusOK {
        return errors.New(ErrModelLoadFailed,
            fmt.Sprintf("llama-server returned %d", resp.StatusCode), nil)
    }
    
    return nil
}

// Stream performs streaming completion via llama.cpp OpenAI-compatible endpoint
func (l *LlamaAdapter) Stream(context stdctx.Context, req CompletionRequest) appfault.Result[<-chan StreamChunk] {
    _, file, line, _ := runtime.Caller(0)
    l.logger.Info("starting llama.cpp stream",
        "func", "Stream",
        "file", fmt.Sprintf("%s:%d", file, line),
        "model", req.Model,
        "request_id", req.RequestId,
    )
    
    // EXEMPTED: External API (OpenAI-compatible) — lowercase/snake_case keys
    // OpenAiStreamRequest is the typed request for OpenAI-compatible streaming endpoint.
    type OpenAiStreamRequest struct {
        Model       string        `json:"model"`
        Messages    []ChatMessage `json:"messages"`
        Stream      bool          `json:"stream"`
        Temperature float64       `json:"temperature,omitempty"`
        MaxTokens   int           `json:"max_tokens,omitempty"`
        TopP        float64       `json:"top_p,omitempty"`
        Stop        []string      `json:"stop,omitempty"`
    }

    // Use OpenAI-compatible endpoint
    openaiReq := OpenAiStreamRequest{
        Model:    req.Model,
        Messages: req.Messages,
        Stream:   true,
    }
    
    if req.Temperature > 0 {
        openaiReq.Temperature = req.Temperature
    }
    if req.MaxTokens > 0 {
        openaiReq.MaxTokens = req.MaxTokens
    }
    if req.TopP > 0 {
        openaiReq.TopP = req.TopP
    }
    if len(req.Stop) > 0 {
        openaiReq.Stop = req.Stop
    }
    
    body, err := json.Marshal(openaiReq)
    if err != nil {
        return nil, errors.New(ErrStreamInitFailed, "failed to marshal request", err)
    }
    
    httpReq, err := http.NewRequestWithContext(context, httpmethod.Post.String(), l.baseUrl+"/v1/chat/completions", bytes.NewReader(body))
    if err != nil {
        return nil, errors.New(ErrStreamInitFailed, "failed to create request", err)
    }
    httpReq.Header.Set("Content-Type", "application/json")
    httpReq.Header.Set("Accept", "text/event-stream")
    
    resp, err := l.httpClient.Do(httpReq)
    if err != nil {
        return nil, errors.New(ErrProviderUnavailable, "failed to connect", err)
    }
    
    if resp.StatusCode != http.StatusOK {
        resp.Body.Close()
        return nil, errors.New(ErrProviderRejected,
            fmt.Sprintf("llama-server returned %d", resp.StatusCode), nil)
    }
    
    chunks := make(chan StreamChunk, 100)
    
    go func() {
        defer close(chunks)
        defer resp.Body.Close()
        
        scanner := bufio.NewScanner(resp.Body)
        
        for scanner.Scan() {
            select {
            case <-context.Done():
                chunks <- StreamChunk{Error: context.Err(), Done: true}
                return
            default:
            }
            
            line := scanner.Text()
            
            // SSE format: "data: {...}"
            if stringutil.IsMissingPrefix(line, "data: ") {
                continue
            }
            
            data := strings.TrimPrefix(line, "data: ")
            if data == "[DONE]" {
                chunks <- StreamChunk{Done: true}
                return
            }
            
            // EXEMPTED: External API (OpenAI-compatible) — SSE response format
            var sseResp struct {
                Id      string `json:"id"`
                Model   string `json:"model"`
                Created int64  `json:"created"`
                Choices []struct {
                    Index int `json:"index"`
                    Delta struct {
                        Role    string `json:"role"`
                        Content string `json:"content"`
                    } `json:"delta"`
                    FinishReason string `json:"finish_reason"`
                } `json:"choices"`
            }
            
            if err := json.Unmarshal([]byte(data), &sseResp); err != nil {
                l.logger.Warn("failed to parse SSE chunk", "error", err)
                continue
            }
            
            if len(sseResp.Choices) > 0 {
                choice := sseResp.Choices[0]
                chunks <- StreamChunk{
                    Id:      sseResp.Id,
                    Model:   sseResp.Model,
                    Created: sseResp.Created,
                    Delta: &DeltaChoice{
                        Index: choice.Index,
                        Delta: Delta{
                            Role:    choice.Delta.Role,
                            Content: choice.Delta.Content,
                        },
                        FinishReason: choice.FinishReason,
                    },
                    Done: choice.FinishReason != "",
                }
            }
        }
        
        if err := scanner.Err(); err != nil {
            l.logger.Error("SSE scanner error", "error", err)
            chunks <- StreamChunk{Error: err, Done: true}
        }
    }()
    
    return chunks, nil
}

// Complete, UnloadModel, ModelStatus, Embeddings implementations follow same pattern...
// (Abbreviated for specification - full implementation mirrors Ollama adapter structure)

func (l *LlamaAdapter) Complete(context stdctx.Context, req CompletionRequest) appfault.Result[CompletionResponse] {
    // Implementation using /v1/chat/completions with stream: false
    // Returns parsed CompletionResponse
    return appfault.FailNew[CompletionResponse](ErrProviderUnavailable, "not implemented")
}

func (l *LlamaAdapter) UnloadModel(context stdctx.Context, modelId string) error {
    body, _ := json.Marshal(map[string]string{"model": modelId})
    req, _ := http.NewRequestWithContext(context, httpmethod.Post.String(), l.baseUrl+"/models/unload", bytes.NewReader(body))
    req.Header.Set("Content-Type", "application/json")
    resp, err := l.httpClient.Do(req)
    if err != nil {
        return errors.New(ErrModelLoadFailed, "failed to unload", err)
    }
    resp.Body.Close()
    return nil
}

func (l *LlamaAdapter) ModelStatus(context stdctx.Context, modelId string) appfault.Result[ModelStatus] {
    return appfault.Ok(ModelStatusUnknown)
}

func (l *LlamaAdapter) Embeddings(context stdctx.Context, req EmbeddingRequest) appfault.Result[EmbeddingResponse] {
    return appfault.FailNew[EmbeddingResponse](ErrProviderUnavailable, "embeddings not supported")
}
```

### 4.3 llama-swap Proxy Adapter

```go
// File: internal/provider/llamaswap.go
package provider

import (
    stdctx "context"
    "fmt"
    "runtime"
    "time"
    
    "spec-manager/pkg/logging"
)

// LlamaSwapAdapter implements Provider for llama-swap proxy
// llama-swap automatically handles model loading/swapping based on request
type LlamaSwapAdapter struct {
    *LlamaAdapter  // Embed LlamaAdapter - same OpenAI-compatible API
    swapConfig     LlamaSwapConfig
}

// LlamaSwapConfig for llama-swap proxy
type LlamaSwapConfig struct {
    Host          string            `mapstructure:"host"`
    Port          int               `mapstructure:"port"`
    Timeout       time.Duration     `mapstructure:"timeout"`
    Models        map[string]string `mapstructure:"models"`  // model alias -> file
    DefaultModel  string            `mapstructure:"default_model"`
}

// NewLlamaSwapAdapter creates adapter for llama-swap proxy
func NewLlamaSwapAdapter(cfg LlamaSwapConfig, logger *logging.Logger) *LlamaSwapAdapter {
    _, file, line, _ := runtime.Caller(0)
    logger.Info("creating llama-swap adapter",
        "func", "NewLlamaSwapAdapter",
        "file", fmt.Sprintf("%s:%d", file, line),
        "host", cfg.Host,
        "port", cfg.Port,
        "models_count", len(cfg.Models),
    )
    
    // llama-swap uses same API as llama-server
    llamaAdapter := &LlamaAdapter{
        baseUrl: fmt.Sprintf("http://%s:%d", cfg.Host, cfg.Port),
        httpClient: &http.Client{
            Timeout: cfg.Timeout,
        },
        logger: logger,
    }
    
    return &LlamaSwapAdapter{
        LlamaAdapter: llamaAdapter,
        swapConfig:   cfg,
    }
}

func (ls *LlamaSwapAdapter) ID() string   { return "llama-swap" }
func (ls *LlamaSwapAdapter) Name() string { return "llama-swap Proxy" }

// LoadModel is a no-op - llama-swap auto-loads on request
func (ls *LlamaSwapAdapter) LoadModel(context stdctx.Context, modelId string) error {
    ls.logger.Info("llama-swap auto-loads on request",
        "model", modelId,
    )
    return nil
}

// UnloadModel triggers TTL-based unload in llama-swap
func (ls *LlamaSwapAdapter) UnloadModel(context stdctx.Context, modelId string) error {
    ls.logger.Info("llama-swap manages unload via TTL",
        "model", modelId,
    )
    return nil
}

// Models returns configured models from swap config
func (ls *LlamaSwapAdapter) Models(context stdctx.Context) appfault.Result[[]ModelInfo] {
    models := make([]ModelInfo, 0, len(ls.swapConfig.Models))
    for alias := range ls.swapConfig.Models {
        models = append(models, ModelInfo{
            Id:       alias,
            Name:     alias,
            Provider: ls.Id(),
        })
    }

    return appfault.Ok(models)
}
```

---

## 5. Provider Registry and Routing

### 5.1 Registry Implementation

```go
// File: internal/provider/registry.go
package provider

import (
    stdctx "context"
    "fmt"
    "runtime"
    "sync"
    
    "spec-manager/pkg/errors"
    "spec-manager/pkg/logging"
)

// Registry manages provider instances and routes requests
type Registry struct {
    mu          sync.RWMutex
    providers   map[string]Provider
    modelRoutes map[string][]ModelRoute  // model -> ordered providers
    logger      *logging.Logger
}

// ModelRoute defines routing priority for a model
type ModelRoute struct {
    ProviderId string
    Priority   int
    Fallback   bool
}

// NewRegistry creates a provider registry
func NewRegistry(logger *logging.Logger) *Registry {
    _, file, line, _ := runtime.Caller(0)
    logger.Info("creating provider registry",
        "func", "NewRegistry",
        "file", fmt.Sprintf("%s:%d", file, line),
    )
    
    return &Registry{
        providers:   make(map[string]Provider),
        modelRoutes: make(map[string][]ModelRoute),
        logger:      logger,
    }
}

// Register adds a provider to the registry
func (r *Registry) Register(p Provider) error {
    r.mu.Lock()
    defer r.mu.Unlock()
    
    _, file, line, _ := runtime.Caller(0)
    r.logger.Info("registering provider",
        "func", "Register",
        "file", fmt.Sprintf("%s:%d", file, line),
        "provider_id", p.Id(),
        "provider_name", p.Name(),
    )
    
    if _, exists := r.providers[p.Id()]; exists {
        return errors.New(ErrRoutingFailed,
            fmt.Sprintf("provider %s already registered", p.Id()), nil)
    }
    
    r.providers[p.Id()] = p
    return nil
}

// AddRoute configures routing for a model
func (r *Registry) AddRoute(modelId string, route ModelRoute) {
    r.mu.Lock()
    defer r.mu.Unlock()
    
    r.modelRoutes[modelId] = append(r.modelRoutes[modelId], route)
    
    // Sort by priority (lower = higher priority)
    routes := r.modelRoutes[modelId]
    for i := 0; i < len(routes)-1; i++ {
        for j := i + 1; j < len(routes); j++ {
            if routes[j].Priority < routes[i].Priority {
                routes[i], routes[j] = routes[j], routes[i]
            }
        }
    }
}

// GetProvider returns provider for a model with failover support
func (r *Registry) GetProvider(context stdctx.Context, modelId string) appfault.Result[Provider] {
    r.mu.RLock()
    defer r.mu.RUnlock()
    
    _, file, line, _ := runtime.Caller(0)
    
    routes, exists := r.modelRoutes[modelId]
    if !exists || len(routes) == 0 {
        // Try to find any provider that has this model
        return r.findProviderWithModel(context, modelId)
    }
    
    // Try providers in priority order
    var lastErr *appfault.AppError
    for _, route := range routes {
        provider, ok := r.providers[route.ProviderId]
        if !ok {
            continue
        }
        
        if provider.Available(context) {
            r.logger.Debug("routing to provider",
                "func", "GetProvider",
                "file", fmt.Sprintf("%s:%d", file, line),
                "model", modelId,
                "provider", route.ProviderId,
            )

            return appfault.Ok[Provider](provider)
        }
        
        lastErr = appfault.New(
            ErrProviderUnavailable,
            fmt.Sprintf("provider %s unavailable", route.ProviderId),
        )
    }
    
    if lastErr != nil {
        return appfault.FailNew[Provider](
            ErrFailoverExhausted,
            "all providers for model unavailable",
        )
    }
    
    return appfault.FailNew[Provider](
        ErrNoProviderAvailable,
        fmt.Sprintf("no provider configured for model %s", modelId),
    )
}

// findProviderWithModel searches all providers for a model
func (r *Registry) findProviderWithModel(context stdctx.Context, modelId string) appfault.Result[Provider] {
    for _, p := range r.providers {
        if !p.Available(context) {
            continue
        }
        
        modelsResult := p.Models(context)
        if modelsResult.HasError() {
            continue
        }
        
        for _, m := range modelsResult.Value() {
            if m.Id == modelId {
                return appfault.Ok[Provider](p)
            }
        }
    }
    
    return appfault.FailNew[Provider](
        ErrModelNotFound,
        fmt.Sprintf("model %s not found on any provider", modelId),
    )
}

// AllModels returns models from all providers
func (r *Registry) AllModels(context stdctx.Context) appfault.Result[[]ModelInfo] {
    r.mu.RLock()
    defer r.mu.RUnlock()
    
    var allModels []ModelInfo
    seen := make(map[string]bool)
    
    for _, p := range r.providers {
        if !p.Available(context) {
            continue
        }
        
        modelsResult := p.Models(context)
        if modelsResult.HasError() {
            r.logger.Warn("failed to get models from provider",
                "provider", p.Id(),
                "error", modelsResult.Error(),
            )
            continue
        }
        
        for _, m := range modelsResult.Value() {
            if !seen[m.Id] {
                seen[m.Id] = true
                allModels = append(allModels, m)
            }
        }
    }
    
    return appfault.Ok(allModels)
}

// HealthCheck returns status of all providers
func (r *Registry) HealthCheck(context stdctx.Context) map[string]bool {
    r.mu.RLock()
    defer r.mu.RUnlock()
    
    status := make(map[string]bool)
    for id, p := range r.providers {
        status[id] = p.Available(context)
    }
    return status
}
```

---

## 6. Streaming Handler

### 6.1 SSE Stream Handler

```go
// File: internal/handler/stream.go
package handler

import (
    stdctx "context"
    "encoding/json"
    "fmt"
    "net/http"
    "runtime"
    "time"
    
    "spec-manager/pkg/errors"
    "spec-manager/pkg/logging"
    "spec-manager/services/ai-bridge/internal/provider"
)

// StreamHandler manages SSE streaming responses
type StreamHandler struct {
    registry *provider.Registry
    logger   *logging.Logger
}

// NewStreamHandler creates a stream handler
func NewStreamHandler(registry *provider.Registry, logger *logging.Logger) *StreamHandler {
    return &StreamHandler{
        registry: registry,
        logger:   logger,
    }
}

// HandleStream processes a streaming completion request
func (h *StreamHandler) HandleStream(w http.ResponseWriter, r *http.Request) {
    _, file, line, _ := runtime.Caller(0)
    context := r.Context()
    requestId := ctxutil.GetRequestId(context)
    
    h.logger.Info("handling stream request",
        "func", "HandleStream",
        "file", fmt.Sprintf("%s:%d", file, line),
        LogKeyRequestId, requestId,
    )
    
    // Parse request
    var req provider.CompletionRequest
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        h.writeError(w, errors.New(errors.ErrValidation, "invalid request body", err))
        return
    }
    req.RequestId = requestId
    req.Stream = true
    
    // Get provider for model
    p, err := h.registry.GetProvider(context, req.Model)
    if err != nil {
        h.writeError(w, err)
        return
    }
    
    // Set SSE headers
    w.Header().Set("Content-Type", "text/event-stream")
    w.Header().Set("Cache-Control", "no-cache")
    w.Header().Set("Connection", "keep-alive")
    w.Header().Set("X-Request-Id", requestId)
    
    flusher, ok := w.(http.Flusher)
    if !ok {
        h.writeError(w, errors.New(provider.ErrStreamInitFailed, "streaming not supported", nil))
        return
    }
    
    // Start streaming
    chunks, err := p.Stream(context, req)
    if err != nil {
        h.writeError(w, err)
        return
    }
    
    // Stream chunks to client
    for chunk := range chunks {
        if chunk.Error != nil {
            h.logger.Error("stream error",
                "func", "HandleStream",
                "request_id", requestId,
                "error", chunk.Error,
            )
            // Send error event
            h.writeSSE(w, "error", map[string]string{
                "message": chunk.Error.Error(),
            })
            flusher.Flush()
            return
        }
        
        // EXEMPTED: External API (OpenAI-compatible) — SSE output format
        // SseChunkData is the typed SSE chunk for OpenAI-compatible streaming.
        type SseChunkData struct {
            Id      string         `json:"id"`
            Object  string         `json:"object"`
            Created int64          `json:"created"`
            Model   string         `json:"model"`
            Choices []SseChoice    `json:"choices"`
            Usage   *StreamUsage   `json:"usage,omitempty"`
        }
        // EXEMPTED: External API (OpenAI-compatible)
        type SseChoice struct {
            Index        int       `json:"index"`
            Delta        SseDelta  `json:"delta"`
            FinishReason *string   `json:"finish_reason"`
        }
        // EXEMPTED: External API (OpenAI-compatible)
        type SseDelta struct {
            Content string `json:"content,omitempty"`
        }

        // Format as OpenAI-compatible SSE
        data := SseChunkData{
            Id:      chunk.Id,
            Object:  "chat.completion.chunk",
            Created: chunk.Created,
            Model:   chunk.Model,
            Choices: []SseChoice{
                {
                    Index: 0,
                    Delta: SseDelta{
                        Content: chunk.Delta.Delta.Content,
                    },
                },
            },
        }
        
        if chunk.Done {
            stop := "stop"
            data.Choices[0].FinishReason = &stop
            if chunk.Usage != nil {
                data.Usage = chunk.Usage
            }
        }
        
        h.writeSSE(w, "data", data)
        flusher.Flush()
        
        if chunk.Done {
            // Send [DONE] marker
            fmt.Fprintf(w, "data: [DONE]\n\n")
            flusher.Flush()
            return
        }
    }
}

// writeSSE writes an SSE event — uses json.Marshal which accepts any serializable struct
func (h *StreamHandler) writeSSE(w http.ResponseWriter, event string, data json.Marshaler) {
    jsonData, err := json.Marshal(data)
    if err != nil {
        h.logger.Error("failed to marshal SSE data", "error", err)
        return
    }
    
    if event != "data" {
        fmt.Fprintf(w, "event: %s\n", event)
    }
    fmt.Fprintf(w, "data: %s\n\n", jsonData)
}

// StreamErrorResponse is the typed error envelope for stream error responses.
type StreamErrorResponse struct {
    Error StreamErrorDetail
}
type StreamErrorDetail struct {
    Code    int
    Message string
    Stack   string `json:",omitempty"`
}

// writeError writes an error response
func (h *StreamHandler) writeError(w http.ResponseWriter, err error) {
    w.Header().Set("Content-Type", "application/json")
    
    appErr, ok := err.(*errors.AppError)
    if !ok {
        appErr = errors.New(errors.ErrInternal, err.Error(), err)
    }
    
    status := http.StatusInternalServerError
    switch {
    case appErr.Code >= 8100 && appErr.Code < 8200:
        status = http.StatusServiceUnavailable
    case appErr.Code >= 8200 && appErr.Code < 8300:
        status = http.StatusNotFound
    case appErr.Code >= 8400 && appErr.Code < 8500:
        status = http.StatusTooManyRequests
    }
    
    w.WriteHeader(status)
    json.NewEncoder(w).Encode(StreamErrorResponse{
        Error: StreamErrorDetail{
            Code:    appErr.Code,
            Message: appErr.Message,
            Stack:   appErr.Stack,
        },
    })
}
```

---

## 7. Configuration

### 7.1 Service Configuration

```yaml
# config/ai-bridge.yaml
service:
  id: "ai-bridge"
  host: "127.0.0.1"
  port: 8084
  
logging:
  level: "info"
  format: "json"
  add_source: true  # REQUIRED: log func name and file:line

providers:
  ollama:
    enabled: true
    host: "127.0.0.1"
    port: 11434
    timeout: "120s"
    keep_alive: "5m"
    max_loaded_models: 3
    
  llama:
    enabled: true
    mode: "router"  # "single", "router", or "swap"
    host: "127.0.0.1"
    port: 8085
    models_dir: "/models"
    timeout: "120s"
    
  llama_swap:
    enabled: false
    host: "127.0.0.1"
    port: 8086
    timeout: "120s"
    models:
      llama3: "llama3.gguf"
      mistral: "mistral.gguf"
      deepseek: "deepseek-r1.gguf"

routing:
  default_provider: "ollama"
  models:
    - id: "llama3"
      providers:
        - id: "ollama"
          priority: 1
        - id: "llama-router"
          priority: 2
          fallback: true
    - id: "deepseek-r1"
      providers:
        - id: "llama-router"
          priority: 1
    - id: "whisper"
      providers:
        - id: "llama-swap"
          priority: 1

rate_limit:
  enabled: true
  requests_per_minute: 60
  tokens_per_minute: 100000
  
metrics:
  enabled: true
  endpoint: "/metrics"
```

---

## 8. API Endpoints

### 8.1 OpenAPI Specification

```yaml
# api/openapi.yaml
openapi: 3.0.3
info:
  title: AI-Bridge Service API
  version: 1.0.0
  description: Unified LLM abstraction layer

servers:
  - url: http://localhost:8084

paths:
  /v1/chat/completions:
    post:
      summary: Create chat completion
      description: Streams or returns chat completion from configured LLM provider
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CompletionRequest'
      responses:
        '200':
          description: Completion response (streaming or buffered)
          content:
            text/event-stream:
              schema:
                type: string
            application/json:
              schema:
                $ref: '#/components/schemas/CompletionResponse'
        '404':
          description: Model not found
        '429':
          description: Rate limit exceeded
        '503':
          description: No provider available
          
  /v1/models:
    get:
      summary: List available models
      responses:
        '200':
          description: List of models
          content:
            application/json:
              schema:
                type: object
                properties:
                  data:
                    type: array
                    items:
                      $ref: '#/components/schemas/ModelInfo'
                      
  /v1/models/{model_id}/load:
    post:
      summary: Preload a model
      parameters:
        - name: model_id
          in: path
          required: true
          schema:
            type: string
      responses:
        '200':
          description: Model loaded
        '404':
          description: Model not found
          
  /v1/models/{model_id}/unload:
    post:
      summary: Unload a model
      parameters:
        - name: model_id
          in: path
          required: true
          schema:
            type: string
      responses:
        '200':
          description: Model unloaded
          
  /v1/embeddings:
    post:
      summary: Generate embeddings
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/EmbeddingRequest'
      responses:
        '200':
          description: Embeddings generated
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/EmbeddingResponse'
                
  /health:
    get:
      summary: Health check
      responses:
        '200':
          description: Service healthy
          content:
            application/json:
              schema:
                type: object
                properties:
                  status:
                    type: string
                  providers:
                    type: object
                    additionalProperties:
                      type: boolean

components:
  schemas:
    CompletionRequest:
      type: object
      required:
        - model
        - messages
      properties:
        model:
          type: string
        messages:
          type: array
          items:
            $ref: '#/components/schemas/Message'
        temperature:
          type: number
        max_tokens:
          type: integer
        stream:
          type: boolean
          default: true
          
    Message:
      type: object
      required:
        - role
        - content
      properties:
        role:
          type: string
          enum: [system, user, assistant]
        content:
          type: string
          
    CompletionResponse:
      type: object
      properties:
        id:
          type: string
        model:
          type: string
        choices:
          type: array
          items:
            type: object
        usage:
          $ref: '#/components/schemas/Usage'
          
    Usage:
      type: object
      properties:
        prompt_tokens:
          type: integer
        completion_tokens:
          type: integer
        total_tokens:
          type: integer
          
    ModelInfo:
      type: object
      properties:
        id:
          type: string
        name:
          type: string
        provider:
          type: string
        size_bytes:
          type: integer
        context_size:
          type: integer
          
    EmbeddingRequest:
      type: object
      required:
        - model
        - input
      properties:
        model:
          type: string
        input:
          type: array
          items:
            type: string
            
    EmbeddingResponse:
      type: object
      properties:
        model:
          type: string
        embeddings:
          type: array
          items:
            type: array
            items:
              type: number
```

---

## 9. Error Handling

### 9.1 Error Response Format

All errors include stack traces when available:

```json
{
  "error": {
    "code": 8200,
    "message": "model 'nonexistent' not found on any provider",
    "stack": [
      "provider.(*Registry).findProviderWithModel (registry.go:142)",
      "provider.(*Registry).GetProvider (registry.go:98)",
      "handler.(*StreamHandler).HandleStream (stream.go:45)",
      "http.HandlerFunc.ServeHTTP (server.go:2166)"
    ]
  }
}
```

### 9.2 Error Code Mapping

| Code | HTTP Status | Description |
|------|-------------|-------------|
| 8100 | 503 | Provider unavailable |
| 8101 | 504 | Provider timeout |
| 8102 | 502 | Provider rejected request |
| 8200 | 404 | Model not found |
| 8201 | 500 | Model load failed |
| 8202 | 503 | Model busy/loading |
| 8203 | 400 | Context exceeded |
| 8300 | 500 | Stream init failed |
| 8301 | 500 | Stream interrupted |
| 8400 | 429 | Rate limit exceeded |
| 8500 | 503 | No provider available |
| 8502 | 503 | Failover exhausted |

---

## 10. Metrics

### 10.1 Prometheus Metrics

```go
// Metrics exposed at /metrics
var (
    requestsTotal = prometheus.NewCounterVec(
        prometheus.CounterOpts{
            Name: "aibridge_requests_total",
            Help: "Total number of requests",
        },
        []string{"model", "provider", "status"},
    )
    
    requestDuration = prometheus.NewHistogramVec(
        prometheus.HistogramOpts{
            Name:    "aibridge_request_duration_seconds",
            Help:    "Request duration in seconds",
            Buckets: []float64{0.1, 0.5, 1, 2, 5, 10, 30, 60, 120},
        },
        []string{"model", "provider"},
    )
    
    tokensTotal = prometheus.NewCounterVec(
        prometheus.CounterOpts{
            Name: "aibridge_tokens_total",
            Help: "Total tokens processed",
        },
        []string{"model", "provider", "type"}, // type: prompt, completion
    )
    
    providerStatus = prometheus.NewGaugeVec(
        prometheus.GaugeOpts{
            Name: "aibridge_provider_available",
            Help: "Provider availability (1=up, 0=down)",
        },
        []string{"provider"},
    )
    
    modelLoadedGauge = prometheus.NewGaugeVec(
        prometheus.GaugeOpts{
            Name: "aibridge_model_loaded",
            Help: "Model loaded status (1=loaded, 0=unloaded)",
        },
        []string{"model", "provider"},
    )
)
```

---

## 11. References

- [LLM Server Multi-Model Research](../10-research/02-llm-server-multi-model.md)
- [pkg/errors Specification](../13-shared-packages/02-pkg-errors.md)
- [pkg/logging Specification](../13-shared-packages/04-pkg-logging.md)
- [Gateway Service Specification](./01-gateway.md)
- [Ollama API Documentation](https://docs.ollama.com/api/introduction)
- [llama.cpp Server Documentation](https://github.com/ggml-org/llama.cpp)
