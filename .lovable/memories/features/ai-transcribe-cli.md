# Memory: features/ai-transcribe-cli

**Updated:** 2026-02-03
**Version:** 1.0.0  

---

## Summary

AI Transcribe (CLI #15) is a standalone Go service dedicated to speech-to-text (STT), text-to-speech (TTS), and real-time voice processing. It occupies port range 8030-8032 and follows the standard project folder structure (backend, frontend, deploy). AI Bridge delegates voice tasks to this CLI via standardized HTTP/WebSocket proxies.

---

## Key Details

- **Port Range:** 8030 (HTTP), 8031 (WebSocket), 8032 (gRPC)
- **Error Code Range:** 14000-14499
- **Folder Structure:** `spec/26-ai-transcribe-cli/{00-overview, 01-backend, 02-frontend, 03-deploy}`

---

## Provider Support

### STT Providers
- Whisper (local, default)
- OpenAI Whisper API
- ElevenLabs Scribe

### TTS Providers
- XTTS (local, default)
- ElevenLabs
- Azure Speech

---

## AI Bridge Integration

Voice endpoints in AI Bridge are proxied to AI Transcribe:

```yaml
toolDelegations:
  voice:
    target: ai-transcribe-cli
    endpoint: http://localhost:8030
```

Route mapping:
- `/api/v1/voice/transcribe` → `/api/v1/stt/transcribe`
- `/api/v1/voice/synthesize` → `/api/v1/tts/synthesize`
- `/ws/voice/stream` → `/ws/transcribe`

---

## Related Specs

- Overview: `spec/26-ai-transcribe-cli/00-overview.md`
- Tool Delegation: `spec/22-ai-bridge-cli/01-backend/32-tool-delegation.md`
