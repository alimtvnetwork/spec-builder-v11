# AI Transcribe CLI: TTS Providers

**Version:** 2.1.0  
**Status:** Draft  
**Updated:** 2026-03-12  

---

## Overview

This document specifies the Text-to-Speech (TTS) provider implementations for AI Transcribe CLI. The system supports local and cloud providers with voice cloning capabilities.

---

## Provider Priority

```
Priority Order:
1. XTTS (Local) — Default, offline, voice cloning capable
2. ElevenLabs — Cloud fallback, highest quality
3. Azure TTS — Cloud fallback, enterprise features
```

---

## Provider Interface

```go
type TTSProvider interface {
    // Core operations
    Name() string
    Synthesize(context context.Context, text string, opts *SynthesizeOptions) apperror.Result[AudioResult]
    SynthesizeStream(context context.Context, text string, opts *SynthesizeOptions) apperror.Result[<-chan *AudioChunk]
    
    // Voice management
    ListVoices() apperror.Result[[]Voice]
    GetVoice(voiceId string) apperror.Result[Voice]
    CloneVoice(context context.Context, name string, samples [][]byte) apperror.Result[Voice]
    DeleteVoice(voiceId string) *apperror.AppError
    
    // Status
    IsAvailable() bool
    Health() ProviderStatus
    Initialize(context context.Context, config *ProviderConfig) *apperror.AppError
    Shutdown() *apperror.AppError
}

type SynthesizeOptions struct {
    VoiceId          string
    ModelId          string
    Language         string   // ISO 639-1
    Speed            float64  // 0.7-1.2
    Pitch            float64  // -20 to 20 semitones
    Stability        float64  // 0-1 (ElevenLabs)
    SimilarityBoost  float64  // 0-1 (ElevenLabs)
    Style            float64  // 0-1 (ElevenLabs)
    UseSpeakerBoost  bool     // ElevenLabs
    OutputFormat     string   // "mp3", "pcm", "opus"
    SampleRate       int      // 16000, 22050, 44100, 48000
    
    // Request stitching for long-form content
    PreviousText     string   `json:",omitempty"`
    NextText         string   `json:",omitempty"`
}

type AudioResult struct {
    Data         []byte
    Format       string
    SampleRate   int
    Duration     float64
    CharacterCount int
}

type Voice struct {
    Id          string
    Name        string
    Description string
    Provider    string
    Language    string
    Gender      string  // "male", "female", "neutral"
    Age         string  // "young", "middle", "old"
    UseCase     string  // "narration", "conversational", "news"
    PreviewUrl  string
    IsCloned    bool
    Settings    VoiceSettings `json:",omitempty"`
}
```

---

## 1. XTTS Provider (Local)

Local text-to-speech using Coqui XTTS for offline synthesis with voice cloning.

### Configuration

```go
type XTTSConfig struct {
    ModelPath       string // Path to XTTS model
    SpeakersDir     string // Cloned voice embeddings
    Device          string // "cpu", "cuda"
    ComputeType     string // "float32", "float16", "int8"
    MaxLength       int    // Max characters per synthesis
    DefaultLanguage string // Fallback language
}
```

### Implementation

