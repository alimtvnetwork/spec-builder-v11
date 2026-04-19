# Error Modal Specification


**Last Updated:** 2026-03-20  

> **Version:** 1.0.0  
> **Parent:** [00-overview.md](./00-overview.md)

---

## Summary

Unified error display component with copy support for debugging.

---

## Features

| Feature | Description |
|---------|-------------|
| Error Code | Display structured error code |
| Stack Trace | Full 40-frame stack trace |
| Copy All | One-click copy error details |
| Frontend Errors | Capture React errors (ErrorBoundary) |
| Backend Errors | Display server-side errors |
| Dismiss | Close modal, optionally don't show again |

---

## Error Data Structure

```typescript
interface ErrorDetails {
  code: number;                   // Structured error code
  message: string;                // Human-readable message
  details?: string;               // Additional details
  stack?: string[];               // Stack trace
  source: 'frontend' | 'backend'; // Error origin
  timestamp: string;              // When error occurred
  context?: Record<string, any>;  // Additional context
}
```

---

## UI Design

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              ⚠️ Error                              [X]  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Error Code: 7050                                                        │
│  ─────────────────────────────────────────────────────────────────────  │
│                                                                          │
│  Message:                                                                │
│  WebSocket connection failed                                             │
│                                                                          │
│  Details:                                                                │
│  Backend not responding on port 8080. Please ensure the server is       │
│  running and the port is not blocked by firewall.                       │
│                                                                          │
│  ─────────────────────────────────────────────────────────────────────  │
│                                                                          │
│  Stack Trace:                                                            │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │ at WebSocket.onError (websocket.ts:45)                              ││
│  │ at WebSocket.handleError (websocket.ts:32)                          ││
│  │ at useWebSocket.connect (useWebSocket.ts:28)                        ││
│  │ at App.useEffect (App.tsx:15)                                       ││
│  │ at React.renderWithHooks (react-dom.js:1234)                        ││
│  │ ...                                                                 ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                          │
│  Context:                                                                │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │ {                                                                   ││
│  │   "port": 8080,                                                     ││
│  │   "url": "ws://localhost:8080/ws",                                  ││
│  │   "attemptCount": 3                                                 ││
│  │ }                                                                   ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                          │
│  Timestamp: 2026-02-01T12:34:56.789Z                                    │
│  Source: frontend                                                        │
│                                                                          │
│  ─────────────────────────────────────────────────────────────────────  │
│                                                                          │
│  [Copy All] [Copy Stack Only] [Dismiss]                                  │
│                                                                          │
│  [ ] Don't show this error again                                        │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## React Component

