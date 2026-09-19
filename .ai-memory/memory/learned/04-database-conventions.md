# Learned: Database Conventions & DBOperation Architecture

> **Source:** `02-spec/02-coding-guidelines/01-cross-language/07-database-naming.md` & `.lovable/memories/standards/`

---

## 1. Database Schema Naming

- **Tables:** PascalCase, singular (`User`, `Project`, `File`, `Transaction`).
- **Columns:** PascalCase (`Id`, `CreatedAt`, `UpdatedAt`, `PluginSlug`, `UserId`).
- **Foreign Keys:** `{TargetTable}Id` (`ProjectId`, `UserId`).
- **Indexes:** `Idx` prefix + PascalCase table and columns (`IdxTransaction_CreatedAt`).

## 2. ORM-Only & DBOperation Wrapper

- Raw SQL is prohibited (exceptions: SQLite FTS5 full-text search, vector operations, complex recursive CTEs).
- Relationship-First Pattern: Query parent model, modify relationship slice, save parent.
- All database operations must go through the centralized wrapper:
  ```go
  op := database.NewDBOperation("TableName", database.OpCreate).ExpectRows(1)
  result := op.Execute(func() (int64, error) {
      tx := r.db.Create(entity)
      return tx.RowsAffected, tx.Error
  })
  ```
- Auto-captures stack traces on failure and logs expected vs actual affected rows.