```go
type XTTSProvider struct {
    config      *XTTSConfig
    model       *xtts.Model
    voices      map[string]*ClonedVoice
    mu          sync.RWMutex
    isReady     bool
}

type ClonedVoice struct {
    Id          string
    Name        string
    Embedding   []float32
    SamplePaths []string
    CreatedAt   time.Time
}

func NewXTTSProvider(config *XTTSConfig) *XTTSProvider {
    return &XTTSProvider{
        config: config,
        voices: make(map[string]*ClonedVoice),
    }
}

func (xp *XTTSProvider) Initialize(context context.Context, config *ProviderConfig) *apperror.AppError {
    xp.mu.Lock()
    defer xp.mu.Unlock()
    
    // Load XTTS model
    model, loadErr := xtts.Load(xp.config.ModelPath, xp.config.Device)
    if loadErr != nil {
        return apperror.Wrap(
            loadErr,
            "E14151",
            "failed to load XTTS model",
        ).WithPath(xp.config.ModelPath)
    }
    
    xp.model = model
    
    // Load existing cloned voices
    if voiceErr := xp.loadClonedVoices(); voiceErr != nil {
        return voiceErr
    }
    
    xp.isReady = true

    return nil
}

func (xp *XTTSProvider) loadClonedVoices() *apperror.AppError {
    entries, readErr := pathutil.ReadDir(xp.config.SpeakersDir)
    if readErr != nil {
        mkdirErr := pathutil.MkdirAll(xp.config.SpeakersDir, 0755)
        if mkdirErr != nil {
            return mkdirErr
        }

        return nil
    }
    
    for _, entry := range entries {
        if entry.IsDir() {
            voiceDir := filepath.Join(xp.config.SpeakersDir, entry.Name())
            metaPath := filepath.Join(voiceDir, "meta.json")
            
            data, fileErr := pathutil.ReadFile(metaPath)
            if fileErr != nil {
                continue
            }
            
            var voice ClonedVoice
            if unmarshalErr := json.Unmarshal(data, &voice); unmarshalErr != nil {
                continue
            }
            
            xp.voices[voice.Id] = &voice
        }
    }
    
    return nil
}

func (xp *XTTSProvider) Synthesize(context context.Context, text string, opts *SynthesizeOptions) apperror.Result[AudioResult] {
    xp.mu.RLock()
    defer xp.mu.RUnlock()
    
    if !xp.isReady {
        return apperror.FailNew[AudioResult](
            "E14151",
            "XTTS model not initialized",
        )
    }
    
    // Get voice embedding
    var speakerWav string
    var embedding []float32
    
    if voice, ok := xp.voices[opts.VoiceId]; ok {
        // Use cloned voice
        if len(voice.SamplePaths) > 0 {
            speakerWav = voice.SamplePaths[0]
        }
        embedding = voice.Embedding
    } else {
        // Use built-in voice or default
        speakerWav = xp.getBuiltinVoicePath(opts.VoiceId)
    }
    
    // Determine language
    language := opts.Language
    if language == "" {
        language = xp.config.DefaultLanguage
    }
    
    // Synthesize
    synthOpts := &xtts.SynthesizeOptions{
        Text:         text,
        Language:     language,
        SpeakerWav:   speakerWav,
        Embedding:    embedding,
        Speed:        opts.Speed,
        Temperature:  0.7,
        TopP:         0.85,
    }
    
    audioData, synthErr := xp.model.Synthesize(context, synthOpts)
    if synthErr != nil {
        return apperror.FailWrap[AudioResult](
            synthErr,
            "E14152",
            "XTTS synthesis failed",
        )
    }
    
    // Encode to requested format
    encoded, encodeErr := xp.encodeAudio(audioData, opts.OutputFormat, opts.SampleRate)
    if encodeErr != nil {
        return apperror.FailWrap[AudioResult](
            encodeErr,
            "E14158",
            "audio encoding failed",
        )
    }
    
    return apperror.Ok(AudioResult{
        Data:           encoded,
        Format:         opts.OutputFormat,
        SampleRate:     opts.SampleRate,
        Duration:       float64(len(audioData)) / float64(24000), // XTTS native rate
        CharacterCount: len(text),
    })
}

func (xp *XTTSProvider) SynthesizeStream(context context.Context, text string, opts *SynthesizeOptions) apperror.Result[<-chan *AudioChunk] {
    resultChan := make(chan *AudioChunk, 100)
    
    go func() {
        defer close(resultChan)
        
        // XTTS supports chunked synthesis
        sentences := xp.splitSentences(text)
        
        for i, sentence := range sentences {
            result := xp.Synthesize(context, sentence, opts)
            if result.HasError() {
                continue
            }
            
            resultChan <- &AudioChunk{
                Id:         fmt.Sprintf("chunk_%d", i),
                Data:       result.Value().Data,
                Format:     result.Value().Format,
                SampleRate: result.Value().SampleRate,
                Duration:   result.Value().Duration,
                Timestamp:  time.Now(),
            }
        }
    }()
    
    return apperror.Ok((<-chan *AudioChunk)(resultChan))
}

func (xp *XTTSProvider) CloneVoice(context context.Context, name string, samples [][]byte) apperror.Result[Voice] {
    xp.mu.Lock()
    defer xp.mu.Unlock()
    
    voiceId := uuid.New().String()
    voiceDir := filepath.Join(xp.config.SpeakersDir, voiceId)
    
    if mkdirErr := pathutil.MkdirAll(voiceDir, 0755); mkdirErr != nil {
        return apperror.Fail[Voice](mkdirErr)
    }
    
    // Save sample files
    var samplePaths []string
    for i, sample := range samples {
        samplePath := filepath.Join(voiceDir, fmt.Sprintf("sample_%d.wav", i))
        if writeErr := pathutil.WriteFile(samplePath, sample, 0644); writeErr != nil {
            return apperror.Fail[Voice](writeErr)
        }
        samplePaths = append(samplePaths, samplePath)
    }
    
    // Extract voice embedding
    embedding, embedErr := xp.model.ExtractSpeakerEmbedding(samplePaths[0])
    if embedErr != nil {
        return apperror.FailWrap[Voice](
            embedErr,
            "E14154",
            "failed to extract voice embedding",
        )
    }
    
    clonedVoice := &ClonedVoice{
        Id:          voiceId,
        Name:        name,
        Embedding:   embedding,
        SamplePaths: samplePaths,
        CreatedAt:   time.Now(),
    }
    
    // Save metadata
    metaPath := filepath.Join(voiceDir, "meta.json")
    metaData, _ := json.Marshal(clonedVoice)
    if writeErr := pathutil.WriteFile(metaPath, metaData, 0644); writeErr != nil {
        return apperror.Fail[Voice](writeErr)
    }
    
    xp.voices[voiceId] = clonedVoice
    
    return apperror.Ok(Voice{
        Id:       voiceId,
        Name:     name,
        Provider: "xtts",
        IsCloned: true,
    })
}

func (xp *XTTSProvider) ListVoices() apperror.Result[[]Voice] {
    xp.mu.RLock()
    defer xp.mu.RUnlock()
    
    var voices []Voice
    
    // Built-in voices
    builtins := []Voice{
        {Id: "en_male_1", Name: "English Male 1", Provider: "xtts", Language: "en", Gender: "male"},
        {Id: "en_female_1", Name: "English Female 1", Provider: "xtts", Language: "en", Gender: "female"},
        {Id: "es_male_1", Name: "Spanish Male 1", Provider: "xtts", Language: "es", Gender: "male"},
        {Id: "es_female_1", Name: "Spanish Female 1", Provider: "xtts", Language: "es", Gender: "female"},
    }
    voices = append(voices, builtins...)
    
    // Cloned voices
    for _, v := range xp.voices {
        voices = append(voices, Voice{
            Id:       v.Id,
            Name:     v.Name,
            Provider: "xtts",
            IsCloned: true,
        })
    }
    
    return apperror.Ok(voices)
}

func (xp *XTTSProvider) Name() string {
    return "xtts"
}

func (xp *XTTSProvider) IsAvailable() bool {
    return xp.isReady && xp.model != nil
}
```

