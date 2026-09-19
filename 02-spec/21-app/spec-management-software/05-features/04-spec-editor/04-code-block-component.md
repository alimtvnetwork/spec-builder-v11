# Code Block Component — Visual & UX Spec

**Version:** 2.1.0
**Status:** Active
**Updated:** 2026-04-19
**Owner:** Spec Editor / Preview Renderer
**Reference:** `user-uploads://image-17.png` (target — "another repo" reference)
**Anti-reference:** `user-uploads://image-16.png` (BEFORE — current repo, fragmented look)

---

## Purpose

Defines the **visual rendering, padding, typography, and toolbar layout** of every fenced code block (` ``` `) rendered inside the spec viewer (`SpecFileViewer.tsx`) and any other React surface that uses the same component (preview renderer, AI message display, diff viewer, etc.).

This spec **supersedes** any conflicting toolbar styling rules in:

* `02-preview-renderer.md` (general renderer pipeline — still authoritative for parsing)
* `.ai-memory/memories/style/visual-dashboard-design.md` (general dashboard chrome)

Implementation file: `src/components/dashboard/SpecFileViewer.tsx` → `pre` component handler.

---

## 1. Anatomy

```
┌───────────────────────────────────────────────────────────────┐
│ [●] LANGUAGE     12 lines   [ A- │ A │ A+ │ Copy │ ⬇ │ ☑ │ ⛶ ] │  ← Header bar (40px)
├───────────────────────────────────────────────────────────────┤
│  1 │ first line of code                                       │
│  2 │ second line                                              │  ← Content (mono, 15-17px)
│  3 │ ...                                                      │
└───────────────────────────────────────────────────────────────┘
   ╰── soft language-tinted gradient glow (bottom edge only)   ←  Aesthetic accent
```

The block is composed of three regions:

| Region | Role | Notes |
|--------|------|-------|
| **Header bar** | Language badge + line count + toolbar | One row, 40px tall, no wrapping |
| **Content area** | Line-numbered, monospaced source | Hover row highlight, click-to-select |
| **Glow accent** | Bottom-edge gradient in language colour | Decorative only — must NEVER affect layout |

---

## 2. Toolbar — Discrete Pill Groups (REQUIRED, v2.0)

### 2.1 Problem being fixed

v1.0 of this spec called for a single unified segmented pill. Visual review against the
reference (`image-17.png`) showed the target is **not** one big pill — it is a row of
**small discrete pills** with a tight 8px gap between them. The `A-/A/A+` font-size
controls form ONE segmented pill (3 buttons share a border). Every other action
(`Copy`, `Download`, `Select all`, `Fullscreen`) is its **own standalone pill**.

This avoids both failure modes:
* The "fragmented chaos" of v0 (every button a separate, oversized button)
* The "monolithic bar" of v1 (one giant pill that feels heavy)

### 2.2 Pill inventory

| # | Pill | Buttons | Notes |
|---|------|---------|-------|
| 1 | Font-size group | `A-` `A` `A+` | Segmented — one border, internal `border-l` dividers |
| 2 | Copy | `Copy` (icon + label) | Standalone pill |
| 3 | Download | `Download` (icon + label) | Standalone pill |
| 4 | Select all | `Select all` / `Deselect` (icon + label) | Standalone pill, label toggles |
| 5 | Fullscreen | icon only | Standalone pill, narrower (`px-2`) |

Pills are separated by `gap-2` (8px). The whole toolbar lives inside `flex items-center ml-4`.

### 2.3 Per-pill rules

| Rule | Required value |
|------|---------------|
| Container shape | `rounded-md` (6px) |
| Border | `1px solid hsl(220 13% 28%)` |
| Background | `hsl(220 14% 13%)` (matches header chrome, not pure black) |
| Padding (label pills) | `px-2.5 py-[3px]` |
| Padding (icon-only / segmented children) | `px-2 py-[3px]` |
| Internal gap (icon ↔ label) | `gap-1.5` |
| Hover state | `bg-white/[0.06]` only — no border-colour change |
| Icon size | `h-3 w-3` (smaller than v1's 3.5 — matches reference density) |
| Label font | **Poppins** `font-medium` `text-[11px]` |
| Label colour | `hsl(220 10% 75%)` default |
| Active icon (Copy success) | `hsl(152 70% 50%)` (green check) |
| Segmented divider | `border-l` with same border colour |

### 2.4 Implementation skeleton

```tsx
<div className="flex items-center gap-2 ml-4"
     style={{ fontFamily: "'Poppins', system-ui, sans-serif" }}>

  {/* Pill 1: segmented font-size group */}
  <div className="flex items-stretch rounded-md overflow-hidden border"
       style={{ borderColor: "hsl(220 13% 28%)", background: "hsl(220 14% 13%)" }}>
    <FontBtn label="A-" onClick={dec} />
    <FontBtn label="A"  onClick={reset} divider />
    <FontBtn label="A+" onClick={inc}   divider />
  </div>

  {/* Pills 2-4: label pills */}
  <ActionPill icon={Copy}       label="Copy"       onClick={copy} />
  <ActionPill icon={Download}   label="Download"   onClick={download} />
  <ActionPill icon={ListChecks} label="Select all" onClick={selectAll} />

  {/* Pill 5: icon-only */}
  <IconPill icon={Expand} onClick={fullscreen} />
</div>
```

### 2.5 Forbidden patterns

* ❌ Wrapping ALL buttons in one outer pill (the v1 mistake — too heavy)
* ❌ Each button getting its own large pill with `px-3 py-1.5` (the v0 mistake — too loose)
* ❌ `gap-1` or `gap-3` between pills — must be `gap-2` to match reference rhythm
* ❌ `font-mono` on labels — labels are **Poppins** everywhere
* ❌ `box-shadow` glow on any pill — flat borders only
* ❌ Mixing border colours between pills — every pill uses `hsl(220 13% 28%)`
* ❌ Showing the Fullscreen button label — it's icon-only

---

## 3. Language Badge

### 3.1 Problem being fixed

The dot next to the language name was rendered with `box-shadow` glow. For low-contrast languages (e.g. Plain Text → grey) the soft shadow looked muddy / pinkish on dark backgrounds.

### 3.2 Rules

| Property | Required value |
|----------|---------------|
| Dot size | `h-2 w-2` (was 2.5) |
| Dot shape | `rounded-full` |
| Dot fill | `hsl(<langColor>)` solid |
| Dot glow (`box-shadow`) | **REMOVE** — no shadow under any condition |
| Label font | **Poppins** `font-semibold` `text-xs` `tracking-wide uppercase` |
| Label colour | `hsl(<langColor>)` |
| Plain Text fallback | `langColor = 220 10% 55%` (neutral grey) |

```tsx
<span className="flex items-center gap-2 text-xs font-semibold tracking-wide uppercase"
      style={{ fontFamily: "'Poppins', system-ui, sans-serif", color: `hsl(${badgeColor})` }}>
  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: `hsl(${badgeColor})` }} />
  {langLabel}
