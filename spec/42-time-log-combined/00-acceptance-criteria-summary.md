# Time Log System: Consolidated Acceptance Criteria

**Version:** 2.0.0  
**Updated:** 2026-03-28

---

## Overview

Cross-module acceptance criteria summary for the complete Time Log system — covering the Rust CLI backend, deployment pipeline, and React UI frontend. This document serves as the single entry point for release readiness assessment.

**Total Criteria: 214**

---

## System Summary

| Module | Sub-Module | Criteria | Source |
|--------|-----------|:--------:|--------|
| **Time Log CLI** | Root (integration) | 14 | `40-time-log-cli/97-acceptance-criteria.md` |
| | Backend | 104 | `40-time-log-cli/01-backend/97-acceptance-criteria.md` |
| | Deploy | 46 | `40-time-log-cli/03-deploy/97-acceptance-criteria.md` |
| **CLI Subtotal** | | **164** | |
| **Time Log UI** | Frontend + Deploy | 50 | `41-time-log-ui/97-acceptance-criteria.md` |
| **Grand Total** | | **214** | |

---

## Criteria by Domain

### 1. Core Backend (104 criteria)

| Group | Area | Count | Error Range |
|-------|------|:-----:|-------------|
| AC-BE-ARCH | Daemon lifecycle, event bus, resource limits | 12 | 15000–15049 |
| AC-BE-OS | Window detection, click hooks, idle, autostart | 10 | 15150–15199 |
| AC-BE-BROWSER | Tab parsing, dwell time, URL categories, privacy | 10 | 15200–15249 |
| AC-BE-SCREENSHOT | Capture triggers, compression, blur, retention | 10 | 15250–15299 |
| AC-BE-DB | SQLite schema, WAL, migrations, cleanup | 10 | 15100–15149 |
| AC-BE-API | HTTP endpoints, CLI commands, export, pagination | 12 | 15400–15449 |
| AC-BE-FILEPATH | Title parsing, path normalization, project detection | 10 | 15300–15349 |
| AC-BE-SYNC | Outbox queue, batched upload, retry, purge lifecycle | 12 | 15450–15459 |
| AC-BE-SETTINGS | Remote config, pin override, hot-reload, offline fallback | 10 | 15460–15464 |
| AC-BE-SLICE | Time slices, activity scoring, productivity levels | 8 | 15470–15474 |

### 2. Deployment Pipeline (46 criteria)

| Group | Area | Count |
|-------|------|:-----:|
| AC-DEPLOY-BUILD | CI/CD, cross-compilation, versioning, checksums | 10 |
| AC-DEPLOY-WIN | MSI, PATH, registry, silent install, Windows Service | 9 |
| AC-DEPLOY-LIN | DEB/RPM, systemd, AppImage, AUR, XDG | 9 |
| AC-DEPLOY-MAC | Homebrew, DMG, code signing, notarization, permissions | 9 |
| AC-DEPLOY-UPDATE | Auto-update, atomic replace, rollback, version skip | 9 |

### 3. CLI Integration (14 criteria)

| Group | Area | Count |
|-------|------|:-----:|
| AC-CLI | Single binary, first-run, e2e flow, privacy, upgrade, PascalCase | 14 |

### 4. UI Frontend & Deploy (50 criteria)

| Group | Area | Count |
|-------|------|:-----:|
| AC-UI-ARCH | Routing, API client, connection status, error handling | 8 |
| AC-UI-COMP | Theming, tables, charts, lightbox, keyboard, loading | 8 |
| AC-UI-STATE | Polling, caching, persistence, prefetch, optimistic updates | 7 |
| AC-UI-DASH | Stat cards, timeline, charts, gallery, reports, export | 12 |
| AC-UI-PRIV | Config CRUD, collector toggles, privacy, retention, deletion | 8 |
| AC-UI-DEPLOY | Embedded serving, cache headers, CSP, Vite proxy, bundle size | 7 |

---

