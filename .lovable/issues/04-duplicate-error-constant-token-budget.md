# Issue 04 — Duplicate Error Constant Token Budget

**Created:** 2026-09-19  
**Status:** Open (Non-blocking warning)  
**Severity:** Low  
**Feature / Module:** Error Code Registry (`spec/03-error-code-registry/`)

---

## Issue Summary

During test execution (`bun run test`), `src/tests/error-code-collisions.test.ts` emitted a non-blocking warning:
```
Duplicate constants (non-blocking):
AB/AB-LR: "ErrTokenBudgetExceeded" at 9845 and 9914
```

## Root Cause Analysis

In `spec/22-ai-bridge-cli/`, the constant name `ErrTokenBudgetExceeded` is allocated at code 9845 (Core AI Bridge) and at 9914 (Plan Templates).

## Fix Strategy

Rename one of the constant variants (e.g., `ErrPlanTokenBudgetExceeded` at 9914) to eliminate duplicate constant naming within the AI Bridge namespace.
