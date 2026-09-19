# WordPress SEO Publish CLI

**Version:** 2.1.0  
**Updated:** 2026-03-30  
**Language:** Go  
**Type:** CLI Application with Web UI  
**AI Confidence:** High  
**Ambiguity:** Low

---

## Keywords

`wp-seo-publish` · `golang` · `cli` · `wordpress` · `seo` · `rest-api` · `content-publishing` · `ai-bridge` · `automation`

---

## Scoring

| Metric | Value |
|--------|-------|
| AI Confidence | High |
| Ambiguity | Low |
| Health Score | 100/100 (A+) |

---

## Overview

WordPress SEO Publish CLI (WP SEO CLI) is a specialized command-line tool for publishing SEO-optimized content to WordPress sites. It acts as a bridge between AI Bridge CLI's content generation capabilities and WordPress's REST API, enabling automated publishing of categories, pages, posts, and tags.

---

## Core Responsibilities

| Responsibility | Description |
|----------------|-------------|
| WordPress Connection | Connect via Application Password authentication |
| Content Publishing | Publish categories, pages, posts, tags to WordPress |
| AI Bridge Integration | Delegate SEO content generation to AI Bridge CLI |
| Variable Management | Import/export variables from CSV, JSON, YAML |
| Internal Linking | Manage internal link structures across published content |
| Split DB Persistence | Track websites, publications, and sync state |

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    WP SEO Publish CLI                           │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Frontend   │  │  REST API    │  │  WebSocket   │          │
│  │   (React)    │  │  (38+ eps)   │  │  (Streaming) │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
│         │                 │                 │                   │
│         └─────────────────┼─────────────────┘                   │
│                           │                                     │
│  ┌────────────────────────┴────────────────────────────┐       │
│  │                   Core Engine                        │       │
│  ├──────────────────────────────────────────────────────┤       │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │       │
│  │  │  WordPress  │  │   Content   │  │  Variable   │  │       │
│  │  │  Connector  │  │   Manager   │  │  Processor  │  │       │
│  │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  │       │
│  │         │                │                │          │       │
│  │  ┌──────┴────────────────┴────────────────┴───────┐ │       │
│  │  │              AI Bridge Client                   │ │       │
│  │  └─────────────────────┬───────────────────────────┘ │       │
│  └────────────────────────┼─────────────────────────────┘       │
│                           │                                     │
│  ┌────────────────────────┴────────────────────────────┐       │
│  │                   Split DB Layer                     │       │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │       │
│  │  │  Setting DB │  │  Website DB │  │ Publish DB  │  │       │
│  │  │ (Root/Main) │  │ (Per Site)  │  │ (Per Site)  │  │       │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  │       │
│  └──────────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                     External Services                            │
├──────────────────┬──────────────────┬───────────────────────────┤
│  AI Bridge CLI   │   GSearch CLI    │     WordPress REST API    │
│  (SEO Writing)   │  (Sitemap RAG)   │     (Publishing)          │
└──────────────────┴──────────────────┴───────────────────────────┘
```

---

## Key Features

### 1. WordPress Connection
- Application Password authentication
- Multi-site support
- Connection validation and health checks
- Credential secure storage in Split DB

### 2. Content Publishing
- **Categories**: Create/update with hierarchy support
- **Pages**: Full page publishing with SEO metadata
- **Posts**: Blog posts with categories, tags, featured images
- **Tags**: Tag management and assignment

### 3. AI Bridge Integration
- Delegates SEO content generation
- Receives structured output (HTML, Markdown, JSON)
- Auto-assigns categories and tags from AI suggestions
- Supports variable injection for dynamic content

### 4. Variable System
- Import from CSV, JSON, YAML files
- Variable scoping: Global → Website → Content Type → Instance
- Template syntax: `{{Variable.Name|format}}`
- Export/backup capabilities

### 5. Internal Linking
- Feed existing URLs to AI Bridge for linking
- Sitemap-based link discovery via GSearch CLI
- Configurable link density per paragraph/sentence

### 6. Content Modification
- Fetch existing posts for rewriting
- Preserve post metadata during updates
- Version tracking in Split DB

---

## Integration Matrix

| Integration | Direction | Purpose |
|-------------|-----------|---------|
| AI Bridge CLI | Outbound | Request SEO content generation |
| GSearch CLI | Via AI Bridge | Sitemap indexing for RAG |
| WordPress REST API | Outbound | Publish content |
| PowerShell | Deployment | Build, deploy, manage |

---

## Folder Structure

```
32-wp-seo-publish-cli/
├── 00-overview.md              # This file
├── 01-backend/                 # Backend specifications
│   ├── 00-overview.md          # Backend overview
│   ├── 01-architecture.md      # Core system design
│   ├── 02-wordpress-connector.md # WP REST API integration
│   ├── 03-content-publisher.md # Publishing logic
│   ├── 04-ai-bridge-client.md  # AI Bridge CLI integration
│   ├── 05-variable-system.md   # CSV/JSON/YAML variables
│   ├── 06-split-db-schema.md   # Database architecture
│   ├── 07-api-endpoints.md     # REST API specification
│   ├── 08-error-codes.md       # Error code registry (12xxx)
│   └── 09-import-export.md     # Data portability
├── 02-frontend/                # Frontend specifications
│   ├── 00-overview.md          # Frontend overview
│   ├── 01-connection-ui.md     # WordPress connection wizard
│   ├── 02-content-manager.md   # Content publishing interface
│   └── 03-variable-editor.md   # Variable management UI
├── 03-deploy/                  # Deployment specifications
│   ├── 00-overview.md          # Deploy overview
│   └── 01-powershell-scripts.md # PowerShell automation
└── 99-consistency-report.md    # Consistency verification
```

---

## Cross-References

| Reference | Location |
|-----------|----------|
| Error Resolution | `../03-error-manage/01-error-resolution/00-overview.md` |
| AI Bridge CLI | `../27-ai-bridge-cli/00-overview.md` |
| AI SEO Writing | `../27-ai-bridge-cli/01-backend/17-ai-seo-core-guidelines.md` |
| GSearch CLI | `../25-gsearch-cli/00-overview.md` |
| Split DB Architecture | `../05-split-db-architecture/00-overview.md` |
| PowerShell Integration | `../11-powershell-integration/00-overview.md` |
| Error Code Registry | `../03-error-manage/03-error-code-registry/01-index.md` |
| DBOperation Wrapper | `../21-app/spec-management-software/13-shared-packages/08-pkg-database-operations.md` |
| ORM-Only Policy | `.ai-memory/memories/standards/orm-only-policy.md` |
| Database Pre-flight Checklist | `.ai-memory/memories/standards/database-preflight-checklist.md` |

---

## Error Code Range

| Range | Category |
|-------|----------|
| 12000-12099 | Connection Errors |
| 12100-12199 | Publishing Errors |
| 12200-12299 | AI Bridge Integration |
| 12300-12399 | Variable Processing |
| 12400-12499 | Import/Export |
| 12500-12519 | Database Errors |
| 12520-12527 | Settings Errors |
| 12550-12556 | Reset API Errors |
