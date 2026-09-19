# WebSocket Events

**Version:** 2.0.0  
**Status:** Active  
**Updated:** 2026-03-09

---

## Overview

Real-time WebSocket events for streaming code generation progress, AI token output, build status, and error notifications.

**Cross-References:**
- [Architecture](./01-architecture.md)
- [Parallel Executor](./05-parallel-executor.md)
- [Build Verification](./06-build-verification.md)
- [Realtime Communication](../18-realtime/00-overview.md)

---

## Connection

### Endpoint

```
wss://{host}/ws/codegen
```

### Authentication

```json
{
  "Type": "auth",
  "Token": "Bearer {jwt_token}",
  "SessionId": "sess_abc123"
}
```

### Message Envelope

All messages follow the standard WebSocket protocol envelope:

```json
{
  "Type": "string",
  "Data": "object",
  "RequestId": "string",
  "Timestamp": "ISO8601"
}
```

---

## Event Categories

| Category | Prefix | Description |
|----------|--------|-------------|
| Session | `session:` | Generation session lifecycle |
| Phase | `phase:` | Workflow phase transitions |
| File | `file:` | Individual file generation |
| AI | `ai:` | Token streaming from LLM |
| Build | `build:` | Verification and fix loop |
| Git | `git:` | Repository operations |
| Credit | `credit:` | Usage consumption |
| Error | `error:` | Error notifications |

---

## Session Events

### session:started

Emitted when a code generation session begins.

```json
{
  "Type": "session:started",
  "Data": {
    "SessionId": "sess_abc123",
    "ProjectId": "proj_xyz",
    "PlanId": "plan_456",
    "TotalFiles": 24,
    "TotalBatches": 5,
    "EstimatedCredits": 150
  },
  "Timestamp": "2026-01-29T10:00:00Z"
}
```

### session:paused

```json
{
  "Type": "session:paused",
  "Data": {
    "SessionId": "sess_abc123",
    "Reason": "user_request",
    "FilesCompleted": 12,
    "FilesRemaining": 12
  },
  "Timestamp": "2026-01-29T10:05:00Z"
}
```

### session:resumed

```json
{
  "Type": "session:resumed",
  "Data": {
    "SessionId": "sess_abc123",
    "ResumingFromBatch": 3
  },
  "Timestamp": "2026-01-29T10:10:00Z"
}
```

### session:completed

```json
{
  "Type": "session:completed",
  "Data": {
    "SessionId": "sess_abc123",
    "Status": "success",
    "FilesGenerated": 24,
    "TotalTokens": 45000,
    "CreditsConsumed": 142,
    "DurationSeconds": 180
  },
  "Timestamp": "2026-01-29T10:03:00Z"
}
```

### session:failed

```json
{
  "Type": "session:failed",
  "Data": {
    "SessionId": "sess_abc123",
    "ErrorCode": 16301,
    "ErrorMessage": "Maximum retry attempts exceeded",
    "FailedAtFile": "src/services/auth.go",
    "FilesCompleted": 18
  },
  "Timestamp": "2026-01-29T10:02:30Z"
}
```

---

## Phase Events

### phase:started

```json
{
  "Type": "phase:started",
  "Data": {
    "SessionId": "sess_abc123",
    "Phase": "writing",
    "PhaseNumber": 1,
    "TotalPhases": 3,
    "Description": "Code Writing Phase"
  },
  "Timestamp": "2026-01-29T10:00:05Z"
}
```

**Phase Values:**
- `writing` - Phase 1: Parallel code generation
- `consistency` - Phase 2: Cross-file validation
- `build` - Phase 3: Build verification

### phase:progress

```json
{
  "Type": "phase:progress",
  "Data": {
    "SessionId": "sess_abc123",
    "Phase": "writing",
    "CurrentBatch": 2,
    "TotalBatches": 5,
    "FilesInBatch": 4,
    "BatchProgressPercent": 75
  },
  "Timestamp": "2026-01-29T10:01:00Z"
}
```

### phase:completed

