# AI Bridge CLI: API Interface

**Version:** 5.0.0  
**Status:** Complete  
**Updated:** 2026-03-09  

---

## Overview

When running in daemon mode, AI Bridge CLI exposes a comprehensive REST API and WebSocket interface for programmatic access to all AI capabilities including text generation, chat, RAG, image/video generation, and voice processing.

---

## Base URL

```
http://localhost:8089/api/v1
```

---

## Authentication

Optional API key authentication:

```yaml
# config.yaml
Daemon:
  Auth:
    Enabled: true
    ApiKeys:
      - Key: "sk_live_abc123..."
        Name: "Production"
        RateLimit: 100
```

```bash
curl -H "Authorization: Bearer sk_live_abc123..." \
     http://localhost:8089/api/v1/generate
```

---

## Text Generation Endpoints

### POST /generate

Synchronous text generation with category-based model selection.

**Request:**
```json
{
  "Category": "coding",
  "SystemPrompt": "You are a helpful coding assistant.",
  "UserPrompt": "Write a function to sort an array in Go.",
  "Temperature": 0.7,
  "MaxTokens": 2048,
  "OutputFormat": "markdown"
}
```

**Response:**
```json
{
  "Id": "gen_abc123",
  "Content": "```go\nfunc sortArray(arr []int) []int {\n    sort.Ints(arr)\n    return arr\n}\n```",
  "FinishReason": "stop",
  "TokensUsed": {
    "Prompt": 45,
    "Completion": 312,
    "Total": 357
  },
  "DurationMs": 1523,
  "ModelUsed": "deepseek-coder:6.7b",
  "BackendUsed": "ollama"
}
```

### POST /generate/stream

Server-Sent Events (SSE) streaming generation.

**Request:** Same as `/generate`

**Response:** SSE stream
```
event: chunk
data: {"Delta": "```go"}

event: chunk
data: {"Delta": "\nfunc "}

event: done
data: {"Id": "gen_abc123", "FinishReason": "stop", "TokensUsed": {"Total": 357}}
```

### POST /batch

Submit a batch of requests for parallel processing.

**Request:**
```json
{
  "Category": "writing",
  "SystemPrompt": "Generate a product tagline.",
  "UserPromptTemplate": "Create a tagline for {{ProductName}} targeting {{Audience}}.",
  "Items": [
    { "Id": "p1", "Variables": { "ProductName": "Widget A", "Audience": "developers" } },
    { "Id": "p2", "Variables": { "ProductName": "Widget B", "Audience": "designers" } }
  ],
  "Parallelism": 3
}
```

**Response:**
```json
{
  "BatchId": "batch_xyz789",
  "Status": "processing",
  "Submitted": 2,
  "Completed": 0
}
```

---

## Chat Endpoints

### POST /chat/sessions

Create a new chat session.

**Request:**
```json
{
  "AppName": "gsearch",
  "Category": "thinking",
  "Title": "Project Planning Session"
}
```

**Response:**
```json
{
  "SessionId": "chat_abc123",
  "SequenceNum": 5,
  "Path": "gsearch/ai/chat/05-abc123.db",
  "CreatedAt": "2026-02-01T10:30:00Z"
}
```

### GET /chat/sessions

List all chat sessions, optionally filtered by application.

**Query Parameters:**
- `AppName` - Filter by source application
- `Limit` - Number of results (default: 50)
- `Offset` - Pagination offset

**Response:**
```json
{
  "Sessions": [
    {
      "SessionId": "chat_abc123",
      "SequenceNum": 5,
      "Title": "Project Planning Session",
      "Category": "thinking",
      "MessageCount": 12,
      "CreatedAt": "2026-02-01T10:30:00Z",
      "UpdatedAt": "2026-02-01T11:45:00Z"
    }
  ],
  "Total": 25
}
```

### POST /chat/sessions/:id/messages

Send a message to a chat session.

**Request:**
```json
{
  "Content": "What's the best approach for implementing a cache layer?",
  "Attachments": [
    {
      "Type": "file",
      "Name": "current-code.go",
      "Content": "// Current implementation..."
    }
  ]
}
```

**Response (streaming):**
```
event: message.started
data: {"MessageId": "msg_xyz789", "Role": "assistant"}

