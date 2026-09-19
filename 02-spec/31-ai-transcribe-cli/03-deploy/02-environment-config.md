# Environment Configuration

**Version:** 2.0.0  
**Status:** Active  
**Updated:** 2026-03-09  

---

## Overview

Environment variable configuration for the AI Transcribe CLI. Environment variables override config file settings and are the recommended way to configure secrets and deployment-specific values.

**Cross-References:**
- [Deployment Overview](./00-overview.md)
- [Systemd Service](./01-systemd-service.md)
- [Configuration](../01-backend/11-configuration.md)

---

## Environment File Template

### /opt/ai-transcribe/config/.env

```bash
# =============================================================================
# AI Transcribe CLI Environment Configuration
# =============================================================================

# -----------------------------------------------------------------------------
# Core Settings
# -----------------------------------------------------------------------------

# Service identification
TRANSCRIBE_SERVICE_NAME=ai-transcribe
TRANSCRIBE_ENVIRONMENT=production

# Directories (required)
TRANSCRIBE_DATA_DIR=/opt/ai-transcribe/data
TRANSCRIBE_MODELS_DIR=/opt/ai-transcribe/models
TRANSCRIBE_LOG_DIR=/opt/ai-transcribe/logs

# -----------------------------------------------------------------------------
# Server Configuration
# -----------------------------------------------------------------------------

# Network binding
TRANSCRIBE_HOST=0.0.0.0
TRANSCRIBE_PORT=8030
TRANSCRIBE_WS_PORT=8031
TRANSCRIBE_GRPC_PORT=8032

# TLS (optional)
TRANSCRIBE_TLS_ENABLED=false
TRANSCRIBE_TLS_CERT=/path/to/cert.pem
TRANSCRIBE_TLS_KEY=/path/to/key.pem

# -----------------------------------------------------------------------------
# Logging
# -----------------------------------------------------------------------------

TRANSCRIBE_LOG_LEVEL=info
TRANSCRIBE_LOG_FORMAT=json

# -----------------------------------------------------------------------------
# Provider API Keys
# -----------------------------------------------------------------------------

# OpenAI (for Whisper API)
OPENAI_API_KEY=sk-...

# ElevenLabs (for STT and TTS)
ELEVENLABS_API_KEY=...

# Azure Speech Services
AZURE_SPEECH_KEY=...
AZURE_SPEECH_REGION=eastus

# -----------------------------------------------------------------------------
# Local Model Configuration
# -----------------------------------------------------------------------------

# Whisper
TRANSCRIBE_WHISPER_MODEL=base
TRANSCRIBE_WHISPER_DEVICE=auto
TRANSCRIBE_WHISPER_COMPUTE_TYPE=float16

# XTTS
TRANSCRIBE_XTTS_DEVICE=auto

# -----------------------------------------------------------------------------
# Default Providers
# -----------------------------------------------------------------------------

TRANSCRIBE_STT_PROVIDER=whisper
TRANSCRIBE_TTS_PROVIDER=xtts

# -----------------------------------------------------------------------------
# Rate Limiting
# -----------------------------------------------------------------------------

TRANSCRIBE_RATE_LIMIT_ENABLED=true
TRANSCRIBE_RATE_LIMIT_RPM=60
TRANSCRIBE_RATE_LIMIT_BURST=10

# -----------------------------------------------------------------------------
# Session Management
# -----------------------------------------------------------------------------

TRANSCRIBE_SESSION_MAX_CONCURRENT=10
TRANSCRIBE_SESSION_MAX_DURATION=3600
TRANSCRIBE_SESSION_IDLE_TIMEOUT=300

# -----------------------------------------------------------------------------
# Integration
# -----------------------------------------------------------------------------

# AI Bridge integration
TRANSCRIBE_AI_BRIDGE_URL=http://localhost:5040
TRANSCRIBE_AI_BRIDGE_ENABLED=true

# -----------------------------------------------------------------------------
# Metrics & Monitoring
# -----------------------------------------------------------------------------

TRANSCRIBE_METRICS_ENABLED=true
TRANSCRIBE_METRICS_PORT=9090

# Health check
TRANSCRIBE_HEALTH_INTERVAL=30
```

---

## Variable Reference

