# AI Bridge: Configuration

**Version:** 5.0.0  
**Status:** Complete  
**Updated:** 2026-03-09  

---

## Overview

AI Bridge uses YAML configuration with environment variable overrides and sensible defaults.

---

## Configuration File Locations

Search order (first found wins):
1. `--config` flag path
2. `./aibridge.yaml`
3. `~/.config/aibridge/config.yaml`
4. `/etc/aibridge/config.yaml`

---

## Full Configuration Schema

```yaml
# AI Bridge Configuration
# Version: 1.0.0

# ─────────────────────────────────────────────────────────────────────────────
# Backend Configuration
# ─────────────────────────────────────────────────────────────────────────────

Backend:
  # Default backend to use: ollama | llama-cpp
  Default: ollama
  
  # Ollama configuration
  Ollama:
    BaseUrl: http://localhost:11434
    Timeout: 5m
    HealthCheckInterval: 30s
    
  # llama.cpp configuration
  LlamaCpp:
    BaseUrl: http://localhost:8080
    ServerPath: /usr/local/bin/llama-server
    Timeout: 5m
    HealthCheckInterval: 30s
    
    # llama-swap proxy (optional)
    LlamaSwap:
      Enabled: false
      BaseUrl: http://localhost:8081
      AutoLoadModels: true

# ─────────────────────────────────────────────────────────────────────────────
# Model Configuration
# ─────────────────────────────────────────────────────────────────────────────

Models:
  # Directories to search for model files
  RootPaths:
    - /models
    - ~/.local/share/ollama/models
    
  # Default models by category
  Defaults:
    Thinking: qwen2.5-coder:32b
    Writing: llama3.1:8b
    Coding: deepseek-coder:6.7b
    Voice: whisper:large-v3
    
  # Maximum concurrent models in memory
  MaxConcurrent: 3
  
  # Auto-unload idle models after duration
  IdleTimeout: 30m

# ─────────────────────────────────────────────────────────────────────────────
# Generation Defaults
# ─────────────────────────────────────────────────────────────────────────────

Generation:
  Temperature: 0.7
  MaxTokens: 4096
  TopP: 0.9
  ContextSize: 8192
  
  # Retry configuration
  Retry:
    MaxAttempts: 3
    InitialDelay: 500ms
    MaxDelay: 10s
    BackoffFactor: 2.0

# ─────────────────────────────────────────────────────────────────────────────
# Daemon Configuration
# ─────────────────────────────────────────────────────────────────────────────

Daemon:
  Host: 127.0.0.1
  Port: 5040
  PidFile: /var/run/aibridge.pid
  LogFile: /var/log/aibridge.log
  
  # TLS configuration
  Tls:
    Enabled: false
    CertFile: ""
    KeyFile: ""
    
  # Authentication
  Auth:
    Enabled: false
    ApiKeys: []
    # - Key: "sk_live_..."
    #   Name: "Production"
    #   RateLimit: 100
    
  # Rate limiting
  RateLimit:
    Enabled: true
    RequestsPerMinute: 60
    BurstSize: 10
    
  # WebSocket configuration
  Websocket:
    Enabled: true
    PingInterval: 30s
    WriteTimeout: 10s
    MaxMessageSize: 10MB
    
  # Graceful shutdown timeout
  ShutdownTimeout: 30s
  
  # CORS configuration
  Cors:
    Enabled: true
    AllowedOrigins:
      - "*"
    AllowedMethods:
      - GET
      - POST
      - DELETE
      - OPTIONS
    AllowedHeaders:
      - Authorization
      - Content-Type

# ─────────────────────────────────────────────────────────────────────────────
# Logging Configuration
# ─────────────────────────────────────────────────────────────────────────────

Logging:
  Level: info  # debug | info | warn | error
  Format: json  # json | text
  
  # Include these fields in all log entries
  Fields:
    Service: aibridge
    Version: 1.0.0
    
  # Request logging
  Requests:
    Enabled: true
    IncludeBody: false
    MaxBodyLogSize: 1KB

# ─────────────────────────────────────────────────────────────────────────────
# Metrics Configuration
# ─────────────────────────────────────────────────────────────────────────────

Metrics:
  Enabled: true
  Endpoint: /metrics
  
  # Prometheus metrics to export (snake_case: Prometheus standard exception)
  Include:
    - request_duration_seconds
    - request_total
    - tokens_generated_total
    - model_load_duration_seconds
    - active_requests
    - backend_health
```

---

## Environment Variable Overrides

All configuration values can be overridden with environment variables using the `AIBRIDGE_` prefix:

| Config Path | Environment Variable |
|-------------|---------------------|
| `Backend.Default` | `AIBRIDGE_BACKEND_DEFAULT` |
| `Backend.Ollama.BaseUrl` | `AIBRIDGE_BACKEND_OLLAMA_BASEURL` |
| `Daemon.Port` | `AIBRIDGE_DAEMON_PORT` |
| `Models.Defaults.Thinking` | `AIBRIDGE_MODELS_DEFAULTS_THINKING` |
| `Logging.Level` | `AIBRIDGE_LOGGING_LEVEL` |

---

## Minimal Configuration

For quick start, only specify backends:

```yaml
# Minimal config
Backend:
  Default: ollama
  Ollama:
    BaseUrl: http://localhost:11434
```

---

## Configuration Loading

