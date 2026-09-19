# AI Bridge - Voice Integration REFERENCE

**Status:** Delegated  
**Updated:** 2026-03-09  
**Version:** 1.0.0  

---

## Notice

Voice-related AI features (STT, TTS, real-time voice conversation) are **delegated** to the standalone AI Transcribe CLI.

## Delegation Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         AI Bridge CLI                            │
│                        (Port 5040)                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Voice Endpoints (Proxy Layer)                                  │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  POST /api/v1/voice/transcribe  ──────────────────────┐   │ │
│  │  POST /api/v1/voice/synthesize  ───────────────────┐  │   │ │
│  │  WS   /ws/voice/stream          ────────────────┐  │  │   │ │
│  └─────────────────────────────────────────────────│──│──│───┘ │
│                                                    │  │  │     │
└────────────────────────────────────────────────────│──│──│─────┘
                                                     │  │  │
                         HTTP/WebSocket Proxy        │  │  │
                                                     ▼  ▼  ▼
┌─────────────────────────────────────────────────────────────────┐
│                      AI Transcribe CLI                           │
│                    (Port 8030-8032)                              │
├─────────────────────────────────────────────────────────────────┤
│  POST /api/v1/stt/transcribe                                    │
│  POST /api/v1/tts/synthesize                                    │
│  WS   /ws/transcribe                                            │
│  WS   /ws/conversation                                          │
└─────────────────────────────────────────────────────────────────┘
```

---

## Full Specification

See: **[02-spec/31-ai-transcribe-cli/](../../../26-ai-transcribe-cli/00-overview.md)**

### Key Documents

| Topic | Location |
|-------|----------|
| Overview | [26-ai-transcribe-cli/00-overview.md](../../../26-ai-transcribe-cli/00-overview.md) |
| Backend Architecture | [01-backend/01-architecture.md](../../../26-ai-transcribe-cli/01-backend/01-architecture.md) |
| STT Providers | [01-backend/03-stt-providers.md](../../../26-ai-transcribe-cli/01-backend/03-stt-providers.md) |
| TTS Providers | [01-backend/04-tts-providers.md](../../../26-ai-transcribe-cli/01-backend/04-tts-providers.md) |
| API Interface | [01-backend/09-api-interface.md](../../../26-ai-transcribe-cli/01-backend/09-api-interface.md) |
| OpenAPI Spec | [01-backend/12-openapi-spec.md](../../../26-ai-transcribe-cli/01-backend/12-openapi-spec.md) |

---

## AI Bridge Delegation Config

```yaml
# AI Bridge config.yaml
toolDelegations:
  voice:
    target: ai-transcribe-cli
    endpoint: http://localhost:8030
    timeout: 30s
    healthCheck: /health
    fallback:
      enabled: false
    retries:
      maxAttempts: 3
      backoffMs: 1000
```

---

## See Also

- [AI Bridge Tool Delegation](../32-tool-delegation.md)
- [Model Management (voice category)](../07-model-management.md)
