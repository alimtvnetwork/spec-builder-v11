# GSearch CLI Frontend Architecture

> **Version:** 2.0.0  
> **Created:** 2026-03-09  
> **Parent:** [00-overview.md](./00-overview.md)  
> **Shared Spec:** [spec/28-shared-cli-frontend/](../../28-shared-cli-frontend/)

---

## Summary

React frontend for the GSearch CLI, implementing the shared CLI frontend architecture with search-specific features.

---

## Architecture

```
gsearch-cli/
├── backend/                        # Go CLI + HTTP/WS server
│   ├── cmd/
│   │   ├── root.go
│   │   ├── search.go
│   │   ├── serve.go                # HTTP/WS server command
│   │   ├── status.go
│   │   ├── cache.go
│   │   └── rag.go
│   ├── internal/
│   │   ├── api/                    # HTTP/WS handlers
│   │   │   ├── router.go
│   │   │   ├── search.go
│   │   │   ├── settings.go
│   │   │   ├── websocket.go
│   │   │   └── version.go
│   │   ├── config/
│   │   ├── search/
│   │   ├── settings/
│   │   └── ...
│   ├── configs/
│   │   ├── config.seed.json
│   │   └── presets.json
│   ├── data/
│   │   └── seeding/
│   ├── main.go
│   └── go.mod
├── frontend/                       # React application
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/             # Shared components
│   │   │   ├── search/             # Search-specific components
│   │   │   │   ├── SearchForm.tsx
│   │   │   │   ├── ResultsList.tsx
│   │   │   │   ├── ResultCard.tsx
│   │   │   │   └── SearchStatus.tsx
│   │   │   └── ui/                 # shadcn/ui
│   │   ├── hooks/
│   │   │   ├── useSearch.ts
│   │   │   ├── useSearchResults.ts
│   │   │   └── ...
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx       # Search dashboard
│   │   │   ├── Results.tsx         # Search results
│   │   │   ├── History.tsx         # Search history
│   │   │   └── ...
│   │   └── ...
│   ├── package.json
│   └── vite.config.ts
├── deploy/                         # Deployment & operations
│   ├── powershell/                 # PowerShell integration
│   │   ├── run.ps1                 # Main runner script
│   │   ├── powershell.json         # Project configuration
│   │   ├── clean.ps1               # Clean build script
│   │   └── firewall.ps1            # Firewall configuration
│   ├── scripts/                    # Utility scripts
│   │   ├── backup.ps1              # Database backup
│   │   ├── restore.ps1             # Database restore
│   │   └── seed.ps1                # Seed configuration
│   ├── error-handlers/             # Error handling utilities
│   │   ├── crash-reporter.go
│   │   └── recovery.go
│   └── docs/                       # Deployment documentation
│       ├── SETUP.md
│       └── TROUBLESHOOTING.md
└── CHANGELOG.md
```

---

## GSearch-Specific Features

### 1. Search Dashboard

Main interface for executing searches:

| Feature | Description |
|---------|-------------|
| Keyword Input | Multi-keyword input with tag support |
| Engine Selection | Select search engine(s) |
| Options | Nested search, cache, depth |
| Real-time Status | Show search progress |

### 2. Results Viewer

Display and manage search results:

| Feature | Description |
|---------|-------------|
| Result Cards | Title, description, URL, position |
| Filtering | Filter by engine, status, date |
| Export | Export to JSON, CSV, RAG format |
| Pagination | Paginated results display |

### 3. Search History

Track and replay previous searches:

| Feature | Description |
|---------|-------------|
| History List | All previous searches |
| Replay | Re-run a search |
| Compare | Compare two search results |
| Delete | Remove old searches |

---

## API Endpoints

### Search Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/search` | Start new search |
| GET | `/api/search/:id` | Get search status |
| GET | `/api/search/:id/results` | Get search results |
| DELETE | `/api/search/:id` | Cancel/delete search |
| GET | `/api/search/history` | List all searches |

