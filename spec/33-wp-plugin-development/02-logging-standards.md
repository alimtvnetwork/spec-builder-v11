# WordPress Plugin Logging Standards


**Version:** 1.0.0  
**Last Updated:** 2026-03-20  

## Overview

Proper logging is critical for debugging WordPress plugins, especially when errors occur during plugin load or in production environments where you can't attach a debugger.

## Log File Locations

All logs MUST be stored within the WordPress uploads directory:

```
wp-content/uploads/{plugin-slug}/
├── logs/
│   ├── log.txt        # All operational logs
│   └── error.txt      # Errors and exceptions only
├── data/
│   └── {plugin-slug}.db   # SQLite database (if used)
└── .htaccess          # Deny direct access
```

### Why wp-content/uploads?

1. **Writable by WordPress** — Always has write permissions
2. **Outside plugin directory** — Survives plugin updates
3. **Configurable** — Respects custom upload directory settings
4. **Excludable from Git** — Won't pollute version control

## Log Format Specification

### Standard Format

```
[{TIMESTAMP}] {MESSAGE} ({FILE}:{LINE})
```

### Components

| Component | Format | Example |
|-----------|--------|---------|
| Timestamp | ISO8601 UTC with milliseconds | `2026-02-04T11:32:15.847Z` |
| Message | Descriptive text | `Database migration v1 complete` |
| File | Basename only | `Database.php` |
| Line | Integer | `142` |

### Example Log Entries

```
[2026-02-04T11:32:15.123Z] Plugin initialization starting (Plugin.php:45)
[2026-02-04T11:32:15.156Z] File logger initialized (FileLogger.php:38)
[2026-02-04T11:32:15.189Z] Creating data directory: /var/www/html/wp-content/uploads/riseup-asia-uploader (Database.php:67)
[2026-02-04T11:32:15.234Z] Database connection established (Database.php:89)
[2026-02-04T11:32:15.267Z] Running migration v1 (Database.php:142)
[2026-02-04T11:32:15.345Z] Created table: riseup_transactions (Database.php:156)
[2026-02-04T11:32:15.378Z] Migration v1 complete (Database.php:167)
[2026-02-04T11:32:15.412Z] Plugin initialization complete (Plugin.php:78)
```

## File Logger Implementation

The file logger is the foundation — it must work without any WordPress or database dependencies:

```php
<?php

if (!defined('ABSPATH')) {
    exit;
}

namespace RiseupAsia\Logging;

use RiseupAsia\Helpers\PathHelper;

class FileLogger {
    private ?string $logPath = null;
    private ?string $errorPath = null;
    private bool $isInitialized = false;

    private const TIMESTAMP_FORMAT = 'Y-m-d\TH:i:s';

    public function __construct() {
        // Empty — all initialization is lazy
    }

    private function ensurePaths(): void {
        if ($this->isInitialized) {
            return;
        }

        $logsDir = PathHelper::logsDir();
        PathHelper::makeDirectory($logsDir, secure: true);

        $this->logPath = $logsDir . '/log.txt';
        $this->errorPath = $logsDir . '/error.txt';
        $this->isInitialized = true;
    }

    private function getTimestamp(): string {
        $now = microtime(true);
        $seconds = (int) floor($now);
        $milliseconds = (int) round(($now - $seconds) * 1000);

        return gmdate(self::TIMESTAMP_FORMAT, $seconds) . sprintf('.%03dZ', $milliseconds);
    }

    private function formatEntry(
        string $message,
        string $file = '',
        int $line = 0,
    ): string {
        $timestamp = $this->getTimestamp();
        $context = '';

        if ($file !== '') {
            $hasLineNumber = $line > 0;
            $context = ' (' . basename($file);
            $context .= $hasLineNumber ? ':' . $line : '';
            $context .= ')';
        }

        return "[{$timestamp}] {$message}{$context}\n";
    }

    public function log(
        string $message,
        string $file = '',
        int $line = 0,
    ): bool {
        $this->ensurePaths();

        $entry = $this->formatEntry($message, $file, $line);
        @file_put_contents($this->logPath, $entry, FILE_APPEND | LOCK_EX);

        return true;
    }

    public function error(
        Throwable $e,
        string $file = '',
        int $line = 0,
    ): bool {
        $this->ensurePaths();

        $fullMessage = '[ERROR] ' . $e->getMessage();
        $fullMessage .= "\nStack trace:\n" . $e->getTraceAsString();

        $entry = $this->formatEntry($fullMessage, $file, $line);

        @file_put_contents($this->logPath, $entry, FILE_APPEND | LOCK_EX);
        @file_put_contents($this->errorPath, $entry, FILE_APPEND | LOCK_EX);

        return true;
    }

    public function getLogPath(): string {
        $this->ensurePaths();

        return $this->logPath;
    }

    public function getErrorPath(): string {
        $this->ensurePaths();

        return $this->errorPath;
    }
}
```

## What to Log

### Always Log

1. **Plugin lifecycle events** — Initialization start/complete, hook registrations
2. **Database operations** — Migration start/complete, table creation, schema version changes
3. **REST API events** — Route registration, request received, request completed
4. **File operations** — Directory creation, file writes, permission changes
5. **External API calls** — Request URL/method, response status, error details

### Log Entry Examples

