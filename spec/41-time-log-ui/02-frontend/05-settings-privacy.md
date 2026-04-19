# Time Log UI: Settings & Privacy

**Version:** 1.0.0  
**Updated:** 2026-03-27

---

## Overview

Configuration UI for managing Time Log CLI settings. Reads current config via `GET /api/v1/config` and applies changes via `PATCH /api/v1/config`. All settings map directly to `config.toml` fields.

---

## Settings Sections

### General

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| Data Directory | Path (read-only) | `~/.timelog/data` | Where data is stored |
| Log Level | Select | `Info` | Debug, Info, Warn, Error |
| Auto Start | Toggle | `true` | Start daemon on system boot |

### Collectors

Toggle individual collectors on/off:

| Collector | Default | Description |
|-----------|---------|-------------|
| Browser Tracking | ✅ On | Track active browser tabs |
| Click Tracking | ✅ On | Record mouse clicks |
| Screenshot Capture | ✅ On | Periodic screenshots |
| App Focus Tracking | ✅ On | Track active applications |
| Idle Detection | ✅ On | Detect idle/away state |

### Screenshot Settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| Capture Interval | Slider (30s–30min) | 5 min | Time between periodic captures |
| On Tab Change | Toggle | ✅ On | Capture on browser tab switch |
| On App Switch | Toggle | ❌ Off | Capture on application switch |
| Image Format | Select | WebP | WebP, JPEG, PNG |
| Quality | Slider (1–100) | 80 | Compression quality |
| Max Storage | Input (MB) | 5000 | Maximum screenshot storage |

### Privacy Controls

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| Excluded URLs | Tag input | `*bank*`, `*healthcare*`, `*.gov/*` | URL patterns to never track |
| Excluded Apps | Tag input | `1Password`, `KeePass` | Apps to never track |
| Blur Screenshots | Toggle | ❌ Off | Apply blur to screenshots |
| Retention Days | Input | 90 | Auto-delete data older than N days |
| Incognito Detection | Toggle | ✅ On | Skip incognito/private browsing |

### Idle Detection

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| Idle Threshold | Slider (1–30 min) | 5 min | Time before marking as idle |
| Pause on Idle | Toggle | ✅ On | Stop tracking during idle |

### API Settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| API Enabled | Toggle | ✅ On | Enable HTTP API (required for UI) |
| Port | Input | 9847 | API port number |
| API Token | Password input | Empty | Optional auth token |

---

## URL Category Manager

Custom URL category editor accessible from Privacy settings:

```
┌────────────────────────────────────┐
│ URL Categories                      │
│                                    │
│ 🔵 Work                     [Edit]│
│    github.com, gitlab.com,         │
│    *.atlassian.com, figma.com      │
│                                    │
│ 🟣 Communication            [Edit]│
│    slack.com, discord.com,         │
│    mail.google.com                 │
│                                    │
│ 🟢 Reference                [Edit]│
│    stackoverflow.com, docs.*,      │
│    *.readthedocs.io                │
│                                    │
│ [+ Add Category]                   │
└────────────────────────────────────┘
```

### Category Editor Dialog

```
┌──────────────────────────────────┐
│ Edit Category: Work              │
│                                  │
│ Name:  [Work_________________]   │
│ Color: [🔵 Blue ▼]              │
│                                  │
│ URL Patterns:                    │
│ ┌──────────────────────────────┐ │
│ │ github.com              [×] │ │
│ │ gitlab.com              [×] │ │
│ │ *.atlassian.com         [×] │ │
│ │ figma.com               [×] │ │
│ │ [+ Add pattern___________]  │ │
│ └──────────────────────────────┘ │
│                                  │
│ [Cancel]  [Save]                 │
└──────────────────────────────────┘
```

---

## Data Management

### Storage Usage Display

```
┌────────────────────────────────────┐
│ Storage Usage                       │
│                                    │
│ Database:     12.4 MB              │
│ Screenshots:  1.2 GB / 5.0 GB     │
│ ████████████████░░░░░░░░  24%     │
│                                    │
│ Total Records:                     │
│  App Activities:     42,381        │
│  Browser Activities: 18,924        │
│  Click Aggregates:    8,102        │
│  Screenshots:         2,847        │
│  Sessions:              312        │
│                                    │
│ [Run Cleanup]  [Export All]        │
└────────────────────────────────────┘
```

### Data Export

- **Formats:** CSV, JSON
- **Scope:** Selectable date range and data types
- **Download:** Browser file download (generated server-side via `GET /api/v1/export`)

### Data Deletion

```
┌────────────────────────────────────┐
│ ⚠️ Delete Data                      │
│                                    │
│ Delete all data older than:        │
│ [30 days ▼]                        │
│                                    │
│ This will permanently delete:      │
│  • 12,481 activity records         │
│  • 892 screenshots (340 MB)        │
│  • 45 sessions                     │
│                                    │
│ Type "DELETE" to confirm:          │
│ [________________]                 │
│                                    │
│ [Cancel]  [Delete Permanently]     │
└────────────────────────────────────┘
```

---

## Settings Persistence

```typescript
// Settings are applied via PATCH to the CLI daemon
export function useUpdateConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (updates: Partial<Config>) =>
      apiClient.patch("/config", updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["config"] });
      toast.success("Settings saved");
    },
    onError: (error) => {
      toast.error(`Failed to save: ${error.message}`);
    },
  });
}

// Settings form with dirty tracking
function useSettingsForm(section: string) {
  const { data: config } = useConfig();
  const updateConfig = useUpdateConfig();
  const [localValues, setLocalValues] = useState(config?.[section]);
  const isDirty = !deepEqual(localValues, config?.[section]);

  const save = () => updateConfig.mutate({ [section]: localValues });
  const reset = () => setLocalValues(config?.[section]);

  return { values: localValues, setValues: setLocalValues, isDirty, save, reset };
}
```

---

## Cross-References

| Reference | Location |
|-----------|----------|
| Architecture (config endpoint) | `./01-architecture.md` |
| API Interface (PATCH /config) | `../../40-time-log-cli/01-backend/06-api-interface.md` |
| CLI Configuration (config.toml) | `../../40-time-log-cli/01-backend/01-architecture.md` |
| Privacy Filtering | `../../40-time-log-cli/01-backend/03-browser-tracking.md` |
