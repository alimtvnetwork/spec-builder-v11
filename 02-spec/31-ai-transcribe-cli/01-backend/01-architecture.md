# AI Transcribe CLI: System Architecture

**Version:** 2.0.0  
**Status:** Draft  
**Updated:** 2026-03-09  

---

## Overview

This document defines the system architecture for AI Transcribe CLI, including component hierarchy, data flow, concurrency model, and integration patterns.

---

## Architectural Principles

| Principle | Implementation |
|-----------|----------------|
| **Offline-First** | Local providers (Whisper, XTTS) preferred; cloud as fallback |
| **Privacy-Centric** | Audio processed locally when possible; no cloud storage by default |
| **Low Latency** | Streaming protocols for real-time transcription |
| **Provider Agnostic** | Unified interface across STT/TTS providers |
| **Resilient** | Automatic fallback when primary provider fails |

---

## Component Hierarchy

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              Application Layer                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────────────────┐   │
│  │   CLI        │    │  HTTP Server │    │      WebSocket Server        │   │
│  │  (Cobra)     │    │   (Gin)      │    │   (gorilla/websocket)        │   │
│  │              │    │              │    │                              │   │
│  │ Commands:    │    │ Endpoints:   │    │ Channels:                    │   │
│  │ - transcribe │    │ - /transcribe│    │ - /ws/transcribe             │   │
│  │ - speak      │    │ - /synthesize│    │ - /ws/conversation           │   │
│  │ - clone      │    │ - /voices    │    │ - /ws/commands               │   │
│  │ - serve      │    │ - /health    │    │                              │   │
│  └──────┬───────┘    └──────┬───────┘    └──────────────┬───────────────┘   │
│         │                   │                           │                    │
│         └───────────────────┼───────────────────────────┘                    │
│                             │                                                │
├─────────────────────────────▼────────────────────────────────────────────────┤
│                              Core Engine Layer                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                        TranscribeEngine                              │    │
│  │  - Orchestrates all audio processing pipelines                       │    │
│  │  - Manages provider selection and fallback                           │    │
│  │  - Coordinates real-time streaming sessions                          │    │
│  └───────────────────────────────┬─────────────────────────────────────┘    │
│                                  │                                           │
│         ┌────────────────────────┼────────────────────────┐                 │
│         │                        │                        │                  │
│  ┌──────▼──────┐         ┌───────▼───────┐        ┌───────▼───────┐         │
│  │ AudioPipeline│         │  STTEngine    │        │   TTSEngine   │         │
│  │              │         │               │        │               │         │
│  │ - Capture    │         │ - Transcribe  │        │ - Synthesize  │         │
│  │ - VAD        │         │ - Stream      │        │ - Clone       │         │
│  │ - Preprocess │         │ - Detect lang │        │ - Manage      │         │
│  │ - Encode     │         │ - Diarize     │        │ - Stream      │         │
│  └──────────────┘         └───────────────┘        └───────────────┘         │
│                                                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                              Provider Layer                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────── STT Providers ────────────────┐  ┌── TTS Providers ────┐ │
│  │                                                │  │                     │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────┐ │  │ ┌────────┐ ┌──────┐ │ │
│  │  │ Whisper  │  │  OpenAI  │  │  ElevenLabs  │ │  │ │  XTTS  │ │ 11L  │ │ │
│  │  │  Local   │  │ Realtime │  │   Scribe     │ │  │ │ Local  │ │Cloud │ │ │
│  │  └──────────┘  └──────────┘  └──────────────┘ │  │ └────────┘ └──────┘ │ │
│  │                                                │  │                     │ │
│  └────────────────────────────────────────────────┘  └─────────────────────┘ │
│                                                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                              Infrastructure Layer                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │  Database   │  │   Config    │  │   Logger    │  │     Metrics         │ │
│  │  Manager    │  │   Manager   │  │ (zerolog)   │  │   (Prometheus)      │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────────────┘ │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Core Components

### 1. TranscribeEngine

Central orchestrator that manages all audio processing pipelines.

```go
type TranscribeEngine struct {
    audio      *AudioPipeline
    stt        *STTEngine
    tts        *TTSEngine
    commands   *CommandEngine
    db         *DatabaseManager
    config     *Config
    logger     zerolog.Logger
    
    // Session management
    sessions   sync.Map  // map[SessionId]*Session
    
    // Provider health tracking
    sttHealth  *ProviderHealth
    ttsHealth  *ProviderHealth
}

// See: 14-enum-architecture.md for enum type definitions
type EngineConfig struct {
    // Provider selection
    SttProvider           stt_provider.Variant
    TtsProvider           tts_provider.Variant
    
    // Fallback behavior
    EnableFallback        bool // Auto-switch on failure
    FallbackTimeout       int  // Seconds before fallback
    
    // Resource limits
    MaxConcurrentSessions int
    AudioBufferSize       int  // Bytes
}
```

