# 06 – File Watcher Service

> **Location:** `spec/30-wp-plugin/05-wp-plugin-publish/01-backend/06-file-watcher.md`  
> **Updated:** 2026-03-09
**Version:** 1.0.0  

---

## Overview

The File Watcher Service monitors plugin directories for changes and triggers sync operations. It uses efficient filesystem polling with change detection to minimize resource usage.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    File Watcher Service                      │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐    ┌──────────────┐    ┌───────────────┐  │
│  │   Scanner   │───▶│ Change Queue │───▶│ Sync Trigger  │  │
│  └─────────────┘    └──────────────┘    └───────────────┘  │
│         │                                       │           │
│         ▼                                       ▼           │
│  ┌─────────────┐                        ┌───────────────┐  │
│  │ Hash Cache  │                        │ WebSocket Hub │  │
│  └─────────────┘                        └───────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## Class Definition

```php
<?php
namespace PluginsOnboard\Services;

class File_Watcher {
    
    /** @var int Polling interval in seconds */
    private int $poll_interval = 5;
    
    /** @var array<string, string> File hash cache [path => hash] */
    private array $hash_cache = [];
    
    /** @var array<string> Directories being watched */
    private array $watch_dirs = [];
    
    /** @var array<string> File patterns to include */
    private array $include_patterns = ['*.php', '*.js', '*.css', '*.json'];
    
    /** @var array<string> Directories to exclude */
    private array $exclude_dirs = ['node_modules', 'vendor', '.git', '.svn'];
    
    /**
     * Start watching a plugin directory
     */
    public function watch(string $plugin_slug): void;
    
    /**
     * Stop watching a plugin directory
     */
    public function unwatch(string $plugin_slug): void;
    
    /**
     * Perform a single scan cycle
     */
    public function scan(): array;
    
    /**
     * Get changed files since last scan
     */
    public function get_changes(string $plugin_slug): array;
    
    /**
     * Calculate file hash for change detection
     */
    private function hash_file(string $path): string;
    
    /**
     * Check if file matches include patterns
     */
    private function matches_pattern(string $filename): bool;
    
    /**
     * Check if path is in excluded directory
     */
    private function is_excluded(string $path): bool;
}
```

---

## Change Detection Algorithm

### File Hash Calculation

```php
private function hash_file(string $path): string {
    if (!file_exists($path)) {
        return '';
    }
    
    // Use content hash + mtime for efficiency
    $stat = stat($path);
    $quick_hash = md5($stat['mtime'] . $stat['size']);
    
    // Full content hash only if quick hash differs
    if ($this->requires_full_hash($path, $quick_hash)) {
        return md5_file($path);
    }
    
    return $quick_hash;
}
```

### Change Types

| Type | Detection | Trigger |
|------|-----------|---------|
| `CREATED` | New path in scan | File not in cache |
| `MODIFIED` | Hash mismatch | Hash differs from cache |
| `DELETED` | Path missing | Cached path not found |
| `RENAMED` | Content match | Same hash, different path |

---

## Scan Results Structure

```php
[
    'PluginSlug' => 'my-plugin',
    'ScanTime' => 1706745600,
    'DurationMs' => 45,
    'Changes' => [
        [
            'Type' => 'MODIFIED',
            'Path' => 'includes/class-core.php',
            'OldHash' => 'abc123...',
            'NewHash' => 'def456...',
            'Size' => 4520,
            'Mtime' => 1706745590
        ],
        [
            'Type' => 'CREATED',
            'Path' => 'assets/js/new-feature.js',
            'OldHash' => null,
            'NewHash' => 'ghi789...',
            'Size' => 1280,
            'Mtime' => 1706745595
        ]
    ],
    'Stats' => [
        'FilesScanned' => 156,
        'FilesChanged' => 2,
        'TotalSize' => 524288
    ]
]
```

---

## Configuration

### Default Settings

```php
const FILE_WATCHER_DEFAULTS = [
    'PollInterval' => 5,              // seconds
    'MaxFileSize' => 10485760,        // 10MB
    'HashAlgorithm' => 'md5',
    'BatchSize' => 100,               // files per batch
    'DebounceMs' => 500,              // change debounce
];
```

### Include/Exclude Patterns

```php
// File patterns to watch
'IncludePatterns' => [
    '*.php',
    '*.js',
    '*.css',
    '*.json',
    '*.txt',
    '*.md',
    '*.pot',
    '*.po',
    '*.mo'
],

// Directories to exclude
'ExcludeDirs' => [
    'node_modules',
    'vendor',
    '.git',
    '.svn',
    '.idea',
    '.vscode',
    'tests',
    'build',
    'dist'
],

// Files to exclude
'ExcludeFiles' => [
    '.DS_Store',
    'Thumbs.db',
    '*.log',
    '*.tmp',
    '*.bak'
]
```

---

## Event Emission

When changes are detected, events are emitted via WebSocket:

```php
// Single file change
$this->emit('file:changed', [
    'PluginSlug' => $slug,
    'Change' => $changeData
]);

// Batch changes (after debounce)
$this->emit('files:batchChanged', [
    'PluginSlug' => $slug,
    'Changes' => $changesArray,
    'Summary' => [
        'Created' => 2,
        'Modified' => 5,
        'Deleted' => 1
    ]
]);
```

---

## Performance Optimizations

### Caching Strategy

1. **Hash Cache**: In-memory cache of file hashes
2. **Stat Cache**: Filesystem stat results (cleared each scan)
3. **Pattern Cache**: Compiled regex patterns for matching

### Batch Processing

```php
// Process files in batches to avoid memory issues
foreach (array_chunk($files, $this->batch_size) as $batch) {
    $this->process_batch($batch);
    
    // Yield to prevent blocking
    if (function_exists('gc_collect_cycles')) {
        gc_collect_cycles();
    }
}
```

### Incremental Scanning

For large plugins, use incremental scanning:

```php
// Only scan directories modified since last full scan
$modified_dirs = array_filter($dirs, function($dir) {
    return filemtime($dir) > $this->last_scan_time;
});
```

---

## Error Handling

| Error | Code | Recovery |
|-------|------|----------|
| Directory not found | `FW_DIR_NOT_FOUND` | Remove from watch list |
| Permission denied | `FW_PERMISSION_DENIED` | Log and skip |
| File read error | `FW_READ_ERROR` | Mark as unreadable |
| Hash computation failed | `FW_HASH_ERROR` | Use mtime fallback |

---

## Integration Points

- **Sync Service**: Receives change notifications
- **WebSocket Hub**: Broadcasts real-time updates
- **Backup Service**: Triggers pre-sync snapshots
- **Audit Logger**: Records file change events

---

*See also: [07-sync-service.md](07-sync-service.md), [12-websocket-events.md](12-websocket-events.md)*
