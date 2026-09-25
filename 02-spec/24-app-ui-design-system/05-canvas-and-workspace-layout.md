# Canvas and Workspace Layout — Split-Pane, Docks & Sweet Digs Tokens

> **Path:** `02-spec/24-app-ui-design-system/05-canvas-and-workspace-layout.md`  
> **Status:** ACTIVE  
> **Target Component:** `src/components/layout/WorkspaceCanvas.tsx`  
> **Authority:** Single Source of Truth for Canvas Layouts, Split Panes, and Theme Tokens

---

## Architectural Purpose

This specification governs the high-performance application workspace canvas, collapsible split-pane layouts, docking toolbars, and design system color tokens. It provides a fluid, responsive, desktop-first workspace capable of hosting multi-pane code editors, specification inspectors, and interactive visual previews.

---

## Component Topology & File Locations

| Component | Destination Path | Purpose |
|---|---|---|
| `WorkspaceCanvas` | `src/components/layout/WorkspaceCanvas.tsx` | Main outer flex layout hosting sidebar, main canvas, and inspector panels |
| `SplitPaneGroup` | `src/components/layout/SplitPaneGroup.tsx` | Container managing resizable child panes with persistent size ratios |
| `SplitPaneHandle` | `src/components/layout/SplitPaneHandle.tsx` | Draggable splitter bar with keyboard arrow key micro-adjustments |
| `DockToolbar` | `src/components/layout/DockToolbar.tsx` | Floating or docked tool tray for canvas zooming, view switches, and actions |
| `theme-tokens.ts` | `src/components/layout/theme-tokens.ts` | Sweet Digs design token palette (backgrounds, surfaces, borders, accents) |
| `canvas-types.ts` | `src/components/layout/canvas-types.ts` | Centralized type definitions for workspace layouts |

---

## Data Contracts (`canvas-types.ts`)

```typescript
export type PaneOrientationType = 'Horizontal' | 'Vertical';

export interface SplitPaneProps {
  id: string;
  orientation: PaneOrientationType;
  defaultSizes: number[];
  minSizes?: number[];
  maxSizes?: number[];
  isCollapsible?: boolean;
  onLayoutChange?: (sizes: number[]) => void;
  children: React.ReactNode[];
}

export interface CanvasViewState {
  zoomLevel: number;
  panOffsetX: number;
  panOffsetY: number;
  isGridVisible: boolean;
  isSnapToGridEnabled: boolean;
  activeInspectorPaneId: string | null;
}

export interface DesignTokens {
  backgroundCanvas: string;
  surfacePrimary: string;
  surfaceSecondary: string;
  surfaceOverlay: string;
  borderSubtle: string;
  borderStrong: string;
  accentPrimary: string;
  accentHover: string;
  accentMuted: string;
}
```

---

## Sweet Digs Design Tokens (`theme-tokens.ts`)

```typescript
export const SWEET_DIGS_TOKENS: DesignTokens = {
  backgroundCanvas: '#0F1117',
  surfacePrimary: '#161922',
  surfaceSecondary: '#1E2230',
  surfaceOverlay: '#252A3C',
  borderSubtle: '#2E354B',
  borderStrong: '#3D4663',
  accentPrimary: '#6366F1',
  accentHover: '#4F46E5',
  accentMuted: '#312E81',
};
```

---

## Layout Rules & Resize Semantics

1. **Splitter Drag Handling:**
   - Double-clicking a `SplitPaneHandle` toggles collapsing the adjacent pane.
   - During active drag, pointers are captured via `setPointerCapture` to maintain smooth dragging across iframe/canvas boundaries.
   - Layout ratios are persisted in `localStorage.getItem('workspace_split_sizes')`.

2. **Pan & Zoom Canvas Operations:**
   - `Ctrl + Wheel` / `Cmd + Wheel`: Scales canvas zoom level between `0.25x` and `3.0x`.
   - `Space + Drag` or Middle Click Drag: Pans canvas view coordinates (`panOffsetX`, `panOffsetY`).
   - `Ctrl + 0`: Resets zoom to `1.0x` and centers canvas viewport.

---

## Verification & Acceptance Criteria

```gherkin
Feature: Canvas and Workspace Layout
  Scenario: Double-clicking split handle collapses pane
    Given SplitPane rendered with default sizes [30, 70]
    When User double-clicks SplitPaneHandle
    Then First pane collapses to size 0
    And Remaining pane occupies size 100

  Scenario: Zoom reset accelerator centers canvas
    Given Canvas zoomed to 2.5x with offsets (100, 200)
    When User presses Ctrl+0
    Then Zoom level resets to 1.0
    And Offsets reset to (0, 0)
```