```php
// Plugin lifecycle
$this->fileLogger->log('Plugin initialization starting', __FILE__, __LINE__);
$this->fileLogger->log('Registering REST routes', __FILE__, __LINE__);

// Database operations
$this->fileLogger->log(
    sprintf('Running migration v%d', $version),
    __FILE__,
    __LINE__,
);

// Errors — MUST pass the exception as first param, stack trace preserved automatically
$this->fileLogger->error($e, __FILE__, __LINE__);
```

## Log Levels

| Level | Usage | Written To |
|-------|-------|------------|
| LOG | Normal operations | log.txt |
| ERROR | Exceptions, failures | log.txt + error.txt |

## Log Rotation

For production plugins, implement basic log rotation:

```php
private function maybeRotateLogs(): void {
    $maxSize = 5 * 1024 * 1024; // 5MB

    $logPath = $this->getLogPath();
    $isOversized = file_exists($logPath) && filesize($logPath) > $maxSize;

    if ($isOversized) {
        $backup = $logPath . '.' . date('Y-m-d-His') . '.bak';
        @rename($logPath, $backup);

        $this->cleanupOldLogs(dirname($logPath), 5);
    }
}

private function cleanupOldLogs(string $dir, int $keepCount): void {
    $files = glob($dir . '/log.txt.*.bak');

    if (count($files) > $keepCount) {
        usort($files, fn(string $a, string $b): int => filemtime($a) - filemtime($b));

        $toDelete = array_slice($files, 0, count($files) - $keepCount);

        foreach ($toDelete as $file) {
            @unlink($file);
        }
    }
}
```

## Integration with WordPress Debug Log

Optionally also write to WordPress debug log:

```php
public function log(
    string $message,
    string $file = '',
    int $line = 0,
): bool {
    $this->ensurePaths();

    $entry = $this->formatEntry($message, $file, $line);
    @file_put_contents($this->logPath, $entry, FILE_APPEND | LOCK_EX);

    $isWpDebugEnabled = defined('WP_DEBUG') && WP_DEBUG && defined('WP_DEBUG_LOG') && WP_DEBUG_LOG;

    if ($isWpDebugEnabled) {
        error_log('[' . PluginConfigType::Slug->value . '] ' . $message);
    }

    return true;
}
```

## Early-Boot Logging — `InitHelpers::errorLogWithPrefix()` and `ErrorLog()`

Before the `FileLogger` is available, two helper functions handle logging:

### Non-Exception Messages: `InitHelpers::errorLogWithPrefix()`

For plain string messages (no exception), use `InitHelpers::errorLogWithPrefix()`. This method prepends `PluginConfigType::LogPrefix` to ensure consistent log formatting.

```php
use RiseupAsia\Helpers\InitHelpers;

// ❌ FORBIDDEN — raw error_log with manual prefix
error_log('[RiseupAsia] PDO extension missing');

// ✅ REQUIRED
InitHelpers::errorLogWithPrefix('PDO extension missing');
```

### Exception Messages: `ErrorLog()`

When a `Throwable` is caught and `FileLogger` is not yet available, use the centralized `ErrorLog()` function. It wraps PHP's native `error_log()` with automatic message + stack trace extraction.

#### Signature

```php
function ErrorLog(Throwable $e, string $context = ''): void {
    error_log($context . ' ' . $e->getMessage() . "\n" . $e->getTraceAsString());
}
```

#### Usage

```php
// ❌ FORBIDDEN — manual concatenation with error_log
error_log('RestoreHelperTrait::logRestoreAudit() failed: ' . $e->getMessage() . "\n" . $e->getTraceAsString());

// ✅ REQUIRED — centralized ErrorLog with Throwable first
ErrorLog($e, 'RestoreHelperTrait::logRestoreAudit() failed:');
```

#### Why

1. **Throwable-first** — impossible to forget the stack trace
2. **Consistent formatting** — message + newline + trace, always
3. **Greppable** — `ErrorLog(` is easy to audit; raw `error_log(` with concatenation is not
4. **Single point of change** — formatting changes propagate everywhere

### Autoloader Exception

`Autoloader.php` is the only file permitted to use raw `error_log()`, because it executes before both `InitHelpers` and `ErrorLog()` are available. Even there, it should include `$e->getTraceAsString()` when possible.

## Debugging Tips

### 1. Enable Verbose Logging During Development

```php
public function debug(
    string $message,
    string $file = '',
    int $line = 0,
): void {
    $isDebugMode = defined('RISEUP_DEBUG') && RISEUP_DEBUG;

    if ($isDebugMode) {
        $this->log('[DEBUG] ' . $message, $file, $line);
    }
}
```

### 2. Log Stack Traces for Errors

```php
use Throwable;

public function error(
    Throwable $e,
    string $file = '',
    int $line = 0,
): bool {
    $fullMessage = '[ERROR] ' . $e->getMessage();
    $fullMessage .= "\nStack trace:\n" . $e->getTraceAsString();

    $this->ensurePaths();
    $entry = $this->formatEntry($fullMessage, $file, $line);

    @file_put_contents($this->logPath, $entry, FILE_APPEND | LOCK_EX);
    @file_put_contents($this->errorPath, $entry, FILE_APPEND | LOCK_EX);

    return true;
}
```

### 3. Log Request Context

```php
public function logRequest(): void {
    $method = $_SERVER['REQUEST_METHOD'] ?? 'UNKNOWN';
    $uri = $_SERVER['REQUEST_URI'] ?? 'UNKNOWN';
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'UNKNOWN';

    $this->log(
        sprintf('Request: %s %s from %s', $method, $uri, $ip),
        __FILE__,
        __LINE__,
    );
}
```
