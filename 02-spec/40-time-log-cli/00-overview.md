# Time Log CLI

**Version:** 1.1.0  
**Status:** ✅ Spec Complete — Awaiting implementation  
**Updated:** 2026-03-30  
**Language:** Rust  
**AI Confidence:** Production-Ready  
**Ambiguity:** Low

---

## Keywords

`time-log` · `rust` · `cli` · `activity-tracker` · `browser-tracking` · `screenshots` · `sqlite` · `cross-platform` · `daemon` · `productivity`

---

## Scoring

| Metric | Value |
|--------|-------|
| AI Confidence | Production-Ready |
| Ambiguity | Low |
| Health Score | 100/100 (A+) |

---

## Overview

Cross-platform system activity tracker that monitors user interactions at the OS level. Captures browser activity, application usage, click events, and periodic screenshots for time-tracking and productivity analysis.

> ⚠️ **PENDING VERIFICATION**: High-level requirements have been expanded into detailed specs. Final sign-off from project owner is pending before implementation begins.

---

## Platform Support

| OS | Status |
|----|--------|
| Windows | ✅ Specified (Win32 API) |
| Linux | ✅ Specified (X11 + Wayland) |
| macOS | ✅ Specified (Core Graphics + Accessibility) |

---

## Core Features

1. **Browser Tab Tracking** — Detect active tab URL/title, dwell time, URL categorization
2. **App Focus Tracking** — Track which application has focus and for how long
3. **Click Activity Capture** — Aggregated click events with heatmap data
4. **Screenshot Capture** — Periodic/event-driven screenshots with privacy controls
5. **Idle Detection** — Detect user away state, pause tracking automatically
6. **Background Daemon** — Runs as OS service with autostart registration
7. **HTTP API** — Optional REST API for the Time Log UI dashboard
8. **CLI Interface** — Full command-line controls (start/stop/status/report/export)

---

## Folder Structure

```
40-time-log-cli/
├── 00-overview.md              # This file
├── 01-backend/
│   ├── 00-overview.md          # Backend overview
│   ├── 01-architecture.md      # Daemon lifecycle, collector pattern, event bus
│   ├── 02-os-integration.md    # Platform-specific hooks (Win/Linux/Mac)
│   ├── 03-browser-tracking.md  # Tab detection, dwell time, URL classification
│   ├── 04-screenshot-capture.md # Capture engine, storage, privacy
│   ├── 05-database-schema.md   # SQLite schema (7 tables, PascalCase)
│   ├── 06-api-interface.md     # CLI commands + HTTP REST API (25+ endpoints)
│   └── 07-error-codes.md       # Error codes 15000–15499
├── 03-deploy/
│   ├── 00-overview.md          # Deploy overview
│   ├── 01-build-pipeline.md    # Cross-compilation, CI/CD, release artifacts
│   ├── 02-windows-installer.md # MSI, WinGet, Scoop, Windows Service
│   ├── 03-linux-packaging.md   # DEB/RPM, systemd, AppImage, AUR
│   ├── 04-macos-packaging.md   # Homebrew, DMG, notarization, LaunchAgent
│   └── 05-auto-update.md       # Self-update, version check, rollback
├── 97-acceptance-criteria.md   # ✅ 124 criteria (14 root + 64 backend + 46 deploy)
└── 99-consistency-report.md    # ✅ Structural health
```

---

## Coding Standards

All Rust code must follow:

- [Cross-Language Guidelines](../02-coding-guidelines/01-cross-language/01-index.md)
- PascalCase for all database columns, JSON fields, and API payloads

---

## Cross-References

| Reference | Location |
|-----------|----------|
| Time Log UI | `../41-time-log-ui/00-overview.md` |
| Coding Guidelines | `../02-coding-guidelines/00-overview.md` |
| Error Code Registry | `../03-error-manage/03-error-code-registry/01-index.md` |