</span>
```

---

## 4. Padding & Spacing

| Element | Required value | Rationale |
|---------|---------------|-----------|
| Header bar | `px-4 py-2` | Matches outer container |
| Header → Content border | `1px solid hsl(220 13% 20%)` | Single hairline, no double-line |
| Line number cell | `pr-3 pl-3` | Equal breathing room |
| Code cell | `pl-4 pr-4`, `py-[2px]` | Tight vertical, comfortable horizontal |
| Block outer margin | `my-4` (default), `0` (fullscreen) | Predictable rhythm |
| Block border | `1px solid hsl(220 13% 22%)` | Matches header divider |
| Border radius | `rounded-lg` (8px) | Consistent with cards |

**Forbidden:**
* ❌ Padding the line-number cell with `py-*` other than `0` — vertical padding lives on the code cell only.
* ❌ `border-2` on the outer container — must always be `1px`.
* ❌ Using `divide-x` on `<tr>` — selection-aware borders are managed per cell.

---

## 5. Bottom-edge Gradient Glow (KEEP)

The soft language-tinted gradient at the **bottom corners** is a deliberate aesthetic choice (the user explicitly approved it). Implementation:

```css
.code-block-glow {
  position: relative;
}
.code-block-glow::after {
  content: "";
  position: absolute;
  inset: auto 0 -1px 0;
  height: 2px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    hsl(var(--primary) / 0.45) 25%,
    hsl(var(--accent)  / 0.55) 50%,
    hsl(var(--info)    / 0.45) 75%,
    transparent 100%
  );
  border-radius: inherit;
  pointer-events: none;
}
```

Rules:
* MUST be `pointer-events: none` (does not block clicks).
* MUST be `2px` tall — not a heavy bar.
* MUST be applied via the `.code-block-glow` class on the outer wrapper.

---

## 6. Typography Matrix

| Surface | Font | Weight | Size |
|---------|------|--------|------|
| Toolbar button labels | **Poppins** | 500 | 11px |
| Language badge | **Poppins** | 600 | 12px (`text-xs`) |
| Line count "12 lines" | **Poppins** | 400 | 11px, colour `hsl(220 10% 50%)` |
| Code content | `Ubuntu Mono`, `JetBrains Mono` | 400 | 15px (compact) / 17px (full page) |
| Line numbers | `Ubuntu Mono` | 400 | inherit code size |

**Rule of thumb:** *Mono inside the block, Poppins outside the block (chrome).*

---

## 7. Hover & Selection

| State | Effect |
|-------|--------|
| Row hover | `bg-white/[0.03]` — subtle, no border movement |
| Row selected (click) | `bg-yellow-500/15` + line number colour `hsl(45 93% 47%)` |
| Multi-select (shift-click) | Adds to `selectedLines` Set |
| "Copy selected" bar | Slides in from top, yellow accent, sticky below header |

---

## 8. Acceptance Checklist

A code block is conforming **if and only if** every box below is checked:

- [ ] Toolbar consists of **5 discrete pills** separated by `gap-2`
- [ ] `A-/A/A+` is ONE pill with internal `border-l` dividers (segmented)
- [ ] `Copy`, `Download`, `Select all`, `Fullscreen` are each their **own** pill
- [ ] Every pill uses `border: 1px solid hsl(220 13% 28%)` and `bg: hsl(220 14% 13%)`
- [ ] All pill labels render in **Poppins** `font-medium text-[11px]` (verify via DevTools)
- [ ] Pill padding is `py-[3px]`; label pills `px-2.5`, icon-only/segmented children `px-2`
- [ ] Icon size is `h-3 w-3` everywhere (NOT `h-3.5`)
- [ ] Hover state changes background to `bg-white/[0.06]` only — no border colour change
- [ ] Fullscreen pill is icon-only (no text label)
- [ ] Language dot has **no** `box-shadow`
- [ ] Language label is uppercase, `text-xs`, weight 600, Poppins
- [ ] Header bar is exactly `40px` tall (`px-4 py-2`)
- [ ] Outer block border is `1px` (never `2px`)
- [ ] Bottom gradient glow is present, `2px` tall, `pointer-events: none`
- [ ] No double horizontal lines between header and content
- [ ] Line-number column has `py-0`; only the code cell has vertical padding
- [ ] Block matches `image-17.png` at all viewport widths ≥ 480px

---

## 9. Reference Images

| File | Status |
|------|--------|
| `user-uploads://image-16.png` | ❌ BEFORE — current repo, fragmented per-button pills, looks chaotic |
| `user-uploads://image-17.png` | ✅ TARGET — other repo, 5 discrete pill groups, clean & dense |

