# Time Log CLI: Remote Settings

**Version:** 1.0.0  
**Updated:** 2026-03-28

---

## Overview

The Time Log CLI can fetch its operational settings from a **remote REST API** (the Admin API) in addition to the local `config.toml` file. This enables centralized fleet management — an administrator sets policies (time slices, screenshot frequency, click thresholds, collector toggles) once, and all tracked devices adopt them automatically.

Settings follow a **merge-with-override** model: remote settings take precedence over local defaults, but the user can pin specific local overrides that the remote cannot change.

---

## Settings Hierarchy

```
┌──────────────────────────────────────────────┐
│              Effective Settings              │
│                                              │
│   ┌────────────────┐  ┌──────────────────┐   │
│   │  Local Defaults│  │  Remote Settings │   │
│   │  (config.toml) │  │  (Admin API)     │   │
│   └───────┬────────┘  └────────┬─────────┘   │
│           │                    │              │
│           └───────┬────────────┘              │
│                   │                           │
│           ┌───────▼────────┐                  │
│           │  Merge Engine  │                  │
│           │                │                  │
│           │  Remote wins   │                  │
│           │  unless local  │                  │
│           │  is pinned     │                  │
│           └───────┬────────┘                  │
│                   │                           │
│           ┌───────▼────────┐                  │
│           │  Validation    │                  │
│           │  (range/type)  │                  │
│           └────────────────┘                  │
└──────────────────────────────────────────────┘
```

### Precedence Rules

| Priority | Source | Override Behavior |
|----------|--------|-------------------|
| 1 (highest) | Local pinned overrides | Cannot be changed by remote; user explicitly locked |
| 2 | Remote settings | Fetched from Admin API; override local defaults |
| 3 (lowest) | Local defaults (`config.toml`) | Baseline values shipped with binary |

---

## Remote Settings Schema

### Fetch Endpoint

```
GET /v1/settings/{DeviceId}
Authorization: Bearer {ApiKey}
X-Client-Version: {AppVersion}
X-OS: {windows|linux|macos}
```

### Response

```json
{
  "Version": 42,
  "UpdatedAt": "2026-03-28T08:00:00Z",
  "Settings": {
    "TimeSlice": {
      "DurationMinutes": 5,
      "ScreenshotsPerSlice": 3,
      "ClickThreshold100Percent": 150,
      "ClickThreshold50Percent": 75,
      "MinActiveSecondsPerSlice": 240
    },
    "Collectors": {
      "BrowserTracking": true,
      "ClickTracking": true,
      "ScreenshotCapture": true,
      "AppFocusTracking": true,
      "IdleDetection": true,
      "FilePathExtraction": true
    },
    "Screenshot": {
      "IntervalSeconds": 300,
      "OnTabChange": true,
      "OnAppSwitch": false,
      "Format": "WebP",
      "Quality": 80,
      "MaxStorageMb": 5000,
      "CaptureMode": "ActiveWindow"
    },
    "Privacy": {
      "ExcludeUrls": ["*bank*", "*healthcare*", "*.gov/*"],
      "ExcludeApps": ["1Password", "KeePass"],
      "BlurScreenshots": false,
      "RetentionDays": 90,
      "IncognitoDetection": true
    },
    "Idle": {
      "IdleThresholdSeconds": 300,
      "PauseTrackingOnIdle": true
    },
    "Sync": {
      "SyncIntervalSeconds": 60,
      "BatchSize": 100,
      "PurgeAfterSyncSeconds": 86400,
      "CompressPayload": true
    },
    "Schedule": {
      "TrackingEnabled": true,
      "ActiveDays": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      "ActiveStartTime": "08:00",
      "ActiveEndTime": "18:00",
      "TimezoneOverride": null
    }
  }
}
```

### Settings Field Reference

#### TimeSlice

| Field | Type | Default | Range | Description |
|-------|------|---------|-------|-------------|
| `DurationMinutes` | `u32` | 5 | 1–30 | Length of each tracking time slice |
| `ScreenshotsPerSlice` | `u32` | 3 | 0–20 | Number of screenshots required per time slice |
| `ClickThreshold100Percent` | `u32` | 150 | 1–10000 | Click count to score 100% activity in a slice |
| `ClickThreshold50Percent` | `u32` | 75 | 1–5000 | Click count to score 50% activity in a slice |
| `MinActiveSecondsPerSlice` | `u32` | 240 | 0–1800 | Minimum non-idle seconds to consider slice "active" |

#### Collectors

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `BrowserTracking` | `bool` | `true` | Enable/disable browser tab collector |
| `ClickTracking` | `bool` | `true` | Enable/disable mouse click collector |
| `ScreenshotCapture` | `bool` | `true` | Enable/disable screenshot collector |
| `AppFocusTracking` | `bool` | `true` | Enable/disable app focus collector |
| `IdleDetection` | `bool` | `true` | Enable/disable idle detection |
| `FilePathExtraction` | `bool` | `true` | Enable/disable file path parsing from window titles |

