# Database Conventions Rule

> **Source:** `spec/02-coding-guidelines/01-cross-language/07-database-naming.md` and `.lovable/memories/standards/database-operation-wrapper.md`  
> **Scope:** Cross-language & Database Layer

---

## Rules

1. **Table Names:** PascalCase, singular (`User`, `Project`, `File`).
2. **Column Names:** PascalCase (`PluginSlug`, `CreatedAt`, `UserId`).
3. **Index Names:** `Idx` prefix + PascalCase table and columns (`IdxTransactions_CreatedAt`).
4. **ORM-Only Policy:** Raw SQL is prohibited (exceptions: FTS5 virtual tables, vector operations, complex recursive CTEs).
5. **DBOperation Wrapper:** All database writes must use `database.NewDBOperation(tableName, opType).ExpectRows(n).Execute(...)`.
6. **Stack Traces:** Auto-capture stack traces on all database errors via `runtime.Callers()`.
7. **Affected Rows Logging:** Always record expected vs actual affected rows for write operations.
