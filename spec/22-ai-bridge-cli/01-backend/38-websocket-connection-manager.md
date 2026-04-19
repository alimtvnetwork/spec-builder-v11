# WebSocket Connection Manager

**Version:** 5.0.0  
**Updated:** 2026-03-09  
**Status:** Draft

---

## Overview

This specification defines the WebSocket connection manager responsible for maintaining persistent connections between the AI Bridge CLI and model backends. It handles connection lifecycle, message queuing during disconnects, automatic reconnection, and UI state synchronization.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    WebSocket Connection Manager                  │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │ Connection  │  │   Message   │  │      Retry Engine       │  │
│  │   Pool      │  │   Queue     │  │                         │  │
│  └──────┬──────┘  └──────┬──────┘  └────────────┬────────────┘  │
│         │                │                      │               │
│  ┌──────┴────────────────┴──────────────────────┴────────────┐  │
│  │                    Event Dispatcher                        │  │
│  └─────────────────────────┬─────────────────────────────────┘  │
│                            │                                    │
├────────────────────────────┼────────────────────────────────────┤
│  ┌─────────────┐  ┌────────┴────────┐  ┌─────────────────────┐  │
│  │  UI State   │  │  Health Monitor │  │  Metrics Collector  │  │
│  │  Publisher  │  │                 │  │                     │  │
│  └─────────────┘  └─────────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Connection States

| State | Code | Description |
|-------|------|-------------|
| `CONNECTING` | 0 | Initial connection attempt |
| `CONNECTED` | 1 | Active, healthy connection |
| `RECONNECTING` | 2 | Automatic reconnection in progress |
| `DISCONNECTED` | 3 | Connection lost, queuing messages |
| `SUSPENDED` | 4 | Manual pause or max retries exceeded |
| `CLOSED` | 5 | Intentional closure, no reconnect |

---

## Message Queue

### Queue Structure

```typescript
interface QueuedMessage {
  id: string;                    // UUID for tracking
  timestamp: number;             // Unix ms when queued
  priority: 'high' | 'normal' | 'low';
  payload: object;               // Original message payload
  attempts: number;              // Send attempts after reconnect
  maxAttempts: number;           // Max retry attempts (default: 3)
  expiresAt: number | null;      // Optional TTL
  metadata: {
    sessionId: string;
    moduleType: string;          // chat, blog, code, etc.
    correlationId?: string;      // For request/response matching
  };
}
```

### Queue Configuration

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `maxQueueSize` | `number` | 50 | Maximum queued messages |
| `defaultTTL` | `number` | 300000 | Message expiry (5 min) |
| `priorityOrder` | `boolean` | true | Process high priority first |
| `persistQueue` | `boolean` | false | Persist to localStorage |

### Queue Operations

| Operation | Description |
|-----------|-------------|
| `enqueue(message)` | Add message to queue |
| `dequeue()` | Remove and return next message |
| `peek()` | View next message without removing |
| `clear()` | Remove all messages |
| `prune()` | Remove expired messages |
| `reorder(id, priority)` | Change message priority |

---

## Retry Logic

### Exponential Backoff

```
delay = min(baseDelay * (2 ^ attempt) + jitter, maxDelay)
```

| Parameter | Value | Description |
|-----------|-------|-------------|
| `baseDelay` | 1000ms | Initial retry delay |
| `maxDelay` | 30000ms | Maximum delay cap |
| `jitter` | 0-500ms | Random jitter to prevent thundering herd |
| `maxAttempts` | 10 | Attempts before SUSPENDED state |

### Retry Schedule

| Attempt | Base Delay | With Jitter (approx) |
|---------|------------|----------------------|
| 1 | 1s | 1.0-1.5s |
| 2 | 2s | 2.0-2.5s |
| 3 | 4s | 4.0-4.5s |
| 4 | 8s | 8.0-8.5s |
| 5 | 16s | 16.0-16.5s |
| 6+ | 30s | 30.0-30.5s (capped) |

### Retry Conditions

| Condition | Action |
|-----------|--------|
| Network error | Retry with backoff |
| Server 5xx | Retry with backoff |
| Server 4xx | Do not retry, report error |
| Timeout | Retry with backoff |
| Manual disconnect | Do not retry |
| Auth failure | Suspend, require re-auth |

---

## Health Monitoring

### Heartbeat Protocol

