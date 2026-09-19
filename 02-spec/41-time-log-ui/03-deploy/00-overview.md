# Time Log UI: Deploy Overview

**Version:** 1.1.0  
**Updated:** 2026-03-30  
**AI Confidence:** High  
**Ambiguity:** None

---


## Keywords

`time`, `log`, `deploy`

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

Deployment specifications for the Time Log UI. The UI can be served in two modes: embedded within the Time Log CLI Rust binary (production) or as a standalone Vite dev server (development). Both modes connect to the same CLI API on `127.0.0.1:9847`.

---

## Files

| File | Description |
|------|-------------|
| 00-overview.md | This file — deploy overview and navigation |
| 01-embedded-serving.md | Embedding UI assets in the CLI binary via `rust-embed` |
| 02-standalone-build.md | Standalone Vite build for development and CI |
| 03-ci-cd.md | GitHub Actions workflow for UI build and artifact upload |

---

## Serving Modes Summary

| Mode | Use Case | Port | Hot Reload |
|------|----------|------|------------|
| Embedded | Production / release binary | 9847 (shared with API) | ❌ |
| Standalone | Development / debugging | 5173 (proxies to 9847) | ✅ |

---

## Cross-References

| Reference | Location |
|-----------|----------|
| CLI Build Pipeline | `../../40-time-log-cli/03-deploy/01-build-pipeline.md` |
| CLI API Interface | `../../40-time-log-cli/01-backend/06-api-interface.md` |
| UI Architecture | `../02-frontend/01-architecture.md` |
| PowerShell Integration | `../../11-powershell-integration/00-overview.md` |
