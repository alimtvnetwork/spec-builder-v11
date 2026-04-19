# Time Log UI: Dashboard Views

**Version:** 1.0.0  
**Updated:** 2026-03-27

---

## Overview

Page layouts and widget compositions for each route in the Time Log UI. All pages share a global date range filter and daemon connection status from the persistent header.

---

## Dashboard Page (`/`)

The default view — a real-time productivity snapshot.

### Layout

```
┌─────────────────────────────────────────────────┐
│ Header: 🟢 Connected · Today ▼ · ☀️/🌙         │
├───────┬─────────────────────────────────────────┤
│       │                                         │
│  Nav  │  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐      │
│       │  │Active│ │Idle │ │Sess-│ │Scre-│      │
│  📊   │  │Time │ │Time │ │ions │ │ensh.│      │
│  📱   │  │5h32m│ │1h08m│ │  3  │ │ 67  │      │
│  📸   │  └─────┘ └─────┘ └─────┘ └─────┘      │
│  📈   │                                         │
│  📅   │  ┌───────────────────────────────┐      │
│  ⚙️   │  │  Hourly Activity Timeline     │      │
│       │  │  ████ ██████ ████ ███ ██████  │      │
│       │  │  8am  10am  12pm  2pm  4pm    │      │
│       │  └───────────────────────────────┘      │
│       │                                         │
│       │  ┌──────────────┐ ┌──────────────┐      │
│       │  │ Top Apps     │ │ Categories   │      │
│       │  │ VS Code 40%  │ │   🔵 Work    │      │
│       │  │ Chrome  33%  │ │   🟣 Comms   │      │
│       │  │ Terminal 14% │ │   🟢 Ref     │      │
│       │  │ Slack    8%  │ │   🟡 Other   │      │
│       │  └──────────────┘ └──────────────┘      │
│       │                                         │
│       │  ┌───────────────────────────────┐      │
│       │  │ Top Domains                   │      │
│       │  │ github.com        52m ████    │      │
│       │  │ stackoverflow.com 31m ███     │      │
│       │  │ docs.rs           15m ██      │      │
│       │  └───────────────────────────────┘      │
└───────┴─────────────────────────────────────────┘
```

### Widgets

| Widget | Component | Data Source | Refresh |
|--------|-----------|------------|---------|
| Stat cards (4) | `StatCard` | `GET /summary/daily` | 30s poll |
| Hourly timeline | `HourlyActivityChart` | `GET /summary/hourly` | 30s poll |
| Top apps | `TopItemsBarChart` | `GET /summary/apps` | 30s poll |
| Category breakdown | `CategoryPieChart` | `GET /summary/categories` | 30s poll |
| Top domains | `TopItemsBarChart` | `GET /summary/domains` | 30s poll |

### Interactions

- Click stat card → navigate to relevant detail page
- Click app in top apps → filter activities by app
- Click category in pie chart → filter activities by category
- Click domain → filter browser activities by domain

---

## Activities Page (`/activities`)

Detailed activity logs with tab-based sub-views.

### Tabs

| Tab | Component | API Endpoint |
|-----|-----------|-------------|
| Applications | `AppActivityTable` | `GET /activities/apps` |
| Browser | `BrowserActivityTable` | `GET /activities/browser` |
| Clicks | `ClickHeatmap` | `GET /activities/clicks` |

### Application Activity Table Columns

| Column | Sortable | Filterable | Width |
|--------|:--------:|:----------:|-------|
| Application | ✅ | ✅ Text search | 200px |
| Window Title | ✅ | ✅ Text search | Flex |
| Duration | ✅ | — | 100px |
| Started At | ✅ (default) | — | 160px |
| Ended At | ✅ | — | 160px |

### Browser Activity Table Columns

| Column | Sortable | Filterable | Width |
|--------|:--------:|:----------:|-------|
| Title | ✅ | ✅ Text search | Flex |
| Domain | ✅ | ✅ Text search | 200px |
| Category | ✅ | ✅ Badge chips | 130px |
| Browser | ✅ | ✅ Dropdown | 100px |
| Duration | ✅ | — | 100px |
| Started At | ✅ (default) | — | 160px |

### Click Heatmap View

- Full-screen canvas rendering of aggregated click positions
- Time slider to scrub through the day
- Toggle between app-specific and global heatmap
- Color intensity represents click density

---

## Screenshots Page (`/screenshots`)

Screenshot gallery with multiple view modes.

### View Modes

| Mode | Layout | Use Case |
|------|--------|----------|
| Grid | Responsive thumbnail grid (3-6 columns) | Quick browse |
| List | Single column with large thumbnails + metadata | Detailed review |
| Timeline | Horizontal scrolling time axis with thumbnails | Chronological context |

### Filters

- **Trigger type:** Periodic, Tab Change, App Switch, Idle, Manual
- **Application:** Filter by app that was active during capture
- **Date range:** Global date range from header

