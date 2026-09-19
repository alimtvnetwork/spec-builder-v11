# Time Log UI

**Version:** 1.1.0  
**Status:** ✅ Spec Complete — Awaiting implementation  
**Updated:** 2026-03-30  
**AI Confidence:** High  
**Ambiguity:** Low

---

## Keywords

`time-log-ui` · `react` · `typescript` · `dashboard` · `reports` · `visualizations` · `activity-data` · `charts`

---

## Scoring

| Metric | Value |
|--------|-------|
| AI Confidence | High |
| Ambiguity | Low |
| Health Score | 100/100 (A+) |

---

## Overview

Web-based user interface for the Time Log system. Provides dashboards, reports, and visualizations for the activity data captured by the [Time Log CLI](../40-time-log-cli/00-overview.md).

> ⚠️ **PENDING VERIFICATION**: Detailed specs have been drafted. Final sign-off from project owner is pending before implementation begins.

---

## Core Features

1. **Activity Dashboard** — Real-time stats, hourly timeline, top apps/domains, category breakdown
2. **Activity Logs** — Sortable/filterable tables for app, browser, and click activity
3. **Screenshot Gallery** — Grid/list/timeline views with lightbox and metadata
4. **Reports & Trends** — Daily/weekly reports, 30/90-day trend charts, export to CSV/JSON
5. **Session History** — Session timeline with per-session activity breakdown
6. **Settings & Privacy** — Configure collectors, privacy exclusions, storage, categories

---

## Folder Structure

```
41-time-log-ui/
├── 00-overview.md              # This file
├── 02-frontend/
│   ├── 00-overview.md          # Frontend overview, tech stack
│   ├── 01-architecture.md      # App structure, routing, API client, serving
│   ├── 02-component-library.md # Design tokens, 15+ components, charts, accessibility
│   ├── 03-state-management.md  # TanStack Query + Zustand, polling, prefetch
│   ├── 04-dashboard-views.md   # 6 pages with layouts, widgets, keyboard shortcuts
│   └── 05-settings-privacy.md  # Config UI, URL categories, data management
├── 03-deploy/
│   ├── 00-overview.md          # Deploy overview, serving modes
│   ├── 01-embedded-serving.md  # rust-embed integration, cache policy, security
│   ├── 02-standalone-build.md  # Vite dev server, production build, env vars
│   └── 03-ci-cd.md             # GitHub Actions workflow, artifact upload
├── 97-acceptance-criteria.md   # ✅ 50 testable criteria across 6 groups
└── 99-consistency-report.md    # ✅ Structural health
```

---

## Cross-References

| Reference | Location |
|-----------|----------|
| Time Log CLI | `../40-time-log-cli/00-overview.md` |
| API Interface | `../40-time-log-cli/01-backend/06-api-interface.md` |
| Coding Guidelines | `../02-coding-guidelines/00-overview.md` |
| TypeScript Standards | `../02-coding-guidelines/02-typescript/00-overview.md` |
