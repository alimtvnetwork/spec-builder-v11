# 02 — Database Schema


**Version:** 1.0.0  
**Last Updated:** 2026-03-20  

> **Parent:** [00-overview.md](../00-overview.md)  
> **Status:** Draft

---

## Overview

SQLite is the primary data store. JSON configuration is used only for initial seeding.

---

## Entity Relationship Diagram

```
┌─────────────────┐       ┌─────────────────┐
│     Site        │       │    Plugin       │
├─────────────────┤       ├─────────────────┤
│ Id (PK)         │       │ Id (PK)         │
│ Name            │       │ Name            │
│ Url             │       │ LocalPath       │
│ Username        │       │ RemoteSlug      │
│ AppPassword     │◄──────│ SiteId (FK)     │
│ IsActive        │       │ IsActive        │
│ LastSyncAt      │       │ LastPublishedAt │
│ CreatedAt       │       │ CreatedAt       │
│ UpdatedAt       │       │ UpdatedAt       │
└─────────────────┘       └─────────────────┘
         │                         │
         │                         │
         ▼                         ▼
┌─────────────────┐       ┌─────────────────┐
│   SyncRecord    │       │  FileChange     │
├─────────────────┤       ├─────────────────┤
│ Id (PK)         │       │ Id (PK)         │
│ PluginId (FK)   │       │ PluginId (FK)   │
│ Status          │       │ FilePath        │
│ FilesChanged    │       │ ChangeType      │
│ ErrorMessage    │       │ DetectedAt      │
│ StartedAt       │       │ IsPending       │
│ CompletedAt     │       │ SyncedAt        │
│ CreatedAt       │       │ CreatedAt       │
└─────────────────┘       └─────────────────┘

┌─────────────────┐       ┌─────────────────┐
│    Backup       │       │   ErrorLog      │
├─────────────────┤       ├─────────────────┤
│ Id (PK)         │       │ Id (PK)         │
│ PluginId (FK)   │       │ Level           │
│ SiteId (FK)     │       │ Code            │
│ FilePath        │       │ Message         │
│ FileSize        │       │ Context         │
│ CreatedAt       │       │ StackTrace      │
└─────────────────┘       │ File            │
                          │ Line            │
┌─────────────────┐       │ Function        │
│   AppConfig     │       │ CreatedAt       │
├─────────────────┤       └─────────────────┘
│ Key (PK)        │
│ Value           │
│ UpdatedAt       │
└─────────────────┘
```

---

## Table Definitions

### Site

Stores WordPress site connection information.

```sql
CREATE TABLE Site (
    Id              INTEGER PRIMARY KEY AUTOINCREMENT,
    Name            TEXT NOT NULL,
    Url             TEXT NOT NULL UNIQUE,
    Username        TEXT NOT NULL,
    AppPassword     TEXT NOT NULL,  -- AES-256 encrypted
    IsActive        INTEGER NOT NULL DEFAULT 1,
    LastSyncAt      TEXT,           -- ISO8601 timestamp
    CreatedAt       TEXT NOT NULL DEFAULT (datetime('now')),
    UpdatedAt       TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IdxSiteIsActive ON Site(IsActive);
CREATE INDEX IdxSiteUrl ON Site(Url);
```

### Plugin

Stores local plugin directory mappings.

```sql
CREATE TABLE Plugin (
    Id              INTEGER PRIMARY KEY AUTOINCREMENT,
    Name            TEXT NOT NULL,
    LocalPath       TEXT NOT NULL,          -- Absolute path to local directory
    RemoteSlug      TEXT NOT NULL,          -- WordPress plugin slug
    SiteId          INTEGER NOT NULL,
    IsActive        INTEGER NOT NULL DEFAULT 1,
    IsWatching      INTEGER NOT NULL DEFAULT 0,
    LastPublishedAt TEXT,                   -- ISO8601 timestamp
    LastHash        TEXT,                   -- Hash of last published state
    CreatedAt       TEXT NOT NULL DEFAULT (datetime('now')),
    UpdatedAt       TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (SiteId) REFERENCES Site(Id) ON DELETE CASCADE,
    UNIQUE(LocalPath, SiteId)
);

CREATE INDEX IdxPluginSiteId ON Plugin(SiteId);
CREATE INDEX IdxPluginIsActive ON Plugin(IsActive);
CREATE INDEX IdxPluginIsWatching ON Plugin(IsWatching);
```

### FileChange

Tracks detected file modifications.

```sql
CREATE TABLE FileChange (
    Id              INTEGER PRIMARY KEY AUTOINCREMENT,
    PluginId        INTEGER NOT NULL,
    FilePath        TEXT NOT NULL,          -- Relative path within plugin
    ChangeType      TEXT NOT NULL,          -- 'created', 'modified', 'deleted'
    FileHash        TEXT,                   -- MD5/SHA256 of current file
    IsPending       INTEGER NOT NULL DEFAULT 1,
    DetectedAt      TEXT NOT NULL DEFAULT (datetime('now')),
    SyncedAt        TEXT,
    CreatedAt       TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (PluginId) REFERENCES Plugin(Id) ON DELETE CASCADE
);

CREATE INDEX IdxFileChangePluginId ON FileChange(PluginId);
CREATE INDEX IdxFileChangeIsPending ON FileChange(IsPending);
CREATE INDEX IdxFileChangeDetectedAt ON FileChange(DetectedAt);
```