event: chunk
data: {"Delta": "For implementing"}

event: chunk  
data: {"Delta": " a cache layer, "}

event: message.completed
data: {"MessageId": "msg_xyz789", "Tokens": 523}
```

### GET /chat/sessions/:id/messages

Get all messages in a chat session.

**Response:**
```json
{
  "Messages": [
    {
      "Id": "msg_001",
      "SequenceNum": 1,
      "Role": "user",
      "Content": "What's the best approach...",
      "CreatedAt": "2026-02-01T10:31:00Z"
    },
    {
      "Id": "msg_002",
      "SequenceNum": 2,
      "Role": "assistant",
      "Content": "For implementing a cache layer...",
      "Tokens": 523,
      "Model": "qwen2.5-coder:32b",
      "CreatedAt": "2026-02-01T10:31:05Z"
    }
  ]
}
```

---

## RAG Endpoints

### POST /rag/documents

Ingest a document into RAG memory.

**Request (multipart/form-data):**
```
file: (binary)
AppName: gsearch
Title: Architecture Documentation
ChunkSize: 512
ChunkOverlap: 50
```

**Response:**
```json
{
  "DocId": "doc_abc123",
  "SequenceNum": 3,
  "Path": "gsearch/rag/documents/03-abc123.db",
  "ChunkCount": 45,
  "EmbeddingModel": "nomic-embed-text",
  "Status": "completed"
}
```

### GET /rag/documents

List all RAG documents.

**Query Parameters:**
- `AppName` - Filter by source application

**Response:**
```json
{
  "Documents": [
    {
      "DocId": "doc_abc123",
      "SequenceNum": 3,
      "Title": "Architecture Documentation",
      "SourceType": "file",
      "ChunkCount": 45,
      "CreatedAt": "2026-02-01T09:00:00Z"
    }
  ]
}
```

### POST /rag/search

Search across RAG memory.

**Request:**
```json
{
  "AppName": "gsearch",
  "Query": "How does the caching system work?",
  "TopK": 5,
  "Threshold": 0.7
}
```

**Response:**
```json
{
  "Results": [
    {
      "DocId": "doc_abc123",
      "ChunkId": "chunk_xyz",
      "Content": "The caching system uses a write-through strategy...",
      "Score": 0.92,
      "Metadata": {
        "Page": 15,
        "Section": "Caching Architecture"
      }
    }
  ]
}
```

---

## Image Generation Endpoints

### POST /generate/image

Generate an image from text prompt.

**Request:**
```json
{
  "Prompt": "A futuristic city at sunset, cyberpunk style",
  "NegativePrompt": "blurry, low quality",
  "Width": 1024,
  "Height": 1024,
  "Steps": 30,
  "CfgScale": 7.5,
  "Seed": 12345
}
```

**Response:**
```json
{
  "Id": "img_abc123",
  "ImageUrl": "/api/v1/images/img_abc123.png",
  "ImageBase64": "data:image/png;base64,...",
  "Width": 1024,
  "Height": 1024,
  "ModelUsed": "stable-diffusion-xl",
  "DurationMs": 8523
}
```

### POST /generate/image/understand

Analyze and describe an image.

**Request (multipart/form-data):**
```
image: (binary)
Prompt: Describe this image in detail
```

**Response:**
```json
{
  "Id": "understand_abc123",
  "Description": "The image shows a modern office space with...",
  "ModelUsed": "llava:13b",
  "DurationMs": 2341
}
```

---

## Video Generation Endpoints

### POST /generate/video

Generate a video from text prompt.

**Request:**
```json
{
  "Prompt": "A rocket launching into space, cinematic",
  "Duration": 4,
  "Fps": 24,
  "Width": 1024,
  "Height": 576
}
```

**Response:**
```json
{
  "Id": "vid_abc123",
  "Status": "processing",
  "EstimatedDurationMs": 120000
}
```

### GET /generate/video/:id

Check video generation status.

**Response:**
```json
{
  "Id": "vid_abc123",
  "Status": "completed",
  "VideoUrl": "/api/v1/videos/vid_abc123.mp4",
  "Duration": 4,
  "Fps": 24,
  "ModelUsed": "stable-video-diffusion",
  "GenerationDurationMs": 115234
}
```

---

## Voice Endpoints (DELEGATED)

> **Note:** Voice endpoints are proxied to [AI Transcribe CLI](../../26-ai-transcribe-cli/00-overview.md). 
> AI Bridge maintains these routes for backward compatibility but delegates actual processing.

### POST /voice/transcribe

Transcribe audio to text (Speech-to-Text). **Proxied to AI Transcribe CLI.**

**Request (multipart/form-data):**
```
audio: (binary)
Language: en
Format: mp3
```

**Response:**
```json
{
  "Id": "transcribe_abc123",
  "Text": "Hello, this is a test recording.",
  "Language": "en",
  "Confidence": 0.95,
  "Segments": [
    {
      "Start": 0.0,
      "End": 1.5,
      "Text": "Hello,"
    },
    {
      "Start": 1.5,
      "End": 3.2,
      "Text": "this is a test recording."
    }
  ],
  "ModelUsed": "whisper:large-v3",
  "DurationMs": 1234,
  "DelegatedTo": "ai-transcribe-cli"
}
```

### POST /voice/synthesize

Synthesize speech from text (Text-to-Speech). **Proxied to AI Transcribe CLI.**

**Request:**
```json
{
  "Text": "Welcome to AI Bridge CLI. How can I help you today?",
  "Voice": "default",
  "Speed": 1.0,
  "Format": "mp3"
}
```

**Response:**
```json
{
  "Id": "tts_abc123",
  "AudioUrl": "/api/v1/audio/tts_abc123.mp3",
  "AudioBase64": "data:audio/mp3;base64,...",
  "Duration": 4.5,
  "ModelUsed": "xtts-v2",
  "DurationMs": 2341,
  "DelegatedTo": "ai-transcribe-cli"
}
```

### Delegation Configuration

```yaml
# AI Bridge config.yaml
ToolDelegations:
  Voice:
    Target: ai-transcribe-cli
    Endpoint: http://localhost:8030
    Timeout: 30s
    HealthCheck: /health
