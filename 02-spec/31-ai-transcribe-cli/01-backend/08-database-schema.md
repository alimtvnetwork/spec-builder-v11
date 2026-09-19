# AI Transcribe CLI: Database Schema

**Version:** 2.0.0  
**Status:** Draft  
**Updated:** 2026-03-09  

---

## Overview

AI Transcribe CLI uses SQLite databases with a split architecture:
- **Root Database** (`transcribe.db`): Global configuration, model registry, voice library
- **Project Databases** (`{project}/voice/{conversation-id}.db`): Per-conversation transcripts and audio events

---

## Database Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         AI Transcribe Database Layer                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                        Root Database (transcribe.db)                    │ │
│  │                                                                         │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌────────────────────────────┐   │ │
│  │  │   Config     │  │   Models     │  │        Voices              │   │ │
│  │  │   Settings   │  │   Registry   │  │     (Cloned + Built-in)    │   │ │
│  │  └──────────────┘  └──────────────┘  └────────────────────────────┘   │ │
│  │                                                                         │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌────────────────────────────┐   │ │
│  │  │  Providers   │  │   Sessions   │  │       UsageMetrics         │   │ │
│  │  │   Config     │  │   Index      │  │      (Quotas/Billing)      │   │ │
│  │  └──────────────┘  └──────────────┘  └────────────────────────────┘   │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │              Project Databases ({project}/voice/{id}.db)               │ │
│  │                                                                         │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌────────────────────────────┐   │ │
│  │  │ Transcripts  │  │    Words     │  │        Segments            │   │ │
│  │  │              │  │  (Timestamped)│  │     (Speaker-labeled)     │   │ │
│  │  └──────────────┘  └──────────────┘  └────────────────────────────┘   │ │
│  │                                                                         │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌────────────────────────────┐   │ │
│  │  │ AudioEvents  │  │  Speakers    │  │      VoiceCommands         │   │ │
│  │  │(Laughter,etc)│  │  (Diarized)  │  │    (Detected Actions)      │   │ │
│  │  └──────────────┘  └──────────────┘  └────────────────────────────┘   │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Root Database Schema

### Configuration Table

```sql
CREATE TABLE Config (
    Key TEXT PRIMARY KEY,
    Value TEXT NOT NULL,
    ValueType TEXT NOT NULL DEFAULT 'string',  -- 'string', 'int', 'float', 'bool', 'json'
    Category TEXT NOT NULL DEFAULT 'general',
    Description TEXT,
    CreatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Default configuration entries
INSERT INTO Config (Key, Value, ValueType, Category, Description) VALUES
    ('DefaultSttProvider', 'whisper', 'string', 'providers', 'Primary STT provider'),
    ('DefaultTtsProvider', 'xtts', 'string', 'providers', 'Primary TTS provider'),
    ('EnableFallback', 'true', 'bool', 'providers', 'Auto-fallback on provider failure'),
    ('FallbackTimeoutMs', '5000', 'int', 'providers', 'Timeout before fallback (ms)'),
    ('MaxConcurrentSessions', '10', 'int', 'performance', 'Maximum concurrent transcription sessions'),
    ('AudioBufferSizeMB', '50', 'int', 'performance', 'Ring buffer size for audio'),
    ('DefaultLanguage', 'en', 'string', 'transcription', 'Default transcription language'),
    ('EnableVAD', 'true', 'bool', 'transcription', 'Enable Voice Activity Detection'),
    ('VADThreshold', '0.5', 'float', 'transcription', 'VAD sensitivity threshold'),
    ('DefaultVoiceId', 'en_male_1', 'string', 'tts', 'Default TTS voice');
```

### Models Registry

