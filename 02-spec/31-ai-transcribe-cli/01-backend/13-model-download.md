# AI Transcribe CLI: Model Download & Management

**Version:** 2.0.0  
**Status:** Active  
**Updated:** 2026-03-09  

---

## Overview

This specification defines the model download, caching, and management system for local Whisper (STT) and XTTS (TTS) models. The system ensures efficient model retrieval, verification, and storage with support for multiple model variants.

---

## Model Registry

### Whisper Models

| Model ID | Size | VRAM | Languages | Use Case |
|----------|------|------|-----------|----------|
| `whisper-tiny` | 39 MB | 1 GB | Multi | Testing, low-resource |
| `whisper-base` | 74 MB | 1 GB | Multi | Quick transcription |
| `whisper-small` | 244 MB | 2 GB | Multi | Balanced |
| `whisper-medium` | 769 MB | 5 GB | Multi | High accuracy |
| `whisper-large-v3` | 1.5 GB | 10 GB | Multi | Production default |
| `whisper-large-v3-turbo` | 809 MB | 6 GB | Multi | Fast + accurate |

### XTTS Models

| Model ID | Size | VRAM | Features | Use Case |
|----------|------|------|----------|----------|
| `xtts-v2` | 1.8 GB | 4 GB | Voice cloning, 17 languages | Production default |
| `xtts-v2-streaming` | 1.8 GB | 4 GB | Low-latency streaming | Real-time |
| `xtts-v1.1` | 1.4 GB | 3 GB | Legacy, 13 languages | Compatibility |

---

## Storage Layout

```
~/.ai-transcribe/
├── models/
│   ├── whisper/
│   │   ├── large-v3/
│   │   │   ├── model.bin           # Main weights
│   │   │   ├── config.json         # Model config
│   │   │   ├── tokenizer.json      # Tokenizer
│   │   │   └── manifest.json       # Version, checksum
│   │   ├── large-v3-turbo/
│   │   └── medium/
│   ├── xtts/
│   │   ├── v2/
│   │   │   ├── model.pth           # PyTorch weights
│   │   │   ├── config.json         # Model config
│   │   │   ├── vocab.json          # Vocabulary
│   │   │   ├── speakers_xtts.pth   # Speaker embeddings
│   │   │   └── manifest.json       # Version, checksum
│   │   └── v2-streaming/
│   └── cache/
│       ├── downloads/              # In-progress downloads
│       └── temp/                   # Temporary files
├── voices/                         # Cloned voice profiles
│   ├── {voice_id}/
│   │   ├── reference.wav           # Reference audio
│   │   ├── embedding.npy           # Voice embedding
│   │   └── metadata.json           # Voice metadata
│   └── index.json                  # Voice registry
└── config.yaml                     # Global configuration
```

---

## Download Manager

### Interface

```go
import stdctx "context"

// ModelDownloader handles model acquisition and caching
type ModelDownloader interface {
    // Download fetches a model with progress tracking
    Download(context stdctx.Context, modelId string, opts DownloadOptions) appfault.Result[Model]
    
    // GetModel returns a cached model or downloads if missing
    GetModel(context stdctx.Context, modelId string) appfault.Result[Model]
    
    // ListModels returns available models
    ListModels(modelType ModelType) appfault.Result[[]ModelInfo]
    
    // DeleteModel removes a cached model
    DeleteModel(modelId string) *appfault.AppError
    
    // VerifyModel checks model integrity
    VerifyModel(modelId string) appfault.Result[VerifyResult]
    
    // GetProgress returns download progress for active downloads
    GetProgress(modelId string) appfault.Result[DownloadProgress]
}

type DownloadOptions struct {
    Force       bool              // Re-download even if cached
    ProgressFn  ProgressCallback  // Progress updates
    MaxRetries  int               // Retry count on failure
    Timeout     time.Duration     // Overall timeout
    Mirror      string            // Alternative mirror URL
}

type DownloadProgress struct {
    ModelId       string
    TotalBytes    int64
    DownloadedBytes int64
    Speed         float64  // bytes/sec
    ETA           time.Duration
    Status        DownloadStatus
    Error         *appfault.AppError `json:",omitempty"`
}

type DownloadStatus string

const (
    StatusPending     DownloadStatus = "pending"
    StatusDownloading DownloadStatus = "downloading"
    StatusVerifying   DownloadStatus = "verifying"
    StatusExtracting  DownloadStatus = "extracting"
    StatusComplete    DownloadStatus = "complete"
    StatusFailed      DownloadStatus = "failed"
)
```

### Implementation

