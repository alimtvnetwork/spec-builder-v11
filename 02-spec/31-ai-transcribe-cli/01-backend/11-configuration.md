# Configuration

**Version:** 2.0.0  
**Status:** Active  
**Updated:** 2026-03-09  

---

## Overview

Configuration management for the AI Transcribe CLI. Defines all configurable parameters, environment variables, and runtime settings.

**Cross-References:**
- [Architecture](./01-architecture.md)
- [STT Providers](./03-stt-providers.md)
- [TTS Providers](./04-tts-providers.md)
- [Database Schema](./08-database-schema.md)

---

## Configuration Hierarchy

```
┌─────────────────────────────────────────────────────────────┐
│                  Configuration Priority                      │
│                    (Highest to Lowest)                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. Environment Variables      (Runtime override)           │
│           ▼                                                 │
│  2. CLI Flags                  (Command-line args)          │
│           ▼                                                 │
│  3. Config File                (config.yaml)                │
│           ▼                                                 │
│  4. Database Settings          (Persistent settings)        │
│           ▼                                                 │
│  5. Default Values             (Built-in defaults)          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Configuration File

### Primary Config (config.yaml)

```yaml
# AI Transcribe CLI Configuration
# Location: ~/.config/ai-transcribe/config.yaml

Version: "1.0"

# =============================================================================
# Server Configuration
# =============================================================================
Server:
  Host: "0.0.0.0"
  Ports:
    Http: 8030
    WebSocket: 8031
    Grpc: 8032
  
  Tls:
    Enabled: false
    CertFile: ""
    KeyFile: ""
  
  Cors:
    Enabled: true
    Origins:
      - "http://localhost:*"
      - "https://*.lovable.app"
    Methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    Headers: ["Content-Type", "Authorization", "X-Request-ID"]
  
  RateLimit:
    Enabled: true
    RequestsPerMinute: 60
    Burst: 10

# =============================================================================
# Database Configuration
# =============================================================================
Database:
  # Main settings database
  SettingsDb:
    Path: "${DATA_DIR}/settings.db"
    MaxConnections: 5
    BusyTimeout: 5000
  
  # Session-specific databases
  SessionDb:
    PathTemplate: "${DATA_DIR}/sessions/{session_id}.db"
    MaxSizeMb: 100
    CleanupAfterDays: 30
  
  # Cache database
  CacheDb:
    Path: "${DATA_DIR}/cache.db"
    MaxSizeMb: 500
    TtlHours: 24

# =============================================================================
# STT Configuration
# =============================================================================
Stt:
  DefaultProvider: "whisper"
  
  Whisper:
    Enabled: true
    ModelPath: "${MODELS_DIR}/whisper"
    ModelSize: "base"           # tiny, base, small, medium, large
    Device: "auto"               # cpu, cuda, auto
    ComputeType: "float16"      # float16, float32, int8
    Language: "auto"             # ISO code or "auto"
    BeamSize: 5
    VadEnabled: true
    VadThreshold: 0.5
  
  OpenAi:
    Enabled: false
    ApiKey: "${OPENAI_API_KEY}"
    Model: "whisper-1"
    Timeout: 30
  
  ElevenLabs:
    Enabled: false
    ApiKey: "${ELEVENLABS_API_KEY}"
    Model: "scribe_v1"
    Timeout: 30

# =============================================================================
# TTS Configuration
# =============================================================================
Tts:
  DefaultProvider: "xtts"
  
  Xtts:
    Enabled: true
    ModelPath: "${MODELS_DIR}/xtts"
    Device: "auto"
    DefaultVoice: "default"
    SampleRate: 24000
    Streaming: true
  
  ElevenLabs:
    Enabled: false
    ApiKey: "${ELEVENLABS_API_KEY}"
    DefaultVoiceId: "21m00Tcm4TlvDq8ikWAM"  # Rachel
    Model: "eleven_multilingual_v2"
    Stability: 0.5
    SimilarityBoost: 0.75
    Style: 0.0
    SpeakerBoost: true
  
  Azure:
    Enabled: false
    SubscriptionKey: "${AZURE_SPEECH_KEY}"
    Region: "eastus"
    DefaultVoice: "en-US-JennyNeural"
    OutputFormat: "audio-24khz-96kbitrate-mono-mp3"

