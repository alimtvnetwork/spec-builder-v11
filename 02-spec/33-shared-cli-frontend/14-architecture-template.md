# Shared CLI Frontend: Architecture Template

**Version:** 3.0.0  
**Updated:** 2026-03-09  
**Purpose:** Standard frontend architecture template for all CLI projects

---

## Summary

All CLI frontends (GSearch CLI, BRun CLI, AI Bridge CLI, Nexus Flow CLI) follow a consistent **three-folder structure** with shared components, hooks, and design patterns.

---

## Standard Project Structure

```
{cli-name}/
├── backend/                            # Go CLI + HTTP/WS server
│   ├── cmd/                            # CLI commands
│   │   ├── root.go
│   │   ├── serve.go                    # HTTP/WS server
│   │   └── ...
│   ├── internal/                       # Internal packages
│   │   ├── api/                        # HTTP/WS handlers
│   │   ├── config/                     # Seedable config
│   │   └── ...
│   ├── configs/
│   │   ├── config.seed.json            # Default configuration
│   │   ├── config.schema.json          # JSON Schema validation
│   │   └── presets.json                # Preset configurations
│   ├── data/                           # Split DB directory
│   │   └── root.db
│   └── main.go
│
├── frontend/                           # React application
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/                 # Shared layout components
│   │   │   │   ├── Layout.tsx
│   │   │   │   ├── Sidebar.tsx
│   │   │   │   ├── Header.tsx
│   │   │   │   └── LoadingSpinner.tsx
│   │   │   ├── {feature}/              # Feature-specific components
│   │   │   ├── settings/               # Settings components
│   │   │   │   ├── SettingsPage.tsx
│   │   │   │   ├── SettingsCategory.tsx
│   │   │   │   ├── SettingItem.tsx
│   │   │   │   └── ThemeSelector.tsx
│   │   │   └── ui/                     # shadcn/ui components
│   │   ├── hooks/
│   │   │   ├── useWebSocket.ts
│   │   │   ├── useSettings.ts
│   │   │   ├── useTheme.ts
│   │   │   └── ...
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Settings.tsx
│   │   │   ├── Logs.tsx
│   │   │   └── ...
│   │   ├── lib/
│   │   │   ├── api.ts
│   │   │   ├── websocket.ts
│   │   │   └── utils.ts
│   │   ├── types/
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── package.json
│   └── vite.config.ts
│
├── deploy/                             # Deployment & operations
│   ├── powershell/
│   │   ├── run.ps1                     # Main runner script
│   │   ├── powershell.json             # Project configuration
│   │   └── clean.ps1                   # Clean build
│   ├── scripts/
│   │   ├── backup.ps1
│   │   └── seed.ps1
│   ├── error-handlers/
│   │   └── crash-reporter.go
│   └── docs/
│       └── SETUP.md
│
└── CHANGELOG.md
```

---

## Required Pages (All CLIs)

| Page | Purpose |
|------|---------|
| Dashboard | Overview with status widgets |
| Settings | Configuration management |
| Logs | Real-time log viewer |
| API | API endpoint tester |

---

## Required Hooks (All CLIs)

| Hook | Purpose |
|------|---------|
| `useWebSocket` | WebSocket connection management |
| `useSettings` | Settings CRUD operations |
| `useTheme` | Theme switching |
| `useFocusTrap` | Accessibility focus management |

---

## PowerShell Configuration

### powershell.json

```json
{
  "projectName": "{cli-name}",
  "displayName": "{CLI Display Name}",
  "ports": [8XXX, 8XXX, 8XXX],
  "runCommand": "go run main.go serve --port 8XXX",
  "frontendPort": 5173,
  "commands": {
    "serve": "go run main.go serve",
    "build": "go build -o {cli-name}.exe",
    "frontend": "cd frontend && bun run dev"
  }
}
```

---

## CLI Port Assignments

| CLI | API Ports | Frontend Port |
|-----|-----------|---------------|
| GSearch CLI | 8089-8091 | 5173 |
| BRun CLI | 8092-8094 | 5174 |
| AI Bridge CLI | 8110-8112 | 5175 |
| Nexus Flow CLI | 8113-8115 | 5176 |

---

## See Also

- [Component Library](./10-component-library.md)
- [E2E Test Spec](./11-e2e-test-spec.md)
- [Accessibility Spec](./12-accessibility-spec.md)
- [Visual Regression Spec](./13-visual-regression-spec.md)
- [Split DB Architecture](../05-split-db-architecture/00-overview.md)
- [Seedable Config Architecture](../06-seedable-config-architecture/00-overview.md)
