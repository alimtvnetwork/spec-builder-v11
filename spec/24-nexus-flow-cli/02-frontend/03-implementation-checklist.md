# Nexus Flow CLI Frontend Implementation Checklist

> **Version:** 2.0.0  
> **Created:** 2026-03-09  
> **Parent:** [02-frontend-architecture.md](./02-frontend-architecture.md)  
> **Purpose:** Detailed implementation reference for Nexus Flow CLI frontend build

---

## Overview

This checklist provides a step-by-step implementation guide for the Nexus Flow CLI frontend. It follows the **GSearch CLI implementation checklist** as a template and adapts it for Nexus Flow-specific features (React Flow canvas, workflow execution, node library).

**Time Estimate:** 18-22 hours for complete implementation

**Error Code Range:** 8050-8069 (frontend-specific)

**Primary Port:** 5050 (fallback: 5052, 5053)

---

## Phase 1: Project Setup

### 1.1 Directory Structure

- [ ] Create `frontend/` directory in project root
- [ ] Initialize with `npm create vite@latest . -- --template react-ts`
- [ ] Create folder structure:
  ```
  frontend/
  ├── src/
  │   ├── components/
  │   │   ├── common/        # Shared UI components
  │   │   ├── canvas/        # React Flow canvas components
  │   │   ├── nodes/         # Custom node components
  │   │   ├── execution/     # Execution panel components
  │   │   └── ui/            # shadcn/ui components
  │   ├── hooks/             # Custom React hooks
  │   ├── lib/               # Utilities and helpers
  │   │   ├── api/           # API client
  │   │   ├── errors/        # Error handling
  │   │   ├── flow/          # React Flow utilities
  │   │   └── websocket/     # WebSocket manager
  │   ├── pages/             # Route components
  │   ├── stores/            # Zustand stores
  │   └── types/             # TypeScript definitions
  ├── public/
  └── index.html
  ```

### 1.2 Dependencies

- [ ] Install core dependencies:
  ```bash
  npm install react react-dom react-router-dom
  npm install @tanstack/react-query zustand
  npm install class-variance-authority clsx tailwind-merge
  npm install lucide-react sonner
  npm install reactflow  # Core canvas library
  npm install @xyflow/react  # Alternative modern version
  npm install elkjs  # Auto-layout support
  ```

- [ ] Install dev dependencies:
  ```bash
  npm install -D typescript @types/react @types/react-dom
  npm install -D tailwindcss postcss autoprefixer
  npm install -D @vitejs/plugin-react-swc vite
  ```

- [ ] Install shadcn/ui:
  ```bash
  npx shadcn@latest init
  npx shadcn@latest add button card dialog input label select tabs toast badge progress context-menu dropdown-menu sheet
  ```

### 1.3 Configuration Files

- [ ] Configure `vite.config.ts` with proxy to port 8089
- [ ] Configure `tailwind.config.js` with Nexus Flow theme colors
- [ ] Configure `tsconfig.json` with path aliases

---

## Phase 2: Core Infrastructure

### 2.1 WebSocket Manager

**Reference:** `spec/28-shared-cli-frontend/02-websocket-protocol.md`

- [ ] Create `src/lib/websocket/WebSocketManager.ts`
- [ ] Create `src/lib/websocket/types.ts`
- [ ] Create `src/hooks/useWebSocket.ts`
- [ ] Add execution event streaming support

### 2.2 API Client

**Reference:** `spec/28-shared-cli-frontend/04-api-tester.md`

- [ ] Create `src/lib/api/client.ts`
- [ ] Create `src/lib/api/endpoints.ts`
- [ ] Create API hooks:
  - [ ] `useWorkflows.ts` - Workflow CRUD
  - [ ] `useExecutions.ts` - Execution operations
  - [ ] `useNodeTypes.ts` - Node library
  - [ ] `useSettings.ts` - Settings CRUD

### 2.3 Error Handling System

**Reference:** `spec/28-shared-cli-frontend/05-error-modal.md`

- [ ] Create `src/lib/errors/AppError.ts`
- [ ] Create `src/lib/errors/codes.ts` (codes 8050-8069)
- [ ] Create `src/lib/errors/ErrorBoundary.tsx`
- [ ] Create `src/stores/errorStore.ts`

### 2.4 State Management

- [ ] Create `src/stores/appStore.ts`
- [ ] Create `src/stores/workflowStore.ts` (active workflow state)
- [ ] Create `src/stores/executionStore.ts` (execution state)
- [ ] Create `src/stores/canvasStore.ts` (canvas preferences)
- [ ] Create `src/stores/settingsStore.ts`

---

## Phase 3: Common Components

### 3.1 Layout Components

