# Issue 02 — Health Dashboard File Count Stale

**Created:** 2026-04-01  
**Status:** Open  
**Severity:** Low  
**Feature / Module:** `spec/00-overview.md`

---

## Issue Summary

The `spec/00-overview.md` health dashboard does not reflect the file count for the `axios-version-control` module (6 files added under `spec/10-app/`).

## Root Cause Analysis

Module `spec/10-app/axios-version-control/` was added in v30.0.0 without running the inventory update on `spec/00-overview.md`.

## Fix Strategy

1. Update `spec/00-overview.md` row for `10-app` (6 files).
2. Run `node scripts/generate-dashboard-data.cjs`.
