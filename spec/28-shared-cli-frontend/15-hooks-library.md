# Shared Frontend Hooks Library

**Version:** 3.0.0  
**Status:** Active  
**Updated:** 2026-03-09

---

## Overview

Reusable React hooks shared across all CLI frontends (GSearch, BRun, AI Bridge, Nexus Flow) and the Spec Management Software frontend. These hooks standardize cross-cutting concerns like input persistence, form state, status logging, and security.

---

## 1. `useLocalStorageForm`

### Purpose

Persist form draft data to `localStorage` with automatic debouncing and sensitive field exclusion. Restores state on mount; clears on successful submit.

### Signature

```typescript
function useLocalStorageForm<T extends Record<string, unknown>>(
  key: string,
  initialValue: T,
  options?: UseLocalStorageFormOptions<T>
): UseLocalStorageFormReturn<T>

interface UseLocalStorageFormOptions<T> {
  SensitiveFields?: (keyof T)[];
  DebounceMs?: number;          // Default: 500
  CrossTabSync?: boolean;       // Default: false
}

interface UseLocalStorageFormReturn<T> {
  Data: T;
  SetData: (value: T) => void;
  UpdateField: <K extends keyof T>(field: K, value: T[K]) => void;
  ClearStorage: () => void;
  IsDirty: boolean;
}
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `key` | `string` | ✅ | localStorage key (namespaced, e.g. `gsearch_add_site_form`) |
| `initialValue` | `T` | ✅ | Default form state |
| `options.SensitiveFields` | `(keyof T)[]` | ❌ | Fields stripped before saving (passwords, tokens, secrets) |
| `options.DebounceMs` | `number` | ❌ | Debounce delay in ms (default: 500) |
| `options.CrossTabSync` | `boolean` | ❌ | Listen to `StorageEvent` to sync across tabs (default: false) |

### Return Value

| Property | Type | Description |
|----------|------|-------------|
| `Data` | `T` | Current form state |
| `SetData` | `(value: T) => void` | Replace entire form state |
| `UpdateField` | `(field, value) => void` | Patch a single field (avoids spread boilerplate) |
| `ClearStorage` | `() => void` | Remove localStorage entry (call on successful submit) |
| `IsDirty` | `boolean` | `true` if current state differs from `initialValue` |

### Behavior

| Behavior | Detail |
|----------|--------|
| **Debounce** | Configurable delay (default 500ms) before writing to localStorage |
| **Sensitive field exclusion** | Fields matching `SensitiveFields` or auto-detected names are stripped before serialization |
| **Restore on mount** | Reads from localStorage; falls back to `initialValue` on parse error or missing key |
| **Clear on success** | Caller invokes `ClearStorage()` after successful form submission |
| **Unmount** | Pending debounced writes are **cancelled** (not flushed) to avoid writing stale data |
| **Quota exceeded** | `localStorage.setItem` failures (e.g. `QuotaExceededError`) are caught silently; hook continues to function with in-memory state only |
| **Cross-tab sync** | When `CrossTabSync: true`, listens to `window.addEventListener('storage')` and updates state if the same `key` is modified in another tab |

### Sensitive Field Auto-Detection

Fields are auto-excluded from localStorage if their name contains any of these substrings (case-**insensitive** match):

- `password`
- `token`
- `secret`
- `apikey`

This applies regardless of casing: `Password`, `userPassword`, `API_TOKEN`, `apiKey` are all caught.

### Usage Example

```tsx
function AddSiteForm() {
  const { Data, UpdateField, ClearStorage } = useLocalStorageForm(
    'gsearch_add_site_form',
    { Url: '', Username: '', Password: '', Description: '' },
    { SensitiveFields: ['Password'] }
  );

  const handleSubmit = async () => {
    await api.addSite(Data);
    ClearStorage();
    toast.success('Site added');
  };

  return (
    <form onSubmit={handleSubmit}>
      <Input
        value={Data.Url}
        onChange={(e) => UpdateField('Url', e.target.value)}
      />
      <PasswordInput
        value={Data.Password}
        onChange={(pw) => UpdateField('Password', pw)}
      />
      <Button type="submit">Add Site</Button>
    </form>
  );
}
```

---

## 2. `useStatusLog`

### Purpose

Manage a Map-based status log for multi-step operations (Test Connect, batch processing, scan progress). Enforces the **update-in-place** pattern from `05-ui-patterns.md` — status changes replace existing entries, never append duplicates.

### Signature

```typescript
function useStatusLog(): UseStatusLogReturn

interface StatusLogEntry {
  Id: string;
  Step: string;
  Status: 'pending' | 'running' | 'success' | 'error';
  Message: string;
  IsSpinning: boolean;
  Timestamp: Date;
}