### Core Variables

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `TRANSCRIBE_SERVICE_NAME` | string | ai-transcribe | Service identifier |
| `TRANSCRIBE_ENVIRONMENT` | string | development | Environment name |
| `TRANSCRIBE_DATA_DIR` | path | ./data | Data storage directory |
| `TRANSCRIBE_MODELS_DIR` | path | ./models | Model files directory |
| `TRANSCRIBE_LOG_DIR` | path | ./logs | Log files directory |

### Server Variables

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `TRANSCRIBE_HOST` | string | 0.0.0.0 | Server bind address |
| `TRANSCRIBE_PORT` | int | 8030 | HTTP API port |
| `TRANSCRIBE_WS_PORT` | int | 8031 | WebSocket port |
| `TRANSCRIBE_GRPC_PORT` | int | 8032 | gRPC port |
| `TRANSCRIBE_TLS_ENABLED` | bool | false | Enable TLS |
| `TRANSCRIBE_TLS_CERT` | path | - | TLS certificate path |
| `TRANSCRIBE_TLS_KEY` | path | - | TLS private key path |

### Logging Variables

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `TRANSCRIBE_LOG_LEVEL` | string | info | Log level (debug, info, warn, error) |
| `TRANSCRIBE_LOG_FORMAT` | string | json | Log format (json, text) |
| `TRANSCRIBE_LOG_OUTPUT` | string | stdout | Output (stdout, file, both) |

### Provider API Keys

| Variable | Type | Required | Description |
|----------|------|----------|-------------|
| `OPENAI_API_KEY` | string | If using OpenAI STT | OpenAI API key |
| `ELEVENLABS_API_KEY` | string | If using ElevenLabs | ElevenLabs API key |
| `AZURE_SPEECH_KEY` | string | If using Azure TTS | Azure Speech subscription key |
| `AZURE_SPEECH_REGION` | string | If using Azure TTS | Azure region (e.g., eastus) |

### Model Configuration

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `TRANSCRIBE_WHISPER_MODEL` | string | base | Whisper model size (tiny, base, small, medium, large) |
| `TRANSCRIBE_WHISPER_DEVICE` | string | auto | Device (cpu, cuda, auto) |
| `TRANSCRIBE_WHISPER_COMPUTE_TYPE` | string | float16 | Compute precision |
| `TRANSCRIBE_XTTS_DEVICE` | string | auto | XTTS device selection |

### Provider Selection

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `TRANSCRIBE_STT_PROVIDER` | string | whisper | Default STT provider |
| `TRANSCRIBE_TTS_PROVIDER` | string | xtts | Default TTS provider |

---

## Environment-Specific Configurations

### Development

```bash
# .env.development
TRANSCRIBE_ENVIRONMENT=development
TRANSCRIBE_LOG_LEVEL=debug
TRANSCRIBE_LOG_FORMAT=text
TRANSCRIBE_WHISPER_MODEL=tiny
TRANSCRIBE_RATE_LIMIT_ENABLED=false
TRANSCRIBE_METRICS_ENABLED=false
```

### Staging

```bash
# .env.staging
TRANSCRIBE_ENVIRONMENT=staging
TRANSCRIBE_LOG_LEVEL=info
TRANSCRIBE_WHISPER_MODEL=base
TRANSCRIBE_RATE_LIMIT_RPM=120
TRANSCRIBE_SESSION_MAX_CONCURRENT=20
```

### Production

```bash
# .env.production
TRANSCRIBE_ENVIRONMENT=production
TRANSCRIBE_LOG_LEVEL=info
TRANSCRIBE_LOG_FORMAT=json
TRANSCRIBE_WHISPER_MODEL=large
TRANSCRIBE_WHISPER_DEVICE=cuda
TRANSCRIBE_RATE_LIMIT_ENABLED=true
TRANSCRIBE_RATE_LIMIT_RPM=60
TRANSCRIBE_SESSION_MAX_CONCURRENT=50
TRANSCRIBE_TLS_ENABLED=true
```

---

## Secret Management

### Using External Secret Managers

#### HashiCorp Vault

```bash
# Fetch secrets from Vault
export OPENAI_API_KEY=$(vault kv get -field=api_key secret/ai-transcribe/openai)
export ELEVENLABS_API_KEY=$(vault kv get -field=api_key secret/ai-transcribe/elevenlabs)
```