---

## 2. ElevenLabs Provider (Cloud)

High-quality cloud TTS with extensive voice library and cloning.

### Configuration

```go
type ElevenLabsConfig struct {
    ApiKey       string
    Endpoint     string
    Model        string // "eleven_multilingual_v2", "eleven_turbo_v2_5"
    DefaultVoice string // Default voice ID
    MaxRetries   int
    Timeout      int
}
```

### Top Voice IDs

```go
var ElevenLabsTopVoices = map[string]string{
    "roger":    "CwhRBWXzGAHq8TQ4Fs17",
    "sarah":    "EXAVITQu4vr4xnSDxMaL",
    "laura":    "FGY2WhTYpPnrIDTdsKH5",
    "charlie":  "IKne3meq5aSn9XLyUdCD",
    "george":   "JBFqnCBsd6RMkjVDRZzb",
    "callum":   "N2lVS1w4EtoT3dr4eOWO",
    "river":    "SAz9YHcvj6GT2YYXdXww",
    "liam":     "TX3LPaxmHKxFdv7VOQHJ",
    "alice":    "Xb7hH8MSUJpSbSDYk0k2",
    "matilda":  "XrExE9yKIg1WjnnlVkGX",
    "will":     "bIHbv24MWmeRgasZH58o",
    "jessica":  "cgSgspJ2msm6clMCkdW9",
    "eric":     "cjVigY5qzO86Huf0OWal",
    "chris":    "iP95p4xoKVk53GoZ742B",
    "brian":    "nPczCjzI2devNBz1zQrb",
    "daniel":   "onwK4e9ZLuTAKqWW03F9",
    "lily":     "pFZP5JQG7iQjIQuC4Bku",
    "bill":     "pqHfZKP75CvOlQylNhV4",
}
```

