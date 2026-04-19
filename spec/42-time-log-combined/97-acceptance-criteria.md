# Time Log Combined — Acceptance Criteria

**Version:** 1.0.0  
**Last Updated:** 2026-03-30

---

## Overview

This module aggregates acceptance criteria from the Time Log CLI and Time Log UI. The full 214-criteria breakdown is in `00-acceptance-criteria-summary.md`. This file defines the cross-module integration criteria.

---

## AC-01: Cross-Module Integration

| # | Criterion | Source |
|---|-----------|--------|
| AC-001 | CLI API responses conform to the data contracts consumed by the UI | `../40-time-log-cli/01-backend/06-api-interface.md` |
| AC-002 | UI dashboards display all activity types tracked by the CLI backend | `../41-time-log-ui/00-overview.md` |
| AC-003 | Remote sync data from CLI is correctly rendered in UI timeline views | `../40-time-log-cli/01-backend/09-remote-sync.md` |

---

## AC-02: Data Consistency

| # | Criterion | Source |
|---|-----------|--------|
| AC-004 | Time slice productivity scores from CLI match UI visualization ranges | `../40-time-log-cli/01-backend/11-time-slice-productivity.md` |
| AC-005 | Screenshot metadata from CLI is resolvable by UI gallery component | `../40-time-log-cli/01-backend/04-screenshot-capture.md` |
| AC-006 | Browser tracking data from CLI populates UI domain analysis charts | `../40-time-log-cli/01-backend/03-browser-tracking.md` |

---

## Cross-References

- [Overview](./00-overview.md)
- [Acceptance Criteria Summary](./00-acceptance-criteria-summary.md)
- [Time Log CLI](../40-time-log-cli/00-overview.md)
- [Time Log UI](../41-time-log-ui/00-overview.md)
