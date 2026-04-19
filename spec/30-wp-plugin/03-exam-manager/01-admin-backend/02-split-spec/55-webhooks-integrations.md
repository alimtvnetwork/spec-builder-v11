# 55. Webhooks & External Integrations


**Version:** 1.0.0  
**Last Updated:** 2026-03-20  

## Overview
Webhook system for real-time event notifications to external systems, enabling integrations with LMS, CRM, and automation platforms.

---

## 55.1 Webhook Architecture

### Event-Driven Design
```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│ Plugin      │────▶│ Event Queue  │────▶│ Webhook Worker  │
│ Event       │     │ (database)   │     │ (cron-based)    │
└─────────────┘     └──────────────┘     └────────┬────────┘
                                                  │
                                         ┌────────▼────────┐
                                         │ External System │
                                         │ (LMS, Zapier)   │
                                         └─────────────────┘
```

### Delivery Guarantees
- **At-least-once delivery**: Retries on failure
- **Retry policy**: 3 attempts with exponential backoff
- **Backoff intervals**: 1 min, 5 min, 30 min
- **Timeout**: 10 seconds per request
- **Dead letter queue**: After 3 failures, move to failed queue

---

## 55.2 Webhook Events

### Participant Events
| Event | Trigger | Payload |
|-------|---------|---------|
| `participant.registered` | New signup completed | participant, exam |
| `participant.status_changed` | Status transition | participant, oldStatus, newStatus |
| `participant.completed` | Exam completed | participant, exam, completedAt |
| `participant.locked` | Deadline passed, locked | participant, exam, reason |
| `participant.extended` | Extension granted | participant, exam, newDeadline |

### Exam Events
| Event | Trigger | Payload |
|-------|---------|---------|
| `exam.created` | New exam created | exam |
| `exam.updated` | Exam metadata changed | exam, changedFields |
| `exam.published` | Visibility set to public | exam |
| `exam.unpublished` | Visibility set to private | exam |

### Submission Events
| Event | Trigger | Payload |
|-------|---------|---------|
| `submission.received` | New submission uploaded | submission, participant |
| `submission.approved` | Admin approved | submission, reviewer |
| `submission.rejected` | Admin rejected | submission, reviewer, feedback |

### Admin Events
| Event | Trigger | Payload |
|-------|---------|---------|
| `extension.requested` | Participant requests | request, participant |
| `extension.decided` | Admin approves/denies | request, decision, decidedBy |

---

## 55.3 Webhook Payload Structure

### Standard Envelope
```json
{
  "Id": "evt_abc123xyz",
  "Event": "participant.completed",
  "Timestamp": "2026-01-25T13:00:00Z",
  "Version": "1.0",
  "Data": {
    // Event-specific payload
  },
  "Metadata": {
    "WebhookId": "wh_123",
    "Attempt": 1,
    "MaxAttempts": 3
  }
}
```

### Example: participant.completed
```json
{
  "Id": "evt_abc123xyz",
  "Event": "participant.completed",
  "Timestamp": "2026-01-25T13:00:00Z",
  "Version": "1.0",
  "Data": {
    "Participant": {
      "Id": 42,
      "Name": "John Doe",
      "Email": "john@example.com"
    },
    "Exam": {
      "Id": 5,
      "Title": "Advanced Exam",
      "Slug": "advanced-exam"
    },
    "Progress": 100,
    "CompletedAt": "2026-01-25T13:00:00Z"
  }
}
```

---

## 55.4 Webhook Configuration

### Admin UI: Webhook Management
```
┌─────────────────────────────────────────────────────────────┐
│  Webhooks                                     [+ Add New]   │
│  ────────────────────────────────────────────────────────── │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ 🟢 LMS Integration                                     │ │
│  │    URL: https://lms.example.com/api/webhook            │ │
│  │    Events: participant.completed, participant.locked   │ │
│  │    Last delivery: 5 min ago (200 OK)                   │ │
│  │    [Edit] [Test] [Delete]                              │ │
│  └───────────────────────────────────────────────────────┘ │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ 🟡 Zapier Hook                                         │ │
│  │    URL: https://hooks.zapier.com/catch/...             │ │
│  │    Events: All                                         │ │
│  │    Last delivery: 2 hours ago (failed, retrying)       │ │
│  │    [Edit] [Test] [Delete]                              │ │
│  └───────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Webhook Configuration Fields
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `Name` | string | Yes | Display name |
| `Url` | URL | Yes | HTTPS endpoint |
| `Secret` | string | Yes | HMAC signing key |
| `Events` | array | Yes | Subscribed events |
| `IsActive` | boolean | Yes | Enable/disable |
| `Headers` | object | No | Custom HTTP headers |
| `ExamFilter` | array | No | Limit to specific exams |

---

## 55.5 Webhook Security

### Signature Verification
All webhooks include HMAC-SHA256 signature:

**Header:** `X-EQM-Signature`

**Signature calculation:**
```
signature = HMAC-SHA256(webhook_secret, raw_body)
```

**Verification example (receiving end):**
```javascript
const crypto = require('crypto');
const expectedSignature = crypto
  .createHmac('sha256', webhookSecret)
  .update(rawBody)
  .digest('hex');
