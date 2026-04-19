# Time Log CLI: Remote Sync & Offline Queue

**Version:** 1.0.0  
**Updated:** 2026-03-28

---

## Overview

The Time Log CLI operates in an **offline-first** architecture. All activity data is captured and persisted locally in SQLite regardless of network availability. A background **Sync Engine** asynchronously uploads local data to a remote REST API when connectivity is available. Once the remote server confirms receipt, synced records are purged from the local database to reclaim storage.

This design ensures:
- **Zero data loss** — tracking never pauses due to network issues
- **Minimal latency** — local writes are instant; sync is deferred
- **Bandwidth efficiency** — data is batched and compressed before upload
- **Privacy control** — users can review data before it leaves the device

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Time Log Daemon                         │
│                                                             │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐   │
│  │  Collectors   │──►│  Event Bus   │──►│  SQLite DB   │   │
│  │  (local)      │    │  (channel)   │    │  (WAL mode)  │   │
│  └──────────────┘    └──────────────┘    └──────┬───────┘   │
│                                                  │           │
│                                           ┌──────▼───────┐   │
│                                           │  Sync Queue  │   │
│                                           │  (outbox)    │   │
│                                           └──────┬───────┘   │
│                                                  │           │
│                                           ┌──────▼───────┐   │
│                                           │  Sync Engine │   │
│                                           │  (worker)    │   │
│                                           └──────┬───────┘   │
│                                                  │           │
└──────────────────────────────────────────────────┼───────────┘
                                                   │
                                          ┌────────▼────────┐
                                          │  Remote REST    │
                                          │  API Server     │
                                          └─────────────────┘
```

---

## Sync Queue (Outbox Table)

All data written to the main activity tables is simultaneously enqueued in a durable outbox table for eventual upload.

### Schema

```sql
CREATE TABLE SyncQueue (
    Id              TEXT PRIMARY KEY,       -- UUID v4
    TableName       TEXT NOT NULL,          -- Source table: AppActivity, BrowserActivity, etc.
    RecordId        TEXT NOT NULL,          -- Primary key of the source record
    Operation       TEXT NOT NULL,          -- Insert, Update, Delete
    Payload         TEXT NOT NULL,          -- Full JSON-serialized record
    PayloadBytes    INTEGER NOT NULL,       -- Size of Payload in bytes
    Status          TEXT NOT NULL DEFAULT 'Queued',  -- Queued, Syncing, Synced, Failed
    RetryCount      INTEGER NOT NULL DEFAULT 0,
    LastError       TEXT,                   -- Last error message (NULL if no error)
    CreatedAt       TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    LastAttemptAt   TEXT,                   -- Timestamp of last sync attempt
    SyncedAt        TEXT,                   -- Timestamp when server confirmed receipt
    ExpiresAt       TEXT                    -- Auto-purge after this date if still Queued
);

CREATE INDEX IdxSyncQueueStatus ON SyncQueue(Status);
CREATE INDEX IdxSyncQueueCreatedAt ON SyncQueue(CreatedAt);
CREATE INDEX IdxSyncQueueTableName ON SyncQueue(TableName);
```

### Status Flow

```
                        sync attempt
  Queued ──────────────────────────────► Syncing
    ▲                                      │
    │              ┌───────────────────────┤
    │              │                       │
    │         server error            server 2xx
    │         or timeout              confirmed
    │              │                       │
    │              ▼                       ▼
    │           Failed                  Synced
    │              │                       │
    │    retry < MaxRetries          purge after
    │              │                  PurgeDelay
    └──────────────┘                       │
                                           ▼
                                       [DELETED]
```

### Enqueue Logic

```rust
pub struct SyncEnqueuer {
    db: Arc<Connection>,
}

impl SyncEnqueuer {
    /// Called by the storage engine after every successful local write
    pub fn enqueue<T: Serialize>(
        &self,
        table_name: &str,
        record_id: &str,
        operation: SyncOperation,
        record: &T,
    ) -> Result<(), SyncError> {
        let payload = serde_json::to_string(record)?;
        let payload_bytes = payload.len() as i64;

        self.db.execute(
            "INSERT INTO SyncQueue (Id, TableName, RecordId, Operation, Payload, PayloadBytes, ExpiresAt)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            params![
                Uuid::new_v4().to_string(),
                table_name,
                record_id,
                operation.as_str(),
                payload,
                payload_bytes,
                // Default expiry: 30 days from now
                (Utc::now() + Duration::days(30)).to_rfc3339(),
            ],
        )?;
        Ok(())
    }
}

