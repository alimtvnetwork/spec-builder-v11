# 01 — Login Flow E2E Tests

**Version:** 1.0.0  
**Created:** 2026-03-15  
**Status:** Placeholder — awaiting implementation

---

## Purpose

End-to-end test specifications for the authentication login flow.

---

## Test Cases (Planned)

| # | Test Case | Priority | Status |
|---|-----------|----------|--------|
| 1 | Valid credentials → successful login + JWT issued | Critical | 📋 Planned |
| 2 | Invalid credentials → error message shown | Critical | 📋 Planned |
| 3 | Locked account → appropriate error + lockout timer | High | 📋 Planned |
| 4 | Remember me → persistent session | Medium | 📋 Planned |

---

## Acceptance Criteria

- GIVEN valid credentials WHEN user submits login form THEN JWT token is issued and user is redirected to dashboard
- GIVEN invalid credentials WHEN user submits login form THEN error message is displayed and no token is issued

---

*Placeholder created 2026-03-15. Full test specifications to be authored during implementation phase.*
