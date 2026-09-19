# Issue 01 — ESLint Type-Aware Rule Missing Parser Configuration

**Created:** 2026-09-19  
**Status:** Open  
**Severity:** High  
**Feature / Module:** Repository Toolchain & Linter (`eslint.config.js`)

---

## Issue Summary

Running `bun run lint` (`eslint .`) fails with:
```
Error while loading rule '@typescript-eslint/switch-exhaustiveness-check': You have used a rule which requires type information, but don't have parserOptions set to generate type information for this file.
Occurred while linting D:\work\spec-builder\spec\11-spec-management-software\16-api\types.ts
```

## Root Cause Analysis

In `eslint.config.js`, the rule `@typescript-eslint/switch-exhaustiveness-check` was added without enabling typed linting (`parserOptions.project` or `parserOptions.projectService: true`). Furthermore, the files glob `**/*.{ts,tsx}` captures `.ts` files inside `spec/` (e.g. `02-spec/11-spec-management-software/16-api/types.ts`) which are not included in `tsconfig.app.json` or `tsconfig.node.json`.

## Fix Strategy

1. Either configure `parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname }` in `eslint.config.js` or scope typed rules strictly to `src/**/*.{ts,tsx}`.
2. Ensure `spec/**` is ignored or linted under an appropriate spec-level tsconfig.

## Prevention Checklist

- [ ] Verify `bun run lint` passes before committing toolchain changes.
- [ ] Ensure any type-aware lint rule has projectService enabled.
