# AI Transcribe CLI: Audio Pipeline

**Version:** 2.0.0  
**Status:** Draft  
**Updated:** 2026-03-09  

---

## Overview

The Audio Pipeline handles audio capture, Voice Activity Detection (VAD), preprocessing, and encoding. It serves as the input stage for all STT operations.

---

## Pipeline Architecture

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                            Audio Pipeline                                     │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    │
│  │   Capture   │───▶│ Preprocess  │───▶│    VAD      │───▶│   Encode    │    │
│  │             │    │             │    │             │    │             │    │
│  │ - Mic input │    │ - Resample  │    │ - Silero    │    │ - PCM       │    │
│  │ - File read │    │ - Normalize │    │ - WebRTC    │    │ - Opus      │    │
│  │ - Stream    │    │ - Denoise   │    │ - Energy    │    │ - WebM      │    │
│  └─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘    │
│                                                                               │
│  ┌───────────────────────────────────────────────────────────────────────┐   │
│  │                         Ring Buffer                                    │   │
│  │  Stores 30 seconds of raw audio for lookback on speech detection      │   │
│  └───────────────────────────────────────────────────────────────────────┘   │
│                                                                               │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Components

### 1. Audio Capturer

Handles audio input from various sources.

```go
type AudioCapturer struct {
    source     AudioSource
    format     AudioFormat
    sampleRate int
    channels   int
    
    // Output
    outChan    chan *AudioChunk
    
    // State
    isCapturing bool
    mu          sync.RWMutex
}

type AudioSource interface {
    Open() *appfault.AppError
    Read(buf []byte) (int, error) // EXEMPTED: io.Reader stdlib boundary
    Close() *appfault.AppError
    Format() AudioFormat
}

type AudioFormat struct {
    SampleRate  int    // 16000, 44100, 48000
    Channels    int    // 1 (mono preferred)
    BitDepth    int    // 16, 24, 32
    Encoding    string // "pcm", "float32"
}

// Microphone source using PortAudio
type MicrophoneSource struct {
    stream     *portaudio.Stream
    device     *portaudio.DeviceInfo
    bufferSize int
}

func (ms *MicrophoneSource) Open() error {
    devices, _ := portaudio.Devices()
    
    // Select default input device or configured device
    ms.device = portaudio.DefaultInputDevice()
    
    params := portaudio.StreamParameters{
        Input: portaudio.StreamDeviceParameters{
            Device:   ms.device,
            Channels: 1,
            Latency:  ms.device.DefaultLowInputLatency,
        },
        SampleRate:      16000,
        FramesPerBuffer: ms.bufferSize,
    }
    
    stream, err := portaudio.OpenStream(params, ms.callback)
    if err != nil {
        return err
    }
    
    ms.stream = stream
    return stream.Start()
}

// File source for batch processing
type FileSource struct {
    path       string
    reader     io.ReadCloser
    format     AudioFormat
}

// WebSocket source for streaming input
type StreamSource struct {
    conn       *websocket.Conn
    format     AudioFormat
    buffer     *RingBuffer
}
```

### 2. Audio Preprocessor

Normalizes and cleans audio before VAD.

