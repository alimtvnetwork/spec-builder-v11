# Time Log UI: Component Library

**Version:** 1.0.0  
**Updated:** 2026-03-27

---

## Overview

Reusable UI component library for the Time Log UI. Built on shadcn/ui primitives with custom design tokens tailored for a productivity dashboard.

---

## Design Tokens

### Color Palette

```css
/* index.css — Time Log UI tokens */
:root {
  /* Base */
  --background: 220 14% 96%;
  --foreground: 220 20% 10%;
  --card: 0 0% 100%;
  --card-foreground: 220 20% 10%;

  /* Primary — Deep Blue (focus/productivity) */
  --primary: 220 72% 50%;
  --primary-foreground: 0 0% 100%;

  /* Accent — Teal (active/tracking) */
  --accent: 172 66% 45%;
  --accent-foreground: 0 0% 100%;

  /* Status colors */
  --status-active: 142 72% 42%;
  --status-idle: 38 92% 55%;
  --status-disconnected: 0 84% 60%;
  --status-paused: 38 92% 55%;

  /* Category colors */
  --category-work: 220 72% 50%;
  --category-communication: 262 52% 55%;
  --category-social: 340 75% 55%;
  --category-reference: 172 66% 45%;
  --category-entertainment: 38 92% 55%;
  --category-shopping: 25 95% 53%;
  --category-uncategorized: 220 9% 46%;

  /* Chart palette */
  --chart-1: 220 72% 50%;
  --chart-2: 172 66% 45%;
  --chart-3: 262 52% 55%;
  --chart-4: 38 92% 55%;
  --chart-5: 340 75% 55%;
  --chart-6: 25 95% 53%;
}

.dark {
  --background: 220 16% 12%;
  --foreground: 220 10% 92%;
  --card: 220 16% 16%;
  --card-foreground: 220 10% 92%;
  /* ... dark mode overrides */
}
```

### Typography

```css
:root {
  --font-heading: "Ubuntu", system-ui, sans-serif;
  --font-body: "Inter", system-ui, sans-serif;
  --font-mono: "JetBrains Mono", monospace;
}
```

---

## Base Components (shadcn/ui Extended)

### StatCard

Displays a single metric with label, value, trend indicator, and optional sparkline.

```tsx
interface StatCardProps {
  label: string;
  value: string;
  trend?: {
    direction: "up" | "down" | "flat";
    percentage: number;
    label: string;  // e.g., "vs yesterday"
  };
  icon?: LucideIcon;
  sparklineData?: number[];
  className?: string;
}

// Usage
<StatCard
  label="Active Time"
  value="5h 32m"
  icon={Clock}
  trend={{ direction: "up", percentage: 12, label: "vs yesterday" }}
  sparklineData={[3.2, 4.1, 5.5, 4.8, 5.2, 5.5]}
/>
```

### CategoryBadge

Color-coded badge for URL categories with consistent styling.

```tsx
interface CategoryBadgeProps {
  category: UrlCategory;
  showDuration?: boolean;
  durationSeconds?: number;
}

// Renders with category-specific color from design tokens
<CategoryBadge category="Work" showDuration durationSeconds={7200} />
// → [🔵 Work · 2h 00m]
```

### DurationDisplay

Human-readable duration formatting with tooltip for exact value.

```tsx
interface DurationDisplayProps {
  seconds: number;
  format?: "short" | "long" | "compact";
}

// "short": "5h 32m"
// "long": "5 hours, 32 minutes"
// "compact": "5:32"
```

### ConnectionIndicator

Daemon connection status with animated dot.

```tsx
interface ConnectionIndicatorProps {
  status: "Connected" | "Disconnected" | "Paused";
  sessionDuration?: number;
}

// Renders: 🟢 Connected · Session: 2h 15m
// Or:      🔴 Disconnected · Retrying...
```

### DateRangePicker

Date range selection for filtering all views.

```tsx
interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  presets: DateRangePreset[];
}

type DateRangePreset = "today" | "yesterday" | "last7days" | "last30days" | "thisWeek" | "thisMonth" | "custom";
```

### ActivityBar

Horizontal bar representing time spent, colored by category.

```tsx
interface ActivityBarProps {
  segments: Array<{
    category: UrlCategory;
    seconds: number;
    label: string;
  }>;
  totalSeconds: number;
  height?: number;
}

// Renders a stacked horizontal bar with proportional segment widths
```

---

## Chart Components

### HourlyActivityChart

24-hour bar chart showing active vs. idle time per hour.

```tsx
interface HourlyActivityChartProps {
  data: Array<{
    Hour: number;       // 0-23
    ActiveSeconds: number;
    IdleSeconds: number;
  }>;
  date: string;
}
```

