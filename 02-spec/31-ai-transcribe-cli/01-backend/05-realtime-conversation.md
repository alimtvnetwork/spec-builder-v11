# AI Transcribe CLI: Realtime Conversation

**Version:** 2.0.0  
**Status:** Draft  
**Updated:** 2026-03-09  

---

## Overview

The Realtime Conversation module enables bidirectional voice communication via WebSocket, supporting live transcription, TTS responses, and voice activity detection.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Client (Browser/App)                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────┐                              ┌──────────────────────┐ │
│  │   Microphone     │───── Audio Chunks ──────────▶│   WebSocket          │ │
│  │   Capture        │                              │   Connection         │ │
│  └──────────────────┘                              └──────────┬───────────┘ │
│                                                               │             │
│  ┌──────────────────┐                              ┌──────────┼───────────┐ │
│  │   Audio          │◀──── Audio Response ─────────│   Message│Handler    │ │
│  │   Playback       │                              │          ▼           │ │
│  └──────────────────┘                              │ ┌─────────────────┐  │ │
│                                                    │ │ Transcript Disp │  │ │
│                                                    │ └─────────────────┘  │ │
│                                                    └──────────────────────┘ │
└────────────────────────────────────────────────────────────│────────────────┘
                                                             │
                                   WebSocket Connection      │
                                                             │
┌────────────────────────────────────────────────────────────│────────────────┐
│                           AI Transcribe Server             │                │
├────────────────────────────────────────────────────────────│────────────────┤
│                                                             │                │
│  ┌─────────────────────────────────────────────────────────▼──────────────┐ │
│  │                        Session Manager                                  │ │
│  │                                                                         │ │
│  │  ┌────────────────┐   ┌────────────────┐   ┌────────────────────────┐  │ │
│  │  │ Connection     │   │ Session State  │   │ Message Queue          │  │ │
│  │  │ Handler        │   │ Machine        │   │ (Priority-based)       │  │ │
│  │  └───────┬────────┘   └───────┬────────┘   └───────────┬────────────┘  │ │
│  │          │                    │                        │               │ │
│  └──────────┼────────────────────┼────────────────────────┼───────────────┘ │
│             │                    │                        │                  │
│  ┌──────────▼────────────────────▼────────────────────────▼───────────────┐ │
│  │                        Processing Pipeline                              │ │
│  │                                                                         │ │
│  │  ┌──────────────┐   ┌──────────────┐   ┌──────────────────────────┐    │ │
│  │  │ Audio        │──▶│ VAD          │──▶│ STT Provider             │    │ │
│  │  │ Buffer       │   │ (Speech Det) │   │ (Whisper/OpenAI/11Labs)  │    │ │
│  │  └──────────────┘   └──────────────┘   └────────────┬─────────────┘    │ │
│  │                                                      │                  │ │
│  │                                                      ▼                  │ │
│  │  ┌──────────────────────────────────────────────────────────────────┐  │ │
│  │  │                    Event Dispatcher                               │  │ │
│  │  │  - Partial Transcripts → Client                                   │  │ │
│  │  │  - Committed Transcripts → Database + Client                      │  │ │
│  │  │  - Audio Events → Client                                          │  │ │
│  │  └──────────────────────────────────────────────────────────────────┘  │ │
│  │                                                                         │ │
│  │  ┌──────────────┐   ┌──────────────────────────────────────────────┐   │ │
│  │  │ TTS Engine   │◀──│ Response Generator (for conversation mode)   │   │ │
│  │  │ (XTTS/11Labs)│   │ Triggered by committed transcripts           │   │ │
│  │  └──────┬───────┘   └──────────────────────────────────────────────┘   │ │
│  │         │                                                               │ │
│  │         ▼ Audio Response to Client                                      │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Protocol Definition

### Connection Establishment

