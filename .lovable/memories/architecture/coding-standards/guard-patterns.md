# Guard Patterns — Coding Standard

**Version:** 1.0.0  
**Last Updated:** 2026-04-01

---

## Overview

Guard patterns enforce a consistent validation flow across all safeguard scripts and validation logic. The standard requires positive existence guards with early exits — no compound checks or double negations.

## Rules

1. **Early exit on non-applicability** — If the subject (e.g., a dependency) is not present, exit immediately with a pass
2. **Fail-fast on violations** — Check the most critical condition first (e.g., range syntax before blocked versions)
3. **No compound negations** — Avoid `if NOT (A AND B)` patterns; split into sequential guards
4. **Single responsibility per guard** — Each guard checks exactly one condition

## Example Flow

```
IF NOT subjectExists:
    EXIT early (pass — not applicable)

IF hasCriticalViolation:
    FAIL immediately

IF hasBlockedValue:
    FAIL immediately

// Only reached if all guards pass
PASS
```

## Cross-References

- [Axios Package.json Safeguard](../../../../spec/10-app/axios-version-control/03-package-json-safeguard.md)
