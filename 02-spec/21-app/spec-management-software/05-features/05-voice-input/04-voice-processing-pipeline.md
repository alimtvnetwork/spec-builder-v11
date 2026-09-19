# Voice Processing Pipeline

**Version:** 2.0.0  
**Status:** Draft  
**Updated:** 2026-03-09  

---

## Overview

The Voice Processing Pipeline handles large audio inputs by saving files to the filesystem, chunking audio into segments, processing chunks in parallel via transcription AI, and storing results in a dedicated Voice database. This architecture addresses AI context window limitations for long-form audio.

**Cross-References:**
- [Voice Recorder](./01-voice-recorder.md)
- [Transcription Display](./02-transcription-display.md)
- [AI Integration](../06-ai-integration/00-overview.md)
- [Instruction System](../06-ai-integration/03-instruction-system.md)

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        VOICE PROCESSING PIPELINE                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐   │
│  │    Audio     │    │    Save to   │    │    Audio     │    │   Parallel   │   │
│  │    Input     │───▶│  Filesystem  │───▶│   Chunker    │───▶│ Transcriber  │   │
│  │  (Browser)   │    │  + Voice DB  │    │  (1-min)     │    │   (AI Pool)  │   │
│  └──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘   │
│                             │                   │                    │           │
│                             ▼                   ▼                    ▼           │
│                      ┌──────────────┐    ┌──────────────┐    ┌──────────────┐   │
│                      │   VoiceFile  │    │  VoiceChunk  │    │   Compiled   │   │
│                      │    (Root)    │    │   (Segments) │    │ Transcription│   │
│                      └──────────────┘    └──────────────┘    └──────────────┘   │
│                                                                      │           │
│                                                                      ▼           │
│                                                              ┌──────────────┐   │
│                                                              │   Ready for  │   │
│                                                              │  Instruction │   │
│                                                              │   Pipeline   │   │
│                                                              └──────────────┘   │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Filesystem Structure

```
{workDirectory}/
└── data/
    └── projects/
        └── {project_name}/
            └── voices/
                ├── 2026-01-29_001_a1b2c3d4.webm    # Original audio
                ├── 2026-01-29_001_a1b2c3d4/        # Chunks directory
                │   ├── chunk_001.webm              # 0:00 - 1:00
                │   ├── chunk_002.webm              # 1:00 - 2:00
                │   ├── chunk_003.webm              # 2:00 - 3:00
                │   └── ...
                ├── 2026-01-29_002_e5f6g7h8.webm    # Second recording
                └── 2026-01-29_002_e5f6g7h8/
                    └── ...
```

### File Naming Convention

| Component | Format | Example |
|-----------|--------|---------|
| Date | `YYYY-MM-DD` | `2026-01-29` |
| Sequence | `###` (3-digit, zero-padded) | `001`, `002` |
| ID | First 8 chars of UUID | `a1b2c3d4` |
| Full Name | `{date}_{seq}_{id}.{ext}` | `2026-01-29_001_a1b2c3d4.webm` |

---

## Database Schema (Voice.db)

### VoiceFile Table (Root Table)

```sql
CREATE TABLE VoiceFile (
    Id TEXT PRIMARY KEY,              -- UUID
    ProjectId TEXT NOT NULL,          -- Reference to project
    
    -- File Information
    OriginalFilePath TEXT NOT NULL,   -- Relative path to original audio
    FileName TEXT NOT NULL,           -- Original filename
    FileSizeBytes INTEGER NOT NULL,   -- File size in bytes
    DurationSeconds REAL NOT NULL,    -- Total duration
    MimeType TEXT NOT NULL,           -- audio/webm, audio/ogg, etc.
    
    -- Metadata
    Title TEXT,                       -- User-provided or AI-generated title
    Description TEXT,                 -- Brief description of content
    LanguageCode TEXT DEFAULT 'auto', -- ISO 639-3 code or 'auto' for detection
    
    -- Processing Status
    Status TEXT NOT NULL CHECK (Status IN (
        'uploaded',       -- File saved to filesystem
        'chunking',       -- Being split into segments
        'chunked',        -- Chunks created
        'transcribing',   -- Chunks being processed
        'transcribed',    -- All chunks done
        'compiling',      -- Combining transcriptions
        'completed',      -- Ready for use
        'failed'          -- Processing failed
    )) DEFAULT 'uploaded',
    
    -- Chunk Configuration
    ChunkDurationSeconds INTEGER DEFAULT 60,  -- Target chunk size
    TotalChunks INTEGER DEFAULT 0,            -- Number of chunks created
    
    -- Processing Metrics
    ProcessingStartedAt TEXT,
    ProcessingCompletedAt TEXT,
    ProcessingDurationMs INTEGER,
    
    -- Error Tracking
    ErrorMessage TEXT,
    RetryCount INTEGER DEFAULT 0,
    
    -- Timestamps
    RecordedAt TEXT,                  -- When audio was recorded (if known)
    CreatedAt TEXT NOT NULL DEFAULT (datetime('now')),
    UpdatedAt TEXT NOT NULL DEFAULT (datetime('now')),
    
    -- Sequence for ordering within project
    Sequence INTEGER NOT NULL,        -- Auto-incrementing per project
    
    FOREIGN KEY (ProjectId) REFERENCES Project(Id) ON DELETE CASCADE
);

CREATE INDEX IdxVoiceFileProjectId ON VoiceFile(ProjectId);
CREATE INDEX IdxVoiceFileStatus ON VoiceFile(Status);
CREATE INDEX IdxVoiceFileCreatedAt ON VoiceFile(CreatedAt DESC);
CREATE INDEX IdxVoiceFileSequence ON VoiceFile(ProjectId, Sequence);
```

