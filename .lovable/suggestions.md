# Project Suggestions (Single Source of Truth)

> **Updated:** 2026-04-19  
> **Note:** Legacy spec-only suggestions live in `.lovable/memories/suggestions/01-suggestions-tracker.md` (83 completed, 2 pending). This file tracks **Health Dashboard UI** suggestions going forward.

---

## Active Suggestions

### Extract reusable `<ChromePill>` + `<ChromePillGroup>` components
- **Status:** Pending
- **Priority:** Medium
- **Description:** The discrete-pill-groups pattern is now duplicated in `SpecFileViewer.tsx` (code-block toolbar) and `SpecBrowser.tsx` (file-viewer header). Extract to `src/components/ui/chrome-pill.tsx` so future toolbars cannot drift from spec `04-code-block-component.md` v2.1.0.
- **Added:** 2026-04-19 (session: chrome consistency)

### Apply pill pattern to sidebar search + dashboard top bar
- **Status:** Pending
- **Priority:** Low
- **Description:** Spec viewer header and code-block toolbar share the chrome language. Extend the same Poppins + py-[3px] + hsl(220 13% 28%) border pattern to the sidebar search input and dashboard top-bar action buttons.
- **Added:** 2026-04-19

### Keyboard shortcuts for code-block toolbar
- **Status:** Pending
- **Priority:** Low
- **Description:** Add `c` (copy), `d` (download), `t` (toggle TOC), `f` (fullscreen), `+/-` (font size). Show ⌘K-style help overlay listing shortcuts.
- **Added:** 2026-04-19

### Focus-visible ring + arrow-key nav for segmented A-/A/A+ pill
- **Status:** Pending
- **Priority:** Low
- **Description:** Accessibility — 1px `hsl(var(--primary))` focus ring and arrow-key navigation between segmented buttons.
- **Added:** 2026-04-19

---

## Implemented Suggestions

### Discrete-pill chrome pattern applied to file viewer header + TOC
- **Implemented:** 2026-04-19
- **Files:** `src/pages/SpecBrowser.tsx`, `spec/11-spec-management-software/05-features/04-spec-editor/04-code-block-component.md` (v2.1.0, Section 12)
- **Notes:** Five discrete pills (Copy, Download, TOC toggle, segmented font-size A-/A/A+, Close) with Poppins font, `gap-2`, `py-[3px]`, `h-3 w-3` icons, `hsl(220 13% 28%)` borders, `hsl(220 14% 13%)` backgrounds. TOC toggle uses primary tint when active.

### Code-block toolbar redesigned to match reference (image-17)
- **Implemented:** 2026-04-19
- **Files:** `src/components/dashboard/SpecFileViewer.tsx`, `spec/11-spec-management-software/05-features/04-spec-editor/04-code-block-component.md` (v2.0.0)
- **Notes:** Replaced single unified pill with 5 discrete pill groups (segmented A-/A/A+, Copy, Download, Select all, Fullscreen). Removed language-dot box-shadow glow. Switched all chrome labels from monospace to Poppins.

### Initial code-block component spec + Poppins button labels
- **Implemented:** 2026-04-19
- **Files:** `spec/11-spec-management-software/05-features/04-spec-editor/04-code-block-component.md` (v1.0.0 created)
- **Notes:** First pass: unified-pill toolbar, language badge, bottom-edge tinted gradient.

### Table of Contents — scroll-spy + auto-scroll
- **Implemented:** 2026-04-19 (earlier in session)
- **Notes:** TOC sidebar in `SpecBrowser.tsx` highlights active heading as user scrolls; clicking a TOC entry smooth-scrolls into view.

### Code block syntax highlight + line numbers + copy button
- **Implemented:** 2026-04-19 (earlier in session)
- **Notes:** Enhanced rendering per visual rendering guide.

### `::selection` text-selection styling
- **Implemented:** 2026-04-19 (earlier in session)
- **Notes:** Per visual rendering guide.
