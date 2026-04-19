# Nexus Flow CLI: Implementation Checklist

**Version:** 2.0.0  
**Created:** 2026-03-09  
**Status:** Active  
**Parent:** [00-overview.md](./00-overview.md)

---

## Overview

This checklist provides a phase-based implementation guide for Nexus Flow CLI, the standalone orchestration engine for automation pipelines.

---

## Prerequisites

- [ ] Go 1.21+ installed
- [ ] SQLite3 available
- [ ] Node.js 18+ (for frontend)
- [ ] Access to dependent services (AI Bridge, GSearch)

---

## Phase 1: Core Infrastructure (Week 1)

### 1.1 Project Setup

- [ ] Initialize Go module: `go mod init nexus-flow`
- [ ] Create directory structure per `01-core-specification.md`
- [ ] Set up logging with `slog` (AddSource: true)
- [ ] Configure Viper for config management

### 1.2 CLI Framework

- [ ] Implement root command (`cli/root.go`)
- [ ] Implement `serve` command (WebSocket server)
- [ ] Implement `run` command (pipeline execution)
- [ ] Implement `validate` command
- [ ] Implement `list`, `export`, `import` commands
- [ ] Add version command with build info

### 1.3 Configuration

- [ ] Create config schema (YAML/JSON)
- [ ] Implement config loading and validation
- [ ] Add environment variable support (`NEXUS_` prefix)
- [ ] Create default config templates

---

## Phase 2: Database Layer (Week 1-2)

### 2.1 Schema Implementation

- [ ] Create migrations folder structure
- [ ] Implement `001_create_pipelines.sql`
- [ ] Implement `002_create_executions.sql`
- [ ] Implement `003_create_checkpoints.sql`
- [ ] Implement `004_create_telemetry.sql`

### 2.2 Repository Layer

- [ ] Implement `PipelineRepository`
- [ ] Implement `ExecutionRepository`
- [ ] Implement `CheckpointRepository`
- [ ] Add database connection pooling
- [ ] Implement WAL mode configuration

### 2.3 Split DB Integration

- [ ] Follow Split DB naming conventions (PascalCase)
- [ ] Implement database path patterns:
  - Root: `data/nexusflow.db`
  - Pipelines: `data/workflows/pipeline-{id}/meta.db`
  - Executions: `data/workflows/pipeline-{id}/executions/{id}.db`
  - Checkpoints: `data/workflows/pipeline-{id}/checkpoints/{id}.db`

---

## Phase 3: Pipeline Engine (Week 2-3)

### 3.1 Core Engine

- [ ] Implement `Pipeline` domain model
- [ ] Implement `Scheduler` (DAG-based)
- [ ] Implement `Executor` (block coordination)
- [ ] Implement `StateManager`

### 3.2 Block Registry

- [ ] Define `Block` interface (`block/interface.go`)
- [ ] Implement block type registry
- [ ] Implement factory pattern for block creation

### 3.3 Block Types (7 Types)

- [ ] **Prompt Block**: AI prompt execution
- [ ] **Search Block**: RAG-powered search
- [ ] **CodeGen Block**: Code generation
- [ ] **Validation Block**: Output validation
- [ ] **Transform Block**: Data transformation
- [ ] **HTTP Block**: External API calls
- [ ] **FileOp Block**: File system operations

### 3.4 Control Flow

- [ ] Implement conditional branching (`control/branch.go`)
- [ ] Implement loop with concurrency throttle (`control/loop.go`)
- [ ] Implement parallel execution group (`control/parallel.go`)

---

## Phase 4: WebSocket Server (Week 3)

### 4.1 Server Implementation

- [ ] Implement WebSocket server (`websocket/server.go`)
- [ ] Implement message handlers (`websocket/handler.go`)
- [ ] Define protocol types (`websocket/protocol.go`)
- [ ] Implement session management (`websocket/session.go`)

### 4.2 Protocol Messages

- [ ] `PIPELINE_START` / `PIPELINE_STARTED`
- [ ] `BLOCK_PROGRESS` / `BLOCK_COMPLETE`
- [ ] `PIPELINE_COMPLETE` / `PIPELINE_ERROR`
- [ ] `PAUSE` / `RESUME` / `CANCEL`
- [ ] `HEARTBEAT` / `PONG`

### 4.3 Real-time Features

- [ ] Block execution progress streaming
- [ ] Token streaming for AI blocks
- [ ] Error propagation
- [ ] Execution state synchronization

---

## Phase 5: HTTP API (Week 3-4)

### 5.1 Handler Implementation

