# Memory: style/chrome-pill-pattern

**Updated:** 2026-04-19  
**Version:** 1.0.0  
**Status:** Active  
**Spec Source:** `02-spec/11-spec-management-software/05-features/04-spec-editor/04-code-block-component.md` v2.1.0 (Section 12)

---

## Pattern Summary

Every chrome toolbar in the Spec Viewer (code-block toolbar, file-viewer header, TOC sidebar controls) follows the **discrete pill groups** pattern.

### Visual Tokens

| Property | Value |
|----------|-------|
| Font family | `'Poppins', system-ui, sans-serif` |
| Font weight | `font-medium` |
| Font size | `text-[11px]` |
| Vertical padding | `py-[3px]` |
| Horizontal padding | `px-2` (icon-only) / `px-2.5` (icon + label) |
| Inter-pill gap | `gap-2` |
| Icon size | `h-3 w-3` |
| Border color | `hsl(220 13% 28%)` |
| Background color | `hsl(220 14% 13%)` |
| Border radius | `rounded-md` |

### Active / Toggled State

```tsx
style={{
  borderColor: isActive ? "hsl(var(--primary) / 0.5)" : "hsl(220 13% 28%)",
  background:  isActive ? "hsl(var(--primary) / 0.12)" : "hsl(220 14% 13%)",
}}
```

### Segmented Groups (e.g. A- / A / A+)

- ONE outer container with the border + bg
- `flex items-stretch rounded-md overflow-hidden border`
- Internal dividers via `border-l` on each subsequent button
- Do NOT give each segment its own outer border

---

## Where Applied

| Surface | File |
|---------|------|
| Code-block toolbar (5 pills: A-/A/A+ segmented, Copy, Download, Select all, Fullscreen) | `src/components/dashboard/SpecFileViewer.tsx` |
| File-viewer header (Copy, Download, TOC toggle, font-size segmented, Close) | `src/pages/SpecBrowser.tsx` |
| TOC sidebar headings | `src/pages/SpecBrowser.tsx` |

---

## Strict Prohibitions

- ❌ Single monolithic unified pill containing all controls — REJECTED by user 2026-04-19
- ❌ Monospace fonts (Ubuntu Mono, JetBrains Mono) on chrome labels
- ❌ `box-shadow` glow on the language-color indicator dot
- ❌ Loose padding (`py-1` or larger) on chrome pills
- ❌ Per-button independent borders inside a segmented group

See `.lovable/strictly-avoid.md` for the full list.

---

## Pending Refactor

Extract `<ChromePill>` and `<ChromePillGroup>` into `src/components/ui/chrome-pill.tsx` so future toolbars cannot drift. Tracked in `.lovable/suggestions.md`.
