# Time Log CLI: Deploy Overview

**Version:** 1.1.0  
**Updated:** 2026-03-30  
**AI Confidence:** High  
**Ambiguity:** None

---


## Keywords

`time`, `log`, `cli`, `deploy`

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

Deployment specifications for the Time Log CLI across Windows, Linux, and macOS. Covers build pipeline, platform-specific installers, auto-update mechanism, and CI/CD configuration.

---

## Files

| File | Description |
|------|-------------|
| 00-overview.md | This file — deploy overview and navigation |
| 01-build-pipeline.md | Cross-compilation, release profiles, artifact generation |
| 02-windows-installer.md | MSI/NSIS installer, registry, Windows Service option |
| 03-linux-packaging.md | DEB/RPM packages, systemd unit, AppImage |
| 04-macos-packaging.md | Homebrew formula, DMG, LaunchAgent, notarization |
| 05-auto-update.md | Self-update mechanism, version checking, rollback |
| 97-acceptance-criteria.md | 46 testable criteria across 5 deployment areas |

---

## Cross-References

| Reference | Location |
|-----------|----------|
| CLI Overview | `../00-overview.md` |
| Architecture | `../01-backend/01-architecture.md` |
| OS Integration (autostart) | `../01-backend/02-os-integration.md` |
| PowerShell Integration | `../../11-powershell-integration/00-overview.md` |
