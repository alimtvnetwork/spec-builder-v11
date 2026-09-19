# Specification: Pipeline Events

**Version:** 1.0.0  
**Status:** Placeholder  
**Updated:** 2026-03-15  
**Parent:** [Trigger Event System](./00-overview.md)

---

## Purpose

Define pipeline execution event sources including stage start/complete, block transitions, pipeline lifecycle, and failure events.

---

## Scope

- Pipeline lifecycle events (created, started, completed, failed, cancelled, paused)
- Stage lifecycle events (started, completed, failed, skipped, retrying, timeout)
- Block transition events
- Pipeline variable propagation in events

---

## Event Names

| Event | Description |
|-------|-------------|
| `pipeline.created` | Pipeline definition created |
| `pipeline.started` | Pipeline execution started |
| `pipeline.completed` | Pipeline execution completed |
| `pipeline.failed` | Pipeline execution failed |
| `pipeline.cancelled` | Pipeline execution cancelled |
| `pipeline.paused` | Pipeline execution paused |
| `stage.started` | Stage execution started |
| `stage.completed` | Stage execution completed |
| `stage.failed` | Stage execution failed |
| `stage.skipped` | Stage skipped |
| `stage.retrying` | Stage retry initiated |
| `stage.timeout` | Stage timed out |

---

## Status

> **Placeholder** — This specification is planned but not yet fully authored. See [00-overview.md](./00-overview.md) for the full feature roadmap.

---

## Related Specs

- [Event Types](./01-event-types.md)
- [Automation Pipeline](../27-automation-pipeline/00-overview.md)
