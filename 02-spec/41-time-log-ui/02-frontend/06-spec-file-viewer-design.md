# Spec File Viewer: Visual Design System

**Version:** 1.0.0  
**Updated:** 2026-04-03

---

## Overview

The Spec File Viewer uses a **category-driven color system** where every folder and file inherits visual cues from its parent module category. This creates instant visual differentiation across the 7 category types and reinforces information hierarchy through color, borders, and iconography.

---

## Category Color Mapping

Each category defines a complete color tuple used consistently across all view states:

| Category | Color Token | Left Border | Icon Tint | Hover Background |
|-----------|------------|-------------|-----------|-----------------|
| **Foundation** | `--info` (blue) | `border-l-info` | `text-info/70` | `bg-info/5` |
| **Core System** | `--primary` (blue) | `border-l-primary` | `text-primary/70` | `bg-primary/5` |
| **CLI Tool** | `--success` (green) | `border-l-success` | `text-success/70` | `bg-success/5` |
| **WordPress** | `--warning` (amber) | `border-l-warning` | `text-warning/70` | `bg-warning/5` |
| **Standards** | `--vscode-purple` | `border-l-[hsl(var(--vscode-purple))]` | Purple at 70% | Purple at 5% |
| **Utility** | `--vscode-yellow` | `border-l-[hsl(var(--vscode-yellow))]` | Yellow at 70% | Yellow at 5% |
| **Enforcement** | `--destructive` (red) | `border-l-destructive` | `text-destructive/70` | `bg-destructive/5` |

---

## Color Tuple Structure

```typescript
interface CategoryColorTuple {
  bg: string;        // Badge/chip background (token at 10% opacity)
  text: string;      // Text color (full token)
  label: string;     // Human-readable label
  border: string;    // Left border accent (2px solid)
  fileBg: string;    // Hover background for file rows (token at 5% opacity)
  iconColor: string; // File icon tint (token at 70% opacity)
}
```

---

## Visual Hierarchy Rules

### 1. Left Border Accents (2px)

Every interactive row uses a **2px left border** colored by its category:

- **Folder rows** (root list): Always visible, colored by category
- **File rows** (inside folder): Transparent by default, colored on hover and when selected
- **Folder header** (drill-down): Colored border on the path/description bar

### 2. Icon Coloring

- **Folder icons**: Full category color (100% opacity)
- **Chevron arrows**: Category color at 60% opacity
- **File icons (idle)**: Category color at 70% opacity
- **File icons (selected)**: Full category color
- **File count badge**: Category color at 60% opacity

### 3. Selected State

When a file is active/selected:

```
Background:  category token at 10% opacity
Text:        full category color
Left border: solid category color (2px)
Icon:        full category color
```

### 4. Hover State

When hovering an unselected file:

```
Background:  category token at 5% opacity
Text:        foreground (full)
Left border: transitions from transparent to category color
```

---

## Content Panel Integration

The right-side content panel also reflects the active category:

- **Breadcrumb header**: 2px left border in category color
- **Folder detail view**: Category-colored folder icon, path text, and BookOpen icon
- **File count badge**: Uses category `bg` and `text` instead of generic `info`

---

## Design Rationale

1. **Instant recognition**: Users can identify module type at a glance without reading category badges
2. **Subtle intensity**: Colors are applied at low opacity (5–10%) for backgrounds to avoid visual noise while maintaining clarity
3. **Consistent language**: The same color appears in folder rows, file items, badges, and the content panel — reinforcing category identity throughout the interaction flow
4. **Dark theme harmony**: All colors derive from the VS Code Dark+ palette tokens, ensuring proper contrast ratios

---

## Cross-References

| Reference | Location |
|-----------|----------|
| Component Library | `./02-component-library.md` |
| Dashboard Views | `./04-dashboard-views.md` |
| Color Tokens (CSS) | `src/index.css` `:root` block |
| Component Source | `src/components/dashboard/SpecFileViewer.tsx` |
