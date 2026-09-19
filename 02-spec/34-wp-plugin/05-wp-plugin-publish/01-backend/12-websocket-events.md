# 12 – WebSocket Events

> **Location:** `02-spec/34-wp-plugin/05-wp-plugin-publish/01-backend/12-websocket-events.md`  
> **Updated:** 2026-03-09
**Version:** 1.0.0  

---

## Overview

The WebSocket system provides real-time communication between the admin dashboard and backend services. It uses a publish/subscribe model with namespaced events.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      WebSocket Hub                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌───────────────┐         ┌───────────────┐                   │
│   │   Clients     │◀───────▶│   Event Bus   │                   │
│   │   (Browser)   │         │               │                   │
│   └───────────────┘         └───────┬───────┘                   │
│                                     │                            │
│           ┌─────────────────────────┼─────────────────────────┐ │
│           ▼                         ▼                         ▼ │
│   ┌───────────────┐         ┌───────────────┐         ┌───────┐│
│   │ File Watcher  │         │ Sync Service  │         │Publish││
│   └───────────────┘         └───────────────┘         └───────┘│
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Connection Protocol

### Handshake

```javascript
// Client connection
const ws = new WebSocket('wss://example.com/plugins-onboard/ws');

ws.onopen = () => {
    // Authenticate
    ws.send(JSON.stringify({
        type: 'auth',
        token: 'jwt_token_here',
        ClientId: 'client_abc123'
    }));
};

// Server response
{
    "Type": "auth:success",
    "ClientId": "client_abc123",
    "SessionId": "sess_xyz789",
    "Capabilities": ["subscribe", "publish"]
}
```

### Heartbeat

```javascript
// Client sends ping every 30 seconds
{ "type": "ping", "ts": 1706745600000 }

// Server responds
{ "type": "pong", "ts": 1706745600050 }
```

---

## Event Categories

### File Events

| Event | Payload | Description |
|-------|---------|-------------|
| `file:created` | `{plugin, path, hash}` | New file detected |
| `file:modified` | `{Plugin, Path, OldHash, NewHash}` | File content changed |
| `file:deleted` | `{Plugin, Path}` | File removed |
| `file:renamed` | `{Plugin, OldPath, NewPath}` | File moved/renamed |
| `files:batch` | `{plugin, changes[]}` | Batch of changes |

### Sync Events

| Event | Payload | Description |
|-------|---------|-------------|
| `sync:started` | `{SyncId, Plugin, SiteId}` | Sync operation began |
| `sync:progress` | `{SyncId, Progress, File}` | Transfer progress |
| `sync:file_done` | `{SyncId, File, Status}` | Single file complete |
| `sync:conflict` | `{SyncId, Conflict}` | Conflict detected |
| `sync:complete` | `{SyncId, Result}` | Sync finished |
| `sync:failed` | `{SyncId, Error}` | Sync error |

### Publish Events

| Event | Payload | Description |
|-------|---------|-------------|
| `publish:started` | `{PublishId, Plugin, SiteId, Version}` | Publish began |
| `publish:stage` | `{PublishId, Stage, Status}` | Stage progress |
| `publish:complete` | `{PublishId, Result}` | Publish finished |
| `publish:failed` | `{PublishId, Error}` | Publish error |
| `publish:rollback` | `{PublishId, BackupId}` | Rollback triggered |

### Backup Events

| Event | Payload | Description |
|-------|---------|-------------|
| `backup:started` | `{BackupId, Plugin, Type}` | Backup began |
| `backup:progress` | `{BackupId, Progress}` | Backup progress |
| `backup:complete` | `{BackupId, Result}` | Backup finished |
| `backup:failed` | `{BackupId, Error}` | Backup error |
| `restore:started` | `{BackupId, Target}` | Restore began |
| `restore:complete` | `{BackupId, Result}` | Restore finished |

### Site Events

| Event | Payload | Description |
|-------|---------|-------------|
| `site:connected` | `{SiteId, Url}` | New site connected |
| `site:disconnected` | `{SiteId, Reason}` | Site disconnected |
| `site:status_change` | `{SiteId, Status}` | Site status update |
| `site:error` | `{SiteId, Error}` | Site error occurred |

### System Events

| Event | Payload | Description |
|-------|---------|-------------|
| `system:ready` | `{}` | System initialized |
| `system:error` | `{error, severity}` | System error |
| `system:maintenance` | `{message, eta}` | Maintenance mode |
| `config:updated` | `{key, value}` | Config changed |

---

## Message Format

### Standard Message Structure

```typescript
interface WSMessage {
    type: string;              // Event type (namespaced)
    id?: string;               // Message ID for correlation
    ts: number;                // Timestamp (ms)
    payload: Record<string, any>;
}
```

### Examples

```json
// File change event
{
    "Type": "file:modified",
    "Id": "msg_123",
    "Ts": 1706745600000,
    "Payload": {
        "Plugin": "my-plugin",
        "Path": "includes/class-core.php",
        "OldHash": "abc123",
        "NewHash": "def456"
    }
}

// Sync progress event
{
    "Type": "sync:progress",
    "Id": "msg_124",
    "Ts": 1706745601000,
    "Payload": {
        "SyncId": "sync_xyz",
        "Progress": 0.45,
        "CurrentFile": "assets/js/main.js",
        "BytesTransferred": 45000,
        "BytesTotal": 100000
    }
}
```