#[derive(Debug, Clone, Serialize)]
pub enum SyncOperation {
    Insert,
    Update,
    Delete,
}
```

---

## Sync Engine (Worker)

A background Tokio task that periodically drains the outbox.

### Configuration

```toml
[Sync]
Enabled = true
RemoteUrl = "https://api.example.com/v1"       # Remote API base URL
ApiKey = ""                                      # Bearer token for authentication
DeviceId = ""                                    # Auto-generated UUID on first run

# Timing
SyncIntervalSeconds = 60                         # How often to attempt sync
BatchSize = 100                                  # Records per upload batch
MaxBatchPayloadMb = 5                            # Max payload size per batch

# Retry
MaxRetryCount = 10                               # Max retries before marking as permanently failed
InitialBackoffSeconds = 5                        # First retry delay
MaxBackoffSeconds = 3600                         # Cap at 1 hour
BackoffMultiplier = 2.0                          # Exponential multiplier

# Purge
PurgeAfterSyncSeconds = 86400                    # Delete synced records after 24 hours
PurgeExpiredEnabled = true                       # Auto-delete expired unsynced records

# Network
TimeoutSeconds = 30                              # HTTP request timeout
CompressPayload = true                           # gzip compress batches > 1 KB
RequireHttps = true                              # Refuse to sync over plain HTTP
```

### Sync Loop

```rust
pub struct SyncEngine {
    config: SyncConfig,
    db: Arc<Connection>,
    http_client: reqwest::Client,
    connectivity: Arc<ConnectivityMonitor>,
}

impl SyncEngine {
    pub async fn run(&self, mut shutdown: tokio::sync::watch::Receiver<bool>) {
        let mut interval = tokio::time::interval(
            Duration::from_secs(self.config.sync_interval_seconds)
        );

        loop {
            tokio::select! {
                _ = interval.tick() => {
                    if self.connectivity.is_online().await {
                        self.sync_cycle().await;
                    }
                }
                _ = shutdown.changed() => {
                    // Final flush attempt before shutdown
                    if self.connectivity.is_online().await {
                        self.sync_cycle().await;
                    }
                    break;
                }
            }
        }
    }

