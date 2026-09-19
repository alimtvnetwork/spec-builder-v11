# AI Bridge CLI: Model Management

**Version:** 5.0.0  
**Status:** Complete  
**Updated:** 2026-03-09  

---

## Overview

AI Bridge CLI provides comprehensive model management with **category-based selection**, allowing different AI models to be assigned to different task types. Configuration flows from **Seedable Config** to SQLite DB on first load, then all runtime management happens via API or UI.

---

## Model Categories

### Built-in Categories

| Category | Purpose | Default Backend | Typical Models |
|----------|---------|-----------------|----------------|
| `thinking` | Reasoning, planning, complex analysis | Ollama | qwen2.5:32b, llama3.1:70b |
| `writing` | Content generation, text completion | Ollama | llama3.1:8b, mistral:7b |
| `coding` | Code generation, refactoring, debugging | Ollama | deepseek-coder:6.7b, codellama:34b |
| `voice` | **DELEGATED** to AI Transcribe CLI | ai-transcribe | See [AI Transcribe CLI](../../26-ai-transcribe-cli/00-overview.md) |
| `tts` | **DELEGATED** to AI Transcribe CLI | ai-transcribe | See [AI Transcribe CLI](../../26-ai-transcribe-cli/00-overview.md) |
| `image-gen` | Image generation from text | SD-API | stable-diffusion-xl, sdxl-turbo |
| `image-understand` | Image analysis and understanding | Ollama | llava:13b, bakllava:7b |
| `video` | Video generation | SVD-API | stable-video-diffusion |
| `agentic` | Long-chain commands, tool use | Ollama | qwen2.5-coder:32b, claude-3 |

> **Note:** Voice (STT) and TTS capabilities have been extracted to the standalone [AI Transcribe CLI](../../26-ai-transcribe-cli/00-overview.md). AI Bridge delegates these requests via tool delegation.

### Custom Categories

Users can create new categories via API or UI:

```json
{
  "category": "legal",
  "displayName": "Legal Documents",
  "description": "Legal text generation and analysis",
  "defaultModel": "llama3.1:70b",
  "defaultBackend": "ollama",
  "parameters": {
    "temperature": 0.3,
    "maxTokens": 8192
  }
}
```

---

## Backend Configuration

### Supported Backends

| Backend | Type | Config Key | Default Port |
|---------|------|------------|--------------|
| **Ollama** | Local LLM | `ollama` | 11434 |
| **llama.cpp** | Local LLM | `llama-cpp` | 8080 |
| **llama-swap** | Model proxy | `llama-swap` | 8081 |
| **OpenAI** | Remote API | `openai` | N/A |
| **Whisper** | STT | `whisper` | 9000 |
| **XTTS** | TTS | `xtts` | 8020 |
| **SD-API** | Image Gen | `sd-api` | 7860 |
| **SVD-API** | Video Gen | `svd-api` | 7861 |

### Backend Switching

```go
// Switch backend for a category at runtime
type BackendSwitch struct {
    Category   string
    NewBackend string
    NewModel   string `json:",omitempty"`
}

// Example: Switch coding to llama.cpp
{
    "category": "coding",
    "newBackend": "llama-cpp",
    "newModel": "deepseek-coder-6.7b-instruct.Q5_K_M.gguf"
}
```

---

## Configuration Flow

### 1. Seedable Config (Initial Load)

