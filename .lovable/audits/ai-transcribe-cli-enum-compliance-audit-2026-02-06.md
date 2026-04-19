# AI Transcribe CLI Enum Compliance Audit Report

**Date:** 2026-02-06  
**Auditor:** AI  
**Version:** 1.0.0  
**Standard:** `spec/17-enum-specification/`

> **v3.0.0 Note (2026-02-28):** Since this audit, all enums have been migrated to the v3.0.0 single `variantLabels` PascalCase pattern. The dual-table `variantStrings` + `variantLabels` pattern referenced in this report is now deprecated. `Label()` delegates to `String()`, `Parse()` uses `strings.EqualFold()`, and package names use the `type` suffix convention.

---

## Summary

| Category | Score | Max | Status |
|----------|-------|-----|--------|
| Structure | 0 | 10 | ❌ Fail |
| Declaration | 2 | 10 | ❌ Fail |
| Required Methods | 0 | 14 | ❌ Fail |
| Lookup Tables | 0 | 6 | ❌ Fail |
| No Hardcoded Strings | 3 | 10 | ❌ Fail |
| **Total** | **5** | **50** | **❌ Non-Compliant** |

---

## Critical Issues Found

### Issue 1: No Enum Directory Structure

AI Transcribe CLI has **no `internal/enums/` directory** defined in its specifications. All type-differentiating values use string-based struct fields without proper enum infrastructure.

### Issue 2: String-Based Provider Selection

**File:** `01-architecture.md` (lines 120-132)

```go
type EngineConfig struct {
    STTProvider        string  `json:"SttProvider"`         // "whisper", "openai", "elevenlabs"
    TTSProvider        string  `json:"TtsProvider"`         // "xtts", "elevenlabs", "azure"
    // ...
}
```

**Issues:**
- ❌ Uses `string` instead of `stt_provider.Variant` / `tts_provider.Variant`
- ❌ Provider selection via comment-documented string literals
- ❌ No type safety for provider switching

---

### Issue 3: Implicit Enums in Audio Pipeline

**File:** `01-architecture.md` (lines 151-160)

```go
type AudioChunk struct {
    Format      string    `json:"Format"`      // "pcm", "webm", "opus"
    // ...
}
```

| Field | Current Type | Should Be |
|-------|--------------|-----------|
| `AudioChunk.Format` | `string` | `audio_format.Variant` |

---

### Issue 4: Implicit Enums in STT Providers

**File:** `03-stt-providers.md` (lines 46-55)

```go
type TranscribeOptions struct {
    Language         string   // ISO 639-1 ("en", "es") or "auto"
    Task             string   // "transcribe" or "translate"
    // ...
}
```

| Field | Current Type | Should Be |
|-------|--------------|-----------|
| `TranscribeOptions.Task` | `string` (comment: "transcribe", "translate") | `stt_task.Variant` |

---

### Issue 5: Implicit Enums in TTS Providers

**File:** `04-tts-providers.md` (lines 48-64)

```go
type SynthesizeOptions struct {
    OutputFormat     string   // "mp3", "pcm", "opus"
    // ...
}

type Voice struct {
    Gender      string  // "male", "female", "neutral"
    Age         string  // "young", "middle", "old"
    UseCase     string  // "narration", "conversational", "news"
    // ...
}
```

| Field | Current Type | Should Be |
|-------|--------------|-----------|
| `SynthesizeOptions.OutputFormat` | `string` | `output_format.Variant` |
| `Voice.Gender` | `string` (comment: "male", "female", "neutral") | `gender.Variant` |
| `Voice.Age` | `string` (comment: "young", "middle", "old") | `age_group.Variant` |
| `Voice.UseCase` | `string` (comment: "narration", "conversational", "news") | `use_case.Variant` |

---

### Issue 6: Implicit Enums in Database Schema

**File:** `08-database-schema.md`

| Field | Table | Line | Current Type | Should Be |
|-------|-------|------|--------------|-----------|
| `ValueType` | Config | 65 | `TEXT` (comment: "string, int, float, bool, json") | `value_type.Variant` |
| `Type` | Models | 92 | `TEXT` (comment: "stt, tts, vad") | `model_type.Variant` |
| `Status` | Models | 99 | `TEXT` (comment: "available, downloading, corrupted") | `model_status.Variant` |
| `Type` | Providers | 131 | `TEXT` (comment: "stt, tts") | `provider_type.Variant` |
| `HealthStatus` | Providers | 139 | `TEXT` (comment: "healthy, degraded, unhealthy") | `health_status.Variant` |
| `Type` | Sessions | 201 | `TEXT` (comment: "transcription, tts, conversation") | `session_type.Variant` |
| `Status` | Sessions | 202 | `TEXT` (comment: "active, completed, failed") | `session_status.Variant` |
| `Operation` | UsageMetrics | 222 | `TEXT` (comment: "transcribe, synthesize, clone") | `operation.Variant` |
| `QuotaType` | Quotas | 242 | `TEXT` (comment: "characters, minutes, requests") | `quota_type.Variant` |
| `SourceType` | Transcripts | 265 | `TEXT` (comment: "microphone, file, stream") | `source_type.Variant` |
| `EventType` | AudioEvents | 381 | `TEXT` (comment: "laughter, applause, music, silence") | `audio_event_type.Variant` |

