# Systemd Service Configuration

**Version:** 2.0.0  
**Status:** Active  
**Updated:** 2026-03-09  

---

## Overview

Systemd service configuration for running AI Transcribe CLI as a production daemon on Linux systems.

**Cross-References:**
- [Deployment Overview](./00-overview.md)
- [Environment Configuration](./02-environment-config.md)
- [Configuration](../01-backend/11-configuration.md)

---

## Service Unit File

### /etc/systemd/system/ai-transcribe.service

```ini
[Unit]
Description=AI Transcribe CLI - Speech-to-Text and Text-to-Speech Service
Documentation=https://docs.example.com/ai-transcribe
After=network-online.target
Wants=network-online.target
StartLimitIntervalSec=300
StartLimitBurst=5

[Service]
Type=notify
User=ai-transcribe
Group=ai-transcribe
WorkingDirectory=/opt/ai-transcribe

# Environment
EnvironmentFile=-/opt/ai-transcribe/config/.env
Environment=TRANSCRIBE_DATA_DIR=/opt/ai-transcribe/data
Environment=TRANSCRIBE_MODELS_DIR=/opt/ai-transcribe/models
Environment=TRANSCRIBE_LOG_DIR=/opt/ai-transcribe/logs

# Executable
ExecStart=/opt/ai-transcribe/bin/ai-transcribe serve \
    --config /opt/ai-transcribe/config/config.yaml \
    --port 8030 \
    --ws-port 8031

ExecReload=/bin/kill -HUP $MAINPID
ExecStop=/bin/kill -TERM $MAINPID

# Restart Policy
Restart=on-failure
RestartSec=5
TimeoutStartSec=120
TimeoutStopSec=30

# Resource Limits
LimitNOFILE=65535
LimitNPROC=4096
LimitMEMLOCK=infinity

# Security Hardening
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/opt/ai-transcribe/data /opt/ai-transcribe/logs
ProtectKernelTunables=true
ProtectKernelModules=true
ProtectControlGroups=true
RestrictSUIDSGID=true
RestrictNamespaces=true

# Capabilities (for GPU access if needed)
AmbientCapabilities=
CapabilityBoundingSet=

# Logging
StandardOutput=journal
StandardError=journal
SyslogIdentifier=ai-transcribe

[Install]
WantedBy=multi-user.target
```

---

## Installation

### 1. Create Service User

```bash
# Create system user without login shell
sudo useradd -r -s /bin/false -d /opt/ai-transcribe ai-transcribe

# Create directories
sudo mkdir -p /opt/ai-transcribe/{bin,config,data,models,logs}
sudo mkdir -p /opt/ai-transcribe/data/{sessions,cache,voices}

# Set ownership
sudo chown -R ai-transcribe:ai-transcribe /opt/ai-transcribe
```

### 2. Install Binary

```bash
# Copy binary
sudo cp ai-transcribe /opt/ai-transcribe/bin/
sudo chmod 755 /opt/ai-transcribe/bin/ai-transcribe

# Verify
/opt/ai-transcribe/bin/ai-transcribe --version
```

### 3. Install Configuration

```bash
# Copy config file
sudo cp config.yaml /opt/ai-transcribe/config/
sudo chown ai-transcribe:ai-transcribe /opt/ai-transcribe/config/config.yaml
sudo chmod 640 /opt/ai-transcribe/config/config.yaml

# Copy environment file
sudo cp .env.example /opt/ai-transcribe/config/.env
sudo chown ai-transcribe:ai-transcribe /opt/ai-transcribe/config/.env
sudo chmod 600 /opt/ai-transcribe/config/.env
```

### 4. Install Service Unit

```bash
# Copy service file
sudo cp ai-transcribe.service /etc/systemd/system/

# Reload systemd
sudo systemctl daemon-reload

# Enable service
sudo systemctl enable ai-transcribe

# Start service
sudo systemctl start ai-transcribe

# Check status
sudo systemctl status ai-transcribe
```

---

## Service Management

### Basic Operations

```bash
# Start service
sudo systemctl start ai-transcribe

# Stop service
sudo systemctl stop ai-transcribe

# Restart service
sudo systemctl restart ai-transcribe

# Reload configuration (SIGHUP)
sudo systemctl reload ai-transcribe

# View status
sudo systemctl status ai-transcribe

# View logs
sudo journalctl -u ai-transcribe -f

# View logs from last boot
sudo journalctl -u ai-transcribe -b

# View last 100 lines
sudo journalctl -u ai-transcribe -n 100
```

### Health Checks

```bash
# API health check
curl -s http://localhost:8030/health | jq

# Full readiness check
curl -s http://localhost:8030/health/ready

# Check specific component
curl -s http://localhost:8030/health | jq '.components.stt'
```

---

