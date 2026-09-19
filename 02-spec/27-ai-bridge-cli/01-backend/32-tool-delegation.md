# AI Bridge CLI: Tool Delegation

**Version:** 5.0.0  
**Status:** Active  
**Updated:** 2026-03-09  

---

## Overview

AI Bridge CLI acts as a central coordinator for AI operations. For certain specialized workloads, it **delegates** processing to standalone CLI tools rather than handling them directly. This provides better separation of concerns, independent scaling, and cleaner architecture.

**Cross-References:**
- [API Interface](./04-api-interface.md)
- [Model Management](./07-model-management.md)
- [AI Transcribe CLI](../../26-ai-transcribe-cli/00-overview.md)

---

## Delegation Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                            AI BRIDGE CLI                                 │
│                           (Coordinator)                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌───────────────────┐  ┌───────────────────┐  ┌───────────────────┐   │
│  │   Text/LLM        │  │   Image/Video     │  │   Voice (Proxy)   │   │
│  │   (Direct)        │  │   (Direct)        │  │   (Delegated)     │   │
│  └────────┬──────────┘  └────────┬──────────┘  └────────┬──────────┘   │
│           │                      │                      │              │
│           ▼                      ▼                      ▼              │
│  ┌────────────────┐    ┌────────────────┐    ┌──────────────────────┐ │
│  │ Ollama/llama   │    │ SD-API/SVD     │    │ Delegation Router    │ │
│  │ .cpp/OpenAI    │    │ (Local)        │    │                      │ │
│  └────────────────┘    └────────────────┘    └──────────┬───────────┘ │
│                                                         │              │
└─────────────────────────────────────────────────────────│──────────────┘
                                                          │
                                HTTP/WebSocket            │
                                                          ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          AI TRANSCRIBE CLI                               │
│                        (Voice Specialist)                                │
├─────────────────────────────────────────────────────────────────────────┤
│  • Speech-to-Text (Whisper, OpenAI, ElevenLabs)                         │
│  • Text-to-Speech (XTTS, ElevenLabs, Azure)                             │
│  • Real-time Voice Conversation                                         │
│  • Voice Cloning                                                        │
│  • Voice Commands                                                       │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Delegated Tools

### Current Delegations

| Tool Category | Target CLI | Port Range | Status |
|---------------|------------|------------|--------|
| `Voice` (STT) | AI Transcribe CLI | 8030-8032 | Active |
| `Tts` | AI Transcribe CLI | 8030-8032 | Active |
| `VoiceRealtime` | AI Transcribe CLI | 8031 (WS) | Active |

### Future Delegations (Planned)

| Tool Category | Target CLI | Port Range | Status |
|---------------|------------|------------|--------|
| `Ocr` | AI Vision CLI | TBD | Planned |
| `DocumentParse` | AI Document CLI | TBD | Planned |

---

## Configuration

### Delegation Settings

```yaml
# AI Bridge config.yaml

ToolDelegations:
  Voice:
    Target: ai-transcribe-cli
    Endpoint: http://localhost:8030
    WsEndpoint: ws://localhost:8031
    Timeout: 30s
    HealthCheck: /health
    HealthCheckInterval: 30s
    
    # Request routing
    Routes:
      Transcribe: /api/v1/stt/transcribe
      Synthesize: /api/v1/tts/synthesize
      Voices: /api/v1/voices
      Sessions: /api/v1/sessions
    
    # WebSocket routing
    WsRoutes:
      Stream: /ws/transcribe
      Conversation: /ws/conversation
    
    # Error handling
    Fallback:
      Enabled: false
      Strategy: Error  # Error | Queue | Skip
    
    # Retry policy
    Retries:
      MaxAttempts: 3
      BackoffMs: 1000
      BackoffMultiplier: 2
      MaxBackoffMs: 10000
    
    # Circuit breaker
    CircuitBreaker:
      Enabled: true
      FailureThreshold: 5
      ResetTimeoutMs: 60000
```

### Database Storage

```sql
-- Table: ToolDelegations
CREATE TABLE ToolDelegations (
    Id TEXT PRIMARY KEY,
    ToolKey TEXT UNIQUE NOT NULL,       -- Voice, Tts, Ocr, etc.
    TargetCli TEXT NOT NULL,            -- ai-transcribe-cli
    HttpEndpoint TEXT NOT NULL,         -- http://localhost:8030
    WsEndpoint TEXT,                    -- ws://localhost:8031
    HealthEndpoint TEXT,                -- /health
    TimeoutMs INTEGER DEFAULT 30000,
    Enabled BOOLEAN DEFAULT TRUE,
    LastHealthCheck DATETIME,
    HealthStatus TEXT DEFAULT 'Unknown', -- Healthy, Degraded, Unhealthy
    Config TEXT,                         -- JSON (typed DelegationConfig)
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Table: DelegationRoutes
CREATE TABLE DelegationRoutes (
    Id TEXT PRIMARY KEY,
    DelegationId TEXT NOT NULL,
    LocalPath TEXT NOT NULL,            -- /api/v1/voice/transcribe
    RemotePath TEXT NOT NULL,           -- /api/v1/stt/transcribe
    Method TEXT DEFAULT 'ALL',           -- GET, POST, ALL
    TransformRequest TEXT,              -- JSON transformation rules
    TransformResponse TEXT,             -- JSON transformation rules
    FOREIGN KEY (DelegationId) REFERENCES ToolDelegations(Id)
);
```