# =============================================================================
# Audio Processing
# =============================================================================
Audio:
  # Input settings
  Input:
    SampleRate: 16000
    Channels: 1
    BitDepth: 16
    Format: "pcm"
    BufferSize: 4096
    SilenceThreshold: -40      # dB
    SilenceDuration: 1.0       # seconds before considering silence
  
  # Output settings
  Output:
    SampleRate: 24000
    Channels: 1
    Format: "wav"
    Normalize: true
    TargetLoudness: -16        # LUFS
  
  # Processing
  Processing:
    NoiseReduction: true
    NoiseThreshold: -30
    EchoCancellation: false
    AutoGainControl: true
    MaxGain: 20                # dB

# =============================================================================
# Realtime Conversation
# =============================================================================
Realtime:
  Enabled: true
  
  WebSocket:
    PingInterval: 30
    PongTimeout: 10
    MaxMessageSize: 1048576   # 1MB
  
  Vad:
    Enabled: true
    Mode: "aggressive"          # normal, low_bitrate, aggressive, very_aggressive
    FrameDuration: 30          # ms (10, 20, or 30)
    PaddingDuration: 300       # ms
  
  TurnDetection:
    Enabled: true
    SilenceDuration: 0.8       # seconds
    MinSpeechDuration: 0.1    # seconds
  
  Session:
    MaxDuration: 3600          # seconds (1 hour)
    IdleTimeout: 300           # seconds (5 min)
    MaxConcurrent: 10

# =============================================================================
# Voice Commands
# =============================================================================
VoiceCommands:
  Enabled: true
  
  WakeWord:
    Enabled: true
    Phrases:
      - "hey transcribe"
      - "ok assistant"
    Sensitivity: 0.7
    Timeout: 30
  
  Detection:
    FuzzyMatch: true
    Threshold: 0.85

# =============================================================================
# Voice Cloning
# =============================================================================
VoiceCloning:
  Enabled: true
  MaxVoices: 20
  
  Instant:
    MinDuration: 3
    MaxDuration: 30
  
  Professional:
    MinSamples: 5
    MaxSamples: 100
  
  Storage:
    Path: "${DATA_DIR}/voices"
    MaxStorageMb: 1000

# =============================================================================
# Logging
# =============================================================================
Logging:
  Level: "info"                 # debug, info, warn, error
  Format: "json"                # json, text
  Output: "stdout"              # stdout, file, both
  File:
    Path: "${LOG_DIR}/ai-transcribe.log"
    MaxSizeMb: 100
    MaxBackups: 5
    MaxAgeDays: 30
    Compress: true

# =============================================================================
# Metrics & Monitoring
# =============================================================================
Metrics:
  Enabled: true
  Endpoint: "/metrics"
  
  Prometheus:
    Enabled: true
    Port: 9090
  
  HealthCheck:
    Enabled: true
    Endpoint: "/health"
    Interval: 30

# =============================================================================
# Integration
# =============================================================================
Integration:
  AiBridge:
    Enabled: true
    Url: "http://localhost:5040"
    Timeout: 30
    RetryAttempts: 3
    RetryDelay: 1
