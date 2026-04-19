# Nexus Flow CLI

**Version:** 3.1.0  
**Status:** Complete  
**Updated:** 2026-03-30  
**AI Confidence:** High  
**Ambiguity:** Low

---

## Keywords

`nexus-flow` · `golang` · `cli` · `workflow-engine` · `react-flow` · `drag-and-drop` · `pipeline` · `orchestration` · `microservices`

---

## Scoring

| Metric | Value |
|--------|-------|
| AI Confidence | High |
| Ambiguity | Low |
| Health Score | 100/100 (A+) |

---

## Summary

Visual workflow orchestration engine that enables drag-and-drop pipeline construction using React Flow. It provides a canvas-based interface for connecting microservices, AI operations, and data transformations into executable workflows.

---

## Folder Structure

```
24-nexus-flow-cli/
├── 00-overview.md                              # This file
├── 01-backend/                                 # Backend specifications
│   ├── 00-overview.md                          # Backend overview
│   ├── 11-microservices-context.md             # Microservices context
│   ├── 01-core-specification.md                # Core workflow engine
│   ├── 02-standalone-architecture.md           # Standalone deployment
│   ├── 03-openapi-specification.md             # REST API spec
│   ├── 04-error-codes.md                       # Error codes (8xxx)
│   ├── 05-database-architecture.md             # Split DB integration
│   ├── 06-implementation-checklist.md          # Implementation checklist
│   └── 07-observability.md                     # Prometheus, health checks, tracing
├── 02-frontend/                                # Frontend specifications
│   ├── 00-overview.md                          # Frontend overview
│   ├── 01-react-flow-canvas.md                 # React Flow canvas
│   └── 02-frontend-architecture.md             # Frontend architecture
├── 03-deploy/                                  # Deployment specifications
│   └── 00-overview.md                          # Deploy overview
└── 99-consistency-report.md                    # Consistency verification
```

---

## Core Capabilities

| Feature | Description |
|---------|-------------|
| Visual Canvas | React Flow-based drag-and-drop workflow builder |
| Node Types | AI nodes, data nodes, conditional nodes, loop nodes |
| Execution Engine | Topological execution with dependency resolution |
| State Management | Workflow state persistence and recovery |
| Real-time Updates | WebSocket-based execution status streaming |

---

## Quick Navigation

| Document | Location |
|----------|----------|
| Microservices Context | `./01-backend/11-microservices-context.md` |
| Core Specification | `./01-backend/01-core-specification.md` |
| React Flow Canvas | `./02-frontend/01-react-flow-canvas.md` |
| Standalone Architecture | `./01-backend/02-standalone-architecture.md` |
| OpenAPI Specification | `./01-backend/03-openapi-specification.md` |
| Error Codes | `./01-backend/04-error-codes.md` |

---

## Error Code Range

Nexus Flow CLI uses error codes **8000-8399**.

| Range | Category |
|-------|----------|
| 80xx | Canvas errors |
| 81xx | Workflow validation |
| 82xx | Execution errors |
| 83xx | State management |

---

## Integration Points

### Frontend Integration

```typescript
import { NexusFlowCanvas } from '@/features/nexus-flow';

<NexusFlowCanvas
  workflowId={currentWorkflow.id}
  onSave={handleWorkflowSave}
  onExecute={handleWorkflowExecute}
/>
```

### Backend Integration

```
POST /api/nexus/workflows         — Create workflow
GET  /api/nexus/workflows/:id     — Get workflow
POST /api/nexus/workflows/:id/run — Execute workflow
GET  /api/nexus/executions/:id    — Get execution status
```

---

## Dependencies

- **AI Bridge CLI** — For AI node execution
- **BRun CLI** — For build/task nodes
- **GSearch CLI** — For search-related nodes

---

## Cross-References

| Reference | Location |
|-----------|----------|
| Split DB Architecture | `../06-split-db-architecture/00-overview.md` |
| Seedable Config Architecture | `../07-seedable-config-architecture/00-overview.md` |
| Shared CLI Frontend | `../28-shared-cli-frontend/00-overview.md` |
| PowerShell Integration | `../50-powershell-integration/00-overview.md` |
| Error Resolution | `../04-error-resolution/00-overview.md` |
| **DBOperation Wrapper** | `../11-spec-management-software/13-shared-packages/08-pkg-database-operations.md` |
| **ORM-Only Policy** | `.lovable/memories/standards/orm-only-policy.md` |
| AI Bridge CLI | `../22-ai-bridge-cli/00-overview.md` |
| BRun CLI | `../21-brun-cli/00-overview.md` |
| GSearch CLI | `../20-gsearch-cli/00-overview.md` |
| External Tools Reference | `../11-spec-management-software/15-external-tools/03-nexus-flow-reference.md` |