```json
{
  "$schema": "./config.schema.json",
  "version": "2.0.0",
  "categories": {
    "models": {
      "displayName": "Model Management",
      "settings": {
        "categoryModels": {
          "type": "object",
          "label": "Category Model Assignments",
          "default": {
            "thinking": { "backend": "ollama", "model": "qwen2.5-coder:32b" },
            "writing": { "backend": "ollama", "model": "llama3.1:8b" },
            "coding": { "backend": "ollama", "model": "deepseek-coder:6.7b" },
            "voice": { "backend": "whisper", "model": "whisper:large-v3" },
            "tts": { "backend": "xtts", "model": "xtts-v2" },
            "image-gen": { "backend": "sd-api", "model": "stable-diffusion-xl" },
            "image-understand": { "backend": "ollama", "model": "llava:13b" },
            "video": { "backend": "svd-api", "model": "stable-video-diffusion" },
            "agentic": { "backend": "ollama", "model": "qwen2.5-coder:32b" }
          }
        },
        "customCategories": {
          "type": "array",
          "label": "Custom Model Categories",
          "default": []
        }
      }
    },
    "backends": {
      "displayName": "Backend Configuration",
      "settings": {
        "ollama": {
          "type": "object",
          "label": "Ollama",
          "default": {
            "enabled": true,
            "baseUrl": "http://localhost:11434",
            "timeout": "5m"
          }
        },
        "llamaCpp": {
          "type": "object",
          "label": "llama.cpp",
          "default": {
            "enabled": false,
            "baseUrl": "http://localhost:8080",
            "serverPath": ""
          }
        },
        "whisper": {
          "type": "object",
          "label": "Whisper (STT)",
          "default": {
            "enabled": true,
            "baseUrl": "http://localhost:9000"
          }
        },
        "xtts": {
          "type": "object",
          "label": "XTTS (TTS)",
          "default": {
            "enabled": true,
            "baseUrl": "http://localhost:8020"
          }
        },
        "sdApi": {
          "type": "object",
          "label": "Stable Diffusion API",
          "default": {
            "enabled": false,
            "baseUrl": "http://localhost:7860"
          }
        },
        "svdApi": {
          "type": "object",
          "label": "Stable Video Diffusion API",
          "default": {
            "enabled": false,
            "baseUrl": "http://localhost:7861"
          }
        }
      }
    },
    "powershell": {
      "displayName": "PowerShell Commands",
      "settings": {
        "ollamaStart": {
          "type": "string",
          "label": "Ollama Start Command",
          "default": "ollama serve"
        },
        "llamaCppStart": {
          "type": "string",
          "label": "llama.cpp Start Command",
          "default": "./llama-server -m model.gguf -c 4096 -ngl 99"
        },
        "whisperStart": {
          "type": "string",
          "label": "Whisper Start Command",
          "default": "whisper-server --model large-v3"
        },
        "sdStart": {
          "type": "string",
          "label": "SD API Start Command",
          "default": "python webui.py --api --listen"
        }
      }
    }
  }
}
```

### 2. SQLite Storage (After First Load)

```sql
-- Table: ModelCategories
CREATE TABLE ModelCategories (
    Id TEXT PRIMARY KEY,
    CategoryKey TEXT UNIQUE NOT NULL,
    DisplayName TEXT NOT NULL,
    Description TEXT,
    DefaultBackend TEXT NOT NULL,
    DefaultModel TEXT NOT NULL,
    Parameters TEXT,                    -- JSON
    IsBuiltIn INTEGER DEFAULT 0,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Table: CategoryAssignments
CREATE TABLE CategoryAssignments (
    Id TEXT PRIMARY KEY,
    CategoryId TEXT NOT NULL,
    Backend TEXT NOT NULL,
    Model TEXT NOT NULL,
    Parameters TEXT,                    -- JSON override
    IsActive INTEGER DEFAULT 1,
    AssignedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (CategoryId) REFERENCES ModelCategories(Id)
);

-- Table: Backends
CREATE TABLE Backends (
    Id TEXT PRIMARY KEY,
    BackendKey TEXT UNIQUE NOT NULL,
    DisplayName TEXT NOT NULL,
    BaseUrl TEXT NOT NULL,
    Type TEXT NOT NULL,                 -- Llm, Stt, Tts, Image, Video
    Enabled INTEGER DEFAULT 1,
    HealthStatus TEXT DEFAULT 'Unknown',
    LastHealthCheck DATETIME,
    Config TEXT,                        -- JSON
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Table: PowershellCommands
CREATE TABLE PowershellCommands (
    Id TEXT PRIMARY KEY,
    CommandKey TEXT UNIQUE NOT NULL,
    DisplayName TEXT NOT NULL,
    Command TEXT NOT NULL,
    Parameters TEXT,                    -- JSON configurable params
    WorkingDir TEXT,
    Enabled INTEGER DEFAULT 1,
    LastRun DATETIME,
    LastStatus TEXT
);
```

---

## Model Resolution Hierarchy