---

## 10. Cross-References

| Reference | Location |
|-----------|----------|
| Preview renderer pipeline | `./02-preview-renderer.md` |
| Dashboard visual style | `.ai-memory/memories/style/visual-dashboard-design.md` |
| Frontend UI patterns | `02-spec/25-gsearch-cli/02-frontend/05-ui-patterns.md` |
| Implementation file | `src/components/dashboard/SpecFileViewer.tsx` (`pre` handler, ~line 1395) |

---

## 12. Chrome-Wide Application (v2.1)

The discrete-pill-groups pattern from §2 is the **canonical chrome style** for the
entire spec viewer — not just code blocks. Every action toolbar in the viewer must
follow it.

### 12.1 Surfaces using this pattern

| Surface | File | Pills |
|---------|------|-------|
| Code block toolbar | `SpecFileViewer.tsx` (`pre` handler) | A-/A/A+ · Copy · Download · Select all · ⛶ |
| File viewer header | `SpecBrowser.tsx` (~line 769) | Copy · Download · TOC · −/size/+ · ✕ |
| TOC sidebar | `SpecBrowser.tsx` (~line 887) | Header label + heading buttons in Poppins |

### 12.2 Shared rules (single source of truth)

| Token | Value |
|-------|-------|
| Pill border | `1px solid hsl(220 13% 28%)` |
| Pill background | `hsl(220 14% 13%)` |
| Pill radius | `rounded-md` (6px) |
| Pill padding (label) | `px-2.5 py-[3px]` |
| Pill padding (icon-only / segmented child) | `px-2 py-[3px]` |
| Inter-pill gap | `gap-2` (8px) |
| Internal icon ↔ label gap | `gap-1.5` |
| Icon size | `h-3 w-3` |
| Label font | **Poppins** `font-medium text-[11px]` |
| Label colour | `hsl(220 10% 75%)` |
| Hover bg | `bg-white/[0.06]` (no border colour change) |
| Active/toggled state | border `hsl(var(--primary) / 0.5)`, bg `hsl(var(--primary) / 0.12)`, fg `hsl(var(--primary))` |

