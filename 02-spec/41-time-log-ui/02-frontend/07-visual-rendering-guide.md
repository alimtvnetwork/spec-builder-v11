# Feature: Visual Rendering & Component Guide

**Version:** 1.1.0  
**Updated:** 2026-04-03

---

## Overview

This document is a **complete implementation reference** for how the docs viewer renders markdown content visually. It covers folder/tree structures, code blocks, heading animations, inline elements, tables, lists, checklists, and the Table of Contents. Any AI or developer can use this to replicate the exact rendering behavior.

**Screenshots of every major component** are included in both light and dark mode. All images are stored in `public/images/guide/`.

---

## Visual Examples Gallery

### Full Page — Dark Mode

Shows gradient headings (H1/H2 purple→pink), sidebar navigation, TOC with scroll-spy, inline code badges, blockquote, ordered list, and table with hover states.

![Overview in dark mode](/images/guide/01-overview-dark.png)

### Full Page — Light Mode

Same layout with light theme tokens — note how heading gradients, inline code, and table headers adapt.

![Overview in light mode](/images/guide/04-overview-light.png)

### Tree Structure — Dark Mode

Tree block with 📁 folder icons, 📄 file icons, muted guide lines, italic comments, and the STRUCTURE language badge.

![Tree structure dark](/images/guide/02-tree-dark.png)

### Tree Structure — Light Mode

Same tree content — code block background stays dark regardless of app theme.

![Tree structure light](/images/guide/03-tree-light.png)

### Code Blocks with Syntax Highlighting — Dark Mode

BASH and MARKDOWN language badges with per-language accent colors, line numbers, font controls, copy/download buttons.

![Code blocks dark](/images/guide/06-codeblocks-dark.png)

### Code Blocks — Light Mode

Same blocks in light theme — note the dark code background is preserved while the surrounding UI adapts.

![Code blocks light](/images/guide/05-codeblocks-light.png)

### Split View — Editor + Live Preview

Monaco editor on the left with markdown source, live rendered preview on the right, draggable divider in between.

![Split view](/images/guide/07-split-view-dark.png)

---

## 1. Folder / Tree Structure Rendering

### Detection Logic

Code blocks are auto-detected as "tree" structures when the content matches ANY of:

```typescript
// Pattern 1: Unicode box-drawing characters
/[├└│─]/

// Pattern 2: Lines ending with "/" (directories)
/^\s*[A-Za-z0-9{}._-]+\/$/m

// Pattern 3: Lines with file extensions
/^\s*[A-Za-z0-9{}._-]+\.[A-Za-z0-9_-]+\s*$/m
```

Explicit ` ```tree ` or ` ```structure ` fence labels also trigger tree mode.

### Tree Line Rendering Rules

Each line is processed through `highlightTreeLine()`:

| Pattern | Replacement | CSS Class | Visual |
|---------|-------------|-----------|--------|
| Box-drawing chars (`├ └ │ ─`) | Wrapped in `<span>` | `.tree-guide` | Muted at 50% opacity: `hsl(var(--muted-foreground) / 0.5)` |
| `...` (ellipsis) | Wrapped in `<span>` | `.tree-ellipsis` | Accent pink: `hsl(var(--accent))` |
| `name/` (directory) | Prefixed with 📁 emoji | `.tree-dir` | Bold white: `hsl(var(--foreground))`, `font-weight: 600` |
| `name.ext` (file) | Prefixed with 📄 emoji | `.tree-file` | Slightly muted: `hsl(var(--foreground) / 0.85)` |
| `# comment` | Extracted and wrapped separately | `.tree-comment` | Italic, muted: `hsl(var(--muted-foreground))` |

### Example Input → Output

**Markdown input:**
````markdown
```
src/
├── components/
│   ├── App.tsx
│   ├── Header.tsx
│   └── ...
├── utils/
│   └── helpers.ts    # Utility functions
└── index.ts
```
````

