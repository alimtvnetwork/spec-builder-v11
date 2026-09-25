# Dialog UI — Component System & Interaction Architecture

> **Path:** `02-spec/24-app-ui-design-system/01-dialog-ui-component-system.md`  
> **Status:** ACTIVE  
> **Target Component:** `src/components/dialogs/DialogContainer.tsx`  
> **Authority:** Single Source of Truth for App Dialogs & Overlay Modals

---

## Architectural Purpose

This specification defines the universal dialog and overlay modal system for the application. A blind AI agent executing this specification has all required TypeScript contracts, state machine logic, accessibility requirements, and Sweet Digs token primitives to implement the system without ambiguity.

---

## Component Topology & File Locations

| Component | Destination Path | Purpose |
|---|---|---|
| `DialogRoot` | `src/components/dialogs/DialogRoot.tsx` | Context provider managing active dialog stacks and z-index ordering |
| `DialogOverlay` | `src/components/dialogs/DialogOverlay.tsx` | Backdrop with backdrop-blur, click-outside-to-dismiss, and body scroll-lock |
| `DialogContent` | `src/components/dialogs/DialogContent.tsx` | Accessible dialog surface with enter/exit transitions and focus trapping |
| `DialogHeader` | `src/components/dialogs/DialogHeader.tsx` | Title, subtitle, and close button layout |
| `DialogFooter` | `src/components/dialogs/DialogFooter.tsx` | Primary, secondary, and tertiary action button bars |
| `types.ts` | `src/components/dialogs/types.ts` | Centralized type definitions for all dialog variants |

---

## Data Contracts (`types.ts`)

```typescript
export type DialogVariantType = 'Default' | 'Destructive' | 'Informative' | 'Fullscreen';

export interface DialogProps {
  id: string;
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  variant?: DialogVariantType;
  hasBackdropClose?: boolean;
  hasEscapeClose?: boolean;
  children: React.ReactNode;
}

export interface DialogState {
  activeDialogId: string | null;
  dialogStack: string[];
  isLocked: boolean;
}

export interface DialogActionParams {
  label: string;
  onClick: () => void | Promise<void>;
  variant?: 'Primary' | 'Secondary' | 'Destructive' | 'Outline';
  isDisabled?: boolean;
  isPending?: boolean;
}
```

---

## State Machine & Keyboard Behavior

1. **Mounting:** When `isOpen` transitions to `true`:
   - Append `id` to `DialogState.dialogStack`.
   - Lock body scrolling by setting `document.body.style.overflow = 'hidden'`.
   - Trap keyboard focus inside `DialogContent` via `tabbable` DOM walker.
2. **Dismissal:** When user presses `Escape` or clicks `DialogOverlay` (if `hasBackdropClose` is `true`):
   - Trigger `onClose()`.
   - Restore focus to the initiating DOM element (`triggerRef`).
   - If `dialogStack` is empty, restore `document.body.style.overflow = ''`.
3. **Accessibility (WCAG 2.1 AA):**
   - Role: `role="dialog"` and `aria-modal="true"`.
   - Labeling: `aria-labelledby="{id}-title"` and `aria-describedby="{id}-description"`.

---

## Verification & Acceptance Criteria

```gherkin
Feature: Dialog UI Component System
  Scenario: Mounting a dialog traps focus and disables body scroll
    Given Dialog component rendered with isOpen: true
    When The DOM is inspected
    Then Body overflow style is set to "hidden"
    And Tab key cycles focus strictly within DialogContent children

  Scenario: Pressing Escape closes top-most dialog
    Given Multiple dialogs in activeDialogStack
    When User presses Escape key
    Then onClose callback fires for the top-most dialog only
```
