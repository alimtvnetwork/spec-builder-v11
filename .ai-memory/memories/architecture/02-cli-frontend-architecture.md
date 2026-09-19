# Memory: architecture/cli-frontend-architecture

**Updated:** 2026-02-01  
**Version:** 1.0.0  
**Status:** Active  
**Spec Location:** `02-spec/28-shared-cli-frontend/`

---

## Overview

All CLI tools (GSearch, BRun, AI Bridge, Nexus Flow) share a unified frontend architecture.

---

## Three-Folder Structure

Each CLI has: `01-backend/` (Go) + `02-frontend/` (React) + `03-deploy/` (PowerShell/operations)

---

## Key Features

- WebSocket live logs with filtering
- Seedable settings (JSON → SQLite) via Seedable Config
- API tester with presets
- Error modal with copy support
- Changelog on version update
- Port management with firewall detection
- PowerShell integration (run.ps1)
- Theme support (20+ themes: light, dark, colorful variants)

---

## Shared Patterns

| Pattern | Location |
|---------|----------|
| Split DB | `02-spec/06-split-db-architecture/` |
| Seedable Config | `02-spec/07-seedable-config-architecture/` |
| PowerShell | `02-spec/50-powershell-integration/` |

---

## Port Allocation

| CLI | API Ports | Frontend Port |
|-----|-----------|---------------|
| GSearch CLI | 8088-8093 | 5173 |
| BRun CLI | 8100-8102 | 5174 |
| AI Bridge CLI | 8089-8091 | 5175 |
| Nexus Flow CLI | 8113-8115 | 5176 |

---

## Shared Specs

| Spec | Location |
|------|----------|
| Component Library | `28-shared-cli-frontend/10-component-library.md` |
| E2E Testing | `28-shared-cli-frontend/11-e2e-test-spec.md` |
| Accessibility | `28-shared-cli-frontend/12-accessibility-spec.md` |
| Visual Regression | `28-shared-cli-frontend/13-visual-regression-spec.md` |
| Architecture Template | `28-shared-cli-frontend/14-architecture-template.md` |
| Hooks Library | `28-shared-cli-frontend/15-hooks-library.md` |

---

## Reference

- `02-spec/28-shared-cli-frontend/` (15+ files)
- `02-spec/06-split-db-architecture/`
- `02-spec/07-seedable-config-architecture/`
