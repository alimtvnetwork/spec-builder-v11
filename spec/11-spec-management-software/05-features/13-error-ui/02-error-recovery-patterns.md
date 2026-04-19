# 13.2 Error Recovery Patterns

**Version:** 2.0.0  
**Status:** Planned  
**Last Updated:** 2026-03-09

---

## Overview

Cross-cutting error recovery patterns for the Spec Management Software, covering API failures, file operations, authentication, offline resilience, data corruption, and circuit-breaker strategies. These patterns complement the realtime-specific recovery in [18-realtime/04-error-recovery.md](../18-realtime/04-error-recovery.md) and the UI components in [01-error-components.md](./01-error-components.md).

**Cross-References:**
- [Error Components](./01-error-components.md) — UI rendering of recovery actions
- [Error Management](../../06-error-management/00-overview.md) — Error code registry
- [API Client](../15-api-client/00-overview.md) — HTTP interceptors
- [Realtime Error Recovery](../18-realtime/04-error-recovery.md) — WebSocket/SSE reconnection
- [State Management](../16-state-management/00-overview.md) — Optimistic rollback

---

## 13.2.1 Recovery Strategy Matrix

| Error Category | Detection | Recovery Strategy | Max Retries | User Feedback |
|----------------|-----------|-------------------|-------------|---------------|
| Network timeout | No response within deadline | Exponential backoff retry | 3 | Toast + spinner |
| HTTP 401 (Unauthorized) | Response interceptor | Silent token refresh → re-login prompt | 1 refresh | Modal if refresh fails |
| HTTP 403 (Forbidden) | Response interceptor | Show permission denied, no retry | 0 | ErrorAlert |
| HTTP 409 (Conflict) | Response interceptor | Fetch latest, show diff, offer merge | 0 | Conflict dialog |
| HTTP 429 (Rate Limited) | `Retry-After` header | Countdown timer, auto-retry after | 1 | Banner with countdown |
| HTTP 5xx (Server Error) | Response interceptor | Exponential backoff retry | 3 | Toast → ErrorPage after exhaustion |
| File save failure | Write operation error | Queue + retry, preserve in-memory | 3 | Persistent banner |
| File read corruption | Checksum mismatch | Fetch from history/backup | 1 | Toast + auto-recover |
| Offline | `navigator.onLine` / fetch fail | Queue mutations, read from cache | ∞ (until online) | ConnectionStatusBanner |
| Optimistic update failure | Server rejection | Rollback UI state | 0 | Toast with undo |
| WebSocket disconnect | See [18-realtime/04](../18-realtime/04-error-recovery.md) | Exponential backoff reconnect | 10 | ConnectionStatusBanner |

---

## 13.2.2 Exponential Backoff Engine

Shared utility used by API client, file operations, and background sync.

```typescript
// src/lib/recovery/backoff.ts

interface BackoffConfig {
  initialDelayMs: number;   // Default: 1000
  maxDelayMs: number;       // Default: 30000
  multiplier: number;       // Default: 2
  jitterFraction: number;   // Default: 0.1 (±10%)
  maxAttempts: number;      // Default: 3
}

const DEFAULT_BACKOFF: BackoffConfig = {
  initialDelayMs: 1000,
  maxDelayMs: 30000,
  multiplier: 2,
  jitterFraction: 0.1,
  maxAttempts: 3,
};

function computeDelay(attempt: number, config: BackoffConfig): number {
  const base = Math.min(
    config.initialDelayMs * Math.pow(config.multiplier, attempt),
    config.maxDelayMs
  );
  const jitter = base * config.jitterFraction;
  return Math.floor(base + (Math.random() * 2 - 1) * jitter);
}

async function withRetry<T>(
  fn: () => Promise<T>,
  config: Partial<BackoffConfig> = {},
  shouldRetry?: (error: unknown, attempt: number) => boolean
): Promise<T> {
  const cfg = { ...DEFAULT_BACKOFF, ...config };

  for (let attempt = 0; attempt < cfg.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === cfg.maxAttempts - 1) throw error;
      if (shouldRetry && !shouldRetry(error, attempt)) throw error;
      await sleep(computeDelay(attempt, cfg));
    }
  }
  throw new Error('Unreachable');
}
```

### Retryable Classification

| Condition | Retryable | Notes |
|-----------|-----------|-------|
| Network error / timeout | ✅ | Always retry |
| HTTP 408, 429, 502, 503, 504 | ✅ | Transient server issues |
| HTTP 500 | ✅ | With caution (idempotent ops only) |
| HTTP 400, 401, 403, 404, 409, 422 | ❌ | Client errors, no retry |
| JSON parse error on response | ❌ | Indicates protocol issue |