```typescript
// components/common/ErrorModal.tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { useState } from 'react';
import { Copy } from 'lucide-react';

interface ErrorModalProps {
  error: ErrorDetails | null;
  onClose: () => void;
  onSuppress?: (code: number) => void;
}

export function ErrorModal({ error, onClose, onSuppress }: ErrorModalProps) {
  const [suppressFuture, setSuppressFuture] = useState(false);

  if (!error) return null;

  const copyAll = () => {
    const text = formatErrorForCopy(error);
    navigator.clipboard.writeText(text);
    toast.success('Error details copied to clipboard');
  };

  const copyStack = () => {
    if (error.stack) {
      navigator.clipboard.writeText(error.stack.join('\n'));
      toast.success('Stack trace copied to clipboard');
    }
  };

  const handleDismiss = () => {
    if (suppressFuture && onSuppress) {
      onSuppress(error.code);
    }
    onClose();
  };

  return (
    <Dialog open={!!error} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            ⚠️ Error
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-4">
            {/* Error Code */}
            <div>
              <span className="text-sm text-muted-foreground">Error Code:</span>
              <span className="ml-2 font-mono font-bold">{error.code}</span>
            </div>
            
            {/* Message */}
            <div>
              <span className="text-sm text-muted-foreground block mb-1">Message:</span>
              <p className="font-medium">{error.message}</p>
            </div>
            
            {/* Details */}
            {error.details && (
              <div>
                <span className="text-sm text-muted-foreground block mb-1">Details:</span>
                <p className="text-sm">{error.details}</p>
              </div>
            )}
            
            {/* Stack Trace */}
            {error.stack && error.stack.length > 0 && (
              <div>
                <span className="text-sm text-muted-foreground block mb-1">Stack Trace:</span>
                <pre className="bg-muted p-3 rounded text-xs font-mono overflow-x-auto">
                  {error.stack.join('\n')}
                </pre>
              </div>
            )}
            
            {/* Context */}
            {error.context && (
              <div>
                <span className="text-sm text-muted-foreground block mb-1">Context:</span>
                <pre className="bg-muted p-3 rounded text-xs font-mono overflow-x-auto">
                  {JSON.stringify(error.context, null, 2)}
                </pre>
              </div>
            )}
            
            {/* Metadata */}
            <div className="flex gap-4 text-xs text-muted-foreground">
              <span>Timestamp: {error.timestamp}</span>
              <span>Source: {error.source}</span>
            </div>
          </div>
        </ScrollArea>
        
        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center gap-2">
            <Checkbox
              id="suppress"
              checked={suppressFuture}
              onCheckedChange={(c) => setSuppressFuture(!!c)}
            />
            <label htmlFor="suppress" className="text-sm text-muted-foreground">
              Don't show this error again
            </label>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={copyAll}>
              <Copy className="w-4 h-4 mr-1" /> Copy All
            </Button>
            {error.stack && (
              <Button variant="outline" size="sm" onClick={copyStack}>
                Copy Stack
              </Button>
            )}
            <Button onClick={handleDismiss}>Dismiss</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function formatErrorForCopy(error: ErrorDetails): string {
  return `
Error Code: ${error.code}
Message: ${error.message}
Details: ${error.details || 'N/A'}
Timestamp: ${error.timestamp}
Source: ${error.source}

Stack Trace:
${error.stack?.join('\n') || 'N/A'}

Context:
${error.context ? JSON.stringify(error.context, null, 2) : 'N/A'}
`.trim();
}
```

---

## Error Boundary for React Errors

```typescript
// components/common/ErrorBoundary.tsx
import { Component, ReactNode } from 'react';
import { useErrorStore } from '@/stores/errorStore';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Report to error store
    const { addError } = useErrorStore.getState();
    addError({
      code: 7060, // Frontend error code
      message: error.message,
      details: 'An unexpected error occurred in the application',
      stack: error.stack?.split('\n') || [],
      source: 'frontend',
      timestamp: new Date().toISOString(),
      context: {
        componentStack: errorInfo.componentStack
      }
    });
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-8 text-center">
          <h2 className="text-xl font-bold text-destructive">Something went wrong</h2>
          <p className="text-muted-foreground mt-2">Please refresh the page or contact support</p>
        </div>
      );
    }

    return this.props.children;
  }
}
```

---

## Error Store (Zustand)

```typescript
// stores/errorStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ErrorState {
  currentError: ErrorDetails | null;
  errorHistory: ErrorDetails[];
  suppressedCodes: number[];
  addError: (error: ErrorDetails) => void;
  clearError: () => void;
  suppressCode: (code: number) => void;
}

export const useErrorStore = create<ErrorState>()(
  persist(
    (set, get) => ({
      currentError: null,
      errorHistory: [],
      suppressedCodes: [],
      
      addError: (error) => {
        const { suppressedCodes } = get();
        if (suppressedCodes.includes(error.code)) {
          console.warn(`Error ${error.code} suppressed:`, error.message);
          return;
        }
        
        set((state) => ({
          currentError: error,
          errorHistory: [error, ...state.errorHistory].slice(0, 50)
        }));
      },
      
      clearError: () => set({ currentError: null }),
      
      suppressCode: (code) => {
        set((state) => ({
          suppressedCodes: [...state.suppressedCodes, code]
        }));
      }
    }),
    {
      name: 'error-store',
      partialize: (state) => ({ suppressedCodes: state.suppressedCodes })
    }
  )
);
```

---

*Standard error modal for all CLI frontends.*