```sql
CREATE TABLE Models (
    Id TEXT PRIMARY KEY,
    Name TEXT NOT NULL,
    Type TEXT NOT NULL,                    -- 'stt', 'tts', 'vad'
    Provider TEXT NOT NULL,                -- 'whisper', 'xtts', 'silero'
    Version TEXT NOT NULL,
    FilePath TEXT NOT NULL,                -- Path to model file
    FileSize INTEGER NOT NULL,             -- Bytes
    FileHash TEXT NOT NULL,                -- SHA256 hash
    DownloadUrl TEXT,                      -- Source URL
    Status TEXT NOT NULL DEFAULT 'available', -- 'available', 'downloading', 'corrupted'
    Capabilities TEXT,                     -- JSON: supported languages, features
    ResourceRequirements TEXT,             -- JSON: VRAM, RAM, CPU
    CreatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    LastUsedAt TEXT
);

CREATE INDEX IdxModelsType ON Models(Type);
CREATE INDEX IdxModelsProvider ON Models(Provider);

-- Example entries
INSERT INTO Models (Id, Name, Type, Provider, Version, FilePath, FileSize, FileHash, Capabilities) VALUES
    ('whisper-base-en', 'Whisper Base English', 'stt', 'whisper', '1.0', 
     'models/whisper-base.en.bin', 147951465, 'abc123...', 
     '{"languages": ["en"], "features": ["transcribe"]}'),
    ('whisper-medium', 'Whisper Medium Multilingual', 'stt', 'whisper', '1.0',
     'models/whisper-medium.bin', 769197747, 'def456...',
     '{"languages": ["multi"], "features": ["transcribe", "translate"]}'),
    ('xtts-v2', 'XTTS v2', 'tts', 'xtts', '2.0',
     'models/xtts-v2/', 1897422848, 'ghi789...',
     '{"languages": ["multi"], "features": ["clone", "stream"]}'),
    ('silero-vad', 'Silero VAD', 'vad', 'silero', '4.0',
     'models/silero_vad.onnx', 2097152, 'jkl012...',
     '{"sample_rates": [8000, 16000]}');
```

### Provider Configuration

```sql
CREATE TABLE Providers (
    Id TEXT PRIMARY KEY,
    Name TEXT NOT NULL UNIQUE,
    Type TEXT NOT NULL,                    -- 'stt', 'tts'
    IsLocal BOOLEAN NOT NULL DEFAULT 0,    -- Local vs cloud
    IsEnabled BOOLEAN NOT NULL DEFAULT 1,
    Priority INTEGER NOT NULL DEFAULT 100, -- Lower = higher priority
    Config TEXT NOT NULL DEFAULT '{}',     -- JSON configuration
    ApiKeyRef TEXT,                        -- Reference to secrets store
    Endpoint TEXT,                         -- API endpoint for cloud
    RateLimitRpm INTEGER,                  -- Requests per minute
    HealthStatus TEXT DEFAULT 'unknown',   -- 'healthy', 'degraded', 'unhealthy'
    LastHealthCheck TEXT,
    CreatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO Providers (Id, Name, Type, IsLocal, Priority, Config) VALUES
    ('whisper-local', 'Whisper (Local)', 'stt', 1, 1, 
     '{"ModelId": "whisper-base-en", "Device": "cpu", "Threads": 4}'),
    ('openai-realtime', 'OpenAI Realtime', 'stt', 0, 2,
     '{"Model": "whisper-1", "Timeout": 30}'),
    ('elevenlabs-scribe', 'ElevenLabs Scribe', 'stt', 0, 3,
     '{"Model": "scribe_v2", "Diarize": true, "TagAudioEvents": true}'),
    ('xtts-local', 'XTTS (Local)', 'tts', 1, 1,
     '{"ModelId": "xtts-v2", "Device": "cpu"}'),
    ('elevenlabs-tts', 'ElevenLabs TTS', 'tts', 0, 2,
     '{"Model": "eleven_multilingual_v2", "DefaultVoice": "JBFqnCBsd6RMkjVDRZzb"}'),
    ('azure-tts', 'Azure TTS', 'tts', 0, 3,
     '{"Region": "eastus", "DefaultVoice": "en-US-JennyNeural"}');
```

### Voice Library

```sql
CREATE TABLE Voices (
    Id TEXT PRIMARY KEY,
    Name TEXT NOT NULL,
    Provider TEXT NOT NULL,                -- 'xtts', 'elevenlabs', 'azure'
    ExternalId TEXT,                       -- Provider's voice ID
    Language TEXT NOT NULL DEFAULT 'en',
    Gender TEXT,                           -- 'male', 'female', 'neutral'
    Age TEXT,                              -- 'young', 'middle', 'old'
    Description TEXT,
    UseCase TEXT,                          -- 'narration', 'conversational', 'news'
    IsCloned BOOLEAN NOT NULL DEFAULT 0,
    IsBuiltin BOOLEAN NOT NULL DEFAULT 0,
    PreviewUrl TEXT,
    Settings TEXT DEFAULT '{}',            -- JSON: stability, similarity, etc.
    EmbeddingPath TEXT,                    -- For cloned voices: path to embedding
    SamplePaths TEXT,                      -- JSON array of sample audio paths
    CreatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    LastUsedAt TEXT
);

CREATE INDEX IdxVoicesProvider ON Voices(Provider);
CREATE INDEX IdxVoicesLanguage ON Voices(Language);
CREATE INDEX IdxVoicesCloned ON Voices(IsCloned);

-- Built-in voices
INSERT INTO Voices (Id, Name, Provider, Language, Gender, IsBuiltin, Description) VALUES
    ('xtts-en-male-1', 'XTTS English Male', 'xtts', 'en', 'male', 1, 'Default male voice'),
    ('xtts-en-female-1', 'XTTS English Female', 'xtts', 'en', 'female', 1, 'Default female voice');
```

