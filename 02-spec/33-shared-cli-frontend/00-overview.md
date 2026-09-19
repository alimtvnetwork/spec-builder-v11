# Shared CLI Frontend Architecture

> **Version:** 1.1.0  
> **Created:** 2026-02-01  
> **Updated:** 2026-03-30  
> **Status:** Active  
> **AI Confidence:** Production-Ready  
> **Ambiguity:** Low  
> **Purpose:** Common frontend architecture for all CLI tools (gsearch, brun, ai-bridge, nexus-flow)

---

## Keywords

`shared-frontend` · `react` · `typescript` · `cli-ui` · `tanstack-query` · `shadcn` · `websocket` · `unified-architecture`

---

## Scoring

| Metric | Value |
|--------|-------|
| AI Confidence | Production-Ready |
| Ambiguity | Low |
| Health Score | 100/100 (A+) |

---

## Summary

This specification defines the **unified frontend architecture** shared across all Golang CLI tools. Each CLI follows this pattern to ensure consistent user experience, maintainability, and feature parity.

---

## Applicable CLIs

| CLI | Location | Error Range |
|-----|----------|-------------|
| GSearch CLI | `02-spec/25-gsearch-cli/` | 7000-7099 |
| BRun CLI | `02-spec/26-brun-cli/` | 7100-7599 |
| AI Bridge CLI | `02-spec/27-ai-bridge-cli/` | 9000-9999 |
| Nexus Flow CLI | `02-spec/29-nexus-flow-cli/` | 8000-8399 |

---

## Architecture Overview

Each CLI project follows a **three-folder structure**:

```
{cli-name}/
├── backend/                    # Go CLI + HTTP/WebSocket server
│   ├── cmd/                    # CLI commands
│   ├── internal/               # Business logic
│   ├── api/                    # HTTP/WS handlers
│   ├── configs/                # Seedable JSON configs (CW Config pattern)
│   │   ├── config.seed.json    # Default seed values
│   │   ├── config.schema.json  # JSON Schema validation
│   │   └── presets.json        # API tester presets
│   ├── data/                   # SQLite databases (Split DB pattern)
│   │   ├── root.db             # Root registry database
│   │   └── seeding/            # Seed data files
│   └── main.go
├── frontend/                   # React application
│   ├── src/
│   │   ├── components/         # UI components
│   │   ├── hooks/              # React hooks
│   │   ├── pages/              # Route pages
│   │   ├── lib/                # Utilities
│   │   └── types/              # TypeScript types
│   ├── package.json
│   └── vite.config.ts
├── deploy/                     # Deployment & operations
│   ├── powershell/             # PowerShell integration
│   │   ├── run.ps1             # Main runner script
│   │   ├── powershell.json     # Project configuration
│   │   └── ...                 # Helper scripts
│   ├── scripts/                # Utility scripts
│   ├── error-handlers/         # Error handling utilities
│   └── docs/                   # Deployment documentation
└── CHANGELOG.md                # Version history (CW Config)
```

---

## Core Features

### 1. WebSocket Live Logs

Real-time log streaming from Go backend to React frontend:

| Feature | Description |
|---------|-------------|
| Live Output | Stream stdout/stderr in real-time |
| Log Levels | Filter by DEBUG, INFO, WARN, ERROR |
| Timestamps | Precise timestamps with timezone |
| Copy Support | One-click copy entire log buffer |
| Auto-scroll | Auto-scroll with pause on hover |

### 2. Settings Management

Seedable configuration with version-aware updates:

| Feature | Description |
|---------|-------------|
| Seed on First Run | Load `config.seed.json` → SQLite |
| Version Detection | Detect version changes, prompt for re-seed |
| Category Tabs | Organize settings by category |
| Live Validation | Validate settings before save |
| Export/Import | JSON export for backup/restore |

### 3. API Tester

Interactive API endpoint testing:

| Feature | Description |
|---------|-------------|
| Endpoint List | All available CLI endpoints |
| Preset Data | Pre-configured test payloads |
| Response Viewer | Formatted JSON/text response |
| History | Track recent API calls |
| cURL Export | Copy as cURL command |

### 4. Error Modal

Unified error display with copy support:

| Feature | Description |
|---------|-------------|
| Error Code | Display structured error code |
| Stack Trace | Full 40-frame stack trace |
| Copy All | One-click copy error details |
| Frontend Errors | Capture and display React errors |
| Backend Errors | Display server-side errors |

### 5. Changelog Display

Version-aware changelog on update:

| Feature | Description |
|---------|-------------|
| Auto-detect | Detect version change on startup |
| Modal Display | Show changelog in modal |
| Markdown Support | Render markdown changelog |
| Dismiss | Remember dismissed versions |

### 6. Port & Firewall Management

Network configuration from Go backend:

| Feature | Description |
|---------|-------------|
| Port Selection | Configurable HTTP/WS port |
| Port Fallback | Auto-fallback if port busy |
| Firewall Check | Detect firewall blocking |
| Firewall Enable | Request firewall rule (Admin) |

---

## Component Specifications

