# Plan 02 — Extract Reusable Chrome Pill Components

> **Status:** Pending  
> **Priority:** Medium  
> **Target:** `src/components/ui/chrome-pill.tsx`

---

## Objective

Extract the discrete-pill-groups pattern currently duplicated across `SpecFileViewer.tsx` (code-block toolbar) and `SpecBrowser.tsx` (file-viewer header) into a unified, reusable `<ChromePill>` and `<ChromePillGroup>` component in `src/components/ui/chrome-pill.tsx`.

## Execution Steps

1. [ ] Create `src/components/ui/chrome-pill.tsx` with Poppins font, `py-[3px]`, `h-3 w-3` icons, borders `hsl(220 13% 28%)`, backgrounds `hsl(220 14% 13%)`.
2. [ ] Refactor `SpecFileViewer.tsx` to use `<ChromePillGroup>`.
3. [ ] Refactor `SpecBrowser.tsx` to use `<ChromePillGroup>`.
4. [ ] Run tests and build to ensure zero regression.
