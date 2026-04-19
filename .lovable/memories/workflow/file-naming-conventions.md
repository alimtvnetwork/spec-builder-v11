# Memory: workflow/file-naming-conventions

**Updated:** 2026-02-25  
**Version:** 1.0.0  
**Scope:** All projects  

---

## Overview

File naming follows two distinct conventions depending on file type:

### 1. Spec/Documentation Files (.md)

Strictly standardized on **lowercase kebab-case** with mandatory numeric sequence prefixes.

- Format: `{NN}-{descriptive-slug}.md`
- Examples: `00-overview.md`, `01-architecture.md`, `99-consistency-report.md`
- Directories: `{NN}-{lowercase-hyphenated-slug}/`
- Reserved prefixes: 96 (AI Context), 97 (Handoff Guides), 98 (Changelogs), 99 (Consistency Reports)
- Master authority: `spec/11-spec-management-software/02-instructions/01-file-naming-convention.md`

### 2. Source Code Files (.go, .php, .ts, .tsx)

**PascalCase** naming when the file defines a **single primary type** (struct, class, component, enum).

| Language | Example | Convention |
|----------|---------|------------|
| Go | `SiteManager.go` | PascalCase matching primary struct |
| Go test | `SiteManager_test.go` | PascalCase + `_test` suffix |
| Go enum | `internal/enums/{snake_case}/Variant.go` | Package dirs stay snake_case |
| PHP | `SnapshotManager.php` | PascalCase matching primary class |
| TypeScript | `UserProfile.tsx` | PascalCase matching primary component |

**Exempt from PascalCase (stay lowercase):**
- Entry points: `main.go`, `index.ts`, `index.php`
- Multi-purpose files: `helpers.go`, `utils.ts`, `routes.go`, `middleware.go`
- Go package directories: stay `snake_case` per Go convention

---

## Cross-References

| Reference | Location |
|-----------|----------|
| Spec file naming | `spec/11-spec-management-software/02-instructions/01-file-naming-convention.md` |
| Source file naming | `spec/02-coding-guidelines/01-cross-language/00-master-coding-guidelines.md` § 1.3 |
