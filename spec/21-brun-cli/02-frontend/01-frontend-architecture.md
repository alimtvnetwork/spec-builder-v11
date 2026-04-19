# BRun CLI Frontend Architecture

> **Version:** 4.0.0  
> **Created:** 2026-03-09  
> **Parent:** [00-overview.md](./00-overview.md)  
> **Shared Spec:** [spec/28-shared-cli-frontend/](../../28-shared-cli-frontend/)

---

## Summary

React frontend for the BRun CLI, implementing the shared CLI frontend architecture with build-runner specific features.

---

## Architecture

```
brun-cli/
├── backend/                        # Go CLI + HTTP/WS server
│   ├── cmd/
│   │   ├── root.go
│   │   ├── build.go
│   │   ├── check.go
│   │   ├── serve.go                # HTTP/WS server command
│   │   ├── run.go
│   │   ├── port.go
│   │   └── config.go
│   ├── internal/
│   │   ├── api/                    # HTTP/WS handlers
│   │   ├── executor/               # Runtime executors
│   │   ├── config/
│   │   ├── port/
│   │   └── ...
│   ├── configs/
│   │   ├── config.seed.json
│   │   └── presets.json
│   └── main.go
├── frontend/                       # React application
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/             # Shared components
│   │   │   ├── build/              # Build-specific components
│   │   │   │   ├── BuildForm.tsx
│   │   │   │   ├── ProfileSelector.tsx
│   │   │   │   ├── RuntimeSelector.tsx
│   │   │   │   └── BuildOutput.tsx
│   │   │   └── ui/
│   │   ├── hooks/
│   │   │   ├── useBuild.ts
│   │   │   ├── useProfiles.ts
│   │   │   └── ...
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx       # Build dashboard
│   │   │   ├── Profiles.tsx        # Manage profiles
│   │   │   ├── Runs.tsx            # Run history
│   │   │   └── ...
│   │   └── ...
│   └── package.json
├── deploy/                         # Deployment & operations
│   ├── powershell/                 # PowerShell integration
│   │   ├── run.ps1                 # Main runner script
│   │   ├── powershell.json         # Project configuration
│   │   └── clean.ps1               # Clean build script
│   ├── scripts/                    # Utility scripts
│   │   ├── backup.ps1
│   │   └── seed.ps1
│   ├── error-handlers/             # Error handling utilities
│   │   └── crash-reporter.go
│   └── docs/
│       └── SETUP.md
└── CHANGELOG.md
```

---

## BRun-Specific Features

### 1. Build Dashboard

Main interface for executing builds:

| Feature | Description |
|---------|-------------|
| Profile Selection | Select saved build profile |
| Runtime Selection | Choose PowerShell, Node.js, Go |
| Build Options | Source path, output dir, asset mode |
| Real-time Output | Stream build output live |

### 2. Profile Manager

Create and manage build profiles:

| Feature | Description |
|---------|-------------|
| Profile List | All saved profiles |
| Create/Edit | Profile configuration form |
| Clone | Duplicate existing profile |
| Export/Import | Share profiles |

### 3. Run History

Track and analyze previous builds:

| Feature | Description |
|---------|-------------|
| History List | All previous runs |
| Error Analysis | View captured errors |
| Duration Tracking | Build time analytics |
| Logs | Access log files |

---

## API Endpoints

### Build Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/build` | Start new build |
| GET | `/api/build/:id` | Get build status |
| POST | `/api/build/:id/cancel` | Cancel running build |
| GET | `/api/build/history` | List all builds |

### Profile Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/profiles` | List all profiles |
| POST | `/api/profiles` | Create profile |
| PUT | `/api/profiles/:id` | Update profile |
| DELETE | `/api/profiles/:id` | Delete profile |

### Port Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/port/check/:port` | Check port availability |
| POST | `/api/port/firewall` | Configure firewall |

---

## WebSocket Events

### BRun-Specific Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `build.started` | B→F | Build has started |
| `build.output` | B→F | Build stdout/stderr line |
| `build.progress` | B→F | Build step progress |
| `build.completed` | B→F | Build finished |
| `build.error` | B→F | Build error |
| `build.cancel` | F→B | Cancel running build |

---

## Seedable Configuration

### config.seed.json

```json
{
  "version": "1.0.0",
  "categories": {
    "build": {
      "displayName": "Build",
      "settings": {
        "defaultRuntime": {
          "type": "select",
          "label": "Default Runtime",
          "default": "go",
          "options": ["go", "node", "powershell"]
        },
        "assetMode": {
          "type": "select",
          "label": "Asset Copy Mode",
          "default": "override",
          "options": ["clear-copy", "override", "skip-existing"]
        },
        "timeout": {
          "type": "number",
          "label": "Build Timeout (seconds)",
          "default": 300,
          "min": 30,
          "max": 3600
        }
      }
    },
    "network": {
      "displayName": "Network",
      "settings": {
        "port": {
          "type": "number",
          "label": "Server Port",
          "default": 8100,
          "min": 1024,
          "max": 65535
        }
      }
    }
  }
}
```

---

## PowerShell Configuration

### powershell.json

```json
{
  "projectName": "brun",
  "ports": [8100, 8101, 8102],
  "runCommand": "go run main.go serve --port 8100"
}
```

---

## Error Codes

BRun frontend uses error range **7150-7169**:

| Code | Error | Description |
|------|-------|-------------|
| 7150 | WS_CONNECTION_FAILED | WebSocket connection failure |
| 7151 | WS_DISCONNECTED | WebSocket unexpectedly closed |
| 7152 | SETTINGS_LOAD_FAILED | Failed to load settings |
| 7153 | SETTINGS_SAVE_FAILED | Failed to save settings |
| 7154 | API_TIMEOUT | API request timeout |
| 7155 | API_ERROR | API returned error response |
| 7156 | CONFIG_PARSE_ERROR | Failed to parse config |
| 7157 | VERSION_MISMATCH | Frontend/backend version mismatch |
| 7158 | PORT_UNAVAILABLE | Configured port not available |
| 7159 | FIREWALL_BLOCKED | Firewall blocking connection |
| 7160 | BUILD_CANCELLED | Build was cancelled |
| 7161 | PROFILE_NOT_FOUND | Build profile not found |

---

## Cross-References

| Reference | Location |
|-----------|----------|
| Shared Frontend Spec | `spec/28-shared-cli-frontend/` |
| Deploy Folder Spec | `spec/28-shared-cli-frontend/09-deploy-folder.md` |
| Split DB Architecture | `spec/06-split-db-architecture/` |
| Seedable Config Architecture | `spec/07-seedable-config-architecture/` |
| Backend CLI Spec | `../01-backend/02-cli-interface.md` |
| Build Profiles | `../01-backend/07-build-profiles.md` |
| Error Codes | `../01-backend/06-error-handling.md` |
| PowerShell Integration | `spec/50-powershell-integration/` |

---

*BRun CLI frontend implements the shared CLI frontend architecture with three-folder structure.*
