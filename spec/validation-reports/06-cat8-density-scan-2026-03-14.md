# Category 8 Density Scan — Full Project

**Version:** 1.0.0  

**Date:** 2026-03-14 (Post-Wave 84)

## Summary
**Total:** ~406 matches across ~84 files in 22 modules

## Module Density Table (sorted by match count)

| # | Module | Matches | Files | Status | Notes |
|---|--------|---------|-------|--------|-------|
| 1 | `spec/08-generic-enforce` | 63 | 4 | 🔴 NOT TRIAGED | Enforcement rules + audit report — likely non-actionable |
| 2 | `spec/02/.../05-features` | 62 | 22 | ✅ CLEARED (W79) | Remediated + compliance annotations only |
| 3 | `spec/02/.../13-shared-packages` | 43 | 5 | ✅ EXEMPTED (W84) | pkg/errors Details boundary exemption |
| 4 | `spec/60-ai-research` | 35 | 4 | 🔴 NOT TRIAGED | Research/reference docs — likely non-actionable |
| 5 | `spec/02-coding-guidelines/01-cross-language` | 28 | 5 | ✅ CLEARED (W82) | All anti-pattern examples / rule prose |
| 6 | `spec/20-gsearch-cli` | 21 | 4 | 🟡 NOT TRIAGED | Settings service + captcha — likely mixed |
| 7 | `spec/02/.../14-microservices` | 19 | 6 | ✅ CLEARED (W80) | Remediated + 1 Wails exemption |
| 8 | `spec/02/.../04-coding-guidelines` | 19 | 3 | 🔴 NOT TRIAGED | Seedable config + helper naming — likely non-actionable |
| 9 | `spec/01-general-spec` | 15 | 2 | 🟡 NOT TRIAGED | Foundation coding standards — likely mixed |
| 10 | `spec/02/.../12-prompts` | 14 | 1 | 🔴 NOT TRIAGED | Prompt template — likely non-actionable (example code) |
| 11 | `spec/61-how-app-issues-track` | 13 | 1 | ✅ NON-ACTIONABLE | Issue documentation |
| 12 | `spec/02-coding-guidelines/03-golang` | 12 | 2 | 🔴 NOT TRIAGED | Standards reference — likely non-actionable |
| 13 | `spec/26-ai-transcribe-cli` | 10 | 6 | 🟡 NOT TRIAGED | Voice commands + STT providers — likely mixed |
| 14 | `spec/04-error-resolution` | 10 | 5 | 🟡 NOT TRIAGED | Error handling guides — likely mixed |
| 15 | `spec/28-shared-cli-frontend` | 10 | 2 | 🟡 NOT TRIAGED | Settings service + deploy — likely actionable |
| 16 | `spec/22-ai-bridge-cli` | 9 | 5 | ✅ CLEARED (W83) | Compliance annotations only |
| 17 | `spec/02/.../10-research` | 9 | 1 | 🔴 NOT TRIAGED | E2E integration tests — likely non-actionable |
| 18 | `spec/02/.../07-database-design` | 5 | 3 | ✅ CLEARED (W84) | Remediated + anti-pattern prose |
| 19 | `spec/02/.../08-roadmap-overview` | 4 | 2 | ✅ CLEARED (W84) | Remediated + exempted jwt callback |
| 20 | `spec/21-brun-cli` | 4 | 1 | 🟡 NOT TRIAGED | Settings service |
| 21 | `spec/07-seedable-config-architecture` | 4 | 1 | 🟡 NOT TRIAGED | Config architecture |
| 22 | `spec/02/.../06-error-management` | 2 | 1 | 🟡 NOT TRIAGED | Error overview |

## Cleared Modules (no further action needed)
- `spec/11-spec-management-software/` — **ALL sub-modules cleared** (05-features, 07-database-design, 08-roadmap-overview, 13-shared-packages, 14-microservices)
- `spec/22-ai-bridge-cli/`
- `spec/30-wp-plugin/` (0 matches)
- `spec/02-coding-guidelines/01-cross-language/`
- `spec/61-how-app-issues-track/`

## Recommended Remediation Waves

### Wave 85 — High-density non-application modules (triage-only)
**Target:** `spec/08-generic-enforce` (63), `spec/60-ai-research` (35), `spec/02-coding-guidelines/03-golang` (12)
**Expected outcome:** ~110 matches, all likely non-actionable (enforcement rules, audit reports, research docs)

### Wave 86 — Application CLI modules
**Target:** `spec/20-gsearch-cli` (21), `spec/26-ai-transcribe-cli` (10), `spec/21-brun-cli` (4)
**Expected outcome:** ~35 matches, mixed actionable (settings services) + non-actionable

### Wave 87 — Shared infrastructure + spec-management support
**Target:** `spec/28-shared-cli-frontend` (10), `spec/07-seedable-config-architecture` (4), `spec/02/.../04-coding-guidelines` (19), `spec/02/.../12-prompts` (14), `spec/02/.../10-research` (9), `spec/02/.../06-error-management` (2)
**Expected outcome:** ~58 matches, mostly non-actionable (guidelines, examples, prompts)

### Wave 88 — Remaining
**Target:** `spec/01-general-spec` (15), `spec/04-error-resolution` (10)
**Expected outcome:** ~25 matches, mixed
