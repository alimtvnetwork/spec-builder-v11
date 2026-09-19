# Memory: standards/orm-only-policy

**Updated:** 2026-02-04  
**Version:** 1.0.0  
**Status:** Active  
**Priority:** Critical

---

## Overview

Raw SQL is forbidden in 99% of cases. All database operations MUST use GORM with the relationship-first pattern.

---

## The Rule

| ❌ Never Do | ✅ Always Do |
|-------------|--------------|
| `db.Exec("INSERT...")` | `db.Create(&model)` |
| `db.Raw("SELECT...")` | `db.Find(&models)` |
| `db.Exec("UPDATE...")` | `db.Save(&model)` |
| Direct SQL joins | `db.Preload()` / `db.Joins()` |

---

## Relationship-First Pattern

**Principle:** Find the parent model first, then manipulate its relationships through GORM.

### Insert Related Data

```go
// ❌ WRONG: Raw SQL
db.Exec("INSERT INTO File (ProjectId, Name) VALUES (?, ?)", projectId, name)

// ✅ CORRECT: Relationship-first
var project Project
db.First(&project, "Id = ?", projectId)
project.Files = append(project.Files, File{Name: name})
db.Save(&project)
```

### Update with Foreign Key

```go
// ❌ WRONG: Raw UPDATE
db.Exec("UPDATE File SET ProjectId = ? WHERE Id = ?", newProjectId, fileId)

// ✅ CORRECT: Load, modify, save
var file File
db.First(&file, "Id = ?", fileId)
file.ProjectId = newProjectId
db.Save(&file)
```

### Complex Joins

```go
// ❌ WRONG: Raw SQL JOIN
db.Raw("SELECT * FROM Project p JOIN File f ON p.Id = f.ProjectId WHERE f.Type = ?", fileType)

// ✅ CORRECT: GORM Preload/Joins
db.Preload("Files", "Type = ?", fileType).Find(&projects)
// OR
db.Joins("JOIN File ON File.ProjectId = Project.Id").
    Where("File.Type = ?", fileType).
    Find(&projects)
```

---

## Only Acceptable Raw SQL Exceptions

| Exception | Reason |
|-----------|--------|
| FTS5 Virtual Tables | SQLite full-text search has no GORM equivalent |
| Vector Storage | If no ORM support for vector operations |
| Complex CTEs | Recursive queries not supported by GORM |
| PRAGMA Statements | SQLite configuration commands |

**If using raw SQL for exceptions:** Document the reason in code comments.

---

## Model Manipulation Workflow

```
1. Find parent model by ID → db.First(&parent, id)
2. Preload relationships if needed → db.Preload("Children").First(&parent, id)
3. Modify Go struct directly → parent.Name = "New Name"
4. Append to relationships → parent.Children = append(parent.Children, child)
5. Save via GORM → db.Save(&parent)
```

---

## Benefits of ORM-Only

| Benefit | Description |
|---------|-------------|
| Stack Traces | DBOperation wrapper captures caller chain |
| Type Safety | Go compiler catches model mismatches |
| Validation | GORM validates constraints before execution |
| Consistency | Same patterns across all repositories |
| Debugging | Structured logs with table names |

---

## Cross-References

| Document | Path |
|----------|------|
| Database SQL Standards | `02-spec/11-spec-management-software/12-prompts/01-coding-guideline/02-database-sql.md` |
| DBOperation Wrapper | `02-spec/11-spec-management-software/13-shared-packages/06-pkg-database-operations.md` |
| Go Debugging Guide | `02-spec/04-error-resolution/03-debugging-guides/02-debugging-go.md` |

---

*Work with models, not SQL strings.*