```

---

## Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `TRANSCRIBE_DATA_DIR` | Data storage directory | `/var/lib/ai-transcribe` |
| `TRANSCRIBE_MODELS_DIR` | Model files directory | `/opt/models/transcribe` |
| `TRANSCRIBE_LOG_DIR` | Log files directory | `/var/log/ai-transcribe` |

### Provider API Keys

| Variable | Description | Required |
|----------|-------------|----------|
| `OPENAI_API_KEY` | OpenAI Whisper API key | If using OpenAI STT |
| `ELEVENLABS_API_KEY` | ElevenLabs API key | If using ElevenLabs |
| `AZURE_SPEECH_KEY` | Azure Speech key | If using Azure TTS |
| `AZURE_SPEECH_REGION` | Azure region | If using Azure TTS |

### Optional Overrides

| Variable | Description | Default |
|----------|-------------|---------|
| `TRANSCRIBE_HOST` | Server bind host | 0.0.0.0 |
| `TRANSCRIBE_PORT` | HTTP port | 8030 |
| `TRANSCRIBE_WS_PORT` | WebSocket port | 8031 |
| `TRANSCRIBE_LOG_LEVEL` | Log level | info |
| `TRANSCRIBE_STT_PROVIDER` | Default STT provider | whisper |
| `TRANSCRIBE_TTS_PROVIDER` | Default TTS provider | xtts |
| `TRANSCRIBE_WHISPER_MODEL` | Whisper model size | base |

---

## CLI Flags

```bash
# Server options
ai-transcribe serve \
  --host 0.0.0.0 \
  --port 8030 \
  --ws-port 8031 \
  --config /path/to/config.yaml

# STT options
ai-transcribe transcribe \
  --provider whisper \
  --model large \
  --language en \
  --input audio.wav \
  --output transcript.txt

# TTS options
ai-transcribe synthesize \
  --provider xtts \
  --voice "default" \
  --input "Hello world" \
  --output speech.wav

# Debug options
ai-transcribe serve \
  --debug \
  --log-level debug \
  --profile
```

---

## Configuration Types

### Go Structures

```go
type Config struct {
    Version     string
    Server      ServerConfig
    Database    DatabaseConfig
    Stt         SttConfig
    Tts         TtsConfig
    Audio       AudioConfig
    Realtime    RealtimeConfig
    VoiceCmd    VoiceCmdConfig
    VoiceClone  VoiceCloneConfig
    Logging     LoggingConfig
    Metrics     MetricsConfig
    Integration IntegrationConfig
}

type ServerConfig struct {
    Host      string
    Ports     PortsConfig
    Tls       TlsConfig
    Cors      CorsConfig
    RateLimit RateLimitConfig
}

type PortsConfig struct {
    Http      int
    WebSocket int
    Grpc      int
}

// See: 14-enum-architecture.md for enum type definitions

type SttConfig struct {
    DefaultProvider stt_provider.Variant
    Whisper         WhisperConfig
    OpenAi          OpenAiSttConfig
    ElevenLabs      ElevenLabsSttConfig
}

type TtsConfig struct {
    DefaultProvider tts_provider.Variant
    Xtts            XttsConfig
    ElevenLabs      ElevenLabsTtsConfig
    Azure           AzureTtsConfig
}
```

---

## Configuration Loading

### Loader Implementation

```go
type ConfigLoader struct {
    configPath string
    envPrefix  string
}

func (l *ConfigLoader) Load() appfault.Result[Config] {
    // 1. Load defaults
    cfg := DefaultConfig()
    
    // 2. Load from file
    if l.configPath != "" {
        if err := l.loadFromFile(cfg); err != nil {
            return nil, err
        }
    }
    
    // 3. Load from database (if exists)
    if err := l.loadFromDatabase(cfg); err != nil {
        // Database settings are optional
        log.Warn("Failed to load database settings", "error", err)
    }
    
    // 4. Apply environment variables
    l.applyEnvOverrides(cfg)
    
    // 5. Validate configuration
    if err := l.validate(cfg); err != nil {
        return nil, appfault.Wrap(
            err,
            ErrConfigInvalid,
            "validate configuration",
        )
    }
    
    return cfg, nil
}