| Setting | Value | Description |
|---------|-------|-------------|
| `pingInterval` | 30000ms | Time between pings |
| `pongTimeout` | 5000ms | Max wait for pong response |
| `missedPongsThreshold` | 2 | Pongs missed before reconnect |

### Health Check Flow

```
┌─────────┐     ping      ┌─────────┐
│ Client  │──────────────▶│ Server  │
│         │◀──────────────│         │
└─────────┘     pong      └─────────┘
     │                         │
     │   [no pong within 5s]   │
     │                         │
     ▼                         │
┌─────────────────┐            │
│ Increment       │            │
│ missedPongs     │            │
└────────┬────────┘            │
         │                     │
         ▼                     │
    [missedPongs ≥ 2]          │
         │                     │
         ▼                     │
┌─────────────────┐            │
│ Trigger         │            │
│ Reconnection    │            │
└─────────────────┘            │
```

---

## UI State Publishing

### Connection Status Events

```typescript
interface ConnectionStatusEvent {
  type: 'ConnectionStatus';
  state: ConnectionState;
  timestamp: number;
  details: {
    reconnectAttempt?: number;
    nextRetryIn?: number;
    queueLength?: number;
    lastError?: string;
  };
}
```

### UI Indicator States

| State | Icon | Color | Message |
|-------|------|-------|---------|
| CONNECTED | `CheckCircle` | `--success` | "Connected" |
| CONNECTING | `Loader` (spin) | `--muted` | "Connecting..." |
| RECONNECTING | `RefreshCw` (spin) | `--warning` | "Reconnecting (attempt N)..." |
| DISCONNECTED | `WifiOff` | `--destructive` | "Disconnected - messages queued" |
| SUSPENDED | `AlertTriangle` | `--destructive` | "Connection suspended" |

### Status Bar Component

```
┌────────────────────────────────────────────────────────────┐
│ Connected State                                            │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ [✓] Connected                                          │ │
│ └────────────────────────────────────────────────────────┘ │
├────────────────────────────────────────────────────────────┤
│ Disconnected State                                         │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ [⚠] Disconnected - 3 messages queued                   │ │
│ │     Reconnecting in 8s... [Retry Now] [Cancel]         │ │
│ └────────────────────────────────────────────────────────┘ │
├────────────────────────────────────────────────────────────┤
│ Suspended State                                            │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ [✕] Connection suspended after 10 attempts             │ │
│ │     [Reconnect] [View Queue (5)] [Discard Queue]       │ │
│ └────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────┘
```

---

## Queue Resume Behavior

### Resume Modes

| Mode | Behavior | Use Case |
|------|----------|----------|
| `AutoResume` | Immediately send queued messages | Default for most modules |
| `UserConfirm` | Show prompt before sending | Sensitive operations |
| `FreshStart` | Discard queue on reconnect | Time-sensitive content |

### Resume Flow

```
[Connection Restored]
        │
        ▼
┌───────────────────┐
│ Check Resume Mode │
└────────┬──────────┘
         │
    ┌────┴────┬─────────────┐
    ▼         ▼             ▼
[auto]    [confirm]    [fresh-start]
    │         │             │
    ▼         ▼             ▼
┌───────┐ ┌───────────┐ ┌───────────┐
│ Drain │ │ Show      │ │ Clear     │
│ Queue │ │ Confirm   │ │ Queue     │
│       │ │ Dialog    │ │           │
└───┬───┘ └─────┬─────┘ └─────┬─────┘
    │           │             │
    │     ┌─────┴─────┐       │
    │     ▼           ▼       │
    │  [Confirm]  [Discard]   │
    │     │           │       │
    │     ▼           ▼       │
    │  ┌───────┐  ┌───────┐   │
    │  │ Drain │  │ Clear │   │
    │  │ Queue │  │ Queue │   │
    │  └───┬───┘  └───┬───┘   │
    │      │          │       │
    └──────┴──────────┴───────┘
                │
                ▼
        [Normal Operation]
```

---

## API Interface

### Manager Methods