### Sessions Index

```sql
CREATE TABLE Sessions (
    Id TEXT PRIMARY KEY,
    ProjectId TEXT NOT NULL,
    ConversationId TEXT NOT NULL,
    DatabasePath TEXT NOT NULL,            -- Path to project database
    Type TEXT NOT NULL,                    -- 'transcription', 'tts', 'conversation'
    Status TEXT NOT NULL DEFAULT 'active', -- 'active', 'completed', 'failed'
    Provider TEXT NOT NULL,
    TotalDuration REAL DEFAULT 0,          -- Seconds
    TotalCharacters INTEGER DEFAULT 0,
    StartedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CompletedAt TEXT,
    ErrorMessage TEXT
);

CREATE INDEX IdxSessionsProject ON Sessions(ProjectId);
CREATE INDEX IdxSessionsStatus ON Sessions(Status);
CREATE INDEX IdxSessionsStarted ON Sessions(StartedAt);
```

### Usage Metrics

```sql
CREATE TABLE UsageMetrics (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    Provider TEXT NOT NULL,
    Operation TEXT NOT NULL,               -- 'transcribe', 'synthesize', 'clone'
    Timestamp TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    DurationSeconds REAL,
    Characters INTEGER,
    Tokens INTEGER,
    CostEstimate REAL,                     -- Estimated cost in USD
    SessionId TEXT,
    Success BOOLEAN NOT NULL DEFAULT 1,
    ErrorCode TEXT,
    
    FOREIGN KEY (SessionId) REFERENCES Sessions(Id)
);

CREATE INDEX IdxUsageProvider ON UsageMetrics(Provider);
CREATE INDEX IdxUsageTimestamp ON UsageMetrics(Timestamp);
CREATE INDEX IdxUsageOperation ON UsageMetrics(Operation);

-- Monthly quota tracking
CREATE TABLE Quotas (
    Id TEXT PRIMARY KEY,
    Provider TEXT NOT NULL,
    QuotaType TEXT NOT NULL,               -- 'characters', 'minutes', 'requests'
    MonthYear TEXT NOT NULL,               -- 'YYYY-MM'
    LimitValue INTEGER NOT NULL,
    UsedValue INTEGER NOT NULL DEFAULT 0,
    ResetAt TEXT NOT NULL,
    
    UNIQUE(Provider, QuotaType, MonthYear)
);
```

---

## Project Database Schema

Each conversation creates a separate database at `{project}/voice/{conversation-id}.db`.

### Transcripts Table

```sql
CREATE TABLE Transcripts (
    Id TEXT PRIMARY KEY,
    SessionId TEXT NOT NULL,
    SourceType TEXT NOT NULL,              -- 'microphone', 'file', 'stream'
    SourcePath TEXT,                       -- Original audio path (if file)
    Text TEXT NOT NULL,
    Language TEXT NOT NULL,
    LanguageConfidence REAL,
    Duration REAL NOT NULL,                -- Seconds
    Provider TEXT NOT NULL,
    ModelId TEXT,
    ProcessingTimeMs INTEGER NOT NULL,
    AudioFormat TEXT,                      -- 'pcm', 'mp3', 'webm'
    AudioSampleRate INTEGER,
    AudioHash TEXT,                        -- SHA256 of source audio
    Metadata TEXT DEFAULT '{}',            -- JSON: additional info
    CreatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IdxTranscriptsSession ON Transcripts(SessionId);
CREATE INDEX IdxTranscriptsCreated ON Transcripts(CreatedAt);
CREATE INDEX IdxTranscriptsLanguage ON Transcripts(Language);

-- Full-text search
CREATE VIRTUAL TABLE TranscriptsFTS USING fts5(
    Text,
    content=Transcripts,
    content_rowid=rowid
);

-- Triggers for FTS sync
CREATE TRIGGER transcripts_ai AFTER INSERT ON Transcripts BEGIN
    INSERT INTO TranscriptsFTS(rowid, Text) VALUES (new.rowid, new.Text);
END;

CREATE TRIGGER transcripts_ad AFTER DELETE ON Transcripts BEGIN
    INSERT INTO TranscriptsFTS(TranscriptsFTS, rowid, Text) VALUES('delete', old.rowid, old.Text);
END;

CREATE TRIGGER transcripts_au AFTER UPDATE ON Transcripts BEGIN
    INSERT INTO TranscriptsFTS(TranscriptsFTS, rowid, Text) VALUES('delete', old.rowid, old.Text);
    INSERT INTO TranscriptsFTS(rowid, Text) VALUES (new.rowid, new.Text);
END;
```

