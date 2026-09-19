# AI Bridge CLI Reference


**Last Updated:** 2026-03-20  

> **External Spec:** `02-spec/27-ai-bridge-cli/`  
> **Version:** 3.0.0  
> **Error Range:** 9000-9999

---

## Summary

External AI adapter providing a unified interface for LLM communication, supporting multiple input formats, dual execution modes, and comprehensive model management with category-based selection for different AI tasks.

---

## Full Specification

📁 **Location:** [`02-spec/27-ai-bridge-cli/`](../../27-ai-bridge-cli/00-overview.md)

---

## Key Components

### Backend (`01-backend/`)

| File | Description |
|------|-------------|
| `01-architecture.md` | Core system design, adapters |
| `02-input-formats.md` | Markdown, JSON, YAML, CSV handlers |
| `03-startup-modes.md` | Binary vs daemon execution |
| `04-api-interface.md` | REST + WebSocket API (38 endpoints) |
| `05-error-codes.md` | Error code registry (9xxx) |
| `06-configuration.md` | Config schema and defaults |
| `07-model-management.md` | Category-based model selection |
| `08-split-db-integration.md` | Chat, RAG, file history persistence |

### Frontend (`02-frontend/`)

| File | Description |
|------|-------------|
| `01-architecture.md` | React UI for CLI management |

### Deploy (`03-deploy/`)

| File | Description |
|------|-------------|
| `01-powershell.md` | PowerShell integration |

---

## Model Categories

| Category | Purpose | Default Model |
|----------|---------|---------------|
| thinking | Reasoning, planning | qwen2.5-coder:32b |
| writing | Content generation | llama3.1:8b |
| coding | Code generation | deepseek-coder:6.7b |
| voice | Speech-to-text | whisper:large-v3 |
| tts | Text-to-speech | xtts-v2 |
| image-gen | Image generation | stable-diffusion-xl |
| image-understand | Image analysis | llava:13b |
| video | Video generation | stable-video-diffusion |
| agentic | Long-chain commands | qwen2.5-coder:32b |

---

## Integration Points

### Binary Mode

```bash
# Single prompt execution
aibridge-cli run prompt.md

# With output format
aibridge-cli run data.json --output response.json
```

### Daemon Mode

```bash
# Start daemon
aibridge-cli daemon start --port 8089

# Query via REST
curl -X POST http://localhost:8089/api/v1/generate \
  -H "Content-Type: application/json" \
  -d '{"category": "coding", "userPrompt": "Write a sort function"}'
```

---

## Input Formats

| Format | Extension | Use Case |
|--------|-----------|----------|
| Markdown | `.md` | Prompt templates with YAML frontmatter |
| JSON | `.json` | Structured requests, batch processing |
| YAML | `.yaml` | Complex prompts, multi-document |
| CSV | `.csv` | Bulk data, keyword lists |

---

## LLM Backends

| Backend | Adapter | Default Port |
|---------|---------|--------------|
| Ollama | OllamaAdapter | 11434 |
| llama.cpp | LlamaCppAdapter | 8080 |
| llama-swap | LlamaSwapAdapter | 8081 |
| OpenAI-compatible | OpenAIAdapter | N/A |
| Whisper | WhisperAdapter | 9000 |
| XTTS | XTTSAdapter | 8020 |
| SD-API | SDAPIAdapter | 7860 |
| SVD-API | SVDAPIAdapter | 7861 |

---

## Split DB Integration

| Type | Path Pattern |
|------|--------------|
| Chat sessions | `{app}/ai/chat/{seq}-{id}.db` |
| RAG documents | `{app}/rag/documents/{seq}-{id}.db` |
| File history | `{app}/files/history/{seq}-{slug}.db` |

---

## Error Codes

| Range | Category |
|-------|----------|
| 9000-9099 | General/Startup |
| 9100-9199 | Input parsing |
| 9200-9299 | Backend connection |
| 9300-9399 | Request processing |
| 9400-9499 | Response handling |
| 9500-9599 | Model management |
| 9600-9699 | Split DB |
| 9700-9799 | RAG/embedding |
| 9800-9899 | Voice/image/video |

See: [`02-spec/27-ai-bridge-cli/01-backend/05-error-codes.md`](../../27-ai-bridge-cli/01-backend/05-error-codes.md)

---

*Reference for spec-management-software integration*