---

## Request Flow

### HTTP Delegation

```
Client Request                    AI Bridge                         AI Transcribe
     │                                │                                   │
     │  POST /voice/transcribe        │                                   │
     │ ──────────────────────────────▶│                                   │
     │                                │  1. Check delegation config       │
     │                                │  2. Health check (if stale)       │
     │                                │                                   │
     │                                │  POST /stt/transcribe             │
     │                                │ ─────────────────────────────────▶│
     │                                │                                   │
     │                                │        Response                   │
     │                                │◀───────────────────────────────── │
     │                                │                                   │
     │                                │  3. Transform response            │
     │                                │  4. Add delegation metadata       │
     │        Response                │                                   │
     │◀────────────────────────────── │                                   │
```

### WebSocket Delegation

```
Client                            AI Bridge                         AI Transcribe
     │                                │                                   │
     │  WS /ws/voice/stream           │                                   │
     │ ──────────────────────────────▶│                                   │
     │                                │                                   │
     │                                │  WS /ws/transcribe                │
     │                                │ ─────────────────────────────────▶│
     │                                │                                   │
     │◀═══════════════════════════════│═══════════════════════════════════│
     │         Bidirectional WebSocket Tunnel                             │
     │═══════════════════════════════▶│══════════════════════════════════▶│
```

---

## Proxy Implementation

### HTTP Proxy Handler

```go
type DelegationProxy struct {
    config       *DelegationConfig
    client       *http.Client
    circuitBreak *CircuitBreaker
}

func (p *DelegationProxy) ProxyRequest(w http.ResponseWriter, r *http.Request) {
    // 1. Check circuit breaker
    if p.circuitBreak.IsOpen() {
        p.handleCircuitOpen(w)
        return
    }
    
    // 2. Transform request
    targetUrl := p.buildTargetUrl(r)
    proxyReq, err := p.transformRequest(r, targetUrl)
    if err != nil {
        p.handleError(w, err)
        return
    }
    
    // 3. Execute with retry
    resp, err := p.executeWithRetry(proxyReq)
    if err != nil {
        p.circuitBreak.RecordFailure()
        p.handleError(w, err)
        return
    }
    
    p.circuitBreak.RecordSuccess()
    
    // 4. Transform and forward response
    p.transformResponse(w, resp)
}

func (p *DelegationProxy) buildTargetUrl(r *http.Request) string {
    route := p.config.FindRoute(r.URL.Path)
    return p.config.Endpoint + route.RemotePath
}
```

### WebSocket Tunnel

```go
type WebSocketTunnel struct {
    config *DelegationConfig
    dialer *websocket.Dialer
}

func (t *WebSocketTunnel) Tunnel(clientConn *websocket.Conn, r *http.Request) {
    // 1. Connect to target
    targetUrl := t.config.WsEndpoint + t.config.FindWsRoute(r.URL.Path)
    targetConn, _, err := t.dialer.Dial(targetUrl, nil)
    if err != nil {
        clientConn.WriteMessage(websocket.CloseMessage, 
            websocket.FormatCloseMessage(websocket.CloseInternalServerErr, ""))
        return
    }
    defer targetConn.Close()
    
    // 2. Bidirectional tunnel
    errChan := make(chan error, 2)
    
    // Client -> Target
    go func() {
        for {
            msgType, msg, err := clientConn.ReadMessage()
            if err != nil {
                errChan <- err
                return
            }
            if err := targetConn.WriteMessage(msgType, msg); err != nil {
                errChan <- err
                return
            }
        }
    }()
    
    // Target -> Client
    go func() {
        for {
            msgType, msg, err := targetConn.ReadMessage()
            if err != nil {
                errChan <- err
                return
            }
            if err := clientConn.WriteMessage(msgType, msg); err != nil {
                errChan <- err
                return
            }
        }
    }()
    
    // Wait for either side to close
    <-errChan
}
```

---

## Health Monitoring

### Health Check Process