### VoiceChunk Table (Segment Table)

```sql
CREATE TABLE VoiceChunk (
    Id TEXT PRIMARY KEY,              -- UUID
    VoiceFileId TEXT NOT NULL,        -- Parent voice file
    
    -- Chunk Information
    ChunkIndex INTEGER NOT NULL,      -- 1-based index
    ChunkFilePath TEXT NOT NULL,      -- Relative path to chunk file
    StartTimeSeconds REAL NOT NULL,   -- Start position in original
    EndTimeSeconds REAL NOT NULL,     -- End position in original
    DurationSeconds REAL NOT NULL,    -- Chunk duration
    FileSizeBytes INTEGER NOT NULL,   -- Chunk file size
    
    -- Transcription Status
    Status TEXT NOT NULL CHECK (Status IN (
        'pending',        -- Waiting to process
        'processing',     -- Being transcribed
        'completed',      -- Transcription done
        'failed'          -- Transcription failed
    )) DEFAULT 'pending',
    
    -- Transcription Result
    TranscribedText TEXT,             -- Raw transcription
    Confidence REAL,                  -- Transcription confidence (0-1)
    DetectedLanguage TEXT,            -- Detected language code
    
    -- Word-Level Timestamps (JSON array)
    WordTimestamps TEXT,              -- JSON: [{word, start, end}, ...]
    
    -- Processing Metrics
    TranscriptionStartedAt TEXT,
    TranscriptionCompletedAt TEXT,
    TranscriptionDurationMs INTEGER,
    TokensUsed INTEGER,               -- AI tokens consumed
    
    -- Model Used
    ModelId TEXT,                     -- Which voice model processed this
    
    -- Error Tracking
    ErrorMessage TEXT,
    RetryCount INTEGER DEFAULT 0,
    
    -- Timestamps
    CreatedAt TEXT NOT NULL DEFAULT (datetime('now')),
    UpdatedAt TEXT NOT NULL DEFAULT (datetime('now')),
    
    FOREIGN KEY (VoiceFileId) REFERENCES VoiceFile(Id) ON DELETE CASCADE
);

CREATE INDEX IdxVoiceChunkVoiceFileId ON VoiceChunk(VoiceFileId);
CREATE INDEX IdxVoiceChunkStatus ON VoiceChunk(Status);
CREATE INDEX IdxVoiceChunkChunkIndex ON VoiceChunk(VoiceFileId, ChunkIndex);
```

### VoiceTranscription Table (Compiled Result)

```sql
CREATE TABLE VoiceTranscription (
    Id TEXT PRIMARY KEY,              -- UUID
    VoiceFileId TEXT NOT NULL UNIQUE, -- One-to-one with VoiceFile
    
    -- Compiled Transcription
    FullText TEXT NOT NULL,           -- Complete combined transcription
    FormattedText TEXT,               -- With paragraph breaks, punctuation
    
    -- Word-Level Data (Combined from chunks)
    WordTimestamps TEXT,              -- JSON: [{word, start, end, chunkId}, ...]
    
    -- Summary (AI-generated)
    Summary TEXT,                     -- Brief summary of content
    Keywords TEXT,                    -- JSON: ["keyword1", "keyword2", ...]
    
    -- Statistics
    WordCount INTEGER NOT NULL,
    CharacterCount INTEGER NOT NULL,
    SentenceCount INTEGER,
    ParagraphCount INTEGER,
    
    -- Quality Metrics
    AverageConfidence REAL,           -- Average across all chunks
    LowConfidenceSegments TEXT,       -- JSON: [{start, end, text}, ...]
    
    -- Processing Info
    CompiledAt TEXT NOT NULL,
    CompilationDurationMs INTEGER,
    TotalTokensUsed INTEGER,          -- Sum of all chunk tokens
    
    -- Timestamps
    CreatedAt TEXT NOT NULL DEFAULT (datetime('now')),
    UpdatedAt TEXT NOT NULL DEFAULT (datetime('now')),
    
    FOREIGN KEY (VoiceFileId) REFERENCES VoiceFile(Id) ON DELETE CASCADE
);

CREATE INDEX IdxVoiceTranscriptionVoiceFileId ON VoiceTranscription(VoiceFileId);
```

---

## GORM Models (Go)

