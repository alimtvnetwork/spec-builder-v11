# Voice Input Feature Overview

> **Version:** 3.1.0  
> **Status:** Complete  
> **Last Updated:** 2026-03-30    
**AI Confidence:** High  
**Ambiguity:** None
> **Spec Count:** 4 components

---


## Keywords

`voice`, `input`, `feature`, `overview`, `management`, `software`

---

## Scoring

| Criterion | Status |
|-----------|--------|
| `00-overview.md` present | ✅ |
| AI Confidence assigned | ✅ |
| Ambiguity assigned | ✅ |
| Keywords present | ✅ |
| Scoring table present | ✅ |


## 1. Overview

Voice recording and transcription system for capturing ideas and instructions via speech input. Integrates with the Voice-CLI microservice for real-time transcription using Local Whisper (large-v3) and grammar-based intent recognition.

**Cross-References:**
- [Voice-CLI OpenAPI](../../14-microservices/16-voice-cli-openapi.md) — Backend service specification
- [AI Integration](../06-ai-integration/00-overview.md) — Voice-to-spec pipeline
- [Instruction Builder](../../02-instructions/02-instructions-reference.md) — Instruction generation
- [Memory: Voice Transcription](../../../../.lovable/memories/features/ai-transcribe-cli.md)

---

## 2. Component Index

| # | Component | Version | Status | Description |
|---|-----------|---------|--------|-------------|
| 01 | [Voice Recorder](./01-voice-recorder.md) | 2.0.0 | Draft | Audio capture with waveform visualization, VAD, WebSocket streaming |
| 02 | [Transcription Display](./02-transcription-display.md) | 2.0.0 | Draft | Real-time/final transcript rendering, word-level timestamps, inline editing |
| 03 | [Audio Player](./03-audio-player.md) | 2.0.0 | Draft | Playback controls, waveform timeline, A/B looping, transcript sync |
| 04 | [Voice Session Manager](./06-voice-session-manager.md) | 1.0.0 | Draft | Orchestration layer, session lifecycle, persistence, intent execution |

---

## 3. Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          VoiceSessionManager                                 │
│  ┌───────────────────┐  ┌───────────────────┐  ┌───────────────────────────┐│
│  │   VoiceRecorder   │  │   AudioPlayer     │  │  TranscriptionDisplay     ││
│  │  ┌─────────────┐  │  │  ┌─────────────┐  │  │  ┌─────────────────────┐  ││
│  │  │ Waveform    │  │  │  │ Timeline    │  │  │  │ SegmentList         │  ││
│  │  │ Visualizer  │  │  │  │ Scrubber    │  │  │  │ + Word Highlighting │  ││
│  │  └─────────────┘  │  │  └─────────────┘  │  │  └─────────────────────┘  ││
│  │  ┌─────────────┐  │  │  ┌─────────────┐  │  │  ┌─────────────────────┐  ││
│  │  │ Recorder    │  │  │  │ Playback    │  │  │  │ IntentPreview       │  ││
│  │  │ Controls    │  │  │  │ Controls    │  │  │  │ + Inline Editing    │  ││
│  │  └─────────────┘  │  │  └─────────────┘  │  │  └─────────────────────┘  ││
│  └───────────────────┘  └───────────────────┘  └───────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────┘
                                     │
                              WebSocket/REST
                                     │
                                     ▼
                    ┌────────────────────────────────┐
                    │       Voice-CLI Service        │
                    │         (Port 8084)            │
                    │  ┌──────────┐  ┌────────────┐  │
                    │  │ Whisper  │  │  Intent    │  │
                    │  │ large-v3 │  │  Engine    │  │
                    │  └──────────┘  └────────────┘  │
                    └────────────────────────────────┘