**Rendered visual (dark mode):**
- `src/` → 📁 **src/** (white, bold)
- `├──` → dim gray connection lines (50% opacity)
- `components/` → 📁 **components/** (white, bold)
- `App.tsx` → 📄 App.tsx (85% white)
- `...` → pink ellipsis (accent color)
- `# Utility functions` → *italic gray comment*

### Tree Color Token Map

| Element | CSS Property | Token | Light Mode | Dark Mode |
|---------|-------------|-------|------------|-----------|
| Guides | `color` | `--muted-foreground / 0.5` | `hsl(220 10% 46% / 0.5)` | `hsl(220 10% 60% / 0.5)` |
| Directories | `color` | `--foreground` | `hsl(230 25% 15%)` | `hsl(220 20% 92%)` |
| Files | `color` | `--foreground / 0.85` | `hsl(230 25% 15% / 0.85)` | `hsl(220 20% 92% / 0.85)` |
| Ellipsis | `color` | `--accent` | `hsl(330 85% 60%)` | `hsl(330 85% 65%)` |
| Comments | `color` | `--muted-foreground` | `hsl(220 10% 46%)` | `hsl(220 10% 60%)` |

### Key Design Decision

Tree blocks use a **neutral/white color scheme**, deliberately avoiding red/pink syntax highlighting colors that conflict with the directory/file readability.

---

## 2. Code Block Rendering

### Anatomy of a Code Block

Every fenced code block is rendered as a `.code-block-wrapper` with this structure:

```
┌─────────────────────────────────────────────────────┐
│ HEADER                                              │
│ ┌──────────────┐  ┌─────────────────────────────┐   │
│ │ ● TypeScript │  │ 12 lines  A- A A+  📋 ⬇ ⛶  │   │
│ └──────────────┘  └─────────────────────────────┘   │
├─────────────────────────────────────────────────────┤
│ BODY                                                │
│ ┌────┬──────────────────────────────────────────┐   │
│ │  1 │ import { useState } from "react";        │   │
│ │  2 │                                          │   │
│ │  3 │ export function App() {                  │   │
│ │  4 │   const [count, setCount] = useState(0); │   │
│ └────┴──────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────┤
│ SELECTION BAR (hidden until lines are pinned)       │
│ Lines 3–7       [Copy selected] [✕]                 │
└─────────────────────────────────────────────────────┘
```

### Header Components

| Component | CSS Class | Description |
|-----------|-----------|-------------|
| Language badge | `.code-lang-badge` | Colored dot + uppercase label (e.g., "TYPESCRIPT") |
| Language dot | `.code-lang-dot` | 7px circle with glow, color from `--badge-color` |
| Line count | `.code-line-count` | Gray text, e.g., "12 lines" |
| Selection label | `.code-selection-label` | Shows "Lines 4–9" when lines are pinned |
| Font controls | `.code-font-controls` | Three buttons: A- (decrease), A (reset), A+ (increase) |
| Copy button | `.copy-code-btn` | Copies full code, shows ✓ check on success |
| Download button | `.download-code-btn` | Downloads as file with correct extension |
| Fullscreen button | `.fullscreen-code-btn` | Expands to fixed overlay (`inset: 2rem`, z-index 999) |

### Language Badge Colors

Each language gets a unique HSL accent stored in `--lang-accent`:

| Language | Badge Label | HSL Accent | Visual |
|----------|-------------|-----------|--------|
| TypeScript | `TYPESCRIPT` | `99 83% 62%` | 🟢 Green |
| JavaScript | `JAVASCRIPT` | `53 93% 54%` | 🟡 Yellow |
| Go | `GO` | `194 66% 55%` | 🔵 Cyan |
| PHP | `PHP` | `234 45% 60%` | 🟣 Indigo |
| CSS | `CSS` | `264 55% 58%` | 🟣 Purple |
| JSON | `JSON` | `38 92% 50%` | 🟠 Orange |
| Bash/Shell | `BASH` | `120 40% 55%` | 🟢 Olive |
| SQL | `SQL` | `200 70% 55%` | 🔵 Blue |
| Rust | `RUST` | `25 85% 55%` | 🟠 Burnt orange |
| HTML/XML | `HTML` | `12 80% 55%` | 🔴 Red-orange |
| YAML | `YAML` | `0 75% 55%` | 🔴 Red |
| Markdown | `MARKDOWN` | `252 85% 60%` | 🟣 Purple |
| Plain Text | `PLAIN TEXT` | `220 10% 50%` | ⚪ Gray (default) |

The accent color is used for:
1. Badge dot color + glow (`box-shadow: 0 0 6px`)
2. Badge text color
3. Hover glow on the entire block wrapper
4. Fullscreen box-shadow

### Code Block Background

The code block always uses a **fixed dark theme** regardless of light/dark mode:

```css
.code-block-wrapper {
  background: hsl(220, 14%, 11%);        /* Deep dark background */
  border: 1px solid hsl(220, 13%, 22%);  /* Subtle border */
  border-radius: 0.75rem;
  font-family: 'Ubuntu Mono', 'JetBrains Mono', ui-monospace, monospace;
}

