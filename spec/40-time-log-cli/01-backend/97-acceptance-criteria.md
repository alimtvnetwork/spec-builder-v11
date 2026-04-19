# Time Log CLI Backend: Acceptance Criteria

**Version:** 2.0.0  
**Updated:** 2026-03-28

---

## Overview

Acceptance criteria for the Time Log CLI backend module. Organized by spec file, each criterion defines a testable requirement for implementation sign-off. Error codes reference the 15000–15499 range defined in `07-error-codes.md`.

**Total Criteria: 104** (64 original + 40 new)

---

## Acceptance Criteria Index

| Group | Source File | Criteria | Error Range |
|-------|-----------|----------|-------------|
| AC-BE-ARCH | `01-architecture.md` | 01–12 | 15000–15049 |
| AC-BE-OS | `02-os-integration.md` | 13–22 | 15150–15199 |
| AC-BE-BROWSER | `03-browser-tracking.md` | 23–32 | 15200–15249 |
| AC-BE-SCREENSHOT | `04-screenshot-capture.md` | 33–42 | 15250–15299 |
| AC-BE-DB | `05-database-schema.md` | 43–52 | 15100–15149 |
| AC-BE-API | `06-api-interface.md` | 53–64 | 15400–15449 |
| AC-BE-FILEPATH | `08-file-path-extraction.md` | 65–74 | 15300–15349 |
| AC-BE-SYNC | `09-remote-sync.md` | 75–86 | 15450–15459 |
| AC-BE-SETTINGS | `10-remote-settings.md` | 87–96 | 15460–15464 |
| AC-BE-SLICE | `11-time-slice-productivity.md` | 97–104 | 15470–15474 |

---

## AC-BE-ARCH — Architecture & Daemon Lifecycle

| # | Criterion | Edge Cases |
|---|-----------|------------|
| 01 | Daemon starts and enters `Running` state within 3 seconds | Missing config file creates default (error 15050) |
| 02 | `timelog start` fails with error 15000 if another instance is already running | PID file stale from crash → detect and overwrite |
| 03 | `timelog stop` shuts down gracefully within 5 seconds | Timeout triggers forced shutdown (error 15003) |
| 04 | `timelog pause` suspends all collectors; `timelog resume` restarts them | Pause during idle state is a no-op |
| 05 | Event bus processes all collector events without data loss under normal load | Buffer overflow logs warning (error 15005) |
| 06 | SIGTERM and SIGINT trigger graceful shutdown sequence | SIGKILL cannot be caught — state file may be stale |
| 07 | SIGHUP reloads configuration without restarting daemon | Invalid config on reload keeps previous config |
| 08 | Each collector starts/stops independently | Single collector failure does not affect others (error 15006) |
| 09 | Daemon CPU usage stays below 1% during background tracking | Spike allowed during screenshot capture |
| 10 | Daemon memory usage stays below 50 MB during steady state | Memory spike allowed during bulk export |
| 11 | Startup writes PID to `~/.timelog/daemon.pid` | PID file removed on clean shutdown |
| 12 | Shutdown flushes all pending events before closing database | Unflushed events logged on forced shutdown |

---

## AC-BE-OS — OS Integration

| # | Criterion | Edge Cases |
|---|-----------|------------|
| 13 | Active window detection returns app name and title on all 3 platforms | Fullscreen apps return correct title |
| 14 | Window title extraction handles UTF-8/Unicode characters | Emoji in titles preserved |
| 15 | App focus events fire within 1 second of window switch | Rapid switching (< 100ms) coalesces into single event |
| 16 | Process name resolved from PID on all platforms | Terminated process returns "unknown" |
| 17 | Mouse click hooks capture click position (x, y) and button type | Click during screen lock ignored |
| 18 | Idle detection fires after configurable threshold (default 5 min) | System sleep treated as idle start |
| 19 | Idle resume fires when user input resumes after idle | Mouse jiggler patterns detected as idle |
| 20 | Autostart registration works on all 3 platforms | Permission denied returns error 15150 |
| 21 | `timelog uninstall` removes autostart entry | Missing entry is a no-op, not an error |
| 22 | Conditional compilation includes only target platform code | `cargo build` succeeds on each platform without cross-platform deps |