#### Schedule

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `TrackingEnabled` | `bool` | `true` | Master tracking toggle |
| `ActiveDays` | `Vec<String>` | Mon–Fri | Days of the week when tracking is active |
| `ActiveStartTime` | `String` | `"08:00"` | Start of tracking window (local time, `HH:MM`) |
| `ActiveEndTime` | `String` | `"18:00"` | End of tracking window (local time, `HH:MM`) |
| `TimezoneOverride` | `Option<String>` | `null` | IANA timezone (e.g., `"America/New_York"`); `null` = system timezone |

---

## Settings Fetch Engine

```rust
pub struct SettingsFetcher {
    config: RemoteSettingsConfig,
    http_client: reqwest::Client,
    cached_settings: Arc<RwLock<Option<CachedSettings>>>,
}

#[derive(Debug)]
struct CachedSettings {
    settings: RemoteSettings,
    version: u64,
    fetched_at: DateTime<Utc>,
    etag: Option<String>,
}

impl SettingsFetcher {
    /// Periodic settings poll (runs in background)
    pub async fn run(&self, mut shutdown: tokio::sync::watch::Receiver<bool>) {
        let mut interval = tokio::time::interval(
            Duration::from_secs(self.config.poll_interval_seconds)
        );

        loop {
            tokio::select! {
                _ = interval.tick() => {
                    self.fetch_and_apply().await;
                }
                _ = shutdown.changed() => break,
            }
        }
    }

    async fn fetch_and_apply(&self) -> Result<bool, SettingsError> {
        // 1. Build request with conditional header
        let mut request = self.http_client
            .get(format!("{}/v1/settings/{}", self.config.remote_url, self.config.device_id))
            .bearer_auth(&self.config.api_key)
            .header("X-Client-Version", env!("CARGO_PKG_VERSION"))
            .header("X-OS", std::env::consts::OS);

        // Use ETag for conditional fetch (304 = no changes)
        if let Some(cached) = self.cached_settings.read().await.as_ref() {
            if let Some(ref etag) = cached.etag {
                request = request.header("If-None-Match", etag);
            }
        }

        let response = request.send().await?;

        // 2. Handle 304 Not Modified
        if response.status() == StatusCode::NOT_MODIFIED {
            return Ok(false); // No changes
        }

        // 3. Parse new settings
        let etag = response.headers()
            .get("ETag")
            .and_then(|v| v.to_str().ok().map(String::from));
        let remote: RemoteSettingsResponse = response.json().await?;

        // 4. Validate all values are within allowed ranges
        validate_settings(&remote.settings)?;

        // 5. Merge with local config (remote wins unless pinned)
        let merged = merge_settings(&self.local_config, &remote.settings, &self.pinned_keys);

        // 6. Apply to running collectors (hot-reload)
        self.apply_settings(&merged).await?;

        // 7. Cache
        *self.cached_settings.write().await = Some(CachedSettings {
            settings: remote.settings,
            version: remote.version,
            fetched_at: Utc::now(),
            etag,
        });

        Ok(true)
    }
}
```

### Configuration

```toml
[RemoteSettings]
Enabled = false                       # Off by default — local-only mode
PollIntervalSeconds = 300             # Check for new settings every 5 minutes
RemoteUrl = "https://api.example.com" # Same base URL as Sync
CacheFile = "~/.timelog/settings-cache.json"  # Offline fallback cache

# Pinned overrides — remote cannot change these
[RemoteSettings.Pinned]
Privacy.ExcludeApps = ["1Password"]   # User always excludes their password manager
Idle.IdleThresholdSeconds = 180       # User prefers 3-minute idle instead of remote 5-minute
```

---

## Merge Engine

```rust
pub fn merge_settings(
    local: &LocalConfig,
    remote: &RemoteSettings,
    pinned: &HashSet<String>,
) -> EffectiveSettings {
    let mut effective = EffectiveSettings::from(local);

    // Apply each remote field unless pinned
    macro_rules! merge_field {
        ($path:expr, $local:expr, $remote:expr) => {
            if !pinned.contains($path) {
                $local = $remote;
            }
        };
    }

    merge_field!("TimeSlice.DurationMinutes",
        effective.time_slice.duration_minutes,
        remote.time_slice.duration_minutes);
    merge_field!("TimeSlice.ScreenshotsPerSlice",
        effective.time_slice.screenshots_per_slice,
        remote.time_slice.screenshots_per_slice);
    merge_field!("Collectors.BrowserTracking",
        effective.collectors.browser_tracking,
        remote.collectors.browser_tracking);
    // ... all other fields

    effective
}
```

### Hot-Reload Behavior

When remote settings change, the daemon applies them without restart:

| Setting Category | Hot-Reload? | Mechanism |
|-----------------|-------------|-----------|
| `TimeSlice.*` | ✅ Yes | Update scoring parameters in memory |
| `Collectors.*` | ✅ Yes | Start/stop individual collectors via event bus |
| `Screenshot.*` | ✅ Yes | Update capture config; no collector restart needed |
| `Privacy.*` | ✅ Yes | Update filter lists in memory |
| `Idle.*` | ✅ Yes | Update threshold; state machine resets |
| `Sync.*` | ✅ Yes | Restart sync timer with new interval |
| `Schedule.*` | ✅ Yes | Update tracking window; pause/resume if outside window |