### Interactions

- Click thumbnail → open lightbox (full-size view)
- Lightbox: arrow keys to navigate, `i` to toggle metadata panel, `Esc` to close
- Right-click → "Open file location" (if served from local filesystem)
- Bulk select → delete multiple screenshots

---

## Reports Page (`/reports`)

Productivity analytics with historical trends.

### Sub-views

| View | Description |
|------|-------------|
| Daily Report | Summary for a selected date with all metrics |
| Weekly Comparison | Side-by-side bars comparing days of the week |
| Trend Analysis | Line charts over 7/14/30/90 days |
| Category Trends | How time distribution changes over time |

### Daily Report Layout

```
┌────────────────────────────────────────┐
│ Daily Report: March 27, 2026           │
├────────────────────────────────────────┤
│ Active: 5h 32m  │  Idle: 1h 08m       │
│ Sessions: 3     │  Screenshots: 67    │
├────────────────────────────────────────┤
│ ┌─────────────────┐ ┌────────────────┐ │
│ │ Hourly Breakdown│ │ App Rankings   │ │
│ │ (bar chart)     │ │ (bar chart)    │ │
│ └─────────────────┘ └────────────────┘ │
│ ┌─────────────────┐ ┌────────────────┐ │
│ │ Category Split  │ │ Domain Ranking │ │
│ │ (donut chart)   │ │ (bar chart)    │ │
│ └─────────────────┘ └────────────────┘ │
│ ┌──────────────────────────────────────┐│
│ │ Session Timeline                     ││
│ │ ███░░░████░░████████░░░░░████████    ││
│ │ 8am      12pm       4pm       8pm   ││
│ └──────────────────────────────────────┘│
└────────────────────────────────────────┘
```

### Trend Analysis

```
┌────────────────────────────────────────┐
│ Trend: Last 30 Days                    │
│                                        │
│  8h ┤                    ╱╲            │
│  6h ┤  ╱╲    ╱╲  ╱╲╱╲╱╱  ╲╱╲         │
│  4h ┤╱╱  ╲╱╱╱  ╲╱            ╲╱       │
│  2h ┤                                  │
│  0h ┤──────────────────────────────    │
│     Mar 1      Mar 10     Mar 20       │
│                                        │
│  ── Active Time  ── Browser Time       │
│  ·· Idle Time                          │
└────────────────────────────────────────┘
```

### Export Dialog

```
┌────────────────────────────┐
│ Export Data                 │
│                            │
│ Format:  ○ CSV  ○ JSON     │
│                            │
│ Include:                   │
│ ☑ App Activities           │
│ ☑ Browser Activities       │
│ ☐ Click Aggregates         │
│ ☑ Screenshots (metadata)   │
│ ☐ Idle Events              │
│                            │
│ Date Range: Mar 1 – Mar 27 │
│                            │
│ [Cancel]  [Export]         │
└────────────────────────────┘
```

---

## Sessions Page (`/sessions`)

Historical session list with activity breakdown per session.

### Session List Table

| Column | Description |
|--------|-------------|
| Session ID | Truncated UUID with copy button |
| Started At | Session start timestamp |
| Duration | Total session duration |
| End Reason | Active, Idle, Shutdown, UserPaused |
| Activities | Count of app/browser activities |
| Screenshots | Count of screenshots taken |

### Session Detail View

Clicking a session row expands to show:
- Activity timeline within the session
- Top apps during this session
- Screenshots taken during this session
- Idle gaps within the session

---

## Settings Page (`/settings`)

See [05-settings-privacy.md](./05-settings-privacy.md) for full specification.

---

## Responsive Breakpoints

| Breakpoint | Width | Layout Changes |
|------------|-------|---------------|
| Desktop | ≥ 1280px | Full sidebar, 2-column widget grid |
| Small desktop | 1024–1279px | Full sidebar, single-column widgets |
| Tablet | 768–1023px | Collapsed sidebar (icons only), single-column |
| Below 768px | Not supported | Show "Desktop required" message |

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + B` | Toggle sidebar |
| `Cmd/Ctrl + K` | Quick search (activities, apps, domains) |
| `Cmd/Ctrl + 1-5` | Navigate to page (1=Dashboard, 2=Activities...) |
| `Cmd/Ctrl + E` | Open export dialog |
| `Cmd/Ctrl + P` | Pause/resume tracking |
| `T` | Set date range to "Today" |
| `Y` | Set date range to "Yesterday" |
| `W` | Set date range to "This Week" |

---

## Cross-References

| Reference | Location |
|-----------|----------|
| Component Library | `./02-component-library.md` |
| State Management | `./03-state-management.md` |
| Settings & Privacy | `./05-settings-privacy.md` |
| API Endpoints | `../../40-time-log-cli/01-backend/06-api-interface.md` |
