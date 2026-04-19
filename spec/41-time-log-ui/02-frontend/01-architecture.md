# Time Log UI: Architecture

**Version:** 1.0.0  
**Updated:** 2026-03-27

---

## Overview

Single-page React application served locally. Connects to the Time Log CLI's HTTP API on `127.0.0.1:9847`. No backend of its own — the CLI daemon is the sole data source.

---

## Application Structure

```
src/
├── main.tsx                    # Entry point, providers
├── App.tsx                     # Router setup
├── api/
│   ├── client.ts               # Axios/fetch wrapper for CLI API
│   ├── types.ts                # API response types (PascalCase)
│   └── hooks/
│       ├── use-status.ts        # GET /api/v1/status
│       ├── use-activities.ts    # GET /api/v1/activities/*
│       ├── use-screenshots.ts   # GET /api/v1/screenshots
│       ├── use-summaries.ts     # GET /api/v1/summary/*
│       ├── use-sessions.ts      # GET /api/v1/sessions
│       └── use-control.ts       # POST /api/v1/control/*
├── components/
│   ├── ui/                      # Base design system (shadcn)
│   ├── layout/
│   │   ├── AppShell.tsx         # Sidebar + header + content
│   │   ├── Sidebar.tsx          # Navigation sidebar
│   │   └── Header.tsx           # Status bar, daemon indicator
│   ├── dashboard/
│   │   ├── TodaySummary.tsx     # Hero stats card
│   │   ├── ActivityTimeline.tsx # Hourly activity bars
│   │   ├── TopAppsChart.tsx     # Horizontal bar chart
│   │   ├── TopDomainsChart.tsx  # Domain time breakdown
│   │   ├── CategoryPieChart.tsx # URL category distribution
│   │   └── IdleGapsIndicator.tsx # Idle periods on timeline
│   ├── activities/
│   │   ├── AppActivityTable.tsx # Filterable app activity log
│   │   ├── BrowserActivityTable.tsx # Browser history with categories
│   │   └── ClickHeatmap.tsx     # Click density visualization
│   ├── screenshots/
│   │   ├── ScreenshotGallery.tsx # Grid/list view with lightbox
│   │   ├── ScreenshotDetail.tsx  # Full-size view with metadata
│   │   └── ScreenshotTimeline.tsx # Screenshots on time axis
│   ├── reports/
│   │   ├── DailyReport.tsx      # Day summary with charts
│   │   ├── WeeklyReport.tsx     # Week comparison
│   │   ├── TrendChart.tsx       # Multi-day trend lines
│   │   └── ExportDialog.tsx     # CSV/JSON export UI
│   └── settings/
│       ├── GeneralSettings.tsx  # Data directory, log level
│       ├── CollectorSettings.tsx # Enable/disable collectors
│       ├── PrivacySettings.tsx  # Exclusions, blur, retention
│       └── ScreenshotSettings.tsx # Interval, format, storage
├── pages/
│   ├── DashboardPage.tsx        # Main dashboard (default)
│   ├── ActivitiesPage.tsx       # Detailed activity logs
│   ├── ScreenshotsPage.tsx      # Screenshot gallery
│   ├── ReportsPage.tsx          # Reports and trends
│   ├── SessionsPage.tsx         # Session history
│   └── SettingsPage.tsx         # Configuration
├── stores/
│   ├── date-range-store.ts      # Selected date range (global)
│   ├── view-preferences-store.ts # Table columns, sort order
│   └── theme-store.ts           # Light/dark theme preference
├── lib/
│   ├── constants.ts             # API base URL, polling intervals
│   ├── formatters.ts            # Duration, bytes, date formatting
│   └── url-classifier.ts        # Client-side URL categorization
└── styles/
    └── index.css                # Tailwind + design tokens
```

---

## Routing

```tsx
const routes = [
  { path: "/",             element: <DashboardPage /> },
  { path: "/activities",   element: <ActivitiesPage /> },
  { path: "/screenshots",  element: <ScreenshotsPage /> },
  { path: "/reports",      element: <ReportsPage /> },
  { path: "/sessions",     element: <SessionsPage /> },
  { path: "/settings",     element: <SettingsPage /> },
];
```

---

## API Client

```typescript
const API_BASE = "http://127.0.0.1:9847/api/v1";

interface ApiClient {
  get<T>(path: string, params?: Record<string, string>): Promise<T>;
  post<T>(path: string, body?: unknown): Promise<T>;
  patch<T>(path: string, body: unknown): Promise<T>;
}

// All response types use PascalCase to match the CLI API
interface PaginatedResponse<T> {
  Data: T[];
  Pagination: {
    Page: number;
    PageSize: number;
    TotalItems: number;
    TotalPages: number;
  };
}
```

### Connection Status

The UI shows a persistent status indicator for the CLI daemon connection:

| State | Indicator | Behavior |
|-------|-----------|----------|
| Connected | 🟢 Green dot | Normal operation |
| Disconnected | 🔴 Red dot | Polling every 5s, show reconnect banner |
| Paused | 🟡 Yellow dot | Daemon running but tracking paused |

---

## Error Handling

```typescript
interface ApiErrorResponse {
  Error: {
    Code: number;
    Message: string;
    Detail?: string;
  };
}

// Global error handler
function handleApiError(error: ApiErrorResponse): void {
  const { Code, Message } = error.Error;

  if (Code === 15401) {
    // Unauthorized — prompt for API token
    showTokenDialog();
  } else {
    toast.error(`Error ${Code}: ${Message}`);
  }
}
```

---

## Serving Strategy

Two serving options:

### Option A: Embedded in CLI (Recommended)

The UI is compiled to static files and embedded in the Time Log CLI binary using `rust-embed`:

```rust
#[derive(RustEmbed)]
#[folder = "ui/dist/"]
struct UiAssets;

// Serve from the same HTTP server on port 9847
// GET / → serves index.html
// GET /assets/* → serves static assets
// GET /api/v1/* → API endpoints
```

### Option B: Standalone Dev Server

For development, the UI runs as a separate Vite dev server:

```bash
cd timelog-ui
npm run dev  # Starts on localhost:5173, proxies API to localhost:9847
```

```typescript
// vite.config.ts
export default defineConfig({
  server: {
    proxy: {
      "/api": "http://127.0.0.1:9847",
    },
  },
});
```

---

## Cross-References

| Reference | Location |
|-----------|----------|
| API Interface (all endpoints) | `../../40-time-log-cli/01-backend/06-api-interface.md` |
| Component Library | `./02-component-library.md` |
| State Management | `./03-state-management.md` |
| Dashboard Views | `./04-dashboard-views.md` |