---

## Subscription Model

### Subscribe to Events

```javascript
// Subscribe to specific events
ws.send(JSON.stringify({
    type: 'subscribe',
    channels: [
        'file:*',           // All file events
        'sync:my-plugin',   // Sync events for specific plugin
        'publish:*'         // All publish events
    ]
}));

// Server confirmation
{
    "type": "subscribe:success",
    "channels": ["file:*", "sync:my-plugin", "publish:*"]
}
```

### Unsubscribe

```javascript
ws.send(JSON.stringify({
    type: 'unsubscribe',
    channels: ['file:*']
}));
```

### Channel Patterns

| Pattern | Matches |
|---------|---------|
| `file:*` | All file events |
| `sync:my-plugin` | Sync events for my-plugin |
| `sync:*:site_123` | Sync events for site 123 |
| `*:error` | All error events |
| `*` | All events (admin only) |

---

## Client Commands

| Command | Payload | Description |
|---------|---------|-------------|
| `auth` | `{token}` | Authenticate connection |
| `subscribe` | `{channels[]}` | Subscribe to channels |
| `unsubscribe` | `{channels[]}` | Unsubscribe from channels |
| `ping` | `{ts}` | Heartbeat ping |
| `request` | `{action, params}` | Request-response pattern |

### Request-Response Pattern

```javascript
// Client request
{
    "type": "request",
    "id": "req_123",
    "Action": "get_sync_status",
    "Params": { "Plugin": "my-plugin" }
}

// Server response
{
    "Type": "response",
    "Id": "req_123",
    "Success": true,
    "Data": { "Status": "idle", "LastSync": "..." }
}
```

---

## Error Handling

### Error Message Format

```json
{
    "Type": "error",
    "Code": "AUTH_FAILED",
    "Message": "Authentication token expired",
    "Details": {
        "ExpiresAt": "2024-01-31T11:00:00Z"
    }
}
```

### Error Codes

| Code | Description | Recovery |
|------|-------------|----------|
| `AUTH_FAILED` | Invalid/expired token | Re-authenticate |
| `AUTH_REQUIRED` | No authentication | Send auth message |
| `RATE_LIMITED` | Too many messages | Wait and retry |
| `INVALID_MESSAGE` | Malformed message | Check format |
| `CHANNEL_DENIED` | No permission | Check subscription |
| `CONNECTION_TIMEOUT` | No heartbeat | Reconnect |

---

## PHP Server Implementation

```php
<?php
namespace PluginsOnboard\WebSocket;

class Event_Hub {
    
    /** @var array<string, callable[]> */
    private array $listeners = [];
    
    /** @var array<string, Connection[]> */
    private array $subscriptions = [];
    
    /**
     * Emit an event to subscribers
     */
    public function emit(string $event, array $payload): void {
        $message = [
            'type' => $event,
            'ts' => round(microtime(true) * 1000),
            'payload' => $payload
        ];
        
        foreach ($this->get_subscribers($event) as $connection) {
            $connection->send(json_encode($message));
        }
    }
    
    /**
     * Register event listener
     */
    public function on(string $event, callable $handler): void {
        $this->listeners[$event][] = $handler;
    }
    
    /**
     * Subscribe connection to channel
     */
    public function subscribe(
        Connection $connection,
        array $channels
    ): void;
    
    /**
     * Get subscribers matching event
     */
    private function get_subscribers(string $event): array;
}
```

---

## JavaScript Client

```typescript
class PluginsOnboardWs {
    private ws: WebSocket;
    private listeners: Map<string, Set<Function>>;
    private reconnectAttempts: number = 0;
    
    constructor(url: string, token: string) {
        this.connect(url, token);
    }
    
    on(event: string, callback: Function): () => void {
        // Add listener, return unsubscribe function
    }
    
    emit(event: string, payload: any): void {
        // Send message to server
    }
    
    subscribe(channels: string[]): void {
        this.ws.send(JSON.stringify({
            type: 'subscribe',
            channels
        }));
    }
    
    private handleMessage(event: MessageEvent): void {
        const msg = JSON.parse(event.data);
        this.listeners.get(msg.type)?.forEach(cb => cb(msg.payload));
        this.listeners.get('*')?.forEach(cb => cb(msg));
    }
    
    private reconnect(): void {
        // Exponential backoff reconnection
    }
}
```

---

## Rate Limiting

| Limit | Value | Scope |
|-------|-------|-------|
| Messages/second | 50 | Per connection |
| Subscriptions | 100 | Per connection |
| Message size | 64KB | Per message |
| Connections | 10 | Per user |

---

## Security

- **Authentication**: JWT token required within 5 seconds of connection
- **Authorization**: Channel subscriptions validated against user permissions
- **Encryption**: WSS (TLS) required in production
- **Origin**: CORS validation on connection

---

*See also: [06-file-watcher.md](06-file-watcher.md), [07-sync-service.md](07-sync-service.md)*