```
Client                                    Server
   │                                         │
   │──── WebSocket Upgrade Request ────────▶│
   │                                         │
   │◀─── WebSocket Upgrade Response ────────│
   │                                         │
   │──── Configure Message ────────────────▶│
   │                                         │
   │◀─── Session Started ──────────────────│
   │                                         │
   │◀───▶ Audio/Transcript Exchange ◀──────▶│
   │                                         │
```

### Message Types

#### Client → Server Messages

```go
type ClientMessage struct {
    Type      string           // Message type
    Timestamp int64            // Unix milliseconds
    Data      json.RawMessage  `json:",omitempty"`
}

// Configure session
type ConfigureMessage struct {
    Type   string         // "configure"
    Config SessionConfig
}

type SessionConfig struct {
    // Transcription settings
    Language         string  // ISO 639-1 or "auto"
    SttProvider      string  // "whisper", "openai", "elevenlabs"
    EnableVad        bool    // Voice Activity Detection
    VadThreshold     float64 // 0-1
    CommitStrategy   string  // "vad" or "manual"
    WordTimestamps   bool
    Diarize          bool
    
    // Audio settings
    AudioFormat      string  // "pcm", "webm", "opus"
    SampleRate       int     // 16000, 44100, 48000
    Channels         int     // 1 (mono only)
    
    // TTS settings (for conversation mode)
    TtsProvider      string  // "xtts", "elevenlabs"
    VoiceId          string
    TtsEnabled       bool
    
    // Mode
    Mode             string  // "transcription", "conversation"
}

// Audio chunk
type AudioMessage struct {
    Type      string  // "audio"
    Audio     string  // Base64-encoded audio data
    Timestamp int64   // Client timestamp
}

// Control messages
type ControlMessage struct {
    Type   string  // "control"
    Action string  // "flush", "commit", "stop", "reset", "pause", "resume"
}

// Text input (for TTS in conversation mode)
type TextMessage struct {
    Type      string  // "text"
    Text      string
    RequestId string  // For tracking
}
```

#### Server → Client Messages

```go
// Session started confirmation
type SessionStartedMessage struct {
    Type      string  // "session_started"
    SessionId string
    Config    SessionConfig
}

// Partial transcript (interim result)
type PartialTranscriptMessage struct {
    Type       string   // "partial"
    Text       string
    Confidence float64
    Timestamp  int64
}

// Committed transcript (final result)
type CommittedTranscriptMessage struct {
    Type       string   // "committed"
    Id         string   // Transcript ID
    Text       string
    Language   string
    Duration   float64
    Words      []Word   `json:",omitempty"`
    Speaker    string   `json:",omitempty"`
    Timestamp  int64
}

// Audio event (speech start/end, laughter, etc.)
type AudioEventMessage struct {
    Type      string  // "audio_event"
    EventType string  // "speech_start", "speech_end", "laughter", "silence"
    Timestamp int64
}

// Audio response (TTS output in conversation mode)
type AudioResponseMessage struct {
    Type      string   // "audio_response"
    RequestId string   // Matches text request
    Audio     string   // Base64-encoded audio
    Format    string   // "mp3", "opus", "pcm"
    Duration  float64
    Text      string   // Original text
    IsFinal   bool     // Last chunk for this request
}

// Error message
type ErrorMessage struct {
    Type        string  // "error"
    Code        int
    Message     string
    Details     string  `json:",omitempty"`
    Recoverable bool    // Can continue after error
    RetryAfterMs int    `json:",omitempty"`
}

// Status update
type StatusMessage struct {
    Type          string   // "status"
    Status        string   // "listening", "processing", "speaking"
    BufferSeconds float64  // Audio buffered
}
```

---

## Session State Machine