### 2. AudioPipeline

Handles audio capture, preprocessing, and encoding.

```go
type AudioPipeline struct {
    capturer   *AudioCapturer
    vad        *VoiceActivityDetector
    encoder    *AudioEncoder
    player     *AudioPlayer
    
    // Streaming buffers
    inputChan  chan []byte
    outputChan chan *AudioChunk
}

type AudioChunk struct {
    Id         string               // 16000, 44100, 48000
    Data       []byte
    Format     audio_format.Variant
    SampleRate int                  // 16000, 44100, 48000
    Channels   int                  // 1 (mono)
    Duration   float64              // Seconds
    IsSpeech   bool                 // VAD result
    Timestamp  time.Time
}
```

### 3. STTEngine

Orchestrates speech-to-text across providers.

```go
import stdctx "context"

type STTEngine struct {
    providers  map[string]STTProvider
    primary    string
    fallback   []string
    health     *ProviderHealth
}

type STTProvider interface {
    Name() string
    Transcribe(context stdctx.Context, audio *AudioChunk, opts *TranscribeOptions) appfault.Result[Transcript]
    TranscribeStream(context stdctx.Context, audioChan <-chan *AudioChunk, opts *TranscribeOptions) appfault.Result[<-chan *PartialTranscript]
    DetectLanguage(context stdctx.Context, audio *AudioChunk) appfault.Result[LanguageDetection]
    IsAvailable() bool
    Health() ProviderStatus
}

type TranscribeOptions struct {
    Language       string // ISO 639-1 or "auto"
    Task           string // "transcribe" or "translate"
    EnableVad      bool
    Diarize        bool
    TagAudioEvents bool
    WordTimestamps bool
}
```

### 4. TTSEngine

Orchestrates text-to-speech synthesis across providers.

```go
type TTSEngine struct {
    providers  map[string]TTSProvider
    primary    string
    fallback   []string
    voices     *VoiceManager
}

type TTSProvider interface {
    Name() string
    Synthesize(context stdctx.Context, text string, opts *SynthesizeOptions) appfault.Result[AudioResult]
    SynthesizeStream(context stdctx.Context, text string, opts *SynthesizeOptions) appfault.Result[<-chan *AudioChunk]
    ListVoices() appfault.Result[[]Voice]
    CloneVoice(context stdctx.Context, name string, samples [][]byte) appfault.Result[Voice]
    IsAvailable() bool
    Health() ProviderStatus
}

type SynthesizeOptions struct {
    VoiceId         string  // 0.7-1.2
    ModelId         string
    Language        string
    Speed           float64 // 0.7-1.2
    Stability       float64 // 0-1
    SimilarityBoost float64 // 0-1
    Style           float64 // 0-1
    OutputFormat    string  // "mp3", "pcm", "opus"
    SampleRate      int
}
```

---

## Data Flow

### Batch Transcription Flow

```
┌──────────┐     ┌─────────────┐     ┌──────────────┐     ┌───────────────┐
│  Audio   │────▶│   Audio     │────▶│    STT       │────▶│   Database    │
│  Input   │     │   Pipeline  │     │   Engine     │     │   Storage     │
└──────────┘     └─────────────┘     └──────────────┘     └───────────────┘
                       │                    │
                       │ VAD               │ Provider
                       │ Encoding          │ Selection
                       ▼                    ▼
                 ┌─────────────┐     ┌──────────────┐
                 │  Preprocess │     │   Whisper    │
                 │  - Noise    │     │   OpenAI     │
                 │  - Normalize│     │   ElevenLabs │
                 └─────────────┘     └──────────────┘
```

### Real-time Streaming Flow

