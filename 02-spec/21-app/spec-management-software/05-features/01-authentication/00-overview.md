# Feature: Authentication

**Version:** 2.1.0  
**Status:** Planned  
**Updated:** 2026-03-30    
**AI Confidence:** High  
**Ambiguity:** None

---


## Keywords

`authentication`, `features`, `management`, `software`

---

## Scoring

| Criterion | Status |
|-----------|--------|
| `00-overview.md` present | ✅ |
| AI Confidence assigned | ✅ |
| Ambiguity assigned | ✅ |
| Keywords present | ✅ |
| Scoring table present | ✅ |


## Summary

User authentication system with secure login, session management, password reset, and brute-force protection.

---

## User Stories

- As a user, I want to log in with email and password so that I can access my projects
- As a user, I want to reset my password if I forget it
- As a user, I want my session to persist across browser restarts
- As an admin, I want to see failed login attempts to detect attacks

---

## Components

| # | Component | Type | Description |
|---|-----------|------|-------------|
| 01 | [Authentication](./01-authentication.md) | Backend | Core auth system, JWT tokens |
| 02 | [Frontend Security](./02-frontend-security.md) | Frontend | Client-side auth, token storage |

---

## Key Features

- **JWT Tokens:** 15-minute access, 14-day refresh with rotation
- **Password Hashing:** Argon2id with bcrypt fallback
- **Session Management:** SQLite-based with revocation
- **Brute-Force Protection:** Progressive lockout (30s → 5m → 30m → permanent)

---

## Dependencies

- [Database Schema](../../07-database-design/01-schema.md)
- [Error Management](../../06-error-management/02-backend/01-error-codes.md)

---

## E2E Tests

| # | Test | Priority |
|---|------|----------|
| 01 | [Login Flow](./tests/01-login-e2e.md) | Critical |
| 02 | [Password Reset](./tests/02-password-reset-e2e.md) | High |
| 03 | [Session Expiry](./tests/03-session-expiry-e2e.md) | High |

---

## Related Specs

- [Database Schema](../../07-database-design/01-schema.md)
