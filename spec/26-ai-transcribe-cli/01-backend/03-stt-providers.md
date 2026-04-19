# AI Transcribe CLI: STT Providers

**Version:** 2.0.0  
**Status:** Draft  
**Updated:** 2026-03-09  

---

## Overview

This document specifies the Speech-to-Text (STT) provider implementations for AI Transcribe CLI. The system supports local and cloud providers with automatic fallback.

---

## Provider Priority

```
Priority Order:
1. Whisper (Local) — Default, offline, privacy-first
2. OpenAI Realtime — Cloud fallback, low latency streaming
3. ElevenLabs Scribe — Cloud fallback, high accuracy + diarization
```

---

## Provider Interface

```go
import stdctx "context"

type STTProvider interface {
    // Core operations
    Name() string
    Transcribe(context stdctx.Context, audio *AudioChunk, opts *TranscribeOptions) apperror.Result[Transcript]
    TranscribeStream(context stdctx.Context, audioChan <-chan *AudioChunk, opts *TranscribeOptions) apperror.Result[<-chan *PartialTranscript]
    
    // Language support
    DetectLanguage(context stdctx.Context, audio *AudioChunk) apperror.Result[LanguageDetection]
    SupportedLanguages() []string
    
    // Health and status
    IsAvailable() bool
    Health() ProviderStatus
    Initialize(context stdctx.Context, config *ProviderConfig) *apperror.AppError
    Shutdown() *apperror.AppError
}

type TranscribeOptions struct {
    Language         string   // ISO 639-1 ("en", "es") or "auto"
    Task             string   // "transcribe" or "translate"
    EnableVad        bool     // Use internal VAD
    Diarize          bool     // Speaker identification
    TagAudioEvents   bool     // Detect laughter, music, etc.
    WordTimestamps   bool     // Per-word timing
    MaxDuration      float64  // Max audio length (seconds)
    Prompt           string   // Context/vocabulary hint
}

type Transcript struct {
    Id              string
    Text            string
    Language        string
    LanguageProb    float64
    Duration        float64
    Words           []Word           `json:",omitempty"`
    Segments        []Segment        `json:",omitempty"`
    Speakers        []Speaker        `json:",omitempty"`
    AudioEvents     []AudioEvent     `json:",omitempty"`
    Provider        string
    ProcessingTime  float64
    CreatedAt       time.Time
}

type Word struct {
    Text       string
    Start      float64  // Seconds
    End        float64  // Seconds
    Confidence float64  // 0-1
    Speaker    string   `json:",omitempty"`
}

type Segment struct {
    Id         int
    Text       string
    Start      float64
    End        float64
    Speaker    string   `json:",omitempty"`
    Confidence float64
}

type Speaker struct {
    Id    string
    Label string
}

type AudioEvent struct {
    Type  string   // "laughter", "applause", "music"
    Start float64
    End   float64
}

type PartialTranscript struct {
    Text       string
    IsFinal    bool
    Confidence float64
    Timestamp  time.Time
}
```

---

## 1. Whisper Provider (Local)

Local speech recognition using whisper.cpp for offline, privacy-first transcription.

### Configuration

```go
type WhisperConfig struct {
    ModelPath      string  // Path to .bin model file
    ModelSize      string  // "tiny", "base", "small", "medium", "large"
    Device         string  // "cpu", "cuda", "metal"
    Threads        int     // CPU threads
    MaxContext     int     // Context window (448 tokens default)
    BeamSize       int     // Beam search width
    BestOf         int     // Best of N sampling
    Temperature    float64 // Sampling temperature
    SpeedUp        bool    // 2x speedup (lower quality)
    Translate      bool    // Translate to English
    DetectLanguage bool    // Auto-detect language
}
```

### Model Variants

| Model | Size | VRAM | Speed | Quality | Use Case |
|-------|------|------|-------|---------|----------|
| tiny | 39MB | ~1GB | Very Fast | Fair | Quick transcription |
| base | 74MB | ~1GB | Fast | Good | Default for most |
| small | 244MB | ~2GB | Medium | Better | Higher accuracy |
| medium | 769MB | ~5GB | Slow | High | Professional use |
| large-v3 | 1.55GB | ~10GB | Very Slow | Excellent | Maximum accuracy |