- [ ] Create `src/components/common/Layout.tsx`
- [ ] Create `src/components/common/Sidebar.tsx`
- [ ] Create `src/components/common/Header.tsx`

### 3.2 Log Viewer

- [ ] Create `src/components/common/LogViewer.tsx`
- [ ] Create `src/hooks/useLogs.ts`

### 3.3 Settings Page

- [ ] Create `src/pages/Settings.tsx`
- [ ] Create canvas-specific settings:
  - [ ] `snapToGrid` (boolean, default: true)
  - [ ] `gridSize` (number, default: 20)
  - [ ] `showMinimap` (boolean, default: true)

### 3.4 API Tester

- [ ] Create `src/pages/ApiTester.tsx`
- [ ] Create `src/components/common/EndpointCard.tsx`
- [ ] Create `src/components/common/ResponseViewer.tsx`

### 3.5 Error & Changelog Modals

- [ ] Create `src/components/common/ErrorModal.tsx`
- [ ] Create `src/components/common/ChangelogModal.tsx`

### 3.6 Connection Status

- [ ] Create `src/components/common/ConnectionStatus.tsx`

---

## Phase 4: Nexus Flow-Specific Components

### 4.1 Workflow Canvas (Core Feature)

**Reference:** `../01-react-flow-canvas.md`

- [ ] Create `src/pages/Canvas.tsx`:
  - [ ] React Flow canvas container
  - [ ] Node library sidebar
  - [ ] Execution panel
  - [ ] Minimap

- [ ] Create `src/components/canvas/FlowCanvas.tsx`:
  - [ ] React Flow provider setup
  - [ ] Keyboard shortcuts (Ctrl+S, Del, Ctrl+Z)
  - [ ] Pan/zoom controls
  - [ ] Grid background
  - [ ] Auto-layout button

- [ ] Create `src/components/canvas/NodeLibrary.tsx`:
  - [ ] Categorized node list
  - [ ] Search/filter
  - [ ] Drag-to-add support
  - [ ] Node previews

- [ ] Create `src/components/canvas/Minimap.tsx`:
  - [ ] Viewport indicator
  - [ ] Node overview
  - [ ] Click-to-navigate

- [ ] Create `src/components/canvas/CanvasToolbar.tsx`:
  - [ ] Zoom controls
  - [ ] Undo/redo buttons
  - [ ] Auto-layout button
  - [ ] Save/load buttons
  - [ ] Run workflow button

### 4.2 Custom Node Components

- [ ] Create `src/components/nodes/BaseNode.tsx`:
  - [ ] Common node structure
  - [ ] Input/output handles
  - [ ] Status indicator
  - [ ] Delete button

- [ ] Create `src/components/nodes/TriggerNode.tsx`:
  - [ ] Start node styling
  - [ ] Configuration panel

- [ ] Create `src/components/nodes/ActionNode.tsx`:
  - [ ] Action type selector
  - [ ] Parameter inputs
  - [ ] Output preview

- [ ] Create `src/components/nodes/ConditionNode.tsx`:
  - [ ] Condition expression input
  - [ ] True/false output handles
  - [ ] Expression validator

- [ ] Create `src/components/nodes/TransformNode.tsx`:
  - [ ] Data transformation config
  - [ ] Input/output schema

- [ ] Create `src/components/nodes/OutputNode.tsx`:
  - [ ] End node styling
  - [ ] Output display

- [ ] Create `src/lib/flow/nodeTypes.ts`:
  - [ ] Register all custom node types
  - [ ] Define node schemas

### 4.3 Execution Panel

- [ ] Create `src/components/execution/ExecutionPanel.tsx`:
  - [ ] Start/stop buttons
  - [ ] Live execution status
  - [ ] Node-by-node progress

- [ ] Create `src/components/execution/ExecutionTimeline.tsx`:
  - [ ] Node execution order
  - [ ] Duration per node
  - [ ] Success/failure indicators

- [ ] Create `src/components/execution/NodeOutput.tsx`:
  - [ ] Output data viewer
  - [ ] Error display
  - [ ] Expand/collapse

- [ ] Create `src/components/execution/VariableInspector.tsx`:
  - [ ] Current variable values
  - [ ] Step-by-step changes
  - [ ] JSON tree viewer

### 4.4 Workflow Management

- [ ] Create `src/pages/Workflows.tsx`:
  - [ ] Workflow list
  - [ ] Create new workflow
  - [ ] Import/export

- [ ] Create `src/components/canvas/WorkflowCard.tsx`:
  - [ ] Workflow name and description
  - [ ] Node count badge
  - [ ] Last modified date
  - [ ] Quick actions (edit, duplicate, delete)

