# BRun CLI: Complete Database Architecture

**Version:** 4.0.0  
**Status:** Complete  
**Updated:** 2026-03-09  

---

## CRITICAL: Naming Convention

**All field names use PascalCase. No underscores allowed.**

| ❌ Wrong | ✅ Correct |
|----------|-----------|
| `build_run_id` | `BuildRunId` |
| `exit_code` | `ExitCode` |
| `created_at` | `CreatedAt` |

See: `.lovable/memories/training/09-database-naming-conventions.md`

---

## Overview

This document defines the **complete database architecture** for BRun CLI using the Split DB pattern:

- **Root DB**: Global settings, profiles, counters
- **Run Session DBs**: Individual build/run execution logs

---

## Database Hierarchy

```
data/
├── brun.db                                        # ROOT DB (Setting DB)
│
└── runs/
    ├── 001-backend-build-abc.db                   # Session DB: Build run
    ├── 002-frontend-build-def.db                  # Session DB: Build run
    └── 003-full-stack-ghi.db                      # Session DB: Build run
```

---

## 1. Root Database: `data/brun.db`

The **Setting DB** contains global configuration, profiles, and registry.

### Schema (PascalCase)

```sql
-- ============================================
-- Table: Settings (global configuration)
-- ============================================
CREATE TABLE Settings (
    Key TEXT PRIMARY KEY,
    Value TEXT NOT NULL,
    ValueType TEXT DEFAULT 'string',               -- string, int, float, bool, json
    Source TEXT DEFAULT 'seed',                    -- seed, user, runtime
    Description TEXT,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Default settings (from config.seed.json)
INSERT INTO Settings (Key, Value, ValueType, Source, Description) VALUES
('Runs.KeepCount', '100', 'int', 'seed', 'Number of run logs to keep'),
('Runs.VacuumInterval', '24h', 'string', 'seed', 'Auto vacuum interval'),
('Reset.ConfirmationTtlMinutes', '5', 'int', 'seed', 'Reset confirmation window');


-- ============================================
-- Table: Profiles (build profiles)
-- ============================================
CREATE TABLE Profiles (
    Id TEXT PRIMARY KEY,
    Name TEXT UNIQUE NOT NULL,
    Runtime TEXT NOT NULL,                         -- powershell, nodejs, golang
    Command TEXT,
    WorkDir TEXT,
    EnvVars TEXT,                                  -- JSON: environment variables
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);


-- ============================================
-- Table: Counters (sequence counters)
-- ============================================
CREATE TABLE Counters (
    Id TEXT PRIMARY KEY,
    Category TEXT NOT NULL,                        -- "runs", "export"
    CurrentCount INTEGER DEFAULT 0,
    UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(Category)
);

INSERT INTO Counters (Id, Category, CurrentCount) VALUES
('cnt_runs', 'runs', 0),
('cnt_export', 'export', 0);


-- ============================================
-- Table: DbRegistry (all child databases)
-- ============================================
CREATE TABLE DbRegistry (
    Id TEXT PRIMARY KEY,
    Category TEXT NOT NULL,                        -- "runs"
    EntityId TEXT NOT NULL,                        -- run-id
    SequenceNum INTEGER NOT NULL,                  -- 001, 002, 003...
    Path TEXT NOT NULL,                            -- Relative path to .db file
    ProfileName TEXT,
    SizeBytes INTEGER DEFAULT 0,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    Status TEXT DEFAULT 'active',
    UNIQUE(Category, EntityId)
);

CREATE INDEX IdxRegistryPath ON DbRegistry(Path);
CREATE INDEX IdxRegistryProfile ON DbRegistry(ProfileName);


-- ============================================
-- Table: ResetRequests (2-step confirmation)
-- ============================================
CREATE TABLE ResetRequests (
    Id TEXT PRIMARY KEY,
    Scope TEXT NOT NULL,                           -- "all", "runs", "profile:{name}"
    RequestedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    ExpiresAt DATETIME NOT NULL,                   -- +5 minutes
    ConfirmedAt DATETIME,
    Status TEXT DEFAULT 'pending'                  -- pending, confirmed, expired, cancelled
);

CREATE INDEX IdxResetStatus ON ResetRequests(Status, ExpiresAt);
```

---

## 2. Run Session Database: `data/runs/{seq}-{id}.db`

Each build/run execution has its **own Session DB**.

### Naming Convention

```
Run ID:  abc123def
Profile: backend-build
Seq:     001

Path: data/runs/001-backend-build-abc123.db
```

### Schema (PascalCase)

