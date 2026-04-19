# Time Log UI: State Management

**Version:** 1.0.0  
**Updated:** 2026-03-27

---

## Overview

Dual-layer state management: **TanStack Query** for server state (API data fetching, caching, polling) and **Zustand** for client state (UI preferences, filters, date range).

---

## Server State (TanStack Query)

### Query Key Convention

All query keys follow a hierarchical array pattern:

```typescript
// Pattern: [domain, resource, ...params]
const queryKeys = {
  status:      ["status"] as const,
  activities: {
    apps:      (params: ActivityParams) => ["activities", "apps", params] as const,
    browser:   (params: ActivityParams) => ["activities", "browser", params] as const,
    clicks:    (params: ActivityParams) => ["activities", "clicks", params] as const,
  },
  screenshots: {
    list:      (params: ScreenshotParams) => ["screenshots", "list", params] as const,
    detail:    (id: string) => ["screenshots", "detail", id] as const,
  },
  summaries: {
    daily:     (params: DateRangeParams) => ["summaries", "daily", params] as const,
    hourly:    (date: string) => ["summaries", "hourly", date] as const,
    apps:      (params: DateRangeParams) => ["summaries", "apps", params] as const,
    domains:   (params: DateRangeParams) => ["summaries", "domains", params] as const,
    categories:(params: DateRangeParams) => ["summaries", "categories", params] as const,
  },
  sessions: {
    list:      (params: PaginationParams) => ["sessions", "list", params] as const,
    detail:    (id: string) => ["sessions", "detail", id] as const,
  },
  config:      ["config"] as const,
};
```

### Custom Hooks

```typescript
// use-status.ts — Polls daemon status every 5 seconds
export function useStatus() {
  return useQuery({
    queryKey: queryKeys.status,
    queryFn: () => apiClient.get<StatusResponse>("/status"),
    refetchInterval: 5_000,
    retry: false, // Don't retry — daemon may be down
  });
}

// use-activities.ts — Paginated activity list
export function useAppActivities(params: ActivityParams) {
  return useQuery({
    queryKey: queryKeys.activities.apps(params),
    queryFn: () => apiClient.get<PaginatedResponse<AppActivity>>(
      "/activities/apps",
      toQueryParams(params),
    ),
    keepPreviousData: true, // Smooth pagination transitions
    staleTime: 30_000,      // 30 seconds before refetch
  });
}

// use-summaries.ts — Daily summary for date range
export function useDailySummary(params: DateRangeParams) {
  return useQuery({
    queryKey: queryKeys.summaries.daily(params),
    queryFn: () => apiClient.get<DailySummary[]>("/summary/daily", toQueryParams(params)),
    staleTime: 60_000,      // 1 minute (summary data changes slowly)
  });
}

// use-control.ts — Mutation hooks for daemon control
export function usePauseTracking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiClient.post("/control/pause"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.status });
      toast.success("Tracking paused");
    },
  });
}
```

### Polling Strategy

| Query | Poll Interval | Stale Time | Rationale |
|-------|:------------:|:----------:|-----------|
| Status | 5s | 0 | Connection health — must be fresh |
| Today's summary | 30s | 30s | Active dashboard needs near-real-time |
| Activity lists | None | 30s | Paginated — refetch on navigation |
| Screenshots | None | 60s | Rarely changes while viewing |
| Historical reports | None | 5 min | Past data doesn't change |
| Config | None | ∞ | Only changes on user action |

### Prefetching

```typescript
// Prefetch next page of activities for instant pagination
const prefetchNextPage = (currentPage: number) => {
  queryClient.prefetchQuery({
    queryKey: queryKeys.activities.apps({ ...params, Page: currentPage + 1 }),
    queryFn: () => apiClient.get("/activities/apps", {
      ...toQueryParams(params),
      Page: String(currentPage + 1),
    }),
  });
};
```

---

## Client State (Zustand)

### Date Range Store

Global date range filter shared across all views.