```go
type modelDownloader struct {
    cacheDir    string
    httpClient  *http.Client
    registry    ModelRegistry
    mu          sync.RWMutex
    downloads   map[string]*activeDownload
}

func (d *modelDownloader) Download(context stdctx.Context, modelId string, opts DownloadOptions) appfault.Result[Model] {
    // Check cache first
    if !opts.Force {
        if model, err := d.loadCached(modelId); err == nil {
            return model, nil
        }
    }
    
    // Get model info from registry
    info, err := d.registry.GetModelInfo(modelId)
    if err != nil {
        return nil, appfault.Wrap(
            err,
            ErrModelNotFound,
            "unknown model",
        ).WithContext("modelId", modelId)
    }
    
    // Create download task
    download := &activeDownload{
        modelId:   modelId,
        info:      info,
        progress:  &DownloadProgress{ModelId: modelId, Status: StatusPending},
        cancelFn:  nil,
    }
    
    d.mu.Lock()
    d.downloads[modelId] = download
    d.mu.Unlock()
    
    defer func() {
        d.mu.Lock()
        delete(d.downloads, modelId)
        d.mu.Unlock()
    }()
    
    // Execute download with retries
    var lastErr error
    for attempt := 0; attempt <= opts.MaxRetries; attempt++ {
        if attempt > 0 {
            time.Sleep(time.Second * time.Duration(attempt*2))
        }
        
        if err := d.executeDownload(context, download, opts); err != nil {
            lastErr = err
            continue
        }
        
        // Verify checksum
        if err := d.verifyChecksum(download); err != nil {
            lastErr = err
            continue
        }
        
        // Extract if needed
        if err := d.extractModel(download); err != nil {
            lastErr = err
            continue
        }
        
        download.progress.Status = StatusComplete
        return d.loadCached(modelId)
    }
    
    download.progress.Status = StatusFailed
    download.progress.Error = lastErr
    return nil, appfault.Wrap(
        lastErr,
        ErrDownloadFailed,
        "download failed after retries",
    ).WithContext("attempts", opts.MaxRetries+1)
}
```

---

## Model Registry

### Remote Registry

```go
// ModelRegistry provides model metadata
type ModelRegistry interface {
    GetModelInfo(modelId string) appfault.Result[ModelInfo]
    ListAvailable(modelType ModelType) appfault.Result[[]ModelInfo]
    CheckUpdates(installed []string) appfault.Result[[]UpdateInfo]
    GetMirrors(modelId string) appfault.Result[[]MirrorInfo]
}

type ModelInfo struct {
    Id            string
    Type          ModelType  // whisper, xtts
    Version       string
    Size          int64      // bytes
    Checksum      string     // SHA256
    Url           string     // Primary download URL
    Mirrors       []string   // Alternative URLs
    Requirements  Requirements
    Metadata      map[string]string
    ReleaseDate   time.Time
}

type Requirements struct {
    MinVram      int64   // bytes
    MinRam       int64   // bytes
    MinDiskSpace int64
    Cuda         string  // minimum CUDA version
    Quantization []string // supported: fp16, int8, int4
}
```

### Bundled Registry

```go
// Built-in model registry (offline fallback)
var builtinRegistry = map[string]ModelInfo{
    "whisper-large-v3": {
        Id:       "whisper-large-v3",
        Type:     ModelTypeWhisper,
        Version:  "v3.0.0",
        Size:     1550000000,
        Checksum: "sha256:...",
        Url:      "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-large-v3.bin",
        Mirrors: []string{
            "https://models.silero.ai/whisper/ggml-large-v3.bin",
        },
        Requirements: Requirements{
            MinVram:      10737418240, // 10 GB
            MinDiskSpace: 2147483648,  // 2 GB
        },
    },
    "xtts-v2": {
        Id:       "xtts-v2",
        Type:     ModelTypeXtts,
        Version:  "v2.0.3",
        Size:     1800000000,
        Checksum: "sha256:...",
        Url:      "https://huggingface.co/coqui/XTTS-v2/resolve/main/model.pth",
        Requirements: Requirements{
            MinVram:      4294967296, // 4 GB
            MinDiskSpace: 3221225472, // 3 GB
        },
    },
}
```

---

## Cache Management

### Cache Policy

```go
type CacheManager interface {
    // GetCacheSize returns total cache size in bytes
    GetCacheSize() appfault.Result[int64]
    
    // GetModelSize returns size of specific model
    GetModelSize(modelId string) appfault.Result[int64]
    
    // CleanOldModels removes models not used in given duration
    CleanOldModels(maxAge time.Duration) appfault.Result[int64]
    
    // SetMaxCacheSize sets maximum cache size (LRU eviction)
    SetMaxCacheSize(bytes int64) *appfault.AppError
    
    // GetLastUsed returns when model was last loaded
    GetLastUsed(modelId string) appfault.Result[time.Time]
    
    // UpdateLastUsed marks model as recently used
    UpdateLastUsed(modelId string) *appfault.AppError
}

type cacheManager struct {
    baseDir      string
    maxSize      int64
    usageTracker map[string]time.Time
    mu           sync.RWMutex
}

func (c *cacheManager) CleanOldModels(maxAge time.Duration) appfault.Result[int64] {
    c.mu.Lock()
    defer c.mu.Unlock()
    
    var freedBytes int64
    cutoff := time.Now().Add(-maxAge)
    
    for modelId, lastUsed := range c.usageTracker {
        if lastUsed.Before(cutoff) {
            size, _ := c.getModelSize(modelId)
            if err := c.deleteModel(modelId); err == nil {
                freedBytes += size
                delete(c.usageTracker, modelId)
            }
        }
    }
    
    return freedBytes, nil
}
```

