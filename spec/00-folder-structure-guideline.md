# Spec Folder Structure Guideline

> **Version:** 6.0.0  
> **Last Updated:** 2026-03-30  
> **Status:** PRODUCTION-READY

---

## Overview

This document defines the organizational structure for all specification files within the `spec/` directory. It ensures consistent naming, logical grouping, and easy navigation for both human developers and AI agents.

**This is the MASTER GUIDE** for how specifications are managed across all projects.  
**See also:** [05-spec-authoring-guide/](./05-spec-authoring-guide/00-overview.md) for detailed authoring instructions.

---

## Key Principles

1. **Consistency First** — All files follow strict naming conventions
2. **AI-Optimized** — Structure enables RAG indexing and retrieval
3. **Hierarchical Organization** — Nested folders for logical grouping
4. **Cross-Reference Rich** — All specs link to related specs
5. **Version Controlled** — All files include version, status, and date
6. **Pipeline-Aligned** — Folder structure mirrors the spec generation pipeline

---

## Global Spec Directory Structure (v6.0)

```
spec/
├── 00-folder-structure-guideline.md       # THIS FILE - Master structure guide
├── 02-prefix-disambiguation.md            # Historical prefix duplication note
│
├── 01-general-spec/                        # Architecture-wide standards
│   ├── 00-overview.md
│   ├── 01-foundation/
│   ├── 02-systems/
│   ├── 03-quality/
│   └── ...
│
├── 11-spec-management-software/            # Spec Management Tool (legacy numbering)
│   ├── 00-overview.md
│   ├── 01-ideas/
│   ├── 02-instructions/
│   └── ...
│
├── 02-coding-guidelines/                   # Master Coding Standards
│   ├── 01-cross-language/
│   ├── 02-typescript/
│   ├── 03-golang/
│   ├── 04-php/
│   └── 05-rust/
│
├── 06-split-db-architecture/               # Hierarchical SQLite Pattern
├── 07-seedable-config-architecture/        # Seedable Config + Changelog
├── 50-powershell-integration/              # Build & Run Scripts
├── 03-error-code-registry/                 # Global Error Code Registry
│
├── 05-spec-authoring-guide/                # How to write and manage specs
│   ├── 00-overview.md
│   ├── 01-folder-structure.md
│   ├── 02-naming-conventions.md
│   └── ...
│
├── 20-gsearch-cli/                         # GSearch CLI Tool
│   ├── 00-overview.md
│   ├── 01-backend/
│   ├── 02-frontend/
│   └── 03-deploy/
│
├── 21-brun-cli/                            # BRun CLI Tool
│   ├── 00-overview.md
│   ├── 01-backend/
│   ├── 02-frontend/
│   └── 03-deploy/
│
├── 22-ai-bridge-cli/                       # AI Bridge CLI Tool
│   ├── 00-overview.md
│   ├── 01-backend/
│   ├── 02-frontend/
│   └── 03-deploy/
│
├── 24-nexus-flow-cli/                      # Nexus Flow CLI Tool
│   ├── 00-overview.md
│   ├── 01-backend/
│   ├── 02-frontend/
│   └── 03-deploy/
│
├── 30-wp-plugin/                           # WordPress Plugin
├── 31-wp-plugin-builder/                   # WP Plugin Builder
│
├── 25-spec-reverse-cli/                    # Spec Reverse CLI
│   ├── 00-overview.md
│   ├── 01-backend/
│   ├── 02-frontend/
│   └── 03-deploy/
│
├── 26-ai-transcribe-cli/                   # AI Transcribe CLI
├── 60-ai-research/                         # AI Research
├── 04-error-resolution/                    # Error Resolution & Debugging
│   ├── 00-overview.md
│   ├── 01-retrospectives/
│   ├── 02-verification-patterns/
│   └── 03-debugging-guides/
│
├── 27-license-manager/                     # License Manager CLI
│
├── 28-shared-cli-frontend/                 # Shared CLI Frontend Pattern
│   ├── 00-overview.md
│   └── ...
│
├── 32-wp-seo-publish-cli/                  # WP SEO Publish CLI
├── 61-how-app-issues-track/                # Issue Tracking & Prevention
│
├── 33-wp-plugin-development/               # WordPress Plugin Architecture
├── 51-upload-scripts/                      # Utility Scripts
├── 53-e2-activity-feed/                    # Activity Tracking
├── 08-generic-enforce/                     # General Enforcement Rules
├── 52-shared-preset-data/                  # Shared preset/seed data
├── 23-ai-bridge-non-vector-rag/            # Non-Vector RAG
│
├── 40-time-log-cli/                        # Time Log CLI (Rust)
│   ├── 00-overview.md
│   ├── 01-backend/
│   └── 03-deploy/
│
├── 41-time-log-ui/                         # Time Log UI (React)
│   ├── 00-overview.md
│   ├── 02-frontend/
│   └── 03-deploy/
│
├── 42-time-log-combined/                   # Time Log Combined References
│
├── 99-archive/                             # Completed/deprecated artifacts
├── 99-consistency-report.md                # Global consistency report
│
└── validation-reports/                     # Audit artifacts
```