```go
package models

import (
    "time"
    "gorm.io/datatypes"
)

// VoiceFile represents the root voice recording
type VoiceFile struct {
    Id        string `gorm:"primaryKey;type:TEXT"`
    ProjectId string `gorm:"type:TEXT;not null;index"`
    Project   *Project `gorm:"foreignKey:ProjectId"`
    
    // File Information
    OriginalFilePath string  `gorm:"type:TEXT;not null"`
    FileName         string  `gorm:"type:TEXT;not null"`
    FileSizeBytes    int64   `gorm:"not null"`
    DurationSeconds  float64 `gorm:"not null"`
    MimeType         string  `gorm:"type:TEXT;not null"`
    
    // Metadata
    Title        *string `gorm:"type:TEXT"`
    Description  *string `gorm:"type:TEXT"`
    LanguageCode string  `gorm:"type:TEXT;default:'auto'"`
    
    // Processing Status
    Status string `gorm:"type:TEXT;not null;default:'uploaded';index"`
    
    // Chunk Configuration
    ChunkDurationSeconds int `gorm:"default:60"`
    TotalChunks          int `gorm:"default:0"`
    
    // Processing Metrics
    ProcessingStartedAt   *time.Time
    ProcessingCompletedAt *time.Time
    ProcessingDurationMs  *int
    
    // Error Tracking
    ErrorMessage *string `gorm:"type:TEXT"`
    RetryCount   int     `gorm:"default:0"`
    
    // Sequence
    Sequence int `gorm:"not null;index:IdxVoiceProjectSeq,priority:2"`
    
    // Timestamps
    RecordedAt *time.Time
    CreatedAt  time.Time `gorm:"not null;index"`
    UpdatedAt  time.Time `gorm:"not null"`
    
    // Relations
    Chunks       []VoiceChunk       `gorm:"foreignKey:VoiceFileId;constraint:OnDelete:CASCADE"`
    Transcription *VoiceTranscription `gorm:"foreignKey:VoiceFileId;constraint:OnDelete:CASCADE"`
}

// VoiceChunk represents a segment of the voice file
type VoiceChunk struct {
    Id          string `gorm:"primaryKey;type:TEXT"`
    VoiceFileId string `gorm:"type:TEXT;not null;index"`
    VoiceFile   *VoiceFile `gorm:"foreignKey:VoiceFileId"`
    
    // Chunk Information
    ChunkIndex       int     `gorm:"not null"`
    ChunkFilePath    string  `gorm:"type:TEXT;not null"`
    StartTimeSeconds float64 `gorm:"not null"`
    EndTimeSeconds   float64 `gorm:"not null"`
    DurationSeconds  float64 `gorm:"not null"`
    FileSizeBytes    int64   `gorm:"not null"`
    
    // Status
    Status string `gorm:"type:TEXT;not null;default:'pending';index"`
    
    // Transcription Result
    TranscribedText  *string  `gorm:"type:TEXT"`
    Confidence       *float64
    DetectedLanguage *string  `gorm:"type:TEXT"`
    
    // Word Timestamps (JSON)
    WordTimestamps datatypes.JSON `gorm:"type:TEXT"`
    
    // Processing Metrics
    TranscriptionStartedAt   *time.Time
    TranscriptionCompletedAt *time.Time
    TranscriptionDurationMs  *int
    TokensUsed               *int
    
    // Model
    ModelId *string `gorm:"type:TEXT"`
    
    // Error Tracking
    ErrorMessage *string `gorm:"type:TEXT"`
    RetryCount   int     `gorm:"default:0"`
    
    // Timestamps
    CreatedAt time.Time `gorm:"not null"`
    UpdatedAt time.Time `gorm:"not null"`
}

// VoiceTranscription represents the compiled transcription
type VoiceTranscription struct {
    Id          string `gorm:"primaryKey;type:TEXT"`
    VoiceFileId string `gorm:"type:TEXT;not null;uniqueIndex"`
    VoiceFile   *VoiceFile `gorm:"foreignKey:VoiceFileId"`
    
    // Compiled Text
    FullText      string  `gorm:"type:TEXT;not null"`
    FormattedText *string `gorm:"type:TEXT"`
    
    // Word Data
    WordTimestamps datatypes.JSON `gorm:"type:TEXT"`
    
    // Summary
    Summary  *string        `gorm:"type:TEXT"`
    Keywords datatypes.JSON `gorm:"type:TEXT"`
    
    // Statistics
    WordCount      int `gorm:"not null"`
    CharacterCount int `gorm:"not null"`
    SentenceCount  *int
    ParagraphCount *int
    
    // Quality
    AverageConfidence     *float64
    LowConfidenceSegments datatypes.JSON `gorm:"type:TEXT"`
    
    // Processing
    CompiledAt           time.Time `gorm:"not null"`
    CompilationDurationMs *int
    TotalTokensUsed      *int
    
    // Timestamps
    CreatedAt time.Time `gorm:"not null"`
    UpdatedAt time.Time `gorm:"not null"`
}
```

---

## Audio Chunking (Golang)

### Required Libraries

| Library | Purpose | Import Path |
|---------|---------|-------------|
| **go-audio/audio** | Audio data structures | `github.com/go-audio/audio` |
| **go-audio/wav** | WAV encoding/decoding | `github.com/go-audio/wav` |
| **hajimehoshi/oto** | Audio playback (optional) | `github.com/hajimehoshi/oto/v2` |
| **faiface/beep** | Audio processing toolkit | `github.com/faiface/beep` |
| **faiface/beep/mp3** | MP3 support | `github.com/faiface/beep/mp3` |
| **faiface/beep/wav** | WAV support | `github.com/faiface/beep/wav` |
| **zaf/resample** | Sample rate conversion | `github.com/zaf/resample` |

### FFmpeg Integration (Recommended)

For production-grade audio processing, use FFmpeg via CLI wrapper:

