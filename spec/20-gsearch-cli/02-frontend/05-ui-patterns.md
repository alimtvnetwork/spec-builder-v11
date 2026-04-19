# GSearch CLI: Frontend UI Patterns

**Version:** 2.0.0  
**Status:** Active  
**Updated:** 2026-03-09

---

## Overview

Standard UI patterns and behaviors for the GSearch CLI React frontend.

---

## Modal Components

### Vertical Scrolling (Required)

All modals MUST support vertical scrolling when content exceeds viewport height.

```tsx
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";

export function ScrollableModal({ open, onOpenChange, children }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Modal Title</DialogTitle>
        </DialogHeader>
        
        {/* Scrollable content area */}
        <div className="flex-1 overflow-y-auto py-4 pr-2">
          {children}
        </div>
        
        <DialogFooter className="flex-shrink-0 border-t pt-4">
          <Button>Cancel</Button>
          <Button variant="default">Confirm</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

### Key Requirements

| Requirement | Implementation |
|-------------|----------------|
| Max height constraint | `max-h-[85vh]` or `max-h-[calc(100vh-4rem)]` |
| Flex container | `flex flex-col` on DialogContent |
| Scrollable body | `flex-1 overflow-y-auto` on content div |
| Fixed header/footer | `flex-shrink-0` on header and footer |

---

## Status Log Components

### Spinner Update Pattern

When displaying operation status with spinners (e.g., "Test Connect", batch processing), status updates MUST replace existing entries rather than appending new ones.

```tsx
interface StatusLog {
  Id: string;
  Step: string;
  Status: 'pending' | 'running' | 'success' | 'error';
  Message: string;
  IsSpinning: boolean;
  Timestamp: Date;
}

// State: Map keyed by step ID for O(1) updates
const [statusLogs, setStatusLogs] = useState<Map<string, StatusLog>>(new Map());

// Update existing status (CORRECT)
const updateStatus = (stepId: string, updates: Partial<StatusLog>) => {
  setStatusLogs(prev => {
    const updated = new Map(prev);
    const existing = updated.get(stepId) || { Id: stepId, Step: stepId, Status: 'pending', Message: '', IsSpinning: false, Timestamp: new Date() };
    updated.set(stepId, { ...existing, ...updates });
    return updated;
  });
};