```
┌───────────────────────────────────────────────────────────────────────────┐
│                         Client (Browser/App)                               │
├───────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  ┌─────────────┐                                    ┌─────────────────┐   │
│  │ Microphone  │──────Audio Chunks────────────────▶│ WebSocket Send  │   │
│  └─────────────┘                                    └────────┬────────┘   │
│                                                              │            │
│  ┌─────────────┐                                    ┌────────┼────────┐   │
│  │  Display    │◀──────Transcripts──────────────── │ WebSocket Recv  │   │
│  └─────────────┘                                    └────────┼────────┘   │
│                                                              │            │
└──────────────────────────────────────────────────────────────│────────────┘
                                                               │
                            WebSocket Connection               │
                                                               │
┌──────────────────────────────────────────────────────────────│────────────┐
│                       AI Transcribe Server                   │            │
├──────────────────────────────────────────────────────────────│────────────┤
│                                                               │            │
│  ┌───────────────────────────────────────────────────────────┼──────────┐ │
│  │                     Session Manager                       │          │ │
│  │                                                           ▼          │ │
│  │  ┌──────────────┐      ┌──────────────┐      ┌──────────────────┐   │ │
│  │  │ Audio Buffer │─────▶│   VAD        │─────▶│ Provider Router  │   │ │
│  │  │ (ring buffer)│      │ (silero/webrtc)     │ (round-robin)    │   │ │
│  │  └──────────────┘      └──────────────┘      └────────┬─────────┘   │ │
│  │                                                        │             │ │
│  │                        ┌──────────────────────────────┐│             │ │
│  │                        │      STT Provider            ││             │ │
│  │                        │  ┌─────────┐ ┌───────────┐   ││             │ │
│  │                        │  │ Whisper │ │ OpenAI RT │   │◀             │ │
│  │                        │  └─────────┘ └───────────┘   │              │ │
│  │                        └──────────────────────────────┘              │ │
│  │                                       │                               │ │
│  │                                       ▼                               │ │
│  │  ┌──────────────────────────────────────────────────────────────┐    │ │
│  │  │              Transcript Handler                               │    │ │
│  │  │  - Partial transcripts → immediate broadcast                  │    │ │
│  │  │  - Committed transcripts → database + broadcast               │    │ │
│  │  └──────────────────────────────────────────────────────────────┘    │ │
│  │                                                                       │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## Concurrency Model

### Session Management

Each client connection spawns a dedicated session with isolated goroutines:

```go
type Session struct {
    Id           string
    ClientId     string
    StartedAt    time.Time
    
    // Goroutine coordination
    context      stdctx.Context
    cancel       stdctx.CancelFunc
    wg           sync.WaitGroup
    
    // Channels
    audioIn      chan *AudioChunk      // Audio from client
    transcriptOut chan *Transcript     // Transcripts to client
    controlIn    chan *ControlMessage  // Control messages
    
    // State
    state        SessionState
    provider     string
    options      *TranscribeOptions
}

func (s *Session) Start() {
    s.wg.Add(3)
    
    go s.audioProcessor()     // Handles audio chunks
    go s.transcriptionWorker() // Processes transcription
    go s.outputHandler()       // Sends results to client
}

func (s *Session) Stop() {
    s.cancel()
    s.wg.Wait()
}
```

### Worker Pool for Batch Processing

```go
type BatchProcessor struct {
    workers    int
    jobQueue   chan *TranscribeJob
    resultChan chan *TranscribeResult
    wg         sync.WaitGroup
}

type TranscribeJob struct {
    Id        string
    AudioPath string
    Options   *TranscribeOptions
    Callback  func(*TranscribeResult)
}

func (bp *BatchProcessor) Start(context stdctx.Context) {
    for i := 0; i < bp.workers; i++ {
        bp.wg.Add(1)
        go bp.worker(context, i)
    }
}

func (bp *BatchProcessor) worker(context stdctx.Context, id int) {
    defer bp.wg.Done()
    
    for {
        select {
        case <-context.Done():
            return
        case job := <-bp.jobQueue:
            result := bp.processJob(job)
            bp.resultChan <- result
        }
    }
}
```

---

## Provider Selection Strategy

### Automatic Fallback

```go
type ProviderSelector struct {
    providers  []ProviderConfig
    health     map[string]*HealthStatus
    strategy   SelectionStrategy  // "priority", "round-robin", "latency"
}

type ProviderConfig struct {
    Name       string  // Lower = higher priority
    Priority   int     // Lower = higher priority
    Weight     float64 // For weighted selection
    MaxLatency int     // MS threshold
    Enabled    bool
}

func (ps *ProviderSelector) Select(context stdctx.Context) appfault.Result[STTProvider] {
    // 1. Filter available providers
    available := ps.filterAvailable()
    
    // 2. Sort by strategy
    switch ps.strategy {
    case "priority":
        sort.Slice(available, func(i, j int) bool {
            return available[i].Priority < available[j].Priority
        })
    case "latency":
        sort.Slice(available, func(i, j int) bool {
            return ps.health[available[i].Name].AvgLatency < 
                   ps.health[available[j].Name].AvgLatency
        })
    }
    
    // 3. Return first available
    for _, cfg := range available {
        if provider, ok := ps.providers[cfg.Name]; ok {
            if provider.IsAvailable() {
                return provider, nil
            }
        }
    }
    
    return nil, appfault.New(
        ErrSttProviderUnavailable,
        "no available stt provider",
    )
}
```

### Health Monitoring

```go
type HealthStatus struct {
    Provider     string
    Status       string     // "healthy", "degraded", "unhealthy"
    LastCheck    time.Time
    AvgLatency   int        // Milliseconds
    ErrorRate    float64    // 0-1
    Consecutive  int        // Consecutive failures
}