    async fn sync_cycle(&self) {
        // 1. Purge confirmed synced records past retention period
        self.purge_synced_records().await;

        // 2. Purge expired unsynced records
        if self.config.purge_expired_enabled {
            self.purge_expired_records().await;
        }

        // 3. Drain outbox in batches
        loop {
            let batch = self.fetch_next_batch().await;
            if batch.is_empty() {
                break;
            }

            match self.upload_batch(&batch).await {
                Ok(response) => {
                    self.mark_synced(&batch, &response).await;
                }
                Err(SyncError::Retriable(e)) => {
                    self.increment_retry(&batch, &e.to_string()).await;
                    break; // Back off, try again next cycle
                }
                Err(SyncError::Permanent(e)) => {
                    self.mark_failed(&batch, &e.to_string()).await;
                    // Continue to next batch — don't block on one bad batch
                }
            }
        }
    }
}
```

### Batch Construction

```rust
async fn fetch_next_batch(&self) -> Vec<SyncQueueEntry> {
    let rows = self.db.prepare(
        "SELECT Id, TableName, RecordId, Operation, Payload, PayloadBytes, RetryCount
         FROM SyncQueue
         WHERE Status IN ('Queued', 'Failed')
           AND RetryCount < ?1
           AND (LastAttemptAt IS NULL
                OR LastAttemptAt < datetime('now', '-' || ?2 || ' seconds'))
         ORDER BY CreatedAt ASC
         LIMIT ?3"
    )
    .bind(self.config.max_retry_count)
    .bind(self.calculate_backoff_for_query())
    .bind(self.config.batch_size)
    .query_map(/* ... */)
    .collect();

    // Enforce max batch payload size
    let mut batch = Vec::new();
    let mut total_bytes: u64 = 0;
    let max_bytes = self.config.max_batch_payload_mb as u64 * 1_048_576;

    for row in rows {
        if total_bytes + row.payload_bytes as u64 > max_bytes {
            break;
        }
        total_bytes += row.payload_bytes as u64;
        batch.push(row);
    }

    batch
}
```

---

## Remote API Contract

### Upload Endpoint

```
POST /v1/sync/upload
Authorization: Bearer {ApiKey}
Content-Type: application/json
Content-Encoding: gzip  (if compressed)
X-Device-Id: {DeviceId}
X-Client-Version: {AppVersion}
```

#### Request Body

```json
{
  "DeviceId": "d1e2f3a4-...",
  "BatchId": "b5c6d7e8-...",
  "Timestamp": "2026-03-28T10:30:00Z",
  "Records": [
    {
      "QueueId": "q1a2b3c4-...",
      "Table": "AppActivity",
      "RecordId": "r9f8e7d6-...",
      "Operation": "Insert",
      "Payload": {
        "Id": "r9f8e7d6-...",
        "SessionId": "s1a2b3c4-...",
        "AppName": "code",
        "WindowTitle": "main.rs — timelog — Visual Studio Code",
        "StartedAt": "2026-03-28T09:15:00Z",
        "EndedAt": "2026-03-28T09:22:30Z",
        "DwellSeconds": 450.0,
        "FilePath": "/home/user/projects/timelog/src/main.rs",
        "ProjectRoot": "/home/user/projects/timelog"
      }
    }
  ]
}
```

#### Success Response (200)

```json
{
  "BatchId": "b5c6d7e8-...",
  "Accepted": 100,
  "Rejected": 0,
  "Results": [
    {
      "QueueId": "q1a2b3c4-...",
      "Status": "Accepted"
    }
  ]
}
```

#### Partial Success Response (207)

```json
{
  "BatchId": "b5c6d7e8-...",
  "Accepted": 98,
  "Rejected": 2,
  "Results": [
    { "QueueId": "q1a2b3c4-...", "Status": "Accepted" },
    { "QueueId": "q2b3c4d5-...", "Status": "Rejected", "Error": "Duplicate record" }
  ]
}
```

#### Error Responses

| Status | Meaning | Client Action |
|--------|---------|---------------|
| `200` | All records accepted | Mark all as `Synced` |
| `207` | Partial acceptance | Mark accepted as `Synced`, rejected as `Failed` with error |
| `400` | Malformed request | Mark batch as `Failed` (permanent — do not retry) |
| `401` | Invalid/expired API key | Pause sync, notify user via CLI status |
| `408` | Request timeout | Retry with backoff |
| `413` | Payload too large | Split batch in half, retry both |
| `429` | Rate limited | Respect `Retry-After` header, backoff |
| `500` | Server error | Retry with backoff |
| `503` | Service unavailable | Retry with backoff |

### Screenshot Upload Endpoint

Screenshots are uploaded separately due to binary payload size:

```
POST /v1/sync/screenshots
Authorization: Bearer {ApiKey}
Content-Type: multipart/form-data
X-Device-Id: {DeviceId}
```

#### Multipart Fields

| Field | Type | Description |
|-------|------|-------------|
| `Metadata` | JSON | Screenshot table record (same as sync payload) |
| `Image` | Binary | Screenshot file (WebP/JPEG/PNG) |

#### Flow

1. Upload screenshot image + metadata in one request
2. Server returns the stored URL/path
3. Client marks screenshot sync queue entry as `Synced`
4. Client deletes local screenshot file after `PurgeAfterSyncSeconds`

---

## Connectivity Monitor

Detects online/offline state transitions to optimize sync attempts.

```rust
pub struct ConnectivityMonitor {
    is_online: AtomicBool,
    remote_url: String,
    check_interval: Duration,
}

impl ConnectivityMonitor {
    /// Periodic health check against the remote API
    pub async fn check_connectivity(&self) -> bool {
        // 1. Quick DNS resolution check
        let dns_ok = tokio::net::lookup_host(&self.remote_url).await.is_ok();
        if !dns_ok {
            self.is_online.store(false, Ordering::SeqCst);
            return false;
        }

        // 2. Lightweight ping to remote API health endpoint
        let health_ok = self.http_client
            .get(format!("{}/v1/health", self.remote_url))
            .timeout(Duration::from_secs(5))
            .send()
            .await
            .map(|r| r.status().is_success())
            .unwrap_or(false);

        self.is_online.store(health_ok, Ordering::SeqCst);
        health_ok
    }

