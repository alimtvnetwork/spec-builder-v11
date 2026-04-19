# Specification Tree — Master Index

**Version:** 37.0.0  
**Status:** Active  
**Updated:** 2026-04-01

---

## Purpose

This is the root index for the entire specification tree. It provides a navigable inventory of all top-level specification modules, their scope, and key metrics.

---

## Structural Standards

All folders and files within `spec/` follow strict conventions:

- **Naming:** Lowercase kebab-case with numeric prefixes (`{NN}-{name}`)
- **Required files:** Every folder must contain `00-overview.md`
- **Consistency reports:** All top-level folders must contain `99-consistency-report.md`
- **Master guide:** [00-folder-structure-guideline.md](./00-folder-structure-guideline.md)
- **Authoring guide:** [05-spec-authoring-guide/00-overview.md](./05-spec-authoring-guide/00-overview.md)

---

## Specification Modules

### Foundation & Standards (01–08)

| # | Module | Description | Files |
|---|--------|-------------|------:|
| 01 | [general-spec](./01-general-spec/00-overview.md) | Cross-cutting foundation: architecture, quality, DevOps, WordPress, security | 70 |
| 02 | [coding-guidelines](./02-coding-guidelines/00-overview.md) | Consolidated coding standards: cross-language, TypeScript, Golang, PHP, Rust | 63 |
| 03 | [error-code-registry](./03-error-code-registry/00-overview.md) | Cross-project error code allocation, collision detection, utilization reports | 16 |
| 04 | [error-resolution](./04-error-resolution/00-overview.md) | Error handling patterns, modal UI, response envelopes, AppError package | 42 |
| 05 | [spec-authoring-guide](./05-spec-authoring-guide/00-overview.md) | How to create, structure, and maintain specification modules | 12 |
| 06 | [split-db-architecture](./06-split-db-architecture/00-overview.md) | Split database pattern: operational + config DBs, reset API standard | 10 |
| 07 | [seedable-config-architecture](./07-seedable-config-architecture/00-overview.md) | Seedable configuration with changelog versioning | 10 |
| 08 | [generic-enforce](./08-generic-enforce/00-overview.md) | Automated coding standard enforcement | 9 |

### Core Application (10–11)

| # | Module | Description | Files |
|---|--------|-------------|------:|
| 10 | [app](./10-app/axios-version-control/00-overview.md) | Application-level specifications | 6 |
| 11 | [spec-management-software](./11-spec-management-software/00-overview.md) | Core business logic: features (30+), microservices, shared packages, AI bridge | 531 |

### CLI Tools (20–28)

| # | Module | Description | Files |
|---|--------|-------------|------:|
| 20 | [gsearch-cli](./20-gsearch-cli/00-overview.md) | Google/Bing/DuckDuckGo search CLI with BI suite, crawling, trend analysis | 73 |
| 21 | [brun-cli](./21-brun-cli/00-overview.md) | Build runner CLI: multi-runtime executor, port management, build profiles | 32 |
| 22 | [ai-bridge-cli](./22-ai-bridge-cli/00-overview.md) | AI Bridge CLI: LLM orchestration, tool delegation, prompt management | 92 |
| 23 | [ai-bridge-non-vector-rag](./23-ai-bridge-non-vector-rag/00-overview.md) | Non-Vector RAG: tree-structured retrieval with LLM-guided traversal | 15 |
| 24 | [nexus-flow-cli](./24-nexus-flow-cli/00-overview.md) | Nexus Flow CLI: visual workflow editor with React Flow canvas | 27 |
| 25 | [spec-reverse-cli](./25-spec-reverse-cli/00-overview.md) | Spec Reverse CLI: code-to-specification reverse engineering | 18 |
| 26 | [ai-transcribe-cli](./26-ai-transcribe-cli/00-overview.md) | AI Transcribe CLI: STT/TTS, real-time voice, Whisper/XTTS/ElevenLabs | 34 |
| 27 | [license-manager](./27-license-manager/00-overview.md) | License Manager CLI (lm): license key generation and validation | 10 |
| 28 | [shared-cli-frontend](./28-shared-cli-frontend/00-overview.md) | Consolidated React frontend architecture for all CLI tools | 21 |