### Implementation

```go
type WhisperProvider struct {
    config         *WhisperConfig
    model          *whisper.Model
    whisperContext *whisper.Context
    mu             sync.Mutex
    isReady        bool
}

func NewWhisperProvider(config *WhisperConfig) apperror.Result[WhisperProvider] {
    return &WhisperProvider{
        config: config,
    }, nil
}

func (wp *WhisperProvider) Initialize(context stdctx.Context, config *ProviderConfig) *apperror.AppError {
    wp.mu.Lock()
    defer wp.mu.Unlock()
    
    // Load model
    model, err := whisper.Load(wp.config.ModelPath)
    if err != nil {
        return apperror.Wrap(
            err,
            ErrSttModelLoadFailed,
            "load whisper model",
        )
    }
    
    wp.model = model
    wp.whisperContext = model.NewContext()
    
    // Configure context
    wp.whisperContext.SetThreads(wp.config.Threads)
    if wp.config.SpeedUp {
        wp.whisperContext.SetSpeedUp(true)
    }
    
    wp.isReady = true
    return nil
}

func (wp *WhisperProvider) Transcribe(context stdctx.Context, audio *AudioChunk, opts *TranscribeOptions) apperror.Result[Transcript] {
    wp.mu.Lock()
    defer wp.mu.Unlock()
    
    if !wp.isReady {
        return nil, apperror.New(
            ErrSttModelNotLoaded,
            "whisper model not initialized",
        )
    }
    
    start := time.Now()
    
    // Convert to float32 samples
    samples := wp.toFloat32(audio.Data)
    
    // Configure transcription
    wp.whisperContext.SetLanguage(opts.Language)
    if opts.Task == "translate" {
        wp.whisperContext.SetTranslate(true)
    }
    
    // Process audio
    if err := wp.whisperContext.Process(samples); err != nil {
        return nil, apperror.Wrap(
            err,
            ErrSttTranscriptionFailed,
            "whisper processing",
        )
    }
    
    // Extract results
    var segments []Segment
    var words []Word
    
    for i := 0; i < wp.whisperContext.SegmentCount(); i++ {
        seg := Segment{
            Id:    i,
            Text:  wp.whisperContext.SegmentText(i),
            Start: float64(wp.whisperContext.SegmentStartTime(i)) / 1000.0,
            End:   float64(wp.whisperContext.SegmentEndTime(i)) / 1000.0,
        }
        segments = append(segments, seg)
        
        // Extract words if requested
        if opts.WordTimestamps {
            for j := 0; j < wp.whisperContext.TokenCount(i); j++ {
                token := wp.whisperContext.Token(i, j)
                if !token.IsSpecial {
                    words = append(words, Word{
                        Text:       token.Text,
                        Start:      float64(token.Start) / 1000.0,
                        End:        float64(token.End) / 1000.0,
                        Confidence: float64(token.Prob),
                    })
                }
            }
        }
    }
    
    // Combine segment texts
    var fullText strings.Builder
    for _, seg := range segments {
        fullText.WriteString(seg.Text)
    }
    
    return &Transcript{
        Id:             uuid.New().String(),
        Text:           strings.TrimSpace(fullText.String()),
        Language:       wp.whisperContext.Language(),
        Duration:       audio.Duration,
        Segments:       segments,
        Words:          words,
        Provider:       "whisper",
        ProcessingTime: time.Since(start).Seconds(),
        CreatedAt:      time.Now(),
    }, nil
}

func (wp *WhisperProvider) TranscribeStream(context stdctx.Context, audioChan <-chan *AudioChunk, opts *TranscribeOptions) apperror.Result[<-chan *PartialTranscript] {
    resultChan := make(chan *PartialTranscript, 100)
    
    go func() {
        defer close(resultChan)
        
        var buffer []float32
        chunkSize := 16000 * 5 // 5 seconds of audio at 16kHz
        
        for {
            select {
            case <-context.Done():
                return
            case chunk, ok := <-audioChan:
                if !ok {
                    // Process remaining buffer
                    if len(buffer) > 0 {
                        wp.processBuffer(buffer, opts, resultChan, true)
                    }
                    return
                }
                
                samples := wp.toFloat32(chunk.Data)
                buffer = append(buffer, samples...)
                
                // Process when we have enough audio
                if len(buffer) >= chunkSize {
                    wp.processBuffer(buffer[:chunkSize], opts, resultChan, false)
                    buffer = buffer[chunkSize:]
                }
            }
        }
    }()
    
    return resultChan, nil
}

func (wp *WhisperProvider) processBuffer(samples []float32, opts *TranscribeOptions, out chan<- *PartialTranscript, isFinal bool) {
    wp.mu.Lock()
    defer wp.mu.Unlock()
    
    wp.whisperContext.Process(samples)
    
    var text strings.Builder
    for i := 0; i < wp.whisperContext.SegmentCount(); i++ {
        text.WriteString(wp.whisperContext.SegmentText(i))
    }
    
    out <- &PartialTranscript{
        Text:      strings.TrimSpace(text.String()),
        IsFinal:   isFinal,
        Timestamp: time.Now(),
    }
}

func (wp *WhisperProvider) Name() string {
    return "whisper"
}

func (wp *WhisperProvider) IsAvailable() bool {
    return wp.isReady && wp.model != nil
}

func (wp *WhisperProvider) SupportedLanguages() []string {
    return []string{
        "en", "zh", "de", "es", "ru", "ko", "fr", "ja", "pt", "tr",
        "pl", "ca", "nl", "ar", "sv", "it", "id", "hi", "fi", "vi",
        "he", "uk", "el", "ms", "cs", "ro", "da", "hu", "ta", "no",
        "th", "ur", "hr", "bg", "lt", "la", "mi", "ml", "cy", "sk",
        "te", "fa", "lv", "bn", "sr", "az", "sl", "kn", "et", "mk",
        // ... 99 languages total
    }
}
```