```go
type AudioPreprocessor struct {
    targetSampleRate int
    targetChannels   int
    enableDenoise    bool
    normalizeLevel   float64
}

type PreprocessConfig struct {
    TargetSampleRate  int     // 16000 for Whisper
    TargetChannels    int     // 1 (mono)
    EnableDenoise     bool    // RNNoise
    NormalizeLevel    float64 // -3 dB target
    HighPassFilter    int     // Hz cutoff (80)
    LowPassFilter     int     // Hz cutoff (8000)
}

func (ap *AudioPreprocessor) Process(chunk *AudioChunk) appfault.Result[AudioChunk] {
    var data []byte = chunk.Data
    
    // 1. Resample if needed
    if chunk.SampleRate != ap.targetSampleRate {
        data = ap.resample(data, chunk.SampleRate, ap.targetSampleRate)
    }
    
    // 2. Convert to mono if stereo
    if chunk.Channels > 1 {
        data = ap.toMono(data, chunk.Channels)
    }
    
    // 3. Apply high-pass filter (remove low rumble)
    data = ap.highPassFilter(data, 80) // 80 Hz cutoff
    
    // 4. Normalize audio level
    data = ap.normalize(data, ap.normalizeLevel)
    
    // 5. Denoise if enabled
    if ap.enableDenoise {
        data = ap.denoise(data)
    }
    
    return &AudioChunk{
        Id:         chunk.Id,
        Data:       data,
        Format:     "pcm",
        SampleRate: ap.targetSampleRate,
        Channels:   ap.targetChannels,
        Duration:   chunk.Duration,
        Timestamp:  chunk.Timestamp,
    }, nil
}

func (ap *AudioPreprocessor) resample(data []byte, fromRate, toRate int) []byte {
    // Use libsamplerate or similar for high-quality resampling
    ratio := float64(toRate) / float64(fromRate)
    samples := ap.bytesToSamples(data)
    
    newLen := int(float64(len(samples)) * ratio)
    resampled := make([]float64, newLen)
    
    // Linear interpolation (simplified; use proper algorithm in production)
    for i := 0; i < newLen; i++ {
        srcIdx := float64(i) / ratio
        idx := int(srcIdx)
        frac := srcIdx - float64(idx)
        
        if idx+1 < len(samples) {
            resampled[i] = samples[idx]*(1-frac) + samples[idx+1]*frac
        } else {
            resampled[i] = samples[idx]
        }
    }
    
    return ap.samplesToBytes(resampled)
}

func (ap *AudioPreprocessor) denoise(data []byte) []byte {
    // RNNoise integration via CGO or subprocess
    // Returns denoised audio
    return rnnoise.Process(data)
}
```

### 3. Voice Activity Detection (VAD)

Detects speech segments in audio stream.

```go
type VoiceActivityDetector interface {
    Process(chunk *AudioChunk) *VADResult
    Reset()
    SetThreshold(threshold float64)
}

type VADResult struct {
    IsSpeech        bool    // 0-1
    Probability     float64 // 0-1
    SpeechStart     *int    // Sample index
    SpeechEnd       *int    // Sample index
    SilenceDuration float64 // Seconds of trailing silence
}

type VADConfig struct {
    Provider           string  // "silero", "webrtc", "energy"
    Threshold          float64 // 0.5 default
    MinSpeechDuration  float64 // Seconds (0.25)
    MinSilenceDuration float64 // Seconds (0.5)
    PreSpeechPad       float64 // Seconds to include before speech
    PostSpeechPad      float64 // Seconds to include after speech
}
```

#### Silero VAD (Recommended)

High-accuracy neural VAD using ONNX runtime.

```go
type SileroVAD struct {
    session    *onnxruntime.Session
    sampleRate int
    windowSize int  // 512 samples for 16kHz
    threshold  float64
    
    // State for streaming
    context    []float32  // 64 samples context
    state      []float32  // Hidden state
}

func NewSileroVAD(modelPath string) appfault.Result[SileroVAD] {
    session, err := onnxruntime.NewSession(modelPath)
    if err != nil {
        return nil, appfault.Wrap(
            err,
            ErrAudioPipelineModelLoad,
            "load silero model",
        )
    }
    
    return &SileroVAD{
        session:    session,
        sampleRate: 16000,
        windowSize: 512,
        threshold:  0.5,
        context:    make([]float32, 64),
        state:      make([]float32, 128), // 2*64 for bidirectional
    }, nil
}

func (sv *SileroVAD) Process(chunk *AudioChunk) *VADResult {
    samples := sv.toFloat32Samples(chunk.Data)
    
    // Process in windows
    var probabilities []float64
    for i := 0; i < len(samples); i += sv.windowSize {
        end := min(i+sv.windowSize, len(samples))
        window := samples[i:end]
        
        // Pad if needed
        if len(window) < sv.windowSize {
            padded := make([]float32, sv.windowSize)
            copy(padded, window)
            window = padded
        }
        
        // Run inference
        input := sv.prepareInput(window)
        output, _ := sv.session.Run(input)
        prob := output[0].(float32)
        
        probabilities = append(probabilities, float64(prob))
        
        // Update state
        sv.updateState(output[1])
    }
    
    // Aggregate result
    avgProb := average(probabilities)
    
    return &VADResult{
        IsSpeech:    avgProb >= sv.threshold,
        Probability: avgProb,
    }
}
```

#### WebRTC VAD (Lightweight)

Google's WebRTC VAD for low-resource environments.

