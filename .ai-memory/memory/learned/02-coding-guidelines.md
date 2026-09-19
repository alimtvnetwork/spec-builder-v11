# Learned: Master Coding Guidelines

> **Source:** `02-spec/02-coding-guidelines/` & `.lovable/coding-guidelines/coding-guidelines.md`

---

## 1. Strict Boolean Standard

- Prefix standard: `is` and `has` prefixes ONLY are acceptable. Nothing else is acceptable, including but not limited to `can`, `should`, `was`, etc.
- No negative names: `isUnauthorized` instead of `isNotAuthorized`, `hasAccess` instead of `hasNoAccess`.
- Named guards: Never use raw `!` on function calls; call semantic inverse functions (`if ($order->isInvalid())`).
- Extract complex expressions with 2+ operators into named booleans.
- No boolean arguments in function calls (use options structs).
- No mixed polarity (`isX && !isY`).

## 2. Universal Naming Standards

- Identifiers: PascalCase for types/structs/classes/enums; camelCase for variables/methods/properties; SCREAMING_SNAKE_CASE for non-error constants.
- Abbreviations: PascalCase abbreviations (`PostId`, `ApiUrl`, `JsonData`, `DbConnection`).
- File Names: PascalCase for single primary type files (`UserService.ts`, `SnapshotManager.go`). Lowercase only for entry points (`index.ts`, `main.go`).
- Zero Underscore Policy: Logic-level variables and object properties must not use `snake_case`.

## 3. Formatting & Structure

- Maximum 15 lines per function body (8 lines preferred).
- Zero nested `if` statements. Early return only.
- Mandatory blank lines: before `if`, after closing brace `}`, before `return`/`throw`.
- Function signatures and invocations with >2 parameters must format one argument per line with trailing commas.
- Parameter Structs: Banned loose >2-3 parameters; use `*Params` structs.