```json
{
  "Type": "phase:completed",
  "Data": {
    "SessionId": "sess_abc123",
    "Phase": "writing",
    "DurationSeconds": 120,
    "NextPhase": "consistency"
  },
  "Timestamp": "2026-01-29T10:02:00Z"
}
```

---

## File Events

### file:queued

```json
{
  "Type": "file:queued",
  "Data": {
    "SessionId": "sess_abc123",
    "FileId": "file_001",
    "FilePath": "src/models/user.go",
    "BatchNumber": 1,
    "DependsOn": []
  },
  "Timestamp": "2026-01-29T10:00:10Z"
}
```

### file:started

```json
{
  "Type": "file:started",
  "Data": {
    "SessionId": "sess_abc123",
    "FileId": "file_001",
    "FilePath": "src/models/user.go",
    "SpecReference": "05-data-models.md#user",
    "WorkerId": "worker_03"
  },
  "Timestamp": "2026-01-29T10:00:15Z"
}
```

### file:progress

```json
{
  "Type": "file:progress",
  "Data": {
    "SessionId": "sess_abc123",
    "FileId": "file_001",
    "FilePath": "src/models/user.go",
    "TokensGenerated": 450,
    "EstimatedTotalTokens": 800,
    "ProgressPercent": 56
  },
  "Timestamp": "2026-01-29T10:00:30Z"
}
```

### file:completed

```json
{
  "Type": "file:completed",
  "Data": {
    "SessionId": "sess_abc123",
    "FileId": "file_001",
    "FilePath": "src/models/user.go",
    "TokensUsed": 823,
    "LinesOfCode": 142,
    "DurationSeconds": 25
  },
  "Timestamp": "2026-01-29T10:00:40Z"
}
```

### file:failed

```json
{
  "Type": "file:failed",
  "Data": {
    "SessionId": "sess_abc123",
    "FileId": "file_001",
    "FilePath": "src/models/user.go",
    "ErrorCode": 16302,
    "ErrorMessage": "AI generation timeout",
    "RetryCount": 2,
    "WillRetry": true
  },
  "Timestamp": "2026-01-29T10:00:45Z"
}
```

---

## AI Token Events

### ai:token

Real-time token streaming from the LLM.

```json
{
  "Type": "ai:token",
  "Data": {
    "SessionId": "sess_abc123",
    "FileId": "file_001",
    "Delta": "func NewUser",
    "TokenIndex": 45
  },
  "Timestamp": "2026-01-29T10:00:20.123Z"
}
```

### ai:thinking

Emitted during model reasoning phases (if supported).

```json
{
  "Type": "ai:thinking",
  "Data": {
    "SessionId": "sess_abc123",
    "FileId": "file_001",
    "Status": "analyzing_dependencies"
  },
  "Timestamp": "2026-01-29T10:00:18Z"
}
```

### ai:stream_complete

```json
{
  "Type": "ai:stream_complete",
  "Data": {
    "SessionId": "sess_abc123",
    "FileId": "file_001",
    "TotalTokens": 823,
    "InputTokens": 1200,
    "OutputTokens": 823
  },
  "Timestamp": "2026-01-29T10:00:40Z"
}
```

---

## Build Events

### build:started

```json
{
  "Type": "build:started",
  "Data": {
    "SessionId": "sess_abc123",
    "BuildId": "build_789",
    "Command": "brun build",
    "Attempt": 1,
    "MaxAttempts": 3
  },
  "Timestamp": "2026-01-29T10:02:05Z"
}
```

### build:output

Streams build CLI output in real-time.

```json
{
  "Type": "build:output",
  "Data": {
    "SessionId": "sess_abc123",
    "BuildId": "build_789",
    "Stream": "stdout",
    "Line": "Compiling src/models/user.go...",
    "LineNumber": 15
  },
  "Timestamp": "2026-01-29T10:02:10Z"
}
```

### build:error_detected