```go
type Config struct {
    Backend    BackendConfig
    Models     ModelsConfig
    Generation GenerationConfig
    Daemon     DaemonConfig
    Logging    LoggingConfig
    Metrics    MetricsConfig
}

// BackendConfig uses backend_type.Variant for type-safe backend selection
type BackendConfig struct {
    Default  backend_type.Variant
    Ollama   OllamaConfig
    LlamaCpp LlamaCppConfig
}

// LoggingConfig uses log_level.Variant and log_format.Variant
type LoggingConfig struct {
    Level    log_level.Variant
    Format   log_format.Variant
    Fields   map[string]string
    Requests RequestLogConfig
}

func Load(path string) apperror.Result[*Config] {
    // 1. Load defaults
    cfg := DefaultConfig()
    
    // 2. Find config file
    if path == "" {
        path = findConfigFile()
    }
    
    // 3. Load from file
    if path != "" {
        data, err := pathutil.ReadFile(path)
        if err != nil {
            return apperror.FailWrap[*Config](err, ErrConfigNotFound, "config file read failed")
        }

        err = yaml.Unmarshal(data, cfg)
        if err != nil {
            return apperror.FailNew[*Config](
                ErrConfigInvalid,
                "invalid config: %v", err,
            )
        }
    }
    
    // 4. Apply environment overrides
    cfg.applyEnvOverrides()
    
    // 5. Validate
    err := cfg.Validate()
    if err != nil {
        return apperror.FailWrap[*Config](err, ErrConfigInvalid, "config validation failed")
    }
    
    return apperror.Ok(cfg)
}

func DefaultConfig() *Config {
    return &Config{
        Backend: BackendConfig{
            Default: backend_type.Ollama,
            Ollama: OllamaConfig{
                BaseUrl: "http://localhost:11434",
                Timeout: 5 * time.Minute,
            },
        },
        Generation: GenerationConfig{
            Temperature: 0.7,
            MaxTokens:   4096,
            TopP:        0.9,
            Retry: RetryConfig{
                MaxAttempts:   3,
                InitialDelay:  500 * time.Millisecond,
                MaxDelay:      10 * time.Second,
                BackoffFactor: 2.0,
            },
        },
        Daemon: DaemonConfig{
            Host: "127.0.0.1",
            Port: 5040,
            RateLimit: RateLimitConfig{
                Enabled:           true,
                RequestsPerMinute: 60,
                BurstSize:         10,
            },
            ShutdownTimeout: 30 * time.Second,
        },
        Logging: LoggingConfig{
            Level:  log_level.Info,
            Format: log_format.Json,
        },
    }
}
```

---

## Validation Rules

```go
func (c *Config) Validate() *apperror.AppError {
    // Backend validation
    if c.Backend.Default.IsInvalid() {
        return apperror.New(
            ErrConfigInvalid,
            "invalid backend: %s",
            c.Backend.Default,
        )
    }
    
    // Port validation
    if c.Daemon.Port < 1 || c.Daemon.Port > 65535 {
        return apperror.New(
            ErrConfigInvalid,
            "invalid port: %d",
            c.Daemon.Port,
        )
    }
    
    // Temperature validation
    if c.Generation.Temperature < 0 || c.Generation.Temperature > 2 {
        return apperror.New(
            ErrConfigInvalid,
            "temperature must be 0-2",
        )
    }
    
    // TLS validation
    if c.Daemon.TLS.Enabled {
        if c.Daemon.TLS.CertFile == "" || c.Daemon.TLS.KeyFile == "" {
            return apperror.New(
                ErrConfigInvalid,
                "TLS requires CertFile and KeyFile",
            )
        }
    }
    
    return nil
}
```

---

## Chat & Pagination Settings

The following seedable settings control conversation display limits and pagination behavior. These are stored in the root `data/aibridge.db` Settings table and can be overridden at runtime via the API.

### Configuration Schema

```yaml
# Chat & Pagination
Chat:
  ConversationLimit: 10       # Messages shown per page in chat (3, 5, 10, 20, 50, 0=unlimited)
  DefaultPageSize: 10         # Default page size for all paginated API responses
  MaxPageSize: 100            # Maximum allowed page size (prevents abuse)
```

### Seedable Settings (config.seed.json)

```json
{
  "Version": "1.0.0",
  "Category": "chat_settings",
  "Values": {
    "Chat.ConversationLimit": {
      "Value": 10,
      "ValueType": "int",
      "Description": "Default messages per page in chat history (3, 5, 10, 20, 50, 0=unlimited)"
    },
    "Chat.DefaultPageSize": {
      "Value": 10,
      "ValueType": "int",
      "Description": "Default page size for all paginated API responses"
    },
    "Chat.MaxPageSize": {
      "Value": 100,
      "ValueType": "int",
      "Description": "Maximum allowed page size to prevent abuse"
    }
  }
}
```

### Go Configuration Struct

```go
// ChatConfig holds pagination and conversation display settings
type ChatConfig struct {
    ConversationLimit int // Default: 10
    DefaultPageSize   int // Default: 10
    MaxPageSize       int // Default: 100
}
```

### Environment Variable Overrides

| Config Path | Environment Variable |
|-------------|---------------------|
| `Chat.ConversationLimit` | `AIBRIDGE_CHAT_CONVERSATIONLIMIT` |
| `Chat.DefaultPageSize` | `AIBRIDGE_CHAT_DEFAULTPAGESIZE` |
| `Chat.MaxPageSize` | `AIBRIDGE_CHAT_MAXPAGESIZE` |

---

## See Also

- [Startup Modes](./03-startup-modes.md)
- [Error Codes](./05-error-codes.md)
- [Enum Architecture](./53-enum-architecture.md)
- [API Interface — Pagination Envelope](./04-api-interface.md#standardized-pagination-envelope)
