# Boolean Principles Rule

> **Source:** `02-spec/02-coding-guidelines/01-cross-language/02-boolean-principles.md`  
> **Scope:** Cross-language (PHP, Go, TypeScript)

---

## Strict Boolean Standard

1. **Prefix Standard:** `is` and `has` prefixes ONLY are acceptable. Nothing else is acceptable, including but not limited to `can`, `should`, `was`, etc.
2. **Zero Negative Words:** Negative prefixes and words (`not`, `no`, `non`) are banned from boolean names (`isUnauthorized` instead of `isNotAuthorized`, `hasAccess` instead of `hasNoAccess`).
3. **Named Guards / No Raw Negation:** Never use `!` on function calls. Use semantic inverse methods (`isInvalid()`, `isMissing()`).
4. **Extract Complex Expressions:** Extract expressions with 2+ boolean operators to named booleans before evaluation.
5. **No Boolean Parameters:** Avoid boolean flags in function parameters; use typed parameters structs or dedicated methods.
6. **No Mixed Polarity:** Do not combine positive and negative conditions (`isX && !isY`); extract to a single-intent boolean.
