# AI Bridge CLI: PowerShell Integration

**Version:** 3.0.0  
**Status:** Complete  
**Updated:** 2026-03-09  

---

## Overview

PowerShell integration for AI Bridge CLI enables automated startup, process management, and backend orchestration.

---

## powershell.json

```json
{
  "projectName": "ai-bridge-cli",
  "displayName": "AI Bridge CLI",
  "ports": [5040, 5041, 5042],
  "frontendPort": 5175,
  "runCommand": "go run main.go serve --port 5040",
  "commands": {
    "serve": "go run main.go serve",
    "build": "go build -o ai-bridge-cli.exe",
    "frontend": "cd frontend && bun run dev",
    "ollama": "ollama serve",
    "whisper": "whisper-server --model large-v3",
    "xtts": "python xtts_server.py --port 8020"
  },
  "healthChecks": [
    { "name": "api", "url": "http://localhost:5040/health" },
    { "name": "ollama", "url": "http://localhost:11434/api/version" }
  ]
}
```

---

## run.ps1

Main runner script that:
1. Pulls latest from Git
2. Starts backend on configured port
3. Starts frontend dev server
4. Opens browser to frontend

---

## Backend Startup Commands

Commands are configurable via UI or API:

| Backend | Default Command |
|---------|-----------------|
| Ollama | `ollama serve` |
| llama.cpp | `./llama-server -m model.gguf -c 4096 -ngl 99` |
| Whisper | `whisper-server --model large-v3` |
| XTTS | `python xtts_server.py --port 8020` |
| SD-API | `python webui.py --api --listen` |
| SVD-API | `python svd_server.py --port 7861` |

---

## Cross-References

| Reference | Location |
|-----------|----------|
| PowerShell Integration | `../../50-powershell-integration/00-overview.md` |
| Backend Overview | `../00-overview.md` |
