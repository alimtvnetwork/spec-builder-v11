# GSearch Scheduled Search Specification

**Version:** 2.0.0  
**Updated:** 2026-03-09  
**Error Range:** 7860-7879

---

## Overview

Scheduled search enables cron-based, interval-based, and one-time scheduled searches across all GSearch capabilities including Google Maps, multi-source search, and BI Suite features. Results are persisted and can trigger webhooks.

---

## Scheduling Patterns

| Pattern Type | Format | Example |
|--------------|--------|---------|
| Cron | Standard cron expression | `0 9 * * 1` (Monday 9am) |
| Interval | `every {N} {unit}` | `every 6 hours`, `every 2 days` |
| One-Time | ISO 8601 datetime | `2026-02-10T14:30:00Z` |

---

## API Endpoints

### Create Scheduled Search

```
POST /api/v1/schedules
```

**Request Body:**

```go
// SearchParameters holds typed parameters for scheduled searches
type SearchParameters struct {
    Engine     string   `json:",omitempty"` // google, bing, duckduckgo
    Platform   string   `json:",omitempty"` // youtube, reddit, medium
    Provider   string   `json:",omitempty"` // serpapi, serper, scrape
    Mode       string   `json:",omitempty"` // api, scrape, auto
    MaxResults int      `json:",omitempty"` // Result limit
    Location   string   `json:",omitempty"` // Geographic location
    Language   string   `json:",omitempty"` // Language code
    Domains    []string `json:",omitempty"` // Site-search domains
    Depth      int      `json:",omitempty"` // FAQ expansion depth
}

type CreateScheduleRequest struct {
    Name        string            `json:",omitempty"` // Human-readable name
    SearchType  string            `json:",omitempty"` // "web", "maps", "parallel", "site", "faq", "contact"
    Query       string            `json:",omitempty"` // Search query
    Parameters  SearchParameters  `json:",omitempty"` // Type-specific parameters
    Schedule    ScheduleConfig    `json:",omitempty"`
    Webhook     *WebhookConfig    `json:",omitempty"` // Optional webhook on completion
    IsEnabled   bool              `json:",omitempty"`
}

type ScheduleConfig struct {
    Type      string `json:",omitempty"` // "cron", "interval", "onetime"
    Cron      string `json:",omitempty"` // Cron expression
    Interval  string `json:",omitempty"` // "every 6 hours"
    RunAt     string `json:",omitempty"` // ISO 8601 for one-time
    Timezone  string `json:",omitempty"` // Default: "UTC"
}

type WebhookConfig struct {
    Url     string            `json:",omitempty"`
    Method  string            `json:",omitempty"` // POST, PUT
    Headers map[string]string `json:",omitempty"`
    Secret  string            `json:",omitempty"` // HMAC signing secret
}
```

### List Schedules

```
GET /api/v1/schedules
```

### Get Schedule

```
GET /api/v1/schedules/{id}
```

### Update Schedule

```
PATCH /api/v1/schedules/{id}
```

### Delete Schedule

```
DELETE /api/v1/schedules/{id}
```

### Trigger Immediately

```
POST /api/v1/schedules/{id}/run
```

### Get Schedule History

```
GET /api/v1/schedules/{id}/history
```

---

## Database Schema

### Schedules Table

```sql
CREATE TABLE Schedules (
    Id TEXT PRIMARY KEY,
    Name TEXT NOT NULL,
    SearchType TEXT NOT NULL,
    Query TEXT NOT NULL,
    Parameters TEXT,                 -- JSON
    ScheduleType TEXT NOT NULL,      -- "cron", "interval", "onetime"
    CronExpression TEXT,
    IntervalValue INTEGER,
    IntervalUnit TEXT,               -- "minutes", "hours", "days", "weeks"
    RunAt DATETIME,                  -- For one-time schedules
    Timezone TEXT DEFAULT 'UTC',
    NextRunAt DATETIME,
    LastRunAt DATETIME,
    IsEnabled INTEGER DEFAULT 1,
    RunCount INTEGER DEFAULT 0,
    SuccessCount INTEGER DEFAULT 0,
    FailureCount INTEGER DEFAULT 0,
    WebhookUrl TEXT,
    WebhookMethod TEXT,
    WebhookHeaders TEXT,             -- JSON
    WebhookSecret TEXT,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IdxSchedulesNextRun ON Schedules(NextRunAt) WHERE IsEnabled = 1;
CREATE INDEX IdxSchedulesType ON Schedules(SearchType);
```

### ScheduleExecutions Table

```sql
CREATE TABLE ScheduleExecutions (
    Id TEXT PRIMARY KEY,
    ScheduleId TEXT NOT NULL,
    StartedAt DATETIME NOT NULL,
    CompletedAt DATETIME,
    Status TEXT NOT NULL,            -- "running", "completed", "failed"
    ResultCount INTEGER,
    ResultsPath TEXT,                -- Path to stored results
    ErrorMessage TEXT,
    DurationMs INTEGER,
    WebhookStatus INTEGER,           -- HTTP status code
    WebhookResponse TEXT,
    FOREIGN KEY (ScheduleId) REFERENCES Schedules(Id) ON DELETE CASCADE
);

CREATE INDEX IdxExecutionsSchedule ON ScheduleExecutions(ScheduleId);
CREATE INDEX IdxExecutionsStatus ON ScheduleExecutions(Status);
```