```

---

## Model Category Endpoints

### GET /categories

List all model categories with current assignments.

**Response:**
```json
{
  "Categories": [
    {
      "Key": "coding",
      "DisplayName": "Coding",
      "Description": "Code generation, refactoring, debugging",
      "CurrentBackend": "ollama",
      "CurrentModel": "deepseek-coder:6.7b",
      "IsBuiltin": true,
      "Parameters": {
        "Temperature": 0.3,
        "MaxTokens": 8192
      }
    },
    {
      "Key": "image-gen",
      "DisplayName": "Image Generation",
      "Description": "Generate images from text",
      "CurrentBackend": "sd-api",
      "CurrentModel": "stable-diffusion-xl",
      "IsBuiltin": true
    }
  ]
}
```

### POST /categories

Create a custom category.

**Request:**
```json
{
  "Key": "legal",
  "DisplayName": "Legal Documents",
  "Description": "Legal text generation and analysis",
  "DefaultBackend": "ollama",
  "DefaultModel": "llama3.1:70b",
  "Parameters": {
    "Temperature": 0.2,
    "MaxTokens": 4096
  }
}
```

### PUT /categories/:key/model

Update the model assignment for a category.

**Request:**
```json
{
  "Backend": "llama-cpp",
  "Model": "deepseek-coder-6.7b-instruct.Q5_K_M.gguf"
}
```

### POST /categories/:key/switch

Switch backend and model at runtime.

**Request:**
```json
{
  "Backend": "ollama",
  "Model": "codellama:34b"
}
```

---

## Backend Management Endpoints

### GET /backends

List all configured backends with health status.

**Response:**
```json
{
  "Backends": [
    {
      "Key": "ollama",
      "DisplayName": "Ollama",
      "Type": "llm",
      "BaseUrl": "http://localhost:11434",
      "HealthStatus": "healthy",
      "LastHealthCheck": "2026-02-01T10:00:00Z",
      "LoadedModels": ["deepseek-coder:6.7b", "llama3.1:8b"],
      "GpuMemoryUsedMb": 8500
    },
    {
      "Key": "whisper",
      "DisplayName": "Whisper",
      "Type": "stt",
      "BaseUrl": "http://localhost:9000",
      "HealthStatus": "healthy"
    }
  ]
}
```

### POST /backends/:key/health

Check backend health.

**Response:**
```json
{
  "Key": "ollama",
  "Status": "healthy",
  "LatencyMs": 45,
  "Version": "0.1.32",
  "CheckedAt": "2026-02-01T10:30:00Z"
}
```

### POST /backends/:key/start

Start a backend using configured PowerShell command.

**Response:**
```json
{
  "Key": "ollama",
  "Status": "starting",
  "Pid": 12345
}
```

### POST /backends/:key/stop

Stop a running backend.

**Response:**
```json
{
  "Key": "ollama",
  "Status": "stopped"
}
```

---

## PowerShell Command Endpoints

### GET /commands

List all configured PowerShell commands.

**Response:**
```json
{
  "Commands": [
    {
      "Key": "ollamaStart",
      "DisplayName": "Start Ollama",
      "Command": "ollama serve",
      "WorkingDir": "",
      "Enabled": true,
      "LastRun": "2026-02-01T09:00:00Z",
      "LastStatus": "success"
    }
  ]
}
```

### PUT /commands/:key

Update a PowerShell command.

**Request:**
```json
{
  "Command": "ollama serve --port 11435",
  "WorkingDir": "C:\\AI\\ollama"
}
```

### POST /commands/:key/run

Execute a PowerShell command.

**Response (streaming):**
```
event: output
data: {"Line": "Ollama is starting..."}