```typescript
interface DateRangeState {
  from: Date;
  to: Date;
  preset: DateRangePreset;
  setRange: (from: Date, to: Date) => void;
  setPreset: (preset: DateRangePreset) => void;
}

export const useDateRangeStore = create<DateRangeState>()(
  persist(
    (set) => ({
      from: startOfDay(new Date()),
      to: new Date(),
      preset: "today",
      setRange: (from, to) => set({ from, to, preset: "custom" }),
      setPreset: (preset) => {
        const { from, to } = resolvePreset(preset);
        set({ from, to, preset });
      },
    }),
    { name: "timelog-date-range" },
  ),
);
```

### View Preferences Store

Per-page UI preferences (persisted to localStorage).

```typescript
interface ViewPreferencesState {
  // Activity tables
  activityPageSize: number;
  activitySortColumn: string;
  activitySortOrder: "Asc" | "Desc";
  activityVisibleColumns: string[];

  // Screenshot gallery
  screenshotViewMode: "grid" | "list" | "timeline";
  screenshotSize: "small" | "medium" | "large";

  // Dashboard
  dashboardLayout: "default" | "compact";

  // Actions
  setActivityPreference: (key: string, value: unknown) => void;
  setScreenshotPreference: (key: string, value: unknown) => void;
}

export const useViewPreferencesStore = create<ViewPreferencesState>()(
  persist(
    (set) => ({
      activityPageSize: 50,
      activitySortColumn: "StartedAt",
      activitySortOrder: "Desc",
      activityVisibleColumns: ["AppName", "WindowTitle", "DwellSeconds", "StartedAt"],
      screenshotViewMode: "grid",
      screenshotSize: "medium",
      dashboardLayout: "default",
      setActivityPreference: (key, value) => set({ [key]: value }),
      setScreenshotPreference: (key, value) => set({ [key]: value }),
    }),
    { name: "timelog-view-prefs" },
  ),
);
```

### Theme Store

```typescript
interface ThemeState {
  theme: "light" | "dark" | "system";
  setTheme: (theme: "light" | "dark" | "system") => void;
  resolvedTheme: "light" | "dark"; // Computed from system preference
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: "system",
      resolvedTheme: "dark",
      setTheme: (theme) => set({
        theme,
        resolvedTheme: theme === "system"
          ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
          : theme,
      }),
    }),
    { name: "timelog-theme" },
  ),
);
```

---

## Data Flow Diagram

```
┌──────────────────────────────────────────────────┐
│                    UI Layer                       │
│                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │Dashboard │  │Activities│  │ Reports  │       │
│  │  Page    │  │  Page    │  │  Page    │       │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘       │
│       │              │              │             │
│  ┌────▼──────────────▼──────────────▼─────┐      │
│  │         TanStack Query Cache           │      │
│  │  (server state, polling, prefetch)     │      │
│  └────────────────┬───────────────────────┘      │
│                   │                              │
│  ┌────────────────▼───────────────────────┐      │
│  │         Zustand Stores                 │      │
│  │  (date range, view prefs, theme)       │      │
│  └────────────────────────────────────────┘      │
└──────────────────────┬───────────────────────────┘
                       │ HTTP
                       ▼
         ┌─────────────────────────┐
         │  Time Log CLI API      │
         │  127.0.0.1:9847        │
         └─────────────────────────┘
```

---

## Optimistic Updates

For control actions (pause/resume), use optimistic updates for instant feedback:

```typescript
export function useResumeTracking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiClient.post("/control/resume"),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: queryKeys.status });
      const previous = queryClient.getQueryData(queryKeys.status);
      queryClient.setQueryData(queryKeys.status, (old: StatusResponse) => ({
        ...old,
        Status: "Running",
      }));
      return { previous };
    },
    onError: (_error, _variables, context) => {
      queryClient.setQueryData(queryKeys.status, context?.previous);
      toast.error("Failed to resume tracking");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.status });
    },
  });
}
```

---

## Cross-References

| Reference | Location |
|-----------|----------|
| Architecture (API client) | `./01-architecture.md` |
| Component Library (data-driven components) | `./02-component-library.md` |
| Dashboard Views (data consumption) | `./04-dashboard-views.md` |
| API Interface (endpoint reference) | `../../40-time-log-cli/01-backend/06-api-interface.md` |
