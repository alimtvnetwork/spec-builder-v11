# Time Log CLI: Acceptance Criteria

**Version:** 1.0.0  
**Updated:** 2026-03-28

---

## Overview

Consolidated acceptance criteria for the Time Log CLI module. This document indexes criteria from both sub-modules (`01-backend/` and `03-deploy/`) and adds module-level integration criteria.

---

## Sub-Module Criteria Summary

| Sub-Module | File | Criteria Count | Range |
|------------|------|:-:|-------|
| Backend | `01-backend/97-acceptance-criteria.md` | 64 | AC-BE-01 – AC-BE-64 |
| Deploy | `03-deploy/97-acceptance-criteria.md` | 46 | AC-DEPLOY-01 – AC-DEPLOY-46 |
| **Root (this file)** | — | 14 | AC-CLI-01 – AC-CLI-14 |
| **Total** | | **124** | |

---

## Sub-Module Criteria Index

### Backend (64 criteria)

| Group | Description | Criteria | Error Range |
|-------|-------------|----------|-------------|
| AC-BE-ARCH | Daemon lifecycle, event bus, performance | 01–12 | 15000–15049 |
| AC-BE-OS | Platform-specific hooks, idle detection, autostart | 13–22 | 15150–15199 |
| AC-BE-BROWSER | Tab detection, dwell time, URL categorization | 23–32 | 15200–15249 |
| AC-BE-SCREENSHOT | Capture triggers, compression, storage, retention | 33–42 | 15250–15299 |
| AC-BE-DB | SQLite schema, WAL mode, migrations, cleanup | 43–52 | 15100–15149 |
| AC-BE-API | HTTP API, CLI commands, export, pagination | 53–64 | 15400–15449 |

### Deploy (46 criteria)

| Group | Description | Criteria |
|-------|-------------|----------|
| AC-DEPLOY-BUILD | CI/CD, cross-compilation, binary size, versioning | 01–10 |
| AC-DEPLOY-WIN | MSI installer, PATH, autostart, Windows Service | 11–19 |
| AC-DEPLOY-LIN | DEB/RPM, systemd, AppImage, AUR, XDG compliance | 20–28 |
| AC-DEPLOY-MAC | Homebrew, DMG, code signing, notarization, permissions | 29–37 |
| AC-DEPLOY-UPDATE | Auto-update, checksums, atomic replace, rollback | 38–46 |

---

## AC-CLI — Module-Level Integration Criteria

| # | Criterion | Edge Cases |
|---|-----------|------------|
| 01 | Single binary contains all collectors, CLI, HTTP API, and embedded UI assets | Binary runs without external runtime dependencies |
| 02 | `timelog version` displays version, git hash, build date, and platform | Output matches `CARGO_PKG_VERSION`, `GIT_HASH`, `BUILD_DATE` |
| 03 | First-run experience creates config, data directory, and database without errors | Missing `~/.timelog/` directory created with correct permissions |
| 04 | All 14 CLI commands documented in `timelog --help` and man page | Help text matches spec in `06-api-interface.md` |
| 05 | Configuration file (`config.toml`) validates on load with clear error messages | Invalid TOML syntax reports line number (error 15051) |
| 06 | Error codes from all ranges (15000–15499) logged with structured context | Log format: `[ERROR] {Code} {Name}: {Message}` |
| 07 | Cross-platform binary builds pass CI on all 5 target triples | CI matrix includes Windows, Linux x64/ARM64, macOS x64/ARM64 |
| 08 | End-to-end: daemon start → track activity → query via API → export data | Full cycle completes within 60 seconds on clean install |
| 09 | Privacy exclusions (URL patterns, app names) enforced across all collectors | Excluded data never written to database or screenshots |
| 10 | Idle detection pauses all collectors and resumes on user activity | Transition events logged with timestamps |
| 11 | Database integrity maintained across crash/power-loss scenarios | WAL recovery restores consistent state on restart |
| 12 | Upgrade from v1.x to v1.y preserves all user data and configuration | Migration runs automatically on first start after upgrade |
| 13 | Uninstall removes binary, autostart, and service but preserves user data | `--purge` flag removes user data with confirmation |
| 14 | All PascalCase conventions enforced in database, JSON, and API responses | No camelCase or snake_case in any external-facing output |

---

## Cross-References

| Reference | Location |
|-----------|----------|
| Backend Acceptance Criteria | `01-backend/97-acceptance-criteria.md` |
| Deploy Acceptance Criteria | `03-deploy/97-acceptance-criteria.md` |
| Backend Overview | `01-backend/00-overview.md` |
| Deploy Overview | `03-deploy/00-overview.md` |
| Error Codes | `01-backend/07-error-codes.md` |
| Time Log UI Criteria | `../41-time-log-ui/97-acceptance-criteria.md` |
