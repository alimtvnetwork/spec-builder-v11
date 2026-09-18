# CI/CD Issue 01 — Release-Version Installer No-Fallback Tests

**Created:** 2026-04-21  
**Status:** Resolved  
**Severity:** Critical  
**Pipeline:** `.github/workflows/release-version-installer-tests.yml`

---

## Issue Summary

Installers must never silently fall back to `main`, `latest`, or other floating versions if a requested release tag does not exist. The installer was lacking strict automated pipeline validation that guarantees it hard-fails with exit 1.

## Root Cause Analysis

Initial installer design allowed permissive fallback behaviors if release asset download failed or URL was unstamped.

## Resolution Applied

1. Created `.github/workflows/release-version-installer-tests.yml` with 321 lines of exhaustive assertions across Bash and PowerShell.
2. Verified that unstamped scripts, `/releases/latest/` URLs, malformed URLs, and forbidden flags (`--branch`, `--version`, `--list-versions`) trigger exit code 1 with explicit error messages.
3. Anchored placeholder substitution in `release.sh` and `release.ps1` to prevent modifying non-target lines.

## What NOT to Repeat

- Never allow release-pinned installers to fall back to `main` or `latest`.
- Never disable or bypass `.github/workflows/release-version-installer-tests.yml`.