.code-block-header {
  background: hsl(220, 14%, 14%);        /* Slightly lighter header */
  border-bottom: 1px solid hsl(220, 13%, 20%);
}

.code-line-numbers {
  background: hsl(220, 14%, 9%);         /* Darkest: line number gutter */
  border-right: 1px solid hsl(220, 13%, 18%);
}
```

### Syntax Highlighting Token Colors

Highlight.js `github-dark` theme is used, overridden with design system tokens:

| Token Type | CSS Selector | Color Token |
|------------|-------------|-------------|
| Keywords, types, built-ins | `.hljs-keyword`, `.hljs-type`, `.hljs-built_in` | `hsl(var(--primary))` — purple |
| Strings, attributes | `.hljs-string`, `.hljs-attr`, `.hljs-property` | `hsl(var(--accent))` — pink |
| Numbers, variables | `.hljs-number`, `.hljs-variable`, `.hljs-regexp` | `hsl(var(--warning))` — amber |
| Comments | `.hljs-comment`, `.hljs-quote` | `hsl(var(--muted-foreground))` italic |
| Functions, classes, tags | `.hljs-title`, `.hljs-section`, `.hljs-tag` | `hsl(var(--foreground) / 0.85)` |
| Default text | `code` | `hsl(var(--foreground))` |

### Font Size Controls

Code blocks support dynamic font sizing via CSS custom property:

```
Default: --code-font-size: 18px
Min: 12px | Max: 32px | Step: 2px
Line height: var(--code-line-height): 1.6
Line number height: calc(var(--code-font-size) * var(--code-line-height))
```

Font size and line height are synchronized between line numbers and code content to maintain perfect vertical alignment.

### Line Interaction States

| State | Trigger | Code Line Style | Line Number Style |
|-------|---------|-----------------|-------------------|
| Default | — | transparent background | `hsl(220 10% 35%)` text |
| Hover | Mouse over | `hsl(220 15% 16%)` background | Primary color text |
| Pinned | Click / Shift+Click | `hsl(var(--primary) / 0.12)` | Primary color + 2px left border |

### Hover Effect on Code Blocks

```css
.code-block-wrapper:hover {
  box-shadow: 0 8px 32px hsl(var(--lang-accent) / 0.1),
              0 0 0 1px hsl(var(--lang-accent) / 0.15);
  transform: translateY(-2px);
  transition: box-shadow 0.3s ease, transform 0.2s ease;
}
```

### Fullscreen Mode

```css
.code-block-wrapper.code-fullscreen {
  position: fixed !important;
  inset: 2rem;
  z-index: 999;
  border-radius: 1rem;
  max-height: calc(100vh - 4rem);
  box-shadow: 0 25px 80px hsl(var(--lang-accent) / 0.25),
              0 0 0 1px hsl(var(--lang-accent) / 0.3);
}

/* Overlay behind fullscreen block */
.code-fullscreen-overlay {
  position: fixed;
  inset: 0;
  background: hsl(0 0% 0% / 0.7);
  backdrop-filter: blur(4px);
  z-index: 998;
}
```

---

## 3. Heading Animations

### H1 & H2 — Gradient Text + Brightness Hover

```css
.spec-h1, .spec-h2 {
  font-family: 'Ubuntu', sans-serif;
  background: linear-gradient(135deg,
    hsl(var(--heading-gradient-from)),  /* Purple: 252 85% 60% */
    hsl(var(--heading-gradient-to))     /* Pink: 330 85% 60% */
  );
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  transition: filter 0.3s ease;
}

