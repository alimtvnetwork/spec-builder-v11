# Time Log CLI: Time Slice Productivity Model

**Version:** 1.0.0  
**Updated:** 2026-03-28

---

## Overview

The Time Slice model divides the workday into configurable intervals (default: 5 minutes) and scores each slice based on user activity signals — click count, active time, screenshots captured, and application usage. This provides a granular productivity timeline with per-slice scoring, hourly/daily roll-ups, and trend analysis.

The model is designed for **admin-configurable thresholds**: what constitutes "100% productive" is defined via the Remote Settings API (see `10-remote-settings.md`), not hardcoded.

---

## Core Concepts

### Time Slice

A fixed-duration window of time during which activity is measured.

```rust
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "PascalCase")]
pub struct TimeSlice {
    pub id: Uuid,
    pub session_id: Uuid,
    pub slice_index: u32,            // Sequential index within the day (0-based)
    pub started_at: DateTime<Utc>,
    pub ended_at: DateTime<Utc>,
    pub duration_seconds: u32,       // Configured slice duration

    // Raw metrics
    pub active_seconds: f64,         // Non-idle seconds in this slice
    pub idle_seconds: f64,           // Idle seconds in this slice
    pub click_count: u32,            // Total mouse clicks
    pub keystroke_count: u32,        // Total keystrokes (if enabled)
    pub screenshot_count: u32,       // Screenshots captured
    pub app_switch_count: u32,       // Number of application switches
    pub browser_tab_switches: u32,   // Number of browser tab switches

    // Scored metrics
    pub activity_score: f64,         // 0.0–1.0 overall activity score
    pub click_score: f64,            // 0.0–1.0 click-based score
    pub time_score: f64,             // 0.0–1.0 active-time-based score
    pub screenshot_score: f64,       // 0.0–1.0 screenshot compliance score

    // Context
    pub top_app: Option<String>,     // Most-used application in this slice
    pub top_app_seconds: Option<f64>,
    pub top_domain: Option<String>,  // Most-visited domain in this slice
    pub project_root: Option<String>,// Primary project (from file path extraction)

    // Classification
    pub productivity_level: ProductivityLevel,
}

#[derive(Debug, Clone, Serialize)]
pub enum ProductivityLevel {
    Full,        // activity_score >= 0.80
    High,        // activity_score >= 0.60
    Medium,      // activity_score >= 0.40
    Low,         // activity_score >= 0.20
    Minimal,     // activity_score > 0.00
    Idle,        // activity_score == 0.00 (entire slice was idle)
    OutOfWindow, // Outside configured tracking schedule
}
```

---

## Scoring Algorithm

### Input Signals

| Signal | Weight | Calculation |
|--------|--------|-------------|
| **Click Score** | 40% | `min(1.0, click_count / ClickThreshold100Percent)` |
| **Time Score** | 35% | `min(1.0, active_seconds / (duration_seconds - idle_tolerance))` |
| **Screenshot Score** | 15% | `min(1.0, screenshot_count / ScreenshotsPerSlice)` |
| **Engagement Score** | 10% | Derived from app switches + browser tab switches (see below) |

### Scoring Function