### Implementation

```go
type ElevenLabsProvider struct {
    config     *ElevenLabsConfig
    client     *http.Client
    voices     []Voice
    isReady    bool
    mu         sync.RWMutex
}

func NewElevenLabsProvider(config *ElevenLabsConfig) *ElevenLabsProvider {
    return &ElevenLabsProvider{
        config: config,
        client: &http.Client{Timeout: time.Duration(config.Timeout) * time.Second},
    }
}

func (ep *ElevenLabsProvider) Initialize(context context.Context, config *ProviderConfig) *apperror.AppError {
    // Verify API key and fetch voices
    voiceResult := ep.fetchVoices(context)
    if voiceResult.HasError() {
        return voiceResult.AppError()
    }
    
    ep.voices = voiceResult.Value()
    ep.isReady = true

    return nil
}

func (ep *ElevenLabsProvider) fetchVoices(context context.Context) apperror.Result[[]Voice] {
    req, _ := http.NewRequestWithContext(context, httpmethodtype.Get.HttpVerb(),
        ep.config.Endpoint+"/v1/voices", nil)
    req.Header.Set("xi-api-key", ep.config.ApiKey)
    
    resp, doErr := ep.client.Do(req)
    if doErr != nil {
        return apperror.FailWrap[[]Voice](
            doErr,
            "E14150",
            "ElevenLabs API request failed",
        )
    }
    defer resp.Body.Close()
    
    if resp.StatusCode != 200 {
        return apperror.FailNew[[]Voice](
            "E14150",
            fmt.Sprintf("ElevenLabs API error: %d", resp.StatusCode),
        )
    }
    
    // EXEMPTED: External API (ElevenLabs) — snake_case keys
    var result struct {
        Voices []struct {
            VoiceId     string            `json:"voice_id"`
            Name        string            `json:"name"`
            Description string            `json:"description"`
            PreviewUrl  string            `json:"preview_url"`
            Labels      map[string]string `json:"labels"`
        } `json:"voices"`
    }
    
    if decodeErr := json.NewDecoder(resp.Body).Decode(&result); decodeErr != nil {
        return apperror.FailWrap[[]Voice](
            decodeErr,
            "E14150",
            "decode ElevenLabs voices response",
        )
    }
    
    var voices []Voice
    for _, v := range result.Voices {
        voices = append(voices, Voice{
            Id:          v.VoiceId,
            Name:        v.Name,
            Description: v.Description,
            Provider:    "elevenlabs",
            PreviewUrl:  v.PreviewUrl,
            Gender:      v.Labels["gender"],
            Age:         v.Labels["age"],
            UseCase:     v.Labels["use_case"],
        })
    }
    
    return apperror.Ok(voices)
}

func (ep *ElevenLabsProvider) Synthesize(context context.Context, text string, opts *SynthesizeOptions) apperror.Result[AudioResult] {
    voiceId := opts.VoiceId
    if voiceId == "" {
        voiceId = ep.config.DefaultVoice
    }
    
    // Resolve voice name to ID
    if id, ok := ElevenLabsTopVoices[strings.ToLower(voiceId)]; ok {
        voiceId = id
    }
    
    model := opts.ModelId
    if model == "" {
        model = ep.config.Model
    }
    
    // Build request body — typed struct for ElevenLabs TTS API
    body := ElevenLabsTtsRequest{
        Text:    text,
        ModelId: model,
    }
    
    // Add voice settings if specified
    if opts.Stability > 0 || opts.SimilarityBoost > 0 || opts.Style > 0 {
        body.VoiceSettings = &ElevenLabsVoiceSettings{
            Stability:       opts.Stability,
            SimilarityBoost: opts.SimilarityBoost,
            Style:           opts.Style,
            UseSpeakerBoost: opts.UseSpeakerBoost,
        }
    }
    
    if opts.Speed != 0 && opts.Speed != 1.0 {
        if body.VoiceSettings == nil {
            body.VoiceSettings = &ElevenLabsVoiceSettings{}
        }
        body.VoiceSettings.Speed = opts.Speed
    }
    
    // Request stitching for long-form content
    if opts.PreviousText != "" {
        body.PreviousText = opts.PreviousText
    }
    if opts.NextText != "" {
        body.NextText = opts.NextText
    }
    
    bodyBytes, _ := json.Marshal(body)
    
    // Determine output format query param
    outputFormat := "mp3_44100_128"
    switch opts.OutputFormat {
    case "pcm":
        outputFormat = fmt.Sprintf("pcm_%d", opts.SampleRate)
    case "opus":
        outputFormat = "opus"
    }
    
    url := fmt.Sprintf("%s/v1/text-to-speech/%s?output_format=%s",
        ep.config.Endpoint, voiceId, outputFormat)
    
    req, _ := http.NewRequestWithContext(context, httpmethodtype.Post.HttpVerb(), url, bytes.NewReader(bodyBytes))
    req.Header.Set("xi-api-key", ep.config.ApiKey)
    req.Header.Set("Content-Type", "application/json")
    
    resp, doErr := ep.client.Do(req)
    if doErr != nil {
        return apperror.FailWrap[AudioResult](
            doErr,
            "E14152",
            "ElevenLabs request failed",
        )
    }
    defer resp.Body.Close()
    
    if resp.StatusCode != 200 {
        respBody, _ := io.ReadAll(resp.Body)

        return apperror.FailNew[AudioResult](
            "E14152",
            fmt.Sprintf("ElevenLabs error %d: %s", resp.StatusCode, string(respBody)),
        )
    }
    
    audioData, readErr := io.ReadAll(resp.Body)
    if readErr != nil {
        return apperror.FailWrap[AudioResult](
            readErr,
            "E14158",
            "read ElevenLabs audio response",
        )
    }
    
    return apperror.Ok(AudioResult{
        Data:           audioData,
        Format:         opts.OutputFormat,
        SampleRate:     opts.SampleRate,
        CharacterCount: len(text),
    })
}

func (ep *ElevenLabsProvider) SynthesizeStream(context context.Context, text string, opts *SynthesizeOptions) apperror.Result[<-chan *AudioChunk] {
    resultChan := make(chan *AudioChunk, 100)
    
    voiceId := opts.VoiceId
    if voiceId == "" {
        voiceId = ep.config.DefaultVoice
    }
    
    model := opts.ModelId
    if model == "" {
        model = "eleven_turbo_v2_5" // Use turbo for streaming
    }
    
    // EXEMPTED: External API (ElevenLabs) — snake_case keys
    body := ElevenLabsTtsRequest{
        Text:    text,
        ModelId: model,
    }
    bodyBytes, _ := json.Marshal(body)
    
    url := fmt.Sprintf("%s/v1/text-to-speech/%s/stream?output_format=mp3_44100_128",
        ep.config.Endpoint, voiceId)
    
    req, _ := http.NewRequestWithContext(context, httpmethodtype.Post.HttpVerb(), url, bytes.NewReader(bodyBytes))
    req.Header.Set("xi-api-key", ep.config.ApiKey)
    req.Header.Set("Content-Type", "application/json")
    
    go func() {
        defer close(resultChan)
        
        resp, doErr := ep.client.Do(req)
        if doErr != nil {
            return
        }
        defer resp.Body.Close()
        
        if resp.StatusCode != 200 {
            return
        }
        
        // Read streaming response in chunks
        buf := make([]byte, 4096)
        chunkIdx := 0
        
        for {
            n, readErr := resp.Body.Read(buf)
            if n > 0 {
                chunk := &AudioChunk{
                    Id:         fmt.Sprintf("chunk_%d", chunkIdx),
                    Data:       append([]byte{}, buf[:n]...),
                    Format:     "mp3",
                    SampleRate: 44100,
                    Timestamp:  time.Now(),
                }
                
                select {
                case resultChan <- chunk:
                    chunkIdx++
                case <-context.Done():
                    return
                }
            }
            
            if readErr == io.EOF {
                break
            }
            if readErr != nil {
                return
            }
        }
    }()
    
    return apperror.Ok((<-chan *AudioChunk)(resultChan))
}

func (ep *ElevenLabsProvider) CloneVoice(context context.Context, name string, samples [][]byte) apperror.Result[Voice] {
    // Create multipart form
    var body bytes.Buffer
    writer := multipart.NewWriter(&body)
    
    writer.WriteField("name", name)
    writer.WriteField("description", "Cloned voice via AI Transcribe CLI")
    
    // Add sample files
    for i, sample := range samples {
        part, partErr := writer.CreateFormFile("files", fmt.Sprintf("sample_%d.mp3", i))
        if partErr != nil {
            return apperror.FailWrap[Voice](
                partErr,
                "E14154",
                "create multipart form file",
            )
        }
        part.Write(sample)
    }
    
    writer.Close()
    
    req, _ := http.NewRequestWithContext(context, httpmethodtype.Post.HttpVerb(),
        ep.config.Endpoint+"/v1/voices/add", &body)
    req.Header.Set("xi-api-key", ep.config.ApiKey)
    req.Header.Set("Content-Type", writer.FormDataContentType())
    
    resp, doErr := ep.client.Do(req)
    if doErr != nil {
        return apperror.FailWrap[Voice](
            doErr,
            "E14154",
            "ElevenLabs voice cloning request failed",
        )
    }
    defer resp.Body.Close()
    
    if resp.StatusCode != 200 {
        respBody, _ := io.ReadAll(resp.Body)

        return apperror.FailNew[Voice](
            "E14154",
            "voice cloning failed: "+string(respBody),
        )
    }
    
    // EXEMPTED: External API (ElevenLabs) — snake_case keys
    var result struct {
        VoiceId string `json:"voice_id"`
    }
    json.NewDecoder(resp.Body).Decode(&result)
    
    return apperror.Ok(Voice{
        Id:       result.VoiceId,
        Name:     name,
        Provider: "elevenlabs",
        IsCloned: true,
    })
}

func (ep *ElevenLabsProvider) ListVoices() apperror.Result[[]Voice] {
    ep.mu.RLock()
    defer ep.mu.RUnlock()

    return apperror.Ok(ep.voices)
}

func (ep *ElevenLabsProvider) Name() string {
    return "elevenlabs"
}

func (ep *ElevenLabsProvider) IsAvailable() bool {
    return ep.isReady && ep.config.ApiKey != ""
}
```

