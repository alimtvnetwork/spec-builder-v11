# Issue 05 — Magic String & Tuple Return Technical Debt (Audit #07)

**Created:** 2026-02-26  
**Status:** Deferred  
**Severity:** Medium  
**Feature / Module:** Go Spec Examples across 6 CLIs

---

## Issue Summary

~1,399 violations in Go spec examples across CLI specs:
1. Magic string HTTP methods (`"GET"`, `"POST"`) instead of `HttpMethod` enum.
2. Tuple returns `(*Type, error)` instead of `apperror.Result[T]`.

## Root Cause Analysis

Historical spec examples written before `HttpMethod` enum and `Result[T]` envelopes were standardized across the repository.

## Resolution Plan

Deferred until Golang backend implementation phase (SM-010).