    pub fn is_online(&self) -> bool {
        self.is_online.load(Ordering::SeqCst)
    }
}
```

### Platform-Specific Network Detection

| OS | Primary Method | Fallback |
|----|---------------|----------|
| Windows | `NetworkInformation` (WinRT) / `InternetGetConnectedState` | HTTP ping |
| Linux | NetworkManager DBus (`org.freedesktop.NetworkManager.State`) | HTTP ping |
| macOS | `NWPathMonitor` (Network framework) | HTTP ping |

---

## Retry Strategy

### Exponential Backoff with Jitter

```rust
pub fn calculate_backoff(retry_count: u32, config: &SyncConfig) -> Duration {
    let base = config.initial_backoff_seconds as f64;
    let max = config.max_backoff_seconds as f64;
    let multiplier = config.backoff_multiplier;

    // Exponential: base * multiplier^retry
    let exponential = base * multiplier.powi(retry_count as i32);

    // Cap at maximum
    let capped = exponential.min(max);

    // Add jitter (±25%) to prevent thundering herd
    let jitter_range = capped * 0.25;
    let jitter = rand::thread_rng().gen_range(-jitter_range..=jitter_range);

    Duration::from_secs_f64((capped + jitter).max(1.0))
}
```

### Retry Schedule (Default Config)

| Retry # | Base Delay | With Jitter Range |
|---------|-----------|-------------------|
| 1 | 5s | 4–6s |
| 2 | 10s | 8–13s |
| 3 | 20s | 15–25s |
| 4 | 40s | 30–50s |
| 5 | 80s | 60–100s |
| 6 | 160s | 120–200s |
| 7 | 320s | 240–400s |
| 8 | 640s | 480–800s |
| 9 | 1280s | 960–1600s |
| 10 | 3600s (max) | 2700–3600s |

After retry 10, the record is marked as **permanently failed** and excluded from future sync attempts.

---

## Purge Strategy

### Post-Sync Purge

After a record is confirmed synced by the server, it remains in the local database for a configurable retention period before deletion:

```rust
async fn purge_synced_records(&self) {
    let purge_threshold = Utc::now()
        - Duration::seconds(self.config.purge_after_sync_seconds as i64);

    // 1. Delete from SyncQueue
    self.db.execute(
        "DELETE FROM SyncQueue
         WHERE Status = 'Synced'
           AND SyncedAt < ?1",
        params![purge_threshold.to_rfc3339()],
    );

    // 2. Delete from source tables (only if synced)
    for table in &["AppActivity", "BrowserActivity", "ClickAggregate",
                    "Screenshot", "IdleEvent"] {
        self.db.execute(
            &format!(
                "DELETE FROM {table}
                 WHERE Id IN (
                     SELECT RecordId FROM SyncQueue
                     WHERE TableName = ?1
                       AND Status = 'Synced'
                       AND SyncedAt < ?2
                 )"
            ),
            params![table, purge_threshold.to_rfc3339()],
        );
    }

    // 3. Delete screenshot files from disk
    let screenshot_paths: Vec<String> = self.db.prepare(
        "SELECT s.FilePath FROM Screenshot s
         INNER JOIN SyncQueue sq ON sq.RecordId = s.Id
         WHERE sq.Status = 'Synced' AND sq.SyncedAt < ?1"
    )
    .bind(purge_threshold.to_rfc3339())
    .query_map(|row| row.get(0))
    .collect();

    for path in screenshot_paths {
        if let Err(e) = tokio::fs::remove_file(&path).await {
            tracing::warn!("Failed to delete screenshot {}: {}", path, e);
        }
    }
}
```

### Purge Safety Rules

| Rule | Description |
|------|-------------|
| **Never purge unsynced data** | Records with `Status != 'Synced'` are never deleted by the purge process |
| **Retention buffer** | Default 24-hour buffer after sync confirmation before purge |
| **DailySummary preserved** | `DailySummary` table is **never purged** — serves as a permanent local cache for offline dashboard |
| **Session preserved** | `Session` records are preserved until all child records are purged |
| **Screenshot files** | Deleted from filesystem only after both metadata sync and purge retention |

---

## Idempotency

All sync operations are idempotent to handle network duplicates:

| Mechanism | Implementation |
|-----------|---------------|
| **Record-level UUID** | Every record has a globally unique `Id` (UUID v4) |
| **Batch-level UUID** | Every upload batch has a unique `BatchId` |
| **Server-side dedup** | Server uses `(DeviceId, RecordId)` as a unique constraint — duplicate uploads return `Accepted` (not error) |
| **Tombstone deletes** | Delete operations send the record ID, not a destructive command — server marks as deleted |

---

## Sync Status Reporting

### CLI Command

```
$ timelog sync-status

