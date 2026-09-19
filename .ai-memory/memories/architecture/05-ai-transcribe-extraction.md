# Memory: architecture/ai-transcribe-extraction

**Updated:** 2026-02-03  
**Version:** 1.0.0  
**Status:** Active  
**Spec Location:** `02-spec/26-ai-transcribe-cli/00-overview.md`

---

## Overview

AI Transcribe CLI is a standalone microservice extracted from AI Bridge CLI for voice transcription (STT), text-to-speech (TTS), and real-time voice conversation.

---

## Extraction Rationale

Voice capabilities were extracted to:
1. **Separation of Concerns**: Voice processing has distinct dependencies (Whisper, XTTS, PortAudio)
2. **Independent Deployment**: Can run on dedicated hardware with GPU for voice processing
3. **Reduced Complexity**: AI Bridge focuses on text-based LLM routing

---

## Folder Structure

```
02-spec/26-ai-transcribe-cli/
├── 00-overview.md
├── 01-backend/
├── 02-frontend/
├── 03-deploy/
└── 99-consistency-report.md
```

---

## Integration with AI Bridge

AI Bridge delegates voice/tts requests via tool delegation:

```yaml
toolDelegations:
  voice:
    target: ai-transcribe-cli
    endpoint: http://localhost:8030
    timeout: 30s
```

The `/voice/transcribe` and `/voice/synthesize` endpoints in AI Bridge proxy to AI Transcribe CLI.

---

## Core Capabilities

| Feature | Backend |
|---------|---------|
| Speech-to-Text | Whisper (local), OpenAI Realtime, ElevenLabs Scribe |
| Text-to-Speech | XTTS (local), ElevenLabs, Azure TTS |
| Real-time Conversation | WebSocket streaming |
| Voice Commands | Local LLM + pattern matching |
| Voice Cloning | ElevenLabs, XTTS |

---

## Default Ports

| Port | Service |
|------|---------|
| 8030 | HTTP API |
| 8031 | WebSocket |
| 8032 | Prometheus |

---

## Error Code Range

AI Transcribe CLI uses **13000-13499**:
- 13000-13099: General/startup
- 13100-13199: Audio pipeline
- 13200-13299: STT providers
- 13300-13399: TTS providers
- 13400-13499: Voice commands

---

## Related Files

- Main Spec: `02-spec/26-ai-transcribe-cli/00-overview.md`
- AI Bridge Delegation: `02-spec/22-ai-bridge-cli/01-backend/07-model-management.md`
- Original Voice Spec: `02-spec/11-spec-management-software/14-microservices/10-voice-cli.md` (deprecated)
