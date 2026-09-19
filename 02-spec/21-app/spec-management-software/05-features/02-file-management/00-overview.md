# Feature: File Management

**Version:** 3.1.0  
**Status:** Complete  
**Updated:** 2026-03-30    
**AI Confidence:** High  
**Ambiguity:** None

---


## Keywords

`features`, `file`, `management`, `software`

---

## Scoring

| Criterion | Status |
|-----------|--------|
| `00-overview.md` present | ✅ |
| AI Confidence assigned | ✅ |
| Ambiguity assigned | ✅ |
| Keywords present | ✅ |
| Scoring table present | ✅ |


## Summary

File system operations including CRUD, path validation, optimistic locking, and directory management for specification files.

---

## User Stories

- As a user, I want to create, read, update, and delete spec files
- As a user, I want to organize files in folders
- As a user, I want to be warned if I'm about to overwrite someone's changes
- As a user, I want to rename and move files without breaking links

---

## Components

| # | Component | Type | Description |
|---|-----------|------|-------------|
| 01 | [File Operations](./01-file-operations.md) | Backend | CRUD, validation, locking |
| 02 | [Path Manager](./02-path-manager.md) | Backend | Path validation, normalization |
| 03 | [Folder Tree](./03-folder-tree.md) | Frontend | File/folder navigation UI |
| 04 | [Folder Sync](./04-folder-sync.md) | Frontend | Filesystem reconciliation UI |
| 05 | [External File Safety](./05-external-file-safety.md) | Backend | Consent for external operations |
| 06 | [Trash System](./06-trash-system.md) | Backend | Recoverable delete with trash bin |

---

## Key Features

- **Path Validation:** No traversal, max 255 chars, prefix numbering
- **Optimistic Locking:** SHA-256 expectedHash for conflict detection
- **Bulk Operations:** Multi-file create/update/delete
- **Trash Bin:** All deletes go to recoverable trash (30-day retention)
- **External Safety:** Consent dialogs for operations outside project root
- **Immediate Git Commits:** Move/rename operations create instant commits for reversibility

---

## Error Codes

| Code | Constant | Description |
|------|----------|-------------|
| 6001 | `ErrFsNotFound` | File not found |
| 6004 | `ErrFsInvalidPath` | Invalid path |
| 6005 | `ErrFsTraversal` | Path traversal attempt |
| 6009 | `ErrFsHashMismatch` | Optimistic lock failure |

---

## Dependencies

- [Coding Guidelines](../../04-coding-guidelines/00-overview.md)
- [Error Management](../../06-error-management/02-backend/01-error-codes.md)

---

## E2E Tests

| # | Test | Priority |
|---|------|----------|
| 01 | [File CRUD](./tests/01-file-crud-e2e.md) | Critical |
| 02 | [Conflict Resolution](./tests/02-conflict-resolution-e2e.md) | High |

---

## Related Specs

- [Path Manager](./02-path-manager.md)
