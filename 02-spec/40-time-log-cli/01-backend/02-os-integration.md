# Time Log CLI: OS Integration

**Version:** 1.0.0  
**Updated:** 2026-03-27

---

## Overview

Platform-specific OS hooks for capturing user activity events. Each platform uses native APIs accessed via Rust FFI or platform crates. Conditional compilation (`#[cfg(target_os)]`) ensures only the relevant platform code is included in each build.

---

## Platform Support Matrix

| Feature | Windows | Linux | macOS |
|---------|---------|-------|-------|
| Active window detection | ✅ Win32 `GetForegroundWindow` | ✅ X11 `_NET_ACTIVE_WINDOW` / Wayland `wlr-foreign-toplevel` | ✅ `NSWorkspace.activeApplication` |
| Window title extraction | ✅ `GetWindowTextW` | ✅ `_NET_WM_NAME` / `XFetchName` | ✅ `CGWindowListCopyWindowInfo` |
| Mouse click hooks | ✅ `SetWindowsHookExW` (WH_MOUSE_LL) | ✅ `XRecordCreateContext` / `libinput` | ✅ `CGEventTapCreate` |
| Keyboard idle detection | ✅ `GetLastInputInfo` | ✅ `XScreenSaverQueryInfo` / `logind` | ✅ `CGEventSourceSecondsSinceLastEventType` |
| Process name from PID | ✅ `QueryFullProcessImageNameW` | ✅ `/proc/{pid}/comm` | ✅ `proc_pidpath` |
| Screen capture | ✅ `BitBlt` / DXGI Desktop Duplication | ✅ `XGetImage` / PipeWire | ✅ `CGDisplayCreateImage` |
| Autostart registration | ✅ Registry `HKCU\...\Run` | ✅ `~/.config/autostart/*.desktop` / systemd user unit | ✅ `~/Library/LaunchAgents/*.plist` |

---

## App Focus Collector

Polls the active (foreground) window at a configurable interval (default: 1 second).

### Data Captured Per Focus Event

| Field | Type | Description |
|-------|------|-------------|
| `AppName` | `String` | Executable/process name (e.g., `firefox`, `code`) |
| `WindowTitle` | `String` | Active window title text |
| `ProcessId` | `u32` | OS process ID |
| `StartedAt` | `DateTime<Utc>` | When this window gained focus |
| `EndedAt` | `DateTime<Utc>` | When focus moved away (set on next event) |
| `DwellSeconds` | `f64` | Duration of focus (computed) |

### Windows Implementation

```rust
#[cfg(target_os = "windows")]
mod windows_focus {
    use windows::Win32::UI::WindowsAndMessaging::{
        GetForegroundWindow, GetWindowTextW, GetWindowThreadProcessId,
    };
    use windows::Win32::System::Threading::{
        OpenProcess, QueryFullProcessImageNameW, PROCESS_QUERY_LIMITED_INFORMATION,
    };

    pub fn get_active_window() -> Result<WindowInfo, OsError> {
        let handle = unsafe { GetForegroundWindow() };
        // ... extract title and process name
    }
}
```

### Linux Implementation

```rust
#[cfg(target_os = "linux")]
mod linux_focus {
    // X11 path (fallback)
    fn get_active_window_x11(display: *mut Display) -> Result<WindowInfo, OsError> {
        // Read _NET_ACTIVE_WINDOW property from root window
        // Read _NET_WM_NAME (UTF-8) or WM_NAME (Latin-1) from active window
        // Read _NET_WM_PID for process identification
    }

    // Wayland path (preferred on modern distros)
    fn get_active_window_wayland() -> Result<WindowInfo, OsError> {
        // Use wlr-foreign-toplevel-management-unstable-v1 protocol
        // Or fallback to DBus org.gnome.Shell.Introspect on GNOME
    }
}
```

### macOS Implementation

```rust
#[cfg(target_os = "macos")]
mod macos_focus {
    use core_foundation::*;
    use core_graphics::*;

    pub fn get_active_window() -> Result<WindowInfo, OsError> {
        // NSWorkspace.shared.frontmostApplication
        // CGWindowListCopyWindowInfo for window title
        // kCGWindowOwnerPID for process identification
    }
}
```

---

## Click Collector

Registers a low-level mouse hook to capture click events without intercepting them.

### Data Captured Per Click Event

| Field | Type | Description |
|-------|------|-------------|
| `X` | `i32` | Screen X coordinate |
| `Y` | `i32` | Screen Y coordinate |
| `Button` | `MouseButton` | Left, Right, Middle |
| `WindowTitle` | `String` | Window where click occurred |
| `AppName` | `String` | Application receiving the click |
| `Timestamp` | `DateTime<Utc>` | Click timestamp |