### SyncRecord

Logs sync/publish operations.

```sql
CREATE TABLE SyncRecord (
    Id              INTEGER PRIMARY KEY AUTOINCREMENT,
    PluginId        INTEGER NOT NULL,
    SiteId          INTEGER NOT NULL,
    Operation       TEXT NOT NULL,          -- 'check', 'publish_single', 'publish_full'
    Status          TEXT NOT NULL,          -- 'pending', 'in_progress', 'completed', 'failed'
    FilesChanged    INTEGER DEFAULT 0,
    FilesPublished  INTEGER DEFAULT 0,
    ErrorMessage    TEXT,
    StartedAt       TEXT NOT NULL DEFAULT (datetime('now')),
    CompletedAt     TEXT,
    CreatedAt       TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (PluginId) REFERENCES Plugin(Id) ON DELETE CASCADE,
    FOREIGN KEY (SiteId) REFERENCES Site(Id) ON DELETE CASCADE
);

CREATE INDEX IdxSyncRecordPluginId ON SyncRecord(PluginId);
CREATE INDEX IdxSyncRecordStatus ON SyncRecord(Status);
CREATE INDEX IdxSyncRecordCreatedAt ON SyncRecord(CreatedAt);
```

### Backup

Tracks downloaded plugin backups.

```sql
CREATE TABLE Backup (
    Id              INTEGER PRIMARY KEY AUTOINCREMENT,
    PluginId        INTEGER NOT NULL,
    SiteId          INTEGER NOT NULL,
    FilePath        TEXT NOT NULL,          -- Path in backups/ directory
    FileSize        INTEGER NOT NULL,       -- Size in bytes
    PluginVersion   TEXT,                   -- Version from plugin header
    CreatedAt       TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (PluginId) REFERENCES Plugin(Id) ON DELETE CASCADE,
    FOREIGN KEY (SiteId) REFERENCES Site(Id) ON DELETE CASCADE
);

CREATE INDEX IdxBackupPluginId ON Backup(PluginId);
CREATE INDEX IdxBackupCreatedAt ON Backup(CreatedAt);
```

### ErrorLog

Stores application errors for UI display.

```sql
CREATE TABLE ErrorLog (
    Id              INTEGER PRIMARY KEY AUTOINCREMENT,
    Level           TEXT NOT NULL,          -- 'error', 'warn', 'info'
    Code            TEXT NOT NULL,          -- Error code (e.g., 'E1001')
    Message         TEXT NOT NULL,
    Context         TEXT,                   -- JSON blob with additional context
    StackTrace      TEXT,                   -- Full stack trace
    File            TEXT,                   -- Source file
    Line            INTEGER,                -- Line number
    Function        TEXT,                   -- Function name
    CreatedAt       TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IdxErrorLogLevel ON ErrorLog(Level);
CREATE INDEX IdxErrorLogCode ON ErrorLog(Code);
CREATE INDEX IdxErrorLogCreatedAt ON ErrorLog(CreatedAt);
```

### AppConfig

Application configuration (version tracking, settings).

```sql
CREATE TABLE AppConfig (
    Key             TEXT PRIMARY KEY,
    Value           TEXT NOT NULL,
    UpdatedAt       TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Default entries
INSERT INTO AppConfig (Key, Value) VALUES ('schema_version', '1');
INSERT INTO AppConfig (Key, Value) VALUES ('seed_version', '0');
```

---

## Migration Strategy

### Migration Files

```
internal/database/migrations/
├── 0001_initial_schema.sql
├── 0002_add_file_hash.sql
└── ...
```

### Migration Runner

```go
// internal/database/migrations.go
func Migrate(db *gorm.DB) error {
    // AutoMigrate all models
    return db.AutoMigrate(
        &models.Site{},
        &models.Plugin{},
        &models.FileChange{},
        &models.SyncRecord{},
        &models.Backup{},
        &models.ErrorLog{},
        &models.AppConfig{},
    )
}
```

---

## Data Types

| SQLite Type | Go Type | Notes |
|-------------|---------|-------|
| INTEGER | int64 | Primary keys, foreign keys |
| TEXT | string | Strings, JSON blobs |
| TEXT (ISO8601) | time.Time | Timestamps |
| INTEGER (0/1) | bool | Boolean flags |
| REAL | float64 | Decimal numbers |

---

## Encryption

Application passwords are encrypted using AES-256-GCM:

```go
// internal/services/site/encryption.go
func EncryptPassword(plaintext string, key []byte) apperror.Result[string] {
    block, err := aes.NewCipher(key)
    if err != nil {
        return "", err
    }
    
    gcm, err := cipher.NewGCM(block)
    if err != nil {
        return "", err
    }
    
    nonce := make([]byte, gcm.NonceSize())
    if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
        return "", err
    }
    
    ciphertext := gcm.Seal(nonce, nonce, []byte(plaintext), nil)
    return base64.StdEncoding.EncodeToString(ciphertext), nil
}
```

---

## Next Document

See [03-config-system.md](./03-config-system.md) for JSON seeding and version control.