```go
package audio

import (
    "context"
    "fmt"
    "os/exec"
    "path/filepath"
    "strconv"
)

// ChunkerConfig holds chunking configuration
type ChunkerConfig struct {
    ChunkDurationSeconds int    // Target chunk duration (default: 60)
    OutputFormat         string // Output format: "wav", "mp3", "webm"
    SampleRate           int    // Target sample rate (default: 16000)
    Channels             int    // Number of channels (default: 1 = mono)
    FFmpegPath           string // Path to ffmpeg binary
}

// DefaultChunkerConfig returns sensible defaults
func DefaultChunkerConfig() ChunkerConfig {
    return ChunkerConfig{
        ChunkDurationSeconds: 60,
        OutputFormat:         "wav",
        SampleRate:           16000,
        Channels:             1,
        FFmpegPath:           "ffmpeg",
    }
}

// AudioChunker splits audio files into segments
type AudioChunker struct {
    config ChunkerConfig
}

// NewAudioChunker creates a new chunker
func NewAudioChunker(config ChunkerConfig) *AudioChunker {
    return &AudioChunker{config: config}
}

// AudioMetadata contains audio file information
type AudioMetadata struct {
    DurationSeconds float64
    SampleRate      int
    Channels        int
    Bitrate         int
    Format          string
}

// GetMetadata extracts audio metadata using ffprobe
func (c *AudioChunker) GetMetadata(context stdctx.Context, filePath string) apperror.Result[AudioMetadata] {
    cmd := exec.CommandContext(context, "ffprobe",
        "-v", "quiet",
        "-print_format", "json",
        "-show_format",
        "-show_streams",
        filePath,
    )
    
    output, err := cmd.Output()
    if err != nil {
        return apperror.Fail[AudioMetadata](
            apperror.Wrap(err, apperror.ErrExternalCommand, "ffprobe failed"),
        )
    }
    
    // Parse JSON output and extract metadata
    // ... (parsing implementation)
    
    return apperror.Ok(AudioMetadata{})
}

// ChunkResult represents a single chunk
type ChunkResult struct {
    Index            int
    FilePath         string
    StartTimeSeconds float64
    EndTimeSeconds   float64
    DurationSeconds  float64
    FileSizeBytes    int64
}

// ChunkAudio splits audio into segments
func (c *AudioChunker) ChunkAudio(
    context stdctx.Context,
    inputPath string,
    outputDir string,
    totalDuration float64,
) apperror.Result[[]ChunkResult] {
    var chunks []ChunkResult
    chunkIndex := 1
    currentTime := 0.0
    
    for currentTime < totalDuration {
        endTime := currentTime + float64(c.config.ChunkDurationSeconds)
        if endTime > totalDuration {
            endTime = totalDuration
        }
        
        chunkFileName := fmt.Sprintf("chunk_%03d.%s", chunkIndex, c.config.OutputFormat)
        chunkPath := filepath.Join(outputDir, chunkFileName)
        
        // FFmpeg command to extract segment
        args := []string{
            "-i", inputPath,
            "-ss", fmt.Sprintf("%.3f", currentTime),
            "-t", fmt.Sprintf("%.3f", endTime-currentTime),
            "-ar", strconv.Itoa(c.config.SampleRate),
            "-ac", strconv.Itoa(c.config.Channels),
            "-y", // Overwrite
            chunkPath,
        }
        
        cmd := exec.CommandContext(context, c.config.FFmpegPath, args...)
        if err := cmd.Run(); err != nil {
            return apperror.Fail[[]ChunkResult](
                apperror.Wrap(err, apperror.ErrExternalCommand, "chunk failed"),
            )
        }
        
        // Get chunk file size
        info, _ := pathutil.Stat(chunkPath)
        
        chunks = append(chunks, ChunkResult{
            Index:            chunkIndex,
            FilePath:         chunkPath,
            StartTimeSeconds: currentTime,
            EndTimeSeconds:   endTime,
            DurationSeconds:  endTime - currentTime,
            FileSizeBytes:    info.Size(),
        })
        
        chunkIndex++
        currentTime = endTime
    }
    
    return apperror.Ok(chunks)
}
```

### Pure Go Alternative (go-audio)

```go
package audio

import (
    "io"
    "os"
    
    "github.com/go-audio/audio"
    "github.com/go-audio/wav"
)

// PureGoChunker uses pure Go libraries (no FFmpeg dependency)
type PureGoChunker struct {
    chunkSamples int // Samples per chunk
}

// ChunkWav splits a WAV file using pure Go
func (c *PureGoChunker) ChunkWav(inputPath, outputDir string) apperror.Result[[]ChunkResult] {
    f, err := pathutil.OpenFile(inputPath)
    if err != nil {
        return apperror.Fail[[]ChunkResult](err)
    }
    defer f.Close()
    
    decoder := wav.NewDecoder(f)
    if decoder.IsInvalidFile() {
        return apperror.Fail[[]ChunkResult](
            apperror.New(apperror.ErrInvalidInput, "invalid WAV file"),
        )
    }
    
    sampleRate := decoder.SampleRate
    samplesPerChunk := sampleRate * 60 // 60 seconds
    
    var chunks []ChunkResult
    chunkIndex := 1
    
    for {
        // Read chunk of samples
        buf := &audio.IntBuffer{
            Data:   make([]int, samplesPerChunk),
            Format: decoder.Format(),
        }
        
        n, err := decoder.PCMBuffer(buf)
        if n == 0 || err == io.EOF {
            break
        }
        
        // Write chunk to file
        chunkPath := filepath.Join(outputDir, fmt.Sprintf("chunk_%03d.wav", chunkIndex))
        if err := c.writeWav(chunkPath, buf, sampleRate); err != nil {
            return apperror.Fail[[]ChunkResult](err)
        }
        
        chunks = append(chunks, ChunkResult{
            Index:    chunkIndex,
            FilePath: chunkPath,
            // ... calculate times
        })
        
        chunkIndex++
    }
    
    return apperror.Ok(chunks)
}
```