```
                    ┌─────────────────────────────────────────────────┐
                    │                                                 │
                    ▼                                                 │
              ┌───────────┐                                           │
              │  Created  │                                           │
              └─────┬─────┘                                           │
                    │ configure                                       │
                    ▼                                                 │
              ┌───────────┐                                           │
              │Configuring│──── error ───────▶ ┌──────────┐          │
              └─────┬─────┘                    │  Failed  │          │
                    │ success                  └──────────┘          │
                    ▼                                  ▲              │
              ┌───────────┐                           │              │
        ┌────▶│  Ready    │──── stop ────────────────┘              │
        │     └─────┬─────┘                                          │
        │           │ audio                                          │
        │           ▼                                                │
        │     ┌───────────┐                                          │
  pause │     │ Listening │◀───────────────────────────┐             │
        │     └─────┬─────┘                           │              │
        │           │ speech detected                  │              │
        │           ▼                                  │              │
        │     ┌───────────┐                           │              │
        └─────│Processing │── partial transcripts ────┤              │
        resume└─────┬─────┘                           │              │
                    │ committed                        │              │
                    ▼                                  │              │
              ┌───────────┐                           │              │
              │ Speaking  │── (TTS response) ─────────┘              │
              │  (opt)    │                                           │
              └─────┬─────┘                                           │
                    │ complete                                        │
                    └─────────────────────────────────────────────────┘
```

### Session States

```go
type SessionState int

const (
    StateCreated SessionState = iota
    StateConfiguring
    StateReady
    StateListening
    StateProcessing
    StateSpeaking
    StatePaused
    StateFailed
    StateClosed
)

type Session struct {
    Id            string
    State         SessionState
    Config        *SessionConfig
    Conn          *websocket.Conn
    
    // Processing
    audioBuffer   *RingBuffer
    vad           VoiceActivityDetector
    sttProvider   STTProvider
    ttsProvider   TTSProvider
    
    // Channels
    audioIn       chan *AudioChunk
    transcriptOut chan *Transcript
    controlIn     chan *ControlMessage
    
    // Coordination
    ctx           context.Context
    cancel        context.CancelFunc
    wg            sync.WaitGroup
    
    // Metrics
    startedAt     time.Time
    audioReceived int64
    transcripts   int
}
```

---

## Implementation

### WebSocket Server

```go
type WebSocketServer struct {
    sessions    sync.Map  // map[string]*Session
    upgrader    websocket.Upgrader
    sttRegistry *STTProviderRegistry
    ttsRegistry *TTSProviderRegistry
    db          *DatabaseManager
    config      *ServerConfig
    metrics     *Metrics
}

func (ws *WebSocketServer) HandleTranscribe(w http.ResponseWriter, r *http.Request) {
    conn, err := ws.upgrader.Upgrade(w, r, nil)
    if err != nil {
        return
    }
    
    session := ws.createSession(conn)
    defer ws.closeSession(session)
    
    // Start session workers
    session.Start()
    
    // Message processing loop
    for {
        _, message, err := conn.ReadMessage()
        if err != nil {
            return
        }
        
        if err := ws.handleMessage(session, message); err != nil {
            ws.sendError(session, err)
        }
    }
}

func (ws *WebSocketServer) handleMessage(session *Session, data []byte) error {
    var base struct {
        Type string
    }
    if err := json.Unmarshal(data, &base); err != nil {
        return NewError(ErrWsMessageInvalid, "Invalid message format", err.Error())
    }
    
    switch base.Type {
    case "configure":
        return ws.handleConfigure(session, data)
    case "audio":
        return ws.handleAudio(session, data)
    case "control":
        return ws.handleControl(session, data)
    case "text":
        return ws.handleText(session, data)
    default:
        return NewError(ErrWsMessageInvalid, "Unknown message type", base.Type)
    }
}

func (ws *WebSocketServer) handleAudio(session *Session, data []byte) error {
    var msg AudioMessage
    if err := json.Unmarshal(data, &msg); err != nil {
        return err
    }
    
    // Decode base64 audio
    audioData, err := base64.StdEncoding.DecodeString(msg.Audio)
    if err != nil {
        return NewError(ErrAudioDecodeFailed, "Invalid audio encoding", err.Error())
    }
    
    chunk := &AudioChunk{
        Id:        uuid.New().String(),
        Data:      audioData,
        Format:    session.Config.AudioFormat,
        SampleRate: session.Config.SampleRate,
        Timestamp: time.UnixMilli(msg.Timestamp),
    }
    
    select {
    case session.audioIn <- chunk:
        session.audioReceived += int64(len(audioData))
    default:
        return NewError(ErrWsAudioBufferFull, "Audio buffer full", "slow down sending")
    }
    
    return nil
}
```