---

## Offline Fallback

When the remote API is unreachable:

1. **On startup:** Load cached settings from `~/.timelog/settings-cache.json` if available
2. **During runtime:** Continue using last-known-good settings
3. **If no cache exists:** Fall back to local `config.toml` defaults
4. **When connectivity returns:** Fetch latest settings and update cache

```rust
pub async fn load_settings_with_fallback(config: &RemoteSettingsConfig) -> EffectiveSettings {
    // 1. Try remote fetch
    if let Ok(remote) = fetch_remote_settings(config).await {
        cache_to_disk(&remote, &config.cache_file).await;
        return merge_settings(&local, &remote, &pinned);
    }

    // 2. Try cached settings
    if let Ok(cached) = load_cached_settings(&config.cache_file).await {
        tracing::warn!("Using cached settings from {}", cached.fetched_at);
        return merge_settings(&local, &cached.settings, &pinned);
    }

    // 3. Fall back to local-only
    tracing::warn!("No remote settings available — using local config.toml only");
    EffectiveSettings::from(&local)
}
```

---

## Validation

All remote settings are validated before application:

```rust
pub fn validate_settings(settings: &RemoteSettings) -> Result<(), SettingsError> {
    let ts = &settings.time_slice;

    validate_range("TimeSlice.DurationMinutes", ts.duration_minutes, 1, 30)?;
    validate_range("TimeSlice.ScreenshotsPerSlice", ts.screenshots_per_slice, 0, 20)?;
    validate_range("TimeSlice.ClickThreshold100Percent", ts.click_threshold_100, 1, 10000)?;
    validate_range("TimeSlice.MinActiveSecondsPerSlice", ts.min_active_seconds,
        0, ts.duration_minutes * 60)?;

    // ClickThreshold50 must be < ClickThreshold100
    if ts.click_threshold_50 >= ts.click_threshold_100 {
        return Err(SettingsError::InvalidRange(
            "ClickThreshold50Percent must be less than ClickThreshold100Percent".into()
        ));
    }

    // Screenshot interval must not exceed time slice duration
    let ss = &settings.screenshot;
    validate_range("Screenshot.IntervalSeconds", ss.interval_seconds, 10, 3600)?;
    validate_range("Screenshot.Quality", ss.quality, 1, 100)?;

    // Schedule validation
    let sched = &settings.schedule;
    if let (Some(start), Some(end)) = (&sched.active_start_time, &sched.active_end_time) {
        let s = NaiveTime::parse_from_str(start, "%H:%M")?;
        let e = NaiveTime::parse_from_str(end, "%H:%M")?;
        if s >= e {
            return Err(SettingsError::InvalidRange(
                "ActiveStartTime must be before ActiveEndTime".into()
            ));
        }
    }

    Ok(())
}
```

---

## API Endpoints (Local)

Settings can also be viewed and modified via the local HTTP API:

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/settings` | Get effective (merged) settings |
| `GET` | `/api/v1/settings/sources` | Show local, remote, and pinned sources per field |
| `PATCH` | `/api/v1/settings/local` | Update local config.toml fields |
| `POST` | `/api/v1/settings/pin` | Pin a field to prevent remote override |
| `DELETE` | `/api/v1/settings/pin/{path}` | Unpin a field |
| `POST` | `/api/v1/settings/refresh` | Force-fetch remote settings now |

### Example: Settings Sources

```
GET /api/v1/settings/sources
```

```json
{
  "TimeSlice.DurationMinutes": {
    "EffectiveValue": 5,
    "Source": "Remote",
    "LocalValue": 10,
    "RemoteValue": 5,
    "IsPinned": false
  },
  "Idle.IdleThresholdSeconds": {
    "EffectiveValue": 180,
    "Source": "LocalPinned",
    "LocalValue": 180,
    "RemoteValue": 300,
    "IsPinned": true
  }
}
```

---

## Error Codes

| Code | Name | Description |
|------|------|-------------|
| 15460 | `SettingsFetchFailed` | HTTP request to settings endpoint failed |
| 15461 | `SettingsValidationError` | Remote settings contain invalid values |
| 15462 | `SettingsMergeConflict` | Conflict between remote and pinned local setting |
| 15463 | `SettingsCacheCorrupt` | Cached settings file is unreadable or malformed |
| 15464 | `SettingsHotReloadFailed` | Failed to apply new settings to a running collector |

---

## Cross-References

| Reference | Location |
|-----------|----------|
| Architecture | `./01-architecture.md` |
| Screenshot Capture | `./04-screenshot-capture.md` |
| API Interface | `./06-api-interface.md` |
| Error Codes | `./07-error-codes.md` |
| Remote Sync | `./09-remote-sync.md` |
| Time Slice Model | `./11-time-slice-productivity.md` |
