# Time Log CLI: Browser Tracking

**Version:** 1.0.0  
**Updated:** 2026-03-27

---

## Overview

The Browser Collector detects the active browser tab's URL, title, and tracks dwell time across all major browsers on all supported platforms.

---

## Supported Browsers

| Browser | Windows | Linux | macOS | Detection Method |
|---------|---------|-------|-------|-----------------|
| Chrome | ✅ | ✅ | ✅ | Accessibility API + window title parsing |
| Firefox | ✅ | ✅ | ✅ | Accessibility API + window title parsing |
| Edge | ✅ | ✅ | ✅ | Chromium-based (same as Chrome) |
| Brave | ✅ | ✅ | ✅ | Chromium-based (same as Chrome) |
| Safari | — | — | ✅ | AppleScript / JXA |
| Arc | — | — | ✅ | Chromium-based + AppleScript |
| Opera | ✅ | ✅ | ✅ | Chromium-based (same as Chrome) |

---

## Detection Strategies

### Strategy 1: Window Title Parsing (Primary)

Most browsers include the page title and sometimes the URL in the window title bar:

```
Pattern: "{PageTitle} - {BrowserName}"
Example: "GitHub - Where software is built - Google Chrome"
Example: "Stack Overflow - Mozilla Firefox"
```

**Extraction:**

```rust
pub fn parse_browser_window_title(title: &str, browser: BrowserType) -> BrowserTabInfo {
    let separator = match browser {
        BrowserType::Chrome | BrowserType::Edge | BrowserType::Brave | BrowserType::Opera => " - Google Chrome",
        BrowserType::Firefox => " — Mozilla Firefox",
        BrowserType::Safari => "", // Safari doesn't append browser name
    };
    // Strip browser suffix to get page title
    let page_title = title.strip_suffix(separator).unwrap_or(title);
    // ...
}
```

### Strategy 2: Native Browser Extension (Optional, Enhanced)

An optional companion browser extension provides full URL access:

```json
{
  "manifest_version": 3,
  "name": "Time Log Connector",
  "permissions": ["tabs", "activeTab"],
  "background": {
    "service_worker": "background.js"
  }
}
```

The extension communicates with the CLI daemon via **Native Messaging**:

```
Browser Extension ←→ Native Messaging Host ←→ Time Log Daemon (localhost)
```

**Data sent by extension:**

```json
{
  "Type": "TabChange",
  "Url": "https://github.com/user/repo",
  "Title": "user/repo: Repository description",
  "FaviconUrl": "https://github.githubassets.com/favicons/favicon.svg",
  "TabId": 42,
  "WindowId": 1,
  "Timestamp": "2026-03-27T09:45:32Z"
}
```

### Strategy 3: Accessibility API (macOS Enhanced)

macOS Accessibility API can read the address bar content directly:

```rust
#[cfg(target_os = "macos")]
fn get_browser_url_via_accessibility(pid: i32) -> Option<String> {
    // AXUIElementCreateApplication(pid)
    // Navigate: AXWindow → AXToolbar → AXTextField (address bar)
    // Read AXValue attribute for URL
}
```

---

## Dwell Time Tracking

### Algorithm

```rust
pub struct DwellTracker {
    current_tab: Option<TabSession>,
    min_dwell_seconds: f64, // Default: 3.0 (ignore < 3s visits)
}

pub struct TabSession {
    pub url: Option<String>,
    pub title: String,
    pub browser: BrowserType,
    pub started_at: DateTime<Utc>,
    pub last_seen_at: DateTime<Utc>,
}

impl DwellTracker {
    pub fn on_tab_change(&mut self, new_tab: BrowserTabInfo) -> Option<CompletedTabSession> {
        let completed = self.current_tab.take().and_then(|session| {
            let dwell = (Utc::now() - session.started_at).num_milliseconds() as f64 / 1000.0;
            if dwell >= self.min_dwell_seconds {
                Some(CompletedTabSession {
                    url: session.url,
                    title: session.title,
                    browser: session.browser,
                    started_at: session.started_at,
                    ended_at: Utc::now(),
                    dwell_seconds: dwell,
                })
            } else {
                None // Too short, discard
            }
        });

        self.current_tab = Some(TabSession {
            url: new_tab.url,
            title: new_tab.title,
            browser: new_tab.browser,
            started_at: Utc::now(),
            last_seen_at: Utc::now(),
        });

        completed
    }
}
```

### Polling Interval

- **Default:** Every 1 second
- **Configurable:** 0.5–10 seconds
- **Optimization:** If active window is not a browser, skip URL detection (just track app focus)

---

## URL Classification

URLs are classified into categories for reporting:

| Category | Pattern Examples |
|----------|----------------|
| `Work` | `github.com`, `gitlab.com`, `jira.atlassian.com`, `slack.com` |
| `Communication` | `mail.google.com`, `outlook.office.com`, `teams.microsoft.com` |
| `Social` | `twitter.com`, `facebook.com`, `reddit.com`, `linkedin.com` |
| `Reference` | `stackoverflow.com`, `docs.*`, `*.readthedocs.io` |
| `Entertainment` | `youtube.com`, `netflix.com`, `twitch.tv` |
| `Shopping` | `amazon.*`, `ebay.*` |
| `Uncategorized` | Everything else |

**User-configurable** via `config.toml`:

```toml
[BrowserTracking]
PollIntervalMs = 1000
MinDwellSeconds = 3.0
TrackUrls = true  # Requires browser extension or accessibility API

[BrowserTracking.Categories]
Work = ["github.com", "gitlab.com", "*.atlassian.com", "figma.com"]
Communication = ["slack.com", "discord.com", "mail.google.com"]
Blocked = ["*.gambling.com"]  # Never track these
```

---

## Privacy & Filtering

### URL Exclusion

```rust
pub struct PrivacyFilter {
    exclude_patterns: Vec<GlobPattern>,
    exclude_domains: Vec<String>,
    incognito_detection: bool,
}

impl PrivacyFilter {
    pub fn should_track(&self, url: &str, is_incognito: bool) -> bool {
        if self.incognito_detection && is_incognito {
            return false;
        }
        !self.exclude_patterns.iter().any(|p| p.matches(url))
            && !self.exclude_domains.iter().any(|d| url.contains(d))
    }
}
```

### Default Exclusions

- All incognito/private browsing windows
- URLs matching `*bank*`, `*healthcare*`, `*.gov/*` (configurable)
- Password manager extensions
- Authentication pages (`*/login`, `*/signin`, `*/oauth`)

---

## Data Model

```rust
#[derive(Debug, Serialize)]
#[serde(rename_all = "PascalCase")]
pub struct BrowserActivity {
    pub id: Uuid,
    pub session_id: Uuid,
    pub url: Option<String>,        // None if extension not installed
    pub domain: Option<String>,     // Extracted from URL
    pub title: String,
    pub browser: BrowserType,
    pub category: UrlCategory,
    pub started_at: DateTime<Utc>,
    pub ended_at: DateTime<Utc>,
    pub dwell_seconds: f64,
    pub tab_switches_during: u32,   // Times user left and returned
}

#[derive(Debug, Serialize)]
pub enum BrowserType {
    Chrome,
    Firefox,
    Edge,
    Safari,
    Brave,
    Arc,
    Opera,
    Unknown,
}
```

---

## Cross-References

| Reference | Location |
|-----------|----------|
| Architecture | `./01-architecture.md` |
| OS Integration | `./02-os-integration.md` |
| Database Schema | `./05-database-schema.md` |
| Screenshot on Tab Change | `./04-screenshot-capture.md` |