---

### Issue 7: Implicit Enums in Configuration

**File:** `11-configuration.md`

| Field | Section | Current Type | Should Be |
|-------|---------|--------------|-----------|
| `stt.whisper.model_size` | STT | `string` (comment: "tiny, base, small, medium, large") | `whisper_model_size.Variant` |
| `stt.whisper.device` | STT | `string` (comment: "cpu, cuda, auto") | `compute_device.Variant` |
| `stt.whisper.compute_type` | STT | `string` (comment: "float16, float32, int8") | `compute_type.Variant` |
| `logging.level` | Logging | `string` (comment: "debug, info, warn, error") | `log_level.Variant` |
| `logging.format` | Logging | `string` (comment: "json, text") | `log_format.Variant` |
| `realtime.vad.mode` | Realtime | `string` (comment: "normal, low_bitrate, aggressive, very_aggressive") | `vad_mode.Variant` |

---

### Issue 8: Hardcoded AudioEvent Types

**File:** `03-stt-providers.md` (lines 94-98)

```go
type AudioEvent struct {
    Type  string   // "laughter", "applause", "music"
    // ...
}
```

**Issues:**
- ❌ Uses hardcoded string for event type
- ❌ No enum validation

---

## Enums Required

| Enum | Package | Values | Source File |
|------|---------|--------|-------------|
| `stt_provider.Variant` | `internal/enums/stt_provider/` | Whisper, OpenAi, ElevenLabs | `01-architecture.md` |
| `tts_provider.Variant` | `internal/enums/tts_provider/` | Xtts, ElevenLabs, Azure | `01-architecture.md` |
| `audio_format.Variant` | `internal/enums/audio_format/` | Pcm, Webm, Opus, Mp3, Wav | `01-architecture.md`, `04-tts-providers.md` |
| `stt_task.Variant` | `internal/enums/stt_task/` | Transcribe, Translate | `03-stt-providers.md` |
| `gender.Variant` | `internal/enums/gender/` | Male, Female, Neutral | `04-tts-providers.md` |
| `age_group.Variant` | `internal/enums/age_group/` | Young, Middle, Old | `04-tts-providers.md` |
| `use_case.Variant` | `internal/enums/use_case/` | Narration, Conversational, News | `04-tts-providers.md` |
| `value_type.Variant` | `internal/enums/value_type/` | String, Int, Float, Bool, Json | `08-database-schema.md` |
| `model_type.Variant` | `internal/enums/model_type/` | Stt, Tts, Vad | `08-database-schema.md` |
| `model_status.Variant` | `internal/enums/model_status/` | Available, Downloading, Corrupted | `08-database-schema.md` |
| `provider_type.Variant` | `internal/enums/provider_type/` | Stt, Tts | `08-database-schema.md` |
| `health_status.Variant` | `internal/enums/health_status/` | Healthy, Degraded, Unhealthy | `08-database-schema.md` |
| `session_type.Variant` | `internal/enums/session_type/` | Transcription, Tts, Conversation | `08-database-schema.md` |
| `session_status.Variant` | `internal/enums/session_status/` | Active, Completed, Failed | `08-database-schema.md` |
| `operation.Variant` | `internal/enums/operation/` | Transcribe, Synthesize, Clone | `08-database-schema.md` |
| `quota_type.Variant` | `internal/enums/quota_type/` | Characters, Minutes, Requests | `08-database-schema.md` |
| `source_type.Variant` | `internal/enums/source_type/` | Microphone, File, Stream | `08-database-schema.md` |
| `audio_event_type.Variant` | `internal/enums/audio_event_type/` | Laughter, Applause, Music, Silence | `08-database-schema.md` |
| `whisper_model_size.Variant` | `internal/enums/whisper_model_size/` | Tiny, Base, Small, Medium, Large | `11-configuration.md` |
| `compute_device.Variant` | `internal/enums/compute_device/` | Cpu, Cuda, Auto | `11-configuration.md` |
| `compute_type.Variant` | `internal/enums/compute_type/` | Float16, Float32, Int8 | `11-configuration.md` |
| `log_level.Variant` | `internal/enums/log_level/` | Debug, Info, Warn, Error | `11-configuration.md` |
| `log_format.Variant` | `internal/enums/log_format/` | Json, Text | `11-configuration.md` |
| `vad_mode.Variant` | `internal/enums/vad_mode/` | Normal, LowBitrate, Aggressive, VeryAggressive | `11-configuration.md` |

---

## Remediation Plan

### Phase 1: Create Enum Architecture Specification

Create `spec/26-ai-transcribe-cli/01-backend/14-enum-architecture.md` with all enum definitions following `spec/17-enum-specification/` standard.

### Phase 2: Define Compliant Enums

