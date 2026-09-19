# Ambiguity 01 (Resolved) — Root README Casing

**Status:** Resolved  
**Created:** 2026-09-19  
**Resolved:** 2026-09-19  
**Area:** Repository Root Architecture

---

## Question / Ambiguity

The root readme was present as `README.md` (uppercase) on disk and in git. Rule 8 mandates: "ROOT README CASING: Root readme must strictly remain lowercase readme.md."

## Resolution

- **Answer:** Root readme must strictly be lowercase `readme.md`.
- **Applied Solution:** Renamed `README.md` to `readme.md` via `git mv -f`, committed as `fix: ensure root readme is strictly lowercase readme.md`, and pushed directly to `origin/main` (commit `6986b2a`).
