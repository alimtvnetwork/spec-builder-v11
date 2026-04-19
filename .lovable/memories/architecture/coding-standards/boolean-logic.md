# Memory: architecture/coding-standards/boolean-logic
Updated: 2026-02-28
**Version:** 1.0.0  

Booleans must use 'is', 'has', 'can', 'should', or 'was' prefixes and follow strictly positive naming conventions. Negative names like 'isNotNil' or 'isNotEmpty' are prohibited; use positive equivalents like 'isDefined', 'hasContent', or 'hasItems'. Difference checks must use 'hasMismatch' instead of 'isDifferent'. Casing follows project standards: camelCase for function-level helpers (PHP/TS/unexported Go) and PascalCase for exported struct methods (C#/Go).

**Positive Counterpart Variables (P3):** When a negated boolean must be used, FIRST assign it to a positively-named variable on a separate line (e.g., `isLiveRun := !isDryRun`), THEN use the positive name in compound conditions. The `!isX` form may NEVER appear directly in a compound `&&`/`||` expression.

**Named Numeric Comparisons (P5):** Raw numeric comparisons in conditions (e.g., `statusCode < 400`) must be extracted to named booleans (e.g., `isSuccessResponse := statusCode < 400`).

**No Compound Error Conditions (P9):** `err != nil` combined with any other condition via `&&`/`||` is prohibited. Use `appError.HasError()` as the single error guard. Multiple errors must use `apperror.Combine()`, not `&&` operators. Error and domain checks must be separate `if` blocks.

**Semantic Comma-ok:** The bare `ok` variable from comma-ok patterns is prohibited. Rename to a meaningful name (`isExists`, `isFound`, `isLoaded`). If the negative case is needed, create a counterpart on the next line (`isMissing := !isExists`).

Raw string comparisons (e.g., 'status === "active"') and raw string arguments in comparison helpers are strictly prohibited for domain statuses; use typed enum constants. Exemptions for framework/runtime APIs, browser Web APIs, and language operators. Logic requiring negation must use the '!' operator on a positive guard or be extracted into a single-intent named boolean variable. Combining positive and negative conditions in a single expression is prohibited — `!isX` may only appear ALONE in a condition, never combined with other terms.

**Dual Boolean Fields (IsSuccess/IsFailed):** Any struct exposing an `IsSuccess` field MUST also expose an `IsFailed` field (or method). Code must use `result.IsFailed` instead of `!result.IsSuccess`. This eliminates negation at the call site and follows the universal no-negation-operator rule.