```

---

## 4. Feature Matrix

| Feature | Recorder | Player | Transcript | Manager |
|---------|:--------:|:------:|:----------:|:-------:|
| Audio Capture | ✓ | | | |
| Waveform Visualization | ✓ | ✓ | | |
| VAD (Voice Activity Detection) | ✓ | | | |
| Real-time Streaming | ✓ | | | ✓ |
| Playback Controls | | ✓ | | |
| A/B Loop | | ✓ | | |
| Timestamp Sync | | ✓ | ✓ | ✓ |
| Word Highlighting | | | ✓ | |
| Inline Editing | | | ✓ | |
| Speaker Diarization | | | ✓ | |
| Intent Recognition | | | ✓ | ✓ |
| Session Lifecycle | | | | ✓ |
| IndexedDB Persistence | | | | ✓ |
| Session Recovery | | | | ✓ |
| Export (SRT/VTT/JSON) | | | ✓ | ✓ |

---

## 5. Data Flow

### 5.1 Recording Phase

```
User speaks → MediaRecorder → useAudioCapture → encodeAudioForApi (PCM16)
                                    │
                                    ▼
                           useVoiceWebSocket
                                    │
                    ┌───────────────┴───────────────┐
                    │                               │
                    ▼                               ▼
              IndexedDB                      Voice-CLI
           (resilient cache)              (transcription)
                                                │
                                    ┌───────────┴───────────┐
                                    │                       │
                                    ▼                       ▼
                            partial transcript      intent recognition
                                    │                       │
                                    └───────────┬───────────┘
                                                │
                                                ▼
                                    TranscriptionDisplay
```

### 5.2 Review Phase

```
Saved audio blob ──► useAudioPlayback ──► PlaybackState
                            │
                            ▼
                     useTimestampSync ◄──────────────────┐
                            │                            │
                            ▼                            │
                 currentWordId/segmentId                 │
                            │                            │
                            ▼                            │
                 TranscriptionDisplay ───── onWordClick ─┘
```

---

## 6. Session Lifecycle

| Phase | Components Active | Description |
|-------|-------------------|-------------|
| Idle | — | No session, start button shown |
| Connecting | Manager | Establishing WebSocket to Voice-CLI |
| Recording | Recorder, Transcript (live) | Audio capture + real-time transcription |
| Paused | Recorder (paused), Transcript | Recording paused, can resume |
| Processing | Transcript (finalizing) | Waiting for final transcription |
| Reviewing | Player, Transcript (editable) | Playback with sync, editing allowed |
| Complete | — | Session saved or discarded |

---

## 7. Technical Requirements

| Requirement | Specification |
|-------------|---------------|
| Audio Format | PCM16, 24kHz, mono |
| WebSocket Protocol | Bidirectional streaming (see [Voice-CLI OpenAPI](../../14-microservices/16-voice-cli-openapi.md)) |
| Whisper Model | large-v3 (configurable) |
| VAD | Server-side with client fallback |
| Persistence | IndexedDB for resilient recording |
| Browser Support | Chrome 90+, Firefox 88+, Safari 15+ |

---

## 8. Keyboard Shortcuts

| Context | Key | Action |
|---------|-----|--------|
| Recording | `R` | Start/stop recording |
| Recording | `P` | Pause/resume |
| Recording | `Escape` | Discard session |
| Playback | `Space` | Play/pause |
| Playback | `←/→` | Seek ±5s |
| Playback | `[/]` | Speed down/up |
| Playback | `L` | Toggle loop |
| Transcript | `E` | Edit selected segment |
| Transcript | `Ctrl+S` | Save session |

---

## 9. Error Code Range

Voice input components use error codes in the **11xxx** range (shared with Voice-CLI service):

| Range | Category |
|-------|----------|
| 11000-11099 | Permission errors |
| 11100-11199 | Connection errors |
| 11200-11299 | Recording errors |
| 11300-11399 | Transcription errors |
| 11400-11499 | Storage errors |
| 11500-11599 | Intent execution errors |

---

## 10. Related Specifications

### Internal
- [Spec Editor](../04-spec-editor/00-overview.md)
- [AI Integration](../06-ai-integration/00-overview.md)
- [Knowledge Memory](../09-knowledge-memory/00-overview.md)

### Microservices
- [Voice-CLI OpenAPI](../../14-microservices/16-voice-cli-openapi.md)
- [Microservices Overview](../../14-microservices/00-overview.md)

### Memories
- [Voice Transcription](../../../../.lovable/memories/features/ai-transcribe-cli.md)
- [Voice-CLI Service](../../../../.lovable/memories/features/ai-transcribe-backend.md)

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 2.0.0 | 2026-01-30 | Added Voice Session Manager (04), expanded architecture, feature matrix, data flow diagrams |
| 1.0.0 | 2026-01-28 | Initial overview with 3 components |
