# Voice Cloning

**Version:** 2.0.0  
**Status:** Active  
**Updated:** 2026-03-09  

---

## Overview

Voice cloning enables creation of custom TTS voices from audio samples. This feature allows users to generate speech in their own voice or create branded voice profiles for consistent audio output.

**Cross-References:**
- [TTS Providers](./04-tts-providers.md)
- [Audio Pipeline](./02-audio-pipeline.md)
- [Database Schema](./08-database-schema.md)

---

## Cloning Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   Voice Cloning Pipeline                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Audio Samples ──▶ Preprocessing ──▶ Feature Extraction     │
│                                              │              │
│                                              ▼              │
│                    ┌─────────────────────────────────┐      │
│                    │      Voice Model Training       │      │
│                    │  ┌─────────┐  ┌─────────────┐  │      │
│                    │  │ Speaker │  │   Prosody   │  │      │
│                    │  │Embedding│  │   Model     │  │      │
│                    │  └─────────┘  └─────────────┘  │      │
│                    └─────────────────────────────────┘      │
│                                              │              │
│                                              ▼              │
│                              Voice Profile Storage          │
│                                              │              │
│                                              ▼              │
│                              TTS with Custom Voice          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Cloning Methods

### 1. Instant Cloning

Quick voice cloning from short audio samples (3-30 seconds).

```go
type InstantCloneRequest struct {
    AudioData   []byte  // wav, mp3, flac
    AudioFormat string  // wav, mp3, flac
    VoiceName   string
    Description string
    Language    string  // Primary language
}

type InstantCloneResult struct {
    VoiceId     string    // 0.0-1.0 quality score
    Name        string
    Quality     float64   // 0.0-1.0 quality score
    SampleCount int
    CreatedAt   time.Time
}
```

**Provider Support:**
| Provider | Min Duration | Max Duration | Quality |
|----------|--------------|--------------|---------|
| ElevenLabs | 3s | 300s | High |
| XTTS | 6s | 30s | Medium |
| Azure | 20s | 60s | High |

### 2. Professional Cloning

High-quality voice cloning from multiple samples with training.

```go
type ProfessionalCloneRequest struct {
    Samples      []AudioSample
    VoiceName    string
    Description  string
    Language     string
    Accent       string
    Gender       string
    AgeRange     string
    TrainingTier string // basic, standard, premium
}

type AudioSample struct {
    AudioData  []byte
    Transcript string // What was said
    Emotion    string // neutral, happy, sad, etc.
    SampleType string // reading, conversation, narration
}
```

**Training Tiers:**
| Tier | Samples | Training Time | Quality |
|------|---------|---------------|---------|
| Basic | 5-10 | ~5 min | Good |
| Standard | 20-50 | ~30 min | Very Good |
| Premium | 100+ | ~2 hours | Excellent |

---

## Voice Profile Management

### Data Structure

```go
type VoiceProfile struct {
    Id          string
    Name        string
    Description string
    Provider    string        // elevenlabs, xtts, azure
    ProviderId  string        // External voice Id
    CloneMethod string        // instant, professional
    Quality     float64
    Languages   []string
    Metadata    VoiceMetadata
    Settings    VoiceSettings
    SampleUrls  []string
    Status      string    // training, ready, failed
    CreatedAt   time.Time
    UpdatedAt   time.Time
}

type VoiceMetadata struct {
    Gender       string  // narration, conversation, etc.
    AgeRange     string
    Accent       string
    UseCase      string  // narration, conversation, etc.
    TotalSamples int
    TotalSeconds float64
}

type VoiceSettings struct {
    Stability       float64 // 0.0-1.0
    SimilarityBoost float64 // 0.0-1.0
    Style           float64 // 0.0-1.0
    SpeakerBoost    bool
}
```

### Database Schema

