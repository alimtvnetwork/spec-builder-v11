# Time Log CLI: Database Schema

**Version:** 1.0.0  
**Updated:** 2026-03-27

---

## Overview

Local SQLite database storing all activity data. Uses WAL mode for concurrent read/write performance. All column names follow **PascalCase** convention per project standards.

---

## Database Configuration

| Setting | Value |
|---------|-------|
| Engine | SQLite 3.40+ |
| Journal mode | WAL (Write-Ahead Logging) |
| Synchronous | NORMAL |
| Cache size | 10,000 pages (~40 MB) |
| Foreign keys | Enabled |
| Location | `{DataDirectory}/timelog.db` |

---

## Entity-Relationship Diagram

```
┌──────────────┐       ┌──────────────────┐
│   Session    │──1:N──│  AppActivity     │
│              │       │                  │
│              │──1:N──│  BrowserActivity │
│              │       │                  │
│              │──1:N──│  ClickAggregate  │
│              │       │                  │
│              │──1:N──│  Screenshot      │
│              │       │                  │
│              │──1:N──│  IdleEvent       │
└──────────────┘       └──────────────────┘

┌──────────────┐
│ UrlCategory  │  (lookup table)
└──────────────┘

┌──────────────┐
│ DailySummary │  (materialized aggregate)
└──────────────┘
```

---

## Table Definitions

### Session

Represents a continuous period of user activity (broken by idle/shutdown).

```sql
CREATE TABLE Session (
    Id              TEXT PRIMARY KEY,  -- UUID v4
    StartedAt       TEXT NOT NULL,     -- ISO 8601 UTC
    EndedAt         TEXT,              -- NULL if session is active
    DurationSeconds REAL,              -- Computed on session end
    EndReason       TEXT NOT NULL DEFAULT 'Active',  -- Active, Idle, Shutdown, UserPaused
    CreatedAt       TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IdxSessionStartedAt ON Session(StartedAt);
CREATE INDEX IdxSessionEndReason ON Session(EndReason);
```

### AppActivity

Tracks active application focus periods.

```sql
CREATE TABLE AppActivity (
    Id            TEXT PRIMARY KEY,  -- UUID v4
    SessionId     TEXT NOT NULL REFERENCES Session(Id) ON DELETE CASCADE,
    AppName       TEXT NOT NULL,     -- e.g., "firefox", "code", "slack"
    WindowTitle   TEXT NOT NULL,
    ProcessId     INTEGER,
    StartedAt     TEXT NOT NULL,
    EndedAt       TEXT,
    DwellSeconds  REAL,
    CreatedAt     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IdxAppActivitySessionId ON AppActivity(SessionId);
CREATE INDEX IdxAppActivityAppName ON AppActivity(AppName);
CREATE INDEX IdxAppActivityStartedAt ON AppActivity(StartedAt);
```

### BrowserActivity

Tracks browser tab visits with optional URL (requires extension).

```sql
CREATE TABLE BrowserActivity (
    Id              TEXT PRIMARY KEY,  -- UUID v4
    SessionId       TEXT NOT NULL REFERENCES Session(Id) ON DELETE CASCADE,
    Url             TEXT,              -- NULL if extension not installed
    Domain          TEXT,              -- Extracted from URL
    Title           TEXT NOT NULL,
    Browser         TEXT NOT NULL,     -- Chrome, Firefox, Edge, Safari, etc.
    Category        TEXT NOT NULL DEFAULT 'Uncategorized',
    StartedAt       TEXT NOT NULL,
    EndedAt         TEXT,
    DwellSeconds    REAL,
    TabSwitchesDuring INTEGER NOT NULL DEFAULT 0,
    CreatedAt       TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IdxBrowserActivitySessionId ON BrowserActivity(SessionId);
CREATE INDEX IdxBrowserActivityDomain ON BrowserActivity(Domain);
CREATE INDEX IdxBrowserActivityCategory ON BrowserActivity(Category);
CREATE INDEX IdxBrowserActivityStartedAt ON BrowserActivity(StartedAt);
```

### ClickAggregate

Aggregated click data per 10-second window (not individual clicks).

```sql
CREATE TABLE ClickAggregate (
    Id            TEXT PRIMARY KEY,  -- UUID v4
    SessionId     TEXT NOT NULL REFERENCES Session(Id) ON DELETE CASCADE,
    AppName       TEXT NOT NULL,
    WindowTitle   TEXT NOT NULL,
    WindowStart   TEXT NOT NULL,     -- 10-second window start
    WindowEnd     TEXT NOT NULL,     -- 10-second window end
    ClickCount    INTEGER NOT NULL,
    AvgX          REAL NOT NULL,
    AvgY          REAL NOT NULL,
    HeatmapData   TEXT,             -- JSON: 10x10 grid cell counts
    CreatedAt     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IdxClickAggregateSessionId ON ClickAggregate(SessionId);
CREATE INDEX IdxClickAggregateWindowStart ON ClickAggregate(WindowStart);
```

### Screenshot

Metadata for captured screenshots (images stored on filesystem).