---

## 2. OpenAI Realtime Provider (Cloud)

Low-latency streaming transcription using OpenAI's Realtime API.

### Configuration

```go
type OpenAiRealtimeConfig struct {
    ApiKey       string
    Model        string   // "whisper-1" or realtime model
    Endpoint     string   // WebSocket endpoint
    MaxRetries   int
    Timeout      int      // Seconds
}
```

### Implementation

```go
type OpenAIRealtimeProvider struct {
    config     *OpenAIRealtimeConfig
    conn       *websocket.Conn
    isReady    bool
    mu         sync.RWMutex
    
    // Connection state
    sessionId  string
    reconnects int
}

func NewOpenAIRealtimeProvider(config *OpenAIRealtimeConfig) *OpenAIRealtimeProvider {
    return &OpenAIRealtimeProvider{
        config: config,
    }
}

func (op *OpenAIRealtimeProvider) Initialize(context stdctx.Context, config *ProviderConfig) error {
    // Connect to WebSocket endpoint
    headers := http.Header{
        "Authorization": []string{"Bearer " + op.config.ApiKey},
        "OpenAI-Beta":   []string{"realtime=v1"},
    }
    
    conn, _, err := websocket.DefaultDialer.DialContext(context, op.config.Endpoint, headers)
    if err != nil {
        return apperror.Wrap(
            err,
            ErrSttStreamingFailed,
            "connect to openai realtime",
        )
    }
    
    op.conn = conn
    op.isReady = true
    
    // Start session — typed structs for OpenAI Realtime API
    sessionConfig := OpenAiSessionUpdate{
        Type: "session.update",
        Session: OpenAiSessionConfig{
            Modalities:       []string{"text", "audio"},
            InputAudioFormat: "pcm16",
            TurnDetection: OpenAiTurnDetection{
                Type: "server_vad",
            },
        },
    }
    
    return conn.WriteJson(sessionConfig)
}

func (op *OpenAIRealtimeProvider) TranscribeStream(context stdctx.Context, audioChan <-chan *AudioChunk, opts *TranscribeOptions) apperror.Result[<-chan *PartialTranscript] {
    resultChan := make(chan *PartialTranscript, 100)
    
    // Audio sender goroutine
    go func() {
        for {
            select {
            case <-context.Done():
                return
            case chunk, ok := <-audioChan:
                if !ok {
                    // Send input_audio_buffer.commit
                    op.conn.WriteJson(map[string]string{
                        "type": "input_audio_buffer.commit",
                    })
                    return
                }
                
                // Send audio chunk
                audioBase64 := base64.StdEncoding.EncodeToString(chunk.Data)
                op.conn.WriteJson(OpenAiAudioAppend{
                    Type:  "input_audio_buffer.append",
                    Audio: audioBase64,
                })
            }
        }
    }()
    
    // Response receiver goroutine
    go func() {
        defer close(resultChan)
        
        for {
            select {
            case <-context.Done():
                return
            default:
                // ALLOWED: OpenAI Realtime API returns polymorphic message types
                // EXEMPTED: external WebSocket API — OpenAI realtime protocol returns dynamic JSON (§7.2)
                var msg map[string]any
                if err := op.conn.ReadJson(&msg); err != nil {
                    return
                }
                
                msgType, _ := msg["type"].(string)
                switch msgType {
                case "conversation.item.input_audio_transcription.completed":
                    transcript, _ := msg["transcript"].(string)
                    resultChan <- &PartialTranscript{
                        Text:      transcript,
                        IsFinal:   true,
                        Timestamp: time.Now(),
                    }
                    
                case "conversation.item.input_audio_transcription.delta":
                    delta, _ := msg["delta"].(string)
                    resultChan <- &PartialTranscript{
                        Text:      delta,
                        IsFinal:   false,
                        Timestamp: time.Now(),
                    }
                }
            }
        }
    }()
    
    return resultChan, nil
}

func (op *OpenAIRealtimeProvider) Transcribe(context stdctx.Context, audio *AudioChunk, opts *TranscribeOptions) apperror.Result[Transcript] {
    // For batch transcription, use whisper-1 via REST API
    client := &http.Client{Timeout: time.Duration(op.config.Timeout) * time.Second}
    
    // Create multipart form
    var body bytes.Buffer
    writer := multipart.NewWriter(&body)
    
    // Add audio file
    part, _ := writer.CreateFormFile("file", "audio.wav")
    part.Write(audio.Data)
    
    // Add parameters
    writer.WriteField("model", "whisper-1")
    if opts.Language != "auto" {
        writer.WriteField("language", opts.Language)
    }
    if opts.WordTimestamps {
        writer.WriteField("timestamp_granularities[]", "word")
        writer.WriteField("response_format", "verbose_json")
    }
    writer.Close()
    
    req, _ := http.NewRequestWithContext(context, httpmethod.Post.String(), 
        "https://api.openai.com/v1/audio/transcriptions", &body)
    req.Header.Set("Authorization", "Bearer "+op.config.ApiKey)
    req.Header.Set("Content-Type", writer.FormDataContentType())
    
    resp, err := client.Do(req)
    if err != nil {
        return nil, err
    }
    defer resp.Body.Close()
    
    // EXEMPTED: External API (OpenAI Whisper REST) — lowercase keys
    var result struct {
        Text     string  `json:"text"`
        Language string  `json:"language"`
        Duration float64 `json:"duration"`
        Words    []struct {
            Word  string  `json:"word"`
            Start float64 `json:"start"`
            End   float64 `json:"end"`
        } `json:"words"`
    }
    
    if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
        return nil, err
    }
    
    transcript := &Transcript{
        Id:        uuid.New().String(),
        Text:      result.Text,
        Language:  result.Language,
        Duration:  result.Duration,
        Provider:  "openai",
        CreatedAt: time.Now(),
    }
    
    for _, w := range result.Words {
        transcript.Words = append(transcript.Words, Word{
            Text:  w.Word,
            Start: w.Start,
            End:   w.End,
        })
    }
    
    return transcript, nil
}

func (op *OpenAIRealtimeProvider) Name() string {
    return "openai"
}

func (op *OpenAIRealtimeProvider) IsAvailable() bool {
    op.mu.RLock()
    defer op.mu.RUnlock()
    return op.isReady && op.config.ApiKey != ""
}
```

