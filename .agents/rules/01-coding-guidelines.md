# Coding Guidelines Rule

> **Source:** `02-spec/02-coding-guidelines/01-cross-language/15-master-coding-guidelines.md`  
> **Scope:** Cross-language (PHP, Go, TypeScript)

---

## Rules

1. **Source File Naming:** PascalCase for single primary type files (`UserService.ts`, `SnapshotManager.go`). Lowercase only for module entry points (`index.ts`, `main.go`).
2. **Abbreviation Casing:** First letter capitalized only (`PostId`, `FileUrl`, `ApiKey`, `HttpTimeout`).
3. **Function Limits:** Maximum 15 lines per body; 8 lines preferred.
4. **Zero Nested `if`:** Use early return / guard patterns.
5. **Brace Formatting:** Always use braces; never omit braces for single-line statements.
6. **Blank Lines:** Mandatory blank line after closing brace `}` before following statements, and before `return`/`throw`.
7. **Parameter Formatting:** Function signatures and calls with >2 arguments must be placed on separate lines with trailing commas.
8. **Zero Underscore Policy:** Logic-level identifiers must not use `snake_case` (camelCase for variables, PascalCase for types).
