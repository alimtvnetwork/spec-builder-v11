# Nexus Flow CLI: Deployment Guide

**Version:** 2.0.0  
**Status:** Complete  
**Updated:** 2026-03-09  

---

## Overview

This guide covers deploying Nexus Flow CLI for production and development environments.

---

## Build Requirements

| Requirement | Version |
|-------------|---------|
| Go | 1.21+ |
| Node.js | 20+ (for frontend) |
| Bun | 1.0+ (optional, faster) |

---

## Production Build

### Backend Binary

```bash
# Build for current platform
go build -o nexus-flow-cli ./cmd/nexus-flow

# Cross-compile for Windows
GOOS=windows GOARCH=amd64 go build -o nexus-flow-cli.exe ./cmd/nexus-flow

# Cross-compile for Linux
GOOS=linux GOARCH=amd64 go build -o nexus-flow-cli-linux ./cmd/nexus-flow
```

### Frontend Build

```bash
cd frontend
bun install
bun run build
# Output: frontend/dist/
```

---

## Directory Structure

```
nexus-flow-cli/
├── nexus-flow-cli.exe          # Backend binary
├── frontend/
│   └── dist/                   # Built frontend assets
├── data/
│   └── nexus.db               # SQLite database
├── logs/
│   └── {timestamp}/           # Run logs
├── config.json                 # Runtime configuration
└── powershell.json            # PowerShell runner config
```

---

## Configuration

### config.json

```json
{
  "server": {
    "host": "0.0.0.0",
    "port": 5050,
    "workerPort": 5051
  },
  "database": {
    "path": "./data/nexusflow.db",
    "maxConnections": 10
  },
  "integrations": {
    "aiBridge": {
      "url": "http://localhost:5040",
      "enabled": true
    },
    "gsearch": {
      "url": "http://localhost:5020",
      "enabled": true
    },
    "brun": {
      "url": "http://localhost:5030",
      "enabled": true
    }
  },
  "execution": {
    "maxConcurrent": 5,
    "timeout": 300,
    "retryAttempts": 3
  },
  "logging": {
    "level": "info",
    "format": "json",
    "outputPath": "./logs"
  }
}
```

---

## Startup Commands

### Development

```bash
# Start API server (development)
go run main.go serve --port 5050

# Start worker (development)
go run main.go worker --port 5051

# Start frontend (development)
cd frontend && bun run dev
```

### Production

```bash
# Start with production config
./nexus-flow-cli serve --config ./config.json

# Start worker
./nexus-flow-cli worker --config ./config.json
```

---

## Docker Deployment

### Dockerfile

```dockerfile
FROM golang:1.21-alpine AS builder

WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN go build -o nexus-flow-cli ./cmd/nexus-flow

FROM alpine:latest
RUN apk --no-cache add ca-certificates

WORKDIR /app
COPY --from=builder /app/nexus-flow-cli .
COPY config.json .

EXPOSE 5050 5051

CMD ["./nexus-flow-cli", "serve"]
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  nexus-flow-api:
    build: .
    ports:
      - "5050:5050"
    volumes:
      - ./data:/app/data
      - ./logs:/app/logs
    environment:
      - NEXUS_PORT=5050
      - AI_BRIDGE_URL=http://ai-bridge:5040
    depends_on:
      - ai-bridge
    
  nexus-flow-worker:
    build: .
    command: ["./nexus-flow-cli", "worker"]
    ports:
      - "5051:5051"
    volumes:
      - ./data:/app/data
    environment:
      - NEXUS_WORKER_PORT=5051
    depends_on:
      - nexus-flow-api

  ai-bridge:
    image: ai-bridge-cli:latest
    ports:
      - "5040:5040"
```

---

## Health Monitoring

### Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /health` | Basic health check |
| `GET /health/ready` | Readiness (DB connected) |
| `GET /health/live` | Liveness probe |
| `GET /metrics` | Prometheus metrics |

### Prometheus Integration

```yaml
scrape_configs:
  - job_name: 'nexus-flow'
    static_configs:
      - targets: ['localhost:5050']
```

---

## Logging

### Log Levels

| Level | Usage |
|-------|-------|
| `debug` | Development debugging |
| `info` | Normal operation |
| `warn` | Potential issues |
| `error` | Errors requiring attention |

### Log Format (JSON)

```json
{
  "Timestamp": "2026-02-01T12:00:00Z",
  "Level": "info",
  "Message": "Workflow executed",
  "WorkflowId": "wf-123",
  "DurationMs": 1234,
  "NodeCount": 5
}
```

---

## Cross-References

| Reference | Location |
|-----------|----------|
| PowerShell Integration | `./01-powershell.md` |
| CLI Overview | `../00-overview.md` |
| API Specification | `../01-backend/03-openapi-specification.md` |
| Error Codes | `../01-backend/04-error-codes.md` |
