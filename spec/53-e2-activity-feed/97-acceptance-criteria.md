# E2 Activity Feed — Acceptance Criteria

**Version:** 1.0.0  
**Last Updated:** 2026-03-20

---

## AC-01: Basic Feed Retrieval

- [ ] `GET /api/v1/activity` returns paginated activity entries
- [ ] Response uses standard response envelope with `Status`, `Attributes`, `Navigation`, `Results`
- [ ] Default limit is 50, max is 100
- [ ] Results sorted by `timestamp DESC`

## AC-02: Filtering

- [ ] `type` parameter filters entries by activity type
- [ ] `siteId` parameter filters entries to a single site
- [ ] `from`/`to` parameters filter entries by date range (ISO-8601)
- [ ] `search` parameter performs full-text search on `title`, `action`, `siteName`
- [ ] Combining multiple filters returns the intersection (AND logic)

## AC-03: Data Source Aggregation

- [ ] Publish sessions from Go SQLite appear as `type: "publish"`
- [ ] Snapshot events from WordPress appear as `type: "snapshot"`
- [ ] Plugin events from WordPress appear as `type: "plugin"`
- [ ] Connection events from Go appear as `type: "connection"`
- [ ] Config events from Go appear as `type: "config"`
- [ ] All timestamps normalized to UTC ISO-8601

## AC-04: Degraded Mode

- [ ] If a WordPress site times out (>5s), its entries are omitted without error
- [ ] `skippedSites` array in response attributes lists unreachable sites
- [ ] Go-local data is always returned even if all WP sites fail
- [ ] Response remains `200 OK` with partial data

## AC-05: Validation

- [ ] `from` > `to` returns 400 with error code `E2-005`
- [ ] `limit` outside 1–100 returns 400 with error code `E2-006`
- [ ] Negative `offset` returns 400 with error code `E2-006`
- [ ] Unknown `type` value returns 400 with error code `E2-007`

## AC-06: Performance

- [ ] Response cached for 30 seconds keyed by query parameters
- [ ] `siteId` filter limits fan-out to only the specified site
- [ ] Total response time < 6 seconds even with 20 connected sites (5s WP timeout + 1s overhead)

## AC-07: Frontend

- [ ] Activity timeline displays entries grouped by calendar date
- [ ] Filter bar allows filtering by type, site, date range, and search text
- [ ] Filters persist in URL search params
- [ ] Warning banner shown when `skippedSites` is non-empty
- [ ] Empty state displayed when no results match filters
- [ ] Responsive layout adapts for desktop, tablet, and mobile

---

## Cross-References

- [Endpoint Specification](./01-go-endpoint-spec.md)
- [Data Sources](./02-data-sources.md)
- [Frontend UI](./03-frontend-ui.md)
- [Error Handling](./04-error-handling.md)