---

## AC-BE-BROWSER — Browser Tracking

| # | Criterion | Edge Cases |
|---|-----------|------------|
| 23 | Window title parsing extracts page title for Chrome, Firefox, Edge, Brave, Opera | Custom title formats handled gracefully |
| 24 | Safari detection works via AppleScript/JXA on macOS | Safari not installed → collector skips Safari |
| 25 | Dwell time calculated as duration between consecutive tab change events | Tab open with no focus switch → no dwell recorded |
| 26 | Incognito/private browsing tabs excluded when config option enabled | Incognito detection method varies by browser |
| 27 | Browser extension (optional) provides full URL via native messaging | Extension not installed → fall back to title parsing |
| 28 | URL categorization assigns category based on domain pattern matching | Unknown domains categorized as "Other" |
| 29 | Dwell time < 2 seconds discarded as noise | Configurable threshold in `config.toml` |
| 30 | Multiple browser windows tracked independently | Inactive browser windows not counted as active |
| 31 | Browser crash or restart does not crash the collector | Collector logs warning (error 15200) and continues |
| 32 | Privacy-excluded URLs (bank, healthcare patterns) never stored | Exclusion patterns matched before database write |

---

## AC-BE-SCREENSHOT — Screenshot Capture

| # | Criterion | Edge Cases |
|---|-----------|------------|
| 33 | Periodic capture fires at configured interval (default 5 min) | Interval of 0 disables periodic capture |
| 34 | `OnTabChange` trigger captures screenshot on browser tab switch | Rapid tab switching throttled to 1 capture/5s |
| 35 | `OnAppSwitch` trigger captures screenshot on app focus change | Disabled by default — opt-in via config |
| 36 | Manual capture via `timelog screenshot` succeeds immediately | Returns error 15250 if screen capture permission denied |
| 37 | Screenshots compressed to WebP (default), JPEG, or PNG per config | WebP quality 80 produces < 200 KB for typical screen |
| 38 | Privacy blur applied to configured regions before storage | Blur regions validated at config load time |
| 39 | Screenshots stored in date-organized directories (`YYYY/MM/DD/`) | Directory created on first capture of the day |
| 40 | Storage limit enforced by deleting oldest screenshots first | Deletion logged; user notified if > 10% deleted at once |
| 41 | Retention policy deletes screenshots older than N days (default 90) | Cleanup runs daily at midnight local time |
| 42 | Multi-monitor `AllDisplays` mode stitches monitors into single image | Monitors with different DPI scale correctly |

---

## AC-BE-DB — Database & Storage

| # | Criterion | Edge Cases |
|---|-----------|------------|
| 43 | SQLite database created on first run with all tables and indices | Existing database not overwritten — migrations applied |
| 44 | WAL mode enabled with `PRAGMA journal_mode=WAL` | WAL file cleaned up on graceful shutdown |
| 45 | All column names use PascalCase (`Id`, `SessionId`, `CapturedAt`) | Rust structs use `#[serde(rename_all = "PascalCase")]` |
| 46 | Foreign key constraints enforced (`PRAGMA foreign_keys=ON`) | Orphan records prevented on session deletion |
| 47 | `Session` table tracks start/end times with UUID primary key | Session without end time means daemon crashed |
| 48 | `AppActivity` records link to session via `SessionId` foreign key | Entries without valid session rejected |
| 49 | `DailySummary` materialized view updated on session close | Partial-day summary updated incrementally |
| 50 | Database file locked during writes; concurrent reads via WAL | Lock contention returns error 15101 after 5s timeout |
| 51 | `timelog cleanup --dry-run` reports deletions without executing | `--dry-run` output includes size to be reclaimed |
| 52 | Database migration system applies schema changes on version upgrade | Failed migration rolls back and reports error 15102 |

---

## AC-BE-API — HTTP REST API & CLI Commands