### WordPress (30–33)

| # | Module | Description | Files |
|---|--------|-------------|------:|
| 30 | [wp-plugin](./30-wp-plugin/00-overview.md) | WordPress plugins: exam manager, link manager, plugin publish system | 221 |
| 31 | [wp-plugin-builder](./31-wp-plugin-builder/00-overview.md) | WordPress Plugin Builder CLI (wpb): scaffolding and code generation | 22 |
| 32 | [wp-seo-publish-cli](./32-wp-seo-publish-cli/00-overview.md) | WordPress SEO Publish CLI: content publishing with SEO optimization | 28 |
| 33 | [wp-plugin-development](./33-wp-plugin-development/00-overview.md) | WordPress plugin development patterns, error handling, REST API | 17 |

### Time Log System (40–42)

| # | Module | Description | Files |
|---|--------|-------------|------:|
| 40 | [time-log-cli](./40-time-log-cli/00-overview.md) | Time Log CLI (Rust): cross-platform OS-level activity tracker | 26 |
| 41 | [time-log-ui](./41-time-log-ui/00-overview.md) | Time Log UI: web dashboard for activity data visualization | 15 |
| 42 | [time-log-combined](./42-time-log-combined/00-overview.md) | Cross-module Time Log reference (CLI + UI combined criteria) | 3 |

### Utilities & Tools (50–53)

| # | Module | Description | Files |
|---|--------|-------------|------:|
| 50 | [powershell-integration](./50-powershell-integration/00-overview.md) | PowerShell build scripts, configuration schema, firewall rules | 16 |
| 51 | [upload-scripts](./51-upload-scripts/00-overview.md) | WordPress plugin upload/deployment scripts (V1–V3) | 9 |
| 52 | [shared-preset-data](./52-shared-preset-data/00-overview.md) | Shared preset data across CLI tools | 9 |
| 53 | [e2-activity-feed](./53-e2-activity-feed/00-overview.md) | E2 Activity Feed specification | 8 |

### Research & Tracking (60–61)

| # | Module | Description | Files |
|---|--------|-------------|------:|
| 60 | [ai-research](./60-ai-research/00-overview.md) | AI research notes and explorations | 9 |
| 61 | [how-app-issues-track](./61-how-app-issues-track/00-overview.md) | Issue tracking, mistake remediation, audit findings | 25 |

### Meta & Archive (99)

| # | Module | Description | Files |
|---|--------|-------------|------:|
| 99 | [archive](./99-archive/00-overview.md) | Archived and deprecated specifications | 11 |
| — | [validation-reports](./validation-reports/00-overview.md) | Audit certificates, structural audits, remediation reports | 17 |

---

## Reserved Number Ranges

| Range | Purpose |
|-------|---------|
| 00 | Folder structure guideline (root), overview files (subfolder level) |
| 01–08 | Foundation & Standards |
| 09 | Reserved |
| 10–11 | Core Application |
| 12–19 | Reserved |
| 20–28 | CLI Tools |
| 29 | Reserved |
| 30–33 | WordPress |
| 34–39 | Reserved |
| 40–42 | Time Log System |
| 43–49 | Reserved |
| 50–53 | Utilities & Tools |
| 54–59 | Reserved |
| 60–61 | Research & Tracking |
| 62–89 | Future modules |
| 90–95 | Meta documents (master indexes) |
| 96–97 | Remediation and acceptance criteria |
| 98 | Changelogs |
| 99 | Consistency reports and archive |

---

## Cross-References

| Reference | Location |
|-----------|----------|
| Folder structure guideline | [00-folder-structure-guideline.md](./00-folder-structure-guideline.md) |
| Spec authoring guide | [05-spec-authoring-guide/00-overview.md](./05-spec-authoring-guide/00-overview.md) |
| Prefix disambiguation | [02-prefix-disambiguation.md](./02-prefix-disambiguation.md) |
| Error code registry | [03-error-code-registry/00-overview.md](./03-error-code-registry/00-overview.md) |
| Issue tracking | [61-how-app-issues-track/00-overview.md](./61-how-app-issues-track/00-overview.md) |