Sync Status
───────────
Remote:        https://api.example.com/v1
Connectivity:  Online ✅
Last Sync:     2026-03-28 10:25:32 UTC (3 minutes ago)
Next Sync:     2026-03-28 10:26:32 UTC

Queue Summary:
  Queued:      23 records (142 KB)
  Syncing:      0 records
  Failed:       2 records (last error: 503 Service Unavailable)
  Total Synced: 14,302 records (since 2026-01-15)

Storage:
  Local DB:    45 MB
  Screenshots: 1.2 GB (342 pending upload)
  Reclaimable: 38 MB (after purge of synced data)
```

### API Endpoint

```
GET /api/v1/sync/status
```

```json
{
  "IsOnline": true,
  "RemoteUrl": "https://api.example.com/v1",
  "LastSyncAt": "2026-03-28T10:25:32Z",
  "NextSyncAt": "2026-03-28T10:26:32Z",
  "Queue": {
    "Queued": 23,
    "Syncing": 0,
    "Failed": 2,
    "QueuedBytes": 145408,
    "TotalSynced": 14302
  },
  "Storage": {
    "DatabaseBytes": 47185920,
    "ScreenshotBytes": 1288490188,
    "PendingScreenshots": 342,
    "ReclaimableBytes": 39845888
  }
}
```

### CLI Sync Commands

| Command | Description |
|---------|-------------|
| `timelog sync-status` | Show sync queue status |
| `timelog sync now` | Force an immediate sync cycle |
| `timelog sync pause` | Pause automatic sync |
| `timelog sync resume` | Resume automatic sync |
| `timelog sync reset` | Clear failed records from queue |
| `timelog sync purge` | Force purge of synced records |

---

## Security

| Concern | Mitigation |
|---------|------------|
| **Data in transit** | TLS 1.2+ required (`RequireHttps = true`); refuse plain HTTP |
| **Authentication** | Bearer token per device; tokens scoped to device ID |
| **Payload integrity** | SHA-256 hash of batch payload sent in `X-Payload-Hash` header |
| **Local encryption** | Optional SQLite encryption via `sqlcipher` (configurable) |
| **API key storage** | Stored in OS keyring (Windows Credential Manager, macOS Keychain, Linux `secret-service`) |
| **Screenshot privacy** | Privacy blur applied before local storage (never uploads unblurred data) |

---

## Error Codes

| Code | Name | Description |
|------|------|-------------|
| 15450 | `SyncQueueFull` | Outbox exceeds configured maximum size |
| 15451 | `SyncUploadFailed` | HTTP request to remote API failed |
| 15452 | `SyncAuthError` | API key invalid or expired (401) |
| 15453 | `SyncPayloadTooLarge` | Batch exceeds server payload limit (413) |
| 15454 | `SyncRateLimited` | Server returned 429 — back off |
| 15455 | `SyncPartialFailure` | Some records in batch were rejected (207) |
| 15456 | `SyncPurgeError` | Failed to delete synced records or files |
| 15457 | `SyncConnectivityLost` | Network went offline during sync cycle |
| 15458 | `SyncEncryptionError` | Failed to encrypt/decrypt sync payload |
| 15459 | `SyncScreenshotUploadFailed` | Screenshot binary upload failed |

---

## Metrics

The Sync Engine exposes metrics for monitoring and diagnostics:

| Metric | Type | Description |
|--------|------|-------------|
| `sync_queue_depth` | Gauge | Current number of pending records |
| `sync_queue_bytes` | Gauge | Total payload size of pending records |
| `sync_cycles_total` | Counter | Total sync cycles executed |
| `sync_records_uploaded` | Counter | Records successfully uploaded |
| `sync_records_failed` | Counter | Records that exceeded max retries |
| `sync_batch_duration_ms` | Histogram | Upload time per batch |
| `sync_retry_count` | Counter | Total retries across all records |
| `sync_purge_records` | Counter | Records purged after sync confirmation |
| `sync_purge_bytes` | Counter | Bytes reclaimed by purge |

---

## Cross-References

| Reference | Location |
|-----------|----------|
| Architecture | `./01-architecture.md` |
| Database Schema | `./05-database-schema.md` |
| API Interface | `./06-api-interface.md` |
| Error Codes | `./07-error-codes.md` |
| File Path Extraction | `./08-file-path-extraction.md` |
| Screenshot Capture | `./04-screenshot-capture.md` |
