# Ambiguity 01 — ESLint Flat Config Scope Over Spec Files

**Status:** Open  
**Created:** 2026-09-19  
**Area:** Linter Configuration (`eslint.config.js`)

---

## Question / Ambiguity

`eslint.config.js` currently targets `**/*.{ts,tsx}` without ignoring `spec/`. This causes `@typescript-eslint/switch-exhaustiveness-check` to fail because typescript-eslint tries to load type information for TypeScript files inside `spec/` (e.g. `spec/11-spec-management-software/16-api/types.ts`), which are not part of `tsconfig.app.json`.

Should `spec/**` TypeScript files be explicitly ignored in `eslint.config.js` (since `spec/` is documentation-only), or should a dedicated `tsconfig.spec.json` be added to provide type-checking for spec TypeScript files?

## Current Workaround

Pending user decision before altering linter scope.