## Platform Coverage Matrix

| Criterion Area | Windows | Linux | macOS |
|---------------|:-------:|:-----:|:-----:|
| OS integration hooks | ✅ | ✅ | ✅ |
| Browser tracking | ✅ | ✅ | ✅ |
| Screenshot capture | ✅ | ✅ | ✅ |
| Idle detection | ✅ | ✅ | ✅ |
| Autostart registration | ✅ | ✅ | ✅ |
| File path extraction | ✅ | ✅ | ✅ |
| Remote sync | ✅ | ✅ | ✅ |
| Connectivity detection | WinRT | NetworkManager | NWPathMonitor |
| Package installer | MSI | DEB/RPM | DMG/Homebrew |
| Binary build target | x64 | x64, ARM64 | x64, ARM64 |
| Auto-update | ✅ | ✅ | ✅ |

---

## Error Code Coverage

All acceptance criteria reference error codes from the 15000–15499 range:

| Range | Category | Criteria Groups |
|-------|----------|----------------|
| 15000–15049 | Daemon lifecycle | AC-BE-ARCH, AC-CLI |
| 15050–15099 | Configuration | AC-CLI |
| 15100–15149 | Database / Storage | AC-BE-DB |
| 15150–15199 | OS Integration | AC-BE-OS |
| 15200–15249 | Browser Tracking | AC-BE-BROWSER |
| 15250–15299 | Screenshot Capture | AC-BE-SCREENSHOT |
| 15300–15349 | File Path Extraction | AC-BE-FILEPATH |
| 15350–15399 | Idle Detection | AC-BE-OS |
| 15400–15449 | HTTP API | AC-BE-API, AC-UI-ARCH |
| 15450–15459 | Remote Sync | AC-BE-SYNC |
| 15460–15464 | Remote Settings | AC-BE-SETTINGS |
| 15470–15474 | Time Slice Productivity | AC-BE-SLICE |

---

## Release Readiness Checklist

| Gate | Criteria | Required |
|------|----------|:--------:|
| **G1: Backend Core** | AC-BE-01 through AC-BE-64 pass | All 64 |
| **G1b: Backend Extended** | AC-BE-65 through AC-BE-104 pass (file path, sync, settings, slices) | All 40 |
| **G2: CLI Integration** | AC-CLI-01 through AC-CLI-14 pass | All 14 |
| **G3: Platform Installers** | AC-DEPLOY-11 through AC-DEPLOY-37 pass (per target platform) | Per platform |
| **G4: Auto-Update** | AC-DEPLOY-38 through AC-DEPLOY-46 pass | All 9 |
| **G5: CI/CD** | AC-DEPLOY-01 through AC-DEPLOY-10 pass | All 10 |
| **G6: UI Frontend** | AC-UI-01 through AC-UI-50 pass | All 50 |
| **G7: End-to-End** | Full stack: daemon → API → UI dashboard verified | AC-CLI-08 |

### Gate Dependencies

```
G1 (Core) ──► G1b (Extended) ──► G2 (Integration) ──► G5 (CI/CD) ──► G3 (Installers)
                                                         │                  │
                                                         ▼                  ▼
                                                    G4 (Update)        G6 (UI)
                                                                          │
                                                                          ▼
                                                                     G7 (E2E)
```

---

## Cross-References

| Reference | Location |
|-----------|----------|
| CLI Root Criteria | `40-time-log-cli/97-acceptance-criteria.md` |
| CLI Backend Criteria | `40-time-log-cli/01-backend/97-acceptance-criteria.md` |
| CLI Deploy Criteria | `40-time-log-cli/03-deploy/97-acceptance-criteria.md` |
| UI Criteria | `41-time-log-ui/97-acceptance-criteria.md` |
| Error Code Registry | `40-time-log-cli/01-backend/07-error-codes.md` |
| CLI Overview | `40-time-log-cli/00-overview.md` |
| UI Overview | `41-time-log-ui/00-overview.md` |