interface UseStatusLogReturn {
  Logs: Map<string, StatusLogEntry>;
  LogsArray: StatusLogEntry[];           // Pre-converted for rendering
  UpdateStatus: (stepId: string, updates: Partial<Omit<StatusLogEntry, 'Id'>>) => void;
  ResetLogs: () => void;
  IsAnyRunning: boolean;                 // true if any entry has Status === ExecutionStatus.Running
  HasErrors: boolean;                    // true if any entry has Status === ExecutionStatus.Error
}
```

### Behavior

| Behavior | Detail |
|----------|--------|
| **Update-in-place** | `UpdateStatus` creates or updates the entry for `stepId` — never appends |
| **Auto-spin** | Setting `Status: 'running'` automatically sets `IsSpinning: true`; `'success'` or `'error'` sets it to `false` |
| **Timestamp** | Updated on every `UpdateStatus` call |
| **LogsArray** | Memoized `Array.from(Logs.values())` for direct use in JSX `.map()` |
| **Reset** | `ResetLogs()` clears all entries (e.g. before starting a new Test Connect run) |

### Usage Example

```tsx
function TestConnectPanel() {
  const { LogsArray, UpdateStatus, ResetLogs, IsAnyRunning, HasErrors } = useStatusLog();

  const runTest = async () => {
    ResetLogs();
    
    UpdateStatus('dns', { Step: 'DNS Resolution', Status: 'running', Message: 'Checking DNS...' });
    const dns = await checkDns();
    UpdateStatus('dns', { Status: dns.ok ? 'success' : 'error', Message: dns.message });

    UpdateStatus('ssl', { Step: 'SSL Certificate', Status: 'running', Message: 'Validating SSL...' });
    const ssl = await checkSsl();
    UpdateStatus('ssl', { Status: ssl.ok ? 'success' : 'error', Message: ssl.message });
  };

  return (
    <div>
      <Button onClick={runTest} disabled={IsAnyRunning}>Test Connect</Button>
      <StatusLogList logs={LogsArray} />
      {HasErrors && <Alert variant="destructive">Some checks failed</Alert>}
    </div>
  );
}
```

### Anti-Pattern (Enforced by Design)

The Map-based approach makes it impossible to accidentally append duplicates — the key constraint in `05-ui-patterns.md` §Status Log Components.

### Acceptance Criteria

- [ ] `UpdateStatus` creates new entries or updates existing ones by `stepId`
- [ ] `IsSpinning` auto-syncs with `Status` transitions
- [ ] `LogsArray` is memoized and re-renders only on Map changes
- [ ] `ResetLogs` clears all entries
- [ ] `IsAnyRunning` and `HasErrors` are derived correctly
- [ ] No duplicate entries can be created for the same `stepId`

---

## 3. Future Hooks (Planned)

| Hook | Purpose | Priority | Status |
|------|---------|----------|--------|
| `usePasswordField` | Encapsulate password state + clear-on-unmount + visibility toggle | High | Planned |
| `useConfirmDialog` | Standardize destructive-action confirmation modals across CLIs | High | Planned |
| `useAsyncAction` | Wrap async calls with `IsLoading` / `Error` / `IsSuccess` state | Medium | Planned |
| `usePagination` | Shared cursor/offset pagination state for list views | Medium | Planned |
| `useDebounce` | Generic debounce for search inputs and filters | Low | Planned |
| `useKeyboardShortcut` | Register/unregister keyboard shortcuts declaratively | Low | Planned |

---

## Security Constraints

| Rule | Rationale |
|------|-----------|
| Sensitive fields MUST NOT be written to localStorage | Prevents credential leakage via browser tools or XSS |
| Passwords MUST be cleared from React state on component unmount | Minimizes in-memory exposure window |
| All backend-stored credentials MUST use AES-256 encryption | See `spec/20-gsearch-cli/02-frontend/05-ui-patterns.md` §Password Storage |
| Quota errors MUST NOT crash the application | Graceful degradation to in-memory-only mode |

---

## Acceptance Criteria (Global)

- [ ] `useLocalStorageForm` persists non-sensitive fields with configurable debounce
- [ ] Sensitive fields are excluded from localStorage writes (explicit + auto-detected)
- [ ] Form state restores correctly on page reload
- [ ] `ClearStorage()` removes the localStorage entry
- [ ] `UpdateField` patches a single field without full-object spread
- [ ] `IsDirty` correctly tracks divergence from `initialValue`
- [ ] `QuotaExceededError` is caught silently
- [ ] Cross-tab sync works when enabled via `CrossTabSync: true`
- [ ] `useStatusLog` enforces update-in-place semantics
- [ ] All hooks are importable from shared package paths (`@/hooks/...`)

---

## Cross-References

| Reference | Location |
|-----------|----------|
| UI Patterns (canonical) | `spec/20-gsearch-cli/02-frontend/05-ui-patterns.md` |
| UI Patterns Memory | `.lovable/memories/technical/frontend-ui-patterns.md` |
| Shared CLI Frontend | `spec/28-shared-cli-frontend/00-overview.md` |

---

*v2.0.0 — Expanded `useLocalStorageForm` API (partial setter, quota handling, cross-tab sync), promoted `useStatusLog` to full spec, added 3 new planned hooks.*