---

## CLI Folder Structure Standard

Every CLI project MUST follow this three-folder structure:

```
{XX}-{cli-name}/
├── 00-overview.md                          # CLI overview and summary
│
├── 01-backend/                             # Backend specifications
│   ├── 01-{component}.md                   # Numbered component specs
│   ├── 02-{component}.md
│   └── ...
│
├── 02-frontend/                            # Frontend specifications
│   ├── 01-architecture.md                  # Frontend architecture
│   ├── 02-components.md                    # Component library
│   ├── 03-pages.md                         # Page definitions
│   └── ...
│
├── 03-deploy/                              # Deployment & operations
│   ├── 01-powershell.md                    # PowerShell configuration
│   ├── 02-docker.md                        # Docker setup (if applicable)
│   └── ...
│
└── 99-consistency-report.md                # CLI consistency report
```

---

## Folder Numbering Convention

| Range | Category | Examples |
|-------|----------|----------|
| 01–02 | Foundation | general-spec, spec-management-software |
| 03 | Coding Standards | coding-guidelines (cross-language, TS, Go, PHP, Rust) |
| 04–07 | Shared/Core | split-db, seedable-config, powershell, error-codes |
| 08 | Meta | spec-authoring-guide |
| 09–16 | CLI Tools | gsearch, brun, ai-bridge, nexus-flow, spec-reverse, ai-transcribe |
| 17–18 | Research & Resolution | ai-research, error-resolution |
| 19–21 | CLI Tools (cont.) | license-manager, shared-cli-frontend, wp-seo-publish |
| 23 | Issue Tracking | how-app-issues-track |
| 28–29 | WordPress & Utilities | wp-plugin-development, upload-scripts |
| 30–33 | Enforcement & Data | e2-activity-feed, generic-enforce, shared-preset-data, non-vector-rag |
| 34–36 | Time Log | time-log-cli, time-log-ui, time-log-combined |
| 37–89 | Future | (reserved) |
| 99 | Archive/Reports | consistency-report, archived specs |

---

## File Numbering Within Folders

Files within any folder follow this pattern:

| Number | Purpose |
|--------|---------|
| 00 | Overview/Index file |
| 01-89 | Content files (numbered sequentially) |
| 90-96 | Implementation guides, checklists |
| 97 | Acceptance criteria |
| 98 | Changelogs |
| 99 | Consistency/Summary reports |

---

## Naming Conventions

### Folders

```
{number}-{kebab-case-name}/
```

Examples:
- `01-backend/`
- `02-frontend/`
- `20-gsearch-cli/`
- `22-ai-bridge-cli/`

### Files

```
{number}-{kebab-case-name}.md
```

Examples:
- `00-overview.md`
- `01-architecture.md`
- `07-model-management.md`
- `99-consistency-report.md`

---

## Cross-References

All specs should use relative paths for cross-references:

```markdown
See: [Split DB Architecture](../06-split-db-architecture/00-overview.md)
See: [Seedable Config](../07-seedable-config-architecture/00-overview.md)
See: [Shared CLI Frontend](../28-shared-cli-frontend/00-overview.md)
See: [Spec Authoring Guide](../05-spec-authoring-guide/00-overview.md)
```

---

## Migration from Old Structure

| Old Path | New Path |
|----------|----------|
| `spec/general-spec/` | `spec/01-general-spec/` |
| `spec/spec-management-software/` | `spec/11-spec-management-software/` |
| `spec/shared-cli-frontend/` | `spec/28-shared-cli-frontend/` |
| `spec/split-db-architecture/` | `spec/06-split-db-architecture/` |
| `spec/cw-config-architecture/` | `spec/07-seedable-config-architecture/` |
| `spec/powershell-integration/` | `spec/50-powershell-integration/` |
| `spec/error-code-registry/` | `spec/03-error-code-registry/` |
| `spec/gsearch-cli/` | `spec/20-gsearch-cli/` |
| `spec/brun-cli/` | `spec/21-brun-cli/` |
| `spec/ai-bridge-cli/` | `spec/22-ai-bridge-cli/` |
| `spec/ai-bridge/` | (merged into `spec/22-ai-bridge-cli/`) |
| `spec/nexus-flow/` | `spec/24-nexus-flow-cli/` |

---

## Validation Rules

1. **All folders MUST have a `00-overview.md`**
2. **CLI folders MUST have `01-backend/`, `02-frontend/`, `03-deploy/`**
3. **All files MUST be numbered with 2-digit prefix**
4. **All names MUST use kebab-case**
5. **No spaces in file or folder names**
6. **Cross-references MUST use relative paths**

---

*This is the authoritative guide for spec folder organization. All projects must comply.*