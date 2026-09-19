# Time Log CLI: Architecture

**Version:** 1.0.0  
**Updated:** 2026-03-27

---

## Overview

The Time Log CLI is a background daemon that orchestrates multiple **collector modules** to track user activity at the OS level. It uses an event-driven architecture with a central event bus, local SQLite storage, and an optional HTTP API for the Time Log UI.

---

## System Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Time Log Daemon                    │
│                                                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │
│  │  Browser     │  │  Click      │  │  Screenshot │ │
│  │  Collector   │  │  Collector  │  │  Collector  │ │
│  └──────┬───────┘  └──────┬──────┘  └──────┬──────┘ │
│         │                 │                │        │
│         └────────┬────────┴────────┬───────┘        │
│                  │                 │                 │
│           ┌──────▼──────┐  ┌──────▼──────┐          │
│           │  Event Bus  │  │  App Focus  │          │
│           │  (Channel)  │  │  Collector  │          │
│           └──────┬──────┘  └─────────────┘          │
│                  │                                  │
│           ┌──────▼──────┐                           │
│           │  Storage    │                           │
│           │  Engine     │                           │
│           │  (SQLite)   │                           │
│           └──────┬──────┘                           │
│                  │                                  │
│           ┌──────▼──────┐                           │
│           │  HTTP API   │  (optional, for UI)       │
│           │  Server     │                           │
│           └─────────────┘                           │
└─────────────────────────────────────────────────────┘
```

---

## Daemon Lifecycle

### States

| State | Description |
|-------|-------------|
| `Starting` | Loading config, initializing collectors, opening database |
| `Running` | All collectors active, event bus processing |
| `Paused` | Collectors suspended (user-triggered or idle detection) |
| `Stopping` | Flushing buffers, closing database, saving state |
| `Stopped` | Daemon not running |

### Startup Sequence

1. Parse CLI arguments and load configuration from `~/.timelog/config.toml`
2. Initialize SQLite database (create tables if first run)
3. Start event bus (bounded async channel)
4. Initialize and start each enabled collector
5. Start HTTP API server (if enabled)
6. Register OS signal handlers (SIGTERM, SIGINT, SIGHUP)
7. Enter main event loop

### Shutdown Sequence

1. Signal received → set shutdown flag
2. Stop all collectors (graceful drain with 5-second timeout)
3. Flush event bus (process remaining events)
4. Close HTTP API server
5. Flush WAL and close SQLite connection
6. Write shutdown timestamp to state file
7. Exit with code 0

---

## Collector Module Interface

Every collector implements the `Collector` trait:

```rust
#[async_trait]
pub trait Collector: Send + Sync {
    /// Unique identifier for this collector
    fn name(&self) -> &'static str;

    /// Start collecting events. Send events via the provided sender.
    async fn start(&mut self, sender: EventSender) -> Result<(), CollectorError>;

    /// Gracefully stop collecting.
    async fn stop(&mut self) -> Result<(), CollectorError>;

    /// Check if this collector is supported on the current OS.
    fn is_supported(&self) -> bool;
}
```

### Built-in Collectors

| Collector | Description | Spec |
|-----------|-------------|------|
| `BrowserCollector` | Active tab URL, title, dwell time | [03-browser-tracking.md](./03-browser-tracking.md) |
| `ClickCollector` | Mouse click coordinates, target window | [02-os-integration.md](./02-os-integration.md) |
| `ScreenshotCollector` | Periodic/event-driven screen captures | [04-screenshot-capture.md](./04-screenshot-capture.md) |
| `AppFocusCollector` | Active application name, window title | [02-os-integration.md](./02-os-integration.md) |
| `IdleCollector` | Detect user idle/away state | [02-os-integration.md](./02-os-integration.md) |

---

## Event Bus

The event bus uses Tokio's bounded MPSC channel:

```rust
pub enum ActivityEvent {
    BrowserTabChange {
        url: String,
        title: String,
        browser: BrowserType,
        timestamp: DateTime<Utc>,
    },
    AppFocusChange {
        app_name: String,
        window_title: String,
        timestamp: DateTime<Utc>,
    },
    MouseClick {
        x: i32,
        y: i32,
        window_title: String,
        app_name: String,
        timestamp: DateTime<Utc>,
    },
    ScreenshotCaptured {
        path: PathBuf,
        trigger: ScreenshotTrigger,
        timestamp: DateTime<Utc>,
    },
    IdleStateChange {
        is_idle: bool,
        idle_seconds: u64,
        timestamp: DateTime<Utc>,
    },
    SessionStart {
        session_id: Uuid,
        timestamp: DateTime<Utc>,
    },
    SessionEnd {
        session_id: Uuid,
        timestamp: DateTime<Utc>,
    },
}
```

### Event Processing

- **Buffer size:** 1,000 events (configurable)
- **Batch writes:** Events are batched and written to SQLite every 5 seconds or when buffer reaches 100 events
- **Back-pressure:** If buffer is full, oldest non-critical events are dropped with a warning log
- **Ordering:** Events are processed in timestamp order within each batch

---

## Configuration

Configuration file: `~/.timelog/config.toml`

```toml
[General]
DataDirectory = "~/.timelog/data"
LogLevel = "Info"
AutoStart = true

[Collectors]
BrowserTracking = true
ClickTracking = true
ScreenshotCapture = true
AppFocusTracking = true
IdleDetection = true

[Screenshot]
IntervalSeconds = 300
OnTabChange = true
OnAppSwitch = false
Format = "WebP"
Quality = 80
MaxStorageMb = 5000

[Privacy]
ExcludeUrls = ["*bank*", "*healthcare*", "*.gov/*"]
ExcludeApps = ["1Password", "KeePass"]
BlurScreenshots = false
RetentionDays = 90

[Api]
Enabled = false
Port = 9847
BindAddress = "127.0.0.1"

[Idle]
IdleThresholdSeconds = 300
PauseTrackingOnIdle = true
```

---

## Directory Structure

```
~/.timelog/
├── config.toml              # User configuration
├── state.json               # Daemon state (last run, session info)
├── data/
│   ├── timelog.db            # SQLite database
│   ├── timelog.db-wal        # WAL file
│   └── screenshots/
│       ├── 2026/
│       │   ├── 03/
│       │   │   ├── 27/
│       │   │   │   ├── 094532-browser-tab.webp
│       │   │   │   ├── 095000-periodic.webp
│       │   │   │   └── ...
```

---

## Performance Targets

| Metric | Target |
|--------|--------|
| CPU usage (idle) | < 0.5% |
| CPU usage (active tracking) | < 1% |
| Memory (RSS) | < 50 MB |
| Event processing latency | < 10 ms (p99) |
| SQLite write batch | < 50 ms |
| Screenshot capture time | < 200 ms |
| Binary size | < 15 MB |
| Startup time | < 500 ms |

---

## Cross-References

| Reference | Location |
|-----------|----------|
| Backend Overview | `./00-overview.md` |
| OS Integration | `./02-os-integration.md` |
| Browser Tracking | `./03-browser-tracking.md` |
| Screenshot Capture | `./04-screenshot-capture.md` |
| Database Schema | `./05-database-schema.md` |
| API Interface | `./06-api-interface.md` |
| Error Codes | `./07-error-codes.md` |
