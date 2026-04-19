# Nexus Flow CLI: PowerShell Integration

**Version:** 2.0.0  
**Status:** Complete  
**Updated:** 2026-03-09  

---

## Overview

PowerShell integration for Nexus Flow CLI enables automated startup, process management, and workflow orchestration backend services.

---

## powershell.json

```json
{
  "projectName": "nexus-flow-cli",
  "displayName": "Nexus Flow CLI",
  "ports": [5050, 5051],
  "frontendPort": 5176,
  "runCommand": "go run main.go serve --port 5050",
  "commands": {
    "serve": "go run main.go serve",
    "build": "go build -o nexus-flow-cli.exe",
    "frontend": "cd frontend && bun run dev",
    "worker": "go run main.go worker --port 5051"
  },
  "healthChecks": [
    { "name": "api", "url": "http://localhost:5050/health" },
    { "name": "worker", "url": "http://localhost:5051/health" }
  ],
  "dependencies": [
    { "name": "ai-bridge", "healthUrl": "http://localhost:5040/health" }
  ]
}
```

---

## run.ps1

Main runner script that:
1. Pulls latest from Git
2. Checks AI Bridge CLI availability (optional dependency)
3. Starts backend API on port 5050
4. Starts workflow worker on port 5051
5. Starts frontend dev server on port 5176
6. Opens browser to frontend

---

## Backend Commands

| Command | Description |
|---------|-------------|
| `serve` | Start REST/WebSocket API server |
| `worker` | Start workflow execution worker |
| `build` | Build production binary |
| `frontend` | Start React dev server |

---

## Environment Variables

```powershell
$env:NEXUS_PORT = "5050"
$env:NEXUS_WORKER_PORT = "5051"
$env:NEXUS_DB_PATH = "./data/nexusflow.db"
$env:AI_BRIDGE_URL = "http://localhost:5040"
$env:GSEARCH_URL = "http://localhost:5020"
$env:BRUN_URL = "http://localhost:5030"
```

---

## Service Dependencies

Nexus Flow can connect to other CLIs for workflow node execution:

| Dependency | Default URL | Purpose |
|------------|-------------|---------|
| AI Bridge CLI | `http://localhost:5040` | AI node execution |
| GSearch CLI | `http://localhost:5020` | Search node execution |
| BRun CLI | `http://localhost:5030` | Build/task node execution |

---

## Health Checks

```powershell
# Check all services
function Test-NexusFlowHealth {
    $endpoints = @(
        "http://localhost:5050/health",
        "http://localhost:5051/health"
    )
    
    foreach ($endpoint in $endpoints) {
        try {
            $response = Invoke-WebRequest -Uri $endpoint -TimeoutSec 5
            Write-Host "✅ $endpoint - OK"
        } catch {
            Write-Host "❌ $endpoint - Failed"
        }
    }
}
```

---

## Cross-References

| Reference | Location |
|-----------|----------|
| PowerShell Integration | `../../50-powershell-integration/00-overview.md` |
| CLI Overview | `../00-overview.md` |
| API Specification | `../01-backend/03-openapi-specification.md` |
