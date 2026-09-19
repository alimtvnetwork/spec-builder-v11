# Time Log CLI Backend — Changelog

**Version:** 1.0.0  
**Last Updated:** 2026-03-28

All notable changes to the Time Log CLI Backend specification are documented here.

---

## v4.0.0 — 2026-03-28

### New Subsystems

Added four new spec files covering previously identified gaps.

#### Added
- `08-file-path-extraction.md` — Title-parsing rules for VS Code, JetBrains, Office, and terminal emulators; fallback regex patterns; path normalization; project root detection; confidence scoring; DB column extensions; API endpoint (`/api/v1/summary/projects`). Error codes 15300–15349.
- `09-remote-sync.md` — Offline-first outbox queue (`SyncQueue` table), batched upload engine (100 records / 5 MB), gzip compression, retry with exponential backoff + jitter, purge lifecycle, per-OS connectivity monitoring, SHA-256 payload integrity, 6 CLI commands. Error codes 15450–15459.
- `10-remote-settings.md` — Remote-wins merge with local pin override, ETag-based conditional polling, full settings schema (TimeSlice, Collectors, Screenshot, Privacy, Idle, Sync, Schedule), hot-reload without restart, offline fallback chain, validation rules, 5 local API endpoints. Error codes 15460–15464.
- `11-time-slice-productivity.md` — 5-minute time slice model, weighted activity scoring (clicks 40%, active time 35%, screenshots 15%, engagement 10%), 6-level productivity classification, `TimeSlice` DB table with config snapshots, live current-slice API, `DailySummary` extensions. Error codes 15470–15474.

#### Changed
- `97-acceptance-criteria.md` — Expanded from 64 to 104 criteria with 4 new groups (AC-BE-FILEPATH, AC-BE-SYNC, AC-BE-SETTINGS, AC-BE-SLICE).
- `99-consistency-report.md` — Updated file inventory (10 → 14 files) and validation history.

---

## v3.0.0 — 2026-03-27

### Initial Module Creation

Full backend specification created with 10 spec files.

#### Added
- `00-overview.md` — Architecture overview, module index, and cross-references
- `01-architecture.md` — Daemon lifecycle, event bus, collector pipeline
- `02-os-integration.md` — Platform-specific window tracking, idle detection, autostart
- `03-browser-tracking.md` — Title parsing, dwell time, URL categorization, privacy exclusions
- `04-screenshot-capture.md` — Multi-trigger capture, compression, privacy blur, retention
- `05-database-schema.md` — SQLite WAL mode, PascalCase columns, migration system
- `06-api-interface.md` — REST API (25+ endpoints), CLI commands, authentication
- `07-error-codes.md` — Error code registry (15000–15499)
- `97-acceptance-criteria.md` — 64 acceptance criteria across 6 groups
- `99-consistency-report.md` — Module health and file inventory

---

*Keep this file updated when specs change.*