/* On hover: brighter and more saturated */
.spec-h1:hover, .spec-h2:hover {
  filter: brightness(1.2) saturate(1.1);
}
```

| Property | H1 | H2 |
|----------|----|----|
| Font size | `1.6rem` | `1.25rem` |
| Weight | 700 | 700 |
| Margin | `1rem 0 0.6rem` | `1.8rem 0 0.5rem` |
| Bottom border | None | `1px solid hsl(var(--border))` |

### H3 — Left Border Slide

```css
.spec-h3 {
  font-size: 1.05rem;
  font-weight: 600;
  padding-left: 0.65rem;
  border-left: 3px solid hsl(var(--primary) / 0.5);
  color: hsl(var(--foreground));
  transition: color 0.2s ease, border-color 0.2s ease, padding-left 0.2s ease;
}

/* On hover: border brightens, text slides right */
.spec-h3:hover {
  color: hsl(var(--primary));
  border-color: hsl(var(--primary));
  padding-left: 0.85rem;  /* +0.2rem slide */
}
```

### H4 — Subtle Color Shift

```css
.spec-h4 {
  font-size: 0.95rem;
  font-weight: 600;
  color: hsl(var(--muted-foreground));
  transition: color 0.2s ease;
}

.spec-h4:hover {
  color: hsl(var(--foreground));
}
```

---

## 4. Inline Elements

### Links — Underline Sweep Animation

Links use a `::after` pseudo-element that sweeps from right-to-left on hover:

```css
.spec-link {
  color: hsl(var(--link-color));  /* Purple: 252 85% 55% */
  text-decoration: none;
  font-weight: 500;
}

