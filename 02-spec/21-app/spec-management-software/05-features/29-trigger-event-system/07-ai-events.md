# Specification: AI Events

**Version:** 1.0.0  
**Status:** Placeholder  
**Updated:** 2026-03-15  
**Parent:** [Trigger Event System](./00-overview.md)

---

## Purpose

Define AI operation event sources including completion lifecycle, streaming events, embedding creation, and token usage tracking.

---

## Scope

- AI completion start/finish/fail events
- Streaming chunk events
- Embedding creation events
- Token usage and cost tracking events
- Provider-specific event enrichment

---

## Event Names

| Event | Description |
|-------|-------------|
| `ai.completion.started` | AI completion request initiated |
| `ai.completion.finished` | AI completion returned successfully |
| `ai.completion.failed` | AI completion request failed |
| `ai.stream.started` | Streaming response begun |
| `ai.stream.chunk` | Streaming chunk received |
| `ai.stream.ended` | Streaming response completed |
| `ai.stream.error` | Streaming error occurred |
| `ai.embedding.created` | Embedding vector generated |
| `ai.token.usage` | Token usage recorded |

---

## Status

> **Placeholder** — This specification is planned but not yet fully authored. See [00-overview.md](./00-overview.md) for the full feature roadmap.

---

## Related Specs

- [Event Types](./01-event-types.md)
- [Event Bus](./02-event-bus.md)
