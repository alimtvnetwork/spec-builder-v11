# Modal and Drawer Architecture — Slide-Overs & Responsive Sheets

> **Path:** `02-spec/24-app-ui-design-system/02-modal-and-drawer-architecture.md`  
> **Status:** ACTIVE  
> **Target Component:** `src/components/dialogs/DrawerContainer.tsx`  
> **Authority:** Single Source of Truth for Slide-Over Drawers & Responsive Sheet Panels

---

## Architectural Purpose

This specification defines slide-over drawers, sheet panels, and bottom-sheet modals for mobile and desktop canvas workflows. A blind AI agent executing this specification can implement responsive side-sheets, gesture-driven bottom sheets, and nested drawer stacks with deterministic focus management and accessibility attributes.

---

## Component Topology & File Locations

| Component | Destination Path | Purpose |
|---|---|---|
| `DrawerRoot` | `src/components/dialogs/DrawerRoot.tsx` | Slide-over drawer container supporting left, right, top, and bottom placements |
| `DrawerOverlay` | `src/components/dialogs/DrawerOverlay.tsx` | Translucent backdrop with swipe-to-dismiss gesture tracking and click-to-close |
| `DrawerContent` | `src/components/dialogs/DrawerContent.tsx` | Animated sliding panel with hardware-accelerated CSS transform transitions |
| `DrawerHandle` | `src/components/dialogs/DrawerHandle.tsx` | Visual drag indicator pill for mobile touch drag-down interaction |
| `DrawerHeader` | `src/components/dialogs/DrawerHeader.tsx` | Pinned drawer header with title, subtitle, and action controls |
| `DrawerBody` | `src/components/dialogs/DrawerBody.tsx` | Scrollable drawer content body with momentum touch scrolling |
| `DrawerFooter` | `src/components/dialogs/DrawerFooter.tsx` | Pinned bottom action bar with confirmation buttons |
| `drawer-types.ts` | `src/components/dialogs/drawer-types.ts` | Centralized type contracts for drawers and slide-overs |

---

## Data Contracts (`drawer-types.ts`)

```typescript
export type DrawerPlacementType = 'Left' | 'Right' | 'Top' | 'Bottom';

export type DrawerSizeType = 'Small' | 'Medium' | 'Large' | 'Full';

export interface DrawerProps {
  id: string;
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  placement?: DrawerPlacementType;
  size?: DrawerSizeType;
  hasBackdropClose?: boolean;
  hasEscapeClose?: boolean;
  hasDragHandle?: boolean;
  children: React.ReactNode;
}

export interface DrawerGestureState {
  isDragging: boolean;
  dragOffsetY: number;
  initialTouchY: number;
  isDismissThresholdReached: boolean;
}

export interface DrawerPlacementConfig {
  placement: DrawerPlacementType;
  enterAnimationClass: string;
  exitAnimationClass: string;
  defaultWidthClass: string;
  defaultHeightClass: string;
}
```

---

## State Machine, Gesture Handling & Transitions

1. **Placement Matrix:**
   - `Left`: Enters from `-100% translateX` to `0% translateX`. Width: 320px–480px.
   - `Right`: Enters from `100% translateX` to `0% translateX`. Width: 380px–640px.
   - `Bottom`: Mobile bottom sheet. Enters from `100% translateY` to `0% translateY`. Height: 40vh–90vh.
   - `Top`: Banner sheet notification. Enters from `-100% translateY` to `0% translateY`. Height: 240px.

2. **Drag & Swipe-to-Dismiss (Bottom Sheets):**
   - On `touchstart` / `pointerdown` on `DrawerHandle`: Set `isDragging: true` and record `initialTouchY`.
   - On `touchmove` / `pointermove`: If `deltaY > 0` (downward drag), set `dragOffsetY = deltaY` and apply `transform: translateY(${deltaY}px)`.
   - On `touchend` / `pointerup`: If `dragOffsetY > 150` or velocity exceeds threshold, trigger `onClose()`. Otherwise, spring animate back to `translateY(0px)`.

3. **Accessibility (WCAG 2.1 AA):**
   - Role: `role="dialog"` and `aria-modal="true"`.
   - Focus Trapping: Restricts Tab navigation inside drawer when `isOpen` is `true`.
   - Focus Restoration: Restores focus to trigger button upon close.

---

## Verification & Acceptance Criteria

```gherkin
Feature: Modal and Drawer Architecture
  Scenario: Right slide-over drawer animates smoothly and locks scroll
    Given Drawer rendered with placement: "Right" and isOpen: true
    When The DOM is mounted
    Then Drawer content has translate-x-0 class
    And Body overflow style is set to "hidden"

  Scenario: Dragging bottom sheet past threshold triggers close
    Given Bottom sheet rendered with isOpen: true
    When User drags handle downward past 150px
    Then onClose callback is invoked
    And Sheet slides out through bottom edge
```
