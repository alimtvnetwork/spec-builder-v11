# Specification: Event Store

**Version:** 1.0.0  
**Status:** Placeholder  
**Updated:** 2026-03-15  
**Parent:** [Trigger Event System](./00-overview.md)

---

## Purpose

Define the persistence layer for events, including storage format, replay capabilities, retention policies, and query interfaces.

---

## Scope

- Event persistence and serialization
- Time-based and ID-based event replay
- Retention policies and archival
- Event store query API
- Compaction and cleanup strategies
- Snapshot support for state reconstruction

---

## Key Interfaces

```typescript
interface EventStore {
  append(event: TriggerEvent): Promise<StoredEvent>;
  query(filter: EventStoreQuery): Promise<StoredEvent[]>;
  replay(from: string, to?: string): AsyncIterable<StoredEvent>;
  compact(before: string): Promise<CompactionResult>;
  getRetentionPolicy(): RetentionPolicy;
}

interface StoredEvent {
  readonly sequenceNumber: number;
  readonly event: TriggerEvent;
  readonly storedAt: string;
  readonly partition: string;
}
```

---

## Status

> **Placeholder** — This specification is planned but not yet fully authored. See [00-overview.md](./00-overview.md) for the full feature roadmap.

---

## Related Specs

- [Event Bus](./02-event-bus.md)
- [Database Schema](./04-database-schema.md)
