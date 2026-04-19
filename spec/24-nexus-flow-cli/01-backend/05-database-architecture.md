# Nexus Flow CLI: Complete Database Architecture

**Version:** 3.0.0  
**Status:** Complete  
**Updated:** 2026-03-09  

---

## CRITICAL: Naming Convention

**All field names use PascalCase. No underscores allowed.**

| ❌ Wrong | ✅ Correct |
|----------|-----------|
| `pipeline_id` | `PipelineId` |
| `execution_id` | `ExecutionId` |
| `created_at` | `CreatedAt` |

See: `.lovable/memories/training/09-database-naming-conventions.md`

---

## Overview

This document defines the **complete database architecture** for Nexus Flow CLI using the Split DB pattern:

- **Root DB**: Global settings, pipeline registry, counters
- **Pipeline Meta DB**: Pipeline definition and configuration
- **Execution Session DBs**: Individual workflow execution logs
- **Checkpoint DBs**: RES checkpoint data for fault tolerance

---

## Database Hierarchy

```
data/
├── nexusflow.db                                   # ROOT DB (Setting DB)
│
└── workflows/
    │
    ├── pipeline-001/                              # Pipeline folder
    │   ├── meta.db                                # Pipeline Meta DB
    │   │
    │   ├── executions/
    │   │   ├── 001-exec-abc.db                    # Execution Session DB
    │   │   └── 002-exec-def.db                    # Execution Session DB
    │   │
    │   └── checkpoints/
    │       ├── 001-checkpoint-abc.db              # RES Checkpoint DB
    │       └── 002-checkpoint-def.db              # RES Checkpoint DB
    │
    └── pipeline-002/
        └── ...
```

---

## 1. Root Database: `data/nexusflow.db`

The **Setting DB** contains global configuration and registry of all pipelines.

### Schema (PascalCase)

```sql
-- ============================================
-- Table: Settings (global configuration)
-- ============================================
CREATE TABLE Settings (
    Key TEXT PRIMARY KEY,
    Value TEXT NOT NULL,
    ValueType TEXT DEFAULT 'string',               -- value_type.Variant (see 10-enum-architecture.md §18)
    Source TEXT DEFAULT 'seed',                    -- config source
    Description TEXT,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Default settings (from config.seed.json)
INSERT INTO Settings (Key, Value, ValueType, Source, Description) VALUES
('Execution.Timeout', '30m', 'string', 'seed', 'Default execution timeout'),
('Execution.MaxConcurrent', '5', 'int', 'seed', 'Max concurrent executions'),
('Checkpoint.Enabled', 'true', 'bool', 'seed', 'Enable RES checkpoints'),
('Checkpoint.Interval', '30s', 'string', 'seed', 'Checkpoint interval'),
('Reset.ConfirmationTtlMinutes', '5', 'int', 'seed', 'Reset confirmation window');


-- ============================================
-- Table: Pipelines (pipeline registry)
-- ============================================
CREATE TABLE Pipelines (
    Id TEXT PRIMARY KEY,
    Name TEXT NOT NULL,
    Description TEXT,
    Version TEXT DEFAULT '1.0.0',
    BlockCount INTEGER DEFAULT 0,
    FolderPath TEXT NOT NULL,                      -- workflows/pipeline-001/
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    Status TEXT DEFAULT 'active'                   -- pipeline_status.Variant (see 10-enum-architecture.md §19)
);

CREATE INDEX IdxPipelinesName ON Pipelines(Name);
CREATE INDEX IdxPipelinesStatus ON Pipelines(Status);


-- ============================================
-- Table: Counters (sequence counters)
-- ============================================
CREATE TABLE Counters (
    Id TEXT PRIMARY KEY,
    PipelineId TEXT,
    Category TEXT NOT NULL,                        -- db_category.Variant (see 10-enum-architecture.md §22)
    CurrentCount INTEGER DEFAULT 0,
    UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(PipelineId, Category)
);


-- ============================================
-- Table: DbRegistry (all child databases)
-- ============================================
CREATE TABLE DbRegistry (
    Id TEXT PRIMARY KEY,
    PipelineId TEXT NOT NULL,
    Category TEXT NOT NULL,                        -- db_category.Variant (see 10-enum-architecture.md §22)
    EntityId TEXT NOT NULL,
    SequenceNum INTEGER NOT NULL,
    Path TEXT NOT NULL,
    SizeBytes INTEGER DEFAULT 0,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    Status TEXT DEFAULT 'active',                  -- pipeline_status.Variant
    FOREIGN KEY (PipelineId) REFERENCES Pipelines(Id),
    UNIQUE(PipelineId, Category, EntityId)
);

CREATE INDEX IdxRegistryPath ON DbRegistry(Path);
CREATE INDEX IdxRegistryPipeline ON DbRegistry(PipelineId);


-- ============================================
-- Table: ResetRequests (2-step confirmation)
-- ============================================
CREATE TABLE ResetRequests (
    Id TEXT PRIMARY KEY,
    Scope TEXT NOT NULL,                           -- reset_scope.Variant (see 10-enum-architecture.md §20)
    RequestedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    ExpiresAt DATETIME NOT NULL,                   -- +5 minutes
    ConfirmedAt DATETIME,
    Status TEXT DEFAULT 'pending'                  -- reset_status.Variant (see 10-enum-architecture.md §21)
);

CREATE INDEX IdxResetStatus ON ResetRequests(Status, ExpiresAt);
```

