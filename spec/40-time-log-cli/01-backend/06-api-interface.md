# Time Log CLI: API Interface

**Version:** 1.0.0  
**Updated:** 2026-03-27

---

## Overview

The Time Log CLI provides two interfaces: a **CLI command interface** for local control, and an optional **HTTP REST API** for the Time Log UI web dashboard.

---

## CLI Commands

```
timelog <command> [options]
```

| Command | Description | Example |
|---------|-------------|---------|
| `start` | Start the daemon | `timelog start` |
| `stop` | Stop the daemon gracefully | `timelog stop` |
| `status` | Show daemon status and current session | `timelog status` |
| `pause` | Pause all tracking | `timelog pause` |
| `resume` | Resume tracking after pause | `timelog resume` |
| `screenshot` | Take a manual screenshot | `timelog screenshot` |
| `today` | Show today's activity summary | `timelog today` |
| `report` | Generate a report for a date range | `timelog report --from 2026-03-01 --to 2026-03-27` |
| `export` | Export data as CSV or JSON | `timelog export --format csv --output report.csv` |
| `config` | Show or edit configuration | `timelog config --edit` |
| `cleanup` | Run storage cleanup manually | `timelog cleanup --dry-run` |
| `install` | Register autostart service | `timelog install` |
| `uninstall` | Remove autostart service | `timelog uninstall` |
| `version` | Show version info | `timelog version` |

### CLI Output Format

```
$ timelog status

Time Log CLI v1.0.0
Status:     Running
Session:    a1b2c3d4-e5f6-7890-abcd-ef1234567890
Started:    2026-03-27 08:30:15 UTC
Duration:   1h 15m 17s
Active App: Visual Studio Code
Collectors: Browser ✅  Clicks ✅  Screenshots ✅  AppFocus ✅  Idle ✅

$ timelog today

Today's Summary (2026-03-27)
────────────────────────────
Active Time:    5h 32m
Idle Time:      1h 08m
Sessions:       3
Screenshots:    67
Total Clicks:   2,341

Top Applications:
  1. Visual Studio Code    2h 15m  (40.8%)
  2. Google Chrome         1h 48m  (32.5%)
  3. Terminal              0h 45m  (13.6%)
  4. Slack                 0h 28m  ( 8.4%)
  5. Finder                0h 16m  ( 4.8%)

Top Domains:
  1. github.com            0h 52m
  2. stackoverflow.com     0h 31m
  3. docs.rs               0h 15m
```

---

## HTTP REST API

Enabled via `[Api] Enabled = true` in config. Binds to `127.0.0.1:9847` by default.

### Authentication

- **Local only:** API binds to loopback interface (`127.0.0.1`) — not accessible from network
- **Optional token:** If `[Api] Token` is set in config, all requests must include `Authorization: Bearer {token}`

### Endpoints

#### Status

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/status` | Daemon status and current session |

**Response:**

```json
{
  "Version": "1.0.0",
  "Status": "Running",
  "CurrentSession": {
    "Id": "a1b2c3d4-...",
    "StartedAt": "2026-03-27T08:30:15Z",
    "DurationSeconds": 4517.3
  },
  "Collectors": {
    "Browser": true,
    "Clicks": true,
    "Screenshots": true,
    "AppFocus": true,
    "Idle": true
  }
}
```

#### Activities

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/activities/apps` | App activity list (paginated) |
| `GET` | `/api/v1/activities/browser` | Browser activity list (paginated) |
| `GET` | `/api/v1/activities/clicks` | Click aggregates (paginated) |
| `GET` | `/api/v1/activities/idle` | Idle events (paginated) |

**Common query parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `From` | `DateTime` | Start of today | Start of date range (ISO 8601) |
| `To` | `DateTime` | Now | End of date range (ISO 8601) |
| `Page` | `int` | 1 | Page number |
| `PageSize` | `int` | 50 | Items per page (max 200) |
| `SortBy` | `string` | `StartedAt` | Sort field |
| `SortOrder` | `string` | `Desc` | `Asc` or `Desc` |

**Response envelope:**

```json
{
  "Data": [...],
  "Pagination": {
    "Page": 1,
    "PageSize": 50,
    "TotalItems": 342,
    "TotalPages": 7
  }
}
```

#### Screenshots

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/screenshots` | Screenshot metadata list (paginated) |
| `GET` | `/api/v1/screenshots/{Id}` | Single screenshot metadata |
| `GET` | `/api/v1/screenshots/{Id}/image` | Serve screenshot image file |
| `POST` | `/api/v1/screenshots/capture` | Trigger manual screenshot |

#### Reports & Summaries

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/summary/daily` | Daily summary for a date range |
| `GET` | `/api/v1/summary/hourly` | Hourly breakdown for a specific date |
| `GET` | `/api/v1/summary/apps` | Top applications for a date range |
| `GET` | `/api/v1/summary/domains` | Top domains for a date range |
| `GET` | `/api/v1/summary/categories` | Time by URL category |

**Example: Daily summary**

```json
{
  "Data": [
    {
      "Date": "2026-03-27",
      "TotalActiveSeconds": 19920.0,
      "TotalIdleSeconds": 4080.0,
      "TotalBrowserSeconds": 10800.0,
      "SessionCount": 3,
      "ScreenshotCount": 67,
      "TotalClickCount": 2341,
      "TopApp": "Visual Studio Code",
      "TopAppSeconds": 8100.0,
      "TopDomain": "github.com",
      "TopDomainSeconds": 3120.0,
      "CategoryBreakdown": {
        "Work": 7200,
        "Reference": 2700,
        "Communication": 900
      }
    }
  ]
}
```

#### Sessions

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/sessions` | Session list (paginated) |
| `GET` | `/api/v1/sessions/{Id}` | Single session with activity counts |

#### Control

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/v1/control/pause` | Pause tracking |
| `POST` | `/api/v1/control/resume` | Resume tracking |
| `POST` | `/api/v1/control/cleanup` | Trigger storage cleanup |

#### Export

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/export` | Export data as CSV or JSON |

Query parameters: `From`, `To`, `Format` (`csv` or `json`), `Include` (comma-separated: `apps,browser,clicks,screenshots,idle`)

#### Configuration

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/config` | Get current configuration (sanitized) |
| `PATCH` | `/api/v1/config` | Update configuration fields |

---

## Error Response Format

```json
{
  "Error": {
    "Code": 15001,
    "Message": "Session not found",
    "Detail": "No session with Id 'abc123' exists"
  }
}
```

---

## Cross-References

| Reference | Location |
|-----------|----------|
| Architecture | `./01-architecture.md` |
| Database Schema | `./05-database-schema.md` |
| Error Codes | `./07-error-codes.md` |
| Time Log UI | `../../41-time-log-ui/00-overview.md` |
