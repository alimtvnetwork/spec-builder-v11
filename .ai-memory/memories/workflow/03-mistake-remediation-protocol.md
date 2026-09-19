# Memory: workflow/mistake-remediation-protocol

**Updated:** 2026-02-27  
**Version:** 1.0.0  
**Status:** Active

---

## Protocol

Every fix requires a standardized issue write-up at `02-spec/61-how-app-issues-track/{NN}-{issue-slug}.md`. A fix is **not complete** until memory is updated.

---

## Workflow

1. Discover mistake → follow checklist at `02-spec/61-how-app-issues-track/02-process-checklist.md`
2. Create issue write-up using template at `02-spec/61-how-app-issues-track/01-issue-template.md`
3. Update relevant spec with constraints and "Known Pitfalls" section
4. Update this memory file with the new entry
5. Verify cross-references

---

## Issue Registry

| # | Slug | Summary | Prevention Rule | File |
|---|------|---------|-----------------|------|
| 03 | broken-memory-references | 15 total broken/malformed memory refs across spec files (nonexistent files, missing .md, absolute paths). Fixed in v9.3.0 + v9.4.0 | Every cross-ref scan must include memory references; all refs must use relative paths with `.md` extension; no absolute `/` prefixes | `02-spec/61-how-app-issues-track/03-broken-memory-references.md` |
| 04 | master-status-stale-wave-count | Master status reported 8/8 waves and v14.0.0 despite 11 waves and v15.0.0 being current | Every remediation wave completion must include an update to the master status file with the new wave count and version | `02-spec/61-how-app-issues-track/04-master-status-stale-wave-count.md` |
| 05 | broken-suggestion-tracker-reference | Master status referenced nonexistent `01-suggestions-tracker.md`; actual file is `README.md` | Cross-reference scans must include master status "Next Steps" section as a mandatory target | `02-spec/61-how-app-issues-track/05-broken-suggestion-tracker-reference.md` |
| 06 | broken-plan-md-references | 3 broken paths in plan.md: stale folder rename, missing SM-010 spec, wrong suggestions tracker path | Every cross-reference scan must include `plan.md` as a mandatory scan target | `02-spec/61-how-app-issues-track/06-broken-plan-md-references.md` |
| 07 | snake-case-log-keys-and-inline-calls | 100+ snake_case log keys and 2 inline function call violations across 20+ spec files | All log context keys must use camelCase; inline assignments in `if` prohibited except error/recover/comma-ok/type-assert | `02-spec/61-how-app-issues-track/07-snake-case-log-keys-and-inline-calls.md` |
| 08 | p7-inline-assignment-contradiction | P7 rule banned all inline `if` assignments, contradicting `code-style.md` which used `if err := fn(); err != nil` as correct Go | New coding standard rules must be cross-validated against existing spec code examples; rules invalidating 100+ examples are too broad | `02-spec/61-how-app-issues-track/08-p7-inline-assignment-contradiction.md` |
| 09 | magic-string-enum-comparison | `hasMismatch`/`isEqual` helpers used raw string literals instead of enum constants for status comparisons | All comparison helpers must use enum constants; `HttpMethod` enum required for all HTTP method references | `02-spec/61-how-app-issues-track/09-magic-string-enum-comparison.md` |
| 10 | domain-status-magic-strings | 130+ domain status magic strings (`'active'`, `'pending'`, etc.) across 27 spec files instead of enum constants | All domain status comparisons must use typed enum constants (e.g., `ExecutionStatus.Running`) | `02-spec/61-how-app-issues-track/10-domain-status-magic-strings.md` |
| 11 | http-method-magic-strings | 363 HTTP method magic strings (`method: 'POST'`) across 36 spec files instead of `HttpMethod` enum | All `method:` parameters in fetch/config must use `HttpMethod.*` constants | `02-spec/61-how-app-issues-track/11-http-method-magic-strings.md` |
| 12 | http-method-magic-string-remediation-plan | Prioritized 4-tier remediation plan for 363 remaining `method: "POST"` violations across 36 spec files | Run regex scan post-remediation; zero violations required | `02-spec/61-how-app-issues-track/12-http-method-magic-string-remediation-plan.md` |
| 13 | raw-filesystem-nested-if-violations | ~1,630 raw `os.*` calls across 101 files, nested `if` for error type discrimination, `os.IsNotExist` anti-pattern | All filesystem ops must use `pathutil`; no nested `if` in error handlers; no error type discrimination | `02-spec/61-how-app-issues-track/13-raw-filesystem-nested-if-violations.md` |
| 17 | missing-stack-trace-in-catch-blocks | Catch blocks log `$e->getMessage()` without passing the exception — stack trace lost, debugging impossible | Every catch block must pass `$e` to the logger; `FileLogger::error()` accepts `?Throwable`; forbidden pattern 1.8 | `02-spec/61-how-app-issues-track/17-missing-stack-trace-in-catch-blocks.md` |

---

## Key Rules

- Issue files start numbering from `03` (01=template, 02=checklist)
- Naming: `{NN}-{lowercase-hyphen-slug}.md`
- All sections from the template are mandatory
- Iterations section required if multiple attempts were needed
- Memory update is mandatory — a fix without memory update is incomplete

---

*Memory created 2026-02-22 per user request to enforce systematic issue tracking*