### Words Table (Timestamped)

```sql
CREATE TABLE Words (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    TranscriptId TEXT NOT NULL,
    SegmentId INTEGER,
    Text TEXT NOT NULL,
    StartTime REAL NOT NULL,               -- Seconds
    EndTime REAL NOT NULL,                 -- Seconds
    Confidence REAL,                       -- 0-1
    SpeakerId TEXT,                        -- Reference to Speakers
    IsEdited BOOLEAN DEFAULT 0,            -- User correction
    OriginalText TEXT,                     -- Before edit
    
    FOREIGN KEY (TranscriptId) REFERENCES Transcripts(Id) ON DELETE CASCADE
);

CREATE INDEX IdxWordsTranscript ON Words(TranscriptId);
CREATE INDEX IdxWordsSegment ON Words(SegmentId);
CREATE INDEX IdxWordsTime ON Words(StartTime, EndTime);
CREATE INDEX IdxWordsSpeaker ON Words(SpeakerId);
```

### Segments Table

```sql
CREATE TABLE Segments (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    TranscriptId TEXT NOT NULL,
    SegmentIndex INTEGER NOT NULL,
    Text TEXT NOT NULL,
    StartTime REAL NOT NULL,
    EndTime REAL NOT NULL,
    SpeakerId TEXT,
    Confidence REAL,
    Language TEXT,                         -- If different from main transcript
    IsEdited BOOLEAN DEFAULT 0,
    
    FOREIGN KEY (TranscriptId) REFERENCES Transcripts(Id) ON DELETE CASCADE
);

CREATE INDEX IdxSegmentsTranscript ON Segments(TranscriptId);
CREATE INDEX IdxSegmentsTime ON Segments(StartTime, EndTime);
CREATE INDEX IdxSegmentsSpeaker ON Segments(SpeakerId);
```

### Speakers Table (Diarization)

```sql
CREATE TABLE Speakers (
    Id TEXT PRIMARY KEY,
    TranscriptId TEXT NOT NULL,
    Label TEXT NOT NULL,                   -- 'Speaker 1', 'John', etc.
    Color TEXT,                            -- Hex color for UI
    FirstAppearance REAL,                  -- Timestamp in seconds
    TotalDuration REAL,                    -- Total speaking time
    WordCount INTEGER DEFAULT 0,
    SegmentCount INTEGER DEFAULT 0,
    VoiceEmbedding BLOB,                   -- For speaker identification
    Metadata TEXT DEFAULT '{}',
    
    FOREIGN KEY (TranscriptId) REFERENCES Transcripts(Id) ON DELETE CASCADE
);

CREATE INDEX IdxSpeakersTranscript ON Speakers(TranscriptId);
```

### Audio Events Table

```sql
CREATE TABLE AudioEvents (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    TranscriptId TEXT NOT NULL,
    EventType TEXT NOT NULL,               -- 'laughter', 'applause', 'music', 'silence'
    StartTime REAL NOT NULL,
    EndTime REAL NOT NULL,
    Confidence REAL,
    Description TEXT,
    
    FOREIGN KEY (TranscriptId) REFERENCES Transcripts(Id) ON DELETE CASCADE
);

CREATE INDEX IdxEventsTranscript ON AudioEvents(TranscriptId);
CREATE INDEX IdxEventsType ON AudioEvents(EventType);
CREATE INDEX IdxEventsTime ON AudioEvents(StartTime, EndTime);
```