```json
{
  "Type": "build:error_detected",
  "Data": {
    "SessionId": "sess_abc123",
    "BuildId": "build_789",
    "ErrorType": "compilation",
    "FilePath": "src/services/auth.go",
    "Line": 45,
    "Column": 12,
    "Message": "undefined: jwt.ParseToken",
    "Severity": "error"
  },
  "Timestamp": "2026-01-29T10:02:15Z"
}
```

### build:fix_started

Emitted when AI auto-fix loop begins.

```json
{
  "Type": "build:fix_started",
  "Data": {
    "SessionId": "sess_abc123",
    "BuildId": "build_789",
    "FixTier": 1,
    "ErrorsToFix": 3,
    "FilesAffected": ["src/services/auth.go", "src/utils/token.go"]
  },
  "Timestamp": "2026-01-29T10:02:20Z"
}
```

**Fix Tiers:**
- Tier 1: Syntax/import fixes
- Tier 2: Logic/type corrections
- Tier 3: Structural refactoring

### build:fix_applied

```json
{
  "Type": "build:fix_applied",
  "Data": {
    "SessionId": "sess_abc123",
    "BuildId": "build_789",
    "FilePath": "src/services/auth.go",
    "FixDescription": "Added missing import for jwt package",
    "LinesChanged": 2
  },
  "Timestamp": "2026-01-29T10:02:25Z"
}
```

### build:completed

```json
{
  "Type": "build:completed",
  "Data": {
    "SessionId": "sess_abc123",
    "BuildId": "build_789",
    "Status": "success",
    "AttemptsUsed": 2,
    "FixesApplied": 3,
    "DurationSeconds": 45
  },
  "Timestamp": "2026-01-29T10:02:50Z"
}
```

### build:failed

```json
{
  "Type": "build:failed",
  "Data": {
    "SessionId": "sess_abc123",
    "BuildId": "build_789",
    "Status": "failed",
    "AttemptsUsed": 3,
    "RemainingErrors": 2,
    "ErrorCode": 16501,
    "RequiresManualIntervention": true
  },
  "Timestamp": "2026-01-29T10:03:30Z"
}
```

---

## Consistency Events

### consistency:started

```json
{
  "Type": "consistency:started",
  "Data": {
    "SessionId": "sess_abc123",
    "FilesToCheck": 24,
    "CheckTypes": ["imports", "interfaces", "naming", "types"]
  },
  "Timestamp": "2026-01-29T10:01:45Z"
}
```

### consistency:issue_found

```json
{
  "Type": "consistency:issue_found",
  "Data": {
    "SessionId": "sess_abc123",
    "IssueId": "issue_001",
    "IssueType": "interface_mismatch",
    "Severity": "error",
    "FileA": "src/services/user.go",
    "FileB": "src/handlers/user.go",
    "Description": "Method signature mismatch: GetUser expects (string) but called with (int)",
    "AutoFixable": true
  },
  "Timestamp": "2026-01-29T10:01:50Z"
}
```

### consistency:fix_applied

```json
{
  "Type": "consistency:fix_applied",
  "Data": {
    "SessionId": "sess_abc123",
    "IssueId": "issue_001",
    "FilesModified": ["src/handlers/user.go"],
    "FixDescription": "Updated GetUser call to pass string ID"
  },
  "Timestamp": "2026-01-29T10:01:55Z"
}
```

### consistency:completed

```json
{
  "Type": "consistency:completed",
  "Data": {
    "SessionId": "sess_abc123",
    "IssuesFound": 5,
    "IssuesFixed": 4,
    "IssuesManual": 1,
    "DurationSeconds": 15
  },
  "Timestamp": "2026-01-29T10:02:00Z"
}
```

---

## Git Events

### git:commit_started

```json
{
  "Type": "git:commit_started",
  "Data": {
    "SessionId": "sess_abc123",
    "FilesToCommit": 24,
    "CommitMessage": "feat(codegen): Generate user management module\n\nSpec: 05-data-models.md, 06-user-service.md"
  },
  "Timestamp": "2026-01-29T10:03:05Z"
}
```