---

## Parallel Transcription Service

```go
package voice

import (
    "context"
    "sync"
    "time"
    
    "golang.org/x/sync/errgroup"
)

// TranscriptionConfig configures parallel processing
type TranscriptionConfig struct {
    MaxParallelWorkers int           // Concurrent transcription workers
    RequestTimeout     time.Duration // Per-chunk timeout
    RetryAttempts      int           // Retries on failure
    RetryDelay         time.Duration // Delay between retries
}

// DefaultTranscriptionConfig returns sensible defaults
func DefaultTranscriptionConfig() TranscriptionConfig {
    return TranscriptionConfig{
        MaxParallelWorkers: 4,
        RequestTimeout:     120 * time.Second,
        RetryAttempts:      3,
        RetryDelay:         5 * time.Second,
    }
}

// TranscriptionResult from AI model
type TranscriptionResult struct {
    ChunkId          string
    Text             string
    Confidence       float64
    DetectedLanguage string
    WordTimestamps   []WordTimestamp
    TokensUsed       int
    DurationMs       int
}

// WordTimestamp represents word-level timing
type WordTimestamp struct {
    Word  string
    Start float64 // Seconds from chunk start
    End   float64
}

// ParallelTranscriber processes chunks concurrently
type ParallelTranscriber struct {
    config      TranscriptionConfig
    aiService   AIVoiceService
    voiceRepo   VoiceRepository
    eventBus    EventBus
}

// NewParallelTranscriber creates a new transcriber
func NewParallelTranscriber(
    config TranscriptionConfig,
    aiService AIVoiceService,
    voiceRepo VoiceRepository,
    eventBus EventBus,
) *ParallelTranscriber {
    return &ParallelTranscriber{
        config:    config,
        aiService: aiService,
        voiceRepo: voiceRepo,
        eventBus:  eventBus,
    }
}

// TranscribeChunks processes all chunks in parallel
func (t *ParallelTranscriber) TranscribeChunks(
    context stdctx.Context,
    voiceFileId string,
    chunks []VoiceChunk,
) apperror.Result[[]TranscriptionResult] {
    // Update voice file status
    t.voiceRepo.UpdateVoiceFileStatus(context, voiceFileId, "transcribing")
    
    // Create worker pool
    g, groupContext := errgroup.WithContext(context)
    g.SetLimit(t.config.MaxParallelWorkers)
    
    // Results channel
    resultsChan := make(chan TranscriptionResult, len(chunks))
    
    // Process each chunk
    for _, chunk := range chunks {
        chunk := chunk // Capture for goroutine
        
        g.Go(func() error {
            result, err := t.transcribeChunk(groupContext, chunk)
            if err != nil {
                return err
            }
            resultsChan <- *result
            return nil
        })
    }
    
    // Wait for all chunks
    if err := g.Wait(); err != nil {
        t.voiceRepo.UpdateVoiceFileError(context, voiceFileId, err.Error())
        return apperror.Fail[[]TranscriptionResult](
            apperror.Wrap(err, apperror.ErrTranscription, "transcription failed"),
        )
    }
    close(resultsChan)
    
    // Collect results
    var results []TranscriptionResult
    for result := range resultsChan {
        results = append(results, result)
    }
    
    // Sort by chunk index
    sort.Slice(results, func(i, j int) bool {
        return results[i].ChunkId < results[j].ChunkId
    })
    
    return apperror.Ok(results)
}

// --- Typed Event Payloads (no interface{} or map[string]any) ---

type VoiceChunkStartedEvent struct {
    ChunkId string
    Index   int
}

type VoiceChunkCompletedEvent struct {
    ChunkId    string
    Index      int
    DurationMs int
}

type VoiceChunkFailedEvent struct {
    ChunkId string
    Error   string
}

type VoiceTranscriptionCompletedEvent struct {
    VoiceFileId string
    WordCount   int
    DurationMs  int
}

type VoiceFileCreatedEvent struct {
    VoiceFileId string
    ProjectId   string
    Duration    float64
}

type VoiceChunkingCompletedEvent struct {
    VoiceFileId string
    TotalChunks int
}

type VoiceProcessingCompletedEvent struct {
    VoiceFileId string
    WordCount   int
    DurationMs  int
    TotalChunks int
}

// transcribeChunk processes a single chunk with retries
func (t *ParallelTranscriber) transcribeChunk(
    context stdctx.Context,
    chunk VoiceChunk,
) apperror.Result[TranscriptionResult] {
    // Update chunk status
    t.voiceRepo.UpdateChunkStatus(context, chunk.Id, "processing")
    t.eventBus.Publish("voice:chunk:started", VoiceChunkStartedEvent{
        ChunkId: chunk.Id,
        Index:   chunk.ChunkIndex,
    })
    
    startTime := time.Now()
    
    var lastErr error
    for attempt := 0; attempt <= t.config.RetryAttempts; attempt++ {
        if attempt > 0 {
            time.Sleep(t.config.RetryDelay)
        }
        
        // Read chunk audio file
        audioData, err := pathutil.ReadFile(chunk.ChunkFilePath)
        if err != nil {
            lastErr = err
            continue
        }
        
        // Call AI voice model
        timeoutContext, cancel := stdctx.WithTimeout(context, t.config.RequestTimeout)
        result, err := t.aiService.Transcribe(timeoutContext, TranscribeRequest{
            AudioData:    audioData,
            LanguageHint: chunk.VoiceFile.LanguageCode,
            EnableWordTimestamps: true,
        })
        cancel()
        
        if err != nil {
            lastErr = err
            continue
        }
        
        // Success - save result
        duration := int(time.Since(startTime).Milliseconds())
        
        t.voiceRepo.UpdateChunkTranscription(context, chunk.Id, UpdateChunkRequest{
            Status:           "completed",
            TranscribedText:  result.Text,
            Confidence:       result.Confidence,
            DetectedLanguage: result.Language,
            WordTimestamps:   result.Words,
            TokensUsed:       result.TokensUsed,
            DurationMs:       duration,
        })
        
        t.eventBus.Publish("voice:chunk:completed", VoiceChunkCompletedEvent{
            ChunkId:    chunk.Id,
            Index:      chunk.ChunkIndex,
            DurationMs: duration,
        })
        
        return apperror.Ok(TranscriptionResult{
            ChunkId:          chunk.Id,
            Text:             result.Text,
            Confidence:       result.Confidence,
            DetectedLanguage: result.Language,
            WordTimestamps:   result.Words,
            TokensUsed:       result.TokensUsed,
            DurationMs:       duration,
        })
    }
    
    // All retries failed
    t.voiceRepo.UpdateChunkError(context, chunk.Id, lastErr.Error())
    t.eventBus.Publish("voice:chunk:failed", VoiceChunkFailedEvent{
        ChunkId: chunk.Id,
        Error:   lastErr.Error(),
    })
    
    return apperror.Fail[TranscriptionResult](
        apperror.Wrap(lastErr, apperror.ErrTranscription, "chunk failed after all attempts"),
    )
}
```

