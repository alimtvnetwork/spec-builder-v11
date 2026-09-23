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

- **Single monolithic unified pill for code-block toolbar:** Rejected by user 2026-04-19. Use **discrete pill groups** separated by `gap-2` instead. See: `02-spec/11-spec-management-software/05-features/04-spec-editor/04-code-block-component.md` v2.0.0+.
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
- **Consolidating or Shrinking Detailed Specifications (TOTAL BAN):** NEVER consolidate, summarize, resume, or shrink detailed specifications, architectural designs, domain models (e.g. `02-spec/21-app/`), or complex requirement documents.

---

## Code Quality & Standards (CODE RED)

- **Strict Boolean Standard:** `is` and `has` prefixes ONLY are acceptable. Nothing else is acceptable, including but not limited to `can`, `should`, `was`, etc.
- **Positive Logic / `isDefined` Mandate:** NEVER invert negative emptiness checks (e.g. `!isEmpty`, `!is_empty`) to assert defined existence. Positive definition checks MUST use `isDefined`.
- **Raw `!` Negation on Calls:** Never use `!` on function calls; call semantic inverse functions (`isInvalid()`, `isMissing()`).
- **No Bare Tuple Returns / Bare Void in Go:** Functions must return `result.Result[T]`, `result.ResultSlice[T]`, or outcome structs with `*appfault.AppError`. Bare `(*Type, error)` and bare void returns are forbidden.
- **No Loose Parameters (>2-3):** Banned loose >2-3 parameters; use `*Params` structs.
- **No Raw SQL:** Use GORM and `database.NewDBOperation()` wrapper for 99% of database operations. Auto-capture stack traces via `runtime.Callers()`.
- **No Dropping Stack Traces:** Never log bare `$e->getMessage()` in catch blocks without capturing `$e->getTraceAsString()`.
- **No Weak Typing:** Prohibit `any`, `interface{}`, `map[string]any`. Strict typing with concrete structs or generic constraints.
- **Centralized Types in `types.go`:** NEVER scatter type declarations across multiple implementation files instead of centralizing them in `types.go`. Define domain structs and single reusable Result type aliases (`type SearchResultSlice = result.ResultSlice[SearchResult]`) in `types.go`.
- **PascalCase Database Naming:** Tables and custom columns must be `PascalCase`. Indexes use `Idx` prefix + `PascalCase`.
- **Never Disable CI/CD:** Never disable, comment out, bypass, or delete CI/CD checks, GitHub Actions, or tests.
- **Zero-Storage GitHub Actions Mandate:** NEVER use `actions/upload-artifact` in GitHub Actions for routine artifacts, test reports, or logs. Stream to `$GITHUB_STEP_SUMMARY` and console stdout.
- **Root README Casing:** Root readme must strictly remain lowercase `readme.md`.
- **No Absolute Paths / URIs in Repo:** NEVER write absolute filesystem paths or literal `file:///` drive-letter URIs in repo files. Use relative repo paths exclusively.
- **Non-`er` Go Interface Suffixes (TOTAL BAN):** NEVER name Go interfaces with non-`er` suffixes (e.g. `Creator`, `Descriptor`) or `Interface`. All Go interfaces MUST end in `er`.
- **Writing Memory Without Inspecting Last 30 Commits (TOTAL BAN):** NEVER author or update memory files without first executing `git log -n 30 --oneline`.
- **Writing Memory Without Verifying Recent 20-Task Register (TOTAL BAN):** NEVER author or update memory files without auditing `.ai-memory/plans/01-index.md` and maintaining the Recent Completed Tasks Register.
- **No Defer on ZIP Writer Closure Before Return:** Never use `defer zipWriter.Close()` when returning an archive path.
- **No React Query Retry Loops:** Always configure `retry: false` and `refetchOnWindowFocus: false`.
- **No Magic String HTTP Methods:** Never use raw `"GET"`, `"POST"`, `"DELETE"`; use `HttpMethod` enum.