```typescript
interface WebSocketConnectionManager {
  // Connection lifecycle
  connect(endpoint: string, options?: ConnectOptions): Promise<void>;
  disconnect(reason?: string): void;
  reconnect(): Promise<void>;
  suspend(): void;
  resume(): Promise<void>;
  
  // Message handling
  send(message: object, options?: SendOptions): Promise<string>;
  sendImmediate(message: object): Promise<void>;
  
  // Queue management
  getQueueLength(): number;
  getQueuedMessages(): QueuedMessage[];
  clearQueue(): void;
  removeFromQueue(messageId: string): boolean;
  
  // State
  getState(): ConnectionState;
  getMetrics(): ConnectionMetrics;
  
  // Events
  on(event: ConnectionEvent, handler: EventHandler): void;
  off(event: ConnectionEvent, handler: EventHandler): void;
}

interface ConnectOptions {
  headers?: Record<string, string>;
  protocols?: string[];
  timeout?: number;
  resumeMode?: 'AutoResume' | 'UserConfirm' | 'FreshStart';
}

interface SendOptions {
  priority?: 'high' | 'normal' | 'low';
  ttl?: number;
  skipQueue?: boolean;
}
```

### Events

| Event | Payload | Description |
|-------|---------|-------------|
| `StateChange` | `{ from, to, timestamp }` | Connection state changed |
| `MessageQueued` | `{ message, queueLength }` | Message added to queue |
| `MessageSent` | `{ messageId, latency }` | Message successfully sent |
| `MessageFailed` | `{ messageId, error }` | Message send failed |
| `QueueDrained` | `{ count, duration }` | All queued messages sent |
| `RetryScheduled` | `{ attempt, delay }` | Reconnection scheduled |
| `HealthCheck` | `{ latency, healthy }` | Heartbeat result |

---

## Error Codes

| Code | Name | Description |
|------|------|-------------|
| 9830 | `WS_CONNECTION_FAILED` | Initial connection failed |
| 9831 | `WS_CONNECTION_LOST` | Connection dropped unexpectedly |
| 9832 | `WS_RECONNECT_FAILED` | Reconnection attempt failed |
| 9833 | `WS_MAX_RETRIES` | Max retry attempts exceeded |
| 9834 | `WS_QUEUE_FULL` | Message queue at capacity |
| 9835 | `WS_MESSAGE_EXPIRED` | Queued message TTL exceeded |
| 9836 | `WS_SEND_FAILED` | Message send failed |
| 9837 | `WS_AUTH_REQUIRED` | Authentication needed |
| 9838 | `WS_HEARTBEAT_TIMEOUT` | Pong not received in time |
| 9839 | `WS_INVALID_STATE` | Operation invalid in current state |

---

## Metrics

| Metric | Type | Description |
|--------|------|-------------|
| `connections_total` | Counter | Total connection attempts |
| `reconnections_total` | Counter | Total reconnection attempts |
| `messages_sent_total` | Counter | Total messages sent |
| `messages_queued_total` | Counter | Total messages queued |
| `messages_dropped_total` | Counter | Messages dropped (expired/discarded) |
| `connection_duration_seconds` | Histogram | Connection session durations |
| `message_latency_ms` | Histogram | Round-trip message latency |
| `queue_length` | Gauge | Current queue size |
| `retry_delay_seconds` | Gauge | Current retry delay |

---

## Configuration

### Default Settings

```json
{
  "Websocket": {
    "Endpoints": {
      "Primary": "wss://api.example.com/ws",
      "Fallback": "wss://api-backup.example.com/ws"
    },
    "Retry": {
      "BaseDelay": 1000,
      "MaxDelay": 30000,
      "MaxAttempts": 10,
      "JitterRange": 500
    },
    "Heartbeat": {
      "PingInterval": 30000,
      "PongTimeout": 5000,
      "MissedThreshold": 2
    },
    "Queue": {
      "MaxSize": 50,
      "DefaultTtl": 300000,
      "PersistToStorage": false,
      "ResumeMode": "AutoResume"
    },
    "Ui": {
      "ShowStatusIndicator": true,
      "ShowQueueCount": true,
      "ShowRetryCountdown": true
    }
  }
}
```

---

## Integration Points

| Component | Integration |
|-----------|-------------|
| Adaptive Reasoning | Queue reasoning requests during disconnect |
| RAG Memory | Sync memory updates when reconnected |
| Suggestions | Buffer suggestion fetches |
| GSearch | Queue search delegation requests |
| UI Settings | Read/write connection preferences |

---

## Cross-References

| Reference | Location |
|-----------|----------|
| Adaptive Reasoning | `37-adaptive-reasoning-flow.md` |
| Error Codes | `05-error-codes.md` |
| UI Settings | `../02-frontend/04-adaptive-reasoning-settings-ui.md` |