| # | Criterion | Edge Cases |
|---|-----------|------------|
| 53 | HTTP server binds to `127.0.0.1:9847` when API enabled in config | Port already in use returns error 15400 |
| 54 | API requires bearer token when `[Api] Token` is set in config | Missing token returns 401 with error code 15401 |
| 55 | `GET /api/v1/status` returns daemon state, uptime, and collector status | Response within 50ms |
| 56 | `GET /api/v1/activities/apps` returns paginated app activity | `?page=1&page_size=50` defaults; max page_size 200 |
| 57 | `GET /api/v1/activities/browser` returns paginated browser activity | Filters: `?from=`, `?to=`, `?category=` |
| 58 | `GET /api/v1/screenshots` returns paginated screenshot metadata | Actual image served via `GET /api/v1/screenshots/:id/image` |
| 59 | `GET /api/v1/summary/daily` returns aggregated stats for a date | Missing date defaults to today |
| 60 | `POST /api/v1/control/pause` and `/resume` toggle tracking state | Pause when already paused is a no-op (200 OK) |
| 61 | `PATCH /api/v1/config` updates config and reloads daemon | Invalid config values return 400 with field-level errors |
| 62 | `timelog export --format csv` generates valid CSV with headers | Empty date range produces empty file with headers only |
| 63 | `timelog report --from --to` generates summary for date range | Range exceeding 365 days returns error 15450 |
| 64 | All API responses use PascalCase JSON keys | Error responses follow `{ "Error": { "Code": N, "Message": "..." } }` format |

---

## AC-BE-FILEPATH — File Path Extraction

| # | Criterion | Edge Cases |
|---|-----------|------------|
| 65 | VS Code parser extracts filename and folder from default title format | Dirty indicator (`● `) stripped before parsing |
| 66 | VS Code parser extracts full path when `window.title` includes `${activeEditorLong}` | WSL paths (`/mnt/c/...`) normalized to Windows-style |
| 67 | JetBrains parser extracts project name and relative file path | Module suffix (`[module-name]`) stripped cleanly |
| 68 | Microsoft Office parser extracts filename from `{name} - Word` pattern | `[Read-Only]` and `[Compatibility Mode]` modifiers removed |
| 69 | Terminal parser extracts CWD from `user@host: /path` and similar formats | Home-relative paths (`~`) expanded to absolute path |
| 70 | Fallback regex patterns match Unix absolute (`/...`), Windows absolute (`C:\...`), and home-relative (`~/...`) paths | Filename-only fallback scores confidence ≤ 0.3 |
| 71 | Path normalization converts backslashes to forward slashes and expands `~` | macOS HFS+ case-insensitive comparison used for dedup |
| 72 | Project root detection walks parent directories for `.git`, `Cargo.toml`, `package.json`, etc. | Symlink-heavy trees handled via optional `realpath` resolution |
| 73 | Extracted `FilePath`, `FileName`, `FileExtension`, `ProjectRoot` written to `AppActivity` table | All new columns nullable — NULL when extraction fails or confidence below threshold |
| 74 | `GET /api/v1/summary/projects` returns time-per-project roll-up | Projects with < 60s total dwell excluded from summary |

---

## AC-BE-SYNC — Remote Sync & Offline Queue

| # | Criterion | Edge Cases |
|---|-----------|------------|
| 75 | Every local write simultaneously enqueues a record in `SyncQueue` with status `Queued` | Enqueue failure logs error 15451 but does not block local write |
| 76 | Sync engine drains outbox in batches of up to 100 records / 5 MB | Batch exceeding 5 MB split at payload boundary |
| 77 | Successful upload (200) marks all batch records as `Synced` with server confirmation timestamp | Server returns per-record acceptance status |
| 78 | Partial success (207) marks accepted records as `Synced` and rejected records as `Failed` with error detail | Rejected duplicates treated as success (idempotent) |
| 79 | Failed upload retries with exponential backoff: 5s → 10s → 20s → ... → 3600s (10 max retries) | Jitter (±25%) applied to prevent thundering herd |
| 80 | After 10 failed retries, record marked as permanently `Failed` and excluded from future sync | `timelog sync reset` clears failed records for re-attempt |
| 81 | Synced records purged from local database after configurable retention (default 24h) | `DailySummary` table never purged — permanent local cache |
| 82 | Screenshot files deleted from disk only after both metadata sync confirmed and purge retention elapsed | Missing file on purge logs warning, does not error |
| 83 | Connectivity monitor detects online/offline using platform APIs (WinRT, NetworkManager, NWPathMonitor) | Falls back to HTTP ping if platform API unavailable |
| 84 | `timelog sync-status` displays queue depth, last sync time, pending screenshots, and reclaimable storage | Offline state shown with time since last successful sync |
| 85 | `timelog sync now` forces an immediate sync cycle bypassing the interval timer | No-op if already syncing; returns current sync progress |
| 86 | Payload integrity verified via SHA-256 hash in `X-Payload-Hash` header | Server rejects requests with hash mismatch (400) |