func (ps *ProviderSelector) StartHealthCheck(context stdctx.Context) {
    ticker := time.NewTicker(30 * time.Second)
    defer ticker.Stop()
    
    for {
        select {
        case <-context.Done():
            return
        case <-ticker.C:
            for name, provider := range ps.providers {
                status := provider.Health()
                ps.health[name] = &HealthStatus{
                    Provider:   name,
                    Status:     status.Status,
                    LastCheck:  time.Now(),
                    AvgLatency: status.AvgLatency,
                    ErrorRate:  status.ErrorRate,
                }
            }
        }
    }
}
```

---

## Integration Patterns

### AI Bridge Delegation

AI Bridge delegates voice operations to Transcribe CLI:

```go
// In AI Bridge CLI
type VoiceDelegate struct {
    endpoint   string
    client     *http.Client
    timeout    time.Duration
}

func (vd *VoiceDelegate) Transcribe(context stdctx.Context, audio []byte) appfault.Result[Transcript] {
    req, _ := http.NewRequestWithContext(context, httpmethod.Post.String(), 
        vd.endpoint+"/api/v1/transcribe", 
        bytes.NewReader(audio))
    
    req.Header.Set("Content-Type", "audio/webm")
    
    resp, err := vd.client.Do(req)
    if err != nil {
        return nil, appfault.Wrap(
            err,
            ErrSttDelegationFailed,
            "transcribe delegation",
        )
    }
    defer resp.Body.Close()
    
    var result Transcript
    json.NewDecoder(resp.Body).Decode(&result)
    return &result, nil
}
```

### Event-Driven Architecture

```go
type EventBus struct {
    subscribers map[string][]chan Event
    mu          sync.RWMutex
}

// EventData holds typed fields for all event categories.
// Only relevant fields are populated per event type.
type EventData struct {
    Text       string  // transcript.partial, transcript.committed
    IsFinal    bool    // transcript.partial, transcript.committed
    Confidence float64 // transcript.partial, transcript.committed
    Provider   string  // provider.switch — new provider name
    Reason     string  // error, provider.switch — switch reason or error description
    ErrorCode  int     // error — machine-readable error code
}

type Event struct {
    Type      string
    Timestamp time.Time
    SessionId string
    Data      EventData
}

const (
    EventTranscriptPartial   = "transcript.partial"
    EventTranscriptCommitted = "transcript.committed"
    EventSpeechStart         = "speech.start"
    EventSpeechEnd           = "speech.end"
    EventProviderSwitch      = "provider.switch"
    EventError               = "error"
)

func (eb *EventBus) Publish(event Event) {
    eb.mu.RLock()
    defer eb.mu.RUnlock()
    
    if subs, ok := eb.subscribers[event.Type]; ok {
        for _, ch := range subs {
            select {
            case ch <- event:
            default:
                // Drop if subscriber is slow
            }
        }
    }
}
```

---

## Resource Management

### Memory Limits

```go
type ResourceLimits struct {
    MaxAudioBufferMb      int // Per session
    MaxConcurrentSessions int
    MaxTranscriptSizeMb   int
    ModelCacheGb          int // For Whisper models
}

func (engine *TranscribeEngine) EnforceMemoryLimits() {
    var m runtime.MemStats
    runtime.ReadMemStats(&m)
    
    // If memory usage exceeds 80%, start cleanup
    if m.Alloc > uint64(engine.limits.MaxTotalMemoryGB * 0.8 * 1024 * 1024 * 1024) {
        engine.cleanupOldestSessions()
        runtime.GC()
    }
}
```

### Model Loading

```go
type ModelManager struct {
    modelsDir   string
    loaded      map[string]*LoadedModel
    maxLoaded   int
    mu          sync.RWMutex
}

type LoadedModel struct {
    Name       string
    Path       string
    Size       int64
    LoadedAt   time.Time
    LastUsed   time.Time
    UseCount   int64
}

func (mm *ModelManager) GetModel(name string) appfault.Result[LoadedModel] {
    mm.mu.Lock()
    defer mm.mu.Unlock()
    
    // Check if already loaded
    if model, ok := mm.loaded[name]; ok {
        model.LastUsed = time.Now()
        model.UseCount++
        return model, nil
    }
    
    // Evict LRU if at capacity
    if len(mm.loaded) >= mm.maxLoaded {
        mm.evictLRU()
    }
    
    // Load model
    return mm.loadModel(name)
}
```

---

## See Also

- [Audio Pipeline](./02-audio-pipeline.md) — Detailed audio processing
- [STT Providers](./03-stt-providers.md) — Provider implementations
- [TTS Providers](./04-tts-providers.md) — Synthesis providers
- [API Interface](./09-api-interface.md) — REST/WebSocket endpoints
