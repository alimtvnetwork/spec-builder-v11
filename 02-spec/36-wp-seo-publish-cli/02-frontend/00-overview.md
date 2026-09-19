# WP SEO Publish CLI: Frontend Overview

**Version:** 2.1.0  
**Updated:** 2026-03-30    
**AI Confidence:** High  
**Ambiguity:** None

---


## Keywords

`seo`, `publish`, `cli`, `frontend`

---

## Scoring

| Criterion | Status |
|-----------|--------|
| `00-overview.md` present | ✅ |
| AI Confidence assigned | ✅ |
| Ambiguity assigned | ✅ |
| Keywords present | ✅ |
| Scoring table present | ✅ |


## Overview

The WP SEO Publish CLI frontend provides a React-based management interface for connecting WordPress sites, managing content publications, and configuring variables. Built with the same patterns as other CLI frontends (AI Bridge, GSearch, VRun).

---

## Files

| File | Description |
|------|-------------|
| 01-connection-wizard.md | WordPress site connection flow |
| 02-content-manager.md | Content creation and publication interface |
| 03-variable-editor.md | CSV/JSON/YAML variable management |
| 04-automation-ui.md | Bulk publication automation |
| 05-component-library.md | Shared UI components |

---

## Technology Stack

| Technology | Purpose |
|------------|---------|
| React 18+ | UI framework |
| TypeScript | Type safety |
| Tailwind CSS | Styling |
| shadcn/ui | Component library |
| TanStack Query | Data fetching |
| React Router | Navigation |
| WebSocket | Real-time updates |

---

## Page Structure

```
/                           # Dashboard
/sites                      # Website list
/sites/new                  # Connection wizard
/sites/:id                  # Site details
/sites/:id/categories       # Category management
/sites/:id/posts            # Post management
/sites/:id/pages            # Page management
/sites/:id/tags             # Tag management
/sites/:id/variables        # Variable editor
/sites/:id/automations      # Automation configs
/settings                   # Global settings
```

---

## Layout

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│  WP SEO Publish                                          [Settings] [Docs] [Theme] │
├─────────────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────────────────────────────────────────────────────┐  │
│  │             │  │                                                             │  │
│  │  Sidebar    │  │                        Main Content                         │  │
│  │             │  │                                                             │  │
│  │  - Sites    │  │                                                             │  │
│  │  - Settings │  │                                                             │  │
│  │  - Help     │  │                                                             │  │
│  │             │  │                                                             │  │
│  │             │  │                                                             │  │
│  └─────────────┘  └─────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Cross-References

| Reference | Location |
|-----------|----------|
| Backend API | `../01-backend/07-api-endpoints.md` |
| Component Library | `05-component-library.md` |
| AI Bridge Frontend | `../../27-ai-bridge-cli/02-frontend/` |