.spec-link::after {
  content: '';
  position: absolute;
  width: 100%;
  height: 2px;
  bottom: -2px;
  left: 0;
  background: linear-gradient(90deg,
    hsl(var(--heading-gradient-from)),
    hsl(var(--heading-gradient-to))
  );
  transform: scaleX(0);
  transform-origin: bottom right;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.spec-link:hover::after {
  transform: scaleX(1);
  transform-origin: bottom left;  /* Direction reversal creates sweep effect */
}

.spec-link:hover {
  color: hsl(var(--accent));  /* Shifts to pink */
}
```

### Inline Code — Lift + Glow

```css
.inline-code {
  background: hsl(var(--code-bg));
  color: hsl(var(--code-text));      /* Pink: 330 85% 45% */
  padding: 0.2em 0.45em;
  border-radius: 5px;
  font-size: 0.85em;
  font-family: 'JetBrains Mono', 'Fira Code', ui-monospace, monospace;
  font-weight: 500;
  border: 1px solid hsl(var(--border) / 0.5);
  transition: background 0.2s ease, box-shadow 0.2s ease, transform 0.15s ease;
}

.inline-code:hover {
  box-shadow: 0 0 0 2px hsl(var(--highlight-glow) / 0.15);
  transform: translateY(-1px);
}
```

### Bold & Italic

```css
strong { color: hsl(var(--foreground)); font-weight: 700; }
em     { color: hsl(var(--muted-foreground)); }
```

---

## 5. Paragraphs

```css
.spec-p {
  line-height: 1.65;
  color: hsl(var(--foreground) / 0.9);
  padding: 0.1rem 0.35rem;
  border-radius: 3px;
  transition: color 0.15s ease, background 0.2s ease;
}

.spec-p:hover {
  color: hsl(var(--foreground));
  background: hsl(var(--primary) / 0.04);  /* Very subtle purple tint */
}
```

---

## 6. Tables

```css
/* Wrapper */
.table-wrapper {
  border-radius: 0.5rem;
  border: 1px solid hsl(var(--border));
  box-shadow: 0 1px 3px hsl(var(--foreground) / 0.04);
}

/* Header */
thead { background: hsl(var(--table-header-bg)); }
th {
  font-family: 'Ubuntu', sans-serif;
  font-weight: 600;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  color: hsl(var(--muted-foreground));
}

/* Row hover — highlight + left accent bar */
tbody tr:hover {
  background: hsl(var(--table-row-hover));
  box-shadow: inset 3px 0 0 hsl(var(--primary) / 0.5);
}

/* Alternating rows */
tbody tr.odd-row {
  background: hsl(var(--muted) / 0.15);
}
```

---

## 7. Lists

### Unordered Lists — Bullet Grow + Slide

```css
.spec-li {
  padding: 0.1rem 0 0.1rem 0.4rem;
  line-height: 1.55;
  transition: transform 0.15s ease, background 0.2s ease;
}

/* Custom bullet (replaces native) */
.spec-li::before {
  content: '';
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: hsl(var(--primary) / 0.6);
  position: absolute;
  left: -0.75rem;
  top: 0.65em;
  transition: background 0.2s ease, transform 0.2s ease;
}

/* Hover: slide right + bullet enlarges */
.spec-li:hover {
  transform: translateX(3px);
  background: hsl(var(--primary) / 0.04);
}
.spec-li:hover::before {
  background: hsl(var(--primary));
  transform: scale(1.3);
}
```

---

## 8. Blockquotes — Gradient Border + Slide

```css
.spec-blockquote {
  border-left: 4px solid transparent;
  border-image: linear-gradient(to bottom,
    hsl(var(--heading-gradient-from)),
    hsl(var(--heading-gradient-to))
  ) 1;
  background: hsl(var(--muted) / 0.3);
  padding: 0.5rem 1rem;
  border-radius: 0 0.5rem 0.5rem 0;
  font-style: italic;
  color: hsl(var(--muted-foreground));
  transition: background 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
}

.spec-blockquote:hover {
  background: hsl(var(--muted) / 0.5);
  transform: translateX(3px);
  box-shadow: -4px 0 12px hsl(var(--heading-gradient-from) / 0.1);
}
```

---

## 9. Checklists

Checklists are rendered as a dedicated `.checklist-block` container:

```
┌──────────────────────────────────────────┐
│ HEADER:  ☐ CHECKLIST           [Copy]    │
├──────────────────────────────────────────┤
│  ✅ Completed item (green gradient box)  │
│  ☐  Unchecked item (bordered empty box)  │
│  ✅ Another completed item               │
└──────────────────────────────────────────┘
```

| Element | Style |
|---------|-------|
| Checked box | `linear-gradient(135deg, hsl(var(--success)), hsl(var(--success) / 0.8))` with white ✓ |
| Unchecked box | `hsl(var(--muted))` background, `1.5px` border |
| Item hover | `translateX(3px)` + subtle primary background |
| Checkbox hover | `scale(1.1)` + primary glow shadow |
| Copy button | Copies raw markdown (`- [ ]`, `* [x]` syntax), NOT HTML |

---

## 10. Table of Contents (TOC) + Scroll Spy

### Layout

The TOC is a sticky sidebar (right side, 208px wide, hidden below `xl` breakpoint):

```css
.toc-container {
  width: 208px;       /* w-52 */
  position: sticky;
  top: 1.5rem;
  max-height: calc(100vh - 8rem);
  overflow-y: auto;
}
```

### Heading Extraction

Headings are parsed from raw markdown (not DOM), skipping code blocks:

```typescript
// Matches # through #### headings
const match = line.match(/^(#{1,4})\s+(.+)$/);
// Generates slug: "My Heading" → "my-heading"
const id = text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
```

### Indent Levels

| Heading Level | Tailwind Class | Font |
|---------------|---------------|------|
| H1 | `pl-3 font-medium` | Medium weight |
| H2 | `pl-4` | Default |
| H3 | `pl-5 text-[0.7rem]` | Smaller |
| H4 | `pl-6 text-[0.65rem]` | Smallest |

### Active State (Scroll Spy)

An `IntersectionObserver` monitors all heading elements and updates `activeId`:

```typescript
// Observer config
const observer = new IntersectionObserver(callback, {
  root: scrollContainer,
  rootMargin: "-10% 0px -80% 0px",
  threshold: 0
});
```

| State | Style |
|-------|-------|
| Active | `text-primary border-l-2 border-primary -ml-px` |
| Inactive | `text-muted-foreground` |
| Hover | `hover:border-l-2 hover:border-muted-foreground/40` |

### Auto-Scroll

When the active heading changes, the TOC button scrolls itself into view:

```typescript
activeRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
```

`block: "nearest"` ensures the sidebar only scrolls when the active item is outside the visible area.

---

## 11. Horizontal Rules

```css
.spec-hr {
  border: none;
  height: 1px;
  background: linear-gradient(90deg,
    transparent,
    hsl(var(--heading-gradient-from) / 0.4),
    hsl(var(--heading-gradient-to) / 0.4),
    transparent
  );
  margin: 1.25rem 0;
}
```

---

## 12. Text Selection

```css
.prose-spec ::selection {
  background: hsl(var(--primary) / 0.2);
  color: hsl(var(--foreground));
}
```

---

## 13. Fullscreen Document Scaling

When the document enters fullscreen mode, text scales up:

| Element | Normal | Fullscreen |
|---------|--------|------------|
| Body text | `0.9rem` | `1.05rem` |
| H1 | `1.6rem` | `2rem` |
| H2 | `1.25rem` | `1.5rem` |
| H3 | `1.05rem` | `1.2rem` |
| Code blocks | `18px` | `20px` |

---

## Animation Timing Reference
| Category | Duration | Easing | Use Case |
|----------|----------|--------|----------|
| Micro | `0.15s` | `ease` | Color shifts, opacity |
| Standard | `0.2s` | `ease` | Transform, background |
| Emphasis | `0.3s` | `ease` | Filter, box-shadow, gradients |
| Sweep | `0.3s` | `cubic-bezier(0.4, 0, 0.2, 1)` | Link underline animation |

---

## 14. View Modes & Split-View Editor

The docs viewer supports three view modes, toggled via toolbar or keyboard shortcuts:

| Mode | Shortcut | Description |
|------|----------|-------------|
| Preview | `P` | Read-only rendered markdown (default) |
| Edit | `E` | Full-width Monaco editor |
| Split | `S` | Side-by-side editor + live preview |

### Monaco Editor Configuration

The editor uses `@monaco-editor/react` with these settings:

```typescript
const EDITOR_OPTIONS = {
  fontSize: 14,
  fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
  lineNumbers: "on",
  minimap: { enabled: true, scale: 1 },
  wordWrap: "on",
  scrollBeyondLastLine: false,
  padding: { top: 16, bottom: 16 },
  smoothScrolling: true,
  cursorBlinking: "smooth",
  cursorSmoothCaretAnimation: "on",
  renderLineHighlight: "all",
  bracketPairColorization: { enabled: true },
  guides: { indentation: true, bracketPairs: true },
  scrollbar: { verticalScrollbarSize: 8, horizontalScrollbarSize: 8 },
  renderWhitespace: "selection",
  tabSize: 2,
};
```

**Theme integration:** The editor theme follows the app theme — `"vs-dark"` in dark mode, `"vs"` in light mode.

**Container styling:**
```css
/* Editor wrapper */
border-radius: 0.5rem;      /* rounded-lg */
border: 1px solid hsl(var(--border));
background: hsl(var(--card));
overflow: hidden;
```

### Split View Layout

```
┌──────────────────────────────────────────────────────┐
│ HEADER: breadcrumb + [P] [E] [S] + toolbar           │
├──────────────────────────────────────────────────────┤
│ PROGRESS BAR (gradient: primary → accent)             │
├──────────────────┬───┬───────────────────────────────┤
│                  │   │                               │
│  Monaco Editor   │ ║ │   Live Markdown Preview       │
│  (markdown)      │ ║ │   (MarkdownRenderer)          │
│                  │ ║ │                               │
│   width: {R}%    │DIV│   width: {100-R}%             │
│                  │ ║ │                               │
│                  │ ║ │   + TOC (in preview-only mode) │
│                  │   │                               │
├──────────────────┴───┴───────────────────────────────┤
│                                                      │
└──────────────────────────────────────────────────────┘
```

### Draggable Divider

The divider between editor and preview panels is a drag handle that resizes both panes:

**HTML structure:**
```html
<div class="split-divider" onMouseDown={handleDividerMouseDown} />
```

**Behavior:**
1. `mousedown` on divider → sets `isDragging = true`, cursor to `col-resize`, disables text selection
2. `mousemove` → calculates ratio: `((clientX - containerLeft) / containerWidth) * 100`
3. `mouseup` → resets dragging state, restores cursor and selection
4. Ratio is clamped to **20%–80%** to prevent either pane from collapsing

**Constants:**
```typescript
const SPLIT_MIN_RATIO = 20;  // Minimum editor width %
const SPLIT_MAX_RATIO = 80;  // Maximum editor width %
```

**Default split:** `50%` (centered)

**Divider CSS:**
```css
.split-divider {
  width: 6px;
  cursor: col-resize;
  background: hsl(var(--border));
  position: relative;
  flex-shrink: 0;
  transition: background 0.2s ease;
  z-index: 10;
}

/* Center grip indicator */
.split-divider::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 2px;
  height: 32px;
  border-radius: 1px;
  background: hsl(var(--muted-foreground) / 0.4);
  transition: background 0.2s ease, height 0.2s ease;
}

/* Hover: highlight + extend grip */
.split-divider:hover {
  background: hsl(var(--primary) / 0.2);
}
.split-divider:hover::after {
  background: hsl(var(--primary) / 0.6);
  height: 48px;  /* Grows from 32px to 48px */
}
```

### Live Preview Behavior

In split mode, the preview pane renders in real-time as the user types:

- Editor content state (`editContent`) is shared between both panes
- Every keystroke re-renders the `MarkdownRenderer` component
- The preview uses the same `prose-spec` styling as the full preview mode
- Fullscreen scaling (`prose-fullscreen`) applies to the preview pane in split mode
- **No TOC sidebar** in split mode (space constraint) — TOC only appears in preview-only mode

### Edit Mode

Full-width Monaco editor with no preview:

```
┌──────────────────────────────────────────────────────┐
│ HEADER                                               │
├──────────────────────────────────────────────────────┤
│                                                      │
│               Monaco Editor                          │
│               (full width, full height)              │
│               padding: 1rem (p-4)                    │
│                                                      │
└──────────────────────────────────────────────────────┘
```

### Reading Progress Bar

A gradient progress bar sits between the header and content area:

```css
/* Container */
height: 4px;          /* h-1 */
background: hsl(var(--muted) / 0.3);

/* Fill bar */
background: linear-gradient(90deg,
  hsl(var(--primary)),    /* Purple start */
  hsl(var(--accent))      /* Pink end */
);
border-radius: 0 9999px 9999px 0;  /* rounded-r-full */
transition: width 150ms ease-out;
```

Progress is calculated from scroll position: `scrollTop / (scrollHeight - clientHeight)`.

---

## Implementation Checklist

- [ ] Use CSS custom properties for ALL colors — never hardcode
- [ ] Code blocks always render with dark background regardless of theme mode
- [ ] Tree structures use emoji prefixes (📁 folders, 📄 files)
- [ ] Tree guides are muted at 50% opacity
- [ ] Each language has a unique HSL badge color
- [ ] Headings use gradient text fill (purple→pink)
- [ ] All hover effects combine 2–3 properties for richness
- [ ] Font sizes in code blocks synchronize between line numbers and content
- [ ] TOC uses IntersectionObserver for scroll-spy
- [ ] TOC auto-scrolls active item into view with `block: "nearest"`
- [ ] Split divider clamps ratio to 20%–80%
- [ ] Monaco editor theme follows app light/dark mode
- [ ] Split preview re-renders live on every keystroke
- [ ] Progress bar uses primary→accent gradient

---

## Cross-References

| Reference | Location |
|-----------|----------|
| Theme & Animation Spec | `02-spec/06-docs-viewer-ui/02-features/06-ui-theme-animations.md` |
| Syntax Highlighting Spec | `02-spec/06-docs-viewer-ui/02-features/02-syntax-highlighting.md` |
| Typography Spec | `02-spec/06-docs-viewer-ui/02-features/01-typography.md` |
| Highlighter Source | `src/components/markdown/highlighter.ts` |
| Code Block Builder | `src/components/markdown/codeBlockBuilder.ts` |
| CSS Styles | `src/index.css` (lines 134–934) |
| Language Constants | `src/components/markdown/constants.ts` |
| Table of Contents | `src/components/TableOfContents.tsx` |
| Scroll Spy Hook | `src/hooks/useScrollSpy.ts` |
| Monaco Editor | `src/components/MonacoMarkdownEditor.tsx` |
| Split View Components | `src/pages/DocsViewerComponents.tsx` |
| Split/View Hooks | `src/pages/DocsViewerHelpers.ts` |

---

*Visual rendering guide — updated: 2026-04-03*