```sql
CREATE TABLE voice_profiles (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    provider TEXT NOT NULL,
    provider_voice_id TEXT,
    clone_method TEXT NOT NULL,
    quality_score REAL,
    languages TEXT,              -- JSON array
    metadata TEXT,               -- JSON object
    settings TEXT,               -- JSON object
    status TEXT DEFAULT 'training',
    error_message TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE voice_samples (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    voice_profile_id TEXT NOT NULL,
    audio_hash TEXT NOT NULL,    -- SHA256 of audio
    duration_seconds REAL NOT NULL,
    transcript TEXT,
    emotion TEXT,
    sample_type TEXT,
    file_path TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (voice_profile_id) REFERENCES voice_profiles(id)
);

CREATE TABLE voice_usage (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    voice_profile_id TEXT NOT NULL,
    characters_used INTEGER NOT NULL,
    audio_seconds REAL NOT NULL,
    session_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (voice_profile_id) REFERENCES voice_profiles(id)
);
```

---

## Provider Integration

### ElevenLabs Voice Cloning

```go
type ElevenLabsCloner struct {
    apiKey  string
    baseUrl string
    client  *http.Client
}

func (c *ElevenLabsCloner) InstantClone(req InstantCloneRequest) appfault.Result[VoiceProfile] {
    // Prepare multipart form
    body := &bytes.Buffer{}
    writer := multipart.NewWriter(body)
    
    writer.WriteField("name", req.VoiceName)
    writer.WriteField("description", req.Description)
    
    part, _ := writer.CreateFormFile("files", "sample.wav")
    part.Write(req.AudioData)
    writer.Close()
    
    httpReq, _ := http.NewRequest(httpmethod.Post.String(), 
        c.baseUrl+"/v1/voices/add",
        body,
    )
    httpReq.Header.Set("xi-api-key", c.apiKey)
    httpReq.Header.Set("Content-Type", writer.FormDataContentType())
    
    resp, err := c.client.Do(httpReq)
    if err != nil {
        return nil, err
    }
    
    // EXEMPTED: External API (ElevenLabs) — snake_case keys
    var result struct {
        VoiceId string `json:"voice_id"`
    }
    json.NewDecoder(resp.Body).Decode(&result)
    
    return &VoiceProfile{
        Id:         generateId(),
        ProviderId: result.VoiceId,
        Provider:   "elevenlabs",
        Status:     "ready",
    }, nil
}
```

### XTTS Voice Cloning

```go
type XTTSCloner struct {
    baseUrl string
    client  *http.Client
}

func (c *XTTSCloner) InstantClone(req InstantCloneRequest) appfault.Result[VoiceProfile] {
    // XTTS uses reference audio directly, no separate clone step
    // Store the sample for use during synthesis
    
    samplePath := filepath.Join(voiceSamplesDir, req.VoiceName+".wav")
    err := pathutil.WriteFile(samplePath, req.AudioData)
    if err != nil {
        return nil, err
    }
    
    return &VoiceProfile{
        Id:          generateId(),
        Name:        req.VoiceName,
        Provider:    "xtts",
        CloneMethod: "instant",
        SampleUrls:  []string{samplePath},
        Status:      "ready",
    }, nil
}

// Synthesis uses the stored sample as reference
func (c *XTTSCloner) Synthesize(profile *VoiceProfile, text string) ByteSlice {
    // EXEMPTED: external XTTS API — raw JSON payload required by third-party TTS server (§7.2)
    payload := map[string]any{
        "text":           text,
        "speaker_wav":    profile.SampleUrls[0],
        "language":       profile.Languages[0],
    }
    
    resp, err := c.client.Post(
        c.baseUrl+"/tts_to_audio/",
        "application/json",
        toJson(payload),
    )
    // ...
}
```

---

## Sample Requirements

### Audio Quality Guidelines