### git:commit_completed

```json
{
  "Type": "git:commit_completed",
  "Data": {
    "SessionId": "sess_abc123",
    "CommitHash": "a1b2c3d4",
    "Branch": "feature/user-module",
    "FilesCommitted": 24
  },
  "Timestamp": "2026-01-29T10:03:10Z"
}
```

### git:push_started

```json
{
  "Type": "git:push_started",
  "Data": {
    "SessionId": "sess_abc123",
    "Remote": "origin",
    "Branch": "feature/user-module",
    "Provider": "github"
  },
  "Timestamp": "2026-01-29T10:03:12Z"
}
```

### git:push_completed

```json
{
  "Type": "git:push_completed",
  "Data": {
    "SessionId": "sess_abc123",
    "RemoteUrl": "https://github.com/org/repo",
    "Branch": "feature/user-module",
    "CommitsPushed": 1
  },
  "Timestamp": "2026-01-29T10:03:18Z"
}
```

### git:push_failed

```json
{
  "Type": "git:push_failed",
  "Data": {
    "SessionId": "sess_abc123",
    "ErrorCode": 16401,
    "ErrorMessage": "Authentication failed: token expired",
    "RequiresReauth": true
  },
  "Timestamp": "2026-01-29T10:03:15Z"
}
```

---

## Credit Events

### credit:consumed

```json
{
  "Type": "credit:consumed",
  "Data": {
    "SessionId": "sess_abc123",
    "FileId": "file_001",
    "CreditsUsed": 6,
    "InputTokens": 1200,
    "OutputTokens": 823,
    "RunningTotal": 48
  },
  "Timestamp": "2026-01-29T10:00:40Z"
}
```

### credit:warning

```json
{
  "Type": "credit:warning",
  "Data": {
    "SessionId": "sess_abc123",
    "WarningType": "low_balance",
    "CurrentBalance": 25,
    "EstimatedRemainingCost": 50,
    "Message": "Credit balance may be insufficient to complete generation"
  },
  "Timestamp": "2026-01-29T10:01:30Z"
}
```

### credit:exhausted

```json
{
  "Type": "credit:exhausted",
  "Data": {
    "SessionId": "sess_abc123",
    "FinalBalance": 0,
    "FilesCompleted": 18,
    "FilesRemaining": 6,
    "SessionPaused": true
  },
  "Timestamp": "2026-01-29T10:01:45Z"
}
```

---

## Error Events

### error:recoverable

```json
{
  "Type": "error:recoverable",
  "Data": {
    "SessionId": "sess_abc123",
    "ErrorCode": 16303,
    "ErrorMessage": "Rate limit exceeded",
    "RetryAfterSeconds": 30,
    "AutoRetry": true
  },
  "Timestamp": "2026-01-29T10:01:00Z"
}
```

### error:fatal

```json
{
  "Type": "error:fatal",
  "Data": {
    "SessionId": "sess_abc123",
    "ErrorCode": 16304,
    "ErrorMessage": "AI provider unavailable",
    "SessionTerminated": true,
    "RecoverableState": true,
    "ResumeAvailable": true
  },
  "Timestamp": "2026-01-29T10:01:30Z"
}
```

---

## Client Events

Events sent from client to server.

### client:subscribe

```json
{
  "Type": "client:subscribe",
  "Data": {
    "SessionId": "sess_abc123",
    "EventFilters": ["file:*", "build:*", "error:*"]
  },
  "RequestId": "req_001"
}
```

### client:unsubscribe

```json
{
  "Type": "client:unsubscribe",
  "Data": {
    "SessionId": "sess_abc123"
  },
  "RequestId": "req_002"
}
```

### client:ping

```json
{
  "Type": "client:ping",
  "Data": {},
  "RequestId": "req_003"
}
```

**Server Response:**

```json
{
  "Type": "server:pong",
  "Data": {
    "ServerTime": "2026-01-29T10:00:00Z"
  },
  "RequestId": "req_003"
}
```

---