**Visual:** Vertical bars, active time in primary color, idle in muted. Current hour highlighted.

### TopItemsBarChart

Horizontal bar chart for "top N" lists (apps, domains).

```tsx
interface TopItemsBarChartProps {
  items: Array<{
    name: string;
    seconds: number;
    icon?: string;
    percentage: number;
  }>;
  maxItems?: number;     // Default: 10
  colorScheme?: "apps" | "domains" | "categories";
}
```

### CategoryPieChart

Donut chart showing time distribution by URL category.

```tsx
interface CategoryPieChartProps {
  data: Array<{
    category: UrlCategory;
    seconds: number;
    percentage: number;
  }>;
  showLegend?: boolean;
  innerLabel?: string;    // Center text, e.g., "5h 32m"
}
```

### TrendLineChart

Multi-day line chart for tracking productivity trends.

```tsx
interface TrendLineChartProps {
  data: Array<{
    Date: string;
    ActiveSeconds: number;
    BrowserSeconds: number;
    IdleSeconds: number;
  }>;
  lines: Array<"active" | "browser" | "idle">;
  dateRange: DateRange;
}
```

### ClickHeatmap

Canvas-based heatmap visualization of click density.

```tsx
interface ClickHeatmapProps {
  data: Array<{
    X: number;
    Y: number;
    Count: number;
  }>;
  width: number;
  height: number;
  colorScale?: "warm" | "cool" | "viridis";
}
```

---

## Data Table Components

### ActivityDataTable

Generic sortable, filterable, paginated table for activity data.

```tsx
interface ActivityDataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  pagination: PaginationState;
  onPaginationChange: (state: PaginationState) => void;
  onSort: (column: string, direction: "Asc" | "Desc") => void;
  filters?: FilterState[];
  isLoading: boolean;
}
```

**Features:**
- Column sorting (click header)
- Text search filter
- Category filter chips
- Pagination with page size selector (25, 50, 100)
- Row click to expand details
- Keyboard navigation (arrow keys, Enter to expand)

---

## Screenshot Components

### ScreenshotCard

Thumbnail card with metadata overlay.

```tsx
interface ScreenshotCardProps {
  screenshot: Screenshot;
  onClick: () => void;
  showMetadata?: boolean;
  size?: "small" | "medium" | "large";
}

// Renders: Thumbnail with hover overlay showing:
// - Time: "09:45:32"
// - App: "VS Code"
// - Trigger: "Tab Change"
```

### ScreenshotLightbox

Full-screen screenshot viewer with navigation.

```tsx
interface ScreenshotLightboxProps {
  screenshots: Screenshot[];
  currentIndex: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

// Features:
// - Arrow key navigation
// - Zoom (scroll wheel)
// - Metadata panel (toggle with 'i' key)
// - Delete button with confirmation
```

---

## Layout Components

### AppShell

Main application layout with persistent sidebar and header.

```tsx
<AppShell>
  <Sidebar>
    <NavItem icon={LayoutDashboard} to="/" label="Dashboard" />
    <NavItem icon={Activity} to="/activities" label="Activities" />
    <NavItem icon={Camera} to="/screenshots" label="Screenshots" />
    <NavItem icon={BarChart3} to="/reports" label="Reports" />
    <NavItem icon={History} to="/sessions" label="Sessions" />
    <Separator />
    <NavItem icon={Settings} to="/settings" label="Settings" />
  </Sidebar>
  <Header>
    <ConnectionIndicator />
    <DateRangePicker />
    <ThemeToggle />
  </Header>
  <Content>
    <Outlet />
  </Content>
</AppShell>
```

**Sidebar behavior:**
- Desktop: Always visible, 240px width
- Tablet: Collapsible to icon-only (64px)
- Keyboard: `Cmd/Ctrl + B` to toggle

---

## Accessibility

| Requirement | Implementation |
|-------------|---------------|
| Keyboard navigation | All interactive elements focusable, arrow key navigation in tables/galleries |
| Screen reader | ARIA labels on charts, live regions for status changes |
| Color contrast | WCAG AA minimum on all text/background combinations |
| Reduced motion | `prefers-reduced-motion` disables chart animations |
| Focus indicators | Visible focus rings on all interactive elements |

---

## Cross-References

| Reference | Location |
|-----------|----------|
| Architecture | `./01-architecture.md` |
| Dashboard Views | `./04-dashboard-views.md` |
| State Management | `./03-state-management.md` |
| TypeScript Standards | `../../02-coding-guidelines/02-typescript/00-overview.md` |