event: output
data: {"Line": "Server running on localhost:11434"}

event: completed
data: {"ExitCode": 0, "DurationMs": 1523}
```

---

## File History Endpoints

### GET /files/:path/history

Get version history for a file.

**Response:**
```json
{
  "FilePath": "src/main.go",
  "CurrentVersion": 5,
  "Versions": [
    {
      "VersionNum": 5,
      "ChangedBy": "ai",
      "ChangeReason": "Added error handling",
      "ModelUsed": "deepseek-coder:6.7b",
      "CreatedAt": "2026-02-01T11:00:00Z"
    },
    {
      "VersionNum": 4,
      "ChangedBy": "user",
      "CreatedAt": "2026-02-01T10:30:00Z"
    }
  ]
}
```

### GET /files/:path/versions/:num

Get a specific version of a file.

**Response:**
```json
{
  "VersionNum": 4,
  "Content": "package main\n\nimport \"fmt\"\n...",
  "ContentHash": "abc123...",
  "SizeBytes": 1523
}
```

### POST /files/:path/revert/:num

Revert file to a specific version.

**Response:**
```json
{
  "NewVersion": 6,
  "RevertedTo": 4,
  "Message": "Reverted to version 4"
}
```

---

## Import/Export Endpoints

### POST /export

Export application data as zip.

**Request:**
```json
{
  "AppName": "gsearch",
  "Include": ["chat", "rag", "files"]
}
```

**Response:** Binary zip file

### POST /import

Import application data from zip.

**Request (multipart/form-data):**
```
file: (binary zip)
AppName: gsearch
Mode: merge
```

**Response:**
```json
{
  "Imported": {
    "ChatSessions": 5,
    "RagDocuments": 12,
    "FileHistories": 8
  }
}
```

---

## WebSocket API

### Connection

```javascript
const ws = new WebSocket('ws://localhost:8089/api/v1/ws');
```

### Message Types

| Type | Direction | Description |
|------|-----------|-------------|
| `generate` | F→B | Request text generation |
| `chunk` | B→F | Streamed token |
| `done` | B→F | Generation complete |
| `error` | B→F | Error occurred |
| `cancel` | F→B | Cancel generation |
| `chat.message` | B→F | Chat message update |
| `model.switched` | B→F | Model changed |
| `backend.status` | B→F | Backend health change |
| `command.output` | B→F | PowerShell output |

---

## Error Responses

All endpoints return errors in this format:

```json
{
  "Error": {
    "Code": 9301,
    "Message": "Model not found",
    "Details": "The requested model 'nonexistent:7b' is not available"
  }
}
```

---

## Rate Limiting

When rate limited:

```http
HTTP/1.1 429 Too Many Requests
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1706745600
Retry-After: 45
```

---

## Standardized Pagination Envelope

All paginated API responses (chat messages, search results, RAG documents, blog lists) use a consistent envelope format. This ensures frontend clients can implement a single pagination handler across all endpoints.

### Envelope Format

```json
{
  "Success": true,
  "Data": [...],
  "Pagination": {
    "TotalRecords": 150,
    "TotalPages": 15,
    "CurrentPage": 1,
    "PageSize": 10,
    "HasNextPage": true,
    "HasPrevPage": false,
    "NextPageUrl": "/api/v1/chat/sessions/{id}/messages?page=2&limit=10",
    "PrevPageUrl": null,
    "LoadMoreUrl": "/api/v1/chat/sessions/{id}/messages?page=2&limit=10"
  }
}
```

### Go Struct

```go
// PaginationMeta provides cursor-based pagination metadata for all list responses
type PaginationMeta struct {
    TotalRecords int
    TotalPages   int
    CurrentPage  int
    PageSize     int
    HasNextPage  bool
    HasPrevPage  bool
    NextPageUrl  *string  // nil when no next page
    PrevPageUrl  *string  // nil when no prev page
    LoadMoreUrl  *string  // alias for NextPageUrl (convenience)
}

