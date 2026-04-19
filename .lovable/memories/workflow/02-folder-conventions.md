# Memory: workflow/folder-conventions

**Updated:** 2026-04-01  
**Version:** 2.0.0  
**Status:** Active  
**Spec Location:** `spec/00-folder-structure-guideline.md`

---

## Overview

Standardized folder and file naming conventions across all specifications.

---

## Folder Naming

- **Root folders**: `{nn}-{name}` (e.g., `20-gsearch-cli`)
- **Subfolders**: `{nn}-{name}` (e.g., `01-backend`, `02-frontend`)
- **Format**: Lowercase kebab-case with number prefix

---

## File Naming

- **Overview files**: Always `00-overview.md`
- **Spec files**: `{nn}-{name}.md` (e.g., `01-cli-framework.md`)
- **Consistency reports**: Always `99-consistency-report.md`
- **Format**: Lowercase kebab-case with number prefix

---

## CLI Structure

All CLIs follow three-folder structure:

```
{nn}-{cli-name}/
├── 00-overview.md
├── 01-backend/
├── 02-frontend/
├── 03-deploy/
└── 99-consistency-report.md
```

---

## Root Folder Index (Grouped)

### Foundation & Standards (01–08)

| # | Folder |
|---|--------|
| 01 | general-spec |
| 02 | coding-guidelines |
| 03 | error-code-registry |
| 04 | error-resolution |
| 05 | spec-authoring-guide |
| 06 | split-db-architecture |
| 07 | seedable-config-architecture |
| 08 | generic-enforce |

### Core Application (10–11)

| # | Folder |
|---|--------|
| 10 | app |
| 11 | spec-management-software |

### CLI Tools (20–28)

| # | Folder |
|---|--------|
| 20 | gsearch-cli |
| 21 | brun-cli |
| 22 | ai-bridge-cli |
| 23 | ai-bridge-non-vector-rag |
| 24 | nexus-flow-cli |
| 25 | spec-reverse-cli |
| 26 | ai-transcribe-cli |
| 27 | license-manager |
| 28 | shared-cli-frontend |

### WordPress (30–33)

| # | Folder |
|---|--------|
| 30 | wp-plugin |
| 31 | wp-plugin-builder |
| 32 | wp-seo-publish-cli |
| 33 | wp-plugin-development |

### Time Log (40–42)

| # | Folder |
|---|--------|
| 40 | time-log-cli |
| 41 | time-log-ui |
| 42 | time-log-combined |

### Utilities (50–53)

| # | Folder |
|---|--------|
| 50 | powershell-integration |
| 51 | upload-scripts |
| 52 | shared-preset-data |
| 53 | e2-activity-feed |

### Research & Tracking (60–61)

| # | Folder |
|---|--------|
| 60 | ai-research |
| 61 | how-app-issues-track |