```go
type SampleQualityCheck struct {
    MinDuration     float64 // Minimum seconds
    MaxDuration     float64 // Maximum seconds
    MinSampleRate   int     // Minimum Hz
    MaxNoiseLevel   float64 // Maximum noise dB
    RequiredFormat  []string
}

var qualityRequirements = map[string]SampleQualityCheck{
    "instant": {
        MinDuration:   3.0,
        MaxDuration:   30.0,
        MinSampleRate: 16000,
        MaxNoiseLevel: -30.0,
        RequiredFormat: []string{"wav", "mp3", "flac"},
    },
    "professional": {
        MinDuration:   10.0,
        MaxDuration:   60.0,
        MinSampleRate: 44100,
        MaxNoiseLevel: -40.0,
        RequiredFormat: []string{"wav", "flac"},
    },
}

func ValidateSample(audio []byte, method string) appfault.Result[SampleValidation] {
    reqs := qualityRequirements[method]
    
    // Analyze audio
    duration := getAudioDuration(audio)
    sampleRate := getSampleRate(audio)
    noiseLevel := analyzeNoise(audio)
    
    issues := []string{}
    
    if duration < reqs.MinDuration {
        issues = append(issues, fmt.Sprintf(
            "Audio too short: %.1fs (min: %.1fs)", 
            duration, reqs.MinDuration,
        ))
    }
    
    if noiseLevel > reqs.MaxNoiseLevel {
        issues = append(issues, fmt.Sprintf(
            "Too much background noise: %.1fdB (max: %.1fdB)",
            noiseLevel, reqs.MaxNoiseLevel,
        ))
    }
    
    return &SampleValidation{
        Valid:   len(issues) == 0,
        Issues:  issues,
        Quality: calculateQuality(duration, sampleRate, noiseLevel),
    }, nil
}
```

### Content Guidelines

**Recommended:**
- Clear speech without background noise
- Consistent volume throughout
- Natural speaking pace
- Varied intonation (not monotone)
- Multiple emotional tones for professional cloning

**Avoid:**
- Music or background sounds
- Multiple speakers
- Heavy accents (unless intentional)
- Whispering or shouting
- Poor microphone quality

---

## API Endpoints

### Voice Cloning API

```yaml
# Create instant clone
POST /api/v1/voices/clone/instant
Content-Type: multipart/form-data
Body:
  audio: [binary audio file]
  name: "My Voice"
  description: "Personal voice clone"
  language: "en"
Response:
  voice_id: "voice_abc123"
  status: "ready"
  quality: 0.87

# Create professional clone
POST /api/v1/voices/clone/professional
Content-Type: multipart/form-data
Body:
  samples: [multiple audio files]
  transcripts: [JSON array of transcripts]
  name: "Professional Voice"
  training_tier: "standard"
Response:
  voice_id: "voice_def456"
  status: "training"
  estimated_time: 1800  # seconds

# Check training status
GET /api/v1/voices/{voice_id}/status
Response:
  status: "training"
  progress: 0.65
  estimated_remaining: 630

# List custom voices
GET /api/v1/voices?type=cloned
Response:
  voices:
    - id: "voice_abc123"
      name: "My Voice"
      provider: "elevenlabs"
      status: "ready"
      quality: 0.87

# Delete cloned voice
DELETE /api/v1/voices/{voice_id}
Response:
  deleted: true

# Update voice settings
PATCH /api/v1/voices/{voice_id}/settings
Body:
  stability: 0.75
  similarity_boost: 0.8
Response:
  updated: true
```

---

## Error Codes

| Code | Constant | Description |
|------|----------|-------------|
| 14300 | ERR_CLONE_SAMPLE_SHORT | Audio sample too short |
| 14301 | ERR_CLONE_SAMPLE_LONG | Audio sample too long |
| 14302 | ERR_CLONE_QUALITY | Poor audio quality |
| 14303 | ERR_CLONE_FORMAT | Unsupported audio format |
| 14304 | ERR_CLONE_TRAINING | Voice training failed |
| 14305 | ERR_CLONE_LIMIT | Maximum voices reached |
| 14306 | ERR_CLONE_PROVIDER | Provider cloning error |
| 14307 | ERR_VOICE_NOT_FOUND | Cloned voice not found |

---

## Security Considerations

### Consent & Ethics

```go
type VoiceConsent struct {
    VoiceProfileId string    // self, authorized
    ConsentType    string    // self, authorized
    ConsentDate    time.Time
    ConsentProof   string    // Signature, recording
    Restrictions   []string  // Usage limitations
}
```

**Requirements:**
1. Voice owner consent required for cloning
2. Clear usage terms displayed
3. Watermarking option for generated audio
4. Abuse detection and prevention

### Access Control

```go
type VoiceAccess struct {
    VoiceProfileId string   // User Ids
    OwnerId        string
    SharedWith     []string // User Ids
    PublicAccess   bool
    ApiAccessOnly  bool
}
```

---

## Related Specs

- [TTS Providers](./04-tts-providers.md)
- [Audio Pipeline](./02-audio-pipeline.md)
- [Configuration](./11-configuration.md)