### Voice Commands Table

```sql
CREATE TABLE VoiceCommands (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    TranscriptId TEXT NOT NULL,
    SessionId TEXT NOT NULL,
    CommandText TEXT NOT NULL,             -- Raw spoken command
    NormalizedCommand TEXT NOT NULL,       -- Parsed command
    CommandType TEXT NOT NULL,             -- 'navigation', 'action', 'query'
    Parameters TEXT DEFAULT '{}',          -- JSON: extracted parameters
    Confidence REAL NOT NULL,
    IsExecuted BOOLEAN DEFAULT 0,
    ExecutedAt TEXT,
    ExecutionResult TEXT,                  -- 'success', 'failed', 'cancelled'
    ErrorMessage TEXT,
    Timestamp TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (TranscriptId) REFERENCES Transcripts(Id) ON DELETE CASCADE
);

CREATE INDEX IdxCommandsSession ON VoiceCommands(SessionId);
CREATE INDEX IdxCommandsType ON VoiceCommands(CommandType);
CREATE INDEX IdxCommandsExecuted ON VoiceCommands(IsExecuted);
```

### TTS Generations Table

```sql
CREATE TABLE TTSGenerations (
    Id TEXT PRIMARY KEY,
    SessionId TEXT NOT NULL,
    InputText TEXT NOT NULL,
    CharacterCount INTEGER NOT NULL,
    VoiceId TEXT NOT NULL,
    Provider TEXT NOT NULL,
    ModelId TEXT,
    OutputFormat TEXT NOT NULL,            -- 'mp3', 'pcm', 'opus'
    OutputPath TEXT,                       -- Path to generated audio
    OutputDuration REAL,                   -- Seconds
    OutputSampleRate INTEGER,
    Settings TEXT DEFAULT '{}',            -- JSON: speed, stability, etc.
    ProcessingTimeMs INTEGER,
    CachedUntil TEXT,                      -- For caching optimization
    CreatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IdxTtsSession ON TTSGenerations(SessionId);
CREATE INDEX IdxTtsVoice ON TTSGenerations(VoiceId);
CREATE INDEX IdxTtsCreated ON TTSGenerations(CreatedAt);
```

---

## GORM Models

