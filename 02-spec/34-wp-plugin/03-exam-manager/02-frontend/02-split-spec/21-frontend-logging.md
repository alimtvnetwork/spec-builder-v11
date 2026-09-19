# 21. Frontend Logging


**Version:** 1.0.0  
**Last Updated:** 2026-03-20  

## Overview
Client-side event logging via API calls to backend for analytics and debugging.

---

## 21.1 Logging Architecture

- **Endpoint**: `POST /api/log-event`
- **Pattern**: Fire-and-forget (non-blocking)
- **Storage**: Backend writes to `/logs/plugin.log`

---

## 21.2 Event Payload

```json
{
  "ExamId": 5,
  "ParticipantId": 12,
  "SessionId": "abc123",
  "Action": "sectionMarkedDone",
  "Details": { "SectionNumber": 3 },
  "Timestamp": "2026-01-25T13:24:00Z"
}
```

---

## 21.3 Logged Events

| Event | Trigger |
|-------|---------|
| `pageView` | Page navigation |
| `signupSuccess/Failed` | Signup form |
| `loginSuccess/Failed` | Login form |
| `sectionMarkedDone` | Section completion |
| `extensionRequested` | Extension form |
| `networkError` | API failure |

---

## 21.4 Acceptance Criteria

- [ ] All user actions logged
- [ ] Logging never blocks UI
- [ ] Failed logs silently ignored