---

## 3. Azure TTS Provider (Cloud)

Enterprise-grade TTS with extensive language support.

### Configuration

```go
type AzureTtsConfig struct {
    SubscriptionKey string // "eastus", "westeurope"
    Region          string // "eastus", "westeurope"
    Endpoint        string // Optional custom endpoint
    DefaultVoice    string // e.g., "en-US-JennyNeural"
}
```

### Implementation

```go
type AzureTtsProvider struct {
    config     *AzureTtsConfig
    client     *http.Client
    token      string
    tokenExp   time.Time
    voices     []Voice
    isReady    bool
    mu         sync.RWMutex
}

func NewAzureTtsProvider(config *AzureTtsConfig) *AzureTtsProvider {
    return &AzureTtsProvider{
        config: config,
        client: &http.Client{Timeout: 30 * time.Second},
    }
}

func (ap *AzureTtsProvider) Initialize(context context.Context, config *ProviderConfig) *apperror.AppError {
    // Get initial auth token
    if tokenErr := ap.refreshToken(context); tokenErr != nil {
        return tokenErr
    }
    
    // Fetch available voices
    voiceResult := ap.fetchVoices(context)
    if voiceResult.HasError() {
        return voiceResult.AppError()
    }
    
    ap.voices = voiceResult.Value()
    ap.isReady = true

    return nil
}

func (ap *AzureTtsProvider) refreshToken(context context.Context) *apperror.AppError {
    ap.mu.Lock()
    defer ap.mu.Unlock()
    
    // Check if token is still valid
    if time.Now().Before(ap.tokenExp.Add(-1 * time.Minute)) {
        return nil
    }
    
    endpoint := fmt.Sprintf("https://%s.api.cognitive.microsoft.com/sts/v1.0/issueToken",
        ap.config.Region)
    
    req, _ := http.NewRequestWithContext(context, httpmethodtype.Post.HttpVerb(), endpoint, nil)
    req.Header.Set("Ocp-Apim-Subscription-Key", ap.config.SubscriptionKey)
    
    resp, doErr := ap.client.Do(req)
    if doErr != nil {
        return apperror.Wrap(
            doErr,
            "E14156",
            "Azure token refresh request failed",
        )
    }
    defer resp.Body.Close()
    
    if resp.StatusCode != 200 {
        return apperror.New(
            "E14156",
            fmt.Sprintf("Azure token refresh failed: %d", resp.StatusCode),
        ).WithStatusCode(resp.StatusCode)
    }
    
    tokenBytes, _ := io.ReadAll(resp.Body)
    ap.token = string(tokenBytes)
    ap.tokenExp = time.Now().Add(9 * time.Minute) // Azure tokens last 10 mins
    
    return nil
}

func (ap *AzureTtsProvider) Synthesize(context context.Context, text string, opts *SynthesizeOptions) apperror.Result[AudioResult] {
    if tokenErr := ap.refreshToken(context); tokenErr != nil {
        return apperror.Fail[AudioResult](tokenErr)
    }
    
    voiceName := opts.VoiceId
    if voiceName == "" {
        voiceName = ap.config.DefaultVoice
    }
    
    // Build SSML
    ssml := fmt.Sprintf(`<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='%s'>
        <voice name='%s'>
            <prosody rate='%s' pitch='%s'>%s</prosody>
        </voice>
    </speak>`,
        opts.Language,
        voiceName,
        ap.formatRate(opts.Speed),
        ap.formatPitch(opts.Pitch),
        html.EscapeString(text))
    
    endpoint := fmt.Sprintf("https://%s.tts.speech.microsoft.com/cognitiveservices/v1",
        ap.config.Region)
    
    req, _ := http.NewRequestWithContext(context, httpmethodtype.Post.HttpVerb(), endpoint, strings.NewReader(ssml))
    req.Header.Set("Authorization", "Bearer "+ap.token)
    req.Header.Set("Content-Type", "application/ssml+xml")
    req.Header.Set("X-Microsoft-OutputFormat", ap.getOutputFormat(opts))
    
    resp, doErr := ap.client.Do(req)
    if doErr != nil {
        return apperror.FailWrap[AudioResult](
            doErr,
            "E14152",
            "Azure TTS request failed",
        )
    }
    defer resp.Body.Close()
    
    if resp.StatusCode != 200 {
        respBody, _ := io.ReadAll(resp.Body)

        return apperror.FailNew[AudioResult](
            "E14152",
            fmt.Sprintf("Azure TTS error %d: %s", resp.StatusCode, string(respBody)),
        )
    }
    
    audioData, _ := io.ReadAll(resp.Body)
    
    return apperror.Ok(AudioResult{
        Data:           audioData,
        Format:         opts.OutputFormat,
        SampleRate:     opts.SampleRate,
        CharacterCount: len(text),
    })
}

func (ap *AzureTtsProvider) formatRate(speed float64) string {
    if speed == 0 || speed == 1.0 {
        return "default"
    }
    percentage := (speed - 1.0) * 100
    if percentage > 0 {
        return fmt.Sprintf("+%.0f%%", percentage)
    }

    return fmt.Sprintf("%.0f%%", percentage)
}

func (ap *AzureTtsProvider) formatPitch(pitch float64) string {
    if pitch == 0 {
        return "default"
    }
    if pitch > 0 {
        return fmt.Sprintf("+%.0fHz", pitch)
    }

    return fmt.Sprintf("%.0fHz", pitch)
}

func (ap *AzureTtsProvider) getOutputFormat(opts *SynthesizeOptions) string {
    switch opts.OutputFormat {
    case "mp3":
        return "audio-24khz-48kbitrate-mono-mp3"
    case "pcm":
        return fmt.Sprintf("raw-%dkhz-16bit-mono-pcm", opts.SampleRate/1000)
    case "opus":
        return "ogg-24khz-16bit-mono-opus"
    default:
        return "audio-24khz-48kbitrate-mono-mp3"
    }
}

func (ap *AzureTtsProvider) fetchVoices(context context.Context) apperror.Result[[]Voice] {
    endpoint := fmt.Sprintf("https://%s.tts.speech.microsoft.com/cognitiveservices/voices/list",
        ap.config.Region)
    
    req, _ := http.NewRequestWithContext(context, httpmethodtype.Get.HttpVerb(), endpoint, nil)
    req.Header.Set("Ocp-Apim-Subscription-Key", ap.config.SubscriptionKey)
    
    resp, doErr := ap.client.Do(req)
    if doErr != nil {
        return apperror.FailWrap[[]Voice](
            doErr,
            "E14150",
            "Azure voice list request failed",
        )
    }
    defer resp.Body.Close()
    
    // Azure Speech API returns PascalCase natively — tags are redundant
    var result []struct {
        ShortName   string
        DisplayName string
        LocalName   string
        Gender      string
        Locale      string
        VoiceType   string
    }
    
    json.NewDecoder(resp.Body).Decode(&result)
    
    var voices []Voice
    for _, v := range result {
        voices = append(voices, Voice{
            Id:       v.ShortName,
            Name:     v.DisplayName,
            Provider: "azure",
            Language: v.Locale,
            Gender:   strings.ToLower(v.Gender),
        })
    }
    
    return apperror.Ok(voices)
}

func (ap *AzureTtsProvider) ListVoices() apperror.Result[[]Voice] {
    ap.mu.RLock()
    defer ap.mu.RUnlock()

    return apperror.Ok(ap.voices)
}

func (ap *AzureTtsProvider) Name() string {
    return "azure"
}

func (ap *AzureTtsProvider) IsAvailable() bool {
    return ap.isReady && ap.config.SubscriptionKey != ""
}

// Azure doesn't support voice cloning via API
func (ap *AzureTtsProvider) CloneVoice(context context.Context, name string, samples [][]byte) apperror.Result[Voice] {
    return apperror.FailNew[Voice](
        "E14154",
        "voice cloning not supported by Azure TTS",
    )
}
```