| # | Component | File | Description |
|---|-----------|------|-------------|
| 01 | [Folder Structure](./01-folder-structure.md) | 01 | Directory layout for frontend |
| 02 | [WebSocket Protocol](./02-websocket-protocol.md) | 02 | WS message formats |
| 03 | [Settings Service](./03-settings-service.md) | 03 | Seedable config pattern |
| 04 | [API Tester](./04-api-tester.md) | 04 | Endpoint testing UI |
| 05 | [Error Modal](./05-error-modal.md) | 05 | Error display component |
| 06 | [Changelog System](./06-changelog-system.md) | 06 | Version changelog display |
| 07 | [Port Management](./07-port-management.md) | 07 | Network configuration |
| 08 | [PowerShell Integration](./08-powershell-integration.md) | 08 | run.ps1 setup |
| 09 | [Deploy Folder](./09-deploy-folder.md) | 09 | Deployment & operations |
| 16 | [Tree Visualization](./16-tree-visualization.md) | 16 | Interactive tree index explorer for Non-Vector RAG |

---

## Shared Architecture Patterns

These patterns are used by all CLI frontends:

| Pattern | Location | Description |
|---------|----------|-------------|
| Split DB Architecture | [06-split-db-architecture/](../05-split-db-architecture/) | Hierarchical SQLite organization |
| Seedable Config Architecture | [07-seedable-config-architecture/](../06-seedable-config-architecture/) | Versioned configuration with changelog |
| PowerShell Integration | [50-powershell-integration/](../11-powershell-integration/) | Build and run scripts |
| Error Resolution | [04-error-resolution/](../03-error-manage/) | Frontend-backend debugging and verification patterns |
| TypeScript Debugging | [04-error-resolution/03-debugging-guides/03-debugging-typescript.md](../03-error-manage/03-debugging-guides/03-debugging-typescript.md) | React/TypeScript debugging patterns |
| DBOperation Wrapper | [11-spec-management-software/13-shared-packages/08-pkg-database-operations.md](../21-app/spec-management-software/13-shared-packages/08-pkg-database-operations.md) | Mandatory database operation wrapper (Go backends) |

---

## Theme Support

All CLI frontends support multiple themes:

| Theme | Description |
|-------|-------------|
| `light` | Light mode (default) |
| `dark` | Dark mode |
| `system` | Follow OS preference |
| `high-contrast` | Accessibility theme |
| `colorful-light` | Colorful light variant |
| `colorful-dark` | Colorful dark variant |

Themes are managed via the Settings Service and stored in SQLite.

---

## Technology Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.x | UI framework |
| TypeScript | 5.x | Type safety |
| Vite | 5.x | Build tool |
| TailwindCSS | 3.x | Styling |
| shadcn/ui | Latest | UI components |
| React Query | 5.x | Data fetching |
| Zustand | 4.x | State management |

### Backend (Go)
| Technology | Purpose |
|------------|---------|
| Cobra | CLI framework |
| Gorilla WebSocket | WebSocket server |
| Chi / Gin | HTTP router |
| GORM | SQLite ORM |
| Viper | Configuration |

---

## Error Code Pattern

Each CLI has a dedicated error range. Frontend-specific errors use a sub-range:

| CLI | Total Range | Frontend Sub-range |
|-----|-------------|-------------------|
| GSearch | 7000-7099 | 7050-7069 |
| BRun | 7100-7599 | 7150-7169 |
| AI Bridge | 9000-9999 | 9050-9069 |
| Nexus Flow | 8000-8399 | 8050-8069 |

### Common Frontend Error Codes (relative +50)

| Code | Error | Description |
|------|-------|-------------|
| +50 | WS_CONNECTION_FAILED | WebSocket connection failure |
| +51 | WS_DISCONNECTED | WebSocket unexpectedly closed |
| +52 | SETTINGS_LOAD_FAILED | Failed to load settings |
| +53 | SETTINGS_SAVE_FAILED | Failed to save settings |
| +54 | API_TIMEOUT | API request timeout |
| +55 | API_ERROR | API returned error response |
| +56 | CONFIG_PARSE_ERROR | Failed to parse config |
| +57 | VERSION_MISMATCH | Frontend/backend version mismatch |
| +58 | PORT_UNAVAILABLE | Configured port not available |
| +59 | FIREWALL_BLOCKED | Firewall blocking connection |

---

## Cross-References

| Reference | Location |
|-----------|----------|
| GSearch Implementation | `02-spec/25-gsearch-cli/02-frontend/02-frontend-architecture.md` |
| BRun Implementation | `02-spec/26-brun-cli/02-frontend/01-frontend-architecture.md` |
| AI Bridge CLI Implementation | `02-spec/27-ai-bridge-cli/02-frontend/01-architecture.md` |
| Nexus Flow CLI Implementation | `02-spec/29-nexus-flow-cli/02-frontend/02-frontend-architecture.md` |
| PowerShell Integration | `02-spec/11-powershell-integration/` |
| Error Management | `02-spec/11-spec-management-software/06-error-management/` |

---

*This shared spec ensures consistency across all CLI frontends.*
