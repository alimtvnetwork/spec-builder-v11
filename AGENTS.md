# AGENTS.md

> **Repository:** `alimtvnetwork/spec-builder-v11`  
> **Status:** SPECIFICATION-ONLY REPOSITORY  
> **Version:** 3.19.0  
> **Authority:** `02-spec/` is the single source of truth

---

## 🚨 CODE RED Prohibitions (Non-Negotiable)

1. **NO APPLICATION CODE IN THIS REPO:** This is a specification-only repository. Never implement backend Go/PHP/Rust or frontend application features here (except the companion Health Dashboard under `src/`).
2. **NEVER DISABLE CI/CD CHECKS:** Never comment out, bypass, or delete CI/CD steps or workflows to force a pipeline to pass.
3. **STRICT BOOLEAN STANDARD:** `is` and `has` prefixes ONLY are acceptable. Nothing else is acceptable, including but not limited to `can`, `should`, `was`, etc. Never use negative names (`isNotReady`, `hasNoAccess`). Never use raw `!` negation on function calls. Positive existence checks must use `isDefined` (never inverted negative `!isEmpty`).
4. **NO BARE TUPLE RETURNS IN GO / NO BARE VOID:** Functions must return `result.Result[T]`, `result.ResultSlice[T]`, or outcome structs with `*appfault.AppError`. Bare `(*Type, error)` and bare void returns are forbidden.
5. **NO LOOSE PARAMETERS (>2-3):** Banned loose >2-3 parameters; use `*Params` structs.
6. **NO RAW SQL:** Use GORM and `database.NewDBOperation()` wrapper for 99% of database operations. Auto-capture stack traces via `runtime.Callers()`.
7. **NO WEAK TYPING:** Prohibit `any`, `interface{}`, `map[string]any`. Strict typing with concrete structs or generic constraints.
8. **PASCALCASE DATABASE NAMING:** Tables and custom columns must be `PascalCase`. Indexes use `Idx` prefix + `PascalCase`.
9. **ROOT README CASING:** Root readme must strictly remain lowercase `readme.md`.
10. **EXACT AXIOS PINNING:** Range syntax (`^`, `~`) is strictly prohibited. Only exact versions `1.14.0` or `0.30.3` are allowed. Versions `1.14.1` and `0.30.4` are banned.
11. **ZERO-STORAGE GITHUB ACTIONS MANDATE:** Never use `actions/upload-artifact` in GitHub Actions for routine artifacts, test reports, or logs. Stream to `$GITHUB_STEP_SUMMARY` and workflow annotations.
12. **STRICT RELATIVE GIT PATHS:** Never write literal absolute filesystem paths or drive-letter `file:///` URIs in repository files. Use relative repo paths exclusively.
13. **CENTRALIZED TYPES IN `types.go`:** All domain structs, generic Result type aliases (e.g. `type SearchResultSlice = result.ResultSlice[SearchResult]`), and payload definitions must be centralized in dedicated `types.go` files.
14. **TOP-INSTRUCTION PRIORITY MANDATE:** Any directive, constraint, or checklist declared at the top of a specification or task prompt takes highest priority and strictly overrides conflicting general advice.

---

## 📐 Formatting & Structure Standards

- **Braces:** Always use braces — no single-line `if`.
- **Zero Nested `if`:** Use early return / guard clauses exclusively.
- **Vertical Line Gaps:** Mandatory blank lines before `if`, after `}`, before `return`/`throw`, around multiline struct calls, and between headers and lists.
- **Function Caps:** Maximum 15 lines per function body (8 lines preferred).
- **Multiline Arguments:** Function calls or signatures with >2 parameters must format one argument per line with trailing commas.
- **Abbreviations Standard:** PascalCase abbreviations: `Id`, `Url`, `Api`, `Http`, `Html`, `Json`, `Sql`, `Db`.
- **Micro-Batching:** All refactors and tasks broken into 5–8 file bounded batches.