## Error Codes (WebSocket-Specific)

| Code | Constant | Description |
|------|----------|-------------|
| 16700 | `ErrWsConnectionFailed` | WebSocket connection failed |
| 16701 | `ErrWsAuthFailed` | Authentication rejected |
| 16702 | `ErrWsSessionNotFound` | Session ID not found |
| 16703 | `ErrWsInvalidMessage` | Malformed message format |
| 16704 | `ErrWsSubscriptionFailed` | Event subscription failed |
| 16705 | `ErrWsRateLimited` | Too many messages |
| 16706 | `ErrWsSessionExpired` | Session timed out |

---

## Connection Management

### Heartbeat

- Client sends `client:ping` every 30 seconds
- Server responds with `server:pong`
- Connection closed after 90 seconds of inactivity

### Reconnection

```json
{
  "Type": "client:reconnect",
  "Data": {
    "SessionId": "sess_abc123",
    "LastEventId": "evt_12345",
    "ReconnectToken": "recon_abc"
  }
}
```

**Server Response:**

```json
{
  "Type": "server:reconnect_ack",
  "Data": {
    "SessionId": "sess_abc123",
    "MissedEvents": 5,
    "ReplayFrom": "evt_12340"
  }
}
```

### Event Replay

Missed events are replayed in order after reconnection:

```json
{
  "Type": "server:replay",
  "Data": {
    "Events": [
      { "Type": "file:completed", "Data": {...}, "EventId": "evt_12341" },
      { "Type": "file:started", "Data": {...}, "EventId": "evt_12342" }
    ],
    "ReplayComplete": true
  }
}
```

---

## Rate Limits

| Event Type | Max Frequency |
|------------|---------------|
| `ai:token` | 100/second per session |
| `build:output` | 50/second per build |
| `file:progress` | 5/second per file |
| `client:ping` | 1/30 seconds |

---

## Frontend Integration

### TypeScript Types

```typescript
interface WSMessage<T = unknown> {
  Type: string;
  Data: T;
  RequestId?: string;
  Timestamp: string;
}

interface SessionStartedData {
  SessionId: string;
  ProjectId: string;
  PlanId: string;
  TotalFiles: number;
  TotalBatches: number;
  EstimatedCredits: number;
}

interface FileProgressData {
  SessionId: string;
  FileId: string;
  FilePath: string;
  TokensGenerated: number;
  EstimatedTotalTokens: number;
  ProgressPercent: number;
}

interface AITokenData {
  SessionId: string;
  FileId: string;
  Delta: string;
  TokenIndex: number;
}

// Event handler types
type WSEventHandler<T> = (data: T, message: WSMessage<T>) => void;
```

### React Hook Example

```typescript
const useCodeGenStream = (sessionId: string) => {
  const [status, setStatus] = useState<SessionStatus>('idle');
  const [files, setFiles] = useState<FileProgress[]>([]);
  const [tokens, setTokens] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    const ws = new WebSocket(`wss://${host}/ws/codegen`);
    
    ws.onopen = () => {
      ws.send(JSON.stringify({
        Type: 'client:subscribe',
        Data: { SessionId: sessionId }
      }));
    };

    ws.onmessage = (event) => {
      const msg: WSMessage = JSON.parse(event.data);
      
      switch (msg.Type) {
        case 'session:started':
          setStatus('running');
          break;
        case 'file:progress':
          updateFileProgress(msg.Data);
          break;
        case 'ai:token':
          appendToken(msg.Data.FileId, msg.Data.Delta);
          break;
        // ... handle other events
      }
    };

    return () => ws.close();
  }, [sessionId]);

  return { status, files, tokens };
};
```

---

## Related Specs

- [API Endpoints](./13-api-endpoints.md)
- [Parallel Executor](./05-parallel-executor.md)
- [Realtime Overview](../18-realtime/00-overview.md)
- [WebSocket Integration](../18-realtime/01-websocket-integration.md)

---

## Source Reference

New specification for Code Generation System WebSocket events.
