# AI Transcribe CLI: Backend Overview

**Version:** 2.1.0  
**Status:** Active  
**Updated:** 2026-03-30    
**AI Confidence:** High  
**Ambiguity:** None

---


## Keywords

`transcribe`, `cli`, `backend`

---

## Scoring

| Criterion | Status |
|-----------|--------|
| `00-overview.md` present | ✅ |
| AI Confidence assigned | ✅ |
| Ambiguity assigned | ✅ |
| Keywords present | ✅ |
| Scoring table present | ✅ |


## Overview

The AI Transcribe CLI backend provides Speech-to-Text (STT), Text-to-Speech (TTS), and real-time voice conversation capabilities via a Go-based microservice with HTTP and WebSocket interfaces. It operates on ports 8030-8032 and is delegated to by the AI Bridge CLI for all voice-related operations.

---

## Specification Index

| # | File | Description |
|---|------|-------------|
| 01 | [01-architecture.md](./01-architecture.md) | System design, component hierarchy, port allocation |
| 02 | [02-audio-pipeline.md](./02-audio-pipeline.md) | Capture, VAD, encoding, preprocessing |
| 03 | [03-stt-providers.md](./03-stt-providers.md) | Whisper, OpenAI Realtime, ElevenLabs Scribe |
| 04 | [04-tts-providers.md](./04-tts-providers.md) | XTTS, ElevenLabs, Azure TTS |
| 05 | [05-realtime-conversation.md](./05-realtime-conversation.md) | WebSocket streaming protocol |
| 06 | [06-voice-commands.md](./06-voice-commands.md) | Wake words, command grammar, execution |
| 07 | [07-voice-cloning.md](./07-voice-cloning.md) | Custom voice profile management |
| 08 | [08-database-schema.md](./08-database-schema.md) | SQLite schemas for transcripts and voices |
| 09 | [09-api-interface.md](./09-api-interface.md) | REST and WebSocket endpoint definitions |
| 10 | [10-error-codes.md](./10-error-codes.md) | 14000-14499 range allocation |
| 11 | [11-configuration.md](./11-configuration.md) | YAML config, environment variables, CLI flags |
| 12 | [12-openapi-spec.md](./12-openapi-spec.md) | OpenAPI 3.0 specification |
| 13 | [13-model-download.md](./13-model-download.md) | Whisper/XTTS model management and caching |

---

## Provider Priority

```
STT Priority:
1. Whisper (local) — Default, offline, privacy-first
2. OpenAI Realtime — Cloud fallback, low latency
3. ElevenLabs Scribe — Cloud fallback, high accuracy

TTS Priority:
1. XTTS (local) — Default, offline, voice cloning
2. ElevenLabs — Cloud fallback, high quality
3. Azure TTS — Cloud fallback, enterprise
```

---

## Port Allocation

| Port | Protocol | Purpose |
|------|----------|---------|
| 8030 | HTTP | REST API (transcribe, synthesize) |
| 8031 | WebSocket | Real-time streaming |
| 8032 | HTTP | Health check and metrics |

---

## Directory Structure

```
cmd/
├── ai-transcribe/
│   └── main.go                   # CLI entrypoint
internal/
├── api/
│   ├── http/
│   │   ├── server.go             # HTTP server
│   │   ├── handlers.go           # HTTP handlers
│   │   └── middleware.go         # Auth, logging
│   └── websocket/
│       ├── server.go             # WebSocket server
│       ├── session.go            # Session management
│       └── protocol.go           # Message types
├── audio/
│   ├── capture.go                # Microphone capture
│   ├── encoder.go                # PCM/WebM encoding
│   ├── player.go                 # Audio playback
│   └── vad.go                    # Voice Activity Detection
├── stt/
│   ├── engine.go                 # Transcription orchestrator
│   ├── whisper.go                # Local Whisper adapter
│   ├── openai.go                 # OpenAI Realtime adapter
│   ├── elevenlabs.go             # ElevenLabs Scribe adapter
│   └── providers.go              # Provider registry
├── tts/
│   ├── engine.go                 # Synthesis orchestrator
│   ├── xtts.go                   # Local XTTS adapter
│   ├── elevenlabs.go             # ElevenLabs adapter
│   ├── azure.go                  # Azure TTS adapter
│   └── providers.go              # Provider registry
├── models/
│   ├── downloader.go             # Model download manager
│   ├── cache.go                  # Model cache management
│   ├── whisper.go                # Whisper model variants
│   └── xtts.go                   # XTTS model variants
├── commands/
│   ├── parser.go                 # Voice command parser
│   ├── grammar.go                # Command grammar rules
│   └── executor.go               # Command execution
├── db/
│   ├── manager.go                # Database connection manager
│   ├── models.go                 # GORM models
│   └── migrations.go             # Schema migrations
└── config/
    └── config.go                 # Configuration management
```

---

## Cross-References

| Reference | Location |
|-----------|----------|
| Main CLI Overview | [../00-overview.md](../00-overview.md) |
| Frontend Overview | [../02-frontend/00-overview.md](../02-frontend/00-overview.md) |
| Deployment Overview | [../03-deploy/00-overview.md](../03-deploy/00-overview.md) |
| AI Bridge Delegation | [spec/22-ai-bridge-cli/01-backend/32-tool-delegation.md](../../22-ai-bridge-cli/01-backend/32-tool-delegation.md) |
| Error Code Registry | [spec/11-spec-management-software/06-error-management/error-code-registry.md](../../11-spec-management-software/06-error-management/01-error-code-registry.md) |
| Split DB Architecture | [spec/06-split-db-architecture/00-overview.md](../../06-split-db-architecture/00-overview.md) |

---

## Implementation Status

| Component | Status | Notes |
|-----------|--------|-------|
| Architecture | ✅ Specified | Complete design |
| Audio Pipeline | ✅ Specified | VAD, encoding |
| STT Providers | ✅ Specified | 3 providers |
| TTS Providers | ✅ Specified | 3 providers |
| Realtime | ✅ Specified | WebSocket protocol |
| Voice Commands | ✅ Specified | Grammar engine |
| Voice Cloning | ✅ Specified | Profile management |
| Database | ✅ Specified | GORM schemas |
| API Interface | ✅ Specified | REST + WS |
| Error Codes | ✅ Specified | 14000-14499 |
| Configuration | ✅ Specified | Full config system |
| OpenAPI | ✅ Specified | 3.0 spec |
| Model Download | ✅ Specified | Cache + download |