// Usage in Test Connect flow
const testConnect = async () => {
  // Step 1: DNS Check
  updateStatus('dns', { Step: 'DNS Resolution', Status: 'running', IsSpinning: true, Message: 'Checking DNS...' });
  const dnsResult = await checkDns();
  updateStatus('dns', { Status: dnsResult.ok ? 'success' : 'error', IsSpinning: false, Message: dnsResult.message });

  // Step 2: SSL Check
  updateStatus('ssl', { Step: 'SSL Certificate', Status: 'running', IsSpinning: true, Message: 'Validating SSL...' });
  const sslResult = await checkSsl();
  updateStatus('ssl', { Status: sslResult.ok ? 'success' : 'error', IsSpinning: false, Message: sslResult.message });

  // Continue for each step...
};
```

### Status Log Display

```tsx
function StatusLogList({ logs }: { logs: Map<string, StatusLog> }) {
  return (
    <div className="space-y-2">
      {Array.from(logs.values()).map((log) => (
        <div key={log.Id} className="flex items-center gap-2 p-2 rounded bg-muted/50">
          {log.IsSpinning ? (
            <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
          ) : log.Status === ExecutionStatus.Success ? (
            <CheckCircle className="h-4 w-4 text-green-500" />
          ) : log.Status === ExecutionStatus.Error ? (
            <XCircle className="h-4 w-4 text-red-500" />
          ) : (
            <Circle className="h-4 w-4 text-muted-foreground" />
          )}
          <span className="font-medium">{log.Step}</span>
          <span className="text-muted-foreground text-sm">{log.Message}</span>
        </div>
      ))}
    </div>
  );
}
```

### Anti-Pattern (DO NOT USE)

```tsx
// WRONG: Appending creates duplicate entries
const [logs, setLogs] = useState<StatusLog[]>([]);
setLogs(prev => [...prev, { step: 'dns', status: 'success' }]); // Creates duplicates!
```

---

## Password Storage

### Security Requirements

| Requirement | Implementation |
|-------------|----------------|
| Never localStorage | Passwords MUST NOT be stored in localStorage |
| Session memory only | Keep in React state until form submission |
| Encrypt for DB | Use AES-256 encryption before backend storage |
| Mask in UI | Always `type="password"` with visibility toggle |
| Clear on unmount | Use useEffect cleanup to clear password state |

### Password Input Component

```tsx
function PasswordInput({ value, onChange, placeholder }) {
  const [showPassword, setShowPassword] = useState(false);
  
  // Clear password from memory on unmount
  useEffect(() => {
    return () => {
      onChange(''); // Clear on unmount
    };
  }, []);

  return (
    <div className="relative">
      <Input
        type={showPassword ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete="new-password"
      />
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="absolute right-2 top-1/2 -translate-y-1/2"
        onClick={() => setShowPassword(!showPassword)}
      >
        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </Button>
    </div>
  );
}
```

### Backend Storage

Passwords sent to backend MUST be encrypted before database storage:

```go
// Backend: Encrypt before storing
func (s *SiteService) SaveCredentials(siteId string, password string) error {
    encrypted, err := s.crypto.Encrypt(password)
    if err != nil {
        return err
    }
    return s.repo.UpdateCredentials(siteId, encrypted)
}
```

---

## Input Persistence (localStorage)

### When to Persist

| Persist | Do NOT Persist |
|---------|----------------|
| Form drafts | Passwords |
| Search queries | API keys/tokens |
| Filter preferences | Credit card data |
| UI state (collapsed panels) | Any sensitive PII |

### Implementation Hook

```tsx
// hooks/useLocalStorageForm.ts
import { useState, useEffect, useCallback } from 'react';
import { debounce } from 'lodash';

export function useLocalStorageForm<T>(
  key: string,
  initialValue: T,
  sensitiveFields: (keyof T)[] = []
): [T, (value: T) => void, () => void] {
  const [value, setValue] = useState<T>(() => {
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return initialValue;
      }
    }
    return initialValue;
  });

  // Debounced save to localStorage
  const saveToStorage = useCallback(
    debounce((data: T) => {
      // Strip sensitive fields before saving
      const safeData = { ...data };
      sensitiveFields.forEach((field) => {
        delete safeData[field];
      });
      localStorage.setItem(key, JSON.stringify(safeData));
    }, 500),
    [key, sensitiveFields]
  );

  useEffect(() => {
    saveToStorage(value);
  }, [value, saveToStorage]);

  // Clear storage (call on successful submit)
  const clearStorage = useCallback(() => {
    localStorage.removeItem(key);
  }, [key]);

  return [value, setValue, clearStorage];
}
```

### Usage Example

```tsx
function AddSiteForm() {
  const [formData, setFormData, clearStorage] = useLocalStorageForm(
    'gsearch_add_site_form',
    { Url: '', Username: '', Password: '', Description: '' },
    ['Password'] // Exclude password from localStorage
  );

  const handleSubmit = async () => {
    await api.addSite(formData);
    clearStorage(); // Clear localStorage on success
    toast.success('Site added successfully');
  };

  return (
    <form onSubmit={handleSubmit}>
      <Input
        value={formData.Url}
        onChange={(e) => setFormData({ ...formData, Url: e.target.value })}
        placeholder="https://example.com"
      />
      {/* Password field - NOT persisted */}
      <PasswordInput
        value={formData.Password}
        onChange={(password) => setFormData({ ...formData, Password: password })}
      />
      <Button type="submit">Add Site</Button>
    </form>
  );
}
```

---

## Cross-References

| Reference | Location |
|-----------|----------|
| CLI Framework | `../01-backend/01-cli-framework.md` |
| Frontend Standard | `.lovable/memories/technical/frontend-ui-patterns.md` |
| UI Patterns Memory | `.lovable/memories/frontend/ui-patterns.md` |