```go
// Root database models

// See: 14-enum-architecture.md for all enum type definitions

type Config struct {
    Key         string    `gorm:"primaryKey"`
    Value       string    `gorm:"not null"`
    ValueType   string    `gorm:"not null;default:'string'"` // Managed via settings service
    Category    string    `gorm:"not null;default:'general'"`
    Description string
    CreatedAt   time.Time
    UpdatedAt   time.Time
}

type Model struct {
    Id                   string                `gorm:"primaryKey"`
    Name                 string                `gorm:"not null"`
    Type                 model_type.Variant    `gorm:"not null;index"`
    Provider             string                `gorm:"not null;index"`
    Version              string                `gorm:"not null"`
    FilePath             string                `gorm:"not null"`
    FileSize             int64                 `gorm:"not null"`
    FileHash             string                `gorm:"not null"`
    DownloadUrl          string
    Status               model_status.Variant  `gorm:"not null;default:'available'"`
    Capabilities         string                // JSON
    ResourceRequirements string                // JSON
    CreatedAt            time.Time
    LastUsedAt           *time.Time
}

type Provider struct {
    Id              string                 `gorm:"primaryKey"`
    Name            string                 `gorm:"not null;unique"`
    Type            model_type.Variant     `gorm:"not null"`
    IsLocal         bool                   `gorm:"not null;default:false"`
    IsEnabled       bool                   `gorm:"not null;default:true"`
    Priority        int                    `gorm:"not null;default:100"`
    Config          string                 `gorm:"not null;default:'{}'"`
    ApiKeyRef       string
    Endpoint        string
    RateLimitRpm    int
    HealthStatus    health_status.Variant  `gorm:"default:'unknown'"`
    LastHealthCheck *time.Time
    CreatedAt       time.Time
    UpdatedAt       time.Time
}

type Voice struct {
    Id            string                 `gorm:"primaryKey"`
    Name          string                 `gorm:"not null"`
    Provider      string                 `gorm:"not null;index"`
    ExternalId    string
    Language      string                 `gorm:"not null;default:'en';index"`
    Gender        voice_gender.Variant
    Age           string
    Description   string
    UseCase       string
    IsCloned      bool   `gorm:"not null;default:false;index"`
    IsBuiltin     bool   `gorm:"not null;default:false"`
    PreviewUrl    string
    Settings      string `gorm:"default:'{}'"`
    EmbeddingPath string
    SamplePaths   string // JSON array
    CreatedAt     time.Time
    LastUsedAt    *time.Time
}

type Session struct {
    Id              string                    `gorm:"primaryKey"`
    ProjectId       string                    `gorm:"not null;index"`
    ConversationId  string                    `gorm:"not null"`
    DatabasePath    string                    `gorm:"not null"`
    Type            session_type.Variant      `gorm:"not null"`
    Status          session_status.Variant    `gorm:"not null;default:'active';index"`
    Provider        string                    `gorm:"not null"`
    TotalDuration   float64 `gorm:"default:0"`
    TotalCharacters int     `gorm:"default:0"`
    StartedAt       time.Time
    CompletedAt     *time.Time
    ErrorMessage    string
}

// Project database models

type Transcript struct {
    Id                 string                `gorm:"primaryKey"`
    SessionId          string                `gorm:"not null;index"`
    SourceType         source_type.Variant   `gorm:"not null"`
    SourcePath         string
    Text               string `gorm:"not null"`
    Language           string `gorm:"not null;index"`
    LanguageConfidence float64
    Duration           float64 `gorm:"not null"`
    Provider           string  `gorm:"not null"`
    ModelId            string
    ProcessingTimeMs   int64   `gorm:"not null"`
    AudioFormat        audio_format.Variant
    AudioSampleRate    int
    AudioHash          string
    Metadata           string `gorm:"default:'{}'"`
    CreatedAt          time.Time
    
    // Relations
    Words       []Word       `gorm:"foreignKey:TranscriptId"`
    Segments    []Segment    `gorm:"foreignKey:TranscriptId"`
    Speakers    []Speaker    `gorm:"foreignKey:TranscriptId"`
    AudioEvents []AudioEvent `gorm:"foreignKey:TranscriptId"`
}

type Word struct {
    Id           uint   `gorm:"primaryKey;autoIncrement"`
    TranscriptId string `gorm:"not null;index"`
    SegmentId    *uint
    Text         string  `gorm:"not null"`
    StartTime    float64 `gorm:"not null;index"`
    EndTime      float64 `gorm:"not null"`
    Confidence   float64
    SpeakerId    string `gorm:"index"`
    IsEdited     bool   `gorm:"default:false"`
    OriginalText string
}

type Segment struct {
    Id            uint   `gorm:"primaryKey;autoIncrement"`
    TranscriptId  string `gorm:"not null;index"`
    SegmentIndex  int    `gorm:"not null"`
    Text          string `gorm:"not null"`
    StartTime     float64 `gorm:"not null;index"`
    EndTime       float64 `gorm:"not null"`
    SpeakerId     string
    Confidence    float64
    Language      string
    IsEdited      bool   `gorm:"default:false"`
}

type Speaker struct {
    Id              string `gorm:"primaryKey"`
    TranscriptId    string `gorm:"not null;index"`
    Label           string `gorm:"not null"`
    Color           string
    FirstAppearance float64
    TotalDuration   float64
    WordCount       int `gorm:"default:0"`
    SegmentCount    int `gorm:"default:0"`
    VoiceEmbedding  []byte
    Metadata        string `gorm:"default:'{}'"`
}

type AudioEvent struct {
    Id           uint                       `gorm:"primaryKey;autoIncrement"`
    TranscriptId string                     `gorm:"not null;index"`
    EventType    audio_event_type.Variant   `gorm:"not null;index"`
    StartTime    float64 `gorm:"not null;index"`
    EndTime      float64 `gorm:"not null"`
    Confidence   float64
    Description  string
}

type VoiceCommand struct {
    Id                uint                        `gorm:"primaryKey;autoIncrement"`
    TranscriptId      string                      `gorm:"not null"`
    SessionId         string                      `gorm:"not null;index"`
    CommandText       string                      `gorm:"not null"`
    NormalizedCommand string                      `gorm:"not null"`
    CommandType       command_type.Variant        `gorm:"not null;index"`
    Parameters        string                      `gorm:"default:'{}'"`
    Confidence        float64                     `gorm:"not null"`
    IsExecuted        bool                        `gorm:"default:false;index"`
    ExecutedAt        *time.Time
    ExecutionResult   execution_result.Variant
    ErrorMessage      string
    Timestamp         time.Time
}

type TTSGeneration struct {
    Id               string                `gorm:"primaryKey"`
    SessionId        string                `gorm:"not null;index"`
    InputText        string                `gorm:"not null"`
    CharacterCount   int                   `gorm:"not null"`
    VoiceId          string                `gorm:"not null;index"`
    Provider         string                `gorm:"not null"`
    ModelId          string
    OutputFormat     audio_format.Variant  `gorm:"not null"`
    OutputPath       string
    OutputDuration   float64
    OutputSampleRate int
    Settings         string `gorm:"default:'{}'"`
    ProcessingTimeMs int64
    CachedUntil      *time.Time
    CreatedAt        time.Time
}
```

