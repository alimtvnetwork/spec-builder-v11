# AI Transcribe CLI

**Version:** 2.1.0  
**Status:** Draft  
**Updated:** 2026-03-30  
**AI Confidence:** High  
**Ambiguity:** Low

---

## Keywords

`ai-transcribe` · `golang` · `cli` · `voice` · `whisper` · `tts` · `speech-to-text` · `text-to-speech` · `real-time` · `microservice`

---

## Scoring

| Metric | Value |
|--------|-------|
| AI Confidence | High |
| Ambiguity | Low |
| Health Score | 100/100 (A+) |

---

## Overview

AI Transcribe CLI is a **standalone microservice** for voice transcription, text-to-speech synthesis, and real-time voice conversation. Extracted from AI Bridge CLI to maintain separation of concerns and enable independent deployment.

---

## Core Capabilities

| Feature | Description | Backend |
|---------|-------------|---------|
| **Speech-to-Text (STT)** | Transcribe audio to text | Whisper (local), OpenAI Realtime, ElevenLabs Scribe |
| **Text-to-Speech (TTS)** | Synthesize speech from text | XTTS (local), ElevenLabs, Azure TTS |
| **Real-time Conversation** | Live voice chat with AI | WebSocket streaming |
| **Voice Commands** | Grammar-based command recognition | Local LLM + pattern matching |
| **Voice Cloning** | Clone custom voices for TTS | ElevenLabs, XTTS |
| **Audio Processing** | VAD, noise reduction, encoding | Local processing |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      AI Transcribe CLI Service                           │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌────────────┐  ┌────────────┐  ┌──────────────────────────┐           │
│  │   CLI      │  │  HTTP API  │  │   WebSocket Server       │           │
│  │  (Cobra)   │  │  (Gin)     │  │   (gorilla/websocket)    │           │
│  └─────┬──────┘  └─────┬──────┘  └───────────┬──────────────┘           │
│        │               │                      │                          │
│        └───────────────┼──────────────────────┘                          │
│                        │                                                  │
│                 ┌──────▼───────┐                                         │
│                 │   Core       │                                         │
│                 │   Engine     │                                         │
│                 └──────┬───────┘                                         │
│                        │                                                  │
│        ┌───────────────┼───────────────┐                                 │
│        │               │               │                                  │
│  ┌─────▼─────┐  ┌──────▼──────┐  ┌─────▼─────┐                          │
│  │  Audio    │  │  Transcribe │  │   TTS     │                          │
│  │  Pipeline │  │  Engine     │  │   Engine  │                          │
│  └───────────┘  └──────┬──────┘  └───────────┘                          │
│                        │                                                  │
│        ┌───────────────┼───────────────┐                                 │
│        │               │               │                                  │
│  ┌─────▼─────┐  ┌──────▼──────┐  ┌─────▼─────┐                          │
│  │  Whisper  │  │  OpenAI     │  │ ElevenLabs│                          │
│  │  (Local)  │  │  Realtime   │  │  Scribe   │                          │
│  └───────────┘  └─────────────┘  └───────────┘                          │
│                                                                          │
├─────────────────────────────────────────────────────────────────────────┤
│                        Database Layer                                    │
│  ┌──────────────┐  ┌────────────────────────────────────────────────┐   │
│  │ transcribe.db│  │  {project}/voice/{conversation-id}.db          │   │
│  │   (Root)     │  │  (Transcripts, Entities, Commands)             │   │
│  └──────────────┘  └────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
                              │
            ┌─────────────────┼─────────────────┐
            │                 │                 │
     ┌──────▼──────┐   ┌──────▼──────┐   ┌──────▼──────┐
     │ AI Bridge   │   │ Spec Mgmt   │   │  External   │
     │ Integration │   │ Integration │   │  Clients    │
     └─────────────┘   └─────────────┘   └─────────────┘
