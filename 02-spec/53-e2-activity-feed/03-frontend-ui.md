# E2 Activity Feed — Frontend UI

**Version:** 1.0.0  
**Last Updated:** 2026-03-20

---

## Overview

React-based activity feed UI providing a filterable, paginated timeline of all system events. Follows the shared CLI frontend patterns defined in `02-spec/33-shared-cli-frontend/`.

---

## Component Hierarchy

```
ActivityFeedPage
├── ActivityFilterBar
│   ├── TypeFilter (multi-select chips)
│   ├── SiteFilter (dropdown)
│   ├── DateRangeFilter (from/to pickers)
│   └── SearchInput (debounced full-text)
├── ActivityTimeline
│   ├── ActivityGroup (grouped by date)
│   │   ├── ActivityEntry
│   │   │   ├── ActivityIcon (type-specific)
│   │   │   ├── ActivityContent (title, metadata)
│   │   │   └── ActivityTimestamp (relative + absolute)
│   │   └── ...
│   └── ...
├── ActivityPagination (offset-based)
└── ActivityEmptyState
```

---

## Components

### ActivityFeedPage

Top-level page component. Manages filter state and data fetching.

```typescript
interface ActivityFeedPageProps {
  defaultSiteId?: number;
}

// Query key: ['activity', filters]
// Refetch on filter change with 300ms debounce on search
```

### ActivityFilterBar

| Filter | Control | Default | API Param |
|--------|---------|---------|-----------|
| Type | Multi-select chips | All types | `type` (comma-separated) |
| Site | Dropdown | All sites | `siteId` |
| Date range | Date pickers | Last 30 days | `from`, `to` |
| Search | Text input (debounced) | Empty | `search` |

**Behavior:**
- Filters persist in URL search params for shareability
- Changing any filter resets to page 1
- Clear all button resets to defaults

### ActivityTimeline

Vertical timeline with entries grouped by calendar date.

**Entry types and icons:**

| Type | Icon | Color |
|------|------|-------|
| `publish` | `Upload` | Blue |
| `snapshot` | `Camera` | Purple |
| `plugin` | `Puzzle` | Green |
| `connection` | `Link` | Orange |
| `config` | `Settings` | Gray |

**Entry layout:**
- Left: colored icon with connector line
- Center: title (bold) + action badge + metadata summary
- Right: relative timestamp (e.g., "2 hours ago"), absolute on hover

### ActivityEmptyState

Displayed when no results match current filters.

- Message: "No activity found for the selected filters"
- Action: "Clear filters" button
- Illustration: timeline with no entries

---

## Data Fetching

```typescript
interface UseActivityFeedParams {
  limit: number;
  offset: number;
  siteId?: number;
  type?: string;
  from?: string;
  to?: string;
  search?: string;
}

function useActivityFeed(params: UseActivityFeedParams) {
  return useQuery({
    queryKey: ['activity', params],
    queryFn: () => fetchActivity(params),
    staleTime: 30_000, // Match server cache TTL
    keepPreviousData: true, // Smooth pagination
  });
}
```

---

## Responsive Behavior

| Breakpoint | Layout |
|-----------|--------|
| Desktop (≥1024px) | Full filter bar + timeline with metadata |
| Tablet (768–1023px) | Collapsible filter panel + compact entries |
| Mobile (<768px) | Filter drawer + simplified timeline (no connector lines) |

---

## Accessibility

- Timeline entries are `role="listitem"` within a `role="list"` container
- Each entry has `aria-label` combining type, action, and timestamp
- Filter controls have associated labels
- Keyboard navigation: Tab through entries, Enter to expand details

---

## Cross-References

- [Endpoint Specification](./01-go-endpoint-spec.md)
- [Data Sources](./02-data-sources.md)
- [Shared CLI Frontend Patterns](../33-shared-cli-frontend/00-overview.md)