---

## Transcription Compiler

```go
package voice

import (
     stdctx "context"
    "sort"
    "strings"
    "time"
)

// TranscriptionCompiler combines chunk transcriptions
type TranscriptionCompiler struct {
    voiceRepo VoiceRepository
    eventBus  EventBus
}

// CompileTranscription combines all chunks into final transcription
func (c *TranscriptionCompiler) CompileTranscription(
    context stdctx.Context,
    voiceFileId string,
) apperror.Result[VoiceTranscription] {
    // Update status
    c.voiceRepo.UpdateVoiceFileStatus(context, voiceFileId, "compiling")
    startTime := time.Now()
    
    // Get all chunks in order
    chunks, err := c.voiceRepo.GetChunksByVoiceFileId(context, voiceFileId)
    if err != nil {
        return apperror.Fail[VoiceTranscription](err)
    }
    
    // Sort by index
    sort.Slice(chunks, func(i, j int) bool {
        return chunks[i].ChunkIndex < chunks[j].ChunkIndex
    })
    
    // Combine transcriptions
    var textParts []string
    var allWords []WordTimestampWithChunk
    var totalTokens int
    var totalConfidence float64
    
    for _, chunk := range chunks {
        if chunk.TranscribedText != nil {
            textParts = append(textParts, *chunk.TranscribedText)
        }
        
        // Adjust word timestamps to absolute time
        if chunk.WordTimestamps != nil {
            var words []WordTimestamp
            json.Unmarshal(chunk.WordTimestamps, &words)
            
            for _, word := range words {
                allWords = append(allWords, WordTimestampWithChunk{
                    Word:    word.Word,
                    Start:   chunk.StartTimeSeconds + word.Start,
                    End:     chunk.StartTimeSeconds + word.End,
                    ChunkId: chunk.Id,
                })
            }
        }
        
        if chunk.TokensUsed != nil {
            totalTokens += *chunk.TokensUsed
        }
        if chunk.Confidence != nil {
            totalConfidence += *chunk.Confidence
        }
    }
    
    // Compile full text
    fullText := strings.Join(textParts, " ")
    
    // Calculate statistics
    wordCount := len(strings.Fields(fullText))
    charCount := len(fullText)
    avgConfidence := totalConfidence / float64(len(chunks))
    
    // Create transcription record
    transcription := &VoiceTranscription{
        Id:                uuid.New().String(),
        VoiceFileId:       voiceFileId,
        FullText:          fullText,
        FormattedText:     c.formatText(fullText),
        WordTimestamps:    allWords,
        WordCount:         wordCount,
        CharacterCount:    charCount,
        AverageConfidence: &avgConfidence,
        TotalTokensUsed:   &totalTokens,
        CompiledAt:        time.Now(),
        CompilationDurationMs: int(time.Since(startTime).Milliseconds()),
    }
    
    // Save transcription
    if err := c.voiceRepo.CreateTranscription(context, transcription); err != nil {
        return apperror.Fail[VoiceTranscription](err)
    }
    
    // Update voice file status
    c.voiceRepo.UpdateVoiceFileStatus(context, voiceFileId, "completed")
    
    c.eventBus.Publish("voice:transcription:completed", VoiceTranscriptionCompletedEvent{
        VoiceFileId: voiceFileId,
        WordCount:   wordCount,
        DurationMs:  transcription.CompilationDurationMs,
    })
    
    return apperror.Ok(*transcription)
}

// formatText adds paragraph breaks and improves readability
func (c *TranscriptionCompiler) formatText(text string) *string {
    // Split into sentences and group into paragraphs
    // Add proper punctuation and capitalization
    formatted := text // Placeholder - implement NLP-based formatting
    return &formatted
}
```

---

## Voice Processing Service (Main Orchestrator)

