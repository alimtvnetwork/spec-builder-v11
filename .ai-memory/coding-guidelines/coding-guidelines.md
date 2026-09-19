# Master Coding Guidelines

> **Source:** `02-spec/02-coding-guidelines/01-cross-language/15-master-coding-guidelines.md`  
> **Applies to:** PHP, Go, TypeScript

---

## 1. Strict Boolean Standard

- **Prefixes:** `is` and `has` prefixes ONLY are acceptable. Nothing else is acceptable, including but not limited to `can`, `should`, `was`, etc.
- **No Negatives:** Negative words (`not`, `no`, `non`) are strictly banned in boolean variable or method names.
- **Named Guards:** Never use `!` on function calls. Call semantic inverse functions (`isInvalid()`, `isMissing()`).

## 2. Naming Conventions

- **Types, Structs & Classes:** PascalCase (`UserManager`, `SearchResult`).
- **Variables & Functions:** camelCase (`userId`, `getExamById()`).
- **Database Tables & Columns:** PascalCase (`User`, `ExamParticipant`, `CreatedAt`, `UserId`).
- **Database Indexes:** `Idx` prefix + PascalCase (`IdxUser_Email`).
- **Files:** PascalCase for files with a single primary definition (`UserService.ts`, `SnapshotManager.go`). Lowercase only for entry points (`index.ts`, `main.go`).
- **Abbreviations Standard:** Capitalize only first letter (`Id`, `Url`, `Api`, `Json`, `Sql`, `Http`, `Db`).
- **Zero Underscore Policy:** Logic-level variables and object properties must not use `snake_case`.

## 3. Formatting & Code Style

- **Braces:** Always required on all control flow; no single-line `if`.
- **Flat Flow:** Zero nested `if` statements. Early return / guard clauses only.
- **Vertical Spacing:** Blank line before `if`, after closing brace `}`, before `return`/`throw`.
- **Function Limit:** 15 lines maximum per function body (8 lines preferred).
- **Multiline Arguments:** Parameter lists and calls with >2 arguments formatted one per line with trailing commas.
- **Parameter Structs:** Banned loose >2-3 parameters; use `*Params` structs.

## 4. Error Management & Envelopes

- **Standard Envelopes:** `{ success: boolean, data: T, error?: ApiError, meta: ApiMeta }`.
- **Go Results:** Return `apperror.Result[T]` or outcome structs with `*apperror.AppError`. Bare tuple returns `(*Type, error)` and bare void returns are forbidden.
- **Stack Traces:** Mandatory on all logged errors (`runtime.Callers()` in Go, `$e->getTraceAsString()` in PHP).
- **Serializability:** `*AppError` is serializable across processes and APIs.
