# Instruction: File Naming Convention

**Version:** 2.0.0  
**Status:** Active  
**Created:** 2026-03-09  
**Updated:** 2026-03-09  

---

## Purpose

This document defines the mandatory file naming convention for all **Markdown specification files** in this repository. Source code files (`.go`, `.php`, `.ts`, `.tsx`) follow PascalCase naming — see [Master Coding Guidelines § 1.3](../../02-coding-guidelines/01-cross-language/15-master-coding-guidelines.md).

---

## Rules

### 1. All Lowercase

Every filename MUST be entirely lowercase. No uppercase letters are permitted.

```
❌ CHANGELOG.md
❌ AI-HANDOFF-GUIDE.md
❌ CONTEXT-FOR-AI.md
❌ README.md
❌ 00-Overview.md

✅ 98-changelog.md
✅ 97-ai-handoff-guide.md
✅ 96-context-for-ai.md
✅ readme.md
✅ 00-overview.md
```

### 2. Numeric Sequence Prefix

Every Markdown file MUST have a two-digit (or three-digit for large sets) numeric prefix followed by a hyphen.

```
Format: {NN}-{descriptive-slug}.md

Examples:
  00-overview.md
  01-architecture.md
  02-data-models.md
  15-error-codes.md
  99-consistency-report.md
```

### 3. Hyphen-Separated Words

Use hyphens (`-`) to separate words. No underscores, no spaces, no camelCase.

```
❌ file_naming_convention.md
❌ fileNamingConvention.md
❌ file naming convention.md

✅ 01-file-naming-convention.md
```

### 4. Directory Naming

Directories follow the same convention: lowercase, numeric prefix, hyphen-separated.

```
Format: {NN}-{descriptive-slug}/

Examples:
  01-authentication/
  05-features/
  22-golang-search-cli/
```

---

## Reserved Prefixes

| Prefix | Purpose | Example |
|--------|---------|---------|
| `00-` | Index / overview file | `00-overview.md` |
| `01-95` | Content files (sequential) | `04-monaco-configuration.md` |
| `96-` | AI context files | `96-context-for-ai.md` |
| `97-` | AI handoff / training guides | `97-ai-handoff-guide.md` |
| `98-` | Changelog / version history | `98-changelog.md` |
| `99-` | Meta files (reports, consistency) | `99-consistency-report.md` |

---

## Sequence Number Assignment

### Standard Feature Folder (≤30 files)
```
00-overview.md          ← Always first
01-architecture.md      ← Core architecture
02-data-models.md       ← Data layer
03-api-interface.md     ← API surface
...                     ← Sequential by topic
98-test-plan.md         ← Testing (if needed)
99-consistency-report.md ← Meta/reports
```

### Large Feature Folder (30+ files)
Use sequential numbering from `00` through `32+`:
```
00-overview.md
01-first-topic.md
02-second-topic.md
...
32-last-topic.md
99-consistency-report.md
```

### Root-Level Spec Folder
```
95-master-index.md
00-overview.md
96-context-for-ai.md
97-ai-handoff-guide.md
98-changelog.md
99-consistency-report.md
99-cross-reference-validation-report.md
```

---

## Validation Rules

When reviewing or creating files, enforce these checks:

1. **No uppercase letters** in any filename or directory name
2. **Numeric prefix present** on every `.md` file
3. **Hyphen separators** between all words
4. **`.md` extension** (lowercase) on all Markdown files
5. **`00-overview.md`** exists in every directory that contains 2+ files
6. **No gaps** in sequence numbers (preferred but not strict)
7. **No duplicate** sequence numbers within the same directory

---

## Remediation Pattern

When encountering non-compliant files:

```
1. RENAME the file to lowercase with sequence number
2. UPDATE all cross-references in files that link to the old name
3. VERIFY no broken links remain (search for old filename)
4. DOCUMENT the rename in the changelog
```

### Search Command for Validation

To find non-compliant files:

```bash
# Find uppercase .md files
find . -name "*.md" | grep -E "[A-Z]"

# Find .md files without numeric prefix
find . -name "*.md" | grep -vE "/[0-9]{2,3}-"
```

---

## AI Instruction Template

Copy and paste this block when instructing another AI:

```
### File Naming Rules (MANDATORY)

**Spec/Markdown files** in this project MUST follow this convention:

- Format: `{NN}-{lowercase-hyphenated-slug}.md`
- Examples: `00-overview.md`, `01-architecture.md`, `99-consistency-report.md`
- Directories: `{NN}-{lowercase-hyphenated-slug}/`
- NO uppercase letters anywhere in filenames or directory names
- NO underscores or spaces — use hyphens only
- Every directory with 2+ files must have `00-overview.md`
- Prefix `99-` is reserved for meta/report files
- Prefix `96-98` is reserved for special project files (context, handoff, changelog)

**Source code files** (.go, .php, .ts, .tsx) follow PascalCase naming:

- Single-definition files: `{DefinitionName}.ext` (e.g., `SiteManager.go`, `UserProfile.tsx`)
- Entry/utility files stay lowercase: `main.go`, `index.ts`, `helpers.go`
- Go test files: `{DefinitionName}_test.go`
- Go package directories stay snake_case

When creating new files, use the next available sequence number in the target directory.
When renaming existing files, update ALL cross-references across the repository.
```

---

## Related

- [File Structure Conventions](../../../.lovable/memories/spec-management/file-structure-conventions.md)
- [Master Index](../95-master-index.md)
- [Changelog](../98-changelog.md)