```typescript
function isRetryable(error: unknown): boolean {
  if (error instanceof NetworkError) return true;
  if (error instanceof HttpError) {
    return [408, 429, 500, 502, 503, 504].includes(error.status);
  }
  return false;
}
```

---

## 13.2.3 Circuit Breaker

Prevents cascading failures by short-circuiting requests to a repeatedly-failing endpoint.

```typescript
// src/lib/recovery/circuit-breaker.ts

type CircuitState = 'closed' | 'open' | 'half-open';

interface CircuitBreakerConfig {
  failureThreshold: number;    // Default: 5
  resetTimeoutMs: number;      // Default: 60000 (1 min)
  halfOpenMaxRequests: number;  // Default: 1
}

class CircuitBreaker {
  private state: CircuitState = 'closed';
  private failures: number = 0;
  private lastFailure: number = 0;
  private halfOpenAttempts: number = 0;

  constructor(private config: CircuitBreakerConfig) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailure > this.config.resetTimeoutMs) {
        this.state = 'half-open';
        this.halfOpenAttempts = 0;
      } else {
        throw new CircuitOpenError('Circuit breaker is open');
      }
    }

    if (this.state === 'half-open' && this.halfOpenAttempts >= this.config.halfOpenMaxRequests) {
      throw new CircuitOpenError('Circuit breaker half-open limit reached');
    }

    try {
      if (this.state === 'half-open') this.halfOpenAttempts++;
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failures = 0;
    this.state = 'closed';
  }

  private onFailure(): void {
    this.failures++;
    this.lastFailure = Date.now();
    if (this.failures >= this.config.failureThreshold) {
      this.state = 'open';
    }
  }
}
```

### State Diagram

```
        success
  ┌──────────────────┐
  │                  │
  ▼     failure      │
CLOSED ──────► threshold exceeded ──► OPEN
  ▲                                    │
  │              resetTimeout          │
  │                expires             │
  │                  ┌─────────────────┘
  │                  ▼
  └─── success ── HALF-OPEN ── failure ──► OPEN
```

---

## 13.2.4 API Error Recovery Integration

### Response Interceptor

```typescript
// src/lib/api/interceptors.ts

apiClient.interceptors.response.use(
  response => response,
  async (error: AxiosError) => {
    const status = error.response?.status;

    // 401: Attempt silent token refresh
    if (status === 401 && !error.config._retried) {
      error.config._retried = true;
      try {
        await authService.refreshToken();
        return apiClient.request(error.config);
      } catch {
        authService.logout();
        toast.error('Session expired', {
          description: 'Please log in again.',
          action: { label: 'Log In', onClick: () => navigate('/login') },
        });
      }
    }

    // 429: Rate limited
    if (status === 429) {
      const retryAfter = parseInt(error.response.headers['retry-after'] || '60', 10);
      showRateLimitBanner(retryAfter);
      await sleep(retryAfter * 1000);
      return apiClient.request(error.config);
    }

    // 409: Conflict
    if (status === 409) {
      const serverVersion = error.response.data;
      showConflictDialog(serverVersion, error.config);
      return Promise.reject(error); // Let caller handle
    }

    return Promise.reject(error);
  }
);
```

---

## 13.2.5 File Operation Recovery

### Save Queue

When file saves fail, pending changes are queued and retried.

```typescript
// src/lib/recovery/save-queue.ts

interface PendingSave {
  fileId: string;
  content: string;
  version: number;
  timestamp: Date;
  attempts: number;
}

class SaveQueue {
  private queue: Map<string, PendingSave> = new Map();
  private processing: boolean = false;

  enqueue(fileId: string, content: string, version: number): void {
    // Coalesce: latest content always wins for same file
    this.queue.set(fileId, {
      fileId,
      content,
      version,
      timestamp: new Date(),
      attempts: 0,
    });
    this.process();
  }

  private async process(): Promise<void> {
    if (this.processing) return;
    this.processing = true;

    for (const [fileId, save] of this.queue) {
      try {
        await withRetry(
          () => apiClient.put(`/api/v1/files/${fileId}`, {
            content: save.content,
            version: save.version,
          }),
          { maxAttempts: 3 }
        );
        this.queue.delete(fileId);
      } catch (error) {
        save.attempts++;
        if (save.attempts >= 3) {
          showPersistentSaveError(fileId);
        }
      }
    }

    this.processing = false;
  }

  get pendingCount(): number {
    return this.queue.size;
  }

  getPendingFiles(): string[] {
    return [...this.queue.keys()];
  }
}
```

### Data Integrity Check

