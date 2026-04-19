# Memory: architecture/cli-folder-structure

**Updated:** 2026-02-03  
**Version:** 1.0.0  
**Status:** Active  
**Spec Location:** `spec/00-folder-structure-guideline.md`

---

## Overview

All CLI projects follow a unified **three-folder structure** with numbered prefixes for consistent organization.

---

## CLI Three-Folder Structure

```
{nn}-{cli-name}/
├── 00-overview.md              # CLI overview
├── 01-backend/                 # Backend specifications
│   ├── 00-overview.md          # Backend overview
│   └── {nn}-{spec-name}.md     # Numbered spec files
├── 02-frontend/                # Frontend specifications
│   ├── 00-overview.md          # Frontend overview
│   └── {nn}-{spec-name}.md     # Numbered spec files
├── 03-deploy/                  # Deployment specifications
│   ├── 00-overview.md          # Deploy overview
│   └── {nn}-{spec-name}.md     # PowerShell, guides
└── 99-consistency-report.md    # Consistency verification
```

---

## Root Folder Numbering

| # | Folder | Description |
|---|--------|-------------|
| 01 | general-spec | General specifications |
| 02 | spec-management-software | Main application |
| 03 | shared-cli-frontend | Shared frontend components |
| 04 | split-db-architecture | Database architecture |
| 05 | seedable-config-architecture | Config system |
| 06 | powershell-integration | PowerShell automation |
| 07 | error-code-registry | Error codes |
| 08 | gsearch-cli | GSearch CLI |
| 09 | brun-cli | BRun CLI |
| 10 | ai-bridge-cli | AI Bridge CLI |
| 11 | nexus-flow-cli | Nexus Flow CLI |
| 12 | wp-plugin | WordPress Plugin |
| 13 | wp-plugin-builder | WP Plugin Builder |
| 14 | wp-seo-publish-cli | WordPress SEO Publish CLI |
| 15 | ai-transcribe-cli | **AI Transcribe CLI** (Voice/STT/TTS) |

---

## AI Transcribe CLI File Structure (Complete)

```
26-ai-transcribe-cli/
├── 00-overview.md
├── 01-backend/
│   ├── 00-overview.md
│   ├── 01-architecture.md
│   ├── 02-audio-pipeline.md
│   ├── 03-stt-providers.md
│   ├── 04-tts-providers.md
│   ├── 05-realtime-conversation.md
│   ├── 06-voice-commands.md
│   ├── 07-voice-cloning.md
│   ├── 08-database-schema.md
│   ├── 09-api-interface.md
│   ├── 10-error-codes.md
│   ├── 11-configuration.md
│   └── 12-openapi-spec.md
├── 02-frontend/
│   ├── 00-overview.md
│   ├── 01-testing-ui.md
│   ├── 02-component-library.md
│   └── 03-state-management.md
├── 03-deploy/
│   ├── 00-overview.md
│   ├── 01-systemd-service.md
│   ├── 02-environment-config.md
│   └── 03-powershell-deployment.md
└── 99-consistency-report.md
```

**Total Files:** 21 specification files

---

## Naming Conventions

- Folders: lowercase kebab-case with number prefix
- Files: numbered prefix (01-, 02-) + kebab-case
- Overview files: always `00-overview.md`
- Consistency reports: always `99-consistency-report.md`

---

## Recent Changes

- **2026-02-03:** Added `26-ai-transcribe-cli` (extracted from AI Bridge CLI voice features)
- **2026-02-03:** Completed full file structure with 21 specification files
- **2026-02-03:** Added frontend specs: component-library, state-management
- **2026-02-03:** Added deployment specs: systemd, environment-config, powershell
