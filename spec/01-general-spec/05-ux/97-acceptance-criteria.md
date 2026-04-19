# UX — Acceptance Criteria

**Version:** 1.0.0  
**Last Updated:** 2026-04-03

---

## Overview

30 testable criteria across 6 areas covering internationalization, accessibility, performance, keyboard shortcuts, accessibility checklist, and markdown rendering.

---

## AC-01: Internationalization (01)

| # | Criterion | Source |
|---|-----------|--------|
| AC-001 | All user-facing strings are externalized into locale files | `01-internationalization-ux.md` |
| AC-002 | Locale switching updates all visible text without page reload | `01-internationalization-ux.md` |
| AC-003 | Date, number, and currency formats adapt to active locale | `01-internationalization-ux.md` |
| AC-004 | RTL layout support is implemented for applicable locales | `01-internationalization-ux.md` |

---

## AC-02: Accessibility Standards (02)

| # | Criterion | Source |
|---|-----------|--------|
| AC-005 | All interactive elements have visible focus indicators | `02-accessibility-standards-ux.md` |
| AC-006 | Color contrast ratios meet WCAG 2.1 AA minimums (4.5:1 text, 3:1 large text) | `02-accessibility-standards-ux.md` |
| AC-007 | All images and icons have meaningful alt text or aria-hidden | `02-accessibility-standards-ux.md` |
| AC-008 | Form inputs have associated labels and error messages | `02-accessibility-standards-ux.md` |
| AC-009 | Screen reader announcements exist for dynamic content changes | `02-accessibility-standards-ux.md` |

---

## AC-03: Performance Optimization (03)

| # | Criterion | Source |
|---|-----------|--------|
| AC-010 | Heavy components use lazy loading with Suspense boundaries | `03-performance-optimization-ux.md` |
| AC-011 | Expensive computations are memoized (useMemo/useCallback) | `03-performance-optimization-ux.md` |
| AC-012 | List virtualization is applied for collections exceeding 100 items | `03-performance-optimization-ux.md` |
| AC-013 | Bundle size is monitored and stays within defined thresholds | `03-performance-optimization-ux.md` |

---

## AC-04: Keyboard Shortcuts (04)

| # | Criterion | Source |
|---|-----------|--------|
| AC-014 | All primary actions are reachable via keyboard shortcuts | `04-keyboard-shortcuts-ux.md` |
| AC-015 | Keyboard shortcuts do not conflict with browser or OS defaults | `04-keyboard-shortcuts-ux.md` |
| AC-016 | A keyboard shortcut reference is discoverable within the UI | `04-keyboard-shortcuts-ux.md` |
| AC-017 | Focus trapping is implemented for modals and dialogs | `04-keyboard-shortcuts-ux.md` |

---

## AC-05: Accessibility Checklist (05)

| # | Criterion | Source |
|---|-----------|--------|
| AC-018 | Semantic HTML elements are used over generic divs/spans | `05-accessibility-checklist-ux.md` |
| AC-019 | ARIA roles and properties are applied where semantic HTML is insufficient | `05-accessibility-checklist-ux.md` |
| AC-020 | Tab order follows logical reading order | `05-accessibility-checklist-ux.md` |
| AC-021 | Skip-to-content link is present for main content areas | `05-accessibility-checklist-ux.md` |

---

## AC-06: Markdown Rendering (06)

| # | Criterion | Source |
|---|-----------|--------|
| AC-022 | Fenced code blocks render with language badge, line numbers, and syntax highlighting | `06-markdown-rendering-ux.md` |
| AC-023 | Click-to-pin, shift-click range, and drag-select line selection work correctly | `06-markdown-rendering-ux.md` |
| AC-024 | Copy, download, and fullscreen actions function on all code blocks | `06-markdown-rendering-ux.md` |
| AC-025 | Font size controls (A-, A, A+) adjust code block text within 12–32px range | `06-markdown-rendering-ux.md` |
| AC-026 | Checklists render with copy button that outputs raw markdown syntax | `06-markdown-rendering-ux.md` |
| AC-027 | Tables render with header row, striped body rows, and horizontal scroll on overflow | `06-markdown-rendering-ux.md` |
| AC-028 | Tree structures are auto-detected and rendered with directory/file icons | `06-markdown-rendering-ux.md` |
| AC-029 | Inline formatting (bold, italic, links, headings, blockquotes) renders correctly | `06-markdown-rendering-ux.md` |
| AC-030 | Placeholder extraction pipeline prevents code/checklist content from being mangled | `06-markdown-rendering-ux.md` |

---

## Cross-References

- [Overview](./00-overview.md)
- [Internationalization](./01-internationalization-ux.md)
- [Accessibility Standards](./02-accessibility-standards-ux.md)
- [Performance Optimization](./03-performance-optimization-ux.md)
- [Keyboard Shortcuts](./04-keyboard-shortcuts-ux.md)
- [Accessibility Checklist](./05-accessibility-checklist-ux.md)
- [Markdown Rendering](./06-markdown-rendering-ux.md)