```typescript
// After file read, validate checksum
async function readFileWithIntegrityCheck(fileId: string): Promise<FileContent> {
  const file = await apiClient.get(`/api/v1/files/${fileId}`);
  const computed = await computeSHA256(file.data.content);

  if (computed !== file.data.checksum) {
    console.warn(`[Integrity] Checksum mismatch for ${fileId}, fetching from history`);
    const historical = await apiClient.get(`/api/v1/files/${fileId}/history/latest`);
    toast.warning('File recovered', {
      description: 'The file was recovered from a recent backup.',
    });
    return historical.data;
  }

  return file.data;
}
```

---

## 13.2.6 Offline Resilience

### Offline Detection

```typescript
// src/lib/recovery/offline-manager.ts

class OfflineManager {
  private online: boolean = navigator.onLine;
  private listeners: Set<(online: boolean) => void> = new Set();

  constructor() {
    window.addEventListener('online', () => this.setOnline(true));
    window.addEventListener('offline', () => this.setOnline(false));
  }

  private setOnline(value: boolean): void {
    if (this.online === value) return;
    this.online = value;
    this.listeners.forEach(fn => fn(value));

    if (value) {
      // Trigger queued operations
      saveQueue.process();
      realtimeRecovery.forceReconnect();
    }
  }

  get isOnline(): boolean { return this.online; }

  subscribe(fn: (online: boolean) => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }
}
```

### Offline Mutation Queue

| Mutation Type | Offline Behavior | On Reconnect |
|---------------|------------------|--------------|
| File save | Queue in SaveQueue | Flush queue, resolve conflicts |
| Project settings | Queue with timestamp | Last-write-wins |
| Spec create/delete | Block with offline banner | N/A |
| Search | Show cached results | Re-query |
| AI requests | Block with offline banner | N/A |

---

## 13.2.7 Optimistic Update Rollback

```typescript
// Pattern for React Query optimistic updates with rollback

const useUpdateSpec = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (update: SpecUpdate) => apiClient.put(`/api/v1/specs/${update.id}`, update),

    onMutate: async (update) => {
      await queryClient.cancelQueries({ queryKey: ['spec', update.id] });
      const previous = queryClient.getQueryData(['spec', update.id]);
      queryClient.setQueryData(['spec', update.id], (old: Spec) => ({
        ...old,
        ...update,
      }));
      return { previous };
    },

    onError: (err, update, context) => {
      // Rollback to previous state
      queryClient.setQueryData(['spec', update.id], context?.previous);
      toast.error('Failed to save changes', {
        description: 'Your changes have been reverted.',
        action: { label: 'Retry', onClick: () => mutate(update) },
      });
    },

    onSettled: (_, __, update) => {
      queryClient.invalidateQueries({ queryKey: ['spec', update.id] });
    },
  });
};
```

---

## 13.2.8 Graceful Degradation Tiers

When recovery strategies exhaust, the application degrades gracefully:

| Tier | Condition | Behavior |
|------|-----------|----------|
| **1 — Full** | All services healthy | Normal operation |
| **2 — Degraded** | API intermittent | Read from cache, queue writes, show banner |
| **3 — Read-Only** | API down, cache available | Browse cached specs, block mutations |
| **4 — Offline** | No connectivity | Show offline page with cached content list |
| **5 — Critical** | Unrecoverable error | ErrorPage with support link + diagnostic export |

### Tier Detection

```typescript
type DegradationTier = 1 | 2 | 3 | 4 | 5;

function detectTier(state: AppHealthState): DegradationTier {
  if (!state.online) return 4;
  if (state.circuitOpen && !state.cacheAvailable) return 5;
  if (state.circuitOpen && state.cacheAvailable) return 3;
  if (state.recentFailureRate > 0.3) return 2;
  return 1;
}
```

---

## 13.2.9 Error Recovery UI Patterns

### Conflict Resolution Dialog

```typescript
interface ConflictDialogProps {
  localVersion: FileVersion;
  serverVersion: FileVersion;
  onKeepLocal: () => void;
  onKeepServer: () => void;
  onMerge: () => void;
}
```

| Action | Behavior |
|--------|----------|
| Keep Mine | Overwrite server with local (force PUT) |
| Keep Theirs | Discard local, reload server version |
| Merge | Open side-by-side diff editor |

### Rate Limit Countdown

```typescript
interface RateLimitBannerProps {
  retryAfterSeconds: number;
  onRetry: () => void;
}

// Displays: "Rate limited. Retrying in 43s..." with live countdown
// Auto-retries when timer reaches 0
```

### Persistent Save Error Banner