func (l *ConfigLoader) applyEnvOverrides(cfg *Config) {
    // Environment variables override all other settings
    if host := os.Getenv("TRANSCRIBE_HOST"); host != "" {
        cfg.Server.Host = host
    }
    
    if port := os.Getenv("TRANSCRIBE_PORT"); port != "" {
        cfg.Server.Ports.HTTP, _ = strconv.Atoi(port)
    }
    
    // Expand ${VAR} in paths
    cfg.Database.SettingsDb.Path = os.ExpandEnv(cfg.Database.SettingsDb.Path)
    cfg.Stt.Whisper.ModelPath = os.ExpandEnv(cfg.Stt.Whisper.ModelPath)
    // ...
}
```

---

## Runtime Configuration API

### Update Settings

```yaml
# Get current configuration
GET /api/v1/config
Response:
  Stt:
    DefaultProvider: "whisper"
  Tts:
    DefaultProvider: "xtts"
  # ...

# Update configuration
PATCH /api/v1/config
Body:
  Stt:
    DefaultProvider: "openai"
Response:
  Updated: true
  RequiresRestart: false

# Get specific section
GET /api/v1/config/stt
Response:
  DefaultProvider: "whisper"
  Whisper:
    ModelSize: "base"
    # ...

# Reset to defaults
POST /api/v1/config/reset
Body:
  Sections: ["audio", "realtime"]
Response:
  Reset: ["audio", "realtime"]
```

---

## Validation Rules

```go
func (l *ConfigLoader) validate(cfg *Config) error {
    var errs []error
    
    // Server validation
    if cfg.Server.Ports.Http < 1 || cfg.Server.Ports.Http > 65535 {
        errs = append(errs, errors.New("invalid HTTP port"))
    }
    
    // STT validation
    if cfg.Stt.DefaultProvider != "" {
        valid := []string{"whisper", "openai", "elevenlabs"}
        if !contains(valid, cfg.Stt.DefaultProvider) {
            errs = append(errs, appfault.New(
                ErrConfigInvalid,
                "invalid stt provider",
            ).WithContext("provider", cfg.Stt.DefaultProvider))
        }
    }
    
    // Provider-specific validation
    if cfg.Stt.OpenAi.Enabled {
        if os.Getenv("OPENAI_API_KEY") == "" {
            errs = append(errs, errors.New(
                "OPENAI_API_KEY required when OpenAI STT enabled",
            ))
        }
    }
    
    // Audio validation
    validRates := []int{8000, 16000, 22050, 44100, 48000}
    if !contains(validRates, cfg.Audio.Input.SampleRate) {
        errs = append(errs, appfault.New(
            ErrConfigInvalid,
            "invalid sample rate",
        ).WithContext("sampleRate", cfg.Audio.Input.SampleRate))
    }
    
    if len(errs) > 0 {
        return errors.Join(errs...)
    }
    
    return nil
}
```

---

## Default Values

```go
func DefaultConfig() *Config {
    return &Config{
        Version: "1.0",
        Server: ServerConfig{
            Host: "0.0.0.0",
            Ports: PortsConfig{
                Http:      8030,
                WebSocket: 8031,
                Grpc:      8032,
            },
        },
        Stt: SttConfig{
            DefaultProvider: "whisper",
            Whisper: WhisperConfig{
                Enabled:     true,
                ModelSize:   "base",
                Device:      "auto",
                ComputeType: "float16",
                Language:    "auto",
                BeamSize:    5,
            },
        },
        Tts: TtsConfig{
            DefaultProvider: "xtts",
            Xtts: XttsConfig{
                Enabled:    true,
                Device:     "auto",
                SampleRate: 24000,
                Streaming:  true,
            },
        },
        Audio: AudioConfig{
            Input: AudioInputConfig{
                SampleRate: 16000,
                Channels:   1,
                BitDepth:   16,
            },
            Output: AudioOutputConfig{
                SampleRate: 24000,
                Channels:   1,
            },
        },
        Logging: LoggingConfig{
            Level:  "info",
            Format: "json",
            Output: "stdout",
        },
    }
}
```

---

## Related Specs

- [Architecture](./01-architecture.md)
- [Database Schema](./08-database-schema.md)
- [API Interface](./09-api-interface.md)
