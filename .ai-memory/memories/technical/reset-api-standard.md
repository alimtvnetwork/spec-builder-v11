# Memory: technical/reset-api-standard

**Updated:** 2026-02-02  
**Version:** 1.0.0  
**Spec Location:** `02-spec/06-split-db-architecture/02-reset-api-standard.md`

---

## Overview

All CLI tools implement a standardized 2-step reset API for safe data deletion.

---

## Flow

| Step | Endpoint | Purpose |
|------|----------|---------|
| 1 | `POST /api/v1/reset/request` | Returns ResetId + preview |
| 2 | `POST /api/v1/reset/confirm` | Executes with ResetId |
| Optional | `POST /api/v1/reset/cancel` | Cancels pending reset |

---

## TTL

- Confirmation window: **5 minutes**
- Configurable via: `reset.confirmationTtlMinutes` in seedable config

---

## Common Scopes

| Scope | Description |
|-------|-------------|
| `all` | Full system reset |
| `app` | Application-level (AI Bridge) |
| `cache` | Cache data only |

---

## Database Table

All CLIs must have `ResetRequests` table in root DB with:
- Id, Scope, RequestedAt, ExpiresAt, Status, AffectedItems (JSON)
