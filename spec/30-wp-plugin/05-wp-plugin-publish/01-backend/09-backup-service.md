# 09 – Backup Service

> **Location:** `spec/30-wp-plugin/05-wp-plugin-publish/01-backend/09-backup-service.md`  
> **Updated:** 2026-03-09
**Version:** 1.0.0  

---

## Overview

The Backup Service creates and manages point-in-time snapshots of plugins for rollback support. It handles local and remote backups, retention policies, and restoration operations.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Backup Service                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────┐    ┌────────────┐    ┌────────────┐            │
│  │  Snapshot  │───▶│   Store    │───▶│  Restore   │            │
│  └────────────┘    └────────────┘    └────────────┘            │
│        │                 │                 │                    │
│        ▼                 ▼                 ▼                    │
│  ┌────────────┐    ┌────────────┐    ┌────────────┐            │
│  │Compression │    │ Retention  │    │   Verify   │            │
│  └────────────┘    └────────────┘    └────────────┘            │
│                                                                  │
│  Storage Backends:                                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │  Local   │  │   S3     │  │   GCS    │  │  Remote  │        │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Class Definition

```php
<?php
namespace PluginsOnboard\Services;

class Backup_Service {
    
    /** @var Storage_Backend */
    private Storage_Backend $storage;
    
    /** @var Compression */
    private Compression $compression;
    
    /**
     * Create a backup of a plugin
     */
    public function create(
        string $plugin_slug,
        array $options = []
    ): Backup_Result;
    
    /**
     * Create a remote backup (from WordPress site)
     */
    public function create_remote(
        string $plugin_slug,
        int $site_id
    ): Backup_Result;
    
    /**
     * Restore a plugin from backup
     */
    public function restore(
        string $backup_id,
        array $options = []
    ): Restore_Result;
    
    /**
     * Restore to a remote site
     */
    public function restore_to_site(
        string $backup_id,
        int $site_id
    ): Restore_Result;
    
    /**
     * List available backups
     */
    public function list(
        ?string $plugin_slug = null,
        ?int $site_id = null
    ): array;
    
    /**
     * Delete a backup
     */
    public function delete(string $backup_id): bool;
    
    /**
     * Apply retention policy
     */
    public function prune(): Prune_Result;
    
    /**
     * Verify backup integrity
     */
    public function verify(string $backup_id): Verify_Result;
}
```

---

## Backup Types

| Type | Trigger | Contents |
|------|---------|----------|
| `AUTO_PRE_SYNC` | Before sync | Full plugin state |
| `AUTO_PRE_PUBLISH` | Before publish | Full plugin + version |
| `MANUAL` | User request | Full plugin state |
| `SCHEDULED` | Cron job | Full plugin state |
| `INCREMENTAL` | Change detection | Changed files only |

---

## Backup Structure

```
backups/
└── my-plugin/
    └── 2024-01-31_120000_v1.2.0/
        ├── backup.zip
        ├── manifest.json
        ├── checksums.json
        └── metadata.json
```

### Manifest Format

```json
{
  "BackupId": "bkp_abc123",
  "PluginSlug": "my-plugin",
  "Version": "1.2.0",
  "Type": "AUTO_PRE_PUBLISH",
  "Source": "local",
  "SiteId": null,
  "CreatedAt": "2024-01-31T12:00:00Z",
  "FilesCount": 45,
  "TotalSize": 524288,
  "CompressedSize": 128000,
  "Checksum": "sha256:abc123...",
  "RetentionUntil": "2024-02-07T12:00:00Z"
}
```

---

## Backup Options

```php
[
    // Content
    'IncludeVendor' => false,
    'IncludeNodeModules' => false,
    'IncludeBuild' => true,
    'ExcludePatterns' => ['*.log', '*.tmp'],
    
    // Compression
    'Compression' => 'gzip',         // gzip | zip | none
    'CompressionLevel' => 6,         // 1-9
    
    // Storage
    'Storage' => 'local',            // local | s3 | gcs | remote
    'IsEncrypted' => false,
    
    // Retention
    'RetentionDays' => 7,
    'Label' => 'Pre-publish backup',
    
    // Metadata
    'IncludeDbSnapshot' => false,
    'CaptureSiteState' => true
]
```

---

## Retention Policies

### Default Policy

```php
const RETENTION_DEFAULTS = [
    'MaxBackupsPerPlugin' => 10,
    'MaxAgeDays' => 30,
    'MinKeep' => 3,                   // Always keep at least 3
    'KeepVersions' => true,           // Keep one per version
];
```

