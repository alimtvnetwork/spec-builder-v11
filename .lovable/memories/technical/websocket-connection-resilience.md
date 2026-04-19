# Memory: technical/websocket-connection-resilience

**Updated:** 2026-02-04
**Version:** 1.0.0  

---

## Summary

The WebSocket Connection Manager provides robust connection resilience between AI Bridge CLI and model backends. It handles connection lifecycle, message queuing during disconnects, automatic reconnection with exponential backoff, and UI state synchronization.

---

## Key Points

- **Connection States**: CONNECTING, CONNECTED, RECONNECTING, DISCONNECTED, SUSPENDED, CLOSED
- **Message Queue**: Priority-based queuing with TTL, max 50 messages, optional localStorage persistence
- **Retry Logic**: Exponential backoff (1s base, 30s max, 10 attempts) with jitter
- **Heartbeat**: 30s ping interval, 5s pong timeout, 2 missed pongs triggers reconnect
- **Resume Modes**: auto-resume (default), user-confirm, fresh-start
- **Error Codes**: 9830-9839 for WebSocket connection errors

---

## UI Indicators

| State | Icon | Message |
|-------|------|---------|
| CONNECTED | CheckCircle | "Connected" |
| RECONNECTING | RefreshCw (spin) | "Reconnecting (attempt N)..." |
| DISCONNECTED | WifiOff | "Disconnected - messages queued" |
| SUSPENDED | AlertTriangle | "Connection suspended" |

---

## Related Specs

- `spec/22-ai-bridge-cli/01-backend/38-websocket-connection-manager.md`
- `spec/22-ai-bridge-cli/01-backend/37-adaptive-reasoning-flow.md`
- `spec/22-ai-bridge-cli/01-backend/05-error-codes.md`