```rust
pub struct ScoringConfig {
    pub click_weight: f64,             // Default: 0.40
    pub time_weight: f64,              // Default: 0.35
    pub screenshot_weight: f64,        // Default: 0.15
    pub engagement_weight: f64,        // Default: 0.10

    pub click_threshold_100: u32,      // From remote settings
    pub click_threshold_50: u32,       // From remote settings
    pub screenshots_per_slice: u32,    // From remote settings
    pub min_active_seconds: u32,       // From remote settings
    pub duration_seconds: u32,         // Slice duration in seconds

    pub idle_tolerance_seconds: u32,   // Grace period (default: 30s)
    pub max_app_switches: u32,         // Cap for engagement (default: 20)
}

impl ScoringConfig {
    pub fn score_slice(&self, metrics: &SliceMetrics) -> ScoredSlice {
        // 1. Click score — linear interpolation with a floor at 50% threshold
        let click_score = if metrics.click_count >= self.click_threshold_100 {
            1.0
        } else if metrics.click_count >= self.click_threshold_50 {
            0.5 + 0.5 * (metrics.click_count - self.click_threshold_50) as f64
                / (self.click_threshold_100 - self.click_threshold_50) as f64
        } else if metrics.click_count > 0 {
            0.5 * metrics.click_count as f64 / self.click_threshold_50 as f64
        } else {
            0.0
        };

        // 2. Time score — ratio of active time to slice duration (minus tolerance)
        let effective_duration = (self.duration_seconds - self.idle_tolerance_seconds) as f64;
        let time_score = if effective_duration > 0.0 {
            (metrics.active_seconds / effective_duration).min(1.0)
        } else {
            if metrics.active_seconds > 0.0 { 1.0 } else { 0.0 }
        };

        // 3. Screenshot score — did we capture enough?
        let screenshot_score = if self.screenshots_per_slice > 0 {
            (metrics.screenshot_count as f64 / self.screenshots_per_slice as f64).min(1.0)
        } else {
            1.0 // Screenshots not required
        };

        // 4. Engagement score — normalized app/tab switching
        let raw_engagement = (metrics.app_switch_count + metrics.browser_tab_switches) as f64;
        let engagement_score = if self.max_app_switches > 0 {
            (raw_engagement / self.max_app_switches as f64).min(1.0)
        } else {
            0.0
        };

        // 5. Weighted composite
        let activity_score =
            click_score * self.click_weight
            + time_score * self.time_weight
            + screenshot_score * self.screenshot_weight
            + engagement_score * self.engagement_weight;

        // 6. Classify
        let productivity_level = match activity_score {
            s if s >= 0.80 => ProductivityLevel::Full,
            s if s >= 0.60 => ProductivityLevel::High,
            s if s >= 0.40 => ProductivityLevel::Medium,
            s if s >= 0.20 => ProductivityLevel::Low,
            s if s > 0.00  => ProductivityLevel::Minimal,
            _              => ProductivityLevel::Idle,
        };

        ScoredSlice {
            activity_score,
            click_score,
            time_score,
            screenshot_score,
            engagement_score,
            productivity_level,
        }
    }
}
```

### Scoring Examples

| Scenario | Clicks | Active | Screenshots | App Switches | Score | Level |
|----------|--------|--------|-------------|--------------|-------|-------|
| Deep coding session | 180 | 290s | 3 | 2 | **0.93** | Full |
| Active browsing + research | 120 | 250s | 2 | 8 | **0.76** | High |
| Meeting (minimal input) | 15 | 280s | 3 | 1 | **0.54** | Medium |
| Brief check-in then AFK | 30 | 90s | 1 | 3 | **0.30** | Low |
| Coffee break | 0 | 10s | 0 | 0 | **0.02** | Minimal |
| Completely idle | 0 | 0s | 0 | 0 | **0.00** | Idle |

---

## Database Schema

```sql
CREATE TABLE TimeSlice (
    Id                  TEXT PRIMARY KEY,    -- UUID v4
    SessionId           TEXT NOT NULL REFERENCES Session(Id) ON DELETE CASCADE,
    SliceIndex          INTEGER NOT NULL,    -- 0-based index in the day
    StartedAt           TEXT NOT NULL,
    EndedAt             TEXT NOT NULL,
    DurationSeconds     INTEGER NOT NULL,

    -- Raw metrics
    ActiveSeconds       REAL NOT NULL DEFAULT 0,
    IdleSeconds         REAL NOT NULL DEFAULT 0,
    ClickCount          INTEGER NOT NULL DEFAULT 0,
    KeystrokeCount      INTEGER NOT NULL DEFAULT 0,
    ScreenshotCount     INTEGER NOT NULL DEFAULT 0,
    AppSwitchCount      INTEGER NOT NULL DEFAULT 0,
    BrowserTabSwitches  INTEGER NOT NULL DEFAULT 0,

    -- Scores
    ActivityScore       REAL NOT NULL DEFAULT 0,
    ClickScore          REAL NOT NULL DEFAULT 0,
    TimeScore           REAL NOT NULL DEFAULT 0,
    ScreenshotScore     REAL NOT NULL DEFAULT 0,
    EngagementScore     REAL NOT NULL DEFAULT 0,
    ProductivityLevel   TEXT NOT NULL DEFAULT 'Idle',

    -- Context
    TopApp              TEXT,
    TopAppSeconds       REAL,
    TopDomain           TEXT,
    ProjectRoot         TEXT,

    -- Thresholds used (snapshot for auditability)
    ConfigSnapshot      TEXT,   -- JSON: the ScoringConfig used for this slice

    CreatedAt           TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IdxTimeSliceSessionId ON TimeSlice(SessionId);
CREATE INDEX IdxTimeSliceStartedAt ON TimeSlice(StartedAt);
CREATE INDEX IdxTimeSliceProductivityLevel ON TimeSlice(ProductivityLevel);
CREATE INDEX IdxTimeSliceProjectRoot ON TimeSlice(ProjectRoot);
```

---

## Slice Lifecycle

### Slice Manager