```go
type WebRTCVAD struct {
    vad        *webrtcvad.VAD
    mode       int  // 0-3 (0=quality, 3=aggressive)
    sampleRate int
}

func NewWebRTCVAD(mode int) appfault.Result[WebRTCVAD] {
    vad, err := webrtcvad.New()
    if err != nil {
        return nil, err
    }
    
    if err := vad.SetMode(mode); err != nil {
        return nil, err
    }
    
    return &WebRTCVAD{
        vad:        vad,
        mode:       mode,
        sampleRate: 16000,
    }, nil
}

func (wv *WebRTCVAD) Process(chunk *AudioChunk) *VADResult {
    // WebRTC VAD requires 10/20/30ms frames
    frameDuration := 30 // ms
    frameSize := (wv.sampleRate * frameDuration) / 1000 * 2 // bytes
    
    var speechFrames int
    var totalFrames int
    
    for i := 0; i < len(chunk.Data); i += frameSize {
        end := min(i+frameSize, len(chunk.Data))
        frame := chunk.Data[i:end]
        
        if len(frame) == frameSize {
            isSpeech, _ := wv.vad.Process(wv.sampleRate, frame)
            if isSpeech {
                speechFrames++
            }
            totalFrames++
        }
    }
    
    ratio := float64(speechFrames) / float64(totalFrames)
    
    return &VADResult{
        IsSpeech:    ratio > 0.5,
        Probability: ratio,
    }
}
```

### 4. Audio Encoder

Encodes audio for transmission or storage.

```go
type AudioEncoder struct {
    format     string  // "pcm", "opus", "webm", "mp3"
    sampleRate int
    bitrate    int     // For lossy formats
}

type EncoderConfig struct {
    Format     string // Output format
    SampleRate int    // 16000, 44100, 48000
    Bitrate    int    // kbps for lossy
    Quality    int    // 0-10 for variable bitrate
}

func (ae *AudioEncoder) Encode(chunk *AudioChunk) ByteSlice {
    switch ae.format {
    case "pcm":
        return chunk.Data, nil
        
    case "opus":
        return ae.encodeOpus(chunk)
        
    case "webm":
        return ae.encodeWebM(chunk)
        
    case "mp3":
        return ae.encodeMP3(chunk)
        
    default:
        return nil, appfault.New(
            ErrAudioFormatInvalid,
            "unsupported audio format",
        ).WithContext("format", ae.format)
    }
}

func (ae *AudioEncoder) encodeOpus(chunk *AudioChunk) ByteSlice {
    encoder, err := opus.NewEncoder(ae.sampleRate, 1, opus.AppVoIP)
    if err != nil {
        return nil, err
    }
    
    encoder.SetBitrate(ae.bitrate * 1000)
    
    samples := ae.bytesToSamples(chunk.Data)
    frameSize := ae.sampleRate / 50 // 20ms frames
    
    var encoded []byte
    for i := 0; i < len(samples); i += frameSize {
        end := min(i+frameSize, len(samples))
        frame := samples[i:end]
        
        // Pad if needed
        if len(frame) < frameSize {
            padded := make([]int16, frameSize)
            copy(padded, frame)
            frame = padded
        }
        
        data := make([]byte, 1000) // Max opus frame size
        n, err := encoder.Encode(frame, data)
        if err != nil {
            return nil, err
        }
        
        encoded = append(encoded, data[:n]...)
    }
    
    return encoded, nil
}
```

### 5. Ring Buffer

Maintains audio history for lookback on speech detection.

```go
type RingBuffer struct {
    buffer     []byte
    size       int
    writePos   int
    readPos    int
    count      int
    mu         sync.RWMutex
}

func NewRingBuffer(durationSeconds int, sampleRate int, bytesPerSample int) *RingBuffer {
    size := durationSeconds * sampleRate * bytesPerSample
    return &RingBuffer{
        buffer: make([]byte, size),
        size:   size,
    }
}

func (rb *RingBuffer) Write(data []byte) {
    rb.mu.Lock()
    defer rb.mu.Unlock()
    
    for _, b := range data {
        rb.buffer[rb.writePos] = b
        rb.writePos = (rb.writePos + 1) % rb.size
        
        if rb.count < rb.size {
            rb.count++
        } else {
            // Overwrite old data
            rb.readPos = (rb.readPos + 1) % rb.size
        }
    }
}

func (rb *RingBuffer) ReadLast(duration float64, sampleRate int, bytesPerSample int) []byte {
    rb.mu.RLock()
    defer rb.mu.RUnlock()
    
    bytesToRead := int(duration * float64(sampleRate) * float64(bytesPerSample))
    if bytesToRead > rb.count {
        bytesToRead = rb.count
    }
    
    result := make([]byte, bytesToRead)
    startPos := (rb.writePos - bytesToRead + rb.size) % rb.size
    
    for i := 0; i < bytesToRead; i++ {
        result[i] = rb.buffer[(startPos+i)%rb.size]
    }
    
    return result
}
```