```go
type DelegationHealthChecker struct {
    delegations []*Delegation
    interval    time.Duration
}

func (h *DelegationHealthChecker) Start(context stdctx.Context) {
    ticker := time.NewTicker(h.interval)
    defer ticker.Stop()
    
    for {
        select {
        case <-context.Done():
            return
        case <-ticker.C:
            h.checkAll()
        }
    }
}

func (h *DelegationHealthChecker) checkAll() {
    for _, d := range h.delegations {
        go h.checkOne(d)
    }
}

func (h *DelegationHealthChecker) checkOne(d *Delegation) {
    context, cancel := stdctx.WithTimeout(stdctx.Background(), 5*time.Second)
    defer cancel()
    
    req, _ := http.NewRequestWithContext(ctx, httpmethod.Get.String(), 
        d.Endpoint+d.HealthEndpoint, nil)
    
    resp, err := http.DefaultClient.Do(req)
    if err != nil {
        d.SetHealthStatus("Unhealthy", err.Error())
        return
    }
    defer resp.Body.Close()
    
    if resp.StatusCode == 200 {
        d.SetHealthStatus("Healthy", "")
    } else {
        d.SetHealthStatus("Degraded", fmt.Sprintf("status: %d", resp.StatusCode))
    }
}
```

---

## Route Mapping

### AI Bridge → AI Transcribe Routes

| AI Bridge Endpoint | AI Transcribe Endpoint | Method |
|--------------------|------------------------|--------|
| `/api/v1/voice/transcribe` | `/api/v1/stt/transcribe` | POST |
| `/api/v1/voice/synthesize` | `/api/v1/tts/synthesize` | POST |
| `/api/v1/voice/synthesize/stream` | `/api/v1/tts/synthesize/stream` | POST |
| `/api/v1/voice/voices` | `/api/v1/voices` | GET |
| `/api/v1/voice/voices/:id` | `/api/v1/voices/:id` | GET/DELETE |
| `/api/v1/voice/sessions` | `/api/v1/sessions` | GET/POST |
| `/api/v1/voice/sessions/:id` | `/api/v1/sessions/:id` | GET/DELETE |
| `/ws/voice/stream` | `/ws/transcribe` | WS |
| `/ws/voice/conversation` | `/ws/conversation` | WS |

---

## Response Transformation

### Adding Delegation Metadata

**CRITICAL: No `interface{}` or `map[string]interface{}` usage. All responses use typed structs.**

```go
// DelegationMetadata holds typed metadata added to delegated responses
type DelegationMetadata struct {
    DelegatedTo  string `json:",omitempty"`
    DelegationMs int64  `json:",omitempty"`
}

// DelegatedResponse wraps original response bytes with delegation metadata
type DelegatedResponse struct {
    DelegatedTo  string `json:",omitempty"`
    DelegationMs int64  `json:",omitempty"`
}

func (p *DelegationProxy) transformResponse(w http.ResponseWriter, resp *http.Response) {
    // Read original response (pass-through as raw JSON)
    body, _ := io.ReadAll(resp.Body)
    
    // Inject delegation metadata as HTTP headers (avoids modifying JSON body)
    w.Header().Set("Content-Type", "application/json")
    w.Header().Set("X-Delegated-To", p.config.Target)
    w.Header().Set("X-Delegation-Ms", fmt.Sprintf("%d", time.Since(p.startTime).Milliseconds()))
    w.WriteHeader(resp.StatusCode)
    w.Write(body)
}
```

---

## Error Handling

### Delegation Errors

| Error Code | Constant | Description |
|------------|----------|-------------|
| 9400 | `ERR_DELEGATION_UNAVAILABLE` | Target CLI not available |
| 9401 | `ERR_DELEGATION_TIMEOUT` | Request to target timed out |
| 9402 | `ERR_DELEGATION_CIRCUIT_OPEN` | Circuit breaker is open |
| 9403 | `ERR_DELEGATION_ROUTE_NOT_FOUND` | No route configured for path |
| 9404 | `ERR_DELEGATION_TRANSFORM` | Request/response transform failed |

### Error Response

```json
{
  "Success": false,
  "Error": {
    "Code": 9400,
    "Constant": "ERR_DELEGATION_UNAVAILABLE",
    "Message": "Voice service unavailable",
    "Details": "AI Transcribe CLI not responding at http://localhost:8030",
    "DelegationTarget": "ai-transcribe-cli"
  }
}
```

---

## API Endpoints

### Delegation Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/delegations` | List all delegations |
| GET | `/api/v1/delegations/:key` | Get delegation details |
| PUT | `/api/v1/delegations/:key` | Update delegation config |
| POST | `/api/v1/delegations/:key/health` | Force health check |
| GET | `/api/v1/delegations/:key/status` | Get delegation status |

---

## See Also

- [API Interface](./04-api-interface.md)
- [Model Management](./07-model-management.md)
- [AI Transcribe CLI](../../26-ai-transcribe-cli/00-overview.md)
