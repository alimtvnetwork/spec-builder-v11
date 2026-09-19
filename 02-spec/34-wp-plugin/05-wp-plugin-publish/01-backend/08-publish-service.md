# 08 – Publish Service

> **Location:** `02-spec/34-wp-plugin/05-wp-plugin-publish/01-backend/08-publish-service.md`  
> **Updated:** 2026-03-09
**Version:** 1.0.0  

---

## Overview

The Publish Service manages the complete plugin publishing workflow, from preparation through activation on remote WordPress sites. It coordinates with Sync, Backup, and Validation services.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Publish Service                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌────────────┐   ┌────────────┐   ┌────────────┐   ┌────────────┐ │
│  │  Validate  │──▶│   Build    │──▶│  Transfer  │──▶│  Activate  │ │
│  └────────────┘   └────────────┘   └────────────┘   └────────────┘ │
│        │                │                │                │         │
│        ▼                ▼                ▼                ▼         │
│  ┌────────────┐   ┌────────────┐   ┌────────────┐   ┌────────────┐ │
│  │   Linter   │   │  Packager  │   │   Upload   │   │  Verify    │ │
│  └────────────┘   └────────────┘   └────────────┘   └────────────┘ │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Class Definition

```php
<?php
namespace PluginsOnboard\Services;

class Publish_Service {
    
    /** @var Sync_Service */
    private Sync_Service $sync;
    
    /** @var Backup_Service */
    private Backup_Service $backup;
    
    /** @var Plugin_Validator */
    private Plugin_Validator $validator;
    
    /**
     * Publish a plugin to a specific site
     */
    public function publish(
        string $plugin_slug,
        int $site_id,
        array $options = []
    ): Publish_Result;
    
    /**
     * Publish to multiple sites
     */
    public function publish_to_all(
        string $plugin_slug,
        array $site_ids = [],
        array $options = []
    ): array;
    
    /**
     * Create a release package
     */
    public function package(
        string $plugin_slug,
        string $version
    ): Package_Result;
    
    /**
     * Validate plugin before publish
     */
    public function validate(string $plugin_slug): Validation_Result;
    
    /**
     * Rollback to previous version
     */
    public function rollback(
        string $plugin_slug,
        int $site_id,
        ?string $version = null
    ): Rollback_Result;
    
    /**
     * Get publish history
     */
    public function get_history(
        string $plugin_slug,
        ?int $site_id = null
    ): array;
}
```

---

## Publishing Pipeline

### Stage 1: Validation

```php
$validation = $this->validate($plugin_slug);

// Checks performed:
// - Plugin header validity
// - PHP syntax check
// - WordPress coding standards (optional)
// - Security scan (optional)
// - Version increment check
```

### Stage 2: Build

```php
// Optional build steps
$buildSteps = [
    'CompileAssets' => true,       // Sass, TypeScript, etc.
    'MinifyJs' => true,
    'MinifyCss' => true,
    'GeneratePot' => true,         // Translation template
    'UpdateReadme' => true
];
```

### Stage 3: Package

```php
$package = $this->package($pluginSlug, $version);

// Creates ZIP with:
// - All plugin files
// - Manifest file
// - Checksums file
// - Version metadata
```

### Stage 4: Transfer

```php
// Upload package to remote site
$transfer = $this->transfer($package, $siteId);

// Options:
// - Chunked upload for large files
// - Resume support
// - Integrity verification
```

### Stage 5: Activate

```php
// Remote operations:
// 1. Extract package
// 2. Run pre-activation hooks
// 3. Activate plugin
// 4. Run post-activation hooks
// 5. Verify activation
```

---

## Publish Options

```php
[
    // Pre-publish
    'Validate' => true,
    'BackupFirst' => true,
    'IsDryRun' => false,
    
    // Build
    'BuildAssets' => true,
    'Minify' => true,
    'SourceMaps' => false,
    
    // Transfer
    'ForceFullSync' => false,
    'VerifyChecksums' => true,
    
    // Activation
    'ActivateAfterPublish' => true,
    'ClearCache' => true,
    'RunMigrations' => true,
    
    // Rollback
    'RollbackOnFailure' => true,
    'KeepBackupDays' => 7
]
```

---

## Publish State Machine

