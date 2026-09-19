# Data Models

**Version:** 2.0.0  
**Status:** Draft  
**Updated:** 2026-03-09  

---

## Overview

GORM entity definitions for optional run history persistence in SQLite.

**Cross-References:**
- [Core Architecture](./01-core-architecture.md)
- [Error Handling](./06-error-handling.md)
- [Database Design](../../07-database-design/00-overview.md)

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
│ IsSuccess           │       │ Code                │
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
│ IsSuccess             │
│ CreatedAt           │
└─────────────────────┘
```

---

## GORM Models

### BuildRun

```go
type BuildRun struct {
    Id          uint           `gorm:"primaryKey"`
    RunId       string         `gorm:"uniqueIndex;size:50;not null"`
    ProfileName string         `gorm:"size:100;index"`
    Runtime     string         `gorm:"size:20;not null"` // powershell, nodejs, golang
    Command     string         `gorm:"size:500"`
    WorkDir     string         `gorm:"size:500"`
    ExitCode    int            `gorm:"not null;default:0"`
    IsSuccess   bool           `gorm:"not null;default:false"`
    Stdout      string         `gorm:"type:text"`
    Stderr      string         `gorm:"type:text"`
    StartTime   time.Time      `gorm:"not null"`
    EndTime     time.Time      `gorm:"not null"`
    Duration    int64          `gorm:"not null"` // milliseconds
    Port        int            `gorm:"default:0"`
    LogPath     string         `gorm:"size:500"`
    CreatedAt   time.Time      `gorm:"autoCreateTime"`

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
type BuildError struct {
    Id          uint      `gorm:"primaryKey"`
    BuildRunId  uint      `gorm:"index;not null"`
    File        string    `gorm:"size:500"`
    Line        int       `gorm:"default:0"`
    Column      int       `gorm:"default:0"`
    Message     string    `gorm:"size:2000;not null"`
    Severity    string    `gorm:"size:20;not null"` // error, warning, info
    Code        string    `gorm:"size:50"`          // TS2304, ESLint rule, etc.
    StackTrace  string    `gorm:"type:text"`
    Context     string    `gorm:"size:500"`         // Source code context
    CreatedAt   time.Time `gorm:"autoCreateTime"`
    
    // Relationship
    BuildRun BuildRun `gorm:"foreignKey:BuildRunId"`
}

func (BuildError) TableName() string {
    return "BuildErrors"
}
```

### AssetOperation

```go
type AssetOperation struct {
    Id           uint      `gorm:"primaryKey"`
    BuildRunId   uint      `gorm:"index;not null"`
    Source       string    `gorm:"size:500;not null"`
    Destination  string    `gorm:"size:500;not null"`
    Mode         string    `gorm:"size:20;not null"` // copy, clear-copy, override, skip-existing
    FilesCopied  int       `gorm:"not null;default:0"`
    FilesSkipped int       `gorm:"not null;default:0"`
    BytesCopied  int64     `gorm:"not null;default:0"`
    Duration     int64     `gorm:"not null;default:0"` // milliseconds
    IsSuccess    bool      `gorm:"not null;default:false"`
    ErrorMsg     string    `gorm:"size:500"`
    CreatedAt    time.Time `gorm:"autoCreateTime"`

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
    IsAvailable bool      `gorm:"not null"`
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

func (r *BuildRunRepository) Create(run *BuildRun) *appfault.AppError {
    err := r.db.Create(run).Error

    if err != nil {
        return appfault.Wrap(err, "failed to create build run").WithSkip(1)
    }

    return nil
}

func (r *BuildRunRepository) GetByRunId(runId string) appfault.Result[BuildRun] {
    var run BuildRun
    err := r.db.Preload("Errors").Preload("Assets").
        Where("RunId = ?", runId).
        First(&run).Error

    if err != nil {
        return appfault.FailWrap[BuildRun](err, "failed to find build run")
    }

    return appfault.Ok(run)
}

// Note: BuildRunSlice is defined in types.go (created from generic appfault.ResultSlice[BuildRun]):
// type BuildRunSlice = appfault.ResultSlice[BuildRun]
func (r *BuildRunRepository) GetRecent(limit int) BuildRunSlice {
    var runs []BuildRun
    err := r.db.Preload("Errors").
        Order("CreatedAt DESC").
        Limit(limit).
        Find(&runs).Error

    if err != nil {
        return appfault.FailWrap[[]BuildRun](err, "failed to get recent runs")
    }

    return appfault.OkSlice(runs)
}

// Note: BuildRunSlice is defined in types.go (created from generic appfault.ResultSlice[BuildRun]):
// type BuildRunSlice = appfault.ResultSlice[BuildRun]
func (r *BuildRunRepository) GetByProfile(profileName string, limit int) BuildRunSlice {
    var runs []BuildRun
    err := r.db.Where("ProfileName = ?", profileName).
        Order("CreatedAt DESC").
        Limit(limit).
        Find(&runs).Error

    if err != nil {
        return appfault.FailWrap[[]BuildRun](err, "failed to get runs by profile")
    }

    return appfault.OkSlice(runs)
}

// Note: BuildRunSlice is defined in types.go (created from generic appfault.ResultSlice[BuildRun]):
// type BuildRunSlice = appfault.ResultSlice[BuildRun]
func (r *BuildRunRepository) GetFailedRuns(since time.Time) BuildRunSlice {
    var runs []BuildRun
    err := r.db.Preload("Errors").
        Where("IsSuccess = ? AND CreatedAt > ?", false, since).
        Order("CreatedAt DESC").
        Find(&runs).Error

    if err != nil {
        return appfault.FailWrap[[]BuildRun](err, "failed to get failed runs")
    }

    return appfault.OkSlice(runs)
}

func (r *BuildRunRepository) DeleteOldRuns(keepCount int) *appfault.AppError {
    var keepIds []uint
    r.db.Model(&BuildRun{}).
        Order("CreatedAt DESC").
        Limit(keepCount).
        Pluck("Id", &keepIds)

    err := r.db.Where("Id NOT IN ?", keepIds).Delete(&BuildRun{}).Error

    if err != nil {
        return appfault.Wrap(err, "failed to delete old runs").WithSkip(1)
    }

    return nil
}

func (r *BuildRunRepository) GetStatistics(since time.Time) appfault.Result[BuildStatistics] {
    var stats BuildStatistics

    r.db.Model(&BuildRun{}).
        Where("CreatedAt > ?", since).
        Count(&stats.TotalRuns)

    r.db.Model(&BuildRun{}).
        Where("CreatedAt > ? AND IsSuccess = ?", since, true).
        Count(&stats.SuccessfulRuns)

    r.db.Model(&BuildRun{}).
        Where("CreatedAt > ? AND IsSuccess = ?", since, false).
        Count(&stats.FailedRuns)

    r.db.Model(&BuildRun{}).
        Where("CreatedAt > ?", since).
        Select("AVG(Duration)").
        Scan(&stats.AvgDuration)

    return appfault.Ok(stats)
}

type BuildStatistics struct {
    TotalRuns      int64
    SuccessfulRuns int64
    FailedRuns     int64
    AvgDuration    float64
}
```

---

## Database Initialization

```go
func InitDatabase(dbPath string) appfault.Result[*gorm.DB] {
    db, err := gorm.Open(sqlite.Open(dbPath), &gorm.Config{
        Logger: logger.Default.LogMode(logger.Warn),
    })

    if err != nil {
        return appfault.FailWrap[*gorm.DB](err, "failed to open database")
    }

    migrateErr := db.AutoMigrate(
        &BuildRun{},
        &BuildError{},
        &AssetOperation{},
        &PortCheck{},
    )

    if migrateErr != nil {
        return appfault.FailWrap[*gorm.DB](migrateErr, "failed to migrate database")
    }

    db.Exec("CREATE INDEX IF NOT EXISTS IdxBuildRunsProfile ON BuildRuns(ProfileName)")
    db.Exec("CREATE INDEX IF NOT EXISTS IdxBuildRunsSuccess ON BuildRuns(IsSuccess)")
    db.Exec("CREATE INDEX IF NOT EXISTS IdxBuildErrorsFile ON BuildErrors(File)")

    return appfault.Ok(db)
}
```

---

## Configuration

```json
{
  "database": {
    "enabled": true,
    "path": "./brun.db",
    "keepRuns": 100,
    "vacuumInterval": "24h"
  }
}
```

---

## See Also

- [Core Architecture](./01-core-architecture.md)
- [Error Handling](./06-error-handling.md)
- [Build Profiles](./07-build-profiles.md)
