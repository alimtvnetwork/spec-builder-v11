# Time Log UI: Acceptance Criteria

**Version:** 1.0.0  
**Updated:** 2026-03-28

---

## Overview

Acceptance criteria for the Time Log UI frontend. Organized by feature area, each criterion defines a testable requirement for implementation sign-off.

---

## Acceptance Criteria Index

| Group | Source File | Criteria |
|-------|-----------|----------|
| AC-UI-ARCH | `02-frontend/01-architecture.md` | 01–08 |
| AC-UI-COMP | `02-frontend/02-component-library.md` | 09–16 |
| AC-UI-STATE | `02-frontend/03-state-management.md` | 17–23 |
| AC-UI-DASH | `02-frontend/04-dashboard-views.md` | 24–35 |
| AC-UI-PRIV | `02-frontend/05-settings-privacy.md` | 36–43 |
| AC-UI-DEPLOY | `03-deploy/01-embedded-serving.md`, `02-standalone-build.md` | 44–50 |

---

## AC-UI-ARCH — Architecture

| # | Criterion | Edge Cases |
|---|-----------|------------|
| 01 | App renders at `/` and all 6 defined routes without errors | Invalid routes show 404 fallback |
| 02 | API client connects to `127.0.0.1:9847` and parses PascalCase responses | Malformed JSON returns toast error |
| 03 | Connection status indicator shows 🟢 Connected when daemon is reachable | — |
| 04 | Connection status shows 🔴 Disconnected with reconnect banner when daemon is unreachable | Banner includes "Start daemon" instructions |
| 05 | Connection status shows 🟡 Paused when daemon reports paused state | — |
| 06 | Reconnect polling occurs every 5 seconds when disconnected | Polling stops when connection restored |
| 07 | Unauthorized responses (error code 15401) trigger API token dialog | Token persisted in localStorage |
| 08 | Non-auth API errors display toast with error code and message | Toast auto-dismisses after 5 seconds |

---

## AC-UI-COMP — Component Library

| # | Criterion | Edge Cases |
|---|-----------|------------|
| 09 | All components render correctly in both light and dark themes | No hardcoded colors — semantic tokens only |
| 10 | Design tokens (VS Code dark theme, Ubuntu/Poppins fonts) applied globally | Fallback to system fonts if custom fonts fail to load |
| 11 | Data tables support sorting by clicking column headers | Sort indicator visible on active column |
| 12 | Data tables support filtering via text input and dropdown selectors | Empty filter state shows "No results" |
| 13 | Charts (bar, pie, line) render with correct data and responsive sizing | Empty data shows "No data" placeholder |
| 14 | Lightbox component opens on image click with zoom and navigation | Keyboard arrows navigate, Escape closes |
| 15 | All interactive elements are keyboard-accessible (Tab, Enter, Escape) | Focus ring visible on all focusable elements |
| 16 | Loading states show skeleton placeholders, not spinners | Skeleton matches final layout shape |

---

## AC-UI-STATE — State Management

| # | Criterion | Edge Cases |
|---|-----------|------------|
| 17 | TanStack Query polls active dashboard widgets every 30 seconds | Polling pauses when browser tab is hidden |
| 18 | Stale data is shown immediately while background refetch occurs | Stale indicator visible during refetch |
| 19 | Date range filter (Zustand) persists across page navigation | Range resets to "Today" on new browser session |
| 20 | View preferences (column order, sort, density) persist in localStorage | Corrupted localStorage gracefully resets to defaults |
| 21 | Theme preference (light/dark) persists and applies on initial load | Respects `prefers-color-scheme` as default |
| 22 | Prefetching triggers on sidebar link hover | Prefetch does not trigger on rapid mouse movements |
| 23 | Optimistic updates apply immediately for control actions (pause/resume) | Rollback on API failure with error toast |

---

## AC-UI-DASH — Dashboard Views

| # | Criterion | Edge Cases |
|---|-----------|------------|
| 24 | Dashboard page displays 4 stat cards (active time, idle time, sessions, screenshots) | Zero values show "0" not blank |
| 25 | Hourly activity timeline renders 24 bars with accurate proportions | Hours with no data show empty bar |
| 26 | Top apps chart shows top 10 applications by usage time | Fewer than 10 apps displays all available |
| 27 | Top domains chart shows top 10 domains with time bars | No browser data shows "No browsing data" |
| 28 | Category pie chart displays URL categories with correct percentages | Uncategorized URLs grouped as "Other" |
| 29 | Activity logs page shows sortable/filterable table with pagination | Page size selector (25, 50, 100) |
| 30 | Browser activity table displays URL, title, category, and dwell time | Long URLs truncated with tooltip on hover |
| 31 | Click heatmap renders density visualization | Low-activity periods show sparse dots |
| 32 | Screenshot gallery supports grid, list, and timeline view modes | View mode persists across navigation |
| 33 | Screenshot detail view shows full-size image with metadata sidebar | Blurred screenshots show blur overlay |
| 34 | Reports page generates daily/weekly summaries with comparison charts | Partial-day data labeled accordingly |
| 35 | Export dialog supports CSV and JSON with date range selection | Export button disabled during generation |

---

## AC-UI-PRIV — Settings & Privacy

| # | Criterion | Edge Cases |
|---|-----------|------------|
| 36 | Settings page loads current config from `GET /api/v1/config` | API failure shows cached last-known config |
| 37 | Settings changes submit via `PATCH /api/v1/config` with optimistic UI | Failed save reverts toggle state with error toast |
| 38 | Collector toggles (browser, click, screenshot, app, idle) update in real-time | Disabling all collectors shows warning |
| 39 | Screenshot settings (interval, format, quality, storage limit) validate input ranges | Out-of-range values clamped to min/max |
| 40 | Privacy exclusions (URL patterns, app names) support add/remove via tag input | Duplicate patterns rejected with inline message |
| 41 | Retention days setting warns before reducing (data will be deleted) | Confirmation dialog with affected data count |
| 42 | Data export from settings generates downloadable JSON/CSV archive | Large exports show progress indicator |
| 43 | "Delete All Data" requires double confirmation (dialog → type "DELETE") | Daemon status checked before deletion |

---

## AC-UI-DEPLOY — Deployment

| # | Criterion | Edge Cases |
|---|-----------|------------|
| 44 | Embedded mode serves UI from CLI binary on port 9847 | `index.html` served for all non-API/non-asset routes |
| 45 | Embedded assets use content-hash cache headers (`immutable`) | `index.html` uses `no-cache` |
| 46 | Security headers (CSP, X-Frame-Options, nosniff) present on all UI responses | — |
| 47 | Standalone Vite dev server proxies `/api` to `127.0.0.1:9847` | Proxy error shows connection failure message |
| 48 | Production build total size < 350 KB gzipped | Bundle analysis available via `npm run analyze` |
| 49 | Environment variable `VITE_API_BASE_URL` switches between absolute and relative API URLs | Missing env var defaults to `/api/v1` |
| 50 | CI pipeline runs lint, test, and build with artifact upload | Build failure blocks artifact upload |

---

## Cross-References

| Reference | Location |
|-----------|----------|
| Frontend Overview | `02-frontend/00-overview.md` |
| Architecture | `02-frontend/01-architecture.md` |
| Component Library | `02-frontend/02-component-library.md` |
| State Management | `02-frontend/03-state-management.md` |
| Dashboard Views | `02-frontend/04-dashboard-views.md` |
| Settings & Privacy | `02-frontend/05-settings-privacy.md` |
| Deploy — Embedded | `03-deploy/01-embedded-serving.md` |
| Deploy — Standalone | `03-deploy/02-standalone-build.md` |