---

## AC-BE-SETTINGS — Remote Settings

| # | Criterion | Edge Cases |
|---|-----------|------------|
| 87 | Settings fetcher polls remote API at configurable interval (default 5 min) | ETag-based conditional request returns 304 when unchanged |
| 88 | Remote settings override local `config.toml` defaults for all non-pinned fields | Pinned fields logged at startup for admin visibility |
| 89 | User can pin specific fields via `POST /api/v1/settings/pin` to prevent remote override | Pinned fields survive daemon restart (persisted in config) |
| 90 | Settings validation rejects out-of-range values before application | `ClickThreshold50Percent` must be < `ClickThreshold100Percent` (error 15461) |
| 91 | Hot-reload applies changed settings to running collectors without daemon restart | Collector toggle (enable/disable) starts/stops collector within 1 second |
| 92 | Offline fallback loads cached settings from `settings-cache.json` when remote unreachable | Cache file corruption falls back to local `config.toml` (error 15463) |
| 93 | `GET /api/v1/settings/sources` shows effective value, source (Local/Remote/LocalPinned), and both values per field | Response includes remote settings version number |
| 94 | `POST /api/v1/settings/refresh` triggers immediate remote settings fetch | Returns 200 with diff of changed fields |
| 95 | Schedule settings (`ActiveDays`, `ActiveStartTime`, `ActiveEndTime`) pause tracking outside configured window | Timezone override respected; null = system timezone |
| 96 | Remote settings fetch failure does not disrupt active tracking | Failure logged as warning (error 15460); retry on next interval |

---

## AC-BE-SLICE — Time Slice Productivity Model

| # | Criterion | Edge Cases |
|---|-----------|------------|
| 97 | Time slices created at configurable duration (default 5 min) with sequential `SliceIndex` per day | Daemon restart mid-slice finalizes partial slice with actual elapsed time |
| 98 | Activity score calculated as weighted composite: clicks (40%) + active time (35%) + screenshots (15%) + engagement (10%) | Weights configurable via remote settings; sum must equal 1.0 |
| 99 | Click score uses linear interpolation between 50% threshold and 100% threshold | Zero clicks scores 0.0; exceeding 100% threshold caps at 1.0 |
| 100 | Screenshot score = `min(1.0, captured / required)` per slice | `ScreenshotsPerSlice = 0` → screenshot score defaults to 1.0 (not required) |
| 101 | Productivity level classified: Full (≥0.80), High (≥0.60), Medium (≥0.40), Low (≥0.20), Minimal (>0), Idle (=0) | `OutOfWindow` level assigned for slices outside tracking schedule |
| 102 | `TimeSlice` table stores `ConfigSnapshot` (JSON) of scoring thresholds used for auditability | Config changes mid-day do not retroactively re-score previous slices |
| 103 | `GET /api/v1/slices/current` returns live metrics with projected score and per-signal progress | Projected score updates in real-time as events accumulate |
| 104 | `DailySummary` extended with `TotalSlices`, `FullSlices`, `AvgActivityScore`, `ProductivityPercent`, and `PeakHour` | `ProductivityPercent` = (Full + High) / Total × 100 |

---

## Cross-References

| Reference | Location |
|-----------|----------|
| Architecture | `01-architecture.md` |
| OS Integration | `02-os-integration.md` |
| Browser Tracking | `03-browser-tracking.md` |
| Screenshot Capture | `04-screenshot-capture.md` |
| Database Schema | `05-database-schema.md` |
| API Interface | `06-api-interface.md` |
| Error Codes | `07-error-codes.md` |
| File Path Extraction | `08-file-path-extraction.md` |
| Remote Sync | `09-remote-sync.md` |
| Remote Settings | `10-remote-settings.md` |
| Time Slice Productivity | `11-time-slice-productivity.md` |