### Settings Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/settings` | Get all settings |
| PUT | `/api/settings/:category` | Update settings category |
| POST | `/api/settings/seed` | Re-seed from file |
| GET | `/api/settings/export` | Export settings |

### System Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/version` | Version and changelog |
| GET | `/api/network/status` | Port/firewall status |

---

## WebSocket Events

### GSearch-Specific Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `search.started` | B→F | Search has started |
| `search.progress` | B→F | Search progress update |
| `search.result` | B→F | New result found |
| `search.completed` | B→F | Search finished |
| `search.error` | B→F | Search error |
| `search.cancel` | F→B | Cancel running search |

### Event Payload Examples

```typescript
// search.progress
{
  "type": "search.progress",
  "payload": {
    "searchId": "abc123",
    "engine": "google",
    "method": "htmlParsing",
    "progress": 45,
    "resultsFound": 12
  }
}

// search.result
{
  "type": "search.result",
  "payload": {
    "searchId": "abc123",
    "result": {
      "title": "Introduction to ML",
      "description": "A comprehensive guide...",
      "url": "https://example.com/ml",
      "position": 1
    }
  }
}
```

---

## Seedable Configuration

### config.seed.json

```json
{
  "$schema": "./config.schema.json",
  "version": "1.0.0",
  "categories": {
    "search": {
      "displayName": "Search",
      "description": "Search engine configuration",
      "settings": {
        "defaultEngine": {
          "type": "select",
          "label": "Default Engine",
          "default": "google",
          "options": ["google", "bing", "duckduckgo"]
        },
        "maxResults": {
          "type": "number",
          "label": "Max Results",
          "default": 10,
          "min": 1,
          "max": 100
        },
        "timeout": {
          "type": "number",
          "label": "Timeout (ms)",
          "default": 30000,
          "min": 5000,
          "max": 120000
        },
        "delay": {
          "type": "number",
          "label": "Delay Between Requests (ms)",
          "default": 2000,
          "min": 500,
          "max": 10000
        }
      }
    },
    "nested": {
      "displayName": "Nested Search",
      "description": "Recursive search configuration",
      "settings": {
        "enabled": {
          "type": "boolean",
          "label": "Enable Nested Search",
          "default": true
        },
        "maxDepth": {
          "type": "number",
          "label": "Max Depth",
          "default": 3,
          "min": 1,
          "max": 5
        },
        "keywordThreshold": {
          "type": "number",
          "label": "Keyword Extraction Threshold",
          "default": 5,
          "min": 1,
          "max": 20
        }
      }
    },
    "cache": {
      "displayName": "Caching",
      "description": "Result caching configuration",
      "settings": {
        "enabled": {
          "type": "boolean",
          "label": "Enable Cache",
          "default": true
        },
        "expireDays": {
          "type": "number",
          "label": "Cache Expiry (days)",
          "default": 5,
          "min": 1,
          "max": 30
        },
        "maxEntries": {
          "type": "number",
          "label": "Max Cache Entries",
          "default": 10000,
          "min": 100,
          "max": 100000
        }
      }
    },
    "network": {
      "displayName": "Network",
      "description": "Server configuration",
      "settings": {
        "port": {
          "type": "number",
          "label": "Server Port",
          "default": 8090,
          "min": 1024,
          "max": 65535
        },
        "fallbackPorts": {
          "type": "array",
          "label": "Fallback Ports",
          "default": [8091, 8092, 8093]
        }
      }
    }
  }
}
```

---

## Preset Test Data

### presets.json