- [ ] Implement pipeline handlers (`handler/pipeline.go`)
- [ ] Implement execution handlers (`handler/execution.go`)
- [ ] Implement health handlers (`handler/health.go`)

### 5.2 API Endpoints

Per `03-openapi-specification.md`:

- [ ] `GET /api/v1/health`
- [ ] `GET /api/v1/pipelines`
- [ ] `POST /api/v1/pipelines`
- [ ] `GET /api/v1/pipelines/{id}`
- [ ] `PUT /api/v1/pipelines/{id}`
- [ ] `DELETE /api/v1/pipelines/{id}`
- [ ] `POST /api/v1/pipelines/{id}/execute`
- [ ] `GET /api/v1/executions`
- [ ] `GET /api/v1/executions/{id}`
- [ ] `POST /api/v1/executions/{id}/cancel`

### 5.3 Middleware

- [ ] Request logging middleware
- [ ] Error handling middleware
- [ ] CORS configuration
- [ ] Rate limiting (optional)

---

## Phase 6: RES Integration (Week 4)

### 6.1 Resilient Execution System

- [ ] Implement RES bridge (`res/bridge.go`)
- [ ] Implement checkpoint management (`res/checkpoint.go`)
- [ ] Implement recovery strategies (`res/recovery.go`)

### 6.2 Fault Tolerance

- [ ] Automatic checkpoint creation
- [ ] Execution resume from checkpoint
- [ ] Error classification and handling
- [ ] Retry with exponential backoff

---

## Phase 7: Frontend (Week 5)

### 7.1 React Setup

- [ ] Initialize React project with Vite
- [ ] Configure TypeScript
- [ ] Set up Tailwind CSS
- [ ] Configure shadcn/ui components

### 7.2 Core Components

- [ ] Pipeline list view
- [ ] Pipeline editor (React Flow canvas)
- [ ] Block configuration panels
- [ ] Execution monitor view

### 7.3 WebSocket Integration

- [ ] WebSocket connection manager
- [ ] Real-time execution updates
- [ ] Block progress visualization

### 7.4 Swagger UI

- [ ] Mount Swagger UI at `/swagger/`
- [ ] Serve OpenAPI spec at `/api/v1/openapi.json`

---

## Phase 8: Testing (Week 5-6)

### 8.1 Unit Tests

- [ ] Block execution tests
- [ ] Scheduler tests
- [ ] Repository tests
- [ ] WebSocket protocol tests

### 8.2 Integration Tests

- [ ] End-to-end pipeline execution
- [ ] WebSocket connection tests
- [ ] API endpoint tests
- [ ] Database migration tests

### 8.3 Performance Tests

- [ ] Concurrent execution benchmarks
- [ ] WebSocket connection limits
- [ ] Database query performance

---

## Phase 9: Observability (Week 6)

### 9.1 Logging

- [ ] Structured JSON logging
- [ ] Request/response logging
- [ ] Execution trace logging
- [ ] Error context logging

### 9.2 Metrics

- [ ] Pipeline execution duration
- [ ] Block execution counts
- [ ] Error rates by block type
- [ ] WebSocket connection metrics

### 9.3 Health Checks

- [ ] Database connectivity
- [ ] External service health
- [ ] Memory/CPU utilization

---

## Error Code Mapping

Per `04-error-codes.md`, all errors use range **8000-8399**:

| Range | Category |
|-------|----------|
| 8000-8049 | Core/Startup |
| 8050-8099 | Pipeline |
| 8100-8149 | Block Execution |
| 8150-8199 | WebSocket |
| 8200-8249 | Checkpoint/RES |
| 8250-8299 | Database |
| 8300-8349 | External Services |
| 8350-8399 | Reserved |

---

## Validation Checklist

Before marking implementation complete:

- [ ] All 7 block types functional
- [ ] WebSocket real-time updates working
- [ ] Pipeline CRUD operations complete
- [ ] Execution history persisted
- [ ] Checkpoint/resume functional
- [ ] Frontend displays execution progress
- [ ] Swagger UI accessible at `/swagger/`
- [ ] All error codes mapped (8000-8399)
- [ ] Split DB patterns followed (PascalCase)
- [ ] Logging includes source locations

---

## Cross-References

| Document | Description |
|----------|-------------|
| [01-core-specification.md](./01-core-specification.md) | Detailed architecture |
| [02-standalone-architecture.md](./02-standalone-architecture.md) | Deployment patterns |
| [03-openapi-specification.md](./03-openapi-specification.md) | REST API spec |
| [04-error-codes.md](./04-error-codes.md) | Error code definitions |
| [05-database-architecture.md](./05-database-architecture.md) | Database schema |
