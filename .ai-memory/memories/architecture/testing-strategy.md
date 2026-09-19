# Memory: architecture/testing-strategy

**Updated:** 2026-03-12  
**Version:** 1.0.0  
**Status:** Active  
**Spec Locations:**
- `02-spec/02-coding-guidelines/01-cross-language/14-test-naming-and-structure.md`
- `02-spec/11-spec-management-software/05-features/20-testing/01-test-strategy.md`

---

## Test Pyramid Distribution

| Layer | Weight | Rationale |
|-------|--------|-----------|
| **Integration** | 60% | Service-orchestrator architecture prioritises interaction boundaries |
| **Unit** | 30% | Pure functions, helpers, algorithms |
| **E2E** | 10% | Critical user flows only |

This inverted-classic pyramid reflects that most bugs surface at service boundaries (DB, API, inter-module calls), not inside isolated units.

---

## Naming Convention

All test functions follow: **`Test{Unit}_{Scenario}_{ExpectedOutcome}`**

- Three or more scenarios → table-driven tests required
- AAA pattern (Arrange–Act–Assert) with blank-line separation
- Go helpers must call `t.Helper()`

---

## Coverage Targets

| Area | Minimum | Target |
|------|---------|--------|
| Critical algorithms | 95% | 100% |
| Service layer | 80% | 90% |
| Helpers / utils | 90% | 100% |
| Overall | 75% | 85% |

---

## Testing Stack

| Tool | Purpose |
|------|---------|
| Vitest | Frontend unit & integration |
| React Testing Library | Component testing |
| MSW | API mocking |
| Playwright | E2E |
| PHPUnit | WordPress plugin backend |

---

## Key Principles

1. **Isolation** — No shared mutable state between tests
2. **Skippable integration** — Integration tests gate on env availability
3. **Deterministic** — No flaky time/network dependencies; use fakes
4. **Fast feedback** — Unit tests < 5 s total; integration < 30 s

---

## Cross-References

| Document | Relationship |
|----------|--------------|
| [Test Naming & Structure](../../../02-spec/02-coding-guidelines/01-cross-language/14-test-naming-and-structure.md) | Naming rules R1–R7 |
| [Master Coding Guidelines §13](../../../02-spec/02-coding-guidelines/01-cross-language/15-master-coding-guidelines.md) | Index entry |
| [Frontend Test Strategy](../../../02-spec/11-spec-management-software/05-features/20-testing/01-test-strategy.md) | Frontend-specific detail |
| [WP Plugin Testing](../../../02-spec/30-wp-plugin/03-exam-manager/01-admin-backend/02-split-spec/41-testing-requirements.md) | PHPUnit / plugin tests |