### Click Aggregation

To avoid excessive storage, clicks are **aggregated** per 10-second window:

```rust
pub struct ClickAggregate {
    pub window_start: DateTime<Utc>,
    pub window_end: DateTime<Utc>,
    pub app_name: String,
    pub window_title: String,
    pub click_count: u32,
    pub avg_x: f64,
    pub avg_y: f64,
    pub heatmap_cells: Vec<HeatmapCell>, // 10x10 grid
}
```

### Windows Hook

```rust
#[cfg(target_os = "windows")]
unsafe extern "system" fn mouse_hook_proc(
    code: i32,
    w_param: WPARAM,
    l_param: LPARAM,
) -> LRESULT {
    if code >= 0 && (w_param.0 as u32 == WM_LBUTTONDOWN
        || w_param.0 as u32 == WM_RBUTTONDOWN
        || w_param.0 as u32 == WM_MBUTTONDOWN)
    {
        let mouse_struct = &*(l_param.0 as *const MSLLHOOKSTRUCT);
        // Send click event to channel (non-blocking)
    }
    CallNextHookEx(HHOOK::default(), code, w_param, l_param)
}
```

### Linux / macOS

- **Linux:** `XRecordCreateContext` with `XRecordRegisterClients` for X11; `libinput` for Wayland
- **macOS:** `CGEventTapCreate` with `kCGEventLeftMouseDown | kCGEventRightMouseDown`

---

## Idle Detection

Determines when the user is away from the computer.

### Strategy

| OS | API | Mechanism |
|----|-----|-----------|
| Windows | `GetLastInputInfo` | Returns tick count of last input event |
| Linux (X11) | `XScreenSaverQueryInfo` | Returns idle milliseconds |
| Linux (Wayland) | `logind` DBus `IdleHint` | Session-level idle state |
| macOS | `CGEventSourceSecondsSinceLastEventType` | Seconds since last HID event |

### Idle State Machine

```
          idle_threshold reached
  Active ─────────────────────────► Idle
    ▲                                 │
    │         any input event         │
    └─────────────────────────────────┘
```

- **Idle threshold:** Configurable (default: 300 seconds / 5 minutes)
- **On idle:** Pause all collectors, close current activity session
- **On resume:** Start new activity session, resume collectors
- **Idle events** are stored in the database for reporting gaps

---

## Autostart / Service Registration

### Windows

```rust
fn register_autostart_windows() -> Result<(), OsError> {
    // Write to HKCU\SOFTWARE\Microsoft\Windows\CurrentVersion\Run
    // Key: "TimeLogCli"
    // Value: "C:\Program Files\timelog\timelog.exe --daemon"
}
```

### Linux (systemd user unit)

```ini
# ~/.config/systemd/user/timelog.service
[Unit]
Description=Time Log Activity Tracker
After=graphical-session.target

[Service]
ExecStart=/usr/local/bin/timelog --daemon
Restart=on-failure
RestartSec=5

[Install]
WantedBy=default.target
```

### macOS (LaunchAgent)

```xml
<!-- ~/Library/LaunchAgents/dev.timelog.plist -->
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>dev.timelog</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/timelog</string>
        <string>--daemon</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
</dict>
</plist>
```

---

## Permissions

| OS | Required Permission | Why |
|----|-------------------|-----|
| Windows | None (standard user) | Low-level hooks work without elevation |
| Linux (X11) | None | XRecord extension is available by default |
| Linux (Wayland) | `input` group or Flatpak portal | `libinput` requires group membership |
| macOS | **Accessibility** (System Preferences → Privacy) | `CGEventTap` requires accessibility permission |
| macOS | **Screen Recording** (System Preferences → Privacy) | `CGDisplayCreateImage` requires screen recording permission |

---

## Rust Crate Dependencies

| Crate | Purpose |
|-------|---------|
| `tokio` | Async runtime for event loop and channels |
| `rusqlite` | SQLite database access |
| `serde` / `serde_json` | Serialization with PascalCase rename |
| `chrono` | DateTime handling |
| `uuid` | Session and event IDs |
| `image` | Screenshot encoding |
| `toml` | Configuration parsing |
| `windows` (Windows) | Win32 API bindings |
| `x11rb` (Linux) | X11 protocol bindings |
| `core-foundation` (macOS) | macOS system framework bindings |
| `core-graphics` (macOS) | Screen capture and event taps |
| `tracing` | Structured logging |
| `clap` | CLI argument parsing |

---

## Cross-References

| Reference | Location |
|-----------|----------|
| Architecture | `./01-architecture.md` |
| Browser Tracking | `./03-browser-tracking.md` |
| Screenshot Capture | `./04-screenshot-capture.md` |
| Database Schema | `./05-database-schema.md` |