```typescript
// Shown when file save exhausts retries
// Persists until user acknowledges or save succeeds
// Displays: "Failed to save [filename]. Changes are preserved locally."
// Actions: [Retry] [Save As] [Copy to Clipboard]
```

---

## 13.2.10 Error Codes

| Code | Name | Description | Recovery Pattern |
|------|------|-------------|------------------|
| 6020 | RETRY_EXHAUSTED | All retry attempts failed | Show ErrorAlert + support link |
| 6021 | CIRCUIT_OPEN | Circuit breaker tripped | Show degraded mode banner |
| 6022 | SAVE_QUEUE_FULL | Save queue capacity exceeded | Prompt user to reduce edits |
| 6023 | INTEGRITY_CHECK_FAILED | File checksum mismatch | Auto-recover from history |
| 6024 | OFFLINE_MUTATION_BLOCKED | Mutation attempted while offline | Show offline banner |
| 6025 | CONFLICT_UNRESOLVED | User has not resolved file conflict | Show conflict dialog |
| 6026 | DEGRADATION_TIER_CHANGE | App degradation tier changed | Update status banner |
| 6027 | ROLLBACK_APPLIED | Optimistic update rolled back | Toast with retry action |

---

## 13.2.11 Acceptance Criteria

### Exponential Backoff (99% Required)

| ID | Criterion | Priority | Validation Method |
|----|-----------|----------|-------------------|
| REC-001 | `withRetry` retries up to `maxAttempts` with exponential delays | Critical | Timing test |
| REC-002 | Jitter applied to prevent thundering herd | High | Statistical test |
| REC-003 | Non-retryable errors thrown immediately | Critical | Unit test |
| REC-004 | `shouldRetry` callback respected when provided | High | Unit test |

### Circuit Breaker (99% Required)

| ID | Criterion | Priority | Validation Method |
|----|-----------|----------|-------------------|
| REC-010 | Opens after `failureThreshold` consecutive failures | Critical | State test |
| REC-011 | Rejects requests immediately when open | Critical | Unit test |
| REC-012 | Transitions to half-open after `resetTimeoutMs` | High | Timing test |
| REC-013 | Closes on first success in half-open state | High | State test |
| REC-014 | Re-opens on failure in half-open state | High | State test |

### File Save Queue (99% Required)

| ID | Criterion | Priority | Validation Method |
|----|-----------|----------|-------------------|
| REC-020 | Coalesces multiple saves to same file | High | Queue test |
| REC-021 | Retries failed saves with backoff | Critical | Integration test |
| REC-022 | Shows persistent banner after 3 failures | High | UI test |
| REC-023 | `pendingCount` reflects queued saves accurately | High | State test |

### Offline Resilience (99% Required)

| ID | Criterion | Priority | Validation Method |
|----|-----------|----------|-------------------|
| REC-030 | Detects online/offline transitions | Critical | Event test |
| REC-031 | Queues mutations while offline | Critical | Queue test |
| REC-032 | Flushes queue on reconnect | Critical | Integration test |
| REC-033 | Blocks non-queuable mutations with banner | High | UI test |

### Optimistic Rollback (99% Required)

| ID | Criterion | Priority | Validation Method |
|----|-----------|----------|-------------------|
| REC-040 | Rolls back UI on server rejection | Critical | Mutation test |
| REC-041 | Shows toast with retry action on rollback | High | UI test |
| REC-042 | Invalidates query cache after settle | High | Cache test |

### Graceful Degradation (99% Required)

| ID | Criterion | Priority | Validation Method |
|----|-----------|----------|-------------------|
| REC-050 | Tier detection returns correct tier for each state | Critical | Unit test |
| REC-051 | Tier 2 serves cached reads + queues writes | High | Integration test |
| REC-052 | Tier 3 blocks all mutations | High | E2E test |
| REC-053 | Tier 5 shows ErrorPage with diagnostic export | High | UI test |

### Conflict Resolution (99% Required)

| ID | Criterion | Priority | Validation Method |
|----|-----------|----------|-------------------|
| REC-060 | 409 response triggers conflict dialog | Critical | E2E test |
| REC-061 | "Keep Mine" sends force PUT | High | Network test |
| REC-062 | "Keep Theirs" reloads server version | High | E2E test |
| REC-063 | "Merge" opens diff editor | High | E2E test |

---

## Related Specs

- [Error Components](./01-error-components.md)
- [Error Management](../../06-error-management/00-overview.md)
- [API Client HTTP Client](../15-api-client/01-http-client.md)
- [Realtime Error Recovery](../18-realtime/04-error-recovery.md)
- [State Management](../16-state-management/00-overview.md)
- [Monitoring](../17-monitoring/00-overview.md)