### Manifest Tracking

```go
// Model manifest stored alongside each model
type ModelManifest struct {
    ModelId      string
    Version      string
    DownloadedAt time.Time
    LastUsedAt   time.Time
    Checksum     string
    Size         int64
    Quantization string    `json:",omitempty"`
    Source       string    // URL used
    Verified     bool
}
```

---

## CLI Commands

### Model Management

```bash
# List available models
ai-transcribe models list [--type whisper|xtts] [--installed]

# Download a model
ai-transcribe models download whisper-large-v3 [--force] [--mirror URL]

# Show model info
ai-transcribe models info whisper-large-v3

# Verify model integrity
ai-transcribe models verify whisper-large-v3

# Delete a model
ai-transcribe models delete whisper-medium

# Clean old models
ai-transcribe models clean [--older-than 30d] [--dry-run]

# Set default model
ai-transcribe models set-default --stt whisper-large-v3 --tts xtts-v2

# Check for updates
ai-transcribe models check-updates

# Show cache status
ai-transcribe models cache-status
```

### Output Examples

```
$ ai-transcribe models list --installed

INSTALLED MODELS
────────────────────────────────────────────────────────────────
MODEL                  TYPE      SIZE      LAST USED    STATUS
whisper-large-v3       STT       1.5 GB    2 hours ago  ✓ verified
whisper-medium         STT       769 MB    3 days ago   ✓ verified
xtts-v2                TTS       1.8 GB    1 hour ago   ✓ verified

Total: 4.1 GB used

$ ai-transcribe models download whisper-large-v3-turbo

Downloading whisper-large-v3-turbo (809 MB)...
[████████████████████░░░░░░░░░░] 67% | 542 MB | 12.3 MB/s | ETA: 22s

Verifying checksum... ✓
Model ready: ~/.ai-transcribe/models/whisper/large-v3-turbo/
```

---

## API Endpoints

### List Models

```
GET /api/v1/models
```

**Response:**
```json
{
  "Installed": [
    {
      "Id": "whisper-large-v3",
      "Type": "stt",
      "Version": "v3.0.0",
      "Size": 1550000000,
      "LastUsed": "2026-02-03T10:30:00Z",
      "IsDefault": true
    }
  ],
  "Available": [
    {
      "Id": "whisper-large-v3-turbo",
      "Type": "stt",
      "Version": "v3.0.0",
      "Size": 809000000,
      "IsInstalled": false
    }
  ]
}
```

### Download Model

```
POST /api/v1/models/{model_id}/download
```

**Request:**
```json
{
  "force": false,
  "priority": "normal"
}
```

**Response (streaming progress via SSE):**
```
event: progress
data: {"Status": "downloading", "Percent": 45, "Speed": 12300000}

event: progress
data: {"Status": "verifying", "Percent": 100}

event: complete
data: {"ModelId": "whisper-large-v3", "Path": "/models/whisper/large-v3"}
```

### Delete Model

```
DELETE /api/v1/models/{model_id}
```

### Verify Model

```
POST /api/v1/models/{model_id}/verify
```

---

## Quantization Support

### Available Quantizations

| Format | Size Reduction | Quality Impact | Use Case |
|--------|----------------|----------------|----------|
| fp32 | 0% | None | Maximum accuracy |
| fp16 | 50% | Minimal | Recommended default |
| int8 | 75% | Slight | Memory constrained |
| int4 | 87.5% | Moderate | Extreme memory limits |

### Auto-Selection

```go
func (d *modelDownloader) selectQuantization(modelId string, available []string) string {
    vram := d.detectVRAM()
    modelReq := d.registry.GetRequirements(modelId)
    
    // Try quantizations in order of quality
    for _, quant := range []string{"fp16", "int8", "int4"} {
        if contains(available, quant) {
            if vram >= modelReq.VRAMFor(quant) {
                return quant
            }
        }
    }
    
    return "int4" // Fallback to smallest
}
```

---

## Error Codes

| Code | Name | Description |
|------|------|-------------|
| 14470 | MODEL_NOT_FOUND | Model ID not in registry |
| 14471 | DOWNLOAD_FAILED | Network or server error |
| 14472 | CHECKSUM_MISMATCH | Downloaded file corrupted |
| 14473 | INSUFFICIENT_SPACE | Not enough disk space |
| 14474 | INSUFFICIENT_VRAM | Not enough GPU memory |
| 14475 | EXTRACTION_FAILED | Failed to extract archive |
| 14476 | MODEL_LOCKED | Model in use, cannot delete |
| 14477 | MIRROR_EXHAUSTED | All mirrors failed |
| 14478 | CACHE_CORRUPTED | Cache manifest invalid |

---

## Cross-References

| Reference | Location |
|-----------|----------|
| STT Providers | [03-stt-providers.md](./03-stt-providers.md) |
| TTS Providers | [04-tts-providers.md](./04-tts-providers.md) |
| Configuration | [11-configuration.md](./11-configuration.md) |
| Error Codes | [10-error-codes.md](./10-error-codes.md) |
| Voice Cloning | [07-voice-cloning.md](./07-voice-cloning.md) |
