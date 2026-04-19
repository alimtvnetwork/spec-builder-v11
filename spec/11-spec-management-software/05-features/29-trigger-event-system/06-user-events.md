# Specification: User Events

**Version:** 1.0.0  
**Status:** Placeholder  
**Updated:** 2026-03-15  
**Parent:** [Trigger Event System](./00-overview.md)

---

## Purpose

Define user and authentication event sources including login, logout, session management, and user action tracking.

---

## Scope

- Authentication event emission (login, logout, session lifecycle)
- User action tracking events
- Preference change events
- Session expiry and renewal events

---

## Event Names

| Event | Description |
|-------|-------------|
| `user.login` | User authenticated successfully |
| `user.logout` | User session terminated |
| `user.session.created` | New session established |
| `user.session.expired` | Session expired |
| `user.action` | User performed a tracked action |
| `user.preference.changed` | User preferences updated |

---

## Status

> **Placeholder** — This specification is planned but not yet fully authored. See [00-overview.md](./00-overview.md) for the full feature roadmap.

---

## Related Specs

- [Event Types](./01-event-types.md)
- [Event Bus](./02-event-bus.md)