---

## Database Manager

```go
type DatabaseManager struct {
    rootDb       *gorm.DB
    projectDbs   sync.Map  // map[string]*gorm.DB
    rootPath     string
    projectsPath string
    mu           sync.RWMutex
}

func NewDatabaseManager(rootPath, projectsPath string) appfault.Result[DatabaseManager] {
    dm := &DatabaseManager{
        rootPath:     rootPath,
        projectsPath: projectsPath,
    }
    
    // Initialize root database
    if err := dm.initRootDb(); err != nil {
        return nil, err
    }
    
    return dm, nil
}

func (dm *DatabaseManager) initRootDb() *appfault.AppError {
    dbPath := filepath.Join(dm.rootPath, "transcribe.db")
    
    db, err := gorm.Open(sqlite.Open(dbPath), &gorm.Config{
        Logger: logger.Default.LogMode(logger.Silent),
    })
    if err != nil {
        return err
    }
    
    // Auto-migrate root tables
    if err := db.AutoMigrate(
        &Config{},
        &Model{},
        &Provider{},
        &Voice{},
        &Session{},
        &UsageMetric{},
        &Quota{},
    ); err != nil {
        return err
    }
    
    dm.rootDb = db
    return nil
}

func (dm *DatabaseManager) GetProjectDb(projectId, conversationId string) appfault.Result[*gorm.DB] {
    key := fmt.Sprintf("%s/%s", projectId, conversationId)
    
    // EXEMPTED: typed accessor internal — sync.Map stores known *gorm.DB values (§7.2)
    if db, ok := dm.projectDbs.Load(key); ok {
        return db.(*gorm.DB), nil
    }
    
    dm.mu.Lock()
    defer dm.mu.Unlock()
    
    // EXEMPTED: typed accessor internal — double-check after lock (§7.2)
    if db, ok := dm.projectDbs.Load(key); ok {
        return db.(*gorm.DB), nil
    }
    
    // Create project database
    dbDir := filepath.Join(dm.projectsPath, projectId, "voice")
    err := pathutil.EnsureDir(dbDir)
    if err != nil {
        return nil, err
    }
    
    dbPath := filepath.Join(dbDir, conversationId+".db")
    db, err := gorm.Open(sqlite.Open(dbPath), &gorm.Config{})
    if err != nil {
        return nil, err
    }
    
    // Auto-migrate project tables
    if err := db.AutoMigrate(
        &Transcript{},
        &Word{},
        &Segment{},
        &Speaker{},
        &AudioEvent{},
        &VoiceCommand{},
        &TTSGeneration{},
    ); err != nil {
        return nil, err
    }
    
    dm.projectDbs.Store(key, db)
    
    // Register session in root DB
    session := &Session{
        Id:             conversationId,
        ProjectId:      projectId,
        ConversationId: conversationId,
        DatabasePath:   dbPath,
        Status:         "active",
        StartedAt:      time.Now(),
    }
    dm.rootDb.Create(session)
    
    return db, nil
}

func (dm *DatabaseManager) Close() error {
    sqlDb, _ := dm.rootDb.DB()
    sqlDb.Close()
    
    // EXEMPTED: sync.Map typed accessor — stores known *gorm.DB values (§7.2)
    dm.projectDbs.Range(func(key, value interface{}) bool {
        db := value.(*gorm.DB)
        sqlDb, _ := db.DB()
        sqlDb.Close()
        return true
    })
    
    return nil
}
```

---

## See Also

- [Architecture](./01-architecture.md) — System design
- [API Interface](./09-api-interface.md) — REST endpoints
- [Configuration](./11-configuration.md) — Config management