### Session Workers

```go
func (s *Session) Start() {
    s.wg.Add(3)
    
    go s.audioProcessor()
    go s.transcriptionWorker()
    go s.outputHandler()
}

func (s *Session) audioProcessor() {
    defer s.wg.Done()
    
    for {
        select {
        case <-s.ctx.Done():
            return
            
        case chunk := <-s.audioIn:
            // Store in buffer
            s.audioBuffer.Write(chunk.Data)
            
            // Run VAD
            vadResult := s.vad.Process(chunk)
            
            if vadResult.IsSpeech {
                if s.State == StateListening {
                    s.State = StateProcessing
                    s.sendEvent("speech_start")
                }
                
                // Forward to transcription
                s.transcriptionQueue <- chunk
                
            } else {
                if s.State == StateProcessing {
                    silenceDuration := s.getSilenceDuration()
                    
                    if s.Config.CommitStrategy == "vad" && silenceDuration > 500*time.Millisecond {
                        // Commit current transcript
                        s.commitTranscript()
                        s.State = StateListening
                        s.sendEvent("speech_end")
                    }
                }
            }
        }
    }
}

func (s *Session) transcriptionWorker() {
    defer s.wg.Done()
    
    // Create streaming transcription channel
    resultChan, err := s.sttProvider.TranscribeStream(s.ctx, s.transcriptionQueue, &TranscribeOptions{
        Language:       s.Config.Language,
        WordTimestamps: s.Config.WordTimestamps,
        EnableVAD:      false, // We handle VAD ourselves
    })
    if err != nil {
        s.sendError(NewError(ErrSttStreamFailed, "Failed to start streaming", err.Error()))
        return
    }
    
    for {
        select {
        case <-s.ctx.Done():
            return
            
        case partial, ok := <-resultChan:
            if !ok {
                return
            }
            
            if partial.IsFinal {
                s.transcriptOut <- &Transcript{
                    Id:       uuid.New().String(),
                    Text:     partial.Text,
                    Language: s.Config.Language,
                    IsFinal:  true,
                }
            } else {
                // Send partial directly
                s.sendPartial(partial)
            }
        }
    }
}

func (s *Session) outputHandler() {
    defer s.wg.Done()
    
    for {
        select {
        case <-s.ctx.Done():
            return
            
        case transcript := <-s.transcriptOut:
            // Save to database
            s.saveTranscript(transcript)
            
            // Send to client
            s.sendCommitted(transcript)
            
            // TTS response in conversation mode
            if s.Config.Mode == "conversation" && s.Config.TTSEnabled {
                go s.generateTtsResponse(transcript)
            }
        }
    }
}

func (s *Session) generateTtsResponse(transcript *Transcript) {
    // This would typically involve an AI/LLM to generate response text
    // For now, just echo or use predefined responses
    responseText := "I heard you say: " + transcript.Text
    
    audioChan, err := s.ttsProvider.SynthesizeStream(s.ctx, responseText, &SynthesizeOptions{
        VoiceId:     s.Config.VoiceId,
        OutputFormat: "opus",
    })
    if err != nil {
        return
    }
    
    s.State = StateSpeaking
    
    for chunk := range audioChan {
        s.sendAudioResponse(&AudioResponseMessage{
            Type:      "audio_response",
            Audio:     base64.StdEncoding.EncodeToString(chunk.Data),
            Format:    chunk.Format,
            Duration:  chunk.Duration,
            Text:      responseText,
            IsFinal:   false,
        })
    }
    
    // Send final marker
    s.sendAudioResponse(&AudioResponseMessage{
        Type:    "audio_response",
        Text:    responseText,
        IsFinal: true,
    })
    
    s.State = StateListening
}
```

---