---

## Provider Registry

```go
type TTSProviderRegistry struct {
    providers map[string]TTSProvider
    priority  []string
    mu        sync.RWMutex
}

func NewTtsProviderRegistry() *TTSProviderRegistry {
    return &TTSProviderRegistry{
        providers: make(map[string]TTSProvider),
        priority:  []string{"xtts", "elevenlabs", "azure"},
    }
}

func (r *TTSProviderRegistry) Register(provider TTSProvider) {
    r.mu.Lock()
    defer r.mu.Unlock()
    r.providers[provider.Name()] = provider
}

func (r *TTSProviderRegistry) GetPrimary() apperror.Result[TTSProvider] {
    r.mu.RLock()
    defer r.mu.RUnlock()
    
    for _, name := range r.priority {
        if provider, ok := r.providers[name]; ok {
            if provider.IsAvailable() {
                return apperror.Ok(provider)
            }
        }
    }
    
    return apperror.FailNew[TTSProvider](
        "E14150",
        "no TTS provider available",
    )
}
```

---

## Output Format Reference

| Format | Content-Type | Use Case |
|--------|--------------|----------|
| mp3_44100_128 | audio/mpeg | High quality playback |
| mp3_22050_32 | audio/mpeg | Smaller file size |
| pcm_16000 | audio/wav | Raw processing |
| pcm_44100 | audio/wav | High fidelity raw |
| opus | audio/ogg | WebSocket streaming |

---

## Error Codes

| Code | Constant | Description |
|------|----------|-------------|
| 14150 | ErrTtsProviderUnavailable | No TTS provider available |
| 14151 | ErrTtsModelNotLoaded | XTTS model not loaded |
| 14152 | ErrTtsSynthesisFailed | Synthesis processing failed |
| 14153 | ErrTtsVoiceNotFound | Voice ID not found |
| 14154 | ErrTtsVoiceCloningFailed | Voice cloning failed |
| 14155 | ErrTtsTextTooLong | Text exceeds maximum length |
| 14156 | ErrTtsApiKeyInvalid | Invalid API key |
| 14157 | ErrTtsRateLimited | API rate limit exceeded |
| 14158 | ErrTtsAudioEncodingFailed | Failed to encode audio |

---

## See Also

- [Architecture](./01-architecture.md) — System design
- [STT Providers](./03-stt-providers.md) — Speech recognition
- [Voice Cloning](./07-voice-cloning.md) — Custom voice management
- [API Interface](./09-api-interface.md) — REST endpoints
