# AI Transcribe CLI: Deployment Overview

**Version:** 2.1.0  
**Status:** Draft  
**Updated:** 2026-03-30    
**AI Confidence:** High  
**Ambiguity:** None

---


## Keywords

`transcribe`, `cli`, `deploy`

---

## Scoring

| Criterion | Status |
|-----------|--------|
| `00-overview.md` present | ✅ |
| AI Confidence assigned | ✅ |
| Ambiguity assigned | ✅ |
| Keywords present | ✅ |
| Scoring table present | ✅ |


## Overview

Deployment specifications for AI Transcribe CLI including Docker containerization, PowerShell automation, and model management.

---

## Core Modules

| Module | Spec | Description |
|--------|------|-------------|
| Systemd Service | [01-systemd-service.md](./01-systemd-service.md) | Linux service configuration |
| Environment Config | [02-environment-config.md](./02-environment-config.md) | Environment variable setup |
| PowerShell Deployment | [03-powershell-deployment.md](./03-powershell-deployment.md) | Windows deployment automation |

---

## Deployment Modes

| Mode | Command | Description |
|------|---------|-------------|
| CLI | `ai-transcribe transcribe audio.mp3` | One-off transcription |
| Server | `ai-transcribe serve` | HTTP + WebSocket daemon |
| Docker | `docker-compose up` | Containerized deployment |

---

## System Requirements

### Minimum (STT Only)
- CPU: 4 cores
- RAM: 8 GB
- Storage: 5 GB (whisper-small)

### Recommended (Full Suite)
- CPU: 8 cores
- RAM: 16 GB
- GPU: CUDA-capable (optional)
- Storage: 20 GB (whisper-large + XTTS)

---

## Default Ports

| Port | Service |
|------|---------|
| 8030 | HTTP API |
| 8031 | WebSocket |
| 8032 | Prometheus metrics |

---

## See Also

- [Main Overview](../00-overview.md)
- [Backend Configuration](../01-backend/11-configuration.md)