When a request specifies a category, the model is resolved as follows:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      MODEL RESOLUTION HIERARCHY                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   Request: { category: "coding", ... }                                   │
│                                                                          │
│   1. Request Override                                                    │
│      └── { model: "specific-model" } in request payload                 │
│                                                                          │
│   2. Project Override (if project context)                               │
│      └── Project-specific category assignment                           │
│                                                                          │
│   3. User Preference                                                     │
│      └── User's saved category preferences                              │
│                                                                          │
│   4. System Default                                                      │
│      └── category_assignments table (is_active = true)                  │
│                                                                          │
│   5. Fallback                                                            │
│      └── model_categories.default_model                                 │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## API Endpoints

### Category Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/categories` | List all model categories |
| GET | `/api/v1/categories/:key` | Get category details |
| POST | `/api/v1/categories` | Create custom category |
| PUT | `/api/v1/categories/:key` | Update category |
| DELETE | `/api/v1/categories/:key` | Delete custom category |

### Model Assignment

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/categories/:key/model` | Get current model for category |
| PUT | `/api/v1/categories/:key/model` | Set model for category |
| POST | `/api/v1/categories/:key/switch` | Switch backend/model at runtime |

### Backend Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/backends` | List all backends |
| GET | `/api/v1/backends/:key` | Get backend details |
| PUT | `/api/v1/backends/:key` | Update backend config |
| POST | `/api/v1/backends/:key/health` | Check backend health |
| POST | `/api/v1/backends/:key/start` | Start backend (PowerShell) |
| POST | `/api/v1/backends/:key/stop` | Stop backend |

### PowerShell Commands

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/commands` | List PowerShell commands |
| GET | `/api/v1/commands/:key` | Get command details |
| PUT | `/api/v1/commands/:key` | Update command |
| POST | `/api/v1/commands/:key/run` | Execute command |

---

## WebSocket Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `ModelSwitched` | B→F | Model switched for category |
| `BackendStatus` | B→F | Backend health status change |
| `BackendStarted` | B→F | Backend process started |
| `BackendStopped` | B→F | Backend process stopped |
| `CommandOutput` | B→F | PowerShell command output stream |
| `CommandCompleted` | B→F | PowerShell command finished |

---

## Example Requests

### List Categories

```bash
curl http://localhost:8089/api/v1/categories
```

**Response:**
```json
{
  "categories": [
    {
      "key": "coding",
      "displayName": "Coding",
      "description": "Code generation, refactoring, debugging",
      "currentBackend": "ollama",
      "currentModel": "deepseek-coder:6.7b",
      "isBuiltin": true
    },
    {
      "key": "voice",
      "displayName": "Voice (STT)",
      "description": "Speech-to-text transcription",
      "currentBackend": "whisper",
      "currentModel": "whisper:large-v3",
      "isBuiltin": true
    }
  ]
}
```

### Switch Model

```bash
curl -X POST http://localhost:8089/api/v1/categories/coding/switch \
  -H "Content-Type: application/json" \
  -d '{
    "backend": "llama-cpp",
    "model": "deepseek-coder-6.7b-instruct.Q5_K_M.gguf"
  }'
```

### Create Custom Category

```bash
curl -X POST http://localhost:8089/api/v1/categories \
  -H "Content-Type: application/json" \
  -d '{
    "key": "medical",
    "displayName": "Medical",
    "description": "Medical text analysis and generation",
    "defaultBackend": "ollama",
    "defaultModel": "meditron:70b",
    "parameters": {
      "temperature": 0.2,
      "maxTokens": 4096
    }
  }'
```

---

## File Authorization

AI models have explicit authorization to:

| Permission | Description |
|------------|-------------|
| `file.read` | Read files for context/RAG |
| `file.write` | Write generated content |
| `file.modify` | Modify existing files |
| `history.track` | Track all changes in history |
| `snapshot.create` | Create file snapshots |

All file operations are logged with complete audit trail.

---

## See Also

- [Split DB Integration](./08-split-db-integration.md) — Chat and file history
- [API Interface](./04-api-interface.md) — Full API documentation
- [Seedable Config Architecture](../../06-seedable-config-architecture/00-overview.md) — Configuration system
