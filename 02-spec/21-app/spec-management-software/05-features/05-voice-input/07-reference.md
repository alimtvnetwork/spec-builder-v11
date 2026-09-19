# Voice Input - REFERENCE

**Status:** Moved  
**Updated:** 2026-03-09  
**Version:** 1.0.0  

---

## Notice

The voice-related functionality (STT/TTS/real-time voice processing) has been **extracted** to a standalone CLI tool.

## New Location

All voice specifications are now located at:

**[02-spec/31-ai-transcribe-cli/](../../../26-ai-transcribe-cli/00-overview.md)**

### Quick Links

| Topic | New Location |
|-------|--------------|
| Architecture | [01-backend/01-architecture.md](../../../26-ai-transcribe-cli/01-backend/01-architecture.md) |
| Audio Pipeline | [01-backend/02-audio-pipeline.md](../../../26-ai-transcribe-cli/01-backend/02-audio-pipeline.md) |
| STT Providers | [01-backend/03-stt-providers.md](../../../26-ai-transcribe-cli/01-backend/03-stt-providers.md) |
| TTS Providers | [01-backend/04-tts-providers.md](../../../26-ai-transcribe-cli/01-backend/04-tts-providers.md) |
| Real-time Conversation | [01-backend/05-realtime-conversation.md](../../../26-ai-transcribe-cli/01-backend/05-realtime-conversation.md) |
| Voice Commands | [01-backend/06-voice-commands.md](../../../26-ai-transcribe-cli/01-backend/06-voice-commands.md) |
| Voice Cloning | [01-backend/07-voice-cloning.md](../../../26-ai-transcribe-cli/01-backend/07-voice-cloning.md) |
| Database Schema | [01-backend/08-database-schema.md](../../../26-ai-transcribe-cli/01-backend/08-database-schema.md) |
| API Interface | [01-backend/09-api-interface.md](../../../26-ai-transcribe-cli/01-backend/09-api-interface.md) |
| Error Codes | [01-backend/10-error-codes.md](../../../26-ai-transcribe-cli/01-backend/10-error-codes.md) |
| Testing UI | [02-frontend/01-testing-ui.md](../../../26-ai-transcribe-cli/02-frontend/01-testing-ui.md) |

---

## Why Extracted?

1. **Separation of Concerns**: Voice processing has distinct dependencies (audio libraries, ML models) from text-based AI
2. **Independent Scaling**: STT/TTS workloads scale differently than LLM inference
3. **Deployment Flexibility**: Can run on dedicated hardware with GPU/NPU for voice
4. **Reduced Complexity**: AI Bridge remains focused on text-based AI coordination

---

## Integration with AI Bridge

AI Bridge delegates voice requests to AI Transcribe CLI via HTTP proxy:

```yaml
# AI Bridge config.yaml
toolDelegations:
  voice:
    target: ai-transcribe-cli
    endpoint: http://localhost:8030
    timeout: 30s
    healthCheck: /health
```

### Backward Compatibility

The following AI Bridge endpoints are **preserved** but **proxied** to AI Transcribe:

- `POST /api/v1/voice/transcribe` → AI Transcribe `/api/v1/stt/transcribe`
- `POST /api/v1/voice/synthesize` → AI Transcribe `/api/v1/tts/synthesize`
- `WS /ws/voice/stream` → AI Transcribe `WS /ws/transcribe`

---

## Files in This Folder

The following files are **legacy references** and should not be edited:

| File | Status |
|------|--------|
| 00-overview.md | Legacy (see this REFERENCE) |
| 01-voice-recorder.md | Moved to AI Transcribe Testing UI |
| 02-transcription-display.md | Moved to AI Transcribe Testing UI |
| 03-audio-player.md | Moved to AI Transcribe Testing UI |
| 04-voice-processing-pipeline.md | Moved to AI Transcribe Backend |
| 06-voice-session-manager.md | Moved to AI Transcribe Backend |

---

## See Also

- [AI Transcribe CLI Overview](../../../26-ai-transcribe-cli/00-overview.md)
- [AI Bridge Tool Delegation](../../../27-ai-bridge-cli/01-backend/32-tool-delegation.md)
