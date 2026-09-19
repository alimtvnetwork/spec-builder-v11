# Nexus Flow Error Codes

**Version:** 2.0.0  
**Updated:** 2026-03-09  

---

## Error Code Range

Nexus Flow uses the **8xxx** error code range.

---

## Error Categories

### 80xx — Canvas Errors

| Code | Name | Description |
|------|------|-------------|
| 8001 | ErrCanvasInitFailed | React Flow canvas initialization failed |
| 8002 | ErrNodeCreateFailed | Failed to create workflow node |
| 8003 | ErrEdgeCreateFailed | Failed to create node connection |
| 8004 | ErrLayoutError | Auto-layout calculation failed |

### 81xx — Workflow Errors

| Code | Name | Description |
|------|------|-------------|
| 8101 | ErrWorkflowInvalid | Workflow definition validation failed |
| 8102 | ErrCycleDetected | Circular dependency detected in workflow |
| 8103 | ErrOrphanNode | Node has no connections |
| 8104 | ErrMissingInput | Required node input not connected |

### 82xx — Execution Errors

| Code | Name | Description |
|------|------|-------------|
| 8201 | ErrExecStartFailed | Workflow execution failed to start |
| 8202 | ErrNodeExecFailed | Individual node execution failed |
| 8203 | ErrTimeout | Execution timeout exceeded |
| 8204 | ErrAbortRequested | Execution aborted by user |

### 83xx — State Errors

| Code | Name | Description |
|------|------|-------------|
| 8301 | ErrStateSaveFailed | Failed to persist workflow state |
| 8302 | ErrStateLoadFailed | Failed to load workflow state |
| 8303 | ErrStateCorrupt | Workflow state data corrupted |

---

## See Also

- [Core Specification](./01-core-specification.md)
- [Error Management](../../21-app/spec-management-software/06-error-management/00-overview.md)
