# Memory: ai-integration/model-management

**Updated:** 2026-02-01  
**Version:** 1.0.0  
**Status:** Active  
**Spec Location:** `02-spec/22-ai-bridge-cli/01-backend/07-model-management.md`

---

## Overview

AI Bridge CLI provides comprehensive model management with **category-based selection** for different AI tasks, supporting multiple backends with runtime switching.

---

## Model Categories

| Category | Purpose | Default |
|----------|---------|---------|
| thinking | Reasoning, planning | qwen2.5-coder:32b |
| writing | Content generation | llama3.1:8b |
| coding | Code generation | deepseek-coder:6.7b |
| voice | Speech-to-text | whisper:large-v3 |
| tts | Text-to-speech | xtts-v2 |
| image-gen | Image generation | stable-diffusion-xl |
| image-understand | Image analysis | llava:13b |
| video | Video generation | stable-video-diffusion |
| agentic | Long-chain commands | qwen2.5-coder:32b |
| custom | User-defined | Configurable |

---

## Backends

| Backend | Type | Features | Default Port |
|---------|------|----------|--------------|
| Ollama | LLM | Dynamic loading, GPU | 11434 |
| llama.cpp | LLM | High performance, GGUF | 8080 |
| llama-swap | Proxy | Model swapping | 8081 |
| Whisper | STT | Audio transcription | 9000 |
| XTTS | TTS | Voice synthesis | 8020 |
| SD-API | Image | Image generation | 7860 |
| SVD-API | Video | Video generation | 7861 |

All support runtime switching without restart.

---

## Resolution Hierarchy

```
Request Override → Project → User → System Default
```

---

## File Authorization

AI models have explicit authorization to:
- Access, read, write, rewrite files
- Integrate with Split DB history/snapshot tracking
- Complete audit trail of all changes

---

## API Endpoints

- `GET /api/v1/models` - List all models
- `GET /api/v1/models/{category}` - Get models for category
- `POST /api/v1/models/{category}` - Set active model
- `POST /api/v1/models/custom` - Create custom category
- `GET /api/v1/backends` - List backends
- `POST /api/v1/backends/{key}/start` - Start backend