```
┌─────────┐
│ PENDING │
└────┬────┘
     │ start
     ▼
┌──────────────┐
│  VALIDATING  │──────────▶ FAILED
└──────┬───────┘
       │ valid
       ▼
┌──────────────┐
│   BUILDING   │──────────▶ FAILED
└──────┬───────┘
       │ built
       ▼
┌──────────────┐
│  PACKAGING   │──────────▶ FAILED
└──────┬───────┘
       │ packaged
       ▼
┌──────────────┐
│ TRANSFERRING │──────────▶ FAILED
└──────┬───────┘
       │ transferred
       ▼
┌──────────────┐
│  ACTIVATING  │──────────▶ FAILED ──▶ ROLLING_BACK
└──────┬───────┘
       │ activated
       ▼
┌──────────────┐
│  VERIFYING   │──────────▶ FAILED ──▶ ROLLING_BACK
└──────┬───────┘
       │ verified
       ▼
┌──────────────┐
│   COMPLETE   │
└──────────────┘
```

---

## Package Structure

```
my-plugin-1.2.0.zip
├── my-plugin/
│   ├── my-plugin.php
│   ├── includes/
│   ├── assets/
│   ├── languages/
│   └── readme.txt
├── manifest.json
├── checksums.json
└── metadata.json
```

### Manifest Format

```json
{
  "PluginSlug": "my-plugin",
  "Version": "1.2.0",
  "WpRequires": "5.8",
  "WpTested": "6.4",
  "PhpRequires": "7.4",
  "CreatedAt": "2024-01-31T12:00:00Z",
  "FilesCount": 45,
  "TotalSize": 524288,
  "Checksum": "sha256:abc123..."
}
```

---

## Publish Result Structure

```php
class PublishResult {
    public string $publishId;
    public string $status;          // 'Success' | 'Failed' | 'RolledBack'
    public string $pluginSlug;
    public string $version;
    public int $siteId;
    public array $stages;           // Status per stage
    public float $durationSeconds;
    public ?string $error;
    public ?string $rollbackId;
    public array $warnings;
}
```

### Stage Results

```php
'Stages' => [
    'Validate' => ['Status' => 'Success', 'Duration' => 1.2],
    'Build' => ['Status' => 'Success', 'Duration' => 5.4],
    'Package' => ['Status' => 'Success', 'Duration' => 2.1],
    'Transfer' => ['Status' => 'Success', 'Duration' => 8.7],
    'Activate' => ['Status' => 'Success', 'Duration' => 1.5],
    'Verify' => ['Status' => 'Success', 'Duration' => 0.8]
]
```

---

## Event Emissions

```php
// Publish lifecycle
'publish:started'        => ['publishId', 'pluginSlug', 'siteId', 'version']
'publish:stageStart'     => ['publishId', 'stage']
'publish:stageComplete'  => ['publishId', 'stage', 'result']
'publish:progress'       => ['publishId', 'stage', 'progress']
'publish:complete'       => ['publishId', 'result']
'publish:failed'         => ['publishId', 'stage', 'error']
'publish:rollback'       => ['publishId', 'reason']
```

---

## Validation Rules

| Rule | Severity | Description |
|------|----------|-------------|
| Valid plugin header | Error | Must have Name, Version |
| PHP syntax | Error | All PHP files must parse |
| Version increment | Warning | Should be > current |
| Readme exists | Warning | readme.txt recommended |
| No debug code | Warning | No var_dump, error_log |
| Security headers | Warning | Prevent direct access |

---

## Error Handling

| Error | Code | Recovery |
|-------|------|----------|
| Validation failed | `PUB_VALIDATION_FAILED` | Fix issues, retry |
| Build failed | `PUB_BUILD_FAILED` | Check build config |
| Package failed | `PUB_PACKAGE_FAILED` | Check disk space |
| Transfer failed | `PUB_TRANSFER_FAILED` | Retry, check network |
| Activation failed | `PUB_ACTIVATION_FAILED` | Rollback, check logs |
| Remote error | `PUB_REMOTE_ERROR` | Check site status |

---

## Version History

```php
// Get publish history
$history = $publish->getHistory('my-plugin', $siteId);

// Returns:
[
    [
        'Version' => '1.2.0',
        'PublishedAt' => '2024-01-31T12:00:00Z',
        'Status' => 'Success',
        'CanRollback' => true
    ],
    [
        'Version' => '1.1.0',
        'PublishedAt' => '2024-01-15T10:00:00Z',
        'Status' => 'Success',
        'CanRollback' => true
    ]
]
```

---

*See also: [07-sync-service.md](07-sync-service.md), [09-backup-service.md](09-backup-service.md)*
