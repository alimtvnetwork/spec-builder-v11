# Time Log CLI: Backend Overview

**Version:** 1.3.0  
**Updated:** 2026-03-30    
**AI Confidence:** High  
**Ambiguity:** None
**Language:** Rust

---


## Keywords

`time`, `log`, `cli`, `backend`

---

## Scoring

| Criterion | Status |
|-----------|--------|
| `00-overview.md` present | ✅ |
| AI Confidence assigned | ✅ |
| Ambiguity assigned | ✅ |
| Keywords present | ✅ |
| Scoring table present | ✅ |


## Overview

Backend specifications for the Time Log CLI — a cross-platform, OS-level activity tracker built in Rust. The CLI runs as a background daemon, capturing browser activity, application usage, click events, and periodic screenshots.

---

## Files

| File | Description |
|------|-------------|
| 01-architecture.md | Core system design, daemon lifecycle, plugin architecture |
| 02-os-integration.md | Platform-specific event hooks (Windows, Linux, macOS) |
| 03-browser-tracking.md | Browser tab detection, URL capture, dwell time measurement |
| 04-screenshot-capture.md | Screenshot engine, scheduling, storage, and compression |
| 05-database-schema.md | SQLite schema for activity logs, sessions, and screenshots |
| 06-api-interface.md | CLI commands and optional HTTP API for Time Log UI |
| 07-error-codes.md | Error code registry (15000–15499) |
| 08-file-path-extraction.md | Window title parsing to extract file paths, projects, and extensions |
| 09-remote-sync.md | Offline queue, remote API sync, retry strategy, and purge lifecycle |
| 10-remote-settings.md | Admin API settings fetch, merge engine, and hot-reload |
| 11-time-slice-productivity.md | Time slice scoring model, productivity levels, and trend analysis |
| 97-acceptance-criteria.md | 64 testable criteria across 6 backend areas |

---

## Architecture Principles

- **Single binary:** Compiled Rust binary with no runtime dependencies
- **Cross-platform:** Windows, Linux, macOS from a single codebase via conditional compilation
- **Privacy-first:** All data stored locally; no external telemetry; configurable tracking scope
- **Low overhead:** Target < 1% CPU and < 50 MB RAM during background tracking
- **Modular collectors:** Each tracking feature (browser, clicks, screenshots) is an independent collector module

---

## Naming Convention

All database columns, JSON fields, and API payloads use **PascalCase**:
- Database: `Id`, `SessionId`, `CapturedAt`
- JSON: `"TabTitle"`, `"DwellSeconds"`, `"ScreenshotPath"`
- Rust structs: Use `#[serde(rename_all = "PascalCase")]` derive macro

See: [Database Standards Memory](../../../.ai-memory/memories/standards/00-database-standards-hub.md)

---

## Cross-References

| Reference | Location |
|-----------|----------|
| Overview | `../00-overview.md` |
| Time Log UI | `../../41-time-log-ui/00-overview.md` |
| Coding Guidelines | `../../02-coding-guidelines/00-overview.md` |
| Error Code Registry | `../../03-error-manage/03-error-code-registry/01-index.md` |
