# Memory: technical/frontend-ui-patterns

**Updated:** 2026-02-04  
**Version:** 1.0.0  
**Status:** Active  
**Spec Location:** `spec/20-gsearch-cli/02-frontend/05-ui-patterns.md`

---

## Overview

Standardized UI/UX patterns for CLI frontends covering modal behavior, status logging, security, and input persistence.

---

## 1. Modal Vertical Scrolling

All modals MUST support vertical scrolling for large content:

```tsx
<DialogContent className="max-h-[85vh] flex flex-col">
  <DialogHeader>...</DialogHeader>
  <div className="flex-1 overflow-y-auto py-4">
    {/* Scrollable content */}
  </div>
  <DialogFooter>...</DialogFooter>
</DialogContent>
```

---

## 2. Status Log (Spinner) Pattern

Test Connect and similar flows MUST update existing entries:

```tsx
const [logs, setLogs] = useState<Map<string, StatusLog>>(new Map());

// Update existing log by ID
setLogs(prev => new Map(prev).set(stepId, { ...log, status: 'success' }));
```

**Never** append new log entries for status changes.

---

## 3. Password Security

| Rule | Implementation |
|------|----------------|
| **Never localStorage** | Passwords/tokens excluded |
| **Session memory only** | Clear on unmount |
| **Backend encryption** | AES-256 before DB storage |

---

## 4. Input Persistence

Use `useLocalStorageForm` hook pattern:

- Debounced save (500ms default)
- Exclude sensitive fields: `['Password', 'Token', 'Secret']`
- Clear on successful submit
- Restore on mount

---

## Related Files

- Spec: `spec/20-gsearch-cli/02-frontend/05-ui-patterns.md`
- Hooks: `spec/28-shared-cli-frontend/15-hooks-library.md`
