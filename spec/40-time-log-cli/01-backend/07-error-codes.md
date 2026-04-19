# Time Log CLI: Error Codes

**Version:** 1.0.0  
**Updated:** 2026-03-27

---

## Overview

Error code range: **15000–15499** (allocated in the [Error Code Registry](../../03-error-code-registry/00-overview.md)).

---

## Error Code Allocation

| Range | Category |
|-------|----------|
| 15000–15049 | General / Daemon lifecycle |
| 15050–15099 | Configuration |
| 15100–15149 | Database / Storage |
| 15150–15199 | OS Integration |
| 15200–15249 | Browser Tracking |
| 15250–15299 | Screenshot Capture |
| 15300–15349 | Click Tracking |
| 15350–15399 | Idle Detection |
| 15400–15449 | HTTP API |
| 15450–15499 | Export / Reporting |

---

## Error Code Registry

### General / Daemon (15000–15049)

| Code | Name | Description | Severity |
|------|------|-------------|----------|
| 15000 | `DaemonAlreadyRunning` | Another instance of the daemon is already running | Error |
| 15001 | `DaemonNotRunning` | Daemon is not running (command requires active daemon) | Error |
| 15002 | `DaemonStartFailed` | Failed to start the daemon process | Critical |
| 15003 | `DaemonShutdownTimeout` | Graceful shutdown timed out after 5 seconds | Warning |
| 15004 | `SignalHandlerFailed` | Failed to register OS signal handler | Error |
| 15005 | `EventBusOverflow` | Event bus buffer is full, events being dropped | Warning |
| 15006 | `CollectorStartFailed` | A collector module failed to start | Error |
| 15007 | `CollectorStopFailed` | A collector module failed to stop gracefully | Warning |

### Configuration (15050–15099)

| Code | Name | Description | Severity |
|------|------|-------------|----------|
| 15050 | `ConfigFileNotFound` | Configuration file not found at expected path | Warning |
| 15051 | `ConfigParseError` | Failed to parse configuration TOML file | Error |
| 15052 | `ConfigInvalidValue` | Configuration value is out of valid range | Error |
| 15053 | `ConfigDirectoryCreateFailed` | Failed to create data directory | Critical |
| 15054 | `ConfigWriteFailed` | Failed to write updated configuration | Error |

### Database / Storage (15100–15149)

| Code | Name | Description | Severity |
|------|------|-------------|----------|
| 15100 | `DatabaseOpenFailed` | Failed to open SQLite database file | Critical |
| 15101 | `DatabaseMigrationFailed` | Schema migration failed | Critical |
| 15102 | `DatabaseWriteFailed` | Failed to write event batch to database | Error |
| 15103 | `DatabaseQueryFailed` | Query execution failed | Error |
| 15104 | `DatabaseCorrupted` | Integrity check detected corruption | Critical |
| 15105 | `StorageQuotaExceeded` | Screenshot storage exceeded configured limit | Warning |
| 15106 | `CleanupFailed` | Storage cleanup operation failed | Error |

### OS Integration (15150–15199)

| Code | Name | Description | Severity |
|------|------|-------------|----------|
| 15150 | `OsHookRegistrationFailed` | Failed to register OS-level event hook | Error |
| 15151 | `OsPermissionDenied` | Required OS permission not granted (e.g., macOS Accessibility) | Critical |
| 15152 | `OsApiUnavailable` | Required OS API not available on this platform | Error |
| 15153 | `OsWindowInfoFailed` | Failed to retrieve active window information | Warning |
| 15154 | `OsProcessInfoFailed` | Failed to get process name from PID | Warning |
| 15155 | `OsAutostartRegistrationFailed` | Failed to register autostart service | Error |

### Browser Tracking (15200–15249)

| Code | Name | Description | Severity |
|------|------|-------------|----------|
| 15200 | `BrowserDetectionFailed` | Could not determine browser type from process name | Warning |
| 15201 | `BrowserTitleParseFailed` | Failed to parse browser window title | Warning |
| 15202 | `BrowserUrlExtractionFailed` | Failed to extract URL via accessibility API | Warning |
| 15203 | `BrowserExtensionDisconnected` | Native messaging connection to browser extension lost | Warning |
| 15204 | `BrowserExtensionMessageInvalid` | Invalid message received from browser extension | Warning |

### Screenshot Capture (15250–15299)

| Code | Name | Description | Severity |
|------|------|-------------|----------|
| 15250 | `ScreenshotCaptureFailed` | Failed to capture screen image | Error |
| 15251 | `ScreenshotEncodeFailed` | Failed to encode screenshot to target format | Error |
| 15252 | `ScreenshotWriteFailed` | Failed to write screenshot file to disk | Error |
| 15253 | `ScreenshotDirectoryCreateFailed` | Failed to create date-based screenshot directory | Error |
| 15254 | `ScreenshotBlurFailed` | Privacy blur processing failed | Warning |

### Click Tracking (15300–15349)

| Code | Name | Description | Severity |
|------|------|-------------|----------|
| 15300 | `ClickHookFailed` | Failed to register mouse click hook | Error |
| 15301 | `ClickAggregationFailed` | Click aggregation buffer overflow | Warning |

### Idle Detection (15350–15399)

| Code | Name | Description | Severity |
|------|------|-------------|----------|
| 15350 | `IdleDetectionFailed` | Failed to query system idle time | Warning |
| 15351 | `IdleStateTransitionError` | Unexpected idle state transition | Warning |

### HTTP API (15400–15449)

| Code | Name | Description | Severity |
|------|------|-------------|----------|
| 15400 | `ApiServerStartFailed` | Failed to bind HTTP API server to port | Error |
| 15401 | `ApiUnauthorized` | Missing or invalid API token | Error |
| 15402 | `ApiInvalidParameter` | Invalid query parameter value | Error |
| 15403 | `ApiResourceNotFound` | Requested resource (session, screenshot) not found | Error |
| 15404 | `ApiRateLimitExceeded` | Too many API requests | Warning |

### Export / Reporting (15450–15499)

| Code | Name | Description | Severity |
|------|------|-------------|----------|
| 15450 | `ExportFormatUnsupported` | Requested export format is not supported | Error |
| 15451 | `ExportWriteFailed` | Failed to write export file | Error |
| 15452 | `ReportGenerationFailed` | Failed to generate summary report | Error |

---

## Cross-References

| Reference | Location |
|-----------|----------|
| Error Code Registry | `../../03-error-code-registry/00-overview.md` |
| Architecture | `./01-architecture.md` |
| API Interface | `./06-api-interface.md` |