### Policy Rules

| Rule | Description |
|------|-------------|
| Age-based | Delete backups older than `max_age_days` |
| Count-based | Keep only `max_backups_per_plugin` |
| Version-based | Keep at least one backup per version |
| Minimum | Always keep `min_keep` most recent |
| Manual | Manual backups exempt from auto-prune |

### Pruning Logic

```php
public function prune(): Prune_Result {
    $deleted = [];
    
    foreach ($this->get_all_plugins() as $slug) {
        $backups = $this->list($slug);
        
        // Sort by date descending
        usort($backups, fn($a, $b) => $b['created_at'] <=> $a['created_at']);
        
        // Apply rules
        foreach ($backups as $i => $backup) {
            if ($this->should_delete($backup, $i)) {
                $this->delete($backup['id']);
                $deleted[] = $backup['id'];
            }
        }
    }
    
    return new Prune_Result($deleted);
}
```

---

## Storage Backends

### Local Storage

```php
class Local_Storage implements Storage_Backend {
    private string $base_path;
    
    public function store(string $path, string $content): bool;
    public function retrieve(string $path): string;
    public function delete(string $path): bool;
    public function exists(string $path): bool;
    public function get_url(string $path): string;
}
```

### S3-Compatible Storage

```php
class S3_Storage implements Storage_Backend {
    private string $bucket;
    private string $region;
    private S3Client $client;
    
    // Same interface as Local_Storage
}
```

---

## Restore Process

### Restore Steps

1. **Verify Backup**: Check integrity and compatibility
2. **Create Safety Backup**: Backup current state
3. **Extract Files**: Decompress and validate
4. **Apply Files**: Copy to destination
5. **Verify Restore**: Check file integrity
6. **Cleanup**: Remove temporary files

### Restore Options

```php
[
    'BackupCurrent' => true,          // Create safety backup first
    'VerifyBefore' => true,           // Verify backup integrity
    'VerifyAfter' => true,            // Verify restored files
    'Activate' => true,               // Activate plugin after restore
    'ClearCache' => true,             // Clear WP caches
    'RunMigrations' => false          // Run DB migrations
]
```

---

## Result Structures

### Backup_Result

```php
class Backup_Result {
    public string $backup_id;
    public string $status;           // 'success' | 'failed'
    public string $path;
    public int $original_size;
    public int $compressed_size;
    public int $files_count;
    public float $duration_seconds;
    public ?string $error;
}
```

### Restore_Result

```php
class Restore_Result {
    public string $backup_id;
    public string $status;           // 'success' | 'failed'
    public ?string $safety_backup_id;
    public int $files_restored;
    public float $duration_seconds;
    public ?string $error;
    public array $warnings;
}
```

---

## Event Emissions

```php
// Backup events
'backup:started'    => ['BackupId', 'PluginSlug', 'Type']
'backup:progress'   => ['BackupId', 'Progress', 'CurrentFile']
'backup:complete'   => ['BackupId', 'Result']
'backup:failed'     => ['BackupId', 'Error']

// Restore events
'restore:started'   => ['BackupId', 'Target']
'restore:progress'  => ['BackupId', 'Progress']
'restore:complete'  => ['BackupId', 'Result']
'restore:failed'    => ['BackupId', 'Error']

// Maintenance events
'backup:pruned'     => ['DeletedIds', 'FreedBytes']
```

---

## Error Handling

| Error | Code | Recovery |
|-------|------|----------|
| Disk full | `BKP_DISK_FULL` | Free space, retry |
| Backup not found | `BKP_NOT_FOUND` | List available backups |
| Corrupted backup | `BKP_CORRUPTED` | Delete, create new |
| Version mismatch | `BKP_VERSION_MISMATCH` | Force restore or abort |
| Permission denied | `BKP_PERMISSION_DENIED` | Check file permissions |
| Storage error | `BKP_STORAGE_ERROR` | Check storage config |

---

## Scheduled Backups

```php
// WP-Cron integration
add_action('plugins_onboard_scheduled_backup', function() {
    $backupService = new BackupService();
    
    foreach (get_watched_plugins() as $slug) {
        $backupService->create($slug, [
            'Type' => 'SCHEDULED',
            'RetentionDays' => 7
        ]);
    }
    
    $backupService->prune();
});

// Schedule: daily at 3 AM
wp_schedule_event(
    strtotime('today 3:00'),
    'daily',
    'plugins_onboard_scheduled_backup'
);
```

---

*See also: [07-sync-service.md](07-sync-service.md), [08-publish-service.md](08-publish-service.md)*