### 12.3 Active-state pattern (for toggles like TOC)

When a pill represents a toggleable state (TOC on/off, future view modes), apply:

```tsx
style={{
  borderColor: isActive ? "hsl(var(--primary) / 0.5)" : "hsl(220 13% 28%)",
  background:  isActive ? "hsl(var(--primary) / 0.12)" : "hsl(220 14% 13%)",
}}
```

Both icon and label flip to `hsl(var(--primary))` when active.

### 12.4 TOC-specific overrides

The TOC sidebar uses the pill *typography* (Poppins) but not the pill *container* —
heading buttons stay flat with a left-border accent for the active item:

* Header label: Poppins `text-[10px] font-semibold uppercase tracking-wider`
* Heading buttons: Poppins `text-[11px]` (was Ubuntu Mono — replaced for chrome consistency)
* Active item: `border-l-primary bg-primary/10 text-primary`

### 12.5 What is NOT pillified

* The breadcrumb path (`SpecBrowser.tsx` ~line 751) stays in `Ubuntu Mono` — file
  paths are inherently mono and pillifying them would harm readability.
* Sidebar folder tree items — they're navigation, not actions.
* The "Copy selected lines" floating bar inside code blocks — intentionally
  yellow-accented to signal a transient selection state.

---

## 11. Change Log

| Version | Date | Change |
|---------|------|--------|
| 2.1.0 | 2026-04-19 | Added §12 — extended discrete-pill-groups pattern to the file viewer header (Copy / Download / TOC / font-size / Close) and migrated the TOC sidebar typography to Poppins for chrome-wide consistency. |
| 2.0.0 | 2026-04-19 | **BREAKING:** Replaced "unified segmented pill" with "discrete pill groups" model after visual review. v1's monolithic pill did not match the reference. Updated padding (`py-[3px]`), icon size (`h-3 w-3`), gap (`gap-2`), and acceptance checklist accordingly. |
| 1.0.0 | 2026-04-19 | Initial spec — created in response to toolbar/padding/font feedback. Superseded by 2.0.0. |
