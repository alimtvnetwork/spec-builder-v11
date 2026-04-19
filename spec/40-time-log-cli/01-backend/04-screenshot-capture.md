# Time Log CLI: Screenshot Capture

**Version:** 1.0.0  
**Updated:** 2026-03-27

---

## Overview

The Screenshot Collector captures periodic and event-driven screenshots of the active screen or window. Screenshots are compressed, stored locally with date-based directory organization, and subject to configurable retention and storage limits.

---

## Capture Triggers

| Trigger | Description | Default |
|---------|-------------|---------|
| `Periodic` | Capture every N seconds | Every 300s (5 min) |
| `OnTabChange` | Capture when browser tab changes | Enabled |
| `OnAppSwitch` | Capture when active application changes | Disabled |
| `OnIdle` | Capture just before idle state is entered | Enabled |
| `Manual` | User-triggered via CLI command | Always available |

---

## Capture Engine

### Platform APIs

| OS | Primary API | Fallback |
|----|-------------|----------|
| Windows | DXGI Desktop Duplication API | `BitBlt` from desktop DC |
| Linux (X11) | `XGetImage` / `XShmGetImage` (shared memory) | — |
| Linux (Wayland) | PipeWire screen capture / `xdg-desktop-portal` | `grim` CLI fallback |
| macOS | `CGDisplayCreateImage` / `CGWindowListCreateImage` | — |

### Capture Modes

| Mode | Description |
|------|-------------|
| `FullScreen` | Entire primary display |
| `ActiveWindow` | Only the focused window (smaller file size) |
| `AllDisplays` | All connected monitors stitched together |

Default: `ActiveWindow` (configurable)

### Capture Flow

```rust
pub async fn capture_screenshot(
    mode: CaptureMode,
    trigger: ScreenshotTrigger,
    config: &ScreenshotConfig,
) -> Result<ScreenshotResult, CaptureError> {
    // 1. Capture raw pixel buffer from OS
    let raw_buffer = platform::capture_screen(mode)?;

    // 2. Apply privacy blur if configured
    let processed = if config.blur_enabled {
        apply_privacy_blur(&raw_buffer, &config.blur_regions)?
    } else {
        raw_buffer
    };

    // 3. Encode to target format
    let encoded = encode_image(&processed, config.format, config.quality)?;

    // 4. Generate file path
    let path = generate_screenshot_path(config, trigger)?;

    // 5. Write to disk
    tokio::fs::write(&path, &encoded).await?;

    // 6. Return metadata
    Ok(ScreenshotResult {
        path,
        size_bytes: encoded.len() as u64,
        width: raw_buffer.width,
        height: raw_buffer.height,
        format: config.format,
        trigger,
        captured_at: Utc::now(),
    })
}
```

---

## Image Encoding

| Format | Extension | Quality Range | Typical Size (1920×1080) | Use Case |
|--------|-----------|---------------|--------------------------|----------|
| WebP | `.webp` | 1–100 | 40–120 KB | **Default** — best size/quality ratio |
| JPEG | `.jpg` | 1–100 | 60–200 KB | Compatibility fallback |
| PNG | `.png` | Lossless | 500–2000 KB | When lossless is required |

**Default:** WebP at quality 80 (typically ~60 KB per 1080p screenshot)

---

## Storage Management

### Directory Structure

```
{DataDirectory}/screenshots/
└── {Year}/
    └── {Month}/
        └── {Day}/
            ├── {HHMMSS}-{trigger}.webp
            ├── {HHMMSS}-{trigger}.webp
            └── ...
```

**Example:**
```
~/.timelog/data/screenshots/2026/03/27/094532-tab-change.webp
```

### File Naming

```
{HHMMSS}-{trigger}.{ext}
```

| Component | Format | Example |
|-----------|--------|---------|
| Time | `HHMMSS` | `094532` |
| Trigger | kebab-case | `periodic`, `tab-change`, `app-switch`, `idle`, `manual` |
| Extension | Format-dependent | `.webp`, `.jpg`, `.png` |

### Retention Policy

```rust
pub struct RetentionPolicy {
    pub max_storage_mb: u64,     // Default: 5000 (5 GB)
    pub max_age_days: u32,       // Default: 90 days
    pub cleanup_interval_hours: u32, // Default: 24 (run daily)
}
```

**Cleanup algorithm:**

1. Delete all screenshots older than `MaxAgeDays`
2. If total size still exceeds `MaxStorageMb`, delete oldest screenshots first until under limit
3. Log cleanup summary (files deleted, space reclaimed)

### Storage Estimation

| Scenario | Screenshots/Day | Size/Day | 90-Day Total |
|----------|----------------|----------|--------------|
| Light (periodic only, 5 min) | ~100 | ~6 MB | ~540 MB |
| Medium (periodic + tab changes) | ~300 | ~18 MB | ~1.6 GB |
| Heavy (all triggers, 1 min periodic) | ~1,000 | ~60 MB | ~5.4 GB |

---

## Privacy Features

### Region Blur

Configurable blur regions to protect sensitive areas:

```toml
[Screenshot.Blur]
Enabled = false

# Blur specific screen regions (x, y, width, height in pixels)
[[Screenshot.Blur.Regions]]
X = 0
Y = 0
Width = 400
Height = 50
Label = "Taskbar notification area"

# Blur by window title pattern
[[Screenshot.Blur.WindowPatterns]]
Pattern = "*1Password*"
Action = "Skip"  # Don't capture at all

[[Screenshot.Blur.WindowPatterns]]
Pattern = "*Terminal*"
Action = "Blur"  # Capture but blur entire window
```

### Application Blacklist

When the active application matches a blacklisted pattern, screenshots are **skipped entirely**:

```rust
pub fn should_capture(app_name: &str, config: &ScreenshotConfig) -> bool {
    !config.blacklisted_apps.iter().any(|pattern| {
        glob_match(pattern, app_name)
    })
}
```

---

## Data Model

```rust
#[derive(Debug, Serialize)]
#[serde(rename_all = "PascalCase")]
pub struct Screenshot {
    pub id: Uuid,
    pub session_id: Uuid,
    pub file_path: String,
    pub file_size_bytes: u64,
    pub width: u32,
    pub height: u32,
    pub format: ImageFormat,
    pub trigger: ScreenshotTrigger,
    pub active_app: String,
    pub active_window_title: String,
    pub captured_at: DateTime<Utc>,
}

#[derive(Debug, Serialize)]
pub enum ScreenshotTrigger {
    Periodic,
    TabChange,
    AppSwitch,
    Idle,
    Manual,
}

#[derive(Debug, Serialize)]
pub enum ImageFormat {
    WebP,
    Jpeg,
    Png,
}
```

---

## Cross-References

| Reference | Location |
|-----------|----------|
| Architecture | `./01-architecture.md` |
| OS Integration | `./02-os-integration.md` |
| Browser Tracking (tab change trigger) | `./03-browser-tracking.md` |
| Database Schema | `./05-database-schema.md` |