```json
{
  "version": "1.0.0",
  "endpoints": [
    {
      "id": "search-basic",
      "name": "Basic Search",
      "method": "POST",
      "path": "/api/search",
      "presets": [
        {
          "name": "Simple Search",
          "body": {
            "keywords": "machine learning",
            "engine": "google",
            "maxResults": 10
          }
        },
        {
          "name": "Multi-Engine Search",
          "body": {
            "keywords": "artificial intelligence,deep learning",
            "engines": ["google", "bing", "duckduckgo"],
            "maxResults": 20
          }
        },
        {
          "name": "Nested Search",
          "body": {
            "keywords": "neural networks",
            "engine": "google",
            "nested": true,
            "maxDepth": 2
          }
        },
        {
          "name": "With Cache Bypass",
          "body": {
            "keywords": "latest AI news",
            "engine": "google",
            "bypassCache": true
          }
        }
      ]
    },
    {
      "id": "cache-stats",
      "name": "Cache Statistics",
      "method": "GET",
      "path": "/api/cache/stats"
    },
    {
      "id": "rag-export",
      "name": "RAG Export",
      "method": "POST",
      "path": "/api/rag/export",
      "presets": [
        {
          "name": "JSON Export",
          "body": {
            "format": "json",
            "keywords": ["machine learning", "AI"]
          }
        },
        {
          "name": "YAML Export",
          "body": {
            "format": "yaml",
            "searchIds": ["abc123", "def456"]
          }
        }
      ]
    }
  ]
}
```

---

## PowerShell Configuration

### powershell.json

```json
{
  "projectName": "gsearch",
  "rootDir": ".",
  "backendDir": "backend",
  "frontendDir": "frontend",
  "distDir": "dist",
  "targetDir": "backend/frontend/dist",
  "dataDir": "backend/data",
  "ports": [8090, 8091, 8092],
  "prerequisites": {
    "go": true,
    "node": true,
    "npm": true
  },
  "cleanPaths": [
    "frontend/node_modules",
    "frontend/dist",
    "frontend/.vite",
    "backend/data/*.db",
    "backend/data/*.db-shm",
    "backend/data/*.db-wal"
  ],
  "buildCommand": "npm run build",
  "installCommand": "npm install",
  "runCommand": "go run main.go serve --port 8090",
  "seedingDir": "backend/data/seeding",
  "configFile": "config.json",
  "configExampleFile": "config.example.json"
}
```

---

## Error Codes

GSearch frontend uses error range **7050-7069**:

| Code | Error | Description |
|------|-------|-------------|
| 7050 | WS_CONNECTION_FAILED | WebSocket connection failure |
| 7051 | WS_DISCONNECTED | WebSocket unexpectedly closed |
| 7052 | SETTINGS_LOAD_FAILED | Failed to load settings |
| 7053 | SETTINGS_SAVE_FAILED | Failed to save settings |
| 7054 | API_TIMEOUT | API request timeout |
| 7055 | API_ERROR | API returned error response |
| 7056 | CONFIG_PARSE_ERROR | Failed to parse config |
| 7057 | VERSION_MISMATCH | Frontend/backend version mismatch |
| 7058 | PORT_UNAVAILABLE | Configured port not available |
| 7059 | FIREWALL_BLOCKED | Firewall blocking connection |
| 7060 | REACT_ERROR | Unhandled React error |
| 7061 | SEARCH_CANCELLED | Search was cancelled |
| 7062 | RESULT_PARSE_ERROR | Failed to parse search result |

---

## Cross-References

| Reference | Location |
|-----------|----------|
| Shared Frontend Spec | `spec/28-shared-cli-frontend/` |
| Deploy Folder Spec | `spec/28-shared-cli-frontend/09-deploy-folder.md` |
| Split DB Architecture | `spec/06-split-db-architecture/` |
| Seedable Config Architecture | `spec/07-seedable-config-architecture/` |
| Backend CLI Spec | `../01-backend/01-cli-framework.md` |
| Database Schema | `../01-backend/03-database-schema.md` |
| Error Codes | `../01-backend/15-error-codes.md` |
| PowerShell Integration | `spec/50-powershell-integration/` |
| **UI Patterns** | `./05-ui-patterns.md` — Modal scroll, spinner updates, password security |
| **Shared Hooks** | `spec/28-shared-cli-frontend/15-hooks-library.md` |

---

*GSearch CLI frontend implements the shared CLI frontend architecture with three-folder structure.*
