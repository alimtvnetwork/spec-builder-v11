# Data Models

**Version:** 4.0.0  
**Status:** Active  
**Updated:** 2026-03-09

---

## Overview

GORM entity definitions for optional run history persistence in SQLite.

**Cross-References:**
- [Core Architecture](./01-core-architecture.md)
- [Error Handling](./06-error-handling.md)
- [Enum Architecture](./19-enum-architecture.md)
- [Database Design](../../21-app/spec-management-software/07-database-design/00-overview.md)

---

## Entity Relationship Diagram

```
┌─────────────────────┐       ┌─────────────────────┐
│     BuildRun        │       │    BuildError       │
├─────────────────────┤       ├─────────────────────┤
│ Id                  │──1:N──│ Id                  │
│ RunId               │       │ BuildRunId          │
│ ProfileName         │       │ File                │
│ Runtime             │       │ Line                │
│ Command             │       │ Column              │
│ WorkDir             │       │ Message             │
│ ExitCode            │       │ Severity            │
│ Success             │       │ Code                │
│ StartTime           │       │ StackTrace          │
│ EndTime             │       │ CreatedAt           │
│ Duration            │       └─────────────────────┘
│ Port                │
│ LogPath             │
│ CreatedAt           │
└─────────────────────┘
         │
         │
         1:N
         │
         ▼
┌─────────────────────┐
│   AssetOperation    │
├─────────────────────┤
│ Id                  │
│ BuildRunId          │
│ Source              │
│ Destination         │
│ Mode                │
│ FilesCopied         │
│ BytesCopied         │
│ Duration            │
│ Success             │
│ CreatedAt           │
└─────────────────────┘
```

---

## GORM Models

### BuildRun

```go
import "internal/enums/runtime"

type BuildRun struct {
    Id          uint            `gorm:"primaryKey"`
    RunId       string          `gorm:"uniqueIndex;size:50;not null"`
    ProfileName string          `gorm:"size:100;index"`
    Runtime     runtime.Variant `gorm:"not null"` // Type-safe runtime enum
    Command     string          `gorm:"size:500"`
    WorkDir     string          `gorm:"size:500"`
    ExitCode    int             `gorm:"not null;default:0"`
    Success     bool            `gorm:"not null;default:false"`
    Stdout      string          `gorm:"type:text"`
    Stderr      string          `gorm:"type:text"`
    StartTime   time.Time       `gorm:"not null"`
    EndTime     time.Time       `gorm:"not null"`
    Duration    int64           `gorm:"not null"` // milliseconds
    Port        int             `gorm:"default:0"`
    LogPath     string          `gorm:"size:500"`
    CreatedAt   time.Time       `gorm:"autoCreateTime"`
    
    // Relationships
    Errors     []BuildError     `gorm:"foreignKey:BuildRunId;constraint:OnDelete:CASCADE"`
    Assets     []AssetOperation `gorm:"foreignKey:BuildRunId;constraint:OnDelete:CASCADE"`
}

func (BuildRun) TableName() string {
    return "BuildRuns"
}
```

### BuildError

```go
import "internal/enums/severitytype"

type BuildError struct {
    Id          uint             `gorm:"primaryKey"`
    BuildRunId  uint             `gorm:"index;not null"`
    File        string           `gorm:"size:500"`
    Line        int              `gorm:"default:0"`
    Column      int              `gorm:"default:0"`
    Message     string           `gorm:"size:2000;not null"`
    Severity    severitytype.Variant `gorm:"not null"` // Type-safe severity enum
    Code        string           `gorm:"size:50"`  // TS2304, ESLint rule, etc.
    StackTrace  string           `gorm:"type:text"`
    Context     string           `gorm:"size:500"` // Source code context
    CreatedAt   time.Time        `gorm:"autoCreateTime"`
    
    // Relationship
    BuildRun BuildRun `gorm:"foreignKey:BuildRunId"`
}

func (BuildError) TableName() string {
    return "BuildErrors"
}
```

### AssetOperation

```go
import "internal/enums/copymodetype"

type AssetOperation struct {
    Id           uint              `gorm:"primaryKey"`
    BuildRunId   uint              `gorm:"index;not null"`
    Source       string            `gorm:"size:500;not null"`
    Destination  string            `gorm:"size:500;not null"`
    Mode         copy_mode.Variant `gorm:"not null"` // Type-safe copy mode enum
    FilesCopied  int               `gorm:"not null;default:0"`
    FilesSkipped int               `gorm:"not null;default:0"`
    BytesCopied  int64             `gorm:"not null;default:0"`
    Duration     int64             `gorm:"not null;default:0"` // milliseconds
    Success      bool              `gorm:"not null;default:false"`
    ErrorMsg     string            `gorm:"size:500"`
    CreatedAt    time.Time         `gorm:"autoCreateTime"`
    
    // Relationship
    BuildRun BuildRun `gorm:"foreignKey:BuildRunId"`
}

func (AssetOperation) TableName() string {
    return "AssetOperations"
}
```

### PortCheck

```go
type PortCheck struct {
    Id          uint      `gorm:"primaryKey"`
    BuildRunId  uint      `gorm:"index"`
    Port        int       `gorm:"not null"`
    Available   bool      `gorm:"not null"`
    Reason      string    `gorm:"size:200"`
    ProcessName string    `gorm:"size:100"`
    ProcessPid  int       `gorm:"default:0"`
    CheckedAt   time.Time `gorm:"not null"`
    CreatedAt   time.Time `gorm:"autoCreateTime"`
}

func (PortCheck) TableName() string {
    return "PortChecks"
}
```