```go
package voice

import (
    "context"
    "os"
    "path/filepath"
    "time"
    
    "github.com/google/uuid"
)

// VoiceProcessingService orchestrates the entire pipeline
type VoiceProcessingService struct {
    config     VoiceConfig
    pathMgr    PathManager
    chunker    *AudioChunker
    transcriber *ParallelTranscriber
    compiler   *TranscriptionCompiler
    voiceRepo  VoiceRepository
    eventBus   EventBus
}

// VoiceConfig holds service configuration
type VoiceConfig struct {
    ChunkDurationSeconds int
    MaxParallelWorkers   int
    SupportedFormats     []string // webm, wav, mp3, ogg
    MaxFileSizeMB        int
    TempDirectory        string
}

// ProcessVoiceInput handles the complete voice processing pipeline
func (s *VoiceProcessingService) ProcessVoiceInput(
    context stdctx.Context,
    projectId string,
    audioData []byte,
    fileName string,
    options ProcessOptions,
) apperror.Result[VoiceFile] {
    // 1. Validate input
    if err := s.validateInput(audioData, fileName); err != nil {
        return apperror.Fail[VoiceFile](err)
    }
    
    // 2. Generate file metadata
    voiceId := uuid.New().String()
    shortId := voiceId[:8]
    today := time.Now().Format("2006-01-02")
    sequence := s.getNextSequence(context, projectId)
    
    // 3. Build file paths
    projectName := s.getProjectName(context, projectId)
    voiceFileName := fmt.Sprintf("%s_%03d_%s%s", 
        today, sequence, shortId, filepath.Ext(fileName))
    
    relativePath := filepath.Join("data", "projects", projectName, "voices", voiceFileName)
    absolutePath := s.pathMgr.GetAbsolutePath(relativePath)
    
    // 4. Ensure directory exists
    voiceDir := filepath.Dir(absolutePath)
    err := pathutil.EnsureDir(voiceDir)
    if err != nil {
        return apperror.Fail[VoiceFile](err)
    }
    
    // 5. Save audio file
    err = pathutil.WriteFile(absolutePath, audioData)
    if err != nil {
        return apperror.Fail[VoiceFile](err)
    }
    
    // 6. Get audio metadata
    metadataResult := s.chunker.GetMetadata(context, absolutePath)
    if metadataResult.IsError() {
        return apperror.Fail[VoiceFile](metadataResult.Error)
    }
    metadata := metadataResult.Value
    
    // 7. Create VoiceFile record
    voiceFile := &VoiceFile{
        Id:                   voiceId,
        ProjectId:            projectId,
        OriginalFilePath:     relativePath,
        FileName:             fileName,
        FileSizeBytes:        int64(len(audioData)),
        DurationSeconds:      metadata.DurationSeconds,
        MimeType:             getMimeType(fileName),
        Title:                options.Title,
        Description:          options.Description,
        LanguageCode:         options.LanguageCode,
        Status:               "uploaded",
        ChunkDurationSeconds: s.config.ChunkDurationSeconds,
        Sequence:             sequence,
        RecordedAt:           options.RecordedAt,
        CreatedAt:            time.Now(),
        UpdatedAt:            time.Now(),
    }
    
    if err := s.voiceRepo.CreateVoiceFile(context, voiceFile); err != nil {
        return apperror.Fail[VoiceFile](err)
    }
    
    s.eventBus.Publish("voice:file:created", VoiceFileCreatedEvent{
        VoiceFileId: voiceId,
        ProjectId:   projectId,
        Duration:    metadata.DurationSeconds,
    })
    
    // 8. Start async processing pipeline
    go s.processVoiceAsync(stdctx.Background(), voiceFile)
    
    return apperror.Ok(*voiceFile)
}

// processVoiceAsync runs chunking, transcription, and compilation
func (s *VoiceProcessingService) processVoiceAsync(
    context stdctx.Context,
    voiceFile *VoiceFile,
) {
    defer func() {
        if r := recover(); r != nil {
            s.voiceRepo.UpdateVoiceFileError(context, voiceFile.Id, fmt.Sprint(r))
        }
    }()
    
    startTime := time.Now()
    s.voiceRepo.UpdateVoiceFileProcessingStart(context, voiceFile.Id)
    
    // 1. CHUNK: Split audio into segments
    s.voiceRepo.UpdateVoiceFileStatus(context, voiceFile.Id, "chunking")
    
    absolutePath := s.pathMgr.GetAbsolutePath(voiceFile.OriginalFilePath)
    chunksDir := absolutePath[:len(absolutePath)-len(filepath.Ext(absolutePath))]
    
    if err := pathutil.EnsureDir(chunksDir); err != nil {
        s.voiceRepo.UpdateVoiceFileError(context, voiceFile.Id, err.Error())
        return
    }
    
    chunkResults, err := s.chunker.ChunkAudio(context, 
        absolutePath, chunksDir, voiceFile.DurationSeconds)
    if err != nil {
        s.voiceRepo.UpdateVoiceFileError(context, voiceFile.Id, err.Error())
        return
    }
    
    // Save chunk records to database
    var chunks []VoiceChunk
    for _, cr := range chunkResults {
        chunk := VoiceChunk{
            Id:               uuid.New().String(),
            VoiceFileId:      voiceFile.Id,
            ChunkIndex:       cr.Index,
            ChunkFilePath:    s.pathMgr.GetRelativePath(cr.FilePath),
            StartTimeSeconds: cr.StartTimeSeconds,
            EndTimeSeconds:   cr.EndTimeSeconds,
            DurationSeconds:  cr.DurationSeconds,
            FileSizeBytes:    cr.FileSizeBytes,
            Status:           "pending",
            CreatedAt:        time.Now(),
            UpdatedAt:        time.Now(),
        }
        chunks = append(chunks, chunk)
    }
    
    if err := s.voiceRepo.CreateChunks(context, chunks); err != nil {
        s.voiceRepo.UpdateVoiceFileError(context, voiceFile.Id, err.Error())
        return
    }
    
    s.voiceRepo.UpdateVoiceFileTotalChunks(context, voiceFile.Id, len(chunks))
    s.voiceRepo.UpdateVoiceFileStatus(context, voiceFile.Id, "chunked")
    
    s.eventBus.Publish("voice:chunking:completed", VoiceChunkingCompletedEvent{
        VoiceFileId: voiceFile.Id,
        TotalChunks: len(chunks),
    })
    
    // 2. TRANSCRIBE: Process chunks in parallel
    results, err := s.transcriber.TranscribeChunks(context, voiceFile.Id, chunks)
    if err != nil {
        s.voiceRepo.UpdateVoiceFileError(context, voiceFile.Id, err.Error())
        return
    }
    
    s.voiceRepo.UpdateVoiceFileStatus(context, voiceFile.Id, "transcribed")
    
    // 3. COMPILE: Combine transcriptions
    transcription, err := s.compiler.CompileTranscription(context, voiceFile.Id)
    if err != nil {
        s.voiceRepo.UpdateVoiceFileError(context, voiceFile.Id, err.Error())
        return
    }
    
    // 4. Update final status
    processingDuration := int(time.Since(startTime).Milliseconds())
    s.voiceRepo.UpdateVoiceFileComplete(context, voiceFile.Id, processingDuration)
    
    s.eventBus.Publish("voice:processing:completed", VoiceProcessingCompletedEvent{
        VoiceFileId: voiceFile.Id,
        WordCount:   transcription.WordCount,
        DurationMs:  processingDuration,
        TotalChunks: len(chunks),
    })
}
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/projects/{projectId}/voices` | Upload voice file |
| GET | `/api/v1/projects/{projectId}/voices` | List project voices |
| GET | `/api/v1/voices/{voiceId}` | Get voice details |
| GET | `/api/v1/voices/{voiceId}/chunks` | Get voice chunks |
| GET | `/api/v1/voices/{voiceId}/transcription` | Get compiled transcription |
| DELETE | `/api/v1/voices/{voiceId}` | Delete voice and files |
| POST | `/api/v1/voices/{voiceId}/retry` | Retry failed processing |