- [ ] Create `src/components/canvas/WorkflowEditor.tsx`:
  - [ ] Name/description inputs
  - [ ] Version info
  - [ ] Tags/categories

### 4.5 Dashboard

- [ ] Create `src/pages/Dashboard.tsx`:
  - [ ] Recent workflows
  - [ ] Execution history
  - [ ] Quick stats

- [ ] Create `src/components/common/ExecutionHistoryCard.tsx`:
  - [ ] Workflow name
  - [ ] Execution time
  - [ ] Status (success/failure)
  - [ ] Duration

---

## Phase 5: Routing & Pages

### 5.1 Router Setup

- [ ] Create `src/App.tsx` with routes:

| Route | Page | Description |
|-------|------|-------------|
| `/` | Dashboard | Overview and recent workflows |
| `/canvas` | Canvas | Main workflow editor |
| `/canvas/:id` | Canvas | Edit specific workflow |
| `/workflows` | Workflows | Workflow management |
| `/executions` | Executions | Execution history |
| `/settings` | Settings | Configuration |
| `/api-tester` | ApiTester | API testing tool |
| `/logs` | Logs | Live log viewer |

### 5.2 Page Integration

- [ ] Implement all pages with proper:
  - [ ] Loading states (skeletons)
  - [ ] Error states (with retry)
  - [ ] Empty states (helpful messages)

---

## Phase 6: Integration & Testing

### 6.1 Backend Integration

- [ ] Verify all API endpoints work:

**Workflows**
- [ ] `GET /api/workflows`
- [ ] `POST /api/workflows`
- [ ] `GET /api/workflows/:id`
- [ ] `PUT /api/workflows/:id`
- [ ] `DELETE /api/workflows/:id`
- [ ] `POST /api/workflows/:id/duplicate`

**Node Types**
- [ ] `GET /api/node-types`
- [ ] `GET /api/node-types/:category`

**Executions**
- [ ] `POST /api/executions`
- [ ] `GET /api/executions/:id`
- [ ] `DELETE /api/executions/:id` (cancel)
- [ ] `GET /api/executions/history`

**Settings/Health**
- [ ] `GET /api/health`
- [ ] `GET /api/version`
- [ ] `GET /api/settings`
- [ ] `PUT /api/settings/:category`

### 6.2 WebSocket Events

- [ ] `connection` / `disconnection`
- [ ] `log` events
- [ ] `execution.started`
- [ ] `execution.progress`
- [ ] `node.started`
- [ ] `node.completed`
- [ ] `node.error`
- [ ] `execution.completed`
- [ ] `execution.error`
- [ ] `settings.updated`

### 6.3 Testing

- [ ] Unit tests for API client, WebSocket, stores
- [ ] Component tests for BaseNode, FlowCanvas, ExecutionPanel
- [ ] Integration tests for workflow CRUD, execution flow
- [ ] E2E tests for complete workflow creation and execution

### 6.4 Performance

- [ ] Verify canvas performance with 100+ nodes
- [ ] Verify smooth pan/zoom
- [ ] Verify bundle size < 550KB gzipped
- [ ] Code splitting per route

---

## Phase 7: PowerShell Integration

**Reference:** `spec/28-shared-cli-frontend/09-powershell-integration.md`

- [ ] Verify `Open-NexusFlowUI` function
- [ ] Verify `Start-NexusFlowServer` spawns correctly
- [ ] Test port fallback (8089 → 8120 → 8121)
- [ ] Test firewall rule creation

---

## Completion Criteria

| Criterion | Required |
|-----------|----------|
| All pages functional | ✅ |
| React Flow canvas works | ✅ |
| Custom nodes render correctly | ✅ |
| Workflow CRUD works | ✅ |
| Execution with real-time updates | ✅ |
| Node library drag-and-drop | ✅ |
| WebSocket real-time updates | ✅ |
| Settings persistence | ✅ |
| PowerShell integration works | ✅ |
| Tests passing | ✅ |
| Bundle size < 550KB | ✅ |

---

## Cross-References

| Reference | Location |
|-----------|----------|
| Frontend Architecture | `./02-frontend-architecture.md` |
| React Flow Canvas | `./01-react-flow-canvas.md` |
| Overview | `../00-overview.md` |
| Core Specification | `../01-backend/01-core-specification.md` |
| OpenAPI Specification | `../01-backend/03-openapi-specification.md` |
| Error Codes | `../01-backend/04-error-codes.md` |
| Shared CLI Frontend | `../../28-shared-cli-frontend/00-overview.md` |
| GSearch Checklist (Template) | `../../20-gsearch-cli/02-frontend/03-implementation-checklist.md` |
