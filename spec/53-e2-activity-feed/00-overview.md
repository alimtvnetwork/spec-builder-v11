# E2 Activity Feed

**Version:** 2.1.0  
**Status:** Active  
**Updated:** 2026-03-30  
**AI Confidence:** High  
**Ambiguity:** Low

---

## Keywords

`activity-feed` · `event-aggregation` · `timeline` · `golang` · `wordpress` · `filtering` · `pagination` · `real-time`

---

## Scoring

| Metric | Value |
|--------|-------|
| AI Confidence | High |
| Ambiguity | Low |
| Health Score | 100/100 (A+) |

---

## Purpose

Unified activity feed that aggregates events from Go backend services and WordPress sites into a single, filterable, paginated timeline. Supports publish sessions, snapshot events, plugin lifecycle, connection status, and configuration changes.

---

## Document Inventory

| # | File | Description |
|---|------|-------------|
| 01 | `01-go-endpoint-spec.md` | REST endpoint definition, query parameters, response schema |
| 02 | `02-data-sources.md` | Aggregation sources, normalization, and fan-out strategy |
| 03 | `03-frontend-ui.md` | React component hierarchy, filters, responsive layout, accessibility |
| 04 | `04-error-handling.md` | Error codes (E2-001 to E2-007), degraded mode, logging |
| 05 | `97-acceptance-criteria.md` | Testable acceptance criteria for all features |
| 06 | `98-changelog.md` | Version history and milestones |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────┐
│                 React Frontend                   │
│  ActivityFeed → FilterBar → TimelineList         │
└────────────────────┬────────────────────────────┘
                     │ GET /api/v1/activity
┌────────────────────▼────────────────────────────┐
│              Go Activity Handler                 │
│         ActivityService.GetFeed(params)           │
└──────┬──────────┬──────────┬────────────────────┘
       │          │          │
  ┌────▼───┐ ┌───▼────┐ ┌───▼────────┐
  │ SQLite │ │  WP    │ │  WP        │
  │ Local  │ │ Site 1 │ │ Site N     │
  │ Events │ │ Events │ │ Events     │
  └────────┘ └────────┘ └────────────┘
```

---

## Cross-References

| Spec | Relationship |
|------|-------------|
| `spec/30-wp-plugin/` | WordPress endpoint dependencies |
| `spec/20-gsearch-cli/01-backend/48-unified-rest-api.md` | Response envelope standard |
| `spec/11-spec-management-software/05-features/29-trigger-event-system/` | Trigger event integration |