---

## 2. Pipeline Meta Database: `data/workflows/{pipeline}/meta.db`

Each pipeline has a **Meta DB** containing its definition.

### Schema (PascalCase)

```sql
-- ============================================
-- Table: PipelineMeta (pipeline definition - singleton)
-- ============================================
CREATE TABLE PipelineMeta (
    Id TEXT PRIMARY KEY DEFAULT 'singleton',
    PipelineId TEXT UNIQUE NOT NULL,
    Name TEXT NOT NULL,
    Description TEXT,
    Version TEXT DEFAULT '1.0.0',
    Definition TEXT NOT NULL,                      -- JSON: full pipeline definition
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);


-- ============================================
-- Table: Blocks (pipeline blocks/stages)
-- ============================================
CREATE TABLE Blocks (
    Id TEXT PRIMARY KEY,
    BlockType TEXT NOT NULL,                       -- block_type.Variant (see 10-enum-architecture.md §1)
    Name TEXT NOT NULL,
    Position INTEGER NOT NULL,                     -- Order in pipeline
    Config TEXT NOT NULL,                          -- JSON: block configuration
    Inputs TEXT,                                   -- JSON: input mappings
    Outputs TEXT,                                  -- JSON: output mappings
    Dependencies TEXT,                             -- JSON: block IDs this depends on
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IdxBlocksType ON Blocks(BlockType);
CREATE INDEX IdxBlocksPosition ON Blocks(Position);


-- ============================================
-- Table: Edges (block connections)
-- ============================================
CREATE TABLE Edges (
    Id TEXT PRIMARY KEY,
    SourceBlockId TEXT NOT NULL,
    TargetBlockId TEXT NOT NULL,
    Condition TEXT,                                -- JSON: conditional expression
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (SourceBlockId) REFERENCES Blocks(Id),
    FOREIGN KEY (TargetBlockId) REFERENCES Blocks(Id)
);

CREATE INDEX IdxEdgesSource ON Edges(SourceBlockId);
CREATE INDEX IdxEdgesTarget ON Edges(TargetBlockId);
```

---

## 3. Execution Session Database: `data/workflows/{pipeline}/executions/{seq}-{id}.db`

Each execution has its **own Session DB**.

### Schema (PascalCase)

```sql
-- ============================================
-- Table: ExecutionMeta (execution metadata - singleton)
-- ============================================
CREATE TABLE ExecutionMeta (
    Id TEXT PRIMARY KEY DEFAULT 'singleton',
    ExecutionId TEXT UNIQUE NOT NULL,
    PipelineId TEXT NOT NULL,
    PipelineVersion TEXT,
    
    -- Input/Output
    Input TEXT,                                    -- JSON: execution input
    Output TEXT,                                   -- JSON: final output
    
    -- Timing
    StartedAt DATETIME,
    CompletedAt DATETIME,
    DurationMs INTEGER,
    
    -- Status
    Status TEXT NOT NULL DEFAULT 'pending',        -- execution_status.Variant (see 10-enum-architecture.md §3)
    ErrorMessage TEXT
);


-- ============================================
-- Table: BlockExecutions (individual block runs)
-- ============================================
CREATE TABLE BlockExecutions (
    Id TEXT PRIMARY KEY,
    BlockId TEXT NOT NULL,
    BlockType TEXT NOT NULL,
    BlockName TEXT,
    
    -- Execution details
    Input TEXT,                                    -- JSON: block input
    Output TEXT,                                   -- JSON: block output
    
    -- Timing
    StartedAt DATETIME,
    CompletedAt DATETIME,
    DurationMs INTEGER,
    
    -- Status
    Status TEXT NOT NULL DEFAULT 'pending',        -- block_status.Variant (see 10-enum-architecture.md §4)
    ErrorMessage TEXT,
    RetryCount INTEGER DEFAULT 0
);

CREATE INDEX IdxBlockExecBlock ON BlockExecutions(BlockId);
CREATE INDEX IdxBlockExecStatus ON BlockExecutions(Status);


-- ============================================
-- Table: ExecutionLogs (detailed execution logs)
-- ============================================
CREATE TABLE ExecutionLogs (
    Id TEXT PRIMARY KEY,
    BlockId TEXT,
    Level TEXT NOT NULL,                           -- log_level.Variant (see 10-enum-architecture.md §5)
    Message TEXT NOT NULL,
    Details TEXT,                                  -- JSON: additional context
    Timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IdxLogsBlock ON ExecutionLogs(BlockId);
CREATE INDEX IdxLogsLevel ON ExecutionLogs(Level);
CREATE INDEX IdxLogsTime ON ExecutionLogs(Timestamp);
```

---

## 4. Checkpoint Database: `data/workflows/{pipeline}/checkpoints/{seq}-{id}.db`