---

## Streaming Pipeline

### Chunk-Based Processing

```go
import stdctx "context"

type StreamingPipeline struct {
    capturer     *AudioCapturer
    preprocessor *AudioPreprocessor
    vad          VoiceActivityDetector
    encoder      *AudioEncoder
    buffer       *RingBuffer
    
    // Channels
    rawAudio     chan *AudioChunk
    processed    chan *AudioChunk
    speechChunks chan *AudioChunk
    
    // State
    inSpeech     bool
    speechStart  time.Time
    silenceStart time.Time
}

func (sp *StreamingPipeline) Start(context stdctx.Context) error {
    // Start capture
    go sp.capturer.Start(context, sp.rawAudio)
    
    // Processing pipeline
    go sp.processLoop(context)
    
    // VAD and segmentation
    go sp.vadLoop(context)
    
    return nil
}

func (sp *StreamingPipeline) processLoop(context stdctx.Context) {
    for {
        select {
        case <-context.Done():
            return
        case chunk := <-sp.rawAudio:
            // Store in ring buffer
            sp.buffer.Write(chunk.Data)
            
            // Preprocess
            processed, err := sp.preprocessor.Process(chunk)
            if err != nil {
                continue
            }
            
            sp.processed <- processed
        }
    }
}

func (sp *StreamingPipeline) vadLoop(context stdctx.Context) {
    for {
        select {
        case <-context.Done():
            return
        case chunk := <-sp.processed:
            vadResult := sp.vad.Process(chunk)
            chunk.IsSpeech = vadResult.IsSpeech
            
            if vadResult.IsSpeech {
                if !sp.inSpeech {
                    // Speech started - include pre-speech padding from buffer
                    sp.inSpeech = true
                    sp.speechStart = time.Now()
                    
                    preSpeech := sp.buffer.ReadLast(0.3, chunk.SampleRate, 2)
                    preChunk := &AudioChunk{
                        Id:         uuid.New().String(),
                        Data:       preSpeech,
                        SampleRate: chunk.SampleRate,
                        IsSpeech:   true,
                    }
                    sp.speechChunks <- preChunk
                }
                
                sp.speechChunks <- chunk
                sp.silenceStart = time.Time{}
                
            } else {
                if sp.inSpeech {
                    if sp.silenceStart.IsZero() {
                        sp.silenceStart = time.Now()
                    }
                    
                    // Continue sending for post-speech padding
                    silenceDuration := time.Since(sp.silenceStart)
                    if silenceDuration < 500*time.Millisecond {
                        sp.speechChunks <- chunk
                    } else {
                        // Speech ended
                        sp.inSpeech = false
                    }
                }
            }
        }
    }
}
```

---

## Audio Formats Reference

| Format | Sample Rate | Bit Depth | Use Case |
|--------|-------------|-----------|----------|
| PCM 16kHz | 16000 | 16-bit | Whisper input |
| PCM 44.1kHz | 44100 | 16-bit | High quality capture |
| Opus | 16000-48000 | Variable | WebSocket streaming |
| WebM/Opus | 48000 | Variable | Browser recording |
| MP3 | 44100 | Variable | File storage |

---

## Performance Considerations

### Latency Targets

| Stage | Target Latency |
|-------|----------------|
| Capture | < 10ms |
| Preprocessing | < 5ms |
| VAD | < 5ms |
| Encoding | < 10ms |
| **Total Pipeline** | **< 30ms** |

### Resource Usage

```go
type PipelineMetrics struct {
    CaptureLatencyMs   float64
    ProcessLatencyMs   float64
    VadLatencyMs       float64
    EncodeLatencyMs    float64
    BufferUsagePercent float64
    DroppedChunks      int64
}
```

---

## See Also

- [Architecture](./01-architecture.md) — System design
- [STT Providers](./03-stt-providers.md) — Speech recognition backends
- [Realtime Conversation](./05-realtime-conversation.md) — WebSocket streaming