---

## WebSocket Events

| Event | Direction | Payload |
|-------|-----------|---------|
| `voice:file:created` | Server→Client | `{voiceFileId, projectId, duration}` |
| `voice:chunking:started` | Server→Client | `{voiceFileId}` |
| `voice:chunking:completed` | Server→Client | `{voiceFileId, totalChunks}` |
| `voice:chunk:started` | Server→Client | `{chunkId, index}` |
| `voice:chunk:completed` | Server→Client | `{chunkId, index, durationMs}` |
| `voice:chunk:failed` | Server→Client | `{chunkId, error}` |
| `voice:transcription:completed` | Server→Client | `{voiceFileId, wordCount}` |
| `voice:processing:completed` | Server→Client | `{voiceFileId, wordCount, durationMs}` |
| `voice:processing:failed` | Server→Client | `{voiceFileId, error}` |

---

## Error Codes

| Code | Constant | Description |
|------|----------|-------------|
| 7010 | `ErrVoiceFileTooLarge` | Audio file exceeds size limit |
| 7011 | `ErrVoiceUnsupportedFormat` | Unsupported audio format |
| 7012 | `ErrVoiceSaveFailed` | Failed to save audio file |
| 7013 | `ErrVoiceChunkingFailed` | Audio chunking failed |
| 7014 | `ErrVoiceTranscriptionFailed` | Transcription failed |
| 7015 | `ErrVoiceCompilationFailed` | Transcription compilation failed |
| 7016 | `ErrVoiceNotFound` | Voice file not found |
| 7017 | `ErrVoiceFfmpegNotAvailable` | FFmpeg not installed |
| 7018 | `ErrVoiceInvalidDuration` | Invalid audio duration |
| 7019 | `ErrVoiceProjectNotFound` | Project not found |

---

## Configuration Keys

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `voice.chunk.durationSeconds` | int | 60 | Target chunk duration |
| `voice.chunk.minDurationSeconds` | int | 5 | Minimum chunk to process |
| `voice.parallel.maxWorkers` | int | 4 | Concurrent transcription workers |
| `voice.transcription.timeoutSeconds` | int | 120 | Per-chunk timeout |
| `voice.transcription.retryAttempts` | int | 3 | Retry count on failure |
| `voice.file.maxSizeMB` | int | 500 | Maximum file size |
| `voice.file.supportedFormats` | []string | ["webm","wav","mp3","ogg"] | Allowed formats |
| `voice.storage.basePath` | string | "data/projects" | Base storage path |
| `voice.ffmpeg.path` | string | "ffmpeg" | FFmpeg binary path |

---

## Related Specifications

- [Voice Recorder](./01-voice-recorder.md)
- [Transcription Display](./02-transcription-display.md)
- [Audio Player](./03-audio-player.md)
- [Instruction System](../06-ai-integration/03-instruction-system.md)
- [AI Integration](../06-ai-integration/00-overview.md)