## Socket Activation (Optional)

For on-demand startup, use socket activation.

### /etc/systemd/system/ai-transcribe.socket

```ini
[Unit]
Description=AI Transcribe CLI Socket

[Socket]
ListenStream=8030
Accept=false
ReusePort=true

[Install]
WantedBy=sockets.target
```

### Updated Service for Socket Activation

```ini
[Service]
# ... (same as above, but add:)
NonBlocking=true

[Unit]
# ... (add:)
Requires=ai-transcribe.socket
After=ai-transcribe.socket
```

### Enable Socket

```bash
sudo systemctl enable ai-transcribe.socket
sudo systemctl start ai-transcribe.socket
```

---

## Multi-Instance Configuration

Run multiple instances with different configurations.

### Instance-Specific Service

```bash
# Create instance config
sudo mkdir -p /opt/ai-transcribe/config/production
sudo mkdir -p /opt/ai-transcribe/config/staging

# Create instance-specific service
sudo cp /etc/systemd/system/ai-transcribe.service \
        /etc/systemd/system/ai-transcribe@.service
```

### /etc/systemd/system/ai-transcribe@.service

```ini
[Unit]
Description=AI Transcribe CLI (%i instance)
After=network-online.target

[Service]
Type=notify
User=ai-transcribe
Group=ai-transcribe
WorkingDirectory=/opt/ai-transcribe

EnvironmentFile=-/opt/ai-transcribe/config/%i/.env
Environment=TRANSCRIBE_DATA_DIR=/opt/ai-transcribe/data/%i
Environment=TRANSCRIBE_LOG_DIR=/opt/ai-transcribe/logs/%i

ExecStart=/opt/ai-transcribe/bin/ai-transcribe serve \
    --config /opt/ai-transcribe/config/%i/config.yaml

# ... rest of config

[Install]
WantedBy=multi-user.target
```

### Usage

```bash
# Start production instance
sudo systemctl start ai-transcribe@production

# Start staging instance
sudo systemctl start ai-transcribe@staging

# Check both
sudo systemctl status 'ai-transcribe@*'
```

---

## GPU Support

For GPU-accelerated inference, additional configuration is required.

### NVIDIA GPU Access

```ini
[Service]
# ... existing config

# GPU device access
PrivateDevices=false
DeviceAllow=/dev/nvidia0 rw
DeviceAllow=/dev/nvidiactl rw
DeviceAllow=/dev/nvidia-uvm rw

# CUDA libraries
Environment=LD_LIBRARY_PATH=/usr/local/cuda/lib64
Environment=CUDA_VISIBLE_DEVICES=0
```

### Verify GPU Access

```bash
# Check CUDA is accessible
sudo -u ai-transcribe nvidia-smi

# Check from service
sudo systemctl show ai-transcribe -p DeviceAllow
```

---

## Log Rotation

### /etc/logrotate.d/ai-transcribe

```
/opt/ai-transcribe/logs/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 640 ai-transcribe ai-transcribe
    postrotate
        systemctl reload ai-transcribe 2>/dev/null || true
    endscript
}
```

---

## Monitoring Integration

### Prometheus Metrics

```bash
# Verify metrics endpoint
curl http://localhost:9090/metrics
```

### Alertmanager Rules

```yaml
# /etc/prometheus/rules/ai-transcribe.yml
groups:
  - name: ai-transcribe
    rules:
      - alert: AITranscribeDown
        expr: up{job="ai-transcribe"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "AI Transcribe service is down"
          
      - alert: AITranscribeHighLatency
        expr: ai_transcribe_request_duration_seconds{quantile="0.99"} > 5
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "AI Transcribe high latency detected"
```

---

## Troubleshooting

### Service Won't Start

```bash
# Check detailed status
sudo systemctl status ai-transcribe -l

# Check journal for errors
sudo journalctl -u ai-transcribe -n 50 --no-pager

# Verify binary works standalone
sudo -u ai-transcribe /opt/ai-transcribe/bin/ai-transcribe serve --help

# Check file permissions
ls -la /opt/ai-transcribe/
```

### Permission Issues

```bash
# Reset permissions
sudo chown -R ai-transcribe:ai-transcribe /opt/ai-transcribe
sudo chmod 755 /opt/ai-transcribe/bin/ai-transcribe
sudo chmod 640 /opt/ai-transcribe/config/config.yaml
sudo chmod 600 /opt/ai-transcribe/config/.env
```

### Port Already in Use

```bash
# Check what's using the port
sudo ss -tlnp | grep 8030

# Kill process if needed
sudo fuser -k 8030/tcp
```

---

## Related Documents

- [Environment Configuration](./02-environment-config.md)
- [PowerShell Deployment](./03-powershell-deployment.md)
- [Configuration](../01-backend/11-configuration.md)
