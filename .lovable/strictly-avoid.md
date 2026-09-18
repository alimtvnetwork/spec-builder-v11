# Strictly Avoid — Hard Prohibitions

> **Purpose:** Patterns and decisions that MUST NEVER be repeated. Each entry traces back to a solved issue or explicit user correction.

---

## Architecture & Files

- **`.lovable/memories/` (plural):** The canonical path is `.lovable/memory/` (singular). The plural form exists for historical reasons but no NEW files should be added there. See: `.lovable/prompts/01-write-memory.md`.
- **Splitting suggestions across many files:** All suggestions live in `.lovable/suggestions.md` (single file). Per user preference.
- **Splitting plans across many files:** All plans live in `.lovable/plan.md` (single file). Per user preference.
- **Touching `.release/` folder:** Never modify. Per `.lovable/user-preferences`.

---

## UI Chrome (Spec Viewer / Code Block Toolbar)

- **Single monolithic unified pill for code-block toolbar:** Rejected by user 2026-04-19. Use **discrete pill groups** separated by `gap-2` instead. See: `spec/11-spec-management-software/05-features/04-spec-editor/04-code-block-component.md` v2.0.0+.
- **Monospace fonts on chrome buttons (Ubuntu Mono, JetBrains Mono):** All chrome button labels MUST use Poppins. Per user 2026-04-19.
- **`box-shadow` glow on the language indicator dot:** Renders muddy on dark surfaces. Removed 2026-04-19.
- **Loose padding (`py-1` or larger) on pill buttons:** Use `py-[3px]` for proper density. Per reference image-17.
- **Large icons (`h-4 w-4`+) inside pills:** Use `h-3 w-3` for chrome.
- **Per-button independent borders:** For segmented groups (A-/A/A+) use ONE outer border with `border-l` internal dividers.

---

## Dependencies

- **Unpinned `axios`:** Strictly pin to `1.14.0` or `0.30.3` only. See: `.lovable/solved-issues/01-axios-version-security.md` and `mem://constraints/axios-version-pinning`.

---

## Documentation / Process

- **Implementing code in this repo without explicit request:** This is a spec-only repository (Health Dashboard UI is the sole exception). See: `.lovable/memories/constraints/01-no-code-policy.md`.
- **Boilerplate sign-offs:** Do NOT append "If you have any question and confusion..." or "Do you understand? Always add this part..." blocks. Per `.lovable/user-preferences`.
- **Code changes without minor version bump:** Every code change must bump at least minor version. Per `.lovable/user-preferences`.

---

## Code Quality & Standards (CODE RED)

- **Strict Boolean Standard:** `is` and `has` prefixes ONLY are acceptable. Nothing else is acceptable, including but not limited to `can`, `should`, `was`, etc.
- **Raw `!` Negation on Calls:** Never use `!` on function calls; call semantic inverse functions (`isInvalid()`, `isMissing()`).
- **No Bare Tuple Returns / Bare Void in Go:** Functions must return `apperror.Result[T]` or outcome structs with `*apperror.AppError`. Bare `(*Type, error)` and bare void returns are forbidden.
- **No Loose Parameters (>2-3):** Banned loose >2-3 parameters; use `*Params` structs.
- **No Raw SQL:** Use GORM and `database.NewDBOperation()` wrapper for 99% of database operations. Auto-capture stack traces via `runtime.Callers()`.
- **No Dropping Stack Traces:** Never log bare `$e->getMessage()` in catch blocks without capturing `$e->getTraceAsString()`.
- **No Weak Typing:** Prohibit `any`, `interface{}`, `map[string]any`. Strict typing with concrete structs or generic constraints.
- **PascalCase Database Naming:** Tables and custom columns must be `PascalCase`. Indexes use `Idx` prefix + `PascalCase`.
- **Never Disable CI/CD:** Never disable, comment out, bypass, or delete CI/CD checks, GitHub Actions, or tests.
- **Root README Casing:** Root readme must strictly remain lowercase `readme.md`.
- **No Defer on ZIP Writer Closure Before Return:** Never use `defer zipWriter.Close()` when returning an archive path.
- **No React Query Retry Loops:** Always configure `retry: false` and `refetchOnWindowFocus: false`.
- **No Magic String HTTP Methods:** Never use raw `"GET"`, `"POST"`, `"DELETE"`; use `HttpMethod` enum.