---

## 3. ElevenLabs Scribe Provider (Cloud)

High-accuracy transcription with speaker diarization and audio event detection.

### Configuration

```go
type ElevenLabsScribeConfig struct {
    ApiKey            string // "scribe_v2" or "scribe_v2_realtime"
    Model             string // "scribe_v2" or "scribe_v2_realtime"
    Endpoint          string // Base API URL
    TagAudioEvents    bool   // Detect laughter, music
    Diarize           bool   // Speaker identification
    MaxConcurrentJobs int
}
```

### Implementation

```go
type ElevenLabsScribeProvider struct {
    config      *ElevenLabsScribeConfig
    client      *http.Client
    isReady     bool
}

func NewElevenLabsScribeProvider(config *ElevenLabsScribeConfig) *ElevenLabsScribeProvider {
    return &ElevenLabsScribeProvider{
        config: config,
        client: &http.Client{Timeout: 120 * time.Second},
    }
}

func (ep *ElevenLabsScribeProvider) Initialize(context stdctx.Context, config *ProviderConfig) error {
    // Verify API key
    req, _ := http.NewRequestWithContext(context, httpmethod.Get.String(), 
        ep.config.Endpoint+"/v1/user", nil)
    req.Header.Set("xi-api-key", ep.config.ApiKey)
    
    resp, err := ep.client.Do(req)
    if err != nil {
        return apperror.Wrap(
            err,
            ErrSttApiKeyInvalid,
            "verify elevenlabs api key",
        )
    }
    defer resp.Body.Close()
    
    if resp.StatusCode != 200 {
        return apperror.New(
            ErrSttApiKeyInvalid,
            "elevenlabs api key invalid",
        ).WithContext("statusCode", resp.StatusCode)
    }
    
    ep.isReady = true
    return nil
}

func (ep *ElevenLabsScribeProvider) Transcribe(context stdctx.Context, audio *AudioChunk, opts *TranscribeOptions) apperror.Result[Transcript] {
    // Create multipart form
    var body bytes.Buffer
    writer := multipart.NewWriter(&body)
    
    // Add audio file
    part, _ := writer.CreateFormFile("file", "audio.mp3")
    part.Write(audio.Data)
    
    // Add parameters
    writer.WriteField("model_id", ep.config.Model)
    if opts.Language != "auto" && opts.Language != "" {
        writer.WriteField("language_code", ep.toISO6393(opts.Language))
    }
    writer.WriteField("tag_audio_events", fmt.Sprintf("%t", opts.TagAudioEvents || ep.config.TagAudioEvents))
    writer.WriteField("diarize", fmt.Sprintf("%t", opts.Diarize || ep.config.Diarize))
    writer.Close()
    
    req, _ := http.NewRequestWithContext(context, httpmethod.Post.String(),
        ep.config.Endpoint+"/v1/speech-to-text", &body)
    req.Header.Set("xi-api-key", ep.config.ApiKey)
    req.Header.Set("Content-Type", writer.FormDataContentType())
    
    start := time.Now()
    resp, err := ep.client.Do(req)
    if err != nil {
        return nil, apperror.Wrap(
            err,
            ErrSttTranscriptionFailed,
            "elevenlabs transcription request",
        )
    }
    defer resp.Body.Close()
    
    if resp.StatusCode != 200 {
        bodyBytes, _ := io.ReadAll(resp.Body)
        return nil, apperror.New(
            ErrSttTranscriptionFailed,
            "elevenlabs transcription error",
        ).
            WithContext("statusCode", resp.StatusCode).
            WithContext("body", string(bodyBytes))
    }
    
    // EXEMPTED: External API (ElevenLabs Scribe) — lowercase/snake_case keys
    var result struct {
        Text        string `json:"text"`
        Words       []struct {
            Text    string  `json:"text"`
            Start   float64 `json:"start"`
            End     float64 `json:"end"`
            Speaker string  `json:"speaker,omitempty"`
        } `json:"words"`
        AudioEvents []struct {
            Type  string  `json:"type"`
            Start float64 `json:"start"`
            End   float64 `json:"end"`
        } `json:"audio_events,omitempty"`
    }
    
    if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
        return nil, apperror.Wrap(
            err,
            ErrSttTranscriptionFailed,
            "parse elevenlabs response",
        )
    }
    
    transcript := &Transcript{
        Id:             uuid.New().String(),
        Text:           result.Text,
        Duration:       audio.Duration,
        Provider:       "elevenlabs",
        ProcessingTime: time.Since(start).Seconds(),
        CreatedAt:      time.Now(),
    }
    
    // Map words
    speakerSet := make(map[string]bool)
    for _, w := range result.Words {
        transcript.Words = append(transcript.Words, Word{
            Text:    w.Text,
            Start:   w.Start,
            End:     w.End,
            Speaker: w.Speaker,
        })
        if w.Speaker != "" {
            speakerSet[w.Speaker] = true
        }
    }
    
    // Map speakers
    for speaker := range speakerSet {
        transcript.Speakers = append(transcript.Speakers, Speaker{
            Id:    speaker,
            Label: speaker,
        })
    }
    
    // Map audio events
    for _, e := range result.AudioEvents {
        transcript.AudioEvents = append(transcript.AudioEvents, AudioEvent{
            Type:  e.Type,
            Start: e.Start,
            End:   e.End,
        })
    }
    
    return transcript, nil
}

func (ep *ElevenLabsScribeProvider) TranscribeStream(context stdctx.Context, audioChan <-chan *AudioChunk, opts *TranscribeOptions) apperror.Result[<-chan *PartialTranscript] {
    resultChan := make(chan *PartialTranscript, 100)
    
    // Get single-use token for realtime
    token, err := ep.getRealtimeToken(context)
    if err != nil {
        return nil, err
    }
    
    // Connect to WebSocket
    conn, _, err := websocket.DefaultDialer.DialContext(context,
        "wss://api.elevenlabs.io/v1/speech-to-text/realtime?token="+token, nil)
    if err != nil {
        return nil, apperror.Wrap(
            err,
            ErrSttStreamingFailed,
            "connect to elevenlabs realtime",
        )
    }
    
    // Configure session — typed structs for ElevenLabs Realtime API
    conn.WriteJson(ElevenLabsSttConfig{
        Type: "configure",
        Config: ElevenLabsSttSessionConfig{
            ModelId:        "scribe_v2_realtime",
            CommitStrategy: "vad",
            SampleRate:     16000,
            AudioFormat:    "pcm_s16le",
        },
    })
    
    // Audio sender
    go func() {
        for {
            select {
            case <-context.Done():
                return
            case chunk, ok := <-audioChan:
                if !ok {
                    conn.WriteJson(map[string]string{"type": "flush"})
                    return
                }
                
                audioBase64 := base64.StdEncoding.EncodeToString(chunk.Data)
                conn.WriteJson(ElevenLabsAudioChunk{
                    Type:  "audio",
                    Audio: audioBase64,
                })
            }
        }
    }()
    
    // Response receiver
    go func() {
        defer close(resultChan)
        defer conn.Close()
        
        for {
            select {
            case <-context.Done():
                return
            default:
                // ALLOWED: ElevenLabs Realtime API returns polymorphic message types
                // EXEMPTED: external WebSocket API — Deepgram streaming protocol returns dynamic JSON (§7.2)
                var msg map[string]any
                if err := conn.ReadJson(&msg); err != nil {
                    return
                }
                
                msgType, _ := msg["type"].(string)
                switch msgType {
                case "partial_transcript":
                    text, _ := msg["text"].(string)
                    resultChan <- &PartialTranscript{
                        Text:      text,
                        IsFinal:   false,
                        Timestamp: time.Now(),
                    }
                case "committed_transcript":
                    text, _ := msg["text"].(string)
                    resultChan <- &PartialTranscript{
                        Text:      text,
                        IsFinal:   true,
                        Timestamp: time.Now(),
                    }
                }
            }
        }
    }()
    
    return resultChan, nil
}

func (ep *ElevenLabsScribeProvider) getRealtimeToken(context stdctx.Context) apperror.Result[string] {
    req, _ := http.NewRequestWithContext(context, httpmethod.Post.String(),
        ep.config.Endpoint+"/v1/single-use-token/realtime_scribe", nil)
    req.Header.Set("xi-api-key", ep.config.ApiKey)
    
    resp, err := ep.client.Do(req)
    if err != nil {
        return "", err
    }
    defer resp.Body.Close()
    
    // EXEMPTED: External API (ElevenLabs) — lowercase keys
    var result struct {
        Token string `json:"token"`
    }
    json.NewDecoder(resp.Body).Decode(&result)
    
    return result.Token, nil
}

func (ep *ElevenLabsScribeProvider) toISO6393(iso6391 string) string {
    mapping := map[string]string{
        "en": "eng", "es": "spa", "fr": "fra", "de": "deu",
        "it": "ita", "pt": "por", "zh": "zho", "ja": "jpn",
        "ko": "kor", "ru": "rus", "ar": "ara", "hi": "hin",
    }
    if code, ok := mapping[iso6391]; ok {
        return code
    }
    return iso6391
}

func (ep *ElevenLabsScribeProvider) Name() string {
    return "elevenlabs"
}

func (ep *ElevenLabsScribeProvider) IsAvailable() bool {
    return ep.isReady && ep.config.ApiKey != ""
}
```