// PaginatedResponse wraps any list response with pagination
type PaginatedResponse[T any] struct {
    Success    bool
    Data       []T
    Pagination PaginationMeta
}

// PaginationParams are extracted from query parameters
type PaginationParams struct {
    Page  int `query:"page"  validate:"min=1"`           // Default: 1
    Limit int `query:"limit" validate:"min=1,max=100"`   // Default: from Chat.DefaultPageSize setting
}

// BuildPagination computes pagination metadata from query and total count
func BuildPagination(params PaginationParams, totalRecords int, baseUrl string) PaginationMeta {
    totalPages := (totalRecords + params.Limit - 1) / params.Limit
    meta := PaginationMeta{
        TotalRecords: totalRecords,
        TotalPages:   totalPages,
        CurrentPage:  params.Page,
        PageSize:     params.Limit,
        HasNextPage:  params.Page < totalPages,
        HasPrevPage:  params.Page > 1,
    }
    if meta.HasNextPage {
        next := fmt.Sprintf("%s?page=%d&limit=%d", baseUrl, params.Page+1, params.Limit)
        meta.NextPageUrl = &next
        meta.LoadMoreUrl = &next
    }
    if meta.HasPrevPage {
        prev := fmt.Sprintf("%s?page=%d&limit=%d", baseUrl, params.Page-1, params.Limit)
        meta.PrevPageUrl = &prev
    }
    return meta
}
```

### Query Parameter Overrides

All paginated endpoints accept these query parameters:

| Parameter | Type | Default | Max | Description |
|-----------|------|---------|-----|-------------|
| `page` | `int` | `1` | — | Page number (1-indexed) |
| `limit` | `int` | From `Chat.DefaultPageSize` setting | `Chat.MaxPageSize` | Results per page |

### Endpoints Using Pagination

| Endpoint | Default Limit Source |
|----------|---------------------|
| `GET /chat/sessions` | `Chat.DefaultPageSize` |
| `GET /chat/sessions/:id/messages` | `Chat.ConversationLimit` |
| `GET /rag/documents` | `Chat.DefaultPageSize` |
| `GET /rag/search` | `topK` parameter (unchanged) |
| `GET /seo/{company}/html-blogs` | `Chat.DefaultPageSize` |
| `GET /files/:path/history` | `Chat.DefaultPageSize` |

---

## See Also

- [Model Management](./07-model-management.md)
- [Split DB Integration](./08-split-db-integration.md)
- [Error Codes](./05-error-codes.md)
- [HTML Blog Generation](./55-html-blog-generation.md)