```sql
-- ============================================
-- Table: RunMeta (session metadata - singleton)
-- ============================================
CREATE TABLE RunMeta (
    Id TEXT PRIMARY KEY DEFAULT 'singleton',
    RunId TEXT UNIQUE NOT NULL,
    ProfileName TEXT,
    Runtime TEXT NOT NULL,                         -- powershell, nodejs, golang
    Command TEXT,
    WorkDir TEXT,
    
    -- Execution status
    ExitCode INTEGER NOT NULL DEFAULT 0,
    Success BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Timing
    StartTime DATETIME NOT NULL,
    EndTime DATETIME,
    DurationMs INTEGER,
    
    -- Port info (for servers)
    Port INTEGER DEFAULT 0,
    LogPath TEXT,
    
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);


-- ============================================
-- Table: Output (stdout/stderr)
-- ============================================
CREATE TABLE Output (
    Id TEXT PRIMARY KEY,
    StreamType TEXT NOT NULL,                      -- "stdout", "stderr"
    Content TEXT NOT NULL,
    LineNumber INTEGER,
    Timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IdxOutputStream ON Output(StreamType);
CREATE INDEX IdxOutputLine ON Output(LineNumber);


-- ============================================
-- Table: BuildErrors (parsed errors)
-- ============================================
CREATE TABLE BuildErrors (
    Id TEXT PRIMARY KEY,
    File TEXT,
    Line INTEGER DEFAULT 0,
    Column INTEGER DEFAULT 0,
    Message TEXT NOT NULL,
    Severity TEXT NOT NULL,                        -- error, warning, info
    Code TEXT,                                     -- TS2304, ESLint rule, etc.
    StackTrace TEXT,
    Context TEXT,                                  -- Source code context
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IdxErrorsFile ON BuildErrors(File);
CREATE INDEX IdxErrorsSeverity ON BuildErrors(Severity);


-- ============================================
-- Table: AssetOperations (file copy operations)
-- ============================================
CREATE TABLE AssetOperations (
    Id TEXT PRIMARY KEY,
    Source TEXT NOT NULL,
    Destination TEXT NOT NULL,
    Mode TEXT NOT NULL,                            -- copy, clear-copy, override, skip-existing
    FilesCopied INTEGER NOT NULL DEFAULT 0,
    FilesSkipped INTEGER NOT NULL DEFAULT 0,
    BytesCopied INTEGER NOT NULL DEFAULT 0,
    DurationMs INTEGER NOT NULL DEFAULT 0,
    Success BOOLEAN NOT NULL DEFAULT FALSE,
    ErrorMsg TEXT,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);


-- ============================================
-- Table: PortChecks (port availability checks)
-- ============================================
CREATE TABLE PortChecks (
    Id TEXT PRIMARY KEY,
    Port INTEGER NOT NULL,
    Available BOOLEAN NOT NULL,
    Reason TEXT,
    ProcessName TEXT,
    ProcessPid INTEGER DEFAULT 0,
    CheckedAt DATETIME NOT NULL,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

## 3. Reset API (2-Step Confirmation)

### Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         2-STEP RESET CONFIRMATION                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   STEP 1: Request Reset                                                      │
│   POST /api/v1/reset/request                                                │
│   Body: { "Scope": "runs" }                                                 │
│                                                                              │
│   Response:                                                                  │
│   {                                                                          │
│     "ResetId": "rst_abc123",                                                │
│     "Scope": "runs",                                                         │
│     "ExpiresAt": "2026-02-02T10:35:00Z",                                    │
│     "AffectedCount": 45,                                                    │
│     "Message": "Confirm within 5 minutes"                                   │
│   }                                                                          │
│                                                                              │
│   STEP 2: Confirm Reset                                                      │
│   POST /api/v1/reset/confirm                                                │
│   Body: { "ResetId": "rst_abc123" }                                         │
│                                                                              │
│   Response:                                                                  │
│   {                                                                          │
│     "Status": "completed",                                                   │
│     "DeletedDatabases": 45,                                                 │
│     "FreedBytes": 125829120                                                 │
│   }                                                                          │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Reset Scopes

| Scope | Description | Databases Affected |
|-------|-------------|--------------------|
| `all` | Full system reset | All in `data/` |
| `runs` | Run history only | `runs/*.db` |
| `profile:{name}` | Specific profile runs | Runs matching profile |

### API Endpoints

```
POST /api/v1/reset/request
  Body: { "Scope": "runs" | "profile:{name}" | "all" }
  Returns: { "ResetId", "Scope", "ExpiresAt", "AffectedCount" }

POST /api/v1/reset/confirm
  Body: { "ResetId": "rst_abc123" }
  Returns: { "Status", "DeletedDatabases", "FreedBytes" }

POST /api/v1/reset/cancel
  Body: { "ResetId": "rst_abc123" }
  Returns: { "Status": "cancelled" }
```

---

## 4. Import/Export API

### Export (SQLite Bundle)

```
POST /api/v1/export
  Body: { "Type": "runs" | "profiles" | "all" }
  Returns: Binary .db file download
```

### Import

```
POST /api/v1/import
  Body: multipart/form-data with .db file
  Returns: { "Imported": true, "ProfileCount": 5, "RunCount": 45 }
```

---

## API to DB Mapping

| Endpoint | Action | Target DB |
|----------|--------|-----------|
| `POST /api/v1/run` | Start build | Creates `data/runs/{seq}-{id}.db` |
| `GET /api/v1/runs` | List runs | Reads from `brun.db` → DbRegistry |
| `GET /api/v1/runs/:id` | Get run details | Reads `data/runs/{seq}-{id}.db` |
| `GET /api/v1/runs/:id/errors` | Get build errors | Reads `data/runs/{seq}-{id}.db` → BuildErrors |
| `GET /api/v1/profiles` | List profiles | Reads `brun.db` → Profiles |
| `POST /api/v1/profiles` | Create profile | Writes to `brun.db` → Profiles |

---

## Cross-References

| Reference | Location |
|-----------|----------|
| Split DB Architecture | `spec/06-split-db-architecture/00-overview.md` |
| CLI Examples | `spec/06-split-db-architecture/01-cli-examples.md` |
| Naming Conventions | `.lovable/memories/training/09-database-naming-conventions.md` |
| Original Data Models | `./10-data-models.md` |