```sql
CREATE TABLE Screenshot (
    Id                TEXT PRIMARY KEY,  -- UUID v4
    SessionId         TEXT NOT NULL REFERENCES Session(Id) ON DELETE CASCADE,
    FilePath          TEXT NOT NULL UNIQUE,
    FileSizeBytes     INTEGER NOT NULL,
    Width             INTEGER NOT NULL,
    Height            INTEGER NOT NULL,
    Format            TEXT NOT NULL,     -- WebP, Jpeg, Png
    Trigger           TEXT NOT NULL,     -- Periodic, TabChange, AppSwitch, Idle, Manual
    ActiveApp         TEXT NOT NULL,
    ActiveWindowTitle TEXT NOT NULL,
    CapturedAt        TEXT NOT NULL,
    CreatedAt         TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IdxScreenshotSessionId ON Screenshot(SessionId);
CREATE INDEX IdxScreenshotCapturedAt ON Screenshot(CapturedAt);
CREATE INDEX IdxScreenshotTrigger ON Screenshot(Trigger);
```

### IdleEvent

Records periods of user inactivity.

```sql
CREATE TABLE IdleEvent (
    Id            TEXT PRIMARY KEY,  -- UUID v4
    SessionId     TEXT NOT NULL REFERENCES Session(Id) ON DELETE CASCADE,
    StartedAt     TEXT NOT NULL,
    EndedAt       TEXT,              -- NULL if still idle
    DurationSeconds REAL,
    CreatedAt     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IdxIdleEventSessionId ON IdleEvent(SessionId);
CREATE INDEX IdxIdleEventStartedAt ON IdleEvent(StartedAt);
```

### UrlCategory

User-defined URL category mappings.

```sql
CREATE TABLE UrlCategory (
    Id        TEXT PRIMARY KEY,  -- UUID v4
    Name      TEXT NOT NULL UNIQUE,  -- Work, Communication, Social, etc.
    Patterns  TEXT NOT NULL,         -- JSON array of glob patterns
    Color     TEXT,                  -- Hex color for UI display
    SortOrder INTEGER NOT NULL DEFAULT 0,
    CreatedAt TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    UpdatedAt TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
```

### DailySummary

Pre-computed daily aggregates for fast dashboard rendering.

```sql
CREATE TABLE DailySummary (
    Id                    TEXT PRIMARY KEY,  -- UUID v4
    Date                  TEXT NOT NULL UNIQUE,  -- YYYY-MM-DD
    TotalActiveSeconds    REAL NOT NULL DEFAULT 0,
    TotalIdleSeconds      REAL NOT NULL DEFAULT 0,
    TotalBrowserSeconds   REAL NOT NULL DEFAULT 0,
    SessionCount          INTEGER NOT NULL DEFAULT 0,
    ScreenshotCount       INTEGER NOT NULL DEFAULT 0,
    TotalClickCount       INTEGER NOT NULL DEFAULT 0,
    TopApp                TEXT,              -- Most-used application
    TopAppSeconds         REAL,
    TopDomain             TEXT,              -- Most-visited domain
    TopDomainSeconds      REAL,
    CategoryBreakdown     TEXT,              -- JSON: { "Work": 3600, "Social": 900 }
    CreatedAt             TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    UpdatedAt             TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IdxDailySummaryDate ON DailySummary(Date);
```

---

## Migration Strategy

Migrations are embedded in the Rust binary using `rusqlite` with a version table:

```sql
CREATE TABLE SchemaMigration (
    Version   INTEGER PRIMARY KEY,
    Name      TEXT NOT NULL,
    AppliedAt TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
```

Each migration is a numbered SQL file:

```
migrations/
├── 001_initial_schema.sql
├── 002_add_daily_summary.sql
└── ...
```

---

## Query Examples

### Daily productivity breakdown

```sql
SELECT
    ba.Category,
    SUM(ba.DwellSeconds) AS TotalSeconds,
    COUNT(*) AS VisitCount
FROM BrowserActivity ba
WHERE ba.StartedAt >= date('now', '-1 day')
GROUP BY ba.Category
ORDER BY TotalSeconds DESC;
```

### Top 10 applications today

```sql
SELECT
    AppName,
    SUM(DwellSeconds) AS TotalSeconds,
    COUNT(*) AS FocusCount
FROM AppActivity
WHERE StartedAt >= date('now', 'start of day')
GROUP BY AppName
ORDER BY TotalSeconds DESC
LIMIT 10;
```

### Active hours heatmap (hourly breakdown)

```sql
SELECT
    CAST(strftime('%H', StartedAt) AS INTEGER) AS Hour,
    SUM(DwellSeconds) AS ActiveSeconds
FROM AppActivity
WHERE StartedAt >= date('now', '-7 days')
GROUP BY Hour
ORDER BY Hour;
```

---

## Cross-References

| Reference | Location |
|-----------|----------|
| Architecture | `./01-architecture.md` |
| Browser Tracking (BrowserActivity model) | `./03-browser-tracking.md` |
| Screenshot Capture (Screenshot model) | `./04-screenshot-capture.md` |
| API Interface (query endpoints) | `./06-api-interface.md` |