For each enum, ensure:
1. `type Variant byte`
2. `Unknown Variant = iota` as first constant
3. `variantStrings` and `variantLabels` arrays
4. All required methods: `String()`, `Label()`, `IsValid()`, `Is*()`, `All()`, `ByIndex()`, `Parse()`

### Phase 3: Update Existing Specs

Update these files to reference the new enums:
- `01-architecture.md` - Replace provider selection strings
- `03-stt-providers.md` - Replace task and event type strings
- `04-tts-providers.md` - Replace voice properties strings
- `08-database-schema.md` - Replace status/type string columns
- `11-configuration.md` - Replace model size, device, log level strings

---

## Compliant Enum Template (stt_provider.Variant)

```go
// internal/enums/stt_provider/variant.go
package stt_provider

import (
    "encoding/json"
    "fmt"
    "strings"
)

// Variant represents a Speech-to-Text provider
type Variant byte

const (
    // Unknown is the zero value (invalid/unset)
    Unknown Variant = iota
    
    // Whisper is the local Whisper provider
    Whisper
    
    // OpenAi is OpenAI's Whisper API
    OpenAi
    
    // ElevenLabs is ElevenLabs Scribe
    ElevenLabs
)

var variantStrings = [...]string{
    Unknown:    "unknown",
    Whisper:    "whisper",
    OpenAi:     "openai",
    ElevenLabs: "elevenlabs",
}

var variantLabels = [...]string{
    Unknown:    "Unknown Provider",
    Whisper:    "Whisper (Local)",
    OpenAi:     "OpenAI Whisper",
    ElevenLabs: "ElevenLabs Scribe",
}

func (v Variant) String() string {
    if !v.IsValid() {
        return variantStrings[Unknown]
    }
    return variantStrings[v]
}

func (v Variant) Label() string {
    if !v.IsValid() {
        return variantLabels[Unknown]
    }
    return variantLabels[v]
}

func (v Variant) IsValid() bool {
    return v > Unknown && v < Variant(len(variantStrings))
}

func (v Variant) IsUnknown() bool    { return v == Unknown }
func (v Variant) IsWhisper() bool    { return v == Whisper }
func (v Variant) IsOpenAi() bool     { return v == OpenAi }
func (v Variant) IsElevenLabs() bool { return v == ElevenLabs }

func All() []Variant {
    return []Variant{Whisper, OpenAi, ElevenLabs}
}

func ByIndex(i int) Variant {
    if i < 0 || i >= len(variantStrings) {
        return Unknown
    }
    return Variant(i)
}

func Parse(s string) (Variant, error) {
    lower := strings.ToLower(strings.TrimSpace(s))
    for i, str := range variantStrings {
        if str == lower {
            return Variant(i), nil
        }
    }
    return Unknown, fmt.Errorf("invalid STT provider: %q", s)
}

func Values() []string {
    result := make([]string, 0, len(variantStrings)-1)
    for _, s := range variantStrings[1:] {
        result = append(result, s)
    }
    return result
}

func (v Variant) MarshalJSON() ([]byte, error) {
    return json.Marshal(v.String())
}

func (v *Variant) UnmarshalJSON(data []byte) error {
    var s string
    if err := json.Unmarshal(data, &s); err != nil {
        return err
    }
    parsed, err := Parse(s)
    if err != nil {
        return err
    }
    *v = parsed
    return nil
}

// Domain-specific methods

// IsLocal returns true if provider runs locally
func (v Variant) IsLocal() bool {
    return v == Whisper
}

// RequiresApiKey returns true if provider needs an API key
func (v Variant) RequiresApiKey() bool {
    switch v {
    case OpenAi, ElevenLabs:
        return true
    default:
        return false
    }
}

// SupportsStreaming returns true if provider supports real-time streaming
func (v Variant) SupportsStreaming() bool {
    switch v {
    case Whisper, OpenAi:
        return true
    default:
        return false
    }
}

// SupportsDiarization returns true if provider supports speaker diarization
func (v Variant) SupportsDiarization() bool {
    return v == ElevenLabs
}

// DefaultTimeout returns the default timeout in seconds
func (v Variant) DefaultTimeout() int {
    switch v {
    case Whisper:
        return 60
    case OpenAi:
        return 30
    case ElevenLabs:
        return 45
    default:
        return 30
    }
}
```

---

## Cross-References

| Resource | Location |
|----------|----------|
| Enum Specification | `spec/17-enum-specification/` |
| Architecture | `spec/26-ai-transcribe-cli/01-backend/01-architecture.md` |
| STT Providers | `spec/26-ai-transcribe-cli/01-backend/03-stt-providers.md` |
| TTS Providers | `spec/26-ai-transcribe-cli/01-backend/04-tts-providers.md` |
| Database Schema | `spec/26-ai-transcribe-cli/01-backend/08-database-schema.md` |
| Configuration | `spec/26-ai-transcribe-cli/01-backend/11-configuration.md` |

---

*AI Transcribe CLI enum compliance audit completed. Score: 5/50 (Non-Compliant)*