```

---

## Folder Structure

```
02-spec/31-ai-transcribe-cli/
├── 00-overview.md                    # This file
├── 01-backend/
│   ├── 00-overview.md                # Backend overview
│   ├── 01-architecture.md            # System architecture
│   ├── 02-audio-pipeline.md          # Audio capture, VAD, encoding
│   ├── 03-stt-providers.md           # Speech-to-text backends
│   ├── 04-tts-providers.md           # Text-to-speech backends
│   ├── 05-realtime-conversation.md   # WebSocket streaming protocol
│   ├── 06-voice-commands.md          # Grammar-based command recognition
│   ├── 07-voice-cloning.md           # Custom voice management
│   ├── 08-database-schema.md         # SQLite schemas
│   ├── 09-api-interface.md           # REST/WebSocket endpoints
│   ├── 10-error-codes.md             # Error code registry (14000-14499)
│   ├── 11-configuration.md           # Seedable config
│   └── 12-openapi-spec.md            # OpenAPI 3.1 definition
├── 02-frontend/
│   ├── 00-overview.md                # Frontend overview
│   ├── 01-architecture.md            # React component architecture
│   ├── 02-audio-capture-ui.md        # Microphone capture components
│   ├── 03-transcription-ui.md        # Real-time transcription display
│   ├── 04-tts-playback-ui.md         # Audio playback components
│   ├── 05-voice-settings.md          # Provider/model configuration
│   ├── 06-testing-ui-page.md         # Standalone testing interface
│   └── 07-implementation-checklist.md
├── 03-deploy/
│   ├── 00-overview.md                # Deployment overview
│   ├── 01-docker-setup.md            # Container configuration
│   ├── 02-powershell-scripts.md      # Windows deployment scripts
│   └── 03-model-download.md          # Whisper model management
└── 99-consistency-report.md          # Cross-reference verification
```

---

## Deployment Modes

| Mode | Description | Use Case |
|------|-------------|----------|
| **Standalone** | Independent CLI/service | Portable transcription tool |
| **Embedded** | Library integration | Direct API calls from other services |
| **Server** | HTTP + WebSocket daemon | Multi-client transcription service |

---

## Integration with AI Bridge

AI Transcribe CLI integrates with AI Bridge via:

1. **Tool Delegation**: AI Bridge delegates voice requests to Transcribe CLI
2. **Shared Database**: Both CLIs can reference the same application databases
3. **WebSocket Proxy**: AI Bridge can proxy real-time voice to Transcribe CLI

```yaml
# AI Bridge config.yaml
toolDelegations:
  voice:
    target: ai-transcribe-cli
    endpoint: http://localhost:8030
    timeout: 30s
```

---

## Technology Stack

| Component | Technology | Rationale |
|-----------|------------|-----------|
| Language | Go 1.22+ | Performance, static binary |
| CLI Framework | Cobra | Standard Go CLI |
| HTTP Server | Gin | Fast, middleware support |
| WebSocket | gorilla/websocket | Production-ready |
| Database | SQLite + GORM | Portable, single-file |
| Audio Capture | PortAudio (via Go bindings) | Cross-platform |
| Local STT | whisper.cpp | Offline, privacy-first |
| Local TTS | XTTS/Coqui | Offline synthesis |
| Cloud STT | OpenAI Realtime, ElevenLabs Scribe | Low-latency streaming |
| Cloud TTS | ElevenLabs, Azure TTS | High-quality synthesis |

---

## Default Ports

| Service | Port | Description |
|---------|------|-------------|
| HTTP API | 8030 | REST endpoints |
| WebSocket | 8031 | Real-time streaming |
| Metrics | 8032 | Prometheus metrics |

---

## Error Code Range

AI Transcribe CLI uses error codes **14000-14499**:

| Range | Category |
|-------|----------|
| 14000-14049 | General/startup errors |
| 14050-14099 | Audio pipeline errors |
| 14100-14149 | STT provider errors |
| 14150-14199 | TTS provider errors |
| 14200-14249 | Voice command errors |

---

## See Also

- [Error Resolution](../03-error-manage/01-error-resolution/00-overview.md) — Debugging & verification patterns
- [AI Bridge CLI](../27-ai-bridge-cli/00-overview.md) — Parent service for LLM routing
- [Error Code Registry](../03-error-manage/03-error-code-registry/readme.md) — Central error code allocation
- [Shared CLI Frontend](../28-shared-cli-frontend/00-overview.md) — Common UI components
- **[DBOperation Wrapper](../21-app/spec-management-software/13-shared-packages/08-pkg-database-operations.md)** — Mandatory DB operation wrapper
- **[ORM-Only Policy](../../.ai-memory/memories/workflow/implementation-strategy.md)** — No raw SQL mandate