```rust
pub struct SliceManager {
    config: ScoringConfig,
    current_slice: Option<ActiveSlice>,
    db: Arc<Connection>,
    event_rx: EventReceiver,
}

pub struct ActiveSlice {
    id: Uuid,
    session_id: Uuid,
    slice_index: u32,
    started_at: DateTime<Utc>,
    metrics: SliceMetrics,
}

impl SliceManager {
    pub async fn run(&mut self, mut shutdown: tokio::sync::watch::Receiver<bool>) {
        loop {
            tokio::select! {
                event = self.event_rx.recv() => {
                    if let Some(event) = event {
                        self.handle_event(event).await;
                    }
                }
                _ = shutdown.changed() => {
                    // Finalize current slice
                    if let Some(slice) = self.current_slice.take() {
                        self.finalize_slice(slice).await;
                    }
                    break;
                }
            }

            // Check if current slice has expired
            if let Some(ref slice) = self.current_slice {
                let elapsed = (Utc::now() - slice.started_at).num_seconds();
                if elapsed >= self.config.duration_seconds as i64 {
                    let completed = self.current_slice.take().unwrap();
                    self.finalize_slice(completed).await;
                    self.start_new_slice().await;
                }
            }
        }
    }

    async fn handle_event(&mut self, event: ActivityEvent) {
        // Ensure a slice is active
        if self.current_slice.is_none() {
            self.start_new_slice().await;
        }

        let slice = self.current_slice.as_mut().unwrap();

        match event {
            ActivityEvent::MouseClick { .. } => {
                slice.metrics.click_count += 1;
            }
            ActivityEvent::AppFocusChange { app_name, .. } => {
                slice.metrics.app_switch_count += 1;
                slice.metrics.update_top_app(&app_name);
            }
            ActivityEvent::BrowserTabChange { .. } => {
                slice.metrics.browser_tab_switches += 1;
            }
            ActivityEvent::ScreenshotCaptured { .. } => {
                slice.metrics.screenshot_count += 1;
            }
            ActivityEvent::IdleStateChange { is_idle, .. } => {
                if is_idle {
                    slice.metrics.mark_idle_start();
                } else {
                    slice.metrics.mark_idle_end();
                }
            }
            _ => {}
        }
    }

    async fn finalize_slice(&self, slice: ActiveSlice) {
        let metrics = slice.metrics.finalize(Utc::now());
        let scored = self.config.score_slice(&metrics);

        // Write to database
        self.db.execute(
            "INSERT INTO TimeSlice (...) VALUES (...)",
            // ... all fields
        );

        // Enqueue for sync
        self.sync_enqueuer.enqueue("TimeSlice", &slice.id.to_string(),
            SyncOperation::Insert, &scored);

        tracing::debug!(
            "Slice #{} finalized: score={:.2} level={:?} clicks={} active={:.0}s",
            slice.slice_index, scored.activity_score, scored.productivity_level,
            metrics.click_count, metrics.active_seconds
        );
    }
}
```

---

## Aggregations

### Hourly Roll-Up

```sql
SELECT
    CAST(strftime('%H', StartedAt) AS INTEGER) AS Hour,
    COUNT(*) AS SliceCount,
    AVG(ActivityScore) AS AvgScore,
    SUM(ClickCount) AS TotalClicks,
    SUM(ActiveSeconds) AS TotalActiveSeconds,
    SUM(CASE WHEN ProductivityLevel = 'Full' THEN 1 ELSE 0 END) AS FullSlices,
    SUM(CASE WHEN ProductivityLevel = 'Idle' THEN 1 ELSE 0 END) AS IdleSlices
FROM TimeSlice
WHERE StartedAt >= date('now', 'start of day')
GROUP BY Hour
ORDER BY Hour;
```

### Daily Summary Extension

The existing `DailySummary` table is extended with slice-based metrics:

```sql
ALTER TABLE DailySummary ADD COLUMN TotalSlices        INTEGER NOT NULL DEFAULT 0;
ALTER TABLE DailySummary ADD COLUMN FullSlices          INTEGER NOT NULL DEFAULT 0;
ALTER TABLE DailySummary ADD COLUMN HighSlices          INTEGER NOT NULL DEFAULT 0;
ALTER TABLE DailySummary ADD COLUMN MediumSlices        INTEGER NOT NULL DEFAULT 0;
ALTER TABLE DailySummary ADD COLUMN LowSlices           INTEGER NOT NULL DEFAULT 0;
ALTER TABLE DailySummary ADD COLUMN IdleSlices          INTEGER NOT NULL DEFAULT 0;
ALTER TABLE DailySummary ADD COLUMN AvgActivityScore    REAL NOT NULL DEFAULT 0;
ALTER TABLE DailySummary ADD COLUMN PeakHour            INTEGER;          -- Hour with highest avg score
ALTER TABLE DailySummary ADD COLUMN PeakHourScore       REAL;
ALTER TABLE DailySummary ADD COLUMN ProductivityPercent REAL NOT NULL DEFAULT 0; -- Full+High / Total
```

