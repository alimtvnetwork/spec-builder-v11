# E2 Activity Feed — Error Handling

**Version:** 1.0.0  
**Last Updated:** 2026-03-20

---

## Overview

Error handling strategy for the activity feed, covering partial failures from WordPress fan-out, Go-local query errors, and frontend error states.

---

## Error Codes

| Code | Constant | Description |
|------|----------|-------------|
| E2-001 | `ErrActivityFetchFailed` | Go-local activity query failed |
| E2-002 | `ErrWPSiteTimeout` | WordPress site did not respond within 5s |
| E2-003 | `ErrWPSiteUnreachable` | WordPress site connection refused or DNS failure |
| E2-004 | `ErrWPSiteAuthFailed` | WordPress site rejected authentication |
| E2-005 | `ErrInvalidDateRange` | `from` date is after `to` date |
| E2-006 | `ErrInvalidPagination` | `limit` outside 1–100 or negative `offset` |
| E2-007 | `ErrInvalidActivityType` | Unrecognized activity type filter |

---

## Degraded Mode

The activity feed operates in **degraded mode** when one or more WordPress sites are unreachable. This is the expected behavior — partial results are better than no results.

### Rules

1. **Go-local data is always returned** — local SQLite queries do not depend on external services
2. **Failed WP sites are skipped** — their entries are omitted from the timeline
3. **Warnings array** is included in the response when sites are skipped:

```json
{
  "Attributes": {
    "skippedSites": [
      { "siteId": 2, "siteName": "Staging Site", "reason": "timeout", "code": "E2-002" },
      { "siteId": 5, "siteName": "Dev Site", "reason": "unreachable", "code": "E2-003" }
    ]
  }
}
```

4. **No client-facing error** is returned for individual WP failures — the response remains `200 OK`
5. **Full failure** (Go-local query fails) returns `500` with `E2-001`

### Frontend Warning Display

When `skippedSites` is present in the response:
- Show a subtle warning banner at the top of the timeline
- Message: "Some sites could not be reached. Activity from {N} site(s) may be missing."
- Expandable detail showing which sites and why

---

## Validation Errors

| Scenario | HTTP Status | Error Code |
|----------|------------|------------|
| `from` > `to` | 400 | E2-005 |
| `limit` < 1 or > 100 | 400 | E2-006 |
| `offset` < 0 | 400 | E2-006 |
| Unknown `type` value | 400 | E2-007 |
| All params valid | 200 | — |

---

## Logging

| Event | Level | Fields |
|-------|-------|--------|
| WP site timeout | `WARN` | `siteId`, `siteName`, `durationMs` |
| WP site unreachable | `WARN` | `siteId`, `siteName`, `error` |
| WP auth failure | `ERROR` | `siteId`, `siteName`, `httpStatus` |
| Go-local query failure | `ERROR` | `query`, `error` |
| Feed served (success) | `INFO` | `totalResults`, `skippedSites`, `durationMs` |

---

## Cross-References

- [Endpoint Specification](./01-go-endpoint-spec.md)
- [Error Code Registry](../03-error-manage/03-error-code-registry/02-registry.md)