const isValid = crypto.timingSafeEqual(
  Buffer.from(receivedSignature),
  Buffer.from(expectedSignature)
);
```

### Additional Headers
| Header | Value |
|--------|-------|
| `X-EQM-Event` | Event type |
| `X-EQM-Delivery` | Unique delivery ID |
| `X-EQM-Timestamp` | Unix timestamp |
| `User-Agent` | `EQM-Webhook/1.0` |
| `Content-Type` | `application/json` |

---

## 55.6 Webhook Database Schema

### Table: `eqm_webhook_config`
| Field | Type | Description |
|-------|------|-------------|
| `Id` | INT | Primary key |
| `Name` | VARCHAR(100) | Display name |
| `Url` | VARCHAR(500) | Endpoint URL |
| `Secret` | VARCHAR(255) | HMAC secret (encrypted) |
| `Events` | JSON | Subscribed event types |
| `Headers` | JSON | Custom headers |
| `ExamFilter` | JSON | Exam ID filter (null = all) |
| `IsActive` | BOOLEAN | Enabled status |
| `CreatedAt` | DATETIME | Creation time |
| `UpdatedAt` | DATETIME | Last update |

### Table: `eqm_webhook_delivery`
| Field | Type | Description |
|-------|------|-------------|
| `Id` | INT | Primary key |
| `WebhookId` | INT | FK to webhook_config |
| `EventType` | VARCHAR(50) | Event name |
| `EventId` | VARCHAR(50) | Unique event ID |
| `Payload` | JSON | Full payload sent |
| `Status` | ENUM | pending, delivered, failed |
| `Attempt` | INT | Current attempt number |
| `ResponseCode` | INT | HTTP response code |
| `ResponseBody` | TEXT | Response body (truncated) |
| `NextRetryAt` | DATETIME | Next retry time |
| `DeliveredAt` | DATETIME | Successful delivery time |
| `CreatedAt` | DATETIME | Event creation time |

---

## 55.7 Retry Logic

### Exponential Backoff
| Attempt | Delay | Cumulative Wait |
|---------|-------|-----------------|
| 1 | Immediate | 0 |
| 2 | 1 minute | 1 min |
| 3 | 5 minutes | 6 min |
| 4 | 30 minutes | 36 min |
| (fail) | Move to dead letter | - |

### Retry Conditions
**Retry on:**
- HTTP 5xx responses
- Connection timeout
- DNS resolution failure

**Do NOT retry on:**
- HTTP 4xx responses (except 429)
- Invalid response format
- SSL certificate errors

### Rate Limit Handling (429)
- Read `Retry-After` header
- Wait specified duration
- Count as attempt only after retry

---

## 55.8 Integration Examples

### Zapier Integration
1. Create webhook with Zapier catch URL
2. Subscribe to desired events
3. In Zapier: parse JSON webhook data
4. Trigger downstream actions (Sheets, Slack, etc.)

### LMS Integration (Moodle, Canvas)
1. Configure webhook with LMS API endpoint
2. Subscribe to `participant.completed`
3. LMS receives completion data
4. LMS updates grade book

### Slack Notifications
1. Create Slack incoming webhook
2. Subscribe to `extension.requested`
3. Admin channel receives notification
4. Quick action links in message

---

## 55.9 Common Pitfalls

### ❌ Anti-Patterns
- Storing webhook secret in plain text
- Not validating SSL certificates
- Blocking main request for webhook delivery
- No timeout on webhook requests
- Logging full payload (may contain PII)
- Not rate limiting webhook generation

### ✅ Best Practices
- Encrypt secrets at rest
- Use async/queue for delivery
- Implement circuit breaker for failing endpoints
- Truncate response body in logs
- Allow disabling per-webhook during issues
- Provide "Test" button for verification
- Include timestamp in signature calculation (prevent replay)

---

## 55.10 Acceptance Criteria

### Configuration
- [ ] Webhooks configurable via Admin UI
- [ ] HTTPS required for webhook URLs
- [ ] Secret auto-generated if not provided
- [ ] Events selectable per webhook
- [ ] Exam filter optional

### Delivery
- [ ] Events queued, not blocking
- [ ] Retries follow exponential backoff
- [ ] Failed deliveries in dead letter queue
- [ ] Delivery status visible in UI
- [ ] Test webhook button works

### Security
- [ ] Signature included in all deliveries
- [ ] Secrets encrypted in database
- [ ] PII not logged in webhook logs
- [ ] Rate limiting on webhook creation

---

## Related Specifications

| Topic | Spec |
|-------|------|
| Audit Logging | [46-audit-logging.md](46-audit-logging.md) |
| Cron System | [34-cron-system.md](34-cron-system.md) |
| Email Queue (similar pattern) | [31-email-queue.md](31-email-queue.md) |
| REST API | [36-rest-api-endpoints.md](36-rest-api-endpoints.md) |
