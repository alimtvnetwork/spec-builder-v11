# Confirmation and Prompt Dialogs — Interaction Contracts & Destructive Alerts

> **Path:** `02-spec/24-app-ui-design-system/03-confirmation-and-prompt-dialogs.md`  
> **Status:** ACTIVE  
> **Target Component:** `src/components/dialogs/ConfirmationDialog.tsx`  
> **Authority:** Single Source of Truth for Confirmation, Prompt, and Destructive Alert Dialogs

---

## Architectural Purpose

This specification governs all confirmation prompts, destructive action warnings, and single-input text prompts across the application. It prevents accidental data loss, standardizes button hierarchies, enforces double-confirmation patterns for critical mutations, and provides accessible keyboard accelerators (e.g. `Enter` to confirm, `Esc` to cancel).

---

## Component Topology & File Locations

| Component | Destination Path | Purpose |
|---|---|---|
| `ConfirmationDialog` | `src/components/dialogs/ConfirmationDialog.tsx` | Standard binary confirmation dialog (Confirm / Cancel) |
| `DestructiveAlert` | `src/components/dialogs/DestructiveAlert.tsx` | High-risk confirmation dialog requiring matching string verification |
| `PromptDialog` | `src/components/dialogs/PromptDialog.tsx` | Single-field or multi-field prompt dialog with validation |
| `prompt-types.ts` | `src/components/dialogs/prompt-types.ts` | Centralized type contracts for confirmation and prompt dialogs |

---

## Data Contracts (`prompt-types.ts`)

```typescript
export type ConfirmVariantType = 'Default' | 'Destructive' | 'Warning' | 'Informative';

export interface ConfirmDialogProps {
  id: string;
  isOpen: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmVariantType;
  isPending?: boolean;
  hasAutoCancelTimer?: boolean;
  autoCancelTimeoutMs?: number;
}

export interface DestructiveAlertProps {
  id: string;
  isOpen: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
  title: string;
  warningMessage: string;
  verificationKeyword: string;
  verificationInputLabel?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isPending?: boolean;
}

export interface PromptDialogProps {
  id: string;
  isOpen: boolean;
  onSubmit: (value: string) => void | Promise<void>;
  onCancel: () => void;
  title: string;
  placeholder?: string;
  defaultValue?: string;
  validationRegex?: RegExp;
  validationErrorMessage?: string;
  isPending?: boolean;
}
```

---

## Safety & Interaction Patterns

1. **Destructive Guard Pattern:**
   - When `DestructiveAlert` opens, the primary confirmation button is initialized in `disabled: true` state.
   - User must type the exact `verificationKeyword` into the confirmation input field.
   - Case-sensitive equality check: `inputValue === verificationKeyword` enables the confirm button.
   - Visual emphasis: Red border accent, danger icon badge (`AlertTriangle`), and clear consequence description.

2. **Async Mutation Loading State:**
   - When user clicks confirm, `isPending: true` is set.
   - Confirm button displays a spinner and enters disabled state.
   - Cancel button and backdrop clicks are disabled during pending mutation (`isPending === true`).
   - On rejection: Display inline alert without dismissing dialog.
   - On resolution: Call `onCancel()` or close handler.

3. **Accessibility & Focus:**
   - Role: `role="alertdialog"`.
   - Focus defaults to the Cancel button by default to prevent accidental `Enter` triggering destructive actions.
   - In `PromptDialog`, focus defaults to the input field with text selected.

---

## Verification & Acceptance Criteria

```gherkin
Feature: Confirmation and Prompt Dialogs
  Scenario: Destructive alert requires exact keyword match before enabling confirm
    Given DestructiveAlert rendered with verificationKeyword: "DELETE"
    When User inputs "del"
    Then Confirm button remains disabled
    When User inputs "DELETE"
    Then Confirm button becomes enabled

  Scenario: Pending confirmation disables cancel and backdrop dismissal
    Given ConfirmationDialog rendered with isPending: true
    When User clicks backdrop or presses Escape
    Then Dialog remains open and does not dismiss
```
