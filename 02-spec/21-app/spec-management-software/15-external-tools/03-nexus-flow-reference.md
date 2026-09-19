# Nexus Flow CLI Reference


**Last Updated:** 2026-03-20  

> **External Spec:** `02-spec/29-nexus-flow-cli/`  
> **Version:** 3.0.0  
> **Error Range:** 8000-8399  
> **Status:** ✅ Extracted

---

## Summary

Visual workflow orchestration engine using React Flow for drag-and-drop pipeline construction. Connects microservices, AI operations, and data transformations into executable workflows.

---

## Full Specification

📁 **Location:** [`02-spec/29-nexus-flow-cli/`](../../24-nexus-flow-cli/00-overview.md)

---

## Specification Files

### Backend (`01-backend/`)

| File | Description |
|------|-------------|
| `11-microservices-context.md` | Microservices ecosystem context |
| `01-core-specification.md` | Core workflow engine specification |
| `02-standalone-architecture.md` | Standalone deployment architecture |
| `03-openapi-specification.md` | REST API specification |
| `04-error-codes.md` | Error codes (8xxx range) |

### Frontend (`02-frontend/`)

| File | Description |
|------|-------------|
| `01-react-flow-canvas.md` | React Flow canvas implementation |
| `02-frontend-architecture.md` | Frontend architecture |

---

## Error Code Range

| Range | Category |
|-------|----------|
| 80xx | Canvas errors |
| 81xx | Workflow validation |
| 82xx | Execution errors |
| 83xx | State management |

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

## See Also

- [Full Specification](../../24-nexus-flow-cli/00-overview.md)
- [AI Bridge Reference](./02-ai-bridge-reference.md)
- [BRun CLI Reference](./04-brun-reference.md)
- [External Tools Overview](./00-overview.md)