---

## Provider Registry

```go
type STTProviderRegistry struct {
    providers map[string]STTProvider
    priority  []string
    mu        sync.RWMutex
}

func NewSttProviderRegistry() *STTProviderRegistry {
    return &STTProviderRegistry{
        providers: make(map[string]STTProvider),
        priority:  []string{"whisper", "openai", "elevenlabs"},
    }
}

func (r *STTProviderRegistry) Register(provider STTProvider) {
    r.mu.Lock()
    defer r.mu.Unlock()
    r.providers[provider.Name()] = provider
}

func (r *STTProviderRegistry) Get(name string) (STTProvider, bool) {
    r.mu.RLock()
    defer r.mu.RUnlock()
    provider, ok := r.providers[name]
    return provider, ok
}

func (r *STTProviderRegistry) GetPrimary() apperror.Result[STTProvider] {
    r.mu.RLock()
    defer r.mu.RUnlock()
    
    for _, name := range r.priority {
        if provider, ok := r.providers[name]; ok {
            if provider.IsAvailable() {
                return provider, nil
            }
        }
    }
    
    return nil, apperror.New(
        ErrSttProviderUnavailable,
        "no stt provider available",
    )
}

func (r *STTProviderRegistry) GetWithFallback(preferred string) apperror.Result[STTProvider] {
    // Try preferred first
    if provider, ok := r.Get(preferred); ok && provider.IsAvailable() {
        return provider, nil
    }
    
    // Fall back to priority order
    return r.GetPrimary()
}
```

---

## Error Codes

| Code | Constant | Description |
|------|----------|-------------|
| 14100 | ErrSttProviderUnavailable | No STT provider available |
| 14101 | ErrSttModelNotLoaded | Whisper model not loaded |
| 14102 | ErrSttModelLoadFailed | Failed to load Whisper model |
| 14103 | ErrSttTranscriptionFailed | Transcription processing failed |
| 14104 | ErrSttStreamingFailed | Streaming transcription failed |
| 14105 | ErrSttLanguageNotSupported | Language not supported |
| 14106 | ErrSttAudioFormatInvalid | Invalid audio format |
| 14107 | ErrSttAudioTooLong | Audio exceeds maximum duration |
| 14108 | ErrSttApiKeyInvalid | Invalid API key for cloud provider |
| 14109 | ErrSttRateLimited | API rate limit exceeded |

---

## See Also

- [Architecture](./01-architecture.md) — System design
- [Audio Pipeline](./02-audio-pipeline.md) — Audio preprocessing
- [TTS Providers](./04-tts-providers.md) — Speech synthesis
- [Error Codes](./10-error-codes.md) — Full error registry