---

## API Endpoints

### Slice Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/slices` | Time slice list (paginated, filterable) |
| `GET` | `/api/v1/slices/current` | Currently active time slice with live metrics |
| `GET` | `/api/v1/summary/slices/hourly` | Hourly aggregated slice scores |
| `GET` | `/api/v1/summary/slices/daily` | Daily slice summary (extends DailySummary) |
| `GET` | `/api/v1/summary/slices/trends` | Multi-day trend with moving average |

### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `From` | `DateTime` | Start of today | Start of date range |
| `To` | `DateTime` | Now | End of date range |
| `MinScore` | `f64` | `0.0` | Filter slices with score ≥ value |
| `Level` | `String` | All | Filter by productivity level |
| `ProjectRoot` | `String` | All | Filter by project |

### Example: Current Slice (Live)

```
GET /api/v1/slices/current
```

```json
{
  "Id": "s1a2b3c4-...",
  "SliceIndex": 42,
  "StartedAt": "2026-03-28T10:25:00Z",
  "ElapsedSeconds": 187,
  "RemainingSeconds": 113,
  "LiveMetrics": {
    "ClickCount": 67,
    "ActiveSeconds": 175.3,
    "ScreenshotCount": 1,
    "AppSwitchCount": 3,
    "CurrentApp": "Visual Studio Code"
  },
  "ProjectedScore": 0.72,
  "ProjectedLevel": "High",
  "Thresholds": {
    "ClickTarget": 150,
    "ScreenshotTarget": 3,
    "ClickProgress": 0.45,
    "ScreenshotProgress": 0.33,
    "TimeProgress": 0.62
  }
}
```

### Example: Daily Trend

```
GET /api/v1/summary/slices/trends?From=2026-03-21&To=2026-03-28
```

```json
{
  "Data": [
    {
      "Date": "2026-03-28",
      "TotalSlices": 96,
      "FullSlices": 42,
      "HighSlices": 28,
      "MediumSlices": 12,
      "LowSlices": 8,
      "IdleSlices": 6,
      "AvgActivityScore": 0.71,
      "ProductivityPercent": 72.9,
      "PeakHour": 10,
      "PeakHourScore": 0.89
    }
  ],
  "TrendDirection": "Improving",
  "SevenDayAvg": 0.68
}
```

---

## CLI Output

```
$ timelog productivity

Today's Productivity (2026-03-28)
──────────────────────────────────
Overall Score:  72% ████████████████████░░░░░░░░  High
Active Time:    6h 12m / 8h 00m
Total Slices:   74 / 96

Breakdown:
  Full (≥80%)    ████████████████  42 slices
  High (≥60%)    ██████████        28 slices
  Medium (≥40%)  ████              12 slices
  Low (≥20%)     ██                 8 slices
  Idle            █                  6 slices

Peak Hour:      10:00–11:00 (89%)
Current Slice:  #43 — 67 clicks, 2m 55s active, 1 screenshot — projected: High

$ timelog productivity --week

Weekly Trend (Mon 2026-03-23 → Fri 2026-03-28)
────────────────────────────────────────────────
Mon  ████████████████████████░░░░  78%  ▲
Tue  ██████████████████████░░░░░░  68%  ▼
Wed  ████████████████████████░░░░  76%  ▲
Thu  ██████████████████░░░░░░░░░░  58%  ▼
Fri  ████████████████████░░░░░░░░  65%  ▲

7-Day Average:  69%  Trend: Stable
```

---

## Error Codes

| Code | Name | Description |
|------|------|-------------|
| 15470 | `SliceCreationFailed` | Failed to create new time slice record |
| 15471 | `SliceScoringError` | Scoring algorithm encountered invalid input |
| 15472 | `SliceConfigMismatch` | Scoring config changed mid-slice |
| 15473 | `SliceAggregationError` | Failed to compute hourly/daily roll-up |
| 15474 | `SliceOverlap` | Detected overlapping time slices (data integrity issue) |

---

## Cross-References

| Reference | Location |
|-----------|----------|
| Architecture | `./01-architecture.md` |
| OS Integration (click/idle) | `./02-os-integration.md` |
| Screenshot Capture | `./04-screenshot-capture.md` |
| Database Schema | `./05-database-schema.md` |
| API Interface | `./06-api-interface.md` |
| File Path Extraction (project) | `./08-file-path-extraction.md` |
| Remote Sync | `./09-remote-sync.md` |
| Remote Settings (thresholds) | `./10-remote-settings.md` |