---

## Scheduler Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    SchedulerService                     │
│  • Runs as background goroutine                         │
│  • Polls NextRunAt every 30 seconds                     │
│  • Maintains worker pool for execution                  │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                   ExecutionQueue                        │
│  • Priority queue ordered by NextRunAt                  │
│  • Deduplicates concurrent triggers                     │
│  • Handles backpressure                                 │
└─────────────────────────────────────────────────────────┘
                           │
           ┌───────────────┼───────────────┐
           ▼               ▼               ▼
    ┌──────────┐    ┌──────────┐    ┌──────────┐
    │  Worker  │    │  Worker  │    │  Worker  │
    │    1     │    │    2     │    │    3     │
    └──────────┘    └──────────┘    └──────────┘
           │               │               │
           └───────────────┼───────────────┘
                           ▼
┌─────────────────────────────────────────────────────────┐
│                   ResultPersister                       │
│  • Store results in Split DB                            │
│  • Trigger webhooks                                     │
│  • Update schedule metadata                             │
└─────────────────────────────────────────────────────────┘
```

---

## Go Interfaces

```go
type SchedulerService interface {
    Create(context stdctx.Context, req CreateScheduleRequest) appfault.Result[*Schedule]
    Get(context stdctx.Context, id string) appfault.Result[*Schedule]
    List(context stdctx.Context, opts ListOptions) appfault.ResultSlice[Schedule]
    Update(context stdctx.Context, id string, req UpdateScheduleRequest) appfault.Result[*Schedule]
    Delete(context stdctx.Context, id string) *appfault.AppError
    RunNow(context stdctx.Context, id string) appfault.Result[*ScheduleExecution]
    GetHistory(context stdctx.Context, id string, opts ListOptions) appfault.ResultSlice[ScheduleExecution]
    Start() *appfault.AppError
    Stop() *appfault.AppError
}

type Schedule struct {
    Id           string
    Name         string
    SearchType   string
    Query        string
    Parameters   SearchParameters
    ScheduleType string
    NextRunAt    time.Time
    LastRunAt    *time.Time
    IsEnabled    bool
    RunCount     int
    SuccessCount int
    FailureCount int
}

type ScheduleExecution struct {
    Id            string
    ScheduleId    string
    StartedAt     time.Time
    CompletedAt   *time.Time
    Status        string
    ResultCount   int
    ErrorMessage  string
    DurationMs    int64
}
```

---

## CLI Commands

```bash
# Create cron schedule
gsearch schedule create \
  --name "Weekly competitor check" \
  --type maps \
  --query "coffee shops near 90210" \
  --cron "0 9 * * 1"

# Create interval schedule
gsearch schedule create \
  --name "Hourly news" \
  --type parallel \
  --query "AI news" \
  --platforms google,bing \
  --every "6 hours"

# Create one-time schedule
gsearch schedule create \
  --name "Product launch search" \
  --type web \
  --query "product announcement" \
  --run-at "2026-03-01T09:00:00Z"

# List schedules
gsearch schedule list

# Trigger immediately
gsearch schedule run {id}

# View history
gsearch schedule history {id}

# Disable schedule
gsearch schedule disable {id}
```

---

## Error Codes

| Code | Constant | Description |
|------|----------|-------------|
| 7860 | ErrScheduleInit | Scheduler service initialization failed |
| 7861 | ErrScheduleNotFound | Schedule not found |
| 7862 | ErrInvalidCron | Invalid cron expression |
| 7863 | ErrInvalidInterval | Invalid interval format |
| 7864 | ErrInvalidRunAt | Invalid one-time run datetime |
| 7865 | ErrScheduleDisabled | Cannot run disabled schedule |
| 7866 | ErrScheduleAlreadyRunning | Schedule is already executing |
| 7867 | ErrWebhookFailed | Webhook delivery failed |
| 7868 | ErrSchedulerStopped | Scheduler service not running |
| 7869 | ErrMaxSchedulesExceeded | Maximum schedule limit reached |
| 7870 | ErrExecutionTimeout | Schedule execution timed out |
| 7871 | ErrResultPersistence | Failed to persist schedule results |

---

## Configuration (config.seed.json)

```json
{
  "scheduledSearch": {
    "seedVersion": "1.0.0",
    "values": {
      "maxSchedules": 100,
      "maxConcurrentExecutions": 5,
      "pollIntervalSeconds": 30,
      "executionTimeoutSeconds": 300,
      "resultRetentionDays": 30,
      "webhookTimeoutSeconds": 30,
      "webhookRetryAttempts": 3
    }
  }
}
```

---

## Cross-References

| Reference | Location |
|-----------|----------|
| Multi-Source Search | `02-spec/25-gsearch-cli/01-backend/56-multi-source-search.md` |
| Google Maps | `02-spec/25-gsearch-cli/01-backend/52-google-maps-search.md` |
| Chrome Extension | `02-spec/25-gsearch-cli/04-extensions/01-chrome-extension.md` |
