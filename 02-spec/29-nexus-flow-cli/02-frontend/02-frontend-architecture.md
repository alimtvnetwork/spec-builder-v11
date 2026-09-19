# Nexus Flow Frontend Architecture

> **Version:** 2.0.0  
> **Created:** 2026-03-09  
> **Parent:** [00-overview.md](./00-overview.md)  
> **Shared Spec:** [02-spec/33-shared-cli-frontend/](../../28-shared-cli-frontend/)

---

## Summary

React frontend for Nexus Flow, implementing the shared CLI frontend architecture with workflow-specific features including the React Flow canvas.

---

## Architecture

```
nexus-flow/
├── backend/                        # Go CLI + HTTP/WS server
│   ├── cmd/
│   │   ├── root.go
│   │   ├── daemon.go
│   │   ├── run.go
│   │   └── serve.go                # HTTP/WS server command
│   ├── internal/
│   │   ├── api/                    # HTTP/WS handlers
│   │   ├── workflow/               # Workflow engine
│   │   ├── execution/              # Execution engine
│   │   └── ...
│   ├── configs/
│   │   ├── config.seed.json
│   │   └── presets.json
│   └── main.go
├── frontend/                       # React application
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/             # Shared components
│   │   │   ├── workflow/           # Workflow-specific components
│   │   │   │   ├── Canvas.tsx
│   │   │   │   ├── NodeLibrary.tsx
│   │   │   │   ├── NodeEditor.tsx
│   │   │   │   ├── ExecutionPanel.tsx
│   │   │   │   └── nodes/          # Custom node types
│   │   │   │       ├── AINode.tsx
│   │   │   │       ├── DataNode.tsx
│   │   │   │       ├── ConditionNode.tsx
│   │   │   │       └── LoopNode.tsx
│   │   │   └── ui/
│   │   ├── hooks/
│   │   │   ├── useWorkflow.ts
│   │   │   ├── useExecution.ts
│   │   │   ├── useNodes.ts
│   │   │   └── ...
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx       # Workflow list
│   │   │   ├── Editor.tsx          # Canvas editor
│   │   │   ├── Executions.tsx      # Execution history
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

## Nexus Flow-Specific Features

### 1. Workflow Canvas

React Flow-based visual editor:

| Feature | Description |
|---------|-------------|
| Drag-and-Drop | Node placement from library |
| Connection | Visual edge creation |
| Zoom/Pan | Canvas navigation |
| Mini-map | Overview navigation |
| Selection | Multi-select nodes |
| Copy/Paste | Duplicate nodes |

### 2. Node Library

Available node types:

| Node Type | Description |
|-----------|-------------|
| AI Node | LLM execution via AI Bridge |
| Data Node | Data input/output |
| Condition Node | Branching logic |
| Loop Node | Iteration |
| HTTP Node | External API calls |
| Transform Node | Data transformation |

### 3. Execution Panel

Monitor workflow execution:

| Feature | Description |
|---------|-------------|
| Start/Stop | Control execution |
| Node Status | Per-node status display |
| Data Flow | View data between nodes |
| Error Display | Show node errors |
| History | Execution history |

---

## API Endpoints

### Workflow Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/workflows` | List workflows |
| POST | `/api/workflows` | Create workflow |
| GET | `/api/workflows/:id` | Get workflow |
| PUT | `/api/workflows/:id` | Update workflow |
| DELETE | `/api/workflows/:id` | Delete workflow |

### Execution Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/workflows/:id/execute` | Start execution |
| GET | `/api/executions/:id` | Get execution status |
| POST | `/api/executions/:id/cancel` | Cancel execution |
| GET | `/api/executions` | List executions |

### Node Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/node-types` | List available node types |
| GET | `/api/node-types/:type/schema` | Get node schema |

---

## WebSocket Events

### Nexus Flow-Specific Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `execution.started` | B→F | Workflow execution started |
| `node.started` | B→F | Node execution started |
| `node.output` | B→F | Node produced output |
| `node.completed` | B→F | Node completed |
| `node.error` | B→F | Node error |
| `execution.completed` | B→F | Workflow completed |
| `execution.cancel` | F→B | Cancel execution |

---

## Seedable Configuration

### config.seed.json

```json
{
  "version": "1.0.0",
  "categories": {
    "execution": {
      "displayName": "Execution",
      "settings": {
        "MaxConcurrentNodes": {
          "type": "number",
          "label": "Max Concurrent Nodes",
          "default": 5,
          "min": 1,
          "max": 20
        },
        "NodeTimeout": {
          "type": "number",
          "label": "Node Timeout (seconds)",
          "default": 60,
          "min": 10,
          "max": 600
        },
        "RetryOnError": {
          "type": "boolean",
          "label": "Retry on Error",
          "default": true
        },
        "MaxRetries": {
          "type": "number",
          "label": "Max Retries",
          "default": 3,
          "min": 0,
          "max": 10
        }
      }
    },
    "canvas": {
      "displayName": "Canvas",
      "settings": {
        "SnapToGrid": {
          "type": "boolean",
          "label": "Snap to Grid",
          "default": true
        },
        "GridSize": {
          "type": "number",
          "label": "Grid Size",
          "default": 20,
          "min": 10,
          "max": 50
        },
        "ShowMinimap": {
          "type": "boolean",
          "label": "Show Minimap",
          "default": true
        }
      }
    },
    "network": {
      "displayName": "Network",
      "settings": {
        "port": {
          "type": "number",
          "label": "Server Port",
          "default": 5050,
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
  "projectName": "nexus-flow",
  "ports": [5050, 5052, 5053],
  "runCommand": "go run main.go daemon start --port 5050"
}
```

---

## Error Codes

Nexus Flow frontend uses error range **8050-8069**:

| Code | Error | Description |
|------|-------|-------------|
| 8050 | WS_CONNECTION_FAILED | WebSocket connection failure |
| 8051 | WS_DISCONNECTED | WebSocket unexpectedly closed |
| 8052 | SETTINGS_LOAD_FAILED | Failed to load settings |
| 8053 | SETTINGS_SAVE_FAILED | Failed to save settings |
| 8054 | API_TIMEOUT | API request timeout |
| 8055 | API_ERROR | API returned error response |
| 8056 | CONFIG_PARSE_ERROR | Failed to parse config |
| 8057 | VERSION_MISMATCH | Frontend/backend version mismatch |
| 8058 | PORT_UNAVAILABLE | Configured port not available |
| 8059 | FIREWALL_BLOCKED | Firewall blocking connection |
| 8060 | WORKFLOW_NOT_FOUND | Workflow not found |
| 8061 | EXECUTION_FAILED | Workflow execution failed |
| 8062 | INVALID_NODE_CONNECTION | Invalid node connection |

---

## Cross-References

| Reference | Location |
|-----------|----------|
| Shared Frontend Spec | `02-spec/33-shared-cli-frontend/` |
| Deploy Folder Spec | `02-spec/33-shared-cli-frontend/09-deploy-folder.md` |
| Split DB Architecture | `02-spec/06-split-db-architecture/` |
| Seedable Config Architecture | `02-spec/07-seedable-config-architecture/` |
| Core Specification | `../01-backend/01-core-specification.md` |
| React Flow Canvas | `./01-react-flow-canvas.md` |
| Error Codes | `../01-backend/04-error-codes.md` |
| PowerShell Integration | `02-spec/11-powershell-integration/` |

---

*Nexus Flow frontend implements the shared CLI frontend architecture with three-folder structure and React Flow canvas.*