#### AWS Secrets Manager

```bash
# Fetch secrets from AWS
export OPENAI_API_KEY=$(aws secretsmanager get-secret-value \
    --secret-id ai-transcribe/openai \
    --query SecretString --output text | jq -r '.api_key')
```

#### Environment File with Secrets

```bash
# /opt/ai-transcribe/config/.env.secrets (mode 600)
OPENAI_API_KEY=sk-...
ELEVENLABS_API_KEY=...
AZURE_SPEECH_KEY=...
```

### Systemd Integration

```ini
# In ai-transcribe.service
[Service]
EnvironmentFile=/opt/ai-transcribe/config/.env
EnvironmentFile=-/opt/ai-transcribe/config/.env.secrets
```

---

## Validation

### Check Configuration

```bash
# Validate environment
ai-transcribe config validate

# Show effective configuration
ai-transcribe config show

# Check specific variable
ai-transcribe config get TRANSCRIBE_STT_PROVIDER
```

### Startup Checks

```go
func validateEnvironment() error {
    required := []string{
        "TRANSCRIBE_DATA_DIR",
        "TRANSCRIBE_MODELS_DIR",
    }
    
    for _, key := range required {
        if os.Getenv(key) == "" {
            return apperror.New(
                ErrEnvMissing,
                "required environment variable not set",
            ).WithContext("variable", key)
        }
    }
    
    // Validate directories exist
    if err := validateDirectory(os.Getenv("TRANSCRIBE_DATA_DIR")); err != nil {
        return err
    }
    
    // Validate provider API keys if providers are enabled
    if os.Getenv("TRANSCRIBE_STT_PROVIDER") == "openai" {
        if os.Getenv("OPENAI_API_KEY") == "" {
            return errors.New("OPENAI_API_KEY required when using OpenAI STT")
        }
    }
    
    return nil
}
```

---

## GPU Configuration

### CUDA Environment

```bash
# CUDA paths
CUDA_HOME=/usr/local/cuda
LD_LIBRARY_PATH=/usr/local/cuda/lib64:$LD_LIBRARY_PATH

# GPU selection
CUDA_VISIBLE_DEVICES=0

# Transcribe settings
TRANSCRIBE_WHISPER_DEVICE=cuda
TRANSCRIBE_XTTS_DEVICE=cuda
```

### Multiple GPUs

```bash
# Use specific GPU
CUDA_VISIBLE_DEVICES=1

# Use multiple GPUs (if supported)
CUDA_VISIBLE_DEVICES=0,1

# Memory fraction limit
TRANSCRIBE_GPU_MEMORY_FRACTION=0.8
```

---

## Docker Integration

### Docker Environment

```dockerfile
# Dockerfile
ENV TRANSCRIBE_DATA_DIR=/data
ENV TRANSCRIBE_MODELS_DIR=/models
ENV TRANSCRIBE_LOG_DIR=/logs
```

### Docker Compose

```yaml
# docker-compose.yml
services:
  ai-transcribe:
    image: ai-transcribe:latest
    environment:
      - TRANSCRIBE_PORT=8030
      - TRANSCRIBE_LOG_LEVEL=info
      - OPENAI_API_KEY=${OPENAI_API_KEY}
    env_file:
      - .env
    volumes:
      - ./data:/data
      - ./models:/models
```

---

## Troubleshooting

### Missing Variables

```bash
# Check what's set
env | grep TRANSCRIBE_

# Check specific variable
echo $TRANSCRIBE_DATA_DIR

# Debug mode shows all config
TRANSCRIBE_LOG_LEVEL=debug ai-transcribe serve
```

### Permission Issues

```bash
# Check file permissions
ls -la /opt/ai-transcribe/config/.env

# Should be:
# -rw------- 1 ai-transcribe ai-transcribe ... .env
```

### Precedence Issues

```bash
# Environment > Config file > Defaults
# Check effective value
ai-transcribe config show | grep stt_provider
```

---

## Related Documents

- [Systemd Service](./01-systemd-service.md)
- [PowerShell Deployment](./03-powershell-deployment.md)
- [Configuration](../01-backend/11-configuration.md)
