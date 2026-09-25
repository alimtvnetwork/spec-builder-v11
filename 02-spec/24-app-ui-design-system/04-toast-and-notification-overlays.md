# Toast and Notification Overlays — Sonner Queue & Ephemeral Feedback

> **Path:** `02-spec/24-app-ui-design-system/04-toast-and-notification-overlays.md`  
> **Status:** ACTIVE  
> **Target Component:** `src/components/notifications/ToastManager.tsx`  
> **Authority:** Single Source of Truth for Toast, Banner, and Ephemeral Notifications

---

## Architectural Purpose

This specification defines the application's toast notification architecture, queue management, and ephemeral user feedback overlays. It provides a lightweight, non-blocking toast stack powered by Sonner/Radix primitives, supporting success, error, warning, info, and promise-driven async progress toasts.

---

## Component Topology & File Locations

| Component | Destination Path | Purpose |
|---|---|---|
| `ToastProvider` | `src/components/notifications/ToastProvider.tsx` | Root context providing toast dispatching methods across the React tree |
| `ToastItem` | `src/components/notifications/ToastItem.tsx` | Individual toast card with auto-dismiss timer bar, icons, and action slots |
| `ToastQueueManager` | `src/components/notifications/ToastQueueManager.tsx` | Manages maximum concurrent toasts (default: 3), FIFO dismissal, and stacking |
| `toast-types.ts` | `src/components/notifications/toast-types.ts` | Centralized type contracts for toasts and ephemeral notifications |

---

## Data Contracts (`toast-types.ts`)

```typescript
export type ToastVariantType = 'Success' | 'Error' | 'Warning' | 'Info' | 'Loading';

export type ToastPositionType = 
  | 'TopLeft' 
  | 'TopCenter' 
  | 'TopRight' 
  | 'BottomLeft' 
  | 'BottomCenter' 
  | 'BottomRight';

export interface ToastActionConfig {
  label: string;
  onClick: () => void | Promise<void>;
}

export interface ToastItemData {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariantType;
  durationMs: number;
  hasCloseButton: boolean;
  action?: ToastActionConfig;
  cancelAction?: ToastActionConfig;
  createdAt: number;
}

export interface ToastPromiseOptions<T> {
  loading: string;
  success: string | ((data: T) => string);
  error: string | ((error: unknown) => string);
}

export interface ToastState {
  activeToasts: ToastItemData[];
  maxVisibleToasts: number;
  position: ToastPositionType;
  isPausedOnHover: boolean;
}
```

---

## Queue Management & Behavior Rules

1. **Stacking & Limits:**
   - Maximum 3 toasts visible simultaneously. Subsequent toasts wait in internal FIFO queue.
   - Newest toast appears at the top/bottom depending on `ToastPositionType`.
   - Hovering over any toast pauses the auto-dismiss timer for all visible toasts (`isPausedOnHover: true`).

2. **Duration Matrix:**
   - `Success`: 3,000ms duration.
   - `Info`: 4,000ms duration.
   - `Warning`: 5,000ms duration.
   - `Error`: 8,000ms duration (requires user attention; persistent until manual dismiss if specified).
   - `Loading`: Infinite duration until promise resolves or rejects.

3. **Promise Integration:**
   - Calling `toast.promise(promise, { loading, success, error })` creates an active loading toast.
   - Upon resolution: Morphs into `Success` variant and sets timer to 3,000ms.
   - Upon rejection: Morphs into `Error` variant and sets timer to 8,000ms.

4. **Accessibility (WCAG 2.1 AA):**
   - Role: `role="status"` for non-critical toasts, `role="alert"` for error toasts.
   - `aria-live="polite"` for informational messages; `aria-live="assertive"` for errors.

---

## Verification & Acceptance Criteria

```gherkin
Feature: Toast and Notification Overlays
  Scenario: Toast auto-dismisses after configured duration
    Given Toast dispatched with variant: "Success" and durationMs: 3000
    When 3000ms elapsed
    Then Toast is removed from activeToasts list

  Scenario: Toast pause on hover
    Given Active toast on screen
    When Pointer hovers over toast container
    Then Auto-dismiss countdown timer pauses
```
