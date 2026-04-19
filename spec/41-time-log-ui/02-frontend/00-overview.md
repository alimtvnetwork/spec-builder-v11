# Time Log UI: Frontend Overview

**Version:** 1.1.0  
**Updated:** 2026-03-30  
**AI Confidence:** High  
**Ambiguity:** None

---


## Keywords

`time`, `log`, `frontend`

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

Frontend specifications for the Time Log UI — a web-based dashboard for visualizing activity data captured by the [Time Log CLI](../../40-time-log-cli/00-overview.md). Built with React + TypeScript, consuming the CLI's HTTP REST API.

---

## Files

| File | Description |
|------|-------------|
| 00-overview.md | This file — frontend overview and navigation |
| 01-architecture.md | App structure, routing, API client, authentication |
| 02-component-library.md | Reusable UI components, design tokens, theming |
| 03-state-management.md | Data fetching, caching, real-time updates |
| 04-dashboard-views.md | Page layouts, widgets, charts, interactions |
| 05-settings-privacy.md | Configuration UI, privacy controls, data export |

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 18+ with TypeScript |
| Build | Vite |
| Styling | Tailwind CSS with semantic design tokens |
| State | TanStack Query (server state) + Zustand (client state) |
| Charts | Recharts |
| Routing | React Router v6 |
| Icons | Lucide React |
| Notifications | Sonner |
| Date handling | date-fns |

---

## Design Philosophy

- **Local-first:** All data comes from the local Time Log CLI API (`127.0.0.1:9847`)
- **Privacy-respecting:** No external analytics, no cloud sync, all data stays on-device
- **Keyboard-navigable:** Full keyboard support for power users
- **Responsive:** Desktop-first with tablet support (no mobile — desktop productivity tool)

---

## Cross-References

| Reference | Location |
|-----------|----------|
| Time Log CLI | `../../40-time-log-cli/00-overview.md` |
| API Interface | `../../40-time-log-cli/01-backend/06-api-interface.md` |
| Database Schema | `../../40-time-log-cli/01-backend/05-database-schema.md` |
| Coding Guidelines | `../../02-coding-guidelines/00-overview.md` |
| TypeScript Standards | `../../02-coding-guidelines/02-typescript/00-overview.md` |