## Client Integration (JavaScript)

### Basic Usage

```javascript
class TranscribeClient {
    constructor(url, config) {
        this.url = url;
        this.config = config;
        this.ws = null;
        this.onPartial = null;
        this.onCommitted = null;
        this.onAudioResponse = null;
        this.onError = null;
    }
    
    async connect() {
        return new Promise((resolve, reject) => {
            this.ws = new WebSocket(this.url);
            
            this.ws.onopen = () => {
                this.ws.send(JSON.stringify({
                    Type: 'configure',
                    Config: this.config
                }));
            };
            
            this.ws.onmessage = (event) => {
                const msg = JSON.parse(event.data);
                this.handleMessage(msg);
                
                if (msg.Type === 'session_started') {
                    resolve(msg.SessionId);
                }
            };
            
            this.ws.onerror = reject;
        });
    }
    
    handleMessage(msg) {
        switch (msg.Type) {
            case 'partial':
                this.onPartial?.(msg.Text, msg.Confidence);
                break;
            case 'committed':
                this.onCommitted?.(msg);
                break;
            case 'audio_response':
                this.onAudioResponse?.(msg);
                break;
            case 'error':
                this.onError?.(msg);
                break;
        }
    }
    
    sendAudio(audioData) {
        if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                Type: 'audio',
                Audio: btoa(String.fromCharCode(...audioData)),
                Timestamp: Date.now()
            }));
        }
    }
    
    commit() {
        this.ws?.send(JSON.stringify({
            Type: 'control',
            Action: 'commit'
        }));
    }
    
    stop() {
        this.ws?.send(JSON.stringify({
            Type: 'control',
            Action: 'stop'
        }));
    }
    
    close() {
        this.ws?.close();
    }
}

// Usage
const client = new TranscribeClient('ws://localhost:8031/ws/transcribe', {
    Language: 'en',
    SttProvider: 'whisper',
    EnableVad: true,
    CommitStrategy: 'vad',
    AudioFormat: 'pcm',
    SampleRate: 16000
});

client.onPartial = (text, confidence) => {
    console.log('Partial:', text);
};

client.onCommitted = (transcript) => {
    console.log('Final:', transcript.Text);
};

await client.connect();

// Start microphone capture and send audio chunks
navigator.mediaDevices.getUserMedia({ audio: true })
    .then(stream => {
        const audioContext = new AudioContext({ sampleRate: 16000 });
        const source = audioContext.createMediaStreamSource(stream);
        const processor = audioContext.createScriptProcessor(4096, 1, 1);
        
        processor.onaudioprocess = (e) => {
            const audioData = e.inputBuffer.getChannelData(0);
            const pcm = new Int16Array(audioData.length);
            for (let i = 0; i < audioData.length; i++) {
                pcm[i] = Math.max(-32768, Math.min(32767, audioData[i] * 32768));
            }
            client.sendAudio(new Uint8Array(pcm.buffer));
        };
        
        source.connect(processor);
        processor.connect(audioContext.destination);
    });
```

---

## Performance Considerations

### Latency Targets

| Metric | Target | Maximum |
|--------|--------|---------|
| Audio → VAD | < 20ms | 50ms |
| VAD → STT | < 50ms | 100ms |
| Partial transcript | < 200ms | 500ms |
| Committed transcript | < 500ms | 1000ms |
| TTS response start | < 300ms | 800ms |

### Buffer Sizing

```go
const (
    AudioBufferDuration = 30 * time.Second  // Ring buffer size
    ChunkSize           = 100 * time.Millisecond // Audio chunk duration
    MaxMessageSize      = 64 * 1024         // 64KB max WebSocket message
    SendBufferSize      = 100               // Outgoing message queue
)
```

---

## See Also

- [Architecture](./01-architecture.md) — System design
- [Audio Pipeline](./02-audio-pipeline.md) — Audio processing
- [STT Providers](./03-stt-providers.md) — Transcription backends
- [API Interface](./09-api-interface.md) — REST endpoints