---

## Database Repository

```go
type BuildRunRepository struct {
    db *gorm.DB
}

func NewBuildRunRepository(db *gorm.DB) *BuildRunRepository {
    return &BuildRunRepository{db: db}
}

func (r *BuildRunRepository) Create(run *BuildRun) error {
    return r.db.Create(run).Error
}

func (r *BuildRunRepository) GetByRunId(runId string) apperror.Result[BuildRun] {
    var run BuildRun
    err := r.db.Preload("Errors").Preload("Assets").
        Where("RunId = ?", runId).
        First(&run).Error
    if err != nil {
        return apperror.Fail[BuildRun](
            apperror.Wrap(err, 7405, "build run not found"),
        )
    }
    return apperror.Ok(run)
}

func (r *BuildRunRepository) GetRecent(limit int) apperror.Result[[]BuildRun] {
    var runs []BuildRun
    err := r.db.Preload("Errors").
        Order("CreatedAt DESC").
        Limit(limit).
        Find(&runs).Error
    if err != nil {
        return apperror.Fail[[]BuildRun](
            apperror.Wrap(err, 7406, "failed to get recent runs"),
        )
    }
    return apperror.Ok(runs)
}

func (r *BuildRunRepository) GetByProfile(profileName string, limit int) apperror.Result[[]BuildRun] {
    var runs []BuildRun
    err := r.db.Where("ProfileName = ?", profileName).
        Order("CreatedAt DESC").
        Limit(limit).
        Find(&runs).Error
    if err != nil {
        return apperror.Fail[[]BuildRun](
            apperror.Wrap(err, 7407, "failed to get runs by profile"),
        )
    }
    return apperror.Ok(runs)
}

func (r *BuildRunRepository) GetFailedRuns(since time.Time) apperror.Result[[]BuildRun] {
    var runs []BuildRun
    err := r.db.Preload("Errors").
        Where("Success = ? AND CreatedAt > ?", false, since).
        Order("CreatedAt DESC").
        Find(&runs).Error
    if err != nil {
        return apperror.Fail[[]BuildRun](
            apperror.Wrap(err, 7408, "failed to get failed runs"),
        )
    }
    return apperror.Ok(runs)
}

func (r *BuildRunRepository) DeleteOldRuns(keepCount int) *apperror.AppError {
    // Get Ids to keep
    var keepIds []uint
    r.db.Model(&BuildRun{}).
        Order("CreatedAt DESC").
        Limit(keepCount).
        Pluck("Id", &keepIds)
    
    // Delete older runs (cascade deletes errors and assets)
    if err := r.db.Where("Id NOT IN ?", keepIds).Delete(&BuildRun{}).Error; err != nil {
        return apperror.Wrap(err, 7409, "failed to delete old runs")
    }
    return nil
}

func (r *BuildRunRepository) GetStatistics(since time.Time) apperror.Result[BuildStatistics] {
    var stats BuildStatistics
    
    r.db.Model(&BuildRun{}).
        Where("CreatedAt > ?", since).
        Count(&stats.TotalRuns)
    
    r.db.Model(&BuildRun{}).
        Where("CreatedAt > ? AND Success = ?", since, true).
        Count(&stats.SuccessfulRuns)
    
    r.db.Model(&BuildRun{}).
        Where("CreatedAt > ? AND Success = ?", since, false).
        Count(&stats.FailedRuns)
    
    r.db.Model(&BuildRun{}).
        Where("CreatedAt > ?", since).
        Select("AVG(Duration)").
        Scan(&stats.AvgDuration)
    
    return &stats, nil
}

type BuildStatistics struct {
    TotalRuns      int64   `json:",omitempty"`
    SuccessfulRuns int64   `json:",omitempty"`
    FailedRuns     int64   `json:",omitempty"`
    AvgDuration    float64 `json:",omitempty"`
}
```

---

## Database Initialization

```go
func InitDatabase(dbPath string) apperror.Result[*gorm.DB] {
    db, err := gorm.Open(sqlite.Open(dbPath), &gorm.Config{
        Logger: logger.Default.LogMode(logger.Warn),
    })
    if err != nil {
        return nil, apperror.Wrap(
            err,
            ErrDatabaseOpen,
            "open database",
        )
    }
    
    // Auto migrate
    err = db.AutoMigrate(
        &BuildRun{},
        &BuildError{},
        &AssetOperation{},
        &PortCheck{},
    )
    if err != nil {
        return nil, apperror.Wrap(
            err,
            ErrDatabaseMigrate,
            "migrate database",
        )
    }
    
    // Create indexes
    db.Exec("CREATE INDEX IF NOT EXISTS IdxBuildRunsProfileName ON BuildRuns(ProfileName)")
    db.Exec("CREATE INDEX IF NOT EXISTS IdxBuildRunsSuccess ON BuildRuns(Success)")
    db.Exec("CREATE INDEX IF NOT EXISTS IdxBuildErrorsFile ON BuildErrors(File)")
    
    return db, nil
}
```

---

## Configuration

```json
{
  "Database": {
    "Enabled": true,
    "Path": "./brun.db",
    "KeepRuns": 100,
    "VacuumInterval": "24h"
  }
}
```

---

## See Also

- [Core Architecture](./01-core-architecture.md)
- [Error Handling](./06-error-handling.md)
- [Build Profiles](./07-build-profiles.md)