RES checkpoints for fault tolerance.

### Schema (PascalCase)

```sql
-- ============================================
-- Table: CheckpointMeta (checkpoint metadata - singleton)
-- ============================================
CREATE TABLE CheckpointMeta (
    Id TEXT PRIMARY KEY DEFAULT 'singleton',
    CheckpointId TEXT UNIQUE NOT NULL,
    ExecutionId TEXT NOT NULL,
    PipelineId TEXT NOT NULL,
    
    -- State
    CurrentBlockId TEXT,
    CompletedBlocks TEXT,                          -- JSON: array of completed block IDs
    PendingBlocks TEXT,                            -- JSON: array of pending block IDs
    
    -- Context
    ExecutionContext TEXT,                         -- JSON: full context snapshot
    
    -- Timing
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    ExpiresAt DATETIME,
    
    -- Recovery
    CanRecover BOOLEAN DEFAULT TRUE,
    RecoveryAttempts INTEGER DEFAULT 0
);


-- ============================================
-- Table: BlockStates (individual block states)
-- ============================================
CREATE TABLE BlockStates (
    Id TEXT PRIMARY KEY,
    BlockId TEXT NOT NULL,
    State TEXT NOT NULL,                           -- JSON: block state snapshot
    Output TEXT,                                   -- JSON: block output if completed
    Timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IdxBlockStatesBlock ON BlockStates(BlockId);
```

---

## 5. Reset API (2-Step Confirmation)

### Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         2-STEP RESET CONFIRMATION                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   STEP 1: Request Reset                                                      │
│   POST /api/v1/reset/request                                                │
│   Body: { "Scope": "executions" }                                           │
│                                                                              │
│   Response:                                                                  │
│   {                                                                          │
│     "ResetId": "rst_abc123",                                                │
│     "Scope": "executions",                                                   │
│     "ExpiresAt": "2026-02-02T10:35:00Z",                                    │
│     "AffectedPipelines": 5,                                                 │
│     "AffectedExecutions": 127,                                              │
│     "Message": "Confirm within 5 minutes"                                   │
│   }                                                                          │
│                                                                              │
│   STEP 2: Confirm Reset                                                      │
│   POST /api/v1/reset/confirm                                                │
│   Body: { "ResetId": "rst_abc123" }                                         │
│                                                                              │
│   Response:                                                                  │
│   {                                                                          │
│     "Status": "completed",                                                   │
│     "DeletedDatabases": 127,                                                │
│     "FreedBytes": 536870912                                                 │
│   }                                                                          │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Reset Scopes

| Scope | Description | Databases Affected |
|-------|-------------|--------------------|
| `all` | Full system reset | All in `data/` |
| `executions` | All execution history | `*/executions/*.db` + `*/checkpoints/*.db` |
| `pipeline:{id}` | Specific pipeline | All under `workflows/{id}/` |
| `checkpoints` | Checkpoints only | `*/checkpoints/*.db` |

### API Endpoints

```
POST /api/v1/reset/request
  Body: { "Scope": "executions" | "pipeline:{id}" | "checkpoints" | "all" }
  Returns: { "ResetId", "Scope", "ExpiresAt", "AffectedPipelines", "AffectedExecutions" }

POST /api/v1/reset/confirm
  Body: { "ResetId": "rst_abc123" }
  Returns: { "Status", "DeletedDatabases", "FreedBytes" }

POST /api/v1/reset/cancel
  Body: { "ResetId": "rst_abc123" }
  Returns: { "Status": "cancelled" }
```

---

## 6. Import/Export API

### Export (SQLite Bundle)

```
POST /api/v1/export
  Body: { 
    "Type": "pipeline" | "executions" | "all",
    "PipelineId": "pipeline-001"  // optional
  }
  Returns: Binary .db file download
```

### Import

```
POST /api/v1/import
  Body: multipart/form-data with .db file
  Returns: { 
    "Imported": true, 
    "PipelineCount": 3, 
    "ExecutionCount": 45 
  }
```

---

## API to DB Mapping

| Endpoint | Action | Target DB |
|----------|--------|-----------|
| `POST /api/v1/pipelines` | Create pipeline | Creates folder + `meta.db` |
| `GET /api/v1/pipelines` | List pipelines | Reads `nexusflow.db` → Pipelines |
| `POST /api/v1/pipelines/:id/run` | Execute pipeline | Creates `executions/{seq}-{id}.db` |
| `GET /api/v1/executions/:id` | Get execution | Reads execution session DB |
| `GET /api/v1/executions/:id/logs` | Get logs | Reads ExecutionLogs table |
| `POST /api/v1/executions/:id/checkpoint` | Create checkpoint | Creates checkpoint DB |

---

## Cross-References

| Reference | Location |
|-----------|----------|
| Split DB Architecture | `spec/06-split-db-architecture/00-overview.md` |
| CLI Examples | `spec/06-split-db-architecture/01-cli-examples.md` |
| Naming Conventions | `.lovable/memories/training/09-database-naming-conventions.md` |
| Core Specification | `./01-core-specification.md` |
