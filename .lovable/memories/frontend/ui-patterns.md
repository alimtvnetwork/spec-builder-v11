# Memory: frontend/ui-patterns

**Updated:** 2026-02-03
**Version:** 1.0.0  

---

## Summary

Standard UI patterns for all CLI frontend applications (GSearch, AI Bridge, AI Transcribe, WP SEO Publish).

---

## Modal Behavior

- **Vertical Scroll:** All modals MUST support vertical scrolling when content exceeds viewport height
- **Max Height:** Use `max-h-[80vh]` or similar constraint with `overflow-y-auto` on content area
- **Fixed Header/Footer:** Modal header and action buttons should remain fixed while body scrolls

```tsx
<DialogContent className="max-h-[85vh] flex flex-col">
  <DialogHeader className="flex-shrink-0">...</DialogHeader>
  <div className="flex-1 overflow-y-auto">
    {/* Scrollable content */}
  </div>
  <DialogFooter className="flex-shrink-0">...</DialogFooter>
</DialogContent>
```

---

## Status Log Updates (Spinner Pattern)

When displaying status logs with spinners (e.g., "Test Connect"), updates MUST replace existing spinner items rather than appending.

### Correct Pattern

```tsx
// Use a Map or object keyed by step ID
const [statusLogs, setStatusLogs] = useState<Map<string, StatusLog>>(new Map());

// Update existing entry, don't append
setStatusLogs(prev => {
  const updated = new Map(prev);
  updated.set(stepId, { ...updated.get(stepId), status: 'success', isSpinning: false });
  return updated;
});
```

### Incorrect Pattern

```tsx
// DON'T append new entries for same step
setLogs(prev => [...prev, newLogEntry]); // WRONG
```

---

## Password Storage

Passwords and sensitive credentials MUST follow this hierarchy:

| Storage | Use Case |
|---------|----------|
| Backend encrypted DB | Production credentials (WordPress, API keys) |
| Supabase secrets | API keys for edge functions |
| Session only | Never persist passwords in localStorage |

### Rules

1. **Never store passwords in localStorage** - use session memory only
2. **Encrypt before DB storage** - use AES-256 or platform encryption
3. **Mask in UI** - always use `type="password"` and show masked dots
4. **Clear on logout** - wipe from memory immediately

---

## Input Persistence (localStorage)

All non-sensitive input fields SHOULD persist to localStorage for UX continuity.

### Implementation Pattern

```tsx
const STORAGE_KEY = 'gsearch_add_site_form';

// Load on mount
useEffect(() => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) setFormData(JSON.parse(saved));
}, []);

// Save on change (debounced)
useEffect(() => {
  const timer = setTimeout(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
  }, 500);
  return () => clearTimeout(timer);
}, [formData]);

// Clear on successful submit
const handleSubmit = async () => {
  await submitForm();
  localStorage.removeItem(STORAGE_KEY);
};
```

### Exclusions (Never Persist)

- Passwords
- API keys/tokens
- Credit card numbers
- Any PII marked as sensitive

---

## Cross-References

- Frontend Standard: `.lovable/memories/technical/cli-frontend-standard.md`
- Separate CLI Pattern: `.lovable/memories/architecture/separate-cli-frontend-pattern.md`
