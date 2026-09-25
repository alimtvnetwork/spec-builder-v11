# Resilient REST Upload Controller — Chunked Transfer & Transient Locks

> **Path:** `02-spec/34-wp-plugin/19-resilient-rest-upload-controller.md`  
> **Status:** ACTIVE  
> **Target Module:** `includes/Upload/UploadController.php`  
> **Authority:** Single Source of Truth for WordPress Chunked Media & Asset Uploads  
> **Reference:** `D:\work\wp-onboarding\wp-plugins\riseup-asia-uploader`

---

## Architectural Purpose

This specification governs resilient, fault-tolerant file and media uploads inside WordPress plugins. It adopts production-tested patterns from `riseup-asia-uploader`, implementing chunked byte streaming, transient mutex locking to prevent concurrent chunk race conditions, sha256 checksum integrity verification, and automatic cleanup of abandoned chunks.

---

## Component Topology & File Locations

| Class / File | Destination Path | Purpose |
|---|---|---|
| `UploadController` | `includes/Upload/UploadController.php` | Registers WP REST API endpoints and routes upload actions |
| `ChunkAssembler` | `includes/Upload/ChunkAssembler.php` | Appends uploaded byte chunks to temporary target file |
| `UploadLockManager` | `includes/Upload/UploadLockManager.php` | Manages WordPress transient locks during active chunk ingestion |
| `ChecksumValidator` | `includes/Upload/ChecksumValidator.php` | Verifies chunk and final file SHA-256 integrity hashes |
| `UploadResult` | `includes/Upload/UploadResult.php` | Structured outcome object replacing bare array responses |

---

## PHP 8.2+ Architecture & Contracts

```php
<?php

declare(strict_types=1);

namespace RiseupAsia\Upload;

use WP_REST_Request;
use WP_REST_Response;
use WP_Error;

final class UploadController
{
    private const string ROUTE_NAMESPACE = 'riseup/v1';
    private const string ROUTE_RESOURCE  = '/upload-chunk';
    private const int LOCK_TTL_SECONDS   = 300;

    public function registerRoutes(): void
    {
        register_rest_route(self::ROUTE_NAMESPACE, self::ROUTE_RESOURCE, [
            'methods'             => 'POST',
            'callback'            => [$this, 'handleChunkUpload'],
            'permission_callback' => [$this, 'validatePermissions'],
        ]);
    }

    public function validatePermissions(WP_REST_Request $request): bool
    {
        return current_user_can('upload_files');
    }

    public function handleChunkUpload(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        $fileId      = sanitize_text_field((string)$request->get_param('fileId'));
        $chunkIndex  = (int)$request->get_param('chunkIndex');
        $totalChunks = (int)$request->get_param('totalChunks');
        $expectedSha = sanitize_text_field((string)$request->get_param('sha256'));

        $lockKey = 'rasia_lock_' . md5($fileId);
        if (get_transient($lockKey) !== false) {
            return new WP_Error('upload_locked', 'Concurrent chunk upload in progress', ['status' => 409]);
        }

        set_transient($lockKey, time(), self::LOCK_TTL_SECONDS);

        try {
            $isComplete = ChunkAssembler::appendChunk($fileId, $chunkIndex, $totalChunks, $request->get_file_params());
            delete_transient($lockKey);

            return new WP_REST_Response([
                'isSuccess'   => true,
                'isComplete'  => $isComplete,
                'chunkIndex'  => $chunkIndex,
                'totalChunks' => $totalChunks,
            ], 200);
        } catch (\Throwable $e) {
            delete_transient($lockKey);
            return new WP_Error('chunk_write_error', $e->getMessage(), ['status' => 500]);
        }
    }
}
```

---

## Safety, Integrity & Cleanup Semantics

1. **Transient Mutex Locks:**
   - Every file transfer generates a unique transient key: `rasia_lock_{md5(fileId)}`.
   - Before writing incoming chunk bytes, the controller checks `get_transient($lockKey)`.
   - If locked, returns HTTP 409 (Conflict).
   - Upon chunk flush or exception, `delete_transient($lockKey)` releases the lock.

2. **Integrity Validation:**
   - Client sends `sha256` hash with each chunk and final file payload.
   - If `hash_file('sha256', $assembledFilePath) !== $expectedSha`, the assembled file is purged and an error is logged.

3. **Garbage Collection:**
   - Incomplete chunks older than 24 hours in `wp-content/uploads/rasia-chunks/` are pruned via daily WP-Cron event `rasia_prune_orphaned_chunks`.

---

## Verification & Acceptance Criteria

```gherkin
Feature: Resilient REST Upload Controller
  Scenario: Upload chunk succeeds with valid permissions
    Given Authenticated WordPress user with upload_files capability
    When POST request sent to /wp-json/riseup/v1/upload-chunk
    Then HTTP response code is 200
    And Response payload contains isSuccess: true

  Scenario: Concurrent chunk request returns HTTP 409 Conflict
    Given An active transient lock for fileId "test-asset-01"
    When Simultaneous chunk POST received for "test-asset-01"
    Then HTTP response code is 409
    And Error code is "upload_locked"
```
